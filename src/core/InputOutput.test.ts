import { Diagram } from "../diagram/Diagram";
import { Field } from "../diagram/Field";
import { onDropFile, readText } from "./InputOutput";
import { MainApp } from "./MainApp";
import { getRootStore } from "./Root";

function createDiagramFile(): File {
  const diagram = new Diagram();
  diagram.addField(new Field("test", 12));

  return new File([diagram.toJson()], "test.json");
}

function createErrorFile(): File {
  return new File([""], "test.json");
}

test("mountingFile default handle is null", () => {
  const { app } = getRootStore();

  app.diagram = new Diagram();

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

test("onDropFile & saveCheck", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  confirmation.close();

  expect(app.mountingFile.handle).toBe(null);
  expect(confirmation.isOpen).toBe(false);

  app.setModified(true);

  onDropFile(createDiagramFile()); // no await

  expect(confirmation.isOpen).toBe(true);

  ////////

  app.diagram = new Diagram();
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
  confirmation.close();

  expect(app.diagram.size()).toBe(0);

  await onDropFile(createDiagramFile(), false); // no save check

  expect(app.diagram.size()).toBe(1);
});

test("onDropFile & reading error", async () => {
  const { app, confirmation } = getRootStore();

  app.diagram = new Diagram();
  confirmation.close();

  expect(app.diagram.size()).toBe(0);

  await onDropFile(createErrorFile(), false); // no save check

  expect(app.diagram.size()).toBe(0);
});

