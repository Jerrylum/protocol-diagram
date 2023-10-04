export class Field {
  static uidCount: number = 0;

  public name: string;
  public length: number;
  public uid: number;

  constructor(name: string, length: number, uid?: number) {
    this.name = name;
    this.length = length;
    this.uid = uid ?? Field.uidCount++;
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
