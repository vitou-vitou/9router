# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the 9Router glossary (Router, Operator, Client, Provider, Connection, Account, Model, Fallback, RTK, Format).
- **`CONTEXT-MAP.md`** — not used here; this is a single-context repo.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. The directory is created lazily by `/domain-modeling`, so it may be empty or absent.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo:

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

`docs/*` is gitignored in this repo, so `docs/adr/` and `docs/agents/` carry explicit `!` exceptions. Keep new ADRs under `docs/adr/` — anywhere else under `docs/` stays untracked and will not survive the two-machine git sync.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
