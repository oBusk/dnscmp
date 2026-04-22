import { styleText } from "node:util";
import type { OutputStream } from "./output-stream.ts";

// Bun ignores the { stream } option and always applies ANSI codes regardless of
// isTTY, NO_COLOR, and FORCE_COLOR. https://github.com/oven-sh/bun/issues/25736
// Guard with supportsColor (pre-computed in index.ts) before calling styleText.
export function style(
  format: Parameters<typeof styleText>[0],
  text: string,
  out: OutputStream,
): string {
  if (!out.supportsColor) return text;
  return styleText(format, text, { stream: out.stream });
}
