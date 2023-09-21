import { Cancellable } from "../diagram/Diagram";
import { Diagram, Memento } from "./Diagram";

export class Snapshot<T extends Cancellable> {
  constructor(readonly origin: Memento, readonly modifier: T) {}
}

export class Timeline<T extends Cancellable> {
  private latest!: Memento;
  private undoStack: Snapshot<T>[] = [];
  private redoStack: T[] = [];

  constructor(private diagram: Diagram) {
    this.resetHistory();
  }

  /**
   * a getter method that returns the diagram it stored
   *
   * @return Diagram
   */
  getDiagram(): Diagram | null {
    return this.diagram;
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
    if (this.diagram) this.latest = this.diagram.createMemento();
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
    if (this.diagram) this.latest = this.diagram.createMemento();
  }

  /**
   * a method that pops the top of the undo stack, pushes that popped history into
   * the redo stack, and restores the diagram based on the popped snapshot.
   *
   * @return T
   */
  undo(): T | null {
    if (this.undoStack.length === 0) return null;
    const snapshot: Snapshot<T> | undefined = this.undoStack.pop();
    if (!snapshot) return null;
    this.redoStack.push(snapshot.modifier);
    if (this.diagram) this.diagram.restoreFromMemento((this.latest = snapshot.origin));

    return snapshot.modifier;
  }

  /**
   * a method that pops the top of the redo stack, pushes that popped history into
   * the undo stack, and executes the popped command from the redo stack.
   *
   * @return T
   */
  redo(): T | null {
    if (this.redoStack.length === 0) return null;

    const modifier: T | undefined = this.redoStack.pop();
    if (!modifier) return null;
    modifier.execute();
    this.undoStack.push(new Snapshot<T>(this.latest, modifier));
    if (this.diagram) this.latest = this.diagram.createMemento();

    return modifier;
  }
}
