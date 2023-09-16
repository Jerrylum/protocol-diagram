import { Box, TextField } from "@mui/material";
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
    <Box
      sx={{
        position: "fixed",
        bottom: "32px",
        maxWidth: "90vw",
        width: "600px",
        left: "50%",
        transform: "translate(-50%, 0)"
      }}>
      <TextField fullWidth size="small" onKeyDown={handleKeyDown}/>
    </Box>
  );
});
