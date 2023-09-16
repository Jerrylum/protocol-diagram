import { Box, Button, TextField } from "@mui/material";
import { observer } from "mobx-react-lite";
import { CommandLine, CodePointBuffer } from "../token/Tokens";

export const CommandInputField = observer(() => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.target as HTMLInputElement;
      const command = input.value;
      let cl = CommandLine.parse(new CodePointBuffer(command));
      console.log(cl);
      input.value = "";
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      <TextField fullWidth size="small" spellCheck={false} onKeyDown={handleKeyDown}/>
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

