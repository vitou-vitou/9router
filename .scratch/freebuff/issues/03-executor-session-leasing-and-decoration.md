# 03: Freebuff Executor with Session Leasing & Wire Decoration

**What to build:** Execute chat completion requests against the upstream Codebuff engine by managing 1-hour session claims, registering dynamic agent runs (`/api/v1/agent-runs`), and applying required upstream wire decorations (Buffy prompt marker, `end_turn` tool definition, stripping reasoning tags).

**Blocked by:** 02 (Fingerprint Device-Code Authentication & Connection Probe).

**Status:** completed

- [x] Specialized `FreebuffExecutor` mapped to `freebuff` and `fb` executor registry
- [x] Requests claim or reuse an active 1-hour model session via `POST /api/v1/freebuff/session`
- [x] Every request dispatches a `START` agent run before streaming and issues best-effort `FINISH` on completion
- [x] Top-level `codebuff_metadata` (`cost_mode: "free"`, `client_id`, `run_id`, `trace_session_id`) decorated onto request payload
- [x] Canonical Buffy system prompt marker prepended idempotently to first system message
- [x] `end_turn` tool automatically injected whenever client declares tool calls
- [x] Client-provided `reasoning_effort` and `reasoning` properties stripped to prevent 400 parameter collisions
