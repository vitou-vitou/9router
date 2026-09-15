# PL Direct Book — edit-lock portal (reviewed)

**Status:** Locked after chat review (2026-07-30). Load when user asks about `/edit` URL bypass, Detail Edit button vs Form, or quote/policy/endt write locks.

**Code:** `resources/js/services/property_liability/burglary/edit-lock.js`  
**Scope helpers:** `burglary/scope.js` (`quoteOn` / `policyOn` / `endorsementOn`)  
**BE (endt today):** `App\Services\PL\EndorsementService::assertPendingEdit` — Direct Book endorsement only (`ProductCode::isEndorsementOn`)

---

## Problem (must)

Hiding the Detail **Edit** button is UX only. Users can still open `…/:id/edit` by URL and may still save. Must gate:

1. Form load (redirect to Detail when not editable)
2. Write API (reject non-pending)

Button hide alone is **not** enough.

---

## Portal format (one FE file)

```js
// burglary/edit-lock.js — single portal all three phases reuse
phase: 'quote' | 'policy' | 'endorsement'

isPending(status) -> boolean
statusOf(data, phase) -> status string | null
canOpenEdit(data, phase) -> boolean   // status === PND only
guardEdit({ data, phase, code, router, routeName, params }) -> Promise<boolean>
  // true = stay on edit; false = redirected to Detail
```

Scope: only run gate when phase `on(code)` is true (`quoteOn` / `policyOn` / `endorsementOn`). Legacy `0121`–`0125` untouched.

---

## Logic (rules)

| Layer | Rule |
|-------|------|
| Detail `canEdit` | Permission **+** `approved_status === PND` (stay in each Detail.vue) |
| Form `/edit` URL | Portal **status only** via `guardEdit` / `canOpenEdit` |
| Save / update API | Same PND check server-side → `409` + message `Something went wrong` |
| Product scope | Direct Book lists in `scope.js` / `isEndorsementOn` — not a global Vue router guard |

Toast on blocked write: exactly `Something went wrong` (detail in Network / `console.error` only).

---

## Data structure (status paths)

| Phase | Status lives on | `statusOf` path |
|-------|-----------------|-----------------|
| `quote` | `ins_pc_quotation.approved_status` | `data.quote?.approved_status ?? data.approved_status` |
| `policy` | `ins_pc_policy.approved_status` | `data.policy?.approved_status ?? data.approved_status` |
| `endorsement` | policy row on endt master | `data.approved_status ?? data.policy?.approved_status` |

Forms call `statusOf` / `guardEdit` — do **not** hard-code nesting in three places.

Evidence example: endt master `1537` → `policy.approved_status = REJ` → Form bounce + API block.

---

## Architecture

```
Detail (button)          Form (/edit URL)           API (write)
     |                         |                         |
  canEdit (perm+PND)     edit-lock.guardEdit      assertPendingEdit
     |                         |                         |
  hide button            replace → Detail         409 if not PND
```

- **Not** a Vue `beforeEnter` alone — needs API/find status first; Form load is the right place.
- **FE portal:** one file `edit-lock.js`.
- **Scope portal:** existing `scope.js`.
- **BE:** endt private method today; later optional shared `AssertsPendingEdit` concern for quote/policy.

---

## Rollout (small first)

| Now (shipped pattern) | Later (same file, thin Form hook) |
|-----------------------|-----------------------------------|
| `edit-lock.js` API for all phases | Quote Form: `guardEdit({ phase: 'quote', routeName: 'PLQuotationDetail', … })` |
| Wire Endorsement Form only | Policy Form: `guardEdit({ phase: 'policy', routeName: 'PLPolicyDetail', … })` |
| BE assert on endt writes (DB only) | Shared PHP concern + quote/policy `update` |

Prefer **small portal extract** over wiring all three Forms in one PR unless user asks.

---

## Must vs nice

| Change | Must? |
|--------|--------|
| Form redirect + API PND for endt | **Yes** — closes URL bypass bug |
| Shared `edit-lock.js` | Benefit for reuse — good after review; not required twice if inline already works |
| Quote/policy Form wire | Only when same bug appears or user asks |

Ask “is it must and last?” before expanding portal to quote/policy.

---

## Related repo rules

- `02-pl-seven-product-scope.mdc` — Direct Book **7** products (incl. Bond `0195`); `scope.js` / `isEndorsementOn` for endt
- `14-code-must-benefit.mdc` — don’t expand without must
- `05-pl-db-naming.mdc` — short files under `burglary/`
- Zero edge-case confirm after renames (`quality-gates.md`)
