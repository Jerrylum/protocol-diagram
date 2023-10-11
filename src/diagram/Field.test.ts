import { instanceToPlain, plainToClass } from "class-transformer";
import { Field } from "./Field";
import { validate } from "class-validator";

test("Field constructor", () => {
  const f = new Field("test", 1);
  expect(f.name).toBe("test");
  expect(f.length).toBe(1);
});

test("Field name setter", () => {
  const f = new Field("test", 1);
  expect(f.name).toBe("test");
  f.name = "test2";
  expect(f.name).toBe("test2");
});

test("Field length setter", () => {
  const f = new Field("test", 1);
  expect(f.length).toBe(1);
  f.length = 2;
  expect(f.length).toBe(2);
});

test("Field validator", async () => {
  const f = new Field("test", 1);
  expect(f.name).toBe("test");
  expect(f.length).toBe(1);
  expect(f.uid).toBe(3);

  expect(await validate(f)).toHaveLength(0);

  const p = instanceToPlain(f);
  const f2 = plainToClass(Field, p);

  expect(f2.name).toBe("test");
  expect(f2.length).toBe(1);
  expect(f2.uid).toBe(3);

  expect(await validate(f2)).toHaveLength(0);

  (f as any).name = 1;
  expect(await validate(f)).toHaveLength(1);

  (f as any).length = "1";
  expect(await validate(f)).toHaveLength(2);

  (f as any).length = 1;
  expect(await validate(f)).toHaveLength(1);

  (f as any).length = 1.1;
  expect(await validate(f)).toHaveLength(2);

  (f as any).uid = "1";
  expect(await validate(f)).toHaveLength(3);

  (f as any).uid = 1;
  expect(await validate(f)).toHaveLength(2);

  (f as any).uid = 1.1;
  expect(await validate(f)).toHaveLength(3);
});
