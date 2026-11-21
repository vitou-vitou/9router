import { describe, it, expect } from "vitest";
import { openaiToOllamaRequest, normalizeOllamaModel } from "../../open-sse/translator/request/openai-to-ollama.js";
import ollamaLocal from "../../open-sse/providers/registry/ollama-local.js";
import { ollamaModels } from "../../open-sse/config/ollamaModels.js";

describe("ollama-local quant models and normalization", () => {
  describe("openaiToOllamaRequest with Qwen quant models", () => {
    it("normalizes Qwen3.5-9B (q4_k_m), maps options, stream, messages", () => {
      const body = {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello world" },
        ],
        temperature: 0.7,
        max_tokens: 512,
        top_p: 0.9,
      };

      const result = openaiToOllamaRequest("Qwen3.5-9B (q4_k_m)", body, true);

      expect(result.model).toBe("qwen3.5:9b-q4_k_m");
      expect(result.stream).toBe(true);
      expect(result.options).toEqual({
        temperature: 0.7,
        num_predict: 512,
        top_p: 0.9,
      });
      expect(result.messages).toEqual([
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello world" },
      ]);
    });

    it("normalizes Qwen3-0.6B (q4_k_m), maps options, stream, messages", () => {
      const body = {
        messages: [
          { role: "user", content: "Explain quantum computing briefly" },
        ],
        temperature: 0.2,
        max_tokens: 128,
      };

      const result = openaiToOllamaRequest("Qwen3-0.6B (q4_k_m)", body, false);

      expect(result.model).toBe("qwen3:0.6b-q4_k_m");
      expect(result.stream).toBe(false);
      expect(result.options).toEqual({
        temperature: 0.2,
        num_predict: 128,
      });
      expect(result.messages).toEqual([
        { role: "user", content: "Explain quantum computing briefly" },
      ]);
    });
  });

  describe("provider prefix and model normalization", () => {
    it("strips ol/ and ollama-local/ prefixes", () => {
      expect(normalizeOllamaModel("ol/Qwen3.5-9B (q4_k_m)")).toBe("qwen3.5:9b-q4_k_m");
      expect(normalizeOllamaModel("ollama-local/Qwen3-0.6B (q4_k_m)")).toBe("qwen3:0.6b-q4_k_m");
      expect(normalizeOllamaModel("ol/qwen3.5:9b")).toBe("qwen3.5:9b");
      expect(normalizeOllamaModel("ollama-local/qwen3.5:9b")).toBe("qwen3.5:9b");
    });

    it("normalizes uppercase Qwen models without quant", () => {
      expect(normalizeOllamaModel("Qwen3.5-9B")).toBe("qwen3.5:9b");
      expect(normalizeOllamaModel("Qwen3-0.6B")).toBe("qwen3:0.6b");
    });
  });

  describe("registry and fixture definitions", () => {
    it("contains Qwen models in ollama-local provider registry", () => {
      const modelIds = ollamaLocal.models.map((m) => m.id);
      expect(modelIds).toContain("qwen3.5:9b");
      expect(modelIds).toContain("qwen3.5:9b-q4_K_M");
      expect(modelIds).toContain("Qwen3.5-9B (q4_k_m)");
      expect(modelIds).toContain("qwen3:0.6b-q4_K_M");
      expect(modelIds).toContain("Qwen3-0.6B (q4_k_m)");
    });

    it("contains qwen3.5:9b in ollamaModels fixture", () => {
      const model = ollamaModels.models.find((m) => m.name === "qwen3.5:9b");
      expect(model).toBeDefined();
      expect(model).toEqual({
        name: "qwen3.5:9b",
        modified_at: "2026-01-01T00:00:00Z",
        size: 5500000000,
        digest: "qwen359bdigest",
        details: {
          format: "gguf",
          family: "qwen",
          parameter_size: "9B",
          quantization_level: "Q4_K_M",
        },
      });
    });
  });
});
