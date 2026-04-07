export {};

await Promise.all([
  Bun.build({
    entrypoints: ["src/index.ts"],
    target: "node",
    outdir: "dist",
    banner: "#!/usr/bin/env node",
    external: ["@dnscmp/core"],
  }),
  Bun.build({
    entrypoints: ["src/index.ts"],
    compile: {
      outfile: "release/dnscmp",
    },
  }),
]);
