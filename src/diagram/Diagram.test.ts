import { Diagram } from "./Diagram";
import { Field } from "./Field";

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
