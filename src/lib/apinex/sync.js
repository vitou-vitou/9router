import { getAdapter } from "@/lib/db/driver";
import { parseJson, stringifyJson } from "@/lib/db/helpers/jsonCol";
import { v4 as uuidv4 } from "uuid";

export const APINEX_MODELS_URL = "https://apinex.bond/api/public/models";
export const COMBO_NAME = "9r-apinex";
export const PROVIDER_ALIAS = "apinex";
export const FETCH_TIMEOUT_MS = 15000;

export const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STARTUP_DELAY_MS = 60 * 1000; // 60 seconds after server boots
const RETRY_DELAY_MS = 60 * 60 * 1000; // 1 hour retry on error

let timer = null;
let state = {
  running: false,
  lastSync: null,
  lastError: null,
  lastResult: null,
};

export function getApinexSyncState() {
  return { ...state, intervalMs: SYNC_INTERVAL_MS };
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
      throw new Error(`APInex API returned ${res.status}`);
    }

    const data = await res.json();
    const allModels = data.models || [];
    const freeModels = allModels.filter((m) => m.provider === "Free" && m.dollarsPer1M === 0);

    if (freeModels.length === 0) {
      throw new Error("No free models found from APInex");
    }

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
      for (const m of freeModels) {
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
