import { Diagram } from "../diagram/Diagram";
import { MainDiagramHandler, getRootStore } from "./Root";

const { app } = getRootStore();

test("MainDiagramHandler", () => {
  let test = new MainDiagramHandler();
  expect(test.diagram).toBe(app.diagram);
  let d = new Diagram();
  test.diagram = d;
  expect(d).toBe(app.diagram);
  expect(test.isModified()).toBe(false);
  test.setModified(true);
  expect(test.isModified()).toBe(true);
});
