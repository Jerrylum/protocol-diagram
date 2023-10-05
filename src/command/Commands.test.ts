import { BooleanT, CommandLine, CommandParameter, NumberT, StringT } from "../token/Tokens";
import {
  AddCommand,
  ConfigCommand,
  HelpCommand,
  RedoCommand,
  UndoCommand,
  buildInputSpecByUsages,
  checkCommandParameters
} from "./Commands";
import { cpb } from "../token/Tokens.test";
import { getRootStore } from "../core/Root";
import { HandleResult, success, fail } from "./HandleResult";

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

test("checkCommandParameters", () => {
  const inspec = buildInputSpecByUsages([
    {
      name: "testbool",
      paramType: BooleanT,
      description: "test description",
      check: param => {
        return success("");
      }
    },
    {
      name: "testnum",
      paramType: NumberT,
      description: "test description",
      check: param => {
        if (param.getInt() < 0) {
          return fail("test error num");
        }
        return success("");
      }
    },
    {
      name: "teststr",
      paramType: StringT,
      description: "test description",
      check: param => {
        if (param.getString() === "testerror") {
          return fail("test error str");
        }
        return success("");
      }
    }
  ]);
  const [hr, problemspec] = checkCommandParameters(inspec, [CommandParameter.parse(cpb("true"))!]);
  expect(hr).toBe(HandleResult.TOO_FEW_ARGUMENTS);
  expect(problemspec).toBe(inspec!.next);

  const [hr2, problemspec2] = checkCommandParameters(inspec, [
    CommandParameter.parse(cpb("123"))!,
    CommandParameter.parse(cpb("123"))!,
    CommandParameter.parse(cpb("123"))!
  ]);
  expect(hr2.success).toBe(false);
  expect(hr2.message).toBe("The testbool must be a boolean.");
  expect(problemspec2).toBe(inspec);

  const [hr3, problemspec3] = checkCommandParameters(inspec, [
    CommandParameter.parse(cpb("true"))!,
    CommandParameter.parse(cpb("-1"))!,
    CommandParameter.parse(cpb("123"))!
  ]);
  expect(hr3.success).toBe(false);
  expect(hr3.message).toBe("test error num");
  expect(problemspec3).toBe(inspec!.next);

  const [hr4, problemspec4] = checkCommandParameters(inspec, [
    CommandParameter.parse(cpb("true"))!,
    CommandParameter.parse(cpb("str"))!,
    CommandParameter.parse(cpb("testerror"))!
  ]);
  expect(hr4.success).toBe(false);
  expect(hr4.message).toBe("The testnum must be a number.");
  expect(problemspec4).toBe(inspec!.next);

  const [hr5, problemspec5] = checkCommandParameters(inspec, [
    CommandParameter.parse(cpb("true"))!,
    CommandParameter.parse(cpb("123"))!,
    CommandParameter.parse(cpb("testerror"))!
  ]);
  expect(hr5.success).toBe(false);
  expect(hr5.message).toBe("test error str");
  expect(problemspec5).toBe(inspec!.next!.next);

  const [hr6, problemspec6] = checkCommandParameters(inspec, [
    CommandParameter.parse(cpb("true"))!,
    CommandParameter.parse(cpb("123"))!,
    CommandParameter.parse(cpb("test"))!
  ]);
  expect(hr6.success).toBe(true);
  expect(problemspec6).toBe(null);

  const [hr7, problemspec7] = checkCommandParameters(inspec, [
    CommandParameter.parse(cpb("true"))!,
    CommandParameter.parse(cpb("123"))!,
    CommandParameter.parse(cpb("123a"))!
  ]);
  expect(hr7.success).toBe(true);
  expect(problemspec7).toBe(null);
});
