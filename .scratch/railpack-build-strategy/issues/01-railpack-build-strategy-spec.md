# Spec: Railpack Build Strategy for 9Router Deployment

## Problem Statement

When an Operator deploys 9Router onto PaaS platforms supporting Railpack (Railway, Dokploy, Defang, Zeabur):
1. The default detected start script (`npm run start`) hardcodes `--port 20127`, ignoring dynamic `$PORT` environment variables injected by PaaS providers.
2. Bypassing `custom-server.js` would skip critical proxy protections: `x-9r-peer-token` peer validation, client header sanitization, HTTP/2 cleartext downgrade handling for IDEs, and the automated token refresh background scheduler.
3. `package-lock.json` is gitignored in this repo; npm commands must safely install runtime and build dependencies (`npm install --include=dev`).
4. Optional native bindings (`better-sqlite3`) require C/C++ compilation toolchains (`build-essential`, `python3`, `make`, `g++`) when prebuilt binaries are unavailable.
5. Persistent storage directory `/app/data` must be prepared at build time.

## Solution

Provide a root-level declarative `railpack.json` configuration file conforming to `https://schema.railpack.com`:
- Pin the Node engine to Node 22 (`"packages": { "node": "22" }`).
- Extend build packages with `"buildAptPackages": ["...", "build-essential", "python3", "make", "g++"]`.
- Enforce `npm install --include=dev` in `steps.install.commands`.
- Pre-create `/app/data` and execute `npm run build` in `steps.build.commands`.
- Standardize the runtime container on `deploy.startCommand = "node custom-server.js"` with dynamic `$PORT` precedence and default environment variables.

## User Stories

1. As an Operator deploying 9Router to Railway via Railpack, I want zero-configuration builds to succeed out of the box without requiring a custom Dockerfile.
2. As an Operator, I want the server process to start through `custom-server.js`, so that dynamic `$PORT` assignment works seamlessly and peer tokens are validated.
3. As an Operator, I want native compilation dependencies available, so that optional native modules compile cleanly without missing-compiler failures.
4. As a Developer, I want declarative configuration in `railpack.json` with schema validation, so that any drift is detected immediately.

## Implementation Decisions

- **Configuration File:** Root `railpack.json` with schema `https://schema.railpack.com`.
- **Node Provider & Version:** Explicit `"provider": "node"` and `"packages": { "node": "22" }`.
- **Toolchain Extension:** Use Railpack's array extension syntax `["...", "build-essential", "python3", "make", "g++"]`.
- **Install Step:** `"steps": { "install": { "commands": ["npm install --include=dev"] } }`.
- **Build Step:** `"steps": { "build": { "commands": ["mkdir -p /app/data", "npm run build"] } }`.
- **Deploy Step:** `"deploy": { "startCommand": "node custom-server.js", "variables": { ... } }`.

## Testing Decisions

- Tested with Vitest suite `tests/unit/railpack-config.test.js`.
- Verifies existence, JSON validity, schema compliance, package pinning, native compiler provisioning, install command behavior, and runtime start command.

## Out of Scope

- Modifying `next.config.mjs`.
- Modifying `nixpacks.toml` or `Dockerfile`.
- Committing `package-lock.json`.
