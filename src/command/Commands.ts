import { getRootStore } from "../core/Root";
import { Cancellable } from "../diagram/Diagram";
import { Field } from "../diagram/Field";
import { BooleanT, CommandLine, NumberT, Parameter, ParameterType, StringT } from "../token/Tokens";
import { HandleResult, fail, success } from "./HandleResult";

export interface UsageSpec {
  name: string;
  paramType: typeof NumberT | typeof BooleanT | typeof StringT;
  description: string;
  check?: (param: Parameter<ParameterType>) => HandleResult;
}

export function validateParameterUsage(param: Parameter<ParameterType>, usage: UsageSpec): HandleResult {
  if (param.value instanceof usage.paramType) {
    if (usage.check) {
      const result = usage.check(param);
      if (!result.success) return result;
    } 
    return success("");
  } else {
    // if (usage.paramType === BooleanT) return fail(`The ${usage.name} must be a boolean.`);
    // if (usage.paramType === NumberT) return fail(`The ${usage.name} must be a number.`);
    // return fail(`The ${usage.name} must be a string.`);
    return fail(`The ${usage.name} must be a ${(() => {
      if (usage.paramType === BooleanT) return "boolean";
      if (usage.paramType === NumberT) return "number";
      return "string";
    })()}.`);
  }
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
  constructor(readonly name: string, readonly usage: UsageSpec[], readonly description: string) {}

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
    if (this.name.toUpperCase() === line.name.toUpperCase()) {
      if (line.params.length < this.usage.length) return HandleResult.TOO_FEW_ARGUMENTS;
      if (line.params.length > this.usage.length) return HandleResult.TOO_MANY_ARGUMENTS;
      for (let i = 0; i < line.params.length; i++) {
        const usage = this.usage[i];
        const param = line.params[i];
        const result = validateParameterUsage(param, usage);
        if (!result.success) return result;
      }
      return this.handle(line.params);
    }
    return HandleResult.NOT_HANDLED;
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
    return [new UndoCommand(), new RedoCommand(), new AddCommand()];
  }
}

/**
 * an abstract class that extends Command and ICancellable, which acts as an adapter,
 * every commands extends upon this will be recognized as cancellable command
 */
export abstract class CancellableCommand extends Command implements Cancellable {
  constructor(name: string, usage: UsageSpec[], description: string) {
    super(name, usage, description);
  }
  readonly discriminator = "DiagramModifier";

  execute(): void {}
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
      [
        {
          name: "length",
          paramType: NumberT,
          description: "the length of the field",
          check: param => {
            if (param.getInt() <= 0) return fail("Length must be a positive integer.");
            return success("");
          }
        },
        {
          name: "name",
          paramType: StringT,
          description: "the name of the field"
        }
      ],
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
    super("undo", [], "Undo the last action");
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
    super("redo", [], "Redo the last action");
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    const { app } = getRootStore();
    const command: CancellableCommand | null = app.redo();
    if (command == null) return fail("Nothing to redo");
    else return success("Redo " + command.name);
  }
}
