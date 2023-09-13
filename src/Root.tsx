import "./Root.scss";
import { observer } from "mobx-react-lite";
import { DiagramCanvas } from "./app/DiagramCanvas";
import { Box } from "@mui/material";

const Root = observer(() => {
  return (
    <Box id="root-container">
      <DiagramCanvas />
    </Box>
  );
});

export default Root;
