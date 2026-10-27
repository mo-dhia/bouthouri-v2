import {
  DirectionalLight, Euler, Group, MathUtils, Mesh, MeshStandardMaterial, Quaternion,
  RectAreaLight, Vector3, type Object3D, type Scene, type Texture, type PerspectiveCamera,
} from "three";
import { createSculptureRoutes, sampleSculptureRoute, type SculpturePose } from "./story-paths";
import { clamp, mix, smooth, spring, type StoryScore } from "./story-score";
import type { StoryPointer } from "./story-pointer";
import type { SceneGuard } from "./story-environment.animate";

const influenceWindows = [[100, 126, 141, 168], [140, 170, 185, 214], [184, 214, 232, 257]];

export function createSculptures(model: Object3D, scene: Scene, environment: Texture, initialAspect: number, rtl: boolean) {
  const root = new Group(); root.add(model); scene.add(root);
  const parts = [1, 2, 3].map((index) => {
    const object = model.getObjectByName(`Logo_Part_0${index}_Finished`);
    if (!(object instanceof Mesh) || !(object.material instanceof MeshStandardMaterial)) throw new Error(`Required original sculpture ${index} is missing.`);
    object.name = `Logo_Part_0${index}`;
    const material = object.material;
    material.metalness = 1; material.roughness = 1.1; material.envMapIntensity = 1;
    material.color.setRGB(0.043, 0.043, 0.043); material.envMap = environment;
    object.geometry.computeBoundingBox();
    return { object, material, rest: { scale: object.scale.clone(), quaternion: object.quaternion.clone() },
      center: object.geometry.boundingBox!.getCenter(new Vector3()) };
  });
  const key = new RectAreaLight(0xffffff, 0, 0.7, 4.5);
  key.position.set(-2.2, 1.4, 4.2);
  const fill = new RectAreaLight(0xffffff, 0, 16, 12); fill.position.set(0, 1, 8);
  const rim = new DirectionalLight(0xffffff, 0); rim.position.set(2.8, 4, 6);
  const sideGroup = new Group();
  sideGroup.visible = false;
  const sideL = new RectAreaLight(0xffffff, 0, 0.65, 3.5); sideL.position.set(-2.7, 0.5, 4); sideL.rotation.z = 0.4;
  const sideR = new RectAreaLight(0xffffff, 0, 0.5, 3); sideR.position.set(2.7, -0.3, 4); sideR.rotation.z = -0.45;
  sideGroup.add(sideL, sideR); scene.add(key, fill, rim, sideGroup);
  let routes = createSculptureRoutes(initialAspect, rtl), aspect = initialAspect;
  const pointerStates = parts.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
  let previous = routes.map((route) => sampleSculptureRoute(route, 0));
  const rotation = new Euler(), quaternion = new Quaternion(), adjustment = new Quaternion(), center = new Vector3();
  const corner = new Vector3();
  let poses: SculpturePose[] = previous;
  return {
    root, objects: parts.map((part) => part.object),
    setEnvironment(environment: Texture | null) {
      for (const { material } of parts) {
        if (material.envMap === environment) continue;
        material.envMap = environment; material.needsUpdate = true;
      }
    },
    get poses() { return poses; },
    guards(camera: PerspectiveCamera, presence: number): SceneGuard[] {
      return parts.map(({ object }) => {
        if (!root.visible) return { x: 0, y: 0, rx: 0, ry: 0, weight: 0 };
        const box = object.geometry.boundingBox!;
        let left = Infinity, bottom = Infinity, right = -Infinity, top = -Infinity;
        for (let index = 0; index < 8; index++) {
          corner.set(index & 1 ? box.max.x : box.min.x, index & 2 ? box.max.y : box.min.y, index & 4 ? box.max.z : box.min.z).applyMatrix4(object.matrixWorld).project(camera);
          left = Math.min(left, corner.x); right = Math.max(right, corner.x); bottom = Math.min(bottom, corner.y); top = Math.max(top, corner.y);
        }
        return { x: (left + right) / 2, y: (bottom + top) / 2, rx: (right - left) / 2, ry: (top - bottom) / 2,
          weight: right > -1 && left < 1 && top > -1 && bottom < 1 ? presence : 0 };
      });
    },
    resize(nextAspect: number) {
      if (nextAspect === aspect) return;
      aspect = nextAspect; routes = createSculptureRoutes(aspect, rtl);
      previous = routes.map((route) => sampleSculptureRoute(route, 0));
    },
    update(score: StoryScore, pointer: StoryPointer, dt: number) {
      const visible = score.time >= 98 && score.time < 306;
      root.visible = sideGroup.visible = visible;
      if (!visible) { key.intensity = fill.intensity = rim.intensity = sideL.intensity = sideR.intensity = 0; return false; }
      root.position.set(0, 0, score.studioDepth); root.rotation.set(score.studioTilt, 0, 0);
      poses = routes.map((route) => sampleSculptureRoute(route, score.time));
      let moving = false;
      parts.forEach((part, index) => {
        const pose = poses[index], last = previous[index], hover = pointerStates[index];
        const velocity = Math.hypot(pose.rx - last.rx, pose.ry - last.ry, pose.rz - last.rz) / Math.max(0.001, dt);
        const [entry, settle, leave, end] = influenceWindows[index];
        const influence = smooth(entry, entry + 9, score.time) * (1 - smooth(end - 8, end, score.time))
          * (0.25 + 0.75 * smooth(settle - 8, settle, score.time) * (1 - smooth(leave, leave + 8, score.time)))
          * (1 - 0.75 * smooth(0.15, 0.85, velocity));
        const enabled = !pointer.state.coarse && pointer.state.hovering;
        const tx = enabled ? pointer.state.targetX * influence : 0, ty = enabled ? pointer.state.targetY * influence : 0;
        const sx = spring(hover.x, hover.vx, tx, 8, dt), sy = spring(hover.y, hover.vy, ty, 8, dt);
        hover.x = sx.position; hover.vx = sx.velocity; hover.y = sy.position; hover.vy = sy.velocity;
        moving ||= Math.abs(hover.x - tx) + Math.abs(hover.y - ty) + Math.abs(hover.vx) + Math.abs(hover.vy) > 1e-4;
        const pull = pointer.pulls[index + 1];
        rotation.set(pose.rx, pose.ry, pose.rz); quaternion.setFromEuler(rotation).multiply(part.rest.quaternion);
        rotation.set(-0.025 * hover.y - 0.12 * pull.y, 0.04 * hover.x + 0.16 * pull.x, -0.004 * hover.x - 0.025 * pull.x);
        adjustment.setFromEuler(rotation); quaternion.multiply(adjustment);
        center.copy(part.center).multiply(part.rest.scale).multiplyScalar(pose.scale).applyQuaternion(quaternion);
        part.object.position.set(pose.x + 0.016 * hover.x + pull.x, pose.y + 0.01 * hover.y + pull.y, pose.z).sub(center);
        part.object.quaternion.copy(quaternion); part.object.scale.copy(part.rest.scale).multiplyScalar(pose.scale);
        part.material.envMapIntensity = 1.265 * score.lightTravel;
        part.material.envMapRotation.set(0.06 + 1.5 * score.studioTilt + 0.045 * pointer.state.y,
          score.reflection + 0.075 * pointer.state.x, -0.2);
      });
      previous = poses;
      const firstLeave = smooth(140, 160, score.time), secondLeave = smooth(184, 206, score.time);
      const fade = 1 - smooth(232, 262, score.time);
      const dashLight = smooth(194, 214, score.time) * fade;
      const weights = [1 - firstLeave, firstLeave * (1 - secondLeave), secondLeave];
      const vertical = poses.reduce((value, pose, index) => value + clamp(pose.y, -2.5, 1) * weights[index], 0) * fade;
      key.position.set(-0.45 + 4 * score.reflection + 1.6 * score.lightFocus + 0.5 * pointer.state.x - 3.5 * dashLight,
        1.4 - 8 * score.studioTilt + 0.32 * pointer.state.y + 0.45 * vertical, 4.2);
      key.lookAt(score.lightFocus, 0.5 * vertical, 0); key.rotateZ(-0.3); key.intensity = 4.62 * score.lightTravel;
      sideGroup.position.set(0.14 * pointer.state.x, -10.5 * score.studioTilt + 0.08 * pointer.state.y + 0.35 * vertical, 0);
      const light = MathUtils.smoothstep(score.lightTravel, 0.18, 1);
      sideL.intensity = 1.815 * light; sideR.intensity = 1.485 * light;
      fill.position.set(0, 1 - 14 * score.studioTilt, 8); fill.lookAt(0, 0, 0); fill.intensity = 0.11 * light;
      rim.position.set(mix(-4.5, 3.2, score.lightTravel), 3.5, mix(-1, 6, score.lightTravel)); rim.intensity = 0.088 * score.lightTravel;
      root.updateWorldMatrix(true, true);
      return moving;
    },
    dispose() { scene.remove(root, key, fill, rim, sideGroup); },
  };
}
