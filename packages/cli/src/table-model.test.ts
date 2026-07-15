import assert from "node:assert/strict";
import { test } from "node:test";
import { TableModel } from "./table-model.ts";

test("TableModel starts with every provider pending", () => {
  const model = new TableModel([
    { name: "a", resolvers: ["1.1.1.1"] },
    { name: "b", resolvers: ["8.8.8.8"] },
  ]);

  assert.equal(model.pendingCount(), 2);
  assert.deepEqual(model.sortedRows(), [
    { status: "pending", name: "a" },
    { status: "pending", name: "b" },
  ]);
});

test("TableModel.update moves a matching pending row to done", () => {
  const model = new TableModel([
    { name: "a", resolvers: ["1.1.1.1"] },
    { name: "b", resolvers: ["8.8.8.8"] },
  ]);

  model.update({ name: "a", resolver: "1.1.1.1", avg: 12 });

  assert.equal(model.pendingCount(), 1);
  assert.deepEqual(model.sortedRows(), [
    { status: "done", result: { name: "a", resolver: "1.1.1.1", avg: 12 } },
    { status: "pending", name: "b" },
  ]);
});

test("TableModel.sortedRows sorts done rows by ascending avg, done before pending", () => {
  const model = new TableModel([
    { name: "slow", resolvers: ["1.1.1.1"] },
    { name: "fast", resolvers: ["8.8.8.8"] },
    { name: "unmeasured", resolvers: ["9.9.9.9"] },
  ]);

  model.update({ name: "slow", resolver: "1.1.1.1", avg: 50 });
  model.update({ name: "fast", resolver: "8.8.8.8", avg: 10 });

  const rows = model.sortedRows();
  assert.deepEqual(
    rows.map((r) => r.status === "done" ? r.result.name : r.name),
    ["fast", "slow", "unmeasured"],
  );
});

test("TableModel.sortedRows puts null-avg done rows after numeric ones", () => {
  const model = new TableModel([
    { name: "healthy", resolvers: ["1.1.1.1"] },
    { name: "unreachable", resolvers: ["8.8.8.8"] },
  ]);

  model.update({ name: "unreachable", resolver: "8.8.8.8", avg: null });
  model.update({ name: "healthy", resolver: "1.1.1.1", avg: 20 });

  const rows = model.sortedRows();
  assert.deepEqual(
    rows.map((r) => (r.status === "done" ? r.result.name : r.name)),
    ["healthy", "unreachable"],
  );
});
