/**
 * Simple factory to create instance registries.
 * Eliminates the repetitive Map boilerplate across animation files.
 *
 * Usage:
 *   const myInstances = createInstanceRegistry();
 *   myInstances.add('key', instance);
 *   myInstances.getAll();
 */
export function createInstanceRegistry<T = unknown>() {
  const instances = new Map<string, T>();

  return {
    add(id: string, instance: T): T {
      instances.set(id, instance);
      return instance;
    },
    remove(id: string): boolean {
      if (instances.has(id)) {
        instances.delete(id);
        return true;
      }
      return false;
    },
    get(id: string): T | undefined {
      return instances.get(id);
    },
    has(id: string): boolean {
      return instances.has(id);
    },
    getAll(): T[] {
      return Array.from(instances.values());
    },
    getAllIds(): string[] {
      return Array.from(instances.keys());
    },
    clear(): void {
      instances.clear();
    },
    forEach(callback: (instance: T, id: string) => void): void {
      instances.forEach((instance, id) => {
        callback(instance, id);
      });
    },
    get size(): number {
      return instances.size;
    },
    isEmpty(): boolean {
      return instances.size === 0;
    },
  };
}
