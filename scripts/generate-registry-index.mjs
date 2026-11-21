import { readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = resolve(__dirname, "../open-sse/providers/registry");
const INDEX_FILE = resolve(REGISTRY_DIR, "index.js");

// Providers intentionally hidden/commented out
const HIDDEN_PROVIDERS = new Map([
  ["trae.js", "trae — hidden, no tool calling support (trae SOLO agent / windsurf gRPC skip ToolCallChunk)"],
  ["windsurf.js", "windsurf — hidden, no tool calling"],
  ["devin-cli.js", "devin-cli — hidden, spawns local agent with shell/fs access"],
]);

const files = readdirSync(REGISTRY_DIR)
  .filter((f) => f.endsWith(".js") && f !== "index.js")
  .sort((a, b) => a.localeCompare(b));

const imports = [];
const exports = [];
let index = 0;

for (const file of files) {
  if (HIDDEN_PROVIDERS.has(file)) {
    imports.push(`// import p${index} from "./${file}"; // ${HIDDEN_PROVIDERS.get(file)}`);
    exports.push(`  // p${index}, // ${file}`);
  } else {
    imports.push(`import p${index} from "./${file}";`);
    exports.push(`  p${index},`);
  }
  index++;
}

const content = `// Auto-generated: static imports for all registry entries
// Run 'npm run generate:registry' to regenerate. Do not hand-edit.
${imports.join("\n")}
export default [
${exports.join("\n")}
];
`;

writeFileSync(INDEX_FILE, content, "utf8");
console.log(`Generated ${INDEX_FILE} with ${files.length} providers (${files.length - HIDDEN_PROVIDERS.size} active, ${HIDDEN_PROVIDERS.size} hidden).`);
