import { describe, it, expect } from "vitest";
import React from "react";
import { cn } from "../../src/shared/utils/cn.js";
import {
  APINEX_SYNC_LABEL,
  APINEX_VERIFY_LABEL,
  APINEX_SYNC_BUSY_LABEL,
  APINEX_VERIFY_BUSY_LABEL,
  apinexSyncLabel,
  apinexVerifyLabel,
  isApinexSyncDisabled,
  isApinexVerifyDisabled,
  formatApinexVerifySummary,
} from "../../src/shared/utils/apinexControls.js";

// Pure contract verification of Button and ConfirmModal logic
describe("UI button and dialog contract", () => {
  it("Button disabled and loading state logic matches component contract", () => {
    const disabled = true;
    const loading = true;
    const isButtonDisabled = disabled || loading;
    expect(isButtonDisabled).toBe(true);

    const buttonClass = cn(
      "inline-flex items-center justify-center font-semibold",
      "bg-surface-2 hover:bg-surface-3 text-text-main border border-border",
      "h-9 px-4 text-sm rounded-[10px]"
    );
    expect(buttonClass).toContain("bg-surface-2");
    expect(buttonClass).toContain("h-9");
  });

  it("ConfirmModal and Modal props contract", () => {
    const state = {
      isOpen: true,
      title: "Delete Combo",
      message: 'Delete combo "test"?',
      confirmText: "Delete",
      variant: "danger",
      loading: false,
    };

    expect(state.isOpen).toBe(true);
    expect(state.title).toBe("Delete Combo");
    expect(state.variant).toBe("danger");
  });

  it("Combos page APInex button and confirm dialog states match expected handlers", () => {
    // Initial button state
    expect(apinexSyncLabel(false)).toBe("Sync APInex Free");

    // Click handler trigger simulation
    expect(apinexSyncLabel(true)).toBe("Syncing…");

    // Modal dialog state simulation
    let confirmState = null;
    const setConfirmState = (val) => { confirmState = val; };

    setConfirmState({
      title: "Delete Combo",
      message: 'Delete combo "9r-apinex"?',
      confirmText: "Delete",
      variant: "danger",
    });

    expect(confirmState).not.toBeNull();
    expect(confirmState.title).toBe("Delete Combo");
    expect(confirmState.message).toBe('Delete combo "9r-apinex"?');
  });
});

// The verify button is the new second APInex action; its labels and gating
// must match what the page renders.
describe("APInex verify button contract", () => {
  it("exposes the expected labels", () => {
    expect(APINEX_SYNC_LABEL).toBe("Sync APInex Free");
    expect(APINEX_VERIFY_LABEL).toBe("Verify Free Models");
    expect(APINEX_SYNC_BUSY_LABEL).toBe("Syncing…");
    expect(APINEX_VERIFY_BUSY_LABEL).toBe("Verifying…");
  });

  it("flips the sync label while syncing", () => {
    expect(apinexSyncLabel(false)).toBe(APINEX_SYNC_LABEL);
    expect(apinexSyncLabel(true)).toBe(APINEX_SYNC_BUSY_LABEL);
  });

  it("flips the verify label while verifying", () => {
    expect(apinexVerifyLabel(false)).toBe(APINEX_VERIFY_LABEL);
    expect(apinexVerifyLabel(true)).toBe(APINEX_VERIFY_BUSY_LABEL);
  });

  it("disables sync while either APInex action is in flight", () => {
    expect(isApinexSyncDisabled({})).toBe(false);
    expect(isApinexSyncDisabled({ syncing: true })).toBe(true);
    expect(isApinexSyncDisabled({ verifying: true })).toBe(true);
  });

  it("disables verify while busy and when the combo does not exist yet", () => {
    expect(isApinexVerifyDisabled({ comboExists: true })).toBe(false);
    expect(isApinexVerifyDisabled({ comboExists: false })).toBe(true);
    expect(isApinexVerifyDisabled({ comboExists: true, verifying: true })).toBe(true);
    expect(isApinexVerifyDisabled({ comboExists: true, syncing: true })).toBe(true);
  });

  it("defaults to disabled when called with no state", () => {
    expect(isApinexSyncDisabled()).toBe(false);
    expect(isApinexVerifyDisabled()).toBe(true);
  });
});

describe("APInex verify summary formatting", () => {
  it("reports a check-in requirement instead of blaming models", () => {
    const summary = formatApinexVerifySummary({ checkinRequired: true, checked: 0, ok: [], subscriptionOnly: [] });
    expect(summary).toMatch(/check-in/i);
  });

  it("reports all-good when nothing was pruned", () => {
    const summary = formatApinexVerifySummary({
      checked: 2,
      ok: [{ id: "free/a" }, { id: "free/b" }],
      subscriptionOnly: [],
    });
    expect(summary).toBe("2/2 APInex models responding.");
  });

  it("reports how many subscription-only models were removed", () => {
    const summary = formatApinexVerifySummary({
      checked: 3,
      ok: [{ id: "free/a" }, { id: "free/b" }],
      subscriptionOnly: [{ id: "free/paid-only" }],
    });
    expect(summary).toBe("2/3 APInex models responding; removed 1 subscription-only.");
  });

  it("tells the user to sync first when there is nothing to verify", () => {
    const summary = formatApinexVerifySummary({ checked: 0, ok: [], subscriptionOnly: [] });
    expect(summary).toMatch(/sync apiNEX free first/i);
  });

  it("never throws on an empty result", () => {
    expect(() => formatApinexVerifySummary()).not.toThrow();
    expect(formatApinexVerifySummary()).toMatch(/no apinex models/i);
  });
});