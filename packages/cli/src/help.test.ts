import assert from "node:assert/strict";
import { test } from "node:test";
import { printHelp } from "./help.ts";
import type { OutputStream } from "./output-stream.ts";

function fakeOutputStream(): OutputStream & { written: string[] } {
  const written: string[] = [];
  return {
    written,
    supportsColor: false,
    supportsHyperlinks: false,
    stream: {
      write: (chunk: string) => {
        written.push(chunk);
        return true;
      },
    } as unknown as NodeJS.WriteStream,
  };
}

test("printHelp writes usage text to the given stream", () => {
  const out = fakeOutputStream();
  printHelp(out);

  assert.equal(out.written.length, 1);
  assert.match(out.written[0]!, /^Usage: dnscmp \[options\] \[resolver\.\.\.\]/);
  assert.match(out.written[0]!, /-h, --help\s+Show this help message/);
});
