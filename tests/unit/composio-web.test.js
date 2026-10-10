import { describe, expect, it, vi } from "vitest";
import REGISTRY from "../../open-sse/providers/registry/index.js";
import { PROVIDERS, PROVIDER_MODELS } from "../../open-sse/providers/index.js";
import { getExecutor } from "../../open-sse/executors/index.js";
import { ComposioWebExecutor, parseVercelAiEvent } from "../../open-sse/executors/composio-web.js";

describe("Composio Bench Web Provider", () => {
  const entry = REGISTRY.find((e) => e.id === "composio-web");

  it("is registered as an apikey provider", () => {
    expect(entry).toBeDefined();
    expect(entry.category).toBe("apikey");
    expect(entry.authType).toBe("apikey");
    expect(entry.alias).toBe("composio-web");
    expect(entry.aliases).toContain("composio");
  });

  it("targets dashboard.composio.dev/api/arena endpoint", () => {
    expect(PROVIDERS["composio-web"].baseUrl).toBe("https://dashboard.composio.dev/api/arena");
    expect(PROVIDERS["composio-web"].executor).toBe("composio-web");
  });

  it("exposes the 4 frontier Bench models", () => {
    const ids = (PROVIDER_MODELS["composio-web"] || []).map((m) => m.id);
    expect(ids).toContain("gpt-6.1-sol");
    expect(ids).toContain("kimi-k3");
    expect(ids).toContain("claude-opus-5.5");
    expect(ids).toContain("deepseek-v4-pro");
  });

  it("resolves ComposioWebExecutor instance", () => {
    const executor = getExecutor("composio-web");
    expect(executor).toBeInstanceOf(ComposioWebExecutor);
  });

  it("correctly maps model aliases to Composio Arena slugs", () => {
    const executor = new ComposioWebExecutor();
    expect(executor.resolveArenaModel("gpt-6.1-sol")).toBe("openai/gpt-6.1-sol");
    expect(executor.resolveArenaModel("kimi-k3")).toBe("moonshotai/kimi-k3");
    expect(executor.resolveArenaModel("claude-opus-5.5")).toBe("anthropic/claude-opus-5.5");
    expect(executor.resolveArenaModel("deepseek-v4-pro")).toBe("deepseek/deepseek-v4-pro");
  });

  it("parses Vercel AI SDK UI message stream events into text and reasoning deltas", () => {
    const textEvent = parseVercelAiEvent('{"type":"text-delta","delta":"Hello world"}');
    expect(textEvent).toEqual({ delta: "Hello world" });

    const reasoningEvent = parseVercelAiEvent('{"type":"reasoning-delta","delta":"Thinking..."}');
    expect(reasoningEvent).toEqual({ reasoning: "Thinking..." });

    const finishEvent = parseVercelAiEvent('{"type":"finish","finishReason":"stop"}');
    expect(finishEvent).toEqual({ done: true });
  });

  it("converts mock Vercel AI stream to OpenAI non-streaming JSON", async () => {
    const executor = new ComposioWebExecutor();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"text-delta","delta":"Hello"}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"text-delta","delta":" from Composio!"}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"finish","finishReason":"stop"}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      body: stream,
    });

    try {
      const { response } = await executor.execute({
        model: "kimi-k3",
        body: { messages: [{ role: "user", content: "hi" }] },
        stream: false,
        credentials: { apiKey: "mock-session-cookie" },
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.object).toBe("chat.completion");
      expect(json.choices[0].message.content).toBe("Hello from Composio!");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("converts mock Vercel AI stream to OpenAI SSE stream", async () => {
    const executor = new ComposioWebExecutor();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"reasoning-delta","delta":"Let me think..."}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"text-delta","delta":"Answer here."}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      body: stream,
    });

    try {
      const { response } = await executor.execute({
        model: "gpt-6.1-sol",
        body: { messages: [{ role: "user", content: "hi" }] },
        stream: true,
        credentials: { apiKey: "mock-session-cookie" },
      });

      expect(response.status).toBe(200);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let chunks = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks += decoder.decode(value);
      }
      expect(chunks).toContain('"reasoning_content":"Let me think..."');
      expect(chunks).toContain('"content":"Answer here."');
      expect(chunks).toContain("data: [DONE]");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
