import "reflect-metadata";
import { makeAutoObservable } from "mobx";
import { IsInt, IsNumber, IsString } from "class-validator";
import { Expose } from "class-transformer";

export class Field {
  static uidCount: number = 0;

  @IsString()
  @Expose()
  public name: string;
  @IsNumber()
  @IsInt()
  @Expose()
  public length: number;
  @IsNumber()
  @IsInt()
  @Expose()
  public uid: number;

  constructor(name: string, length: number, uid?: number) {
    this.name = name;
    this.length = length;
    this.uid = uid ?? Field.uidCount++;
    makeAutoObservable(this);
  }

  equals(obj: unknown): boolean {
    // Especially for the uid comparison, ignore name and length
    if (obj instanceof Field) {
      return obj.uid === this.uid;
    }

    return false;
  }

  clone(): Field {
    return new Field(this.name, this.length, this.uid);
  }
}
