import { mapCommandParameterWithInputSpec } from "../command/Commands";
import { getRootStore } from "../core/Root";
import { CommandParameter } from "../token/Tokens";
import { cpb } from "../token/Tokens.test";
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

test ("handleTextFieldCaretChange", () => {
  const controller = new BottomPanelController();
  const components = (
    <div id="root-container">
      <CommandInputField controller={controller} />
    </div>
  );
  const commandParameters = [CommandParameter.parse(cpb("true"))!];
  const map = mapCommandParameterWithInputSpec(commandParameters, null);
  controller.mapping = map[0];
  expect(controller.mapping).not.toBeNull();
  const result = render(components);
  if (controller.inputElement === null) expect(false).toBeTruthy();
  act(() => {
    fireEvent.input(controller.inputElement!, { target: { value: "" } });
  });
  result.rerender(components);
  expect(controller.mapping).toBeNull();
});

test ("handleOnblur", () => {
  const controller = new BottomPanelController();
  const components = (
    <div id="root-container">
      <CommandInputField controller={controller} />
    </div>
  );
  const commandParameters = [CommandParameter.parse(cpb("true"))!];
  const map = mapCommandParameterWithInputSpec(commandParameters, null);
  controller.mapping = map[0];
  expect(controller.mapping).not.toBeNull();
  const result = render(components);
  if (controller.inputElement === null) expect(false).toBeTruthy();
  controller.isFocusedPopup = false;
  act(() => {
    fireEvent.blur(controller.inputElement!);
  });
  result.rerender(components);
  expect(controller.mapping).toBeNull();
});

test ("handleKeyDown Enter", () => {
  const controller = new BottomPanelController();
  const components = (
    <div id="root-container">
      <CommandInputField controller={controller} />
    </div>
  );
  const result = render(components);
  if (controller.inputElement === null) expect(false).toBeTruthy();
  act(() => {
    fireEvent.input(controller.inputElement!, { target: { value: "" } });
    fireEvent.keyDown(controller.inputElement!, { key: "Enter", code: "Enter" });
  });
  result.rerender(components);
  const {logger} = getRootStore();
  expect(logger.logs[logger.logs.length-1].level).toBe("error");

  act(() => {
    fireEvent.input(controller.inputElement!, { target: { value: "config bit 64" } });
    fireEvent.keyDown(controller.inputElement!, { key: "Enter", code: "Enter" });
  });
  result.rerender(components);
  const {app} = getRootStore();
  expect(app.diagram!.config.getOption("bit")?.getValue()).toBe(64);
});

test ("handleKeyDown Tab", () => {
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
    fireEvent.keyDown(controller.inputElement!, { key: "Tab", code: "Tab" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("add ");

  act(() => {
    fireEvent.keyDown(controller.inputElement!, { key: "l", code: "l" });
  });
  result.rerender(components);
});

test ("handle keydown ArrowUp/ArrowDown", () => {
  const controller = new BottomPanelController();
  const components = (
    <div id="root-container">
      <CommandInputField controller={controller} />
    </div>
  );
  const result = render(components);
  if (controller.inputElement === null) expect(false).toBeTruthy();
  act(() => {
    fireEvent.input(controller.inputElement!, { target: { value: "r" } });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(controller.inputElement!, { key: "Tab", code: "Tab" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("resize ");
  act(() => {
    fireEvent.input(controller.inputElement!, { target: { value: "r" } });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(controller.inputElement!, { key: "Tab", code: "Tab" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("rename ");

  act(() => {
    fireEvent.input(controller.inputElement!, { target: { value: "a" } });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(controller.inputElement!, { key: "Tab", code: "Tab" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("add ");
  act(() => {
    fireEvent.input(controller.inputElement!, { target: { value: "a" } });
    fireEvent.keyDown(controller.inputElement!, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(controller.inputElement!, { key: "Tab", code: "Tab" });
  });
  result.rerender(components);
  expect(controller.inputElement!.value).toBe("add ");
});

