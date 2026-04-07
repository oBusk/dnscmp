import isolatedDecl from "bun-plugin-isolated-decl";

await Promise.all([
  Bun.build({
    entrypoints: ["src/lib.ts"],
    target: "node",
    outdir: "dist",
    plugins: [isolatedDecl()],
  }),
  Bun.build({
    entrypoints: ["src/cli.ts"],
    target: "node",
    outdir: "dist",
    banner: "#!/usr/bin/env node",
  }),
]);
