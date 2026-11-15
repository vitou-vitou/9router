import { NextResponse } from "next/server";
import { getComboByName, getCustomModels } from "@/lib/localDb";
import {
  syncApinexModels,
  verifyApinexModels,
  getApinexSyncState,
  COMBO_NAME,
  PROVIDER_ALIAS,
  APINEX_CHECKIN_URL,
} from "@/lib/apinex/sync";

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
      checkinUrl: APINEX_CHECKIN_URL,
      syncState,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to check sync status" }, { status: 500 });
  }
}

// PUT /api/combos/apinex-sync — probe every imported model and drop the
// subscription-only ones. A daily check-in requirement is account-wide, so it
// is reported rather than blamed on individual models.
export async function PUT() {
  try {
    const result = await verifyApinexModels();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Verify failed" }, { status: 500 });
  }
}
