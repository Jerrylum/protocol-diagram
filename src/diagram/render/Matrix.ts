import { Connector, Element, NextLine } from "./Element";
import { DividerSegment, Segment } from "./Segment";

export class Matrix {
  readonly width: number = 0;
  readonly height: number = 1;
  readonly elements: Element[] = [];

  constructor(segments: Segment[]) {
    if (segments.length < 3) return;

    let isDivider = true;
    for (const segment of segments) {
      if (segment instanceof DividerSegment !== isDivider) {
        isDivider = !isDivider;
        this.elements.push(new Connector());
        this.elements.push(new NextLine());
        this.height++;
      }

      this.elements.push(new Connector());
      this.elements.push(segment);

      for (let i = 1; i < segment.length; i++) {
        this.elements.push(segment);
        this.elements.push(segment);
      }
    }

    this.elements.push(new Connector());
    this.elements.push(new NextLine());
    this.width = Math.floor(this.elements.length / this.height);
  }

  get(x: number, y: number): Element | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.elements[y * this.width + x];
  }

  process(): void {
    let last: Element | null = null;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const e = this.get(x, y);
        if (last !== e) {
          if (e !== null) 
          e.process(this, x, y);
          last = e;
        }
      }
    }
  }
}
