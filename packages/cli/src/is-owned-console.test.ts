import assert from "node:assert/strict";
import { test } from "node:test";
import { isOwnedConsole } from "./is-owned-console.ts";

test("isOwnedConsole is always false off Windows", { skip: process.platform === "win32" }, () => {
  assert.equal(isOwnedConsole(), false);
});
