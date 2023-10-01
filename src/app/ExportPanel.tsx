import { Box, Button } from "@mui/material";
import { observer } from "mobx-react-lite";
import { getRootStore } from "../core/Root";

export const ExportPanel = observer(() => {
  const { app } = getRootStore();

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
      <Button onClick={e => navigator.clipboard.writeText(app.diagram.toString())}>Export As Text</Button>
      {/* <Button>Share URL</Button> */}
    </Box>
  );
});
