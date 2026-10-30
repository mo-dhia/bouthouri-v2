import { uiStore } from "@/store/uiStore";
import {
  markAtoB,
  markBtoA,
  markLandedEvent,
  markPieces,
  markStatic,
  setMarkPose,
  wordmarkRest,
  type Pose,
} from "./identity-mark";

export type LiveStep = {
  id: "A" | "AB" | "B" | "BA";
  dur: number;
  pose?: () => Pose;
  move?: (t: number) => Pose;
};

const B0 = wordmarkRest();
/** The brand book's live wordmark loop: ⴱ → b and back, bowl on the x-height. */
export const liveSteps: readonly LiveStep[] = [
  { id: "A", dur: 1100, pose: markStatic.A },
  { id: "AB", dur: 1750, move: (t) => markAtoB(t, { drop: 0 }) },
  { id: "B", dur: 3400, pose: () => B0 },
  { id: "BA", dur: 1650, move: (t) => markBtoA(t, { drop: 0 }) },
];
const restB = 2;

const heldPhases = new Set(["loading", "ready", "assembling"]);

/**
 * One clock drives every wordmark b under `root`. Moves run on animation
 * frames; rests wait on a timer. It holds on b during the entry and for reduced
 * motion, and resumes from whichever state the entry hands off.
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
  const onLanded = (event: Event) => {
    const mark = (event as CustomEvent<{ mark?: string }>).detail?.mark;
    landed = true;
    rest(mark === "A" ? 0 : restB);
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
