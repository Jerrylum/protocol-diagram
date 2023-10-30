import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { action, computed, makeAutoObservable, makeObservable, observable, override } from "mobx";
import { SemVer } from "semver";
import { CancellableCommand } from "../command/Commands";
import { HandleResult, success, fail } from "../command/HandleResult";
import { Diagram, Memento } from "../diagram/Diagram";
import { Timeline } from "../diagram/Timeline";
import { APP_VERSION_STRING } from "../Version";
import { DiagramEditor } from "./DiagramEditor";
import { Logger } from "./Logger";

export const APP_VERSION = new SemVer(APP_VERSION_STRING);

const logger = Logger("App");

export class IOFileHandle {
  public isNameSet: boolean = false;
  constructor(public handle: FileSystemFileHandle | null = null, public name: string = "protocol-diagram.json") {
    makeAutoObservable(this);
  }
}

export class MainApp extends Timeline<CancellableCommand> {
  // The current memento saved in the file or the first memento in the timeline
  private sourceCurrentMemento!: Memento | null;
  private isModifiedFlag!: boolean;

  readonly diagramEditor = new DiagramEditor();

  // null = loading, undefined = not available
  private _latestVersion: SemVer | null | undefined = undefined;

  public mountingFile: IOFileHandle = new IOFileHandle(null); // This is intended to be modified outside the class

  constructor() {
    super(new Diagram());
    this.newDiagram();

    makeObservable<MainApp, "sourceCurrentMemento" | "isModifiedFlag" | "latestVersion">(this, {
      sourceCurrentMemento: observable,
      isModifiedFlag: observable,
      latestVersion: computed,
      diagram: override,
      newDiagram: action,
      isModified: action,
      setModified: action,
      resetHistory: override
    });

    logger.log("Version", APP_VERSION_STRING);
  }

  get latestVersion(): SemVer | null | undefined {
    return this._latestVersion;
  }

  set latestVersion(version: SemVer | null | undefined) {
    this._latestVersion = version;
  }

  get diagram(): Diagram {
    return this._diagram;
  }

  set diagram(diagram: Diagram) {
    this._diagram = diagram;
    this.resetHistory();
  }

  newDiagram() {
    this.diagram = new Diagram();
    this.resetHistory();
  }

  async importDiagram(diagramJsonString: string): Promise<HandleResult> {
    try {
      const c = plainToClass(Diagram, JSON.parse(diagramJsonString), {
        excludeExtraneousValues: true,
        exposeDefaultValues: true
      });

      const errors = await validate(c);

      if (errors.length > 0) {
        return fail(errors.map(e => e.toString()).join("\n"));
      }

      this.diagram = c;
      return success("Diagram imported successfully");
    } catch (e: unknown) {
      throw e;
    }
  }

  exportDiagram(): string {
    return this.diagram.toJson();
  }

  /**
   * a method that checks whether the diagram is modified, returns true if the
   * flag `isModified` is true or the file is not saved
   *
   * @return whether the diagram is modified
   */
  isModified(): boolean {
    return this.isModifiedFlag || this.sourceCurrentMemento !== this.getLatestMemento();
  }

  /**
   * a method that saves the current memento as the source memento, and sets the
   * flag `isModified` to false
   */
  save() {
    this.sourceCurrentMemento = this.getLatestMemento();
    this.isModifiedFlag = false;
  }

  /**
   * a method that sets the flag `isModified` to the given value., note that
   * setting the flag to false does not mean the diagram is not modified
   *
   * @see #isModified()
   *
   * @param isModified the value to set
   */
  setModified(isModified: boolean) {
    this.isModifiedFlag = isModified;
  }

  /**
   * a method that eliminates all history and set the flag `isModified` to false
   */
  resetHistory() {
    super.resetHistory();
    this.sourceCurrentMemento = this.getLatestMemento();
    this.isModifiedFlag = false;
  }
}

