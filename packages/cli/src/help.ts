import type { OutputStream } from "./output-stream.ts";

export function printHelp(out: OutputStream): void {
  out.stream.write(
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
}
