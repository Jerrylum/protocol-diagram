import { Modals } from "./Modals";

test("Modals", () => {
  const m = new Modals();

  expect(m.opening).toBe(null);
  expect(m.priority).toBe(null);
  expect(m.isOpen).toBe(false);

  const symbol1 = Symbol();
  const symbol2 = Symbol();

  expect(m.open(symbol1)).toBe(true);
  expect(m.opening).toBe(symbol1);
  expect(m.priority).toBe(0);
  expect(m.isOpen).toBe(true);

  expect(m.open(symbol2, -1)).toBe(false);
  expect(m.opening).toBe(symbol1);
  expect(m.priority).toBe(0);
  expect(m.isOpen).toBe(true);

  expect(m.open(symbol2, 1)).toBe(true);
  expect(m.opening).toBe(symbol2);
  expect(m.priority).toBe(1);
  expect(m.isOpen).toBe(true);

  expect(m.open(symbol1, 2)).toBe(true);
  expect(m.opening).toBe(symbol1);
  expect(m.priority).toBe(2);
  expect(m.isOpen).toBe(true);

  m.close(symbol2);
  expect(m.opening).toBe(symbol1);
  expect(m.priority).toBe(2);
  expect(m.isOpen).toBe(true);

  m.close(symbol1);
  expect(m.opening).toBe(null);
  expect(m.priority).toBe(null);
  expect(m.isOpen).toBe(false);

  m.close();
  expect(m.opening).toBe(null);
  expect(m.priority).toBe(null);
  expect(m.isOpen).toBe(false);
});
