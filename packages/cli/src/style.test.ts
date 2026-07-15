import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { test } from "node:test";
import { style } from "./style.ts";
import type { OutputStream } from "./output-stream.ts";

function fakeTtyStream(): NodeJS.WriteStream {
  const stream = new PassThrough() as unknown as NodeJS.WriteStream;
  (stream as unknown as { isTTY: boolean }).isTTY = true;
  return stream;
}

test("style returns plain text when the stream doesn't support color", () => {
  const out: OutputStream = {
    stream: fakeTtyStream(),
    supportsColor: false,
    supportsHyperlinks: false,
  };

  assert.equal(style("red", "hello", out), "hello");
});

test("style applies ANSI styling when the stream supports color", () => {
  const out: OutputStream = {
    stream: fakeTtyStream(),
    supportsColor: true,
    supportsHyperlinks: false,
  };

  const styled = style("red", "hello", out);
  assert.notEqual(styled, "hello");
  assert.match(styled, /hello/);
});
