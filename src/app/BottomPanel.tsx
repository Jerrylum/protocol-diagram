import { Box, Input } from "@mui/material";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import {
  buildInputSpecByCommands,
  Command,
  mapCommandParameterWithInputSpec,
  ParameterAndInputSpecMapping
} from "../command/Commands";
import { useBetterMemo } from "../core/Hook";
import { CodePointBuffer, CommandParameterList } from "../token/Tokens";
import { CommandInputField } from "./CommandInputField";
import { ExportPanel } from "./ExportPanel";
import { InputHintsPopup } from "./InputHintsPopup";
import { LogPanel } from "./LogPanel";

export class BottomPanelController {
  private _mapping: ParameterAndInputSpecMapping | null = null;
  private _selected: string | null = null;
  private _inputElement: HTMLInputElement | null = null;
  private _isFocusedPopup: boolean = false;

  get mapping() {
    return this._mapping;
  }

  set mapping(mapping: ParameterAndInputSpecMapping | null) {
    this._mapping = mapping;
    if (this.selected === null || this.autoCompletionValues.includes(this.selected) === false)
      this.selected = this.autoCompletionValues[0] ?? null;
  }

  get inputElement() {
    return this._inputElement;
  }

  set inputElement(inputElement: HTMLInputElement | null) {
    this._inputElement = inputElement;
  }

  get selected() {
    return this._selected;
  }

  set selected(selected: string | null) {
    this._selected = selected && this.autoCompletionValues.includes(selected) ? selected : null;
  }

  get isFocusedPopup() {
    return this._isFocusedPopup;
  }

  set isFocusedPopup(isFocusedPopup: boolean) {
    this._isFocusedPopup = isFocusedPopup;
  }

  get autoCompletionValues(): string[] {
    if (this.mapping === null) return [];
    const spec = this.mapping.spec;
    if (spec === null) return [];
    const param = this.mapping.param;
    const currentParamValue = param?.value.value ?? "";
    const acceptedValues = spec.acceptedValues;
    const filtered = acceptedValues.filter(
      v => v.startsWith(currentParamValue) && v.length >= currentParamValue.length
    );

    return filtered;
  }

  insertAutoCompletionValue(target: string): boolean {
    const mapping = this.mapping;
    const input = this.inputElement;
    if (mapping === null || input === null) return false;

    const inputValue = input.value;

    const head = inputValue.slice(0, mapping.startIndex);
    const tail = inputValue.slice(mapping.endIndex);
    const updatedCaretPos = mapping.startIndex + target.length + 1;
    const updateInputValue = head + target + tail + (tail === "" ? " " : "");

    input.value = updateInputValue;
    input.selectionStart = updatedCaretPos;
    input.selectionEnd = updatedCaretPos;

    this.updateMapping();

    return true;
  }

  updateMapping() {
    const input = this.inputElement;
    if (input === null) return;

    const startCaretPos = input.selectionStart;
    const endCaretPos = input.selectionEnd;

    if (startCaretPos !== endCaretPos || startCaretPos === null) {
      this.mapping = null;
      return;
    }

    const inputValue = input.value;
    const caretPos = startCaretPos;

    const buffer: CodePointBuffer = new CodePointBuffer(inputValue);
    const list: CommandParameterList | null = CommandParameterList.parse(buffer);
    const allCommands = Command.getAvailableCommands();

    if (list == null) {
      this.mapping = null;
      return;
    }
    const spec = buildInputSpecByCommands(allCommands)!;
    const mappingList = mapCommandParameterWithInputSpec(list.params, spec);
    const mapping = mappingList.find(m => m.startIndex <= caretPos && caretPos <= m.endIndex);
    this.mapping = mapping ?? null;
  }

  constructor() {
    makeAutoObservable(this);
  }
}

export const BottomPanel = observer(() => {
  const controller = useBetterMemo(() => new BottomPanelController(), []);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: "32px",
        maxWidth: "90vw",
        width: "600px",
        left: "50%",
        transform: "translate(-50%, 0)",
        backgroundColor: "white"
      }}>
      <Box sx={{ position: "relative" }}>
        <CommandInputField controller={controller} />
        <LogPanel />
        <ExportPanel />
        <InputHintsPopup controller={controller} />
      </Box>
    </Box>
  );
});

