import type { DnsProvider, DnsResult } from "@dnscmp/types";

export type RowState =
  | { status: "pending"; name: string }
  | { status: "done"; result: DnsResult };

function compareByAvg(
  a: { avg: number | null },
  b: { avg: number | null },
): number {
  if (a.avg === null && b.avg === null) return 0;
  if (a.avg === null) return 1;
  if (b.avg === null) return -1;
  return a.avg - b.avg;
}

export class TableModel {
  private rows: RowState[];

  constructor(providers: DnsProvider[]) {
    this.rows = providers.map((p) => ({ status: "pending", name: p.name }));
  }

  update(result: DnsResult): void {
    const idx = this.rows.findIndex(
      (r) => r.status === "pending" && r.name === result.name,
    );
    if (idx !== -1) {
      this.rows[idx] = { status: "done", result };
    }
  }

  sortedRows(): RowState[] {
    const done = this.rows.filter(
      (r): r is { status: "done"; result: DnsResult } => r.status === "done",
    );
    const pending = this.rows.filter(
      (r): r is { status: "pending"; name: string } => r.status === "pending",
    );

    done.sort((a, b) => compareByAvg(a.result, b.result));

    return [...done, ...pending];
  }

  pendingCount(): number {
    return this.rows.filter((r) => r.status === "pending").length;
  }
}
