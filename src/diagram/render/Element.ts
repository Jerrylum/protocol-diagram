export interface VisibleSetting {
  get isVisible(): boolean;
}

export function hasVisibleSetting(o: unknown): o is VisibleSetting {
  return typeof o === "object" && o !== null && "isVisible" in o && typeof o.isVisible === "boolean";
}

export interface MatrixLike {
  readonly width: number;
  readonly height: number;
  readonly elements: Element[];

  get(x: number, y: number): Element | null;
}

export abstract class Element {
  abstract process(m: MatrixLike, x: number, y: number): void;
}
