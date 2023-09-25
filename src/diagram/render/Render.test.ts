import { convertFieldsToRow, spliceDividers, mergeRowsAndDividers, displayNameAtTheCentralSegment } from "../Diagram";
import { Field } from "../Field";
import { Matrix } from "./Matrix";
import { Connector, DividerSegment, RowSegment, RowTail, Segment } from "./Segment";
import { Divider, Row } from "./SegmentGroup";

test("Connector", () => {
  const list: Field[] = [];
  list.push(new Field("test1", 8));
  list.push(new Field("test2", 48));

  const rows = convertFieldsToRow(32, list, true);
  const dividers = spliceDividers(32, rows);
  const segments = mergeRowsAndDividers(rows, dividers);
  list.forEach((f) => displayNameAtTheCentralSegment(f, segments));

  const matrix = new Matrix(segments);
  matrix.process();
  matrix.process();

  expect(matrix.get(matrix.width - 2, 2) instanceof Connector).toBeTruthy();
  expect((matrix.get(matrix.width - 2, 2) as Connector).value).toBe(Connector.TOP + Connector.LEFT);
  expect(matrix.get(matrix.width - 2, 3) instanceof Connector).toBeTruthy();
  expect((matrix.get(matrix.width - 2, 3) as Connector).value).toBe(Connector.TOP + Connector.LEFT + Connector.BOTTOM);
  expect((matrix.get(matrix.width - 2, 3) as Connector).isIndividual).toBeTruthy();
  expect(matrix.get(matrix.width - 2, 4) instanceof Connector).toBeTruthy();
  expect((matrix.get(matrix.width - 2, 4) as Connector).value).toBe(0);

  ////////////////

  const rows2 = convertFieldsToRow(32, list, false);
  const dividers2 = spliceDividers(32, rows2);
  const segments2 = mergeRowsAndDividers(rows2, dividers2);
  list.forEach((f) => displayNameAtTheCentralSegment(f, segments2));

  const matrix2 = new Matrix(segments2);
  matrix2.process();
  matrix2.process();

  // No checks here
});

test("DividerSegment", () => {
  const list: Field[] = [];
  list.push(new Field("test1", 8));
  list.push(new Field("test2", 48));

  const rows = convertFieldsToRow(32, list, true);
  const dividers = spliceDividers(32, rows);
  const segments = mergeRowsAndDividers(rows, dividers);
  list.forEach((f) => displayNameAtTheCentralSegment(f, segments));

  const matrix = new Matrix(segments);
  matrix.process();
  matrix.process();

  expect(matrix.get(matrix.width - 20, 2) instanceof DividerSegment).toBeTruthy();
  expect((matrix.get(matrix.width - 20, 2) as DividerSegment).isVisible).toBeFalsy();
  expect(matrix.get(matrix.width - 20, 0) instanceof DividerSegment).toBeTruthy();
  expect((matrix.get(matrix.width - 20, 0) as DividerSegment).isVisible).toBeTruthy();
  expect(matrix.get(matrix.width - 3, 4) instanceof DividerSegment).toBeTruthy();
  expect((matrix.get(matrix.width - 3, 4) as DividerSegment).isVisible).toBeFalsy();
});

test("Divider", () => {
  const rs = new RowSegment(new Field("test1", 8), 0, 8);
  const rs2 = new RowSegment(new Field("test2", 6), 0, 6);
  const list: Segment[] = [];
  const d = new Divider(32);

  d.addSplice(rs2, rs);
  list.push(new DividerSegment(null, 0, 6));
  expect(list.toString()).toStrictEqual(d.segments.toString());

  d.addSplice(rs2, rs);
  expect(list.toString()).toStrictEqual(d.segments.toString()); // unchanged

  ////////////////

  const f = new Field("test3", 38);
  const rs3 = new RowSegment(f, 8, 24);
  const rs4 = new RowSegment(f, 0, 6);
  const list2: Segment[] = [];
  const d2 = new Divider(32);

  d2.addSplice(rs4, rs3);
  list2.push(new DividerSegment(null, 0, 6));
  expect(list2.toString()).toStrictEqual(d2.segments.toString());

  ////////////////

  const f2 = new Field("test4", 48);
  const rs5 = new RowSegment(f2, 8, 24);
  const rs6 = new RowSegment(f2, 0, 24);
  const list3: Segment[] = [];
  const d3 = new Divider(32);

  d3.addSplice(rs6, rs5);
  list3.push(new DividerSegment(rs6.represent, 0, 24));
  expect(list3.toString()).toStrictEqual(d3.segments.toString());
});

test("Row", () => {
  const r = new Row(32);
  const list: Segment[] = [];

  expect(r.bit).toBe(32);
  expect(r.used).toBe(0);
  expect(r.segments.toString()).toStrictEqual(list.toString());

  r.addField(new Field("test1", 8));
  list.push(new RowSegment(new Field("test1", 0), 0, 8));
  expect(r.used).toBe(8);
  expect(r.segments.toString()).toStrictEqual(list.toString());

  r.addField(new Field("test2", 8));
  list.push(new RowSegment(new Field("test2", 0), 8, 8));
  expect(r.used).toBe(16);
  expect(r.segments.toString()).toStrictEqual(list.toString());

  r.addField(new Field("test3", 24));
  list.push(new RowSegment(new Field("test3", 8), 16, 16));
  expect(r.used).toBe(32);
  expect(r.segments.toString()).toStrictEqual(list.toString());

  r.addField(new Field("test4", 8));
  expect(r.used).toBe(32);
  expect(r.segments.toString()).toStrictEqual(list.toString());

  r.addTail(true);
  expect(r.segments.toString()).toStrictEqual(list.toString());

  const r2 = new Row(32);
  const list2: Segment[] = [];

  r2.addField(new Field("test1", 8));
  list2.push(new RowSegment(new Field("test1", 0, 7), 0, 8));
  expect(r2.used).toBe(8);
  expect(r2.segments.toString()).toStrictEqual(list2.toString());

  r2.addTail(false);
  list2.push(new RowTail(8, 24, false));
  expect(r2.segments.toString()).toStrictEqual(list2.toString());
});

