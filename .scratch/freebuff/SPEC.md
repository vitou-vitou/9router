<!-- ready-for-agent -->

# Freebuff Provider Integration Specification

## Problem Statement

Operators and Developers using 9Router need access to high-performance, free-tier coding models (such as GLM 5.3 Flash, DeepSeek V4.1 Flash, GPT-5.6 Luna, MiMo 2.5, and Solar Pro 4) without paying per-token API costs or having to run separate reverse-proxy daemons on their machines. Freebuff (by Codebuff) offers these free, ad-supported sessions through a browser-based device login, but Freebuff utilizes a private session/run leasing protocol rather than a standard OpenAI or Anthropic API key format. Prior to this integration, 9Router could not authenticate with Freebuff, could not negotiate Freebuff's mandatory run lifecycle (`/api/v1/agent-runs`) or 1-hour session leasing (`/api/v1/freebuff/session`), and failed when Freebuff rejected calls missing the CLI root system marker or `end_turn` completion tools.

## Solution

Integrate **Freebuff** natively into 9Router as a dedicated free-tier provider (`freebuff`, alias `fb`). Implement Freebuff's browser-based device-code login flow via `freebuff.com` to capture user authorization without requiring manual cookie extraction. Equip 9Router's routing engine with a specialized executor that automates session claiming and agent run leasing on `codebuff.com`, injects the canonical CLI system marker and tool declarations, handles regional and offer gating, and tracks daily Freebucks session quotas via non-destructive GET polling.

## User Stories

1. As an Operator, I want to see Freebuff listed under the Free providers catalog in the dashboard, so that I can easily discover and enable it.
2. As an Operator, I want to connect my Freebuff account via a browser device-code authentication flow, so that I do not need to hunt for session tokens or cookies manually.
3. As a Developer, I want to route requests to Freebuff models using standard OpenAI-compatible client libraries, so that I can use Freebuff in Cursor, Claude Code, Cline, and Codex CLI.
4. As a Developer, I want to access `deepseek/deepseek-v4-flash` for free, so that I can run high-throughput coding tasks without spending credits.
5. As a Developer, I want to access `z-ai/glm-5.3-flash` for free, so that I have fast completion generation.
6. As a Developer, I want to access `openai/gpt-5.6-luna`, so that I have advanced reasoning capabilities on supported tasks.
7. As a Developer, I want to access `mimo/mimo-v2.5`, so that I have access to Xiaomi's multi-lingual coding capabilities.
8. As a Developer, I want to access `upstage/solar-pro4`, so that I have diverse model redundancy.
9. As a Developer, I want to access `meta/muse-spark-1.2-contributor`, so that I can use Meta's contributor models.
10. As a Developer, I want the router to handle Claude Fable 5 wave trial offers dynamically, so that requests succeed when capacity is available and fail gracefully when closed.
11. As an Operator, I want the router to automatically lease and manage the 1-hour session token per model, so that requests execute reliably without manual session resets.
12. As an Operator, I want 9Router to register and finalize backend agent runs per request, so that the upstream Codebuff server does not reject queries as orphan turns.
13. As a Developer using function calling, I want the router to automatically inject the `end_turn` tool definition, so that upstream does not return a 404 endpoint mismatch error.
14. As an Operator, I want the router to prepend the required Buffy root system prompt, so that the upstream free-tier gate does not reject requests with 403 CLI required errors.
15. As an Operator, I want the router to strip client-side `reasoning_effort` tags before forwarding to Freebuff, so that the upstream engine does not reject requests with 400 parameter collisions.
16. As an Operator, I want session stale codes (428, 409, 410) to be caught and automatically re-leased with retry, so that transient session expirations do not fail active chat streams.
17. As an Operator, I want model lock conflicts (409 `model_locked`) to be surfaced clearly with cooldown timers, so that I understand why an account locked to one model cannot simultaneously serve another.
18. As an Operator, I want regional limited-mode rejections to be caught and labeled, so that I know to switch egress proxies or select limited-tier supported models.
19. As an Operator, I want to inspect my remaining daily Freebuff sessions and Freebucks wallet balance in the dashboard, so that I can plan my daily quota consumption.
20. As a System Administrator, I want quota polling to use GET requests exclusively, so that background usage checks never consume daily session units.
21. As an Operator, I want 9Router's Connection Test button to successfully validate Freebuff tokens using non-destructive status probes, so that I can verify connection health on demand.
22. As an Operator deploying 9Router to cloud containers or VPS environments, I want Freebuff proxy support to work with connection proxies, so that IP-restricted regions can route through allowed geo-egress nodes.
23. As a Test Engineer, I want isolated unit tests covering request transformation, marker idempotency, and agent root resolution, so that future router refactors do not break Freebuff compatibility.
24. As an Operator running multiple accounts, I want separate Freebuff logins to be managed cleanly in the database, so that each model can be assigned its own dedicated session.

## Implementation Decisions

- **Architecture Seam**: Introduce a specialized executor subclassing the base router executor and register a dedicated provider registry module. Upstream OpenAI-compatible translation formats are reused directly without introducing custom AST translation pipelines.
- **Dual-Host Protocol**: Split network responsibilities between:
  - Auth Host (`https://freebuff.com`): Handles device-flow fingerprint initialization and status polling.
  - Runtime Host (`https://www.codebuff.com`): Handles session claiming, agent run registration, chat completion proxying, and quota reads.
- **Device-Code Auth Flow**: Implement fingerprint-based polling. The backend generates a client UUID, requests a device verification URI, directs the user to sign in, and polls until an authorization bearer token is granted. The provider is registered in the non-PKCE device-code allowlists.
- **Wire Request Decoration**: The executor transforms standard chat completion requests by:
  - Injecting top-level metadata (`client_id`, `cost_mode: "free"`, `run_id`, `trace_session_id`, `freebuff_instance_id`).
  - Specifying provider fallback settings (`provider: { allow_fallbacks: false }`).
  - Idempotently prepending the canonical Buffy system marker (`You are Buffy, the strategic coding assistant.`) to `messages[0]`.
  - Appending the `end_turn` tool definition whenever custom tools are provided.
  - Stripping `reasoning_effort` and `reasoning` properties.
- **Session & Run Lifecycle**:
  - In-memory session cache keyed by `token::model` with 1-hour TTL.
  - Single-flight lock preventing redundant concurrent session initialization calls.
  - On-demand `START` run call before dispatching chat requests, followed by best-effort `FINISH` notification upon stream completion or cancellation.
  - Automatic single retry on session stale errors (428, 409, 410) with forced session re-claiming.
- **Non-Destructive Usage & Quota Handler**:
  - Bound to `GET /api/v1/freebuff/session`.
  - Strictly forbids `POST` during quota retrieval to prevent burning 1.0 unit of the daily session allocation.
  - Parses both legacy model rate limits and modern server-authoritative Freebucks balances and price notices.
- **Model Offer Gating**:
  - Special models (e.g., Claude Fable 5) query the backend offer availability before attempting session reservation, raising graceful capacity errors when closed.

## Testing Decisions

- **Test Seam**: Test request transformations at the executor seam using synthetic credentials and mock bodies; test registry integration and format roundtrips through the multi-provider translator matrix.
- **Behavioral Assertions**:
  - Executor transforms body to include `cost_mode: "free"` and valid metadata UUIDs.
  - Upstream provider block is declared with fallback disabled.
  - System prompt marker prepending is strictly idempotent across repeated transformations.
  - The `end_turn` tool is injected only when tools are present in the request.
  - Model identifiers correctly resolve to their corresponding root agent families.
  - State pruning and cache resets execute cleanly without memory leaks.
- **Prior Art**: Mirrors the test patterns of other specialized executors (`grok-cli`, `commandcode`, `opencode-go`, and `kiro`).

## Out of Scope

- Reverse engineering or bypassing Freebuff's backend regional IP enforcement (Operators must provide appropriate outbound proxies if in restricted jurisdictions).
- Paid Codebuff subscription credit billing modes (focused exclusively on the ad-supported / free tier).
- Automatic multi-account load balancing or round-robin rotation across multiple Freebuff credentials (handled by 9Router's existing combo/provider fallback layers).
- Translating non-chat modalities (image generation, audio, or embeddings) as Freebuff only exposes chat completion models.

## Further Notes

- Freebuff sessions lock an account to one active model for up to 1 hour. Requesting multiple distinct models concurrently on a single Freebuff account will return HTTP 409 (`model_locked`). Operators needing multi-model concurrency should connect multiple Freebuff connections or combine Freebuff with other providers using 9Router Combos.
