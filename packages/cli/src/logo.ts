import { version } from "../package.json";
import type { OutputStream } from "./output-stream.ts";
import { style } from "./style.ts";

const COLOR_SPLIT_COLUMN = 18;
const LOGO_BLOCK = `
   ▄▄
   ██
▄████ ████▄ ▄█▀▀▀ ▄████ ███▄███▄ ████▄
██ ██ ██ ██ ▀███▄ ██    ██ ██ ██ ██ ██
▀████ ██ ██ ▄▄▄█▀ ▀████ ██ ██ ██ ████▀
github.com/oBusk/dnscmp ${`v${version}`.padStart(8)} ██
                                 ▀▀
`;

const LINK_TEXT = "github.com/oBusk/dnscmp";
const LINK_URL = "https://github.com/oBusk/dnscmp";

function toTerminalLink(text: string, url: string): string {
  return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;
}

function colorBySplit(
  text: string,
  startColumn: number,
  out: OutputStream,
): string {
  if (text.length === 0) return "";
  const endColumn = startColumn + text.length;

  if (endColumn <= COLOR_SPLIT_COLUMN) {
    return style("gray", text, out);
  }
  if (startColumn >= COLOR_SPLIT_COLUMN) {
    return style("cyan", text, out);
  }

  const leftLen = COLOR_SPLIT_COLUMN - startColumn;
  return (
    style("gray", text.slice(0, leftLen), out) +
    style("cyan", text.slice(leftLen), out)
  );
}

export function buildLogo(out: OutputStream): string {
  const normalized = LOGO_BLOCK.replace(/^\n/, "").replace(/\n$/, "");
  const hyperlinkText = out.supportsHyperlinks
    ? toTerminalLink(LINK_TEXT, LINK_URL)
    : LINK_TEXT;
  const hyperlink = style("gray", hyperlinkText, out);

  const lines = normalized.split("\n").map((line) => {
    if (!out.stream.isTTY) {
      return line.replace(LINK_TEXT, hyperlink);
    }

    const linkIndex = line.indexOf(LINK_TEXT);
    if (linkIndex === -1) {
      return colorBySplit(line, 0, out);
    }

    const before = line.slice(0, linkIndex);
    const after = line.slice(linkIndex + LINK_TEXT.length);

    return (
      colorBySplit(before, 0, out) +
      hyperlink +
      colorBySplit(after, linkIndex + LINK_TEXT.length, out)
    );
  });
  return "\n  " + lines.join("\n  ") + "\n";
}
