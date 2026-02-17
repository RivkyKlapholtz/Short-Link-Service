import { describe, it, expect } from "vitest";
import { generateShortCode } from "./short-code.js";

const VALID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

describe("generateShortCode", () => {
  it("returns a string of length 6", () => {
    const code = generateShortCode();
    expect(code).toHaveLength(6);
  });

  it("returns only valid characters (alphanumeric)", () => {
    const code = generateShortCode();
    for (const char of code) {
      expect(VALID_CHARS).toContain(char);
    }
  });

  it("produces different codes on successive calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateShortCode());
    }
    expect(codes.size).toBeGreaterThan(1);
  });
});
