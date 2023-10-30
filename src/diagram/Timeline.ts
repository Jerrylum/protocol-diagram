import { action, computed, makeObservable, observable } from "mobx";
import { Cancellable } from "../diagram/Diagram";
import { Diagram, Memento } from "./Diagram";

export class Snapshot<T extends Cancellable> {
  constructor(readonly origin: Memento, readonly modifier: T) {}
}

export class Timeline<T extends Cancellable> {
  protected latest!: Memento;
  private undoStack: Snapshot<T>[] = [];
  private redoStack: T[] = [];

  constructor(protected _diagram: Diagram) {
    this.resetHistory();

    makeObservable<Timeline<T>, "latest" | "undoStack" | "redoStack" | "_diagram">(this, {
      latest: observable,
      undoStack: observable,
      redoStack: observable,
      _diagram: observable,
      diagram: computed,
      getLatestMemento: action,
      resetHistory: action,
      operate: action,
      undo: action,
      redo: action,
    });
  }

  /**
   * a getter method that returns the diagram it stored
   *
   * @return Diagram
   */
  get diagram(): Diagram {
    return this._diagram;
  }

  /**
   * a getter method that returns the latest memento
   *
   * @return Diagram.Memento
   */
  getLatestMemento(): Memento {
    return this.latest;
  }

  /**
   * a method that eliminates all undo history and redo history, and generates a
   * new memento
   */
  resetHistory() {
    this.undoStack.splice(0, this.undoStack.length);
    this.redoStack.splice(0, this.redoStack.length);
    this.latest = this.diagram.createMemento();
  }

  /**
   * a method that pushes a modifier into the undo history, and resets the stack
   * of redo.
   *
   * @param modifier the modifier that is going to be pushed into the undo history
   */
  operate(modifier: T) {
    this.undoStack.push(new Snapshot<T>(this.latest, modifier));
    this.redoStack.splice(0, this.redoStack.length);
    this.latest = this.diagram.createMemento();
  }

  /**
   * a method that pops the top of the undo stack, pushes that popped history into
   * the redo stack, and restores the diagram based on the popped snapshot.
   *
   * @return T
   */
  undo(): T | null {
    const snapshot: Snapshot<T> | undefined = this.undoStack.pop();
    if (!snapshot) return null;
    this.redoStack.push(snapshot.modifier);
    this.diagram.restoreFromMemento((this.latest = snapshot.origin));

    return snapshot.modifier;
  }

  /**
   * a method that pops the top of the redo stack, pushes that popped history into
   * the undo stack, and executes the popped command from the redo stack.
   *
   * @return T
   */
  redo(): T | null {
    const modifier: T | undefined = this.redoStack.pop();
    if (!modifier) return null;
    modifier.execute();
    this.undoStack.push(new Snapshot<T>(this.latest, modifier));
    this.latest = this.diagram.createMemento();

    return modifier;
  }
}

