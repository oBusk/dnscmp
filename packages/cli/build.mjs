import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

execSync("tsc --project tsconfig.build.json", { stdio: "inherit" });

const file = "dist/index.js";
const content = readFileSync(file, "utf8");
writeFileSync(file, "#!/usr/bin/env node\n" + content);
