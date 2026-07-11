import { createSocket, type Socket } from "node:dgram";
import { isIP } from "node:net";
import { encode, RECURSION_DESIRED } from "dns-packet";

const DNS_PORT = 53;

/**
 * Sends UDP DNS A-record queries to a single resolver and reports the
 * network round-trip time in milliseconds. One shared UDP socket per
 * client instance; each in-flight query is tagged with a unique DNS
 * transaction id, so multiple queries may run concurrently and late
 * responses from a previously timed-out query are safely ignored.
 *
 * The timed window covers only the network round-trip: packet
 * encoding, id / RCODE validation, and cleanup all happen outside
 * `t0`/`t1`.
 *
 * Security: the resolver IP is user-supplied, so responses are
 * untrusted input. This class only reads bytes 0..3 of the response
 * (transaction id + RCODE); it never calls `dns-packet.decode()` on
 * the response, so there is no exposed parser surface. Adding
 * `decode()` on incoming packets would re-open that surface and
 * must be re-evaluated against the same threat model.
 */
export class DnsClient {
  readonly #resolverIp: string;
  readonly #timeoutMs: number;
  readonly #socket: Socket;
  #bindPromise: Promise<void> | null = null;
  #id: number;

  constructor(resolverIp: string, timeoutMs: number) {
    const family = isIP(resolverIp);
    if (family === 0) {
      throw new Error(`invalid resolver IP: ${resolverIp}`);
    }
    this.#resolverIp = resolverIp;
    this.#timeoutMs = timeoutMs;
    this.#socket = createSocket(family === 6 ? "udp6" : "udp4");
    this.#id = (Math.random() * 0x10000) | 0;
  }

  async query(domain: string): Promise<number> {
    await this.#ensureBound();
    const id = this.#nextId();
    const packet = encode({
      type: "query",
      id,
      flags: RECURSION_DESIRED,
      questions: [{ type: "A", name: domain }],
    });
    return this.#send(packet, id);
  }

  close(): void {
    try {
      this.#socket.close();
    } catch {
      // socket may already be closed
    }
  }

  #nextId(): number {
    this.#id = (this.#id + 1) & 0xffff;
    return this.#id;
  }

  #ensureBound(): Promise<void> {
    if (this.#bindPromise) return this.#bindPromise;
    this.#bindPromise = new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => {
        this.#socket.off("listening", onListening);
        reject(err);
      };
      const onListening = () => {
        this.#socket.off("error", onError);
        resolve();
      };
      this.#socket.once("listening", onListening);
      this.#socket.once("error", onError);
      this.#socket.bind(0);
    });
    return this.#bindPromise;
  }

  #send(packet: Buffer, expectedId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const socket = this.#socket;
      let timer: ReturnType<typeof setTimeout>;

      // Hoisted so the message/error/timer callbacks below can call it
      // regardless of textual position. Safe because every caller runs
      // asynchronously, after `timer`, `onMessage`, and `onError` are
      // all assigned.
      function cleanup() {
        clearTimeout(timer);
        socket.off("message", onMessage);
        socket.off("error", onError);
      }

      const onMessage = (msg: Buffer) => {
        const t1 = performance.now();
        // Validate id AFTER timing capture so a stray late packet from
        // a previously timed-out query cannot skew the reading and is
        // simply ignored (keep listening).
        if (msg.length < 12 || msg.readUInt16BE(0) !== expectedId) return;
        cleanup();
        // Low nibble of byte 3 is RCODE (RFC 1035). Non-zero means the
        // resolver did answer but returned an error (SERVFAIL, REFUSED,
        // NXDOMAIN, ...); count it as a failed sample rather than a
        // valid timing measurement.
        const rcode = msg.readUInt8(3) & 0x0f;
        if (rcode !== 0) {
          reject(new Error(`EBADRCODE:${rcode}`));
          return;
        }
        resolve(t1 - t0);
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      socket.on("message", onMessage);
      socket.once("error", onError);
      timer = setTimeout(() => {
        cleanup();
        reject(new Error("ETIMEOUT"));
      }, this.#timeoutMs);
      const t0 = performance.now();
      socket.send(packet, DNS_PORT, this.#resolverIp, (err) => {
        if (err) {
          cleanup();
          reject(err);
        }
      });
    });
  }
}
