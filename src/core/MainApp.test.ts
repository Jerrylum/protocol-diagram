import { Diagram } from "../diagram/Diagram";
import { MainApp } from "./MainApp";
// import { MainDiagramHandler } from "./MainDiagramHandler";
// import { getRootStore } from "./Root";


test("MainApp", () => {
  const app = new MainApp();
  // const test = new MainDiagramHandler(app);
  const d = new Diagram();
  app.diagram = d;
  expect(d).toBe(app.diagram);
  expect(app.isModified()).toBe(false);
  app.setModified(true);
  expect(app.isModified()).toBe(true);
});
