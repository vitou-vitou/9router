# 02: Implement and Validate Docker Build Strategy Configuration

**What to build:** Optimize root `Dockerfile` and `.dockerignore` for high-speed cloud container builds across Sevalla, Railway, Render, and Docker Hub. Ensure global registry mirrors are used, distro upgrades are bypassed, package install and Next.js compilation use BuildKit cache mounts, `.dockerignore` excludes non-essential paths, and `tests/unit/docker-config.test.js` passes 100%.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Configure root `Dockerfile` targeting `node:22-alpine` with global CDN defaults (`dl-cdn.alpinelinux.org`, `registry.npmjs.org`).
- [x] Provision native toolchain (`python3 make g++ linux-headers`) without running full `apk upgrade`.
- [x] Configure `npm install` with BuildKit npm cache mount, `--no-audit`, `--no-fund`, and network retry arguments.
- [x] Add BuildKit Next.js build cache mount (`--mount=type=cache,target=/app/.next/cache`) to `npm run build`.
- [x] Update `.dockerignore` to exclude `crates`, `**/target`, `.scratch`, `tests`, `gitbook`, `.agents`, `agent`, `.github`, and `cli`.
- [x] Preserve custom runtime entrypoint `CMD ["node", "custom-server.js"]` for dynamic port binding and reverse-proxy protections.
- [x] Add automated Vitest unit tests in `tests/unit/docker-config.test.js` validating all configuration contracts.
