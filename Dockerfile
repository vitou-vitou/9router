# syntax=docker/dockerfile:1.7
# Debian (glibc), not alpine: the bundled Headroom sidecar ships manylinux
# wheels only (no musllinux) — its Rust extension cannot build on musl.
ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS base
WORKDIR /app

FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN --mount=type=cache,id=s/8d92532c-895a-4f63-a978-b7025e83c632-npm,target=/root/.npm \
  npm install --registry=https://registry.npmmirror.com

COPY . ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="9router"

ENV NODE_ENV=production
ENV PORT=20128
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/custom-server.js ./custom-server.js
COPY --from=builder /app/open-sse ./open-sse
# Next file tracing can omit sibling files; MITM runs server.js as a separate process.
COPY --from=builder /app/src/mitm ./src/mitm
# Standalone node_modules may omit deps only required by the MITM child process.
COPY --from=builder /app/node_modules/node-forge ./node_modules/node-forge
# Ensure `next` is available at runtime in case tracing did not include it.
COPY --from=builder /app/node_modules/next ./node_modules/next
# sql.js loads dist/sql-wasm.wasm by path at runtime; tracing only follows JS imports,
# so the last-resort DB driver would abort with ENOENT on the missing binary.
COPY --from=builder /app/node_modules/sql.js ./node_modules/sql.js
# node-machine-id is createRequire-loaded at runtime; tracing omits it.
COPY --from=builder /app/node_modules/node-machine-id ./node_modules/node-machine-id

# Bundled Headroom compression sidecar (Token Saver). Isolated venv so the
# system Python stays clean; [code] = tree-sitter AST compression. [ml] (torch,
# ~1 GB) intentionally omitted — falls back gracefully at runtime. Installed
# with uv (headroom's own Dockerfile does the same): pip's resolver backtracks
# through many 36MB litellm wheels on this dep set.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv curl && rm -rf /var/lib/apt/lists/* \
 && python3 -m venv /opt/headroom \
 && /opt/headroom/bin/pip install --no-cache-dir uv \
 && /opt/headroom/bin/uv pip install --python /opt/headroom/bin/python \
    --no-cache "headroom-ai[proxy,code]"
ENV PATH="/opt/headroom/bin:${PATH}"

RUN mkdir -p /app/data && chown -R node:node /app && \
  mkdir -p /app/data-home && chown node:node /app/data-home && \
  ln -sf /app/data-home /root/.9router 2>/dev/null || true

# Fix permissions at runtime (handles mounted volumes). Headroom runs as a
# background child of the entrypoint, pid-tracked at $DATA_DIR/headroom/proxy.pid
# (same file src/lib/headroom/process.js manages on local installs), so the
# dashboard Start/Stop/restart-extras flow keeps working in-container.
RUN apt-get update && apt-get install -y --no-install-recommends util-linux && rm -rf /var/lib/apt/lists/* && \
  cat > /entrypoint.sh <<'EOF' && chmod +x /entrypoint.sh && sed -i 's/\r$//' /entrypoint.sh
#!/bin/sh
chown -R node:node /app/data /app/data-home 2>/dev/null
# node user must not read/write /root: headroom writes ~/.headroom on start.
export HOME=/app/data-home
if [ "${HEADROOM_BUNDLED:-1}" != "0" ] && command -v headroom >/dev/null 2>&1; then
  mkdir -p /app/data/headroom
  chown node:node /app/data/headroom
  setpriv --reuid=node --regid=node --init-groups sh -c 'headroom proxy --host 127.0.0.1 --port "${HEADROOM_PORT:-8787}" --stateless >> /app/data/headroom/proxy.log 2>&1 & echo $! > /app/data/headroom/proxy.pid'
fi
exec setpriv --reuid=node --regid=node --init-groups "$@"
EOF

EXPOSE 20128

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "custom-server.js"]
