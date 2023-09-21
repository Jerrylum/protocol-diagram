import { Matrix } from "./Matrix";
import { RowTail } from "./Segment";

export interface VisibleSetting {
  get isVisible(): boolean;
}

export function hasVisibleSetting(o: unknown): o is VisibleSetting {
  return typeof (o as VisibleSetting).isVisible === "function";
}

export abstract class Element {
  abstract process(m: Matrix, x: number, y: number): void;
}

export class NextLine extends Element {
  process(m: Matrix, x: number, y: number): void {
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

  process(m: Matrix, x: number, y: number): void {
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
