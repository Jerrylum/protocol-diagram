import { render, screen } from "@testing-library/react";
import { getWindowSize } from "./Util";
import { Vector } from "./Vector";

test("getWindowSize", () => {
  expect(getWindowSize()); // Expect to have no error
});
