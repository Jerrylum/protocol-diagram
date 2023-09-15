import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { Box } from "@mui/material";
import { Layer, Stage } from "react-konva";
import { Vector } from "../core/Vector";
import { getWindowSize } from "../core/Util";
import { useBetterMemo } from "../core/Hook";
import React from "react";
import Konva from "konva";

export class DiagramCanvasController {
  canvasSize: Vector = getWindowSize();

  private updateCanvasSize() {
    this.canvasSize = getWindowSize();
  }

  constructor() {
    makeAutoObservable(this);

    window.addEventListener("resize", () => this.updateCanvasSize());
  }
}

export const DiagramCanvas = observer(() => {
  const controller = useBetterMemo(() => new DiagramCanvasController(), []);
  const stageRef = React.useRef<Konva.Stage>(null);

  return (
    <Box sx={{ position: "fixed", top: 0, left: 0, bottom: 0, right: 0 }}>
      <Stage
        className="diagram-canvas"
        ref={stageRef}
        width={controller.canvasSize.x}
        height={controller.canvasSize.y}
        onContextMenu={e => e.evt.preventDefault()}>
        <Layer></Layer>
      </Stage>
    </Box>
  );
});
