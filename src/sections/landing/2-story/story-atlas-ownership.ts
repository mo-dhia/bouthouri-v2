import { CubeUVReflectionMapping, MeshStandardMaterial, Texture, type Object3D, type RenderTarget, type WebGLCubeRenderTarget, type WebGLRenderer } from "three";

const released = new WeakSet<RenderTarget>();

/** Pinned r180 ownership bridge. WebGLCubeUVMaps' render-target/version branch
 * omits its texture-dispose listener. Resolve only the atlas consumed by our
 * explicitly private512 materials, before their material properties disappear.
 * Texture.renderTarget is the native target back-reference; shared256 and the
 * generator's independent blur scratch are never returned by this lookup.
 */
export function disposePrivateStoryAtlas(renderer: WebGLRenderer, owner: WebGLCubeRenderTarget, objects: readonly Object3D[]) {
  if (owner.width !== 512) return 0;
  let count = 0;
  for (const object of objects) {
    if (!("material" in object)) continue;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial) || material.envMap !== owner.texture) continue;
      const properties = renderer.properties.get(material) as { envMap?: unknown };
      const atlas = properties.envMap;
      if (!(atlas instanceof Texture) || atlas === owner.texture || atlas.mapping !== CubeUVReflectionMapping) continue;
      const target = atlas.renderTarget;
      if (!target || target === owner || target.texture !== atlas || released.has(target)) continue;
      released.add(target); target.dispose(); count++;
    }
  }
  return count;
}
