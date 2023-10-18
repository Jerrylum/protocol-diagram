import exp from "constants";
import { Confirmation, ConfirmationButton, ConfirmationInputPromptData, ConfirmationPromptData } from "./Confirmation";
import { getRootStore } from "./Root";
import { Modals } from "./Modals";
//import { ConfirmationModalSymbol } from "./Confirmation";

test("Confirmation", async () => {
  const modals = new Modals();

  const data1Buttons: ConfirmationButton[] = [{ label: "OK" }];
  const data1: ConfirmationPromptData = {
    title: "title1",
    description: "description1",
    buttons: data1Buttons,
    onKeyDown: undefined
  };
  const confirmation = new Confirmation(() => modals);
  confirmation.prompt(data1);
  expect(confirmation.isOpen).toBe(true);
  expect(confirmation.title).toBe("title1");
  expect(confirmation.description).toBe("description1");
  expect(confirmation.buttons).toEqual(data1Buttons);
  expect(confirmation.onKeyDown).toBe(undefined);
  expect(confirmation.input).toBe(undefined);
  confirmation.close();

  const confirmation1 = new Confirmation(() => modals);
  confirmation1.input = "input";
  expect(confirmation1.input).toBe("input");

  const data2Buttons: ConfirmationButton[] = [{ label: "" }];
  const data2: ConfirmationInputPromptData = {
    title: "title2",
    description: "description2",
    buttons: data2Buttons,
    inputLabel: "inputLabel",
    inputDefaultValue: "inputDefaultValue"
  };
  const confirmation2 = new Confirmation(() => modals);
  // const resultInput = await confirmation2.prompt(data2);

  const promise = confirmation2.prompt(data2);
  confirmation2.close();
  const resultInput = await promise;

  expect(resultInput).toBe("inputDefaultValue");
  expect(confirmation2.isOpen).toBe(false);
  expect(confirmation2.title).toBe("");
  expect(confirmation2.description).toBe("");
  expect(confirmation2.buttons).toStrictEqual([]);
  expect(confirmation2.input).toBe("inputDefaultValue");
  expect(confirmation2.inputLabel).toBe("");
  expect(confirmation2.onKeyDown).toBe(undefined);

  const data3: ConfirmationInputPromptData = {
    title: "title3",
    description: "description3",
    buttons: data2Buttons,
    inputLabel: "",
    inputDefaultValue: ""
  };
  const confirmation3 = new Confirmation(() => modals);
  confirmation3.prompt(data3);
  expect(confirmation3.title).toBe("title3");
  confirmation3.title = "set_title333";
  expect(confirmation3.title).toEqual("set_title333");
  expect(confirmation3.description).toBe("description3");
  confirmation3.description = "set_description333";
  expect(confirmation3.description).toEqual("set_description333");

  const data4Buttons: ConfirmationButton[] = [{ label: "button1" }, { label: "button2" }];
  const data4: ConfirmationPromptData = {
    title: "title4",
    description: "description4",
    buttons: data4Buttons
  };
  const confirmation4 = new Confirmation(() => modals);
  confirmation4.prompt(data4);
  expect(confirmation4.buttons).toEqual(data4Buttons);

  const data5: ConfirmationPromptData = {
    title: "title5",
    description: "description5",
    buttons: []
  };
  const confirmation5 = new Confirmation(() => modals);
  expect(confirmation5.title).toBe("");
  expect(confirmation5.description).toBe("");
  expect(confirmation5.buttons).toEqual([]);
  confirmation5.prompt(data5);

  const confirmation6 = new Confirmation(() => modals);
  confirmation6.title = "title6";
  confirmation6.description = "description6";
});
