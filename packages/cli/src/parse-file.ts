import type { DnsProvider } from "@dnscmp/types";
import { readFile } from "node:fs/promises";

export async function parseFile(filePath: string): Promise<DnsProvider[]> {
  const text = await readFile(filePath, "utf8");
  const providers: DnsProvider[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const spaceIdx = line.search(/\s+/);
    if (spaceIdx === -1) {
      providers.push({ name: line, resolvers: [line] });
    } else {
      const ip = line.slice(0, spaceIdx);
      const name = line.slice(spaceIdx).trim();
      providers.push({ name, resolvers: [ip] });
    }
  }

  return providers;
}
