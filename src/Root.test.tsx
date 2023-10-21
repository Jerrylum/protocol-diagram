import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import Root, { handleDiagramParam } from "./Root";
import { getRootStore } from "./core/Root";
import { Diagram } from "./diagram/Diagram";
import { Field } from "./diagram/Field";
import { Configuration } from "./config/Configuration";

test("confirmation test", () => {
  const { confirmation, modals } = getRootStore();

  confirmation.prompt({
    title: "title1",
    description: "description1",
    buttons: [],
    onKeyDown: undefined
  });

  expect(modals.isOpen).toBe(true);
});

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
  app.diagram.toSvgString();

  act(() => {
    commandInputField.value = "undo";
    fireEvent.keyDown(commandInputField, { key: "Enter" });
  });

  result.rerender(<Root />);
  expect(app.diagram.toString()).toBe(``);
  app.diagram.toSvgString();

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
  app.diagram.toSvgString();

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

test("handleDiagramParam", async () => {
  const { app } = getRootStore();

  const d = new Diagram();
  d.addField(new Field("a", 12));
  d.addField(new Field("b", 12));
  const encodedJsonDiagram = window.btoa(unescape(encodeURIComponent(d.toJson())));

  await handleDiagramParam(encodedJsonDiagram.replaceAll("+", "-").replaceAll("/", "_"));

  expect(app.diagram.fields.length).toBe(2);
  expect(app.diagram.fields[0].name).toBe("a");
  expect(app.diagram.fields[0].length).toBe(12);
  expect(app.diagram.fields[1].name).toBe("b");
  expect(app.diagram.fields[1].length).toBe(12);

  app.diagram = new Diagram();

  const d2 = new Diagram();
  (d2 as any).config = new Configuration();
  const encodedJsonDiagram2 = window.btoa(unescape(encodeURIComponent(d2.toJson())));
  await handleDiagramParam(encodedJsonDiagram2.replaceAll("+", "-").replaceAll("/", "_"));

  expect(app.diagram.fields.length).toBe(0);
  expect(app.diagram.config.options.length).toBe(4);

  app.diagram = new Diagram();

  const d3 = new Diagram();
  d3.addField(new Field("a", 12));
  d3.addField(new Field("b", 12));
  const encodedJsonDiagram3 = window.btoa(unescape(encodeURIComponent(d2.toJson()))) + "a"; // invalid base64 string, not divisible by 4
  await handleDiagramParam(encodedJsonDiagram3.replaceAll("+", "-").replaceAll("/", "_"));

  expect(app.diagram.fields.length).toBe(0);
  expect(app.diagram.config.options.length).toBe(4);
});

test("Dummy", () => {});
