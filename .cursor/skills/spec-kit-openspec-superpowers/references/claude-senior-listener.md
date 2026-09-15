# Claude Senior + Cursor Listener + agent-browser

**Default every session** when `spec-kit-openspec-superpowers` is active (pgi-core-frontend).  
Mirror rule: `.cursor/rules/08-claude-senior-listener.mdc` · `~/.cursor/rules/claude-senior-listener.mdc`

## Goal

Fewer Cursor tokens. Claude = Senior implementer. Cursor = thin listener + follow-up + verify.

## Roles

| Who | Job |
|-----|-----|
| **Claude Senior** | Spec, design, code, debug, review — heavy thinking |
| **Cursor** | Listen, route, apply Claude output, short status, verify |
| **agent-browser** | UI smoke when page/dropdown/form must be proven in browser |

## Session default (ON)

Every coding session under this skill starts in **listener posture**:

1. Prefer Claude-model `Task` for **heavy** work (`claude-opus-4-8-thinking-high` or `claude-sonnet-5-thinking-high`).
2. **Size gate:** tiny Quick (1 file, label/typo/format, &lt;~20 lines, clear ask) → **Cursor solo**. Do **not** spawn `Task` (slow hang — 2026-07-22). User saying `use claude` on tiny still → solo unless they insist after you note size.
3. If user pastes Claude plan/diff → follow it; do not rival-redesign.
4. Short caveman replies. No re-explore of settled files.
5. Spec gates (G1–G4) still apply — listener does not skip OpenSpec.

### Opt out

User says: `normal cursor` · `you do it` · `cursor lead`

### Explicit reinforce

User says: `claude senior` · `listener mode` · `follow claude`

## agent-browser (when needed)

Load skill `agent-browser` → `agent-browser skills get core` before first CLI use.

| When | Do |
|------|----|
| UI / dropdown / form / print / visual bug | Reproduce in browser before claiming fixed |
| G4 UI acceptance | Smoke target URL (`APP_URL` from `.env`, e.g. Herd) |
| After Vue filter/cascade change | Open page → snapshot → click control → confirm options |
| Chrome CDP fail locally | Fall back to Cursor IDE browser MCP; note blocker |

### Loop

```bash
agent-browser open <APP_URL/path>
agent-browser snapshot -i
agent-browser click @eN
agent-browser snapshot -i
```

If launch fails (`DevToolsActivePort`): `--args "--no-sandbox"` or IDE browser MCP.

Do **not** run agent-browser for pure PHP/API/docs-only tasks.

## Phase hooks

| Phase | Claude Senior | Cursor | agent-browser |
|-------|---------------|--------|---------------|
| 0–2 Spec/plan | Draft / confirm | Thin gate G1–G2 | Skip |
| 3 UI design | Design notes | Impeccable + confirm G3 | Optional mock check |
| 4 Implement | Heavy → Claude Task or paste; tiny → Cursor solo | Apply / TDD / verify | On UI keywords |
| G4 / done | — | Evidence in `progress.md` | Required if UI changed |

## Anti-patterns

- Cursor re-does Claude’s full analysis
- Skipping G1 because “listener mode”
- agent-browser on every tiny edit with no UI surface
- Long dual plans (Claude plan + Cursor rival plan)
- Spawning Claude `Task` for a one-line / label / format Quick fix
- Waiting on subagent when foreground edit would finish in seconds
