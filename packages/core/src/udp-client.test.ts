import assert from "node:assert/strict";
import { createSocket, type Socket } from "node:dgram";
import { test } from "node:test";
import { UdpClient } from "./udp-client.ts";

function startEchoServer(
  onMessage: (msg: Buffer, reply: (data: Buffer) => void) => void,
): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const socket: Socket = createSocket("udp4");
    socket.on("message", (msg, rinfo) => {
      onMessage(msg, (data) => socket.send(data, rinfo.port, rinfo.address));
    });
    socket.bind(0, "127.0.0.1", () => {
      const address = socket.address();
      resolve({
        port: address.port,
        close: () => new Promise((res) => socket.close(() => res())),
      });
    });
  });
}

test("UdpClient throws synchronously for an invalid host", () => {
  assert.throws(() => new UdpClient("not-an-ip", 53), /invalid host/);
});

test("UdpClient.request resolves with the matching reply and a network time", async () => {
  const server = await startEchoServer((_msg, reply) => {
    reply(Buffer.from("pong"));
  });
  const client = new UdpClient("127.0.0.1", server.port);
  try {
    const { data, networkMs } = await client.request(
      Buffer.from("ping"),
      1000,
      () => true,
    );
    assert.equal(data.toString(), "pong");
    assert.equal(typeof networkMs, "number");
    assert.ok(networkMs >= 0);
  } finally {
    client.close();
    await server.close();
  }
});

test("UdpClient.request ignores replies that don't match until one does", async () => {
  const server = await startEchoServer((_msg, reply) => {
    reply(Buffer.from("wrong"));
    setTimeout(() => reply(Buffer.from("right")), 10);
  });
  const client = new UdpClient("127.0.0.1", server.port);
  try {
    const { data } = await client.request(
      Buffer.from("ping"),
      1000,
      (msg) => msg.toString() === "right",
    );
    assert.equal(data.toString(), "right");
  } finally {
    client.close();
    await server.close();
  }
});

test("UdpClient.request rejects with ETIMEOUT when nothing matches in time", async () => {
  const server = await startEchoServer(() => {
    // Never reply.
  });
  const client = new UdpClient("127.0.0.1", server.port);
  try {
    await assert.rejects(
      () => client.request(Buffer.from("ping"), 50, () => false),
      /ETIMEOUT/,
    );
  } finally {
    client.close();
    await server.close();
  }
});
