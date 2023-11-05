import { buildInputSpecByUsages, mapCommandParameterWithInputSpec } from "../command/Commands";
import { BooleanT, CommandParameter, StringT, buildParameters } from "../token/Tokens";
import { cpb } from "../token/Tokens.test";
import { BottomPanelController } from "./BottomPanel";

test("BottomPanelController", () => {
  const spec1 = {
    name: "any",
    description: "anything",
    acceptedValues: ["test1", "test2"],
    paramType: StringT,
    next: null
  };
  const spec2 = {
    name: "any",
    description: "anything",
    acceptedValues: ["test3", "test4"],
    paramType: StringT,
    next: null
  };
  const spec3 = {
    name: "any",
    description: "anything",
    acceptedValues: ["test3", "test5"],
    paramType: StringT,
    next: null
  };

  const controller = new BottomPanelController();

  const map = mapCommandParameterWithInputSpec([], spec1);
  const map2 = mapCommandParameterWithInputSpec([], spec2);
  const map3 = mapCommandParameterWithInputSpec([], spec3);

  controller.selected = null;
  controller.mapping = map[0];

  controller.selected = "test1";
  controller.selected = "anything";
  controller.selected = null;

  controller.selected = "test1";
  controller.mapping = map2[0];

  controller.mapping = map3[0];
});

test("BottomPanelController.insertAutoCompletionValue", () => {
  const commandParameters = [CommandParameter.parse(cpb("true"))!, CommandParameter.parse(cpb("false"))!];
  const map = mapCommandParameterWithInputSpec(commandParameters, null);

  const controller = new BottomPanelController();

  // mapping = null
  expect(controller.insertAutoCompletionValue("test")).toBe(false);

  controller.mapping = map[0];

  // input = null
  expect(controller.insertAutoCompletionValue("test")).toBe(false);
  controller.inputElement = document.createElement("input");
  controller.inputElement.value = "true true";

  // success
  expect(controller.insertAutoCompletionValue("")).toBe(true);
});

test("BottomPanelController.updateMapping", () => {
  const commandParameters = [CommandParameter.parse(cpb("true"))!, CommandParameter.parse(cpb("false"))!];
  const map = mapCommandParameterWithInputSpec(commandParameters, null);

  const controller = new BottomPanelController();

  controller.mapping = map[0];

  controller.updateMapping();

  controller.inputElement = document.createElement("input");
  controller.inputElement.value = "true true";
  // start != end
  controller.inputElement.setSelectionRange(0, 3);
  controller.updateMapping();

  expect(controller.mapping).toBe(null);

  controller.inputElement.setSelectionRange(0, 0);
  controller.inputElement.value = "target '";
  // list = null
  controller.updateMapping();

  controller.mapping = null;
  controller.inputElement.value = "target ";

  // last mapping assignment
  controller.updateMapping();
});
