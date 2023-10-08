import { validate } from "class-validator";
import { CodePointBuffer, Parameter } from "../token/Tokens";
import { BooleanOption, EnumOption, RangeOption } from "./Option";
import { instanceToPlain, plainToClass } from "class-transformer";

test("BooleanOption getter", () => {
  const option = new BooleanOption("test", true);
  expect(option.key).toBe("test");
  expect(option.defaultValue).toBe(true);
  expect(option.getValue()).toBe(true);
  expect(option.getUsageDescription()).toBe("TRUE | false");
  const option2 = new BooleanOption("test", false);
  expect(option2.defaultValue).toBe(false);
  expect(option2.getValue()).toBe(false);
  expect(option2.getUsageDescription()).toBe("true | FALSE");
});

test("BooleanOption boolean setter", () => {
  const option = new BooleanOption("test", true);
  expect(option.setValue(true).success).toBe(false);
  expect(option.setValue(true).message).toBe("It is already true.");
  expect(option.getUsageDescription()).toBe("TRUE | false");
  const result1 = option.setValue(false);
  expect(result1.success).toBe(true);
  expect(result1.message).toBe('Set "test" from true to false.');
  const result2 = option.setValue(false);
  expect(result2.success).toBe(false);
  expect(result2.message).toBe("It is already false.");
  const result3 = option.setValue(true);
  expect(result3.success).toBe(true);
  expect(result3.message).toBe('Set "test" from false to true.');
  expect(option.getUsageDescription()).toBe("TRUE | false");
});

test("BooleanOption parameter setter", () => {
  const option = new BooleanOption("test", true);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("true"))!).success).toBe(false);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("true"))!).message).toBe("It is already true.");
  expect(option.getUsageDescription()).toBe("TRUE | false");
  const result1 = option.setValue(Parameter.parse(new CodePointBuffer("false"))!);
  expect(result1.success).toBe(true);
  expect(result1.message).toBe('Set "test" from true to false.');
  const result2 = option.setValue(Parameter.parse(new CodePointBuffer("false"))!);
  expect(result2.success).toBe(false);
  expect(result2.message).toBe("It is already false.");
  const result3 = option.setValue(Parameter.parse(new CodePointBuffer("true"))!);
  expect(result3.success).toBe(true);
  expect(result3.message).toBe('Set "test" from false to true.');
  expect(option.getUsageDescription()).toBe("TRUE | false");
  const result4 = option.setValue(Parameter.parse(new CodePointBuffer("1"))!);
  expect(result4.success).toBe(false);
  expect(result4.message).toBe("The value must be a boolean.");
  const result5 = option.setValue(Parameter.parse(new CodePointBuffer("0"))!);
  expect(result5.success).toBe(false);
  expect(result5.message).toBe("The value must be a boolean.");
});

test("EnumOption getter", () => {
  const option = new EnumOption("test", "a", ["a", "b", "c"] as const);
  expect(option.key).toBe("test");
  expect(option.defaultValue).toBe("a");
  expect(option.getValue()).toBe("a");
  expect(option.getUsageDescription()).toBe("A | b | c");
});

test("EnumOption string setter", () => {
  const option = new EnumOption("test", "aaa", ["aaa", "bbb", "ccc", "abc"] as const);
  expect(option.setValue("bbb").success).toBe(true);
  expect(option.getValue()).toBe("bbb");
  expect(option.defaultValue).toBe("aaa");
  expect(option.setValue("bbb").success).toBe(false);
  expect(option.setValue("bbb").message).toBe('It is already "bbb".');
  expect(option.setValue("a").success).toBe(false);
  expect(option.setValue("a").message).toBe('Ambiguous value "a".');
  expect(option.setValue("ddd").success).toBe(false);
  expect(option.setValue("ddd").message).toBe('Unknown value "ddd".');
  expect(option.setValue("abc").message).toBe('Set "test" from "bbb" to "abc".');
  expect(option.setValue("bb").message).toBe('Set "test" from "abc" to "bbb".');
});

test("EnumOption parameter setter", () => {
  const option = new EnumOption("test", "aaa", ["aaa", "bbb", "ccc", "abc"] as const);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("bbb"))!).success).toBe(true);
  expect(option.getValue()).toBe("bbb");
  expect(option.defaultValue).toBe("aaa");
  expect(option.setValue(Parameter.parse(new CodePointBuffer("bbb"))!).success).toBe(false);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("bbb"))!).message).toBe('It is already "bbb".');
  expect(option.setValue(Parameter.parse(new CodePointBuffer("a"))!).success).toBe(false);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("a"))!).message).toBe('Ambiguous value "a".');
  expect(option.setValue(Parameter.parse(new CodePointBuffer("ddd"))!).success).toBe(false);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("ddd"))!).message).toBe('Unknown value "ddd".');
  expect(option.setValue(Parameter.parse(new CodePointBuffer("abc"))!).message).toBe('Set "test" from "bbb" to "abc".');
  expect(option.setValue(Parameter.parse(new CodePointBuffer("bb"))!).message).toBe('Set "test" from "abc" to "bbb".');
  expect(option.setValue(Parameter.parse(new CodePointBuffer("5"))!).success).toBe(false);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("5"))!).message).toBe('The value "5" is not accepted.');
});

test("RangeOption getter", () => {
  const option = new RangeOption("test", 1, 0, 10);
  expect(option.key).toBe("test");
  expect(option.defaultValue).toBe(1);
  expect(option.getValue()).toBe(1);
  expect(option.getUsageDescription()).toBe("min:0 max:10 default:1");
});

test("RangeOption number setter", () => {
  const option = new RangeOption("test", 1, 0, 10);
  expect(option.setValue(5).success).toBe(true);
  expect(option.getValue()).toBe(5);
  expect(option.defaultValue).toBe(1);
  expect(option.setValue(5).success).toBe(false);
  expect(option.setValue(5).message).toBe("It is already 5.");
  const result1 = option.setValue(0);
  expect(result1.message).toBe('Set "test" from 5 to 0.');
  expect(result1.success).toBe(true);
  expect(option.getValue()).toBe(0);
  expect(option.defaultValue).toBe(1);
  const result2 = option.setValue(10);
  expect(result2.message).toBe('Set "test" from 0 to 10.');
  expect(result2.success).toBe(true);
  expect(option.getValue()).toBe(10);
  expect(option.defaultValue).toBe(1);
  const result3 = option.setValue(1);
  expect(result3.message).toBe('Set "test" from 10 to 1.');
  expect(result3.success).toBe(true);
  expect(option.getValue()).toBe(1);
  expect(option.defaultValue).toBe(1);
  const result4 = option.setValue(9);
  expect(result4.message).toBe('Set "test" from 1 to 9.');
  expect(result4.success).toBe(true);
  expect(option.getValue()).toBe(9);
  expect(option.defaultValue).toBe(1);
  const result5 = option.setValue(-1);
  expect(result5.success).toBe(false);
  expect(result5.message).toBe("The value must be between 0 and 10.");
  const result6 = option.setValue(11);
  expect(result6.success).toBe(false);
  expect(result6.message).toBe("The value must be between 0 and 10.");
  const result7 = option.setValue(1.1);
  expect(result7.success).toBe(false);
  expect(result7.message).toBe("The value must be an integer.");
});

test("RangeOption parameter setter", () => {
  const option = new RangeOption("test", 1, 0, 10);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("5"))!).success).toBe(true);
  expect(option.getValue()).toBe(5);
  expect(option.defaultValue).toBe(1);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("5"))!).success).toBe(false);
  expect(option.setValue(Parameter.parse(new CodePointBuffer("5"))!).message).toBe("It is already 5.");
  const result1 = option.setValue(Parameter.parse(new CodePointBuffer("0"))!);
  expect(result1.message).toBe('Set "test" from 5 to 0.');
  expect(result1.success).toBe(true);
  expect(option.getValue()).toBe(0);
  expect(option.defaultValue).toBe(1);
  const result2 = option.setValue(Parameter.parse(new CodePointBuffer("10"))!);
  expect(result2.message).toBe('Set "test" from 0 to 10.');
  expect(result2.success).toBe(true);
  expect(option.getValue()).toBe(10);
  expect(option.defaultValue).toBe(1);
  const result3 = option.setValue(Parameter.parse(new CodePointBuffer("1"))!);
  expect(result3.message).toBe('Set "test" from 10 to 1.');
  expect(result3.success).toBe(true);
  expect(option.getValue()).toBe(1);
  expect(option.defaultValue).toBe(1);
  const result4 = option.setValue(Parameter.parse(new CodePointBuffer("9"))!);
  expect(result4.message).toBe('Set "test" from 1 to 9.');
  expect(result4.success).toBe(true);
  expect(option.getValue()).toBe(9);
  expect(option.defaultValue).toBe(1);
  const result5 = option.setValue(Parameter.parse(new CodePointBuffer("-1"))!);
  expect(result5.success).toBe(false);
  expect(result5.message).toBe("The value must be between 0 and 10.");
  const result6 = option.setValue(Parameter.parse(new CodePointBuffer("11"))!);
  expect(result6.success).toBe(false);
  expect(result6.message).toBe("The value must be between 0 and 10.");
  const result7 = option.setValue(Parameter.parse(new CodePointBuffer("1.1"))!);
  expect(result7.success).toBe(false);
  expect(result7.message).toBe("The value must be an integer.");
  const result8 = option.setValue(Parameter.parse(new CodePointBuffer("a"))!);
  expect(result8.success).toBe(false);
  expect(result8.message).toBe("The value must be an integer.");
});

test("BooleanOption Validation", async () => {
  const bo = new BooleanOption("test", true);
  expect(bo.getValue()).toBe(true);
  expect(bo.key).toBe("test");
  expect(bo.defaultValue).toBe(true);

  expect(await validate(bo)).toHaveLength(0);

  const p = instanceToPlain(bo);
  const bo2 = plainToClass(BooleanOption, p, { excludeExtraneousValues: true, exposeDefaultValues: true });

  expect(await validate(bo2)).toHaveLength(0);
  expect(bo2).toStrictEqual(bo);

  (bo as any).key = 123;
  expect(await validate(bo)).toHaveLength(1);

  (bo as any).key = "";
  expect(await validate(bo)).toHaveLength(1);

  (bo as any).defaultValue = 123;
  expect(await validate(bo)).toHaveLength(2);

  (bo as any).defaultValue = "123";
  expect(await validate(bo)).toHaveLength(2);

  (bo as any).value = 123;
  expect(await validate(bo)).toHaveLength(3);

  (bo as any).value = "123";
  expect(await validate(bo)).toHaveLength(3);
});
