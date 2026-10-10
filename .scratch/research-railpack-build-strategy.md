# Research: Railpack Build Strategy for 9Router Deployment

## 1. Problem Statement & Context

Hosting platforms (Railway, Dokploy, Defang, and modern PaaS engines) are adopting **Railpack** (`railwayapp/railpack`), Railway's next-generation successor to Nixpacks. Railpack uses BuildKit LLB generation, Mise package management, and container layer caching.

Deploying 9Router with default Railpack autodetected build settings encounters the same five repository-specific constraints identified during Nixpacks analysis:
1. **Missing Lockfile**: `package-lock.json` is explicitly gitignored (`.gitignore:63`). While Railpack falls back to `npm install` when no lockfile is found (PR #643), declaring explicit install commands ensures devDependencies (`--include=dev`) are installed for Next.js build.
2. **Native Addon Build Tools**: `better-sqlite3` is an optional native dependency. If prebuilt binaries are unavailable for the target architecture/glibc version, `node-gyp` requires `build-essential`, `python3`, `make`, and `g++`.
3. **Node Runtime ABI**: Next.js 16 requires Node 20+. Pinning to Node 22 (`"packages": { "node": "22" }`) matches the multi-stage Dockerfile (`node:22-alpine`) and ensures ABI consistency.
4. **Server Wrapper Bypass**: Without a start command override, Railpack detects `npm run start` from `package.json`, which hardcodes `--port 20127`. This breaks platforms injecting dynamic runtime ports (e.g. `$PORT`). Furthermore, bypassing `custom-server.js` would drop `x-9r-peer-token` validation, spoofed header sanitization, h2c downgrades, and the token refresh scheduler.
5. **Runtime Persistence Directory**: SQLite requires `/app/data` to be initialized.

---

## 2. Primary Source Analysis

### A. Repository Constraints
- **Lockfile Exclusion**: `D:/9router/.gitignore:63` contains `package-lock.json`.
- **Server Entrypoint**: `D:/9router/custom-server.js:128-139` wraps Next.js and handles dynamic `process.env.PORT`.
- **Build Hooks**: `D:/9router/package.json:10` defines `"postbuild": "node scripts/copy-standalone-assets.mjs"`.
- **Runtime Persistence**: `D:/9router/Dockerfile:29-50` establishes `DATA_DIR=/app/data`.

### B. Railpack Engine Specification (`railwayapp/railpack`)
- **Repository**: [https://github.com/railwayapp/railpack](https://github.com/railwayapp/railpack)
- **Documentation**: [https://railpack.com/config/file](https://railpack.com/config/file)
- **Schema**: `https://schema.railpack.com`
- **Config file**: `railpack.json` at repository root.
- **Packages**: Managed through Mise; Node version pinned via `"packages": { "node": "22" }`.
- **Build Apt Packages**: Extended using `"..."` array extension syntax: `"buildAptPackages": ["...", "build-essential", "python3", "make", "g++"]`.
- **Steps**:
  - `steps.install.commands`: `["npm install --include=dev"]` ensures devDependencies are present for the Next.js compilation step.
  - `steps.build.commands`: `["mkdir -p /app/data", "npm run build"]` provisions data paths and executes the Next.js webpack build and asset copying hooks.
- **Deploy**:
  - `deploy.startCommand`: `"node custom-server.js"` binds dynamically to `$PORT` and `$HOSTNAME`.
  - `deploy.variables`: Sets runtime defaults (`NODE_ENV=production`, `PORT=20128`, `HOSTNAME=0.0.0.0`, `DATA_DIR=/app/data`, `NEXT_TELEMETRY_DISABLED=1`).

---

## 3. Working Strategy Implementation (`railpack.json`)

```json
{
  "$schema": "https://schema.railpack.com",
  "provider": "node",
  "packages": {
    "node": "22"
  },
  "buildAptPackages": [
    "...",
    "build-essential",
    "python3",
    "make",
    "g++"
  ],
  "steps": {
    "install": {
      "commands": [
        "npm install --include=dev"
      ]
    },
    "build": {
      "commands": [
        "mkdir -p /app/data",
        "npm run build"
      ]
    }
  },
  "deploy": {
    "startCommand": "node custom-server.js",
    "variables": {
      "NODE_ENV": "production",
      "NEXT_TELEMETRY_DISABLED": "1",
      "PORT": "20128",
      "HOSTNAME": "0.0.0.0",
      "DATA_DIR": "/app/data"
    }
  }
}
```

---

## 4. Verification

- Evaluated with Vitest suite `tests/unit/railpack-config.test.js`.
- Passed schema validation, package pinning, native toolchain verification, and dynamic port compatibility checks.
