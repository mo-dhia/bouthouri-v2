import { Camera, Color, HalfFloatType, LinearFilter, Mesh, PlaneGeometry, RGBAFormat, Scene, ShaderMaterial, Vector2, Vector4, WebGLRenderTarget, type WebGLRenderer } from "three";
import { simulationFragment, simulationVertex } from "./story-environment-shaders";

export function createEnvironmentField(aspect: number, mobile: boolean) {
  const height = mobile ? 96 : 128, width = Math.max(16, Math.min(288, Math.round(height * aspect)));
  const targets = [0, 1].map(() => new WebGLRenderTarget(width, height, {
    type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false, stencilBuffer: false,
  }));
  for (const target of targets) target.texture.generateMipmaps = false;
  const uniforms = {
    uState: { value: targets[0].texture }, uCell: { value: new Vector2(1 / width, 1 / height) },
    uWorldCell: { value: new Vector2(2 * aspect / width, 2 / height) }, uAspect: { value: aspect }, uDt: { value: 1 / 120 },
    uDirection: { value: new Vector2(1, 0.2) }, uDrag: { value: new Vector2() }, uStroke: { value: new Vector4() },
    uPulse: { value: new Vector4() }, uMotion: { value: 0 }, uPress: { value: 0 }, uScroll: { value: 0 },
    uHorizontal: { value: 0 }, uQuiet: { value: 0 }, uGuards: { value: Array.from({ length: 4 }, () => new Vector4()) },
    uGuardWeight: { value: [0, 0, 0, 0] },
  };
  const material = new ShaderMaterial({ vertexShader: simulationVertex, fragmentShader: simulationFragment,
    depthTest: false, depthWrite: false, uniforms });
  const mesh = new Mesh(new PlaneGeometry(2, 2), material); mesh.frustumCulled = false;
  const scene = new Scene(); scene.add(mesh); const camera = new Camera();
  let index = 0, accumulator = 0, initialized = false;
  return {
    uniforms,
    get texture() { return targets[index].texture; },
    clear(renderer: WebGLRenderer) {
      const previous = renderer.getRenderTarget(), alpha = renderer.getClearAlpha(), color = renderer.getClearColor(new Color());
      renderer.setClearColor(0, 0);
      for (const target of targets) { renderer.setRenderTarget(target); renderer.clear(); }
      renderer.setRenderTarget(previous); renderer.setClearColor(color, alpha); accumulator = 0; initialized = true;
    },
    advance(renderer: WebGLRenderer, dt: number) {
      if (!initialized) this.clear(renderer);
      const previous = renderer.getRenderTarget();
      accumulator += Math.min(dt, 1 / 30);
      while (accumulator >= 1 / 120) {
        uniforms.uState.value = targets[index].texture; index = 1 - index;
        renderer.setRenderTarget(targets[index]); renderer.render(scene, camera); accumulator -= 1 / 120;
      }
      renderer.setRenderTarget(previous);
    },
    dispose() { for (const target of targets) target.dispose(); material.dispose(); mesh.geometry.dispose(); },
  };
}
