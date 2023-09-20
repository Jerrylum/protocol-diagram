import { Parameter, ParameterType } from "../token/Tokens";
import { Configuration } from "./Configuration";
import { BooleanOption, EnumOption, RangeOption, Option, OptionType } from "./Option";
import { cpb } from "../token/Tokens.test";

function mp(s: OptionType): Parameter<ParameterType> {
    return Parameter.parse(cpb(s.toString()))!;
}

test("Configuration getter", () => {
    const bo = new BooleanOption("testbo1", true);
    const bo2 = new BooleanOption("testbo2", false);
    const eo = new EnumOption("testeo", "aaa", ["aaa", "bbb", "ccc", "abc"] as const);
    const ro = new RangeOption("testro1", 1, 1, 10);
    const ro2 = new RangeOption("testro2", -1, -1, 10);
    const lstOption: Option<OptionType>[] = [bo, bo2, eo, ro, ro2];
    const c: Configuration = new Configuration(lstOption);
    expect(c.options).toStrictEqual(lstOption);
    expect(c.getValue("testbo1")).toBe(true);
    expect(c.getValue("testbo2")).toBe(false);
    expect(c.getValue("testeo")).toBe("aaa");
    expect(c.getValue("testro1")).toBe(1);
    expect(c.getValue("testro2")).toBe(-1);
    expect(c.getValue("null")).toBe(null);
    expect(c.getOption("testbo1")).toBe(bo);
    expect(c.getOption("testbo2")).toBe(bo2);
    expect(c.getOption("testeo")).toBe(eo);
    expect(c.getOption("testro1")).toBe(ro);
    expect(c.getOption("testro2")).toBe(ro2);
    expect(c.getOption("null")).toBe(null);
    expect(c.getOption("tes")).toBe(null);
});

test("Configuration setter", () => {
    const bo = new BooleanOption("testbo1", true);
    const bo2 = new BooleanOption("testbo2", false);
    const eo = new EnumOption("testeo", "aaa", ["aaa", "bbb", "ccc", "abc"] as const);
    const ro = new RangeOption("testro1", 1, 1, 10);
    const c: Configuration = new Configuration([bo, bo2, eo, ro]);
    expect(c.setValue("testbo1", mp(false)).success).toBe(true);
    expect(c.setValue("testbo2", mp(true)).success).toBe(true);
    expect(c.setValue("testeo", mp("bbb")).success).toBe(true);
    expect(c.setValue("testro1", mp(5)).success).toBe(true);
    expect(c.setValue("null", mp(5)).success).toBe(false);
    expect(c.setValue("testbo1", mp(false)).message).toBe('It is already false.');
    expect(c.setValue("testbo2", mp(true)).message).toBe('It is already true.');
    expect(c.setValue("testeo", mp("bbb")).message).toBe('It is already "bbb".');
    expect(c.setValue("testro1", mp(5)).message).toBe('It is already 5.');
    expect(c.setValue("testbo1", mp(true)).message).toBe('Set "testbo1" from false to true.');
    expect(c.setValue("testbo2", mp(false)).message).toBe('Set "testbo2" from true to false.');
    expect(c.setValue("testeo", mp("ccc")).message).toBe('Set "testeo" from "bbb" to "ccc".');
    expect(c.setValue("testro1", mp(10)).message).toBe('Set "testro1" from 5 to 10.');
    expect(c.setValue("testro1", mp(1)).message).toBe('Set "testro1" from 10 to 1.');
    expect(c.setValue("testro1", mp(11)).message).toBe('The value must be between 1 and 10.');
    expect(c.setValue("testro1", mp(0)).message).toBe('The value must be between 1 and 10.');
});
