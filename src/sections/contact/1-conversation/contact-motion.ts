const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/** Source ScrollTrigger's numeric scrub uses a 300ms Expo.out tween. */
export function contactScrubEase(value: number): number {
  const progress = clamp01(value);
  const remaining = 1 - progress;
  return 1 - (2 ** (-10 * progress) * remaining + remaining ** 6 * progress);
}

export function contactRangeProgress(scroll: number, start: number, end: number): number {
  return end <= start ? Number(scroll >= end) : clamp01((scroll - start) / (end - start));
}

/** GSAP power2.out is cubic; two source lines have .5s duration and .055s stagger. */
export function contactLineOffset(progress: number, index: number, count: number): number {
  const timelineTime = clamp01(progress) * (.5 + .055 * Math.max(0, count - 1));
  const local = clamp01((timelineTime - index * .055) / .5);
  return 112 * (1 - local) ** 3;
}

/** Generic route entry used by Contact: line .4s/.06s quartic; support .3s/.045s cubic. */
export function contactEntryPose(elapsed: number, index: number, support = false) {
  const local = clamp01((elapsed - (support ? 170 + index * 45 : 50 + index * 60)) / (support ? 300 : 400));
  const remaining = (1 - local) ** (support ? 3 : 4);
  return support ? { offset: 10 * remaining, opacity: 1 - remaining } : { offset: 112 * remaining, opacity: 1 };
}

export class ContactScrub {
  value = 0;
  private from = 0;
  private target = 0;
  private startTime = 0;
  private moving = false;

  snap(value: number) {
    this.value = this.from = this.target = clamp01(value);
    this.moving = false;
  }
  retarget(value: number, now: number) {
    const next = clamp01(value);
    if (next === this.target) return;
    this.from = this.sample(now);
    this.target = next;
    this.startTime = now;
    this.moving = this.from !== this.target;
  }
  sample(now: number) {
    if (!this.moving) return this.value;
    const progress = clamp01((now - this.startTime) / 300);
    this.value = this.from + (this.target - this.from) * contactScrubEase(progress);
    if (progress === 1) this.moving = false;
    return this.value;
  }
  get active() { return this.moving; }
}
