# GhostCLI as a Provider

Status: ready-for-agent

## Problem Statement

GhostCLI (https://ghostcli.dev) sells flat-price access to a small catalog of code-focused frontier Models — Claude Opus 5, Claude Sonnet 5, Claude Fable 5.1 and GLM 5.3 — behind an OpenAI-compatible endpoint. An Operator who wants the Router to reach those Models, and to Fallback across them alongside their other Providers, today has only the anonymous compatible-node path: paste a base URL, paste a key, and see whatever raw upstream error comes back.

That path is wrong for this Provider in three specific ways:

- The gateway documents **no `GET /v1/models`**, so a compatible node built on the generic models-list probe reports failure or an empty catalog.
- Its two non-auth rejections — `402` (API access add-on not bought or expired) and `403` (calling IP not on the dashboard allowlist) — are **not** bad-key conditions, yet every existing probe treats `403` as a bad key and the generic chat fallback treats `402` as *success*. The Operator is told the wrong thing, in the exact two cases where the fix is in the GhostCLI dashboard, not in the Connection.
- The catalog is four fixed Model ids with per-plan gating (Fable 5.1 needs the Max plan), which no dynamic fetcher will ever reveal.

## Solution

Register GhostCLI as a first-class `apikey` Provider in the registry, with its four Models declared statically and a per-provider probe adapter that maps each rejection to the cause the Operator can actually act on. The Client-facing surface does not change: a Client asks the Router for `ghostcli/claude-opus-5` (or the `ghost/…` alias) and gets a normal streamed reply, and the Model becomes selectable in Combos and Fallback tiers like any other Provider.

Prerequisite gates (paid add-on, IP allowlist) are surfaced where the Operator already looks when adding a Connection — the Provider's own notice text — so the failure is explained before the first request, not after.

## User Stories

1. As an Operator, I want GhostCLI listed with the other API-key Providers when I add a Connection, so that I don't have to remember its base URL or hand-config a compatible node.
2. As an Operator, I want to paste a `gcli_…` key and have the Router tell me whether the key itself is accepted, so that I know whether to go back to the dashboard or fix my billing.
3. As an Operator, I want an expired API-access add-on reported as "API access add-on" rather than "Invalid API key", so that I renew the right thing instead of regenerating a perfectly good key.
4. As an Operator, I want an unapproved source IP reported as an IP-allowlist problem, so that I add the machine's egress IP instead of assuming my key was revoked.
5. As an Operator, I want the free-plan daily ceiling named when I hit it, so that I understand a `429` is a plan limit and not the Router thrashing my key.
6. As an Operator, I want the four Model ids offered as a fixed catalog with display names, so that the Model picker shows me exactly what the subscription covers instead of an empty list.
7. As an Operator, I want to know up front that Claude Fable 5.1 requires the Max plan, so that a rejection from that one Model doesn't look like a Router bug.
8. As an Operator, I want to use GhostCLI Models in a Fallback tier order, so that a quota wall on one Connection slides to the next instead of failing the Client's turn.
9. As an Operator, I want to put GhostCLI in a Combo, so that its Models participate in the same auto-switch and fusion behaviour as my other Providers.
10. As an Operator on a hosted deploy, I want the docs to say that a rotating datacenter egress IP fights GhostCLI's IP allowlist, so that I don't deploy the Router to a free PaaS and then chase an auth error I cannot pin.
11. As a Client (a coding tool pointed at the Router), I want to request `ghostcli/claude-opus-5` and receive a normal chat response in my own Format, so that no Client-side config changes beyond the model name.
12. As a Client, I want tool calling to work through the Router to this Provider, so that agent loops keep functioning when this Provider is selected.
13. As a Client, I want streaming to pass through token by token, so that I don't wait for the whole reply.
14. As a maintainer, I want the Provider's whole definition in one registry file — identity, display, transport, catalog — so that reading one file explains the integration, matching the shape of the neighbouring reseller entries.
15. As a maintainer, I want the reason the catalog is hand-maintained recorded in a comment alongside the date it was checked, so that nobody "fixes" it by adding a models fetcher against an endpoint that isn't documented.
16. As a maintainer, I want the probe's status-to-cause mapping asserted by a unit test with a stubbed fetch, so that a future edit to the shared probe can't silently turn a `402` back into a pass.
17. As a maintainer, I want the alias for this Provider to be checked against existing aliases, so that `resolveProviderAlias` keeps one unambiguous meaning per short name.
18. As a contributor, I want the test to follow the existing provider-test file's structure, so that I don't have to learn a new harness to validate a registry entry.
19. As a reviewer, I want no new seams and no schema change in this work, so that the diff is a registration plus one probe adapter plus a test.
20. As an Operator, I want the Connection form to link me to where keys, IP approval and API access are managed, so that I never go looking for those three things in the product docs.
21. As an Operator, I want a bad-key verdict to be cached nowhere, so that fixing the dashboard state and re-testing gives an immediate answer.
22. As a maintainer, I want the four upstream Model ids recorded exactly as GhostCLI names them, so that the Router sends what the gateway expects rather than a prettified variant.

## Implementation Decisions

**One new registry entry, no new seams.** Everything below lands in the existing Provider-registration path; `PROVIDERS`, `PROVIDER_MODELS`, the executor selection and the dashboard Provider list are all derived from it.

- Provider id `ghostcli`; short alias `ghost`. `gc` is already taken by the Gemini CLI provider and `gcli` by the Grok CLI provider, both verified in the registry — do not reuse either. The alias must also be checked against `resolveProviderAlias` collisions at implementation time.
- Category and auth type: `apikey`, the same shape as the other marketplace-gateway entries (AgentRouter, UnoRouter, Cavoti). No OAuth, no cookie/session handling, so no database or Connection-shape change.
- Transport: OpenAI Chat Completions at the vendor's chat-completions endpoint, default `openai` Format. The vendor also speaks Anthropic Messages, OpenAI Responses and Gemini GenerateContent on the same key; **only Chat Completions is wired** — the Router translates Formats internally, so a second Format is dead code for Clients and doubles the probe surface for no operator-visible gain.
- Catalog: four entries declared statically — `claude-opus-5`, `claude-sonnet-5`, `claude-fable-5.1`, `z-ai/glm-5.3` — each 1M context / 128K max output, with the plan gate noted (Fable 5.1 = Max, rest = Pro). `z-ai/glm-5.3` keeps its slash: it is the vendor's Model id and the request must echo it.
- No `modelsFetcher` and no `validateUrl`: the vendor documents neither `GET /v1/models` nor a validation endpoint, so a dynamic fetcher would 404. `passthroughModels` stays off — the catalog is genuinely closed and a typo should fail locally instead of being forwarded upstream.
- Default Model is the first catalog entry (`claude-opus-5`), which is what `getDefaultModel` returns for every other Provider and is what the probe sends.
- **A per-provider probe adapter is required, and its reason is the interesting part of this change.** Without one, the shared probe's generic OpenAI path does this: try the models URL (derived by rewriting the chat-completions URL), then fall back to a one-token chat POST whose validity test is "status is not 401 and not 403". Against GhostCLI that yields two wrong answers — an expired add-on (`402`) passes as *valid*, and an unapproved IP (`403`) reports *"Invalid API key"*. The adapter keys on the provider id inside the shared probe's per-provider adapter table and maps the observed statuses to causes, in this order of specificity:
  - `401` → key invalid or revoked (also catches a key pasted with a trailing space)
  - `402` → API access add-on not purchased or expired
  - `403` → source IP not authorized on the dashboard allowlist
  - `429` → free-plan daily ceiling (5 messages/day, resets in UTC)
  - `404` → base URL wrong (the vendor's own docs flag `…/v1/v1/messages`-style mistakes, and the upstream CLI misreports this as a model problem)
  - any other status, including `200` and `400`/`529` → accepted; a `400` still proves the credential was read.
  This mirrors the existing adapters' stance (the xAI and Xiaomi token-plan adapters both special-case `403` because it means something other than "bad key" there).
- The probe sends the minimum one-token chat request through the same transport the real traffic uses, and must be handed the caller's fetch so proxy-aware deployment paths keep working — the shared probe already takes an injectable fetch implementation for exactly this.
- Operator-facing notice: the Provider's display block points at the vendor dashboard for key creation, and the notice copy names the three gates — key, IP approval, API access add-on — so the prerequisite is stated at Connection-creation time.
- Plan gating is **not** modelled. All four Models are offered; an unentitled Model fails upstream and the error surfaces. Detecting plan from a key is not documented as possible, and filtering the catalog on a guess would hide Models the Operator can pay for.
- The registry file carries a dated comment recording what was verified and from where, following the same convention as the neighbouring marketplace-gateway entries.
- Local env plumbing for probing this Provider by hand already landed as a gitignored scratch env template; the key is read from there or the shell, never from the repo's runtime env contract, because Provider credentials in this product live in saved Connections.

## Testing Decisions

- Test external behaviour only, at the seams that already exist: the registry data, the derived `PROVIDERS` / `PROVIDER_MODELS` maps, alias resolution, `DefaultExecutor`'s built URL and headers, and the shared probe function with a stubbed fetch. No new seam is introduced for this.
- Prior art is the existing single-provider test for AgentRouter, which asserts exactly this shape (registry category and URL, spoofed headers where relevant, passthrough and alias resolution, executor URL and bearer auth, and a registry-id uniqueness sweep). The probe assertions follow the compatible-node validation route test, which stubs `global.fetch`, returns synthesised statuses and asserts both the verdict and how many times fetch was called — including the case where a first probe fails and a second must not be attempted.
- A new provider test should assert: registration as an apikey Provider with the chat-completions URL and default Format; all four Model ids present with `claude-opus-5` as the default; alias resolution; the executor emitting `Authorization: Bearer gcli_…` against the right URL; and the probe matrix — one case per status above, with `402` and `403` explicitly asserted to produce their distinct causes and **not** the strings "Invalid API key" or a valid verdict.
- No live network in unit tests. A real end-to-end check against GhostCLI is manual: load the scratch env, allowlist the machine's IP, confirm the add-on is active, then send one chat request and one 1-token probe.
- Run from the `tests/` directory with the repo's vitest config, scoped to the new file, plus the existing provider and validation-route tests to catch regressions in the shared probe.

## Out of Scope

- Wiring the Anthropic Messages, OpenAI Responses or Gemini Formats to this Provider; the Router's internal translation covers Clients on those Formats already.
- Surfacing GhostCLI in the CLI-tool cards (the Claude Code and Codex guides), which point the vendor CLIs directly at a base URL instead of through the Router.
- Per-plan Model filtering, entitlement sniffing from the key, or any attempt to distinguish Pro from Max before a request.
- Automating the API-access add-on purchase or the IP allowlist; both are dashboard actions for a human.
- Multi-key rotation, per-key quota display, usage metering, or cost tracking for this Provider.
- Combo presets or i18n documentation touching this Provider.
- Anything about Render free-tier egress, which is a separate spec already in the tracker.

## Further Notes

- **Seam confirmation is deferred, not waived.** The spec was written while the author was away, so the reviewer should veto the seams before implementation if they wanted a different cut: the proposal uses only existing seams (registry entry, shared probe, executor build methods) and adds none.
- The single highest-risk assumption in this spec is that GhostCLI has no model-listing endpoint. Everything about the static catalog rests on it. First live probe should try `GET /v1/models` anyway — if it answers, the catalog should switch to a dynamic fetcher and this spec's transport decision is amended.
- A `permission_error` code in an Anthropic-shaped error envelope was observed coming off this host. The vendor's own error table has no such row; it belongs to the `401`/`402`/`403` family, so the probe's mapping above covers it. If it turns up with a `200`, that is new information and worth an ADR.
- Hosted deploys interact badly with the IP allowlist: a free PaaS rotates egress IPs, so a Connection that works at 09:00 is a `403` by 18:00. Recommend documenting this Provider as local/VPS-first rather than working around it in the Router.
- The vendor is a reseller of upstream capacity on a flat unlimited plan. Expect occasional capacity and quality surprises under load; Fallback tiers are the operator's mitigation and need no code here.
