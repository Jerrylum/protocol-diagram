import { Field } from "../Field";
import { Element, VisibleSetting } from "./Elements";
import { Matrix } from "./Matrix";

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

  process(m: Matrix, x: number, y: number): void {
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
  constructor(represent: Field, startIndex: number, length: number) {
    super(represent, startIndex, length);
  }

  process(m: Matrix, x: number, y: number): void {
    // noop
  }

  toString() {
    if (this.represent)
      return `RowSegment [name=${this.represent.name}, start=${this.startIndex}, end=${this.endIndex}, display=${this.displayName}]`;
    else return `RowSegment [start=${this.startIndex}, end=${this.endIndex}, display=${this.displayName}]`;
  }
}

export class RowTail extends RowSegment implements VisibleSetting {
  constructor(start: number, length: number, readonly isVisible: boolean) {
    super(new Field("", length), start, length);
  }
}
