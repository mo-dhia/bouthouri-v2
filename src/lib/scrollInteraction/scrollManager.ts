import type { RAFBatch } from "./optimizations";
import { createRAFBatch } from "./optimizations";

interface ScrollInstanceOptions {
  enabled?: boolean;
  throttle?: number;
  useRAF?: boolean;
}

interface ScrollInstance {
  key: string;
  callback: (event: Event) => void;
  enabled: boolean;
  lastCall: number;
  throttle: number;
  useRAF: boolean;
}

/**
 * ScrollEventManager with built-in RAF batching optimization
 *
 * Manages scroll event listeners with automatic performance optimizations:
 * - Single global scroll listener for all instances
 * - RAF batching to consolidate callbacks into single frames
 * - Optional per-instance throttling
 * - Automatic cleanup when no instances remain
 *
 * @class ScrollEventManager
 */
class ScrollEventManager {
  private instances: Map<string, ScrollInstance>;
  private boundHandleScroll: (event: Event) => void;
  private isListenerAttached: boolean;
  private rafBatch: RAFBatch;
  private useRAFBatching: boolean;

  constructor() {
    this.instances = new Map();
    this.boundHandleScroll = this.handleScroll.bind(this);
    this.isListenerAttached = false;

    // Initialize RAF batching system for performance
    this.rafBatch = createRAFBatch();
    this.useRAFBatching = true; // Can be disabled for debugging
  }

  /**
   * Create a new scroll event instance
   *
   * @param {string} key - Unique identifier for this instance
   * @param {Function} callback - Function to call on scroll
   * @param {Object} options - Configuration options
   * @param {boolean} options.enabled - Whether instance is active (default: true)
   * @param {number} options.throttle - Minimum ms between calls (default: 0)
   * @param {boolean} options.useRAF - Use RAF batching for this instance (default: true)
   * @returns {Object} Instance object
   *
   * @example
   * scrollManager.createInstance('my-scroll', (event) => {
   *   console.log('Scrolled!', window.scrollY);
   * }, { useRAF: true });
   */
  createInstance(
    key: string,
    callback: (event: Event) => void,
    options: ScrollInstanceOptions = {},
  ): ScrollInstance {
    const { enabled = true, throttle = 0, useRAF = true } = options;

    // If instance already exists, update it
    if (this.instances.has(key)) {
      const existingInstance = this.instances.get(key);
      if (existingInstance) {
        existingInstance.callback = callback;
        existingInstance.enabled = enabled;
        existingInstance.useRAF = useRAF;
        existingInstance.throttle = throttle;
        return existingInstance;
      }
    }

    // Create new instance
    const instance = {
      key,
      callback,
      enabled,
      lastCall: 0,
      throttle,
      useRAF,
    };

    this.instances.set(key, instance);
    this.attachGlobalListener();

    return instance;
  }

  /**
   * Global scroll event handler with RAF batching
   * Batches all scroll callbacks into a single animation frame
   */
  handleScroll(event: Event): void {
    const now = Date.now();

    this.instances.forEach((instance) => {
      // Skip if instance is disabled
      if (!instance.enabled) return;

      // Check throttling
      if (
        instance.throttle > 0 &&
        now - instance.lastCall < instance.throttle
      ) {
        return;
      }

      instance.lastCall = now;

      // Execute callback with or without RAF batching
      const executeCallback = () => {
        try {
          instance.callback(event);
        } catch (error) {
          console.error(`Scroll event error for ${instance.key}:`, error);
        }
      };

      if (this.useRAFBatching && instance.useRAF) {
        // Schedule in next animation frame (batched with other instances)
        this.rafBatch.schedule(instance.key, executeCallback);
      } else {
        // Execute immediately (for debugging or special cases)
        executeCallback();
      }
    });
  }

  /**
   * Attach global scroll listener only once
   */
  attachGlobalListener(): void {
    if (!this.isListenerAttached) {
      window.addEventListener("scroll", this.boundHandleScroll, {
        passive: true,
      });
      this.isListenerAttached = true;
    }
  }

  /**
   * Remove a specific scroll instance
   *
   * @param {string} key - Instance identifier to remove
   */
  removeInstance(key: string): void {
    this.instances.delete(key);

    // Cancel any pending RAF updates for this instance
    this.rafBatch.cancel(key);

    // Remove global listener if no instances remain
    if (this.instances.size === 0) {
      this.cleanup();
    }
  }

  /**
   * Toggle an instance's enabled state
   *
   * @param {string} key - Instance identifier
   * @param {boolean} enabled - Whether to enable or disable
   */
  toggleInstance(key: string, enabled: boolean): void {
    const instance = this.instances.get(key);
    if (instance) {
      instance.enabled = enabled;

      // Cancel pending updates if disabling
      if (!enabled) {
        this.rafBatch.cancel(key);
      }
    }
  }

  /**
   * Get all current instance keys
   * @returns {string[]} Array of instance keys
   */
  getInstances(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Enable or disable RAF batching globally
   * Useful for debugging or performance testing
   *
   * @param {boolean} enabled - Whether to use RAF batching
   */
  setRAFBatching(enabled: boolean): void {
    this.useRAFBatching = enabled;

    if (!enabled) {
      // Cancel all pending RAF updates
      this.rafBatch.cancelAll();
    }
  }

  /**
   * Get performance metrics about pending RAF updates
   * @returns {number} Number of pending updates
   */
  getPendingUpdates(): number {
    return this.rafBatch.getPendingCount();
  }

  requestUpdate(): void {
    this.handleScroll(new Event("scroll"));
  }

  /**
   * Force immediate execution of all pending updates
   * Useful for testing or cleanup
   */
  flush(): void {
    // Not directly exposing RAF execution, but you could add if needed
    // For now, updates will execute on next frame automatically
  }

  /**
   * Complete cleanup of all instances and listeners
   */
  cleanup(): void {
    if (this.isListenerAttached) {
      window.removeEventListener("scroll", this.boundHandleScroll);
      this.isListenerAttached = false;
    }

    this.rafBatch.cancelAll();
    this.instances.clear();
  }
}

// Global singleton instance
const scrollManager = new ScrollEventManager();

export default scrollManager;
