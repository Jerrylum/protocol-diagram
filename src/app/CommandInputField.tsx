import { Box, Button, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";

export const CommandInputField = observer(() => {
  return (
    <Box sx={{ position: "relative" }}>
      <TextField fullWidth size="small" spellCheck={false} />
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
        <Button>Export As Text</Button>
        {/* <Button>Share URL</Button> */}
      </Box>
    </Box>
  );
});

