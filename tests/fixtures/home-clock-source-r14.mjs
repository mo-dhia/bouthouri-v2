// Offline fixture generator. Runs only the cached public core, never app code.
// node tests/fixtures/home-clock-source-r14.mjs [cached-core.js]
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const file = process.argv[2] ?? "/tmp/gazzar-runtime/244pluf-w83n0.js";
const core = readFileSync(file, "utf8");
const sha256 = createHash("sha256").update(core).digest("hex");
if (sha256 !== "e1899cd720c6c19111d45a94334434ebb3fd826e1cdb191dda8b312e17b0fef8")
  throw Error("Expected the audited cached GSAP 3.15.0 core");

const target = (wall, to, immediate = false) => ({ kind: "target", wall, to, ...(immediate ? { immediate } : {}) });
const tick = (wall, raf = wall) => ({ kind: "tick", wall, raf });
const sleep = (wall) => ({ kind: "sleep", wall });
const snap = (wall, to) => ({ kind: "snap", wall, to });
const schedules = {
  betweenTicks: [target(0, 1), tick(10), target(25, 0.6), tick(40), target(53, 1), tick(70), tick(153)],
  beforeRAF: [target(17, 0.1), tick(18, 1000 / 60), target(34, 0.2), tick(35, 2000 / 60), target(51, 0.3), tick(52, 50), target(68, 0.4), tick(69, 4000 / 60), tick(86, 5000 / 60), tick(566)],
  multipleEvents: [target(0, 0.2), tick(16), target(23, 0.4), target(27, 0.1), target(30, 0.3), tick(34, 32), target(39, 0.05), target(44, 0.2), tick(52, 48), tick(544)],
  reversal: [target(0, 1), tick(20), target(37, 0), tick(38, 2000 / 60), target(54, 0.8), tick(55, 50), tick(535)],
  callbackDelay: [target(0, 0.2), tick(16), target(30, 0.4), tick(80, 32), target(89, 0.05), tick(110, 96), tick(590)],
  pre270: [target(0, 0.2), tick(16), target(30, 0.4), tick(32), target(46, 0.05), tick(48), target(62, 0.3), tick(64), tick(80), tick(542)],
  settledWake: [target(0, 0.3), tick(480), sleep(480), target(2000, 0.1), target(2007, 0.2), tick(2016, 2000), tick(2490)],
  unfinishedWake: [target(0, 0.3), tick(20), sleep(20), target(2000, 0.1), tick(2016, 2000), tick(2490)],
  refreshWake: [target(0, 0.4), tick(16), snap(31, 0.2), sleep(31), target(2000, 0.3), tick(2016, 2000), tick(2490)],
  refreshAwake: [target(0, 0.4), tick(16), snap(31, 0.2), target(35, 0.3), tick(40), tick(520)],
};
// Cached source story conversion, kept independent of project imports.
const storyInput = (score) => (22 + 100 + (score - 100) * 0.48) / 416.72;
const cutoff = [target(0, 0.1), tick(16), target(25, storyInput(270.001), true), tick(32),
  target(37, storyInput(269)), tick(48), target(63, storyInput(275), true), tick(64),
  target(79, storyInput(260)), tick(80), tick(560)];

function run(kind, actions) {
  let wall = 0, timer = 0;
  class SourceDate extends Date { static now() { return 100000 + wall; } }
  const context = { Math, Date: SourceDate, setTimeout: () => ++timer, clearTimeout() {} };
  vm.runInNewContext(core, context, { filename: file, timeout: 1000 });
  let gsap;
  context.TURBOPACK[0][2]({ s(exports) { gsap = exports[2]; } });
  // Keep DEFAULT 500ms/33ms lag smoothing, including the real sleep/wake path.
  const object = { progress: 0 };
  const quick = gsap.quickTo(object, "progress", {
    duration: kind === "hero" ? 0.1 : 0.48,
    ease: kind === "hero" ? "power2.out" : "expo",
    lazy: false,
  });
  const rows = [];
  for (const action of actions) {
    wall = action.wall;
    if (action.kind === "target") {
      if (kind === "journey") {
        // Actual ScrollTrigger 43340 pre-render, before evaluating explicit FROM.
        const tween = quick.tween;
        if (tween._dp._time - tween._start !== tween._time)
          tween.render(tween._dp._time - tween._start);
      }
      quick(action.to, object.progress);
      // HOME's onUpdate at story >=270 completes the scrub tween immediately.
      if (action.immediate) quick.tween.progress(1);
    } else if (action.kind === "snap") {
      // Hero b(e): pause its quickTo and replace the displayed raw value.
      // Journey refresh/restore likewise replaces the presentation with no tail.
      quick.tween.pause();
      object.progress = action.to;
    } else if (action.kind === "sleep") gsap.ticker.sleep();
    else gsap.ticker.tick();
    rows.push({ ...action, input: object.progress,
      parentMs: gsap.globalTimeline._time * 1000, startMs: quick.tween._start * 1000 });
  }
  gsap.ticker.sleep();
  return { kind, rows };
}

const cases = Object.fromEntries(["hero", "journey"].flatMap((kind) =>
  Object.entries(schedules).map(([name, actions]) => [`${kind}-${name}`, run(kind, actions)])));
cases["journey-cutoff"] = run("journey", cutoff);
const output = {
  source: { version: "3.15.0", sha256, core: "244pluf-w83n0.js / module 32919",
    hero: "2gz902oulp4x8.js:4787–4828; explicit w(e.progress,l.progress)",
    journey: "2mptg809nyngd.js / module 43340; parent pre-render before resetTo",
    note: "Actual cached core, fake Date.now inside ticker callbacks, inert timers, default lag smoothing. Only ticks and sleeping-ticker wake advance the source parent. RAF stamps are recorded adversarial inputs, never source time. No local helper is imported. Six-decimal source writes; compare with accumulated rounding tolerance. Synthetic contracts do not establish live cadence or presented FPS." },
  cases,
};
writeFileSync(new URL("./home-clock-source-r14.json", import.meta.url), JSON.stringify(output, null, 2) + "\n");
process.stdout.write(JSON.stringify({ sha256, cases: Object.keys(cases).length }) + "\n");
