import { DnsClient } from "./dns-client.ts";

/**
 * Measures DNS query network round-trip time against a single
 * resolver. Rejects with `EBADRCODE:<rcode>` if the resolver responds
 * with a non-success RCODE.
 */
export class DnsMeasurementClient {
  readonly #client: DnsClient;
  readonly #timeoutMs: number;

  constructor(resolverIp: string, timeoutMs: number) {
    this.#client = new DnsClient(resolverIp);
    this.#timeoutMs = timeoutMs;
  }

  async query(domain: string): Promise<number> {
    const { packet, networkMs } = await this.#client.query(
      domain,
      this.#timeoutMs,
    );
    if (packet.rcode !== "NOERROR") {
      throw new Error(`EBADRCODE:${packet.rcode}`);
    }
    return networkMs;
  }

  close(): void {
    this.#client.close();
  }
}
