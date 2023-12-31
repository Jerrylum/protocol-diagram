import { runInAction } from "mobx";
import { Vector } from "./Vector";

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isMacOS(userAgent: string): boolean {
  if (userAgent.search("Windows") !== -1) {
    return false;
  } else if (userAgent.search("Mac") !== -1) {
    return true;
  } else {
    return false;
  }
}

export function isFirefox() {
  return !((window as any)["mozInnerScreenX"] === undefined);
}

export function getWindowSize(): Vector {
  // UX: innerHeight is only used in the first render
  // UX: clientWidth is better than innerWidth because it is accurate when the web page is zoomed
  return new Vector(document.body.clientWidth || window.innerWidth, document.body.clientHeight || window.innerHeight);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function runInActionAsync<T>(action: () => T): Promise<T> {
  return new Promise(resolve => runInAction(() => resolve(action())));
}
