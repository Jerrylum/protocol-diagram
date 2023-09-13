import React from "react";

export function useBetterMemo<T extends { destructor: () => void } | {}>(
  factory: () => T,
  deps: React.DependencyList = []
): T {
  const storage = React.useMemo(() => factory(), deps); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    return () => {
      if ("destructor" in storage && typeof storage.destructor === "function") storage.destructor?.();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return storage;
}
