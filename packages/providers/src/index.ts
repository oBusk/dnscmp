import type { DnsProvider } from "@dnscmp/types";

export type { DnsProvider };

export const providers: readonly DnsProvider[] = [
  { name: "Cloudflare", resolvers: ["1.1.1.1", "1.0.0.1"] },
  { name: "Google", resolvers: ["8.8.8.8", "8.8.4.4"] },
  { name: "Quad9", resolvers: ["9.9.9.9"] },
  { name: "Quad9 (ECS)", resolvers: ["9.9.9.11"] },
  { name: "OpenDNS", resolvers: ["208.67.222.222", "208.67.220.220"] },
  { name: "AdGuard", resolvers: ["94.140.14.14"] },
  { name: "NextDNS", resolvers: ["45.90.28.55"] },
  { name: "UncensoredDNS", resolvers: ["91.239.100.100"] },
  { name: "Hurricane Electric", resolvers: ["74.82.42.42"] },
  { name: "DNS.WATCH", resolvers: ["84.200.69.80"] },
  { name: "Level3", resolvers: ["4.2.2.1"] },
];
