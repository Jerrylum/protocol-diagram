import "./Root.scss";
import { observer } from "mobx-react-lite";
import { DiagramCanvas } from "./app/DiagramCanvas";
import { Box } from "@mui/material";
import { BottomPanel } from "./app/BottomPanel";

const Root = observer(() => {
  return (
    <Box id="root-container">
      <DiagramCanvas />
      <BottomPanel />
    </Box>
  );
});

export default Root;
