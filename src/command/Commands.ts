import { HelpModalSymbol } from "../app/HelpModal";
import { BooleanOption, EnumOption, Option, OptionType, RangeOption } from "../config/Option";
import { getRootStore } from "../core/Root";
import { Cancellable, DiagramModifier } from "../diagram/Diagram";
import { Field } from "../diagram/Field";
import {
  BooleanT,
  CommandLine,
  CommandParameter,
  NumberT,
  Parameter,
  ParameterType,
  ParameterTypeByClass,
  ParameterTypeClass,
  StringT
} from "../token/Tokens";
import { HandleResult, fail, success } from "./HandleResult";

export interface UsageSpec {
  name: string;
  paramType: ParameterTypeClass;
  description: string;
  check?: (param: Parameter<ParameterType>) => HandleResult;
}

export interface InputSpec<T extends ParameterTypeClass> {
  name: string;
  description: string;
  acceptedValues: readonly string[];
  paramType: T;
  check?: (param: Parameter<ParameterTypeByClass<T>>) => HandleResult;
  next: InputSpec<ParameterTypeClass> | null;
}

export function getCommandUsage(cmd: Command): string {
  let line = "";
  line += `${cmd.name}`;
  if (!cmd.usage) return line;
  line += " <";
  let curr: InputSpec<ParameterTypeClass> | null = cmd.usage;
  while (curr) {
    line += curr.name;
    curr = curr.next;
    if (curr) {
      line += "> <";
    }
  }
  line += ">";
  return line;
}

export abstract class Command {
  /**
   * a constructor that takes three values, name, usage, and description and
   * assign them into the instance variables
   *
   * @param name        the name of the command
   * @param usage       the usage of the command
   * @param description the description of the command
   */
  constructor(
    readonly name: string,
    readonly usage: InputSpec<ParameterTypeClass> | null,
    readonly description: string
  ) {}

  /**
   * a method that determines whether the current command instance matches the
   * prefix of the line,
   * if yes, then a list of parameters will be created and will be passed to the
   * abstract function `handle` that will be implemented by the descendent
   * classes,
   * if no, then return a `HandleResult` not_handled
   *
   * @param line the command line that holds the prefix and the parameters
   * @return HandleResult
   */
  handleLine(line: CommandLine): HandleResult {
    if (this.name.toUpperCase() !== line.name.toUpperCase()) return HandleResult.NOT_HANDLED;

    const checkResult = checkCommandParameters(this.usage, line.params);

    if (checkResult[0].success) return this.handle(line.params);
    else return checkResult[0];
  }

  /**
   * a abstract method that will be implemented later on by the descendent
   * classes, by the logic of the command handling,
   * this method would only be invoked when the command instance matches the
   * prefix of the input command, it will be passed
   * a list of parameters for providing the context for the command handling, once
   * it is finished, it is required to return
   * a `HandleResult` instance for indicating the state of the command outcome
   *
   * @param params a list of parameters
   * @return HandleResult
   */
  abstract handle(params: Parameter<ParameterType>[]): HandleResult;

  static getAvailableCommands(): Command[] {
    return [
      new AddCommand(),
      new ClearCommand(),
      new ConfigCommand(),
      new DeleteCommand(),
      new HelpCommand(),
      new InsertCommand(),
      new MoveCommand(),
      new RedoCommand(),
      new RenameCommand(),
      new ResizeCommand(),
      new UndoCommand()
    ];
  }

  getCommandUsage(): string {
    return getCommandUsage(this);
  }
}

/**
 * an abstract class that extends Command and ICancellable, which acts as an adapter,
 * every commands extends upon this will be recognized as cancellable command
 */
export abstract class CancellableCommand extends Command implements Cancellable {
  readonly discriminator = "DiagramModifier";

  abstract execute(): void;
}

/**
 * this command is responsible for adding fields into the diagram instance
 */
export class AddCommand extends CancellableCommand {
  /**
   * the length of the to-be added field
   */
  paramLength!: number;

  /**
   * the name of the to-be added field
   */
  paramName!: string;

  /**
   * this command is responsible for adding fields into the diagram instance
   */
  constructor() {
    super(
      "add",
      buildInputSpecByUsages([
        {
          name: "length",
          paramType: NumberT,
          description: "the length of the field",
          check: param => {
            if (param.isDouble()) return fail("Length must be a integer.");
            if (param.getInt() <= 0) return fail("Length must be a positive integer.");
            return success("");
          }
        },
        {
          name: "name",
          paramType: StringT,
          description: "the name of the field"
        }
      ]),
      "Add a field to the end of the diagram"
    );
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    this.paramLength = params[0].getInt();
    this.paramName = params[1].getString();

    this.execute();

    return success('Added field "' + this.paramName + '".');
  }

  execute() {
    const { app } = getRootStore();
    app.diagram.addField(new Field(this.paramName, this.paramLength));
  }
}

/**
 * this command responsible in popping the undo stack and pushing the popped history
 * into the redo stack.
 */
export class UndoCommand extends Command {
  constructor() {
    super("undo", null, "Undo the last action");
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    const { app } = getRootStore();
    const command: CancellableCommand | null = app.undo();
    if (command == null) return fail("Nothing to undo");
    else return success("Undo " + command.name);
  }
}

/**
 * this command responsible in popping the redo stack and pushing the popped history
 * into the undo stack.
 */
export class RedoCommand extends Command {
  constructor() {
    super("redo", null, "Redo the last action");
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    const { app } = getRootStore();
    const command: CancellableCommand | null = app.redo();
    if (command == null) return fail("Nothing to redo");
    else return success("Redo " + command.name);
  }
}

/**
 * this command is responsible in setting the value of the specified option by its key name
 */
export class ConfigCommand extends Command implements DiagramModifier {
  discriminator!: "DiagramModifier";

  /**
   * the key of the specified option
   */
  paramKey!: string;

  /**
   * the value will be applied after the execution
   */
  paramValue!: Parameter<ParameterType>;

  constructor() {
    super("config", buildInputSpecByAppDiagramOptions(), "Change options' value");
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    const paramKey: string = params[0].getString();
    const { app } = getRootStore();
    const option: Option<OptionType> = app.diagram.config.getOption(paramKey)!;
    this.paramKey = paramKey;
    this.paramValue = params[1];

    return option.setValue(this.paramValue);
  }

  getCommandUsage(): string {
    return this.name + " <key> <value>";
  }
}

/**
 * this command is responsible in deleting undesired field from the diagram by specified index
 */
export class DeleteCommand extends CancellableCommand {
  /**
   * the index of the position of the undesired field
   */
  paramIndex!: number;

  constructor() {
    super(
      "delete",
      buildInputSpecByUsages([
        {
          name: "index",
          paramType: NumberT,
          description: "the index of the field",
          check: param => {
            if (param.isDouble()) return fail("Index must be a integer.");
            if (param.getInt() < 0) return fail("Index must be a positive integer or zero.");
            const { app } = getRootStore();
            if (param.getInt() >= app.diagram.size()) return fail("Index out of range.");
            return success("");
          }
        }
      ]),
      "Remove the specified field from the diagram"
    );
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    this.paramIndex = params[0].getInt();
    const { app } = getRootStore();
    const f: Field = app.diagram.getField(this.paramIndex);

    this.execute();

    return success('Deleted field "' + f.name + "'.");
  }

  execute() {
    const { app } = getRootStore();
    app.diagram.removeField(this.paramIndex);
  }
}

/**
 * this command responsible in adding new field in to the diagram with specified index
 */
export class InsertCommand extends CancellableCommand {
  /**
   * the index of position that will be injected the new field
   */
  paramIndex!: number;
  /**
   * the length of the to-be created field
   */
  paramLength!: number;
  /**
   * the name of the to-be created field
   */
  paramName!: string;

  constructor() {
    super(
      "insert",
      buildInputSpecByUsages([
        {
          name: "index",
          paramType: NumberT,
          description: "the index of the field",
          check: param => {
            if (param.isDouble()) return fail("Index must be a integer.");
            if (param.getInt() < 0) return fail("Index must be a positive integer or zero.");
            const { app } = getRootStore();
            if (param.getInt() >= app.diagram.size()) return fail("Index out of range.");
            return success("");
          }
        },
        {
          name: "length",
          paramType: NumberT,
          description: "the length of the field",
          check: param => {
            if (param.isDouble()) return fail("Length must be a integer.");
            if (param.getInt() <= 0) return fail("Length must be a positive integer.");
            return success("");
          }
        },
        {
          name: "name",
          paramType: StringT,
          description: "the name of the field"
        }
      ]),
      "Insert a field at the given index"
    );
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    this.paramIndex = params[0].getInt();
    this.paramLength = params[1].getInt();
    this.paramName = params[2].getString();

    const { app } = getRootStore();

    this.execute();

    let msg: string;

    if (this.paramIndex === 0) msg = 'Inserted field "' + this.paramName + '" to the beginning.';
    else
      msg = 'Inserted field "' + this.paramName + '" after "' + app.diagram.getField(this.paramIndex - 1).name + '".';

    return success(msg);
  }

  execute() {
    const { app } = getRootStore();
    app.diagram.insertField(this.paramIndex, new Field(this.paramName, this.paramLength));
  }
}

/**
 * this command is responsible in rearrange the field from a specified index to an another specified index
 */
export class MoveCommand extends CancellableCommand {
  /**
   * the index of the to-be rearranged field
   */
  paramIndex!: number;
  /**
   * the new position of the field
   */
  paramTargetIndex!: number;

  constructor() {
    super(
      "move",
      buildInputSpecByUsages([
        {
          name: "source_index",
          paramType: NumberT,
          description: "the index of the source field",
          check: param => {
            if (param.isDouble()) return fail("Source index must be a integer.");
            if (param.getInt() < 0) return fail("Source index must be a positive integer or zero.");
            const { app } = getRootStore();
            if (param.getInt() >= app.diagram.size()) return fail("Source index out of range.");
            return success("");
          }
        },
        {
          name: "destination_index",
          paramType: NumberT,
          description: "the index of the destination field",
          check: param => {
            if (param.isDouble()) return fail("Destination index must be a integer.");
            if (param.getInt() < 0) return fail("Destination index must be a positive integer or zero.");
            const { app } = getRootStore();
            if (param.getInt() >= app.diagram.size()) return fail("Destination index out of range.");
            return success("");
          }
        }
      ]),
      "Move the specified field from one position to another"
    );
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    this.paramIndex = params[0].getInt();
    this.paramTargetIndex = params[1].getInt();

    const { app } = getRootStore();

    if (this.paramIndex === this.paramTargetIndex) return fail("Source and Destination index cannot be the same.");

    const f = app.diagram.getField(this.paramIndex);
    let msg: string;

    if (this.paramTargetIndex === 0) msg = 'Moved field "' + f.name + '" to the beginning.';
    else if (this.paramTargetIndex === app.diagram.size() - 1) msg = 'Moved field "' + f.name + '" to the end.';
    else msg = 'Moved field "' + f.name + '" after "' + app.diagram.getField(this.paramTargetIndex - 1).name + '".';

    this.execute();

    return success(msg);
  }

  execute() {
    const { app } = getRootStore();
    app.diagram.moveField(this.paramIndex, this.paramTargetIndex);
  }
}

/**
 * this command responsible in renaming a specific field with a new name
 */
export class RenameCommand extends CancellableCommand {
  /**
   * the index of the affecting field
   */
  paramIndex!: number;
  /**
   * the new name will be applied after the execution
   */
  paramNewName!: string;

  constructor() {
    super(
      "rename",
      buildInputSpecByUsages([
        {
          name: "index",
          paramType: NumberT,
          description: "the index of the field",
          check: param => {
            if (param.isDouble()) return fail("Index must be a integer.");
            if (param.getInt() < 0) return fail("Index must be a positive integer or zero.");
            const { app } = getRootStore();
            if (param.getInt() >= app.diagram.size()) return fail("Index out of range.");
            return success("");
          }
        },
        {
          name: "name",
          paramType: StringT,
          description: "the name of the field"
        }
      ]),
      "Rename the specified field"
    );
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    this.paramIndex = params[0].getInt();
    this.paramNewName = params[1].getString();

    const { app } = getRootStore();
    const f = app.diagram.getField(this.paramIndex);
    const oldName = f.name;

    this.execute();

    return success('Renamed field from "' + oldName + '" to "' + f.name + '".');
  }

  execute() {
    const { app } = getRootStore();
    app.diagram.getField(this.paramIndex).name = this.paramNewName;
  }
}

/**
 * this command responsible in resizing a specific field with a new size
 */
export class ResizeCommand extends CancellableCommand {
  /**
   * the index of the affecting field
   */
  paramIndex!: number;
  /**
   * the new size will be applied after the execution
   */
  paramNewSize!: number;

  constructor() {
    super(
      "resize",
      buildInputSpecByUsages([
        {
          name: "index",
          paramType: NumberT,
          description: "the index of the field",
          check: param => {
            if (param.isDouble()) return fail("Index must be a integer.");
            if (param.getInt() < 0) return fail("Index must be a positive integer or zero.");
            const { app } = getRootStore();
            if (param.getInt() >= app.diagram.size()) return fail("Index out of range.");
            return success("");
          }
        },
        {
          name: "length",
          paramType: NumberT,
          description: "the length of the field",
          check: param => {
            if (param.isDouble()) return fail("Length must be a integer.");
            if (param.getInt() <= 0) return fail("Length must be a positive integer.");
            return success("");
          }
        }
      ]),
      "Resize the specified field"
    );
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    this.paramIndex = params[0].getInt();
    this.paramNewSize = params[1].getInt();
    const { app } = getRootStore();
    const f = app.diagram.getField(this.paramIndex);
    const oldLength = f.length;

    this.execute();

    return success('Resized field "' + f.name + '" from ' + oldLength + " to " + f.length + ".");
  }

  execute() {
    const { app } = getRootStore();
    app.diagram.getField(this.paramIndex).length = this.paramNewSize;
  }
}

/**
 * this command is responsible for clearing the diagram fields
 */
export class ClearCommand extends CancellableCommand {
  constructor() {
    super("clear", null, "Remove all fields and start again");
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    this.execute();

    return success("Removed all fields.");
  }

  execute() {
    const { app } = getRootStore();
    app.diagram.clear();
  }
}

/**
 * this command is responsible in showing a user manual on screen
 */
export class HelpCommand extends Command {
  public constructor() {
    super("help", null, "Show help message");
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    const { modals } = getRootStore();
    modals.open(HelpModalSymbol);
    return success("Help message");
  }
}

export function checkCommandParameters(
  spec: InputSpec<ParameterTypeClass> | null,
  params: CommandParameter<ParameterType>[]
): [HandleResult, InputSpec<ParameterTypeClass> | null] {
  let curr = spec;
  let i = 0;
  while (curr !== null) {
    if (i >= params.length) return [HandleResult.TOO_FEW_ARGUMENTS, curr];
    const param = params[i];
    if (param.value instanceof curr.paramType) {
      if (curr.check) {
        const result = curr.check(param);
        if (!result.success) return [result, curr];
      }
    } else {
      return [
        fail(
          `The ${curr.name} must be a ${(() => {
            if (curr.paramType === BooleanT) return "boolean";
            if (curr.paramType === NumberT) return "number";
            return "string";
          })()}.`
        ),
        curr
      ];
    }
    curr = curr.next;
    i++;
  }

  if (i < params.length) return [HandleResult.TOO_MANY_ARGUMENTS, null];

  return [success(""), null];
}

export type ParameterAndInputSpecMapping = {
  startIndex: number;
  endIndex: number;
} & (
  | {
      param: CommandParameter<ParameterType>;
      spec: InputSpec<ParameterTypeClass>;
    }
  | {
      param: CommandParameter<ParameterType>;
      spec: null;
    }
  | {
      param: null;
      spec: InputSpec<ParameterTypeClass>;
    }
);

export function mapCommandParameterWithInputSpec(
  params: CommandParameter<ParameterType>[],
  spec: InputSpec<ParameterTypeClass> | null
): ParameterAndInputSpecMapping[] {
  const result: ParameterAndInputSpecMapping[] = [];

  let i = 0;
  let curr = spec;

  for (; i < params.length; i++) {
    const param = params[i];
    if (curr === null) {
      result.push({ startIndex: param.startIndex, endIndex: param.endIndex, param, spec: curr });
    } else {
      if (param.value instanceof curr.paramType) {
        if (curr.check) {
          const checkResult = curr.check(param);
          if (checkResult.success) {
            result.push({ startIndex: param.startIndex, endIndex: param.endIndex, param, spec: curr });
            curr = curr.next;
          } else {
            result.push({ startIndex: param.startIndex, endIndex: param.endIndex, param, spec: curr });
            curr = null;
          }
        } else {
          result.push({ startIndex: param.startIndex, endIndex: param.endIndex, param, spec: curr });
          curr = curr.next;
        }
      } else {
        result.push({ startIndex: param.startIndex, endIndex: param.endIndex, param, spec: curr });
        curr = null;
      }
    }
  }

  if (curr !== null) {
    const endIndex = params.length > 0 ? params[params.length - 1].endIndex : -1;
    result.push({ startIndex: endIndex + 1, endIndex: endIndex + 1, param: null, spec: curr });
  }

  return result;
}

export type CommandOption = BooleanOption | EnumOption<readonly string[]> | RangeOption;

export function buildInputSpecByUsages(usages: UsageSpec[]): InputSpec<ParameterTypeClass> | null {
  let head: InputSpec<ParameterTypeClass> | null = null;
  let tail: InputSpec<ParameterTypeClass> | null = null;
  for (const usage of usages) {
    const spec: InputSpec<ParameterTypeClass> = {
      name: usage.name,
      description: usage.description,
      acceptedValues: [],
      paramType: usage.paramType,
      check: usage.check,
      next: null
    };
    if (head == null) {
      head = spec;
      tail = spec;
    } else {
      tail!.next = spec;
      tail = spec;
    }
  }
  return head;
}

export class OptionSpec implements InputSpec<typeof StringT> {
  constructor(private readonly _options: ReadonlyArray<CommandOption>) {}

  readonly name = "key";

  readonly description = "the key of the option";

  get acceptedValues() {
    return this.getOptions().map(o => o.key);
  }

  readonly paramType = StringT;

  private lastRequest: CommandOption | null = null;

  check(param: Parameter<StringT>): HandleResult {
    const key = param.getString();
    for (const option of this.getOptions()) {
      if (option.key === key) {
        this.lastRequest = option;
        return success("");
      }
    }
    this.lastRequest = null;
    return fail("Invalid option key.");
  }

  get next(): InputSpec<ParameterTypeClass> | null {
    return this.lastRequest
      ? new (class implements InputSpec<ParameterTypeClass> {
          constructor(readonly option: CommandOption) {}

          readonly name = "value";

          get description() {
            return this.option.getUsageDescription();
          }

          get acceptedValues() {
            if (this.option instanceof BooleanOption) return ["true", "false"];
            if (this.option instanceof RangeOption) return [];
            return this.option.acceptedValues;
          }

          get paramType() {
            if (this.option instanceof BooleanOption) return BooleanT;
            if (this.option instanceof RangeOption) return NumberT;
            return StringT;
          }

          check(param: Parameter<ParameterType>): HandleResult {
            return this.option.clone().setValue(param);
          }

          next = null;
        })(this.lastRequest)
      : null;
  }

  protected getOptions(): ReadonlyArray<CommandOption> {
    return this._options;
  }
}

export function buildInputSpecByOptions(options: ReadonlyArray<CommandOption>): InputSpec<typeof StringT> | null {
  return new OptionSpec(options);
}

export class AppDiagramOptionSpec extends OptionSpec {
  constructor() {
    super([]);
  }

  protected getOptions(): ReadonlyArray<CommandOption> {
    const { app } = getRootStore();

    return app.diagram.config.options as CommandOption[];
  }
}

export function buildInputSpecByAppDiagramOptions(): InputSpec<typeof StringT> | null {
  return new AppDiagramOptionSpec();
}

export class CommandLineSpec implements InputSpec<typeof StringT> {
  constructor(readonly commands: ReadonlyArray<Command>) {}

  readonly name = "command";

  readonly description = "the command to execute";

  get acceptedValues() {
    return this.commands.map(c => c.name);
  }

  readonly paramType = StringT;

  private lastRequest: Command | null = null;

  check(param: Parameter<StringT>): HandleResult {
    const key = param.getString();
    for (const command of this.commands) {
      if (command.name === key) {
        this.lastRequest = command;
        return success("");
      }
    }
    this.lastRequest = null;
    return fail("Invalid command.");
  }

  get next(): InputSpec<ParameterTypeClass> | null {
    return this.lastRequest ? this.lastRequest.usage : null;
  }
}

export function buildInputSpecByCommands(commands: Command[]): InputSpec<typeof StringT> | null {
  return new CommandLineSpec(commands);
}

