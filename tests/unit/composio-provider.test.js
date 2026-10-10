import { describe, expect, it } from "vitest";

import REGISTRY from "../../open-sse/providers/registry/index.js";
import { PROVIDERS, PROVIDER_MODELS } from "../../open-sse/providers/index.js";
import { getExecutor } from "../../open-sse/executors/index.js";
import { DefaultExecutor } from "../../open-sse/executors/default.js";

describe("Composio provider", () => {
  const entry = REGISTRY.find((e) => e.id === "composio");

  it("is registered as an apikey provider", () => {
    expect(entry).toBeDefined();
    expect(entry.category).toBe("apikey");
    expect(entry.authType).toBe("apikey");
    expect(entry.alias).toBe("composio");
    expect(entry.aliases).toContain("comp");
  });

  it("points at the verified Composio v3.1 base URL", () => {
    expect(PROVIDERS.composio.baseUrl).toBe("https://backend.composio.dev/api/v3.1");
    expect(PROVIDERS.composio.validateUrl).toBe("https://backend.composio.dev/api/v3.1/toolkits");
    expect(PROVIDERS.composio.format).toBe("openai");
  });

  it("enables passthrough models", () => {
    expect(entry.passthroughModels).toBe(true);
  });

  it("exposes Composio Bench seed models", () => {
    const ids = (PROVIDER_MODELS.composio || []).map((m) => m.id);
    expect(ids).toContain("gpt-6.1-sol");
    expect(ids).toContain("kimi-k3");
    expect(ids).toContain("claude-opus-5.5");
    expect(ids).toContain("deepseek-v4-pro");
  });

  it("routes through DefaultExecutor", () => {
    expect(getExecutor("composio")).toBeInstanceOf(DefaultExecutor);
  });

  it("keeps every registry id unique", () => {
    const ids = REGISTRY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
