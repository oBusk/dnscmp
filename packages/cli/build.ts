import pkg from "./package.json" assert { type: "json" };

await Promise.all([
  Bun.build({
    entrypoints: ["src/index.ts"],
    target: "node",
    outdir: "dist",
    banner: "#!/usr/bin/env node",
    external: ["@dnscmp/core", "@dnscmp/providers"],
  }),
  Bun.build({
    entrypoints: ["src/index.ts"],
    compile: {
      outfile: `release/dnscmp-${pkg.version}`,
      windows: {
        title: "dnscmp",
        version: pkg.version,
        description: pkg.description,
        publisher: pkg.author,
        copyright: `${new Date().getFullYear()} ${pkg.author}`,
      },
    },
  }),
]);
