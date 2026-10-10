import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Nixpacks Build Strategy Configuration", () => {
  const nixpacksPath = resolve(process.cwd(), "nixpacks.toml");

  it("exists at repository root", () => {
    expect(existsSync(nixpacksPath)).toBe(true);
  });

  it("declares the node provider and pins Node 22", () => {
    const content = readFileSync(nixpacksPath, "utf8");
    expect(content).toMatch(/providers\s*=\s*\[.*"node".*\]/);
    expect(content).toMatch(/NIXPACKS_NODE_VERSION\s*=\s*"22"/);
  });

  it("provisions native compilation tools for node-gyp / better-sqlite3", () => {
    const content = readFileSync(nixpacksPath, "utf8");
    expect(content).toMatch(/nixPkgs\s*=\s*\[.*"\.\.\."/);
    expect(content).toMatch(/"python3"/);
    expect(content).toMatch(/"gcc"/);
    expect(content).toMatch(/"gnumake"/);
  });

  it("uses npm install instead of npm ci in install cmds because package-lock.json is gitignored", () => {
    const content = readFileSync(nixpacksPath, "utf8");
    const installPhase = content.split("[phases.install]")[1]?.split("[phases.")[0] || "";
    expect(installPhase).toMatch(/npm install/);
    expect(installPhase).not.toMatch(/cmds\s*=\s*\[.*npm ci.*\]/);
  });

  it("boots through custom-server.js to preserve reverse-proxy security and token refresh", () => {
    const content = readFileSync(nixpacksPath, "utf8");
    expect(content).toMatch(/cmd\s*=\s*"node custom-server\.js"/);
  });

  it("configures host and port variables compatible with dynamic PaaS injection", () => {
    const content = readFileSync(nixpacksPath, "utf8");
    expect(content).toMatch(/HOSTNAME\s*=\s*"0\.0\.0\.0"/);
    expect(content).toMatch(/PORT\s*=\s*"20128"/);
    expect(content).toMatch(/DATA_DIR\s*=\s*"\/app\/data"/);
  });
});
