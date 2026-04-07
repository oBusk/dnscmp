# dnscmp

A DNS response time comparison tool. Measures and compares average DNS resolution times across multiple servers and domains.

## Packages

| Package | Description |
| --- | --- |
| [`@dnscmp/core`](packages/core) | Core library — DNS timing logic |
| [`dnscmp`](packages/cli) | CLI tool |

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
