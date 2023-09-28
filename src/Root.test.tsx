import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import Root from "./Root";
import { getRootStore } from "./core/Root";
import { Diagram } from "./diagram/Diagram";

test("Add/Undo/Redo command integration test", () => {
  const { app } = getRootStore();

  act(() => {
    app.diagram = new Diagram();
  });

  const result = render(<Root />);

  const commandInputField = document.querySelector('input[type="text"]') as HTMLInputElement;
  expect(commandInputField).toBeInTheDocument();

  act(() => {
    commandInputField.value = "add 1 testadd";
    fireEvent.keyDown(commandInputField, { key: "Enter" });
  });

  result.rerender(<Root />);
    expect(app.diagram.toString()).toBe(` 0
 0
┌─┐                                                              
│t│                                                              
└─┘                                                              
`);

  act(() => {
    commandInputField.value = "undo";
    fireEvent.keyDown(commandInputField, { key: "Enter" });
  });

  result.rerender(<Root />);
  expect(app.diagram.toString()).toBe(``);

  act(() => {
    commandInputField.value = "redo";
    fireEvent.keyDown(commandInputField, { key: "Enter" });
  });
  
  result.rerender(<Root />);
  expect(app.diagram.toString()).toBe(` 0
 0
┌─┐                                                              
│t│                                                              
└─┘                                                              
`);

  act(() => {
    commandInputField.value = "test";
    fireEvent.keyDown(commandInputField, { key: "Enter" });
  });

  act(() => {
    commandInputField.value = "add aaa aaa";
    fireEvent.keyDown(commandInputField, { key: "Enter" });
  });

  act(() => {
    commandInputField.value = "add 1";
    fireEvent.keyDown(commandInputField, { key: "Enter" });
  });

  act(() => {
    commandInputField.value = "add 1 aaa aaa";
    fireEvent.keyDown(commandInputField, { key: "Enter" });
  });

});



test("Dummy", () => {});
