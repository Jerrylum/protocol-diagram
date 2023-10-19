import { Box, Button, Menu, MenuItem } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { getRootStore } from "../core/Root";

export const ExportPanel = observer(() => {
  const { app } = getRootStore();

  const exportBtnRef = React.useRef<HTMLButtonElement>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = React.useState(false);

  const onExportMenuItemClick = () => {
    setIsExportMenuOpen(false);
  };

  const onExportAsText = () => {
    navigator.clipboard.writeText(app.diagram.toString());

    onExportMenuItemClick();
  };

  const onExportAsSVG = () => {
    navigator.clipboard.writeText(app.diagram.toSvgString());

    onExportMenuItemClick();
  };

  const onExportAsURL = () => {
    const encodedJsonDiagram = window.btoa(app.diagram.toJson());
    const base64String = encodedJsonDiagram.replaceAll("+", "-").replaceAll("/", "_");
    const origin = window.location.origin;
    const urlWithJson = `${origin}?diagram=${base64String}`;
    navigator.clipboard.writeText(urlWithJson);
    window.history.pushState({}, "", urlWithJson);
    onExportMenuItemClick();
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: "0",
        bottom: "0",
        left: "calc(100% + 4px)",
        width: "300px",
        display: "flex",
        alignItems: "center",
        gap: "4px"
      }}>
      <Button ref={exportBtnRef} onClick={() => setIsExportMenuOpen(true)}>
        Export
      </Button>
      <Menu
        anchorEl={exportBtnRef.current}
        open={isExportMenuOpen}
        onClose={onExportMenuItemClick}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <MenuItem onClick={onExportAsText}>As Text</MenuItem>
        <MenuItem onClick={onExportAsSVG}>As SVG</MenuItem>
        <MenuItem onClick={onExportAsURL}>As URL</MenuItem>
      </Menu>
      {/* <Button>Share URL</Button> */}
    </Box>
  );
});
