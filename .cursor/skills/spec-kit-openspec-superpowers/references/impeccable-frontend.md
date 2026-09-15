# Impeccable — always ON for frontend (triad)

**Inside** `/spec-kit-openspec-superpowers` / `/super-spec`: when the task touches frontend, load and apply Impeccable **automatically** — same posture as agent-browser for UI proof. Do **not** wait for `/impeccable` or `@impeccable`.

AFK / G1 / Claude Senior stay unchanged. This ref only wires **design polish** for FE surfaces.

## Trigger (any → load Impeccable)

| Signal | Examples |
|--------|----------|
| Paths | `resources/js/**`, `resources/css/**`, `*.vue`, form/Detail/view components |
| Keywords | design, polish, layout, form, component, Vue, CSS, UX, a11y, typography, dashboard |
| Print chrome | Visual blade wrappers / schedule chrome that users *see* in admin (labels, spacing, hierarchy) |
| PL Direct Book | Quotation/policy/endorsement Vue under Burglary / Direct Book shells |

## Skip

| Skip | Why |
|------|-----|
| Pure PHP / API / docs / git / OpenSpec text-only | No visual surface |
| PDF **sample** black borders / table grid for print fidelity | Print contract ≠ admin UI polish |
| Dompdf layout math, font embed, locale string-only | Functional print, not Impeccable craft |

When print work is **both** data wire + visual admin chrome → Impeccable for the Vue/Detail chrome only; keep PDF border rules as print contract.

## Setup (once per session that needs FE)

1. Read Impeccable skill: `~/.claude/skills/impeccable/SKILL.md` (or `~/.cursor/skills/impeccable/`).
2. From repo root, if PRODUCT.md exists (or `.agents/context/` / `docs/`):
   ```bash
   node ~/.claude/skills/impeccable/scripts/load-context.mjs
   ```
   Windows pgi common path: `node C:/Users/PGI/.claude/skills/impeccable/scripts/load-context.mjs`  
   Consume **full** JSON — never pipe through `head` / `grep` / `jq`.
3. **Register:** `product` for Laravel/Vue insurance admin (not marketing brand).
4. Load `reference/product.md` + shared design laws from Impeccable SKILL.
5. Match PrimeVue + Tailwind; extend Direct Book shell (`DirectBookQuotationFormShell.vue`) — don't fight it.

Skip re-running load-context if output already in this conversation (unless PRODUCT.md / teach / document just changed).

## polish vs craft

| Mode | When |
|------|------|
| **`polish`** | Existing screen — spacing, hierarchy, alignment, density, labels, empty states |
| **`craft`** / **`shape`** | New surface or major redesign — shape intent first, then implement |
| **`audit`** / **`critique`** | Explicit review pass or G3/G4 design gate |

Default for triad FE bugfixes / small form tweaks: **`polish`**. New tab/section/wizard: **`craft`** (or `shape` then craft).

Project rule: `.cursor/rules/01-impeccable-ui.mdc`.

## Phase hooks

| Phase | Behavior |
|-------|----------|
| **Phase 3** | FE in scope → Impeccable setup + polish/craft **required** (G3) |
| **Phase 4 / G4** | Keep Impeccable laws active while editing FE; pair with agent-browser / Playwright for proof |
| **Quick** | Still load setup if touching Vue/CSS; apply light polish — don't skip for "tiny" visual edits |

## Opt out

User says `no impeccable` / `skip polish` / `plain agent` (stack opt-out) → skip for that turn.
