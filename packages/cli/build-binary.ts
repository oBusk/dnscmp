import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import pkg from "./package.json" with { type: "json" };

const version = pkg.version;
const isWin = process.platform === "win32";
const ext = isWin ? ".exe" : "";

const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
if (major < 25 || (major === 25 && minor < 5)) {
  console.error(
    `node --build-sea requires Node.js >=25.5.0, but this is running under Node.js ${process.versions.node}.`,
  );
  process.exit(1);
}

mkdirSync("release", { recursive: true });

// 1. Use esbuild to bundle all js (including libs) to single file.
await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "release/sea-bundle.js",
  define: {
    __DNSCMP_WIN32_BUILD__: String(isWin),
  },
});

// 2. Create sea config as file
const outfile = `release/dnscmp-${version}${ext}`;
writeFileSync(
  "release/sea-config.json",
  JSON.stringify({
    main: "release/sea-bundle.js",
    mainFormat: "module",
    output: outfile,
    disableExperimentalSEAWarning: true,
    useCodeCache: false,
  }),
);

// 3. Build the SEA using the config (2.) which points to the bundle (1.)
execFileSync(process.execPath, ["--build-sea", "release/sea-config.json"], {
  stdio: "inherit",
});

if (process.platform === "darwin") {
  execFileSync("codesign", ["--sign", "-", outfile]);
}

console.log(`Built: ${outfile}`);
