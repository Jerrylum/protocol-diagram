import { isMessage } from "./ServiceWorkerMessages";

test("isMessage", () => {
  expect(isMessage({ type: "GET_VERSION" })).toBe(true);
  expect(isMessage({ type: "GET_CLIENTS_COUNT" })).toBe(true);
  expect(isMessage(true)).toBe(false);
  expect(isMessage(null)).toBe(false);
  expect(isMessage({})).toBe(false);
  expect(isMessage([])).toBe(false);
});
