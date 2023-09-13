import "./Root.scss";
import { observer } from "mobx-react-lite";
import { DiagramCanvas } from "./app/DiagramCanvas";
import { Box } from "@mui/material";
import { CommandInputField } from "./app/CommandInputField";

const Root = observer(() => {
  return (
    <Box id="root-container">
      <DiagramCanvas />
      <CommandInputField />
    </Box>
  );
});

export default Root;
