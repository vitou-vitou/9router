export default {
  id: "composio",
  priority: 125,
  alias: "composio",
  aliases: [
    "comp",
    "composio-bench",
  ],
  uiAlias: "composio",
  display: {
    name: "Composio",
    icon: "extension",
    color: "#EA580C",
    textIcon: "CP",
    website: "https://composio.dev",
    notice: {
      text: "Composio tool router and benchmark platform. Requires a Project API key (ak_...) from dashboard.composio.dev.",
      apiKeyUrl: "https://dashboard.composio.dev/settings",
    },
  },
  category: "apikey",
  authType: "apikey",
  transport: {
    baseUrl: "https://backend.composio.dev/api/v3.1",
    validateUrl: "https://backend.composio.dev/api/v3.1/toolkits",
    headers: {
      "x-api-key": "{apiKey}",
    },
    format: "openai",
  },
  models: [
    { id: "gpt-6.1-sol", name: "GPT-6.1 Sol" },
    { id: "kimi-k3", name: "Kimi K3" },
    { id: "claude-opus-5.5", name: "Claude Opus 5.5" },
    { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
  ],
  passthroughModels: true,
};
