$msg = @"
feat(docker): bundle headroom sidecar for single-container hosts

- base image node:22-alpine -> node:22-bookworm-slim (headroom ships
  manylinux wheels only; no musllinux build possible on musl)
- venv /opt/headroom with headroom-ai[proxy,code]; [ml] (torch ~1GB) omitted
- entrypoint starts headroom proxy on 127.0.0.1:8787 loopback-only,
  pid-tracked at `$DATA_DIR/headroom/proxy.pid` so dashboard Start/Stop and
  [code]/[ml] restart toggles keep working in-container; HEADROOM_BUNDLED=0 opts out
- entrypoint hardening from local smoke test: strip CRLF shebang, setpriv
  instead of alpine-only su-exec, HOME=/app/data-home for the node user,
  uv pip for the install (pip backtracked through 36MB litellm wheels)
- fix stale headroom image name in docker-compose.yml + DOCKER.md
  (chopratejas -> headroomlabs-ai)
"@
$parent = (git rev-parse master).Trim()
$tree = (git write-tree).Trim()
$sha = ($msg | git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>"-tree $tree -p $parent).Trim()
git reset --hard $sha
"new tip: $sha"
