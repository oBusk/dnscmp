import { randomInt } from "node:crypto";
import { encode, RECURSION_DESIRED } from "dns-packet";
import { UdpClient } from "./udp-client.ts";

const DNS_PORT = 53;

export interface DnsQueryResult {
  rcode: number;
  rtt: number;
}

/**
 * Sends a DNS A-record query to a resolver over UDP.
 */
export class DnsClient {
  readonly #udp: UdpClient;

  constructor(resolverIp: string) {
    this.#udp = new UdpClient(resolverIp, DNS_PORT);
  }

  async query(domain: string, timeoutMs: number): Promise<DnsQueryResult> {
    const id = randomInt(0x10000);
    const packet = encode({
      type: "query",
      id,
      flags: RECURSION_DESIRED,
      questions: [{ type: "A", name: domain }],
    });
    const { data, rtt } = await this.#udp.request(
      packet,
      timeoutMs,
      (msg) => msg.length >= 12 && msg.readUInt16BE(0) === id,
    );
    // Only check RCODE — never parse the rest of the packet, it's
    // from an untrusted source.
    return { rcode: data.readUInt8(3) & 0x0f, rtt };
  }

  close(): void {
    this.#udp.close();
  }
}
