import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parseFile } from "./parse-file.ts";

async function withTempFile(
  contents: string,
  fn: (filePath: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "dnscmp-test-"));
  const filePath = join(dir, "resolvers.txt");
  try {
    await writeFile(filePath, contents, "utf8");
    await fn(filePath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("parseFile parses an IP-only line as its own name", async () => {
  await withTempFile("1.1.1.1\n", async (filePath) => {
    const providers = await parseFile(filePath);
    assert.deepEqual(providers, [{ name: "1.1.1.1", resolvers: ["1.1.1.1"] }]);
  });
});

test("parseFile parses an IP followed by whitespace and a name", async () => {
  await withTempFile("1.1.1.1   Cloudflare\n", async (filePath) => {
    const providers = await parseFile(filePath);
    assert.deepEqual(providers, [
      { name: "Cloudflare", resolvers: ["1.1.1.1"] },
    ]);
  });
});

test("parseFile skips blank lines and comment lines", async () => {
  const contents = [
    "# a comment",
    "",
    "   ",
    "1.1.1.1 Cloudflare",
    "# 8.8.8.8 Google (commented out)",
    "9.9.9.9",
  ].join("\n");

  await withTempFile(contents, async (filePath) => {
    const providers = await parseFile(filePath);
    assert.deepEqual(providers, [
      { name: "Cloudflare", resolvers: ["1.1.1.1"] },
      { name: "9.9.9.9", resolvers: ["9.9.9.9"] },
    ]);
  });
});

test("parseFile trims surrounding whitespace around the name", async () => {
  await withTempFile("1.1.1.1\t\tCloudflare  \n", async (filePath) => {
    const providers = await parseFile(filePath);
    assert.deepEqual(providers, [
      { name: "Cloudflare", resolvers: ["1.1.1.1"] },
    ]);
  });
});
