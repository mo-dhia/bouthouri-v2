import * as THREE from "three";
import { createMaterialProtectionPublisher } from "@/components/layout/header/material-protection";
import { clamp } from "./hero-world";
import { viewportDesign } from "@/lib/viewport-design";
import type { ReadingPortraitState } from "./hero-reading-portrait";
import {
  playMaterialImpulse,
  setMaterialMotion,
  clearMaterialMotion,
} from "@/lib/audio/material-audio";

export type PortraitController = {
  render: (
    delta: number,
    resolve: number,
    exit: number,
    pointerStrength: number,
    active: boolean,
  ) => boolean;
  measure: () => void;
  reset: () => void;
  dispose: () => void;
};

type PortraitOptions = { signal?: AbortSignal; reading?: ReadingPortraitState };
const portraitOwners = new WeakMap<HTMLCanvasElement, () => void>();

const vertexShader = `varying vec2 vUv; void main() { vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
// The reference's 34-cell nearest-neighbour material, reimplemented as an isolated
// native Three plane. A settled frame samples the original photograph unchanged.
const fragmentShader = `
precision highp float;
uniform sampler2D photograph;
uniform sampler2D field;
uniform float resolve;
uniform float opacity;
uniform float pointerStrength;
uniform float fieldActive;
uniform float departure;
uniform float exitVelocity;
uniform float exitDetail;
uniform vec2 exitPixel;
uniform vec2 view;
varying vec2 vUv;
vec4 samplePhoto(vec2 uv) {
  if (uv.x<0. || uv.x>1. || uv.y<0. || uv.y>1.) return vec4(0.);
  return texture2D(photograph,uv);
}
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
void main() {
  vec4 base=samplePhoto(vUv);
  if (resolve==1. && fieldActive==0. && departure==0.) { gl_FragColor=base*opacity; return; }
  if (base.a==0. || departure>=1.) { gl_FragColor=vec4(0.); return; }
  vec4 cell=texture2D(field,vUv);
  vec2 cellUV=(floor(vUv*34.)+.5)/34.;
  vec2 face=(cellUV-vec2(.425,.535))/vec2(.215,.265);
  float faceWeight=mix(.62,1.,smoothstep(.35,1.25,length(face)));
  vec2 offset=cell.rg*.02;
  offset*=min(1.,.055/max(length(offset),.00001))*faceWeight*pointerStrength;
  if (resolve<1.) {
    float distance=length((cellUV-vec2(.47,.16))*vec2(.8,1.));
    float phase=clamp(distance*.30+abs(cell.b)*.007,0.,.36);
    offset+=cell.ba*.02*(1.-smoothstep(phase,phase+.64,resolve));
  }
  float visibility=1.;
  if (departure>0.) {
    float screenY=view.x+(1.-vUv.y)*view.y;
    float luma=dot(base.rgb/max(base.a,.00001),vec3(.2126,.7152,.0722));
    float variation=(noise(vec2(vUv.x,screenY)*vec2(2.1,1.7)+vec2(3.7,1.9))-.5)*.042+(luma-.3)*.008;
    visibility=smoothstep(-.36,.36,1.42-1.6*departure-screenY+variation)*(1.-smoothstep(.92,1.,departure));
    offset*=smoothstep(.02,.7,visibility);
    float depth=pow(4.*visibility*(1.-visibility),3.)*exitDetail;
    float response=(.3+.7*faceWeight)*depth;
    offset.x+=sin(vUv.x*5.+1.)*(.25+exitVelocity*.8)*exitPixel.x*response;
    offset.y-=.55*exitPixel.y*response;
  }
  offset*=smoothstep(.05,.92,base.a);
  vec4 moved=samplePhoto(vUv+offset);
  vec3 straight=moved.rgb/max(moved.a,.00001);
  vec3 color=mix(base.rgb,straight*base.a,smoothstep(.05,.65,moved.a));
  gl_FragColor=vec4(color,base.a)*opacity*visibility;
}`;

/** Reference alpha-hit field; shader and pressure protection share its geometry. */
export function portraitExitVisibility(
  progress: number,
  u: number,
  screenY: number,
): number {
  if (progress <= 0) return 1;
  if (progress >= 1) return 0;
  const smooth = (a: number, b: number, value: number) => {
    const t = clamp((value - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const fract = (value: number) => value - Math.floor(value),
    hash = (x: number, y: number) =>
      fract(Math.sin(127.1 * x + 311.7 * y) * 43758.5453);
  const x = 2.1 * u + 3.7,
    y = 1.7 * screenY + 1.9,
    ix = Math.floor(x),
    iy = Math.floor(y),
    fx = smooth(0, 1, fract(x)),
    fy = smooth(0, 1, fract(y));
  const noise =
    (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy) +
    (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy;
  return (
    smooth(
      -0.36,
      0.36,
      1.42 - 1.6 * progress - screenY + (noise - 0.5) * 0.042,
    ) *
    (1 - smooth(0.92, 1, progress))
  );
}

function entryOpacity(value: number): number {
  const knots = [0, 0.2, 0.5, 0.8],
    levels = [0, 0.25, 0.7, 1],
    slopes = [0.55, 1.5, 1.3, 0];
  if (value >= 0.8) return 1;
  let index = 0;
  while (index < 2 && value > knots[index + 1]) index++;
  const width = knots[index + 1] - knots[index],
    x = clamp((value - knots[index]) / width),
    x2 = x * x,
    x3 = x2 * x;
  return (
    (2 * x3 - 3 * x2 + 1) * levels[index] +
    (x3 - 2 * x2 + x) * width * slopes[index] +
    (-2 * x3 + 3 * x2) * levels[index + 1] +
    (x3 - x2) * width * slopes[index + 1]
  );
}

export async function mountHeroPortrait(
  root: HTMLElement,
  options: PortraitOptions = {},
): Promise<PortraitController> {
  const emitMaterialProtection = createMaterialProtectionPublisher(root);
  const container = root.querySelector<HTMLElement>(
    "[data-portrait-entrance]",
  )!;
  const image = container.querySelector<HTMLImageElement>("img")!;
  const canvas = container.querySelector<HTMLCanvasElement>("canvas")!;
  const reading = options.reading;
  const aborted = () => new DOMException("Portrait preparation cancelled", "AbortError");
  if (options.signal?.aborted) throw aborted();
  let cancelled = false;
  const ownsCanvas = () => portraitOwners.get(canvas) === cancel;
  const releaseOwner = () => {
    options.signal?.removeEventListener("abort", cancel);
    if (ownsCanvas()) {
      container.dataset.portraitReady = "false";
      portraitOwners.delete(canvas);
    }
  };
  let cancelPreparation = releaseOwner;
  const cancel = () => { cancelled = true; cancelPreparation(); };
  const assertOwner = () => { if (cancelled || !ownsCanvas()) throw aborted(); };
  portraitOwners.get(canvas)?.();
  portraitOwners.set(canvas, cancel);
  options.signal?.addEventListener("abort", cancel, { once: true });
  let renderer: THREE.WebGLRenderer;
  try {
    await image.decode();
    assertOwner();
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
      premultipliedAlpha: true,
    });
  } catch (error) {
    cancel();
    throw error;
  }
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const photo = new THREE.Texture(image);
  photo.colorSpace = THREE.NoColorSpace;
  photo.generateMipmaps = false;
  photo.premultiplyAlpha = true;
  photo.minFilter = photo.magFilter = THREE.LinearFilter;
  photo.needsUpdate = true;
  const size = 34,
    data = new Float32Array(size * size * 4);
  let seed = 3450649;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  for (let i = 0; i < data.length; i += 4) {
    data[i + 2] = (random() - 0.5) * 18;
    data[i + 3] = (random() - 0.5) * 18;
  }
  const field = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  field.minFilter = field.magFilter = THREE.NearestFilter;
  field.generateMipmaps = false;
  field.needsUpdate = true;
  const uniforms = {
    photograph: { value: photo },
    field: { value: field },
    resolve: { value: 1 },
    opacity: { value: 1 },
    pointerStrength: { value: 1 },
    fieldActive: { value: 0 },
    departure: { value: 0 },
    exitVelocity: { value: 0 },
    exitDetail: { value: reading ? 0 : viewportDesign(innerWidth).width <= 700 ? 0.35 : 1 },
    exitPixel: { value: new THREE.Vector2(1, 1) },
    view: { value: new THREE.Vector2(0, 1) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  let disposed = false,
    lost = false,
    dirty = true,
    peak = 0,
    elapsed = 0,
    lastTime = 0;
  let x = 0.5,
    y = 0.5,
    vx = 0,
    vy = 0,
    lastX = 0,
    lastY = 0,
    hover = false;
  let rect = image.getBoundingClientRect();
  let pixelWidth = 0,
    pixelHeight = 0,
    pixelRatio = 0;
  let compiling = false, resourcesReleased = false;
  const releaseResources = () => {
    if (resourcesReleased) return;
    resourcesReleased = true;
    geometry.dispose();
    material.dispose();
    photo.dispose();
    field.dispose();
    renderer.dispose();
  };
  let previousExit = 0;
  let surfaceActive = false,
    protectedActive = false,
    clientX = 0,
    clientY = 0,
    heroHeight = root.offsetHeight;
  let lastPointer: PointerEvent | undefined;
  const releaseProtection = () => {
    protectedActive = false;
    emitMaterialProtection({
      source: "portrait",
      active: false,
      pressureScale: 1,
      influence: 0,
      clientX,
      clientY,
    });
  };
  const protect = (event: PointerEvent) => {
    lastPointer = event;
    clientX = event.clientX;
    clientY = event.clientY;
    if (hit(event)) {
      protectedActive = true;
      emitMaterialProtection({
        source: "portrait",
        active: true,
        pressureScale:
          1 -
          0.88 *
            portraitExitVisibility(
              uniforms.departure.value,
              (clientX - rect.left) / rect.width,
              clientY / heroHeight,
            ) *
            uniforms.pointerStrength.value,
        influence: 0,
        clientX,
        clientY,
      });
    } else if (protectedActive) releaseProtection();
  };

  let alpha: Uint8ClampedArray | undefined;
  if (!reading) {
    const alphaCanvas = document.createElement("canvas");
    alphaCanvas.width = 192;
    alphaCanvas.height = 128;
    const alphaContext = alphaCanvas.getContext("2d", { willReadFrequently: true });
    alphaContext?.drawImage(image, 0, 0, 192, 128);
    alpha = alphaContext?.getImageData(0, 0, 192, 128).data;
  }
  const measure = () => {
    if (disposed || lost) return;
    rect = image.getBoundingClientRect();
    heroHeight = root.offsetHeight;
    if (reading) {
      const width = rect.width, height = rect.height;
      reading.measure((rect.top - root.getBoundingClientRect().top) / heroHeight, height / heroHeight);
      uniforms.exitPixel.value.set(1 / width, 1 / height);
      if (width && height) {
        const ratio = Math.min(devicePixelRatio || 1, 1.5, (image.naturalWidth || 1536) / width);
        if (width !== pixelWidth || height !== pixelHeight || ratio !== pixelRatio) {
          renderer.setPixelRatio(ratio);
          renderer.setSize(width, height, false);
          pixelWidth = width; pixelHeight = height; pixelRatio = ratio;
          reading.invalidate();
        }
      }
      return;
    }
    const width = image.offsetWidth,
      height = image.offsetHeight;
    uniforms.exitPixel.value.set(1 / width, 1 / height);
    uniforms.exitDetail.value = viewportDesign(innerWidth).width <= 700 ? 0.35 : 1;
    if (width !== pixelWidth || height !== pixelHeight) {
      renderer.setPixelRatio(
        Math.min(devicePixelRatio || 1, 1.5, 1536 / width),
      );
      renderer.setSize(width, height, false);
      pixelWidth = width;
      pixelHeight = height;
      dirty = true;
    }
  };
  const hit = (event: PointerEvent | MouseEvent) => {
    if (
      document.hidden ||
      document.documentElement.dataset.menuOpen === "true" ||
      !surfaceActive ||
      uniforms.pointerStrength.value < 0.01 ||
      (event.target instanceof Element &&
        event.target.closest("a,button,input,[data-hero-identity]"))
    )
      return false;
    rect = image.getBoundingClientRect();
    const u = (event.clientX - rect.left) / rect.width,
      v = (event.clientY - rect.top) / rect.height;
    return (
      u >= 0 &&
      u < 1 &&
      v >= 0 &&
      v < 1 &&
      portraitExitVisibility(
        uniforms.departure.value,
        u,
        event.clientY / heroHeight,
      ) >= 0.08 &&
      (!alpha ||
        alpha[(Math.floor(v * 128) * 192 + Math.floor(u * 192)) * 4 + 3] > 100)
    );
  };
  const move = (event: PointerEvent) => {
    protect(event);
    if (event.pointerType !== "mouse" || !hit(event)) {
      hover = false;
      lastTime = 0;
      return;
    }
    const dt = Math.max(
      0.008,
      Math.min(0.06, (event.timeStamp - lastTime) / 1000),
    );
    x = (event.clientX - rect.left) / rect.width;
    y = 1 - (event.clientY - rect.top) / rect.height;
    vx = lastTime
      ? Math.max(
          -0.035,
          Math.min(0.035, (event.clientX - lastX) / rect.width / 60 / dt),
        )
      : 0;
    vy = lastTime
      ? Math.max(
          -0.035,
          Math.min(0.035, (lastY - event.clientY) / rect.height / 60 / dt),
        )
      : 0;
    lastX = event.clientX;
    lastY = event.clientY;
    lastTime = event.timeStamp;
    hover = true;
    root.dispatchEvent(new Event("hero-portrait-wake"));
  };
  const click = (event: MouseEvent) => {
    if (event.button !== 0 || !hit(event)) return;
    const u = ((event.clientX - rect.left) / rect.width) * size,
      v = (1 - (event.clientY - rect.top) / rect.height) * size,
      radius = size * 0.1;
    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++) {
        const dx = col - u,
          dy = row - v,
          d = Math.sqrt((dx * dx) / (rect.height / rect.width) + dy * dy);
        if (d >= radius * 1.4) continue;
        const strength = Math.exp((-d * d) / (radius * radius * 0.65)),
          index = (col + row * size) * 4;
        data[index] += ((-dx / Math.max(0.75, d)) * 0.55 + 0.16) * strength;
        data[index + 1] += ((-dy / Math.max(0.75, d)) * 0.55 + 0.06) * strength;
      }
    peak = Math.max(peak, 0.5);
    dirty = true;
    playMaterialImpulse();
    root.dispatchEvent(new Event("hero-portrait-wake"));
  };
  const reset = () => {
    lastPointer = undefined;
    hover = false;
    vx = vy = lastTime = 0;
    peak = elapsed = 0;
    for (let i = 0; i < data.length; i += 4) data[i] = data[i + 1] = 0;
    field.needsUpdate = true;
    dirty = true;
    clearMaterialMotion();
    releaseProtection();
  };
  const pointerOut = (event: PointerEvent) => {
    if (!event.relatedTarget) reset();
  };
  const visibility = () => {
    if (document.hidden) reset();
  };
  const onContextLost = (event: Event) => {
    if (disposed || !ownsCanvas()) return;
    event.preventDefault();
    lost = true;
    surfaceActive = false;
    if (!reading) releaseProtection();
    reading?.unavailable();
    container.dataset.portraitReady = "false";
    root.dispatchEvent(new Event("hero-portrait-wake"));
  };
  const onContextRestored = () => {
    if (disposed || !ownsCanvas()) return;
    lost = false;
    dirty = true;
    reading?.prepared();
    container.dataset.portraitReady = "true";
    root.dispatchEvent(new Event("hero-portrait-wake"));
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (!reading) {
      clearMaterialMotion();
      releaseProtection();
    }
    reading?.unavailable();
    window.removeEventListener("pointermove", move, true);
    window.removeEventListener("pointerdown", protect, true);
    window.removeEventListener("pointercancel", reset);
    window.removeEventListener("pointerout", pointerOut);
    window.removeEventListener("resize", reset);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("click", click);
    window.removeEventListener("blur", reset);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    // Three's compileAsync polls material programs. Keep them valid until its
    // pending check finishes, but revoke drawing and DOM ownership immediately.
    if (!compiling) releaseResources();
    releaseOwner();
  };
  cancelPreparation = dispose;
  const applyReadingFrame = () => {
    if (!reading) return;
    const frame = reading.frame;
    uniforms.resolve.value = frame.resolve;
    uniforms.opacity.value = entryOpacity(frame.resolve);
    uniforms.departure.value = frame.exit;
    const gain = clamp((uniforms.opacity.value * frame.pointer - 0.15) / 0.55);
    const strength = gain * gain * (3 - 2 * gain);
    if (uniforms.pointerStrength.value !== strength) reading.invalidate();
    uniforms.pointerStrength.value = strength;
    if (uniforms.view.value.x !== frame.viewTop || uniforms.view.value.y !== frame.viewHeight) {
      uniforms.view.value.set(frame.viewTop, frame.viewHeight);
      if (frame.exit > 0) reading.invalidate();
    }
  };
  try {
    measure();
    if (reading) { renderer.initTexture(photo); renderer.initTexture(field); }
    compiling = true;
    await renderer.compileAsync(scene, camera);
    compiling = false;
    assertOwner();
    if (reading) {
      const gl = renderer.getContext();
      if (renderer.info.programs?.some((program) => !gl.getProgramParameter(program.program, gl.LINK_STATUS)))
        throw new Error("Portrait shader could not compile");
      measure(); applyReadingFrame();
    }
    renderer.render(scene, camera);
    reading?.prepared();
    container.dataset.portraitReady = "true";
    if (reading) canvas.dataset.surface = "prepared";
    if (!reading) {
      window.addEventListener("pointermove", move, {
        passive: true,
        capture: true,
      });
      window.addEventListener("pointerdown", protect, {
        passive: true,
        capture: true,
      });
      window.addEventListener("pointercancel", reset);
      window.addEventListener("pointerout", pointerOut);
      window.addEventListener("resize", reset);
      document.addEventListener("visibilitychange", visibility);
      window.addEventListener("click", click, { passive: true });
      window.addEventListener("blur", reset);
    }
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
  } catch (error) {
    compiling = false;
    dispose();
    releaseResources();
    throw error;
  }
  return {
    measure,
    reset,
    dispose,
    render(delta, resolve, exit, strength, active) {
      if (disposed || lost) return false;
      if (reading) {
        if (document.hidden || document.documentElement.dataset.menuOpen === "true") return false;
        // The lightweight caller preserves the same sample before preparation.
        // This branch never integrates pointer fields or starts a frame clock.
        reading.sample({ resolve, exit, pointer: strength, active });
        applyReadingFrame();
        if (!active) { canvas.dataset.surface = "sleep"; return false; }
        if (reading.draw(delta)) {
          renderer.render(scene, camera);
          canvas.dataset.surface = resolve < 1 ? "resolving" : "rest";
          canvas.dataset.exit = exit.toFixed(4);
        }
        return false;
      }
      const speed =
        delta > 0 && delta < 0.1 && Math.abs(exit - previousExit) < 0.12
          ? (exit - previousExit) / delta
          : 0;
      const targetVelocity = active
        ? Math.max(-1, Math.min(1, 0.18 * speed))
        : 0;
      let velocity =
        uniforms.exitVelocity.value +
        (targetVelocity - uniforms.exitVelocity.value) *
          (1 - Math.exp(-35 * Math.max(0, delta)));
      if (Math.abs(velocity) < 0.0005) velocity = 0;
      if (velocity !== uniforms.exitVelocity.value) {
        uniforms.exitVelocity.value = velocity;
        dirty = true;
      }
      previousExit = exit;
      const wasSurfaceActive = surfaceActive;
      surfaceActive = active && !document.hidden;
      if (!surfaceActive && protectedActive) releaseProtection();
      if (!surfaceActive) {
        if (wasSurfaceActive) reset();
        return false;
      }
      let changed = false;
      elapsed += Math.min(0.05, delta);
      while (elapsed >= 1 / 60) {
        elapsed -= 1 / 60;
        if (!peak && !vx && !vy) continue;
        peak = 0;
        for (let row = 0; row < size; row++)
          for (let col = 0; col < size; col++) {
            const index = (col + row * size) * 4,
              dx = x * size - col,
              dy = y * size - row,
              distance = (dx * dx) / (rect.height / rect.width) + dy * dy;
            if (hover && distance < (size * 0.1) ** 2) {
              const power = Math.min(
                10,
                (size * 0.1) / Math.sqrt(Math.max(distance, 0.00001)),
              );
              data[index] += 14 * vx * power;
              data[index + 1] += 14 * vy * power;
            }
            data[index] *= 0.955;
            data[index + 1] *= 0.955;
            if (Math.abs(data[index]) + Math.abs(data[index + 1]) < 0.003)
              data[index] = data[index + 1] = 0;
            peak = Math.max(
              peak,
              Math.abs(data[index]),
              Math.abs(data[index + 1]),
            );
          }
        vx *= 0.9;
        vy *= 0.9;
        if (Math.abs(vx) + Math.abs(vy) < 0.00001) vx = vy = 0;
        changed = true;
      }
      if (changed) field.needsUpdate = true;
      const inputGain = clamp((entryOpacity(resolve) * strength - 0.15) / 0.55),
        pointerStrength = inputGain * inputGain * (3 - 2 * inputGain);
      if (uniforms.pointerStrength.value > 0 && pointerStrength === 0) reset();
      if (
        uniforms.resolve.value !== resolve ||
        uniforms.departure.value !== exit ||
        uniforms.pointerStrength.value !== pointerStrength
      )
        dirty = true;
      uniforms.resolve.value = resolve;
      uniforms.opacity.value = entryOpacity(resolve);
      uniforms.departure.value = exit;
      uniforms.pointerStrength.value = pointerStrength;
      if (lastPointer) protect(lastPointer);
      uniforms.fieldActive.value = peak > 0 ? 1 : 0;
      if (pointerStrength > 0)
        setMaterialMotion(
          Math.min(1, 70 * Math.hypot(vx, vy)) * pointerStrength,
        );
      const imageRect = image.getBoundingClientRect();
      uniforms.view.value.set(
        imageRect.top / heroHeight,
        imageRect.height / heroHeight,
      );
      if (dirty || changed) {
        renderer.render(scene, camera);
        dirty = false;
        canvas.dataset.surface =
          resolve < 1 ? "resolving" : peak ? "interacting" : "rest";
      }
      return peak > 0 || vx !== 0 || vy !== 0 || resolve < 1 || velocity !== 0;
    },
  };
}
