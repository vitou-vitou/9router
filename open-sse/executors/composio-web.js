import { BaseExecutor } from "./base.js";
import { PROVIDERS } from "../config/providers.js";
import { SSE_DONE, SSE_HEADERS_NO_BUFFER } from "../utils/sseConstants.js";
import { sseChunk } from "../utils/sse.js";
import crypto from "crypto";

const COMPOSIO_ARENA_API = "https://dashboard.composio.dev/api/arena";
let activeConversationId = "arc_j52K2uCXH76H";

const ARENA_MODEL_MAP = {
  "gpt-6.1-sol": "openai/gpt-6.1-sol",
  "openai/gpt-6.1-sol": "openai/gpt-6.1-sol",
  "kimi-k3": "moonshotai/kimi-k3",
  "moonshotai/kimi-k3": "moonshotai/kimi-k3",
  "claude-opus-5.5": "anthropic/claude-opus-5.5",
  "anthropic/claude-opus-5.5": "anthropic/claude-opus-5.5",
  "deepseek-v4-pro": "deepseek/deepseek-v4-pro",
  "deepseek/deepseek-v4-pro": "deepseek/deepseek-v4-pro",
};

export function parseVercelAiEvent(jsonStr) {
  try {
    const obj = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
    if (obj.type === "text-delta" && obj.delta != null) {
      return { delta: obj.delta };
    }
    if (obj.type === "reasoning-delta" && obj.delta != null) {
      return { reasoning: obj.delta };
    }
    if (obj.type === "finish" || obj.type === "done") {
      return { done: true };
    }
    return null;
  } catch {
    return null;
  }
}

function parseOpenAIMessages(messages) {
  if (!Array.isArray(messages)) return "";
  return messages
    .map((m) => {
      if (typeof m.content === "string") return m.content;
      if (Array.isArray(m.content)) {
        return m.content
          .map((c) => (c?.type === "text" ? c.text : ""))
          .filter(Boolean)
          .join("\n");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

async function* extractContent(eventStream, signal) {
  const reader = eventStream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal?.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          yield { done: true };
          return;
        }

        const parsed = parseVercelAiEvent(payload);
        if (parsed) {
          yield parsed;
          if (parsed.done) return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  yield { done: true };
}

function buildStreamingResponse(eventStream, model, cid, created, signal) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            sseChunk({
              id: cid,
              object: "chat.completion.chunk",
              created,
              model,
              choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }],
            })
          )
        );

        for await (const chunk of extractContent(eventStream, signal)) {
          if (chunk.reasoning) {
            controller.enqueue(
              encoder.encode(
                sseChunk({
                  id: cid,
                  object: "chat.completion.chunk",
                  created,
                  model,
                  choices: [{ index: 0, delta: { reasoning_content: chunk.reasoning }, finish_reason: null }],
                })
              )
            );
            continue;
          }
          if (chunk.delta) {
            controller.enqueue(
              encoder.encode(
                sseChunk({
                  id: cid,
                  object: "chat.completion.chunk",
                  created,
                  model,
                  choices: [{ index: 0, delta: { content: chunk.delta }, finish_reason: null }],
                })
              )
            );
            continue;
          }
          if (chunk.done) break;
        }

        controller.enqueue(
          encoder.encode(
            sseChunk({
              id: cid,
              object: "chat.completion.chunk",
              created,
              model,
              choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
            })
          )
        );
        controller.enqueue(encoder.encode(SSE_DONE));
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            sseChunk({
              id: cid,
              object: "chat.completion.chunk",
              created,
              model,
              choices: [{ index: 0, delta: { content: `[Stream error: ${err.message || String(err)}]` }, finish_reason: "stop" }],
            })
          )
        );
        controller.enqueue(encoder.encode(SSE_DONE));
      } finally {
        controller.close();
      }
    },
  });
}

async function buildNonStreamingResponse(eventStream, model, cid, created, signal) {
  let content = "";
  for await (const chunk of extractContent(eventStream, signal)) {
    if (chunk.delta) content += chunk.delta;
    if (chunk.done) break;
  }

  const estTokens = Math.max(1, Math.ceil(content.length / 4));
  return new Response(
    JSON.stringify({
      id: cid,
      object: "chat.completion",
      created,
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: estTokens, total_tokens: 10 + estTokens },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export class ComposioWebExecutor extends BaseExecutor {
  constructor() {
    super("composio-web", PROVIDERS["composio-web"] || {});
  }

  resolveArenaModel(model) {
    return ARENA_MODEL_MAP[model] || ARENA_MODEL_MAP[model.toLowerCase()] || model;
  }

  async execute({ model, body, stream, credentials, signal, log }) {
    const messages = body?.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      const errResp = new Response(
        JSON.stringify({ error: { message: "Missing or empty messages array", type: "invalid_request" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
      return { response: errResp, url: COMPOSIO_ARENA_API, headers: {}, transformedBody: body };
    }

    const arenaModel = this.resolveArenaModel(model);
    const promptText = parseOpenAIMessages(messages);

    // Resolve Cookie from credentials
    let rawCookie = credentials?.apiKey || credentials?.accessToken || "";
    if (rawCookie && !rawCookie.includes("wos-session=")) {
      rawCookie = `wos-session=${rawCookie}`;
    }

    // Extract orgSlug from cookie or fallback
    let orgSlug = "pakvitou168_workspace";
    const orgMatch = rawCookie.match(/last_visited=([^%&;]+)/);
    if (orgMatch) {
      orgSlug = decodeURIComponent(orgMatch[1]);
    }

    const arenaPayload = {
      orgSlug,
      conversationId: activeConversationId || null,
      model: arenaModel,
      message: {
        parts: [{ type: "text", text: promptText }],
        id: `msg_${crypto.randomUUID().slice(0, 16)}`,
        role: "user",
        metadata: { created_at: new Date().toISOString() },
      },
    };

    const headers = {
      "Content-Type": "application/json",
      Cookie: rawCookie,
      Origin: "https://dashboard.composio.dev",
      Referer: "https://dashboard.composio.dev/pakvitou168_workspace/~/bench",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    };

    let response;
    try {
      response = await fetch(COMPOSIO_ARENA_API, {
        method: "POST",
        headers,
        body: JSON.stringify(arenaPayload),
        signal,
      });
    } catch (err) {
      const errResp = new Response(
        JSON.stringify({ error: { message: `Composio connection error: ${err.message}`, type: "upstream_error" } }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
      return { response: errResp, url: COMPOSIO_ARENA_API, headers, transformedBody: arenaPayload };
    }

    const status = response.status;
    if (status === 200) {
      const convId = response.headers?.get?.("x-conversation-id");
      if (convId) activeConversationId = convId;
    }
    if (status !== 200) {
      let errMsg = `Composio returned HTTP ${status}`;
      if (status === 401 || status === 403) {
        errMsg = "Composio session expired. Copy the fresh wos-session cookie from dashboard.composio.dev";
      }
      const errText = await response.text().catch(() => "");
      const errResp = new Response(
        JSON.stringify({ error: { message: errMsg, detail: errText, type: "upstream_error" } }),
        { status, headers: { "Content-Type": "application/json" } }
      );
      return { response: errResp, url: COMPOSIO_ARENA_API, headers, transformedBody: arenaPayload };
    }

    if (!response.body) {
      const errResp = new Response(
        JSON.stringify({ error: { message: "Composio returned empty body", type: "upstream_error" } }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
      return { response: errResp, url: COMPOSIO_ARENA_API, headers, transformedBody: arenaPayload };
    }

    const cid = `chatcmpl-comp-${crypto.randomUUID().slice(0, 12)}`;
    const created = Math.floor(Date.now() / 1000);

    let finalResponse;
    if (stream) {
      const sseStream = buildStreamingResponse(response.body, model, cid, created, signal);
      finalResponse = new Response(sseStream, {
        status: 200,
        headers: { ...SSE_HEADERS_NO_BUFFER },
      });
    } else {
      finalResponse = await buildNonStreamingResponse(response.body, model, cid, created, signal);
    }

    return { response: finalResponse, url: COMPOSIO_ARENA_API, headers, transformedBody: arenaPayload };
  }
}

export default ComposioWebExecutor;
