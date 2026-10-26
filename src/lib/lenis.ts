import Lenis from "lenis";

declare global {
  var __bouthouriLenis: Lenis | undefined;
}

/** Imported on the client only when smooth motion is allowed. */
export function initLenis(): Lenis | null {
  if (typeof window === "undefined") return null;
  globalThis.__bouthouriLenis ??= new Lenis({ autoRaf: true, anchors: true });
  return globalThis.__bouthouriLenis;
}

export function startLenis(): void { globalThis.__bouthouriLenis?.start(); }
export function stopLenis(): void { globalThis.__bouthouriLenis?.stop(); }
export function destroyLenis(): void {
  globalThis.__bouthouriLenis?.destroy();
  globalThis.__bouthouriLenis = undefined;
}
