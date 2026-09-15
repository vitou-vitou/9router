---
name: spec-kit-openspec-superpowers
description: >
  PRIORITY / DEFAULT stack for pgi-core-frontend (and triad projects): call this skill
  first for almost all coding work — before other design/implement skills.
  Enforces spec-before-code + brainstorm / think-out-loud / visual-demo-before-code for
  layout, print/PDF schedule, view↔policy↔PDF parity, and multi-option UX
  (see references/brainstorm-think-visual.md). Triggers: "/super-spec",
  "/spec-kit-openspec-superpowers", "spec first", "规范先行", "brainstorm",
  "think out loud", "demo first", "re-demo", "db-journey", "7pj", or any feature / bug fix / refactor —
  especially with .spec-mode, .specify/, or openspec/. On pgi Direct Book: 7 lines
  (Marine SM twin 0189+0206); keep 7pj — not 8pj. Even without an explicit ask,
  activate for non-trivial changes so design is not skipped.
  Orchestrates: Spec-Kit / OpenSpec + planning-with-files + ui-ux-pro-max +
  Superpowers + MemPalace. Session defaults (pgi): Claude Senior listener,
  agent-browser when UI proof needed, Impeccable ON for frontend,
  brainstorm-think-visual for print/layout options.
---

# Spec-First + Superpowers Orchestrator v5

Stop the AI from jumping straight to code. Every feature, bugfix, and refactor goes through a specification phase first — because unexamined code is expensive code.

## Commands

| Command | Effect |
|---------|--------|
| `/super-spec` | Full workflow (auto mode + auto complexity) |
| `/super-spec force-spec-kit` | Force Spec-Kit mode |
| `/super-spec force-openspec` | Force OpenSpec mode |
| `/super-spec reset` | Reset mode selection |
| `/super-spec upgrade` | Check all integrated projects for updates and execute upgrade |
| `brainstorm` / `think out` / `demo first` | Path map + options + visual mocks — no code until pick ([brainstorm-think-visual](references/brainstorm-think-visual.md)) |
| `/7pj` · `7pj` · `/db-journey` | Short Direct Book wave — all 7 or one product; quote list+pdf+view+create+edit then policy wire. Skill `7pj-wave`. Playbook [db-journey](references/db-journey.md) |
| `claude senior` / `listener mode` | Reinforce Claude Senior + Cursor thin listener (default every session on pgi) |
| `normal cursor` | Opt out — Cursor leads again |

## Skill call priority

**Call / follow this skill first** for pgi coding work (before ad-hoc implement, before rival design skills), unless user said `no super-spec` / `plain agent`.

Within this skill, for layout / print / view↔PDF ambiguity: **brainstorm → think-out-loud path map → visual demo → user pick → then code** — [references/brainstorm-think-visual.md](references/brainstorm-think-visual.md).

## Session defaults (every activation)

**Default stack — ON every session (99% workflow).** User need not attach skill.

On skill load / `/super-spec` / **any coding task** in **pgi-core-frontend**:

0. **AFK ON** — auto mode + auto complexity; **G1 auto-approved**; implement without waiting for "go". Detail: [references/afk-default.md](references/afk-default.md) · repo `.cursor/rules/09-afk-lda-default.mdc`. Opt out: `no afk` / `ask me` / `gate G1`. **Exception:** visual-demo mode active → wait for option pick before Phase 4.
1. **This orchestrator is the default** — OpenSpec + Superpowers + gates G1–G4. **Priority skill** — prefer over other stacks unless opted out.
2. **Brainstorm / think-out / visual demo** — for print schedule, footers, colon/label, multi-option UX, or when user says brainstorm/demo: path map (quote view · policy view · PDF) + 2–3 options + mocks under `docs/evidence/` **before code**. Detail: [references/brainstorm-think-visual.md](references/brainstorm-think-visual.md).
3. **Claude Senior listener ON** — Claude does heavy work; Cursor listens, applies, verifies. Detail: [references/claude-senior-listener.md](references/claude-senior-listener.md) · project rule `08-claude-senior-listener.mdc`.
4. **agent-browser when needed** — UI/dropdown/form/visual/G4 browser proof. Load `agent-browser` skill → `agent-browser skills get core` before first use. Skip for pure PHP/API/docs.
5. **Impeccable ON for frontend** — same auto-load posture as agent-browser for UI proof. When task touches Vue, CSS, forms, Detail/view, visual blade chrome, `resources/js/**`, `resources/css/**`, or design keywords → load Impeccable setup + apply `polish` or `craft` as fit. Detail: [references/impeccable-frontend.md](references/impeccable-frontend.md) · rule `01-impeccable-ui.mdc`. Skip pure PHP/API/docs/PDF sample black borders.
6. Spec gates G1–G4 still apply — listener / AFK do **not** skip OpenSpec artifacts; they skip *waiting* on G1 (except visual pick above).
7. **SRP + thin (avoid fat)** — Phase 4/G4 load [references/srp-thin.md](references/srp-thin.md) with simple-code-voice. Deep dive: skill `refactor` (`struct-single-responsibility`). User says `SRP` / `avoid fat` → same.
8. **LDA-PO every plan (default)** — **Logic · Data structure · Architecture** first (+ Portal · Others). Load [references/solve-plan-pattern.md](references/solve-plan-pattern.md). Required on CreatePlan / Phase 2 / G2 (Quick = 5-bullet compress OK).
9. Opt out of stack: user says `no super-spec` / `plain agent`.

## How It Works

### Step 1: Pick a Mode

Check for existing signals, then fall back to heuristics:

| Signal | Mode |
|--------|------|
| `.spec-mode` file exists | Use whatever it says |
| `.specify/` directory | Spec-Kit |
| `openspec/` directory | OpenSpec |
| Brand new project, < 30 files | Spec-Kit |
| Everything else | **OpenSpec** (default) |

Save the choice to `.spec-mode` so future sessions remember it.

For detailed mode workflows, read:
- Spec-Kit: [references/spec-kit-workflow.md](references/spec-kit-workflow.md)
- OpenSpec: [references/openspec-workflow.md](references/openspec-workflow.md)

### Step 2: Triage Complexity

**AFK default:** auto-pick level; state one-line defaults; do **not** wait for confirm. Opt out: `ask me` / `no afk`.

| Level | When | What happens |
|-------|------|-------------|
| **Quick** | Single-file bugfix, typo, config | Simplified spec (`/opsx:propose` or `/opsx:ff`) → TDD → archive |
| **Standard** | Single feature, clear scope | All phases (Phase 3 only if UI) |
| **Thorough** | Multi-module, architecture decisions | All phases + Agent Teams evaluation |

### Step 3: Execute the Pipeline

**Phase 0 — Session Recovery** (automatic)
If `task_plan.md` exists from a previous session, read all planning files, query MemPalace for relevant history (if configured), run the 5-Question Reboot Test (Where am I? / Where am I going? / What's the goal? / What did I learn? / What did I do?), then resume from the last checkpoint.

**Phase 1 — Specification**
Write the spec using the selected mode. Quick tasks use `/opsx:propose`; standard/thorough use the full flow with `/opsx:explore` or `/speckit.specify`. Sketch **Logic** + **Data** + **Architecture** in plain words (LDA-PO).
When layout / print / multi-surface UX is unclear: run **brainstorm + think-out path map + visual demo** first ([references/brainstorm-think-visual.md](references/brainstorm-think-visual.md)); user pick locks G1 for that slice.
**Gate G1**: Spec aligns with constitution + inline review + scope check + Logic/Data/Architecture named. **AFK:** treat G1 as auto-approved (no wait) unless visual-demo mode needs a pick. Non-AFK: user must explicitly confirm.

**Phase 2 — Persistent Planning**
Generate `task_plan.md` (numbered checklist with file structure mapping + test points), `findings.md`, and `progress.md` using `planning-with-files` + `writing-plans`.
**Every plan / CreatePlan MUST include LDA-PO** — [references/solve-plan-pattern.md](references/solve-plan-pattern.md):
1. Logic  2. Data structure  3. Architecture  4. Portal (reuse)  5. Others
**Gate G2**: Every task has file paths + acceptance criteria + test strategy + **LDA-PO sections present** + inline plan review passed.

**Phase 3 — UI/UX Design** (frontend → Impeccable always ON)
Triggered when frontend is in scope (Vue, CSS, forms, Detail/view, visual blade chrome, `resources/js/**`, `resources/css/**`, design keywords). **Do not wait for `/impeccable`.**
1. Load Impeccable skill + setup (PRODUCT.md / load-context) — [references/impeccable-frontend.md](references/impeccable-frontend.md).
2. Apply **`polish`** for existing screens; **`craft`** / **`shape`** for new UI surfaces.
3. Optional: `ui-ux-pro-max --design-system --persist` when a full design-system pass is needed (v2.5.0).
**Gate G3**: Impeccable setup applied + pre-delivery checklist passed (+ user confirmed design when non-AFK / new surface).

**Phase 4 — Implementation**
Execute via one of two strategies (AI recommends, user picks):
- **Subagent-Driven**: Fresh subagent per task + two-stage review (spec conformance → code quality) + model selection per task role + implementer status handling (DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED)
- **Executing-Plans**: Batch execution + checkpoint reviews

TDD throughout. Errors escalate through the 3-Strike protocol → `systematic-debugging`.
**Simple code + voice (pgi):** small methods, short names, plain replies — [references/simple-code-voice.md](references/simple-code-voice.md) · `.cursor/rules/04-simple-code-voice.mdc`  
**After working → clean pass:** one portal, drop dual FE/BE, strip narration — same file § *After working — clean pass* (triggers: `working, clean code` / `single portal`)
**SRP + thin (pgi):** one job per function/file; avoid fat shared — [references/srp-thin.md](references/srp-thin.md) · skill `refactor` (`struct-single-responsibility`)
**Claude Senior (pgi session default):** prefer Claude-model Task / pasted Claude plan; Cursor thin apply+verify — [references/claude-senior-listener.md](references/claude-senior-listener.md).
**Impeccable (frontend):** keep Impeccable laws + polish/craft active while editing Vue/CSS/forms/views — same always-on as Phase 3; do not drop after G3. Skip for pure PHP/API. Print PDF sample borders ≠ admin UI polish — see [references/impeccable-frontend.md](references/impeccable-frontend.md).
**agent-browser (UI):** when Phase 4/G4 touches Vue/forms/pages, smoke via agent-browser (or IDE browser MCP if CDP fails) before claiming done.
**Gate G4**: All tests pass + two-stage review (spec via `requesting-code-review` → quality via **`code-review-and-quality`** — [references/code-review-combo.md](references/code-review-combo.md)) + verification evidence written to `progress.md` + **quick verify e2e** for view/print display slices ([references/quick-verify-e2e.md](references/quick-verify-e2e.md)) + `/opsx:verify` passed (if available) + MemPalace archived (if configured) + browser evidence when UI changed + **zero edge-case confirm** after renames/path moves (see `references/quality-gates.md`).

**Phase 5 — Archive**
`finishing-a-development-branch` → update all checkboxes → archive spec artifacts → final `progress.md` entry → MemPalace diary entry (if configured).

## Quality Gates

Each gate is a hard stop — nothing moves forward until all checks pass. If a gate fails, fix the issue and re-evaluate. Full gate criteria: [references/quality-gates.md](references/quality-gates.md)

## Anti-Rush Protection

If the user asks to skip the spec phase, politely decline and redirect to `/super-spec`. The whole point of this skill is preventing premature implementation.

## Reference Files

Read these as needed — they contain detailed procedures that would bloat this file:

| File | When to read |
|------|-------------|
| [references/quality-gates.md](references/quality-gates.md) | Evaluating any gate (G0-G4) |
| [references/code-review-combo.md](references/code-review-combo.md) | **G4 quality** — wire `code-review-and-quality` + requesting-code-review |
| [references/quick-verify-e2e.md](references/quick-verify-e2e.md) | **G4 quick e2e** — view/print / amount display (e.g. Unlimited) |
| [references/solve-plan-pattern.md](references/solve-plan-pattern.md) | **Every** CreatePlan / Phase 2 — Logic · Data · Architecture · Portal · Others |
| [references/afk-default.md](references/afk-default.md) | **AFK default** — auto G1, LDA-first wire |
| [references/simple-code-voice.md](references/simple-code-voice.md) | Phase 4: short names, small methods, plain voice · **clean pass / single portal** after working |
| [references/srp-thin.md](references/srp-thin.md) | Phase 4/G4: SRP, avoid fat modules; links `refactor` skill |
| [references/pl-db-edit-lock-portal.md](references/pl-db-edit-lock-portal.md) | PL Direct Book `/edit` bypass — example of reviewed portal plan |
| [references/desk-eli5-merge-delete-restore.md](references/desk-eli5-merge-delete-restore.md) | **ELI5 desk** — merge feature→uat deletes files; restore; 7pj twin; nested Comm/RI |
| [references/synergy-patterns.md](references/synergy-patterns.md) | Understanding cross-tool integration (6 chains) |
| [references/integration-guide.md](references/integration-guide.md) | Setup, troubleshooting, dependency list |
| [references/spec-kit-workflow.md](references/spec-kit-workflow.md) | Running the Spec-Kit flow |
| [references/openspec-workflow.md](references/openspec-workflow.md) | Running the OpenSpec flow |
| [references/mempalace-integration.md](references/mempalace-integration.md) | MemPalace memory system setup + 5 integration points |
| [references/upgrade-protocol.md](references/upgrade-protocol.md) | `/super-spec upgrade` — standardized version sync procedure |
| [references/claude-senior-listener.md](references/claude-senior-listener.md) | Every-session Claude Senior + Cursor listener + agent-browser hooks |
| [references/impeccable-frontend.md](references/impeccable-frontend.md) | **FE always-on** — Impeccable setup + polish vs craft; load-context path |
| [references/brainstorm-think-visual.md](references/brainstorm-think-visual.md) | **Priority before code** — brainstorm, think-out path map (view/policy/PDF), visual demos |
| [assets/constitutions/openspec-constitution.md](assets/constitutions/openspec-constitution.md) | OpenSpec constitution template |
| [assets/constitutions/spec-kit-constitution.md](assets/constitutions/spec-kit-constitution.md) | Spec-Kit constitution template |

## Cross-machine sync (same Cursor account)

| Piece | Sync method | Location |
|-------|-------------|----------|
| **spec-kit** | Personal skills + local mirror | `~/.cursor/skills/spec-kit/` |
| **openspec** | Personal skills + local mirror | `~/.cursor/skills/openspec/` |
| **superpowers** | Personal skills + local mirror | `~/.cursor/skills/superpowers/` |
| **caveman** | Cursor plugin (optional) | `~/.cursor/plugins/cache/caveman/` — see `docs/CURSOR_SKILLS_SYNC.md` |
| **This orchestrator** | Personal skills + local mirror | `~/.cursor/skills/spec-kit-openspec-superpowers/` |
| **caveman-spec-triad** | Repo + `~/.cursor/skills/` mirror | `.cursor/skills/caveman-spec-triad/` |
| **impeccable** | Personal skills + local mirror | `~/.cursor/skills/impeccable/` |
| **agent-browser** | Personal skill + CLI | `~/.claude/skills/agent-browser/` · `npm i -g agent-browser` |
| **Claude Senior rule** | Repo + user rules | `.cursor/rules/08-claude-senior-listener.mdc` · `~/.cursor/rules/claude-senior-listener.mdc` |
| **Superpowers plugin** | Cursor marketplace (optional) | Install per machine |
| **Project policy** | Git only | `docs/SESSION_STATE.md`, `.cursor/rules/session-handoff.mdc` |
| **CLI tools** | Install per machine | `specify`, `openspec`, `agent-browser` |

### Setup on a new PC

1. Sign in to the **same Cursor account**.
2. **Settings → Sync** — enable skills sync if available.
3. Confirm `~/.cursor/skills/` contains: `spec-kit/`, `openspec/`, `superpowers/`.
4. Install CLIs:
   ```bash
   uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
   npm install -g @fission-ai/openspec@latest
   ```
5. Optional: install **Superpowers** and **Caveman** plugins in Cursor.
6. Clone `pgi-core-frontend`; if skills missing: `cp -r .cursor/skills/* ~/.cursor/skills/`

## pgi-core-frontend overrides

This repo has a **locked policy** — read before mode auto-selection:

- [pgi-core-policy.md](pgi-core-policy.md) — OpenSpec default; PL 7-line scope (Marine `0189`+twin `0206`; keep `7pj`); no auto-commit; Claude Senior + agent-browser + Impeccable-on-FE session defaults
- Skill `triad-router` — manual tool-choice router (Spec-Kit vs OpenSpec vs Superpowers)
- On `continue`: read `docs/SESSION_STATE.md` first
- Active change: `openspec/changes/phase-ii-quotation-slice-only/`
- Session: Claude Senior listener ON + agent-browser for UI verify — [references/claude-senior-listener.md](references/claude-senior-listener.md)
- **Frontend → Impeccable always ON:** [references/impeccable-frontend.md](references/impeccable-frontend.md) · `.cursor/rules/01-impeccable-ui.mdc`
- **Brainstorm / visual demo before layout code:** [references/brainstorm-think-visual.md](references/brainstorm-think-visual.md)
- **Long journey:** `/7pj` — 7 lines × quote then policy (Marine `0189`+twin `0206`; keep `7pj`, not `8pj`) — skill `7pj-wave` · [references/db-journey.md](references/db-journey.md)
- **AFK + LDA default ON:** [references/afk-default.md](references/afk-default.md) — auto G1; Logic · Data · Architecture first
- **Every plan (LDA-PO):** [references/solve-plan-pattern.md](references/solve-plan-pattern.md) — Logic · Data structure · Architecture · Portal · Others
- **PL `/edit` URL lock (reviewed example):** [references/pl-db-edit-lock-portal.md](references/pl-db-edit-lock-portal.md)
- **Desk ELI5 — merge delete / restore / 7pj twin / nested Comm+RI:** [references/desk-eli5-merge-delete-restore.md](references/desk-eli5-merge-delete-restore.md) — teach juniors; never “fix UAT deletes” by merging whole feature

### Invocation

#### Full stack (Caveman + triad manuals — no auto SDD)

```text
/Caveman spec kit Openspec Superpower
```

```text
Use caveman spec kit openspec superpower:
```

Loads **caveman-spec-triad** skill. Does **not** run `/speckit.*` or `/opsx:*` until user asks.

#### Router only

```text
Use spec-kit-openspec-superpowers: verify my triad setup on this machine.
```

#### Single tools

```text
Use openspec: /opsx:apply <change-name>.
```

```text
Use superpowers: TDD for the next task.
```

```text
Use caveman: talk like caveman for the rest of this session.
```

### Reference links

- Spec-Kit: https://github.com/github/spec-kit
- OpenSpec: https://github.com/Fission-AI/OpenSpec
- Superpowers: https://github.com/obra/superpowers
- Caveman: https://github.com/JuliusBrussee/caveman
- Sync manifest: `docs/CURSOR_SKILLS_SYNC.md`
