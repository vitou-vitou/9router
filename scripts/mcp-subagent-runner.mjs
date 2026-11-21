import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

export const DEFAULT_MODEL_MAP = {
  "9r": "9r",
  "9r1": "9r1",
  "9r2": "9r2",
  "qwen3.5-9b": "qwen3.5:9b",
  "qwen3.5-9b (q4_k_m)": "qwen3.5:9b-q4_k_m",
  "qwen3-0.6b": "qwen3:0.6b-q4_k_m",
};

export function resolveSubagentModel(model) {
  if (!model || typeof model !== "string") return "9r";
  const key = model.trim().toLowerCase();
  return DEFAULT_MODEL_MAP[key] || model.trim();
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

export function resolveImageToDataUri(imgRef) {
  if (typeof imgRef !== "string") return null;
  const trimmed = imgRef.trim();
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  try {
    const abs = path.resolve(trimmed);
    if (fs.existsSync(abs)) {
      const stats = fs.statSync(abs);
      if (stats.size > 20 * 1024 * 1024) return null; // 20MB limit
      const mime = getMimeType(abs);
      const b64 = fs.readFileSync(abs).toString("base64");
      return `data:${mime};base64,${b64}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function buildChatPayload({
  model,
  prompt,
  systemPrompt = "You are an expert AI subagent assistant.",
  files = [],
  images = [],
  temperature = 0.2,
  maxTokens = 2048,
}) {
  const resolvedModel = resolveSubagentModel(model);
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  const collectedImages = [];
  if (Array.isArray(images)) {
    for (const img of images) {
      const uri = resolveImageToDataUri(img);
      if (uri) collectedImages.push(uri);
    }
  }

  const textFiles = [];
  if (Array.isArray(files)) {
    for (const file of files) {
      if (typeof file !== "string") continue;
      const ext = path.extname(file).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        const uri = resolveImageToDataUri(file);
        if (uri) collectedImages.push(uri);
      } else {
        textFiles.push(file);
      }
    }
  }

  let fullPrompt = prompt || "";
  if (textFiles.length > 0) {
    const fileContents = textFiles
      .map((filePath) => {
        try {
          const abs = path.resolve(filePath);
          if (fs.existsSync(abs)) {
            const content = fs.readFileSync(abs, "utf-8");
            return `--- File: ${filePath} ---\n${content}`;
          }
          return `--- File: ${filePath} (Not found) ---`;
        } catch (e) {
          return `--- File: ${filePath} (Error: ${e.message}) ---`;
        }
      })
      .join("\n\n");

    fullPrompt = `${fullPrompt}\n\n[Attached Context Files]:\n${fileContents}`;
  }

  if (collectedImages.length > 0) {
    const content = [{ type: "text", text: fullPrompt }];
    for (const imgUri of collectedImages) {
      content.push({
        type: "image_url",
        image_url: { url: imgUri },
      });
    }
    messages.push({ role: "user", content });
  } else {
    messages.push({ role: "user", content: fullPrompt });
  }

  return {
    model: resolvedModel,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };
}

export async function executeCompletion(payload, options = {}) {
  const baseUrl =
    options.baseUrl ||
    process.env.NINEROUTER_BASE_URL ||
    "http://localhost:20128";
  const url = new URL("/v1/chat/completions", baseUrl);
  const apiKey = options.apiKey || process.env.NINEROUTER_API_KEY || "9r-local";

  const postData = JSON.stringify(payload);
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(
              new Error(
                `Gateway returned HTTP ${res.statusCode}: ${data.slice(0, 500)}`
              )
            );
            return;
          }
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.message?.content || "";
            resolve({
              content,
              model: json.model || payload.model,
              usage: json.usage || null,
            });
          } catch (e) {
            reject(new Error(`Failed to parse response JSON: ${e.message}`));
          }
        });
      }
    );

    req.setTimeout(options.timeout || 120_000, () => {
      req.destroy(new Error("Request timed out"));
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

export async function runSubagent({
  model = "9r",
  prompt,
  systemPrompt,
  files = [],
  images = [],
  temperature,
  maxTokens,
  baseUrl,
  apiKey,
}) {
  const payload = buildChatPayload({
    model,
    prompt,
    systemPrompt,
    files,
    images,
    temperature,
    maxTokens,
  });

  return executeCompletion(payload, { baseUrl, apiKey });
}

export async function runParallelSubagents(tasks = [], options = {}) {
  return Promise.all(
    tasks.map(async (task, index) => {
      try {
        const result = await runSubagent({
          model: task.model || "9r",
          prompt: task.prompt,
          systemPrompt: task.systemPrompt,
          files: task.files,
          images: task.images,
          temperature: task.temperature,
          maxTokens: task.maxTokens,
          baseUrl: options.baseUrl,
          apiKey: options.apiKey,
        });
        return {
          id: task.id || `task_${index + 1}`,
          success: true,
          model: result.model,
          output: result.content,
          usage: result.usage,
        };
      } catch (err) {
        return {
          id: task.id || `task_${index + 1}`,
          success: false,
          error: err.message,
        };
      }
    })
  );
}

// ── MCP JSON-RPC Server ───────────────────────────────────────────────────────

export function startMcpServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  function send(msg) {
    process.stdout.write(JSON.stringify(msg) + "\n");
  }

  rl.on("line", async (line) => {
    if (!line.trim()) return;
    let req;
    try {
      req = JSON.parse(line);
    } catch {
      return;
    }

    const { id, method, params } = req;

    if (method === "initialize") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "9router-subagent-runner",
            version: "1.0.0",
          },
        },
      });
      return;
    }

    if (method === "notifications/initialized") {
      return;
    }

    if (method === "tools/list") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: "subagent_run",
              description:
                "Execute an AI subagent task via 9Router. Supports models: 9r, 9r1, 9r2, Qwen3.5-9B, or any local/cloud model.",
              inputSchema: {
                type: "object",
                properties: {
                  model: {
                    type: "string",
                    description:
                      "Model slug (e.g. '9r', '9r1', '9r2', 'Qwen3.5-9B', 'qwen3.5:9b', 'qwen3:0.6b-q4_k_m')",
                    default: "9r",
                  },
                  prompt: {
                    type: "string",
                    description: "Task prompt for the subagent",
                  },
                  system_prompt: {
                    type: "string",
                    description: "Optional system instruction",
                  },
                  files: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional array of file paths to attach",
                  },
                  images: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "Optional array of image file paths or data URLs",
                  },
                },
                required: ["prompt"],
              },
            },
            {
              name: "subagent_parallel",
              description:
                "Execute multiple subagent tasks in parallel via 9Router across models 9r, 9r1, 9r2, Qwen3.5-9B.",
              inputSchema: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    description: "Array of subagent tasks to run concurrently",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Task identifier" },
                        model: {
                          type: "string",
                          description: "Model slug (9r, 9r1, 9r2, Qwen3.5-9B)",
                        },
                        prompt: {
                          type: "string",
                          description: "Prompt for this subagent",
                        },
                        files: {
                          type: "array",
                          items: { type: "string" },
                          description: "Attached files",
                        },
                        images: {
                          type: "array",
                          items: { type: "string" },
                          description: "Attached images (paths or data URLs)",
                        },
                      },
                      required: ["prompt"],
                    },
                  },
                },
                required: ["tasks"],
              },
            },
          ],
        },
      });
      return;
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      try {
        if (toolName === "subagent_run") {
          const res = await runSubagent({
            model: args.model || "9r",
            prompt: args.prompt,
            systemPrompt: args.system_prompt,
            files: args.files,
            images: args.images,
          });

          send({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: `[Subagent ${res.model} Result]:\n\n${res.content}`,
                },
              ],
            },
          });
          return;
        }

        if (toolName === "subagent_parallel") {
          const results = await runParallelSubagents(args.tasks || []);
          const formatted = results
            .map((r) =>
              r.success
                ? `### Subagent [${r.id}] (${r.model})\n${r.output}`
                : `### Subagent [${r.id}] (FAILED)\nError: ${r.error}`
            )
            .join("\n\n---\n\n");

          send({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: formatted,
                },
              ],
            },
          });
          return;
        }

        send({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown tool: ${toolName}` },
        });
      } catch (err) {
        send({
          jsonrpc: "2.0",
          id,
          result: {
            isError: true,
            content: [{ type: "text", text: `Error: ${err.message}` }],
          },
        });
      }
      return;
    }

    send({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  startMcpServer();
}
