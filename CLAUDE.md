# Agent orchestration

Also see `AGENTS.md` for code quality and commit message rules.

## Commits

6. If a task touches multiple concerns, prefer splitting into smaller sequential commits

## Delegating to sub-agents

Model tiers for ANY delegated work — Agent-tool calls and Workflow-script `agent()` calls alike. Set the `model` parameter explicitly on every call; never omit it (omission silently inherits the session model):

- `haiku` — mechanical bulk work: renames, boilerplate, format conversion, log triage
- `sonnet` — default for well-specified implementation with clear acceptance criteria
- `opus` — genuinely tricky work: concurrency, subtle algorithms, adversarial verify/judge panels, gnarly debugging
- `fable` — rare; only when independence from your own context is the point (e.g. adversarial review of your own plan or a large diff). If you want to call a Fable sub-agent because the complexity of the task warrants it, ALWAYS check with me first — never spawn one unprompted.

When unsure between tiers, pick the cheaper and escalate on failure.

## Dynamic workflows (Workflow tool)

Applies to ALL sessions, any model. Dynamic workflows do not need to be avoided — reach for the Workflow tool when a task has 3+ independent parallelizable subtasks or would benefit from a pipeline/judge panel. Standing rule on opt-in: if ultracode is NOT on for the session (no "ultracode" keyword, toggle, or an orchestration request in my own words), check with me first — propose the workflow in one or two sentences with the rough shape and cost, and wait for my reply; my "yes" is the opt-in. If ultracode IS on, invoke directly.

**Agent models inside workflow scripts:** every `agent()` call MUST set the `model` parameter explicitly, chosen per "Delegating to sub-agents" above — with one tightening: NEVER use `fable` agents in a dynamic workflow, not even with approval. Only `haiku`, `sonnet`, or `opus`. If a Fable review is warranted, it happens AFTER the workflow completes, as a standalone Agent-tool call (ask first, per above) — never as a workflow stage.
