import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Railpack Build Strategy Configuration", () => {
  const railpackPath = resolve(process.cwd(), "railpack.json");

  it("exists at repository root", () => {
    expect(existsSync(railpackPath)).toBe(true);
  });

  it("is valid JSON conforming to Railpack schema", () => {
    const raw = readFileSync(railpackPath, "utf8");
    const parsed = JSON.parse(raw);
    expect(parsed.$schema).toBe("https://schema.railpack.com");
  });

  it("declares the node provider and pins Node 22", () => {
    const parsed = JSON.parse(readFileSync(railpackPath, "utf8"));
    expect(parsed.provider).toBe("node");
    expect(parsed.packages?.node).toBe("22");
  });

  it("provisions native compilation tools in buildAptPackages for node-gyp / better-sqlite3", () => {
    const parsed = JSON.parse(readFileSync(railpackPath, "utf8"));
    expect(parsed.buildAptPackages).toContain("...");
    expect(parsed.buildAptPackages).toContain("build-essential");
    expect(parsed.buildAptPackages).toContain("python3");
  });

  it("uses npm install in install step because package-lock.json is gitignored", () => {
    const parsed = JSON.parse(readFileSync(railpackPath, "utf8"));
    const commands = parsed.steps?.install?.commands || [];
    expect(commands.some((cmd) => typeof cmd === "string" && cmd.includes("npm install"))).toBe(true);
    expect(commands.some((cmd) => typeof cmd === "string" && cmd.includes("npm ci"))).toBe(false);
  });

  it("boots through custom-server.js to preserve reverse-proxy security and token refresh", () => {
    const parsed = JSON.parse(readFileSync(railpackPath, "utf8"));
    expect(parsed.deploy?.startCommand).toBe("node custom-server.js");
  });

  it("configures host and port variables compatible with dynamic PaaS injection", () => {
    const parsed = JSON.parse(readFileSync(railpackPath, "utf8"));
    expect(parsed.deploy?.variables?.HOSTNAME).toBe("0.0.0.0");
    expect(parsed.deploy?.variables?.PORT).toBe("20128");
    expect(parsed.deploy?.variables?.DATA_DIR).toBe("/app/data");
  });
});
