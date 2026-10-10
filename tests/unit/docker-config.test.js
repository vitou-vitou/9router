import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Docker Build Strategy Configuration", () => {
  const dockerfilePath = resolve(process.cwd(), "Dockerfile");
  const dockerignorePath = resolve(process.cwd(), ".dockerignore");

  it("exists at repository root", () => {
    expect(existsSync(dockerfilePath)).toBe(true);
    expect(existsSync(dockerignorePath)).toBe(true);
  });

  it("defaults to official global registries for fast cloud builds", () => {
    const content = readFileSync(dockerfilePath, "utf8");
    expect(content).toMatch(/ARG ALPINE_MIRROR=dl-cdn\.alpinelinux\.org/);
    expect(content).toMatch(/ARG NPM_REGISTRY=https:\/\/registry\.npmjs\.org\//);
    // Regional China mirrors must not be hardcoded as default
    expect(content).not.toMatch(/npm install --registry=https:\/\/registry\.npmmirror\.com/);
    expect(content).not.toMatch(/sed -i 's\|dl-cdn\.alpinelinux\.org\|mirrors\.aliyun\.com\|g'/);
  });

  it("provisions native toolchain without triggering full apk distribution upgrades", () => {
    const content = readFileSync(dockerfilePath, "utf8");
    expect(content).toMatch(/apk add --no-cache python3 make g\+\+ linux-headers/);
    expect(content).not.toMatch(/apk --no-cache upgrade/);
  });

  it("uses custom-server.js as the runtime entrypoint", () => {
    const content = readFileSync(dockerfilePath, "utf8");
    expect(content).toMatch(/CMD \["node", "custom-server\.js"\]/);
  });

  it("excludes heavy build artifacts and scratch docs from docker build context", () => {
    const content = readFileSync(dockerignorePath, "utf8");
    expect(content).toMatch(/crates/);
    expect(content).toMatch(/\.scratch/);
  });
});
