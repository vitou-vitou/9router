# pgi-core-frontend — Spec-Kit / OpenSpec / Superpowers policy

**Repo:** `pgi-core-frontend` (Property Liability admin UI)  
**Handoff:** `docs/SESSION_STATE.md` (read on `continue`)  
**Active OpenSpec:** `openspec/changes/phase-ii-quotation-slice-only/`

## Locked decisions

| Phase | Tool | Rule |
|-------|------|------|
| Greenfield feature | **OpenSpec** + **Superpowers** (+ **Caveman** optional) | `/opsx:propose` or `/super-spec` → G1 → apply → archive |
| Small fix / typo | **Quick** path in orchestrator | Simplified propose → TDD → implement |
| Never | Spec-Kit **and** OpenSpec on same feature | Pick one SDD layer |
| Optional | **Caveman** | Voice / token compression — `/caveman`, `normal mode` to off |
| PL UI work | **impeccable** + Direct Book shell patterns | `01-impeccable-ui.mdc`, `DirectBookQuotationFormShell.vue` |
| **Every session** | **Default stack (PRIORITY skill)** | `spec-kit-openspec-superpowers` — call/follow **first** for coding work (99%); no need to `@` each chat |
| **Long journey** | **`db-journey` / `7pj`** | 7 **lines** (Marine `0189`+twin `0206`, Bond `0195`, …) × quote→policy→endt L1–L3; see `references/db-journey.md`. **Keep `7pj`** — do not rename to `8pj`. |
| **Layout / print / multi-option UX** | **Brainstorm · think-out · visual demo** | Path map (quote view · policy view · PDF) + 2–3 options + `docs/evidence/*-demo/` mocks **before code** — `references/brainstorm-think-visual.md`. AFK does not skip option pick. |
| **Every session** | **AFK + LDA** | Auto mode/complexity; G1 auto-approved; plan via Logic · Data · Architecture first — `references/afk-default.md` · `.cursor/rules/09-afk-lda-default.mdc` |
| **Every session** | **Claude Senior listener** | Claude heavy work; Cursor thin apply+verify — save Cursor tokens (`08-claude-senior-listener.mdc`, skill `references/claude-senior-listener.md`) |
| **Frontend (every triad)** | **Impeccable always ON** | Vue/CSS/forms/Detail/view/`resources/js/**`/`resources/css/**` → load setup + polish/craft — `references/impeccable-frontend.md` · `01-impeccable-ui.mdc`. Skip pure PHP/API; PDF sample black borders ≠ admin polish |
| UI / G4 browser proof | **Playwright** first for PL Direct Book G4; **agent-browser** when needed | Load `agent-browser` skill only if Playwright blocked; skip pure PHP/API/docs |
| View/print display G4 | **Quick verify e2e** | `npm run test:e2e:car-loi-unlimited` (or change script) — [references/quick-verify-e2e.md](references/quick-verify-e2e.md) |

## Product scope (Property Liability)

**In scope — 7 Direct Book product lines only** (`ProductCode::directBookCodes()`):

| SM code(s) | Constant | Line |
|------------|----------|------|
| `0189` + twin `0206` | `MARINE_CARGO` / `MARINE_CARGO_2` | Marine (one journey; `isMarine()`) |
| `0191` | `BURGLARY` | Burglary |
| `0192` | `MONEY_INSURANCE` | Money |
| `0193` | `PLATE_GLASS` | Plate Glass |
| `0194` | `CONSTRUCTION_ALL_RISKS` | CAR |
| `0195` | `BOND` | Bond |
| `0196` | `PROFESSIONAL_INDEMNITY` | PI |

**Verdict:** `0206` is Marine twin — stay on **`7pj`**, not `8pj`.

**Out of scope** — do not refactor `0121`–`0125` (Public Liability, Fire, Property, Home Package, Business Package).

See `.cursor/rules/02-pl-seven-product-scope.mdc` for paths and execution checklist.

## Superpowers skills to prefer during implement

0. **This orchestrator** (`spec-kit-openspec-superpowers`) — **priority call**; includes brainstorm/think-out/visual-demo gate  
1. `brainstorming` (optional deepen) — only if triad ref is not enough; still no code until pick  
2. `test-driven-development` — before production code  
3. `verification-before-completion` — before claiming done  
4. `systematic-debugging` — on test failures  
5. `requesting-code-review` — G4 step 1 spec conformance (after major steps)  
5b. **`code-review-and-quality`** — G4 step 2 five-axis quality (prefer over thin `code-review`) — [references/code-review-combo.md](references/code-review-combo.md)  
6. `subagent-driven-development` — parallel independent tasks (prefer **Claude** model when Senior listener ON)  
7. `agent-browser` — when UI/page/dropdown/form must be proven in a real browser  
8. `impeccable` — **always** when frontend is in scope (setup + polish/craft) — [references/impeccable-frontend.md](references/impeccable-frontend.md)

## Brainstorm · think-out · visual demo (locked preference)

When user asks to brainstorm / think out loud / re-demo, **or** layout spans view · policy view · PDF:

1. Path map first (what shares `Detail.vue` vs print blade).
2. 2–3 named options + recommendation.
3. Visual mocks under `docs/evidence/` — **no production code** until pick.
4. After pick → minimal implement + smoke quote and note policy parity.

Full procedure: [references/brainstorm-think-visual.md](references/brainstorm-think-visual.md).

**Optional:** **caveman** — terse voice; **cavecrew** subagents for compressed investigator/builder/reviewer.

## Claude Senior + agent-browser (session)

Default **ON** every session under `/super-spec` / this skill:

- Cursor does not re-spec Claude’s settled plan; short replies; apply → verify → done.
- Opt out: `normal cursor` / `you do it` / `cursor lead`.
- UI change → browser smoke via agent-browser (or IDE browser MCP if Chrome CDP fails).
- Full procedure: [references/claude-senior-listener.md](references/claude-senior-listener.md).

## Impeccable on frontend (session · always ON)

Default **ON** for any triad / `/super-spec` task that touches frontend — same auto-load as agent-browser for UI proof:

- Triggers: Vue, CSS, forms, Detail/view, visual blade chrome, `resources/js/**`, `resources/css/**`, design keywords.
- Load Impeccable setup (PRODUCT.md / load-context) → apply **`polish`** (existing) or **`craft`**/`shape` (new surface).
- Phase 3 + Phase 4 keep Impeccable active; do not wait for `/impeccable`.
- Skip: pure PHP/API/docs; PDF sample black borders / print grid fidelity ≠ admin UI polish.
- Full procedure: [references/impeccable-frontend.md](references/impeccable-frontend.md) · `.cursor/rules/01-impeccable-ui.mdc`.
- Opt out: `no impeccable` / `skip polish` (or stack opt-out `plain agent`).

## Simple code + plain voice (locked)

During **Phase 4** and **G4**, always:

- **Talk:** short, plain, conclusion-first — anyone can understand (`caveman-mode.mdc`; `normal mode` to off).
- **Code:** small methods; **short names** (`syncCommission`, `patchForm`, `plCommRate` — not long compound names).
- **Comments:** no `/** ... */` on obvious helpers; code should read clear without essays.

Full guide: [references/simple-code-voice.md](references/simple-code-voice.md) · rule: `.cursor/rules/04-simple-code-voice.mdc`

## Zero edge-case confirm (locked)

After **file renames**, **module moves**, or **import-path** changes (e.g. `burglary/on.js` → `scope.js`), before claiming done:

1. Grep: no stale old paths/symbols in code + scripts.
2. Disk: new files present; old files gone; barrel `index.js` updated.
3. Docs/rules: update `05-pl-db-naming.mdc` (or equivalent) folder maps — no deleted filenames.
4. `npm run build` (and `node scripts/verify-burglary-routing.mjs` when PL routing touched).
5. Reply: **Confirmed — runtime edge cases: zero** (checklist table) **or** list leftovers.

Detail: skill `references/quality-gates.md` → *Zero edge-case confirm*.

## PHP / frontend (Windows Herd)

```bash
export PATH="/c/Users/PGI/.config/herd/bin:$PATH"
# or: /c/Users/PGI/.config/herd/bin/php.bat artisan test

cd /d/vitou/projects/pgi-core-frontend
php artisan test
npm run build
node scripts/verify-burglary-routing.mjs
```

Site URL: check `.env` `APP_URL` (e.g. `http://pgi-core-frontend.test` via Herd).

## Git

- **Do not** auto-commit or auto-push unless user explicitly asks (see `99-god-speed-session.mdc`).
- Match recent Conventional Commits style when user requests a commit.

## Solve / Plan pattern — LDA-PO (locked · AFK default)

**Every** `/super-spec` plan, CreatePlan, and Phase 2 `task_plan` must include (AFK does not skip this):

1. **Logic** — rules, must vs nice  
2. **Data structure** — where truth lives  
3. **Architecture** — who calls whom  
4. **Portal** — one reusable helper (or none + why)  
5. **Others** — scope, rollout, verify  

Full template: [references/solve-plan-pattern.md](references/solve-plan-pattern.md)  
AFK wire: [references/afk-default.md](references/afk-default.md)  
Reviewed domain example: [references/pl-db-edit-lock-portal.md](references/pl-db-edit-lock-portal.md)

Quick tasks: 5-bullet compress OK. Opt out only if user says `skip pattern` / `no afk`.

## PL Direct Book edit-lock portal (locked · reviewed)

When work touches **Edit button**, **`/edit` route**, or **update/save** for Quote / Policy / Endorsement:

1. Read [references/pl-db-edit-lock-portal.md](references/pl-db-edit-lock-portal.md) first.
2. Reuse `burglary/edit-lock.js` — do not invent a second gate.
3. Prefer small rollout: Form `guardEdit` + API PND assert; wire quote/policy only when must.
4. Hide button alone is never enough.

## UI phase (Direct Book forms)

**Always** when quotation/policy Vue (or any FE) is in scope — not optional:

1. Read **impeccable** skill + load-context / `PRODUCT.md` if present — [references/impeccable-frontend.md](references/impeccable-frontend.md)  
2. Extend `DirectBookQuotationFormShell.vue` vocabulary (PrimeVue + Tailwind, `slate-50` sections)  
3. Apply polish or craft as fit; `npm run build` before claiming UI done  

## Study docs (optional)

After major features: **system-study-packet** → project docs under `openspec/` or `docs/`.


## Desk ELI5 (merge delete)

See [references/desk-eli5-merge-delete-restore.md](references/desk-eli5-merge-delete-restore.md).
