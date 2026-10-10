# 02: Implement and Validate Nixpacks Build Strategy Configuration

**What to build:** Add declarative `nixpacks.toml` to the repository root for zero-config Nixpacks deployment across Sevalla, Railway, Coolify, and Dokploy. Ensure `npm install` handles absent lockfiles, native compilation dependencies (`python3`, `gcc`, `gnumake`) are provisioned, Next.js build runs cleanly, and `custom-server.js` boots with dynamic `PORT` support.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Create root `nixpacks.toml` targeting `providers = ["node"]` with Node 22 pinned.
- [x] Configure setup phase with `nixPkgs = ["...", "python3", "gcc", "gnumake"]` for native addon fallback.
- [x] Set install command to `npm install --include=dev` to bypass missing `package-lock.json`.
- [x] Set start command to `node custom-server.js` preserving reverse-proxy security, peer token validation, h2c downgrade, and background token refresh.
- [x] Ensure `PORT` and `HOSTNAME` defaults (`20128` and `0.0.0.0`) yield to platform-injected values.
- [x] Verify existing deployment detection test suite passes with `tests/unit/deploy-mode.test.js`.
