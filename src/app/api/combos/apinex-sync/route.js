import { NextResponse } from "next/server";
import { getComboByName, getCustomModels } from "@/lib/localDb";
import { getAdapter } from "@/lib/db/driver";
import { parseJson, stringifyJson } from "@/lib/db/helpers/jsonCol";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

const APINEX_MODELS_URL = "https://apinex.bond/api/public/models";
const COMBO_NAME = "9r-apinex";
const PROVIDER_ALIAS = "apinex";
const FETCH_TIMEOUT_MS = 15000;

// POST /api/combos/apinex-sync — fetch free models from APInex, re-import, update combo
export async function POST() {
  try {
    const res = await fetch(APINEX_MODELS_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `APInex API returned ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    const allModels = data.models || [];

    const freeModels = allModels.filter((m) => m.provider === "Free" && m.dollarsPer1M === 0);
    if (freeModels.length === 0) {
      return NextResponse.json({ error: "No free models found from APInex" }, { status: 404 });
    }

    // Atomic: delete old → insert new → upsert combo in one transaction
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
          providerAlias: PROVIDER_ALIAS, id: m.id, type: "llm",
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
        db.run(`UPDATE combos SET models = ?, updatedAt = ? WHERE id = ?`,
          [stringifyJson(modelIds), now, existing.id]);
        return { id: existing.id, name: COMBO_NAME };
      }
      const id = uuidv4();
      db.run(`INSERT INTO combos(id, name, kind, models, createdAt, updatedAt) VALUES(?, ?, NULL, ?, ?, ?)`,
        [id, COMBO_NAME, stringifyJson(modelIds), now, now]);
      return { id, name: COMBO_NAME };
    })();

    return NextResponse.json({
      success: true,
      modelsImported: modelIds.length,
      models: modelIds,
      combo,
    });
  } catch (error) {
    console.log("[apinex-sync] error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Sync failed" }, { status: 500 });
  }
}

// GET /api/combos/apinex-sync — check last sync status
export async function GET() {
  try {
    const combo = await getComboByName(COMBO_NAME);
    const customModels = (await getCustomModels()).filter((m) => m.providerAlias === PROVIDER_ALIAS && (m.type || "llm") === "llm");
    return NextResponse.json({
      comboExists: !!combo,
      comboModels: combo?.models?.length || 0,
      customModels: customModels.length,
      lastUpdated: combo?.updatedAt || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to check sync status" }, { status: 500 });
  }
}
