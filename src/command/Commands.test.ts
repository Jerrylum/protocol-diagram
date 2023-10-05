import { CommandLine, NumberT } from "../token/Tokens";
import { AddCommand, ConfigCommand, HelpCommand, RedoCommand, UndoCommand } from "./Commands";
import { cpb } from "../token/Tokens.test";
import { getRootStore } from "../core/Root";

let { app } = getRootStore();

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

test("UndoCommand handle success", () => {
  const uc = new UndoCommand();
  const ac = new AddCommand();
  expect(ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!).success).toBe(true);
  const { app } = getRootStore();
  app.operate(ac);
  expect(uc.handleLine(CommandLine.parse(cpb("undo"))!).success).toBe(true);
});

test("UndoCommand handle fail", () => {
  const uc = new UndoCommand();
  expect(uc.handleLine(CommandLine.parse(cpb("undo test"))!).success).toBe(false);
  expect(uc.handleLine(CommandLine.parse(cpb("undo"))!).success).toBe(false);
});

test("RedoCommand handle success", () => {
  const uc = new UndoCommand();
  const ac = new AddCommand();
  expect(ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!).success).toBe(true);
  const { app } = getRootStore();
  app.operate(ac);
  expect(uc.handleLine(CommandLine.parse(cpb("undo"))!).success).toBe(true);
  const rc = new RedoCommand();
  expect(rc.handleLine(CommandLine.parse(cpb("redo"))!).success).toBe(true);
});

test("RedoCommand handle fail", () => {
  const rc = new RedoCommand();
  expect(rc.handleLine(CommandLine.parse(cpb("redo test"))!).success).toBe(false);
  expect(rc.handleLine(CommandLine.parse(cpb("redo"))!).success).toBe(false);
});

test("ConfigCommand handle success", () => {
  const cc = new ConfigCommand();
  expect(cc.handleLine(CommandLine.parse(cpb("config bit 12"))!).success).toBe(true);
  expect(cc.paramKey).toBe("bit");
});

test("ConfigCommand handle fail", () => {
  const cc = new ConfigCommand();
  expect(cc.handleLine(CommandLine.parse(cpb("config"))!).success).toBe(false);
  expect(cc.handleLine(CommandLine.parse(cpb("config bit"))!).success).toBe(false);
});

test("HelpCommand handle success", () => {
  const hc = new HelpCommand();
  expect(hc.handleLine(CommandLine.parse(cpb("help"))!).success).toBe(true);
});

test("getCommandUsage", () => {
  const ac = new AddCommand();
  expect(ac.getCommandUsage()).toBe("add <length> <name>");
  const uc = new UndoCommand();
  expect(uc.getCommandUsage()).toBe("undo");
  const rc = new RedoCommand();
  expect(rc.getCommandUsage()).toBe("redo");
  const cc = new ConfigCommand();
  expect(cc.getCommandUsage()).toBe("config <key> <value>");
  const hc = new HelpCommand();
  expect(hc.getCommandUsage()).toBe("help");
});
