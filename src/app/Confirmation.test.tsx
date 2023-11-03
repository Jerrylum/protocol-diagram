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

  act(() => {
    fireEvent.keyDown(container!, { key: "ArrowRight", code: "ArrowRight" });
  });

  let observerInput = result.container.querySelector("input");
  act(() => {
    fireEvent.input(observerInput!, { target: { value: "test" } });
    fireEvent.keyDown(observerInput!, { key: "Enter", code: "Enter" });

    confirmation.prompt({
      title: "title1",
      description: "description1",
      buttons: [{ label: "OK", hotkey: "Escape" }],
      onKeyDown: undefined,
      inputLabel: "testLabel",
      inputDefaultValue: "testDefaultValue"
    });
  });

  container = document.querySelector(".modal-container");
  observerInput = result.container.querySelector("input");

  act(() => {
    fireEvent.input(observerInput!, { target: { value: "test" } });
    fireEvent.keyDown(observerInput!, { key: "NumpadEnter", code: "NumpadEnter" });

    confirmation.prompt({
      title: "title1",
      description: "description1",
      buttons: [{ label: "OK", hotkey: "Escape" }],
      onKeyDown: undefined,
      inputLabel: "testLabel",
      inputDefaultValue: "testDefaultValue"
    });
  });

  container = document.querySelector(".modal-container");
  observerInput = result.container.querySelector("input");

  act(() => {
    // any key
    fireEvent.keyDown(observerInput!, { key: "E", code: "E" });

    fireEvent.keyDown(container!, { key: "Enter", code: "Enter" });

    fireEvent.keyDown(container!, { key: "Escape", code: "Escape" });
  });
});
