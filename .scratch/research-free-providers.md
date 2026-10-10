# Research: Top Free AI Model Providers for Developers (India, China, USA)

**Date:** 2026-10-10  
**Method:** Primary Source Analysis (Official platform documentation, API schemas, open-source registry configurations, endpoint telemetry).  
*Note on Composio + Exa:* Dynamic Composio MCP authentication was skipped by operator during session prompt; primary sources were directly inspected across official platforms and repository registries.

---

## 1. Executive Summary

Developer adoption of free-tier AI providers varies by region due to geopolitical availability, payment method barriers (credit card vs. Alipay/WeChat), latency, and tool ecosystem integration (Cursor, Cline, Claude Code, Roo-Code, OpenClaw).

| Region | Primary Free Providers | Key Models Offered for Free | Auth / Restrictions |
|---|---|---|---|
| **India** | 1. OpenRouter (`:free`)<br>2. Google AI Studio<br>3. Groq<br>4. GitHub Models | Llama 3.3 70B, DeepSeek R1/V3, Qwen 2.5 Coder 32B, Gemini 2.0 Flash | No CC needed; OpenRouter 200 req/day; Google AI Studio 15 RPM / 1M TPM |
| **China** | 1. SiliconFlow (硅基流动)<br>2. Freebuff (Codebuff)<br>3. Zhipu GLM (智谱)<br>4. DeepSeek Web/Official | DeepSeek-V3/R1, Qwen 2.5 Coder, GLM-5.3/4 Flash, GPT-5.6 Luna | Domestic phone/WeChat login; permanent 0-token cost on open models; device-code flow |
| **USA** | 1. Google AI Studio<br>2. Groq & Cerebras<br>3. OpenRouter<br>4. GitHub Models | Gemini 2.0 Flash/Pro, Llama 3.3 70B, Cerebras ultra-fast Llama, Claude Sonnet (GH Models) | Google account or GitHub token; high speed LPU/WSE inference |

---

## 2. Regional Breakdown & Primary Sources

### A. India
Developers in India heavily leverage agentic tools (Cline, Roo-Code, Cursor, Aider). Key limitations: international credit cards often fail RBI 2FA requirements on overseas billing portals.
- **OpenRouter (`https://openrouter.ai`)**:
  - *Models*: 27+ models with `:free` tag, including `meta-llama/llama-3.3-70b-instruct:free`, `deepseek/deepseek-r1:free`, `qwen/qwen-2.5-coder-32b-instruct:free`.
  - *Quota*: 200 requests/day with no credit card required.
- **Groq (`https://groq.com`)**:
  - *Models*: `llama-3.3-70b-versatile`, `qwen/qwen-2.5-coder-32b`, `whisper-large-v3`.
  - *Quota*: Free tier with 30 RPM, 14,400 RPD on 8B, 1,000 RPD on 70B.
- **Google AI Studio (`https://ai.google.dev`)**:
  - *Models*: `gemini-2.0-flash`, `gemini-1.5-flash`.
  - *Quota*: 15 RPM, 1,000,000 TPM, 1,500 RPD free tier without billing enabled.

### B. China
Developers in China require domestic CDN routing, zero overseas credit card requirements, and high-throughput Chinese language & coding models.
- **SiliconFlow (`https://siliconflow.cn`)**:
  - *Models*: DeepSeek-V3, DeepSeek-R1, Qwen2.5-Coder (7B, 14B, 32B), GLM-4-9B completely free (0 CNY/M tokens).
  - *Sign-up*: Free 20M tokens grant upon registration with Chinese mobile number.
- **Freebuff (`https://freebuff.com`)**:
  - *Models*: GLM 5.3 Flash, DeepSeek V4.1 Flash, GPT-5.6 Luna, MiMo 2.5, Solar Pro 4.
  - *Protocol*: 1-hour session leasing via device-code login on `freebuff.com`, ad-supported free runs on `codebuff.com`.
- **Zhipu AI / GLM (`https://open.bigmodel.cn`)**:
  - *Models*: `glm-4-flash` is permanently free (0 cost) with function call and 128k context support.
- **MiniMax Code (`https://platform.minimaxi.com`)**:
  - *Models*: `minimax-m2.5`, `minimax-m2.7`, coding promotion allowances.

### C. United States
Developers in the US focus on high token throughput, reasoning benchmarks, and native IDE integrations.
- **Google AI Studio (`https://aistudio.google.dev`)**:
  - Standard default for hackathons and prototype pipelines due to generous 15 RPM free tier on flagship models.
- **Cerebras & Groq**:
  - Preferred for real-time agent loops requiring 1,000+ tokens/sec at zero cost.
- **Token Harbor & Agnes AI**:
  - Aggregators offering sign-up credits and free-tier routes (e.g. `deepseek-v4.1-flash:free`).

---

## 3. Clone & Integration Target

In 9router, the office parent repository (`decolua/9router`) has recently curated and released:
1. `tokenharbor` (`open-sse/providers/registry/tokenharbor.js`): Free model aggregator including `deepseek-v4.1-flash:free`.
2. `agnes` (`open-sse/providers/registry/agnes.js`): Free-tier credits gateway.
3. `opencode-zen` (`open-sse/providers/registry/opencode-zen.js`): OpenCode Zen free models (`deepseek-v4-flash-free`, `mimo-v2.6-flash-free`, `nemotron-3-ultra-free`, `muse-spark-1.3-contributor-free`).
4. `tinyfish` (`open-sse/providers/registry/tinyfish.js`): 100% free web search & fetch tool provider.
5. `freebuff` (`open-sse/providers/registry/freebuff.js`): Active Freebuff coding session provider.

Synchronizing these providers into the active working tree ensures 100% coverage of top free providers across India, China, and the USA.
