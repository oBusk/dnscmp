import koffi from "koffi";

export function isOwnedConsole(): boolean {
  if (process.platform !== "win32") return false;
  try {
    const kernel32 = koffi.load("kernel32.dll");
    const GetConsoleProcessList = kernel32.func(
      "uint32_t GetConsoleProcessList(uint32_t *, uint32_t)",
    );
    const buf = new Uint32Array(64);
    const count = GetConsoleProcessList(buf, 64);
    return count === 1;
  } catch {
    return false;
  }
}
