import { CodePointBuffer, Parameter } from "../token/Tokens";
import { BooleanOption, EnumOption } from "./Option";

test('BooleanOption Get', () => {
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

test('BooleanOption Set Boolean', () => {
    const option = new BooleanOption("test", true);
    expect(option.setValue(true).success).toBe(false);
    expect(option.setValue(true).message).toBe("It is already true.");
    expect(option.getUsageDescription()).toBe("TRUE | false");
    const result1 = option.setValue(false);
    expect(result1.success).toBe(true);
    expect(result1.message).toBe("Set \"test\" from true to false.");
    const result2 = option.setValue(false);
    expect(result2.success).toBe(false);
    expect(result2.message).toBe("It is already false.");
    const result3 = option.setValue(true);
    expect(result3.success).toBe(true);
    expect(result3.message).toBe("Set \"test\" from false to true.");
    expect(option.getUsageDescription()).toBe("TRUE | false");
});

test('BooleanOption Set Parameter', () => {
    const option = new BooleanOption("test", true);
    expect(option.setValue(Parameter.parse(new CodePointBuffer("true"))!).success).toBe(false);
    expect(option.setValue(Parameter.parse(new CodePointBuffer("true"))!).message).toBe("It is already true.");
    expect(option.getUsageDescription()).toBe("TRUE | false");
    const result1 = option.setValue(Parameter.parse(new CodePointBuffer("false"))!);
    expect(result1.success).toBe(true);
    expect(result1.message).toBe("Set \"test\" from true to false.");
    const result2 = option.setValue(Parameter.parse(new CodePointBuffer("false"))!);
    expect(result2.success).toBe(false);
    expect(result2.message).toBe("It is already false.");
    const result3 = option.setValue(Parameter.parse(new CodePointBuffer("true"))!);
    expect(result3.success).toBe(true);
    expect(result3.message).toBe("Set \"test\" from false to true.");
    expect(option.getUsageDescription()).toBe("TRUE | false");
    const result4 = option.setValue(Parameter.parse(new CodePointBuffer("1"))!);
    expect(result4.success).toBe(false);
    expect(result4.message).toBe("The value must be a boolean.");
    const result5 = option.setValue(Parameter.parse(new CodePointBuffer("0"))!);
    expect(result5.success).toBe(false);
    expect(result5.message).toBe("The value must be a boolean.");
});

test('EnumOption Get', () => {
    const option = new EnumOption("test", "a", ["a", "b", "c"]);
    expect(option.key).toBe("test");
    expect(option.defaultValue).toBe("a");
    expect(option.getValue()).toBe("a");
    expect(option.getUsageDescription()).toBe("A | b | c");
});

test('EnumOption Set String', () => {
    const option = new EnumOption("test", "aaa", ["aaa", "bbb", "ccc", "abc"]);
    expect(option.setValue("bbb").success).toBe(true);
    expect(option.getValue()).toBe("bbb");
    expect(option.defaultValue).toBe("aaa");
    expect(option.setValue("bbb").success).toBe(false);
    expect(option.setValue("bbb").message).toBe("It is already \"bbb\".");
    expect(option.setValue("a").success).toBe(false);
    expect(option.setValue("a").message).toBe("Ambiguous value \"a\".");
    expect(option.setValue("ddd").success).toBe(false);
    expect(option.setValue("ddd").message).toBe("Unknown value \"ddd\".");
    expect(option.setValue("abc").message).toBe("Set \"test\" from \"bbb\" to \"abc\".");
    expect(option.setValue("bb").message).toBe("Set \"test\" from \"abc\" to \"bbb\".");
});

test('EnumOption Set Parameter', () => {
    const option = new EnumOption("test", "aaa", ["aaa", "bbb", "ccc", "abc"]);
    expect(option.setValue(Parameter.parse(new CodePointBuffer("bbb"))!).success).toBe(true);
    expect(option.getValue()).toBe("bbb");
    expect(option.defaultValue).toBe("aaa");
    expect(option.setValue(Parameter.parse(new CodePointBuffer("bbb"))!).success).toBe(false);
    expect(option.setValue(Parameter.parse(new CodePointBuffer("bbb"))!).message).toBe("It is already \"bbb\".");
    expect(option.setValue(Parameter.parse(new CodePointBuffer("a"))!).success).toBe(false);
    expect(option.setValue(Parameter.parse(new CodePointBuffer("a"))!).message).toBe("Ambiguous value \"a\".");
    expect(option.setValue(Parameter.parse(new CodePointBuffer("ddd"))!).success).toBe(false);
    expect(option.setValue(Parameter.parse(new CodePointBuffer("ddd"))!).message).toBe("Unknown value \"ddd\".");
    expect(option.setValue(Parameter.parse(new CodePointBuffer("abc"))!).message).toBe("Set \"test\" from \"bbb\" to \"abc\".");
    expect(option.setValue(Parameter.parse(new CodePointBuffer("bb"))!).message).toBe("Set \"test\" from \"abc\" to \"bbb\".");
    expect(option.setValue(Parameter.parse(new CodePointBuffer("5"))!).success).toBe(false);
    expect(option.setValue(Parameter.parse(new CodePointBuffer("5"))!).message).toBe("The value \"5\" is not accepted.");
});
