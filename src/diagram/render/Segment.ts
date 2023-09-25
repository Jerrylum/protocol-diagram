import { Field } from "../Field";
import { Element, MatrixLike, VisibleSetting, hasVisibleSetting } from "./Element";

export abstract class Segment extends Element {
  public displayName: boolean = false;

  constructor(readonly represent: Field | null, readonly startIndex: number, readonly length: number) {
    super();
  }

  get endIndex(): number {
    return this.startIndex + this.length;
  }
}

export class DividerSegment extends Segment implements VisibleSetting {
  _isVisible: boolean = true;

  constructor(represent: Field | null, startIndex: number, endIndex: number) {
    super(represent, startIndex, endIndex);
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  process(m: MatrixLike, x: number, y: number): void {
    const up = m.get(x, y - 1);
    const down = m.get(x, y + 1);
    const isUp = up !== null && !(up instanceof RowTail);
    const isDown = down !== null && !(down instanceof RowTail);
    this._isVisible = (isUp || isDown) && this.represent === null;
  }

  toString() {
    if (this.represent)
      return `DividerSegment [name=${this.represent.name}, start=${this.startIndex}, end=${this.endIndex}, display=${this.displayName}]`;
    else return `DividerSegment [start=${this.startIndex}, end=${this.endIndex}, display=${this.displayName}]`;
  }
}

export class RowSegment extends Segment {
  constructor(readonly represent: Field, startIndex: number, length: number) {
    super(represent, startIndex, length);
  }

  process(m: MatrixLike, x: number, y: number): void {
    // noop
  }

  toString() {
    return `RowSegment [name=${this.represent.name}, start=${this.startIndex}, end=${this.endIndex}, display=${this.displayName}]`;
  }
}

export class RowTail extends RowSegment implements VisibleSetting {
  constructor(start: number, length: number, readonly isVisible: boolean) {
    super(new Field("", length), start, length);
  }
}

export class NextLine extends Element {
  process(m: MatrixLike, x: number, y: number): void {
    // noop
  }
}

export class Connector extends Element {
  static readonly TOP = 0b1000; // 8
  static readonly RIGHT = 0b0100; // 4
  static readonly BOTTOM = 0b0010; // 2
  static readonly LEFT = 0b0001; // 1

  value: number = 0;
  private individual: boolean = false;

  constructor() {
    super();
  }

  get isIndividual(): boolean {
    return this.individual;
  }

  private isConnected(e: Element | null): boolean {
    if (e === null) return false;
    else if (e instanceof Connector) return !e.isIndividual;
    else if (hasVisibleSetting(e)) return e.isVisible;
    else return false;
  }

  process(m: MatrixLike, x: number, y: number): void {
    this.value = 0;
    this.value |= this.isConnected(m.get(x, y - 1)) ? Connector.TOP : 0;
    this.value |= this.isConnected(m.get(x + 1, y)) ? Connector.RIGHT : 0;
    this.value |= this.isConnected(m.get(x, y + 1)) ? Connector.BOTTOM : 0;
    this.value |= this.isConnected(m.get(x - 1, y)) ? Connector.LEFT : 0;

    // Special case

    // if a row tail is on the left hand side, then the connector should be
    // individual
    const t = m.get(x - 1, y);
    if (t instanceof RowTail) {
      this.individual = true;
      if (!t.isVisible) this.value = 0;
    }
  }
}
