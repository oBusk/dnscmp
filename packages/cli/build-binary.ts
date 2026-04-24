import pkg from "./package.json" assert { type: "json" };

await Bun.build({
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
  define: {
    __DNSCMP_WIN32__: String(process.platform === "win32"),
  },
});
