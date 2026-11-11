import { describe, it, expect } from "vitest";
import { getAdapter } from "../../src/lib/db/driver.js";

describe("db adapter transaction support", () => {
  it("adapter always provides transaction function", async () => {
    const db = await getAdapter();
    expect(typeof db.transaction).toBe("function");

    const result = db.transaction(() => {
      return 42;
    });
    expect(result).toBe(42);
  });
});
