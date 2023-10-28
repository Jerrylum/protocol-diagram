import { TextField, TextFieldProps } from "@mui/material";
import { action, observable } from "mobx";
import { observer } from "mobx-react-lite";
import React, { forwardRef } from "react";
import { useBetterMemo } from "../core/Hook";

export type ObserverInputProps = StylelessObserverInputProps & TextFieldProps;

export type StylelessObserverInputProps = {
  getValue: () => string;
  setValue: (value: string, payload: any) => void;
  isValidIntermediate: (candidate: string) => boolean;
  isValidValue: (candidate: string) => boolean | [boolean, any];
  numeric?: boolean; // default false
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export const useStylelessObserverInput = <TProps extends StylelessObserverInputProps>(props: TProps) => {
  const { getValue, setValue, isValidIntermediate, isValidValue, numeric: isNumeric, ...rest } = props;

  const initialValue = React.useState(() => getValue())[0];
  const editingValue = useBetterMemo(() => observable.box(initialValue));
  const lastValidValue = React.useRef(initialValue);
  const lastValidIntermediate = React.useRef(initialValue);

  function onChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const element = event.nativeEvent.target as HTMLInputElement;
    const candidate = element.value;

    if (!isValidIntermediate(candidate)) {
      event.preventDefault();

      editingValue.set(lastValidIntermediate.current);
    } else {
      lastValidIntermediate.current = candidate;
      editingValue.set(candidate);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const element = event.nativeEvent.target as HTMLInputElement;

    if (event.code === "Enter" || event.code === "NumpadEnter") {
      event.preventDefault();
      element.blur();
      onConfirm();
    } else if (isNumeric && event.code === "ArrowDown") {
      onConfirm();
      editingValue.set(parseFloat(getValue()) - 1 + "");
      onConfirm();
    } else if (isNumeric && event.code === "ArrowUp") {
      onConfirm();
      editingValue.set(parseFloat(getValue()) + 1 + "");
      onConfirm();
    } else if (event.code === "Escape") {
      onConfirm(false);
      element.blur();
    } else {
      editingValue.set(element.value);
    }

    rest.onKeyDown?.(event);
  }

  function onBlur(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onConfirm();

    rest.onBlur?.(event);
  }

  function onConfirm(valid: boolean = true) {
    const candidate = editingValue.get();
    let rtn: string;

    const result = valid && isValidValue(candidate);
    const isValid = Array.isArray(result) ? result[0] : result;
    const payload = Array.isArray(result) ? result[1] : undefined;
    if (isValid === false) {
      editingValue.set((rtn = lastValidValue.current));
    } else {
      rtn = candidate;
    }

    setValue(rtn, payload);
    editingValue.set((lastValidValue.current = lastValidIntermediate.current = getValue()));
  }

  const value = getValue();

  React.useEffect(() => {
    const value = getValue();
    if (value !== lastValidValue.current) {
      lastValidValue.current = value;
      lastValidIntermediate.current = value;
      editingValue.set(value);
    }
  }, [value, getValue]);

  return {
    getRootProps: () => ({
      ...rest,
      value: editingValue.get(),
      onChange: action(onChange),
      onKeyDown: action(onKeyDown),
      onBlur: action(onBlur)
    })
  };
};

const ObserverInput = observer(
  forwardRef<HTMLInputElement | null, ObserverInputProps>((props: ObserverInputProps, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { getRootProps } = useStylelessObserverInput(props);

    React.useImperativeHandle(ref, () => inputRef.current!);

    return <TextField InputLabelProps={{ shrink: true }} inputRef={inputRef} size="small" {...getRootProps()} />;
  })
);

export { ObserverInput };

