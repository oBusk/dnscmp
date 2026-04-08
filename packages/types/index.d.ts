export interface DnsProvider {
  name: string;
  resolvers: readonly string[];
}

export interface DnsResult {
  name: string;
  resolver: string;
  avg: number | null;
}
