# Code review combo (G4) — `code-review-and-quality`

**Installed:** `~/.agents/skills/code-review-and-quality/` (2026-08-12)  
**Also present:** thin `code-review` (Sentry checklist) — **do not dual-load**; quality skill wins.

## Role in triad

| Stage | Skill | Job |
|-------|--------|-----|
| G4 step 1 — Spec conformance | `requesting-code-review` | Does code match confirmed spec? |
| G4 step 2 — Code quality | **`code-review-and-quality`** | Five-axis review + severity labels |
| Optional spawn | `requesting-code-review` / Claude Senior Task | Multi-model review when Standard+ |

## When to load

| Trigger | Action |
|---------|--------|
| G4 before archive / “done” | Load `code-review-and-quality` for quality stage |
| User says `review` / `code review` / `before merge` | Same |
| After Claude / agent produced a slice | Same (author-blind review) |
| Quick typo / 1-line label | Skip full five-axis — inline self-check OK |
| Playwright-only test audit | Use `review` skill (test anti-patterns) — **not** this |

## Five axes (compress for Quick)

1. Correctness — matches spec; edges; errors  
2. Readability — short names; no clever; no dead code  
3. Architecture — PL Direct Book scope; no fat shared; no legacy `0121`–`0125` drive-by  
4. Security — no secrets; toast `Something went wrong` (no API dumps)  
5. Performance — no N+1 / unbounded loops on hot paths  

## Severity labels (required on findings)

| Label | Action |
|-------|--------|
| **Critical:** | Block merge |
| *(no prefix)* | Required before merge |
| **Optional:** / **Consider:** | Author may skip |
| **Nit:** | Style only |
| **FYI** | Context only |

## pgi overlays (always with this skill)

- Scope: 7 Direct Book products only (`02-pl-seven-product-scope`)  
- Simple code: `04-simple-code-voice` + `srp-thin.md`  
- Commit titles: humanizer Adjective Noun (not this skill’s imperative changelog)  
- View/print slices: still need G4 evidence + quick verify e2e  

## Opt out

`skip review` / `no code-review` / `plain agent` — skip quality stage (still run tests/build).

## Conflict order

1. Safety / user override  
2. Spec G1–G4  
3. `code-review-and-quality` (structure / correctness)  
4. Karpathy / clean-code / simple-code  
5. Caveman (voice only)  
