import { render, screen } from "@testing-library/react";
import { getWindowSize } from "./Util";
import { Vector } from "./Vector";
import isEqual from "lodash.isequal";

test("getWindowSize", () => {
  expect(getWindowSize()); // Expect to have no error
});

test("lodash", () => {
  expect(isEqual(1, 1)).toBe(true);
  expect(isEqual(1, 2)).toBe(false);
  expect(isEqual([1, 2], [1, 2])).toBe(true);
  expect(isEqual([1, 2], [2, 1])).toBe(false);
  expect(isEqual(new Vector(1, 2), new Vector(1, 2))).toBe(true);
  expect(isEqual(new Vector(1, 2), new Vector(2, 1))).toBe(false);
  expect(isEqual(new Vector(1, 2), [1, 2])).toBe(false);
  expect(isEqual(new Vector(1, 2), [2, 1])).toBe(false);
  expect(isEqual(new Vector(1, 2), { x: 1, y: 2 })).toBe(false);
  expect(isEqual([], [])).toBe(true);
  expect(isEqual([], {})).toBe(false);
  expect(isEqual({}, {})).toBe(true);
  expect(isEqual({}, [])).toBe(false);
});
