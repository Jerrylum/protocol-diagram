import { Element } from "./render/Element";
import { Field } from "./Field";
import { Configuration } from "../config/Configuration";
import { BooleanOption, EnumOption, RangeOption } from "../config/Option";
import { Divider, Row } from "./render/SegmentGroup";
import { hasVisibleSetting } from "./render/Element";
import { RowSegment, Segment } from "./render/Segment";
import { Matrix } from "./render/Matrix";
import { AsciiStyle, AsciiVerboseStyle, UTF8CornerStyle, UTF8HeaderStyle, UTF8Style } from "./render/Style";
import { action, makeObservable, observable } from "mobx";
import { IsArray, IsObject, ValidateNested } from "class-validator";
import { Exclude, Expose, Type } from "class-transformer";

/**
 * Distinguish whether the command will manipulate the diagram instance
 */
export interface DiagramModifier {
  readonly discriminator: "DiagramModifier";
}

export function isDiagramModifier(o: unknown): o is DiagramModifier {
  return typeof o === "object" && o !== null && "discriminator" in o && o.discriminator === "DiagramModifier";
}

/**
 * Distinguish whether the descendant command is allowed to be undo/redo
 */
export interface Cancellable extends DiagramModifier {
  /**
   * Invoking cancellable command
   */
  execute(): void;
}

export interface MementoFieldPair {
  readonly name: string;
  readonly length: number;
}

/**
 * Record the state of the diagram, will be helpful for restoring diagram
 * via storing a list of this object
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
 * Holds the information of what requires to render a diagram on screen,
 * such as the list of fields and the configuration of setting
 */
export class Diagram {
  /**
   * the list of fields that the diagram holds
   */
  @IsArray()
  @ValidateNested()
  @Type(() => Field)
  @Expose()
  private _fields: Field[] = [];
  /**
   * the configuration of the diagram
   */
  @IsObject()
  @ValidateNested()
  @Type(() => Configuration)
  @Expose()
  readonly config: Configuration;

  /**
   * Cache render matrix of the diagram
   */
  @Exclude()
  private _header: string;

  /**
   * Cache render matrix of the diagram
   */
  @Exclude()
  private _matrix: Matrix;

  constructor() {
    makeObservable<Diagram, "_fields">(this, {
      _fields: observable,
      config: observable,
      // _header is not observable
      // _matrix is not observable
      clear: action,
      addField: action,
      insertField: action,
      removeField: action,
      moveField: action,
      restoreFromMemento: action
    });
    this.config = new Configuration(
      new RangeOption("bit", 32, 1, 128),
      new EnumOption("diagram-style", "utf8", DIAGRAM_STYLES),
      new EnumOption("header-style", "trim", HEADER_STYLES),
      new BooleanOption("left-space-placeholder", false)
    );
    this._header = "";
    this._matrix = new Matrix([]);
  }

  /**
   * Returns a read-only clone of the list of fields of the diagram
   *
   * @return Collection
   */
  get fields(): ReadonlyArray<Field> {
    return this._fields;
  }

  get header(): string {
    return this._header;
  }

  /**
   * Returns the cache render matrix of the diagram
   */
  get renderMatrix(): Matrix {
    return this._matrix;
  }

  /**
   * Returns the field by specified index
   *
   * @param index the index of the field
   * @return Field
   */
  getField(index: number): Field {
    return this.fields[index];
  }

  /**
   * Clears all of the fields of the diagram
   */
  clear() {
    this._fields.splice(0, this._fields.length);
  }

  /**
   * Returns the amount of fields of the diagram
   *
   * @return int
   */
  size(): number {
    return this._fields.length;
  }

  /**
   * Appends the field to the diagram
   *
   * @param field the field to be appended
   */
  addField(field: Field) {
    this._fields.push(field);
  }

  /**
   * Inserts the field into specified location to the diagram
   *
   * @param index the location to insert
   * @param field the field to be inserted
   */
  insertField(index: number, field: Field) {
    this._fields.splice(index, 0, field);
  }

  /**
   * Removes the field via given index
   *
   * @param index the index of the field to be removed
   */
  removeField(index: number) {
    this._fields.splice(index, 1);
  }

  /**
   * Moves the field from one position to another by index
   *
   * @param from the index of the field to be moved
   * @param to   the index of the field to be moved to
   */
  moveField(from: number, to: number) {
    const field: Field = this._fields.splice(from, 1)[0];
    this.insertField(to, field);
  }

  /**
   * Creates the `Memento` typed instance
   *
   * @return Memento
   */
  createMemento(): Memento {
    return new Memento(this);
  }

  /**
   * Restores the diagram to the state memento recorded
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
    const style = this.config.getValue("diagram-style") as DiagramStyle;
    const headerStyle = this.config.getValue("header-style") as HeaderStyle;
    const leftSpacePlaceholder = this.config.getValue("left-space-placeholder") as boolean;

    const rows = convertFieldsToRow(bit, this.fields, leftSpacePlaceholder);
    const dividers = spliceDividers(bit, rows);
    const segments = mergeRowsAndDividers(rows, dividers);
    this.fields.forEach(f => displayNameAtTheCentralSegment(f, segments));

    this._matrix = new Matrix(segments);
    this._matrix.process();
    this._matrix.process(); // Process twice to make sure all the connector are processed

    const elements = this._matrix.elements;

    this._header = generateHeader(elements, bit, headerStyle);

    /**
     * Replaces the object element with the characters defined in style configrations
     * such as connectors, vertical borders, and the next lines into the diagram
     */
    return (
      this._header +
      new {
        utf8: UTF8Style,
        "utf8-header": UTF8HeaderStyle,
        "utf8-corner": UTF8CornerStyle,
        ascii: AsciiStyle,
        "ascii-verbose": AsciiVerboseStyle
      }[style](elements).output()
    );
  }

  toSvgString() {
    const lines = this.toString().split("\n");

    const svgLines = lines.reduce((acc, line) => acc + `<tspan x="0" dy="1em">${line}</tspan>\n`, "");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this._matrix.width * 9.75}" height="${lines.length * 16}">
<text x="0" y="0" style="white-space:pre;font-size:16px;font-family:Menlo,consolas,'Courier New',monospace">
${svgLines}</text>
</svg>`;
  }
}

/**
 * Converts Field objects into rows
 * If the rows exceed the maximum length, then split the crossed-over fields into multiple rows
 * If the last row is not filled, then use an optional tail to fill it
 */
export function convertFieldsToRow(bit: number, fields: readonly Field[], hasTail: boolean): Row[] {
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

/* *
 * Generates dividers based on the segments in the rows
 */
export function spliceDividers(bit: number, rows: Row[]): Divider[] {
  let index = 0;
  let topSegmentIndex = 0;
  let bottomSegmentIndex = 0;

  rows = rows.slice();

  /**
   * ALGO: Inserts two additional rows at the beginning and end respectively
   * to guarantee that all contentful has top adjacent row and bottom adjacent row
   * Uses two pointers to determine the length of a divider segment
   * */
  rows.splice(0, 0, new Row(bit).addField(new Field("", bit)));
  rows.push(new Row(bit).addField(new Field("", bit)));

  /**
   * Returns the top segment
   */
  function getTopSegment(): RowSegment {
    return getTopRow()?.get(topSegmentIndex)!;
  }

  /**
   * Returns the bottom segment
   */
  function getBottomSegment(): RowSegment {
    return getBottomRow()?.get(bottomSegmentIndex)!;
  }

  /**
   * Returns the top row
   */
  function getTopRow(): Row {
    return rows[index];
  }

  /**
   * Returns the bottom row
   */
  function getBottomRow(): Row {
    return rows[index + 1];
  }

  /**
   * Checks whether there are segments left in the top row
   */
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

/**
 * Combines the segments from the rows and dividers into a single array
 */
export function mergeRowsAndDividers(rows: Row[], dividers: Divider[]) {
  const segments: Segment[] = [];

  for (let i = 0; i < rows.length; i++) {
    segments.push(...dividers[i].segments);
    segments.push(...rows[i].segments);
  }

  segments.push(...dividers[dividers.length - 1].segments);

  return segments;
}

/**
 * Identifies the segments that represent a specific field with the greatest length
 * Sets display name of the center item of the greatest represented segments to true
 */
export function displayNameAtTheCentralSegment(field: Field, segments: Segment[]): void {
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

/**
 * Generates a header string on the top of the diagram, which includes numbers representing the indices,
 * with the style determined by the headerStyle
 */
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

