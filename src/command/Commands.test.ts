import { CommandLine } from "../token/Tokens";
import { AddCommand } from "./Commands";
import { cpb } from "../token/Tokens.test";
import { getRootStore } from "../core/Root";

let {app} = getRootStore();

test("AddCommand handle success", () => {
  app.diagram.clear();
  const ac = new AddCommand();
  expect(ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!).success).toBe(true);
  expect(ac.paramLength).toBe(1);
  expect(ac.paramName).toBe("test1");
  expect(ac.handleLine(CommandLine.parse(cpb("add 2 test2"))!).success).toBe(true);
  expect(ac.paramLength).toBe(2);
  expect(ac.paramName).toBe("test2");
  expect(ac.handleLine(CommandLine.parse(cpb("add 3 test3"))!).success).toBe(true);
  expect(ac.paramLength).toBe(3);
  expect(ac.paramName).toBe("test3");
  app.diagram.clear();
});

test("AddCommand handle fail", () => {
  app.diagram.clear();
  const ac = new AddCommand();
  expect(ac.handleLine(CommandLine.parse(cpb("add 1"))!).success).toBe(false);
  expect(ac.handleLine(CommandLine.parse(cpb("add 1 2 3"))!).success).toBe(false);
  expect(ac.handleLine(CommandLine.parse(cpb("test"))!).success).toBe(false);
  expect(ac.handleLine(CommandLine.parse(cpb("add a test"))!).success).toBe(false);
  expect(ac.handleLine(CommandLine.parse(cpb("add -1 test"))!).success).toBe(false);
  expect(ac.handleLine(CommandLine.parse(cpb("add 0 test"))!).success).toBe(false);
  expect(ac.handleLine(CommandLine.parse(cpb("add 1 -1"))!).success).toBe(false);
  app.diagram.clear();
});
