/** Adapted from Carter Ogunsola's public Lab polka-dots example, inspected 2026-10-29.
 * Renderer math and interaction constants retain the measured source contract.
 * The owning gate supplies native scheduling, width coordinates and cleanup. */
import { setDesignStyle, referenceRect } from '../../experiment-dom';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const DOT_R = 2.4;
const REST_ALPHA = 0.2;
const VEL_PUSH = 0.16;
const WAVE = 2.4;
const RIPPLE_SPEED = 620;
const RIPPLE_WIDTH = 90;
const RIPPLE_PUSH = 3.4;
const DEFAULTS = {
    repelR: 116,
    push: 0.9,
    bloom: 2.1,
    pull: { stiffness: 0.055, damping: 0.18, mass: 1 }
};
export const experiment = {
    mount(root, env) {
        const reduced = env.reduced;
        const P = { ...DEFAULTS };
        const wrap = document.createElement("div");
        wrap.className = "pd";
        const canvas = document.createElement("canvas");
        wrap.appendChild(canvas);
        root.appendChild(wrap);
        const ctx = canvas.getContext("2d");
        let ink = [30, 30, 30];
        const resolveInk = () => {
            const probe = document.createElement("span");
            setDesignStyle(probe, "cssText", "color:var(--ink);position:absolute;visibility:hidden");
            wrap.appendChild(probe);
            const m = getComputedStyle(probe).color.match(/\d+/g);
            probe.remove();
            if (m)
                ink = [Number(m[0]), Number(m[1]), Number(m[2])];
        };
        resolveInk();
        const themeObs = new MutationObserver(resolveInk);
        themeObs.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme", "class"]
        });
        let dpr = 1;
        let cols = 0;
        let rows = 0;
        let dots = [];
        let W = 0;
        let H = 0;
        const measure = () => {
            W = wrap.clientWidth;
            H = wrap.clientHeight;
            dpr = Math.min(env.pixelRatio || 1, 2);
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const pitch = clamp(Math.min(W, H) / 18, 26, 44);
            const nextCols = Math.max(2, Math.round(W / pitch));
            const nextRows = Math.max(2, Math.round(H / pitch));
            if (nextCols === cols && nextRows === rows && dots.length) {
                const gapX = W / cols;
                const gapY = H / rows;
                dots.forEach((d, i) => {
                    const hx = gapX * (i % cols + 0.5);
                    const hy = gapY * (Math.floor(i / cols) + 0.5);
                    d.x += hx - d.hx;
                    d.y += hy - d.hy;
                    d.hx = hx;
                    d.hy = hy;
                });
                return false;
            }
            cols = nextCols;
            rows = nextRows;
            return true;
        };
        const seed = (bloom) => {
            const gapX = W / cols;
            const gapY = H / rows;
            dots = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const hx = gapX * (c + 0.5);
                    const hy = gapY * (r + 0.5);
                    dots.push({
                        hx,
                        hy,
                        x: hx,
                        y: hy,
                        vx: 0,
                        vy: 0,
                        appear: reduced || !bloom ? 1 : 0
                    });
                }
            }
            if (bloom && !reduced)
                intro();
        };
        const build = (bloom = true) => {
            if (measure())
                seed(bloom);
        };
        let introTween = null;
        const intro = () => {
            introTween?.kill();
            if (reduced)
                return;
            dots.forEach((d) => d.appear = 0);
            introTween = env.motion.tween(dots, {
                appear: 1,
                duration: 1.1,
                ease: "elastic.out(1, 0.55)",
                delay: 0.15,
                stagger: { each: 35e-4, grid: [rows, cols], from: "center" }
            });
        };
        const mouse = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, active: false };
        const ripples = [];
        const ac = new AbortController();
        const { signal } = ac;
        const toLocal = (e) => {
            const r = referenceRect(canvas);
            return { x: env.clientX(e) - r.left, y: env.clientY(e) - r.top };
        };
        wrap.addEventListener("pointermove", (e) => {
            const p = toLocal(e);
            mouse.x = p.x;
            mouse.y = p.y;
            if (!mouse.active) {
                mouse.px = p.x;
                mouse.py = p.y;
            }
            mouse.active = true;
        }, { signal });
        wrap.addEventListener("pointerleave", () => mouse.active = false, { signal });
        wrap.addEventListener("pointerdown", (e) => {
            if (reduced)
                return;
            const p = toLocal(e);
            ripples.push({ x: p.x, y: p.y, radius: 0, strength: RIPPLE_PUSH });
        }, { signal });
        const tick = (time, dtMs) => {
            const dt = Math.min(dtMs, 40) / 1e3 || 0.016;
            const R2 = P.repelR * P.repelR;
            mouse.vx = mouse.x - mouse.px;
            mouse.vy = mouse.y - mouse.py;
            mouse.px = mouse.x;
            mouse.py = mouse.y;
            for (let i = ripples.length - 1; i >= 0; i--) {
                const rp = ripples[i];
                rp.radius += RIPPLE_SPEED * dt;
                rp.strength *= 0.955;
                if (rp.strength < 0.05 || rp.radius > Math.hypot(W, H))
                    ripples.splice(i, 1);
            }
            ctx.clearRect(0, 0, W, H);
            const [ir, ig, ib] = ink;
            for (let k = 0; k < dots.length; k++) {
                const d = dots[k];
                const hx = reduced ? d.hx : d.hx + Math.sin(d.hy * 0.02 + time * 12e-4) * WAVE;
                const hy = reduced ? d.hy : d.hy + Math.cos(d.hx * 0.02 + time * 1e-3) * WAVE;
                const springK = P.pull.stiffness / P.pull.mass;
                let ax = (hx - d.x) * springK;
                let ay = (hy - d.y) * springK;
                let bloom = 0;
                if (mouse.active) {
                    const dx = d.x - mouse.x;
                    const dy = d.y - mouse.y;
                    const dd = dx * dx + dy * dy;
                    if (dd < R2) {
                        const dist = Math.sqrt(dd) || 1;
                        const f = 1 - dist / P.repelR;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        ax += nx * f * P.push + mouse.vx * f * VEL_PUSH;
                        ay += ny * f * P.push + mouse.vy * f * VEL_PUSH;
                        bloom = f;
                    }
                }
                for (let ri = 0; ri < ripples.length; ri++) {
                    const rp = ripples[ri];
                    const dx = d.x - rp.x;
                    const dy = d.y - rp.y;
                    const dist = Math.hypot(dx, dy) || 1;
                    const edge = Math.abs(dist - rp.radius);
                    if (edge < RIPPLE_WIDTH) {
                        const f = (1 - edge / RIPPLE_WIDTH) * rp.strength;
                        ax += dx / dist * f;
                        ay += dy / dist * f;
                        if (f * 0.4 > bloom)
                            bloom = Math.min(1, f * 0.4);
                    }
                }
                const keep = 1 - P.pull.damping;
                d.vx = (d.vx + ax) * keep;
                d.vy = (d.vy + ay) * keep;
                d.x += d.vx;
                d.y += d.vy;
                const rad = DOT_R * (0.4 + 0.6 * d.appear) * (1 + bloom * P.bloom);
                const alpha = d.appear * (REST_ALPHA + bloom * (1 - REST_ALPHA));
                if (alpha < 4e-3 || rad < 0.1)
                    continue;
                ctx.beginPath();
                ctx.arc(d.x, d.y, rad, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${ir},${ig},${ib},${alpha})`;
                ctx.fill();
            }
        };
        build();
        const ro = env.resizeObserver(() => build(false));
        ro.observe(wrap);
        env.clock.add(tick);
        const set = (key, value) => {
            if (key === "pull") {
                if (value && typeof value === "object")
                    P.pull = value;
            }
            else if (key in P) {
                P[key] = Number(value);
            }
        };
        const destroy = () => {
            ac.abort();
            ro.disconnect();
            themeObs.disconnect();
            env.clock.remove(tick);
            introTween?.kill();
            wrap.remove();
        };
        return { destroy, set };
    }
};
