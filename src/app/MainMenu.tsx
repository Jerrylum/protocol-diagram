import { Button, Divider, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import MenuIcon from "@mui/icons-material/Menu";
import React from "react";
import { onDownload, onDownloadAs, onNew, onOpen, onSave, onSaveAs } from "../core/InputOutput";
import { action } from "mobx";
import { isMacOS } from "../core/Util";

export const HotkeyTypography = observer((props: { hotkey: string | undefined }) => {
  const { hotkey } = props;

  if (hotkey === undefined) return null;

  if (isMacOS(navigator.userAgent) === false)
    return <Typography variant="body2" color="text.secondary" children={hotkey.replaceAll("Mod", "Ctrl")} />;

  const temp = hotkey
    .replaceAll("Mod", "⌘")
    .replaceAll("Option", "⌥")
    .replaceAll("Ctrl", "⌃")
    .replaceAll("Shift", "⇧")
    .replaceAll("CapsLock", "⇪")
    .replaceAll("ArrowLeft", "←")
    .replaceAll("ArrowRight", "→")
    .replaceAll("ArrowUp", "↑")
    .replaceAll("ArrowDown", "↓")
    .replaceAll("Tab", "⇥")
    .replaceAll("Del", "⌫")
    .replaceAll(" ", "␣")
    .replaceAll("Esc", "") // Hide escape key
    .replaceAll("+", "")
    .replaceAll("Add", "+")
    .replaceAll("Equal", "+")
    .replaceAll("Subtract", "-")
    .replaceAll("Minus", "-");

  const elements: React.ReactElement[] = [];
  temp.split("").forEach((char, index) => {
    elements.push(
      <Typography
        key={index}
        variant="body2"
        color="text.secondary"
        sx={{
          width: "1em",
          textAlign: "center",
          fontFamily: '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif'
        }}
        children={char}
      />
    );
  });

  return <>{elements}</>;
});

export const MainMenu = observer(() => {
  const menuBtnRef = React.useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const onMenuButtonClick = (callback: () => void): (() => void) => {
    return action(() => {
      setIsMenuOpen(false);
      callback();
    });
  };

  return (
    <>
      <Button
        ref={menuBtnRef}
        sx={{
          position: "fixed",
          top: "16px",
          left: "16px",
          minWidth: "32px",
          width: "32px",
          height: "32px",
          border: "1px solid #AAA",
          borderRadius: "4px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          userSelect: "none",
          cursor: "pointer",
          color: "#444"
        }}
        onClick={() => setIsMenuOpen(true)}>
        <MenuIcon />
      </Button>
      <Menu
        anchorEl={menuBtnRef.current}
        open={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
        }}
        sx={{ left: "8px" }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}>
        <MenuItem dense onClick={onMenuButtonClick(onNew)}>
          <ListItemText sx={{ marginRight: "1rem" }}>New</ListItemText>
          <HotkeyTypography hotkey="Mod+P" />
        </MenuItem>
        <Divider />
        <MenuItem dense onClick={onMenuButtonClick(onOpen)}>
          <ListItemText sx={{ marginRight: "1rem" }}>Open File</ListItemText>
          <HotkeyTypography hotkey="Mod+O" />
        </MenuItem>
        <Divider />
        <MenuItem dense onClick={onMenuButtonClick(onSave)}>
          <ListItemText sx={{ marginRight: "1rem" }}>Save</ListItemText>
          <HotkeyTypography hotkey="Mod+S" />
        </MenuItem>
        <MenuItem dense onClick={onMenuButtonClick(onSaveAs)}>
          <ListItemText sx={{ marginRight: "1rem" }}>Save As</ListItemText>
          <HotkeyTypography hotkey="Shift+Mod+S" />
        </MenuItem>
        <Divider />
        <MenuItem dense onClick={onMenuButtonClick(onDownload)}>
          <ListItemText sx={{ marginRight: "1rem" }}>Download</ListItemText>
          <HotkeyTypography hotkey="Mod+D" />
        </MenuItem>
        <MenuItem dense onClick={onMenuButtonClick(onDownloadAs)}>
          <ListItemText sx={{ marginRight: "1rem" }}>Download As</ListItemText>
          <HotkeyTypography hotkey="Shift+Mod+D" />
        </MenuItem>
      </Menu>
    </>
  );
});

