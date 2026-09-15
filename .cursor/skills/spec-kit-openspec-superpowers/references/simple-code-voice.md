# Simple code + plain voice (pgi default)

Applies during **Phase 4 (implement)** and **G4 review**. Works with Caveman voice — spec gates (G1–G4) still required.

## Talk (anyone can read)

| Do | Don't |
|----|-------|
| Short sentences. Plain words. | Long paragraphs, jargon stacks |
| Conclusion first | Preamble, filler |
| Bullets / small tables | Walls of text |
| Say what changed and why | Narrate every tool call |

**Off:** user says `normal mode` → full prose until they re-enable caveman.

## Code — small + short names

| Do | Don't |
|----|-------|
| One job per function | 50-line god functions |
| Short names: `syncCommission`, `patchForm`, `plCommRate` | `applyProductCommissionRateFromBusinessChannel` |
| Verb-first: `loadForm`, `pickOpts`, `syncDropdowns` | `LegacyPolicyEditFormHydrationHelper` |
| Short files: `pl-policy-edit.js` | `pl-legacy-policy-info-edit-hydration.js` |
| Match repo style around the edit | Drive-by renames outside task scope |

## Comments

| Do | Don't |
|----|-------|
| Nothing if code is clear | `/** Fraction in storage... */` on obvious helpers |
| One line only for tricky business rules | Essay comments / “Marine twin 0206…” narration |

## After working — clean pass (user: `working, clean code`)

When UI/API works, **do not leave belt-and-suspenders**. Run a thin clean pass before done:

| Do | Don't |
|----|-------|
| **One portal** for the fix (where hydrate/save truth lives) | Dual FE + BE seed for the same gap |
| Match existing twin (`PolicyForm` ↔ `EndorsementForm`) | Invent a second path “just in case” |
| Drop flags/opts added only for the dual path | Leave `seedEmptyClauses`-style FE knobs after BE owns it |
| Strip narration comments | Keep essay comments from debug |
| Keep shortest diff that still passes verify | “While here” polish outside the portal |

**Pick portal (pgi):**

| Gap | Prefer portal |
|-----|----------------|
| Edit load / PAI omit / empty `[]` | BE edit hydrate (`EndorsementService::edit`, `plSeedEmptyClauses`) |
| Create-only defaults | FE `syncPlan` `!isRecord` (already) |
| Shared transform nullsafe | Match sibling form (`?? []` like PolicyForm) |

**Example (endt 0206 · 2026-08-13):** PAI returned empty locked clauses + omitted `reinsurances`. Fix = `EndorsementForm` nullsafe + `plSeedEmptyClauses` on edit. Dropped FE `seedEmptyClauses` dual path after verify.

**Triggers:** `working, clean code` · `clean code` · `single portal` · `clean pass`

## Name length guide

- **JS/PHP functions:** aim ≤ 3 words (`syncCommission`, `normComm`, `afterEditLoad`, `plSeedEmptyClauses`)
- **If longer:** split into another small function or use domain shorthand already in repo (`plCommRate`, `DataMaster`)
- **G4 self-check:** flag new exports with 4+ camelCase words unless matching an existing API name

## Examples (this repo)

```text
Good:  pickOpts, patchForm, syncDropdowns, syncCommission, plCommRate, normComm, plSeedEmptyClauses
Bad:   pickEditDropdownOptions, buildEditFormPatch, normalizeCommissionRateForForm
```

## With spec-kit / OpenSpec / Superpowers

- **G1 spec** — plain language; AC anyone can test
- **G2 plan** — task bullets name files + short function intent, not paragraph specs
- **G4 verify** — review includes name length + “can a new dev read this in 30s?” + **single portal** (no dual FE/BE for same gap)

See also: `.cursor/rules/caveman-mode.mdc`, `.cursor/rules/04-simple-code-voice.mdc`, `pgi-core-policy.md`.

## SRP / avoid fat

See [srp-thin.md](srp-thin.md). Deep: skill `refactor` → `struct-single-responsibility`.
