import { describe, expect, it } from "vitest";

import { getModelUpstreamId } from "../../open-sse/config/providerModels.js";
import { AntigravityExecutor } from "../../open-sse/executors/antigravity.js";
import { applyThinking, stripThinkingSuffix } from "../../open-sse/translator/concerns/thinkingUnified.js";

describe("Gemini 4 Hydrogen Antigravity tier", () => {
  it.each([
    ["gemini-4-hydrogen-high", "gemini-4-hydrogen-high", "high"],
    ["gemini-4-hydrogen-medium", "gemini-4-hydrogen-medium", "medium"],
    ["gemini-4-hydrogen-low", "gemini-4-hydrogen-low", "low"],
    ["gemini-4-hydrogen", "gemini-4-hydrogen-high", "high"],
    ["gemini-4-hydrogen-xhigh", "gemini-4-hydrogen-xhigh", "high"],
    ["gemini-4-hydrogen-tiered-high", "gemini-4-hydrogen-tiered-high", "high"],
    ["gemini-4-hydrogen-tiered-xhigh", "gemini-4-hydrogen-tiered-xhigh", "high"],
  ])("maps %s onto wire model %s at thinking %s", (modelId, wireModel, expectedLevel) => {
    const upstreamModel = getModelUpstreamId("ag", modelId);
    expect(upstreamModel).toBe(`${wireModel}(${expectedLevel})`);

    const body = {
      model: stripThinkingSuffix(upstreamModel),
      request: {
        contents: [{ role: "user", parts: [{ text: "hello" }] }],
        generationConfig: {},
      },
    };

    applyThinking("antigravity", upstreamModel, body, "antigravity");
    const finalBody = new AntigravityExecutor().transformRequest(
      modelId,
      body,
      true,
      { projectId: "project", connectionId: "connection" }
    );

    expect(finalBody.model).toBe(wireModel);
    expect(finalBody.request.generationConfig.thinkingConfig).toEqual({
      thinkingLevel: expectedLevel,
      includeThoughts: true,
    });
  });
});
