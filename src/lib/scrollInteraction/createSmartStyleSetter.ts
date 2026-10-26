/**
 * Smart style setter that skips redundant updates to improve performance.
 * Only updates the style property if the new value differs from the current value.
 *
 * Usage:
 *   const setStyle = createSmartStyleSetter(element);
 *   setStyle('opacity', '0.5'); // Updates
 *   setStyle('opacity', '0.5'); // Skips (already set)
 */

interface StyleCache {
  [property: string]: string;
}

function setStyleValue(
  element: HTMLElement,
  property: keyof CSSStyleDeclaration,
  value: string,
): void {
  const style = element.style as CSSStyleDeclaration & Record<string, string>;
  style[property as string] = value;
}

export function createSmartStyleSetter(element: HTMLElement) {
  const cache: StyleCache = {};

  return {
    /**
     * Set a style property only if it differs from the cached value
     */
    set(property: keyof CSSStyleDeclaration, value: string): boolean {
      const key = property as string;

      // Skip if value hasn't changed
      if (cache[key] === value) {
        return false;
      }

      // Update both cache and actual style
      cache[key] = value;
      setStyleValue(element, property, value);
      return true;
    },

    /**
     * Set multiple style properties at once
     */
    setMultiple(
      styles: Partial<Record<keyof CSSStyleDeclaration, string>>,
    ): number {
      let updatedCount = 0;

      for (const [property, value] of Object.entries(styles)) {
        if (
          value !== undefined &&
          this.set(property as keyof CSSStyleDeclaration, value)
        ) {
          updatedCount++;
        }
      }

      return updatedCount;
    },

    /**
     * Clear the cache (useful on cleanup)
     */
    clearCache(): void {
      Object.keys(cache).forEach((key) => {
        delete cache[key];
      });
    },

    /**
     * Get cached value for a property
     */
    getCached(property: keyof CSSStyleDeclaration): string | undefined {
      return cache[property as string];
    },
  };
}

/**
 * Batch style setter for multiple elements with smart caching.
 * Useful when animating similar properties across multiple elements.
 */
export function createBatchStyleSetter() {
  let setters = new WeakMap<
    HTMLElement,
    ReturnType<typeof createSmartStyleSetter>
  >();

  return {
    /**
     * Set a style on an element (creates setter if needed)
     */
    set(
      element: HTMLElement,
      property: keyof CSSStyleDeclaration,
      value: string,
    ): boolean {
      let setter = setters.get(element);
      if (!setter) {
        setter = createSmartStyleSetter(element);
        setters.set(element, setter);
      }
      return setter.set(property, value);
    },

    /**
     * Set multiple styles on an element
     */
    setMultiple(
      element: HTMLElement,
      styles: Partial<Record<keyof CSSStyleDeclaration, string>>,
    ): number {
      let setter = setters.get(element);
      if (!setter) {
        setter = createSmartStyleSetter(element);
        setters.set(element, setter);
      }
      return setter.setMultiple(styles);
    },

    /**
     * Clear all caches (on cleanup)
     */
    clearAll(): void {
      setters = new WeakMap();
    },
  };
}
