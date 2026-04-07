import { dnscmp } from "@dnscmp/core";

const results = await dnscmp();
for (const { name, ip, avg } of results) {
  process.stdout.write(`${name} (${ip}): ${avg.toFixed(2)}ms\n`);
}
process.exit(0);
