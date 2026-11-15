/**
 * Pure state helpers for the APInex controls on the Combos dashboard page.
 *
 * The page itself is a client component that cannot be rendered in the node
 * test environment, so the button/label/disabled logic lives here and the page
 * consumes it. Tests assert against this module instead of a duplicated
 * literal in the test file.
 */

export const APINEX_SYNC_LABEL = "Sync APInex Free";
export const APINEX_VERIFY_LABEL = "Verify Free Models";
export const APINEX_SYNC_BUSY_LABEL = "Syncing…";
export const APINEX_VERIFY_BUSY_LABEL = "Verifying…";

/**
 * Label for the sync button.
 * @param {boolean} syncing
 * @returns {string}
 */
export function apinexSyncLabel(syncing) {
  return syncing ? APINEX_SYNC_BUSY_LABEL : APINEX_SYNC_LABEL;
}

/**
 * Label for the verify button.
 * @param {boolean} verifying
 * @returns {string}
 */
export function apinexVerifyLabel(verifying) {
  return verifying ? APINEX_VERIFY_BUSY_LABEL : APINEX_VERIFY_LABEL;
}

/**
 * Whether the sync button should be disabled. The two APInex actions are
 * mutually exclusive: neither may run while the other is in flight.
 * @param {{syncing?: boolean, verifying?: boolean}} state
 * @returns {boolean}
 */
export function isApinexSyncDisabled({ syncing = false, verifying = false } = {}) {
  return Boolean(syncing || verifying);
}

/**
 * Whether the verify button should be disabled. Also requires the combo to
 * exist — there is nothing to probe until the first sync has imported models.
 * @param {{syncing?: boolean, verifying?: boolean, comboExists?: boolean}} state
 * @returns {boolean}
 */
export function isApinexVerifyDisabled({ syncing = false, verifying = false, comboExists = false } = {}) {
  return Boolean(syncing || verifying || !comboExists);
}

/**
 * Human-readable outcome summary for the verify result.
 * @param {{checked?: number, ok?: Array, subscriptionOnly?: Array, checkinRequired?: boolean}} result
 * @returns {string}
 */
export function formatApinexVerifySummary(result = {}) {
  if (result.checkinRequired) {
    return "APInex daily check-in required. Open the APInex dashboard, check in, then verify again.";
  }
  const checked = result.checked || 0;
  const okCount = (result.ok || []).length;
  const pruned = (result.subscriptionOnly || []).length;
  if (checked === 0) return "No APInex models to verify. Run Sync APInex Free first.";
  if (pruned === 0) return `${okCount}/${checked} APInex models responding.`;
  return `${okCount}/${checked} APInex models responding; removed ${pruned} subscription-only.`;
}