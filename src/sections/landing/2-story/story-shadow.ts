import {
  Color, DoubleSide, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry,
  ShaderMaterial, Vector2, WebGLRenderTarget, type Group, type Scene, type WebGLRenderer,
} from "three";
import { smooth, type StoryScore } from "./story-score";

/** The reference's two-pass 9-tap silhouette shadow, captured only when needed. */
export function createGlassesShadow(group: Group, scene: Scene, width: number) {
  const resolution = width < 701 ? 256 : 512;
  const raw = new WebGLRenderTarget(resolution, resolution);
  const soft = new WebGLRenderTarget(resolution, resolution, { depthBuffer: false });
  raw.texture.generateMipmaps = soft.texture.generateMipmaps = false;
  const camera = new OrthographicCamera(-3.6, 3.6, 2.4, -2.4, 0.1, 9);
  camera.position.z = 6; camera.layers.set(8); group.add(camera);
  const silhouette = new MeshBasicMaterial({ color: 0, side: DoubleSide, toneMapped: false });
  const blur = new ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { uMap: { value: raw.texture }, uStep: { value: new Vector2(0.012, 0) } },
    vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: `varying vec2 vUv; uniform sampler2D uMap; uniform vec2 uStep;
      void main(){float alpha=0.,sum=0.;for(int i=-4;i<=4;i++){float w=exp(-.25*float(i*i));
      alpha+=texture2D(uMap,vUv+float(i)*uStep).a*w;sum+=w;}gl_FragColor=vec4(0.,0.,0.,alpha/sum);}`,
  });
  const quad = new Mesh(new PlaneGeometry(2, 2), blur);
  quad.frustumCulled = false; quad.layers.set(8);
  const material = new MeshBasicMaterial({ map: raw.texture, color: 0, transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false });
  const plane = new Mesh(new PlaneGeometry(7.2, 4.8), material);
  plane.position.set(0.06, -0.22, -0.55); group.add(plane);
  const oldColor = new Color();
  let lastPose = "";
  return {
    update(renderer: WebGLRenderer, score: StoryScore) {
      material.opacity = 0.18 * smooth(0.18, 1, score.emergence) * (1 - smooth(14, 30, score.time));
      plane.visible = material.opacity > 0;
      if (!plane.visible) return;
      group.updateWorldMatrix(true, true);
      const pose = group.matrixWorld.elements.map((value) => value.toFixed(5)).join(",");
      if (pose === lastPose) return;
      lastPose = pose;
      const target = renderer.getRenderTarget(), background = scene.background, override = scene.overrideMaterial;
      const alpha = renderer.getClearAlpha(); renderer.getClearColor(oldColor);
      try {
        renderer.setClearColor(0, 0); scene.background = null; scene.overrideMaterial = silhouette;
        renderer.setRenderTarget(raw); renderer.clear(); renderer.render(scene, camera);
        scene.overrideMaterial = override;
        blur.uniforms.uMap.value = raw.texture; blur.uniforms.uStep.value.set(0.012, 0);
        renderer.setRenderTarget(soft); renderer.clear(); renderer.render(quad, camera);
        blur.uniforms.uMap.value = soft.texture; blur.uniforms.uStep.value.set(0, 0.018);
        renderer.setRenderTarget(raw); renderer.clear(); renderer.render(quad, camera);
      } finally {
        scene.background = background; scene.overrideMaterial = override;
        renderer.setRenderTarget(target); renderer.setClearColor(oldColor, alpha);
      }
    },
    dispose() {
      group.remove(camera, plane); raw.dispose(); soft.dispose(); silhouette.dispose();
      blur.dispose(); quad.geometry.dispose(); material.dispose(); plane.geometry.dispose();
    },
  };
}
