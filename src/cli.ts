import { dnscmp } from "./lib.js";

const [, , ...args] = process.argv;

dnscmp(args);
