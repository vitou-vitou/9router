import { getCapabilitiesForModel } from "../open-sse/providers/capabilities.js";
const models=["glm-5.2","glm-5.3","glm-6","glm-4.7","kimi-k2.7-code","kimi-k2.6","kimi-k3","kimi-k2.8-code","deepseek-v4-pro","deepseek-v4-flash","deepseek-v4.1-pro","deepseek-v4.1-flash","deepseek-r1","deepseek-r2","deepseek-chat","deepseek-coder","mimo-v2.5","mimo-v2.5-pro","mimo-v3","mimo-v3-pro","minimax-m3","minimax-m4","qwen3.7-max","qwen3.7-plus","qwen3.7-coder","qwen3.7-flash","qwen3.8-max","qwen3.8-plus","qwen3.8-coder"];
const h=["model","vision","video","audio","reason","fmt","canDisable","effort","ctx","maxOut"];
console.log(h.join("|"));
for(const id of models){const c=getCapabilitiesForModel("clinepass","cline-pass/"+id);console.log([id,c.vision,c.videoInput,c.audioInput,c.reasoning,c.thinkingFormat,c.thinkingCanDisable,c.thinkingEffortSupported,c.contextWindow,c.maxOutput].join("|"));}
