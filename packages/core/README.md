# @dnscmp/core

Library for benchmarking and comparing DNS resolution times across DNS providers.

## Usage

```ts
import { dnscmp } from "@dnscmp/core";

const results = await dnscmp();

console.log(results);
// [
//   { name: "Cloudflare", ip: "1.1.1.1", avg: 3.42 },
//   { name: "Google", ip: "8.8.8.8", avg: 7.81 },
// ]
```

## Build

```bash
bun run build
```
