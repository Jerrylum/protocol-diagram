import { Element } from "./Element";
import { Connector, DividerSegment, NextLine, RowSegment, RowTail, Segment } from "./Segment";

export function outputCenteredString(str: string, backgroundChar: string, bitLength: number): string {
  const length = bitLength * 2 - 1;
  const strLength = str.length;
  let strIndex = Math.floor((length - strLength) / 2) + ((strLength + 1) % 2);
  if (strLength > length) {
    str = str.substring(0, length);
    strIndex = 0;
  }

  let rtn = "";
  for (let i = 0; i < length; i++) {
    if (i === strIndex && strLength !== 0) {
      rtn += str;
      i += strLength - 1;
    } else {
      rtn += backgroundChar;
    }
  }
  return rtn;
}

export function outputPatternString(oddChar: string, evenChar: string, bitLength: number) {
  let rtn = "";

  rtn += oddChar;
  for (let i = 1; i < bitLength; i++) {
    rtn += evenChar;
    rtn += oddChar;
  }

  return rtn;
}

export abstract class Style {
  constructor(protected elements: Element[]) {}

  build(e: Connector | DividerSegment | RowTail | NextLine | RowSegment): string {
    if (e instanceof Segment) {
      const name = e.displayName ? e.represent?.name ?? "" : "";
      return outputCenteredString(name, " ", e.length);
    } else if (e instanceof NextLine) {
      return "\n";
    } else {
      return "";
    }
  }

  output() {
    let rtn = "";

    let last: Element | null = null;
    for (const element of this.elements) {
      if (last !== element) {
        rtn += this.build((last = element));
      }
    }

    return rtn;
  }
}

export class AsciiStyle extends Style {
  build(e: Connector | DividerSegment | RowTail | NextLine | RowSegment): string {
    if (e instanceof Connector) {
      return [
        " ", // 0
        " ", // 1
        " ", // 2
        "+", // 3
        " ", // 4
        "-", // 5
        "+", // 6
        "+", // 7
        " ", // 8
        "+", // 9
        "|", // 10
        "+", // 11
        "+", // 12
        "+", // 13
        "+", // 14
        "+" // 15
      ][e.value];
    } else if (e instanceof DividerSegment) {
      if (e.displayName) {
        // Fallback to parent class
      } else {
        const char = e.isVisible ? "-" : " ";
        return outputPatternString(char, char, e.length);
      }
    } else if (e instanceof RowTail) {
      if (e.isVisible) return outputCenteredString("Reserved", "-", e.length);
      else return outputCenteredString("", " ", e.length);
    }

    return super.build(e);
  }
}

export class AsciiVerboseStyle extends AsciiStyle {
  build(e: Connector | DividerSegment | RowTail | NextLine | RowSegment): string {
    if (e instanceof DividerSegment) {
      if (e.displayName) {
        // Fallback to parent class
      } else {
        if (e.isVisible) return outputPatternString("-", "+", e.length);
        else return outputPatternString(" ", " ", e.length);
      }
    }

    return super.build(e);
  }
}

export class UTF8Style extends Style {
  build(e: Connector | DividerSegment | RowTail | NextLine | RowSegment): string {
    if (e instanceof Connector) {
      return [
        " ", // 0
        " ", // 1
        " ", // 2
        "┐", // 3
        " ", // 4
        "─", // 5
        "┌", // 6
        "┬", // 7
        " ", // 8
        "┘", // 9
        "│", // 10
        "┤", // 11
        "└", // 12
        "┴", // 13
        "├", // 14
        "┼" // 15
      ][e.value];
    } else if (e instanceof DividerSegment) {
      if (e.displayName) {
        // Fallback to parent class
      } else {
        const char = e.isVisible ? "─" : " ";
        return outputPatternString(char, char, e.length);
      }
    } else if (e instanceof RowTail) {
      if (e.isVisible) return outputCenteredString("Reserved", "─", e.length);
      else return outputCenteredString("", " ", e.length);
    }

    return super.build(e);
  }
}

export class UTF8HeaderStyle extends UTF8Style {
  constructor(elements: Element[]) {
    super(elements);

    for (const e of elements) {
      if (e instanceof Connector) {
        e.value |= Connector.TOP;
      } else if (e instanceof NextLine) {
        break;
      }
    }
  }
}

export class UTF8CornerStyle extends UTF8Style {
  build(e: Connector | DividerSegment | RowTail | NextLine | RowSegment): string {
    if (e instanceof Connector) {
      return [
        " ", // 0
        " ", // 1
        " ", // 2
        "┼", // 3
        " ", // 4
        "─", // 5
        "┼", // 6
        "┼", // 7
        " ", // 8
        "┼", // 9
        "│", // 10
        "┼", // 11
        "┼", // 12
        "┼", // 13
        "┼", // 14
        "┼" // 15
      ][e.value];
    }

    return super.build(e);
  }
}
