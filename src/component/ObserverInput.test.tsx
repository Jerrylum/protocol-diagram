import { act, render, fireEvent } from "@testing-library/react";
import { ObserverInput } from "./ObserverInput";
import { Ref, createRef } from "react";
import { observable } from "mobx";

test("ObserverInput test", () => {
  let ref: Ref<HTMLInputElement | null> = createRef();
  let testValue = observable({ value: "12345" });
  function getValue() {
    return testValue.value;
  }
  const components = (
    <div id="root-container">
      <ObserverInput
        id="test"
        getValue={getValue}
        setValue={(value: string, payload: any) => {
          testValue.value = value;
        }}
        isValidIntermediate={(candidate: string) => {
          return candidate.startsWith("1") || candidate === "";
        }}
        isValidValue={(candidate: string) => {
          return candidate.startsWith("1234");
        }}
        numeric={true}
        ref={ref}
      />
    </div>
  );

  let result = render(components);
  let inputField = document.querySelector("#test") as HTMLInputElement;

  act(() => {
    fireEvent.input(inputField, { target: { value: "123" } });
    fireEvent.keyDown(inputField, { key: "Enter", code: "Enter" });
  });
  testValue.value = "1234567";
  result.rerender(components);
  expect(testValue.value).toBe("1234567");
  expect(inputField.value).toBe("1234567");

  testValue.value = "12345";
  result.unmount();
  result = render(components);
  inputField = document.querySelector("#test") as HTMLInputElement;

  act(() => {
    fireEvent.input(inputField, { target: { value: "23" } });
  });
  expect(inputField.value).toBe("12345");

  act(() => {
    fireEvent.input(inputField, { target: { value: "" } });
  });
  expect(inputField.value).toBe("");

  act(() => {
    fireEvent.input(inputField, { target: { value: "123" } });
  });
  expect(inputField.value).toBe("123");

  act(() => {
    fireEvent.input(inputField, { target: { value: "123" } });
    fireEvent.keyDown(inputField, { key: "Enter", code: "Enter" });
  });
  result.rerender(components);
  expect(testValue.value).toBe("12345");
  expect(inputField.value).toBe("12345");

  act(() => {
    fireEvent.input(inputField, { target: { value: "123456" } });
    fireEvent.keyDown(inputField, { key: "Enter", code: "Enter" });
  });
  result.rerender(components);
  expect(testValue.value).toBe("123456");
  expect(inputField.value).toBe("123456");

  act(() => {
    fireEvent.input(inputField, { target: { value: "1234" } });
    fireEvent.keyDown(inputField, { key: "Escape", code: "Escape" });
  });
  result.rerender(components);
  expect(testValue.value).toBe("123456");
  expect(inputField.value).toBe("123456");

  act(() => {
    fireEvent.input(inputField, { target: { value: "123456" } });
    fireEvent.keyDown(inputField, { key: "ArrowDown", code: "ArrowDown" });
  });
  result.rerender(components);
  expect(testValue.value).toBe("123455");
  expect(inputField.value).toBe("123455");

  act(() => {
    fireEvent.input(inputField, { target: { value: "123456" } });
    fireEvent.keyDown(inputField, { key: "ArrowUp", code: "ArrowUp" });
  });
  result.rerender(components);
  expect(testValue.value).toBe("123457");
  expect(inputField.value).toBe("123457");

  act(() => {
    fireEvent.focus(inputField, { target: { value: "123456" } });
    fireEvent.input(inputField, { target: { value: "123456" } });
    fireEvent.blur(inputField, { target: { value: "123456" } });
  });
  result.rerender(components);
  expect(testValue.value).toBe("123456");
  expect(inputField.value).toBe("123456");

  expect(ref.current).toBe(inputField);

  const components2 = (
    <div id="root-container">
      <ObserverInput
        id="test2"
        getValue={() => testValue.value}
        setValue={(value: string, payload: any) => {
          testValue.value = value;
        }}
        isValidIntermediate={(candidate: string) => {
          return candidate.startsWith("1") || candidate === "";
        }}
        isValidValue={(candidate: string) => {
          return [candidate.startsWith("1234"), null];
        }}
        numeric={true}
      />
    </div>
  );

  const result2 = render(components2);
  const inputField2 = document.querySelector("#test2") as HTMLInputElement;

  act(() => {
    fireEvent.focus(inputField2, { target: { value: "123456" } });
    fireEvent.input(inputField2, { target: { value: "123456" } });
    fireEvent.blur(inputField2, { target: { value: "123456" } });
  });
  result2.rerender(components2);
  expect(testValue.value).toBe("123456");
  expect(inputField2.value).toBe("123456");
});
