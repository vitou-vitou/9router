# Brainstorm · Think-out-loud · Visual demo (pgi priority)

**Priority:** high — use **before coding** whenever layout, print schedule, footer, colon/label, view↔PDF parity, or multi-option UX is unclear.

Proven on PL Direct Book Marine (Interest Insured Total footer D1/D2/D3): demos + path map beat guessing in blade/Vue.

## When this mode is ON (auto)

Trigger if **any**:

| Signal | Example |
|--------|---------|
| User says | `brainstorm`, `think out loud`, `think out`, `re-demo`, `demo first`, `visual demo`, `options`, `A/B/C` |
| Task type | Print/PDF schedule, Interest Insured, Total/footer, colon pattern, view vs policy view vs PDF |
| Ambiguity | 2+ plausible layouts; user said **not yet coding** / **re-demo first** |
| Surfaces | Quote detail, policy detail, endorsement, quote PDF, policy PDF |

**Do not** jump to Phase 4 implement until user picks an option (or says `skip demo` / `just code X`).

**AFK note:** auto-G1 does **not** skip visual pick when this mode is active. Pick = G1 for layout slices.

## Three moves (order)

### 1. Think out loud — path map

List **relevant surfaces** before options. Short table:

| Surface | Typical path (Marine / Direct Book) | Share? |
|---------|--------------------------------------|--------|
| Quote **view** | `Quotation/Detail.vue` → `Components/Burglary/Detail.vue` | Often shared |
| Policy **view** | `Policy/Detail.vue` → same `Detail.vue` | Same component = one fix |
| Quote **PDF** | `shell_*` → product partial (e.g. `marine_interest_insured.blade.php`) | |
| Policy **PDF** | Same Direct Book blades; `print_as` / `data_type=POLICY` | Usually **no** separate Interest blade |
| Edit **form** | `Premium.vue` / plan tabs | Input ≠ schedule footer — note if N/A |
| Endorsement | BUR form / print | Say if Detail schedule is **not** reused |

State: what one change covers vs what needs a second mirror.

### 2. Brainstorm — 2–3 options + recommend

- Name options clearly (**A/B/C** or **D1/D2/D3**).
- One line each: layout, risk (mPDF/`<p>`-in-`<td>`, colspan), smallest diff.
- Mark **one** recommendation.
- One clarifying question max (e.g. Qty total drop?).
- End with: `Reply A / B / C when ready` (or D1/D2/D3).

### 3. Visual demo — **before code**

When layout is visual (print table, footer band, colon gutter):

1. **No production blade/Vue edit** until pick.
2. Generate mock images (GenerateImage and/or compose) under `docs/evidence/<slug>-demo/`.
3. Include: per-option PNGs + one `compare-*.png` side-by-side + short `README.md` or `*-OPTIONS.md`.
4. Show compare in chat; wait for pick.
5. After pick → implement minimal files only; smoke quote **and** note policy parity if shared.

Skip heavy demos for pure typo / one-line label with screenshot already decisive (Quick solo).

## Commands / phrases

| User says | Effect |
|-----------|--------|
| `brainstorm` / `think out` / `think out loud` | Path map + options; no code |
| `demo first` / `re-demo` / `visual demo` | Mocks only; no code |
| `A` / `B` / `C` / `D2` (pick) | Lock option → implement |
| `skip demo` / `just code` | Proceed with named approach (still LDA-PO) |

## Coexistence

| Stack piece | Relationship |
|-------------|--------------|
| Phase 1–2 OpenSpec | Demos feed G1; write short option note into findings if change exists |
| Impeccable | Admin UI polish; **print grid demos** still use this ref (sample borders ≠ admin craft) |
| Claude Senior | Heavy option design / mocks → Claude Task OK; Cursor presents pick |
| Caveman | Keep replies short; demos still labeled clearly |
| `14-code-must-benefit` | Demo-only work = **no** production code until must |

## Evidence folder convention

```text
docs/evidence/<topic>-demo/
  README.md          # options + locked pick
  option-a-*.png
  option-b-*.png
  compare-*.png
```

Example: `docs/evidence/marine-interest-footer-demo/` (Total 2-col D2).

## Anti-patterns

| Don't | Do |
|-------|-----|
| Code three layouts then ask | Demo three → pick one → code |
| Only change quote PDF, forget shared Detail | Path map first |
| Invent a separate policy Interest blade when shell already shared | Reuse `print_as` path |
| Essay brainstorm | Table + 3 options + recommend + one question |
