import { ACESFilmicToneMapping, Box3, DirectionalLight, Euler, MathUtils, Matrix4, Mesh, MeshStandardMaterial, PerspectiveCamera, PMREMGenerator, Quaternion, RectAreaLight, Scene, SRGBColorSpace, Vector3, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { loadGLTF } from '@/lib/scene/asset-cache';
import { pixelsToVw, viewportDesign } from '@/lib/viewport-design';
import { practiceHeroPose, practiceLogo, type PracticeKind } from './practice-hero';

export type PracticeObjects = {
  resize(width: number, height: number): number;
  render(progress: number, pointerX: number, pointerY: number, reduced: boolean, seconds?: number, entry?: number): void;
  dispose(): void;
};

/** Deferred editorial renderer. The page owns time, scheduling and visibility. */
export async function createPracticeObjects(canvas: HTMLCanvasElement, kind: PracticeKind, signal: AbortSignal): Promise<PracticeObjects | null> {
  if (signal.aborted) return null;
  const model = (await loadGLTF('/assets/models/logo-finished-components.glb')).scene;
  if (signal.aborted) return null;
  model.updateMatrixWorld(true);
  const meshName = kind === 'about' ? 'Logo_Part_01_Finished' : 'Logo_Part_02_Finished';
  const original = model.getObjectByName(meshName), centerMesh = model.getObjectByName('Logo_Part_02_Finished');
  if (!(original instanceof Mesh) || !centerMesh) throw new Error(`Missing editorial geometry: ${meshName}`);
  const geometry = original.geometry.clone().applyMatrix4(original.matrixWorld);
  const center = new Box3().setFromObject(centerMesh).getCenter(new Vector3());
  if (kind === 'about') { center.x += practiceLogo.halfOffset[0]; center.y += practiceLogo.halfOffset[1]; }
  geometry.translate(-center.x, -center.y, -center.z);
  if (kind === 'about') geometry.rotateZ(practiceLogo.halfAngle);
  const normalization = 1 / (practiceLogo.diameter * practiceLogo.worldUnitsPerPixel);
  geometry.scale(normalization, normalization, normalization); geometry.computeBoundingBox();
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch (error) { geometry.dispose(); throw error; }
  renderer.setClearColor(0, 0); renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  const scene = new Scene(), camera = new PerspectiveCamera(30, 1, .1, 6000);
  const pmrem = new PMREMGenerator(renderer), room = new RoomEnvironment();
  const environment = (() => {
    try { return pmrem.fromScene(room, .04); }
    catch (error) { geometry.dispose(); renderer.dispose(); throw error; }
    finally { room.dispose(); pmrem.dispose(); }
  })();
  scene.environment = environment.texture;
  const material = new MeshStandardMaterial({ color: 4013369, metalness: .96, roughness: .35, envMapIntensity: 1.65 });
  const mesh = new Mesh(geometry, material); mesh.name = meshName; scene.add(mesh);
  RectAreaLightUniformsLib.init();
  const key = new RectAreaLight(0xffffff, 4.2, 1, 1), fill = new DirectionalLight(0xd5d3ca, .82);
  scene.add(key, fill); fill.position.set(900, -100, 300);
  const direction = new Vector3(), rotation = new Quaternion(), matrix = new Matrix4(), scale = new Vector3(), position = new Vector3();
  const rtl = canvas.closest('[dir]')?.getAttribute('dir') === 'rtl';
  let width = 1920, height = 1080, extent = 1080, outerScale = 1, disposed = false, contextLost = false;
  const host = canvas.parentElement, originalHeight = host?.style.height ?? '';
  const onContextLost = (event: Event) => { event.preventDefault(); contextLost = true; delete canvas.dataset.heroRendered; };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.dataset.brandPart = meshName; canvas.dataset.objectsReady = 'true';
  return {
    resize(nextWidth, nextHeight) {
      // CSS chooses the composition with the viewport, not the scrollbar-narrowed
      // host. The measured host still supplies buffer size and one normalization;
      // its physical height is the stage height in reference pixels.
      const viewportWidth = window.innerWidth;
      width = viewportDesign(viewportWidth).width; outerScale = nextWidth / width; height = nextHeight / outerScale;
      let maxExtent = height;
      for (const progress of [0, .5, 1]) for (const x of [-1, 0, 1]) for (const y of [-1, 1]) {
        const pose = practiceHeroPose(kind, width, height, rtl, progress, x, y);
        rotation.setFromEuler(new Euler(pose.rotation[0], pose.rotation[1], pose.rotation[2])); scale.setScalar(pose.size); matrix.compose(position, rotation, scale);
        const bounds = geometry.boundingBox!.clone().applyMatrix4(matrix);
        if (kind === 'about') bounds.expandByScalar(.08 * pose.size + 12);
        maxExtent = Math.max(maxExtent, pose.y - bounds.min.y + 24);
      }
      extent = Math.ceil(maxExtent);
      if (host) host.style.height = pixelsToVw(extent * outerScale, viewportWidth);
      renderer.setPixelRatio(Math.min(devicePixelRatio, width <= 700 ? 1.5 : 1.75)); renderer.setSize(nextWidth, extent * outerScale, false);
      camera.fov = MathUtils.radToDeg(2 * Math.atan(extent / 4800)); camera.aspect = width / extent; camera.position.set(width / 2, extent / 2, 2400); camera.lookAt(width / 2, extent / 2, 0); camera.updateProjectionMatrix();
      canvas.dataset.documentExtent = String(extent * outerScale); return extent * outerScale;
    },
    render(progress, x, y, reduced, seconds = 0, entry = 1) {
      if (disposed || signal.aborted) return;
      if (contextLost) throw new Error('The editorial WebGL context was lost.');
      const pose = practiceHeroPose(kind, width, height, rtl, progress, x, y, reduced, seconds, entry);
      mesh.position.set(pose.x, extent - pose.y, pose.depth); mesh.scale.setScalar(pose.size); mesh.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
      material.roughness = pose.roughness; material.envMapIntensity = pose.environmentIntensity;
      key.intensity = pose.light; key.width = 1.1 * pose.size; key.height = 1.9 * pose.size; key.position.copy(mesh.position).addScaledVector(direction.set(pose.lightDirection[0], pose.lightDirection[1], pose.lightDirection[2]), pose.size); key.lookAt(mesh.position);
      scene.environmentRotation.set(pose.environmentRotation[0], pose.environmentRotation[1], pose.environmentRotation[2]); renderer.render(scene, camera); canvas.dataset.heroRendered = 'true';
    },
    dispose() {
      if (disposed) return; disposed = true; canvas.removeEventListener('webglcontextlost', onContextLost); geometry.dispose(); material.dispose(); environment.dispose(); renderer.dispose(); scene.clear();
      if (host) host.style.height = originalHeight;
      delete canvas.dataset.objectsReady; delete canvas.dataset.heroRendered; delete canvas.dataset.documentExtent; delete canvas.dataset.brandPart;
    },
  };
}
