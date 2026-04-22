import type { DnsProvider, DnsResult } from "@dnscmp/types";
import { createLogUpdate } from "log-update";
import type { OutputStream } from "./output-stream.ts";
import { style } from "./style.ts";
import { TableModel } from "./table-model.ts";

// Bouncing dot: [●   ] → [   ●] and back, inner width = 4
const BOUNCE_INNER = 4;
const BOUNCE_PERIOD = BOUNCE_INNER * 2; // 8

function bouncingBar(frame: number, out: OutputStream): string {
  const t = frame % BOUNCE_PERIOD;
  const pos = t <= BOUNCE_INNER ? t : BOUNCE_PERIOD - t;
  const inner = " ".repeat(pos) + "●" + " ".repeat(BOUNCE_INNER - pos);
  return style("dim", `[${inner}]`, out);
}

function formatResult(result: DnsResult, out: OutputStream): string {
  const ip =
    result.name === result.resolver
      ? ""
      : ` ${style("gray", `(${result.resolver})`, out)}`;
  const label = `${result.name}${ip}`;
  if (result.avg === null) {
    return `${label}: ${style("red", "failed", out)}`;
  }
  const value = `${result.avg.toFixed(2)}ms`;
  const colored =
    result.avg < 10
      ? style("green", value, out)
      : result.avg < 50
        ? style("yellow", value, out)
        : style("red", value, out);
  return `${label}: ${colored}`;
}

export class LiveTable {
  private model: TableModel;
  private frame = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private out: OutputStream;
  private err: OutputStream;
  private logger: ReturnType<typeof createLogUpdate>;

  constructor(
    providers: DnsProvider[],
    out: OutputStream,
    err: OutputStream,
  ) {
    this.model = new TableModel(providers);
    this.out = out;
    this.err = err;
    this.logger = createLogUpdate(err.stream);
  }

  start(): void {
    if (this.err.stream.isTTY) {
      this.redraw();
      this.interval = setInterval(() => {
        this.frame++;
        this.redraw();
      }, 80);
    }
  }

  update(result: DnsResult): void {
    this.model.update(result);
    if (this.err.stream.isTTY) {
      this.redraw();
    }
  }

  private redraw(): void {
    const pendingCount = this.model.pendingCount();
    const footer =
      pendingCount > 0
        ? style("dim", "  Testing...", this.err)
        : `  ${style("green", "✓", this.err)} ${style("bold", "Done", this.err)}`;
    const bar = bouncingBar(this.frame, this.err);

    const lines: string[] = [];
    for (const row of this.model.sortedRows()) {
      if (row.status === "done") {
        lines.push(`  ${formatResult(row.result, this.err)}`);
      } else {
        lines.push(`  ${row.name} ${bar}`);
      }
    }
    lines.push("", footer);

    this.logger(lines.join("\n"));
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.err.stream.isTTY) {
      this.logger.clear();
      this.logger.done();
    }
    for (const row of this.model.sortedRows()) {
      if (row.status === "done") {
        this.out.stream.write(`  ${formatResult(row.result, this.out)}\n`);
      }
    }
    this.err.stream.write(
      `\n  ${style("green", "✓", this.err)} ${style("bold", "Done", this.err)}\n`,
    );
  }
}
