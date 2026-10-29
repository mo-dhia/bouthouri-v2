/** Adapted from Carter Ogunsola's public Lab heart example, inspected 2026-10-29.
 * Renderer math and interaction constants retain the measured source contract.
 * The owning gate supplies native scheduling, width coordinates and cleanup. */
import { setDesignStyle } from '../../experiment-dom';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const A = 2.25;
const B = 0.1125;
const surf = (x, t, z) => {
    const Q = x * x + A * t + z * z - 1;
    return Q * Q * Q - z * z * z * (x * x + B * t);
};
const MAX_SCALE = 1.7;
const SPIN_CLAMP = 18;
const DEFAULTS = {
    spin: 0.05,
    coast: 2,
    focal: 1500
};
const LIGHT = (() => {
    const l = [-0.35, 0.5, 0.74];
    const n = Math.hypot(l[0], l[1], l[2]);
    return [l[0] / n, l[1] / n, l[2] / n];
})();
const BANDS = 24;
export const experiment = {
    mount(root, env) {
        const reduced = env.reduced;
        const CFG = { ...DEFAULTS };
        const wrap = document.createElement("div");
        wrap.className = "heart";
        const canvas = document.createElement("canvas");
        wrap.appendChild(canvas);
        root.appendChild(wrap);
        const ctx = canvas.getContext("2d");
        let ink = "30,30,30";
        const resolveInk = () => {
            const probe = document.createElement("span");
            setDesignStyle(probe, "cssText", "color:var(--ink);position:absolute;visibility:hidden");
            wrap.appendChild(probe);
            const m = getComputedStyle(probe).color.match(/\d+/g);
            probe.remove();
            if (m)
                ink = `${m[0]},${m[1]},${m[2]}`;
        };
        resolveInk();
        const themeObs = new MutationObserver(resolveInk);
        themeObs.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme", "class"]
        });
        const mobile = env.designWidth <= 1024;
        const NX = mobile ? 70 : 100;
        const NZ = mobile ? 84 : 120;
        const X0 = -1.35;
        const X1 = 1.35;
        const Z0 = -1.15;
        const Z1 = 1.45;
        const px = [];
        const py = [];
        const pz = [];
        const nxA = [];
        const nyA = [];
        const nzA = [];
        for (let i = 0; i < NX; i++) {
            const x = X0 + (X1 - X0) * i / (NX - 1);
            for (let j = 0; j < NZ; j++) {
                const z = Z0 + (Z1 - Z0) * j / (NZ - 1);
                if (surf(x, 0, z) >= 0)
                    continue;
                let a = 0;
                let b = 0;
                let found = false;
                for (let s = 1; s <= 150; s++) {
                    const t2 = s / 150;
                    if (surf(x, t2, z) >= 0) {
                        a = (s - 1) / 150;
                        b = t2;
                        found = true;
                        break;
                    }
                }
                if (!found)
                    continue;
                for (let k = 0; k < 22; k++) {
                    const m = (a + b) / 2;
                    if (surf(x, m, z) < 0)
                        a = m;
                    else
                        b = m;
                }
                const t = (a + b) / 2;
                const y = Math.sqrt(t);
                const Q = x * x + A * t + z * z - 1;
                const Q2 = Q * Q;
                const gx = 2 * x * (3 * Q2 - z * z * z);
                const gz = 6 * z * Q2 - 3 * z * z * (x * x + B * t);
                const gy = y * (13.5 * Q2 - 0.225 * z * z * z);
                for (const sign of [1, -1]) {
                    px.push(x);
                    py.push(z);
                    pz.push(sign * y);
                    nxA.push(gx);
                    nyA.push(gz);
                    nzA.push(sign * gy);
                }
            }
        }
        const COUNT = px.length;
        let cx0 = 0;
        let cy0 = 0;
        let cz0 = 0;
        for (let k = 0; k < COUNT; k++) {
            cx0 += px[k];
            cy0 += py[k];
            cz0 += pz[k];
        }
        cx0 /= COUNT;
        cy0 /= COUNT;
        cz0 /= COUNT;
        let ext = 1e-6;
        let maxR = 1e-6;
        for (let k = 0; k < COUNT; k++) {
            px[k] -= cx0;
            py[k] -= cy0;
            pz[k] -= cz0;
            ext = Math.max(ext, Math.abs(px[k]), Math.abs(py[k]), Math.abs(pz[k]));
            maxR = Math.max(maxR, Math.hypot(px[k], pz[k]));
        }
        const P = new Float32Array(COUNT * 3);
        const NRM = new Float32Array(COUNT * 3);
        const band = new Uint8Array(COUNT);
        for (let k = 0; k < COUNT; k++) {
            P[k * 3] = px[k] / ext;
            P[k * 3 + 1] = py[k] / ext;
            P[k * 3 + 2] = pz[k] / ext;
            const nl = Math.hypot(nxA[k], nyA[k], nzA[k]) || 1;
            NRM[k * 3] = nxA[k] / nl;
            NRM[k * 3 + 1] = nyA[k] / nl;
            NRM[k * 3 + 2] = nzA[k] / nl;
            const rNorm = Math.hypot(px[k], pz[k]) / maxR;
            band[k] = Math.min(BANDS - 1, rNorm * BANDS | 0);
        }
        let W = 0;
        let H = 0;
        let fit = 200;
        let cx = 0;
        let cy = 0;
        const measure = () => {
            W = wrap.clientWidth;
            H = wrap.clientHeight;
            const dpr = Math.min(env.pixelRatio || 1, 2);
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            fit = Math.min(W * 0.4, H * 0.46);
            cx = W / 2;
            cy = H / 2;
        };
        let w = reduced ? 0 : 0.35;
        let yaw = 0;
        let pitch = 0.14;
        const bandK = new Float64Array(BANDS);
        const bandRate = new Float64Array(BANDS);
        for (let bI = 0; bI < BANDS; bI++)
            bandRate[bI] = 1 / (0.72 - 0.38 * (bI / BANDS));
        const cosK = new Float64Array(BANDS);
        const sinK = new Float64Array(BANDS);
        const ac = new AbortController();
        const { signal } = ac;
        let dragging = false;
        let lastX = 0;
        wrap.addEventListener("pointerdown", (e) => {
            dragging = true;
            lastX = env.clientX(e);
            wrap.classList.add("is-drag");
            wrap.setPointerCapture?.(e.pointerId);
        }, { signal });
        wrap.addEventListener("pointermove", (e) => {
            if (!dragging)
                return;
            w = clamp(w + (env.clientX(e) - lastX) * CFG.spin, -SPIN_CLAMP, SPIN_CLAMP);
            lastX = env.clientX(e);
        }, { signal });
        const end = () => {
            dragging = false;
            wrap.classList.remove("is-drag");
        };
        wrap.addEventListener("pointerup", end, { signal });
        wrap.addEventListener("pointercancel", end, { signal });
        const [lx, ly, lz] = LIGHT;
        const tick = (time, dtMs) => {
            const dt = Math.min(dtMs, 40) / 1e3 || 0.016;
            if (!reduced) {
                w *= Math.exp(-dt / CFG.coast);
                yaw += w * dt;
                pitch += (0.14 + 0.05 * Math.sin(time * 1e-4) - pitch) * Math.min(1, dt * 4);
            }
            else {
                yaw += w * dt;
            }
            const cp = Math.cos(pitch);
            const sp = Math.sin(pitch);
            for (let bI = 0; bI < BANDS; bI++) {
                if (reduced)
                    bandK[bI] = yaw;
                else
                    bandK[bI] += (yaw - bandK[bI]) * Math.min(1, dt * bandRate[bI]);
                cosK[bI] = Math.cos(bandK[bI]);
                sinK[bI] = Math.sin(bandK[bI]);
            }
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = `rgb(${ink})`;
            for (let k = 0; k < COUNT; k++) {
                const b = band[k];
                const ck = cosK[b];
                const sk = sinK[b];
                const X = P[k * 3];
                const Y = P[k * 3 + 1];
                const Z = P[k * 3 + 2];
                const xr = X * ck + Z * sk;
                const zr = -X * sk + Z * ck;
                const yr2 = Y * cp - zr * sp;
                const zr2 = Y * sp + zr * cp;
                const nX = NRM[k * 3];
                const nY = NRM[k * 3 + 1];
                const nZ = NRM[k * 3 + 2];
                const nxr = nX * ck + nZ * sk;
                const nzr = -nX * sk + nZ * ck;
                const nzr2 = nY * sp + nzr * cp;
                if (nzr2 < 0.02)
                    continue;
                const nyr2 = nY * cp - nzr * sp;
                const depth = zr2 * fit;
                const scale = Math.min(MAX_SCALE, CFG.focal / (CFG.focal - depth));
                const sx = cx + xr * fit * scale;
                const sy = cy - yr2 * fit * scale;
                const zd = clamp(0.5 + zr2 * 0.5, 0, 1);
                const rad = Math.min(1.6, scale) * (0.2 + zd);
                if (rad < 0.3)
                    continue;
                const lam = 0.32 + 0.6 * Math.max(0, nxr * lx + nyr2 * ly + nzr2 * lz);
                const tier = lam < 0.26 ? 0.42 : lam > 0.62 ? 1 : 0.68;
                ctx.globalAlpha = Math.min(0.5, tier * (0.4 + 0.6 * zd));
                ctx.beginPath();
                ctx.arc(sx, sy, rad, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        };
        measure();
        const ro = env.resizeObserver(measure);
        ro.observe(wrap);
        env.clock.add(tick);
        const set = (key, value) => {
            if (key in CFG)
                CFG[key] = Number(value);
        };
        const destroy = () => {
            ac.abort();
            ro.disconnect();
            themeObs.disconnect();
            env.clock.remove(tick);
            wrap.remove();
        };
        return { destroy, set };
    }
};
