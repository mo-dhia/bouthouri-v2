/**
 * Simple DOM cache to avoid repeated querySelector calls.
 * Query once, reuse many times for better performance.
 *
 * Usage:
 *   const cache = createDOMCache();
 *   const el = cache.get('myKey', '.mySelector');
 *   cache.clear(); // cleanup
 */
export function createDOMCache() {
  const cache = new Map<string, Element | NodeListOf<Element> | null>();

  return {
    /**
     * Get a single element (uses querySelector)
     */
    get<T extends Element = HTMLElement>(
      key: string,
      selector: string | (() => T | null),
      context: Document | Element = document,
    ): T | null {
      if (cache.has(key)) {
        return cache.get(key) as T | null;
      }

      const element =
        typeof selector === "function"
          ? selector()
          : context.querySelector<T>(selector);

      cache.set(key, element);
      return element;
    },

    /**
     * Get multiple elements (uses querySelectorAll)
     */
    getAll<T extends Element = HTMLElement>(
      key: string,
      selector: string | (() => NodeListOf<T> | null),
      context: Document | Element = document,
    ): NodeListOf<T> | null {
      if (cache.has(key)) {
        return cache.get(key) as NodeListOf<T> | null;
      }

      const elements =
        typeof selector === "function"
          ? selector()
          : context.querySelectorAll<T>(selector);

      cache.set(key, elements);
      return elements;
    },

    /**
     * Clear all cached elements
     */
    clear(): void {
      cache.clear();
    },
  };
}
