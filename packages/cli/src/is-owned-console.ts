import { dlopen, FFIType, ptr } from "bun:ffi";

/**
 * Returns true if this process owns the console window (i.e. was launched by
 * double-clicking the exe rather than from an existing terminal). On non-Windows
 * platforms this always returns false.
 */
export function isOwnedConsole(): boolean {
  if (process.platform !== "win32") return false;
  try {
    const { symbols } = dlopen("kernel32.dll", {
      GetConsoleProcessList: {
        args: [FFIType.ptr, FFIType.u32],
        returns: FFIType.u32,
      },
    });
    const buf = new Uint32Array(64);
    const count = symbols.GetConsoleProcessList(ptr(buf), 64);
    return count === 1;
  } catch {
    return false;
  }
}
