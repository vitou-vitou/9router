import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import http from "node:http";
import path from "node:path";
import {
  resolveSubagentModel,
  buildChatPayload,
  executeCompletion,
  runSubagent,
  runParallelSubagents,
  resolveImageToDataUri,
} from "../../scripts/mcp-subagent-runner.mjs";

describe("mcp-subagent-runner", () => {
  describe("resolveSubagentModel", () => {
    it("resolves 9r to 9r", () => {
      expect(resolveSubagentModel("9r")).toBe("9r");
    });

    it("resolves 9r1 to 9r1", () => {
      expect(resolveSubagentModel("9r1")).toBe("9r1");
    });

    it("resolves 9r2 to 9r2", () => {
      expect(resolveSubagentModel("9r2")).toBe("9r2");
    });

    it("resolves Qwen3.5-9B to qwen3.5:9b", () => {
      expect(resolveSubagentModel("Qwen3.5-9B")).toBe("qwen3.5:9b");
    });

    it("resolves Qwen3.5-9B (q4_k_m) to qwen3.5:9b-q4_k_m", () => {
      expect(resolveSubagentModel("Qwen3.5-9B (q4_k_m)")).toBe("qwen3.5:9b-q4_k_m");
    });

    it("resolves qwen3-0.6b to qwen3:0.6b-q4_k_m", () => {
      expect(resolveSubagentModel("qwen3-0.6b")).toBe("qwen3:0.6b-q4_k_m");
    });

    it("keeps custom models as-is", () => {
      expect(resolveSubagentModel("custom/my-model")).toBe("custom/my-model");
    });
  });

  describe("resolveImageToDataUri", () => {
    it("preserves data URI untouched", () => {
      const uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
      expect(resolveImageToDataUri(uri)).toBe(uri);
    });

    it("returns null for non-existent file", () => {
      expect(resolveImageToDataUri("./non-existent-image.png")).toBeNull();
    });
  });

  describe("buildChatPayload", () => {
    it("constructs OpenAI-compatible payload without images", () => {
      const payload = buildChatPayload({
        model: "9r",
        prompt: "Check this function",
        systemPrompt: "You are a reviewer.",
      });

      expect(payload.model).toBe("9r");
      expect(payload.messages).toEqual([
        { role: "system", content: "You are a reviewer." },
        { role: "user", content: "Check this function" },
      ]);
      expect(payload.stream).toBe(false);
    });

    it("constructs OpenAI multimodal content when images are provided", () => {
      const sampleUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
      const payload = buildChatPayload({
        model: "qwen3.5-9b",
        prompt: "Describe this image",
        images: [sampleUri],
      });

      expect(payload.model).toBe("qwen3.5:9b");
      expect(payload.messages).toHaveLength(2);
      expect(payload.messages[1]).toEqual({
        role: "user",
        content: [
          { type: "text", text: "Describe this image" },
          { type: "image_url", image_url: { url: sampleUri } },
        ],
      });
    });
  });

  describe("executeCompletion with mock server", () => {
    let mockServer;
    let mockPort;
    let receivedPayload;

    beforeEach(async () => {
      receivedPayload = null;
      mockServer = http.createServer((req, res) => {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          receivedPayload = JSON.parse(body);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              model: receivedPayload.model,
              choices: [
                {
                  message: {
                    content: `Completed with ${receivedPayload.model}`,
                  },
                },
              ],
            })
          );
        });
      });

      await new Promise((resolve) => {
        mockServer.listen(0, "127.0.0.1", () => {
          mockPort = mockServer.address().port;
          resolve();
        });
      });
    });

    afterEach(async () => {
      await new Promise((resolve) => mockServer.close(resolve));
    });

    it("executes single subagent request", async () => {
      const res = await runSubagent({
        model: "9r",
        prompt: "Analyze code",
        baseUrl: `http://127.0.0.1:${mockPort}`,
      });

      expect(res.content).toBe("Completed with 9r");
      expect(receivedPayload.model).toBe("9r");
    });

    it("executes parallel subagent requests across 9r, 9r1, 9r2, Qwen3.5-9B", async () => {
      const tasks = [
        { id: "task1", model: "9r", prompt: "Prompt 1" },
        { id: "task2", model: "9r1", prompt: "Prompt 2" },
        { id: "task3", model: "9r2", prompt: "Prompt 3" },
        { id: "task4", model: "Qwen3.5-9B", prompt: "Prompt 4" },
      ];

      const results = await runParallelSubagents(tasks, {
        baseUrl: `http://127.0.0.1:${mockPort}`,
      });

      expect(results).toHaveLength(4);
      expect(results[0].model).toBe("9r");
      expect(results[1].model).toBe("9r1");
      expect(results[2].model).toBe("9r2");
      expect(results[3].model).toBe("qwen3.5:9b");
    });

    it("executes subagent chat with text and image using qwen3.5-9b", async () => {
      const sampleDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const res = await runSubagent({
        model: "qwen3.5-9b",
        prompt: "Analyze the architecture in this screenshot",
        images: [sampleDataUri],
        baseUrl: `http://127.0.0.1:${mockPort}`,
      });

      expect(res.content).toBe("Completed with qwen3.5:9b");
      expect(receivedPayload.model).toBe("qwen3.5:9b");
      expect(receivedPayload.messages[1].content).toEqual([
        { type: "text", text: "Analyze the architecture in this screenshot" },
        { type: "image_url", image_url: { url: sampleDataUri } },
      ]);
    });
  });
});
