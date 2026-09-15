# Desk ELI5 — merge delete + restore (pgi)

**Audience:** zero-git / junior. **When:** merge feature → `uat` suddenly “deletes” files; claim/renewal/HS breaks; or user asks “what happened this week?”

**Lived case (2026-08):** merge [72d92f3](https://github.com/phillipinsurancekh/pgi-core-frontend/commit/72d92f3fb75094b9194bee648e46ee6e7ddfc7e9) · restore from uat-pre `ce49919de` · branch `fix/restored-claim-bases`.

---

## Super easy story (read this first)

Imagine two folders:

| Folder | Meaning |
|--------|---------|
| **UAT** | Shared test kitchen — has claim report tools, old enums, renewal export |
| **Feature** | Your Direct Book workbench — never had some of those kitchen tools |

You **merge Feature into UAT**. Git thinks: “Feature does not have those files → delete them from UAT.”

You did **not** mean “throw away claim tools.” Git still deletes them. That is the **mistake**.

**Feeling:** “API blank / view missing” — often **not** a blank HTTP body. Nested data missing, **or** PHP class file gone → fatal when export runs.

**Fix:** put the exact files back from **UAT before the merge** (`ce49919de`). Check they load. Land on **UAT** with a **small** restore PR — do **not** merge the whole feature branch just to fix deletes.

---

## Also from the same long session (separate topics)

| Topic | One line |
|-------|----------|
| **7pj vs 8pj** | `0206` = Marine twin of `0189` → still **7 lines**, keep **7pj** (not 8pj) |
| **Marine title** | View/PDF title must match quote Product Type (Open Cover for `0206`) |
| **Policy Commission / ReInsurance** | Vue already had sections; PAI v2 omitted nested `commission` / `reinsurances` → seed from local DB (`plSeedComm` / `plFillRi`) |
| **Quote** | Correctly **hides** Commission/RI (`isPolicy` only) |

---

## Merge-delete checklist (agent must)

1. Find merge commit that deleted files (`git show --diff-filter=D --summary <merge>`).
2. First parent = UAT-before; second = feature tip.
3. List every deleted path. Ask: still `use`/`extends` in code?
4. Restoring **child** export without **parent** base = still FATAL (e.g. `ClaimPaidExport` needs `BaseClaimExport`).
5. Restore **byte-identical** from UAT-before (`git checkout <uat-pre> -- <paths>`).
6. Prove: `class_exists` / `enum_exists` + parent `ReflectionClass` + `php -l` callers.
7. Ship **restore-only** branch → `uat`. Never “fix deletes” by merging full DB feature unless product asks.
8. Keep unrelated WIP (toast/helpers) **out** of restore commit.

### Typical restore set (this incident)

Enums: `EndorsementOptionAdd|Delete`, `ProductCode`, `ProductType`  
Claim bases: `BaseClaimExport`, `BaseClaimReportExport56` (+ optional `64`)  
Leaves: `PA/Claim/*`, `PL/Claim/*`, `PA/PAClaim*`, `PL/RenewalNoticeExport`

Note: `App\Enums\ProductCode` ≠ `App\Constants\ProductCode` — both can exist (different FQCN).

---

## Desk rules (layoff-safe)

| Do | Don't |
|----|--------|
| Small restore PR to UAT | Merge entire `feature/buglary-policy` only to put files back |
| Verify load before push | Restore leaves only and call done |
| Clear commit title (Adjective Noun) | Vague `BUR feedback` for audit-critical restores |
| Confirm `origin/uat` has files after merge | Assume feature restore fixed UAT |

---

## One picture

```text
UAT (has claim tools)
   + merge Feature (no claim tools)
   = UAT loses claim tools   ← accident

Fix = copy tools back from UAT-before
    + small PR into UAT
    ≠ merge whole Feature
```
