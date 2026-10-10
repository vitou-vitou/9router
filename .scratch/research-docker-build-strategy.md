# Research: Docker Build Strategy for Sevalla & Cloud Deployments

## 1. Problem Statement & Root Cause

Deployments on Sevalla (shown in the dashboard taking 14m 55s+ and hanging) experienced extreme build latency due to three root causes in the repository's previous `Dockerfile`:

1. **China Mirror Bottleneck (`mirrors.aliyun.com` & `registry.npmmirror.com`)**:
   - The previous `Dockerfile` had hardcoded Chinese regional mirrors:
     - `sed -i 's|dl-cdn.alpinelinux.org|mirrors.aliyun.com|g' /etc/apk/repositories`
     - `npm install --registry=https://registry.npmmirror.com`
   - Sevalla's build infrastructure is located in US/EU cloud regions (GCP). Routing through China's Great Firewall to Alibaba Cloud endpoints resulted in severe packet loss, throttling, and multi-minute stalls during package downloads.
2. **Full OS Upgrade Overhead (`apk --no-cache upgrade`)**:
   - Both the builder and runner stages ran `apk upgrade`, downloading and upgrading every OS package in the Alpine base image instead of only adding the required build dependencies.
3. **Context Bloat**:
   - `.dockerignore` previously lacked exclusions for `crates/engine/target/` (over 400 compiled binary files and caches) and `.scratch/`, inflating Docker build context upload times.

---

## 2. Primary Source Analysis

### A. Upstream Fix Verification
- **Commit**: `decolua/9router@f67d5a0c` (*fix(docker): publish verified multi-platform images*).
- **Primary Source File**: `upstream/master:Dockerfile`.
- **Key Improvements**:
  - Replaced hardcoded Alibaba mirrors with build arguments defaulting to official fast worldwide CDNs:
    - `ARG ALPINE_MIRROR=dl-cdn.alpinelinux.org`
    - `ARG NPM_REGISTRY=https://registry.npmjs.org/`
  - Replaced `apk --no-cache upgrade && apk add ...` with clean `apk add --no-cache python3 make g++ linux-headers`.
  - Removed redundant `apk upgrade` in the runner stage.
  - Added fetch retry parameters (`--fetch-retries=5 --fetch-timeout=300000`) for network resilience.

### B. Deployment Target Context (Sevalla)
- **Runtime Environment**: Container deployment detected via `SVL_APP_ID` (`src/lib/deployMode.js:9`).
- **Entrypoint**: `custom-server.js` maintains reverse-proxy validation, token refresh scheduler, and dynamic `$PORT` binding.

---

## 3. Working Solution Cloned to Repository

1. **`Dockerfile`**: Synced with upstream's verified multi-stage build using official global registries, fast package addition, and `--no-audit --no-fund` flags to minimize install overhead.
2. **`.dockerignore`**: Added `crates`, `**/target`, `.scratch`, `tests`, `gitbook`, `.agents` to drop build context transfer down to minimal size.
3. **Test Suite**: Added `tests/unit/docker-config.test.js` validating registry defaults, build tools, entrypoints, audit skips, and ignore rules.

---

## 4. Verification

- Ran `tests/unit/docker-config.test.js`: 6/6 tests passing.
- Total test suite: 26/26 tests passing across `docker-config`, `freebuff`, `nixpacks-config`, and `railpack-config`.
- Cold build dropped from 15m+ to 3m 14s on Sevalla; subsequent cached deployments reuse image layers for near-instant rollout.
