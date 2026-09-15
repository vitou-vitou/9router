# Session combo stack (vitou default)

When user invokes **`/spec-kit-openspec-superpowers`**, **`/super-spec`**, or **`Use spec-kit-openspec-superpowers:`**, load this stack before Mode pick / Phase 0.

Same stack applies to **`/Caveman spec kit Openspec Superpower`** via `caveman-spec-triad` (that path also keeps caveman ON).

---

## ALWAYS load (every triad invoke)

Do these **in order** before asking complexity. Read files — do not skip.

| # | Layer | What to load | Path(s) |
|---|--------|--------------|---------|
| 1 | **Voice** | Caveman (ON until `stop caveman` / `normal mode`) | `~/.claude/skills/caveman/SKILL.md` or `~/.cursor/plugins/cache/caveman/**/skills/caveman/SKILL.md` or `.agents/skills/caveman/SKILL.md` |
| 2 | **Reader brand** | Custom rule: reader-loved + weird/invention | `.cursor/rules/08-reader-loved-code.mdc` and/or `~/.cursor/rules/08-reader-loved-code.mdc` |
| 3 | **Simple code** | Short names / plain voice | `.cursor/rules/04-simple-code-voice.mdc` |
| 4 | **Anti-LLM-bad** | Karpathy guidelines (surgical, no overbuild) | `~/.cursor/skills/karpathy-guidelines/SKILL.md` |
| 5 | **Clean Code** | Uncle Bob standards (names, SRP, small funcs) | `~/.cursor/skills/clean-code/SKILL.md` · `~/.agents/skills/clean-code/SKILL.md` |
| 6 | **Commits** | Human commit titles | `.cursor/rules/commit-humanizer.mdc` |
| 7 | **Prose** | Humanizer skill (ready for docs/PR/README) | `~/.cursor/skills/humanizer/SKILL.md` · `~/.agents/skills/humanizer/SKILL.md` |
| 8 | **Workflow** | This triad router + laravel13 policy | `spec-kit-openspec-superpowers/SKILL.md` + `laravel13-x-policy.md` |

Also respect any other project `alwaysApply` rules already in context (PL scope, fast mode, god-speed, session-handoff, etc.). Do not re-read every rule file if already injected — still **obey** them.

### Always-load behavior

- **Caveman** → all assistant prose terse; code/commits still normal English where needed; public docs → humanizer.
- **08-reader-loved-code** → write for readers; weird budget ≤1; invent only if gate passes.
- **Karpathy guidelines** → think before code; simplicity first; surgical diffs; surface assumptions; verifiable done.
- **Clean Code** → meaningful names, small functions, one job, honest errors; refactor smells when touching code.
- **Humanizer** → before shipping README / PR body / changelog / user-facing copy that smells AI: apply humanizer patterns (no fabrication).
- **Triad** → still G1 before code; no skip-spec.

Confirm in one short line after load: `Stack: caveman + karpathy + clean-code + reader + humanizer + triad. Ready.`

### Conflict order (code quality)

1. Safety / user override  
2. Spec G1–G4  
3. **Karpathy** (stop overbuild / drive-by)  
4. **Clean Code** + `04` / `08` (how clean looks)  
5. Caveman (voice only)  
6. Optionals  

---

## Frontend → Impeccable (always ON inside triad)

When `/spec-kit-openspec-superpowers` / `/super-spec` touches frontend, **auto-load Impeccable** (setup + polish/craft). Same posture as agent-browser for UI proof. Detail: [impeccable-frontend.md](impeccable-frontend.md).

Do **not** treat Impeccable as optional for Vue/CSS/forms/views. Opt out only: `no impeccable` / `skip polish`.

## OPTIONAL load (keyword / task triggered)

Load only when the task needs them. Do not dump all into context.

| Trigger | Skill / rule | When |
|---------|----------------|------|
| (moved) FE Vue/CSS/forms | `impeccable` | **Always ON** for FE — see section above |
| `AI pick my UI`, examples storefront | `laravel-ui-phase` | Post-MVP UI |
| Anti-slop landing / catalog | `design-taste-frontend` | Marketing UI |
| Laravel Eloquent / queues / Livewire depth | `laravel-specialist` | Backend Laravel depth |
| Greenfield MVP SDD | `spec-kit` | After mode = Spec-Kit |
| Post-MVP change order | `openspec` | After mode = OpenSpec |
| TDD / debug / verify | `superpowers` | Phase 4+ (default during implement) |
| G4 / before merge / `review` / agent-written slice | **`code-review-and-quality`** | Five-axis quality stage — [code-review-combo.md](code-review-combo.md) |
| Spec conformance spawn | `requesting-code-review` | G4 step 1 (does code match spec?) |
| Architecture decision | `senior-architect` | Explicit ask |
| Study packet / learn codebase | `system-study-packet` / `8-principle-study` | Explicit ask |
| PL Direct Book only | `02-pl-seven-product-scope` etc. | Already alwaysApply in PL repos |
| Playwright test audit only | `review` | Test anti-patterns — **not** general code review |

Impeccable is **not** optional for FE under the triad (auto-on). Other optionals: `also load laravel-specialist` / `@design-taste-frontend`.

**G4 review combo:** step 1 `requesting-code-review` (spec) → step 2 **`code-review-and-quality`** (five axes). Prefer quality skill over thin Sentry `code-review` (do not dual-load). Opt out: `skip review` / `no code-review`.

---

## One-line kickoffs (copy/paste)

**Full preferred combo (always stack):**
```text
/spec-kit-openspec-superpowers
```
→ agent loads ALWAYS table, then triages. FE tasks auto-load Impeccable.

**Same + explicit caveman triad phrase:**
```text
/Caveman spec kit Openspec Superpower
```

**Add optionals:**
```text
/super-spec Standard: … also laravel-specialist
```

**Opt out of a always piece (rare):**
```text
/super-spec — no caveman
/super-spec — skip humanizer this turn
/super-spec — skip karpathy
/super-spec — skip clean-code
```

---

## Conflict order (if two layers disagree)

1. Safety / no-fabrication / user explicit override  
2. Spec gates G1–G4 (triad)  
3. Project PL / scope rules  
4. **Karpathy** (anti-overbuild / surgical)  
5. **Clean Code** + reader-loved + `04` (how clean looks)  
6. Humanizer (prose)  
7. Caveman (voice compression only — never drop technical accuracy)  
8. Optional skills  

Caveman = talk. Humanizer = shipped prose. Karpathy + clean-code = stop bad agent code. Triad = when to code.
