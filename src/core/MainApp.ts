import { action, computed, makeObservable, observable, override } from "mobx";
import { SemVer } from "semver";
import { CancellableCommand } from "../command/Commands";
import { Diagram, Memento } from "../diagram/Diagram";
import { Timeline } from "../diagram/Timeline";
import { APP_VERSION_STRING } from "../Version";
import { DiagramEditor } from "./DiagramEditor";
import { Logger } from "./Logger";


export const APP_VERSION = new SemVer(APP_VERSION_STRING);

const logger = Logger("App");

export class MainApp extends Timeline<CancellableCommand> {
  // The current memento saved in the file or the first memento in the timeline
  private sourceCurrentMemento!: Memento | null;
  private isModifiedFlag!: boolean;

  readonly diagramEditor = new DiagramEditor();

  // null = loading, undefined = not available
  public latestVersion: SemVer | null | undefined = undefined;

  constructor() {
    super(new Diagram());
    this.newDiagram();

    makeObservable<MainApp, "sourceCurrentMemento" | "isModifiedFlag" | "latestVersion">(this, {
      sourceCurrentMemento: observable,
      isModifiedFlag: observable,
      latestVersion: observable,
      diagram: override,
      newDiagram: action,
      isModified: action,
      setModified: action,
      resetHistory: override
    });

    logger.log("Version", APP_VERSION_STRING);
  }

  get diagram(): Diagram {
    return this._diagram;
  }

  set diagram(diagram: Diagram) {
    this._diagram = diagram;
  }

  newDiagram() {
    this.diagram = new Diagram();
    this.resetHistory();
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

