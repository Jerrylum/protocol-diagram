import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CommandInputField } from "./CommandInputField";

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
      <CommandInputField />
    </Box>
  );
});
