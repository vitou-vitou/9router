import { NextResponse } from "next/server";
import { getComboByName, getCustomModels } from "@/lib/localDb";
import { syncApinexModels, getApinexSyncState, COMBO_NAME, PROVIDER_ALIAS } from "@/lib/apinex/sync";

export const dynamic = "force-dynamic";

// POST /api/combos/apinex-sync — fetch free models from APInex, re-import, update combo
export async function POST() {
  try {
    const result = await syncApinexModels();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Sync failed" }, { status: 500 });
  }
}

// GET /api/combos/apinex-sync — check last sync status
export async function GET() {
  try {
    const combo = await getComboByName(COMBO_NAME);
    const customModels = (await getCustomModels()).filter(
      (m) => m.providerAlias === PROVIDER_ALIAS && (m.type || "llm") === "llm"
    );
    const syncState = getApinexSyncState();

    return NextResponse.json({
      comboExists: !!combo,
      comboModels: combo?.models?.length || 0,
      customModels: customModels.length,
      lastUpdated: combo?.updatedAt || null,
      syncState,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to check sync status" }, { status: 500 });
  }
}
