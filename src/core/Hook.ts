import { action, runInAction } from "mobx";
import React, { DependencyList } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { HotkeyCallback, HotkeysEvent, Options, RefType, Trigger } from "react-hotkeys-hook/dist/types";
import { IS_MAC_OS } from "./Util";

export function useTimeout(callback: () => void, delay: number | null, dependencies: DependencyList = []) {
  React.useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(callback, delay);
    return () => clearTimeout(id);
  }, [delay, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps
}

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

export namespace Custom {
  // See: https://github.com/microsoft/TypeScript/issues/33047

  export type EventMap<T extends EventTarget> = T extends MediaQueryList
    ? MediaQueryListEventMap
    : T extends Document
    ? DocumentEventMap
    : T extends Window
    ? WindowEventMap
    : HTMLElementEventMap & { [key: string]: Event };

  export type EventType<T extends EventTarget> = keyof EventMap<T> & string;

  export type EventListener<
    TEventTarget extends EventTarget,
    TEventType extends keyof Custom.EventMap<TEventTarget>
  > = (this: TEventTarget, ev: Custom.EventMap<TEventTarget>[TEventType]) => any;
}

export function useEventListener<TEventTarget extends EventTarget, TEventType extends Custom.EventType<TEventTarget>>(
  eventTarget: TEventTarget | null,
  eventType: TEventType,
  listener: Custom.EventListener<TEventTarget, TEventType>,
  options?: boolean | AddEventListenerOptions
) {
  React.useEffect(() => {
    const eventListener = action(listener);
    eventTarget?.addEventListener(eventType, eventListener as any, options);

    return () => {
      eventTarget?.removeEventListener(eventType, eventListener as any, options);
    };
  }, [eventTarget, eventType, listener, options]);
}

export interface CustomHotkeysOptions extends Options {
  preventDefaultOnlyIfEnabled?: boolean;
}

export function useCustomHotkeys<T extends HTMLElement>(
  keys: string,
  callback: () => void,
  options?: CustomHotkeysOptions,
  dependencies?: DependencyList
): React.MutableRefObject<RefType<T>> {
  const timeRef = React.useRef<number | null>(null);
  const enabledRef = React.useRef<boolean>(false);

  function onKeydown(func: () => void): HotkeyCallback {
    return function (kvEvt: KeyboardEvent, hkEvt: HotkeysEvent) {
      if (enabledRef.current === false) return;

      /*
        UX: Debounce the keydown event to prevent the callback from being called multiple times.
        If the user holds down the key, the callback will only be called once until the key is released.
        However, it auto resets after 800ms of no keydown events to prevent the case where the keyup event is missed.
        
        Last but not least, do not debounce MacOS meta hotkeys.
        See: https://stackoverflow.com/questions/11818637/why-does-javascript-drop-keyup-events-when-the-metakey-is-pressed-on-mac-browser
        
        The debounce times are randomly chosen.
        */

      const isMacMetaHotkey = IS_MAC_OS && kvEvt.metaKey;

      if (kvEvt.type === "keyup") {
        timeRef.current = null;
      } else if (kvEvt.type === "keydown") {
        if (timeRef.current === null || Date.now() - timeRef.current > (isMacMetaHotkey ? 200 : 800)) {
          runInAction(func);
          timeRef.current = Date.now();
        } else if (isMacMetaHotkey === false) {
          timeRef.current = Date.now();
        }
      }
    };
  }

  return useHotkeys(
    keys,
    onKeydown(callback),
    {
      ...options,
      keydown: true,
      keyup: true,
      preventDefault: false,
      enabled: (kvEvt: KeyboardEvent, hkEvt: HotkeysEvent): boolean => {
        let rtn: boolean;

        const enabledOptions: Trigger | undefined = options?.enabled;
        if (enabledOptions === undefined) {
          rtn = true;
        } else if (typeof enabledOptions === "function") {
          rtn = enabledOptions(kvEvt, hkEvt);
        } else {
          rtn = enabledOptions;
        }

        enabledRef.current = rtn;

        /*
          ALGO:
          If the hotkey is enabled: preventDefault
          If the hotkey is not enabled, it is allowed to preventDefault: preventDefault
          Else: do not preventDefault, but return true to prevent useHotkeys from calling preventDefault
          */
        if (rtn === true || options?.preventDefaultOnlyIfEnabled !== true) {
          kvEvt.preventDefault();
          kvEvt.stopPropagation();
        } else {
          rtn = true;
        }

        return rtn;
      }
    },
    dependencies
  );
}

export function useDragDropFile(enable: boolean, onDrop: (file: File) => void) {
  const [isDraggingFile, setIsDraggingFile] = React.useState(false);
  // console.log('useDragDropFile')
  return {
    isDraggingFile,
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
  };
}
