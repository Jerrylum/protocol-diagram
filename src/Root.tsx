import "./Root.scss";
import "@fontsource/ubuntu-mono";
import { observer } from "mobx-react-lite";
import { DiagramCanvas } from "./app/DiagramCanvas";
import { Box } from "@mui/material";
import { BottomPanel } from "./app/BottomPanel";
import { useCustomHotkeys } from "./core/Hook";
import { HelpModal } from "./app/HelpModal";
import { getRootStore } from "./core/Root";
import React from "react";
import { ConfirmationModal } from "./app/Confirmation";
import { enqueueErrorSnackbar, enqueueSuccessSnackbar, NoticeProvider } from "./app/Notice";
import { SemVer } from "semver";
import { useDragDropFile } from "./core/Hook";
import { APP_VERSION } from "./core/MainApp";
import { Logger } from "./core/Logger";
import { checkForUpdates, promptUpdate } from "./core/Versioning";
import * as SWR from "./core/ServiceWorkerRegistration";
import { reaction } from "mobx";
import { APP_VERSION_STRING } from "./Version";
import { plainToClass } from "class-transformer";
import { Diagram } from "./diagram/Diagram";
import { validate } from "class-validator";
import { ConfirmationPromptData } from "./core/Confirmation";
import { onDropFile, onOpen, onSave, onSaveAs, onNew } from "./core/InputOutput";
import { DragDropBackdrop } from "./app/DragDropBackdrop";
import { TRUE } from "sass";
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

export async function handleDiagramParam(encodedDiagramParam: string) {
  const { app, confirmation } = getRootStore();
  // Replace URL-safe characters with base64 equivalents
  const base64String = encodedDiagramParam.replaceAll("-", "+").replaceAll("_", "/");

  try {
    const diagramDataInJson = decodeURIComponent(escape(window.atob(base64String)));
    const c = plainToClass(Diagram, JSON.parse(diagramDataInJson), {
      excludeExtraneousValues: true,
      exposeDefaultValues: true
    });
    await validate(c).then(errors => {
      if (errors.length > 0) {
        confirmation.prompt({
          title: "Validation Error",
          description: errors.map(e => e.toString()).join("\n"),
          buttons: [{ label: "OK" }]
        } as ConfirmationPromptData);
        return;
      }
      app.diagram = c;
    });
  } catch (e) {
    if (e instanceof Error) {
      confirmation.prompt({
        title: "Error Occured",
        description: e.message,
        buttons: [{ label: "OK" }]
      } as ConfirmationPromptData);
    }
  }
}

const Root = observer(() => {
  const { app, modals } = getRootStore();
  // test
  const isUsing = true;
  const { isDraggingFile, onDragEnter, onDragLeave, onDragOver, onDrop } = useDragDropFile(isUsing, onDropFile);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(document.location.search);
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

  // React.useEffect(() => {
  // getRootStore().modals.open(HelpModalSymbol);
  // getRootStore().confirmation.prompt({
  //   title: "Welcome to Diagrams",
  //   description: "This is a diagram editor. You can use it to create diagrams.",
  //   buttons: [
  //     {
  //       label: "OK",
  //       hotkey: "Enter",
  //       onClick: () => {},
  //       color: "success"
  //     },
  //     {
  //       label: "Cancel",
  //       onClick: () => {},
  //       color: "error"
  //     }
  //   ],
  //   inputLabel: "Name",
  //   inputDefaultValue: "John",
  // });
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

  useCustomHotkeys("Mod+P", onNew, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+O", onOpen, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+S", onSave, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Shift+Mod+S", onSaveAs, ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+Add,Mod+Equal", () => (app.diagramEditor.scale += 0.5), ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+Subtract,Mod+Minus", () => (app.diagramEditor.scale -= 0.5), ENABLE_ON_ALL_INPUT_FIELDS);
  useCustomHotkeys("Mod+0", () => app.diagramEditor.resetOffsetAndScale(), ENABLE_ON_ALL_INPUT_FIELDS);

  return (
    <Box id="root-container" {...{ onDragEnter, onDragOver, onDrop }}>
      <NoticeProvider />
      <DiagramCanvas />
      <BottomPanel />
      <HelpModal />
      <ConfirmationModal />
      {isDraggingFile && <DragDropBackdrop {...{ onDragEnter, onDragLeave, onDragOver, onDrop }} />}
    </Box>
  );
});

export default Root;

