---
name: spec-kit-openspec-superpowers
description: >-
  Triad router — when to use Spec-Kit vs OpenSpec vs Superpowers (+ optional Caveman voice).
  Use when choosing SDD tools, verifying cross-machine setup, or deciding greenfield vs post-MVP workflow.
  For execution, invoke the single skills: spec-kit, openspec, superpowers, or caveman.
---

# Spec-Kit, OpenSpec & Superpowers — Triad Router

Three tools solve different layers of the AI coding problem:

| Tool | Skill folder | Core question | Analogy |
|------|--------------|---------------|---------|
| **Spec-Kit** | `spec-kit/` | "What rules govern the work?" | Building code manual |
| **OpenSpec** | `openspec/` | "What changed?" | Change order |
| **Superpowers** | `superpowers/` | "How to execute?" | Crew work manual |
| **Caveman** | plugin: `~/.cursor/plugins/cache/caveman/` | "How to talk?" | Terse voice / token compression |
| **Simple code + voice** | `spec-kit-openspec-superpowers/references/simple-code-voice.md` | "How to name & shape code?" | Short names, small methods, plain text |

**Critical rule:** Spec-Kit and OpenSpec are **competitors** (both SDD). Pick **one**. Superpowers and Caveman are **complementary** — Superpowers for *how to build*; Caveman for *how to speak*; **simple-code-voice** for *how to name* (Phase 4 / G4).

Source article: https://mp.weixin.qq.com/s/NeBSi-Q8zUWlWb0mL5BPOA

---

## When to use this skill

- Choosing between Spec-Kit vs OpenSpec
- Verifying triad setup on a new machine
- Understanding how the three tools combine
- pgi-core-frontend workflow policy questions

**For actual work**, invoke the single skill:

| Task | Invoke |
|------|--------|
| Greenfield MVP, `/speckit.*` | **spec-kit** |
| Post-MVP changes, `/opsx:*` | **openspec** |
| TDD, debugging, plans, review | **superpowers** |
| Terse output, less tokens, compressed review/commits | **caveman** |

---

## Decision guide

```
Need structured SDD?
├── Greenfield / complex / strict governance → spec-kit + superpowers [+ caveman optional]
├── Existing repo / fast iteration / change tracking → openspec + superpowers [+ caveman optional]
└── Small task, no formal spec needed → superpowers alone [+ caveman optional]

NEVER combine spec-kit + openspec (overlapping SDD — pick one)
ALWAYS add superpowers for implementation quality
OPTIONALLY add caveman for token-efficient voice (does not replace SDD or Superpowers)
```

---

## Recommended workflows

### Path A: Spec-Kit + Superpowers (+ Caveman optional, greenfield)

1. **spec-kit:** `/speckit.constitution` → specify → plan → tasks
2. **superpowers:** TDD per task, subagents, code review, verification
3. **spec-kit:** `/speckit.implement`
4. **caveman** (optional): `/caveman` or `Use caveman:` for terse session voice; `cavecrew` subagents for compressed investigator/builder/reviewer output

### Path B: OpenSpec + Superpowers (+ Caveman optional, existing project)

1. **openspec:** `/opsx:new` → continue or `/opsx:ff`
2. **superpowers:** TDD loop during apply
3. **openspec:** `/opsx:apply` → `/opsx:archive`
4. **caveman** (optional): same as Path A — voice layer only, not SDD

---

## Cross-machine sync (same Cursor account)

| Piece | Sync method | Location |
|-------|-------------|----------|
| **spec-kit** | Personal skills + local mirror | `~/.cursor/skills/spec-kit/` |
| **openspec** | Personal skills + local mirror | `~/.cursor/skills/openspec/` |
| **superpowers** | Personal skills + local mirror | `~/.cursor/skills/superpowers/` |
| **caveman** | Cursor plugin (optional) | `~/.cursor/plugins/cache/caveman/` — see `docs/CURSOR_SKILLS_SYNC.md` |
| **This router** | Personal skills + local mirror | `~/.cursor/skills/spec-kit-openspec-superpowers/` |
| **impeccable** | Personal skills + local mirror | `~/.cursor/skills/impeccable/` |
| **system-study-packet** | Personal skills + local mirror | `~/.cursor/skills/system-study-packet/` |
| **8-principle-study** | Personal skills + local mirror | `~/.cursor/skills/8-principle-study/` |
| **laravel-specialist** | Personal skills + local mirror | `~/.cursor/skills/laravel-specialist/` |
| **Superpowers plugin** | Cursor marketplace (optional) | Install per machine |
| **Project policy** | Git only | `docs/SESSION_STATE.md`, `.cursor/rules/session-handoff.mdc` |
| **CLI tools** | Install per machine | `specify`, `openspec` |

### Setup on a new PC

1. Sign in to the **same Cursor account**.
2. **Settings → Sync** — enable skills sync if available.
3. Confirm `~/.cursor/skills/` contains: `spec-kit/`, `openspec/`, `superpowers/`.
4. Install CLIs:
   ```bash
   uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
   npm install -g @fission-ai/openspec@latest
   ```
5. Optional: install **Superpowers plugin** in Cursor.
6. Clone `pgi-core-frontend`; if skills missing: `cp -r .cursor/skills/* ~/.cursor/skills/`

### pgi-core-frontend locked workflow

See [pgi-core-policy.md](pgi-core-policy.md). Summary:

- **Default:** openspec + superpowers (+ caveman optional).
- **PL scope:** 7 Direct Book products only (`02-pl-seven-product-scope.mdc`).
- **Never** spec-kit + openspec on the same feature.
- **continue** → read `docs/SESSION_STATE.md` first.

---

## Invocation

### Full stack (Caveman + triad manuals — no auto SDD)

```text
/Caveman spec kit Openspec Superpower
```

```text
Use caveman spec kit openspec superpower:
```

Loads **caveman-spec-triad** skill: persistent caveman voice + triad router + pgi-core policy. Does **not** run `/speckit.*` or `/opsx:*` until user asks.

### Router only

```text
Use spec-kit-openspec-superpowers: verify my triad setup on this machine.
```

### Single tools

```text
Use spec-kit: /speckit.tasks in the current project.
```

```text
Use openspec: /opsx:apply add-order-lifecycle.
```

```text
Use superpowers: TDD for the next task.
```

```text
Use caveman: talk like caveman for the rest of this session.
```

## Reference links

- Spec-Kit: https://github.com/github/spec-kit
- OpenSpec: https://github.com/Fission-AI/OpenSpec
- Superpowers: https://github.com/obra/superpowers
- Caveman: https://github.com/JuliusBrussee/caveman (Matt Pocock-style token compression; includes cavecrew subagents)
- Sync manifest: `docs/CURSOR_SKILLS_SYNC.md` (in pgi-core-frontend)
