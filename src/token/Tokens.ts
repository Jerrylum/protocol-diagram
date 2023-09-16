// ALGO: Tokens implementation is adopted from https://github.com/Jerrylum/ProtocolDiagram under the GPLv3 license.

import isEqual from "lodash.isequal";

/**
 * A utility function that checks whether the character is delimiter (null | ' ')
 *
 * @param c the character to be checked
 * @return whether the character is delimiter
 */
export function isDelimiter(c: string | null): boolean {
  return c === null || c === " ";
}

/**
 * A utility function that checks whether the character is delimiter (null | ' ' | ':' | ',')
 *
 * @param c the character to be checked
 * @return whether the character is delimiter
 */
export function isSafeDelimiter(c: string | null): boolean {
  return (
    c === null ||
    c === " " ||
    c === ":" ||
    c === "," ||
    c === "+" ||
    c === "-" ||
    c === "*" ||
    c === "/" ||
    c === "(" ||
    c === ")"
  );
}

/**
 * A utility function that reads the code point buffer, returns a Token instance
 * typed with T which given by the parameter class T if the code point buffer
 * does match one of our specified acceptable characters, else return null.
 *
 * @template T - The type of the token to be created.
 * @param {CodePointBuffer} buffer - The code point buffer to be read.
 * @param {string[]} accepts - The array of acceptable characters.
 * @param {new (value: string) => T} tokenClass - The constructor of the token to be created.
 * @returns {T|null} - The token instance, or null if the buffer does not match any acceptable characters.
 */
function doParseCodepoint<T extends Token>(
  buffer: CodePointBuffer,
  accepts: string[],
  tokenClass: new (value: string) => T
): T | null {
  buffer.savepoint();

  const target = buffer.next();
  for (const c of accepts) {
    if (target === c) {
      return buffer.commitAndReturn(new tokenClass(c));
    }
  }
  return buffer.rollbackAndReturn(null);
}

/**
 * Parses a quoted string token from the given code point buffer.
 * @template T - The type of the token.
 * @param {CodePointBuffer} buffer - The code point buffer to be parsed.
 * @param {string} quote - The quote character.
 * @param {new (value: string, content: string) => T} tokenClass - The class of the token to be returned.
 * @returns {T|null} - The parsed token instance or null if the buffer does not contain a valid quoted string.
 */
function doParseQuoteString<T extends Token>(
  buffer: CodePointBuffer,
  quote: string,
  tokenClass: new (value: string, content: string) => T
): T | null {
  buffer.savepoint();

  let valueSb = "";
  let contentSb = "";
  let escape = false;
  let open = true;

  if (buffer.next() !== quote) {
    return buffer.rollbackAndReturn(null);
  }
  valueSb += quote;

  while (buffer.hasNext()) {
    const c = buffer.next();

    if (escape) {
      escape = false;
      contentSb += c;
      valueSb += c;
    } else {
      if (c === "\\") {
        escape = true;
        valueSb += c;
      } else if (c === quote) {
        open = false;
        valueSb += c;
        break;
      } else {
        valueSb += c;
        contentSb += c;
      }
    }
  }

  if (open) {
    return buffer.rollbackAndReturn(null);
  } else {
    return buffer.commitAndReturn(new tokenClass(valueSb, contentSb));
  }
}

/**
 * A class that wraps a string for the ease of tokenizing and parsing.
 */
export class CodePointBuffer {
  /**
   * The be-wrapped string.
   */
  private target: string;
  /**
   * The character-reading cursor position.
   */
  private index: number;
  /**
   * The cursor position history, will be used to rewind to historic positions during the parsing.
   */
  private history: number[];

  /**
   * @param target The string to be wrapped.
   */
  constructor(target: string) {
    this.target = target;
    this.index = 0;
    this.history = [];
  }

  /**
   * A method to retrieve the length of the internally stored string.
   */
  public length(): number {
    return this.target.length;
  }

  /**
   * A method to get the current cursor index.
   */
  public getIndex(): number {
    return this.index;
  }

  /**
   * A method to lookup the character by specified index.
   * @param index The index to be looked up.
   * @returns The character at the specified index, or null if the index is out of range.
   */
  public at(index: number): string | null {
    return index < this.length() ? this.target.charAt(index) : null;
  }

  /**
   * A method to save the current cursor into the history.
   */
  public savepoint(): void {
    this.history.push(this.index);
  }

  /**
   * A method to retrieve the last saved cursor position, and restore the cursor from that position.
   */
  public rollback(): void {
    this.index = this.history.pop()!;
  }

  /**
   * A wrapper function that receives and returns the value without performing any operation on top of that value and rollback behind the scene.
   * @template T
   * @param value The value to be wrapped.
   * @returns The value that was passed in.
   */
  public rollbackAndReturn<T>(value: T): T {
    this.rollback();
    return value;
  }

  /**
   * A method that remove the last saved cursor.
   */
  public commit(): void {
    this.history.pop();
  }

  /**
   * A wrapper function that receives and returns the value without performing any operation on top of that value and commit behind the scene.
   * @template T
   * @param value The value to be returned.
   * @returns The value that was passed in.
   */
  public commitAndReturn<T>(value: T): T {
    this.commit();
    return value;
  }

  /**
   * A method to lookup the cursor pointing character and move the cursor to the right.
   * @returns The character at the current cursor position, or null if the cursor is at the end of the string.
   */
  public next(): string | null {
    return this.at(this.index++);
  }

  /**
   * A method to lookup the cursor pointing character.
   * @returns The character at the current cursor position, or null if the cursor is at the end of the string.
   */
  public peek(): string | null;

  /**
   * A method to look a head character by given offset.
   * @param offset The offset to look ahead.
   * @returns The character at the specified offset ahead of the current cursor position, or null if the offset is out of range.
   */
  public peek(offset: number): string | null;

  public peek(offset?: number): string | null {
    return this.at(offset !== undefined ? this.index + offset : this.index);
  }

  /**
   * A method to determine whether the string could be further consumed.
   * @returns true if there are more characters to consume, false otherwise.
   */
  public hasNext(): boolean {
    return this.index < this.length();
  }

  /**
   * A method that reads every delimiter and stops once it bumps into a non-delimiter character and return.
   * @returns The number of delimiters that were read.
   */
  public readDelimiter(): number {
    let count = 0;
    while (this.hasNext() && isDelimiter(this.peek())) {
      count++;
      this.next();
    }
    return count;
  }

  /**
   * A method that reads every character and stops once it bumps into a delimiter.
   * @returns A string containing all characters read up to the delimiter, or an empty string if the cursor is at a delimiter.
   */
  public readChunk(): string {
    let rtn = "";
    while (this.hasNext() && !isDelimiter(this.peek())) {
      rtn += this.next();
    }
    return rtn; // might be empty
  }

  /**
   * A method that reads every character and stops once it bumps into a safe delimiter, which is a superset of delimiter, it contains (null | ' ' | ':' | ',' and more).
   * @returns A string containing all characters read upto the safe delimiter, or an empty string if the cursor is at a safe delimiter.
   */
  public readSafeChunk(): string {
    let rtn = "";
    while (this.hasNext() && !isSafeDelimiter(this.peek())) {
      rtn += this.next();
    }
    return rtn; // might be empty
  }
}

export abstract class Token {
  public static parse(buffer: CodePointBuffer): Token | null {
    return null;
  }

  public equals(obj: unknown): boolean {
    return isEqual(this, obj);
  }
}

export type TokenParser<T extends Token> = (buffer: CodePointBuffer, ...args: any[]) => T | null;
export type TokenConstructor<T extends Token> = new (...args: any[]) => T;

/**
 * A class that represents a boolean token.
 * @implements {Token}
 */
export class BooleanT extends Token {
  /**
   * Creates a new instance of `BooleanT`.
   * @param {string} value - The string representation of the boolean value.
   * @param {boolean} bool - The boolean value.
   */
  constructor(public value: string, public bool: boolean) {
    super();
  }

  public static parse(buffer: CodePointBuffer): BooleanT | null {
    buffer.savepoint();

    const s = buffer.readChunk();

    if (s.toLowerCase() === "true") return buffer.commitAndReturn(new BooleanT(s, true));
    else if (s.toLowerCase() === "false") return buffer.commitAndReturn(new BooleanT(s, false));
    else return buffer.rollbackAndReturn(null);
  }
}

// Skip CommandLine

export class DecimalPoint extends Token {
  public static parse(buffer: CodePointBuffer): DecimalPoint | null {
    return doParseCodepoint(buffer, ["."], DecimalPoint);
  }

  readonly value = ".";
}

export class Digit extends Token {
  constructor(public value: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): Digit | null {
    return doParseCodepoint(buffer, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], Digit);
  }
}

export class Digit1To9 extends Token {
  constructor(public value: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): Digit1To9 | null {
    return doParseCodepoint(buffer, ["1", "2", "3", "4", "5", "6", "7", "8", "9"], Digit1To9);
  }
}

export class DoubleQuoteString extends Token {
  constructor(public value: string, public content: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): DoubleQuoteString | null {
    return doParseQuoteString(buffer, '"', DoubleQuoteString);
  }
}

// Contains the values of the fractal that starts with character '.' and the sequence of digit followed
export class Frac extends Token {
  /**
   * Creates a new instance of `Frac`.
   * @param {string} value - The string representation of the fractional value.
   */
  constructor(public value: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): Frac | null {
    buffer.savepoint();

    let rtn = "";
    const d = DecimalPoint.parse(buffer);
    if (!d) {
      return buffer.rollbackAndReturn(null);
    }
    rtn += d.value;

    let hasDigit = false;
    let d0t9;
    while ((d0t9 = Digit.parse(buffer)) !== null) {
      rtn += d0t9.value;
      hasDigit = true;
    }

    if (!hasDigit) {
      return buffer.rollbackAndReturn(null);
    }

    return buffer.commitAndReturn(new Frac(rtn));
  }
}

export class Int extends Token {
  constructor(public value: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): Int | null {
    buffer.savepoint();

    const z = Zero.parse(buffer);
    if (z) {
      return buffer.commitAndReturn(new Int(z.value));
    } else {
      const p = PositiveInt.parse(buffer);

      if (!p) {
        return buffer.rollbackAndReturn(null);
      }

      return buffer.commitAndReturn(new Int(p.value));
    }
  }
}

export class Minus extends Token {
  public static parse(buffer: CodePointBuffer): Minus | null {
    return doParseCodepoint(buffer, ["-"], Minus);
  }

  readonly value = "-";
}

export class NegativeInt extends Token {
  constructor(public value: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): NegativeInt | null {
    buffer.savepoint();

    let rtn = "";
    const m = Minus.parse(buffer);
    if (!m) {
      return buffer.rollbackAndReturn(null);
    }
    rtn += m.value;

    const p = PositiveInt.parse(buffer);
    if (!p) {
      return buffer.rollbackAndReturn(null);
    }
    rtn += p.value;

    return buffer.commitAndReturn(new NegativeInt(rtn));
  }
}

export class NumberT extends Token {
  constructor(public value: string, public isPositive: boolean, public isDouble: boolean) {
    super();
  }

  public static parse(buffer: CodePointBuffer): NumberT | null {
    buffer.savepoint();

    let rtn = "";
    let isPositive: boolean, isDouble: boolean;

    const n = NegativeInt.parse(buffer);
    if (n) {
      rtn += n.value;
      isPositive = false;
    } else {
      const p = Int.parse(buffer);
      if (!p) {
        return buffer.rollbackAndReturn(null);
      }
      rtn += p.value;
      isPositive = true;
    }

    const f = Frac.parse(buffer);
    isDouble = f !== null;
    if (isDouble) {
      rtn += f!.value;
    }

    return buffer.commitAndReturn(new NumberT(rtn, isPositive, isDouble));
  }

  public toInt(): number {
    return parseInt(this.value);
  }

  public toDouble(): number {
    return parseFloat(this.value);
  }
}

// Skip OneLineInput

// Skip Parameter

export class PositiveInt extends Token {
  constructor(public value: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): PositiveInt | null {
    buffer.savepoint();

    let rtn = "";

    const d1t9 = Digit1To9.parse(buffer);
    if (!d1t9) {
      return buffer.rollbackAndReturn(null);
    }
    rtn += d1t9.value;

    let d0t9;
    while ((d0t9 = Digit.parse(buffer)) !== null) {
      rtn += d0t9.value;
    }

    return buffer.commitAndReturn(new PositiveInt(rtn));
  }
}

// Skip SafeString

export class SingleQuoteString extends Token {
  constructor(public value: string, public content: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): SingleQuoteString | null {
    return doParseQuoteString(buffer, "'", SingleQuoteString);
  }
}

export class StringT extends Token {
  constructor(public content: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): StringT | null {
    const c = buffer.peek();

    if (!c) {
      return null;
    } else if (c === '"') {
      const d = DoubleQuoteString.parse(buffer);
      if (!d) {
        return null;
      }
      return new StringT(d.content);
    } else if (c === "'") {
      const s = SingleQuoteString.parse(buffer);
      if (!s) {
        return null;
      }
      return new StringT(s.content);
    } else {
      const content = buffer.readChunk();
      return new StringT(content);
    }
  }
}

export class Zero extends Token {
  constructor(public value: string) {
    super();
  }

  public static parse(buffer: CodePointBuffer): Zero | null {
    return doParseCodepoint(buffer, ["0"], Zero);
  }
}

export class Parameter extends Token {
  private bool: BooleanT | null = null;
  private number: NumberT | null = null;
  private string: StringT | null = null;

  constructor(bool: BooleanT | null = null, number: NumberT | null = null, string: StringT | null = null) {
    super();
    this.bool = bool;
    this.number = number;
    this.string = string;
  }

  static parse(buffer: CodePointBuffer): Parameter | null {
    buffer.savepoint();

    let i = 0;
    while (!isDelimiter(buffer.peek(i))) i++;

    let firstStop = buffer.getIndex() + i;
    let bool = BooleanT.parse(buffer);
    if (bool != null) return buffer.commitAndReturn(new Parameter(bool));

    let number = NumberT.parse(buffer);
    if (number != null) {
      if (buffer.getIndex() == firstStop) return buffer.commitAndReturn(new Parameter(null, number));
      else {
        buffer.rollback();
        buffer.savepoint();
      }
    }

    let string = StringT.parse(buffer);
    if (string != null) return buffer.commitAndReturn(new Parameter(null, null, string));
    else return buffer.rollbackAndReturn(null);
  }

  getBoolean(): boolean {
    return this.bool!.bool;
  }

  getInt(): number {
    return this.number!.toInt();
  }

  getDouble(): number {
    return this.number!.toDouble();
  }

  getString(): string {
    return this.string!.content;
  }

  isBoolean(): boolean {
    return this.bool != null;
  }

  isNumber(): boolean {
    return this.number != null;
  }

  isDouble(): boolean {
    return this.number != null && this.number.isDouble;
  }

  isString(): boolean {
    return this.string != null;
  }

  toString(): string {
    if (this.isBoolean()) return this.bool!.bool + "";
    else if (this.isNumber()) return this.isDouble() ? this.number!.toDouble() + "" : this.number!.toInt() + "";
    else return this.getString();
  }

  equals(obj: unknown): boolean {
    if (obj === null) {
      return false;
    }

    if (!(obj instanceof Parameter)) {
      return false;
    }

    let other = obj as Parameter;

    return isEqual(other.string, this.string) && isEqual(other.number, this.number) && isEqual(other.bool, this.bool);
  }
}

/**
 * this record is a data class that contains the prefix and the parameters of a
 * command line
 */
export class CommandLine extends Token {
  /**
   * a static utility function that parses the CodePointBuffer, which is a wrapper
   * of a string, and returns a CommandLine object, which is a wrapper that
   * separated from the raw CodePointBuffer to two stuff, a command prefix and the
   * params right after the command prefix.
   *
   * via this process, it could assist the program to distinguish each commands
   * and tell the differences.
   *
   * @param buffer the CodePointBuffer to be parsed
   * @return the parsed CommandLine object, or null if the parse failed
   */

  constructor(public name: String, public params: Parameter[]) {
    super();
  }

  static parse(buffer: CodePointBuffer): CommandLine | null {
    buffer.readDelimiter();

    const cname: string = buffer.readChunk();
    if (cname.length === 0) {
      return null;
    }

    let params: Parameter[] = [];
    while (true) {
      buffer.readDelimiter();
      let p: Parameter | null = Parameter.parse(buffer);
      if (p === null) {
        break;
      }
      params.push(p);
    }
    if (buffer.hasNext()) {
      return null;
    } else {
      return new CommandLine(cname, params);
    }
  }
}
