import { BooleanT, CommandLine, CommandParameter, NumberT, Parameter, ParameterType, StringT } from "../token/Tokens";
import {
  AddCommand,
  DeleteCommand,
  InsertCommand,
  MoveCommand,
  RenameCommand,
  ResizeCommand,
  ClearCommand,
  Command,
  CommandLineSpec,
  ConfigCommand,
  HelpCommand,
  OptionSpec,
  RedoCommand,
  UndoCommand,
  buildInputSpecByCommands,
  buildInputSpecByOptions,
  buildInputSpecByUsages,
  checkCommandParameters,
  mapCommandParameterWithInputSpec
} from "./Commands";
import { cpb } from "../token/Tokens.test";
import { getRootStore } from "../core/Root";
import { HandleResult, success, fail } from "./HandleResult";
import { BooleanOption, EnumOption, RangeOption } from "../config/Option";

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
  expect(ac.handleLine(CommandLine.parse(cpb("add 1.5 test"))!).success).toBe(false);
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

test("mapCommandParameterWithInputSpec", () => {
  const inspec = buildInputSpecByUsages([
    {
      name: "testbool",
      paramType: BooleanT,
      description: "test description"
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

  const commandParameters = [
    CommandParameter.parse(cpb("true"))!,
    CommandParameter.parse(cpb("123"))!,
    CommandParameter.parse(cpb("test"))!
  ];
  const map = mapCommandParameterWithInputSpec(commandParameters, inspec!);
  expect(map.length).toBe(3);
  expect(map[0].spec).toBe(inspec!);
  expect(map[1].spec).toBe(inspec!.next);
  expect(map[2].spec).toBe(inspec!.next!.next);
  expect(map[0].param).toBe(commandParameters[0]);
  expect(map[1].param).toBe(commandParameters[1]);
  expect(map[2].param).toBe(commandParameters[2]);

  const commandParameters2 = [
    CommandParameter.parse(cpb("true"))!,
    CommandParameter.parse(cpb("123"))!,
    CommandParameter.parse(cpb("test"))!,
    CommandParameter.parse(cpb("test"))!
  ];
  const map2 = mapCommandParameterWithInputSpec(commandParameters2, inspec!);
  expect(map2.length).toBe(4);
  expect(map2[3].spec).toBe(null);
  expect(map2[3].param).toBe(commandParameters2[3]);

  const commandParameters3 = [
    CommandParameter.parse(cpb("123"))!,
    CommandParameter.parse(cpb("123"))!,
    CommandParameter.parse(cpb("test"))!
  ];
  const map3 = mapCommandParameterWithInputSpec(commandParameters3, inspec!);
  expect(map3.length).toBe(3);
  expect(map3[0].spec).toBe(inspec!);
  expect(map3[1].spec).toBe(null);
  expect(map3[2].spec).toBe(null);

  const commandParameters4 = [
    CommandParameter.parse(cpb("true"))!,
    CommandParameter.parse(cpb("-1"))!,
    CommandParameter.parse(cpb("test"))!
  ];
  const map4 = mapCommandParameterWithInputSpec(commandParameters4, inspec!);
  expect(map4.length).toBe(3);
  expect(map4[0].spec).toBe(inspec!);
  expect(map4[1].spec).toBe(inspec!.next);
  expect(map4[2].spec).toBe(null);

  const commandParameters5 = [CommandParameter.parse(cpb("true"))!, CommandParameter.parse(cpb("123"))!];
  const map5 = mapCommandParameterWithInputSpec(commandParameters5, inspec!);
  expect(map5.length).toBe(3);
  expect(map5[0].spec).toBe(inspec!);
  expect(map5[1].spec).toBe(inspec!.next);
  expect(map5[2].spec).toBe(inspec!.next!.next);
  expect(map5[0].param).toBe(commandParameters5[0]);
  expect(map5[1].param).toBe(commandParameters5[1]);
  expect(map5[2].param).toBe(null);

  const commandParameters6: typeof commandParameters = [];
  const map6 = mapCommandParameterWithInputSpec(commandParameters6, inspec!);
  expect(map6.length).toBe(1);
  expect(map6[0].spec).toBe(inspec!);
  expect(map6[0].param).toBe(null);
});

class MockCommand extends Command {
  handle(params: Parameter<ParameterType>[]): HandleResult {
    return success("test");
  }
}

test("CommandLineSpec", () => {
  const mc = new MockCommand(
    "test",
    buildInputSpecByUsages([
      {
        name: "length",
        paramType: NumberT,
        description: "the length of the field",
        check: param => {
          return success("");
        }
      }
    ]),
    "test description"
  );
  const cspec = buildInputSpecByCommands([mc]) as CommandLineSpec;
  let hr = cspec!.check!(Parameter.parse(cpb("error")) as Parameter<StringT>);
  expect(hr.success).toBe(false);
  expect(cspec?.next).toBe(null);
  expect(cspec?.acceptedValues).toStrictEqual([mc.name]);
  hr = cspec!.check!(Parameter.parse(cpb("test")) as Parameter<StringT>);
  expect(hr.success).toBe(true);
  expect(cspec?.next).toBe(mc.usage);
  expect(cspec?.acceptedValues).toStrictEqual([mc.name]);
});

test("OptionSpec", () => {
  const eo = new EnumOption("EO", "test1", ["test1", "test2", "test3"]);
  const bo = new BooleanOption("BO", false);
  const ro = new RangeOption("RO", 1, 1, 10);
  const os = buildInputSpecByOptions([eo, bo, ro]) as OptionSpec;

  let hr = os.check!(Parameter.parse(cpb("test")) as Parameter<StringT>);
  expect(hr.success).toBe(false);
  expect(hr.message).toBe("Invalid option key.");
  expect(os.next).toBe(null);
  expect(os.acceptedValues).toStrictEqual(["EO", "BO", "RO"]);

  hr = os.check!(Parameter.parse(cpb("EO")) as Parameter<StringT>);
  expect(hr.success).toBe(true);
  const madeInputSpect = os.next;
  expect(madeInputSpect?.description).toBe(eo.getUsageDescription());
  expect(madeInputSpect?.acceptedValues).toStrictEqual(eo.acceptedValues);
  expect(madeInputSpect?.paramType).toBe(StringT);
  expect(madeInputSpect?.check).not.toBe(null);

  hr = os.check!(Parameter.parse(cpb("BO")) as Parameter<StringT>);
  expect(hr.success).toBe(true);
  const madeInputSpect2 = os.next;
  expect(madeInputSpect2?.description).toBe(bo.getUsageDescription());
  expect(madeInputSpect2?.acceptedValues).toStrictEqual(["true", "false"]);
  expect(madeInputSpect2?.paramType).toBe(BooleanT);
  expect(madeInputSpect2?.check).not.toBe(null);

  hr = os.check!(Parameter.parse(cpb("RO")) as Parameter<StringT>);
  expect(hr.success).toBe(true);
  const madeInputSpect3 = os.next;
  expect(madeInputSpect3?.description).toBe(ro.getUsageDescription());
  expect(madeInputSpect3?.acceptedValues).toStrictEqual([]);
  expect(madeInputSpect3?.paramType).toBe(NumberT);
  expect(madeInputSpect3?.check).not.toBe(null);
});

test("DeleteCommand handle success", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const dc = new DeleteCommand();
  const ac = new AddCommand();
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  ac.handleLine(CommandLine.parse(cpb("add 2 test2"))!);
  ac.handleLine(CommandLine.parse(cpb("add 3 test3"))!);
  expect(app.diagram.fields.length).toBe(3);
  expect(dc.handleLine(CommandLine.parse(cpb("delete 0"))!).success).toBe(true);
  expect(app.diagram.fields.length).toBe(2);
  expect(dc.handleLine(CommandLine.parse(cpb("delete 0"))!).success).toBe(true);
  expect(app.diagram.fields.length).toBe(1);
  expect(dc.handleLine(CommandLine.parse(cpb("delete 0"))!).success).toBe(true);
  expect(app.diagram.fields.length).toBe(0);
});

test("DeleteCommand handle fail", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const dc = new DeleteCommand();
  expect(dc.handleLine(CommandLine.parse(cpb("delete"))!)).toStrictEqual(HandleResult.TOO_FEW_ARGUMENTS);
  expect(dc.handleLine(CommandLine.parse(cpb("delete 0"))!)).toStrictEqual(fail("Index out of range."));
  expect(dc.handleLine(CommandLine.parse(cpb("delete -1"))!)).toStrictEqual(
    fail("Index must be a positive integer or zero.")
  );
  expect(dc.handleLine(CommandLine.parse(cpb("delete a"))!)).toStrictEqual(fail("The index must be a number."));
  const ac = new AddCommand();
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  ac.handleLine(CommandLine.parse(cpb("add 2 test2"))!);
  expect(dc.handleLine(CommandLine.parse(cpb("delete 1.5"))!)).toStrictEqual(fail("Index must be a integer."));
  expect(dc.handleLine(CommandLine.parse(cpb("delete 1 2"))!)).toStrictEqual(HandleResult.TOO_MANY_ARGUMENTS);
});

test("InsertCommand handle success", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const ic = new InsertCommand();
  const ac = new AddCommand();
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  ac.handleLine(CommandLine.parse(cpb("add 2 test2"))!);
  ac.handleLine(CommandLine.parse(cpb("add 3 test3"))!);
  expect(app.diagram.fields.length).toBe(3);
  expect(ic.handleLine(CommandLine.parse(cpb("insert 0 1 test4"))!)).toStrictEqual(
    success('Inserted field "test4" to the beginning.')
  );
  expect(app.diagram.fields.length).toBe(4);
  expect(ic.handleLine(CommandLine.parse(cpb("insert 1 1 test5"))!)).toStrictEqual(
    success('Inserted field "test5" after "test4".')
  );
});

test("InsertCommand handle fail", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const ic = new InsertCommand();
  const ac = new AddCommand();
  expect(ic.handleLine(CommandLine.parse(cpb("insert 0 1 test"))!)).toStrictEqual(fail("Index out of range."));
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  expect(ic.handleLine(CommandLine.parse(cpb("insert"))!)).toStrictEqual(HandleResult.TOO_FEW_ARGUMENTS);
  expect(ic.handleLine(CommandLine.parse(cpb("insert 0"))!)).toStrictEqual(HandleResult.TOO_FEW_ARGUMENTS);
  expect(ic.handleLine(CommandLine.parse(cpb("insert 0 1"))!)).toStrictEqual(HandleResult.TOO_FEW_ARGUMENTS);
  expect(ic.handleLine(CommandLine.parse(cpb("insert a 1 test"))!)).toStrictEqual(fail("The index must be a number."));
  expect(ic.handleLine(CommandLine.parse(cpb("insert 0 a test"))!)).toStrictEqual(fail("The length must be a number."));
  expect(ic.handleLine(CommandLine.parse(cpb("insert 1.5 1 test"))!)).toStrictEqual(fail("Index must be a integer."));
  expect(ic.handleLine(CommandLine.parse(cpb("insert 0 1.5 test"))!)).toStrictEqual(fail("Length must be a integer."));
  expect(ic.handleLine(CommandLine.parse(cpb("insert -1 1 test"))!)).toStrictEqual(
    fail("Index must be a positive integer or zero.")
  );
  expect(ic.handleLine(CommandLine.parse(cpb("insert 0 -1 test"))!)).toStrictEqual(
    fail("Length must be a positive integer.")
  );
});

test("MoveCommand handle success", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const mc = new MoveCommand();
  const ac = new AddCommand();
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  ac.handleLine(CommandLine.parse(cpb("add 2 test2"))!);
  ac.handleLine(CommandLine.parse(cpb("add 3 test3"))!);
  ac.handleLine(CommandLine.parse(cpb("add 4 test4"))!);
  expect(app.diagram.fields.length).toBe(4);
  expect(mc.handleLine(CommandLine.parse(cpb("move 1 0"))!)).toStrictEqual(
    success('Moved field "test2" to the beginning.')
  );
  expect(mc.handleLine(CommandLine.parse(cpb("move 3 1"))!)).toStrictEqual(
    success('Moved field "test4" after "test2".')
  );
  expect(mc.handleLine(CommandLine.parse(cpb("move 0 3"))!)).toStrictEqual(success('Moved field "test2" to the end.'));
});

test("MoveCommand handle fail", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const mc = new MoveCommand();
  const ac = new AddCommand();
  expect(mc.handleLine(CommandLine.parse(cpb("move 0 1"))!)).toStrictEqual(fail("Source index out of range."));
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  expect(mc.handleLine(CommandLine.parse(cpb("move 0 1"))!)).toStrictEqual(fail("Destination index out of range."));
  ac.handleLine(CommandLine.parse(cpb("add 2 test2"))!);
  expect(mc.handleLine(CommandLine.parse(cpb("move"))!)).toStrictEqual(HandleResult.TOO_FEW_ARGUMENTS);
  expect(mc.handleLine(CommandLine.parse(cpb("move 0"))!)).toStrictEqual(HandleResult.TOO_FEW_ARGUMENTS);
  expect(mc.handleLine(CommandLine.parse(cpb("move a 1"))!)).toStrictEqual(fail("The source_index must be a number."));
  expect(mc.handleLine(CommandLine.parse(cpb("move 0 a"))!)).toStrictEqual(
    fail("The destination_index must be a number.")
  );
  expect(mc.handleLine(CommandLine.parse(cpb("move 1.5 1"))!)).toStrictEqual(fail("Source index must be a integer."));
  expect(mc.handleLine(CommandLine.parse(cpb("move 0 1.5"))!)).toStrictEqual(
    fail("Destination index must be a integer.")
  );
  expect(mc.handleLine(CommandLine.parse(cpb("move -1 1"))!)).toStrictEqual(
    fail("Source index must be a positive integer or zero.")
  );
  expect(mc.handleLine(CommandLine.parse(cpb("move 0 -1"))!)).toStrictEqual(
    fail("Destination index must be a positive integer or zero.")
  );
  expect(mc.handleLine(CommandLine.parse(cpb("move 0 0"))!)).toStrictEqual(
    fail("Source and Destination index cannot be the same.")
  );
});

test("RenameCommand handle success", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const rc = new RenameCommand();
  const ac = new AddCommand();
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  ac.handleLine(CommandLine.parse(cpb("add 2 test2"))!);
  ac.handleLine(CommandLine.parse(cpb("add 3 test3"))!);
  expect(app.diagram.fields.length).toBe(3);
  expect(rc.handleLine(CommandLine.parse(cpb("rename 0 test4"))!)).toStrictEqual(
    success('Renamed field from "test1" to "test4".')
  );
  expect(rc.handleLine(CommandLine.parse(cpb("rename 1 test5"))!)).toStrictEqual(
    success('Renamed field from "test2" to "test5".')
  );
  expect(rc.handleLine(CommandLine.parse(cpb("rename 2 test6"))!)).toStrictEqual(
    success('Renamed field from "test3" to "test6".')
  );
});

test("RenameCommand handle fail", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const rc = new RenameCommand();
  const ac = new AddCommand();
  expect(rc.handleLine(CommandLine.parse(cpb("rename 0 test"))!)).toStrictEqual(fail("Index out of range."));
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  expect(rc.handleLine(CommandLine.parse(cpb("rename -1 test"))!)).toStrictEqual(
    fail("Index must be a positive integer or zero.")
  );
  expect(rc.handleLine(CommandLine.parse(cpb("rename 0"))!)).toStrictEqual(HandleResult.TOO_FEW_ARGUMENTS);
  expect(rc.handleLine(CommandLine.parse(cpb("rename a test"))!)).toStrictEqual(fail("The index must be a number."));
  expect(rc.handleLine(CommandLine.parse(cpb("rename 1.5 123"))!)).toStrictEqual(fail("Index must be a integer."));
  expect(rc.handleLine(CommandLine.parse(cpb("rename 0 123"))!)).toStrictEqual(fail("The name must be a string."));
  expect(rc.handleLine(CommandLine.parse(cpb("rename 0 test 123"))!)).toStrictEqual(HandleResult.TOO_MANY_ARGUMENTS);
});

test("ResizeCommand handle success", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const rc = new ResizeCommand();
  const ac = new AddCommand();
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  ac.handleLine(CommandLine.parse(cpb("add 2 test2"))!);
  ac.handleLine(CommandLine.parse(cpb("add 3 test3"))!);
  expect(app.diagram.fields.length).toBe(3);
  expect(rc.handleLine(CommandLine.parse(cpb("resize 0 1"))!)).toStrictEqual(
    success('Resized field "test1" from 1 to 1.')
  );
  expect(rc.handleLine(CommandLine.parse(cpb("resize 1 2"))!)).toStrictEqual(
    success('Resized field "test2" from 2 to 2.')
  );
  expect(rc.handleLine(CommandLine.parse(cpb("resize 2 3"))!)).toStrictEqual(
    success('Resized field "test3" from 3 to 3.')
  );
});

test("ResizeCommand handle fail", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const rc = new ResizeCommand();
  const ac = new AddCommand();
  expect(rc.handleLine(CommandLine.parse(cpb("resize 0 1"))!)).toStrictEqual(fail("Index out of range."));
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  expect(rc.handleLine(CommandLine.parse(cpb("resize -1 1"))!)).toStrictEqual(
    fail("Index must be a positive integer or zero.")
  );
  expect(rc.handleLine(CommandLine.parse(cpb("resize 0"))!)).toStrictEqual(HandleResult.TOO_FEW_ARGUMENTS);
  expect(rc.handleLine(CommandLine.parse(cpb("resize a 1"))!)).toStrictEqual(fail("The index must be a number."));
  expect(rc.handleLine(CommandLine.parse(cpb("resize 0 a"))!)).toStrictEqual(fail("The length must be a number."));
  expect(rc.handleLine(CommandLine.parse(cpb("resize 1.5 1"))!)).toStrictEqual(fail("Index must be a integer."));
  expect(rc.handleLine(CommandLine.parse(cpb("resize 0 1.5"))!)).toStrictEqual(fail("Length must be a integer."));
  expect(rc.handleLine(CommandLine.parse(cpb("resize 0 -1"))!)).toStrictEqual(
    fail("Length must be a positive integer.")
  );
  expect(rc.handleLine(CommandLine.parse(cpb("resize 0 0"))!)).toStrictEqual(
    fail("Length must be a positive integer.")
  );
  expect(rc.handleLine(CommandLine.parse(cpb("resize 0 1 1"))!)).toStrictEqual(HandleResult.TOO_MANY_ARGUMENTS);
});

test("ClearCommand handle success", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const cc = new ClearCommand();
  const ac = new AddCommand();
  ac.handleLine(CommandLine.parse(cpb("add 1 test1"))!);
  ac.handleLine(CommandLine.parse(cpb("add 2 test2"))!);
  ac.handleLine(CommandLine.parse(cpb("add 3 test3"))!);
  expect(app.diagram.fields.length).toBe(3);
  expect(cc.handleLine(CommandLine.parse(cpb("clear"))!)).toStrictEqual(success("Removed all fields."));
  expect(app.diagram.fields.length).toBe(0);
});

test("ClearCommand handle fail", () => {
  const { app } = getRootStore();
  app.diagram.clear();
  const cc = new ClearCommand();
  const ac = new AddCommand();
  expect(cc.handleLine(CommandLine.parse(cpb("clear test"))!)).toStrictEqual(HandleResult.TOO_MANY_ARGUMENTS);
});
