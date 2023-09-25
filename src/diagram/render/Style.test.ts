import { Element, MatrixLike } from "./Element";
import {
  AsciiStyle,
  AsciiVerboseStyle,
  UTF8CornerStyle,
  UTF8HeaderStyle,
  UTF8Style,
  outputCenteredString
} from "./Style";

class UnknownElement extends Element {
  toString(): string {
    return "UnknownElement";
  }

  process(m: MatrixLike, x: number, y: number): void {
    // Nothing to do
  }
}

test("Style ", () => {
  const elements: Element[] = [];
  elements.push(new UnknownElement());
  const actual = new UTF8Style(elements).output();
  expect(actual).toBe("");
  new UTF8Style([]);
  new UTF8HeaderStyle([]);
  new UTF8CornerStyle([]);
  new AsciiStyle([]);
  new AsciiVerboseStyle([]);
});

test("outputCenteredString", () => {
  // length = bitlength * 2 - 1
  expect(outputCenteredString("test", " ", 8)).toBe("      test     ");
  expect(outputCenteredString("test", " ", 9)).toBe("       test      ");
  expect(outputCenteredString("test", " ", -1)).toBe("");
  expect(outputCenteredString("test", "", 8)).toBe("test");
  expect(outputCenteredString("", "|", 1)).toBe("|");

});
