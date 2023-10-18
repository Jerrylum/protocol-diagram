import { makeAutoObservable, when } from "mobx";
import { Modals } from "./Modals";

export interface ConfirmationButton {
  label: string;
  onClick?: () => void;
  hotkey?: string;
  color?: "inherit" | "primary" | "secondary" | "success" | "error" | "info" | "warning";
}

export interface ConfirmationPromptData {
  title: string;
  description: React.ReactNode;
  buttons: ConfirmationButton[];
  onKeyDown?(e: React.KeyboardEvent<HTMLDivElement>, onClick: (index: number) => void): void;
}

export interface ConfirmationInputPromptData extends ConfirmationPromptData {
  inputLabel: string;
  inputDefaultValue: string;
}

export class Confirmation {
  private data?: ConfirmationPromptData | ConfirmationInputPromptData;
  public input?: string;

  constructor(private modals: () => Modals) {
    makeAutoObservable(this);
  }

  close() {
    this.modals().close(ConfirmationModalSymbol);
    this.data = undefined;
  }

  async prompt(data: ConfirmationPromptData | ConfirmationInputPromptData, priority: number = 1) {
    if (data.buttons.length === 0) {
      data.buttons.push({ label: "OK" });
    }

    this.close();
    this.data = data;
    if ("inputLabel" in data && "inputDefaultValue" in data) {
      this.input = data.inputDefaultValue;
    } else {
      this.input = undefined;
    }

    this.modals().open(ConfirmationModalSymbol, priority);

    await when(() => this.data === undefined);

    return this.input;
  }

  get isOpen() {
    return this.data !== undefined && this.modals().opening === ConfirmationModalSymbol;
  }

  get title() {
    return this.data?.title ?? "";
  }

  set title(value: string) {
    if (this.data === undefined) return;
    this.data.title = value;
  }

  get description() {
    return this.data?.description ?? "";
  }

  set description(value: React.ReactNode) {
    if (this.data === undefined) return;
    this.data.description = value;
  }

  get buttons() {
    return this.data?.buttons ?? [];
  }

  get onKeyDown() {
    return this.data?.onKeyDown;
  }

  get inputLabel() {
    return (this.data as ConfirmationInputPromptData)?.inputLabel ?? "";
  }
}

export const ConfirmationModalSymbol = Symbol("ConfirmationModalSymbol");
