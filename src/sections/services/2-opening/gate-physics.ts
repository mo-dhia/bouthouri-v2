import { clamp, type Point } from "./opening-score";

/** Source fixed-step spring. All vectors are normalized to the gate's pull radius. */
const settings = { step: 1 / 240, grip: 230, returnForce: 60, nonlinear: 155, heldDamping: 29, returnSpring: 330, returnDamping: 29, fireSpring: 640, fireDamping: 18, maxSpeed: 8, threshold: .54, touchThreshold: .44, columns: 41, apertureSpring: 105, apertureDamping: 21, surfaceSpring: 720, surfaceDamping: 48 };
const zero = (): Point => ({ x: 0, y: 0 });
const length = (p: Point) => Math.hypot(p.x, p.y);
function limit(p: Point, max: number) { const size = length(p); if (size > max) { p.x *= max / size; p.y *= max / size; } }
type Phase = "idle" | "dragging" | "armed" | "returning" | "releasing" | "opening" | "resolved";

export class GatePhysics {
  phase: Phase = "idle";
  position = zero(); velocity = zero(); surface = zero(); surfaceVelocity = zero(); pointer = zero(); pointerVelocity = zero();
  grabOrigin = { x: .52, y: .52 };
  releaseVector = zero(); releaseVelocity = zero(); releaseSurface = zero(); openingContact = zero(); openingSurface = zero(); releaseDirection = { x: 1, y: 0 };
  reduced = false; touch = false; energy = 0; age = 0; openingAge = 0; line = 0; lineVelocity = 0; accumulator = 0;
  aperture = new Float64Array(settings.columns); apertureVelocity = new Float64Array(settings.columns);
  events: { type: string; strength: number }[] = [];
  get q() { return this.dragging ? length(this.position) : this.position.x * this.releaseDirection.x + this.position.y * this.releaseDirection.y; }
  get dragging() { return this.phase === "dragging" || this.phase === "armed"; }
  get armed() { return this.phase === "armed"; }
  get completed() { return this.phase === "opening" || this.phase === "resolved"; }
  get committed() { return this.phase === "releasing" || this.completed; }
  get tension() { return clamp(length(this.position) / (this.touch ? settings.touchThreshold : settings.threshold)); }
  begin(touch = false, origin = this.grabOrigin) {
    if (this.phase !== "idle" && this.phase !== "returning") return false;
    this.touch = touch; this.grabOrigin = { x: clamp(origin.x), y: clamp(origin.y) }; this.phase = "dragging"; this.pointer = { ...this.position }; this.pointerVelocity = zero(); this.age = 0; this.events.push({ type: "grab", strength: 0 }); return true;
  }
  pullVector(x: number, y: number, dt = 1 / 60) {
    if (!this.dragging || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const size = Math.hypot(x, y), factor = size ? 2.15 * Math.tanh(size / 2.15) / size : 0, next = { x: x * factor, y: y * factor };
    this.pointerVelocity = { x: (next.x - this.pointer.x) / Math.max(.008, dt), y: (next.y - this.pointer.y) / Math.max(.008, dt) }; limit(this.pointerVelocity, 5); this.pointer = next;
  }
  release(cancel = false) {
    if (!this.dragging) return false;
    const size = length(this.position), fire = this.armed && !cancel;
    this.releaseDirection = size ? { x: this.position.x / size, y: this.position.y / size } : { x: 1, y: 0 };
    this.releaseVector = { ...this.position }; this.releaseVelocity = { ...this.velocity }; this.releaseSurface = { ...this.surface }; this.phase = fire ? "releasing" : "returning"; this.age = 0; this.pointer = zero();
    this.energy = clamp(size * size * .9 + .06 * length(this.velocity) + .025 * length(this.pointerVelocity), .05, 1);
    if (fire) { const speed = this.reduced ? 2 : 2.1 + 4.2 * this.energy, along = this.pointerVelocity.x * this.releaseDirection.x + this.pointerVelocity.y * this.releaseDirection.y; this.velocity = { x: -this.releaseDirection.x * speed + (this.pointerVelocity.x - along * this.releaseDirection.x) * .12, y: -this.releaseDirection.y * speed + (this.pointerVelocity.y - along * this.releaseDirection.y) * .12 }; limit(this.velocity, settings.maxSpeed); }
    this.events.push({ type: "release", strength: fire ? this.energy : 0 }); return fire;
  }
  openDirect() { if (this.committed) return; this.reset(); this.energy = .3; this.phase = this.reduced ? "resolved" : "opening"; this.openingAge = this.reduced ? 3.2 : 0; if (this.reduced) { this.aperture.fill(1); this.line = 1; } this.events.push({ type: "open", strength: .3 }); }
  reset() {
    this.phase = "idle"; this.position = zero(); this.velocity = zero(); this.surface = zero(); this.surfaceVelocity = zero(); this.pointer = zero(); this.pointerVelocity = zero(); this.releaseVector = zero(); this.releaseSurface = zero(); this.openingContact = zero(); this.openingSurface = zero(); this.releaseVelocity = zero(); this.releaseDirection = { x: 1, y: 0 }; this.age = this.openingAge = this.energy = this.line = this.lineVelocity = this.accumulator = 0; this.aperture.fill(0); this.apertureVelocity.fill(0); this.events.length = 0;
  }
  suspend() { if (!this.committed) return this.reset(); this.phase = "resolved"; this.position = zero(); this.velocity = zero(); this.surface = zero(); this.surfaceVelocity = zero(); this.aperture.fill(1); this.apertureVelocity.fill(0); this.line = 1; this.lineVelocity = 0; this.openingAge = 3.2; this.accumulator = 0; }
  advance(dt: number) { if (!Number.isFinite(dt) || dt <= 0) return; this.accumulator += Math.min(dt, .05); while (this.accumulator >= settings.step) { this.step(settings.step); this.accumulator -= settings.step; } }
  private step(dt: number) {
    this.age += dt;
    if (this.dragging || this.phase === "returning" || this.phase === "releasing") {
      const held = this.dragging, firing = this.phase === "releasing", radiusSquared = this.position.x ** 2 + this.position.y ** 2;
      const damping = this.reduced ? 45 : held ? settings.heldDamping : firing ? settings.fireDamping : settings.returnDamping;
      for (const axis of ["x", "y"] as const) { const position = this.position[axis], force = held ? settings.grip * (this.pointer[axis] - position) - settings.returnForce * position - settings.nonlinear * radiusSquared * position : -(firing ? settings.fireSpring : settings.returnSpring) * position; this.velocity[axis] += (force - damping * this.velocity[axis]) * dt; }
      limit(this.velocity, settings.maxSpeed); this.position.x += this.velocity.x * dt; this.position.y += this.velocity.y * dt; limit(this.position, 1.25);
      if (held) { const armed = length(this.position) >= (this.touch ? settings.touchThreshold : settings.threshold); if (armed && !this.armed) this.events.push({ type: "armed", strength: this.tension }); this.phase = armed ? "armed" : "dragging"; }
      if (firing && (this.q <= .015 || this.age > .35)) { this.openingContact = { ...this.position }; this.openingSurface = { ...this.surface }; this.phase = "opening"; this.openingAge = 0; this.lineVelocity = Math.min(1.8, .22 * length(this.velocity)); this.position = zero(); this.events.push({ type: "open", strength: this.energy }); }
      if (this.phase === "returning" && length(this.position) < .0005 && length(this.velocity) < .008) { this.phase = "idle"; this.position = zero(); this.velocity = zero(); this.surface = zero(); this.surfaceVelocity = zero(); this.pointerVelocity = zero(); this.releaseVector = zero(); this.releaseVelocity = zero(); this.releaseSurface = zero(); this.releaseDirection = { x: 1, y: 0 }; this.age = 0; }
    }
    if (this.reduced) { this.surface = { ...this.position }; this.surfaceVelocity = zero(); }
    else for (const axis of ["x", "y"] as const) { this.surfaceVelocity[axis] += (settings.surfaceSpring * (this.position[axis] - this.surface[axis]) - settings.surfaceDamping * this.surfaceVelocity[axis]) * dt; this.surface[axis] += this.surfaceVelocity[axis] * dt; }
    if (!this.completed) return;
    this.openingAge += dt;
    let settled = true;
    for (let column = 0; column < settings.columns; column++) {
      const coordinate = column / (settings.columns - 1), distance = Math.abs(coordinate - this.grabOrigin.x), forward = (coordinate - this.grabOrigin.x) * this.releaseDirection.x > 0;
      const delay = this.reduced ? .1 * distance : distance / (1.5 + .9 * this.energy) * (forward ? .82 : 1.12);
      if (this.openingAge < delay) { settled = false; continue; }
      const spring = this.reduced ? 150 : settings.apertureSpring + 28 * this.energy, damping = this.reduced ? 26 : settings.apertureDamping;
      this.apertureVelocity[column] += (spring * (1 - this.aperture[column]) - damping * this.apertureVelocity[column]) * dt;
      this.aperture[column] = clamp(this.aperture[column] + this.apertureVelocity[column] * dt, 0, 1.012);
      if (Math.abs(1 - this.aperture[column]) > .002 || Math.abs(this.apertureVelocity[column]) > .015) settled = false;
    }
    this.lineVelocity += (115 * (clamp(this.openingAge / (this.reduced ? 1.3 : 1.5)) - this.line) - 23 * this.lineVelocity) * dt;
    this.line = clamp(this.line + this.lineVelocity * dt);
    if (settled && this.phase === "opening") { this.phase = "resolved"; this.aperture.fill(1); this.apertureVelocity.fill(0); this.events.push({ type: "settle", strength: this.energy }); }
  }
}
