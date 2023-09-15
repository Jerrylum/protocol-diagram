import "./Root.scss";
import { observer } from "mobx-react-lite";
import { DiagramCanvas } from "./app/DiagramCanvas";
import { Box } from "@mui/material";
import { BottomPanel } from "./app/BottomPanel";
// import { TestModal, TestModalSymbol } from "./app/TestModal";
// import React from "react";
// import { getRootStore } from "./core/Root";

const Root = observer(() => {
  // React.useEffect(() => {
  //   getRootStore().modals.open(TestModalSymbol);
  // }, []);
  return (
    <Box id="root-container">
      <DiagramCanvas />
      <BottomPanel />
      {/* <TestModal /> */}
    </Box>
  );
});

export default Root;

