# dnscmp

A small toolkit for benchmarking and comparing DNS resolution times, with a CLI package and a reusable core library.

## Packages

| Package | Description |
| --- | --- |
| [`@dnscmp/types`](packages/types) | Shared TypeScript interfaces (`DnsProvider`, `DnsResult`) |
| [`@dnscmp/core`](packages/core) | Library for measuring and comparing DNS resolution times |
| [`@dnscmp/providers`](packages/providers) | Curated list of public DNS providers |
| [`dnscmp`](packages/cli) | Command-line interface for running DNS timing comparisons |

## Development

```bash
bun install
bun start
```

## Scripts

| Script | Description |
| --- | --- |
| `bun start` | Run the CLI directly from source (no build needed) |
| `bun run build` | Build all packages for publishing |
| `bun run typecheck` | Type-check the full project via tsc project references |
