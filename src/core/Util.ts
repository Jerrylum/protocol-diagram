import { Vector } from "./Vector";

export function getWindowSize(): Vector {
  // UX: innerHeight is only used in the first render
  // UX: clientWidth is better than innerWidth because it is accurate when the web page is zoomed
  return new Vector(document.body.clientWidth || window.innerWidth, document.body.clientHeight || window.innerHeight);
}
