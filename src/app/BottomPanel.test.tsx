import { buildInputSpecByUsages, mapCommandParameterWithInputSpec } from "../command/Commands";
import { BooleanT, CommandParameter } from "../token/Tokens";
import { cpb } from "../token/Tokens.test";
import { BottomPanelController } from "./BottomPanel";

test("BottomPanelController", () => {
  const bottomPanelController = new BottomPanelController();
  expect(bottomPanelController.insertAutoCompletionValue("test")).toBe(false);
  bottomPanelController.updateMapping();

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
  const commandParameters = [CommandParameter.parse(cpb("true"))!, CommandParameter.parse(cpb("false"))!];
  const map = mapCommandParameterWithInputSpec(commandParameters, null);
  bottomPanelController.mapping = map[0];
  bottomPanelController.inputElement = document.createElement("input");
  bottomPanelController.inputElement.value = "true true";
  expect(bottomPanelController.insertAutoCompletionValue("")).toBe(true);
  expect(bottomPanelController.inputElement.value).toBe(" true");
  bottomPanelController.inputElement.setSelectionRange(0, 3);
  bottomPanelController.updateMapping();
  expect(bottomPanelController.mapping).toBe(null);
  bottomPanelController.inputElement.setSelectionRange(0, 0);
  bottomPanelController.inputElement.value = "target '";
  bottomPanelController.updateMapping();
});
