import { dnscmp } from "@dnscmp/core";
import type { DnsProvider } from "@dnscmp/types";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    defaults: { type: "boolean", short: "d", default: false },
    file: { type: "string", short: "f" },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  process.stdout.write(
    [
      "Usage: dnscmp [options] [resolver...]",
      "",
      "  dnscmp                       Test default providers",
      "  dnscmp 1.1.1.1 8.8.8.8       Test specific resolvers",
      "  dnscmp -f resolvers.txt      Test resolvers from a file",
      "  dnscmp --defaults 9.9.9.9    Test default providers plus extra resolver(s)",
      "",
      "Options:",
      "  -d, --defaults  Include default providers alongside explicit input",
      "  -f, --file      Path to file with one resolver IP per line (optional name after whitespace)",
      "  -h, --help      Show this help message",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

const hasExplicitInput = positionals.length > 0 || values.file != null;

const input: DnsProvider[] = [];

if (!hasExplicitInput || values.defaults) {
  const { providers } = await import("@dnscmp/providers");
  input.push(...providers);
}

if (values.file != null) {
  const { parseFile } = await import("./parse-file.ts");
  input.push(...(await parseFile(values.file)));
}

for (const ip of positionals) {
  input.push({ name: ip, resolvers: [ip] });
}

const results = await dnscmp({ providers: input });
for (const { name, resolver, avg } of results) {
  const value = avg === null ? "failed" : `${avg.toFixed(2)}ms`;
  const label = name === resolver ? name : `${name} (${resolver})`;
  process.stdout.write(`${label}: ${value}\n`);
}
process.exit(0);
