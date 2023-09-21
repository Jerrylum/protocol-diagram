import { Config } from "dompurify";
import { Field } from "./Field";
import { Configuration } from "../config/Configuration";
import { BooleanOption, EnumOption, RangeOption } from "../config/Option";

interface MementoFieldPair {
  readonly name: string;
  readonly length: number;
}

/**
 * a subclass that used to record the state of the diagram, will be helpful
 * for restoring diagram via store a list of this object
 */
class Memento {
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

  public constructor() {
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
