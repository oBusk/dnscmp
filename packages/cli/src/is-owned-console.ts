import { execFileSync } from "node:child_process";

/**
 * Returns true if this process owns the console window (i.e. was launched by
 * double-clicking the exe rather than from an existing terminal). On non-Windows
 * platforms this always returns false.
 *
 * Uses `tasklist` to check whether the parent process is Explorer, since the
 * "real" Windows API for this (GetConsoleProcessList) can't be called from a
 * spawned helper process without corrupting the count it's trying to measure,
 * and requires an in-process native addon otherwise (which can't be embedded
 * in a single-file Node SEA binary).
 */
export function isOwnedConsole(): boolean {
  if (process.platform !== "win32") return false;
  try {
    const output = execFileSync(
      "tasklist.exe",
      ["/fi", `PID eq ${process.ppid}`, "/fo", "csv", "/nh"],
      { encoding: "utf8", timeout: 2000, windowsHide: true },
    );
    const parentName = output.split(",")[0]?.replace(/"/g, "").toLowerCase();
    return parentName === "explorer.exe";
  } catch {
    return false;
  }
}
