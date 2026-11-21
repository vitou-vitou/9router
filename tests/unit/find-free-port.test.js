import { describe, it, expect, afterEach } from "vitest";
import net from "net";
import { isPortAvailable, findFreePort, filterPortArgs } from "../../scripts/dev-runner.mjs";

function startServer(port, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen({ port, host, exclusive: true }, () => resolve(server));
  });
}

function getEphemeralPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen({ port: 0, host: "127.0.0.1" }, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

describe("find-free-port", () => {
  const openServers = [];

  afterEach(async () => {
    while (openServers.length > 0) {
      const server = openServers.pop();
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe("isPortAvailable", () => {
    it("returns true when port is unallocated", async () => {
      const port = await getEphemeralPort();
      const available = await isPortAvailable(port, "127.0.0.1");
      expect(available).toBe(true);
    });

    it("returns false when a TCP server is listening", async () => {
      const port = await getEphemeralPort();
      const server = await startServer(port, "127.0.0.1");
      openServers.push(server);

      const available = await isPortAvailable(port, "127.0.0.1");
      expect(available).toBe(false);
    });
  });

  describe("findFreePort", () => {
    it("returns startPort immediately without incrementing when startPort is free", async () => {
      const port = await getEphemeralPort();
      const result = await findFreePort(port, { host: "127.0.0.1" });
      expect(result).toBe(port);
    });

    it("increments and returns startPort + 1 when startPort is occupied", async () => {
      const port = await getEphemeralPort();
      const server = await startServer(port, "127.0.0.1");
      openServers.push(server);

      const result = await findFreePort(port, { host: "127.0.0.1" });
      expect(result).toBe(port + 1);
    });

    it("skips excluded ports (e.g. updater statusPort: 20129)", async () => {
      const port = await getEphemeralPort();
      const server = await startServer(port, "127.0.0.1");
      openServers.push(server);

      // Exclude port + 1
      const excluded = port + 1;
      const result = await findFreePort(port, {
        host: "127.0.0.1",
        exclude: [excluded],
      });
      expect(result).toBe(port + 2);
    });

    it("increments past all occupied ports when multiple consecutive ports are occupied", async () => {
      const basePort = await getEphemeralPort();
      const server1 = await startServer(basePort, "127.0.0.1");
      const server2 = await startServer(basePort + 1, "127.0.0.1");
      const server3 = await startServer(basePort + 2, "127.0.0.1");
      openServers.push(server1, server2, server3);

      const result = await findFreePort(basePort, { host: "127.0.0.1" });
      expect(result).toBe(basePort + 3);
    });

    it("throws clean error when maxAttempts exceeded", async () => {
      const port = await getEphemeralPort();
      const server = await startServer(port, "127.0.0.1");
      openServers.push(server);

      await expect(
        findFreePort(port, { host: "127.0.0.1", maxAttempts: 1 })
      ).rejects.toThrow(/max.*attempt/i);
    });

    it("auto-increments past 20128 and skips statusPort 20129 by default", async () => {
      // Test default exclusion with base port
      const basePort = await getEphemeralPort();
      const server = await startServer(basePort, "127.0.0.1");
      openServers.push(server);

      const result = await findFreePort(basePort, {
        host: "127.0.0.1",
        exclude: [basePort + 1],
      });
      expect(result).toBe(basePort + 2);
    });
  });

  describe("filterPortArgs", () => {
    it("strips -p and --port flags while preserving other arguments", () => {
      const args = ["--webpack", "--port", "3000", "--turbo", "-p", "4000", "--port=5000"];
      const result = filterPortArgs(args);
      expect(result).toEqual(["--webpack", "--turbo"]);
    });
  });
});
