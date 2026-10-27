/** Cancel one mount's wait without cancelling shared byte/font caches. */
export function waitForStoryTask<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener("abort", abort); reject(new DOMException("Story task cancelled.", "AbortError")); };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    pending.then((value) => { signal.removeEventListener("abort", abort); resolve(value); }, (error: unknown) => { signal.removeEventListener("abort", abort); reject(error); });
  });
}

/** One base graph, with readiness independent of optional motion attachments.
 * Normal motion may finish after its attachment, preserving source boot order;
 * reading can finish the same base immediately while that attachment is pending.
 */
export function createStoryBoot<T>(load: Promise<T>, mount: (value: T, motion: boolean) => void, finish: () => void) {
  let base: Promise<void> | undefined, finished = false;
  // The primary load can fail before a normal-motion attachment has settled.
  void load.catch(() => {});
  return {
    mount(motion: boolean) { return base ??= load.then((value) => { mount(value, motion); }); },
    finish() { if (!finished) { finished = true; finish(); } },
  };
}
