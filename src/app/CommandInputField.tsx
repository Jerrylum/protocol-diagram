import { Box, Button, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CommandLine, CodePointBuffer, Parameter, StringT, CommandParameterList } from "../token/Tokens";
import { buildInputSpecByCommands, CancellableCommand, checkCommandParameters, Command } from "../command/Commands";
import { HandleResult } from "../command/HandleResult";
import { getRootStore } from "../core/Root";
import { isDiagramModifier } from "../diagram/Diagram";
import React from "react";

export const CommandInputField = observer(() => {
  const { app, logger } = getRootStore();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const inputValue = input.value;
    const buffer: CodePointBuffer = new CodePointBuffer(inputValue);
    const line: CommandLine | null = CommandLine.parse(buffer);
    const allCommands = Command.getAvailableCommands();

    if (e.key === "Enter") {
      if (line == null) {
        logger.error('Usage: <command> [arguments]\nPlease type "help" for more information.');
        input.value = "";
        return;
      }

      for (const cmd of allCommands) {
        const result: HandleResult = cmd.handleLine(line);
        if (result === HandleResult.NOT_HANDLED) {
          continue;
        }
        if (result.success) {
          if (cmd instanceof CancellableCommand) {
            // ICancellable modifies the diagram and can be cancelled, it should be added to
            // timeline.
            app.operate(cmd);
          } else if (isDiagramModifier(cmd)) {
            // IDiagramModifier but not ICancellable
            // IDiagramModifier modifies the diagram but cannot be undone, for example,
            // config changes. It should not be added to timeline. However, it counts as a
            // modification, so the diagram should be marked as modified.
            app.setModified(true);
          }
          if (result.message) logger.info(result.message);
        } else {
          if (result.message) logger.error(result.message);
        }
        input.value = "";
        return;
      }
      logger.error('Unknown command "' + line.name + '". Please type "help" for more information.');
      input.value = "";
      return;
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const inputValue = input.value;
    const buffer: CodePointBuffer = new CodePointBuffer("" + inputValue);
    const list: CommandParameterList | null = CommandParameterList.parse(buffer);
    const allCommands = Command.getAvailableCommands();

    if (list == null) return;
    const spec = buildInputSpecByCommands(allCommands)!;
    const result = checkCommandParameters(spec, list.params);
    console.log(result[1]);
  };

  return <TextField fullWidth size="small" spellCheck={false} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />;
});

