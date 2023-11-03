import { act, render } from "@testing-library/react";
import { isMacOS } from "../core/Util";
import { HotkeyTypography } from "./MainMenu";

test("HotkeyTypography", () => {
  const components = (
    <>
      <HotkeyTypography hotkey={undefined} />
      <HotkeyTypography hotkey={"Mod+C"} />
      <HotkeyTypography hotkey={"Mod+Option"} />
      <HotkeyTypography hotkey={"Mod+Option+Shift"} />
      <HotkeyTypography hotkey={"Mod+Option+Shift+Ctrl"} />
      <HotkeyTypography hotkey={"CapsLock"} />
      <HotkeyTypography hotkey={"ArrowLeft"} />
      <HotkeyTypography hotkey={"ArrowRight"} />
      <HotkeyTypography hotkey={"ArrowUp"} />
      <HotkeyTypography hotkey={"ArrowDown"} />
      <HotkeyTypography hotkey={"Tab"} />
      <HotkeyTypography hotkey={"Del"} />
      <HotkeyTypography hotkey={" "} />
      <HotkeyTypography hotkey={"Esc"} />
      <HotkeyTypography hotkey={"+"} />
      <HotkeyTypography hotkey={"Add"} />
      <HotkeyTypography hotkey={"Equal"} />
      <HotkeyTypography hotkey={"Subtract"} />
      <HotkeyTypography hotkey={"Minus"} />
    </>
  );

  const result = render(components);
  expect(result.container).toMatchSnapshot();
});

test("HotkeyTypography in MacOS", () => {
  const currentUserAgent = window.navigator.userAgent;
  Object.defineProperty(window.navigator, "userAgent", { value: "Mac", configurable: true });

  const components = (
    <>
      <HotkeyTypography hotkey={undefined} />
      <HotkeyTypography hotkey={"Mod+C"} />
      <HotkeyTypography hotkey={"Mod+Option"} />
      <HotkeyTypography hotkey={"Mod+Option+Shift"} />
      <HotkeyTypography hotkey={"Mod+Option+Shift+Ctrl"} />
      <HotkeyTypography hotkey={"CapsLock"} />
      <HotkeyTypography hotkey={"ArrowLeft"} />
      <HotkeyTypography hotkey={"ArrowRight"} />
      <HotkeyTypography hotkey={"ArrowUp"} />
      <HotkeyTypography hotkey={"ArrowDown"} />
      <HotkeyTypography hotkey={"Tab"} />
      <HotkeyTypography hotkey={"Del"} />
      <HotkeyTypography hotkey={" "} />
      <HotkeyTypography hotkey={"Esc"} />
      <HotkeyTypography hotkey={"+"} />
      <HotkeyTypography hotkey={"Add"} />
      <HotkeyTypography hotkey={"Equal"} />
      <HotkeyTypography hotkey={"Subtract"} />
      <HotkeyTypography hotkey={"Minus"} />
    </>
  );

  const result = render(components);
  expect(result.container).toMatchSnapshot();
});

