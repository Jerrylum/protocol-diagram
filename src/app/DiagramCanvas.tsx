import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { Box } from "@mui/material";
import { Layer, Stage, Text } from "react-konva";
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

export const DiagramTextLineElement = observer((props: { line: string; lineNumber: number }) => {
  return (
    <>
      {props.line.split("").map((char, index) => (
        <Text
          key={index}
          text={char}
          x={16 * index}
          y={16 * props.lineNumber}
          fontSize={16}
          fontFamily={"Consolas"}
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

  const diagramText = ` 0                   1           
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 
┌───────────────┬───────────────┐
│      Type     │      Code     │
└───────────────┴───────────────┘`;

  return (
    <Box sx={{ position: "fixed", top: 0, left: 0, bottom: 0, right: 0 }}>
      <Stage
        className="diagram-canvas"
        ref={stageRef}
        width={controller.canvasSize.x}
        height={controller.canvasSize.y}
        onContextMenu={e => e.evt.preventDefault()}>
        <Layer>
          {
            diagramText.split("\n").map((line, index) => (
              <DiagramTextLineElement key={index} line={line} lineNumber={index} />
            ))
          }
        </Layer>
      </Stage>
    </Box>
  );
});

