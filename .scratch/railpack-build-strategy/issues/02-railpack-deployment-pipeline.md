# 02: Implement and Validate Railpack Build Strategy Configuration

**What to build:** Add declarative `railpack.json` to the repository root for Railpack deployments across Railway, Dokploy, and supported PaaS platforms. Ensure Node 22 is pinned, build Apt packages (`build-essential`, `python3`, `make`, `g++`) are provisioned for `node-gyp`, dev dependencies install without requiring `package-lock.json`, Next.js build runs cleanly, and `custom-server.js` starts with dynamic `PORT` support.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Create root `railpack.json` targeting `provider: "node"` with Node 22 pinned.
- [x] Configure build Apt packages with `["...", "build-essential", "python3", "make", "g++"]` for native addon compilation.
- [x] Set install step command to `npm install --include=dev` to safely accommodate gitignored lockfiles.
- [x] Set deploy start command to `node custom-server.js` preserving reverse-proxy security, peer token validation, h2c downgrade, and background token refresh.
- [x] Configure deploy runtime variables (`PORT=20128`, `HOSTNAME=0.0.0.0`, `DATA_DIR=/app/data`).
- [x] Add automated Vitest unit tests in `tests/unit/railpack-config.test.js` validating all configuration contracts.
