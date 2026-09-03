// Tabitoken is an OpenAI-compatible proxy. Users paste the Postman URL
// (`https://tabitoken.com/v1/chat/completions`) into Base URL. 9router must
// strip the endpoint suffix and append it once — otherwise upstream 404s
// `POST /v1/chat/completions/chat/completions` while Postman returns 200.
import { describe, it, expect } from "vitest";
import { sanitizeOpenAICompatibleBaseUrl } from "open-sse/providers/shared.js";
import { DefaultExecutor } from "open-sse/executors/default.js";
import { BaseExecutor } from "open-sse/executors/base.js";

const NODE_ID = "openai-compatible-chat-tabitoken";
const POSTMAN_URL = "https://tabitoken.com/v1/chat/completions";
const BASE = "https://tabitoken.com/v1";
const MODEL = "claude-opus-5-thinking";

function creds(baseUrl, apiType = "chat") {
  return { providerSpecificData: { baseUrl, apiType } };
}

describe("sanitizeOpenAICompatibleBaseUrl (tabitoken / Postman paste)", () => {
  it("strips /chat/completions so Base URL is …/v1", () => {
    expect(sanitizeOpenAICompatibleBaseUrl(POSTMAN_URL)).toBe(BASE);
    expect(sanitizeOpenAICompatibleBaseUrl(`${POSTMAN_URL}/`)).toBe(BASE);
  });

  it("leaves a correct …/v1 base unchanged", () => {
    expect(sanitizeOpenAICompatibleBaseUrl(BASE)).toBe(BASE);
    expect(sanitizeOpenAICompatibleBaseUrl(`${BASE}/`)).toBe(BASE);
  });

  it("strips /responses the same way", () => {
    expect(sanitizeOpenAICompatibleBaseUrl("https://tabitoken.com/v1/responses")).toBe(BASE);
  });
});

describe("tabitoken runtime URL (Postman vs 9router)", () => {
  const cases = [
    ["DefaultExecutor", DefaultExecutor],
    ["BaseExecutor", BaseExecutor],
  ];

  for (const [name, Ex] of cases) {
    describe(name, () => {
      const ex = new Ex(NODE_ID);

      it("does not double-append /chat/completions when Base URL is the Postman path", () => {
        expect(ex.buildUrl(MODEL, false, 0, creds(POSTMAN_URL))).toBe(POSTMAN_URL);
        expect(ex.buildUrl(MODEL, false, 0, creds(POSTMAN_URL))).not.toContain(
          "/chat/completions/chat/completions",
        );
      });

      it("appends /chat/completions once when Base URL is …/v1", () => {
        expect(ex.buildUrl(MODEL, false, 0, creds(BASE))).toBe(POSTMAN_URL);
      });
    });
  }

  it("DefaultExecutor sends Bearer auth like Postman", () => {
    const ex = new DefaultExecutor(NODE_ID);
    const headers = ex.buildHeaders({ apiKey: "sk-test" }, false);
    expect(headers.Authorization).toBe("Bearer sk-test");
    expect(headers["Content-Type"]).toBe("application/json");
  });
});
