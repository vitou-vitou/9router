/**
 * Persist the local SQLite file to Supabase Storage.
 * 9Router stays SQLite — this is a remote copy of DATA_FILE, not Postgres.
 *
 * Env:
 *   SUPABASE_URL                 https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    service_role or sb_secret_… (server only)
 *   SUPABASE_SECRET_KEY          alias for the same secret
 *   SUPABASE_BUCKET              optional, default 9router-data
 *   SUPABASE_OBJECT              optional, default db/data.sqlite
 *   SUPABASE_SYNC_MS             optional, default 30000
 *
 * Do not use the Next.js wizard (anon / publishable / @supabase/ssr). That is
 * browser auth for Postgres tables. This path uploads the SQLite file to Storage.
 */
import fs from "node:fs";
import path from "node:path";
import { DATA_FILE } from "./paths.js";

const DEFAULT_BUCKET = "9router-data";
const DEFAULT_OBJECT = "db/data.sqlite";
const DEFAULT_SYNC_MS = 30_000;
const SQLITE_HEADER = "SQLite format 3\0";
const SQLITE_SIDECARS = ["-wal", "-shm", "-journal"];

function config() {
  const url = String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  if (!url || !key) return null;
  if (/publishable|anon/i.test(key) || key.startsWith("sb_publishable_")) {
    console.warn("[supabase-sync] publishable/anon key cannot upload a private DB — use service_role or sb_secret_");
    return null;
  }
  return {
    url,
    key,
    bucket: process.env.SUPABASE_BUCKET || DEFAULT_BUCKET,
    object: process.env.SUPABASE_OBJECT || DEFAULT_OBJECT,
    intervalMs: Math.max(5_000, Number(process.env.SUPABASE_SYNC_MS) || DEFAULT_SYNC_MS),
  };
}

export function isSupabaseSyncConfigured() {
  return Boolean(config());
}

function objectUrl(cfg) {
  const segs = String(cfg.object).split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return `${cfg.url}/storage/v1/object/${encodeURIComponent(cfg.bucket)}/${segs}`;
}

function headers(key, extra = {}) {
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    ...extra,
  };
}

function localSqliteLooksValid() {
  try {
    if (!fs.existsSync(DATA_FILE)) return false;
    const st = fs.statSync(DATA_FILE);
    if (st.size < SQLITE_HEADER.length) return false;
    const fd = fs.openSync(DATA_FILE, "r");
    try {
      const header = Buffer.alloc(SQLITE_HEADER.length);
      fs.readSync(fd, header, 0, header.length, 0);
      return header.toString("utf8") === SQLITE_HEADER;
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

function removeSqliteSidecars() {
  for (const suffix of SQLITE_SIDECARS) {
    try { fs.unlinkSync(`${DATA_FILE}${suffix}`); } catch { /* no sidecar */ }
  }
}

async function ensureBucket(cfg) {
  const res = await fetch(`${cfg.url}/storage/v1/bucket`, {
    method: "POST",
    headers: headers(cfg.key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: cfg.bucket, name: cfg.bucket, public: false }),
  });
  if (res.ok || res.status === 409) return;
  const text = await res.text().catch(() => "");
  // Already exists (some API versions return 400 with that message)
  if (/already exists|duplicate/i.test(text)) return;
  throw new Error(`create bucket ${cfg.bucket}: HTTP ${res.status} ${text.slice(0, 200)}`);
}

export async function pullSqliteFromSupabase() {
  const cfg = config();
  if (!cfg) return false;
  // Warm restart (same container, ephemeral disk still there) or a local
  // checkout with SUPABASE_* set: the file on disk is at least as new as the
  // last completed upload. Blind overwrite here dropped providers/keys written
  // since that upload, and could replay a leftover WAL onto the stale remote.
  if (localSqliteLooksValid()) {
    console.log("[supabase-sync] local DB present — keeping it (not overwritten by remote)");
    return false;
  }
  await ensureBucket(cfg);
  const res = await fetch(objectUrl(cfg), { headers: headers(cfg.key) });
  if (res.status === 404) {
    console.log("[supabase-sync] no remote DB yet — starting empty");
    return false;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`download: HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < SQLITE_HEADER.length || buf.subarray(0, SQLITE_HEADER.length).toString("utf8") !== SQLITE_HEADER) {
    console.warn("[supabase-sync] remote object is not a SQLite database, ignoring");
    return false;
  }
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, DATA_FILE);
  removeSqliteSidecars();
  console.log(`[supabase-sync] restored ${buf.length} bytes → ${DATA_FILE}`);
  return true;
}

export async function pushSqliteToSupabase(adapter) {
  const cfg = config();
  if (!cfg) return false;
  try {
    adapter?.checkpoint?.();
  } catch {
    /* still try to upload whatever is on disk */
  }
  if (!fs.existsSync(DATA_FILE)) return false;
  const buf = fs.readFileSync(DATA_FILE);
  if (buf.length < SQLITE_HEADER.length) return false;
  await ensureBucket(cfg);
  const res = await fetch(objectUrl(cfg), {
      method: "POST",
      headers: headers(cfg.key, {
        "Content-Type": "application/octet-stream",
        "x-upsert": "true",
      }),
      body: buf,
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`upload: HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  // Storage traffic does not count as Postgres activity. Hit PostgREST so
  // Free-plan projects are less likely to auto-pause after 7 idle days.
  await fetch(`${cfg.url}/rest/v1/`, { headers: headers(cfg.key, { Accept: "application/json" }) }).catch(() => {});
  return true;
}

export function startSupabaseSync(adapter) {
  const cfg = config();
  if (!cfg) return () => {};

  let inFlight = null;
  const tick = async (reason) => {
    // Interval ticks may skip a busy slot; shutdown must wait, then flush
    // again. Render Free sends SIGTERM on spin-down — dropping that upload
    // loses every write since the last completed interval.
    if (inFlight) {
      if (reason !== "shutdown") return;
      try { await inFlight; } catch { /* previous attempt already logged */ }
    }
    inFlight = (async () => {
      try {
        await pushSqliteToSupabase(adapter);
        if (reason !== "interval") {
          console.log(`[supabase-sync] uploaded (${reason})`);
        }
      } catch (e) {
        console.warn(`[supabase-sync] upload failed: ${e.message}`);
      }
    })();
    try {
      await inFlight;
    } finally {
      inFlight = null;
    }
  };

  tick("boot").catch(() => {});
  const timer = setInterval(() => tick("interval"), cfg.intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  console.log(`[supabase-sync] every ${cfg.intervalMs / 1000}s → ${cfg.bucket}/${cfg.object}`);

  return async () => {
    clearInterval(timer);
    await tick("shutdown");
  };
}
