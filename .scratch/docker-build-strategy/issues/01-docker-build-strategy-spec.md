# Spec: Docker Build Strategy for 9Router Deployment

## Problem Statement

Deployments on cloud container platforms (Sevalla, Railway, Render, Fly.io, GCP/AWS) previously experienced 15+ minute build times or hung during Docker image generation due to:
1. Hardcoded Chinese regional mirrors (`mirrors.aliyun.com` and `registry.npmmirror.com`) causing network timeouts, throttling, and connection drops on Western cloud infrastructure.
2. Unnecessary full OS upgrades (`apk --no-cache upgrade`) across base, builder, and runner stages downloading hundreds of redundant package updates.
3. Unrestricted build context transferring compilation outputs (`crates/**/target`), scratch investigation directories (`.scratch`), documentation (`gitbook`), CLI source (`cli`), test suites (`tests`), and agent workspaces (`.agents`).
4. Re-compiling Next.js assets from scratch without layer cache re-use for `.next/cache`.

## Solution

Standardize on an optimized, production-verified multi-stage Docker build strategy:
- Default `ARG ALPINE_MIRROR=dl-cdn.alpinelinux.org` and `ARG NPM_REGISTRY=https://registry.npmjs.org/` to leverage official global CDNs while allowing runtime build-arg overrides.
- Provision explicit required native compilation packages (`python3 make g++ linux-headers`) without invoking full distro upgrades.
- Add `--no-audit --no-fund` flags and resilient retry configurations to `npm install`.
- Mount BuildKit build cache (`--mount=type=cache,target=/app/.next/cache`) during `npm run build` for rapid incremental compilations.
- Exclude `tests`, `gitbook`, `cli`, `.github`, `crates`, `**/target`, and `.scratch` in `.dockerignore`.
- Preserve custom runtime entrypoint (`node custom-server.js`) to guarantee dynamic `$PORT` binding, peer token verification, and token refresh scheduling.

## User Stories

1. As an Operator deploying 9Router to Sevalla or Railway via Docker, I want builds to finish in under 2 minutes, so that CI/CD rollouts are fast and reliable.
2. As an Operator, I want global CDN registries by default, so that builds in US/EU regions do not stall behind Great Firewall network bottlenecks.
3. As an Operator, I want BuildKit cache mounts on both `/root/.npm` and `/app/.next/cache`, so that repeated builds reuse layers.
4. As a Developer, I want `.dockerignore` to trim non-runtime directories, so that build context uploads are nearly instantaneous.
5. As a Developer, I want automated unit tests in `tests/unit/docker-config.test.js`, so that regressions in Docker configuration are caught before deployment.

## Implementation Decisions

- **Multi-Stage Architecture:** `base` -> `builder` -> `runner` stages on `node:22-alpine`.
- **Global CDN Defaults:** Official Alpine mirror (`dl-cdn.alpinelinux.org`) and npm registry (`https://registry.npmjs.org/`).
- **Targeted Toolchain:** Install `python3 make g++ linux-headers` for `better-sqlite3` native bindings.
- **Cache Mounts:** Mount `/root/.npm` for package caching and `/app/.next/cache` for Next.js build cache.
- **Minimal Runtime Context:** Runner stage copies only static assets, standalone output, `open-sse`, MITM engine, and required un-traced modules (`node-forge`, `next`, `sql.js`, `node-machine-id`).
- **Entrypoint:** `/entrypoint.sh` wraps `node custom-server.js` with `su-exec node`.

## Testing Decisions

- Automated test suite in `tests/unit/docker-config.test.js` validating:
  - File existence at workspace root.
  - Global registry defaults (absence of hardcoded Aliyun / npmmirror).
  - Native compiler provisioning without distro upgrades.
  - Entrypoint binding to `custom-server.js`.
  - Exclusion of heavy directories in `.dockerignore` (`crates`, `.scratch`, `tests`, `gitbook`, `cli`, `.github`).
  - Cache mount utilization on Next.js build.
  - Skips for npm audit and fund.

## Out of Scope

- Removing alternative buildpacks (`nixpacks.toml`, `railpack.json`).
- Committing `package-lock.json`.
- Modifying runtime reverse proxy behavior in `custom-server.js`.
