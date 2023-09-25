import { makeAutoObservable } from "mobx";
import { clamp } from "./Util";
import { Vector } from "./Vector";

export class DiagramEditor {
  private _offset: Vector = new Vector(0, 0);
  private _scale: number = 1; // 1 = 100%, [1..3]

  get offset() {
    return this._offset;
  }

  get scale() {
    return this._scale;
  }

  set offset(offset: Vector) {
    this._offset = offset;
  }

  set scale(scale: number) {
    this._scale = clamp(scale, 0.75, 2);
  }

  constructor() {
    makeAutoObservable(this);
  }

  resetOffsetAndScale() {
    this.offset = new Vector(0, 0);
    this.scale = 1;
  }
}