import { fireEvent } from "@testing-library/react";
import { Diagram } from "../diagram/Diagram";
import { Field } from "../diagram/Field";
import { onDownload, onDownloadAs, onDropFile, onNew, onOpen, onSave, onSaveAs, readText } from "./InputOutput";
import { IOFileHandle } from "./MainApp";
import { getRootStore } from "./Root";

function createDiagramFile(): File {
  const diagram = new Diagram();
  diagram.addField(new Field("test", 12));

  return new File([diagram.toJson()], "test.json");
}

function createFileListWithDiagramFile(): FileList {
  const file = createDiagramFile();
  return {
    length: 1,
    item: (index: number) => {
      return file;
    },
    [Symbol.iterator]: function* () {
      yield file;
    },
    0: file
  } as FileList;
}

function createErrorFile(): File {
  return new File([""], "test.json");
}

test("mountingFile default handle is null", () => {
  const { app } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();

  expect(app.mountingFile.handle).toBe(null);
  expect(app.mountingFile.name).toBe("protocol-diagram.json");
  expect(app.mountingFile.isNameSet).toBe(false);
});

test("readText", async () => {
  const file = createDiagramFile();

  expect((await readText(new FileReader(), file)).length).toBe(file.size);

  readText(
    new (class extends FileReader {
      readAsText() {
        this.onerror?.(null as any);
      }
    })(),
    file
  )
    .then(() => {
      expect(true).toBe(false);
    })
    .catch(() => {
      expect(true).toBe(true);
    });
});

test("onNew", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  const mountingFile = new IOFileHandle();
  app.mountingFile = mountingFile;
  confirmation.close();

  expect(app.mountingFile).toBe(mountingFile);

  await onNew();

  expect(app.mountingFile).not.toBe(mountingFile);

  ////////
  app.diagram = new Diagram();
  const mountingFile2 = new IOFileHandle();
  app.mountingFile = mountingFile2;
  confirmation.close();

  expect(app.mountingFile).toBe(mountingFile2);

  await onNew();

  expect(app.mountingFile).not.toBe(mountingFile2);

  ////////
  app.diagram = new Diagram();
  const mountingFile3 = new IOFileHandle();
  app.mountingFile = mountingFile3;
  confirmation.close();

  expect(app.mountingFile).toBe(mountingFile3);

  app.setModified(true);
  await onNew(false);

  expect(app.mountingFile).not.toBe(mountingFile3);
});

test("onNew & saveConfirm", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  (window as any)["showOpenFilePicker"] = () => {};
  (window as any)["showSaveFilePicker"] = () => {};
  const writeFn = jest.fn(async () => {});
  const closeFn = jest.fn(async () => {});
  app.mountingFile.handle = {
    createWritable: () => ({
      write: writeFn,
      close: closeFn
    }),
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
      return Promise.resolve("granted");
    }
  } as any;

  expect(confirmation.isOpen).toBe(false);

  app.setModified(true);
  const promise = onNew();

  confirmation.buttons[0].onClick?.();

  expect(confirmation.isOpen).toBe(true);

  expect(await promise).toBe(true);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  app.mountingFile.handle = {
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
      throw new DOMException("test");
    }
  } as any;

  expect(confirmation.isOpen).toBe(false);

  app.setModified(true);
  const promise1 = onNew();

  confirmation.buttons[0].onClick?.();

  expect(await promise1).toBe(false);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();

  expect(confirmation.isOpen).toBe(false);

  app.setModified(true);
  const promise2 = onNew();

  confirmation.buttons[1].onClick?.();

  expect(await promise2).toBe(true);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();

  expect(confirmation.isOpen).toBe(false);

  app.setModified(true);
  const promise3 = onNew();

  confirmation.buttons[2].onClick?.();

  expect(await promise3).toBe(false);
});

test("onSave & writeFile", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  (window as any)["showOpenFilePicker"] = () => {};
  (window as any)["showSaveFilePicker"] = () => {};
  const writeFn = jest.fn(async () => {});
  const closeFn = jest.fn(async () => {});
  app.mountingFile.handle = {
    createWritable: () => ({
      write: writeFn,
      close: closeFn
    }),
    kind: "file",
    name: "test.json",
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
      return Promise.resolve("granted");
    },
    isFile: true,
    isDirectory: false
  } as any;

  expect(confirmation.isOpen).toBe(false);

  app.setModified(true);
  expect(await onSave()).toBe(true);
  expect(writeFn).toBeCalledTimes(1);
  expect(closeFn).toBeCalledTimes(1);
  expect(app.isModified()).toBe(false);

  expect(confirmation.isOpen).toBe(false);

  ////////
  app.mountingFile.handle = {
    createWritable: () => ({
      write: writeFn,
      close: closeFn
    }),
    kind: "file",
    name: "test.json",
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
      throw new DOMException("test");
    },
    isFile: true,
    isDirectory: false
  } as any;

  expect(await onSave()).toBe(false);
});

test("onSave & isFileSystemSupported = false", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  delete (window as any)["showOpenFilePicker"];
  delete (window as any)["showSaveFilePicker"];

  expect(confirmation.isOpen).toBe(false);

  onSave();

  expect(confirmation.isOpen).toBe(true);
  expect(confirmation.title).toBe("Download");
});

test("onSave & isFileSystemSupported = true", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  (window as any)["showOpenFilePicker"] = jest.fn(async () => ({}));
  const savePicker = jest.fn(async () => ({}));
  (window as any)["showSaveFilePicker"] = savePicker;

  expect(confirmation.isOpen).toBe(false);

  onSave();

  expect(confirmation.isOpen).toBe(false);
  expect(savePicker).toBeCalledTimes(1);
});

test("onSaveAs & writeFile", async () => {
  const { app, confirmation, logger } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  logger.clear();
  const writeFn = jest.fn(async () => {});
  const closeFn = jest.fn(async () => {});
  (window as any)["showOpenFilePicker"] = jest.fn(async () => ({}));
  (window as any)["showSaveFilePicker"] = jest.fn(async () => ({
    createWritable: () => ({ write: writeFn, close: closeFn }),
    kind: "file",
    name: "test.json",
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
      return Promise.resolve("granted");
    },
    isFile: true,
    isDirectory: false
  }));

  expect(await onSaveAs()).toBe(true);
  expect(writeFn).toBeCalledTimes(1);
  expect(closeFn).toBeCalledTimes(1);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  logger.clear();
  (window as any)["showOpenFilePicker"] = jest.fn(async () => ({}));
  (window as any)["showSaveFilePicker"] = jest.fn(async () => ({
    createWritable: () => ({ write: writeFn, close: closeFn }),
    kind: "file",
    name: "test.json",
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
      throw new DOMException("test");
    },
    isFile: true,
    isDirectory: false
  }));

  expect(await onSaveAs()).toBe(false);
  expect(logger.logs.length).toBe(0);
});

test("onSaveAs & isFileSystemSupported = false", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  delete (window as any)["showOpenFilePicker"];
  delete (window as any)["showSaveFilePicker"];

  expect(confirmation.isOpen).toBe(false);

  onSaveAs();

  expect(confirmation.isOpen).toBe(true);
  expect(confirmation.title).toBe("Download");
});

test("onSaveAs & isFileSystemSupported = true", async () => {
  const { app, confirmation, logger } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  (window as any)["showOpenFilePicker"] = jest.fn(async () => ({}));
  (window as any)["showSaveFilePicker"] = jest.fn(async () => ({}));

  expect(confirmation.isOpen).toBe(false);

  expect(await onSaveAs()).toBe(false);

  expect(confirmation.isOpen).toBe(false);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  logger.clear();
  (window as any)["showSaveFilePicker"] = jest.fn(async () => {
    throw new DOMException("test");
  });

  expect(await onSaveAs()).toBe(false);

  expect(logger.logs.length).toBe(0);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  logger.clear();
  (window as any)["showSaveFilePicker"] = jest.fn(async () => {
    throw new Error("test");
  });

  expect(await onSaveAs()).toBe(false);

  expect(logger.logs.length).toBe(1);
});

test("onOpen & saveCheck", async () => {
  const { app, confirmation } = getRootStore();

  //////// No modification
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  delete (window as any)["mozInnerScreenX"];

  expect(confirmation.isOpen).toBe(false);

  onOpen();

  expect(confirmation.isOpen).toBe(false);

  //////// With modification
  app.setModified(true);
  confirmation.close();

  expect(confirmation.isOpen).toBe(false);

  onOpen();

  expect(confirmation.isOpen).toBe(true);
  expect(confirmation.title).toBe("Unsaved Changes");

  //////// No save check with modification
  app.setModified(true);
  confirmation.close();

  expect(confirmation.isOpen).toBe(false);

  onOpen(false);

  expect(confirmation.isOpen).toBe(false);
});

test("onOpen & interactive", async () => {
  const { app, confirmation } = getRootStore();

  //////// interactive = true & isFirefox = true
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  (window as any)["mozInnerScreenX"] = 0;

  expect(confirmation.isOpen).toBe(false);

  onOpen(true, true);

  expect(confirmation.isOpen).toBe(true);
  expect(confirmation.title).toBe("Open File");

  const cb = jest.fn();
  confirmation.onKeyDown?.(null as any, cb);
  expect(cb).toBeCalledTimes(1);

  //////// interactive = true & isFirefox = false
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  delete (window as any)["mozInnerScreenX"];

  expect(confirmation.isOpen).toBe(false);

  onOpen(true, true);

  expect(confirmation.isOpen).toBe(false);
});

test("onOpen & readFile", async () => {
  const { app, confirmation, logger } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  (window as any)["showOpenFilePicker"] = jest.fn(async () => [
    {
      name: "test.json",
      getFile: jest.fn(async () => createErrorFile())
    }
  ]);
  (window as any)["showSaveFilePicker"] = jest.fn(async () => ({}));

  expect(await onOpen(false, false)).toBe(false);
});

test("onOpen & readFile", async () => {
  const { app, confirmation, logger } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  (window as any)["showOpenFilePicker"] = jest.fn(async () => [
    {
      name: "test.json",
      getFile: jest.fn(async () => createDiagramFile())
    }
  ]);
  (window as any)["showSaveFilePicker"] = jest.fn(async () => ({}));

  expect(confirmation.isOpen).toBe(false);

  const promise = onOpen(false, false);

  expect(confirmation.isOpen).toBe(false);

  expect(await promise).toBe(true);

  expect(app.mountingFile.name).toBe("test.json");
  expect(app.mountingFile.isNameSet).toBe(true);
  expect(app.mountingFile.handle).not.toBe(null);
  expect(app.diagram.size()).toBe(1);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  (window as any)["showOpenFilePicker"] = jest.fn(async () => {
    throw new DOMException("test");
  });
  logger.clear();

  expect(await onOpen(false, false)).toBe(false);
  expect(logger.logs.length).toBe(0);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  (window as any)["showOpenFilePicker"] = jest.fn(async () => {
    throw new Error("test");
  });

  expect(await onOpen(false, false)).toBe(false);
  expect(logger.logs.length).toBe(1);
});

test("onOpen & readFileFromInput", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  delete (window as any)["showOpenFilePicker"];
  delete (window as any)["showSaveFilePicker"];
  document.querySelectorAll("body > input[type=file]").forEach(input => input.remove());

  const promise = onOpen(false, false);

  const input = document.querySelector("body > input[type=file]") as HTMLInputElement;
  expect(input).not.toBe(null);

  // input.files = createFileListWithDiagramFile();
  fireEvent.change(input, { target: { files: createFileListWithDiagramFile() } });

  expect(await promise).toBe(true);

  expect(app.mountingFile.name).toBe("test.json");
  expect(app.mountingFile.isNameSet).toBe(true);
  expect(app.mountingFile.handle).toBe(null);
  expect(app.diagram.size()).toBe(1);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();
  delete (window as any)["showOpenFilePicker"];
  delete (window as any)["showSaveFilePicker"];
  document.querySelectorAll("body > input[type=file]").forEach(input => input.remove());

  onOpen(false, false);

  const input2 = document.querySelector("body > input[type=file]") as HTMLInputElement;
  expect(input2).not.toBe(null);

  fireEvent.change(input2, { target: { files: null } });
});

test("onDownload", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();

  expect(confirmation.isOpen).toBe(false);

  const promise = onDownload();

  expect(confirmation.isOpen).toBe(true);

  confirmation.buttons[1].onClick?.();

  expect(await promise).toBe(false);

  confirmation.close(); // manually close the confirmation

  ////////
  global.URL.createObjectURL = jest.fn();

  app.mountingFile = new IOFileHandle();
  app.mountingFile.name = "test.json";
  app.mountingFile.isNameSet = true;

  const promise2 = onDownload();

  expect(confirmation.isOpen).toBe(false);
  expect(await promise2).toBe(true);
  expect(app.mountingFile.name).toBe("test.json");
  expect(app.mountingFile.isNameSet).toBe(true);
  expect(app.mountingFile.handle).toBe(null);
  expect(global.URL.createObjectURL).toBeCalledTimes(1);
});

test("onDownloadAs", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();

  expect(confirmation.isOpen).toBe(false);

  const promise = onDownloadAs();

  expect(confirmation.isOpen).toBe(true);
  expect(confirmation.buttons.length).toBe(2);
  expect(confirmation.title).toBe("Download");
  expect(confirmation.inputLabel).toBe("File Name");
  expect(confirmation.input).toBe(app.mountingFile.name);

  confirmation.buttons[1].onClick?.();

  expect(await promise).toBe(false);

  confirmation.close(); // manually close the confirmation

  ////////
  global.URL.createObjectURL = jest.fn();

  app.mountingFile = new IOFileHandle();
  app.mountingFile.name = "test.json";

  const promise2 = onDownloadAs(true); // also try fallback description

  confirmation.buttons[0].onClick?.();

  expect(await promise2).toBe(true);

  confirmation.close(); // manually close the confirmation
  expect(app.mountingFile.name).toBe("test.json");
  expect(app.mountingFile.isNameSet).toBe(true); // function fileNameConfirm set this to true
  expect(app.mountingFile.handle).toBe(null);
  expect(global.URL.createObjectURL).toBeCalledTimes(1);

  ////////
  global.URL.createObjectURL = jest.fn();

  app.mountingFile = new IOFileHandle();
  app.mountingFile.name = "test123";

  const promise3 = onDownloadAs(true); // also try fallback description

  confirmation.buttons[0].onClick?.();

  expect(await promise3).toBe(true);

  confirmation.close(); // manually close the confirmation
  expect(app.mountingFile.name).toBe("test123.json");
  expect(app.mountingFile.isNameSet).toBe(true);
  expect(app.mountingFile.handle).toBe(null);
  expect(global.URL.createObjectURL).toBeCalledTimes(1);

  ////////
  global.URL.createObjectURL = jest.fn();

  app.mountingFile = new IOFileHandle();
  app.mountingFile.name = "anything";

  const promise4 = onDownloadAs(true); // also try fallback description

  confirmation.input = undefined;
  confirmation.buttons[0].onClick?.();

  expect(await promise4).toBe(true);

  confirmation.close(); // manually close the confirmation
  expect(app.mountingFile.name).toBe("anything.json");
  expect(app.mountingFile.isNameSet).toBe(true);
  expect(app.mountingFile.handle).toBe(null);
  expect(global.URL.createObjectURL).toBeCalledTimes(1);
});

test("onDropFile", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();

  expect(app.mountingFile.handle).toBe(null);
  expect(confirmation.isOpen).toBe(false);

  app.setModified(true);

  onDropFile(createDiagramFile()); // no await

  expect(confirmation.isOpen).toBe(true);

  ////////
  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();

  expect(app.mountingFile.handle).toBe(null);
  expect(confirmation.isOpen).toBe(false);

  app.setModified(false);

  onDropFile(createDiagramFile(), false); // no await

  expect(confirmation.isOpen).toBe(false);
});

test("onDropFile & reading", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();

  expect(app.diagram.size()).toBe(0);

  await onDropFile(createDiagramFile(), false); // no save check

  expect(app.diagram.size()).toBe(1);
});

test("onDropFile & reading error", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  app.mountingFile = new IOFileHandle();
  confirmation.close();

  expect(app.diagram.size()).toBe(0);

  await onDropFile(createErrorFile(), false); // no save check

  expect(app.diagram.size()).toBe(0);
});

