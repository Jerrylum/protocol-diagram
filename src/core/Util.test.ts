import { render, screen } from "@testing-library/react";
import { clamp, getWindowSize, isMacOS, sleep } from "./Util";
import { Vector } from "./Vector";
import isEqual from "lodash.isequal";

test("sleep", ()=> {
  expect.assertions(1);
  return sleep(10).then(() => {
    expect(true).toBe(true);
  });
})

test("isMacOS", () => {
  expect(isMacOS("Windows")).toBe(false);
  expect(isMacOS("Mac")).toBe(true);
  expect(isMacOS("Linux")).toBe(false);
});

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

test("clamp", () => {
  expect(clamp(1, 0, 2)).toBe(1);
  expect(clamp(0, 0, 2)).toBe(0);
  expect(clamp(2, 0, 2)).toBe(2);
  expect(clamp(3, 0, 2)).toBe(2);
  expect(clamp(-1, 0, 2)).toBe(0);
});
