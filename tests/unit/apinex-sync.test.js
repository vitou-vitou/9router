import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// One persistent adapter mock for the whole file. The db stub is swapped per
// test via `setDb`; the module is imported once at the top level so vi.doMock
// registration and resetModules() cannot leave sync.js bound to the real driver.
const dbRef = { current: null };

vi.mock("@/lib/db/driver", () => ({
  getAdapter: async () => {
    if (!dbRef.current) throw new Error("no db stub installed");
    return dbRef.current;
  },
}));

const {
  SYNC_INTERVAL_MS,
  APINEX_MODELS_URL,
  APINEX_STATUS_URL,
  APINEX_CHAT_URL,
  APINEX_CHECKIN_URL,
  COMBO_NAME,
  PROVIDER_ALIAS,
  getApinexSyncState,
  startApinexSync,
  syncApinexModels,
  verifyApinexModels,
  classifyApinexError,
  isFreeModelAllowed,
} = await import("../../src/lib/apinex/sync.js");

// ---------------------------------------------------------------------------
// Fixtures modeled on the real APInex public payloads.
// ---------------------------------------------------------------------------

const liveFreeModel = (id, extra = {}) => ({
  id,
  provider: "Free",
  name: id,
  contextWindow: "1M",
  weight: 3,
  allowFree: true,
  supportsVision: false,
  supportsTools: true,
  dollarsPer1M: 0,
  outputDollarsPer1M: 0,
  tags: [],
  health: "live",
  ...extra,
});

const modelsPayload = {
  models: [
    liveFreeModel("free/qwen-3.8-max", { weight: 3 }),
    liveFreeModel("free/glm-5.3", { weight: 2 }),
    // allowFree:false — must never be imported, 402s on a free key.
    liveFreeModel("free/claude-opus-4.6", { allowFree: false }),
    // health:"no_data" — not verifiably usable.
    liveFreeModel("free/mimo-v2.6-flash", { health: "no_data" }),
    // paid model, dollarsPer1M > 0.
    { ...liveFreeModel("free/paid-thing"), provider: "Pro", dollarsPer1M: 3 },
  ],
};

const statusPayload = {
  generatedAt: "2026-11-14T05:16:20.990Z",
  windowHours: 168,
  models: [
    { id: "free/qwen-3.8-max", name: "Qwen 3.8 Max", provider: "Free", state: "operational", uptimePct: 99.8, hours: [] },
    { id: "free/glm-5.3", name: "GLM 5.3", provider: "Free", state: "degraded", uptimePct: 95.0, hours: [] },
  ],
};

// ---------------------------------------------------------------------------
// DB adapter stub. sync.js uses a tiny subset: transaction/all/get/run.
// ---------------------------------------------------------------------------

function makeDbStub(initialCustom = []) {
  const custom = new Map(initialCustom.map((m) => [`${PROVIDER_ALIAS}|${m.id}|llm`, m]));
  // Keyed by BOTH name and id so `WHERE name = ?` and `WHERE id = ?` both hit.
  const combos = new Map();
  const calls = { run: [] };

  const seedCombo = (row) => {
    combos.set(row.name, row);
    combos.set(row.id, row);
  };

  const db = {
    // Real adapters invoke fn immediately and return its result.
    transaction(fn) {
      return fn();
    },
    all(sql) {
      if (sql.includes("FROM kv") && sql.includes("customModels")) {
        return [...custom.entries()].map(([key, value]) => ({ key, value: JSON.stringify(value) }));
      }
      return [];
    },
    get(sql, params) {
      if (sql.includes("FROM combos")) {
        const row = combos.get(params[0]);
        return row ? { ...row } : undefined;
      }
      return undefined;
    },
    run(sql, params) {
      calls.run.push({ sql, params });
      if (sql.startsWith("DELETE FROM kv")) {
        // DELETE ... key = ?  -> params [key]
        custom.delete(params[0]);
      } else if (sql.startsWith("INSERT OR REPLACE INTO kv")) {
        // INSERT ... VALUES('customModels', ?, ?) -> params [key, value]
        const [key, value] = params;
        custom.set(key, typeof value === "string" ? JSON.parse(value) : value);
      } else if (sql.startsWith("INSERT INTO combos")) {
        seedCombo({ id: params[0], name: params[1], models: params[3] });
      } else if (sql.startsWith("UPDATE combos")) {
        // UPDATE combos SET models = ?, updatedAt = ? WHERE id = ?
        const [models, , id] = params;
        const row = combos.get(id);
        if (row) {
          const next = { ...row, models, updatedAt: params[1] };
          combos.set(row.name, next);
          combos.set(row.id, next);
        }
      }
      return { changes: 1 };
    },
  };

  return { db, custom, combos, calls, seedCombo };
}

function setDb(stub) {
  dbRef.current = stub.db;
}

const jsonResponse = (body, ok = true, status = 200) =>
  ({ ok, status, json: async () => body });

beforeEach(() => {
  dbRef.current = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
  dbRef.current = null;
});

// ---------------------------------------------------------------------------

describe("apinex sync module constants and scheduler", () => {
  it("exports correct defaults and urls", () => {
    expect(SYNC_INTERVAL_MS).toBe(24 * 60 * 60 * 1000);
    expect(APINEX_MODELS_URL).toBe("https://apinex.bond/api/public/models");
    expect(APINEX_STATUS_URL).toBe("https://apinex.bond/api/public/status");
    expect(APINEX_CHAT_URL).toBe("https://api.apinex.bond/v1/chat/completions");
    expect(APINEX_CHECKIN_URL).toBe("https://apinex.bond/overview");
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

// ---------------------------------------------------------------------------
// Filter correctness — the root cause of the cascade lock.
// ---------------------------------------------------------------------------

describe("isFreeModelAllowed", () => {
  it("accepts provider Free with allowFree true, live health, zero cost", () => {
    expect(isFreeModelAllowed(liveFreeModel("free/ok"))).toBe(true);
  });

  it("rejects allowFree:false even when provider and cost look free", () => {
    expect(isFreeModelAllowed(liveFreeModel("free/paid", { allowFree: false }))).toBe(false);
  });

  it("rejects non-live health", () => {
    expect(isFreeModelAllowed(liveFreeModel("free/nd", { health: "no_data" }))).toBe(false);
  });

  it("rejects a non-zero dollarsPer1M", () => {
    expect(isFreeModelAllowed({ ...liveFreeModel("free/x"), dollarsPer1M: 3 })).toBe(false);
  });

  it("rejects a model whose provider is not Free", () => {
    expect(isFreeModelAllowed({ ...liveFreeModel("free/x"), provider: "Pro" })).toBe(false);
  });

  it("rejects null/undefined without throwing", () => {
    expect(isFreeModelAllowed(null)).toBe(false);
    expect(isFreeModelAllowed(undefined)).toBe(false);
  });
});

describe("syncApinexModels filtering", () => {
  // Route by URL so the catalog and status calls can never receive each other's
  // payloads regardless of how many times sync.js calls fetch.
  const routedFetch = ({ models, status } = {}) =>
    vi.fn(async (url) => {
      const u = String(url);
      if (u.includes("/status")) {
        if (status instanceof Error) throw status;
        return jsonResponse(status || { models: [] });
      }
      return jsonResponse(models);
    });

  it("imports only allowFree + live + zero-cost models", async () => {
    const stub = makeDbStub();
    setDb(stub);
    vi.stubGlobal("fetch", routedFetch({ models: modelsPayload }));

    const result = await syncApinexModels();

    expect(result.success).toBe(true);
    expect(result.modelsImported).toBe(2);
    expect(result.models).toEqual(["apinex/free/qwen-3.8-max", "apinex/free/glm-5.3"]);
    expect(stub.custom.has("apinex|free/claude-opus-4.6|llm")).toBe(false);
    expect(stub.custom.has("apinex|free/mimo-v2.6-flash|llm")).toBe(false);
  });

  it("orders the combo by status: operational before degraded", async () => {
    const stub = makeDbStub();
    setDb(stub);
    vi.stubGlobal("fetch", routedFetch({ models: modelsPayload, status: statusPayload }));

    const result = await syncApinexModels();

    expect(result.models).toEqual(["apinex/free/qwen-3.8-max", "apinex/free/glm-5.3"]);
  });

  it("still succeeds when the status endpoint is unreachable (status is best-effort)", async () => {
    const stub = makeDbStub();
    setDb(stub);
    vi.stubGlobal("fetch", routedFetch({ models: modelsPayload, status: new Error("network down") }));

    const result = await syncApinexModels();

    expect(result.success).toBe(true);
    expect(result.modelsImported).toBe(2);
  });

  it("surfaces a check-in error instead of reporting generic failure", async () => {
    const stub = makeDbStub();
    setDb(stub);
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(
      { error: { message: "Daily check-in required to use free models. Please visit https://apinex.bond/overview to check in." } },
      false,
      402
    )));

    await expect(syncApinexModels()).rejects.toThrow(/check-in/i);
  });
});

// ---------------------------------------------------------------------------
// 402 classification.
// ---------------------------------------------------------------------------

describe("classifyApinexError", () => {
  it("classifies the daily check-in message", () => {
    const out = classifyApinexError({
      status: 402,
      body: { error: { message: "Daily check-in required to use free models. Please visit https://apinex.bond/overview to check in." } },
    });
    expect(out.kind).toBe("checkin_required");
    expect(out.checkinUrl).toBe("https://apinex.bond/overview");
    expect(out.lockModel).toBe(false);
  });

  it("classifies the subscription-only message", () => {
    const out = classifyApinexError({
      status: 402,
      body: { error: { message: "This model is currently available only with a subscription. Buy a subscription at https://apinex.bond/subscriptions to use it." } },
    });
    expect(out.kind).toBe("subscription_required");
    expect(out.lockModel).toBe(false);
  });

  it("classifies a rate limit", () => {
    const out = classifyApinexError({ status: 429, body: { error: { message: "slow down" } } });
    expect(out.kind).toBe("rate_limited");
    expect(out.lockModel).toBe(true);
  });

  it("falls back to unknown and preserves locking", () => {
    const out = classifyApinexError({ status: 500, body: { error: { message: "boom" } } });
    expect(out.kind).toBe("unknown");
    expect(out.lockModel).toBe(true);
  });

  it("tolerates a missing body without throwing", () => {
    const out = classifyApinexError({ status: 502 });
    expect(out.kind).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// Verify: probe each imported model, prune the subscription-only ones.
// ---------------------------------------------------------------------------

describe("verifyApinexModels", () => {
  it("reports each imported model ok or subscription-only", async () => {
    const stub = makeDbStub([
      { providerAlias: PROVIDER_ALIAS, id: "free/ok-model", type: "llm", name: "OK" },
      { providerAlias: PROVIDER_ALIAS, id: "free/paid-only", type: "llm", name: "Paid" },
    ]);
    setDb(stub);

    const fetchMock = vi.fn(async (url, init) => {
      const body = JSON.parse(init.body);
      if (body.model === "free/paid-only") {
        return jsonResponse(
          { error: { message: "This model is currently available only with a subscription. Buy a subscription at https://apinex.bond/subscriptions to use it." } },
          false,
          402
        );
      }
      return jsonResponse({ choices: [{ message: { content: "ok" } }] });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyApinexModels({ apiKey: "sk-test" });

    expect(result.checked).toBe(2);
    expect(result.ok).toHaveLength(1);
    expect(result.ok[0].id).toBe("free/ok-model");
    expect(result.subscriptionOnly.map((m) => m.id)).toEqual(["free/paid-only"]);
    expect(result.checkinRequired).toBe(false);
  });

  it("removes subscription-only models from customModels and the combo", async () => {
    const stub = makeDbStub([
      { providerAlias: PROVIDER_ALIAS, id: "free/ok-model", type: "llm", name: "OK" },
      { providerAlias: PROVIDER_ALIAS, id: "free/paid-only", type: "llm", name: "Paid" },
    ]);
    // Seed the combo with both models.
    stub.seedCombo({
      id: "seed-combo",
      name: COMBO_NAME,
      models: JSON.stringify(["apinex/free/ok-model", "apinex/free/paid-only"]),
    });
    setDb(stub);

    vi.stubGlobal("fetch", vi.fn(async (url, init) => {
      const body = JSON.parse(init.body);
      if (body.model === "free/paid-only") {
        return jsonResponse({ error: { message: "available only with a subscription" } }, false, 402);
      }
      return jsonResponse({ choices: [] });
    }));

    await verifyApinexModels({ apiKey: "sk-test" });

    expect(stub.custom.has("apinex|free/paid-only|llm")).toBe(false);
    expect(stub.custom.has("apinex|free/ok-model|llm")).toBe(true);

    const combo = stub.combos.get(COMBO_NAME);
    expect(JSON.parse(combo.models)).toEqual(["apinex/free/ok-model"]);
  });

  it("detects a check-in requirement and does not blame individual models", async () => {
    const stub = makeDbStub([
      { providerAlias: PROVIDER_ALIAS, id: "free/a", type: "llm", name: "A" },
      { providerAlias: PROVIDER_ALIAS, id: "free/b", type: "llm", name: "B" },
    ]);
    setDb(stub);
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(
      { error: { message: "Daily check-in required to use free models. Please visit https://apinex.bond/overview to check in." } },
      false,
      402
    )));

    const result = await verifyApinexModels({ apiKey: "sk-test" });

    expect(result.checkinRequired).toBe(true);
    expect(result.checkinUrl).toBe("https://apinex.bond/overview");
    expect(result.subscriptionOnly).toHaveLength(0);
    expect(result.ok).toHaveLength(0);
    // Nothing pruned on a check-in failure.
    expect(stub.custom.size).toBe(2);
  });

  it("does not prune on transport errors (no evidence about the model)", async () => {
    const stub = makeDbStub([
      { providerAlias: PROVIDER_ALIAS, id: "free/a", type: "llm", name: "A" },
    ]);
    setDb(stub);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("socket hang up");
    }));

    const result = await verifyApinexModels({ apiKey: "sk-test" });

    expect(result.ok).toHaveLength(0);
    expect(result.subscriptionOnly).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(stub.custom.size).toBe(1);
  });

  it("refuses to run without an API key", async () => {
    setDb(makeDbStub());
    await expect(verifyApinexModels({})).rejects.toThrow(/api key/i);
  });
});