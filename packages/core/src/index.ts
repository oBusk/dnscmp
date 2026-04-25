import type { DnsProvider, DnsResult } from "@dnscmp/types";
import { createSocket, type Socket } from "node:dgram";
import { isIPv6 } from "node:net";
import { encode, RECURSION_DESIRED } from "dns-packet";

export type { DnsProvider, DnsResult };

const DEFAULT_DOMAINS = ["example.com", "example.org", "example.net"];
const DEFAULT_TRIES = 10;
const QUERY_TIMEOUT_MS = 1000;
const MAX_CONSECUTIVE_FAILURES = 3;
const DNS_PORT = 53;

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

function bindSocket(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (err: Error) => {
      socket.off("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      socket.off("error", onError);
      resolve();
    };
    socket.once("listening", onListening);
    socket.once("error", onError);
    socket.bind(0);
  });
}

function queryOnce(
  socket: Socket,
  resolverIp: string,
  query: Buffer,
  expectedId: number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const onMessage = (msg: Buffer) => {
      const t1 = performance.now();
      // Validate id AFTER timing capture so a stray late packet from a
      // previously timed-out query is ignored without affecting timing.
      if (msg.length < 2 || msg.readUInt16BE(0) !== expectedId) return;
      cleanup();
      resolve(t1 - t0);
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("ETIMEOUT"));
    }, QUERY_TIMEOUT_MS);
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("message", onMessage);
      socket.off("error", onError);
    };
    socket.on("message", onMessage);
    socket.once("error", onError);
    const t0 = performance.now();
    socket.send(query, DNS_PORT, resolverIp, (err) => {
      if (err) {
        cleanup();
        reject(err);
      }
    });
  });
}

function buildQuery(domain: string, id: number): Buffer {
  return encode({
    type: "query",
    id,
    flags: RECURSION_DESIRED,
    questions: [{ type: "A", name: domain }],
  });
}

async function measureAvg(
  resolverIp: string,
  domains: string[],
  tries: number,
): Promise<number | null> {
  const socket = createSocket(isIPv6(resolverIp) ? "udp6" : "udp4");
  try {
    await bindSocket(socket);

    let id = (Math.random() * 0x10000) | 0;
    const nextId = () => (id = (id + 1) & 0xffff);

    // Warmup: one untimed query per domain so the timed loop measures
    // warm-path RTT (resolver cache, NAT state, route). Failures are
    // ignored — the timed loop's failure accounting catches genuine
    // unreachability.
    for (const domain of domains) {
      const qid = nextId();
      try {
        await queryOnce(socket, resolverIp, buildQuery(domain, qid), qid);
      } catch {
        // ignore
      }
    }

    let total = 0;
    let count = 0;
    let consecutiveFailures = 0;

    for (let i = 0; i < tries; i++) {
      for (const domain of domains) {
        const qid = nextId();
        const query = buildQuery(domain, qid);
        try {
          const ms = await queryOnce(socket, resolverIp, query, qid);
          total += ms;
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
    socket.close();
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
