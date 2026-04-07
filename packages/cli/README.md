# dnscmp

Command-line tool for benchmarking and comparing DNS resolution times across DNS providers.

## Usage

```bash
npx dnscmp
# Cloudflare (1.1.1.1): 3.42ms
# Google (8.8.8.8): 7.81ms
```

Results are sorted fastest-first. Each server is tested 10 times across 3 domains (`example.com`, `example.org`, `example.net`).

## Development

```bash
bun run start
```
