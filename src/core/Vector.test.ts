import { Vector } from "./Vector";

export function Vec(x: number, y: number): Vector {
  return new Vector(x, y);
}

test("Test Vector add", () => {
  expect(Vec(1, 2).add(3)).toEqual(Vec(4, 5));
  expect(Vec(1, 2).add(Vec(3, 4))).toEqual(Vec(4, 6));
});

test("Test Vector subtract", () => {
  expect(Vec(1, 2).subtract(3)).toEqual(Vec(-2, -1));
  expect(Vec(1, 2).subtract(Vec(3, 4))).toEqual(Vec(-2, -2));
});

test("Test Vector multiply", () => {
  expect(Vec(1, 2).multiply(3)).toEqual(Vec(3, 6));
  expect(Vec(1, 2).multiply(Vec(3, 4))).toEqual(Vec(3, 8));
});

test("Test Vector divide", () => {
  expect(Vec(1, 2).divide(3)).toEqual(Vec(1 / 3, 2 / 3));
  expect(Vec(1, 2).divide(Vec(3, 4))).toEqual(Vec(1 / 3, 2 / 4));
});

test("Test Vector distance", () => {
  expect(Vec(1, 2).distance(Vec(3, 4))).toEqual(Math.sqrt(8));
});

test("Test Vector setXY", () => {
  let v = Vec(1, 2);
  v.setXY(3, 4);
  expect(v).toEqual(Vec(3, 4));
  v.setXY(Vec(5, 6));
  expect(v).toEqual(Vec(5, 6));
});

test("Test Vector isWithinArea", () => {
  expect(Vec(1, 2).isWithinArea(Vec(0, 0), Vec(2, 3))).toEqual(true);
  expect(Vec(1, 2).isWithinArea(Vec(0, 0), Vec(1, 1))).toEqual(false);
});

test("Test Vector clone", () => {
  expect(Vec(1, 2).clone()).toEqual(Vec(1, 2));
});

test("Test Vector toVector", () => {
  expect(Vec(1, 2).toVector()).toEqual(Vec(1, 2));
});

