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
  onResult?: (result: DnsResult) => void;
}

function compareResults<T extends { avg: number | null }>(
  a: T,
  b: T,
): number {
  if (a.avg === null && b.avg === null) return 0;
  if (a.avg === null) return 1;
  if (b.avg === null) return -1;
  return a.avg - b.avg;
}

async function measureAvg(
  resolverIp: string,
  domains: string[],
  tries: number,
): Promise<number | null> {
  let client: DnsClient;
  try {
    client = new DnsClient(resolverIp, QUERY_TIMEOUT_MS);
  } catch {
    // Malformed resolver IP or unusable socket — surface as a null
    // average so the caller still gets a row for this resolver
    // instead of the whole run crashing.
    return null;
  }
  try {
    // Warmup: one untimed query per domain so the timed loop measures
    // warm-path RTT (resolver cache, NAT state, route). Individual
    // failures are ignored, but if every warmup fails the resolver is
    // effectively dead — return null now rather than paying another
    // MAX_CONSECUTIVE_FAILURES * QUERY_TIMEOUT_MS in the timed loop.
    let warmupOk = 0;
    for (const domain of domains) {
      try {
        await client.query(domain);
        warmupOk++;
      } catch {
        // ignore
      }
    }
    if (warmupOk === 0 && domains.length > 0) {
      return null;
    }

    let total = 0;
    let count = 0;
    let consecutiveFailures = 0;

    for (let i = 0; i < tries; i++) {
      for (const domain of domains) {
        try {
          total += await client.query(domain);
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
): Promise<DnsResult> {
  const resolverResults = await Promise.all(
    provider.resolvers.map(async (resolverIp) => ({
      resolverIp,
      avg: await measureAvg(resolverIp, domains, tries),
    })),
  );

  resolverResults.sort(compareResults);

  const best = resolverResults[0]!;
  return { name: provider.name, resolver: best.resolverIp, avg: best.avg };
}

export async function dnscmp(options: DnscmpOptions): Promise<DnsResult[]> {
  const domains = options.domains ?? DEFAULT_DOMAINS;
  const tries = options.tries ?? DEFAULT_TRIES;

  const results = await Promise.all(
    options.providers.map(async (provider) => {
      const result = await measureProvider(provider, domains, tries);
      options.onResult?.(result);
      return result;
    }),
  );

  results.sort(compareResults);

  return results;
}
