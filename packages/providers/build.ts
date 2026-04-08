import isolatedDecl from "bun-plugin-isolated-decl";

await Bun.build({
  entrypoints: ["src/index.ts"],
  target: "node",
  outdir: "dist",
  plugins: [isolatedDecl()],
});
