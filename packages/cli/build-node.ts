await Bun.build({
  entrypoints: ["src/index.ts"],
  target: "node",
  outdir: "dist",
  banner: "#!/usr/bin/env node",
  external: ["@dnscmp/core", "@dnscmp/providers"],
  define: {
    __DNSCMP_WIN32_BUILD__: "false",
  },
});
