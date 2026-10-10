# Research: Nixpacks Build Strategy for 9Router Deployment

## 1. Problem Statement & Context

Hosting platforms (Sevalla, Railway, Coolify, Dokploy, Zeabur) support two primary build strategies:
1. **Dockerfile**
2. **Nixpacks** (Zero-configuration / declarative buildpack engine)

Deployments selecting the **Nixpacks** build strategy failed or behaved unexpectedly due to five repo-specific constraints:
- **Missing Lockfile**: `package-lock.json` is explicitly gitignored (`.gitignore:63`). Default Nixpacks Node provider attempts `npm ci`, which crashes with `ENOENT` on missing lockfile.
- **Native Addon Build Tools**: `better-sqlite3` is an optional dependency. If prebuilt binaries are unavailable for the target architecture/glibc version, `node-gyp` attempts compilation and fails if `python3`, `gcc`, and `gnumake` are absent.
- **Node Runtime ABI**: Next.js 16 requires Node 20+. Pinning to Node 22 matches the existing multi-stage Dockerfile (`node:22-alpine`).
- **Server Wrapper Bypass**: Next.js standalone detection defaults Nixpacks to `node .next/standalone/server.js`. Directly running `server.js` bypasses `custom-server.js` (which enforces `PEER_TOKEN`, strips spoofed client headers, handles HTTP/2 cleartext downgrade for IDE clients, and starts background token refresh).
- **Hardcoded Default Port**: `package.json`'s `npm run start` script hardcodes `--port 20127`, ignoring dynamic `$PORT` environment variables injected by PaaS platforms like Sevalla (`PORT=10000`) or Railway.

---

## 2. Primary Source Analysis

### A. Repository Constraints
- **Lockfile Exclusion**: `D:/9router/.gitignore:63` contains `package-lock.json`.
- **Server Entrypoint**: `D:/9router/custom-server.js:128-139` wraps Next.js and conditionally executes either standalone `server.js` or `next start` dynamically while respecting `process.env.PORT`.
- **Build Hooks**: `D:/9router/package.json:10` defines `"postbuild": "node scripts/copy-standalone-assets.mjs"`.
- **Runtime Persistence**: `D:/9router/Dockerfile:29-50` establishes `DATA_DIR=/app/data` and creates the persistent directory.
- **Platform Detection**: `D:/9router/src/lib/deployMode.js:14-16` sniffs container environments (including Sevalla via `SVL_APP_ID` or `.sevalla.app` domain heuristic).

### B. Nixpacks Engine Specification
- **Configuration Spec**: [Nixpacks Configuration File Documentation](https://nixpacks.com/docs/configuration/file)
- **Node Provider Mechanics**: [Nixpacks Node Provider](https://nixpacks.com/docs/providers/node)
- **Extending Packages**: Using `nixPkgs = ["...", "python3", "gcc", "gnumake"]` preserves default Node toolchains while adding build tools for native compilation.

---

## 3. Working Strategy Implementation (`nixpacks.toml`)

```toml
# Nixpacks build strategy configuration for 9router
# Platforms: Sevalla, Railway, Coolify, Dokploy, Zeabur
# Reference: https://nixpacks.com/docs/configuration/file

providers = ["node"]

[variables]
NIXPACKS_NODE_VERSION = "22"
NODE_ENV = "production"
NEXT_TELEMETRY_DISABLED = "1"
PORT = "20128"
HOSTNAME = "0.0.0.0"
DATA_DIR = "/app/data"

[phases.setup]
# python3, gcc, gnumake for node-gyp native addon builds (better-sqlite3 fallback)
nixPkgs = ["...", "python3", "gcc", "gnumake"]

[phases.install]
# package-lock.json is gitignored in this repo; npm install must be used instead of npm ci
cmds = ["npm install --include=dev"]

[phases.build]
cmds = [
  "mkdir -p /app/data",
  "npm run build"
]

[start]
# Runs custom-server.js to preserve reverse-proxy header verification,
# background token refresh scheduler, and h2c downgrade handling.
cmd = "node custom-server.js"
```

---

## 4. Verification

- `tests/unit/deploy-mode.test.js` passes under vitest (`npm run test` / `nixpacks` environment verification).
- Entry point `node custom-server.js` correctly falls back to `next start` with full environment variable binding for `$PORT` and `$HOSTNAME`.
