/** Adapted from Carter Ogunsola's public Lab paste-up example, inspected 2026-10-29.
 * Renderer math and interaction constants retain the measured source contract.
 * The owning gate supplies native scheduling, width coordinates and cleanup. */
import { setDesignStyle, referenceRect } from '../../experiment-dom';
const previewUrl = key => `/assets/projects/experiments/prints/${key.includes("FRANCO") ? "franco" : "fanette"}-${key.match(/_(\d+)\.jpg$/)[1]}.jpg`;
const MeshMode = { on: false };
const liveInk = () => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#f2f1ee";
function meshTile(w, h, o = {}) {
    const W = Math.max(2, Math.round(w));
    const H = Math.max(2, Math.round(h));
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    const ink = o.ink ?? liveInk();
    const ground = o.ground === void 0 ? null : o.ground;
    if (ground) {
        g.fillStyle = ground;
        g.fillRect(0, 0, W, H);
    }
    const short = Math.min(W, H);
    const pitch = o.step ?? short / 9;
    const cols = Math.max(1, Math.round(W / pitch));
    const rows = Math.max(1, Math.round(H / pitch));
    const px = W / cols;
    const py = H / rows;
    const weight = o.weight ?? Math.max(1, Math.round(short / 480));
    g.strokeStyle = ink;
    g.globalAlpha = o.alpha ?? 0.72;
    g.lineWidth = weight;
    g.lineCap = "butt";
    const snap = (v, max) => Math.min(max - weight / 2, Math.max(weight / 2, Math.round(v - weight / 2) + weight / 2));
    const rad = Math.min(o.radius ?? 0, short / 2);
    if (rad > 0) {
        g.save();
        g.beginPath();
        g.roundRect(0, 0, W, H, rad);
        g.clip();
    }
    g.beginPath();
    for (let i = 0; i <= cols; i++) {
        const x = snap(i * px, W);
        g.moveTo(x, 0);
        g.lineTo(x, H);
    }
    for (let j = 0; j <= rows; j++) {
        const y = snap(j * py, H);
        g.moveTo(0, y);
        g.lineTo(W, y);
    }
    g.stroke();
    if (rad > 0) {
        g.restore();
        g.beginPath();
        g.roundRect(weight / 2, weight / 2, W - weight, H - weight, Math.max(0, rad - weight / 2));
        g.stroke();
    }
    g.globalAlpha = 1;
    return c;
}
const KEYS = [
    ...[22, 25, 27].map((n) => `dts/unwrapped/DTS_Unwrapped_by_FRANCO_DUPUY_${n}.jpg`),
    ...[6, 17, 44].map((n) => `dts/landing-site/DTS_Landing_Site_by_Fanette_Guilloud_${n}.jpg`)
];
const N = KEYS.length;
const IDS = KEYS.map((_, i) => `p${i}`);
const DEFAULTS = {
    damp: 0.085,
    bend: 1,
    fetch: 0,
    memory: 1
};
const DPR_CAP = 1.5;
const BEND_PX = 0.4;
const VEL_MAX = 48;
const GRID = 16;
const VERT = `#version 300 es
in vec2 aUv;
uniform vec4 uRect;  // x, y, w, h — css px, y down
uniform vec2 uRes;   // css px
uniform vec2 uVel;   // smoothed px/frame
uniform float uBend;
out vec2 vUv;
void main() {
  vUv = aUv;
  vec2 p = uRect.xy + aUv * uRect.zw;
  // Paper flex: the center leads, the edges trail the motion. Zero at rest.
  p.x -= uVel.x * uBend * (1.0 - sin(3.14159 * aUv.x));
  p.y -= uVel.y * uBend * (1.0 - sin(3.14159 * aUv.y));
  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
}`;
const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImg;
uniform vec2 uImgRes;
uniform vec4 uRect;
uniform float uAlpha;
in vec2 vUv;
out vec4 outColor;
void main() {
  // object-fit: cover crop against the plane's live aspect.
  float rc = uRect.z / max(uRect.w, 1.0);
  float ri = uImgRes.x / uImgRes.y;
  vec2 uv = vUv;
  if (rc > ri) { float s = ri / rc; uv.y = (uv.y - 0.5) * s + 0.5; }
  else { float s = rc / ri; uv.x = (uv.x - 0.5) * s + 0.5; }
  // The photo as-is — no treatment fights the flight.
  vec4 t = texture(uImg, uv);
  float a = uAlpha * t.a; // the mesh tile's transparent ground stays open
  outColor = vec4(t.rgb * a, a);
}`;
const pad = (n) => String(n).padStart(2, "0");
export const experiment = {
    mount(root, env) {
        const reduced = env.reduced;
        const P = { ...DEFAULTS };
        const wrap = document.createElement("div");
        wrap.className = "pu";
        setDesignStyle(wrap, "--pu-n", String(N));
        setDesignStyle(wrap, "--pu-rail", String(N - 1));
        const slot = (id, tag) => `<div class="pu__slot" data-print="${id}" tabindex="0" role="button" aria-label="print ${Number(id.slice(1)) + 1}"><span class="pu__tag">${tag}</span></div>`;
        wrap.innerHTML = `
      <nav class="pu__tabs">
        ${["index", "spread", "strip"].map((b, i) => `<button class="pu__tab${i === 0 ? " is-on" : ""}" data-board="${b}">${b}</button>`).join("")}
        <i class="pu__tabline"></i>
      </nav>
      <div class="pu__field">
        <div class="pu__board pu__index is-on">
          ${IDS.map((id, i) => slot(id, `PRINT::${pad(i + 1)}`)).join("")}
        </div>
        <div class="pu__board pu__spread">
          ${slot("p0", "PLATE")}
          <div class="pu__rail">
            ${IDS.slice(1).map((id) => slot(id, "")).join("")}
          </div>
        </div>
        <div class="pu__board pu__strip">
          ${IDS.map((id, i) => slot(id, `${pad(i + 1)}A`)).join("")}
        </div>
        <canvas class="pu__canvas" aria-hidden="true"></canvas>
      </div>
      <div class="pu__hud">
        <span data-pu-board>BOARD::INDEX</span><span>A PRINT BELONGS TO ITS ID</span>
      </div>`;
        root.append(wrap);
        const field = wrap.querySelector(".pu__field");
        const canvas = wrap.querySelector(".pu__canvas");
        const boards = {
            index: wrap.querySelector(".pu__index"),
            spread: wrap.querySelector(".pu__spread"),
            strip: wrap.querySelector(".pu__strip")
        };
        const tabs = [...wrap.querySelectorAll(".pu__tab")];
        const tabline = wrap.querySelector(".pu__tabline");
        const hudBoard = wrap.querySelector("[data-pu-board]");
        const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
        if (!gl) {
            canvas.remove();
            wrap.querySelectorAll("[data-print]").forEach((el) => {
                const img = new Image();
                img.src = previewUrl(KEYS[Number(el.dataset.print.slice(1))], 720);
                el.prepend(img);
            });
        }
        let active = "index";
        let hero = "p0";
        const claims = new Map();
        const refreshClaims = () => {
            boards[active].querySelectorAll("[data-print]").forEach((el) => claims.set(el.dataset.print, el));
        };
        refreshClaims();
        let upgradePlate = () => {
        };
        const assignSpread = (id) => {
            hero = id;
            upgradePlate(Number(id.slice(1)));
            const slots = boards.spread.querySelectorAll("[data-print]");
            const rest = IDS.filter((p) => p !== id);
            slots.forEach((el, i) => el.dataset.print = i === 0 ? id : rest[i - 1]);
            if (!gl)
                slots.forEach((el) => {
                    const img = el.querySelector("img");
                    if (img)
                        img.src = previewUrl(KEYS[Number(el.dataset.print.slice(1))], 720);
                });
        };
        const planes = IDS.map(() => ({
            cur: { x: 0, y: 0, w: 0, h: 0 },
            tar: { x: 0, y: 0, w: 0, h: 0 },
            vel: { x: 0, y: 0 },
            alpha: 0,
            placed: false
        }));
        const measure = () => {
            const fr = referenceRect(field);
            IDS.forEach((id, i) => {
                const el = claims.get(id);
                if (!el)
                    return;
                const r = referenceRect(el);
                if (r.width < 1 && P.memory)
                    return;
                const p = planes[i];
                p.tar = { x: r.left - fr.left, y: r.top - fr.top, w: r.width, h: r.height };
                if (!p.placed || reduced) {
                    p.cur = { ...p.tar };
                    p.placed = true;
                }
            });
            wake();
        };
        let swapT = 0;
        const syncTabs = () => {
            tabs.forEach((t) => t.classList.toggle("is-on", t.dataset.board === active));
            const on = tabs.find((t) => t.dataset.board === active);
            setDesignStyle(tabline, "transform", `translate3d(${on.offsetLeft}px, 0, 0)`);
            setDesignStyle(tabline, "width", `${on.offsetWidth}px`);
            hudBoard.textContent = `BOARD::${active.toUpperCase()}`;
        };
        const go = (board, plateId) => {
            env.clearTimeout(swapT);
            boards[active].classList.remove("is-on");
            measure();
            active = board;
            syncTabs();
            const land = () => {
                if (board === "spread")
                    assignSpread(plateId ?? hero);
                boards[board].classList.add("is-on");
                refreshClaims();
                measure();
            };
            if (P.fetch > 0 && !reduced)
                swapT = window.setTimeout(land, P.fetch);
            else
                land();
        };
        tabs.forEach((t) => t.addEventListener("click", () => {
            if (t.dataset.board !== active)
                go(t.dataset.board);
        }));
        const onFieldClick = (e) => {
            const el = e.target.closest("[data-print]");
            if (!el)
                return;
            const id = el.dataset.print;
            if (active !== "spread")
                go("spread", id);
            else if (id === hero)
                go("index");
            else {
                assignSpread(id);
                refreshClaims();
                measure();
            }
        };
        field.addEventListener("click", onFieldClick);
        const onFieldKey = (e) => {
            if (e.key !== "Enter" && e.key !== " ")
                return;
            const el = e.target.closest("[data-print]");
            if (!el)
                return;
            e.preventDefault();
            el.click();
        };
        field.addEventListener("keydown", onFieldKey);
        const ro = env.resizeObserver(() => {
            size();
            measure();
        });
        ro.observe(field);
        if (!gl) {
            syncTabs();
            return () => {
                env.clearTimeout(swapT);
                ro.disconnect();
                wrap.remove();
            };
        }
        const sh = (t, src) => {
            const s = gl.createShader(t);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
                console.warn("[paste-up]", gl.getShaderInfoLog(s));
            return s;
        };
        const prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        gl.useProgram(prog);
        const u = {};
        for (const n of ["uRect", "uRes", "uVel", "uBend", "uImg", "uImgRes", "uAlpha"])
            u[n] = gl.getUniformLocation(prog, n);
        const verts = [];
        const idx = [];
        for (let y = 0; y <= GRID; y++)
            for (let x = 0; x <= GRID; x++)
                verts.push(x / GRID, y / GRID);
        for (let y = 0; y < GRID; y++)
            for (let x = 0; x < GRID; x++) {
                const a = y * (GRID + 1) + x;
                idx.push(a, a + 1, a + GRID + 1, a + 1, a + GRID + 2, a + GRID + 1);
            }
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
        const aUv = gl.getAttribLocation(prog, "aUv");
        gl.enableVertexAttribArray(aUv);
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const texes = KEYS.map((key, i) => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, meshTile(540, 720, { seed: 31 + i * 7 }));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            const rec = { tex, w: 540, h: 720, ready: true, hi: false };
            if (MeshMode.on)
                return rec;
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = previewUrl(key, 720);
            img.decode().then(() => {
                if (env.disposed)
                    return;
                rec.w = img.naturalWidth;
                rec.h = img.naturalHeight;
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                rec.ready = true;
                wake();
            }).catch(() => {
            });
            return rec;
        });
        upgradePlate = (i) => {
            const t = texes[i];
            if (!t || t.hi || MeshMode.on)
                return;
            t.hi = true;
            const im = new Image();
            im.crossOrigin = "anonymous";
            im.src = previewUrl(KEYS[i], 1440);
            im.decode().then(() => {
                if (env.disposed)
                    return;
                t.w = im.naturalWidth;
                t.h = im.naturalHeight;
                gl.bindTexture(gl.TEXTURE_2D, t.tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
                wake();
            }).catch(() => {
                t.hi = false;
            });
        };
        let viewW = 1;
        let viewH = 1;
        const size = () => {
            const dpr = Math.min(env.pixelRatio || 1, DPR_CAP);
            const r = referenceRect(field);
            viewW = r.width;
            viewH = r.height;
            canvas.width = Math.max(1, Math.round(r.width * dpr));
            canvas.height = Math.max(1, Math.round(r.height * dpr));
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        size();
        let awake = true;
        function wake() {
            awake = true;
        }
        const draw = () => {
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform2f(u.uRes, viewW, viewH);
            gl.uniform1i(u.uImg, 0);
            gl.activeTexture(gl.TEXTURE0);
            const order = planes.map((p, i) => ({ i, s: Math.abs(p.vel.x) + Math.abs(p.vel.y) })).sort((a, b) => a.s - b.s);
            for (const { i } of order) {
                const p = planes[i];
                if (!p.placed || p.alpha <= 1e-3 || p.cur.w < 0.5)
                    continue;
                const t = texes[i];
                gl.bindTexture(gl.TEXTURE_2D, t.tex);
                gl.uniform4f(u.uRect, p.cur.x, p.cur.y, p.cur.w, p.cur.h);
                gl.uniform2f(u.uImgRes, t.w, t.h);
                gl.uniform2f(u.uVel, Math.max(-VEL_MAX, Math.min(VEL_MAX, p.vel.x)) * BEND_PX, Math.max(-VEL_MAX, Math.min(VEL_MAX, p.vel.y)) * BEND_PX);
                gl.uniform1f(u.uBend, reduced ? 0 : P.bend);
                gl.uniform1f(u.uAlpha, p.alpha);
                gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
            }
        };
        const tick = () => {
            if (!awake)
                return;
            let moving = false;
            const k = reduced ? 1 : P.damp;
            for (let i = 0; i < N; i++) {
                const p = planes[i];
                if (!p.placed)
                    continue;
                const px = p.cur.x;
                const py = p.cur.y;
                ["x", "y", "w", "h"].forEach((a) => {
                    p.cur[a] += (p.tar[a] - p.cur[a]) * k;
                    if (Math.abs(p.tar[a] - p.cur[a]) < 0.05)
                        p.cur[a] = p.tar[a];
                    else
                        moving = true;
                });
                p.vel.x = p.vel.x * 0.8 + (p.cur.x - px) * 0.2;
                p.vel.y = p.vel.y * 0.8 + (p.cur.y - py) * 0.2;
                if (Math.abs(p.vel.x) + Math.abs(p.vel.y) > 0.05)
                    moving = true;
                else
                    p.vel.x = p.vel.y = 0;
                const aTar = texes[i].ready ? 1 : 0;
                p.alpha += (aTar - p.alpha) * 0.12;
                if (Math.abs(aTar - p.alpha) < 0.01)
                    p.alpha = aTar;
                else
                    moving = true;
            }
            draw();
            if (!moving)
                awake = false;
        };
        env.clock.add(tick);
        measure();
        syncTabs();
        return {
            destroy() {
                env.clearTimeout(swapT);
                env.clock.remove(tick);
                ro.disconnect();
                field.removeEventListener("click", onFieldClick);
                field.removeEventListener("keydown", onFieldKey);
                gl.getExtension("WEBGL_lose_context")?.loseContext();
                wrap.remove();
            },
            set(key, value) {
                if (key === "memory") {
                    P.memory = value === "on" || value === true ? 1 : 0;
                }
                else if (key in P) {
                    P[key] = Number(value);
                    if (key === "damp" || key === "bend")
                        wake();
                }
            }
        };
    }
};
