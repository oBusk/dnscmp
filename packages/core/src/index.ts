import type { DnsProvider, DnsResult } from "@dnscmp/types";
import { Resolver } from "dns/promises";

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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("ETIMEOUT")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

async function measureAvg(
  resolverIp: string,
  domains: string[],
  tries: number,
): Promise<number | null> {
  const resolver = new Resolver();
  resolver.setServers([resolverIp]);

  let total = 0;
  let count = 0;
  let consecutiveFailures = 0;

  for (let i = 0; i < tries; i++) {
    for (const domain of domains) {
      try {
        const start = performance.now();
        await withTimeout(resolver.resolve4(domain), QUERY_TIMEOUT_MS);
        total += performance.now() - start;
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
