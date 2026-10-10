export default {
  id: "composio-web",
  priority: 130,
  alias: "composio-web",
  aliases: [
    "composio",
    "comp-web",
    "arena",
  ],
  uiAlias: "composio",
  display: {
    name: "Composio Bench (Web)",
    icon: "extension",
    color: "#EA580C",
    textIcon: "CB",
    website: "https://dashboard.composio.dev",
    notice: {
      text: "Composio Bench & Arena web bridge. Paste your wos-session= cookie value from dashboard.composio.dev to access frontier models.",
      apiKeyUrl: "https://dashboard.composio.dev/pakvitou168_workspace/~/bench",
    },
  },
  category: "apikey",
  authType: "apikey",
  authHint: "Paste your wos-session= cookie value from dashboard.composio.dev",
  transport: {
    baseUrl: "https://dashboard.composio.dev/api/arena",
    executor: "composio-web",
  },
  models: [
    { id: "gpt-6.1-sol", name: "GPT-6.1 Sol" },
    { id: "kimi-k3", name: "Kimi K3" },
    { id: "claude-opus-5.5", name: "Claude Opus 5.5" },
    { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
  ],
  passthroughModels: true,
};
