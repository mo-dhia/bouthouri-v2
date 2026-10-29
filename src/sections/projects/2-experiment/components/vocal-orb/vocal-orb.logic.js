/** Adapted from Carter Ogunsola's public Lab vocal-orb example, inspected 2026-10-29.
 * Renderer math and interaction constants retain the measured source contract.
 * The owning gate supplies native scheduling, width coordinates and cleanup. */
import { setDesignStyle, referenceRect } from '../../experiment-dom';
import { acquireOrbStream } from "./orb-input";
import { VERT, SCENE, DOWN, UP, COMPOSITE, LEVELS, BG } from "./orb-shaders";
const svgMicOff = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M16.25 11.5V7C16.25 4.65279 14.3472 2.75 12 2.75C10.6334 2.75 9.41741 3.39504 8.63994 4.39727M3 3L7.75 7.75M7.75 7.75V11.5C7.75 13.8472 9.65279 15.75 12 15.75C13.0463 15.75 14.0043 15.3719 14.7449 14.7449M7.75 7.75L14.7449 14.7449M14.7449 14.7449L17.0474 17.0474M21 21L17.0474 17.0474M12 19C8.92453 19 6.2814 17.1489 5.12407 14.5M12 19V21.25M12 19C13.9439 19 15.715 18.2605 17.0474 17.0474" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgSpeakerOn = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M19.2478 4.75194C21.1027 6.60683 22.25 9.16933 22.25 11.9998C22.25 14.8302 21.1027 17.3927 19.2478 19.2476M15.8891 8.11132C16.8844 9.10662 17.5 10.4816 17.5 12.0004C17.5 13.5192 16.8844 14.8942 15.8891 15.8895M3.75 7.74999H5.35491C5.77433 7.74999 6.18314 7.61813 6.52352 7.37306L11.4578 3.82034C11.7886 3.58221 12.25 3.81856 12.25 4.22611V19.7739C12.25 20.1814 11.7886 20.4178 11.4578 20.1796L6.52352 16.6269C6.18314 16.3818 5.77433 16.25 5.35491 16.25H3.75C2.64543 16.25 1.75 15.3546 1.75 14.25V9.74999C1.75 8.64542 2.64543 7.74999 3.75 7.74999Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const svgSpeakerOff = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M21.5 9.99999L19.3787 12.1213M19.3787 12.1213L17.2574 14.2426M19.3787 12.1213L17.2574 9.99999M19.3787 12.1213L21.5 14.2426M3.75 7.74999H5.35491C5.77433 7.74999 6.18314 7.61813 6.52352 7.37306L11.4578 3.82034C11.7886 3.58221 12.25 3.81856 12.25 4.22611V19.7739C12.25 20.1814 11.7886 20.4178 11.4578 20.1796L6.52352 16.6269C6.18314 16.3818 5.77433 16.25 5.35491 16.25H3.75C2.64543 16.25 1.75 15.3546 1.75 14.25V9.74999C1.75 8.64542 2.64543 7.74999 3.75 7.74999Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const HEARTS = ["glass", "silver", "void"];
const VOICES = [
    { id: "af_heart", label: "Heart" },
    { id: "af_bella", label: "Bella" },
    { id: "am_michael", label: "Michael" },
    { id: "bf_emma", label: "Emma" },
    { id: "bm_george", label: "George" },
    { id: "bm_fable", label: "Fable" }
];
const SPEAKER_MODES = [
    { id: "live", label: "Live" },
    { id: "readback", label: "Read back" }
];
const EFFECTS = [
    { id: "room", label: "Room" },
    { id: "hall", label: "Hall" },
    { id: "delay", label: "Delay" },
    { id: "radio", label: "Radio" },
    { id: "robot", label: "Robot" }
];
const DEFAULTS = {
    heart: "silver",
    speaker: "live",
    effect: "room",
    voice: "af_heart",
    speed: 1,
    energy: 1,
    flare: 1,
    bloom: 1,
    spread: 1,
    rest: 0.8,
    view: 8,
    size: 0.3
};
function program(gl, frag) {
    const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(s) ?? "shader");
        return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(p) ?? "link");
    const loc = {};
    return { p, u: (name) => name in loc ? loc[name] : loc[name] = gl.getUniformLocation(p, name) };
}
const NS = "http://www.w3.org/2000/svg";
const BAR_X = [3.75, 7.75, 12, 16.25, 20.25];
const BAR_HALF = [1.25, 6.25, 2.25, 4.25, 1.25];
const WEIGHT = "1.5";
const spring = (k, c) => ({ x: 0, v: 0, to: 0, at: 0, k, c });
function stepSpring(sp, dt, now) {
    const target = now >= sp.at ? sp.to : 1 - sp.to;
    for (let t = dt; t > 0; t -= 1 / 240) {
        const h = Math.min(t, 1 / 240);
        sp.v += (sp.k * (target - sp.x) - sp.c * sp.v) * h;
        sp.x += sp.v * h;
    }
}
const stepFree = (sp, dt) => stepSpring(sp, dt, Infinity);
const tune = (sp, k, z) => {
    sp.k = k;
    sp.c = 2 * z * Math.sqrt(k);
};
const r3 = (n) => Math.round(n * 1e3) / 1e3;
const pill = (cx, top, bottom, hw) => hw < 0.01 ? `M${cx} ${r3(top)}V${r3(bottom)}` : `M${r3(cx - hw)} ${r3(top + hw)}A${r3(hw)} ${r3(hw)} 0 0 1 ${r3(cx + hw)} ${r3(top + hw)}V${r3(bottom - hw)}A${r3(hw)} ${r3(hw)} 0 0 1 ${r3(cx - hw)} ${r3(bottom - hw)}Z`;
function micGlyph(reduced) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("shape-rendering", "geometricPrecision");
    const el = (tag, attrs, parent = svg) => {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs)
            e.setAttribute(k, attrs[k]);
        parent.appendChild(e);
        return e;
    };
    const memo = new WeakMap();
    const put = (e, k, v) => {
        let m = memo.get(e);
        if (!m)
            memo.set(e, m = {});
        if (m[k] === v)
            return;
        m[k] = v;
        e.setAttribute(k, v);
    };
    const stroke = { stroke: "currentColor", "stroke-width": WEIGHT, "stroke-linecap": "round", "stroke-linejoin": "round" };
    const fold = el("g", {});
    el("path", { ...stroke, "vector-effect": "non-scaling-stroke", d: "M5.124 14.5C6.281 17.149 8.924 19 12 19C15.075 19 17.719 17.149 18.876 14.5" }, fold);
    el("path", { ...stroke, "vector-effect": "non-scaling-stroke", d: "M12 19V21.25" }, fold);
    const cap = el("path", { ...stroke });
    const bars = BAR_X.map((_, i) => i === 2 ? null : el("path", stroke));
    const spark = el("path", {
        fill: "currentColor",
        d: "M17.24 5.185L16.544 3.373C16.457 3.148 16.241 3 16 3C15.759 3 15.543 3.148 15.456 3.373L14.76 5.185C14.658 5.449 14.449 5.658 14.185 5.76L12.373 6.456C12.148 6.543 12 6.759 12 7C12 7.241 12.148 7.457 12.373 7.544L14.185 8.24C14.449 8.342 14.658 8.551 14.76 8.815L15.456 10.627C15.543 10.852 15.759 11 16 11C16.241 11 16.457 10.852 16.544 10.627L17.24 8.815C17.342 8.551 17.551 8.342 17.815 8.24L19.627 7.544C19.852 7.457 20 7.241 20 7C20 6.759 19.852 6.543 19.627 6.456L17.815 5.76C17.551 5.658 17.342 5.449 17.24 5.185Z"
    });
    const S = (k, z) => spring(k, 2 * z * Math.sqrt(k));
    const P = {
        spark: S(150, 0.75),
        fold: S(140, 0.95),
        capW: S(200, 0.92),
        capH: S(115, 0.8),
        inner: S(155, 0.75),
        outer: S(155, 0.75)
    };
    const parts = Object.keys(P);
    const IN = { spark: 0, fold: 0.04, capW: 0.08, capH: 0.17, inner: 0.22, outer: 0.27 };
    const OUT = { outer: 0, inner: 0.035, capH: 0.07, capW: 0.11, fold: 0.145, spark: 0.18 };
    const OUT_K = 1.35;
    const baseK = Object.fromEntries(parts.map((key) => [key, P[key].k]));
    const heights = BAR_HALF.map((h) => ({ ...S(260, 0.7), x: h, to: h }));
    let clock = 0;
    let drawn = false;
    const still = (sp, to) => Math.abs(sp.x - to) < 1e-4 && Math.abs(sp.v) < 1e-4;
    const resting = (half) => {
        if (!drawn)
            return false;
        for (const key of parts)
            if (clock < P[key].at || !still(P[key], P[key].to))
                return false;
        for (let i = 0; i < heights.length; i++)
            if (!still(heights[i], half[i]))
                return false;
        return true;
    };
    const set = (on) => {
        for (const key of parts) {
            const k = baseK[key] * (on ? 1 : OUT_K);
            P[key].c *= Math.sqrt(k / P[key].k);
            P[key].k = k;
            P[key].to = on ? 1 : 0;
            P[key].at = clock + (reduced ? 0 : (on ? IN : OUT)[key]);
            if (reduced) {
                P[key].x = P[key].to;
                P[key].v = 0;
            }
        }
    };
    const step = (frame, half) => {
        const dt = Math.min(frame, 1 / 30);
        clock += dt;
        if (resting(half))
            return;
        drawn = true;
        if (!reduced)
            for (const key of parts)
                stepSpring(P[key], dt, clock);
        heights.forEach((h, i) => {
            h.to = half[i];
            h.at = 0;
            stepSpring(h, dt, clock);
        });
        const hh = heights.map((h) => Math.max(0, h.x));
        const sp = P.spark.x;
        if (sp >= 0.995)
            put(spark, "visibility", "hidden");
        else {
            put(spark, "visibility", "visible");
            put(spark, "transform", `translate(16 7) rotate(${r3(90 * sp)}) scale(${r3(Math.max(0, 1 - sp))}) translate(-16 -7)`);
        }
        const cw = P.capW.x;
        const ch = P.capH.x;
        const top = 2.75 + (12 - hh[2] - 2.75) * ch;
        const bottom = 15.75 + (12 + hh[2] - 15.75) * ch;
        put(cap, "d", pill(12, top, bottom, Math.max(0, 4.25 * (1 - cw))));
        const fp = Math.min(1, Math.max(0, P.fold.x));
        if (fp >= 0.995)
            put(fold, "visibility", "hidden");
        else {
            put(fold, "visibility", "visible");
            put(fold, "transform", `translate(12 ${r3(bottom)}) scale(${r3(1 - fp)}) translate(-12 -15.75)`);
        }
        bars.forEach((b, i) => {
            if (!b)
                return;
            const p = i === 0 || i === 4 ? P.outer.x : P.inner.x;
            if (p <= 5e-3)
                return put(b, "visibility", "hidden");
            put(b, "visibility", "visible");
            const x = 12 + (BAR_X[i] - 12) * Math.min(p, 1);
            const len = hh[i] * p;
            put(b, "d", `M${r3(x)} ${r3(12 - len)}V${r3(12 + len)}`);
        });
    };
    step(0, BAR_HALF);
    return { svg, set, step, settled: () => P.outer.to === 1 && P.outer.x > 0.98 };
}
const Recognition = () => window.SpeechRecognition ?? window.webkitSpeechRecognition;
const within = (p, ms, fallback) => Promise.race([p, new Promise((r) => setTimeout(() => r(fallback), ms))]);
async function onDevice(lang) {
    const SR = Recognition();
    if (!SR || typeof SR.available !== "function")
        return "unavailable";
    for (const quality of ["dictation", void 0]) {
        try {
            const r = await within(SR.available({ langs: [lang], processLocally: true, ...quality ? { quality } : {} }), 2500, "unavailable");
            if (r === "available")
                return "available";
            if (r === "downloadable" || r === "downloading")
                return "downloadable";
        }
        catch {
        }
    }
    return "unavailable";
}
function deviceSpeech(lang, hooks) {
    const SR = Recognition();
    let rec = null;
    let on = false;
    const make = () => {
        const r = new SR();
        if (!("processLocally" in r) && !("options" in r))
            throw new Error("no on-device recognition");
        r.lang = lang;
        r.continuous = true;
        r.interimResults = true;
        if ("processLocally" in r)
            r.processLocally = true;
        if ("options" in r)
            r.options = { langs: [lang], processLocally: true };
        let settled = "";
        let pause = 0;
        r.onresult = (e) => {
            let tail = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const piece = e.results[i][0].transcript.trim();
                if (e.results[i].isFinal)
                    settled = `${settled} ${piece}`.trim();
                else
                    tail = `${tail} ${piece}`.trim();
            }
            hooks.show(settled, tail);
            clearTimeout(pause);
            pause = window.setTimeout(() => {
                if (!settled)
                    return;
                hooks.end();
                settled = "";
            }, 1500);
        };
        r.onerror = (e) => {
            if (e.error === "no-speech" || e.error === "aborted")
                return;
            on = false;
            hooks.failed(e.error);
        };
        r.onend = () => {
            if (on) {
                try {
                    r.start();
                }
                catch {
                }
            }
        };
        return r;
    };
    return {
        start() {
            on = true;
            rec ??= make();
            rec.start();
        },
        stop() {
            on = false;
            rec?.stop();
        },
        destroy() {
            on = false;
            rec?.abort();
            rec = null;
        }
    };
}
const CAPTION_HOST = "";
const TRANSFORMERS = "@huggingface/transformers@4.2.0/dist/transformers.min.js";
const PHONEMIZER = "phonemizer@1.2.1/dist/phonemizer.js";
const TAP = `
class OrbTap extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.pos = 0; this.acc = 0; this.n = 0; this.out = new Float32Array(512); this.k = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i]; this.n++; this.pos += 1;
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio; this.out[this.k++] = this.acc / this.n; this.acc = 0; this.n = 0;
        if (this.k === 512) { this.port.postMessage(this.out, [this.out.buffer]); this.out = new Float32Array(512); this.k = 0; }
      }
    }
    return true;
  }
}
registerProcessor("orb-tap", OrbTap);
`;
function tidy(text) {
    let w = text.split(/\s+/).filter(Boolean);
    const key = (s) => s?.toLowerCase().replace(/[^a-z']/g, "");
    for (let n = 1; n <= 4; n++) {
        for (let i = 0; i + 3 * n <= w.length; i++) {
            const same = (a, b) => {
                for (let k = 0; k < n; k++)
                    if (key(w[a + k]) !== key(w[b + k]))
                        return false;
                return true;
            };
            let reps = 1;
            while (i + (reps + 1) * n <= w.length && same(i, i + reps * n))
                reps++;
            if (reps >= 3)
                w = [...w.slice(0, i + n), ...w.slice(i + reps * n)];
        }
    }
    return w.join(" ").replace(/\bi\b/g, "I").replace(/\bi'(m|ve|ll|d)\b/g, "I'$1");
}
function joinText(head, next) {
    if (!head)
        return next;
    if (!next)
        return head;
    const cont = !/[.?!]$/.test(head) && !/^I(\b|')/.test(next);
    return `${head} ${cont ? next.charAt(0).toLowerCase() + next.slice(1) : next}`;
}
function orbBrain(host, env) {
    const url = "/assets/projects/experiments/workers/orb-brain.js";
    const worker = env.worker(url, { type: "module" });
    URL.revokeObjectURL(url);
    const parts = {};
    const base = host || "https://cdn.jsdelivr.net";
    let ask = 0;
    return {
        worker,
        need(part) {
            return parts[part] ??= new Promise((resolve, reject) => {
                const on = (e) => {
                    const m = e.data;
                    if (m.type !== "ready" && m.type !== "error" || m.part !== part)
                        return;
                    worker.removeEventListener("message", on);
                    if (m.type === "ready")
                        resolve();
                    else {
                        delete parts[part];
                        reject(new Error(`${part} failed to load`));
                    }
                };
                worker.addEventListener("message", on);
                worker.postMessage({ type: "load", part, runtime: `${base}/npm/${TRANSFORMERS}`, phonemizer: `${base}/npm/${PHONEMIZER}`, host });
            });
        },
        // the six emotion scores for a piece of settled text
        classify(text) {
            const id = ++ask;
            return new Promise((resolve) => {
                const on = (e) => {
                    const m = e.data;
                    if (m.type !== "mood" || m.id !== id)
                        return;
                    worker.removeEventListener("message", on);
                    resolve(m.scores ?? []);
                };
                worker.addEventListener("message", on);
                worker.postMessage({ type: "mood", id, text });
            });
        },
        speak(id, text, voice, speed) {
            worker.postMessage({ type: "speak", id, text, voice, speed });
        },
        hush() {
            worker.postMessage({ type: "hush" });
        },
        destroy() {
            worker.terminate();
        }
    };
}
function moonshine(hooks, brain) {
    const { worker } = brain;
    let tap = null;
    let settled = "";
    worker.addEventListener("message", (e) => {
        const m = e.data;
        if (m.type === "progress" && m.part === "captions")
            hooks.progress(m.value ?? 0);
        else if (m.type === "preparing" && m.part === "captions")
            hooks.progress(-1);
        else if (m.type === "partial" && m.text)
            hooks.show(settled, joinText(settled, tidy(m.text)).slice(settled.length).trim());
        else if (m.type === "commit") {
            if (m.text)
                settled = joinText(settled, tidy(m.text));
            hooks.show(settled, "");
        }
        else if (m.type === "final") {
            const all = joinText(settled, tidy(m.text ?? ""));
            settled = "";
            if (all)
                hooks.show(all, "");
            hooks.end();
        }
        else if (m.type === "error" && m.part === "captions")
            hooks.failed(m.message ?? "error");
    });
    const load = () => brain.need("captions");
    return {
        load,
        async start(stream) {
            await load();
            if (tap)
                return;
            settled = "";
            const ctx = new AudioContext();
            const src = URL.createObjectURL(new Blob([TAP], { type: "text/javascript" }));
            await ctx.audioWorklet.addModule(src);
            URL.revokeObjectURL(src);
            const node = new AudioWorkletNode(ctx, "orb-tap");
            node.port.onmessage = (e) => worker.postMessage({ type: "audio", buffer: e.data }, [e.data.buffer]);
            const mute = ctx.createGain();
            mute.gain.value = 0;
            ctx.createMediaStreamSource(stream).connect(node).connect(mute).connect(ctx.destination);
            tap = { ctx, node };
        },
        stop() {
            if (!tap)
                return;
            tap.node.port.onmessage = null;
            void tap.ctx.close();
            tap = null;
            worker.postMessage({ type: "flush" });
        },
        destroy() {
            this.stop();
        }
    };
}
const MOODS = {
    joy: { rgb: [1, 0.68, 0.18], energy: 0.5 },
    // warm gold, livelier
    love: { rgb: [1, 0.32, 0.55], energy: 0.2 },
    // rose, gently lifted
    surprise: { rgb: [0.25, 0.85, 1], energy: 0.8 },
    // electric cyan, a swell
    sadness: { rgb: [0.1, 0.26, 1], energy: -0.6 },
    // deep blue, slower
    fear: { rgb: [0.78, 0.2, 0.95], energy: 0.35 },
    // magenta-violet, restless (kept clear of sadness's blue)
    anger: { rgb: [1, 0.1, 0.08], energy: 0.9 }
};
function moodOf(scores) {
    const top = scores.reduce((a, b2) => b2.score > a.score ? b2 : a, { label: "", score: 0 });
    if (top.score < 0.45)
        return null;
    let r = 0, g = 0, b = 0, en = 0, w = 0;
    for (const { label, score } of scores) {
        const m = MOODS[label];
        if (!m || score < 0.15)
            continue;
        const k = score * score;
        r += m.rgb[0] * k;
        g += m.rgb[1] * k;
        b += m.rgb[2] * k;
        en += m.energy * k;
        w += k;
    }
    if (!w)
        return null;
    const amt = Math.min(1, Math.max(0, (top.score - 0.45) / 0.45));
    return { rgb: [r / w, g / w, b / w], energy: en / w, amt: amt * amt * (3 - 2 * amt), label: top.label };
}
function voiceRack(ctx, input) {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 90;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 3;
    comp.attack.value = 4e-3;
    comp.release.value = 0.2;
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -3;
    limit.ratio.value = 20;
    limit.attack.value = 1e-3;
    limit.release.value = 0.1;
    const master = ctx.createGain();
    master.gain.value = 0;
    input.connect(hp).connect(comp);
    limit.connect(master).connect(ctx.destination);
    const space = (seconds, decay) => {
        const n = Math.floor(ctx.sampleRate * seconds);
        const ir = ctx.createBuffer(2, n, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const d = ir.getChannelData(c);
            for (let i = 0; i < n; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
        }
        const conv = ctx.createConvolver();
        conv.buffer = ir;
        return conv;
    };
    const gain = (v) => {
        const g = ctx.createGain();
        g.gain.value = v;
        return g;
    };
    let parts = [];
    let osc = null;
    const build = (effect) => {
        for (const n of parts)
            n.disconnect();
        osc?.stop();
        osc = null;
        comp.disconnect();
        const keep = (...n) => (parts.push(...n), n[0]);
        parts = [];
        const wet = (node, level) => {
            const g = keep(gain(level));
            node.connect(g).connect(limit);
        };
        const dry = (level) => wet(comp, level);
        if (effect === "hall") {
            dry(0.8);
            const r = keep(space(2.8, 2.2));
            comp.connect(r);
            wet(r, 0.5);
        }
        else if (effect === "delay") {
            dry(1);
            const d = keep(ctx.createDelay(1));
            d.delayTime.value = 0.23;
            const fb = keep(gain(0.34));
            comp.connect(d);
            d.connect(fb).connect(d);
            wet(d, 0.45);
        }
        else if (effect === "radio") {
            const lo = keep(ctx.createBiquadFilter());
            lo.type = "highpass";
            lo.frequency.value = 500;
            const hi = keep(ctx.createBiquadFilter());
            hi.type = "lowpass";
            hi.frequency.value = 3200;
            const drive = keep(ctx.createWaveShaper());
            const curve = new Float32Array(1024);
            for (let i = 0; i < 1024; i++) {
                const x = i / 1023 * 2 - 1;
                curve[i] = Math.tanh(2.6 * x);
            }
            drive.curve = curve;
            comp.connect(lo).connect(hi).connect(drive);
            wet(drive, 0.8);
        }
        else if (effect === "robot") {
            const ring = keep(gain(0));
            osc = ctx.createOscillator();
            osc.frequency.value = 55;
            osc.connect(ring.gain);
            osc.start();
            const comb = keep(ctx.createDelay(0.05));
            comb.delayTime.value = 9e-3;
            const cfb = keep(gain(0.55));
            comp.connect(ring);
            ring.connect(comb);
            comb.connect(cfb).connect(comb);
            wet(ring, 1.2);
            wet(comb, 0.6);
        }
        else {
            dry(1);
            const r = keep(space(0.7, 3));
            comp.connect(r);
            wet(r, 0.18);
        }
    };
    build("room");
    let on = false;
    let howl = 0;
    let howlAt = -9;
    return {
        setOn(v) {
            on = v;
            master.gain.setTargetAtTime(v ? 0.95 : 0, ctx.currentTime, 0.03);
        },
        setEffect: build,
        guard(freq, dt) {
            if (!on)
                return false;
            let peak = 0;
            let at = 0;
            for (let i = 2; i < freq.length; i++)
                if (freq[i] > peak) {
                    peak = freq[i];
                    at = i;
                }
            let second = 0;
            for (let i = 2; i < freq.length; i++)
                if (Math.abs(i - at) > 2 && freq[i] > second)
                    second = freq[i];
            const pure = peak > 190 && peak - second > 70;
            const parked = Math.abs(at - howlAt) <= 1;
            howlAt = at;
            howl = pure && parked ? howl + dt : 0;
            if (howl < 0.6)
                return false;
            howl = 0;
            this.setOn(false);
            return true;
        },
        destroy() {
            osc?.stop();
            master.disconnect();
        }
    };
}
function captionLine(parent, reduced) {
    const box = document.createElement("div");
    box.className = "orb__cap";
    box.setAttribute("aria-hidden", "true");
    const line = document.createElement("p");
    line.className = "orb__line";
    const note = document.createElement("button");
    note.type = "button";
    note.className = "orb__offer";
    note.hidden = true;
    box.append(line, note);
    parent.appendChild(box);
    const offers = [];
    let busy = false;
    const next = () => {
        if (busy)
            return true;
        const o = offers.shift();
        if (!o)
            return false;
        note.textContent = o.text;
        note.hidden = false;
        note.disabled = false;
        note.onclick = () => {
            note.onclick = null;
            note.hidden = true;
            o.act();
            if (note.hidden)
                next();
        };
        return true;
    };
    let words = [];
    let ended = false;
    const MAX = 16;
    const RISE = "cubic-bezier(0.16, 1, 0.3, 1)";
    const OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
    const enter = (w, i) => {
        if (reduced)
            return;
        w.inner.animate([{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
            duration: 380,
            delay: i * 28,
            easing: RISE,
            fill: "backwards"
        });
    };
    const leave = (w, at) => {
        w.outer.classList.add("is-leaving");
        if (reduced)
            return w.outer.remove();
        const box2 = referenceRect(line);
        const r = at ?? referenceRect(w.outer);
        Object.assign(w.outer.style, { position: "absolute", left: `${r.left - box2.left}px`, top: `${r.top - box2.top}px` });
        w.inner.animate([{ transform: "translateY(0)" }, { transform: "translateY(-110%)" }], { duration: 220, easing: OUT, fill: "forwards" }).finished.then(() => w.outer.remove(), () => w.outer.remove());
    };
    const clear = () => {
        const at = words.map((w) => referenceRect(w.outer));
        words.forEach((w, i) => leave(w, at[i]));
        words = [];
    };
    return {
        box,
        show(fin, tail) {
            const before = new Map(words.map((w) => [w, referenceRect(w.outer)]));
            if (ended) {
                words.forEach((w) => leave(w, before.get(w)));
                words = [];
                ended = false;
            }
            note.hidden = true;
            const tokens = [
                ...fin.split(/\s+/).filter(Boolean).map((t) => ({ t, live: false })),
                ...tail.split(/\s+/).filter(Boolean).map((t) => ({ t, live: true }))
            ];
            const drop = Math.max(0, tokens.length - MAX);
            const keep = tokens.slice(drop);
            const gone = Math.min(drop, words.length);
            for (let i = 0; i < gone; i++)
                leave(words[i], before.get(words[i]));
            words = words.slice(gone);
            let fresh = 0;
            keep.forEach((tok, i) => {
                let w = words[i];
                if (!w) {
                    const outer = document.createElement("span");
                    outer.className = "orb__w";
                    const inner = document.createElement("span");
                    outer.appendChild(inner);
                    line.appendChild(outer);
                    w = { outer, inner, text: "" };
                    words[i] = w;
                    enter(w, fresh++);
                }
                else if (w.text !== tok.t && !reduced) {
                    w.inner.animate([{ filter: "blur(3px)" }, { filter: "blur(0)" }], { duration: 140, easing: "ease-out" });
                }
                if (w.text !== tok.t) {
                    w.text = tok.t;
                    w.inner.textContent = tok.t;
                }
                w.outer.classList.toggle("is-live", tok.live);
            });
            words.slice(keep.length).forEach((w) => leave(w, before.get(w)));
            words = words.slice(0, keep.length);
            if (!reduced) {
                for (const w of words) {
                    const b = before.get(w);
                    if (!b)
                        continue;
                    const a = referenceRect(w.outer);
                    const dx = b.left - a.left;
                    const dy = b.top - a.top;
                    if (Math.abs(dx) + Math.abs(dy) < 0.5)
                        continue;
                    w.outer.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: 280, easing: OUT });
                }
            }
        },
        end() {
            ended = true;
            words.forEach((w) => w.outer.classList.remove("is-live"));
        },
        clear,
        offer(text, act) {
            offers.push({ text, act });
            if (note.hidden)
                next();
        },
        say(text) {
            busy = true;
            note.textContent = text;
            note.hidden = false;
            note.disabled = true;
            note.onclick = null;
        },
        quiet() {
            busy = false;
            if (!next())
                note.hidden = true;
        }
    };
}
export const experiment = {
    mount(root, env, opts = {}) {
        const reduced = env.reduced;
        const P = { ...DEFAULTS };
        const wrap = document.createElement("div");
        wrap.className = "orb";
        const canvas = document.createElement("canvas");
        wrap.appendChild(canvas);
        const mic = document.createElement("button");
        mic.type = "button";
        mic.className = "orb__mic";
        mic.setAttribute("aria-pressed", "false");
        mic.setAttribute("aria-label", "Talk to the orb");
        const glyph = micGlyph(reduced);
        mic.appendChild(glyph.svg);
        const status = document.createElement("p");
        status.className = "orb__status";
        status.setAttribute("aria-live", "polite");
        const spk = document.createElement("button");
        spk.type = "button";
        spk.className = "orb__mic orb__spk";
        spk.setAttribute("aria-pressed", "false");
        spk.setAttribute("aria-label", "Speak back");
        spk.innerHTML = svgSpeakerOff;
        const ctl = document.createElement("div");
        ctl.className = "orb__ctl";
        const unit = document.createElement("div");
        unit.className = "orb__unit";
        unit.appendChild(spk);
        ctl.append(mic, unit);
        wrap.append(ctl, status);
        const caps = captionLine(wrap, reduced);
        root.appendChild(wrap);
        const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
        if (!gl) {
            const note = document.createElement("p");
            note.className = "orb__note";
            note.textContent = "This one needs WebGL2.";
            wrap.appendChild(note);
            return () => wrap.remove();
        }
        const hdr = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
        gl.getExtension("OES_texture_half_float_linear");
        const scene = program(gl, SCENE(!hdr));
        const down = hdr ? program(gl, DOWN) : null;
        const up = hdr ? program(gl, UP) : null;
        const comp = hdr ? program(gl, COMPOSITE) : null;
        gl.bindVertexArray(gl.createVertexArray());
        const makeTarget = (w, h) => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            return { fbo, tex, w, h };
        };
        let sceneT = null;
        let chain = [];
        const freeTargets = () => {
            for (const t of [sceneT, ...chain]) {
                if (!t)
                    continue;
                gl.deleteFramebuffer(t.fbo);
                gl.deleteTexture(t.tex);
            }
            sceneT = null;
            chain = [];
        };
        let dprCap = 2;
        let scale = 1;
        const buildTargets = () => {
            freeTargets();
            const w = Math.max(1, Math.round(canvas.width * scale));
            const h = Math.max(1, Math.round(canvas.height * scale));
            sceneT = makeTarget(w, h);
            let lw = w;
            let lh = h;
            for (let i = 0; i < LEVELS; i++) {
                lw = Math.max(1, lw >> 1);
                lh = Math.max(1, lh >> 1);
                chain.push(makeTarget(lw, lh));
            }
        };
        const resize = () => {
            placeMic();
            const css = Math.max(1, wrap.clientWidth * wrap.clientHeight);
            const dpr = Math.min(env.pixelRatio || 1, dprCap, Math.sqrt(26e5 / css));
            const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
            const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
            if (canvas.width === w && canvas.height === h && (sceneT || !hdr))
                return;
            canvas.width = w;
            canvas.height = h;
            if (hdr)
                buildTargets();
        };
        const MIC = 52;
        const GAP = 32;
        const FOOT = 72;
        const CAPTIONS = 16 + 50;
        let placed = null;
        function layout(W, H) {
            const short = Math.min(W, H);
            let r = 0.5 * Math.min(P.size, 0.92 * W / (3.3 * short)) * short;
            const below = CAPTIONS + (placed?.capOffset ?? (W < 760 ? 36 : 0)) + 16;
            const field = H - FOOT;
            if (3.28 * r + GAP + MIC + 2 * below > field)
                r = Math.max(24, (field - 2 * below - GAP - MIC) / 3.28);
            const spare = field - (3.28 * r + GAP + MIC);
            const cy = (spare >= 2 * below ? spare / 2 : Math.max(16, spare - below)) + 1.76 * r;
            return { r, cy, size: 2 * r / short };
        }
        function placeMic() {
            const { r, cy } = layout(wrap.clientWidth, wrap.clientHeight);
            const rowTop = cy + 1.52 * r + GAP;
            setDesignStyle(ctl, "top", `${rowTop}px`);
            const extra = placed?.capOffset ?? 0;
            if (placed?.id === "a")
                setDesignStyle(placed.root, "top", `${rowTop + MIC + 16}px`);
            if (placed?.id === "c")
                placed.place?.(cy);
            setDesignStyle(caps.box, "top", `${rowTop + MIC + 16 + extra}px`);
        }
        const ro = env.resizeObserver(resize);
        ro.observe(wrap);
        resize();
        const pass = (prog, target2, src) => {
            gl.useProgram(prog.p);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target2 ? target2.fbo : null);
            gl.viewport(0, 0, target2 ? target2.w : canvas.width, target2 ? target2.h : canvas.height);
            if (src) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, src.tex);
                gl.uniform1i(prog.u("uSrc"), 0);
                gl.uniform2f(prog.u("uTexel"), 1 / src.w, 1 / src.h);
            }
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
        const draw = (time2, L) => {
            gl.useProgram(scene.p);
            const sw = sceneT ? sceneT.w : canvas.width;
            const shh = sceneT ? sceneT.h : canvas.height;
            gl.uniform2f(scene.u("uRes"), sw, shh);
            gl.uniform1f(scene.u("uTime"), time2);
            const H = wrap.clientHeight || 1;
            gl.uniform1f(scene.u("uSize"), L.size);
            gl.uniform1f(scene.u("uShift"), (H / 2 - L.cy) * (shh / H));
            gl.uniform1f(scene.u("uEnergy"), P.energy);
            gl.uniform1f(scene.u("uSpread"), P.spread);
            gl.uniform1f(scene.u("uFlare"), P.flare);
            gl.uniform1f(scene.u("uView"), P.view);
            gl.uniform1i(scene.u("uHeart"), Math.max(0, HEARTS.indexOf(P.heart)));
            gl.uniform1f(scene.u("uGlass"), glassAmt.x);
            gl.uniform1f(scene.u("uLive"), live);
            gl.uniform1f(scene.u("uDorm"), dorm);
            gl.uniform1f(scene.u("uVoice"), voice);
            gl.uniform3f(scene.u("uBands"), bands[0], bands[1], bands[2]);
            gl.uniform3f(scene.u("uMood"), mood.rgb[0], mood.rgb[1], mood.rgb[2]);
            gl.uniform1f(scene.u("uMoodAmt"), mood.amt);
            gl.uniform1f(scene.u("uMoodEnergy"), mood.energy);
            gl.uniform2f(scene.u("uTilt"), tilt[0].x, tilt[1].x);
            gl.uniform3f(scene.u("uBg"), ...BG);
            if (!hdr || !sceneT || !down || !up || !comp) {
                pass(scene, null, null);
                return;
            }
            pass(scene, sceneT, null);
            let src = sceneT;
            for (const t of chain) {
                gl.useProgram(down.p);
                gl.uniform1f(down.u("uKnee"), t === chain[0] ? 1.7 : 0);
                pass(down, t, src);
                src = t;
            }
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE);
            for (let i = chain.length - 2; i >= 0; i--)
                pass(up, chain[i], chain[i + 1]);
            gl.disable(gl.BLEND);
            gl.useProgram(comp.p);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, sceneT.tex);
            gl.uniform1i(comp.u("uScene"), 0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, chain[0].tex);
            gl.uniform1i(comp.u("uBloom"), 1);
            gl.uniform1f(comp.u("uBloomAmt"), P.bloom * (1 - 0.55 * dorm));
            gl.uniform1f(comp.u("uCA"), P.spread);
            gl.uniform3f(comp.u("uBg"), ...BG);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
        let ear = null;
        let listening = false;
        let listenVersion = 0;
        let live = 0;
        let dorm = 0;
        const liveSp = spring(40, 2 * 0.55 * Math.sqrt(40));
        let held = 0;
        let breath = 0;
        let voice = 0;
        const bands = [0, 0, 0];
        const peaks = [0.05, 0.05, 0.05, 0.05];
        const setStatus = (state, text) => {
            mic.dataset.state = state;
            mic.setAttribute("aria-pressed", state === "listening" ? "true" : "false");
            mic.setAttribute("aria-label", state === "listening" ? "Stop listening" : state === "blocked" ? "Microphone blocked" : "Talk to the orb");
            if (state === "blocked") {
                mic.innerHTML = svgMicOff;
                mic.firstElementChild?.animate([{ scale: "0.25" }, { scale: "1" }], { duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" });
            }
            else if (!mic.contains(glyph.svg))
                mic.replaceChildren(glyph.svg);
            status.textContent = text;
        };
        const lang = navigator.language || "en-US";
        const PREF = "orb:captions";
        const wanted = () => {
            try {
                return localStorage.getItem(PREF) === "on";
            }
            catch {
                return false;
            }
        };
        const want = () => {
            try {
                localStorage.setItem(PREF, "on");
            }
            catch {
            }
        };
        let engine = null;
        let choosing = false;
        let spoken = "";
        let brain = null;
        const getBrain = () => brain ??= orbBrain(opts.captionHost ?? CAPTION_HOST, env);
        const mood = { rgb: [1, 1, 1], amt: 0, energy: 0 };
        const moodTo = { rgb: [1, 1, 1], amt: 0, energy: 0 };
        let moodAt = 0;
        let moodOn = false;
        let feltWords = 0;
        let moodLabel = "";
        const MOOD_PREF = "orb:mood";
        const feel = async (text) => {
            if (!moodOn || !brain || !text.trim())
                return;
            const m = moodOf(await brain.classify(text));
            moodAt = env.now();
            moodLabel = m?.label ?? "";
            if (!m)
                return void (moodTo.amt = 0);
            moodTo.rgb = m.rgb;
            moodTo.energy = m.energy;
            moodTo.amt = m.amt;
        };
        const easeMood = (dt) => {
            if (moodTo.amt > 0 && env.now() - moodAt > 1e4)
                moodTo.amt = 0;
            const k = 1 - Math.exp(-dt * 2.5);
            for (let i = 0; i < 3; i++)
                mood.rgb[i] += (moodTo.rgb[i] - mood.rgb[i]) * k;
            mood.amt += (moodTo.amt - mood.amt) * k;
            mood.energy += (moodTo.energy - mood.energy) * k;
        };
        const startMood = async () => {
            try {
                await getBrain().need("mood");
                moodOn = true;
            }
            catch {
            }
        };
        const offerMood = () => {
            if (moodOn)
                return;
            let on = false;
            try {
                on = localStorage.getItem(MOOD_PREF) === "on";
            }
            catch {
            }
            if (on)
                return void startMood();
            caps.offer("Mood :: let the orb feel what you say, ~27 MB once", () => {
                try {
                    localStorage.setItem(MOOD_PREF, "on");
                }
                catch {
                }
                caps.quiet();
                void startMood();
            });
        };
        const hooks = {
            show: (fin, tail) => {
                if (!listening)
                    return;
                caps.show(fin, tail);
                if (fin)
                    spoken = fin;
                const n = fin ? fin.split(/\s+/).length : 0;
                if (n - feltWords >= 8) {
                    feltWords = n;
                    void feel(fin.split(/\s+/).slice(-24).join(" "));
                }
            },
            end: () => {
                caps.end();
                if (spoken) {
                    status.textContent = spoken;
                    const said = spoken;
                    void feel(said).then(() => speakBack(said));
                }
                feltWords = 0;
            },
            progress: (v) => caps.say(v < 0 ? "Preparing captions" : `Loading captions :: ${Math.round(v * 100)}%`),
            failed: () => {
                engine?.destroy();
                engine = null;
                caps.say("Captions couldn't start here");
                env.setTimeout(() => caps.quiet(), 2600);
            }
        };
        const fallback = () => {
            if (typeof Worker === "undefined" || typeof AudioWorkletNode === "undefined")
                return caps.quiet();
            const go = async () => {
                want();
                caps.say("Loading captions");
                try {
                    const m = moonshine(hooks, getBrain());
                    await m.load();
                    engine = m;
                    caps.quiet();
                    void startMood();
                    if (listening && ear)
                        await m.start(ear.stream);
                }
                catch {
                    caps.say("Captions couldn't load");
                    env.setTimeout(() => caps.quiet(), 2600);
                }
            };
            if (wanted())
                void go();
            else
                caps.offer("Captions :: runs on this device, a one-time 150 MB download", () => void go());
        };
        const startDeviceRecognition = () => {
            const e = deviceSpeech(lang, { ...hooks, failed: () => (engine?.destroy(), engine = null, fallback()) });
            try {
                e.start(ear.stream);
                engine = e;
                if (typeof Worker !== "undefined")
                    offerMood();
            }
            catch {
                fallback();
            }
        };
        const beginCaptions = async () => {
            if (engine && ear)
                return void await engine.start(ear.stream);
            if (choosing)
                return;
            choosing = true;
            try {
                const local = await onDevice(lang);
                if (!listening)
                    return;
                if (local === "available")
                    startDeviceRecognition();
                else if (local === "downloadable") {
                    const go = async () => {
                        want();
                        caps.say("Downloading captions");
                        const ok = await Recognition().install({ langs: [lang], processLocally: true, quality: "dictation" }).catch(() => false);
                        caps.quiet();
                        if (ok && listening)
                            startDeviceRecognition();
                        else if (!ok)
                            fallback();
                    };
                    if (wanted())
                        void go();
                    else
                        caps.offer("Captions :: a one-time download, it stays on this device", () => void go());
                }
                else
                    fallback();
            }
            finally {
                choosing = false;
            }
        };
        const endCaptions = () => {
            engine?.stop();
            caps.quiet();
            caps.clear();
        };
        const VOICE_PREF = "orb:voice";
        const MOOD_VOICE = {
            joy: { speed: 1.06, pitch: 1.08 },
            love: { speed: 0.97, pitch: 1.02 },
            surprise: { speed: 1.08, pitch: 1.12 },
            sadness: { speed: 0.9, pitch: 0.92 },
            fear: { speed: 1.05, pitch: 1.04 },
            anger: { speed: 1.04, pitch: 0.96 }
        };
        let speakerOn = false;
        let kokoro = false;
        let speaking = false;
        let viaKokoro = false;
        let workerDone = false;
        let speakSerial = 0;
        let kick = 0;
        let mouth = null;
        const getMouth = () => {
            if (mouth)
                return mouth;
            const ctx = new AudioContext();
            const an = ctx.createAnalyser();
            an.fftSize = 1024;
            an.smoothingTimeConstant = 0.55;
            an.connect(ctx.destination);
            return mouth = { ctx, an, time: new Uint8Array(1024), freq: new Uint8Array(512), next: 0, live: new Set() };
        };
        const bestVoice = () => {
            const all = typeof speechSynthesis === "undefined" ? [] : speechSynthesis.getVoices();
            const mine = all.filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
            return mine.find((v) => v.localService && /premium|enhanced|natural|neural/i.test(v.name)) ?? mine.find((v) => /samantha|daniel|karen|moira|serena|google/i.test(v.name)) ?? mine.find((v) => v.localService) ?? mine[0] ?? null;
        };
        const finishSpeaking = () => {
            if (!speaking)
                return;
            speaking = false;
            viaKokoro = false;
            status.textContent = listening ? "Listening" : "";
            env.setTimeout(() => {
                if (listening && ear && !speaking)
                    void engine?.start(ear.stream);
            }, 250);
        };
        const maybeDone = () => {
            if (speaking && viaKokoro && workerDone && mouth && mouth.live.size === 0)
                finishSpeaking();
        };
        const playPcm = (pcm, rate) => {
            const m = getMouth();
            const buf = m.ctx.createBuffer(1, pcm.length, rate);
            buf.copyToChannel(pcm, 0);
            const src = m.ctx.createBufferSource();
            src.buffer = buf;
            src.connect(m.an);
            const at = Math.max(m.ctx.currentTime + 0.03, m.next);
            src.start(at);
            m.next = at + buf.duration;
            m.live.add(src);
            src.onended = () => {
                m.live.delete(src);
                maybeDone();
            };
        };
        const systemSpeak = (text, v) => {
            if (typeof speechSynthesis === "undefined")
                return finishSpeaking();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = lang;
            u.rate = v.speed;
            u.pitch = v.pitch;
            const best = bestVoice();
            if (best)
                u.voice = best;
            u.onboundary = () => kick = 1;
            u.onend = u.onerror = () => finishSpeaking();
            speechSynthesis.cancel();
            speechSynthesis.speak(u);
        };
        const speakBack = (text) => {
            if (!speakerOn || P.speaker !== "readback" || !listening || !text.trim())
                return;
            hushNow();
            const id = ++speakSerial;
            speaking = true;
            workerDone = false;
            engine?.stop();
            status.textContent = "Speaking";
            const v = MOOD_VOICE[moodLabel] ?? { speed: 1, pitch: 1 };
            if (kokoro && brain) {
                viaKokoro = true;
                getMouth().next = 0;
                brain.speak(id, text, P.voice, v.speed);
            }
            else
                systemSpeak(text, v);
        };
        const hushNow = () => {
            speakSerial++;
            brain?.hush();
            if (mouth) {
                for (const s of mouth.live) {
                    s.onended = null;
                    try {
                        s.stop();
                    }
                    catch {
                    }
                }
                mouth.live.clear();
                mouth.next = 0;
            }
            if (typeof speechSynthesis !== "undefined")
                speechSynthesis.cancel();
        };
        const onSpeech = (e) => {
            const m = e.data;
            if (m.type === "speech" && m.id === speakSerial && m.pcm)
                playPcm(m.pcm, m.rate ?? 24e3);
            else if (m.type === "spoken" && m.id === speakSerial) {
                workerDone = true;
                if (m.error)
                    finishSpeaking();
                else
                    maybeDone();
            }
            else if (m.type === "progress" && m.part === "voice")
                caps.say(`Loading voices :: ${Math.round((m.value ?? 0) * 100)}%`);
        };
        let voiceWired = false;
        const loadKokoro = async () => {
            const b = getBrain();
            if (!voiceWired) {
                b.worker.addEventListener("message", onSpeech);
                voiceWired = true;
            }
            caps.say("Loading voices");
            try {
                await b.need("voice");
                kokoro = true;
                caps.quiet();
            }
            catch {
                caps.say("Voices couldn't load: the system voice speaks instead");
                env.setTimeout(() => caps.quiet(), 2600);
            }
        };
        let voiceSize = "~92 MB";
        void navigator.gpu?.requestAdapter().then((a) => a && (voiceSize = "~330 MB")).catch(() => {
        });
        const prepareVoice = () => {
            if (kokoro || typeof Worker === "undefined")
                return;
            let on = false;
            try {
                on = localStorage.getItem(VOICE_PREF) === "on";
            }
            catch {
            }
            if (on)
                return void loadKokoro();
            caps.offer(`Natural voices :: on this device, ${voiceSize} once`, () => {
                try {
                    localStorage.setItem(VOICE_PREF, "on");
                }
                catch {
                }
                void loadKokoro();
            });
        };
        let heardTip = false;
        const applySpeaker = () => {
            const liveOn = speakerOn && P.speaker === "live";
            ear?.rack.setOn(liveOn);
            if (liveOn && ear && !heardTip) {
                heardTip = true;
                caps.say("Live :: headphones keep it from feeding back");
                env.setTimeout(() => caps.quiet(), 3200);
            }
            if (!(speakerOn && P.speaker === "readback")) {
                hushNow();
                finishSpeaking();
            }
        };
        const setSpeaker = (on) => {
            speakerOn = on;
            const live2 = P.speaker === "live";
            spk.setAttribute("aria-pressed", String(on));
            spk.setAttribute("aria-label", live2 ? on ? "Stop hearing yourself" : "Hear yourself" : on ? "Stop reading back" : "Read back what you say");
            spk.innerHTML = on ? svgSpeakerOn : svgSpeakerOff;
            if (!reduced)
                spk.firstElementChild?.animate([{ scale: "0.25" }, { scale: "1" }], { duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" });
            if (on && !live2) {
                void getMouth().ctx.resume();
                if (typeof speechSynthesis !== "undefined")
                    speechSynthesis.getVoices();
                prepareVoice();
            }
            if (on)
                void ear?.ctx.resume();
            applySpeaker();
            showChip(on);
        };
        const toggleSpeaker = () => setSpeaker(!speakerOn);
        spk.addEventListener("click", toggleSpeaker);
        const SETTINGS = "orb:speaker-settings";
        try {
            const saved = JSON.parse(localStorage.getItem(SETTINGS) || "{}");
            if (SPEAKER_MODES.some((m) => m.id === saved.speaker))
                P.speaker = saved.speaker;
            if (EFFECTS.some((e) => e.id === saved.effect))
                P.effect = saved.effect;
            if (VOICES.some((v) => v.id === saved.voice))
                P.voice = saved.voice;
        }
        catch {
        }
        const optionsNow = () => P.speaker === "live" ? EFFECTS : VOICES;
        const chosen = () => P.speaker === "live" ? P.effect : P.voice;
        const modeLabel = () => SPEAKER_MODES.find((m) => m.id === P.speaker)?.label ?? "";
        const save = () => {
            try {
                localStorage.setItem(SETTINGS, JSON.stringify({ speaker: P.speaker, effect: P.effect, voice: P.voice }));
            }
            catch {
            }
        };
        const RISE = "cubic-bezier(0.16, 1, 0.3, 1)";
        const OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
        const skinId = wrap.clientWidth < 760 ? "a" : "c";
        wrap.classList.add(`orb--${skinId}`);
        const optButton = (o, cls) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = cls;
            b.dataset.id = o.id;
            b.setAttribute("role", "radio");
            const mask = document.createElement("span");
            mask.className = "orb__m";
            const inner = document.createElement("span");
            inner.textContent = o.label;
            mask.appendChild(inner);
            b.appendChild(mask);
            return b;
        };
        const radios = (group, pick) => {
            group.setAttribute("role", "radiogroup");
            group.addEventListener("keydown", (e) => {
                const items = [...group.querySelectorAll("[role=radio]")];
                const i = items.indexOf(document.activeElement);
                const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
                if (!step || i < 0)
                    return;
                e.preventDefault();
                e.stopPropagation();
                const next = items[(i + step + items.length) % items.length];
                next.focus();
                pick(next.dataset.id);
            });
            group.addEventListener("click", (e) => {
                const b = e.target.closest("[role=radio]");
                if (b && group.contains(b))
                    pick(b.dataset.id);
            });
        };
        const mark = (group, id) => {
            for (const b of group.querySelectorAll("[role=radio]")) {
                const on = b.dataset.id === id;
                b.setAttribute("aria-checked", String(on));
                b.tabIndex = on ? 0 : -1;
            }
        };
        const settle = (el) => el.getAnimations().forEach((a) => a.cancel());
        const riseIn = (items, delay = 0) => {
            items.forEach((el, i) => {
                settle(el);
                if (reduced)
                    return;
                el.animate([{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
                    duration: 380,
                    delay: delay + i * 30,
                    easing: RISE,
                    fill: "backwards"
                });
            });
        };
        const dropOut = (items) => {
            items.forEach(settle);
            if (reduced)
                return Promise.resolve();
            return Promise.all(items.map((el) => el.animate([{ transform: "translateY(0)" }, { transform: "translateY(110%)" }], { duration: 180, easing: OUT, fill: "forwards" }).finished.catch(() => {
            })));
        };
        const drawIn = (el, delay) => {
            settle(el);
            if (reduced)
                return;
            const at = el.style.transform;
            el.animate([{ transform: `${at} scaleX(0)` }, { transform: `${at} scaleX(1)` }], { duration: 320, delay, easing: RISE, fill: "backwards" });
        };
        const drawOut = (el) => {
            settle(el);
            if (reduced)
                return;
            const at = el.style.transform;
            el.animate([{ transform: `${at} scaleX(1)` }, { transform: `${at} scaleX(0)` }], { duration: 140, easing: OUT, fill: "forwards" });
        };
        let skin;
        if (skinId === "a") {
            const line = document.createElement("div");
            line.className = "orb__line2";
            line.hidden = true;
            const mode = document.createElement("button");
            mode.type = "button";
            mode.className = "orb__mode";
            const modeMask = document.createElement("span");
            modeMask.className = "orb__m";
            const modeIn = document.createElement("span");
            modeMask.appendChild(modeIn);
            mode.appendChild(modeMask);
            const group = document.createElement("div");
            group.className = "orb__words";
            const rule = document.createElement("span");
            rule.className = "orb__rule";
            line.append(mode, group, rule);
            wrap.appendChild(line);
            radios(group, (id) => pickSetting(P.speaker === "live" ? "effect" : "voice", id));
            mode.addEventListener("click", () => pickSetting("speaker", P.speaker === "live" ? "readback" : "live"));
            const placeRule = (instant) => {
                const b = group.querySelector(`[data-id="${chosen()}"]`);
                if (!b)
                    return;
                if (instant)
                    setDesignStyle(rule, "transition", "none");
                setDesignStyle(rule, "width", `${b.offsetWidth}px`);
                setDesignStyle(rule, "transform", `translateX(${b.offsetLeft}px)`);
                if (instant) {
                    void rule.offsetWidth;
                    setDesignStyle(rule, "transition", "");
                }
            };
            const fill = () => {
                modeIn.textContent = `${modeLabel()} ::`;
                mode.setAttribute("aria-label", `Speaker: ${modeLabel()}. Switch to ${P.speaker === "live" ? "Read back" : "Live"}`);
                group.setAttribute("aria-label", P.speaker === "live" ? "Effect" : "Voice");
                group.replaceChildren(...optionsNow().map((o) => optButton(o, "orb__word")));
                mark(group, chosen());
            };
            fill();
            skin = {
                root: line,
                capOffset: 36,
                show(on) {
                    if (on) {
                        line.hidden = false;
                        placeRule(true);
                        const words = [modeIn, ...group.querySelectorAll(".orb__m > span")];
                        riseIn(words);
                        drawIn(rule, 120 + words.length * 30);
                    }
                    else {
                        drawOut(rule);
                        void dropOut([modeIn, ...group.querySelectorAll(".orb__m > span")]).then(() => {
                            if (!speakerOn)
                                line.hidden = true;
                        });
                    }
                },
                render(modeChanged) {
                    if (!modeChanged) {
                        mark(group, chosen());
                        placeRule(false);
                        return;
                    }
                    drawOut(rule);
                    void dropOut([modeIn, ...group.querySelectorAll(".orb__m > span")]).then(() => {
                        if (!speakerOn)
                            return;
                        fill();
                        placeRule(true);
                        const words = [modeIn, ...group.querySelectorAll(".orb__m > span")];
                        riseIn(words);
                        drawIn(rule, 120 + words.length * 30);
                    });
                }
            };
        }
        else {
            const desk = document.createElement("div");
            desk.className = "orb__desk";
            desk.hidden = true;
            const section = (title) => {
                const g = document.createElement("div");
                g.className = "orb__sect";
                const h = document.createElement("p");
                h.className = "orb__head";
                const hm = document.createElement("span");
                hm.className = "orb__m";
                const hi = document.createElement("span");
                hi.textContent = title;
                hm.appendChild(hi);
                h.appendChild(hm);
                const list = document.createElement("div");
                list.className = "orb__list";
                list.setAttribute("aria-label", title);
                const tick = document.createElement("span");
                tick.className = "orb__tick";
                list.appendChild(tick);
                g.append(h, list);
                desk.appendChild(g);
                return { g, h: hi, list, tick };
            };
            const modeSec = section("Speaker");
            const optSec = section("Effect");
            wrap.appendChild(desk);
            radios(modeSec.list, (id) => pickSetting("speaker", id));
            radios(optSec.list, (id) => pickSetting(P.speaker === "live" ? "effect" : "voice", id));
            const placeTick = (sec, id, instant) => {
                const b = sec.list.querySelector(`[data-id="${id}"]`);
                if (!b)
                    return;
                if (instant)
                    setDesignStyle(sec.tick, "transition", "none");
                const x = b.offsetLeft - 24;
                const y = b.offsetTop + b.offsetHeight / 2;
                setDesignStyle(sec.tick, "transform", `translate(${x}px, ${y}px)`);
                if (instant) {
                    void sec.tick.offsetWidth;
                    setDesignStyle(sec.tick, "transition", "");
                }
            };
            const fill = () => {
                for (const b of [...modeSec.list.querySelectorAll("[role=radio]")])
                    b.remove();
                modeSec.list.append(...SPEAKER_MODES.map((o) => optButton(o, "orb__item")));
                mark(modeSec.list, P.speaker);
                optSec.h.textContent = P.speaker === "live" ? "Effect" : "Voice";
                optSec.list.setAttribute("aria-label", optSec.h.textContent);
                for (const b of [...optSec.list.querySelectorAll("[role=radio]")])
                    b.remove();
                optSec.list.append(...optionsNow().map((o) => optButton(o, "orb__item")));
                mark(optSec.list, chosen());
            };
            fill();
            const longest = Math.max(EFFECTS.length, VOICES.length);
            let horizon = 0;
            const pin = () => {
                if (desk.hidden)
                    return;
                const rowsNow = optSec.list.querySelectorAll("[role=radio]").length;
                const item = optSec.list.querySelector("[role=radio]");
                const pitch = item ? item.offsetHeight + 2 : 30;
                const full = desk.offsetHeight + (longest - rowsNow) * pitch;
                setDesignStyle(desk, "top", `${Math.round(horizon - full / 2)}px`);
            };
            const all = () => [modeSec.h, ...modeSec.list.querySelectorAll(".orb__m > span"), optSec.h, ...optSec.list.querySelectorAll(".orb__m > span")];
            skin = {
                root: desk,
                capOffset: 0,
                place(cy) {
                    horizon = cy;
                    pin();
                },
                show(on) {
                    if (on) {
                        desk.hidden = false;
                        pin();
                        placeTick(modeSec, P.speaker, true);
                        placeTick(optSec, chosen(), true);
                        const labels = all();
                        riseIn(labels);
                        drawIn(modeSec.tick, 160);
                        drawIn(optSec.tick, 120 + labels.length * 30);
                    }
                    else {
                        drawOut(modeSec.tick);
                        drawOut(optSec.tick);
                        void dropOut(all()).then(() => {
                            if (!speakerOn)
                                desk.hidden = true;
                        });
                    }
                },
                render(modeChanged) {
                    if (modeChanged) {
                        const old = [optSec.h, ...optSec.list.querySelectorAll(".orb__m > span")];
                        mark(modeSec.list, P.speaker);
                        placeTick(modeSec, P.speaker, false);
                        drawOut(optSec.tick);
                        void dropOut(old).then(() => {
                            if (!speakerOn)
                                return;
                            fill();
                            placeTick(optSec, chosen(), true);
                            const labels = [optSec.h, ...optSec.list.querySelectorAll(".orb__m > span")];
                            riseIn(labels);
                            drawIn(optSec.tick, 120 + labels.length * 30);
                        });
                    }
                    else {
                        mark(optSec.list, chosen());
                        placeTick(optSec, chosen(), false);
                    }
                }
            };
        }
        const pickSetting = (key, id) => {
            if (key === "speaker") {
                if (P.speaker === id)
                    return;
                P.speaker = id;
                setSpeaker(speakerOn);
                skin.render(true);
            }
            else {
                if (key === "effect") {
                    P.effect = id;
                    ear?.rack.setEffect(id);
                }
                else
                    P.voice = id;
                skin.render(false);
            }
            save();
        };
        const showChip = (on) => skin.show(on);
        placed = { id: skinId, root: skin.root, capOffset: skin.capOffset, place: skin.place?.bind(skin) };
        placeMic();
        const stopEar = () => {
            if (!ear)
                return;
            ear.rack.destroy();
            ear.stream.getTracks().forEach((tr) => tr.stop());
            void ear.ctx.close();
            ear = null;
        };
        const listen = async () => {
            const token = ++listenVersion;
            if (listening) {
                listening = false;
                glyph.set(false);
                hushNow();
                finishSpeaking();
                endCaptions();
                stopEar();
                setStatus("idle", "Stopped listening");
                return;
            }
            if (mic.dataset.state === "blocked")
                return;
            listening = true;
            glyph.set(true);
            mic.setAttribute("aria-pressed", "true");
            try {
                const stream = await acquireOrbStream(navigator.mediaDevices, () => !env.disposed && listening && token === listenVersion);
                if (!stream)
                    return;
                const ctx = new AudioContext({ latencyHint: "interactive" });
                const an = ctx.createAnalyser();
                an.fftSize = 1024;
                an.smoothingTimeConstant = 0.55;
                const source = ctx.createMediaStreamSource(stream);
                source.connect(an);
                const rack = voiceRack(ctx, source);
                rack.setEffect(P.effect);
                ear = { ctx, stream, an, time: new Uint8Array(an.fftSize), freq: new Uint8Array(an.frequencyBinCount), rack };
                applySpeaker();
                setStatus("listening", "Listening");
                const settledAt = env.now();
                const begin = () => {
                    if (!listening)
                        return;
                    if (glyph.settled() || env.now() - settledAt > 1200)
                        void beginCaptions();
                    else
                        env.requestFrame(begin);
                };
                env.requestFrame(begin);
            }
            catch {
                listening = false;
                glyph.set(false);
                setStatus("blocked", "Microphone unavailable. Use HTTPS and allow access to talk to the orb.");
            }
        };
        mic.addEventListener("click", listen);
        const target = new Float64Array(4);
        const drive = new Float64Array(5);
        const half = Float64Array.from(BAR_HALF);
        const hear = (dt) => {
            const awake = listening || speaking;
            if (liveSp.to !== (awake ? 1 : 0)) {
                liveSp.to = awake ? 1 : 0;
                tune(liveSp, awake ? 40 : 10, awake && !reduced ? 0.55 : 1);
            }
            stepFree(liveSp, dt);
            live = liveSp.x;
            dorm = P.rest * Math.min(1, Math.max(0, 1 - live));
            target.fill(0);
            kick = Math.max(0, kick - dt * 5);
            const src = speaking && viaKokoro && mouth ? { an: mouth.an, time: mouth.time, freq: mouth.freq, rate: mouth.ctx.sampleRate } : speaking ? null : ear ? { an: ear.an, time: ear.time, freq: ear.freq, rate: ear.ctx.sampleRate } : null;
            if (speaking && !viaKokoro) {
                target[0] = 0.25 + 0.6 * kick;
                target[1] = 0.5 * kick;
                target[2] = 0.6 * kick;
                target[3] = 0.35 * kick;
            }
            if (src) {
                src.an.getByteTimeDomainData(src.time);
                let sum = 0;
                for (let i = 0; i < src.time.length; i++)
                    sum += ((src.time[i] - 128) / 128) ** 2;
                const rms = Math.sqrt(sum / src.time.length);
                src.an.getByteFrequencyData(src.freq);
                if (ear && src.an === ear.an && ear.rack.guard(ear.freq, dt)) {
                    setSpeaker(false);
                    caps.say("Feedback :: the speaker turned off, try headphones");
                    env.setTimeout(() => caps.quiet(), 3200);
                }
                const hz = src.rate / src.an.fftSize;
                const avg2 = (lo, hi) => {
                    let a = 0;
                    let n = 0;
                    for (let i = Math.floor(lo / hz); i <= Math.min(src.freq.length - 1, Math.ceil(hi / hz)); i++) {
                        a += src.freq[i] / 255;
                        n++;
                    }
                    return n ? a / n : 0;
                };
                target[0] = rms;
                target[1] = avg2(80, 350);
                target[2] = avg2(350, 2e3);
                target[3] = avg2(2e3, 6e3);
                for (let i = 0; i < 4; i++) {
                    const v = target[i];
                    peaks[i] = Math.max(v, peaks[i] - dt * 0.04, i === 0 ? 0.02 : 0.08);
                    const floor = i === 0 ? 6e-3 : 0.04;
                    target[i] = Math.min(1, Math.max(0, (v - floor) / (peaks[i] - floor)));
                }
            }
            const follow = (cur, to) => cur + (to - cur) * (1 - Math.exp(-dt * (to > cur ? 22 : 5)));
            const damp = reduced ? 0.4 : 1;
            voice = follow(voice, target[0] * damp);
            for (let i = 0; i < 3; i++)
                bands[i] = follow(bands[i], target[i + 1] * damp);
            const holding = glyph.settled() && (listening || speaking);
            held += ((holding ? 1 : 0) - held) * (1 - Math.exp(-dt * (holding ? 4 : 18)));
            breath += dt;
            drive[0] = drive[4] = bands[2];
            drive[1] = bands[0];
            drive[2] = voice;
            drive[3] = bands[1];
            for (let i = 0; i < half.length; i++) {
                const alive = 0.88 + 0.12 * Math.sin(breath * 3.2 - i * 0.9) + 0.95 * drive[i];
                half[i] = Math.min(9.5, BAR_HALF[i] * (1 + held * (alive - 1)));
            }
            glyph.step(dt, half);
        };
        const ptr = { x: 0, y: 0, in: false, downX: 0, downY: 0 };
        const tilt = [spring(22, 2 * 0.9 * Math.sqrt(22)), spring(22, 2 * 0.9 * Math.sqrt(22))];
        const onPointer = (e) => {
            if (reduced)
                return;
            if (e.pointerType !== "mouse") {
                if (e.type === "pointerdown")
                    return void (ptr.downX = env.clientX(e), ptr.downY = env.clientY(e));
                if (e.target?.closest?.("button"))
                    return;
                if (!ptr.in && Math.hypot(env.clientX(e) - ptr.downX, env.clientY(e) - ptr.downY) < 10)
                    return;
            }
            ptr.x = env.clientX(e);
            ptr.y = env.clientY(e);
            ptr.in = true;
        };
        const onPointerOut = (e) => {
            if (e.type === "pointerup" && e.pointerType === "mouse")
                return;
            ptr.in = false;
        };
        wrap.addEventListener("pointermove", onPointer);
        wrap.addEventListener("pointerdown", onPointer);
        for (const t of ["pointerleave", "pointercancel", "pointerup"])
            wrap.addEventListener(t, onPointerOut);
        const stepTilt = (dt, cy) => {
            if (ptr.in) {
                const b = referenceRect(wrap);
                const short = Math.min(b.width, b.height) || 1;
                const up2 = Math.max(-1, Math.min(1, (cy - (ptr.y - b.top)) / short / 0.4));
                const side = Math.max(-1, Math.min(1, (ptr.x - b.left - b.width / 2) / short / 0.55));
                tilt[0].to = (up2 > 0 ? 4 : 2) * up2;
                tilt[1].to = 0.1 * side;
            }
            else
                tilt[0].to = tilt[1].to = 0;
            for (const sp of tilt) {
                if (sp.x === sp.to && sp.v === 0)
                    continue;
                stepFree(sp, dt);
                if (Math.abs(sp.to - sp.x) < 1e-4 && Math.abs(sp.v) < 1e-3)
                    Object.assign(sp, { x: sp.to, v: 0 });
            }
        };
        const glassTo = () => P.heart === "glass" || P.heart === "silver" && listening ? 1 : 0;
        const glassAmt = spring(9, 2 * Math.sqrt(9));
        glassAmt.x = glassAmt.to = glassTo();
        const stepGlass = (dt) => {
            glassAmt.to = glassTo();
            if (reduced)
                return void (glassAmt.x = glassAmt.to);
            if (glassAmt.x !== glassAmt.to || glassAmt.v !== 0)
                stepFree(glassAmt, dt);
        };
        let time = 3;
        let last = env.now();
        let raf = 0;
        let onScreen = true;
        let avg = 16.7;
        let over = 0;
        let governing = true;
        let undo = null;
        const frame = (now) => {
            raf = env.requestFrame(frame);
            const ms = now - last;
            last = now;
            const dt = Math.min(ms / 1e3, 0.1);
            hear(dt);
            easeMood(dt);
            time += dt * P.speed * (1 + 0.5 * live + 0.6 * voice) * (1 - 0.75 * dorm) * (1 + 0.35 * mood.energy * mood.amt) * (reduced ? 0.15 : 1);
            if (ms < 200)
                avg += (ms - avg) * 0.08;
            over = avg > 18.2 ? over + 1 : 0;
            if (undo && --undo.after <= 0) {
                if (avg > undo.avg * 0.9) {
                    scale = undo.scale;
                    dprCap = undo.dprCap;
                    if (hdr)
                        buildTargets();
                    else
                        resize();
                    governing = false;
                }
                undo = null;
                over = 0;
            }
            if (governing && !undo && over > 30) {
                const k = Math.min(0.92, Math.max(0.6, Math.sqrt(14 / avg)));
                const was = { scale, dprCap, avg, after: 60 };
                if (hdr && scale > 0.35) {
                    scale = Math.max(0.35, scale * k);
                    buildTargets();
                    undo = was;
                }
                else if (!hdr && dprCap > 1) {
                    dprCap = Math.max(1, Math.min(dprCap, env.pixelRatio || 1) * k);
                    resize();
                    undo = was;
                }
                over = 0;
                avg = 16.7;
            }
            const L = layout(wrap.clientWidth, wrap.clientHeight || 1);
            stepTilt(dt, L.cy);
            stepGlass(dt);
            draw(time, L);
        };
        const run = () => {
            if (raf || !onScreen || document.hidden)
                return;
            last = env.now();
            raf = env.requestFrame(frame);
        };
        const stop = () => {
            env.cancelFrame(raf);
            raf = 0;
        };
        const io = new IntersectionObserver(([e]) => {
            onScreen = e.isIntersecting;
            if (onScreen)
                run();
            else
                stop();
        });
        io.observe(wrap);
        const onVis = () => document.hidden ? stop() : run();
        document.addEventListener("visibilitychange", onVis);
        run();
        const set = (key, value) => {
            if (key === "heart" && HEARTS.includes(value))
                P.heart = value;
            else if (key === "voice" && VOICES.some((v) => v.id === value))
                pickSetting("voice", value);
            else if (key === "effect" && EFFECTS.some((e) => e.id === value))
                pickSetting("effect", value);
            else if (key === "speaker" && SPEAKER_MODES.some((m) => m.id === value))
                pickSetting("speaker", value);
            else if (key in P && typeof value === "number")
                P[key] = value;
            if (key === "size")
                placeMic();
        };
        const destroy = () => {
            stop();
            hushNow();
            spk.removeEventListener("click", toggleSpeaker);
            void mouth?.ctx.close();
            engine?.destroy();
            brain?.destroy();
            stopEar();
            mic.removeEventListener("click", listen);
            wrap.removeEventListener("pointermove", onPointer);
            wrap.removeEventListener("pointerdown", onPointer);
            for (const t of ["pointerleave", "pointercancel", "pointerup"])
                wrap.removeEventListener(t, onPointerOut);
            io.disconnect();
            ro.disconnect();
            document.removeEventListener("visibilitychange", onVis);
            freeTargets();
            gl.getExtension("WEBGL_lose_context")?.loseContext();
            wrap.remove();
        };
        return { destroy, set, pause() { listenVersion++; if (listening) {
                listening = false;
                glyph.set(false);
                hushNow();
                endCaptions();
                stopEar();
                setStatus("idle", "Microphone paused");
            } } };
    }
};
