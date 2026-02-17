import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FraudValidationService } from "./fraud-validation.service.js";

describe("FraudValidationService", () => {
  let service: FraudValidationService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new FraudValidationService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("validate resolves to a boolean", async () => {
    const resultPromise = service.validate();
    await vi.advanceTimersByTimeAsync(600);
    const result = await resultPromise;
    expect(typeof result).toBe("boolean");
  });

  it("validate delays ~500ms before resolving", async () => {
    const resultPromise = service.validate();
    let resolved = false;
    resultPromise.then(() => {
      resolved = true;
    });
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(499);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(resolved).toBe(true);
  });

  it("validate returns true or false (stochastic)", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 20; i++) {
      const p = service.validate();
      await vi.advanceTimersByTimeAsync(600);
      results.push(await p);
    }
    const hasTrue = results.some((r) => r === true);
    const hasFalse = results.some((r) => r === false);
    expect(hasTrue).toBe(true);
    expect(hasFalse).toBe(true);
  });
});
