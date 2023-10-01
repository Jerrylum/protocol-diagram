import { makeAutoObservable } from "mobx";

export type LogLevel = "info" | "error";

export interface CommandLog {
  level: LogLevel;
  message: string;
}

export class CommandLogger {
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
    this._logs.push({ level, message });
    this._logs = this._logs.slice(-this._maxLogs);
    this._logCount++;
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
