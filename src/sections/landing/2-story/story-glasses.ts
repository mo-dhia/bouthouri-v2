import {
  AmbientLight, Box3, DirectionalLight, DoubleSide, Group, MathUtils, Mesh,
  MeshBasicMaterial, MeshPhysicalMaterial, PlaneGeometry, Vector3,
  type Object3D, type PerspectiveCamera, type Scene, type Texture, type WebGLRenderer,
} from "three";
import { mix, smooth, type StoryScore } from "./story-score";
import { createGlassesShadow } from "./story-shadow";
import type { StoryPointer } from "./story-pointer";

export function createGlasses(model: Object3D, scene: Scene, camera: PerspectiveCamera, environment: Texture, width: number) {
  scene.environment = environment;
  const materials = new Set<MeshPhysicalMaterial>();
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.layers.enable(8);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      const m = material as MeshPhysicalMaterial;
      // Preserve scene-environment semantics. In r180, scene.environmentIntensity
      // and material.envMapIntensity follow different shader-uniform paths.
      materials.add(m); m.envMap = null;
      if (m.name.startsWith("Frame")) {
        m.color.setRGB(0.064, 0.064, 0.064); m.metalness = 1; m.roughness = 0.24; m.clearcoat = 0.06; m.envMapIntensity = 1.65;
      } else if (m.name.startsWith("Hardware")) {
        m.color.setRGB(0.085, 0.085, 0.085); m.metalness = 1; m.roughness = 0.26; m.envMapIntensity = 1.35;
      } else if (m.name.startsWith("Lenses")) {
        m.color.setRGB(0.028, 0.028, 0.028); m.metalness = 0; m.transmission = 0.13;
        m.roughness = 0.16; m.ior = 1.52; m.clearcoat = 0.12; m.clearcoatRoughness = 0.25;
        m.envMapIntensity = 1.05; m.thickness = 0.00126; m.attenuationColor.set("#181818"); m.attenuationDistance = 0.008;
      } else if (m.name.startsWith("Temples")) {
        m.color.setRGB(0.022, 0.022, 0.022); m.metalness = 0.85; m.roughness = 0.3; m.clearcoat = 0.06; m.envMapIntensity = 0.9;
      } else if (m.name.startsWith("Nose pads")) {
        m.color.setRGB(0.028, 0.028, 0.028); m.metalness = 0; m.transmission = 0.18; m.roughness = 0.32; m.envMapIntensity = 0.65;
      }
    }
  });
  model.updateMatrixWorld(true);
  const lensL = model.getObjectByName("Lens_L"), lensR = model.getObjectByName("Lens_R");
  if (!lensL || !lensR) throw new Error("The original sunglasses require Lens_L and Lens_R.");
  const left = new Box3().setFromObject(lensL).getCenter(new Vector3());
  const right = new Box3().setFromObject(lensR).getCenter(new Vector3());
  const front = left.z;
  const centers = [left, right].map((v) => v.clone().sub(new Vector3(0, 0, front)).multiplyScalar(30));
  const bounds = new Box3();
  for (const name of ["Rim_L", "Rim_R"]) {
    const object = model.getObjectByName(name); if (object) bounds.union(new Box3().setFromObject(object));
  }
  bounds.min.z -= front; bounds.max.z -= front; bounds.min.multiplyScalar(30); bounds.max.multiplyScalar(30);
  const center = bounds.getCenter(new Vector3()), size = bounds.getSize(new Vector3());
  const root = new Group(), hover = new Group(), scale = new Group();
  scale.scale.setScalar(30); model.position.z -= front; scale.add(model); hover.add(scale); root.add(hover); scene.add(root);
  const hitPlane = new Mesh(new PlaneGeometry(size.x * 1.08, size.y * 1.18), new MeshBasicMaterial({ side: DoubleSide }));
  hitPlane.position.set(center.x, center.y, bounds.max.z + 0.08); hitPlane.visible = false; root.add(hitPlane);
  const light = new DirectionalLight(0xffffff, 1.4); light.position.set(-2, 4, 5);
  const ambient = new AmbientLight(0xffffff, 0.13); scene.add(light, ambient);
  const initial = [...materials].map((material) => ({ material, color: material.color.clone(), environment: material.envMapIntensity }));
  const shadow = createGlassesShadow(root, scene, width);
  const a = new Vector3(), b = new Vector3(), focus = new Vector3(), target = new Vector3();
  let hoverX = 0, hoverY = 0;
  return {
    root, hitPlane,
    prepare(renderer: WebGLRenderer) {
      const lenses = [...materials].filter((material) => material.name.startsWith("Lenses"));
      const transmission = lenses.map((material) => material.transmission);
      try {
        for (const value of [0.13, 0]) {
          for (const lens of lenses) lens.transmission = value;
          renderer.compile(root, camera, scene);
        }
      } finally { lenses.forEach((material, index) => { material.transmission = transmission[index]; }); }
    },
    update(score: StoryScore, pointer: StoryPointer, aspect: number, elapsed: number, dt: number) {
      if (score.time >= 75) {
        root.visible = false; light.intensity = 0;
        camera.position.set(0, 0, 10 * Math.max(1, 0.88 / aspect)); camera.lookAt(0, 0, 0);
        return false;
      }
      const presence = score.emergence, idle = score.idle * presence, arrival = 1 - presence;
      const influence = presence * (1 - smooth(0.14, 0.32, score.opticalProgress));
      const over = pointer.hovered === 0 && !pointer.state.coarse;
      // Project the pointer ray onto the measured rim plane, as the source proxy does.
      const point = a.set(pointer.state.targetX, pointer.state.targetY, 0.5).unproject(camera);
      point.sub(camera.position).normalize();
      const z = hitPlane.getWorldPosition(b).z;
      const distance = (z - camera.position.z) / Math.min(-0.00001, point.z);
      point.multiplyScalar(distance).add(camera.position); root.worldToLocal(point);
      const tx = over ? MathUtils.clamp((point.x - center.x) / (size.x / 2), -1, 1) * influence : 0;
      const ty = over ? MathUtils.clamp((point.y - center.y) / (size.y / 2), -1, 1) * influence : 0;
      hoverX = MathUtils.damp(hoverX, tx, 8, dt); hoverY = MathUtils.damp(hoverY, ty, 8, dt);
      const pull = pointer.pulls[0];
      hover.rotation.set(-0.07 * hoverY - 0.2 * pull.y, 0.12 * hoverX + 0.24 * pull.x, -0.018 * hoverX - 0.055 * pull.x);
      hover.position.set(0.055 * hoverX + pull.x, 0.035 * hoverY + pull.y, 0);
      const fit = mix(Math.max(1, 1.52 / aspect), 1, score.focus);
      const s = 1 - 0.035 * arrival, depth = -0.24 * arrival;
      root.scale.setScalar(s);
      root.rotation.set(score.rx + 0.03 * arrival + 0.006 * Math.sin(0.28 * elapsed) * idle,
        score.ry - 0.04 * arrival + 0.009 * Math.sin(0.35 * elapsed) * idle,
        score.rz + 0.004 * Math.sin(0.22 * elapsed) * idle);
      a.copy(centers[0]).applyEuler(root.rotation).multiplyScalar(s);
      b.copy(centers[1]).applyEuler(root.rotation).multiplyScalar(s);
      const settle = 1 - smooth(0, 22, score.time);
      const da = 1 / Math.max(0.01, score.distance * fit - depth - a.z);
      const db = 1 / Math.max(0.01, score.distance * fit - depth - b.z);
      root.position.set(score.x - (a.x * da + b.x * db) / (da + db) * settle,
        score.y - (a.y * da + b.y * db) / (da + db) * settle + 0.025 * Math.sin(0.55 * elapsed) * idle, depth);
      root.updateMatrixWorld(true);
      focus.copy(centers[0]).applyMatrix4(root.matrixWorld);
      target.set(0, 0.12, 0).lerp(focus, score.focus);
      camera.position.set(target.x, target.y, target.z + score.distance * fit);
      camera.lookAt(target.x, target.y, target.z - 4);
      light.position.set(-2 + 0.2 * Math.sin(0.25 * elapsed) * idle + 0.24 * pointer.state.x, 4 + 0.18 * pointer.state.y, 5);
      light.intensity = 1.4 * presence * (1 - smooth(62, 74, score.time));
      for (const own of initial) {
        own.material.color.copy(own.color).multiplyScalar(mix(0.08, 1, presence));
        own.material.envMapIntensity = own.environment * mix(0.015, 1, presence);
        if (own.material.name.startsWith("Lenses")) {
          own.material.envMapIntensity = mix(1.05, 0, score.darkness) * mix(0.015, 1, presence);
          own.material.transmission = mix(0.13, 0, score.darkness) * presence;
          const shade = 0.028 * (1 - score.darkness) * mix(0.08, 1, presence);
          own.material.color.setRGB(shade, shade, shade);
        }
      }
      root.visible = score.opticalProgress < 0.74 && score.opticalVeil < 1;
      return idle > 0.001 && presence > 0 || Math.abs(hoverX - tx) + Math.abs(hoverY - ty) > 1e-4;
    },
    shadow(renderer: WebGLRenderer, score: StoryScore) { shadow.update(renderer, score); },
    dispose() { shadow.dispose(); hitPlane.geometry.dispose(); hitPlane.material.dispose(); scene.remove(root, light, ambient); },
  };
}
