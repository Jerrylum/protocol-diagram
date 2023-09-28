import { Card } from "@mui/material";
import { observer } from "mobx-react-lite";
import { Modal } from "../component/Modal";
// import { MarkdownOverwrittenComponents } from "../component/MarkdownComponents";
// import MarkdownMDX from "./TestMarkdown.mdx";
import { getRootStore } from "../core/Root";

export const TestModalSymbol = Symbol("TestModalSymbol");

export const TestModal = observer(() => {
  const { modals } = getRootStore();

  const onClose = () => {
    modals.close(TestModalSymbol);
  };

  return (
    <Modal symbol={TestModalSymbol} onClose={onClose}>
      <Card
        className="modal-container"
        sx={{
          padding: "16px",
          width: "768px",
          maxWidth: "80%",
          minHeight: "96px",
          outline: "none !important",
          height: "80%",
          overflowY: "auto"
        }}>
        {/* <MarkdownMDX components={MarkdownOverwrittenComponents} /> */}
      </Card>
    </Modal>
  );
});

