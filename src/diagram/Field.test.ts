import { Field } from "./Field";

test('Field constructor', () => {
    const f = new Field("test", 1);
    expect(f.name).toBe("test");
    expect(f.length).toBe(1);
});

test('Field setName', () => {
    const f = new Field("test", 1);
    expect(f.name).toBe("test");
    f.name = "test2";
    expect(f.name).toBe("test2");
});

test('Field setLength', () => {
    const f = new Field("test", 1);
    expect(f.length).toBe(1);
    f.length = 2;
    expect(f.length).toBe(2);
});