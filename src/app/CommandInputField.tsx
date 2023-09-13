import { Box, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";

export const CommandInputField = observer(() => {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: "32px",
        maxWidth: "90vw",
        width: "600px",
        left: "50%",
        transform: "translate(-50%, 0)"
      }}>
      <TextField fullWidth size="small" />
    </Box>
  );
});
