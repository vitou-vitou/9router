# Research: Composio Provider Integration for 9Router

**Date:** 2026-10-10  
**Author:** 9Router Engineering  
**Method:** Primary Source Analysis (Official platform documentation, API endpoints, SDK schemas, GitHub repository telemetry, Composio Bench interface).

---

## 1. Executive Summary

Composio ([composio.dev](https://composio.dev)) provides managed authentication, tool discovery, and sandboxed remote code execution across 1,000+ toolkits (GitHub, Slack, Jira, Gmail, etc.) for AI agents via Tool Router (MCP) and SDK adapters. In addition, Composio Bench (`https://dashboard.composio.dev/~/bench`) provides a testing and evaluation workbench for evaluating frontier models with tool-augmented workflows.

### Investigation Question
> "Find existing working one or create new one for Composio as provider in this project environment."

### Findings
1. **Existing Implementations in 9Router / Upstream:**
   - Scanned `decolua/9router` repository, git commit history, and upstream issues (`#4431`, `#230`, `#4570`, etc.).
   - No built-in `composio` provider existed in `open-sse/providers/registry/` yet.
   - External projects (e.g. `OmniRoute`) reference Composio tool schema formatting, but no native registry provider entry had been landed.
2. **Platform & Authentication Specification:**
   - **Base URL:** `https://backend.composio.dev/api/v3.1` (Current REST API; legacy v3.0 deprecated per official docs `https://docs.composio.dev/llms.txt`).
   - **Auth Type:** API Key with `ak_` prefix (Platform Project API Key created at `https://dashboard.composio.dev/settings` or `https://dashboard.composio.dev/~/project/settings/api-keys`). Consumer `ck_` keys are rejected.
   - **Auth Header:** `x-api-key` header (supported alongside standard bearer authentication).
3. **Bench Models (from `https://dashboard.composio.dev/~/bench`):**
   - Official Bench model runner exposes frontier evaluation models as verified in dashboard telemetry:
     - `gpt-6.1-sol` (GPT-6.1 Sol)
     - `kimi-k3` (Kimi K3)
     - `claude-opus-5.5` (Claude Opus 5.5)
     - `deepseek-v4-pro` (DeepSeek V4 Pro)
   - Configuration requires `passthroughModels: true` to forward any arbitrary tool/model identifier configured in workspace sessions.

---

## 2. Primary Source Evidence

- **Composio Documentation Index:** `https://docs.composio.dev/llms.txt`
  - Current REST API version is v3.1 (`https://backend.composio.dev/api/v3.1`).
  - Tool Router exposes isolated MCP sessions with scoped toolkits and workbench sandboxes.
- **API Key Management:** `https://dashboard.composio.dev/settings`
  - Keys follow the format `ak_[a-zA-Z0-9]+`.
- **Composio Workspace Bench:** `https://dashboard.composio.dev/pakvitou168_workspace/~/bench`
  - Bench workspace interface allows executing tasks with model selection across frontier reasoning and code models.

---

## 3. Integration Plan & Registry Architecture

1. **Registry Entry (`open-sse/providers/registry/composio.js`):**
   - `id`: `"composio"`
   - `alias`: `"composio"`, `aliases`: `["comp", "composio-bench"]`
   - `category`: `"apikey"`
   - `display`: Name "Composio", icon "hub" / "extension", color "#EA580C", textIcon "CP".
   - `transport`: `baseUrl: "https://backend.composio.dev/api/v3.1"`, format `"openai"`, validateUrl `https://backend.composio.dev/api/v3.1/toolkits`.
   - `models`: Initial seed models matching Composio Bench selector (`gpt-6.1-sol`, `kimi-k3`, `claude-opus-5.5`, `deepseek-v4-pro`).
   - `passthroughModels`: `true`.
2. **Registry Index (`open-sse/providers/registry/index.js`):**
   - Register static import and append to `REGISTRY` export array.
3. **Icon Asset (`public/providers/composio.png`):**
   - Add Composio brand icon for dashboard display.
4. **Test Suite (`tests/unit/composio-provider.test.js`):**
   - Verify registry schema conformance, transport defaults, model seeds, and passthrough flags under `/tdd`.
