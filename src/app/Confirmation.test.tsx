import { act } from "react-dom/test-utils";
import { ConfirmationModal } from "./Confirmation";
import { fireEvent, render } from "@testing-library/react";
import { getRootStore } from "../core/Root";

test("Render Confirmation", () => {
  const { confirmation } = getRootStore();
  confirmation.prompt({
    title: "title1",
    description: "description1",
    buttons: [{ label: "OK", hotkey: "Escape" }],
    onKeyDown: undefined,
    inputLabel: "testLabel",
    inputDefaultValue: "testDefaultValue"
  });
  const components = (
    <div id="root-container">
      <ConfirmationModal />
    </div>
  );
  const result = render(components);
  expect(result.container).toMatchSnapshot();
  let container = document.querySelector(".modal-container");
  act(() => {
    fireEvent.keyDown(container!, { key: "ArrowLeft", code: "ArrowLeft" });
  });
  result.rerender(components);

  act(() => {
    fireEvent.keyDown(container!, { key: "ArrowRight", code: "ArrowRight" });
  });
  result.rerender(components);

  let observerInput = result.container.querySelector("input");
  act(() => {
    fireEvent.input(observerInput!, { target: { value: "test" } });
    fireEvent.keyDown(observerInput!, { key: "Enter", code: "Enter" });
  });
  result.rerender(components);

  confirmation.prompt({
    title: "title1",
    description: "description1",
    buttons: [{ label: "OK", hotkey: "Escape" }],
    onKeyDown: undefined,
    inputLabel: "testLabel",
    inputDefaultValue: "testDefaultValue"
  });

  result.rerender(components);

  container = document.querySelector(".modal-container");
  observerInput = result.container.querySelector("input");

  act(() => {
    fireEvent.input(observerInput!, { target: { value: "test" } });
    fireEvent.keyDown(observerInput!, { key: "NumpadEnter", code: "NumpadEnter" });
  });
  result.rerender(components);

  confirmation.prompt({
    title: "title1",
    description: "description1",
    buttons: [{ label: "OK", hotkey: "Escape" }],
    onKeyDown: undefined,
    inputLabel: "testLabel",
    inputDefaultValue: "testDefaultValue"
  });

  result.rerender(components);

  container = document.querySelector(".modal-container");
  observerInput = result.container.querySelector("input");

  act(() => {
    fireEvent.keyDown(container!, { key: "Enter", code: "Enter" });
  });
  result.rerender(components);

  act(() => {
    fireEvent.keyDown(container!, { key: "Escape", code: "Escape" });
  });
  result.rerender(components);
});
