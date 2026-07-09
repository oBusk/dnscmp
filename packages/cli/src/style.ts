import { styleText } from "node:util";
import type { OutputStream } from "./output-stream.ts";

export function style(
  format: Parameters<typeof styleText>[0],
  text: string,
  out: OutputStream,
): string {
  if (!out.supportsColor) return text;
  return styleText(format, text, { stream: out.stream });
}
