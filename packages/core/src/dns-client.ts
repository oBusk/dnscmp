import { randomInt } from "node:crypto";
import {
  decode,
  encode,
  RECURSION_DESIRED,
  type DecodedPacket,
} from "dns-packet";
import { UdpClient } from "./udp-client.ts";

const DNS_PORT = 53;

// dns-packet sets `rcode` at runtime but @types/dns-packet omits it.
export type DnsPacket = DecodedPacket & { rcode?: string };

export interface DnsResponse {
  packet: DnsPacket;
  networkMs: number;
  parseMs: number;
}

/**
 * DNS client that sends A-record queries to a resolver over UDP and
 * returns the decoded response, along with how long the network
 * round-trip and response parsing took.
 */
export class DnsClient {
  readonly #udp: UdpClient;

  constructor(resolverIp: string) {
    this.#udp = new UdpClient(resolverIp, DNS_PORT);
  }

  async query(domain: string, timeoutMs: number): Promise<DnsResponse> {
    const id = randomInt(0x10000);
    const query = encode({
      type: "query",
      id,
      flags: RECURSION_DESIRED,
      questions: [{ type: "A", name: domain }],
    });
    const { data, networkMs } = await this.#udp.request(
      query,
      timeoutMs,
      (msg) => msg.length >= 12 && msg.readUInt16BE(0) === id,
    );
    const parseStart = performance.now();
    const packet: DnsPacket = decode(data);
    const parseMs = performance.now() - parseStart;
    return { packet, networkMs, parseMs };
  }

  close(): void {
    this.#udp.close();
  }
}
