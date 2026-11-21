import { CLAUDE_API_HEADERS } from "../shared.js";

// JetBrains AI — Grazie gateway (ingrazzio-cloud-prod.labs.jb.gg).
// Free tier: 3 AI credits ($3) per 30-day window. Requires JetBrains IDE license.
// Auth: OAuth device flow via oauth.account.jetbrains.com, bearer token to Grazie.
// ⚠️ TOS: JetBrains gates this service to IDE use. Proxy use may violate terms.
const BASE = "https://ingrazzio-cloud-prod.labs.jb.gg";
const GRAZIE_HEADERS = {
  "Grazie-Agent": '{"name":"junie:cli","version":"3013.7"}',
  "X-Keep-Path": "true",
  "X-Accept-EAP-License": "false",
  "Accept-Encoding": "identity",
};

export default {
  id: "jetbrains-ai",
  alias: "jbai",
  uiAlias: "jbai",
  category: "oauth",
  authModes: ["oauth", "apikey"],
  hasOAuth: true,
  display: {
    name: "JetBrains AI",
    icon: "code",
    color: "#6B57FF",
    textIcon: "JB",
    website: "https://www.jetbrains.com/ai/",
    notice: {
      signupUrl: "https://www.jetbrains.com/ai/",
    },
  },
  transport: {
    baseUrl: `${BASE}/v1/chat/completions`,
    headers: { ...GRAZIE_HEADERS, "X-LLM-Model": "openai" },
    auth: { combined: true, header: "Authorization", scheme: "bearer" },
    usage: { url: `${BASE}/auth/test` },
  },
  // Multi-endpoint: OpenAI models on /v1/chat/completions, Claude on /v1/messages.
  // X-LLM-Model header is set per-transport; the executor's grazieHeaders hook
  // overrides it per model family for the OpenAI transport.
  transports: [
    {
      format: "openai",
      baseUrl: `${BASE}/v1/chat/completions`,
      headers: { ...GRAZIE_HEADERS, "X-LLM-Model": "openai" },
      auth: { combined: true, header: "Authorization", scheme: "bearer", hooks: ["grazieHeaders"] },
    },
    {
      format: "claude",
      baseUrl: `${BASE}/v1/messages`,
      headers: { ...CLAUDE_API_HEADERS, ...GRAZIE_HEADERS, "X-LLM-Model": "anthropic" },
      auth: { combined: true, header: "Authorization", scheme: "bearer", hooks: ["grazieHeaders"] },
    },
  ],
  oauth: {
    clientId: "junie-cli",
    authorizeUrl: "https://junie.jetbrains.com/cli-auth",
    tokenUrl: "https://oauth.account.jetbrains.com/oauth2/token",
    refreshUrl: "https://oauth.account.jetbrains.com/oauth2/token",
    scope: "offline_access openid jb-authn-service",
    codeChallengeMethod: "S256",
    redirectUri: "http://127.0.0.1:62345/auth/callback",
    fixedPort: 62345,
    callbackPath: "/auth/callback",
    refresh: { encoding: "form" },
  },
  // Models from Junie CLI v3013.7 — Grazie profile IDs with upstream mapping.
  // ponytail: model list ceiling — update from JAR decompile or llm24.net/llm/junie.txt
  models: [
    // Claude (Anthropic) — these use /v1/messages with X-LLM-Model: anthropic
    { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "claude-opus-5", name: "Claude Opus 5" },
    { id: "claude-opus-4-8", name: "Claude Opus 4.8" },
    { id: "claude-opus-4-7", name: "Claude Opus 4.7" },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
    { id: "claude-fable-5", name: "Claude Fable 5" },
    { id: "claude-fable-5-1", name: "Claude Fable 5.1" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
    // OpenAI — these use /v1/chat/completions with X-LLM-Model: openai
    { id: "openai-gpt-6-astra", name: "GPT-6 Astra" },
    { id: "openai-gpt-5-5", name: "GPT-5.5" },
    { id: "openai-gpt-5-4", name: "GPT-5.4" },
    { id: "openai-gpt-5-4-mini", name: "GPT-5.4 Mini" },
    { id: "openai-gpt-5-4-nano", name: "GPT-5.4 Nano" },
    { id: "openai-gpt-5-3-codex", name: "GPT-5.3 Codex" },
    { id: "openai-gpt-5-2", name: "GPT-5.2" },
    // Grok (xAI) — /v1/chat/completions with X-LLM-Model: grok
    // ponytail: Grok needs /v1/responses for reasoning+tools combo; /v1/chat/completions works for basic chat.
    { id: "grok-4.6", name: "Grok 4.6" },
    { id: "grok-4.5", name: "Grok 4.5" },
    { id: "grok-4.3", name: "Grok 4.3" },
    // Gemini — NOT included: requires Vertex-style generateContent path, not OpenAI-compatible.
    // Add when a gemini executor or dedicated transport is implemented.
  ],
  features: {
    usage: true,
  },
};
