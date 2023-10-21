import { BottomPanelController } from "./BottomPanel";
import { CommandInputField } from "./CommandInputField";
import { act, fireEvent, render } from "@testing-library/react";

test("Arrow up/down for last executed command line", () => {
  const controller = new BottomPanelController();
  const components = (
    <div id="root-container">
      <CommandInputField controller={controller} />
    </div>
  );
  const result = render(components);
  if (controller.inputElement === null) expect(false).toBeTruthy();
  act(() => {
    fireEvent.input(controller.inputElement!, { target: { value: "a" } });
    fireEvent.keyDown(controller.inputElement!, { key: "Enter", code: "Enter" });
    fireEvent.input(controller.inputElement!, { target: { value: "b" } });
    fireEvent.keyDown(controller.inputElement!, { key: "Enter", code: "Enter" });
    fireEvent.input(controller.inputElement!, { target: { value: "c" } });
    fireEvent.keyDown(controller.inputElement!, { key: "Enter", code: "Enter" });
    fireEvent.input(controller.inputElement!, { target: { value: "d" } });
    fireEvent.keyDown(controller.inputElement!, { key: "Enter", code: "Enter" });
    fireEvent.input(controller.inputElement!, { target: { value: "e" } });
    fireEvent.keyDown(controller.inputElement!, { key: "Enter", code: "Enter" });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("e");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("d");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("c");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("b");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("a");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("a");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("b");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("c");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("d");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("e");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.input(controller.inputElement!, { target: { value: "c" } });
    fireEvent.keyDown(controller.inputElement!, { key: "Enter", code: "Enter" });
    fireEvent.keyDown(controller.inputElement!, { key: "Escape", code: "Escape" });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("c");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("b");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("a");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("b");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("c");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("d");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("e");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("c");
  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("");
});
