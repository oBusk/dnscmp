# @dnscmp/core

Core library for DNS response time comparison. Measures average DNS resolution times for Cloudflare (`1.1.1.1`) and Google (`8.8.8.8`) across multiple domains.

## Usage

```ts
import { dnscmp } from "@dnscmp/core";

await dnscmp();
// Cloudflare (1.1.1.1): 3.42ms
// Google (8.8.8.8): 7.81ms
```

## Build

```bash
bun run build
```
