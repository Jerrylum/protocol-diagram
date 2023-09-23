import { Field } from "../Field";
import { DividerSegment, RowSegment, RowTail, Segment } from "./Segment";

export abstract class SegmentGroup<T extends Segment> {
  protected _segments: T[];
  protected _used: number;

  constructor(readonly bit: number) {
    this._segments = [];
    this._used = 0;
  }

  get segments(): T[] {
    return this._segments;
  }

  get(index: number): T | null {
    return this._segments[index] ?? null;
  }

  get used(): number {
    return this._used; // the used space for the current segment groups
  }

  get count(): number {
    return this._segments.length; // the number of segments in the current segment groups
  }
}

export class Divider extends SegmentGroup<DividerSegment> {
  constructor(bit: number) {
    super(bit);
  }

  /**
   * a method for appending a splice into the segment group (divider), note that
   * the end index of `before` should always be less than the end index of `after`
   */
  addSplice(before: RowSegment, after: RowSegment) {
    const length = before.endIndex - this._used;
    if (length !== 0) {
      let represent: Field | null = null;
      if (before.represent?.equals(after.represent) && before.endIndex > after.startIndex) represent = before.represent;
      this._segments.push(new DividerSegment(represent, this._used, length));
      this._used += length;
    }
  }
}

export class Row extends SegmentGroup<RowSegment> {
  constructor(bit: number) {
    super(bit);
  }

  addField(field: Field): this {
    const consume = Math.min(field.length, this.bit - this._used);
    field.length -= consume;

    if (consume !== 0) this._segments.push(new RowSegment(field, this._used, consume));
    this._used += consume;

    return this;
  }

  addTail(isVisible: boolean) {
    if (this._used !== this.bit) this._segments.push(new RowTail(this._used, this.bit - this._used, isVisible));

    this._used = this.bit;
  }
}
