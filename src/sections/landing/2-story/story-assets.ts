import {
  BufferGeometry, ClampToEdgeWrapping, Color, CubeCamera, DataTexture, DoubleSide, FloatType,
  HalfFloatType, LinearFilter, Material, Mesh, MeshBasicMaterial, NearestFilter,
  Object3D, PlaneGeometry, RGBAFormat, Scene, SRGBColorSpace, Texture, UniformsLib,
  UVMapping, WebGLCubeRenderTarget, type WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const bytes = new Map<string, Promise<ArrayBuffer>>();
function loadBytes(url: string) {
  let pending = bytes.get(url);
  if (!pending) {
    pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Story asset ${url}: ${response.status}`);
      return response.arrayBuffer();
    }).catch((error: unknown) => { bytes.delete(url); throw error; });
    bytes.set(url, pending);
  }
  return pending;
}

export function disposeObject(root: Object3D, externalTextures: ReadonlySet<Texture> = new Set()) {
  const geometry = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  const images = new Set<ImageBitmap>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    geometry.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture && !externalTextures.has(value)) textures.add(value);
    }
  });
  for (const material of materials) material.dispose();
  for (const g of geometry) g.dispose();
  for (const texture of textures) {
    if (typeof ImageBitmap !== "undefined" && texture.image instanceof ImageBitmap) images.add(texture.image);
    texture.dispose();
  }
  for (const bitmap of images) bitmap.close();
}

/** Cache network bytes only. Every mount gets fresh geometry/textures and cloned materials. */
export async function loadStoryModel(name: "glasses-folded" | "logo-finished-components") {
  const data = await loadBytes(`/assets/models/${name}.glb`);
  const gltf = await new GLTFLoader().parseAsync(data.slice(0), "/assets/models/");
  const scene = gltf.scene.clone(true);
  const materialClones = new Map<Material, Material>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const clone = (material: Material) => {
      let own = materialClones.get(material);
      if (!own) { own = material.clone(); materialClones.set(material, own); }
      return own;
    };
    object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
    object.castShadow = object.receiveShadow = false;
  });
  for (const material of materialClones.keys()) material.dispose();
  // Clones own this parse's geometry and image resources; no cached GPU object is mutated.
  return scene;
}

type LightCard = { intensity: number; position: [number, number, number]; scale: [number, number, number]; rotation?: [number, number, number] };
const glassesCards: LightCard[] = [
  { intensity: 4.5, position: [-4, 3, 5], rotation: [0, 0.3, 0], scale: [2, 5, 1] },
  { intensity: 3, position: [4, 1, 4], rotation: [0, -0.35, 0], scale: [0.32, 7, 1] },
  { intensity: 1.2, position: [0, -3, 3], scale: [6, 0.2, 1] },
  { intensity: 0.5, position: [0, 5, -4], rotation: [Math.PI / 2, 0, 0], scale: [7, 3, 1] },
];
const sculptureCards: LightCard[] = [
  { intensity: 0.72, position: [-0.4, 1, 5], scale: [2.4, 6, 1] },
  { intensity: 4.8, position: [2.8, 0.3, 4], scale: [0.32, 5, 1] },
  { intensity: 3, position: [-1, 3, 1.5], scale: [2, 0.45, 1], rotation: [-0.7, 0, 0.15] },
  { intensity: 0.1, position: [0, 0, 5], scale: [10, 10, 1] },
  { intensity: 0.08, position: [0, -2, 5], scale: [5, 3, 1] },
];

function softboxTexture() {
  const data = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const value = Math.round(255 * Math.sin(x / 63 * Math.PI) ** 1.4 * Math.sin(y / 63 * Math.PI) ** 0.35);
    const i = (y * 64 + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = value; data[i + 3] = 255;
  }
  const texture = new DataTexture(data, 64, 64);
  // R3F applyProps marks unsigned-byte RGBA material maps sRGB in the source.
  // DataTexture defaults to no color space in plain Three, which changes both
  // the sculpture field and the shared PMREM scratch sampled by glasses refresh.
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** An owned equivalent of the reference Environment portal and Lightformers. */
function createStudioCube(renderer: WebGLRenderer, type: "glasses" | "sculpture") {
  const studio = new Scene();
  if (type === "sculpture") studio.background = new Color(0);
  const texture = type === "sculpture" ? softboxTexture() : null;
  for (const card of type === "glasses" ? glassesCards : sculptureCards) {
    const mesh = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({
      color: new Color(1, 1, 1).multiplyScalar(card.intensity), map: texture,
      toneMapped: false, side: DoubleSide,
    }));
    mesh.position.fromArray(card.position); mesh.scale.fromArray(card.scale);
    if (card.rotation) mesh.rotation.set(...card.rotation);
    else mesh.lookAt(0, 0, 0);
    studio.add(mesh);
  }
  const target = new WebGLCubeRenderTarget(type === "glasses" ? 256 : 512, { type: HalfFloatType });
  const camera = new CubeCamera(0.1, 1000, target);
  const capture = () => {
    const autoClear = renderer.autoClear;
    try { renderer.autoClear = true; camera.update(renderer, studio); }
    finally { renderer.autoClear = autoClear; }
  };
  try { capture(); }
  catch (error) { target.dispose(); disposeObject(studio); throw error; }
  return { target, capture, dispose() { target.texture.dispose(); target.dispose(); disposeObject(studio); } };
}

/** Keep both raw cubes on r180's ONE renderer-owned CubeUV cache, like source.
 * The 256px glasses cube refreshes after a measured canvas bounds change.
 * Its cached target then uses the 512px sculpture scratch layout: this recurring
 * source behavior is visibly different from separate one-shot PMREM generators.
 */
export function createStoryEnvironments(renderer: WebGLRenderer, sculpture: boolean) {
  const glasses = createStudioCube(renderer, "glasses");
  let logo: ReturnType<typeof createStudioCube> | undefined;
  try { if (sculpture) logo = createStudioCube(renderer, "sculpture"); }
  catch (error) { glasses.dispose(); throw error; }
  let disposed = false;
  return {
    glasses: glasses.target,
    get sculpture() { return logo?.target; },
    setSculpture(enabled: boolean) {
      if (disposed) return;
      if (enabled && !logo) logo = createStudioCube(renderer, "sculpture");
      else if (!enabled && logo) { logo.dispose(); logo = undefined; }
    },
    refreshGlasses() { if (!disposed) glasses.capture(); },
    refresh() {
      if (disposed) return;
      logo?.capture(); glasses.capture();
    },
    dispose() { if (disposed) return; disposed = true; glasses.dispose(); logo?.dispose(); },
  };
}

const ltcNames = ["LTC_FLOAT_1", "LTC_FLOAT_2", "LTC_HALF_1", "LTC_HALF_2"] as const;
// Three r180 uses these runtime keys in WebGLLights; @types/three only declares
// the ordinary uniform groups on UniformsLib.
const ltcUniforms = UniformsLib as unknown as Record<string, DataTexture | undefined>;
let ltcReferences = 0;
let ltcPending: Promise<void> | null = null;
let ownedLtc: DataTexture[] = [];

/** Original r180 LTC lookup data; no 300KB RectAreaLightUniformsLib source table. */
export async function acquireStoryLighting() {
  ltcReferences++;
  const release = () => {
    ltcReferences--;
    if (ltcReferences === 0 && ownedLtc.length) {
      ltcNames.forEach((name, i) => {
        if (ltcUniforms[name] === ownedLtc[i]) delete ltcUniforms[name];
        ownedLtc[i].dispose();
      });
      ownedLtc = []; ltcPending = null;
    }
  };
  try {
    if (!ltcUniforms.LTC_FLOAT_1) {
      ltcPending ??= loadBytes("/assets/models/logo-lighting-r180.bin").then((buffer) => {
        if (buffer.byteLength !== 196608) throw new Error("Invalid original r180 area-light data.");
        if (ltcUniforms.LTC_FLOAT_1) return;
        const arrays = [new Float32Array(buffer, 0, 16384), new Float32Array(buffer, 65536, 16384), new Uint16Array(buffer, 131072, 16384), new Uint16Array(buffer, 163840, 16384)];
        ownedLtc = arrays.map((data, i) => {
          const texture = new DataTexture(data, 64, 64, RGBAFormat, i < 2 ? FloatType : HalfFloatType,
            UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, NearestFilter, 1);
          texture.needsUpdate = true; ltcUniforms[ltcNames[i]] = texture;
          return texture;
        });
      }).catch((error: unknown) => { ltcPending = null; throw error; });
      await ltcPending;
    }
    return release;
  } catch (error) { release(); throw error; }
}
