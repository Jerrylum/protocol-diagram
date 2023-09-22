import { getRootStore } from "../core/Root";
import { Cancellable } from "../diagram/Diagram";
import { Field } from "../diagram/Field";
import { CommandLine, Parameter, ParameterType } from "../token/Tokens";
import { HandleResult, fail, success } from "./HandleResult";

export abstract class Command {
  /**
   * a constructor that takes three values, name, usage, and description and
   * assign them into the instance variables
   *
   * @param name        the name of the command
   * @param usage       the usage of the command
   * @param description the description of the command
   */
  constructor(readonly name: string, readonly usage: string, readonly description: string) {}

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
    if (this.name.toUpperCase() === line.name.toUpperCase()) return this.handle(line.params);
    else return HandleResult.NOT_HANDLED;
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
}

/**
 * an abstract class that extends Command and ICancellable, which acts as an adapter,
 * every commands extends upon this will be recognized as cancellable command
 */
export abstract class CancellableCommand extends Command implements Cancellable {
  constructor(name: string, usage: string, description: string) {
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
    super("add", "<length> <name>", "Add a field to the end of the diagram");
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
    if (params.length < 2) return HandleResult.TOO_FEW_ARGUMENTS;
    if (params.length > 2) return HandleResult.TOO_MANY_ARGUMENTS;

    const paramLength = params[0];
    if (!paramLength.isNumber() || paramLength.getInt() <= 0) return fail("Length must be a positive integer.");

    const paramName = params[1];
    if (!paramName.isString()) return fail("Name must be a string.");

    this.paramLength = paramLength.getInt();
    this.paramName = paramName.getString();

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
      super("undo", "", "Undo the last action");
  }

  handle(params: Parameter<ParameterType>[]): HandleResult {
      if (params.length > 0)
          return HandleResult.TOO_MANY_ARGUMENTS;
      const { app } = getRootStore();
      const command: CancellableCommand | null = app.handler.undo();
      if (command == null)
          return fail("Nothing to undo");
      else
          return success("Undo " + command.name);
  }

}

/**
 * this command responsible in popping the redo stack and pushing the popped history
 * into the undo stack.
 */
export class RedoCommand extends Command {
    
  constructor() {
      super("redo", "", "Redo the last action");
  }
  
  handle(params: Parameter<ParameterType>[]): HandleResult {
      if (params.length > 0)
          return HandleResult.TOO_MANY_ARGUMENTS;
      const { app } = getRootStore();
      const command: CancellableCommand | null = app.handler.redo();
      if (command == null)
          return fail("Nothing to redo");
      else
          return success("Redo " + command.name);
  }
  
}
