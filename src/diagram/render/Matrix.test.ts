import { convertFieldsToRow, displayNameAtTheCentralSegment, mergeRowsAndDividers, spliceDividers } from "../Diagram";
import { Field } from "../Field";
import { Matrix } from "./Matrix";
import { Connector, DividerSegment, NextLine, RowSegment, RowTail } from "./Segment";

test("Matrix", () => {
  new Matrix([]);

  let i = 0;
  const fields: Field[] = [];
  fields.push(new Field("test1", 8));
  i += 2;
  for (let j = 1; j < 8; j++) {
    i += 2;
  }
  fields.push(new Field("test2", 48));
  i += 2;
  for (let j = 1; j < 48; j++) {
    i += 2;
  }
  fields.push(new Field("test3", 8));
  i += 2;
  for (let j = 1; j < 8; j++) {
    i += 2;
  }

  const rows = convertFieldsToRow(32, fields, true);
  expect(rows.length).toBe(2);
  const dividers = spliceDividers(32, rows);
  expect(dividers.length).toBe(3);
  expect(dividers[0].segments.length).toBe(2);
  for (let j = 0; j < dividers[0].segments.length; j++) {
    i += 2;
    for (let k = 1; k < dividers[0].segments[j].length; k++) {
      i += 2;
    }
  }
  expect(dividers[1].segments.length).toBe(3);
  for (let j = 0; j < dividers[1].segments.length; j++) {
    i += 2;
    for (let k = 1; k < dividers[1].segments[j].length; k++) {
      i += 2;
    }
  }
  expect(dividers[2].segments.length).toBe(2);
  for (let j = 0; j < dividers[2].segments.length; j++) {
    i += 2;
    for (let k = 1; k < dividers[2].segments[j].length; k++) {
      i += 2;
    }
  }

  const segments = mergeRowsAndDividers(rows, dividers);
  expect(segments.length).toBe(4 + 2 + 3 + 2);
  fields.forEach(f => displayNameAtTheCentralSegment(f, segments));

  const matrix = new Matrix(segments);
  expect(matrix.elements.length).toBe(i + 10);
  expect(matrix.height).toBe(5);
  expect(matrix.width).toBe(Math.floor((i + 10) / 5));
});

test("Matrix get", () => {
  const fields: Field[] = [];
  fields.push(new Field("test1", 8));
  fields.push(new Field("test2", 48));
  const rows = convertFieldsToRow(32, fields, true);
  const dividers = spliceDividers(32, rows);
  const segments = mergeRowsAndDividers(rows, dividers);
  fields.forEach(f => displayNameAtTheCentralSegment(f, segments));
  const matrix = new Matrix(segments);

  expect(matrix.get(-1, -1)).toBeNull();
  expect(matrix.get(0, -1)).toBeNull();
  expect(matrix.get(-1, 0)).toBeNull();
  expect(matrix.get(matrix.width, 0)).toBeNull();
  expect(matrix.get(0, matrix.height)).toBeNull();

  expect(matrix.get(0, 0) instanceof Connector).toBeTruthy();
  expect(matrix.get(1, 0) instanceof DividerSegment).toBeTruthy();
  expect(matrix.get(matrix.width - 1, 0) instanceof NextLine).toBeTruthy();
  expect(matrix.get(0, 1) instanceof Connector).toBeTruthy();
  expect(matrix.get(1, 1) instanceof RowSegment).toBeTruthy();
  let i = 0;
  i += 2;
  for (let j = 1; j < 8; j++) {
    i += 2;
  }
  expect(matrix.get(i, 1) instanceof Connector).toBeTruthy();
  expect(matrix.get(matrix.width - 3, matrix.height - 2) instanceof RowTail).toBeTruthy();
});

