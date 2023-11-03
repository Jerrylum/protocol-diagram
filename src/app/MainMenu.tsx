import { Box, Button, Divider, Menu, MenuItem } from "@mui/material";
import { observer } from "mobx-react-lite";
import MenuIcon from "@mui/icons-material/Menu";
import React from "react";
import { onDownload, onDownloadAs, onNew, onOpen, onSave, onSaveAs } from "../core/InputOutput";
import { action } from "mobx";

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
          New
        </MenuItem>
        <Divider />
        <MenuItem dense onClick={onMenuButtonClick(onOpen)}>
          Open File
        </MenuItem>
        <Divider />
        <MenuItem dense onClick={onMenuButtonClick(onSave)}>
          Save
        </MenuItem>
        <MenuItem dense onClick={onMenuButtonClick(onSaveAs)}>
          Save As
        </MenuItem>
        <Divider />
        <MenuItem dense onClick={onMenuButtonClick(onDownload)}>
          Download
        </MenuItem>
        <MenuItem dense onClick={onMenuButtonClick(onDownloadAs)}>
          Download As
        </MenuItem>
      </Menu>
    </>
  );
});

