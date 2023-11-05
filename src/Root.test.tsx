import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import Root, { onLatestVersionChange, handleDiagramParam } from "./Root";
import { getRootStore } from "./core/Root";
import { Diagram } from "./diagram/Diagram";
import { Field } from "./diagram/Field";
import { Configuration } from "./config/Configuration";
import { registerServiceWorker, resetServiceWorker, ServiceWorkerMock } from "./core/ServiceWorkerRegistration.test";
import { APP_VERSION } from "./core/MainApp";
import { SemVer } from "semver";
import { closeUpdatePrompt } from "./core/Versioning";
import { APP_VERSION_STRING } from "./Version";

test("onLatestVersionChange", async () => {
  await resetServiceWorker();

  const { app, confirmation } = getRootStore();
  app.latestVersion = undefined;
  const component = (
    <div id="root-container">
      <Root enableCanvas={false} />
    </div>
  );
  confirmation.close();

  const result = render(component);

  // route test
  await onLatestVersionChange(undefined, undefined);
  expect(confirmation.isOpen).toBe(false);

  // route test
  await onLatestVersionChange(null, undefined);

  // Use newVer
  const { swr } = await registerServiceWorker();

  swr.waiting = null;

  const newVer = new SemVer(APP_VERSION);
  newVer.patch++;
  await onLatestVersionChange(newVer, undefined);

  // closeUpdatePrompt(false); // not needed

  // Use waiting's version
  await resetServiceWorker();
  const { swr: swr2 } = await registerServiceWorker();

  swr2.waiting = new ServiceWorkerMock();
  swr2.waiting.postMessage = jest.fn((data: unknown, transfer: unknown) => {
    (transfer as [{ _parent: MessageChannel }])[0]._parent.port1.onmessage?.({ data: "1.2.3" } as MessageEvent);
  });

  await onLatestVersionChange(APP_VERSION, undefined);

  // closeUpdatePrompt(false); // not needed

  result.unmount();
});

test("Root decode location url", async () => {
  const { app } = getRootStore();

  delete (window as any).location;
  (window as any).location = new URL(
    "https://www.example.com?diagram=eyJfZmllbGRzIjpbeyJuYW1lIjoidGVzdDEiLCJsZW5ndGgiOjMwLCJ1aWQiOjExNH1dLCJjb25maWciOnsib3B0aW9ucyI6W3sia2V5IjoiYml0IiwiZGVmYXVsdFZhbHVlIjozMiwibWluIjoxLCJtYXgiOjEyOCwidmFsdWUiOjMyLCJfX3R5cGUiOiJyYW5nZS1vcHRpb24ifSx7ImtleSI6ImRpYWdyYW0tc3R5bGUiLCJkZWZhdWx0VmFsdWUiOiJ1dGY4IiwiYWNjZXB0ZWRWYWx1ZXMiOlsidXRmOCIsInV0ZjgtaGVhZGVyIiwidXRmOC1jb3JuZXIiLCJhc2NpaSIsImFzY2lpLXZlcmJvc2UiXSwidmFsdWUiOiJ1dGY4IiwiX190eXBlIjoiZW51bS1vcHRpb24ifSx7ImtleSI6ImhlYWRlci1zdHlsZSIsImRlZmF1bHRWYWx1ZSI6InRyaW0iLCJhY2NlcHRlZFZhbHVlcyI6WyJub25lIiwidHJpbSIsImZ1bGwiXSwidmFsdWUiOiJ0cmltIiwiX190eXBlIjoiZW51bS1vcHRpb24ifSx7ImtleSI6ImxlZnQtc3BhY2UtcGxhY2Vob2xkZXIiLCJkZWZhdWx0VmFsdWUiOmZhbHNlLCJ2YWx1ZSI6ZmFsc2UsIl9fdHlwZSI6ImJvb2xlYW4tb3B0aW9uIn1dfX0="
  );

  const component = (
    <div id="root-container">
      <Root enableCanvas={false} />
    </div>
  );

  app.diagram = new Diagram();

  const result = render(component);

  await waitFor(() => expect(app.diagram.fields.length).toBe(1));

  result.unmount();
});

test("Root veresion updated", async () => {
  const component = (
    <div id="root-container">
      <Root enableCanvas={false} />
    </div>
  );

  localStorage.setItem("appVersion", APP_VERSION_STRING);

  const result = render(component);

  result.unmount();

  ///

  localStorage.setItem("appVersion", "0.0.1");

  const result2 = render(component);

  result2.unmount();
});

test("Root unload", async () => {
  const { app } = getRootStore();

  app.diagram = new Diagram();

  const component = (
    <div id="root-container">
      <Root enableCanvas={false} />
    </div>
  );

  const result = render(component);

  act(() => {
    window.dispatchEvent(new Event("beforeunload"));
  });

  act(() => {
    app.setModified(true);
    window.dispatchEvent(new Event("beforeunload"));
  });

  result.unmount();
});

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

  result.unmount();
});

test("handleDiagramParam", async () => {
  const { app } = getRootStore();

  const d = new Diagram();
  d.addField(new Field("a✓à", 12));
  d.addField(new Field("b", 12));
  d.addField(new Field("我不是中文", 12));
  const encodedJsonDiagram = window.btoa(unescape(encodeURIComponent(d.toJson())));

  await handleDiagramParam(encodedJsonDiagram.replaceAll("+", "-").replaceAll("/", "_"));

  expect(app.diagram.fields.length).toBe(3);
  expect(app.diagram.fields[0].name).toBe("a✓à");
  expect(app.diagram.fields[0].length).toBe(12);
  expect(app.diagram.fields[1].name).toBe("b");
  expect(app.diagram.fields[1].length).toBe(12);
  expect(app.diagram.fields[2].name).toBe("我不是中文");
  expect(app.diagram.fields[2].length).toBe(12);

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

test("handleCustomHotkey", () => {
  const { app, confirmation, logger } = getRootStore();
  const component = (
    <div id="root-container">
      <Root enableCanvas={false} />
    </div>
  );
  confirmation.close();
  logger.clear();

  const result = render(component);
  expect(app.diagramEditor.scale).toBe(1);
  act(() => {
    fireEvent.keyDown(document.body, { key: "add", code: "add", ctrlKey: true });
    fireEvent.keyUp(document.body, { key: "add", code: "add", ctrlKey: true });
  });
  expect(app.diagramEditor.scale).toBe(1.5);
  act(() => {
    fireEvent.keyDown(document.body, { key: "subtract", code: "subtract", ctrlKey: true });
    fireEvent.keyUp(document.body, { key: "subtract", code: "subtract", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "subtract", code: "subtract", ctrlKey: true });
    fireEvent.keyUp(document.body, { key: "subtract", code: "subtract", ctrlKey: true });
  });
  expect(app.diagramEditor.scale).toBe(0.75);
  act(() => {
    fireEvent.keyDown(document.body, { key: "0", code: "0", ctrlKey: true });
    fireEvent.keyUp(document.body, { key: "0", code: "0", ctrlKey: true });
  });
  expect(app.diagramEditor.scale).toBe(1);

  const inputField = result.container.querySelector("input")!;

  act(() => {
    fireEvent.input(inputField, { target: { value: "add 1 testadd" } });
    fireEvent.keyDown(inputField, { key: "Enter" });
  });

  expect(app.diagram.fields.length).toBe(1);
  expect(app.diagram.fields[0].name).toBe("testadd");
  expect(logger.logs.length).toBe(1);
  expect(logger.logs[0].message).toBe('Added field "testadd".');

  act(() => {
    fireEvent.keyDown(document.body, { key: "z", code: "z", ctrlKey: true });
    fireEvent.keyUp(document.body, { key: "z", code: "z", ctrlKey: true });
  });

  expect(app.diagram.fields.length).toBe(0);
  expect(logger.logs.length).toBe(2);
  expect(logger.logs[1].message).toBe("Undo add");

  act(() => {
    fireEvent.keyDown(document.body, { key: "z", code: "z", ctrlKey: true });
    fireEvent.keyUp(document.body, { key: "z", code: "z", ctrlKey: true });
  });

  expect(app.diagram.fields.length).toBe(0);
  expect(logger.logs.length).toBe(3);
  expect(logger.logs[2].message).toBe("Nothing to undo");

  act(() => {
    fireEvent.keyDown(document.body, { key: "y", code: "y", ctrlKey: true });
    fireEvent.keyUp(document.body, { key: "y", code: "y", ctrlKey: true });
  });

  expect(app.diagram.fields.length).toBe(1);
  expect(app.diagram.fields[0].name).toBe("testadd");
  expect(logger.logs.length).toBe(4);
  expect(logger.logs[3].message).toBe("Redo add");

  act(() => {
    fireEvent.keyDown(document.body, { key: "y", code: "y", ctrlKey: true });
    fireEvent.keyUp(document.body, { key: "y", code: "y", ctrlKey: true });
  });

  expect(app.diagram.fields.length).toBe(1);
  expect(app.diagram.fields[0].name).toBe("testadd");
  expect(logger.logs.length).toBe(5);
  expect(logger.logs[4].message).toBe("Nothing to redo");

  result.unmount();
});

test("OnDragEnter root-container", () => {
  const { confirmation, logger, modals } = getRootStore();
  const component = <Root enableCanvas={false} />;
  confirmation.close();
  logger.clear();
  modals.close();

  const result = render(component);
  const rootContainerDiv = result.container.querySelector("#root-container")!;
  act(() => {
    fireEvent.dragEnter(rootContainerDiv, { dataTransfer: { types: ["Files"] } });
  });
  expect(result.container.querySelector(".modal-backdrop")).toBeInTheDocument();
});

test("Dummy", () => {});

