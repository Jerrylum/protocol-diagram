import { cp } from "fs";
import {
  Zero,
  CodePointBuffer,
  isDelimiter,
  isSafeDelimiter,
  BooleanT,
  DecimalPoint,
  Digit1To9,
  Digit,
  DoubleQuoteString,
  Frac,
  Int,
  Minus,
  NegativeInt,
  NumberT,
  PositiveInt,
  SingleQuoteString,
  StringT,
  Parameter,
  CommandLine,
  ParameterType,
  Token,
  CommandParameter
} from "./Tokens";

export function cpb(s: string, index: number = 0): CodePointBuffer {
  const rtn = new CodePointBuffer(s);
  (rtn as any).index = index;
  return rtn;
}

test("Test token delimiter methods", () => {
  expect(true).toBe(true);

  Zero.parse(cpb("0"));
});

test("Token delimiter methods", () => {
  expect(isDelimiter(" ")).toBe(true);
  expect(isDelimiter(null)).toBe(true);
  expect(isDelimiter("'")).toBe(false);
  expect(isSafeDelimiter(null)).toBe(true);
  expect(isSafeDelimiter(" ")).toBe(true);
  expect(isSafeDelimiter(":")).toBe(true);
  expect(isSafeDelimiter(",")).toBe(true);
  expect(isSafeDelimiter("'")).toBe(false);
});

test("BooleanT valid case", () => {
  const t = BooleanT.parse(cpb("True"));
  if (!t) throw new Error("t is null");
  expect("True").toBe(t.value);
  expect(true).toBe(t.bool);

  expect(new BooleanT("True", true)).toStrictEqual(BooleanT.parse(cpb("True")));
  expect(new BooleanT("true", true)).toStrictEqual(BooleanT.parse(cpb("true")));
  expect(new BooleanT("False", false)).toStrictEqual(BooleanT.parse(cpb("False")));
  expect(new BooleanT("false", false)).toStrictEqual(BooleanT.parse(cpb("false")));
  expect(new BooleanT("True", true)).toStrictEqual(BooleanT.parse(cpb("True ")));
  expect(new BooleanT("TrUe", true)).toStrictEqual(BooleanT.parse(cpb("TrUe ")));
  expect(new BooleanT("fAlse", false)).toStrictEqual(BooleanT.parse(cpb("fAlse")));
});

test("BooleanT invalid case", () => {
  expect(BooleanT.parse(cpb(""))).toBeNull();
  expect(BooleanT.parse(cpb("1"))).toBeNull();
  expect(BooleanT.parse(cpb("0"))).toBeNull();
  expect(BooleanT.parse(cpb(" "))).toBeNull();
  expect(BooleanT.parse(cpb(" True"))).toBeNull();
  expect(BooleanT.parse(cpb(""))).toBeNull();
});

test("DecimalPoint valid case", () => {
  expect(new DecimalPoint()).toStrictEqual(DecimalPoint.parse(cpb(".")));
  expect(new DecimalPoint()).toStrictEqual(DecimalPoint.parse(cpb(". ")));
  expect(new DecimalPoint()).toStrictEqual(DecimalPoint.parse(cpb(".a")));
  expect(new DecimalPoint()).toStrictEqual(DecimalPoint.parse(cpb(".123")));
});

test("DecimalPoint invalid case", () => {
  expect(DecimalPoint.parse(cpb(" ."))).toBeNull();
  expect(DecimalPoint.parse(cpb("0"))).toBeNull();
  expect(DecimalPoint.parse(cpb(" "))).toBeNull();
  expect(DecimalPoint.parse(cpb("a"))).toBeNull();
  expect(DecimalPoint.parse(cpb(""))).toBeNull();
  expect(DecimalPoint.parse(cpb("1 "))).toBeNull();
  expect(DecimalPoint.parse(cpb("-1"))).toBeNull();
  expect(DecimalPoint.parse(cpb("1"))).toBeNull();
});

test("Digit1To9 valid case", () => {
  expect(new Digit1To9("1")).toStrictEqual(Digit1To9.parse(cpb("1")));
  expect(new Digit1To9("2")).toStrictEqual(Digit1To9.parse(cpb("2")));
  expect(new Digit1To9("3")).toStrictEqual(Digit1To9.parse(cpb("3")));
  expect(new Digit1To9("4")).toStrictEqual(Digit1To9.parse(cpb("4")));
  expect(new Digit1To9("5")).toStrictEqual(Digit1To9.parse(cpb("5")));
  expect(new Digit1To9("6")).toStrictEqual(Digit1To9.parse(cpb("6")));
  expect(new Digit1To9("7")).toStrictEqual(Digit1To9.parse(cpb("7")));
  expect(new Digit1To9("8")).toStrictEqual(Digit1To9.parse(cpb("8")));
  expect(new Digit1To9("9")).toStrictEqual(Digit1To9.parse(cpb("9")));
  expect(new Digit1To9("1")).toStrictEqual(Digit1To9.parse(cpb("10")));
  expect(new Digit1To9("1")).toStrictEqual(Digit1To9.parse(cpb("1 ")));
});

test("Digit1To9 invalid case", () => {
  expect(Digit1To9.parse(cpb("0"))).toBeNull();
  expect(Digit1To9.parse(cpb(" 1"))).toBeNull();
  expect(Digit1To9.parse(cpb("a"))).toBeNull();
  expect(Digit1To9.parse(cpb("A"))).toBeNull();
  expect(Digit1To9.parse(cpb(""))).toBeNull();
  expect(Digit1To9.parse(cpb("-1"))).toBeNull();
  expect(Digit1To9.parse(cpb(".123"))).toBeNull();
});

test("Digit valid case", () => {
  expect(new Digit("0")).toStrictEqual(Digit.parse(cpb("0")));
  expect(new Digit("1")).toStrictEqual(Digit.parse(cpb("1")));
  expect(new Digit("2")).toStrictEqual(Digit.parse(cpb("2")));
  expect(new Digit("3")).toStrictEqual(Digit.parse(cpb("3")));
  expect(new Digit("4")).toStrictEqual(Digit.parse(cpb("4")));
  expect(new Digit("5")).toStrictEqual(Digit.parse(cpb("5")));
  expect(new Digit("6")).toStrictEqual(Digit.parse(cpb("6")));
  expect(new Digit("7")).toStrictEqual(Digit.parse(cpb("7")));
  expect(new Digit("8")).toStrictEqual(Digit.parse(cpb("8")));
  expect(new Digit("9")).toStrictEqual(Digit.parse(cpb("9")));
  expect(new Digit("1")).toStrictEqual(Digit.parse(cpb("1 ")));
});

test("Digit invalid case", () => {
  expect(Digit.parse(cpb(""))).toBeNull();
  expect(Digit.parse(cpb("-1"))).toBeNull();
  expect(Digit.parse(cpb("a"))).toBeNull();
  expect(Digit.parse(cpb("A"))).toBeNull();
  expect(Digit.parse(cpb(" "))).toBeNull();
  expect(Digit.parse(cpb(" 1"))).toBeNull();
  expect(Digit.parse(cpb(".22"))).toBeNull();
});

test("DoubleQuoteString valid case", () => {
  let t = new DoubleQuoteString('"test"', "test");
  expect('"test"').toStrictEqual(t.value);
  expect("test").toStrictEqual(t.content);

  expect(new DoubleQuoteString('"\\\\"', "\\")).toStrictEqual(DoubleQuoteString.parse(cpb('"\\\\"'))); // \
  expect(new DoubleQuoteString('"\\""', '"')).toStrictEqual(DoubleQuoteString.parse(cpb('"\\""'))); // \"
  expect(new DoubleQuoteString('"\\\\\\""', '\\"')).toStrictEqual(DoubleQuoteString.parse(cpb('"\\\\\\""'))); // \\"
  expect(new DoubleQuoteString('"\\\\\\\\"', "\\\\")).toStrictEqual(DoubleQuoteString.parse(cpb('"\\\\\\\\"'))); // \\
  expect(new DoubleQuoteString('"test\\\\"', "test\\")).toStrictEqual(DoubleQuoteString.parse(cpb('"test\\\\"'))); // test\
  expect(new DoubleQuoteString('"test\\""', 'test"')).toStrictEqual(DoubleQuoteString.parse(cpb('"test\\""'))); // test\"
  expect(new DoubleQuoteString('"test\\\\\\""', 'test\\"')).toStrictEqual(
    DoubleQuoteString.parse(cpb('"test\\\\\\""'))
  ); // test\\"
  expect(new DoubleQuoteString('""', "")).toStrictEqual(DoubleQuoteString.parse(cpb('""'))); // empty
});

test("DoubleQuoteString invalid case", () => {
  expect(DoubleQuoteString.parse(cpb("test"))).toBeNull(); // no quote
  expect(DoubleQuoteString.parse(cpb(""))).toBeNull();
  expect(DoubleQuoteString.parse(cpb("234"))).toBeNull();
  expect(DoubleQuoteString.parse(cpb('"'))).toBeNull(); // missing end quote
  expect(DoubleQuoteString.parse(cpb('"test'))).toBeNull();
  expect(DoubleQuoteString.parse(cpb('"234'))).toBeNull();
});

test("Frac valid case", () => {
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14.15")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14 ")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14abc")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14\\")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14'")));
});

test("Frac invalid case", () => {
  expect(Frac.parse(cpb("."))).toBeNull();
  expect(Frac.parse(cpb("14"))).toBeNull();
  expect(Frac.parse(cpb(""))).toBeNull();
  expect(Frac.parse(cpb(" "))).toBeNull();
  expect(Frac.parse(cpb("abc"))).toBeNull();
  expect(Frac.parse(cpb("-123"))).toBeNull();
  expect(Frac.parse(cpb("3.14"))).toBeNull();
});

test("Int valid case", () => {
  expect(new Int("0")).toStrictEqual(Int.parse(cpb("0")));
  expect(new Int("123")).toStrictEqual(Int.parse(cpb("123")));
  expect(new Int("0")).toStrictEqual(Int.parse(cpb("0 ")));
  expect(new Int("123")).toStrictEqual(Int.parse(cpb("123 ")));
  expect(new Int("0")).toStrictEqual(Int.parse(cpb("0.16")));
  expect(new Int("3")).toStrictEqual(Int.parse(cpb("3.14")));
});

test("Int invalid case", () => {
  expect(Int.parse(cpb("abc"))).toBeNull();
  expect(Int.parse(cpb(""))).toBeNull();
  expect(Int.parse(cpb(" "))).toBeNull();
  expect(Int.parse(cpb(".14"))).toBeNull();
});

test("Minus valid case", () => {
  expect(new Minus()).toStrictEqual(Minus.parse(cpb("-")));
  expect(new Minus()).toStrictEqual(Minus.parse(cpb("- ")));
});

test("Minus invalid case", () => {
  expect(Minus.parse(cpb(""))).toBeNull();
  expect(Minus.parse(cpb("0"))).toBeNull();
  expect(Minus.parse(cpb(" -"))).toBeNull();
  expect(Minus.parse(cpb("a"))).toBeNull();
  expect(Minus.parse(cpb("1"))).toBeNull();
  expect(Minus.parse(cpb("a-"))).toBeNull();
  expect(Minus.parse(cpb("1-"))).toBeNull();
});

test("NegativeInt valid case", () => {
  expect(new NegativeInt("-123")).toStrictEqual(NegativeInt.parse(cpb("-123")));
  expect(new NegativeInt("-123")).toStrictEqual(NegativeInt.parse(cpb("-123abc")));
  expect(new NegativeInt("-123")).toStrictEqual(NegativeInt.parse(cpb("-123 ")));
  expect(new NegativeInt("-123")).toStrictEqual(NegativeInt.parse(cpb("-123 456")));
  expect(new NegativeInt("-3")).toStrictEqual(NegativeInt.parse(cpb("-3.14")));
});

test("NegativeInt invalid case", () => {
  expect(NegativeInt.parse(cpb("abc"))).toBeNull();
  expect(NegativeInt.parse(cpb(""))).toBeNull();
  expect(NegativeInt.parse(cpb("123"))).toBeNull();
  expect(NegativeInt.parse(cpb("0123"))).toBeNull();
  expect(NegativeInt.parse(cpb(".14"))).toBeNull();
});

test("NumberT valid case", () => {
  const number = NumberT.parse(cpb("0"));
  if (number === null) throw new Error("t is null");
  expect(number.value).toStrictEqual("0");
  expect(number.isPositive).toBeTruthy();
  expect(number.isDouble).toBeFalsy();
  expect(NumberT.parse(cpb("14a"))?.toInt()).toStrictEqual(14);
  expect(new NumberT("0", true, false)).toStrictEqual(NumberT.parse(cpb("0")));
  expect(new NumberT("-14", false, false)).toStrictEqual(NumberT.parse(cpb("-14")));
  expect(new NumberT("14", true, false)).toStrictEqual(NumberT.parse(cpb("14")));
  expect(new NumberT("3.14", true, true)).toStrictEqual(NumberT.parse(cpb("3.14 ")));
  expect(new NumberT("-3.14", false, true)).toStrictEqual(NumberT.parse(cpb("-3.14")));
  expect(new NumberT("14", true, false)).toStrictEqual(NumberT.parse(cpb("14\\")));
  expect(new NumberT("14", true, false)).toStrictEqual(NumberT.parse(cpb("14'")));
  expect(new NumberT("14", true, false)).toStrictEqual(NumberT.parse(cpb('14"')));
  expect(new NumberT("14", true, false)).toStrictEqual(NumberT.parse(cpb("14 ")));
  expect(new NumberT("-14", false, false)).toStrictEqual(NumberT.parse(cpb("-14\\")));
  expect(new NumberT("-14", false, false)).toStrictEqual(NumberT.parse(cpb("-14'")));
  expect(new NumberT("-14", false, false)).toStrictEqual(NumberT.parse(cpb('-14"')));
  expect(new NumberT("-14", false, false)).toStrictEqual(NumberT.parse(cpb("-14 ")));
  expect(new NumberT("3.14", true, true)).toStrictEqual(NumberT.parse(cpb("3.14\\")));
  expect(new NumberT("3.14", true, true)).toStrictEqual(NumberT.parse(cpb("3.14'")));
  expect(new NumberT("3.14", true, true)).toStrictEqual(NumberT.parse(cpb('3.14"')));
  expect(new NumberT("3.14", true, true)).toStrictEqual(NumberT.parse(cpb("3.14 ")));
  expect(new NumberT("-3.14", false, true)).toStrictEqual(NumberT.parse(cpb("-3.14\\")));
  expect(new NumberT("-3.14", false, true)).toStrictEqual(NumberT.parse(cpb("-3.14'")));
  expect(new NumberT("-3.14", false, true)).toStrictEqual(NumberT.parse(cpb('-3.14"')));
  expect(new NumberT("-3.14", false, true)).toStrictEqual(NumberT.parse(cpb("-3.14 ")));
});

test("NumberT invalid case", () => {
  expect(NumberT.parse(cpb("-"))).toBeNull();
  expect(NumberT.parse(cpb("-0"))).toBeNull();
  expect(NumberT.parse(cpb(""))).toBeNull();
  expect(NumberT.parse(cpb(" "))).toBeNull();
  expect(NumberT.parse(cpb("a"))).toBeNull();
  expect(NumberT.parse(cpb("a14"))).toBeNull();
  expect(NumberT.parse(cpb("a3.14"))).toBeNull();
  expect(NumberT.parse(cpb("a-14"))).toBeNull();
  expect(NumberT.parse(cpb("a-3.14"))).toBeNull();
  expect(NumberT.parse(cpb("a14 "))).toBeNull();
  expect(NumberT.parse(cpb("a3.14 "))).toBeNull();
  expect(NumberT.parse(cpb("a-14 "))).toBeNull();
  expect(NumberT.parse(cpb("a-3.14 "))).toBeNull();
});

test("PositiveInt valid case", () => {
  expect(new PositiveInt("123")).toStrictEqual(PositiveInt.parse(cpb("123")));
  expect(new PositiveInt("123")).toStrictEqual(PositiveInt.parse(cpb("123abc")));
  expect(new PositiveInt("123")).toStrictEqual(PositiveInt.parse(cpb("123 ")));
  expect(new PositiveInt("123")).toStrictEqual(PositiveInt.parse(cpb("123 456")));
  expect(new PositiveInt("3")).toStrictEqual(PositiveInt.parse(cpb("3.14")));
});

test("PositiveInt invalid case", () => {
  expect(PositiveInt.parse(cpb("abc"))).toBeNull();
  expect(PositiveInt.parse(cpb(""))).toBeNull();
  expect(PositiveInt.parse(cpb("-1"))).toBeNull();
  expect(PositiveInt.parse(cpb("0123"))).toBeNull();
  expect(PositiveInt.parse(cpb(".14"))).toBeNull();
});

test("SingleQuoteString valid case", () => {
  expect(new SingleQuoteString("'\\\\'", "\\")).toStrictEqual(SingleQuoteString.parse(cpb("'\\\\'"))); // \
  expect(new SingleQuoteString("'\\''", "'")).toStrictEqual(SingleQuoteString.parse(cpb("'\\''"))); // '
  expect(new SingleQuoteString("'\\\\\\''", "\\'")).toStrictEqual(SingleQuoteString.parse(cpb("'\\\\\\''"))); // \'
  expect(new SingleQuoteString("'\\\\\\\\'", "\\\\")).toStrictEqual(SingleQuoteString.parse(cpb("'\\\\\\\\'"))); // \\
  expect(new SingleQuoteString("'test\\\\'", "test\\")).toStrictEqual(SingleQuoteString.parse(cpb("'test\\\\'"))); // test\
  expect(new SingleQuoteString("'test\\''", "test'")).toStrictEqual(SingleQuoteString.parse(cpb("'test\\''"))); // test'
  expect(new SingleQuoteString("'test\\\\\\''", "test\\'")).toStrictEqual(
    SingleQuoteString.parse(cpb("'test\\\\\\''"))
  ); // test\'
  expect(new SingleQuoteString("''", "")).toStrictEqual(SingleQuoteString.parse(cpb("''"))); // empty
});

test("SingleQuoteString invalid case", () => {
  expect(SingleQuoteString.parse(cpb("test"))).toBeNull(); // no quote
  expect(SingleQuoteString.parse(cpb(""))).toBeNull();
  expect(SingleQuoteString.parse(cpb("234"))).toBeNull();
  expect(SingleQuoteString.parse(cpb("'"))).toBeNull(); // missing end quote
  expect(SingleQuoteString.parse(cpb("'test"))).toBeNull();
  expect(SingleQuoteString.parse(cpb("'234"))).toBeNull();
});

test("StringT valid case", () => {
  expect(new StringT("test")).toStrictEqual(StringT.parse(cpb("test"))); // test
  expect(new StringT("")).toStrictEqual(StringT.parse(cpb(" "))); // empty
  expect(new StringT("test")).toStrictEqual(StringT.parse(cpb("test test"))); // test
  expect(new StringT("'test'", "test")).toStrictEqual(StringT.parse(cpb("'test'"))); // 'test'
  expect(new StringT('"test"', "test")).toStrictEqual(StringT.parse(cpb('"test"'))); // "test"
  expect(new StringT("'\\\\'", "\\")).toStrictEqual(StringT.parse(cpb("'\\\\'"))); // '\\'
  expect(new StringT("'\\''", "'")).toStrictEqual(StringT.parse(cpb("'\\''"))); // '\''
  expect(new StringT('"\\\\"', "\\")).toStrictEqual(StringT.parse(cpb('"\\\\"'))); // "\\"
  expect(new StringT("'\\\"'", '"')).toStrictEqual(StringT.parse(cpb("'\\\"'"))); // '\"'
  expect(new StringT("'\\\\test'", "\\test")).toStrictEqual(StringT.parse(cpb("'\\\\test'"))); // '\\test'
  expect(new StringT('"\\\\test"', "\\test")).toStrictEqual(StringT.parse(cpb('"\\\\test"'))); // "\\test"
});

test("StringT invalid case", () => {
  expect(StringT.parse(cpb(""))).toBeNull(); // empty
  expect(StringT.parse(cpb("'"))).toBeNull(); // '
  expect(StringT.parse(cpb('"'))).toBeNull(); // "
  expect(StringT.parse(cpb("'test"))).toBeNull(); // 'test
  expect(StringT.parse(cpb('"test'))).toBeNull(); // "test
  expect(StringT.parse(cpb("'test\""))).toBeNull(); // 'test"
  expect(StringT.parse(cpb("\"test'"))).toBeNull(); // "test'
});

test("Zero valid case", () => {
  expect(new Zero("0")).toStrictEqual(Zero.parse(cpb("0")));
  expect(new Zero("0")).toStrictEqual(Zero.parse(cpb("0 ")));
});

test("Zero invalid case", () => {
  expect(Zero.parse(cpb("1"))).toBeNull();
  expect(Zero.parse(cpb("a"))).toBeNull();
  expect(Zero.parse(cpb(" "))).toBeNull();
  expect(Zero.parse(cpb(""))).toBeNull();
  expect(Zero.parse(cpb("-"))).toBeNull();
  expect(Zero.parse(cpb(" 0"))).toBeNull();
});

test("Parameter Valid", () => {
  expect(Parameter.parse(cpb("True"))?.getBoolean()).toBe(true);
  expect(Parameter.parse(cpb("False"))?.getBoolean()).toBe(false);
  expect(Parameter.parse(cpb("123"))?.getInt()).toBe(123);
  expect(Parameter.parse(cpb("123.456"))?.getDouble()).toBe(123.456);
  expect(Parameter.parse(cpb("0"))?.getInt()).toBe(0);
  expect(Parameter.parse(cpb("0.0"))?.getDouble()).toBe(0.0);
  expect(Parameter.parse(cpb("-14"))?.getInt()).toBe(-14);
  expect(Parameter.parse(cpb("-14.0"))?.getDouble()).toBe(-14.0);
  expect(Parameter.parse(cpb('"14"'))?.getString()).toBe("14");
  expect(Parameter.parse(cpb('"14.0"'))?.getString()).toBe("14.0");
  expect(Parameter.parse(cpb('"-14"'))?.getString()).toBe("-14");
  expect(Parameter.parse(cpb('"-14.0"'))?.getString()).toBe("-14.0");
  expect(Parameter.parse(cpb("'14'"))?.getString()).toBe("14");
  expect(Parameter.parse(cpb("'14.0'"))?.getString()).toBe("14.0");
  expect(Parameter.parse(cpb("'-14'"))?.getString()).toBe("-14");
  expect(Parameter.parse(cpb("'-14.0'"))?.getString()).toBe("-14.0");
  expect(Parameter.parse(cpb("3.14h"))?.toString()).toBe("3.14h");
});

test("Parameter Null", () => {
  expect(Parameter.parse(cpb(""))).toBeNull();
});

test("Parameter Equals", () => {
  const p1 = Parameter.parse(cpb("True"));
  const p2 = Parameter.parse(cpb("True"));
  expect(p1?.equals(p2)).toBe(true);
  expect(p2?.equals(p1)).toBe(true); // symmetric
  expect(p1?.equals(p1)).toBe(true); // reflexive
  expect(p2?.equals(p2)).toBe(true); // reflexive
  expect(p1?.equals(null)).toBe(false);
  expect(p1?.equals(new Object())).toBe(false);
  expect(p1?.equals(123)).toBe(false);
  expect(p1?.equals(true)).toBe(false);
  expect(p1?.equals(Parameter.parse(cpb("False")))).toBe(false);
  expect(p1?.equals(Parameter.parse(cpb("123")))).toBe(false);
  expect(p1?.equals(Parameter.parse(cpb("Hello")))).toBe(false);

  const p3 = Parameter.parse(cpb("123"));
  expect(p3?.equals(Parameter.parse(cpb("False")))).toBe(false);
  expect(p3?.equals(Parameter.parse(cpb("123")))).toBe(true);
  expect(p3?.equals(Parameter.parse(cpb("Hello")))).toBe(false);

  const p4 = Parameter.parse(cpb("Hello"));
  expect(p4?.equals(Parameter.parse(cpb("False")))).toBe(false);
  expect(p4?.equals(Parameter.parse(cpb("123")))).toBe(false);
  expect(p4?.equals(Parameter.parse(cpb("Hello")))).toBe(true);
});

test("Parameter Methods", () => {
  const p1 = Parameter.parse(cpb("True"));
  if (!p1) throw new Error("p1 is null");
  expect(p1.isBoolean()).toBe(true);
  expect(p1.isNumber()).toBe(false);
  expect(p1.isDouble()).toBe(false);
  expect(p1.isString()).toBe(false);
  expect(p1.toString()).toBe("true");

  const p2 = Parameter.parse(cpb("123"));
  if (!p2) throw new Error("p2 is null");
  expect(p2.isBoolean()).toBe(false);
  expect(p2.isNumber()).toBe(true);
  expect(p2.isDouble()).toBe(false);
  expect(p2.isString()).toBe(false);
  expect(p2.toString()).toBe("123");

  const p3 = Parameter.parse(cpb("123.456"));
  if (!p3) throw new Error("p3 is null");
  expect(p3.isBoolean()).toBe(false);
  expect(p3.isNumber()).toBe(true);
  expect(p3.isDouble()).toBe(true);
  expect(p3.isString()).toBe(false);
  expect(p3.toString()).toBe("123.456");

  const p4 = Parameter.parse(cpb("'Hello'"));
  if (!p4) throw new Error("p4 is null");
  expect(p4.isBoolean()).toBe(false);
  expect(p4.isNumber()).toBe(false);
  expect(p4.isDouble()).toBe(false);
  expect(p4.isString()).toBe(true);
  expect(p4.toString()).toBe("Hello");
});

test("CommandLine Valid", () => {
  let params: CommandParameter<ParameterType>[] = [];
  expect(CommandLine.parse(cpb("target"))!.name).toBe("target");
  expect(CommandLine.parse(cpb("target "))!.name).toBe("target");
  expect(CommandLine.parse(cpb("  target   "))!.name).toBe("target");
  expect(CommandLine.parse(cpb("target"))!.params).toStrictEqual(params);
  // params.push(CommandParameter.parse(cpb("value1", 6))!);
  params.push(new CommandParameter(new StringT("value1"), 7, 13));
  expect(CommandLine.parse(cpb("target value1"))!.params).toStrictEqual(params);
  // params.push(CommandParameter.parse(cpb("'value2'"))!);
  params.push(new CommandParameter(new StringT("'value2'", "value2"), 14, 22));
  expect(CommandLine.parse(cpb("target value1 'value2'"))!.params).toStrictEqual(params);
  // params.push(CommandParameter.parse(cpb('"value3"'))!);
  params.push(new CommandParameter(new StringT('"value3"', "value3"), 23, 31));
  expect(CommandLine.parse(cpb("target value1 'value2' \"value3\""))!.params).toStrictEqual(params);
  // params.push(CommandParameter.parse(cpb("True"))!);
  params.push(new CommandParameter(new BooleanT("True", true), 32, 36));
  expect(CommandLine.parse(cpb("target value1 'value2' \"value3\" True"))!.params).toStrictEqual(params);
  // params.push(CommandParameter.parse(cpb("False"))!);
  params.push(new CommandParameter(new BooleanT("False", false), 37, 42));
  expect(CommandLine.parse(cpb("target value1 'value2' \"value3\" True False"))!.params).toStrictEqual(params);
  // params.push(CommandParameter.parse(cpb("123"))!);
  params.push(new CommandParameter(new NumberT("123", true, false), 43, 46));
  expect(CommandLine.parse(cpb("target value1 'value2' \"value3\" True False 123"))!.params).toStrictEqual(params);
  // params.push(CommandParameter.parse(cpb("123.456"))!);
  params.push(new CommandParameter(new NumberT("123.456", true, true), 47, 54));
  expect(CommandLine.parse(cpb("target value1 'value2' \"value3\" True False 123 123.456"))!.params).toStrictEqual(
    params
  );
  // params.push(CommandParameter.parse(cpb("-123.456"))!);
  params.push(new CommandParameter(new NumberT("-123.456", false, true), 55, 63));
  expect(
    CommandLine.parse(cpb("target value1 'value2' \"value3\" True False 123 123.456 -123.456"))!.params
  ).toStrictEqual(params);
  // params.push(CommandParameter.parse(cpb("-123"))!);
  params.push(new CommandParameter(new NumberT("-123", false, false), 64, 68));
  expect(
    CommandLine.parse(cpb("target value1 'value2' \"value3\" True False 123 123.456 -123.456 -123"))!.params
  ).toStrictEqual(params);
});

test("CommandLine Null", () => {
  expect(CommandLine.parse(cpb(""))).toBeNull();
  expect(CommandLine.parse(cpb("target '"))).toBeNull();
});

test("Read Safe Chunk", () => {
  expect(cpb("target").readSafeChunk()).toStrictEqual("target");
  expect(cpb("target ").readSafeChunk()).toStrictEqual("target");
  expect(cpb(" target ").readSafeChunk()).toStrictEqual("");
  expect(cpb("target:").readSafeChunk()).toStrictEqual("target");
  expect(cpb(":target").readSafeChunk()).toStrictEqual("");
  expect(cpb("target,").readSafeChunk()).toStrictEqual("target");
  expect(cpb(",target").readSafeChunk()).toStrictEqual("");
});

test("Token", () => {
  let result;
  expect(Token.parse(cpb("target"))).toBeNull();
  expect(BooleanT.parse(cpb("true"))?.equals(BooleanT.parse(cpb("true")))).toBe(true);
});
