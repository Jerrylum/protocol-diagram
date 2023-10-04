import { Card, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import { Modal } from "../component/Modal";
import { getRootStore } from "../core/Root";
import { Command } from "../command/Commands";

export const CommandUsage = observer((props: { cmd: Command }) => {
  const { cmd } = props;

  return (
    <>
      <Typography gutterBottom variant="h5">
        {cmd.getCommandUsage()}
      </Typography>
      <Typography gutterBottom variant="body1">
        {cmd.description}
      </Typography>
    </>
  );
});

export const HelpModalSymbol = Symbol("HelpModalSymbol");

export const HelpModal = observer(() => {
  const { modals } = getRootStore();
  const allCommands = Command.getAvailableCommands();

  const onClose = () => {
    modals.close(HelpModalSymbol);
  };

  return (
    <Modal symbol={HelpModalSymbol} onClose={onClose}>
      <Card
        className="modal-container"
        sx={{
          padding: "16px",
          width: "480px",
          maxWidth: "80%",
          minHeight: "96px",
          outline: "none !important",
          height: "80%",
          overflowY: "auto"
        }}>
        {allCommands.map(cmd => (
          <CommandUsage cmd={cmd} />
        ))}
      </Card>
    </Modal>
  );
});
