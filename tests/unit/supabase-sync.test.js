import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ENV_KEYS = [
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_BUCKET",
  "SUPABASE_OBJECT",
  "SUPABASE_SYNC_MS",
  "DATA_DIR",
];

const SQLITE_HEADER = Buffer.from("SQLite format 3\0");

function sqliteBytes(extra = "providers-and-keys") {
  return Buffer.concat([SQLITE_HEADER, Buffer.from(extra)]);
}

describe("supabase sqlite sync", () => {
  let tmp;
  const saved = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k];
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "9router-supabase-"));
    process.env.DATA_DIR = tmp;
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  async function load() {
    return import("@/lib/db/supabaseSync.js");
  }

  function dataFile() {
    return path.join(tmp, "db", "data.sqlite");
  }

  function writeLocal(buf) {
    fs.mkdirSync(path.dirname(dataFile()), { recursive: true });
    fs.writeFileSync(dataFile(), buf);
  }

  function mockStorage({ download, uploadDelayMs = 0 } = {}) {
    const calls = [];
    vi.stubGlobal("fetch", vi.fn(async (url, opts = {}) => {
      const method = opts.method || "GET";
      calls.push({ url: String(url), method });
      if (String(url).includes("/storage/v1/bucket") && method === "POST") {
        return { ok: false, status: 409, text: async () => "already exists" };
      }
      if (String(url).includes("/storage/v1/object/")) {
        if (method === "GET") {
          if (!download) return { ok: false, status: 404, text: async () => "missing" };
          return { ok: true, status: 200, arrayBuffer: async () => download };
        }
        if (uploadDelayMs) await new Promise((r) => setTimeout(r, uploadDelayMs));
        return { ok: true, status: 200, text: async () => "" };
      }
      if (String(url).includes("/rest/v1/")) {
        return { ok: true, status: 200, text: async () => "" };
      }
      return { ok: false, status: 500, text: async () => "unexpected" };
    }));
    return calls;
  }

  it("does not overwrite a valid local DB with a stale remote copy", async () => {
    const local = sqliteBytes("newer-local");
    writeLocal(local);
    const calls = mockStorage({ download: sqliteBytes("stale-remote") });

    const { pullSqliteFromSupabase } = await load();
    expect(await pullSqliteFromSupabase()).toBe(false);
    expect(fs.readFileSync(dataFile())).toEqual(local);
    expect(calls.some((c) => c.url.includes("/storage/v1/object/"))).toBe(false);
  });

  it("restores from remote when the local file is missing (cold start)", async () => {
    const remote = sqliteBytes("from-remote");
    mockStorage({ download: remote });

    const { pullSqliteFromSupabase } = await load();
    expect(await pullSqliteFromSupabase()).toBe(true);
    expect(fs.readFileSync(dataFile())).toEqual(remote);
    expect(fs.existsSync(`${dataFile()}.tmp`)).toBe(false);
  });

  it("restores from remote when the local file is not a SQLite DB", async () => {
    writeLocal(Buffer.from("xx"));
    fs.writeFileSync(`${dataFile()}-wal`, "old-wal");
    const remote = sqliteBytes("repaired");
    mockStorage({ download: remote });

    const { pullSqliteFromSupabase } = await load();
    expect(await pullSqliteFromSupabase()).toBe(true);
    expect(fs.readFileSync(dataFile())).toEqual(remote);
    expect(fs.existsSync(`${dataFile()}-wal`)).toBe(false);
  });

  it("ignores a remote object that is not a SQLite DB", async () => {
    mockStorage({ download: Buffer.from("not-sqlite-at-all") });

    const { pullSqliteFromSupabase } = await load();
    expect(await pullSqliteFromSupabase()).toBe(false);
    expect(fs.existsSync(dataFile())).toBe(false);
  });

  it("waits for an in-flight upload before the shutdown flush", async () => {
    writeLocal(sqliteBytes("on-disk"));
    const calls = mockStorage({ uploadDelayMs: 80 });
    const { startSupabaseSync } = await load();

    const stop = startSupabaseSync({ checkpoint: () => {} });
    // SIGTERM while the boot upload is still in flight used to skip the
    // shutdown tick (inFlight === true → return), losing later writes.
    await new Promise((r) => setTimeout(r, 15));
    await stop();

    const uploads = calls.filter((c) => c.method === "POST" && c.url.includes("/storage/v1/object/"));
    expect(uploads.length).toBeGreaterThanOrEqual(2);
  });
});
