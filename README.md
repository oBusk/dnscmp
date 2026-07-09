# dnscmp

A small toolkit for benchmarking and comparing DNS resolution times, with a CLI package and a reusable core library.

## Packages

| Package | | Description |
| --- | --- | --- |
| [`@dnscmp/types`](packages/types) | [![NPM Version](https://img.shields.io/npm/v/@dnscmp/types)](https://npmx.dev/package/@dnscmp/types) | Shared TypeScript interfaces (`DnsProvider`, `DnsResult`) |
| [`@dnscmp/core`](packages/core) | [![NPM Version](https://img.shields.io/npm/v/@dnscmp/core)](https://npmx.dev/package/@dnscmp/core) | Library for measuring and comparing DNS resolution times |
| [`@dnscmp/providers`](packages/providers) | [![NPM Version](https://img.shields.io/npm/v/@dnscmp/providers)](https://npmx.dev/package/@dnscmp/providers) | Curated list of public DNS providers |
| [`dnscmp`](packages/cli) | [![NPM Version](https://img.shields.io/npm/v/dnscmp)](https://npmx.dev/package/dnscmp) | Command-line interface for running DNS timing comparisons |

## Development

```bash
pnpm install
pnpm start
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm start` | Run the CLI directly from source (no build needed) |
| `pnpm run build` | Build all packages for publishing |
| `pnpm run typecheck` | Type-check the full project via tsc project references |
