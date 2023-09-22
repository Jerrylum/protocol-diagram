import { Diagram } from "../diagram/Diagram";
import { MainApp } from "./MainApp";

test("MainApp", () => {
  const app = new MainApp();
  const d = new Diagram();
  app.diagram = d;
  expect(d).toBe(app.diagram);
  expect(app.isModified()).toBe(false);
  app.setModified(true);
  expect(app.isModified()).toBe(true);
});
