import { Element } from "./render/Element";
import { Field } from "./Field";
import { Configuration } from "../config/Configuration";
import { BooleanOption, EnumOption, RangeOption } from "../config/Option";
import { Divider, Row } from "./render/SegmentGroup";
import { hasVisibleSetting } from "./render/Element";
import { RowSegment, Segment } from "./render/Segment";

/**
 * this interface is used to distinguish whether the command will manipulate the diagram instance
 */
export interface DiagramModifier {
  readonly discriminator: "DiagramModifier";
}

/**
 * this interface is used to distinguish whether the descendant command is allowed to be undo/redo
 */
export interface Cancellable extends DiagramModifier {
  /**
   * the method for invoking cancellable command
   */
  execute(): void;
}

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

export const DIAGRAM_STYLES = ["utf8", "utf8-header", "utf8-corner", "ascii", "ascii-verbose"] as const;
export type DiagramStyle = (typeof DIAGRAM_STYLES)[number];
export const HEADER_STYLES = ["none", "trim", "full"] as const;
export type HeaderStyle = (typeof HEADER_STYLES)[number];

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
      new EnumOption("diagram-style", "utf8", DIAGRAM_STYLES),
      new EnumOption("header-style", "trim", HEADER_STYLES),
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

  toString() {
    const bit = this.config.getValue("bit") as number;
    const style = this.config.getValue("diagram-style") as string;
    const headerStyle = this.config.getValue("header-style") as string;
    const leftSpacePlaceholder = this.config.getValue("left-space-placeholder") as boolean;
  }
}

export function convertFieldsToRow(bit: number, fields: Field[], hasTail: boolean): Row[] {
  const rows: Row[] = [];

  let currentRow = new Row(bit);
  for (const original of fields) {
    const field = original.clone();
    while (field.length !== 0) {
      currentRow.addField(field);
      if (currentRow.used === bit) {
        rows.push(currentRow);
        currentRow = new Row(bit);
      }
    }
  }

  if (currentRow.used !== 0) {
    currentRow.addTail(hasTail);
    rows.push(currentRow);
  }

  return rows;
}

export function spliceDividers(bit: number, rows: Row[]): Divider[] {
  let index = 0;
  let topSegmentIndex = 0;
  let bottomSegmentIndex = 0;

  rows = rows.slice();

  // ALGO: Create two rows, one for the top and one for the bottom
  rows.splice(0, 0, new Row(bit).addField(new Field("", bit)));
  rows.push(new Row(bit).addField(new Field("", bit)));

  function getTopSegment(): RowSegment {
    return getTopRow()?.get(topSegmentIndex)!;
  }

  function getBottomSegment(): RowSegment {
    return getBottomRow()?.get(bottomSegmentIndex)!;
  }

  function getTopRow(): Row {
    return rows[index];
  }

  function getBottomRow(): Row {
    return rows[index + 1];
  }

  function topRowHasNext(): boolean {
    return topSegmentIndex < getTopRow()!.count;
  }

  const dividers: Divider[] = [];

  for (; index < rows.length - 1; index++) {
    topSegmentIndex = 0;
    bottomSegmentIndex = 0;

    const divider = new Divider(bit);

    while (topRowHasNext() /* && bottomRowHasNext()) */) {
      if (getTopSegment().endIndex < getBottomSegment().endIndex) {
        divider.addSplice(getTopSegment(), getBottomSegment());
        topSegmentIndex++;
      } else if (getTopSegment()?.endIndex === getBottomSegment()?.endIndex) {
        divider.addSplice(getTopSegment(), getBottomSegment());
        topSegmentIndex++;
        bottomSegmentIndex++;
      } else {
        divider.addSplice(getBottomSegment(), getTopSegment());
        bottomSegmentIndex++;
      }
    }
    dividers.push(divider);
  }

  return dividers;
}

export function mergeRowsAndDividers(rows: Row[], dividers: Divider[]) {
  const segments: Segment[] = [];

  for (let i = 0; i < rows.length; i++) {
    segments.push(...dividers[i].segments);
    segments.push(...rows[i].segments);
  }

  segments.push(...dividers[dividers.length - 1].segments);

  return segments;
}

export function displayNameAtTheCentralSegment(field: Field, segments: Segment[]): void {
  // ALGO: Set display name of the center item Of the greatest represented segments to true

  let greatestLength: number = 0;
  let greatestSegments: Segment[] = [];

  for (const s of segments) {
    if (field.equals(s.represent)) {
      if (greatestLength < s.length) {
        greatestLength = s.length;
        greatestSegments = [];
      }
      if (greatestLength === s.length) {
        greatestSegments.push(s);
      }
    }
  }
  greatestSegments[Math.floor(greatestSegments.length / 2) - ((greatestSegments.length + 1) % 2)].displayName = true;
}

export function generateHeader(elements: Element[], bit: number, headerStyle: HeaderStyle): string {
  let rtn = "";
  let maximumEndIndex = headerStyle === "full" ? bit : 0; // visible item only

  for (const e of elements) {
    if (hasVisibleSetting(e) && e instanceof Segment && e.isVisible) {
      maximumEndIndex = Math.max(maximumEndIndex, e.endIndex);
    }
  }

  if (maximumEndIndex === 0 || headerStyle === "none") return "";

  for (let i = 0; i < maximumEndIndex; i++) rtn += " " + (i % 10 === 0 ? i / 10 : " ");

  rtn += "\n";

  for (let i = 0; i < maximumEndIndex; i++) rtn += " " + (i % 10);

  rtn += "\n";

  return rtn;
}
