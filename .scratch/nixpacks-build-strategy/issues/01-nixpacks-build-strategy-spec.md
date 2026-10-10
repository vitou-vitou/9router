# Spec: Nixpacks Build Strategy for 9Router Deployment

## Problem Statement

When an Operator deploys 9Router onto PaaS platforms supporting the Nixpacks build strategy (Sevalla, Railway, Coolify, Dokploy, Zeabur), the build either fails during the installation/compilation phase or boots incorrectly at runtime:
1. Nixpacks defaults to `npm ci`, but `package-lock.json` is gitignored in this repository, causing instant `ENOENT` fatal errors.
2. If optional native modules (like `better-sqlite3`) trigger fallback compilation through `node-gyp`, the basic Node container lacks `python3`, `gcc`, and `gnumake`, throwing Python finder errors.
3. Next.js standalone detection in Nixpacks defaults to launching `node .next/standalone/server.js`, bypassing `custom-server.js`. This drops critical reverse-proxy spoof protection, header sanitization, h2c downgrades, and the background token refresh scheduler.
4. Starting via `npm run start` enforces a hardcoded `--port 20127`, overriding platform-injected runtime ports (e.g., Sevalla's `PORT=10000` or Railway's dynamic assignment).

## Solution

Provide a root-level declarative `nixpacks.toml` configuration that tailors the Nixpacks build strategy directly to 9Router's runtime constraints:
- Instruct the install phase to run `npm install --include=dev` instead of `npm ci`.
- Extend the Nix setup phase with `python3`, `gcc`, and `gnumake`.
- Pin the Node engine to Node 22 (`NIXPACKS_NODE_VERSION = "22"`) matching production Docker images.
- Standardize the start phase on `node custom-server.js` to ensure the HTTP server wrapper executes with dynamic `$PORT` and `0.0.0.0` host binding.
- Pre-create persistent data storage paths (`DATA_DIR=/app/data`).

## User Stories

1. As an Operator deploying to Sevalla, I want the build strategy to automatically succeed using Nixpacks, so that I don't have to maintain a custom Dockerfile or external build orchestration.
2. As an Operator deploying to Railway, I want `npm install` to execute cleanly without requiring a checked-in `package-lock.json`, so that builds do not terminate with `ENOENT`.
3. As an Operator on any Nixpacks platform, I want the environment to have Python and C++ compilation tools available, so that optional native bindings (`better-sqlite3`) compile cleanly when prebuilts are missing.
4. As an Operator, I want the server process to start through `custom-server.js`, so that client IP spoofing is prevented via `x-9r-peer-token` verification.
5. As an Operator, I want `custom-server.js` to handle `h2c` upgrade downgrades, so that JetBrains/JBR 25 IDE clients stream AI completions without connection resets.
6. As an Operator, I want background token refreshes to launch on server start, so that expired provider tokens are automatically refreshed without human intervention.
7. As an Operator, I want the runtime to bind to `process.env.PORT` rather than a hardcoded port, so that the application is reachable through the platform's reverse proxy.
8. As a Developer, I want build strategy configuration to live in a single declarative file (`nixpacks.toml`), so that zero drift occurs between hosting providers.
9. As a Developer, I want persistent data directory creation (`/app/data`) handled at the build/setup boundary, so that SQLite initialization succeeds without permissions faults.

## Implementation Decisions

- **Declarative Configuration:** Root-level `nixpacks.toml` defining provider, environment variables, setup packages, install command, build command, and start command.
- **Node Engine Pinning:** Set `NIXPACKS_NODE_VERSION = "22"` in `[variables]` to ensure ABI alignment with Next.js 16 and native modules.
- **Toolchain Extension:** Extend default Nix packages using `nixPkgs = ["...", "python3", "gcc", "gnumake"]` so standard Node/npm binaries are retained while node-gyp dependencies are injected.
- **Install Command:** Enforce `npm install --include=dev` to accommodate gitignored `package-lock.json` and ensure dev dependencies required for Next.js build are present.
- **Start Boundary:** Configure `cmd = "node custom-server.js"` to run the root wrapper instead of bypassing through `.next/standalone/server.js`.
- **Environment Variables:** Provide production defaults (`NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`, `PORT=20128`, `HOSTNAME=0.0.0.0`, `DATA_DIR=/app/data`) that yield gracefully to platform-injected values.

Prototype snippet encoding the decision:
```toml
providers = ["node"]

[variables]
NIXPACKS_NODE_VERSION = "22"
NODE_ENV = "production"
NEXT_TELEMETRY_DISABLED = "1"
PORT = "20128"
HOSTNAME = "0.0.0.0"
DATA_DIR = "/app/data"

[phases.setup]
nixPkgs = ["...", "python3", "gcc", "gnumake"]

[phases.install]
cmds = ["npm install --include=dev"]

[phases.build]
cmds = ["mkdir -p /app/data", "npm run build"]

[start]
cmd = "node custom-server.js"
```

## Testing Decisions

- **Single High-Level Seam:** Verification occurs at the environment and runtime initialization boundary (`deployMode.js` and server startup).
- **Behavioral Tests:** Verify `isHosted()` / `isContainerDeploy()` behaves identically when running under hosted container environments.
- **Command & Port Validation:** Verify `custom-server.js` boots and binds to `process.env.PORT` without requiring `--port` command line arguments.
- **Prior Art:** `tests/unit/deploy-mode.test.js` covers platform detection (Sevalla, Render, Container overrides).

## Out of Scope

- Modifying `next.config.mjs` standalone output settings.
- Removing or altering the existing multi-stage `Dockerfile`.
- Committing `package-lock.json` into version control.
- Platform-specific deployment UI widgets within the 9Router dashboard.

## Further Notes

- Sevalla and Railway dynamically assign `$PORT` (e.g. `PORT=10000`). `node custom-server.js` respects this directly through Next.js runtime environment precedence.
- If native compilation is not needed, `sql.js` continues to operate as the zero-dependency fallback driver.
