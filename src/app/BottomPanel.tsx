import { Box, Input } from "@mui/material";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { ParameterAndInputSpecMapping } from "../command/Commands";
import { useBetterMemo } from "../core/Hook";
import { CommandInputField } from "./CommandInputField";
import { ExportPanel } from "./ExportPanel";
import { InputHintsPopup } from "./InputHintsPopup";
import { LogPanel } from "./LogPanel";

export class BottomPanelController {
  private _mapping: ParameterAndInputSpecMapping | null = null;
  private _inputElement: HTMLInputElement | null = null;

  get mapping() {
    return this._mapping;
  }

  set mapping(mapping: ParameterAndInputSpecMapping | null) {
    this._mapping = mapping;
  }

  get inputElement() {
    return this._inputElement;
  }

  set inputElement(inputElement: HTMLInputElement | null) {
    this._inputElement = inputElement;
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
