import { observer } from "mobx-react-lite";
import { useBetterMemo, useCustomHotkeys, useTimeout } from "./Hook";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { observable } from "mobx";
import { HotkeysEvent } from "react-hotkeys-hook/dist/types";

export const HookTestElement = observer((props: { func: Function; func2: Function; func3: Function }) => {
  useCustomHotkeys("r", () => props.func());
  useCustomHotkeys("t", () => props.func2(), { enabled: false, preventDefaultOnlyIfEnabled: true });
  useCustomHotkeys("y", () => props.func3(), { enabled: (k1: KeyboardEvent, k2: HotkeysEvent) => true });
  useCustomHotkeys("mod+u", () => props.func3(), { enabled: (k1: KeyboardEvent, k2: HotkeysEvent) => true });
  const a = useBetterMemo(() => observable({ value: 1, destructor: () => {} }));
  useTimeout(() => {}, 100);
  return <div></div>;
});

test("useCustomHotkeys", () => {
  const func = jest.fn();
  const func2 = jest.fn();
  const func3 = jest.fn();
  Object.defineProperty(navigator, "userAgent", { value: "Mac", configurable: true });
  const components = (
    <div id="root-container">
      <HookTestElement func={func} func2={func2} func3={func3} />
    </div>
  );
  const result = render(components);
  act(() => {
    fireEvent.keyDown(document.body, { key: "r", code: "r" });
    fireEvent.keyUp(document.body, { key: "r", code: "r" });
  });
  expect(func).toBeCalled();
  act(() => {
    fireEvent.keyDown(document.body, { key: "t", code: "t" });
    fireEvent.keyUp(document.body, { key: "t", code: "t" });
  });
  expect(func2).not.toBeCalled();
  act(() => {
    fireEvent.keyDown(document.body, { key: "y", code: "y" });
    fireEvent.keyUp(document.body, { key: "y", code: "y" });
  });
  expect(func3).toBeCalled();

  jest.spyOn(Date, "now").mockImplementation(() => 1);
  act(() => {
    fireEvent.keyDown(document.body, { key: "y", code: "y" });
    fireEvent.keyDown(document.body, { key: "y", code: "y" });
    fireEvent.keyUp(document.body, { key: "y", code: "y" });
  });

  act(() => {
    fireEvent.keyDown(document.body, { key: "u", code: "u", metaKey: true });
    fireEvent.keyDown(document.body, { key: "u", code: "u", metaKey: true });
    fireEvent.keyUp(document.body, { key: "u", code: "u", metaKey: true });
  });
});
