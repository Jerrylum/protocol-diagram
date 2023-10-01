import { Box, Button, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CommandLine, CodePointBuffer } from "../token/Tokens";
import { CancellableCommand, Command } from "../command/Commands";
import { HandleResult } from "../command/HandleResult";
import { getRootStore } from "../core/Root";
import { isDiagramModifier } from "../diagram/Diagram";
import React from "react";

export const CommandInputField = observer(() => {
  const { logger } = getRootStore();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.target as HTMLInputElement;
      const command = input.value;
      const buffer: CodePointBuffer = new CodePointBuffer(command);
      const line: CommandLine | null = CommandLine.parse(buffer);

      if (line == null) {
        logger.error('Usage: <command> [arguments]\nPlease type "help" for more information.');
        input.value = "";
        return;
      }

      const { app } = getRootStore();
      for (const cmd of Command.getAvailableCommands()) {
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
        }
        if (result.message) logger.info(result.message);
        input.value = "";
        return;
      }
      logger.error('Unknown command "' + line.name + '". Please type "help" for more information.');
      input.value = "";
      return;
    }
  };

  return <TextField fullWidth size="small" spellCheck={false} onKeyDown={handleKeyDown} />;
});
