---
name: 7pj-wave
description: >-
  Expands short 7pj / /7pj prompts into Direct Book quote-then-policy waves.
  Use when the user says 7pj, /7pj, db-journey, pl-journey, wave 1/2/3,
  or asks for quote list+pdf+view+create+edit then policy wire — all 7 lines
  or one product (Marine 0189+0206, 0191–0196).
---

# 7pj wave

Slash: `/7pj` · aliases: `7pj` · `db-journey` · `pl-journey`

**Do not** make the user paste the wave template. Expand `$ARGUMENTS` (or the rest of the message) into waves, then run them.

## Auto-load (every 7pj call)

1. `spec-kit-openspec-superpowers` (priority · already default)
2. `impeccable` for list / view / create / edit Vue
3. Playbook: `spec-kit-openspec-superpowers/references/db-journey.md`

PDF sample borders ≠ admin polish. No Playwright unless user re-enables. No commit unless asked.

## Default (no product named)

**All 7 lines** — Marine `0189`+twin `0206` · Burglary `0191` · Money `0192` · Plate `0193` · CAR `0194` · Bond `0195` · PI `0196`.

Not `8pj`. Out: `0121`–`0125`.

## Expand then run

Parse tokens. Rest after `do:` (or leftover text) = the work. `ref:` / URL / screenshot = evidence.

Default **one wave** unless user says `w2` / `w3` / another `do:`.

Each wave:

```text
——wave N:——
task1: 7pj > quote only list + pdf + view + create + edit > read and do: {work}  ref:{url}
task2: 7pj > policy > wire task 1
```

- **task1** Quote surfaces in order: list → PDF → view → create → edit.
- **task2** Same change on policy (view + PDF + edit). Do not invent a second design.
- Skip task2 if `quote-only` / `q-only`.
- Skip task1 if `policy-only` / `p-only`.
- Endt only if `+endt` / `endt` / `e`.

Then execute. Print one-line matrix first (product × surface), then work.

## Tokens

| Type | Tokens |
|------|--------|
| Product | `all` (default) · `marine`/`0189`/`0206` · `bur`/`burglary`/`0191` · `money`/`0192` · `plate`/`pg`/`0193` · `car`/`0194` · `bond`/`0195` · `pi`/`0196` |
| Wave | `w1` `w2` `w3` — extra waves only if typed or extra `do:` |
| Quote filter | `list` `pdf` `view` `create` `edit` — omit = all five |
| Phase | `q`/`quote` · `p`/`policy` · `e`/`endt` |
| Other | `audit` (path map, no code) · `crop` (evidence PNG) |

Marine one line = both SM codes.

## Guard

- Layout / footer / colspan → brainstorm + visual demo before code (user pick = G1).
- One portal. BUR slice if shared file would bloat. No drive-by `0121`–`0125`.
- Reuse existing records (`13-smoke-few-records`).
- View↔PDF schedule parity: `db-journey.md`.
