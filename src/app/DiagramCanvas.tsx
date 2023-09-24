import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { Box } from "@mui/material";
import { Layer, Stage, Text } from "react-konva";
import { Vector } from "../core/Vector";
import { getWindowSize } from "../core/Util";
import { useBetterMemo } from "../core/Hook";
import React from "react";
import Konva from "konva";
import { getRootStore } from "../core/Root";

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

export const DiagramTextLineElement = observer((props: { line: string; lineNumber: number }) => {
  return (
    <>
      {props.line.split("").map((char, index) => (
        <Text
          key={index}
          text={char}
          x={12 * index}
          y={16 * props.lineNumber}
          fontSize={16}
          fontFamily={"Ubuntu Mono Arial"}
          fill={"black"}
          width={16}
          height={16}
          align="center"
        />
      ))}
    </>
  );
});

export const DiagramCanvas = observer(() => {
  const controller = useBetterMemo(() => new DiagramCanvasController(), []);
  const stageRef = React.useRef<Konva.Stage>(null);

  const {app} = getRootStore();
  const diagramText = app.diagram.toString();

  const canvasSize = controller.canvasSize;

  const diagramLines = diagramText.split("\n");
  const diagramLineLength = diagramLines[0].length ?? 0;
  const diagramWidthInPx = diagramLineLength * 12;
  const diagramHeightInPx = diagramLines.length * 16;

  return (
    <Box sx={{ position: "fixed", top: 0, left: 0, bottom: 0, right: 0 }}>
      <Stage
        className="diagram-canvas"
        ref={stageRef}
        width={canvasSize.x}
        height={canvasSize.y}
        offset={{ x: (canvasSize.x - diagramWidthInPx) / -2, y: (canvasSize.y - diagramHeightInPx) / -2 }}
        onContextMenu={e => e.evt.preventDefault()}>
        <Layer>
          {diagramLines.map((line, index) => (
            <DiagramTextLineElement key={index} line={line} lineNumber={index} />
          ))}
        </Layer>
      </Stage>
    </Box>
  );
});

