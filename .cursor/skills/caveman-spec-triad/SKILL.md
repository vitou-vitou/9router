---
name: caveman-spec-triad
description: >-
  Session preset: Caveman voice + Spec-Kit / OpenSpec / Superpowers triad stack.
  Use when user says "/Caveman spec kit Openspec Superpower", "Use caveman spec kit
  openspec superpower:", "caveman spec triad", "caveman + triad", or wants terse voice
  plus SDD routing for pgi-core-frontend. Does NOT auto-run /speckit.* or /opsx:* — stacks
  manuals + voice only.
---

# Caveman + Spec-Kit / OpenSpec / Superpowers — Session Stack

One invocation loads **voice + triad router + pgi-core policy**. User still picks SDD path and runs commands when ready.

---

## When this skill fires

Match any of:

```text
/Caveman spec kit Openspec Superpower
Use caveman spec kit openspec superpower:
caveman spec triad
caveman + triad
```

**Do not** auto-run `/speckit.*`, `/opsx:*`, or `specify`/`openspec` CLI. Stack context only.

---

## On invoke — agent checklist (in order)

1. **Activate Caveman voice** (persistent until user says `stop caveman` or `normal mode`)
   - Read plugin skill: `~/.cursor/plugins/cache/caveman/caveman/*/skills/caveman/SKILL.md`
   - Or project rule: `.cursor/rules/caveman-mode.mdc`
   - Default intensity: **full** (fragments OK, drop filler, keep technical terms exact)
   - Code/commits/PRs: write normal; prose: caveman

2. **Load triad router** (read, do not execute)
   - `.cursor/skills/spec-kit-openspec-superpowers/SKILL.md`
   - `.cursor/skills/spec-kit-openspec-superpowers/pgi-core-policy.md`

3. **Load execution manuals** (read when task needs them — not all at once unless asked)
   - **openspec** — default for this repo (`openspec/`, `/opsx:*`, `/super-spec`)
   - **spec-kit** — greenfield only if user forces Spec-Kit
   - **superpowers** — TDD, debugging, plans, verification (always during implement)

4. **Session resume**
   - If user says **continue** or resumes PL Direct Book work → read `docs/SESSION_STATE.md` first
   - Then `openspec/changes/phase-ii-quotation-slice-only/progress.md` + `task_plan.md` if present
   - Project rules: `.cursor/rules/session-handoff.mdc`, `.cursor/rules/windows-herd-gitbash.mdc`, `.cursor/rules/02-pl-seven-product-scope.mdc`

5. **Confirm stack** — one short caveman reply: voice ON, triad loaded, SDD not started, ask what task (PL slice / bugfix / UI polish).

6. **UI polish?** (Vue / PrimeVue / Tailwind)
   - Read **impeccable** + `.cursor/rules/01-impeccable-ui.mdc`
   - Extend Direct Book shell — no drive-by refactor of legacy PL products

---

## Triad decision (reminder)

```
Need structured SDD?
├── This repo (existing) → openspec + superpowers (+ caveman ON)
├── Brand-new isolated app → spec-kit + superpowers (+ caveman ON)
└── Small task → superpowers alone (+ caveman ON)

NEVER spec-kit + openspec on same feature
```

| Layer | Skill folder | Question |
|-------|--------------|----------|
| SDD (pick one) | `openspec/` or `spec-kit/` | What to build / what changed? |
| Execution | `superpowers/` | How to build (TDD, verify, debug)? |
| Voice | caveman plugin / caveman-mode.mdc | How to speak (this stack)? |

---

## Downstream invocations (after stack is active)

User narrows to one tool:

```text
Use spec-kit: /speckit.tasks
Use openspec: /opsx:new my-change
Use superpowers: TDD for next task
Use caveman: /caveman ultra
stop caveman
```

---

## Sync

Mirrored at `~/.cursor/skills/caveman-spec-triad/` — see `docs/CURSOR_SKILLS_SYNC.md`.
