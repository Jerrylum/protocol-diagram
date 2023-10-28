import { fireEvent, render } from "@testing-library/react";
import { ExportPanel } from "./ExportPanel";
import { act } from "react-dom/test-utils";
import { getRootStore } from "../core/Root";
import { Field } from "../diagram/Field";

test("Render ExportPanel", () => {
  // Create a mock clipboard object
  let mockClipboardData = "";
  const mockClipboard = {
    writeText: function (str: string) {
      mockClipboardData = str;
    },
    readText: function () {
      return mockClipboardData;
    }
  };
  // Define the new property
  Object.defineProperty(navigator, "clipboard", {
    get: () => mockClipboard
  });

  const components = (
    <div id="root-container">
      <ExportPanel />
    </div>
  );

  const result = render(components);
  expect(result.container).toMatchSnapshot();
  const button = result.container.querySelector("#root-container > div > button");

  // Test export as text
  act(() => {
    fireEvent.click(button!);
  });
  result.rerender(components);
  expect(result.baseElement).toMatchSnapshot();
  const exportTextli = result.baseElement.querySelectorAll("li")[0];
  const { app } = getRootStore();
  app.diagram.addField(new Field("a", 12));
  act(() => {
    fireEvent.click(exportTextli);
  });
  result.rerender(components);
  expect(navigator.clipboard.readText()).toBe(app.diagram.toString());

  // Test export as svg
  act(() => {
    fireEvent.click(button!);
  });
  result.rerender(components);
  expect(result.baseElement).toMatchSnapshot();
  const exportSvgli = result.baseElement.querySelectorAll("li")[1];
  act(() => {
    fireEvent.click(exportSvgli);
  });
  result.rerender(components);
  expect(navigator.clipboard.readText()).toBe(app.diagram.toSvgString());

  // Test export as url
  act(() => {
    fireEvent.click(button!);
  });
  result.rerender(components);
  expect(result.baseElement).toMatchSnapshot();
  const exportUrlli = result.baseElement.querySelectorAll("li")[2];
  act(() => {
    fireEvent.click(exportUrlli);
  });
  result.rerender(components);
  const encodedJsonDiagram = window.btoa(unescape(encodeURIComponent(app.diagram.toJson())));
  const base64String = encodedJsonDiagram.replaceAll("+", "-").replaceAll("/", "_");
  const origin = window.location.origin;
  const urlWithJson = `${origin}?diagram=${base64String}`;
  expect(navigator.clipboard.readText()).toBe(urlWithJson);
});
