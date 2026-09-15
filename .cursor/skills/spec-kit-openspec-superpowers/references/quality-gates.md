# Quality Gates (G0–G4)

Each gate is a hard stop between phases. If any check fails, go back, fix it, and re-evaluate.
When checking a gate, reference the relevant constitution clauses.

---

## G0 — Session Recovery

Triggered when `task_plan.md` already exists (meaning there's unfinished work).

| Check | Pass criteria |
|-------|--------------|
| Planning files present | `task_plan.md` + `findings.md` + `progress.md` all exist and are readable |
| 5-Question Reboot Test | Can answer: What phase am I in? / What's next? / What's the goal? / What did I learn? / What did I do? |
| Breakpoint located | Found last `[x]` in `task_plan.md`; next `[ ]` is the resume point |
| Context consistent | `git diff --stat` matches what `progress.md` reports |
| Design system check | If `design-system/` exists → auto-load design context |
| MemPalace check | If MemPalace is configured → `mempalace_status` + `mempalace_diary_read` for agent state + `mempalace_search` for relevant history |

**If it fails**: Fill in missing files → align state manually → re-evaluate.

---

## G1 — Spec Complete

Between Phase 1 (Specification) and Phase 2 (Planning).

| Check | Pass criteria | Constitution |
|-------|--------------|-------------|
| User confirmed | Explicit "yes", "OK", "confirmed", or equivalent | §1 Core mission |
| Spec complete | Spec-Kit: `spec.md` has user stories + acceptance criteria · OpenSpec: proposal + spec done | §4/§6 Doc separation |
| What vs How separated | Spec contains no implementation details | §4/§6 Doc separation |
| Logic + Data sketched | Rules and where data lives named in plain language (LDA-PO start) | solve-plan-pattern |
| Constitution aligned | Spec content doesn't violate any constitution clause | §2 Core principles |
| Testable acceptance criteria | Each criterion maps to at least one test case | §2.2/§3 Testing |
| Scope check passed | If multiple independent subsystems detected, flagged for decomposition | brainstorming |
| Inline spec review passed | Self-review checklist completed (see below) | Superpowers |
| User reviewed written spec | User explicitly reviewed the spec document file | brainstorming |

Spec-Kit extras: `specify check` returns no errors · `/speckit.analyze` passes (if run).

**If it fails**: Run `/speckit.clarify` or `/opsx:explore` to fill gaps → re-run inline review → re-confirm.

---

## G2 — Plan Ready

Between Phase 2 (Planning) and Phase 3/4 (Design/Implementation).

| Check | Pass criteria |
|-------|--------------|
| Three files ready | `task_plan.md` + `findings.md` + `progress.md` created |
| Numbered checklist | Each atomic task has its own ID (e.g., 1.1, 1.2, 2.1) |
| File paths specified | Each task lists exact Create/Modify/Test file paths |
| File structure mapped | All files to be created/modified are mapped with responsibilities before tasks |
| TDD test points | Each task includes a test strategy or draft test cases |
| Acceptance traceability | Each task traces back to a confirmed acceptance criterion from G1 |
| **LDA-PO pattern** | Plan includes Logic · Data structure · Architecture · Portal · Others (full or Quick compress) — see `solve-plan-pattern.md` |
| Risk assessment | High-risk operations have rollback strategies noted |
| Inline plan review passed | Self-review checklist completed (see below) |
| User reviewed plan | User explicitly reviewed the plan document |

**If it fails**: Fill in missing items → re-run inline review → user confirms plan → re-evaluate.

---

## G3 — Design Confirmed

Between Phase 3 (UI/UX Design) and Phase 4 (Implementation). Only for UI/UX tasks.

| Check | Pass criteria | Constitution |
|-------|--------------|-------------|
| Design system generated | `--design-system` output includes patterns, styles, colors, typography | §4/§2.3 UI/UX |
| Design persisted | `--persist` created `design-system/MASTER.md` | §7 File persistence |
| Pre-delivery checklist | All dimensions pass: Visual Quality · Interaction · Light/Dark · Accessibility | §4/§2.3 UI/UX |
| User confirmed | User explicitly approved the design | §1 Core mission |
| Accessibility | WCAG 2.1 AA · responsive · contrast ≥ 4.5:1 | §2.3 |

ui-ux-pro-max v2.5.0 capabilities: 67 UI styles · 161 color palettes · 57 font pairings · 14 tech stacks · 161 reasoning rules · 6 specialist skills (banner-design, slides, ui-styling, design-system, design, brand).

**If it fails**: Adjust design → regenerate → re-check.

---

## G4 — Implementation Verified

Between Phase 4 (Implementation) and Phase 5 (Archive). The strictest gate.

| Check | Pass criteria | Source skill |
|-------|--------------|-------------|
| TDD coverage | Every new feature/fix has tests with RED→GREEN cycle | test-driven-development |
| All tests pass | Test command output shows 0 failures (full output preserved) | verification-before-completion |
| Spec conformance review | Code matches confirmed spec (nothing missing, nothing extra) | requesting-code-review |
| Code quality review | No Critical / Required issues unfixed; findings severity-labeled | **code-review-and-quality** (+ requesting-code-review spawn OK) — [code-review-combo.md](code-review-combo.md) |
| Simple code + voice | Small methods; short names (≤~3 words); plain text; no `/**` on obvious code | simple-code-voice.md |
| Evidence archived | Verification output written to `progress.md` with exit code + timestamp | planning-with-files |
| **Quick verify e2e** | View/print / amount-display slices: `npm run test:e2e:car-loi-unlimited` (or change quick script) exit 0 — see [quick-verify-e2e.md](quick-verify-e2e.md) | playwright-best-practices |
| Constitution compliant | Code quality, test coverage, performance, security meet constitution baselines | constitution |
| `/opsx:verify` passed | Completeness + Correctness + Coherence validated (OpenSpec expanded, if available) | OpenSpec |
| MemPalace archived | Spec decisions + key findings persisted to palace (if configured) | MemPalace |
| Zero edge-case confirm | After renames / path moves / symbol moves: no stale imports, no orphan old files, docs/rules updated, build/verify green — report **Confirmed — runtime edge cases: zero** (or list leftovers) | verification-before-completion |

**Two-stage review flow** (from Superpowers + `code-review-and-quality`):
1. **Spec conformance** (`requesting-code-review`) → Does the code match the confirmed spec?
   - Pass → proceed to step 2
   - Fail → fix → redo step 1
2. **Code quality** (`code-review-and-quality`) → Correctness · readability · architecture · security · performance; label Critical / Required / Optional / Nit
   - Pass → G4 passes
   - Fail → fix → redo step 2
   - Detail: [code-review-combo.md](code-review-combo.md)

**If it fails**: Fix based on review feedback → rerun tests → re-review → loop until it passes.

### Zero edge-case confirm (renames / moves / path changes)

Required before claiming done when the change renames files, moves modules, or changes import paths (Quick path included).

| Check | Pass |
|-------|------|
| Old path / symbol grep | Zero hits in `*.{js,vue,ts,php,mjs}` (and scripts) |
| New files present | Renamed targets exist on disk |
| Old files gone | Deleted / moved sources absent |
| Barrel / index re-exports | Point at new paths |
| Docs / rules | Folder maps and examples not naming deleted files |
| Build / verify | `npm run build` (or project verify script) succeeds |

**Reply shape (caveman OK):** table of checks + `Confirmed — runtime edge cases: zero` **or** explicit leftover list (never “should be fine”).

**Soft (not runtime break):** HTML ids / unrelated strings that collide with new filenames — note as by-design if intentional.

---

## Inline Self-Review (replaced subagent review loops in v5)

Superpowers v5.0.6 replaced subagent-based review loops with inline self-review checklists — reducing review time from ~25 minutes to ~30 seconds per round while maintaining comparable quality.

### Spec Inline Review (at G1)

After writing the spec, run through this checklist before requesting user review:

- [ ] Every requirement has testable acceptance criteria (Given-When-Then)
- [ ] Spec contains only What & Why — no implementation details leaked
- [ ] All ambiguous terms are defined or clarified
- [ ] Scope is bounded — no "and also..." creep
- [ ] Edge cases and error scenarios are documented
- [ ] Constitution constraints are referenced where relevant
- [ ] Logic (rules) and Data (where truth lives) are named in plain language — see `solve-plan-pattern.md`
- [ ] If multiple subsystems detected → flagged for decomposition
- [ ] Spec prose is plain — readable by anyone on the team

Issues found → fix inline → re-run checklist. If 3+ blocking issues persist → escalate to user.

### Plan Inline Review (at G2)

After writing the plan, run through this checklist before requesting user review:

- [ ] Every task has exact file paths (Create/Modify/Test)
- [ ] File structure mapping is complete and consistent
- [ ] Each task traces to an acceptance criterion from G1
- [ ] Test strategy is concrete (not "add tests later")
- [ ] High-risk operations have rollback strategies
- [ ] Task dependencies are explicit and ordered correctly
- [ ] Estimated scope matches complexity triage level
- [ ] **LDA-PO present:** Logic · Data structure · Architecture · Portal · Others (or Quick compress)
- [ ] Portal names one reusable path **or** says none + why
- [ ] New helpers use short names + small files (see `simple-code-voice.md`)

Issues found → fix inline → re-run checklist. If 3+ blocking issues persist → escalate to user.

---

## Implementer Status Handling (Phase 4)

When using subagent-driven-development, implementer subagents report one of four statuses:

| Status | Action |
|--------|--------|
| **DONE** | Proceed to spec compliance review |
| **DONE_WITH_CONCERNS** | Read concerns; address if about correctness/scope, note if observations |
| **NEEDS_CONTEXT** | Provide missing context, re-dispatch |
| **BLOCKED** | Assess: context problem → provide more; reasoning → use more capable model; task too large → break down; plan wrong → escalate |

---

## Error Escalation (applies to all gates)

```
Attempt 1: Diagnose → targeted fix → re-evaluate gate
Attempt 2: Different approach/tool → fix → re-evaluate
Attempt 3: Challenge assumptions → search for solutions → consider updating the plan
After 3 failures: → systematic-debugging (4-phase root cause analysis) → escalate to user
```

This merges `planning-with-files` 3-Strike Protocol with `systematic-debugging`.
