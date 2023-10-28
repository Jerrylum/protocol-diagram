import { Box, Button, Card, Typography } from "@mui/material";
import React from "react";
import { action, observable, reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useBetterMemo } from "../core/Hook";
import { ObserverInput } from "../component/ObserverInput";
import { Modal } from "../component/Modal";
import { getRootStore } from "../core/Root";
import { ConfirmationModalSymbol } from "../core/Confirmation";

export const ConfirmationModal = observer(() => {
  const { confirmation: cfm } = getRootStore();

  const buttons = useBetterMemo(() => observable([] as (HTMLButtonElement | null)[]), [cfm.isOpen]);
  const [renderCount, setRenderCount] = React.useState(0);

  React.useEffect(() => {
    return reaction(
      () => buttons.length,
      () => setRenderCount(renderCount => renderCount + 1)
    );
  }, [buttons]);

  React.useEffect(() => {
    (document.querySelector("*[data-testid=sentinelStart]") as HTMLElement | undefined)?.focus();
  }, [renderCount]);

  if (cfm.isOpen === false) return null;

  const focusOnButton = (offset: number) => buttons[buttons.indexOf(document.activeElement as any) + offset]?.focus();

  function onClick(idx: number) {
    if (idx < 0 || idx >= cfm.buttons.length) idx = cfm.buttons.length - 1;

    const func = cfm.buttons[idx]?.onClick;
    cfm.close();
    // ALGO: Call after closing the dialog in case the callback opens another dialog
    func?.();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      focusOnButton(-1);
    } else if (e.key === "ArrowRight") {
      focusOnButton(1);
    } else {
      const index = cfm.buttons.findIndex(btn => btn.hotkey === e.key);
      index !== -1 && onClick(index);
    }

    cfm.onKeyDown?.(e, onClick);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.code === "Enter" || e.code === "NumpadEnter") {
      onClick(0);
    }
  }

  return (
    <Modal symbol={ConfirmationModalSymbol} onClose={action(onClick.bind(null, -1))}>
      <Card id="confirmation-modal" className="modal-container" onKeyDown={action(onKeyDown)}>
        <Typography variant="h2" gutterBottom>
          {cfm.title}
        </Typography>
        {/* https://stackoverflow.com/questions/9769587/set-div-to-have-its-siblings-width */}
        <Box sx={{ display: "flex" }}>
          <Typography component="div" variant="body1" gutterBottom sx={{ flexGrow: "1", width: "0" }}>
            {cfm.description}
          </Typography>
        </Box>
        {cfm.input !== undefined && (
          <Box sx={{ width: "100%" }}>
            <ObserverInput
              label={cfm.inputLabel}
              getValue={() => cfm.input!}
              setValue={value => (cfm.input = value)}
              isValidIntermediate={() => true}
              isValidValue={() => true}
              onKeyDown={onInputKeyDown}
              sx={{ width: "100%" }}
            />
          </Box>
        )}
        <Box className="button-box">
          {cfm.buttons.map((btn, i) => {
            return (
              <Button
                key={i}
                disableRipple
                variant="text"
                color={btn.color ?? "inherit"}
                ref={action((element: HTMLButtonElement | null) => (buttons[i] = element))}
                onClick={action(onClick.bind(null, i))}>
                {btn.label}
                {btn.hotkey ? `(${btn.hotkey.toUpperCase()})` : ""}
              </Button>
            );
          })}
        </Box>
      </Card>
    </Modal>
  );
});
