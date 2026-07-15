import type { DnsProvider, DnsResult } from "@dnscmp/types";
import { DnsClient } from "./dns-client.ts";

export type { DnsProvider, DnsResult };

const DEFAULT_DOMAINS = ["example.com", "example.org", "example.net"];
const DEFAULT_TRIES = 10;
const QUERY_TIMEOUT_MS = 1000;
const MAX_CONSECUTIVE_FAILURES = 3;

export interface DnscmpOptions {
  providers: DnsProvider[];
  domains?: string[];
  tries?: number;
  /** DNS port to query, mainly useful for testing against a local resolver. Defaults to 53. */
  port?: number;
  onResult?: (result: DnsResult) => void;
}

function compareResults<T extends { avg: number | null }>(a: T, b: T): number {
  if (a.avg === null && b.avg === null) return 0;
  if (a.avg === null) return 1;
  if (b.avg === null) return -1;
  return a.avg - b.avg;
}

async function measureAvg(
  resolverIp: string,
  domains: string[],
  tries: number,
  port: number | undefined,
): Promise<number | null> {
  let client: DnsClient;
  try {
    client = new DnsClient(resolverIp, port);
  } catch {
    return null;
  }
  try {
    let total = 0;
    let count = 0;
    let consecutiveFailures = 0;

    for (const domain of domains) {
      // Warm up resolver to ensure entry is cached
      try {
        await client.query(domain, QUERY_TIMEOUT_MS);
      } catch {
        // Ignore warm-up failures
      }

      for (let i = 0; i < tries; i++) {
        try {
          const { packet, networkMs } = await client.query(
            domain,
            QUERY_TIMEOUT_MS,
          );
          if (packet.rcode !== "NOERROR") {
            throw new Error(`EBADRCODE:${packet.rcode}`);
          }
          total += networkMs;
          count++;
          consecutiveFailures = 0;
        } catch {
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            return null;
          }
        }
      }
    }

    return count > 0 ? total / count : null;
  } finally {
    client.close();
  }
}

async function measureProvider(
  provider: DnsProvider,
  domains: string[],
  tries: number,
  port: number | undefined,
): Promise<DnsResult> {
  const resolverResults = await Promise.all(
    provider.resolvers.map(async (resolverIp) => ({
      resolverIp,
      avg: await measureAvg(resolverIp, domains, tries, port),
    })),
  );

  resolverResults.sort(compareResults);

  const best = resolverResults[0]!;
  return { name: provider.name, resolver: best.resolverIp, avg: best.avg };
}

export async function dnscmp(options: DnscmpOptions): Promise<DnsResult[]> {
  const domains = options.domains ?? DEFAULT_DOMAINS;
  const tries = options.tries ?? DEFAULT_TRIES;
  const port = options.port;

  const results = await Promise.all(
    options.providers.map(async (provider) => {
      const result = await measureProvider(provider, domains, tries, port);
      options.onResult?.(result);
      return result;
    }),
  );

  results.sort(compareResults);

  return results;
}
