import { build } from "esbuild";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");
const version = pkg.version;
const isWin = process.platform === "win32";
const ext = isWin ? ".exe" : "";

mkdirSync("release", { recursive: true });

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "release/sea-prep.js",
  define: {
    __DNSCMP_WIN32_BUILD__: String(isWin),
  },
});

const outfile = `release/dnscmp-${version}${ext}`;

writeFileSync(
  "release/sea-config.json",
  JSON.stringify({
    main: "release/sea-prep.js",
    mainFormat: "module",
    output: outfile,
    disableExperimentalSEAWarning: true,
    useCodeCache: false,
  }),
);

execSync("node --build-sea release/sea-config.json", { stdio: "inherit" });

if (process.platform === "darwin") {
  execSync(`codesign --sign - "${outfile}"`);
}

console.log(`Built: ${outfile}`);
