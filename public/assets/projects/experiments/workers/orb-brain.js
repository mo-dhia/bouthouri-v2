
const SR = 16000, FRAME = 512;
const SPEECH = 0.3, EXIT = 0.1;              // VAD: start / keep-going probability
const MIN_SILENCE = 0.4 * SR;                // a pause this long ends a segment
const PAD = 0.08 * SR, MIN_SPEECH = 0.25 * SR;
const MAX = 30 * SR;                         // Moonshine's window
const PARTIAL_MIN = 0.25 * SR;               // new audio before another live read
const WINDOW = 6 * SR, WINDOW_HARD = 10 * SR, SEARCH = 1.5 * SR;
const GAP = 0.15;                            // a real gap: energy < 15% of the median
const TOKENS_PER_SECOND = 6.5;               // Moonshine's own cap against loops
const DTYPES = { webgpu: { encoder_model: "fp32", decoder_model_merged: "q4" },
                 wasm:   { encoder_model: "fp32", decoder_model_merged: "q8" } };
let T, vad, asr, feel, runtime;
const loads = {};
// one honest progress figure per part: only big files count (a small one
// finishing first would read 100%), and it never goes backwards
const progressFor = (part) => {
  const files = new Map(); let shown = 0;
  return (p) => {
    if (p.status !== "progress" || !p.file || !p.total || p.total < 4e6) return;
    files.set(p.file, p);
    let l = 0, t = 0; for (const f of files.values()) { l += f.loaded || 0; t += f.total; }
    shown = Math.max(shown, t ? l / t : 0);
    postMessage({ type: "progress", part, value: shown });
  };
};
async function boot({ runtime: url, host }) {
  T = await import(url);
  if (host) {
    T.env.remoteHost = host + "/hf/";
    T.env.backends.onnx.wasm.wasmPaths = host + "/npm/onnxruntime-web@" + T.env.backends.onnx.versions.web + "/dist/";
  }
}
// MOOD: a 4.5 MB TinyBERT reads six emotions from settled text; on the CPU
// (it's instant there, and the GPU stays with the scene and the captions)
async function loadMood() {
  feel = await T.pipeline("text-classification", "AdamCodd/tinybert-emotion-balanced", { dtype: "q8", device: "wasm" });
  postMessage({ type: "ready", part: "mood" });
}
async function loadCaptions() {
  const progress = progressFor("captions");
  const device = (await navigator.gpu?.requestAdapter().catch(() => null)) ? "webgpu" : "wasm";
  vad = await T.AutoModel.from_pretrained("onnx-community/silero-vad",
    { config: { model_type: "custom" }, dtype: "fp32", progress_callback: progress });
  asr = await T.pipeline("automatic-speech-recognition", "onnx-community/moonshine-base-ONNX",
    { device, dtype: DTYPES[device], progress_callback: progress });
  postMessage({ type: "preparing", part: "captions" }); // downloaded; shaders compile next
  await asr(new Float32Array(SR));
  sr = new T.Tensor("int64", [SR], []); state = fresh();
  postMessage({ type: "ready", part: "captions", device });
}


// VOICE: Kokoro-82M speaks text back. Measured on an M-series Mac: fp32 on
// WebGPU runs ~4.7x real time; q8 on the CPU only ~0.64x (the page isn't
// cross-origin isolated, so ONNX gets one thread); fp16 on WebGPU outputs NaN.
// So: fp32 on the GPU where there is one, q8 on the CPU where there isn't. Text → phonemes (espeak-ng via the phonemizer package) →
// tokens → a waveform, sentence by sentence so playback starts on the
// first. The text handling is ported from kokoro-js (Apache-2.0).
let tts, ttsTok, phon, voiceHost, speakId = 0;
const voiceData = new Map();
async function loadVoice({ phonemizer, host }) {
  voiceHost = host;
  const progress = progressFor("voice");
  phon = await import(phonemizer);
  const gpu = await navigator.gpu?.requestAdapter().catch(() => null);
  [tts, ttsTok] = await Promise.all([
    T.StyleTextToSpeech2Model.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX",
      gpu ? { dtype: "fp32", device: "webgpu", progress_callback: progress } : { dtype: "q8", device: "wasm", progress_callback: progress }),
    T.AutoTokenizer.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { progress_callback: progress }),
  ]);
  postMessage({ type: "ready", part: "voice" });
}
// a voice is 510 style vectors (one per input length), ~0.5 MB, cached
async function voiceStyles(id) {
  if (voiceData.has(id)) return voiceData.get(id);
  const url = (voiceHost ? voiceHost + "/hf" : "https://huggingface.co") + "/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/" + id + ".bin";
  let cache = null, buf = null;
  try { cache = await caches.open("orb-voices"); const hit = await cache.match(url); if (hit) buf = await hit.arrayBuffer(); } catch {}
  if (!buf) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("voice " + id + ": " + r.status);
    buf = await r.arrayBuffer();
    try { await cache?.put(url, new Response(buf.slice(0))); } catch {}
  }
  const data = new Float32Array(buf);
  voiceData.set(id, data);
  return data;
}
// numbers read the way people say them: years, times, money, decimals
function sayNumber(m) {
  if (m.includes(".")) return m;
  if (m.includes(":")) {
    const [h, mm] = m.split(":").map(Number);
    return mm === 0 ? h + " o'clock" : mm < 10 ? h + " oh " + mm : h + " " + mm;
  }
  const y = parseInt(m.slice(0, 4), 10);
  if (y < 1100 || y % 1000 < 10) return m;
  const left = m.slice(0, 2), right = parseInt(m.slice(2, 4), 10), s = m.endsWith("s") ? "s" : "";
  if (y % 1000 >= 100 && y % 1000 <= 999) {
    if (right === 0) return left + " hundred" + s;
    if (right < 10) return left + " oh " + right + s;
  }
  return left + " " + right + s;
}
function sayMoney(m) {
  const unit = m[0] === "$" ? "dollar" : "pound";
  if (isNaN(Number(m.slice(1)))) return m.slice(1) + " " + unit + "s";
  if (!m.includes(".")) return m.slice(1) + " " + unit + (m.slice(1) === "1" ? "" : "s");
  const [whole, part] = m.slice(1).split(".");
  const d = parseInt(part.padEnd(2, "0"), 10);
  return whole + " " + unit + (whole === "1" ? "" : "s") + " and " + d + " " +
    (m[0] === "$" ? (d === 1 ? "cent" : "cents") : d === 1 ? "penny" : "pence");
}
const sayPoint = (m) => { const [a, b] = m.split("."); return a + " point " + b.split("").join(" "); };
function normalize(t) {
  return t
    .replace(/[‘’]/g, "'").replace(/«/g, "“").replace(/»/g, "”").replace(/[“”]/g, '"')
    .replace(/\(/g, "«").replace(/\)/g, "»")
    .replace(/[^\S \n]/g, " ").replace(/  +/, " ").replace(/(?<=\n) +(?=\n)/g, "")
    .replace(/\bD[Rr]\.(?= [A-Z])/g, "Doctor")
    .replace(/\b(?:Mr\.|MR\.(?= [A-Z]))/g, "Mister")
    .replace(/\b(?:Ms\.|MS\.(?= [A-Z]))/g, "Miss")
    .replace(/\b(?:Mrs\.|MRS\.(?= [A-Z]))/g, "Mrs")
    .replace(/\betc\.(?! [A-Z])/gi, "etc")
    .replace(/\b(y)eah?\b/gi, "$1e'a")
    .replace(/\d*\.\d+|\b\d{4}s?\b|(?<!:)\b(?:[1-9]|1[0-2]):[0-5]\d\b(?!:)/g, sayNumber)
    .replace(/(?<=\d),(?=\d)/g, "")
    .replace(/[$£]\d+(?:\.\d+)?(?: hundred| thousand| (?:[bm]|tr)illion)*\b|[$£]\d+\.\d\d?\b/gi, sayMoney)
    .replace(/\d*\.\d+/g, sayPoint)
    .replace(/(?<=\d)-(?=\d)/g, " to ")
    .replace(/(?<=\d)S/g, " S")
    .replace(/(?<=[BCDFGHJ-NP-TV-Z])'?s\b/g, "'S")
    .replace(/(?<=X')S\b/g, "s")
    .replace(/(?:[A-Za-z]\.){2,} [a-z]/g, (m) => m.replace(/\./g, "-"))
    .replace(/(?<=[A-Z])\.(?=[A-Z])/gi, "-")
    .trim();
}
const PUNCT = /(\s*[;:,.!?¡¿—…"«»“”(){}[\]]+\s*)+/g;
async function phonemes(text, lang) {
  text = normalize(text);
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(PUNCT)) {
    if (last < m.index) parts.push({ punct: false, t: text.slice(last, m.index) });
    if (m[0]) parts.push({ punct: true, t: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ punct: false, t: text.slice(last) });
  const code = lang === "a" ? "en-us" : "en";
  let ph = (await Promise.all(parts.map(async ({ punct, t }) => (punct ? t : (await phon.phonemize(t, code)).join(" "))))).join("");
  ph = ph.replace(/kəkˈoːɹoʊ/g, "kˈoʊkəɹoʊ").replace(/kəkˈɔːɹəʊ/g, "kˈəʊkəɹəʊ")
    .replace(/ʲ/g, "j").replace(/r/g, "ɹ").replace(/x/g, "k").replace(/ɬ/g, "l")
    .replace(/(?<=[a-zɹː])(?=hˈʌndɹɪd)/g, " ").replace(/ z(?=[;:,.!?¡¿—…"«»“” ]|$)/g, "z");
  if (lang === "a") ph = ph.replace(/(?<=nˈaɪn)ti(?!ː)/g, "di");
  return ph.trim();
}
async function speakText({ id, text, voice, speed }) {
  speakId = id;
  const styles = await voiceStyles(voice);
  const sentences = text.match(/[^.!?…]+[.!?…]*["')\]]*\s*/g) || [text];
  for (const s of sentences) {
    if (id !== speakId) return; // hushed or superseded
    const t = s.trim();
    if (!t) continue;
    const { input_ids } = ttsTok(await phonemes(t, voice[0]), { truncation: true });
    const off = 256 * Math.min(Math.max(input_ids.dims.at(-1) - 2, 0), 509);
    const style = new T.Tensor("float32", styles.slice(off, off + 256), [1, 256]);
    const { waveform } = await (chain = chain.then(() => tts({ input_ids, style, speed: new T.Tensor("float32", [speed], [1]) })));
    if (id !== speakId) return;
    const pcm = new Float32Array(waveform.data);
    postMessage({ type: "speech", id, pcm, rate: 24000 }, [pcm.buffer]);
  }
  postMessage({ type: "spoken", id });
}
let chain = Promise.resolve(), state, sr;
const BUF = new Float32Array(MAX);
let at = 0, rec = false, after = 0, since = 0, busy = false, win = 0, prev = [];
const fresh = () => new T.Tensor("float32", new Float32Array(256), [2, 1, 128]);
async function speech(frame) {
  const input = new T.Tensor("float32", frame, [1, frame.length]);
  const { output, stateN } = await (chain = chain.then(() => vad({ input, sr, state })));
  state = stateN;
  const p = output.data[0];
  return p > SPEECH || (rec && p >= EXIT);
}
function audio(end) {
  const lead = prev.reduce((n, b) => n + b.length, 0), out = new Float32Array(lead + end);
  let o = 0; for (const b of prev) { out.set(b, o); o += b.length; }
  out.set(BUF.subarray(0, end), o);
  return out;
}
async function read(a, kind, w) {
  const max_new_tokens = Math.max(8, Math.ceil(a.length / SR * TOKENS_PER_SECOND));
  const r = await (chain = chain.then(() => asr(a, { max_new_tokens })));
  const text = ((Array.isArray(r) ? r[0]?.text : r.text) || "").trim();
  if (kind === "partial" && w !== win) return;    // that window has moved on
  postMessage({ type: kind, text, window: w });
}
function commitOlder() {
  const en = [];
  for (let s = Math.max(FRAME, at - SEARCH); s + FRAME <= at - FRAME; s += FRAME) {
    let e = 0; for (let i = s; i < s + FRAME; i++) e += BUF[i] * BUF[i];
    en.push({ s, e });
  }
  if (!en.length) return;
  const median = [...en].sort((a, b) => a.e - b.e)[en.length >> 1].e;
  const q = en.reduce((a, b) => (b.e < a.e ? b : a));
  if (q.e > median * GAP && at < WINDOW_HARD) return;   // wait for a real gap
  const split = q.s + FRAME / 2;
  read(audio(split), "commit", win); win++;
  prev = [];                                     // no lead-in: it would re-hear the last word
  BUF.copyWithin(0, split, at); at -= split; BUF.fill(0, at); since = 0;
}
function endSegment() {
  if (at >= MIN_SPEECH) read(audio(Math.min(at + PAD, MAX)), "final", win);
  win++; BUF.fill(0); at = 0; rec = false; after = 0; since = 0;
}
async function hear(frame) {
  const was = rec, isSpeech = await speech(frame);
  if (!was && !isSpeech) { if (prev.length >= Math.ceil(PAD / FRAME)) prev.shift(); prev.push(frame); return; }
  if (frame.length >= MAX - at) { endSegment(); return; }
  BUF.set(frame, at); at += frame.length; since += frame.length;
  if (isSpeech) {
    rec = true; after = 0;
    if (since >= PARTIAL_MIN && !busy) { since = 0; busy = true; read(audio(at), "partial", win).finally(() => (busy = false)); }
    if (at >= WINDOW) commitOlder();
    return;
  }
  after += frame.length;
  if (after >= MIN_SILENCE) endSegment();
}
onmessage = (e) => {
  const m = e.data;
  if (m.type === "load") {
    runtime ??= boot(m);
    const loader = { captions: loadCaptions, mood: loadMood, voice: loadVoice }[m.part];
    loads[m.part] ??= runtime.then(() => loader(m)).catch((err) => {
      loads[m.part] = null;
      postMessage({ type: "error", part: m.part, message: String(err?.message ?? err) });
    });
    return;
  }
  if (m.type === "mood") {
    if (!feel) return;
    feel(m.text, { top_k: null }).then((scores) => postMessage({ type: "mood", id: m.id, scores }));
    return;
  }
  if (m.type === "speak") {
    if (tts) speakText(m).catch((err) => postMessage({ type: "spoken", id: m.id, error: String(err?.message ?? err) }));
    return;
  }
  if (m.type === "hush") { speakId = -1; return; }
  if (!asr || !state) return;
  if (m.type === "audio") hear(m.buffer);
  else if (m.type === "flush") { if (rec) endSegment(); prev = []; state = fresh(); }
};
