import { Backdrop, BackdropTypeMap, Typography } from "@mui/material";
import { DefaultComponentProps } from "@mui/material/OverridableComponent";
import { observer } from "mobx-react-lite";
import React from "react";

export function useDragDropFile(enable: boolean, onDrop: (file: File) => void) {
  const [isDraggingFile, setIsDraggingFile] = React.useState(false);

  return {
    isDraggingFile,
    getRootProps: () => ({
      onDragEnter: (e: React.DragEvent<HTMLDivElement>) => {
        setIsDraggingFile(e.dataTransfer.types.includes("Files"));
      },
      onDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
        setIsDraggingFile(false);
      },
      onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
      },
      onDrop: (e: React.DragEvent<HTMLDivElement>) => {
        setIsDraggingFile(false);
        e.preventDefault();
        e.stopPropagation();
        if (enable === false) return;

        const file = e.dataTransfer.files?.[0];
        if (file === undefined) return;
        onDrop(file);
      }
    })
  };
}

const DragDropBackdrop = observer((props: Omit<DefaultComponentProps<BackdropTypeMap>, "open">) => {
  return (
    <Backdrop
      className="modal-backdrop"
      sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}
      open={true}
      tabIndex={-1}
      {...props}>
      <Typography variant="h3" color="grey" sx={{ pointerEvents: "none" }} gutterBottom>
        Drop Here
      </Typography>
    </Backdrop>
  );
});

export { DragDropBackdrop };

