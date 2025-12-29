import { describe, expect, it } from "vitest";

import { isObject } from "./utils.js";

describe(isObject, () => {
  it("returns true for plain objects", () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ key: "value" })).toBe(true);
    expect(isObject({ nested: { object: true } })).toBe(true);
  });

  it("returns false for arrays", () => {
    expect(isObject([])).toBe(false);
    expect(isObject([1, 2, 3])).toBe(false);
    expect(isObject(["string"])).toBe(false);
  });

  it("returns false for null", () => {
    expect(isObject(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isObject(undefined)).toBe(false);
  });

  it("returns false for primitive types", () => {
    expect(isObject("string")).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(false)).toBe(false);
    expect(isObject(Symbol("test"))).toBe(false);
    expect(isObject(BigInt(123))).toBe(false);
  });

  it("returns false for functions", () => {
    expect(isObject(() => {})).toBe(false);
    expect(isObject(function namedFunction() {})).toBe(false);
  });

  it("returns true for object instances", () => {
    expect(isObject(new Date())).toBe(true);
    expect(isObject(new Error())).toBe(true);
    expect(isObject(/test/)).toBe(true);
  });
});
