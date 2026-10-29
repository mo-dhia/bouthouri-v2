/** Adapted from Carter Ogunsola's public Lab rotating-gallery example, inspected 2026-10-29.
 * Renderer math and interaction constants retain the measured source contract.
 * The owning gate supplies native scheduling, width coordinates and cleanup. */
import { setDesignStyle } from '../../experiment-dom';
import { cubicEase } from '../../experiment-motion';
import { createGalleryMorph } from "./gallery-morph";
const PLATES = [
    [1, "DRIFT"],
    [4, "FOLD"],
    [7, "BLOOM"],
    [10, "STATIC"],
    [13, "EMBER"],
    [16, "TIDE"],
    [19, "GRAIN"],
    [22, "PRISM"],
    [25, "HUSK"],
    [28, "VAPOR"]
];
const ITEMS = PLATES.map(([n, title]) => ({
    src: `/assets/projects/experiments/prints/franco-${n}.jpg`,
    title
}));
const N = ITEMS.length;
const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mod = (i, n) => (i % n + n) % n;
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));
const SLICE = 360 / N;
const PHASE = 180;
const MOMENTUM_DECAY = 1.3;
const DRAG_SCALE = 0.2;
const SCROLL_SCALE = 0.22;
const LOCK_PX = 5;
const FLIP_DUR = 1.4;
const IMG_EASE = [0.16, 1, 0.3, 1];
const DIGIT_DAMP = 8;
let rgEaseSeq = 0;
const toEase = (_id, b) => cubicEase(b);
const EASES = {
    glide: "power3.inOut",
    snap: "back.inOut(1.4)",
    spring: "back.inOut(2.2)"
};
const DEFAULTS = {
    drift: 4,
    weight: 8,
    perspective: 4e3,
    morph: "spring",
    imgEase: IMG_EASE
};
const carouselIcon = `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.333" width="5.333" height="5.333"/><rect x="5.333" y="10.667" width="5.333" height="5.333"/><rect x="10.667" y="5.333" width="5.333" height="5.333"/><rect y="5.333" width="5.333" height="5.333"/></svg>`;
const gridIcon = `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="0.25" y="0.75" width="5.333" height="5.333"/><rect x="10.583" y="0.75" width="5.333" height="5.333"/><rect x="0.25" y="10" width="5.333" height="5.333"/><rect x="10.583" y="10" width="5.333" height="5.333"/></svg>`;
export const experiment = {
    mount(root, env) {
        const reduced = env.reduced;
        const P = { ...DEFAULTS };
        const easeId = `rgImg-${rgEaseSeq++}`;
        let imgEase = toEase(easeId, P.imgEase);
        const rg = document.createElement("div");
        rg.className = "rg";
        rg.tabIndex = 0;
        rg.dataset.view = "carousel";
        const stage = document.createElement("div");
        stage.className = "rg__stage";
        const carousel = document.createElement("div");
        carousel.className = "rg__carousel";
        const grid = document.createElement("div");
        grid.className = "rg__grid";
        const flips = [];
        const imgs = [];
        const items = [];
        const slots = [];
        ITEMS.forEach((item, i) => {
            const it = document.createElement("div");
            it.className = "rg__item";
            setDesignStyle(it, "zIndex", String(Math.round(500 + Math.cos(i * SLICE * DEG) * 100)));
            const flip = document.createElement("div");
            flip.className = "rg__flip";
            flip.dataset.i = String(i);
            const img = document.createElement("img");
            img.className = "rg__img";
            img.src = item.src;
            img.alt = item.title;
            img.loading = "eager";
            img.decoding = "async";
            flip.appendChild(img);
            it.appendChild(flip);
            carousel.appendChild(it);
            const slot = document.createElement("div");
            slot.className = "rg__slot";
            setDesignStyle(slot, "zIndex", it.style.zIndex);
            grid.appendChild(slot);
            flips.push(flip);
            imgs.push(img);
            items.push(it);
            slots.push(slot);
        });
        const hud = document.createElement("div");
        hud.className = "rg__hud";
        const meta = document.createElement("div");
        meta.className = "rg__meta";
        const odo = document.createElement("div");
        odo.className = "rg__odo";
        odo.setAttribute("aria-hidden", "true");
        const digit = () => `<span class="rg__odo-col"><span class="rg__odo-strip">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<span class="rg__odo-num">${n}</span>`).join("")}</span></span>`;
        odo.innerHTML = digit() + digit();
        const strips = [...odo.querySelectorAll(".rg__odo-strip")];
        const name = document.createElement("div");
        name.className = "rg__name";
        name.innerHTML = `<span class="rg__name-strip">${ITEMS.map((it) => `<span class="rg__name-item">${it.title}</span>`).join("")}</span>`;
        const nameStrip = name.querySelector(".rg__name-strip");
        meta.append(odo, name);
        const views = document.createElement("div");
        views.className = "rg__views";
        views.setAttribute("role", "group");
        views.setAttribute("aria-label", "View");
        const carBtn = document.createElement("button");
        carBtn.type = "button";
        carBtn.className = "rg__view-btn";
        carBtn.dataset.view = "carousel";
        carBtn.dataset.active = "true";
        carBtn.setAttribute("aria-label", "Carousel view");
        carBtn.innerHTML = carouselIcon;
        const gridBtn = document.createElement("button");
        gridBtn.type = "button";
        gridBtn.className = "rg__view-btn";
        gridBtn.dataset.view = "grid";
        gridBtn.dataset.active = "false";
        gridBtn.setAttribute("aria-label", "Grid view");
        gridBtn.innerHTML = gridIcon;
        views.append(carBtn, gridBtn);
        hud.append(meta, views);
        stage.append(carousel, grid);
        rg.append(stage, hud);
        root.appendChild(rg);
        let center = 300;
        let radius = 250;
        let depth = 300;
        const measure = () => {
            const w = stage.clientWidth;
            const h = stage.clientHeight;
            const side = Math.min(w, h);
            center = side / 2;
            radius = clamp(Math.min(h * 0.26, w * 0.2), 140, 210);
            depth = radius * 1.2;
            const cardW = radius * 0.82;
            setDesignStyle(rg, "--rg-card-w", `${cardW}px`);
            setDesignStyle(carousel, "width", setDesignStyle(carousel, "height", `${side}px`));
            setDesignStyle(carousel, "perspective", `${P.perspective}px`);
        };
        let angle = 0;
        let target = 0;
        let momentum = P.drift;
        let dir = 1;
        let dragging = false;
        let view = "carousel";
        let flipping = false;
        let activeIdx = -1;
        let hoverIdx = -1;
        const digitY = [0, 0];
        let dirty = true;
        const layout = () => {
            for (let i = 0; i < N; i++) {
                const a = (i * SLICE + angle + PHASE) * DEG;
                const x = center + radius * Math.sin(a);
                const y = center - radius * Math.cos(a);
                const z = -depth * Math.cos(a);
                setDesignStyle(items[i], "transform", `translate3d(${x}px, ${y}px, ${z}px) translate(-50%, -50%)`);
            }
        };
        const displayIdx = () => hoverIdx >= 0 ? hoverIdx : activeIdx;
        const setImages = () => {
            const active = displayIdx();
            for (let i = 0; i < N; i++) {
                env.motion.tween(imgs[i], {
                    scale: i === active ? 1.06 : 1,
                    duration: reduced ? 0 : 1,
                    ease: imgEase,
                    overwrite: true
                });
            }
        };
        const setMeta = (idx) => {
            const oneBased = idx + 1;
            const tens = Math.floor(oneBased / 10);
            const ones = oneBased % 10;
            digitY[0] = -tens;
            digitY[1] = -ones;
            setDesignStyle(nameStrip, "transform", `translateY(${-idx * 1.1}em)`);
        };
        const layoutMorph = createGalleryMorph(env, stage);
        const setView = (next) => {
            if (next === view)
                return;
            view = next;
            rg.dataset.view = next;
            carBtn.dataset.active = String(next === "carousel");
            gridBtn.dataset.active = String(next === "grid");
            const lead = displayIdx();
            if (next === "carousel") {
                const want = -lead * SLICE;
                angle += ((want - angle) % 360 + 540) % 360 - 180;
                target = angle;
                momentum = P.drift * dir;
                if (activeIdx !== lead) {
                    activeIdx = lead;
                    setMeta(lead);
                    setImages();
                }
                layout();
            }
            if (reduced) {
                flips.forEach((f, i) => (next === "grid" ? slots[i] : items[i]).appendChild(f));
                flipping = false;
                return;
            }
            flipping = true;
            const state = layoutMorph.capture(flips);
            flips.forEach((f, i) => (next === "grid" ? slots[i] : items[i]).appendChild(f));
            const each = next === "grid" ? 0.015 : 0.02;
            const cols = 5;
            layoutMorph.play(state, {
                duration: FLIP_DUR,
                ease: EASES[P.morph],
                absolute: true,
                nested: true,
                scale: true,
                prune: true,
                stagger: (i) => {
                    const d = next === "grid" ? Math.max(Math.abs(i % cols - lead % cols), Math.abs(Math.floor(i / cols) - Math.floor(lead / cols))) : Math.min(mod(i - lead, N), mod(lead - i, N));
                    return d * each;
                },
                onComplete: () => flipping = false
            });
        };
        carBtn.addEventListener("click", () => setView("carousel"));
        gridBtn.addEventListener("click", () => setView("grid"));
        const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (canHover) {
            flips.forEach((flip, i) => {
                flip.addEventListener("pointerenter", () => {
                    if (hoverIdx === i)
                        return;
                    hoverIdx = i;
                    setImages();
                    setMeta(i);
                });
                flip.addEventListener("pointerleave", () => {
                    if (hoverIdx !== i)
                        return;
                    hoverIdx = -1;
                    setImages();
                    setMeta(activeIdx);
                });
            });
        }
        const tick = (_t, dtMs) => {
            const dt = Math.min(dtMs, 64) / 1e3 || 0.016;
            if (view === "carousel" && !flipping) {
                if (dragging) {
                    angle = damp(angle, target, P.weight, dt);
                    dirty = true;
                }
                else if (!reduced) {
                    momentum = damp(momentum, P.drift * dir, MOMENTUM_DECAY, dt);
                    angle += momentum * dt;
                    dirty = true;
                }
                const idx = mod(Math.round(-angle / SLICE), N);
                if (idx !== activeIdx) {
                    activeIdx = idx;
                    if (hoverIdx < 0) {
                        setImages();
                        setMeta(idx);
                    }
                }
            }
            for (let d = 0; d < 2; d++) {
                const cur = Number(strips[d].dataset.y ?? "0");
                const next = reduced ? digitY[d] : damp(cur, digitY[d], DIGIT_DAMP, 1 / 60);
                if (Math.abs(next - cur) > 2e-4) {
                    strips[d].dataset.y = String(next);
                    setDesignStyle(strips[d], "transform", `translateY(${next}em)`);
                    dirty = true;
                }
            }
            if (view === "carousel" && dirty) {
                dirty = false;
                layout();
            }
        };
        const ac = new AbortController();
        const { signal } = ac;
        let startX = 0;
        let startY = 0;
        let pressAngle = 0;
        let axis = null;
        let lastDelta = 0;
        let lastMoveT = 0;
        let vel = 0;
        stage.addEventListener("pointerdown", (e) => {
            if (view !== "carousel" || flipping)
                return;
            if (e.target.closest(".rg__views"))
                return;
            dragging = true;
            axis = null;
            startX = env.clientX(e);
            startY = env.clientY(e);
            pressAngle = angle;
            target = angle;
            lastDelta = 0;
            vel = 0;
            lastMoveT = env.now();
            rg.classList.add("is-dragging");
            stage.setPointerCapture?.(e.pointerId);
        }, { signal });
        window.addEventListener("pointermove", (e) => {
            if (!dragging)
                return;
            const dx = env.clientX(e) - startX;
            const dy = env.clientY(e) - startY;
            if (!axis && Math.hypot(dx, dy) > LOCK_PX)
                axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
            if (!axis)
                return;
            const d = axis === "x" ? dx : dy;
            target = pressAngle + d * DRAG_SCALE;
            const now = env.now();
            const mdt = Math.max(1, now - lastMoveT);
            vel = (d - lastDelta) * DRAG_SCALE / (mdt / 1e3);
            lastDelta = d;
            lastMoveT = now;
        }, { signal });
        const endDrag = () => {
            if (!dragging)
                return;
            dragging = false;
            rg.classList.remove("is-dragging");
            if (Math.abs(vel) > 1) {
                momentum = clamp(vel, -900, 900);
                dir = Math.sign(momentum) || dir;
            }
        };
        window.addEventListener("pointerup", endDrag, { signal });
        window.addEventListener("pointercancel", endDrag, { signal });
        stage.addEventListener("wheel", (e) => {
            if (view !== "carousel" || flipping)
                return;
            e.preventDefault();
            dragging = true;
            target = (dragging ? target : angle) + e.deltaY * SCROLL_SCALE;
            dir = Math.sign(e.deltaY) || dir;
            env.clearTimeout(wheelIdle);
            wheelIdle = env.setTimeout(() => {
                dragging = false;
                momentum = clamp(e.deltaY * SCROLL_SCALE * 8, -900, 900);
            }, 90);
        }, { passive: false, signal });
        let wheelIdle;
        rg.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                target = angle - SLICE;
                angle = damp(angle, target, 1, 1);
                dragging = true;
                env.setTimeout(() => dragging = false, 60);
            }
            else if (e.key === "ArrowRight") {
                e.preventDefault();
                target = angle + SLICE;
                dragging = true;
                env.setTimeout(() => dragging = false, 60);
            }
            else if (e.key === "g" || e.key === "G") {
                setView(view === "grid" ? "carousel" : "grid");
            }
        }, { signal });
        measure();
        activeIdx = mod(Math.round(-angle / SLICE), N);
        setMeta(activeIdx);
        setImages();
        layout();
        const ro = env.resizeObserver(() => {
            measure();
            dirty = true;
        });
        ro.observe(stage);
        env.clock.add(tick);
        if (!reduced) {
            env.motion.set(flips, { clipPath: "inset(100%)", willChange: "clip-path" });
            env.motion.set([meta, views], { opacity: 0, y: 26 });
            env.motion.tween(flips, { delay: .1,
                clipPath: "inset(0%)",
                duration: 1.5,
                stagger: 0.07,
                ease: "expo.out",
                clearProps: "clipPath,willChange"
            });
            env.motion.tween(meta, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", delay: .2 });
            env.motion.tween(views, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", delay: .55 });
        }
        const set = (key, value) => {
            if (key === "morph") {
                P.morph = String(value);
            }
            else if (key === "imgEase") {
                if (Array.isArray(value) && value.length === 4) {
                    P.imgEase = value;
                    imgEase = toEase(easeId, P.imgEase);
                }
            }
            else if (key === "perspective") {
                P.perspective = Number(value);
                setDesignStyle(carousel, "perspective", `${P.perspective}px`);
            }
            else if (key in P) {
                P[key] = Number(value);
            }
        };
        const destroy = () => {
            layoutMorph.dispose();
            ac.abort();
            ro.disconnect();
            env.clock.remove(tick);
            env.clearTimeout(wheelIdle);
            env.motion.cancel([...imgs, ...items, ...flips, meta, views, rg]);
            rg.remove();
        };
        return { destroy, set };
    }
};
