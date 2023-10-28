import { enqueueErrorSnackbar, enqueueSuccessSnackbar } from "../app/Notice";
import { Logger } from "./Logger";
import { IOFileHandle } from "./MainApp";
import { getRootStore } from "./Root";
import { isFirefox, runInActionAsync } from "./Util";

const logger = Logger("I/O");

async function saveConfirm(callback: () => void) {
  const { app, confirmation } = getRootStore();

  return new Promise<boolean>((resolve, reject) => {
    confirmation.prompt({
      title: "Unsaved Changes",
      description: "Do you want to save the changes made to " + app.mountingFile.name + "?",
      buttons: [
        {
          label: "Save",
          color: "success",
          hotkey: "s",
          onClick: async () => {
            if (await onSave()) {
              callback();
              resolve(true);
            } else {
              resolve(false);
            }
          }
        },
        {
          label: "Don't Save",
          hotkey: "n",
          onClick: () => {
            callback();
            resolve(true);
          }
        },
        { label: "Cancel", onClick: () => resolve(false) }
      ]
    });
  });
}

async function fileNameConfirm(description: string, callback: () => void) {
  const { app, confirmation } = getRootStore();

  return new Promise<void>((resolve, reject) => {
    confirmation.prompt({
      title: "Download",
      description,
      buttons: [
        {
          label: "Confirm",
          color: "success",
          onClick: async () => {
            let candidate = confirmation.input ?? app.mountingFile.name;
            if (candidate.indexOf(".") === -1) candidate += ".json";
            app.mountingFile.name = candidate;
            app.mountingFile.isNameSet = true;
            callback();
            resolve();
          }
        },
        { label: "Cancel", onClick: () => resolve() }
      ],
      inputLabel: "File Name",
      inputDefaultValue: app.mountingFile.name
    });
  });
}

async function writeFile(contents: string): Promise<boolean> {
  const { app } = getRootStore();

  try {
    const file = app.mountingFile;
    if (file.handle === null) throw new Error("fileHandle is undefined");

    // XXX
    await file.handle.requestPermission({ mode: "readwrite" });

    const writable = await file.handle.createWritable();
    await writable.write(contents);
    await writable.close();

    enqueueSuccessSnackbar(logger, "Saved");
    return true;
  } catch (err) {
    if (err instanceof DOMException) enqueueErrorSnackbar(logger, "Failed to save file");
    else enqueueErrorSnackbar(logger, err);
    return false;
  }
}

async function readFile(): Promise<string | undefined> {
  const { app } = getRootStore();

  const options = {
    types: [{ description: "Protocol Diagram", accept: { "application/json": [] } }],
    excludeAcceptAllOption: false,
    multiple: false
  };

  try {
    const [fileHandle] = await showOpenFilePicker(options);
    app.mountingFile.handle = fileHandle;
    app.mountingFile.name = fileHandle.name;
    app.mountingFile.isNameSet = true;

    const file = await fileHandle.getFile();
    const contents = await file.text();

    return contents;
  } catch (err) {
    if (err instanceof DOMException === false) enqueueErrorSnackbar(logger, err);
    else logger.error(err); // UX: Do not show DOMException to user, usually means user cancelled

    return undefined;
  }
}

async function readFileFromInput(): Promise<string | undefined> {
  const { app } = getRootStore();

  const input = document.createElement("input");
  input.type = "file";
  input.multiple = false;
  input.accept = "application/json";

  // See https://stackoverflow.com/questions/47664777/javascript-file-input-onchange-not-working-ios-safari-only
  Object.assign(input.style, { position: "fixed", top: "-100000px", left: "-100000px" });

  document.body.appendChild(input);

  await new Promise(resolve => {
    input.addEventListener("change", resolve, { once: true });
    input.click();
  });

  // ALGO: Remove polyfill input[type=file] elements, including elements from last time
  document.querySelectorAll("body > input[type=file]").forEach(input => input.remove());

  const file = input.files?.[0];
  if (file === undefined) return undefined;

  await runInActionAsync(() => {
    app.mountingFile.handle = null;
    app.mountingFile.name = file.name;
    app.mountingFile.isNameSet = true;
  });

  const reader = new FileReader();
  reader.readAsText(file);

  return new Promise<string | undefined>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(undefined);
  });
}

function downloadFile(contents: string) {
  const { app } = getRootStore();

  const a = document.createElement("a");
  const file = new Blob([contents], { type: "application/json" });
  a.href = URL.createObjectURL(file);
  a.download = app.mountingFile.name;
  a.click();
}

async function choiceSave(): Promise<boolean> {
  const { app } = getRootStore();

  const options = {
    types: [{ description: "Protocol Diagram", accept: { "application/json": [] } }],
    suggestedName: app.mountingFile.name,
    excludeAcceptAllOption: false,
    multiple: false
  };

  try {
    const fileHandle = await window.showSaveFilePicker(options);
    app.mountingFile.handle = fileHandle;
    app.mountingFile.name = fileHandle.name;
    app.mountingFile.isNameSet = true;

    return true;
  } catch (err) {
    logger.error(err); // ignore error
    return false;
  }
}

export function isFileSystemSupported() {
  return window.showOpenFilePicker !== undefined && window.showSaveFilePicker !== undefined;
}

export async function onNew(saveCheck: boolean = true): Promise<boolean> {
  const { app } = getRootStore();

  if (saveCheck && app.isModified()) return saveConfirm(onNew.bind(null, false));

  app.newDiagram();
  app.mountingFile = new IOFileHandle();
  return true;
}

export async function onSave(): Promise<boolean> {
  const { app } = getRootStore();

  if (isFileSystemSupported() === false) return onDownload(true);

  if (app.mountingFile.handle === null) return onSaveAs();

  const output = app.exportDiagram();

  if (await writeFile(output)) {
    app.save();
    return true;
  } else {
    return false;
  }
}

export async function onSaveAs(): Promise<boolean> {
  const { app } = getRootStore();

  if (isFileSystemSupported() === false) return onDownloadAs(true);

  const output = app.exportDiagram();

  if (!(await choiceSave())) return false;

  if (await writeFile(output)) {
    app.save();
    return true;
  } else {
    return false;
  }
}

export async function onOpen(saveCheck: boolean = true, interactive: boolean = true): Promise<boolean> {
  const { app, confirmation } = getRootStore();

  if (saveCheck && app.isModified()) return saveConfirm(onOpen.bind(null, false, false));

  if (interactive && isFirefox()) {
    // Resolve: <input> picker was blocked due to lack of user activation.
    await confirmation.prompt({
      title: "Open File",
      description: "Press any key to continue.",
      buttons: [{ label: "Open", color: "success" }],
      onKeyDown: (e, onClick) => onClick(0)
    });
  }

  const contents = await (isFileSystemSupported() ? readFile() : readFileFromInput());
  if (contents === undefined) return false;

  try {
    await app.importDiagram(contents);
    return true;
  } catch (err) {
    enqueueErrorSnackbar(logger, err);
    return false;
  }
}

export async function onDownload(fallback: boolean = false): Promise<boolean> {
  const { app } = getRootStore();

  if (app.mountingFile.isNameSet === false) return onDownloadAs(fallback);

  const output = app.exportDiagram();

  downloadFile(output);

  return true;
}

export async function onDownloadAs(fallback: boolean = false): Promise<boolean> {
  const { app } = getRootStore();

  const output = app.exportDiagram();

  fileNameConfirm(
    fallback ? "Writing file to the disk is not supported in this browser. Falling back to download." : "",
    downloadFile.bind(null, output)
  );

  return true;
}

export async function onDropFile(file: File, saveCheck: boolean = true): Promise<boolean> {
  const { app } = getRootStore();

  if (saveCheck && app.isModified()) return saveConfirm(onDropFile.bind(null, file, false));

  await runInActionAsync(() => {
    app.mountingFile.handle = null;
    app.mountingFile.name = file.name;
    app.mountingFile.isNameSet = true;
  });

  const reader = new FileReader();
  reader.readAsText(file);

  const contents = await new Promise<string | undefined>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(undefined);
  });
  if (contents === undefined) return false;

  try {
    await app.importDiagram(contents);
    return true;
  } catch (err) {
    enqueueErrorSnackbar(logger, err);
    return false;
  }
}

