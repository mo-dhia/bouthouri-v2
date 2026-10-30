import { uiStore } from "@/store/uiStore";
import {
  markLandedEvent,
  markLoopDurations,
  markLoopPose,
  markPieces,
  setMarkPose,
  wordmarkRest,
  type MarkLoopStep,
  type Pose,
} from "./identity-mark";

export type LiveStep = {
  id: MarkLoopStep;
  dur: number;
  pose?: () => Pose;
  move?: (t: number) => Pose;
};

const B0 = wordmarkRest();
const step = (id: MarkLoopStep, dur = markLoopDurations[id]): LiveStep =>
  id.length > 1
    ? { id, dur, move: (t) => markLoopPose(id, t, 0) }
    : { id, dur, pose: id === "B" ? () => B0 : () => markLoopPose(id, 1, 0) };
/**
 * The live wordmark reads the three scripts in order, ب → ⴱ → b, pauses on
 * b and goes round again: the loader's loop with the nav's own holds. The b
 * keeps its bowl on the x-height (drop 0); ⴱ and ب sit centred on it.
 */
export const liveSteps: readonly LiveStep[] = [
  step("C", 1100),
  step("CA"),
  step("A", 1100),
  step("AB"),
  step("B", 3400),
  step("BC"),
];
const restB = 4;

const heldPhases = new Set(["loading", "ready", "assembling"]);

/**
 * One clock drives every wordmark b under `root`. Moves run on animation
 * frames; rests wait on a timer. It holds on b during the entry and for reduced
 * motion, and carries on from wherever the entry's mark lands.
 */
export function mountLiveWordmark(root: HTMLElement): () => void {
  const marks = Array.from(root.querySelectorAll<SVGGElement>("[data-logo-mark]"))
    .map((group) => ({
      owner: group.ownerSVGElement ?? group,
      pieces: markPieces.map((name) => group.querySelector(`[data-logo-piece="${name}"]`)).filter((piece): piece is Element => !!piece),
    }))
    .filter((mark) => mark.pieces.length === markPieces.length);
  if (!marks.length) return () => {};
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => motion.matches || uiStore.getState().quietMode;
  // The entry holds the nav b until its own mark lands there.
  let landed = false;
  const held = () => !landed && heldPhases.has(uiStore.getState().entryPhase);
  const visible = new Set<Element>();
  let i = restB, start = performance.now(), pausedAt = 0, running = false, drawn = -1;
  let frameId = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const write = (pose: Pose) => marks.forEach((mark) => setMarkPose(mark.pieces, pose));
  const cancel = () => {
    cancelAnimationFrame(frameId);
    clearTimeout(timer);
    frameId = 0;
    timer = undefined;
  };
  const schedule = (now: number) => {
    const step = liveSteps[i];
    if (step.move) frameId = requestAnimationFrame(frame);
    else timer = setTimeout(() => {
      timer = undefined;
      frameId = requestAnimationFrame(frame);
    }, Math.max(0, start + step.dur - now));
  };
  const frame = (now: number) => {
    frameId = 0;
    let guard = 0;
    while (now - start >= liveSteps[i].dur && guard++ < 12) {
      start += liveSteps[i].dur;
      i = (i + 1) % liveSteps.length;
    }
    if (guard >= 12) start = now;
    const step = liveSteps[i];
    if (step.move) write(step.move(Math.min(1, (now - start) / step.dur)));
    else if (drawn !== i) write(step.pose!());
    drawn = i;
    if (running) schedule(now);
  };
  const rest = (index: number) => {
    i = index;
    start = performance.now();
    pausedAt = 0;
    drawn = i;
    write(liveSteps[i].pose!());
  };
  const play = () => {
    if (running) return;
    running = true;
    if (pausedAt) {
      start += performance.now() - pausedAt;
      pausedAt = 0;
    }
    frameId = requestAnimationFrame(frame);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    cancel();
    pausedAt = performance.now();
  };
  const restart = () => {
    cancel();
    if (running) frameId = requestAnimationFrame(frame);
  };
  const sync = () => {
    if (uiStore.getState().entryPhase === "loading") landed = false;
    if (reduced() || held()) {
      stop();
      if (i !== restB || drawn !== restB) rest(restB);
      return;
    }
    if (!document.hidden && visible.size) play();
    else stop();
  };
  const next = () => {
    if (!running || liveSteps[i].move) return;
    start = performance.now() - liveSteps[i].dur;
    restart();
  };
  // The entry's mark lands here mid-loop: continue the same step, holding
  // for the nav's own (longer) rests.
  const onLanded = (event: Event) => {
    const detail = (event as CustomEvent<{ step?: MarkLoopStep; elapsed?: number }>).detail;
    const index = liveSteps.findIndex((live) => live.id === detail?.step);
    landed = true;
    if (index < 0) rest(restB);
    else {
      const live = liveSteps[index],
        into = Math.min(Math.max(0, detail?.elapsed ?? 0), live.dur);
      i = index;
      start = performance.now() - into;
      pausedAt = 0;
      drawn = i;
      write(live.move ? live.move(into / live.dur) : live.pose!());
    }
    sync();
    restart();
  };

  const owners = new Set(marks.map((mark) => mark.owner));
  const observer = typeof IntersectionObserver === "undefined"
    ? undefined
    : new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      sync();
    }, { threshold: 0.05 });
  owners.forEach((owner) => observer ? observer.observe(owner) : visible.add(owner));
  const links = new Set(
    Array.from(owners, (owner) => owner.closest<HTMLElement>("[data-home-link]")).filter((link): link is HTMLElement => !!link),
  );
  links.forEach((link) => {
    link.addEventListener("pointerenter", next);
    link.addEventListener("focus", next);
  });
  const unsubscribe = uiStore.subscribe(sync);
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener(markLandedEvent, onLanded);
  rest(restB);
  sync();

  return () => {
    running = false;
    cancel();
    observer?.disconnect();
    unsubscribe();
    motion.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
    window.removeEventListener(markLandedEvent, onLanded);
    links.forEach((link) => {
      link.removeEventListener("pointerenter", next);
      link.removeEventListener("focus", next);
    });
    write(B0);
  };
}
