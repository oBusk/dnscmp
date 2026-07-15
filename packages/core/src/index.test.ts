import assert from "node:assert/strict";
import { test } from "node:test";
import { dnscmp } from "./index.ts";
import { startFakeDnsServer, type FakeDnsServer } from "./test/fake-dns-server.ts";

async function closeAll(servers: FakeDnsServer[]): Promise<void> {
  await Promise.all(servers.map((s) => s.close()));
}

test("dnscmp sorts providers by ascending average and puts unresponsive ones last", async () => {
  const fast = await startFakeDnsServer(() => ({ rcode: 0 }), {
    address: "127.0.0.1",
  });
  const slow = await startFakeDnsServer(() => ({ rcode: 0, delayMs: 15 }), {
    address: "127.0.0.2",
    port: fast.port,
  });
  const failing = await startFakeDnsServer(() => ({ rcode: 2 }), {
    address: "127.0.0.3",
    port: fast.port,
  });

  try {
    const seen: string[] = [];
    const results = await dnscmp({
      providers: [
        { name: "slow", resolvers: ["127.0.0.2"] },
        { name: "failing", resolvers: ["127.0.0.3"] },
        { name: "fast", resolvers: ["127.0.0.1"] },
      ],
      domains: ["example.test"],
      tries: 4,
      port: fast.port,
      onResult: (r) => seen.push(r.name),
    });

    assert.deepEqual(
      results.map((r) => r.name),
      ["fast", "slow", "failing"],
    );
    assert.equal(results[0]!.resolver, "127.0.0.1");
    assert.equal(results[1]!.resolver, "127.0.0.2");
    assert.ok(results[0]!.avg !== null && results[1]!.avg !== null);
    assert.ok(results[0]!.avg! < results[1]!.avg!);
    assert.equal(results[2]!.avg, null);

    assert.deepEqual(new Set(seen), new Set(["fast", "slow", "failing"]));
  } finally {
    await closeAll([fast, slow, failing]);
  }
});

test("dnscmp picks the fastest resolver within a provider", async () => {
  const fast = await startFakeDnsServer(() => ({ rcode: 0 }), {
    address: "127.0.0.1",
  });
  const slow = await startFakeDnsServer(() => ({ rcode: 0, delayMs: 15 }), {
    address: "127.0.0.2",
    port: fast.port,
  });

  try {
    const results = await dnscmp({
      providers: [
        { name: "multi", resolvers: ["127.0.0.2", "127.0.0.1"] },
      ],
      domains: ["example.test"],
      tries: 2,
      port: fast.port,
    });

    assert.equal(results.length, 1);
    assert.equal(results[0]!.resolver, "127.0.0.1");
  } finally {
    await closeAll([fast, slow]);
  }
});
