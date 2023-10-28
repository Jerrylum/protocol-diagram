import { InputHintsPopup, getMirrorDiv, getCaretCoordinates } from "./InputHintsPopup";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { BottomPanelController } from "./BottomPanel";
import { cpb } from "../token/Tokens.test";
import { BooleanT, CommandParameter } from "../token/Tokens";
import {
  ClearCommand,
  ConfigCommand,
  buildInputSpecByCommands,
  buildInputSpecByUsages,
  mapCommandParameterWithInputSpec
} from "../command/Commands";

test("getMirrorDiv", () => {
  Object.defineProperty(HTMLTextAreaElement.prototype, "scrollHeight", {
    configurable: true,
    get: function () {
      return this._scrollHeight || 0;
    },
    set(val) {
      this._scrollHeight = val;
    }
  });

  const htmlInputArea = document.createElement("input");
  htmlInputArea.value = "test";
  const mirrorDiv = getMirrorDiv(htmlInputArea);
  expect(mirrorDiv).toMatchSnapshot();

  (window as any)["mozInnerScreenX"] = "mocktest";
  const components = (
    <div id="root-container">
      <textarea id={"test"} style={{ height: 1, width: 10, overflowY: "scroll" }} />
    </div>
  );
  const result = render(components);
  const textField = result.container.querySelector("#test") as HTMLTextAreaElement;
  (textField as any).scrollHeight = 100;

  result.rerender(components);
  const mirrorDiv2 = getMirrorDiv(textField);
  expect(mirrorDiv2).toMatchSnapshot();
});

test("Render InputHintsPopup", () => {
  const btmpController = new BottomPanelController();
  const components = (
    <div id="root-container">
      <InputHintsPopup controller={btmpController} />
    </div>
  );
  const result = render(components);

  const inspec = buildInputSpecByUsages([
    {
      name: "testbool",
      paramType: BooleanT,
      description: "test description"
    },
    {
      name: "testbool2",
      paramType: BooleanT,
      description: "test description"
    }
  ]);
  const commandParameters = [CommandParameter.parse(cpb("true"))!];
  const map = mapCommandParameterWithInputSpec(commandParameters, null);
  btmpController.mapping = map[0];
  result.rerender(components);

  const map2 = mapCommandParameterWithInputSpec(commandParameters, inspec!);
  btmpController.mapping = map2[0];
  result.rerender(components);

  const map3 = mapCommandParameterWithInputSpec(commandParameters, inspec!);
  btmpController.mapping = map3[1];
  btmpController.inputElement = document.createElement("input");
  result.rerender(components);

  const commandParameters2 = [CommandParameter.parse(cpb("c"))!];

  const map4 = mapCommandParameterWithInputSpec(
    commandParameters2,
    buildInputSpecByCommands([new ClearCommand(), new ConfigCommand()])
  );
  btmpController.mapping = map4[0];
  result.rerender(components);
  expect(result.container).toMatchSnapshot();

  const inputHintsPopupBox = result.container.querySelector("#root-container > div");
  act(() => {
    fireEvent.mouseDown(inputHintsPopupBox!);
  });
  result.rerender(components);
  expect(btmpController.isFocusedPopup).toBe(true);
  act(() => {
    fireEvent.mouseUp(inputHintsPopupBox!);
  });
  result.rerender(components);
  expect(btmpController.isFocusedPopup).toBe(false);

  const clearCommandBox = result.container.querySelectorAll("#root-container > div > div > div")[0];
  const configCommandBox = result.container.querySelectorAll("#root-container > div > div > div")[1];
  act(() => {
    fireEvent.mouseEnter(clearCommandBox);
  });
  result.rerender(components);
  act(() => {
    fireEvent.mouseLeave(clearCommandBox);
  });
  result.rerender(components);
  act(() => {
    fireEvent.mouseEnter(configCommandBox);
  });
  result.rerender(components);
  act(() => {
    fireEvent.mouseLeave(configCommandBox);
  });
  result.rerender(components);
  act(() => {
    fireEvent.click(clearCommandBox);
  });
  result.rerender(components);
  expect(btmpController.inputElement.value).toBe("clear ");
});
