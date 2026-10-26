import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

const models = new Map<string, Promise<GLTF>>();

/** Three and its GLTF loader enter the bundle only through a scene controller. */
export function loadGLTF(url: string): Promise<GLTF> {
  const existing = models.get(url);
  if (existing) return existing;
  const pending = import("three/addons/loaders/GLTFLoader.js")
    .then(({ GLTFLoader }) => new GLTFLoader().loadAsync(url))
    .catch((error: unknown) => { models.delete(url); throw error; });
  models.set(url, pending);
  return pending;
}

/** Callers own GPU disposal. Clone a cached model before changing its scene. */
export function clearModelCache(url?: string): void {
  if (url) models.delete(url);
  else models.clear();
}
