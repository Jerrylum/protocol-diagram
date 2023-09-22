import { CommandLine } from "../token/Tokens";
import { AddCommand, UndoCommand } from "./Commands";
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

// public class UndoCommandTest {

//   @Test
//   public void testUndoCommandHandleSuccess() {
//       UndoCommand uc = new UndoCommand();
//       List<Parameter> params = new ArrayList<Parameter>();
//       AddCommand tic = new AddCommand();
//       Main.handler.operate(tic);
//       assertTrue(uc.handle(params).success());
//   }

//   @Test
//   public void testUndoCommandHandleFail() {
//       UndoCommand uc = new UndoCommand();
//       List<Parameter> params = new ArrayList<Parameter>();
//       assertFalse(uc.handle(params).success());

//       params.add(Parameter.parse(new CodePointBuffer("test")));
//       assertFalse(uc.handle(params).success());
//   }
// }

test("UndoCommand handle success", () => {
  const uc = new UndoCommand();
  const ac = new AddCommand();
  expect(ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!).success).toBe(true);
  expect(uc.handleLine(CommandLine.parse(cpb("undo"))!).success).toBe(true);
});

test("UndoCommand handle fail", () => {
  const uc = new UndoCommand();
  expect(uc.handleLine(CommandLine.parse(cpb("undo test"))!).success).toBe(false);
});
