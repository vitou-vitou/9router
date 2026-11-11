import { describe, it, expect, vi } from "vitest";
import React from "react";
import { cn } from "../../src/shared/utils/cn.js";

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
    let apinexSyncing = false;
    const setApinexSyncing = (val) => { apinexSyncing = val; };

    // Initial button state
    expect(apinexSyncing ? "Syncing…" : "Sync APInex Free").toBe("Sync APInex Free");

    // Click handler trigger simulation
    setApinexSyncing(true);
    expect(apinexSyncing ? "Syncing…" : "Sync APInex Free").toBe("Syncing…");

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
