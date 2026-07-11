import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.js",
  banner: { js: "#!/usr/bin/env node" },
  external: ["@dnscmp/core", "@dnscmp/providers"],
  define: {
    __DNSCMP_WIN32_BUILD__: "false",
  },
});
