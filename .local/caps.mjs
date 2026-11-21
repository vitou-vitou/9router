import { getCapabilitiesForModel } from "../open-sse/providers/capabilities.js";
const ids = ["cline-pass/glm-5.2","cline-pass/kimi-k2.7-code","cline-pass/kimi-k2.6","cline-pass/deepseek-v4-pro","cline-pass/deepseek-v4-flash","cline-pass/mimo-v2.5","cline-pass/mimo-v2.5-pro","cline-pass/minimax-m3","cline-pass/qwen3.7-max","cline-pass/qwen3.7-plus"];
const rows = ids.map(id => ({ id, ...getCapabilitiesForModel("clinepass", id) }));
const keys = ["vision","videoInput","audioInput","pdf","reasoning","thinkingFormat","thinkingCanDisable","tools","search","contextWindow","maxOutput"];
for (const r of rows) console.log(r.id.padEnd(34), keys.map(k => k+"="+(r[k]===undefined?"-":r[k])).join(" "));

