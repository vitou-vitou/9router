import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const tools = require("../../cli/src/cli/commands/connectTools.js");

describe("opencode CLI config resolution", () => {
  let tmpHome;
  const origHome = os.homedir();

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-test-"));
    process.env.HOME = tmpHome;
    process.env.USERPROFILE = tmpHome;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    process.env.USERPROFILE = origHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it("resolves opencode.jsonc when opencode.json does not exist", () => {
    const cfgDir = path.join(tmpHome, ".config", "opencode");
    fs.mkdirSync(cfgDir, { recursive: true });
    const jsoncFile = path.join(cfgDir, "opencode.jsonc");
    fs.writeFileSync(jsoncFile, JSON.stringify({ model: "old-model" }));

    const opencodeTool = tools.TOOLS.find((t) => t.id === "opencode");
    expect(opencodeTool.paths()).toContain(jsoncFile);
  });
});
