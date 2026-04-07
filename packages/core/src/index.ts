import { Resolver } from "dns/promises";

const DOMAINS = ["example.com", "example.org", "example.net"];
const TRIES = 10;

const SERVERS = [
  { name: "Cloudflare", ip: "1.1.1.1" },
  { name: "Google", ip: "8.8.8.8" },
] as const;

async function measureAvg(ip: string): Promise<number> {
  const resolver = new Resolver();
  resolver.setServers([ip]);

  let total = 0;
  for (let i = 0; i < TRIES; i++) {
    for (const domain of DOMAINS) {
      const start = performance.now();
      await resolver.resolve4(domain);
      total += performance.now() - start;
    }
  }
  return total / (TRIES * DOMAINS.length);
}

export interface DnsResult {
  name: string;
  ip: string;
  avg: number;
}

export async function dnscmp(): Promise<DnsResult[]> {
  const results = await Promise.all(
    SERVERS.map(async ({ name, ip }) => ({
      name,
      ip,
      avg: await measureAvg(ip),
    })),
  );

  results.sort((a, b) => a.avg - b.avg);

  return results;
}
