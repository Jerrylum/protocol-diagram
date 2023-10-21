import { validate } from "class-validator";
import {
  convertFieldsToRow,
  Diagram,
  DIAGRAM_STYLES,
  generateHeader,
  HEADER_STYLES,
  isDiagramModifier,
  spliceDividers
} from "./Diagram";
import { Field } from "./Field";
import { Element, MatrixLike, VisibleSetting } from "./render/Element";
import { RowSegment, RowTail, Segment } from "./render/Segment";
import { Divider, Row } from "./render/SegmentGroup";
import { instanceToPlain, plainToClass } from "class-transformer";
import { Configuration } from "../config/Configuration";
import { BooleanOption, EnumOption, RangeOption } from "../config/Option";

test("isDiagramModifier", () => {
  expect(isDiagramModifier(null)).toBe(false);
  expect(isDiagramModifier(undefined)).toBe(false);
  expect(isDiagramModifier({})).toBe(false);
  expect(isDiagramModifier({ discriminator: "anything" })).toBe(false);
  expect(isDiagramModifier({ discriminator: "DiagramModifier" })).toBe(true);
});

test("Diagram add field", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  expect(dtest.getField(0).name).toBe("testadd");
  expect(dtest.getField(1).name).toBe("testadd2");
  expect(dtest.getField(2).name).toBe("testadd3");
  expect(dtest.getField(0).length).toBe(1);
  expect(dtest.getField(1).length).toBe(2);
  expect(dtest.getField(2).length).toBe(3);
  expect(dtest.size()).toBe(3);
});

test("Diagram delete field", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  dtest.removeField(1);
  expect(dtest.getField(0).name).toBe("testadd");
  expect(dtest.getField(1).name).toBe("testadd3");
  expect(dtest.getField(0).length).toBe(1);
  expect(dtest.getField(1).length).toBe(3);
  expect(dtest.size()).toBe(2);
  dtest.removeField(0);
  expect(dtest.getField(0).name).toBe("testadd3");
  expect(dtest.getField(0).length).toBe(3);
  expect(dtest.size()).toBe(1);
  dtest.removeField(0);
  expect(dtest.size()).toBe(0);
});

test("Diagram insert field", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  dtest.insertField(1, new Field("testadd4", 4));
  expect(dtest.getField(0).name).toBe("testadd");
  expect(dtest.getField(1).name).toBe("testadd4");
  expect(dtest.getField(2).name).toBe("testadd2");
  expect(dtest.getField(3).name).toBe("testadd3");
  expect(dtest.getField(0).length).toBe(1);
  expect(dtest.getField(1).length).toBe(4);
  expect(dtest.getField(2).length).toBe(2);
  expect(dtest.getField(3).length).toBe(3);
  expect(dtest.size()).toBe(4);
});

test("Diagram move field", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  dtest.moveField(0, 2);
  expect(dtest.getField(0).name).toBe("testadd2");
  expect(dtest.getField(1).name).toBe("testadd3");
  expect(dtest.getField(2).name).toBe("testadd");
  expect(dtest.getField(0).length).toBe(2);
  expect(dtest.getField(1).length).toBe(3);
  expect(dtest.getField(2).length).toBe(1);
  expect(dtest.size()).toBe(3);
});

test("Diagram clear", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  dtest.addField(new Field("testadd2", 2));
  dtest.addField(new Field("testadd3", 3));
  dtest.clear();
  expect(dtest.size()).toBe(0);
});

test("convertFieldsToRow", () => {
  let result: Row[] = [];

  result = convertFieldsToRow(32, [], false);
  expect(result.length).toBe(0); // has 0 row

  result = convertFieldsToRow(32, [new Field("test", 8)], false);
  expect(result.length).toBe(1); // has 1 row
  expect(result[0].bit).toBe(32); // row bit is 32
  expect(result[0].used).toBe(32); // row used is 32

  result = convertFieldsToRow(32, [new Field("test", 8), new Field("test", 8), new Field("test", 24)], false);
  expect(result.length).toBe(2); // has 2 row
  expect(result[0].bit).toBe(32); // row bit is 32
  expect(result[0].used).toBe(32); // row used is 32
  expect(result[0].count).toBe(3); // row has 3 segments
  expect(result[0].segments.length).toBe(3); // row has 3 segments
  expect(result[0].get(2)).toBe(result[0].segments[2]); // row has 3 segments
  expect(result[0].get(2) instanceof RowSegment).toBeTruthy();
  expect(result[1].bit).toBe(32); // row bit is 32
  expect(result[1].used).toBe(32); // row used is 32
  expect(result[1].count).toBe(2); // row has 2 segments
  expect(result[1].segments.length).toBe(2); // row has 2 segments
  expect(result[1].get(0)).toBe(result[1].segments[0]); // row has 2 segments
  expect(result[1].get(0) instanceof RowSegment).toBeTruthy();
  expect(result[1].get(1) instanceof RowTail).toBeTruthy();
});

test("spliceDividers", () => {
  const r1 = new Row(32);
  const r2 = new Row(32);
  r1.addField(new Field("test1", 8));
  r1.addField(new Field("test2", 24));
  r2.addField(new Field("test3", 24));
  r2.addField(new Field("test4", 8));

  let result: Divider[] = [];
  let expected: Divider;

  result = spliceDividers(32, [r1, r2]);
  expected = new Divider(32);
  expected.addSplice(r1.get(0)!, r2.get(0)!);
  expected.addSplice(r2.get(0)!, r1.get(1)!);
  expected.addSplice(r1.get(1)!, r2.get(1)!);

  expect(result.length).toBe(3);
  expect(result[1].segments.length).toBe(3);
  expect(expected).toStrictEqual(result[1]);

  /////////////////////////

  const r3 = new Row(32);
  const r4 = new Row(32);
  r3.addField(new Field("test1", 24));
  r3.addField(new Field("test2", 8));
  r4.addField(new Field("test3", 8));
  r4.addField(new Field("test4", 24));

  result = spliceDividers(32, [r3, r4]);
  expected = new Divider(32);
  expected.addSplice(r4.get(0)!, r3.get(0)!);
  expected.addSplice(r3.get(0)!, r4.get(1)!);
  expected.addSplice(r3.get(1)!, r4.get(1)!);

  expect(result.length).toBe(3);
  expect(result[1].segments.length).toBe(3);
  expect(expected).toStrictEqual(result[1]);

  /////////////////////////

  const r5 = new Row(32);
  const r6 = new Row(32);
  r5.addField(new Field("test1", 16));
  r5.addField(new Field("test2", 16));
  r6.addField(new Field("test3", 16));
  r6.addField(new Field("test4", 16));

  result = spliceDividers(32, [r5, r6]);
  expected = new Divider(32);
  expected.addSplice(r5.get(0)!, r6.get(0)!);
  expected.addSplice(r5.get(1)!, r6.get(1)!);

  expect(result.length).toBe(3);
  expect(result[1].segments.length).toBe(2);
  expect(expected).toStrictEqual(result[1]);

  /////////////////////////

  const r7 = new Row(32);
  const r8 = new Row(32);
  r7.addField(new Field("test1", 8));
  r7.addField(new Field("test2", 24));
  r8.addField(new Field("test3", 32));

  result = spliceDividers(32, [r7, r8]);
  expected = new Divider(32);
  expected.addSplice(r7.get(0)!, r8.get(0)!);
  expected.addSplice(r7.get(1)!, r8.get(0)!);

  expect(result.length).toBe(3);
  expect(result[1].segments.length).toBe(2);
  expect(expected).toStrictEqual(result[1]);

  /////////////////////////

  const r9 = new Row(32);
  r9.addField(new Field("test1", 32));

  result = spliceDividers(32, [r9]);

  expect(result.length).toBe(2);
  expect(result[0].segments.length).toBe(1);
  expect(result[1].segments.length).toBe(1);

  /////////////////////////

  const r11 = new Row(32);
  const r12 = new Row(32);

  r11.addField(new Field("test1", 32));
  r12.addField(new Field("test2", 24));
  r12.addField(new Field("test3", 8));

  result = spliceDividers(32, [r11, r12]);
  expected = new Divider(32);
  expected.addSplice(r12.get(0)!, r11.get(0)!);
  expected.addSplice(r11.get(0)!, r12.get(1)!);

  expect(result.length).toBe(3);
  expect(result[1].segments.length).toBe(2);
  expect(expected).toStrictEqual(result[1]);

  /////////////////////////

  const r13 = new Row(32);
  const r14 = new Row(32);

  r13.addField(new Field("test1", 32));
  r14.addField(new Field("test2", 32));

  result = spliceDividers(32, [r13, r14]);
  expected = new Divider(32);
  expected.addSplice(r13.get(0)!, r14.get(0)!);

  expect(result.length).toBe(3);
  expect(result[1].segments.length).toBe(1);
  expect(expected).toStrictEqual(result[1]);
});

class VisibleSettingTestStub extends Element implements VisibleSetting {
  constructor(isVisible: boolean) {
    super();
    this.isVisible = isVisible;
  }
  process(m: MatrixLike, x: number, y: number): void {
    return;
  }
  isVisible: boolean;
}

class SegmentTestStub extends Segment {
  constructor(represent: Field, start: number, length: number) {
    super(represent, start, length);
  }
  process(): void {
    return;
  }
}

test("generateHeader", () => {
  const elementList: Element[] = [];
  const ivt = new VisibleSettingTestStub(true);
  const st = new SegmentTestStub(new Field("test", 8), 0, 8);
  elementList.push(ivt);
  elementList.push(st);
  expect(generateHeader(elementList, 32, "anything" as any)).toBe("");
  const rs = new SegmentTestStub(new Field("test", 8), 0, 8);
  elementList.push(rs);
  expect(generateHeader(elementList, 32, "none")).toBe("");
});

test("Diagram render", () => {
  const dtest = new Diagram();
  dtest.addField(new Field("testadd", 1));
  expect(dtest.toString()).toBe(` 0
 0
┌─┐                                                              
│t│                                                              
└─┘                                                              
`);
  dtest.addField(new Field("testadd2", 2));
  expect(dtest.toString()).toBe(` 0    
 0 1 2
┌─┬───┐                                                          
│t│tes│                                                          
└─┴───┘                                                          
`);
  dtest.addField(new Field("testadd3", 3));
  expect(dtest.toString()).toBe(` 0          
 0 1 2 3 4 5
┌─┬───┬─────┐                                                    
│t│tes│testa│                                                    
└─┴───┴─────┘                                                    
`);
  dtest.clear();
  dtest.addField(new Field("testadd", 64));
  expect(dtest.toString()).toBe(` 0                   1                   2                   3  
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                            testadd                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
`);
  dtest.config.getOption("bit")?.setValue(64);
  expect(dtest.toString())
    .toBe(` 0                   1                   2                   3                   4                   5                   6      
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                            testadd                                                            │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
`);
  dtest.config.getOption("bit")?.setValue(32);
  dtest.config.getOption("diagram-style")?.setValue("utf8-header");
  expect(dtest.toString()).toBe(` 0                   1                   2                   3  
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                            testadd                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
`);
  dtest.config.getOption("diagram-style")?.setValue("utf8-corner");
  expect(dtest.toString()).toBe(` 0                   1                   2                   3  
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
┼───────────────────────────────────────────────────────────────┼
│                                                               │
│                            testadd                            │
│                                                               │
┼───────────────────────────────────────────────────────────────┼
`);
  dtest.config.getOption("diagram-style")?.setValue("ascii");
  expect(dtest.toString()).toBe(` 0                   1                   2                   3  
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+---------------------------------------------------------------+
|                                                               |
|                            testadd                            |
|                                                               |
+---------------------------------------------------------------+
`);
  dtest.config.getOption("diagram-style")?.setValue("ascii-verbose");
  expect(dtest.toString()).toBe(` 0                   1                   2                   3  
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
|                            testadd                            |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
`);
  dtest.config.getOption("diagram-style")?.setValue("utf8");
  dtest.config.getOption("header-style")?.setValue("none");
  expect(dtest.toString()).toBe(`┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                            testadd                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
`);
  dtest.config.getOption("header-style")?.setValue("full");
  expect(dtest.toString()).toBe(` 0                   1                   2                   3  
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                            testadd                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
`);
  dtest.config.getOption("header-style")?.setValue("trim");
  dtest.clear();
  dtest.addField(new Field("testadd", 16));
  dtest.config.getOption("left-space-placeholder")?.setValue(true);
  expect(dtest.toString()).toBe(` 0                   1                   2                   3  
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
┌───────────────────────────────┐                                
│            testadd            ├────────────Reserved───────────┤
└───────────────────────────────┘                                
`);
  dtest.clear();
  dtest.config.getOption("diagram-style")?.setValue("ascii");
  dtest.addField(new Field("a", 16));
  dtest.addField(new Field("a", 16));
  dtest.addField(new Field("a", 16));
  expect(dtest.toString()).toBe(` 0                   1                   2                   3  
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-------------------------------+-------------------------------+
|               a               |               a               |
+-------------------------------+-------------------------------+
|               a               +------------Reserved-----------+
+-------------------------------+                                
`);
  dtest.config.getOption("left-space-placeholder")?.setValue(false);
  dtest.config.getOption("diagram-style")?.setValue("ascii-verbose");
  expect(dtest.toString()).toBe(` 0                   1                   2                   3  
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|               a               |               a               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|               a               |                                
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+                                
`);
});

test("Diagram Validation", async () => {
  const d = new Diagram();
  expect(await validate(d)).toHaveLength(0);

  const p = instanceToPlain(d);
  const d2 = plainToClass(Diagram, p, { excludeExtraneousValues: true, exposeDefaultValues: true });

  expect(await validate(d2)).toHaveLength(0);

  (d2 as any)._fields = "asd";
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any)._fields = 123;
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any)._fields = [123];
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any)._fields = {};
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any)._fields = null;
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any)._fields = undefined;
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any)._fields = [];
  expect(await validate(d2)).toHaveLength(0);
  (d2 as any)._fields = [new Field("test", 1)];
  expect(await validate(d2)).toHaveLength(0);

  (d2 as any).config = "asd";
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any).config = 123;
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any).config = [123];
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any).config = null;
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any).config = undefined;
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any).config = [];
  expect(await validate(d2)).toHaveLength(1);
  (d2 as any).config = new Configuration();
  expect(await validate(d2)).toHaveLength(1);

  const testd = plainToClass(Diagram, {}, { excludeExtraneousValues: true, exposeDefaultValues: true });
  expect(await validate(testd)).toHaveLength(0);

  const testd2 = plainToClass(Diagram, [], { excludeExtraneousValues: true, exposeDefaultValues: false }); // need instanceof Diagram
  expect(await validate(testd2)).toHaveLength(0);

  (d as any).config = new Configuration(
    new EnumOption("bit", "utf8", DIAGRAM_STYLES),
    new RangeOption("diagram-style", 32, 1, 128),
    new RangeOption("header-style", 32, 1, 128),
    new EnumOption("left-space-placeholder", "utf8", DIAGRAM_STYLES)
  );

  expect(await validate(d)).toHaveLength(1);

  (d as any).config = new Configuration(
    new RangeOption("bit", 32, 1, 128),
    new RangeOption("diagram-style", 32, 1, 128),
    new RangeOption("header-style", 32, 1, 128),
    new EnumOption("left-space-placeholder", "utf8", DIAGRAM_STYLES)
  );

  expect(await validate(d)).toHaveLength(1);

  (d as any).config = new Configuration(
    new RangeOption("bit", 32, 1, 128),
    new EnumOption("diagram-style", "utf8", DIAGRAM_STYLES),
    new RangeOption("header-style", 32, 1, 128),
    new EnumOption("left-space-placeholder", "utf8", DIAGRAM_STYLES)
  );

  expect(await validate(d)).toHaveLength(1);

  (d as any).config = new Configuration(
    new RangeOption("bit", 32, 1, 128),
    new EnumOption("diagram-style", "utf8", DIAGRAM_STYLES),
    new EnumOption("header-style", "trim", HEADER_STYLES),
    new EnumOption("left-space-placeholder", "utf8", DIAGRAM_STYLES)
  );

  expect(await validate(d)).toHaveLength(1);

  (d as any).config = new Configuration(
    new RangeOption("bit", 32, 1, 128),
    new EnumOption("diagram-style", "utf8", DIAGRAM_STYLES),
    new EnumOption("header-style", "trim", HEADER_STYLES),
    new BooleanOption("left-space-placeholder", false)
  );

  expect(await validate(d)).toHaveLength(0);
});

test("Diagram toJson", () => {
  const d = new Diagram();
  d.addField(new Field("test", 1));
  d.addField(new Field("test2", 2));
  d.addField(new Field("test3", 3));
  d.config.getOption("bit")?.setValue(64);
  d.config.getOption("diagram-style")?.setValue("utf8-header");
  d.config.getOption("header-style")?.setValue("full");
  d.config.getOption("left-space-placeholder")?.setValue(true);

  expect(d.toJson()).toMatchSnapshot();
});
