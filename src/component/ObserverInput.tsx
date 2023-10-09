import { TextField, TextFieldProps } from "@mui/material";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { forwardRef } from "react";

export type ObserverInputProps = TextFieldProps & {
  getValue: () => string;
  setValue: (value: string, payload: any) => void;
  isValidIntermediate: (candidate: string) => boolean;
  isValidValue: (candidate: string) => boolean | [boolean, any];
  numeric?: boolean; // default false
};

const ObserverInput = observer(
  forwardRef<HTMLInputElement | null, ObserverInputProps>((props: ObserverInputProps, ref) => {
    // rest is used to send props to TextField without custom attributes
    const { getValue, setValue, isValidIntermediate, isValidValue, numeric: isNumeric, ...rest } = props;

    const initialValue = React.useState(() => getValue())[0];
    const inputRef = React.useRef<HTMLInputElement>(null);
    const lastValidValue = React.useRef(initialValue);
    const lastValidIntermediate = React.useRef(initialValue);

    React.useImperativeHandle(ref, () => inputRef.current!);

    function onChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
      const element = event.nativeEvent.target as HTMLInputElement;
      const candidate = element.value;

      if (!isValidIntermediate(candidate)) {
        event.preventDefault();

        element.value = lastValidIntermediate.current;
      } else {
        lastValidIntermediate.current = candidate;
      }
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
      const element = event.nativeEvent.target as HTMLInputElement;

      if (event.code === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault();
        element.blur();
        onConfirm(event);
      } else if (isNumeric && event.code === "ArrowDown") {
        onConfirm(event);
        element.value = parseFloat(getValue()) - 1 + "";
        onConfirm(event);
      } else if (isNumeric && event.code === "ArrowUp") {
        onConfirm(event);
        element.value = parseFloat(getValue()) + 1 + "";
        onConfirm(event);
      } else if (event.code === "Escape") {
        element.value = "";
        onConfirm(event);
        element.blur();
      }

      rest.onKeyDown?.(event);
    }

    function onBlur(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
      onConfirm(event);

      rest.onBlur?.(event);
    }

    function onConfirm(event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement, Event>) {
      const element = event.nativeEvent.target as HTMLInputElement;
      const candidate = element.value;
      let rtn: string;

      const result = isValidValue(candidate);
      const isValid = Array.isArray(result) ? result[0] : result;
      const payload = Array.isArray(result) ? result[1] : undefined;
      if (isValid === false) {
        element.value = rtn = lastValidValue.current;
      } else {
        rtn = candidate;
      }

      setValue(rtn, payload);
      inputRef.current &&
        (inputRef.current.value = lastValidValue.current = lastValidIntermediate.current = getValue());
    }

    const value = getValue();

    React.useEffect(() => {
      const value = getValue();
      if (value !== lastValidValue.current) {
        lastValidValue.current = value;
        lastValidIntermediate.current = value;
        inputRef.current!.value = value;
      }
    }, [value, getValue]);

    return (
      <TextField
        InputLabelProps={{ shrink: true }}
        inputRef={inputRef}
        size="small"
        defaultValue={initialValue}
        onChange={action(onChange)}
        {...rest}
        onKeyDown={action(onKeyDown)}
        onBlur={action(onBlur)}
      />
    );
  })
);

export { ObserverInput };