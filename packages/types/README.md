# @dnscmp/types

[![NPM Version](https://img.shields.io/npm/v/@dnscmp/types)](https://npmx.dev/package/@dnscmp/types)

Shared TypeScript types for the dnscmp packages. No runtime code.

## Types

### `DnsProvider`

Input to [`@dnscmp/core`](../core). Represents a named DNS provider with one or more resolvers (identified by IP) to test.

```ts
interface DnsProvider {
  name: string;
  resolvers: readonly string[];
}
```

### `DnsResult`

Output from [`@dnscmp/core`](../core). Contains the provider name, the fastest resolver IP, and the average query time across tested domains.

```ts
interface DnsResult {
  name: string;
  resolver: string;
  avg: number | null; // null if the provider failed to respond
}
```
