# @dnscmp/core

[![NPM Version](https://img.shields.io/npm/v/@dnscmp/core)](https://npmx.dev/package/@dnscmp/core)

Library for benchmarking and comparing DNS resolution times across DNS providers.

## Usage

```ts
import { dnscmp } from "@dnscmp/core";

const results = await dnscmp({
  providers: [
    { name: "Cloudflare", ips: ["1.1.1.1", "1.0.0.1"] },
    { name: "Google", ips: ["8.8.8.8", "8.8.4.4"] },
  ],
});

console.log(results);
// [
//   { name: "Cloudflare", resolver: "1.1.1.1", avg: 3.42 },
//   { name: "Google", resolver: "8.8.8.8", avg: 7.81 },
// ]
```

Results are sorted fastest-first. Providers with multiple IPs are all tested; only the fastest IP per provider is returned. Providers that fail to respond (timeout or 3 consecutive failures) return `avg: null` and are sorted last.

## Build

```bash
bun run build
```
