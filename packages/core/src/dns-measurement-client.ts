import { DnsClient } from "./dns-client.ts";

/**
 * Measures DNS query round-trip time against a single resolver.
 * Rejects with `EBADRCODE:<code>` if the resolver responds with a
 * non-success RCODE.
 */
export class DnsMeasurementClient {
  readonly #client: DnsClient;
  readonly #timeoutMs: number;

  constructor(resolverIp: string, timeoutMs: number) {
    this.#client = new DnsClient(resolverIp);
    this.#timeoutMs = timeoutMs;
  }

  async query(domain: string): Promise<number> {
    const { rcode, rtt } = await this.#client.query(domain, this.#timeoutMs);
    if (rcode !== 0) {
      throw new Error(`EBADRCODE:${rcode}`);
    }
    return rtt;
  }

  close(): void {
    this.#client.close();
  }
}
