# 01: Freebuff Provider Registry & Model Catalog

**What to build:** Register Freebuff as a first-class free provider in the 9Router catalog with its official model roster, category classification, and OpenAI-compatible transport definitions so it automatically appears across the dashboard and API routes without manual configuration.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] Provider registered under `freebuff` with alias `fb` and category `free`
- [x] Model roster exposes GLM 5.3 Flash, DeepSeek V4.1 Flash, GPT-5.6 Luna, MiMo 2.5, Solar Pro 4, Muse Spark 1.2, and Claude Fable 5
- [x] UI card metadata configured with branding icon, color (#84CC16), badge, and model-lock warning notice
- [x] Transport points to official endpoint `https://www.codebuff.com/api/v1/chat/completions` with 429 and 503 retry policies
- [x] Models resolve correctly in `/api/v1/models` and pass multi-model translator matrix tests
