import { fireEvent, render } from "@testing-library/react";
import { LogPanel } from "./LogPanel";
import { act } from "react-dom/test-utils";
import { getRootStore } from "../core/Root";
import React from "react";

test("Render LogPanel", () => {
  const result = render(<LogPanel />);
  expect(result.container).toMatchSnapshot();
});

test("Render LogPanel with focused", () => {
  jest.useFakeTimers();

  const { logger } = getRootStore();

  logger.clear();

  const components = (
    <div id="root-container">
      <LogPanel />
    </div>
  );

  const result = render(components);

  act(() => {
    logger.add("info", "test");
  });

  act(() => {
    logger.add("error", "test");
  });

  const logPanel = result.container.querySelector("#root-container > div");

  act(() => {
    fireEvent.mouseEnter(logPanel!);
  });

  act(() => {
    fireEvent.mouseLeave(logPanel!);
  });

  result.rerender(components);

  jest.runAllTimers();

  result.rerender(components);
});
