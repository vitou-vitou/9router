import { getAdapter } from "@/lib/db/driver";
import { parseJson, stringifyJson } from "@/lib/db/helpers/jsonCol";
import { v4 as uuidv4 } from "uuid";

export const APINEX_MODELS_URL = "https://apinex.bond/api/public/models";
export const APINEX_STATUS_URL = "https://apinex.bond/api/public/status";
export const APINEX_CHAT_URL = "https://api.apinex.bond/v1/chat/completions";
export const APINEX_CHECKIN_URL = "https://apinex.bond/overview";
export const COMBO_NAME = "9r-apinex";
export const PROVIDER_ALIAS = "apinex";
export const FETCH_TIMEOUT_MS = 15000;
// A probe only needs a token or two; keep it well under the free-tier RPM budget.
export const VERIFY_TIMEOUT_MS = 20000;
export const VERIFY_MAX_TOKENS = 1;

export const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STARTUP_DELAY_MS = 60 * 1000; // 60 seconds after server boots
const RETRY_DELAY_MS = 60 * 60 * 1000; // 1 hour retry on error

let timer = null;
let state = {
  running: false,
  verifying: false,
  lastSync: null,
  lastError: null,
  lastResult: null,
  lastVerify: null,
};

export function getApinexSyncState() {
  return {
    ...state,
    intervalMs: SYNC_INTERVAL_MS,
    checkinUrl: APINEX_CHECKIN_URL,
  };
}

/**
 * Whether a catalog entry is genuinely usable on a free APInex key.
 *
 * `provider === "Free" && dollarsPer1M === 0` is NOT sufficient: APInex lists
 * models that are free-tier-labelled but gated behind a paid subscription
 * (`allowFree: false`). Importing those makes every request 402, and each 402
 * arms a `modelLock_*` cooldown until the whole combo reads unavailable.
 * `health !== "live"` entries are equally unusable.
 *
 * @param {object} model
 * @returns {boolean}
 */
export function isFreeModelAllowed(model) {
  if (!model || typeof model !== "object") return false;
  return (
    model.provider === "Free" &&
    model.dollarsPer1M === 0 &&
    model.allowFree === true &&
    model.health === "live"
  );
}

/**
 * Classify an APInex error response.
 *
 * The two 402 shapes mean opposite things and must not be handled alike:
 *  - "Daily check-in required" applies to EVERY free model, so locking models
 *    individually is wrong — the account needs a manual check-in.
 *  - "available only with a subscription" is model-specific, so that model is
 *    simply not usable and should leave the combo rather than be locked.
 *
 * @param {{status?: number, body?: any}} input
 * @returns {{kind: "checkin_required"|"subscription_required"|"rate_limited"|"unknown", message: string, checkinUrl: string|null, lockModel: boolean}}
 */
export function classifyApinexError({ status, body } = {}) {
  const raw =
    (typeof body === "string" ? body : body?.error?.message || body?.message || "") || "";
  const message = String(raw);

  if (/daily check-?in required/i.test(message)) {
    return {
      kind: "checkin_required",
      message,
      checkinUrl: APINEX_CHECKIN_URL,
      lockModel: false,
    };
  }

  if (/available only with a subscription/i.test(message)) {
    return {
      kind: "subscription_required",
      message,
      checkinUrl: null,
      lockModel: false,
    };
  }

  if (status === 429 || /rate limit|too many requests/i.test(message)) {
    return {
      kind: "rate_limited",
      message,
      checkinUrl: null,
      lockModel: true,
    };
  }

  return { kind: "unknown", message, checkinUrl: null, lockModel: true };
}

/**
 * Rank free models for combo ordering using the public status telemetry.
 * Operational first, then higher uptime, then higher upstream weight.
 * Status is best-effort: an unreachable status endpoint degrades to catalog
 * order rather than failing the sync.
 *
 * @param {Array} models filtered free models
 * @param {Map<string, object>} statusById
 * @returns {Array}
 */
function rankFreeModels(models, statusById) {
  const rank = (m) => {
    const s = statusById.get(m.id);
    const stateRank = s?.state === "operational" ? 0 : s?.state === "degraded" ? 1 : 2;
    return { stateRank, uptime: Number(s?.uptimePct) || 0, weight: Number(m.weight) || 0 };
  };

  return [...models].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra.stateRank !== rb.stateRank) return ra.stateRank - rb.stateRank;
    if (rb.uptime !== ra.uptime) return rb.uptime - ra.uptime;
    return rb.weight - ra.weight;
  });
}

/**
 * Best-effort fetch of the public status telemetry, keyed by model id.
 * Never throws: an unreachable status endpoint yields an empty map.
 * @returns {Promise<Map<string, object>>}
 */
export async function fetchApinexStatus() {
  const byId = new Map();
  try {
    const res = await fetch(APINEX_STATUS_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return byId;
    const data = await res.json();
    for (const entry of data?.models || []) {
      if (entry?.id) byId.set(entry.id, entry);
    }
  } catch {
    // Telemetry is advisory only.
  }
  return byId;
}

/**
 * Fetch free models from APInex, import into customModels, and upsert 9r-apinex combo.
 * @returns {Promise<{success: boolean, modelsImported: number, models: string[], combo: {id: string, name: string}}>}
 */
export async function syncApinexModels() {
  if (state.running) {
    return { skipped: true, reason: "Sync already running" };
  }

  state.running = true;
  try {
    const res = await fetch(APINEX_MODELS_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      const classified = classifyApinexError({ status: res.status, body });
      if (classified.kind === "checkin_required") {
        throw new Error(
          `APInex daily check-in required. Open ${APINEX_CHECKIN_URL} to check in, then sync again.`
        );
      }
      throw new Error(`APInex API returned ${res.status}`);
    }

    const data = await res.json();
    const allModels = data.models || [];
    const freeModels = allModels.filter(isFreeModelAllowed);

    if (freeModels.length === 0) {
      throw new Error("No free models found from APInex");
    }

    const statusById = await fetchApinexStatus();
    const ranked = rankFreeModels(freeModels, statusById);

    const db = await getAdapter();
    const modelIds = [];

    const combo = db.transaction(() => {
      // Delete old custom models for this provider
      const allCustom = db.all(`SELECT key, value FROM kv WHERE scope = 'customModels'`);
      for (const row of allCustom) {
        const v = parseJson(row.value);
        if (v?.providerAlias === PROVIDER_ALIAS && (v.type || "llm") === "llm") {
          db.run(`DELETE FROM kv WHERE scope = 'customModels' AND key = ?`, [row.key]);
        }
      }

      // Insert fresh custom models
      for (const m of ranked) {
        const k = `${PROVIDER_ALIAS}|${m.id}|llm`;
        const value = stringifyJson({
          providerAlias: PROVIDER_ALIAS,
          id: m.id,
          type: "llm",
          name: m.name || m.id,
          ...(m.supportsVision ? { caps: { vision: true } } : {}),
        });
        db.run(`INSERT OR REPLACE INTO kv(scope, key, value) VALUES('customModels', ?, ?)`, [k, value]);
        modelIds.push(`${PROVIDER_ALIAS}/${m.id}`);
      }

      // Upsert combo
      const existing = db.get(`SELECT * FROM combos WHERE name = ?`, [COMBO_NAME]);
      const now = new Date().toISOString();
      if (existing) {
        db.run(
          `UPDATE combos SET models = ?, updatedAt = ? WHERE id = ?`,
          [stringifyJson(modelIds), now, existing.id]
        );
        return { id: existing.id, name: COMBO_NAME };
      }
      const id = uuidv4();
      db.run(
        `INSERT INTO combos(id, name, kind, models, createdAt, updatedAt) VALUES(?, ?, NULL, ?, ?, ?)`,
        [id, COMBO_NAME, stringifyJson(modelIds), now, now]
      );
      return { id, name: COMBO_NAME };
    });

    const result = {
      success: true,
      modelsImported: modelIds.length,
      models: modelIds,
      combo,
    };

    state.lastSync = Date.now();
    state.lastError = null;
    state.lastResult = result;
    console.log(`[apinex-sync] Synced ${result.modelsImported} free models into combo ${COMBO_NAME}`);
    return result;
  } catch (error) {
    state.lastError = error?.message || String(error);
    console.log(`[apinex-sync] sync failed: ${state.lastError}`);
    throw error;
  } finally {
    state.running = false;
  }
}

/**
 * Look up the APInex API key for the `apinex` provider alias.
 * @returns {Promise<string|null>}
 */
async function resolveApinexApiKey() {
  const db = await getAdapter();
  const rows = db.all(`SELECT key, value FROM kv WHERE scope = 'providerConnections'`);
  for (const row of rows) {
    const v = parseJson(row.value);
    if (!v) continue;
    const alias = v.providerAlias || v.provider || v.providerId;
    if (alias !== PROVIDER_ALIAS) continue;
    if (v.isActive === false) continue;
    const key = v.apiKey || v.key || v.token;
    if (key) return key;
  }
  return null;
}

/**
 * Probe every imported APInex model with a 1-token completion and report which
 * are actually reachable on this key. Subscription-only models are removed from
 * both customModels and the combo so the router stops handing them out.
 *
 * A daily check-in requirement is account-wide, so it is reported once and no
 * model is blamed or removed.
 *
 * @param {{apiKey?: string}} [opts]
 * @returns {Promise<{checked: number, ok: Array, subscriptionOnly: Array, failed: Array, checkinRequired: boolean, checkinUrl: string|null}>}
 */
export async function verifyApinexModels({ apiKey } = {}) {
  state.verifying = true;
  try {
    const key = apiKey || (await resolveApinexApiKey());
    if (!key) {
      throw new Error("No APInex API key found. Add an APInex connection first.");
    }

    const db = await getAdapter();
    const customModels = (await Promise.resolve(
      db.all(`SELECT key, value FROM kv WHERE scope = 'customModels'`)
    ))
      .map((row) => parseJson(row.value))
      .filter((v) => v && v.providerAlias === PROVIDER_ALIAS && (v.type || "llm") === "llm");

    const ok = [];
    const subscriptionOnly = [];
    const failed = [];
    let checkinRequired = false;
    let checkinUrl = null;

    for (const model of customModels) {
      let res;
      try {
        res = await fetch(APINEX_CHAT_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: model.id,
            max_tokens: VERIFY_MAX_TOKENS,
            messages: [{ role: "user", content: "hi" }],
          }),
          signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
        });
      } catch (error) {
        // Transport failure is not evidence about the model; do not prune on it.
        failed.push({ id: model.id, reason: error?.message || String(error) });
        continue;
      }

      if (res.ok) {
        ok.push({ id: model.id, name: model.name || model.id });
        continue;
      }

      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      const classified = classifyApinexError({ status: res.status, body });

      if (classified.kind === "checkin_required") {
        checkinRequired = true;
        checkinUrl = classified.checkinUrl;
        continue;
      }

      if (classified.kind === "subscription_required") {
        subscriptionOnly.push({ id: model.id, name: model.name || model.id, status: res.status });
        continue;
      }

      failed.push({ id: model.id, status: res.status, reason: classified.message || `HTTP ${res.status}` });
    }

    if (subscriptionOnly.length > 0) {
      pruneApinexModels(db, subscriptionOnly.map((m) => m.id));
    }

    const result = {
      checked: customModels.length,
      ok,
      subscriptionOnly,
      failed,
      checkinRequired,
      checkinUrl,
    };

    state.lastVerify = { ...result, at: Date.now() };
    return result;
  } finally {
    state.verifying = false;
  }
}

/**
 * Remove models from customModels and from the 9r-apinex combo.
 * @param {object} db
 * @param {string[]} ids APInex model ids (e.g. "free/glm-5.3-flashx")
 */
function pruneApinexModels(db, ids) {
  const drop = new Set(ids);
  db.transaction(() => {
    for (const id of drop) {
      db.run(`DELETE FROM kv WHERE scope = 'customModels' AND key = ?`, [
        `${PROVIDER_ALIAS}|${id}|llm`,
      ]);
    }

    const existing = db.get(`SELECT * FROM combos WHERE name = ?`, [COMBO_NAME]);
    if (!existing) return;

    const current = parseJson(existing.models, []) || [];
    const kept = current.filter((m) => {
      const idPart = String(m).replace(/^apinex\//, "");
      return !drop.has(idPart);
    });

    db.run(`UPDATE combos SET models = ?, updatedAt = ? WHERE id = ?`, [
      stringifyJson(kept),
      new Date().toISOString(),
      existing.id,
    ]);
  });
}

/**
 * Start recurring background sync timer.
 */
export function startApinexSync() {
  if (timer) return;
  if (String(process.env.APINEX_SYNC || "").toLowerCase() === "off") return;

  const schedule = (delay) => {
    timer = setTimeout(async () => {
      try {
        await syncApinexModels();
        schedule(SYNC_INTERVAL_MS);
      } catch {
        schedule(RETRY_DELAY_MS);
      }
    }, delay);
    timer.unref?.();
  };

  schedule(STARTUP_DELAY_MS);
}