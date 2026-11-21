import { getCapabilitiesForModel } from "../open-sse/providers/capabilities.js";
const ids = ["glm-5.2","kimi-k2.7-code","kimi-k2.6","deepseek-v4-pro","deepseek-v4-flash","mimo-v2.5","mimo-v2.5-pro","minimax-m3","qwen3.7-max","qwen3.7-plus"];
for (const id of ids) {
  const a = getCapabilitiesForModel("clinepass", "cline-pass/"+id);
  const b = getCapabilitiesForModel(null, id);
  console.log(id.padEnd(18), "provider:", JSON.stringify({v:a.vision,cw:a.contextWindow,mo:a.maxOutput,th:a.thinkingFormat}), " plain:", JSON.stringify({v:b.vision,cw:b.contextWindow,mo:b.maxOutput,th:b.thinkingFormat}));
}
