import { makeAutoObservable } from "mobx";
import { HandleResult } from "../command/HandleResult";

export type LogLevel = "info" | "error";

export interface CommandLog {
  uid: number;
  level: LogLevel;
  message: string;
}

export class CommandLogger {
  log(result: HandleResult) {
    throw new Error("Method not implemented.");
  }
  private _logs: CommandLog[] = [];
  private _logCount = 0;

  constructor(public _maxLogs: number = 100) {
    makeAutoObservable(this);
  }

  get logs(): CommandLog[] {
    return this._logs;
  }

  get logCount(): number {
    return this._logCount;
  }

  add(level: LogLevel, message: string) {
    this._logs.push({ uid: this._logCount++, level, message });
    this._logs = this._logs.slice(-this._maxLogs);
  }

  info(message: string) {
    this.add("info", message);
  }

  error(message: string) {
    this.add("error", message);
  }

  clear() {
    this._logs = [];
  }

  get maxLogs(): number {
    return this._maxLogs;
  }

  set maxLogs(maxLogs: number) {
    this._maxLogs = maxLogs;
    this._logs = this._logs.slice(-maxLogs);
  }
}
