# dnscmp

Command-line tool for benchmarking and comparing DNS resolution times across DNS providers.

## Usage

```bash
npx dnscmp
# Cloudflare (1.1.1.1): 3.42ms
# Google (8.8.8.8): 7.81ms
# Quad9 (9.9.9.9): 12.50ms
```

Results are sorted fastest-first. Each provider is tested 10 times across 3 domains (`example.com`, `example.org`, `example.net`). Providers with multiple IPs are all tested; only the fastest is shown. Providers that fail to respond show `failed`.

```bash
npx dnscmp 1.1.1.1 9.9.9.9        # test specific IPs
npx dnscmp -f resolvers.txt       # test from a file (one IP per line)
npx dnscmp --defaults 9.9.9.9     # default providers plus an extra IP
npx dnscmp --help                 # show all options
```

## Development

```bash
bun run start
```
