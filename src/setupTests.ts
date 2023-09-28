// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

import { setupJestCanvasMock } from "jest-canvas-mock";

jest.mock("canvas", () => ({}), { virtual: true });

beforeEach(() => {
  setupJestCanvasMock();
});
