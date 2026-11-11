import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SYNC_INTERVAL_MS,
  APINEX_MODELS_URL,
  COMBO_NAME,
  PROVIDER_ALIAS,
  getApinexSyncState,
  startApinexSync,
} from "../../src/lib/apinex/sync.js";

describe("apinex sync module constants and scheduler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports correct defaults and urls", () => {
    expect(SYNC_INTERVAL_MS).toBe(24 * 60 * 60 * 1000);
    expect(APINEX_MODELS_URL).toBe("https://apinex.bond/api/public/models");
    expect(COMBO_NAME).toBe("9r-apinex");
    expect(PROVIDER_ALIAS).toBe("apinex");
  });

  it("tracks state transitions", () => {
    const state = getApinexSyncState();
    expect(state).toHaveProperty("running");
    expect(state).toHaveProperty("intervalMs", 24 * 60 * 60 * 1000);
  });

  it("skips scheduling when APINEX_SYNC=off", () => {
    const originalEnv = process.env.APINEX_SYNC;
    process.env.APINEX_SYNC = "off";
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    startApinexSync();
    expect(setTimeoutSpy).not.toHaveBeenCalled();

    if (originalEnv === undefined) {
      delete process.env.APINEX_SYNC;
    } else {
      process.env.APINEX_SYNC = originalEnv;
    }
  });
});
