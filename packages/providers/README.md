# @dnscmp/providers

Curated list of public DNS providers for use with [`@dnscmp/core`](../core).

## Usage

```ts
import { dnscmp } from "@dnscmp/core";
import { providers } from "@dnscmp/providers";

const results = await dnscmp({ providers });
```

## Providers

| Name | Resolvers |
| --- | --- |
| Cloudflare | `1.1.1.1`, `1.0.0.1` |
| Google | `8.8.8.8`, `8.8.4.4` |
| Quad9 | `9.9.9.9` |
| Quad9 (ECS) | `9.9.9.11` |
| OpenDNS | `208.67.222.222`, `208.67.220.220` |
| AdGuard | `94.140.14.14` |
| NextDNS | `45.90.28.55` |
| UncensoredDNS | `91.239.100.100` |
| Hurricane Electric | `74.82.42.42` |
| DNS.WATCH | `84.200.69.80` |
| Level3 | `4.2.2.1` |

## Build

```bash
bun run build
```
