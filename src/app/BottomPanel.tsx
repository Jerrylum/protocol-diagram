import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CommandInputField } from "./CommandInputField";
import { ExportPanel } from "./ExportPanel";
import { LogPanel } from "./LogPanel";

export const BottomPanel = observer(() => {
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
        <CommandInputField />
        <LogPanel />
        <ExportPanel />
      </Box>
    </Box>
  );
});
