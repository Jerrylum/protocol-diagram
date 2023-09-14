import { Zero, CodePointBuffer, isDelimiter, isSafeDelimiter, BooleanT, DecimalPoint, Digit1To9, Digit, DoubleQuoteString, Frac, Int, Minus, NegativeInt, NumberT, PositiveInt, SingleQuoteString, StringT, Operator, CloseBracket, OpenBracket } from "./Tokens";

function cpb(s: string): CodePointBuffer {
  return new CodePointBuffer(s);
}

test("Test token delimiter methods", () => {
  expect(true).toBe(true);

  Zero.parse(cpb("0"));
});

test('Token delimiter methods', () => {
  expect(isDelimiter(' ')).toBe(true);
  expect(isDelimiter(null)).toBe(true);
  expect(isDelimiter('\'')).toBe(false);
  expect(isSafeDelimiter(null)).toBe(true);
  expect(isSafeDelimiter(' ')).toBe(true);
  expect(isSafeDelimiter(':')).toBe(true);
  expect(isSafeDelimiter(',')).toBe(true);
  expect(isSafeDelimiter('\'')).toBe(false);
});

test('BooleanT valid case', () => {
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

test('BooleanT invalid case', () => {
  expect(BooleanT.parse(cpb(""))).toBeNull();
  expect(BooleanT.parse(cpb("1"))).toBeNull();
  expect(BooleanT.parse(cpb("0"))).toBeNull();
  expect(BooleanT.parse(cpb(" "))).toBeNull();
  expect(BooleanT.parse(cpb(" True"))).toBeNull();
  expect(BooleanT.parse(cpb(""))).toBeNull();
});

test('DecimalPoint valid case', () => {
  expect(new DecimalPoint()).toStrictEqual(DecimalPoint.parse(cpb(".")));
  expect(new DecimalPoint()).toStrictEqual(DecimalPoint.parse(cpb(". ")));
  expect(new DecimalPoint()).toStrictEqual(DecimalPoint.parse(cpb(".a")));
  expect(new DecimalPoint()).toStrictEqual(DecimalPoint.parse(cpb(".123")));
});

test('DecimalPoint invalid case', () => {
  expect(DecimalPoint.parse(cpb(" ."))).toBeNull();
  expect(DecimalPoint.parse(cpb("0"))).toBeNull();
  expect(DecimalPoint.parse(cpb(" "))).toBeNull();
  expect(DecimalPoint.parse(cpb("a"))).toBeNull();
  expect(DecimalPoint.parse(cpb(""))).toBeNull();
  expect(DecimalPoint.parse(cpb("1 "))).toBeNull();
  expect(DecimalPoint.parse(cpb("-1"))).toBeNull();
  expect(DecimalPoint.parse(cpb("1"))).toBeNull();
});

test('Digit1To9 valid case', () => {
  expect(new Digit1To9('1')).toStrictEqual(Digit1To9.parse(cpb("1")));
  expect(new Digit1To9('2')).toStrictEqual(Digit1To9.parse(cpb("2")));
  expect(new Digit1To9('3')).toStrictEqual(Digit1To9.parse(cpb("3")));
  expect(new Digit1To9('4')).toStrictEqual(Digit1To9.parse(cpb("4")));
  expect(new Digit1To9('5')).toStrictEqual(Digit1To9.parse(cpb("5")));
  expect(new Digit1To9('6')).toStrictEqual(Digit1To9.parse(cpb("6")));
  expect(new Digit1To9('7')).toStrictEqual(Digit1To9.parse(cpb("7")));
  expect(new Digit1To9('8')).toStrictEqual(Digit1To9.parse(cpb("8")));
  expect(new Digit1To9('9')).toStrictEqual(Digit1To9.parse(cpb("9")));
  expect(new Digit1To9('1')).toStrictEqual(Digit1To9.parse(cpb("10")));
  expect(new Digit1To9('1')).toStrictEqual(Digit1To9.parse(cpb("1 ")));
});

test('Digit1To9 invalid case', () => {
  expect(Digit1To9.parse(cpb("0"))).toBeNull();
  expect(Digit1To9.parse(cpb(" 1"))).toBeNull();
  expect(Digit1To9.parse(cpb("a"))).toBeNull();
  expect(Digit1To9.parse(cpb("A"))).toBeNull();
  expect(Digit1To9.parse(cpb(""))).toBeNull();
  expect(Digit1To9.parse(cpb("-1"))).toBeNull();
  expect(Digit1To9.parse(cpb(".123"))).toBeNull();
});

test('Digit valid case', () => {
  expect(new Digit('0')).toStrictEqual(Digit.parse(cpb("0")));
  expect(new Digit('1')).toStrictEqual(Digit.parse(cpb("1")));
  expect(new Digit('2')).toStrictEqual(Digit.parse(cpb("2")));
  expect(new Digit('3')).toStrictEqual(Digit.parse(cpb("3")));
  expect(new Digit('4')).toStrictEqual(Digit.parse(cpb("4")));
  expect(new Digit('5')).toStrictEqual(Digit.parse(cpb("5")));
  expect(new Digit('6')).toStrictEqual(Digit.parse(cpb("6")));
  expect(new Digit('7')).toStrictEqual(Digit.parse(cpb("7")));
  expect(new Digit('8')).toStrictEqual(Digit.parse(cpb("8")));
  expect(new Digit('9')).toStrictEqual(Digit.parse(cpb("9")));
  expect(new Digit('1')).toStrictEqual(Digit.parse(cpb("1 ")));
});

test('Digit invalid case', () => {
  expect(Digit.parse(cpb(""))).toBeNull();
  expect(Digit.parse(cpb("-1"))).toBeNull();
  expect(Digit.parse(cpb("a"))).toBeNull();
  expect(Digit.parse(cpb("A"))).toBeNull();
  expect(Digit.parse(cpb(" "))).toBeNull();
  expect(Digit.parse(cpb(" 1"))).toBeNull();
  expect(Digit.parse(cpb(".22"))).toBeNull();
});

test('DoubleQuoteString valid case', () => {
  let t = new DoubleQuoteString("\"test\"", "test");
  expect("\"test\"").toStrictEqual(t.value);
  expect("test").toStrictEqual(t.content);

  expect(new DoubleQuoteString("\"\\\\\"", "\\")).toStrictEqual(DoubleQuoteString.parse(cpb("\"\\\\\""))); // \
  expect(new DoubleQuoteString("\"\\\"\"", "\"")).toStrictEqual(DoubleQuoteString.parse(cpb("\"\\\"\""))); // \"
  expect(new DoubleQuoteString("\"\\\\\\\"\"", "\\\"")).toStrictEqual(DoubleQuoteString.parse(cpb("\"\\\\\\\"\""))); // \\"
  expect(new DoubleQuoteString("\"\\\\\\\\\"", "\\\\")).toStrictEqual(DoubleQuoteString.parse(cpb("\"\\\\\\\\\""))); // \\
  expect(new DoubleQuoteString("\"test\\\\\"", "test\\")).toStrictEqual(DoubleQuoteString.parse(cpb("\"test\\\\\""))); // test\
  expect(new DoubleQuoteString("\"test\\\"\"", "test\"")).toStrictEqual(DoubleQuoteString.parse(cpb("\"test\\\"\""))); // test\"
  expect(new DoubleQuoteString("\"test\\\\\\\"\"", "test\\\"")).toStrictEqual(DoubleQuoteString.parse(cpb("\"test\\\\\\\"\""))); // test\\"
  expect(new DoubleQuoteString("\"\"", "")).toStrictEqual(DoubleQuoteString.parse(cpb("\"\""))); // empty
});

test('DoubleQuoteString invalid case', () => {
  expect(DoubleQuoteString.parse(cpb("test"))).toBeNull(); // no quote
  expect(DoubleQuoteString.parse(cpb(""))).toBeNull();
  expect(DoubleQuoteString.parse(cpb("234"))).toBeNull();
  expect(DoubleQuoteString.parse(cpb("\""))).toBeNull(); // missing end quote
  expect(DoubleQuoteString.parse(cpb("\"test"))).toBeNull();
  expect(DoubleQuoteString.parse(cpb("\"234"))).toBeNull();
});

test('Frac valid case', () => {
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14.15")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14 ")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14abc")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14\\")));
  expect(new Frac(".14")).toStrictEqual(Frac.parse(cpb(".14\'")));
});

test('Frac invalid case', () => {
  expect(Frac.parse(cpb("."))).toBeNull();
  expect(Frac.parse(cpb("14"))).toBeNull();
  expect(Frac.parse(cpb(""))).toBeNull();
  expect(Frac.parse(cpb(" "))).toBeNull();
  expect(Frac.parse(cpb("abc"))).toBeNull();
  expect(Frac.parse(cpb("-123"))).toBeNull();
  expect(Frac.parse(cpb("3.14"))).toBeNull();
});

test('Int valid case', () => {
  expect(new Int("0")).toStrictEqual(Int.parse(cpb("0")));
  expect(new Int("123")).toStrictEqual(Int.parse(cpb("123")));
  expect(new Int("0")).toStrictEqual(Int.parse(cpb("0 ")));
  expect(new Int("123")).toStrictEqual(Int.parse(cpb("123 ")));
  expect(new Int("0")).toStrictEqual(Int.parse(cpb("0.16")));
  expect(new Int("3")).toStrictEqual(Int.parse(cpb("3.14")));
});

test('Int invalid case', () => {
  expect(Int.parse(cpb("abc"))).toBeNull();
  expect(Int.parse(cpb(""))).toBeNull();
  expect(Int.parse(cpb(" "))).toBeNull();
  expect(Int.parse(cpb(".14"))).toBeNull();
});

test('Minus valid case', () => {
  expect(new Minus()).toStrictEqual(Minus.parse(cpb("-")));
  expect(new Minus()).toStrictEqual(Minus.parse(cpb("- ")));
});

test('Minus invalid case', () => {
  expect(Minus.parse(cpb(""))).toBeNull();
  expect(Minus.parse(cpb("0"))).toBeNull();
  expect(Minus.parse(cpb(" -"))).toBeNull();
  expect(Minus.parse(cpb("a"))).toBeNull();
  expect(Minus.parse(cpb("1"))).toBeNull();
  expect(Minus.parse(cpb("a-"))).toBeNull();
  expect(Minus.parse(cpb("1-"))).toBeNull();
});

test('NegativeInt valid case', () => {
  expect(new NegativeInt("-123")).toStrictEqual(NegativeInt.parse(cpb("-123")));
  expect(new NegativeInt("-123")).toStrictEqual(NegativeInt.parse(cpb("-123abc")));
  expect(new NegativeInt("-123")).toStrictEqual(NegativeInt.parse(cpb("-123 ")));
  expect(new NegativeInt("-123")).toStrictEqual(NegativeInt.parse(cpb("-123 456")));
  expect(new NegativeInt("-3")).toStrictEqual(NegativeInt.parse(cpb("-3.14")));
});

test('NegativeInt invalid case', () => {
  expect(NegativeInt.parse(cpb("abc"))).toBeNull();
  expect(NegativeInt.parse(cpb(""))).toBeNull();
  expect(NegativeInt.parse(cpb("123"))).toBeNull();
  expect(NegativeInt.parse(cpb("0123"))).toBeNull();
  expect(NegativeInt.parse(cpb(".14"))).toBeNull();
});

test('NumberT valid case', () => {
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
  expect(new NumberT("14", true, false)).toStrictEqual(NumberT.parse(cpb("14\'")));
  expect(new NumberT("14", true, false)).toStrictEqual(NumberT.parse(cpb("14\"")));
  expect(new NumberT("14", true, false)).toStrictEqual(NumberT.parse(cpb("14 ")));
  expect(new NumberT("-14", false, false)).toStrictEqual(NumberT.parse(cpb("-14\\")));
  expect(new NumberT("-14", false, false)).toStrictEqual(NumberT.parse(cpb("-14\'")));
  expect(new NumberT("-14", false, false)).toStrictEqual(NumberT.parse(cpb("-14\"")));
  expect(new NumberT("-14", false, false)).toStrictEqual(NumberT.parse(cpb("-14 ")));
  expect(new NumberT("3.14", true, true)).toStrictEqual(NumberT.parse(cpb("3.14\\")));
  expect(new NumberT("3.14", true, true)).toStrictEqual(NumberT.parse(cpb("3.14\'")));
  expect(new NumberT("3.14", true, true)).toStrictEqual(NumberT.parse(cpb("3.14\"")));
  expect(new NumberT("3.14", true, true)).toStrictEqual(NumberT.parse(cpb("3.14 ")));
  expect(new NumberT("-3.14", false, true)).toStrictEqual(NumberT.parse(cpb("-3.14\\")));
  expect(new NumberT("-3.14", false, true)).toStrictEqual(NumberT.parse(cpb("-3.14\'")));
  expect(new NumberT("-3.14", false, true)).toStrictEqual(NumberT.parse(cpb("-3.14\"")));
  expect(new NumberT("-3.14", false, true)).toStrictEqual(NumberT.parse(cpb("-3.14 ")));
});

test('NumberT invalid case', () => {
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

test('PositiveInt valid case', () => {
  expect(new PositiveInt("123")).toStrictEqual(PositiveInt.parse(cpb("123")));
  expect(new PositiveInt("123")).toStrictEqual(PositiveInt.parse(cpb("123abc")));
  expect(new PositiveInt("123")).toStrictEqual(PositiveInt.parse(cpb("123 ")));
  expect(new PositiveInt("123")).toStrictEqual(PositiveInt.parse(cpb("123 456")));
  expect(new PositiveInt("3")).toStrictEqual(PositiveInt.parse(cpb("3.14")));
});

test('PositiveInt invalid case', () => {
  expect(PositiveInt.parse(cpb("abc"))).toBeNull();
  expect(PositiveInt.parse(cpb(""))).toBeNull();
  expect(PositiveInt.parse(cpb("-1"))).toBeNull();
  expect(PositiveInt.parse(cpb("0123"))).toBeNull();
  expect(PositiveInt.parse(cpb(".14"))).toBeNull();
});

test('SingleQuoteString valid case', () => {
  expect(new SingleQuoteString("'\\\\'", "\\")).toStrictEqual(SingleQuoteString.parse(cpb("'\\\\'"))); // \
  expect(new SingleQuoteString("'\\''", "'")).toStrictEqual(SingleQuoteString.parse(cpb("'\\''"))); // '
  expect(new SingleQuoteString("'\\\\\\''", "\\'")).toStrictEqual(SingleQuoteString.parse(cpb("'\\\\\\''"))); // \'
  expect(new SingleQuoteString("'\\\\\\\\'", "\\\\")).toStrictEqual(SingleQuoteString.parse(cpb("'\\\\\\\\'"))); // \\
  expect(new SingleQuoteString("'test\\\\'", "test\\")).toStrictEqual(SingleQuoteString.parse(cpb("'test\\\\'"))); // test\
  expect(new SingleQuoteString("'test\\''", "test'")).toStrictEqual(SingleQuoteString.parse(cpb("'test\\''"))); // test'
  expect(new SingleQuoteString("'test\\\\\\''", "test\\'")).toStrictEqual(SingleQuoteString.parse(cpb("'test\\\\\\''"))); // test\'
  expect(new SingleQuoteString("''", "")).toStrictEqual(SingleQuoteString.parse(cpb("''"))); // empty
});

test('SingleQuoteString invalid case', () => {
  expect(SingleQuoteString.parse(cpb("test"))).toBeNull(); // no quote
  expect(SingleQuoteString.parse(cpb(""))).toBeNull();
  expect(SingleQuoteString.parse(cpb("234"))).toBeNull();
  expect(SingleQuoteString.parse(cpb("'"))).toBeNull(); // missing end quote
  expect(SingleQuoteString.parse(cpb("'test"))).toBeNull();
  expect(SingleQuoteString.parse(cpb("'234"))).toBeNull();
});

test('StringT valid case', () => {
  expect(new StringT("test")).toStrictEqual(StringT.parse(cpb("test")));// test
  expect(new StringT("")).toStrictEqual(StringT.parse(cpb(" ")));// empty
  expect(new StringT("test")).toStrictEqual(StringT.parse(cpb("test test")));// test
  expect(new StringT("test")).toStrictEqual(StringT.parse(cpb("'test'"))); // 'test'
  expect(new StringT("test")).toStrictEqual(StringT.parse(cpb("\"test\""))); // "test"
  expect(new StringT("\\")).toStrictEqual(StringT.parse(cpb("'\\\\'"))); // '\\'
  expect(new StringT("'")).toStrictEqual(StringT.parse(cpb("'\\''"))); // '\''
  expect(new StringT("\\")).toStrictEqual(StringT.parse(cpb("\"\\\\\""))); // "\\"
  expect(new StringT("\"")).toStrictEqual(StringT.parse(cpb("'\\\"'"))); // '\"'
  expect(new StringT("\\test")).toStrictEqual(StringT.parse(cpb("'\\\\test'"))); // '\\test'
  expect(new StringT("\\test")).toStrictEqual(StringT.parse(cpb("\"\\\\test\""))); // "\\test"
});

test('StringT invalid case', () => {
  expect(StringT.parse(cpb(""))).toBeNull(); // empty
  expect(StringT.parse(cpb("'"))).toBeNull(); // '
  expect(StringT.parse(cpb("\""))).toBeNull(); // "
  expect(StringT.parse(cpb("'test"))).toBeNull();// 'test
  expect(StringT.parse(cpb("\"test"))).toBeNull();// "test
  expect(StringT.parse(cpb("'test\""))).toBeNull();// 'test"
  expect(StringT.parse(cpb("\"test'"))).toBeNull();// "test'
});

test('Zero valid case', () => {
  expect(new Zero('0')).toStrictEqual(Zero.parse(cpb("0")));
  expect(new Zero('0')).toStrictEqual(Zero.parse(cpb("0 ")));
});

test('Zero invalid case', () => {
  expect(Zero.parse(cpb("1"))).toBeNull();
  expect(Zero.parse(cpb("a"))).toBeNull();
  expect(Zero.parse(cpb(" "))).toBeNull();
  expect(Zero.parse(cpb(""))).toBeNull();
  expect(Zero.parse(cpb("-"))).toBeNull();
  expect(Zero.parse(cpb(" 0"))).toBeNull();
});

function o(o: string) {
  return new Operator(o);
}



test('OpenBracket valid case', () => {
  expect(new OpenBracket()).toStrictEqual(OpenBracket.parse(cpb("(")));
  expect(new OpenBracket()).toStrictEqual(OpenBracket.parse(cpb("( ")));
  expect(new OpenBracket()).toStrictEqual(OpenBracket.parse(cpb("((")));
});

test('OpenBracket invalid case', () => {
  expect(OpenBracket.parse(cpb(")"))).toBeNull();
  expect(OpenBracket.parse(cpb(") "))).toBeNull();
});

test('CloseBracket valid case', () => {
  expect(new OpenBracket()).not.toStrictEqual(CloseBracket.parse(cpb(")")));
  expect(new CloseBracket()).toStrictEqual(CloseBracket.parse(cpb(")")));
  expect(new CloseBracket()).toStrictEqual(CloseBracket.parse(cpb(") ")));
});

test('CloseBracket invalid case', () => {
  expect(CloseBracket.parse(cpb("("))).toBeNull();
  expect(CloseBracket.parse(cpb("( "))).toBeNull();
});


const ob = new OpenBracket();
const cb = new CloseBracket();



