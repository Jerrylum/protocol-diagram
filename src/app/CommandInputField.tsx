import { TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CommandLine, CodePointBuffer, CommandParameterList } from "../token/Tokens";
import {
  buildInputSpecByCommands,
  CancellableCommand,
  Command,
  mapCommandParameterWithInputSpec
} from "../command/Commands";
import { HandleResult } from "../command/HandleResult";
import { getRootStore } from "../core/Root";
import { isDiagramModifier } from "../diagram/Diagram";
import React from "react";
import { BottomPanelController } from "./BottomPanel";
import { action } from "mobx";

export const CommandInputField = observer((props: { controller: BottomPanelController }) => {
  const { app, logger } = getRootStore();
  const controller = props.controller;

  const getCaretPosition = (inputOrTextField: HTMLInputElement | HTMLTextAreaElement): number | null => {
    const start = inputOrTextField.selectionStart;
    const end = inputOrTextField.selectionEnd;

    return start !== end ? null : start;
  };

  const handleSpecUpdate = (inputValue: string, caretPos: number | null) => {
    if (caretPos === null) {
      controller.mapping = null;
      return;
    }

    const buffer: CodePointBuffer = new CodePointBuffer(inputValue);
    const list: CommandParameterList | null = CommandParameterList.parse(buffer);
    const allCommands = Command.getAvailableCommands();

    if (list == null) {
      controller.mapping = null;
      return;
    }
    const spec = buildInputSpecByCommands(allCommands)!;
    const mappingList = mapCommandParameterWithInputSpec(list.params, spec);
    const mapping = mappingList.find(m => m.startIndex <= caretPos && caretPos <= m.endIndex);
    controller.mapping = mapping ?? null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const input = e.target as HTMLInputElement;
    const inputValue = input.value;
    const buffer: CodePointBuffer = new CodePointBuffer(inputValue);
    const line: CommandLine | null = CommandLine.parse(buffer);
    const allCommands = Command.getAvailableCommands();

    if (e.key === "Enter") {
      e.preventDefault();

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
    if (e.key === "Tab") {
      const selected = controller.selected;
      const mapping = controller.mapping;

      if (selected !== null && mapping !== null) {
        e.preventDefault();

        const head = inputValue.slice(0, mapping.startIndex);
        const tail = inputValue.slice(mapping.endIndex);
        const updatedCaretPos = mapping.startIndex + selected.length + 1;
        const updateInputValue = head + selected + tail + (tail === "" ? " " : "");

        input.value = updateInputValue;
        input.selectionStart = updatedCaretPos;
        input.selectionEnd = updatedCaretPos;
      }

      return;
    }
    if (e.key === "ArrowUp") {
      const selected = controller.selected;
      const autoCompletionValues = controller.autoCompletionValues;

      if (selected !== null && autoCompletionValues.length > 0) {
        e.preventDefault();

        const selectedIndex = autoCompletionValues.indexOf(selected);
        const nextIndex = selectedIndex === 0 ? autoCompletionValues.length - 1 : selectedIndex - 1;

        controller.selected = autoCompletionValues[nextIndex];
      }
      return;
    }
    if (e.key === "ArrowDown") {
      const selected = controller.selected;
      const autoCompletionValues = controller.autoCompletionValues;

      if (selected !== null && autoCompletionValues.length > 0) {
        e.preventDefault();

        const selectedIndex = autoCompletionValues.indexOf(selected);
        const nextIndex = selectedIndex === autoCompletionValues.length - 1 ? 0 : selectedIndex + 1;

        controller.selected = autoCompletionValues[nextIndex];
      }
      return;
    }
    if (e.key === "Escape") {
      controller.mapping = null;
      return;
    }
    // if (e.ctrlKey || e.metaKey || e.altKey) {
    //   return;
    // }

    handleSpecUpdate(input.value, getCaretPosition(input));
  };

  // const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   if (e.key === "Escape") {
  //     controller.mapping = null;
  //     return;
  //   }
  //
  //   const input = e.target as HTMLInputElement;
  //   handleSpecUpdate(input.value, getCaretPosition(input));
  // };

  const handleTextFieldCaretChange = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const input = e.target as HTMLInputElement;

    // UX: Do not show the popup if the text field is empty.
    handleSpecUpdate(input.value, input.value === "" ? null : getCaretPosition(input));
  };

  return (
    <TextField
      fullWidth
      size="small"
      inputProps={{
        sx: { fontFamily: "Ubuntu Mono" },
        onKeyDown: action(handleKeyDown),
        // onKeyUp: handleKeyUp,
        onMouseDown: handleTextFieldCaretChange,
        onTouchStart: handleTextFieldCaretChange,
        onInput: handleTextFieldCaretChange,
        onPaste: handleTextFieldCaretChange,
        onCut: handleTextFieldCaretChange,
        // onMouseMove: handleTextFieldCaretChange,
        onSelect: handleTextFieldCaretChange
      }}
      inputRef={ref => (controller.inputElement = ref)}
      spellCheck={false}
    />
  );
});
