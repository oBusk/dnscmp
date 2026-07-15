import { createSocket, type Socket } from "node:dgram";
import { decode, encode, type DecodedPacket } from "dns-packet";

export interface FakeDnsResponse {
  rcode?: number;
  delayMs?: number;
}

export type FakeDnsHandler = (
  query: DecodedPacket,
) => FakeDnsResponse | "drop" | Promise<FakeDnsResponse | "drop">;

export interface FakeDnsServer {
  port: number;
  close(): Promise<void>;
}

export interface FakeDnsServerOptions {
  address?: string;
  port?: number;
}

/**
 * A minimal UDP DNS server for tests: decodes each incoming query and lets
 * `handler` decide how (or whether) to respond, so tests can simulate
 * specific rcodes, response delays, or dropped packets without touching the
 * real network.
 */
export function startFakeDnsServer(
  handler: FakeDnsHandler,
  options: FakeDnsServerOptions = {},
): Promise<FakeDnsServer> {
  const address = options.address ?? "127.0.0.1";
  const requestedPort = options.port ?? 0;

  return new Promise<FakeDnsServer>((resolve, reject) => {
    const socket: Socket = createSocket("udp4");

    const onError = (err: Error): void => reject(err);
    socket.once("error", onError);

    socket.on("message", (msg: Buffer, rinfo) => {
      void (async () => {
        const query = decode(msg);
        const result = await handler(query);
        if (result === "drop") return;

        if (result.delayMs) {
          await new Promise((r) => setTimeout(r, result.delayMs));
        }

        const response = encode({
          type: "response",
          id: query.id,
          flags: result.rcode ?? 0,
          questions: query.questions,
          answers: [],
        });
        socket.send(response, rinfo.port, rinfo.address);
      })();
    });

    socket.bind(requestedPort, address, () => {
      socket.off("error", onError);
      const boundAddress = socket.address();
      resolve({
        port: boundAddress.port,
        close: () => new Promise<void>((res) => socket.close(() => res())),
      });
    });
  });
}
