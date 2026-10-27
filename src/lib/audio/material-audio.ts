import { uiStore } from "@/store/uiStore";

const preferenceKey = "portfolio-audio-preference-v2";
let context: AudioContext | undefined;
let master: GainNode | undefined;
let ambient: HTMLAudioElement | undefined;
let musicGain: GainNode | undefined;
let whisperGain: GainNode | undefined;
let whisperSource: AudioBufferSourceNode | undefined;
let voiceStopAt = 0;
let fetchController: AbortController | undefined;
const whisperBuffers = new Map<string, AudioBuffer>();
const whisperRequests = new Map<string, Promise<AudioBuffer | null>>();
let noise: AudioBufferSourceNode | undefined;
let frictionGain: GainNode | undefined;
let frictionFilter: BiquadFilterNode | undefined;
let frictionPan: StereoPannerNode | undefined;
let motionGain: GainNode | undefined;
let bedGain: GainNode | undefined;
let bedOscillator: OscillatorNode | undefined;
let impulseGain: GainNode | undefined;
let impulseOscillator: OscillatorNode | undefined;
let hoverGain: GainNode | undefined;
let hoverOscillator: OscillatorNode | undefined;
let previousMotionLevel = 0;
let motionTimer: ReturnType<typeof setTimeout> | undefined;
let frictionTimer: ReturnType<typeof setTimeout> | undefined;
const motionSources = new Map<string, { level: number; at: number }>();
let operation = 0;
let owners = 0;
let hoverAt = 0;
let clickAt = 0;
let suspendTimer: ReturnType<typeof setTimeout> | undefined;

export function hydrateAudioPreference(): void {
  if (uiStore.getState().audioPreference !== null) return;
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved === "sound" || saved === "quiet")
      uiStore.getState().setAudioPreference(saved);
  } catch {}
}

function ramp(value: number, duration: number) {
  if (!context || !master) return;
  const now = context.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(value, now + duration);
}

/** No media, AudioContext, or network request is created before explicit sound intent. */
export async function setAudioEnabled(enabled: boolean): Promise<void> {
  const request = ++operation;
  clearTimeout(suspendTimer);
  const store = uiStore.getState();
  store.setAudioPreference(enabled ? "sound" : "quiet");
  try {
    localStorage.setItem(preferenceKey, enabled ? "sound" : "quiet");
  } catch {}
  if (!enabled) {
    stopSectionWhisper();
    silenceMaterial();
    uiStore.setState({ soundEnabled: false, audioState: "muted" });
    ramp(0, 1.5);
    suspendTimer = setTimeout(() => {
      if (request === operation) {
        ambient?.pause();
        void context?.suspend();
      }
    }, 1550);
    return;
  }
  uiStore.getState().setAudioState("starting");
  try {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);
      ambient = new Audio("/assets/sounds/ambient-loop.mp3");
      ambient.preload = "none";
      ambient.loop = true;
      musicGain = context.createGain();
      musicGain.gain.value = 0.95;
      context.createMediaElementSource(ambient).connect(musicGain);
      musicGain.connect(master);
      const buffer = context.createBuffer(
        1,
        Math.ceil(2 * context.sampleRate),
        context.sampleRate,
      );
      const values = buffer.getChannelData(0);
      let brown = 0,
        seed = 9173;
      for (let i = 0; i < values.length; i++) {
        seed = (1664525 * seed + 1013904223) >>> 0;
        const white = (seed / 4294967296) * 2 - 1;
        brown = (brown + 0.035 * white) / 1.035;
        values[i] = 0.38 * white + 1.8 * brown;
      }
      for (let i = 0; i < 512; i++) {
        const t = i / 512;
        values[i] = values[i] * t + values[values.length - 512 + i] * (1 - t);
      }
      noise = context.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      motionGain = context.createGain();
      motionGain.gain.value = 0;
      const band = context.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 660;
      band.Q.value = 0.65;
      const low = context.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 2400;
      low.Q.value = 0.5;
      noise.connect(band);
      band.connect(low);
      low.connect(motionGain);
      motionGain.connect(master);
      const oscillatorLayer = (frequency: number) => {
        const gain = context!.createGain();
        gain.gain.value = 0;
        gain.connect(master!);
        const oscillator = context!.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start();
        return { gain, oscillator };
      };
      const bed = oscillatorLayer(57);
      bedGain = bed.gain;
      bedOscillator = bed.oscillator;
      const impulse = oscillatorLayer(72);
      impulseGain = impulse.gain;
      impulseOscillator = impulse.oscillator;
      const hover = oscillatorLayer(900);
      hoverGain = hover.gain;
      hoverOscillator = hover.oscillator;
      frictionFilter = context.createBiquadFilter();
      frictionFilter.type = "bandpass";
      frictionFilter.frequency.value = 310;
      frictionFilter.Q.value = 0.35;
      frictionGain = context.createGain();
      frictionGain.gain.value = 0;
      noise.connect(frictionFilter);
      frictionPan = context.createStereoPanner();
      frictionFilter.connect(frictionPan);
      frictionPan.connect(frictionGain);
      frictionGain.connect(master);
      noise.start();
    }
    // Both activation-sensitive calls run synchronously in the triggering gesture.
    const resume = context.resume();
    const play = ambient!.play();
    await Promise.all([resume, play]);
    if (request !== operation) return;
    uiStore.setState({ soundEnabled: true, audioState: "playing" });
    ramp(document.hidden ? 0 : 0.38, 2.5);
  } catch (error) {
    if (request !== operation) return;
    uiStore.setState({
      soundEnabled: false,
      audioState:
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "awaiting-user-gesture"
          : "error",
    });
    ambient?.pause();
  }
}

export function playMaterialSound(kind: "hover" | "click" = "hover"): void {
  if (
    !context ||
    !master ||
    !uiStore.getState().soundEnabled ||
    document.hidden ||
    context.state !== "running"
  )
    return;
  const now = performance.now();
  if (
    now - (kind === "hover" ? hoverAt : clickAt) <
    (kind === "hover" ? 90 : 100)
  )
    return;
  if (kind === "hover") hoverAt = now;
  else clickAt = now;
  const at = context.currentTime;
  const oscillator = kind === "hover" ? hoverOscillator : impulseOscillator;
  const gain = kind === "hover" ? hoverGain : impulseGain;
  if (!oscillator || !gain) return;
  const duration = kind === "hover" ? 0.04 : 0.06;
  oscillator.frequency.cancelScheduledValues(at);
  oscillator.frequency.setValueAtTime(kind === "hover" ? 900 : 220, at);
  oscillator.frequency.exponentialRampToValueAtTime(
    kind === "hover" ? 700 : 60,
    at + duration,
  );
  gain.gain.cancelScheduledValues(at);
  gain.gain.setTargetAtTime(kind === "hover" ? 0.014 : 0.045, at, 0.004);
  gain.gain.setTargetAtTime(0, at + 0.012, duration / 3);
}

/** The portrait's low pulse shares the source's long-lived 72 Hz oscillator. */
export function playMaterialImpulse(intensity = 1): void {
  if (
    !context ||
    !impulseGain ||
    !impulseOscillator ||
    !uiStore.getState().soundEnabled ||
    document.hidden ||
    context.state !== "running"
  )
    return;
  const at = context.currentTime;
  impulseGain.gain.cancelScheduledValues(at);
  impulseGain.gain.setTargetAtTime(
    0.035 * Math.max(0, Math.min(1, intensity)),
    at,
    0.008,
  );
  impulseGain.gain.setTargetAtTime(0, at + 0.025, 0.055);
  impulseOscillator.frequency.cancelScheduledValues(at);
  impulseOscillator.frequency.setValueAtTime(72, at);
  impulseOscillator.frequency.exponentialRampToValueAtTime(43, at + 0.17);
}

export function prepareSectionWhisper(
  src: string,
): Promise<AudioBuffer | null> {
  if (!context || !uiStore.getState().soundEnabled || document.hidden)
    return Promise.resolve(null);
  const prior = whisperRequests.get(src);
  if (prior) return prior;
  const owner = context;
  fetchController ??= new AbortController();
  const request = fetch(src, {
    cache: "force-cache",
    signal: fetchController.signal,
  })
    .then((response) => {
      if (!response.ok) throw new Error("Optional section whisper unavailable");
      return response.arrayBuffer();
    })
    .then((bytes) => owner.decodeAudioData(bytes))
    .then((buffer) => {
      if (owner !== context) return null;
      whisperBuffers.set(src, buffer);
      return buffer;
    })
    .catch(() => {
      whisperRequests.delete(src);
      return null;
    });
  whisperRequests.set(src, request);
  return request;
}

export function stopSectionWhisper(): void {
  if (!context || !whisperSource || !whisperGain) return;
  const source = whisperSource;
  whisperSource = undefined;
  voiceStopAt = context.currentTime + 0.055;
  whisperGain.gain.cancelScheduledValues(context.currentTime);
  whisperGain.gain.setValueAtTime(whisperGain.gain.value, context.currentTime);
  whisperGain.gain.linearRampToValueAtTime(0, context.currentTime + 0.05);
  try {
    source.stop(voiceStopAt);
  } catch {
    source.disconnect();
  }
  musicGain?.gain.setTargetAtTime(0.95, context.currentTime, 0.1);
}

export function playSectionWhisper(src: string, gainDb: number): boolean {
  stopSectionWhisper();
  const buffer = whisperBuffers.get(src);
  if (
    !buffer ||
    !context ||
    !master ||
    !uiStore.getState().soundEnabled ||
    document.hidden ||
    context.state !== "running"
  )
    return false;
  whisperGain ??= context.createGain();
  whisperGain.disconnect();
  whisperGain.connect(master);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(whisperGain);
  const start = Math.max(context.currentTime, voiceStopAt),
    end = start + buffer.duration;
  const gain = 0.44 * Math.pow(10, gainDb / 20);
  whisperGain.gain.cancelScheduledValues(start);
  whisperGain.gain.setValueAtTime(0, start);
  whisperGain.gain.linearRampToValueAtTime(gain, start + 0.018);
  whisperGain.gain.setValueAtTime(gain, Math.max(start + 0.018, end - 0.075));
  whisperGain.gain.linearRampToValueAtTime(0, end);
  whisperSource = source;
  source.onended = () => {
    source.disconnect();
    if (whisperSource === source) {
      whisperSource = undefined;
      if (context)
        musicGain?.gain.setTargetAtTime(0.95, context.currentTime, 0.1);
    }
  };
  musicGain?.gain.setTargetAtTime(0.95 * 0.94, context.currentTime, 0.04);
  source.start(start);
  source.stop(end);
  return true;
}

function updateMotionLayers() {
  clearTimeout(motionTimer);
  if (!context || !uiStore.getState().soundEnabled || document.hidden) return;
  const now = performance.now();
  let level = 0,
    next = Infinity;
  motionSources.forEach((value, source) => {
    if (now - value.at >= 140) motionSources.delete(source);
    else {
      level = Math.max(level, value.level);
      next = Math.min(next, 140 - (now - value.at));
    }
  });
  const gain = 0.024 * Math.pow(level, 1.35);
  if (
    Math.abs(gain - previousMotionLevel) > 0.00005 ||
    (gain === 0 && previousMotionLevel !== 0)
  ) {
    motionGain?.gain.setTargetAtTime(
      gain,
      context.currentTime,
      gain > previousMotionLevel ? 0.045 : 0.11,
    );
    bedGain?.gain.setTargetAtTime(0.005 * level, context.currentTime, 0.1);
    previousMotionLevel = gain;
  }
  if (Number.isFinite(next))
    motionTimer = setTimeout(updateMotionLayers, Math.max(1, next));
}

export function setMaterialMotion(
  intensity: number,
  source = "portrait",
): void {
  if (!context || !uiStore.getState().soundEnabled || document.hidden) return;
  motionSources.set(source, {
    level: Math.max(0, Math.min(1, intensity)),
    at: performance.now(),
  });
  updateMotionLayers();
}

export function clearMaterialMotion(source = "portrait") {
  motionSources.delete(source);
  updateMotionLayers();
}

export function setFooterFriction(
  intensity: number,
  speed: number,
  pan: number,
): void {
  if (!context || !uiStore.getState().soundEnabled || document.hidden) return;
  frictionGain?.gain.setTargetAtTime(
    0.009 * Math.pow(Math.max(0, Math.min(1, intensity)), 1.2),
    context.currentTime,
    0.045,
  );
  frictionFilter?.frequency.setTargetAtTime(
    310 + Math.max(0, Math.min(1, speed)) * 440,
    context.currentTime,
    0.08,
  );
  frictionPan?.pan.setTargetAtTime(
    Math.max(-0.45, Math.min(0.45, pan)),
    context.currentTime,
    0.09,
  );
  clearTimeout(frictionTimer);
  frictionTimer = setTimeout(() => {
    if (!context) return;
    frictionGain?.gain.setTargetAtTime(0, context.currentTime, 0.045);
    frictionFilter?.frequency.setTargetAtTime(310, context.currentTime, 0.08);
    frictionPan?.pan.setTargetAtTime(0, context.currentTime, 0.09);
  }, 140);
}

function silenceMaterial() {
  clearTimeout(motionTimer);
  clearTimeout(frictionTimer);
  motionSources.clear();
  if (!context) return;
  motionGain?.gain.setTargetAtTime(0, context.currentTime, 0.025);
  bedGain?.gain.setTargetAtTime(0, context.currentTime, 0.025);
  impulseGain?.gain.setTargetAtTime(0, context.currentTime, 0.025);
  hoverGain?.gain.setTargetAtTime(0, context.currentTime, 0.025);
  previousMotionLevel = 0;
  frictionGain?.gain.setTargetAtTime(0, context.currentTime, 0.025);
}

function onVisibility() {
  if (document.hidden) {
    stopSectionWhisper();
    silenceMaterial();
  }
  ramp(document.hidden ? 0 : uiStore.getState().soundEnabled ? 0.38 : 0, 0.35);
}

function onBlur() {
  stopSectionWhisper();
  silenceMaterial();
}

function retryAfterGesture(event: Event) {
  if (
    !event.isTrusted ||
    uiStore.getState().audioPreference !== "sound" ||
    uiStore.getState().audioState !== "awaiting-user-gesture"
  )
    return;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("[data-sound-control],[data-entry-choice],[inert]"))
    return;
  if (
    event instanceof KeyboardEvent &&
    (event.repeat || !["Enter", " "].includes(event.key))
  )
    return;
  void setAudioEnabled(true);
}

function restoreAfterEntry() {
  const state = uiStore.getState();
  if (state.audioPreference === "sound" && state.audioState === "uninitialized")
    void setAudioEnabled(true);
}

export function attachAudioLifecycle(): () => void {
  if (owners++ === 0) {
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("click", retryAfterGesture, true);
    window.addEventListener("keydown", retryAfterGesture, true);
    window.addEventListener("identity-entry-complete", restoreAfterEntry);
  }
  hydrateAudioPreference();
  return () => {
    if (--owners > 0) return;
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("click", retryAfterGesture, true);
    window.removeEventListener("keydown", retryAfterGesture, true);
    window.removeEventListener("identity-entry-complete", restoreAfterEntry);
    ++operation;
    clearTimeout(suspendTimer);
    clearTimeout(motionTimer);
    clearTimeout(frictionTimer);
    stopSectionWhisper();
    fetchController?.abort();
    fetchController = undefined;
    whisperBuffers.clear();
    whisperRequests.clear();
    whisperGain?.disconnect();
    whisperGain = undefined;
    noise?.stop();
    noise?.disconnect();
    noise = undefined;
    for (const oscillator of [
      bedOscillator,
      impulseOscillator,
      hoverOscillator,
    ]) {
      oscillator?.stop();
      oscillator?.disconnect();
    }
    for (const gain of [bedGain, impulseGain, hoverGain]) gain?.disconnect();
    bedOscillator = impulseOscillator = hoverOscillator = undefined;
    bedGain = impulseGain = hoverGain = undefined;
    frictionGain?.disconnect();
    frictionFilter?.disconnect();
    frictionPan?.disconnect();
    motionGain?.disconnect();
    frictionGain = undefined;
    frictionFilter = undefined;
    frictionPan = undefined;
    motionGain = undefined;
    ambient?.pause();
    ambient?.removeAttribute("src");
    ambient?.load();
    ambient = undefined;
    master?.disconnect();
    master = undefined;
    musicGain = undefined;
    void context?.close();
    context = undefined;
    uiStore.setState({ soundEnabled: false, audioState: "uninitialized" });
  };
}
