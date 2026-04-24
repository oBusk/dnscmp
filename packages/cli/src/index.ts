import { dnscmp } from "@dnscmp/core";
import type { DnsProvider } from "@dnscmp/types";
import { parseArgs } from "node:util";
import { createSupportsColor } from "supports-color";
import { createSupportsHyperlinks } from "supports-hyperlinks";
import { printHelp } from "./help.ts";
import { LiveTable } from "./live-table.ts";
import { buildLogo } from "./logo.ts";
import type { OutputStream } from "./output-stream.ts";

declare const __DNSCMP_WIN32__: boolean;

function makeOutputStream(stream: NodeJS.WriteStream): OutputStream {
  return {
    stream,
    supportsColor: !!createSupportsColor(stream),
    supportsHyperlinks:
      createSupportsHyperlinks(stream) ||
      process.env.TERM_PROGRAM === "vscode",
  };
}

const out = makeOutputStream(process.stdout);
const err = makeOutputStream(process.stderr);

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
  printHelp(err);
  process.exit(0);
}

err.stream.write(buildLogo(err) + "\n");

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

const table = new LiveTable(input, out, err);
table.start();

await dnscmp({
  providers: input,
  onResult: (result) => table.update(result),
});

table.stop();

if (__DNSCMP_WIN32__ && process.stdin.isTTY) {
  const { isOwnedConsole } = await import("./is-owned-console.ts");
  if (isOwnedConsole()) {
    process.stdout.write("\nPress any key to exit...");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise<void>((resolve) => process.stdin.once("data", resolve));
    process.stdout.write("\n");
  }
}
