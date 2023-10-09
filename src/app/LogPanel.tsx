import { Box, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useTimeout } from "../core/Hook";
import { CommandLog } from "../core/CommandLog";
import { getRootStore } from "../core/Root";

export const CommandLogComponent = observer((props: { log: CommandLog; focused: boolean }) => {
  const log = props.log;

  const [hiding, setHiding] = React.useState(false);

  React.useEffect(() => {
    if (props.focused) {
      setHiding(false);
    }
  }, [props.focused]);

  useTimeout(
    () => {
      setHiding(true);
    },
    props.focused ? null : 2000,
    [props.focused]
  );

  return (
    <Typography
      variant="body2"
      sx={{
        fontFamily: "Ubuntu Mono",
        color: log.level === "info" ? "text.primary" : "error.main",
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        opacity: hiding ? 0 : 1,
        transition: hiding ? "opacity 2s ease-in-out" : "",
        minHeight: "20px",
        lineHeight: "20px",
        padding: "0 4px"
      }}>
      {log.message}
    </Typography>
  );
});

export const LogPanel = observer(() => {
  const { logger } = getRootStore();
  const logs = logger.logs;

  const [focused, setFocused] = React.useState(false);
  const logPanelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logPanelRef.current) {
      logPanelRef.current.scrollTop = logPanelRef.current.scrollHeight;
    }
  }, [logger.logCount]);

  return (
    <Box
      ref={logPanelRef}
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => setFocused(false)}
      sx={{
        position: "absolute",
        left: "0",
        right: "0",
        bottom: "calc(100% + 4px)",
        maxHeight: "60px",
        overflowY: "auto"
      }}>
      {logs.map((log, i) => (
        <CommandLogComponent key={log.uid} log={log} focused={focused} />
      ))}
    </Box>
  );
});
