import "./Root.scss";
import "@fontsource/ubuntu-mono";
import { observer } from "mobx-react-lite";
import { DiagramCanvas } from "./app/DiagramCanvas";
import { Box } from "@mui/material";
import { BottomPanel } from "./app/BottomPanel";
import { useCustomHotkeys } from "./core/Hook";
import { HelpModal } from "./app/HelpModal";
import { getRootStore } from "./core/Root";

const Root = observer(() => {
  const { app, modals } = getRootStore();

  // React.useEffect(() => {
  //   getRootStore().modals.open(HelpModalSymbol);
  // }, []);

  const isUsingEditor = !modals.isOpen;

  const ENABLE_EXCEPT_INPUT_FIELDS = { enabled: isUsingEditor };

  // UX: Enable custom hotkeys on input fields (e.g. Mod+S) to prevent accidentally triggering the browser default
  // hotkeys when focusing them (e.g. Save page). However, we do not apply it to all hotkeys, because we want to keep
  // some browser default hotkeys on input fields (e.g. Mod+Z to undo user input) instead of triggering custom hotkeys
  // (e.g. Mod+Z to undo field change)
  const ENABLE_ON_ALL_INPUT_FIELDS = {
    ...ENABLE_EXCEPT_INPUT_FIELDS,
    enableOnContentEditable: true,
    enableOnFormTags: true
  };

  useCustomHotkeys("Mod+Add,Mod+Equal", () => (app.diagramEditor.scale += 0.5), ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+Subtract,Mod+Minus", () => (app.diagramEditor.scale -= 0.5), ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+0", () => app.diagramEditor.resetOffsetAndScale(), ENABLE_ON_ALL_INPUT_FIELDS);

  return (
    <Box id="root-container">
      <DiagramCanvas />
      <BottomPanel />
      <HelpModal />
    </Box>
  );
});

export default Root;
