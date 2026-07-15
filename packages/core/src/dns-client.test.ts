import assert from "node:assert/strict";
import { test } from "node:test";
import { DnsClient } from "./dns-client.ts";
import { startFakeDnsServer } from "./test/fake-dns-server.ts";

test("DnsClient.query resolves a NOERROR response", async () => {
  const server = await startFakeDnsServer(() => ({ rcode: 0 }));
  const client = new DnsClient("127.0.0.1", server.port);
  try {
    const { packet, networkMs, parseMs } = await client.query(
      "example.com",
      1000,
    );
    assert.equal(packet.rcode, "NOERROR");
    assert.equal(packet.type, "response");
    assert.ok(networkMs >= 0);
    assert.ok(parseMs >= 0);
  } finally {
    client.close();
    await server.close();
  }
});

test("DnsClient.query surfaces non-NOERROR rcodes", async () => {
  const server = await startFakeDnsServer(() => ({ rcode: 3 })); // NXDOMAIN
  const client = new DnsClient("127.0.0.1", server.port);
  try {
    const { packet } = await client.query("nonexistent.example", 1000);
    assert.equal(packet.rcode, "NXDOMAIN");
  } finally {
    client.close();
    await server.close();
  }
});

test("DnsClient.query rejects with ETIMEOUT when the resolver never replies", async () => {
  const server = await startFakeDnsServer(() => "drop");
  const client = new DnsClient("127.0.0.1", server.port);
  try {
    await assert.rejects(
      () => client.query("example.com", 50),
      /ETIMEOUT/,
    );
  } finally {
    client.close();
    await server.close();
  }
});
