import net from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export function isPortAvailable(port, host = "127.0.0.1") {
  return new Promise((resolveResult) => {
    const server = net.createServer();
    server.unref();

    server.once("error", () => {
      resolveResult(false);
    });

    server.listen({ port, host, exclusive: true }, () => {
      server.close(() => {
        resolveResult(true);
      });
    }); 
  });
}

export async function findFreePort(startPort = 20128, opts = {}) {
  const host = opts.host || "127.0.0.1";
  const excludeList = opts.exclude || opts.excludePorts || [20129];
  const excludeSet = new Set(Array.isArray(excludeList) ? excludeList : [excludeList]);
  const maxAttempts = opts.maxAttempts ?? 100;

  let attempt = 0;
  let currentPort = Number(startPort);

  while (attempt < maxAttempts) {
    if (!excludeSet.has(currentPort)) {
      const available = await isPortAvailable(currentPort, host);
      if (available) {
        return currentPort;
      }
    }
    currentPort++;
    attempt++;
  }

  throw new Error(`Maximum attempts (${maxAttempts}) exceeded: could not find a free port starting from ${startPort}`);
}

export function filterPortArgs(args) {
  const filtered = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-p" || arg === "--port") {
      i++; // skip next arg (port value)
      continue;
    }
    if (arg.startsWith("--port=")) {
      continue;
    }
    filtered.push(arg);
  }
  return filtered;
}

export async function runDev(options = {}) {
  const startPort = Number(options.startPort || process.env.PORT) || 20128;
  const targetPort = await findFreePort(startPort, {
    exclude: [20129],
    ...options,
  });

  process.env.PORT = String(targetPort);
  process.env.NEXT_PUBLIC_BASE_URL = `http://localhost:${targetPort}`;

  console.log("==================================================");
  console.log(" 9Router Dev Gateway");
  console.log(` Dashboard: http://localhost:${targetPort}/dashboard`);
  console.log(` API Base:  http://localhost:${targetPort}/v1`);
  if (targetPort !== startPort) {
    console.log("--------------------------------------------------");
    console.log(` [Notice] Port ${startPort} was occupied. Bumped to ${targetPort}.`);
    console.log(` Client tools configured for port ${startPort} will target background instance.`);
  }
  console.log("==================================================");

  const require = createRequire(import.meta.url);
  const nextBin = require.resolve("next/dist/bin/next");
  const forwardArgs = filterPortArgs(process.argv.slice(2));

  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--port", String(targetPort), ...forwardArgs],
    {
      stdio: "inherit",
      env: process.env,
    }
  );

  const forwardSignal = (signal) => {
    if (child && !child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  return child;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(dirname(fileURLToPath(import.meta.url)), "dev-runner.mjs")
) {
  runDev().catch((err) => {
    console.error("[dev-runner] Fatal error:", err);
    process.exit(1);
  });
}
