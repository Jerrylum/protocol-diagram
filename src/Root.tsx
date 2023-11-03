import "./Root.scss";
import "@fontsource/ubuntu-mono";
import { observer } from "mobx-react-lite";
import { DiagramCanvas } from "./app/DiagramCanvas";
import { RedoCommand, UndoCommand } from "./command/Commands";
import { Box } from "@mui/material";
import { BottomPanel } from "./app/BottomPanel";
import { useCustomHotkeys } from "./core/Hook";
import { HelpModal } from "./app/HelpModal";
import { getRootStore } from "./core/Root";
import React from "react";
import { ConfirmationModal } from "./app/Confirmation";
import { enqueueErrorSnackbar, enqueueSuccessSnackbar, NoticeProvider } from "./app/Notice";
import { SemVer } from "semver";
import { APP_VERSION } from "./core/MainApp";
import { Logger } from "./core/Logger";
import { checkForUpdates, promptUpdate } from "./core/Versioning";
import * as SWR from "./core/ServiceWorkerRegistration";
import { reaction } from "mobx";
import { APP_VERSION_STRING } from "./Version";
import { onDropFile, onOpen, onSave, onSaveAs, onNew, onDownload, onDownloadAs } from "./core/InputOutput";
import { DragDropBackdrop, useDragDropFile } from "./app/DragDropBackdrop";
import { MainMenu } from "./app/MainMenu";

(window as any)["checkForUpdates"] = checkForUpdates;

export async function onLatestVersionChange(newVer: SemVer | null | undefined, oldVer: SemVer | null | undefined) {
  const logger = Logger("Versioning");

  if (newVer === undefined) {
    enqueueErrorSnackbar(logger, "Failed to fetch latest version", 5000);
  } else if (newVer === null) {
    // UX: RFC: Should we show a snackbar when fetching?
    // enqueueSuccessSnackbar(logger, "Fetching latest version", 5000);
  } else {
    /*
    Note: Is it possible that the service worker has an update
    but the version of the application and the waiting service worker are the same?
    */

    const waitingVer = await SWR.getWaitingSWVersion();
    if (newVer.compare(APP_VERSION) !== 0 || waitingVer !== undefined) {
      enqueueSuccessSnackbar(logger, `New version available: ${newVer}`, 5000);

      promptUpdate();
    } else {
      enqueueSuccessSnackbar(logger, "There are currently no updates available", 5000);
    }
  }
}

export async function handleUndo() {
  const { logger } = getRootStore();

  const result = new UndoCommand().handle([]);

  if (result.success) logger.info(result.message!);
  else logger.error(result.message!);
}

export async function handleRedo() {
  const { logger } = getRootStore();

  const result = new RedoCommand().handle([]);

  if (result.success) logger.info(result.message!);
  else logger.error(result.message!);
}

export async function handleDiagramParam(encodedDiagramParam: string) {
  const { app, confirmation } = getRootStore();
  // Replace URL-safe characters with base64 equivalents
  const base64String = encodedDiagramParam.replaceAll("-", "+").replaceAll("_", "/");

  try {
    const diagramJsonString = decodeURIComponent(escape(window.atob(base64String)));
    const result = await app.importDiagram(diagramJsonString);
    if (result.success === false) {
      confirmation.prompt({
        title: "Validation Error",
        description: result.message,
        buttons: [{ label: "OK" }]
      });
    }
  } catch (e) {
    confirmation.prompt({
      title: "Error Occurred",
      description: "" + e,
      buttons: [{ label: "OK" }]
    });
  }
}

const Root = observer((props: { enableCanvas?: boolean }) => {
  const { app, modals } = getRootStore();

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const result = searchParams.get("diagram");
    if (result === null) return;
    handleDiagramParam(result);
  }, []);

  React.useEffect(() => {
    const logger = Logger("Versioning");

    const lastTimeAppVersion = localStorage.getItem("appVersion");
    if (APP_VERSION_STRING !== lastTimeAppVersion) {
      localStorage.setItem("appVersion", APP_VERSION_STRING);
      if (lastTimeAppVersion !== null) enqueueSuccessSnackbar(logger, "Updated to v" + APP_VERSION_STRING);
    }

    const disposer = reaction(() => app.latestVersion, onLatestVersionChange);

    return () => {
      disposer();
    };
  }, [app]);

  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (app.isModified()) {
        // Cancel the event and show alert that
        // the unsaved changes would be lost
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [app.diagram]);

  const isUsingEditor = !modals.isOpen;
  const { isDraggingFile, getRootProps: getRootPropsForDragDropBackdrop } = useDragDropFile(isUsingEditor, onDropFile);
  const { onDragEnter, onDragLeave, onDragOver, onDrop } = getRootPropsForDragDropBackdrop();

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

  useCustomHotkeys("Mod+P", onNew, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+O", onOpen, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+S", onSave, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Shift+Mod+S", onSaveAs, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+D", onDownload, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Shift+Mod+D", onDownloadAs, ENABLE_ON_ALL_INPUT_FIELDS);

  useCustomHotkeys("Shift+Mod+S", onSaveAs, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+Add,Mod+Equal", () => (app.diagramEditor.scale += 0.5), ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+Subtract,Mod+Minus", () => (app.diagramEditor.scale -= 0.5), ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+0", () => app.diagramEditor.resetOffsetAndScale(), ENABLE_ON_ALL_INPUT_FIELDS);

  useCustomHotkeys("Mod+Z", handleUndo, ENABLE_EXCEPT_INPUT_FIELDS);
  useCustomHotkeys("Mod+Y,Shift+Mod+Z", handleRedo, ENABLE_EXCEPT_INPUT_FIELDS);

  return (
    <Box id="root-container" {...{ onDragEnter, onDragOver, onDrop }}>
      <NoticeProvider />
      <DiagramCanvas enableCanvas={props.enableCanvas} />
      <BottomPanel />
      <MainMenu />
      <HelpModal />
      <ConfirmationModal />
      {isDraggingFile && <DragDropBackdrop {...{ onDragEnter, onDragLeave, onDragOver, onDrop }} />}
    </Box>
  );
});

export default Root;

