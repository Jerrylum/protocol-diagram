import { Box, Button, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CommandLine, CodePointBuffer } from "../token/Tokens";
import { CancellableCommand, Command } from "../command/Commands";
import { HandleResult } from "../command/HandleResult";
import { getRootStore } from "../core/Root";
import { isDiagramModifier } from "../diagram/Diagram";
import React from "react";

export const CommandInputField = observer(() => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.target as HTMLInputElement;
      const command = input.value;
      const buffer: CodePointBuffer = new CodePointBuffer(command);
      const line: CommandLine | null = CommandLine.parse(buffer);

      if (line == null) {
        console.log('Usage: <command> [arguments]\nPlease type "help" for more information.');
        input.value = "";
        return;
      }

      const { app } = getRootStore();
      for (const cmd of Command.getAvailableCommands()) {
        const result: HandleResult = cmd.handleLine(line);
        if (result == HandleResult.NOT_HANDLED) {
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
        console.log(result.message);
        input.value = "";
        console.log(app.diagram);
        return;
      }
      console.log('Unknown command "' + line.name + '". Please type "help" for more information.');
      input.value = "";
      console.log(app.diagram);
      return;
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      <TextField fullWidth size="small" spellCheck={false} onKeyDown={handleKeyDown} />
      <Box
        sx={{
          position: "absolute",
          top: "0",
          bottom: "0",
          left: "calc(100% + 4px)",
          width: "300px",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}>
        <Button
          onClick={e => {
            const { app } = getRootStore();
            navigator.clipboard.writeText(app.diagram.toString());
          }}>
          Export As Text
        </Button>
        {/* <Button>Share URL</Button> */}
      </Box>
    </Box>
  );
});
