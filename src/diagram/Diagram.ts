import { Field } from "./Field";
import { Configuration } from "../config/Configuration";
import { BooleanOption, EnumOption, RangeOption } from "../config/Option";
import { Cancellable } from "../command/Commands";

export interface MementoFieldPair {
  readonly name: string;
  readonly length: number;
}

/**
 * a class that used to record the state of the diagram, will be helpful
 * for restoring diagram via store a list of this object
 */
export class Memento {
  readonly fields: ReadonlyArray<MementoFieldPair>;

  constructor(d: Diagram) {
    this.fields = d.fields.map(f => ({ name: f.name, length: f.length }));
  }
}

/**
 * this class holds the information of what requires to render a diagram on
 * screen, such as the list of fields and the configuration of setting.
 */
export class Diagram {
  /**
   * the list of fields that the diagram holds
   */
  private _fields: Field[] = [];
  /**
   * the configuration of the diagram
   */
  readonly config: Configuration;

  constructor() {
    this.config = new Configuration(
      new RangeOption("bit", 32, 1, 128),
      new EnumOption("diagram-style", "utf8", ["utf8", "utf8-header", "utf8-corner", "ascii", "ascii-verbose"]),
      new EnumOption("header-style", "trim", ["none", "trim", "full"]),
      new BooleanOption("left-space-placeholder", false)
    );
  }

  /**
   * a getter method that returns a readonly clone of the list of fields of the
   * diagram
   *
   * @return Collection
   */
  get fields(): ReadonlyArray<Field> {
    return this._fields;
  }

  /**
   * a getter method that returns the field by specified index
   *
   * @param index the index of the field
   * @return Field
   */
  getField(index: number): Field {
    return this.fields[index];
  }

  /**
   * a method that clears all of the fields of the diagram
   */
  clear() {
    this._fields.splice(0, this._fields.length);
  }

  /**
   * a getter method that returns the amount of fields of the diagram
   *
   * @return int
   */
  size(): number {
    return this._fields.length;
  }

  /**
   * a method that appends the field to the diagram
   *
   * @param field the field to be appended
   */
  addField(field: Field) {
    this._fields.push(field);
  }

  /**
   * a method that inserts the field into specified location to the diagram
   *
   * @param index the location to insert
   * @param field the field to be inserted
   */
  insertField(index: number, field: Field) {
    this._fields.splice(index, 0, field);
  }

  /**
   * a method that removes the field via given index
   *
   * @param index the index of the field to be removed
   */
  removeField(index: number) {
    this._fields.splice(index, 1);
  }

  /**
   * a method that moves the field from the `from` index to the `to` index
   *
   * @param from the index of the field to be moved
   * @param to   the index of the field to be moved to
   */
  moveField(from: number, to: number) {
    const field: Field = this._fields.splice(from, 1)[0];
    this.insertField(to, field);
  }

  /**
   * a factory pattern that creates the `Memento` typed instance
   *
   * @return Memento
   */
  createMemento(): Memento {
    return new Memento(this);
  }

  /**
   * a method that restores the diagram to the memento recorded state
   *
   * @param m the memento to be restored
   */
  restoreFromMemento(m: Memento) {
    this.clear();
    // for (Pair<String, Integer> p : m.fields) {
    //     fields.add(new Field(p));
    // }
    this._fields = m.fields.map(p => new Field(p.name, p.length));
  }
}

export class Snapshot<T extends Cancellable> {
  constructor(readonly origin: Memento, readonly modifier: T) {}
}

export class Timeline<T extends Cancellable> {
  private diagram!: Diagram | null;
  private latest!: Memento;
  private undoStack: Snapshot<T>[] = [];
  private redoStack: T[] = [];

  constructor(diagram: Diagram | null) {
    this.diagram = diagram;
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
