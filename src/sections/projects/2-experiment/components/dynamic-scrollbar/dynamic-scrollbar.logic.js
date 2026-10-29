/** Adapted from Carter Ogunsola's public Lab dynamic-scrollbar example, inspected 2026-10-29.
 * Renderer math and interaction constants retain the measured source contract.
 * The owning gate supplies native scheduling, width coordinates and cleanup. */
import { setDesignStyle, referenceRect } from '../../experiment-dom';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const damp = (cur, t, l, dt) => cur + (t - cur) * (1 - Math.exp(-l * dt));
const THUMB_W = 5;
const THUMB_H = 64;
const MIN_W = 50;
const MIN_H = 188;
const MUSIC_W = 264;
const MUSIC_H = 397;
const RADIUS = 30;
const BG_MORPH = 0.8;
const DEFAULTS = {
    morphIn: 0.65,
    morphOut: 0.6,
    restDelay: 150
};
const C_REST = "#d5d5d5";
const C_INK = "#000000";
const TRACKS = [
    { src: "/assets/projects/experiments/music/deep-abstract-ambient_snowcap-401656.mp3", title: "D.A.A.S", artist: "Umbrella", cover: "/assets/projects/experiments/covers/umbrella.jpg" },
    { src: "/assets/projects/experiments/music/embrace-364091.mp3", title: "Embrace", artist: "Evgeny Bardyuzha", cover: "/assets/projects/experiments/covers/embrace.jpg" },
    { src: "/assets/projects/experiments/music/running-night-393139.mp3", title: "Running Night", artist: "Alex Make Music", cover: "/assets/projects/experiments/covers/running-night.jpg" }
];
const SECTIONS = [
    { kind: "min", text: "Scroll the page :: the bar on the right wakes up" },
    { kind: "min", text: "Pause, or hover it, and it blooms into a clock" },
    { kind: "min", text: "Normal scrolling still works :: it just has a pulse" },
    { kind: "music", text: "A note appears. Tap it :: the player is live" },
    { kind: "music", text: "Now playing. Hover to expand, drag the timeline to seek" },
    { kind: "min", text: "Back to default :: clock only, no player" }
];
const clockSvg = `<svg viewBox="0 0 20 20" fill="none" class="sb__clock-face"><rect data-hour x="9.5" y="4" width="1" height="5.5" rx="0.5" fill="currentColor"/><rect data-min x="9.5" y="2" width="1" height="8" rx="0.5" fill="currentColor"/><circle cx="10" cy="10" r="1.25" fill="currentColor"/></svg>`;
const noteSvg = `<svg viewBox="0 0 20 20" fill="none"><path d="M19.5 14C19.5 15.933 17.933 17.5 16 17.5C14.067 17.5 12.5 15.933 12.5 14C12.5 12.067 14.067 10.5 16 10.5C16.98 10.5 17.865 10.903 18.5 11.552V5.59L7.5 7.423V16C7.5 17.933 5.933 19.5 4 19.5C2.067 19.5 0.5 17.933 0.5 16C0.5 14.067 2.067 12.5 4 12.5C4.98 12.5 5.865 12.903 6.5 13.552V2.576L19.5 0.41V14Z" fill="currentColor"/></svg>`;
const waveSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><line x1="2" y1="15" x2="2" y2="9"/><line x1="7" y1="19.5" x2="7" y2="4.5"/><line x1="12" y1="22" x2="12" y2="2"/><line x1="17" y1="19.5" x2="17" y2="4.5"/><line x1="22" y1="15" x2="22" y2="9"/></svg>`;
const prevSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="10 5 1 12 10 19"/><polygon points="22 5 13 12 22 19"/></svg>`;
const nextSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="14 19 23 12 14 5"/><polygon points="2 19 11 12 2 5"/></svg>`;
const playSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5.2 12 5.2 3 13 7.5 20.8 12 13 16.5 5.2 21"/></svg>`;
const pauseSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5.5" width="3" height="13" rx="0.4"/><rect x="14.5" y="5.5" width="3" height="13" rx="0.4"/></svg>`;
export const experiment = {
    mount(root, env) {
        const reduced = env.reduced;
        const P = { ...DEFAULTS };
        const ac = new AbortController();
        const { signal } = ac;
        const sb = document.createElement("div");
        sb.className = "sb";
        const scroll = document.createElement("div");
        scroll.className = "sb__scroll";
        const track = document.createElement("div");
        track.className = "sb__track";
        SECTIONS.forEach((s) => {
            const sec = document.createElement("section");
            sec.className = "sb__section";
            sec.dataset.kind = s.kind;
            sec.innerHTML = `<p class="sb__caption">${s.text}</p>`;
            track.appendChild(sec);
        });
        scroll.appendChild(track);
        const bar = document.createElement("div");
        bar.className = "sb__bar";
        const thumb = document.createElement("div");
        thumb.className = "sb__thumb";
        thumb.innerHTML = `
      <div class="sb__inner">
        <div class="sb__min">
          <div class="sb__min-top">
            <div class="sb__clock">${clockSvg}</div>
            <div class="sb__note" role="button" aria-label="Open player">${noteSvg}</div>
          </div>
          <div class="sb__time"><span data-time>00:00</span><span class="ampm" data-ampm>AM</span></div>
        </div>
        <div class="sb__music">
          <div class="sb__cover"><img alt="" decoding="async"/></div>
          <div class="sb__player">
            <div class="sb__head">
              <div class="sb__meta"><span class="sb__title" data-title></span><span class="sb__artist" data-artist></span></div>
              <div class="sb__wave">${waveSvg}</div>
            </div>
            <div class="sb__timeline" data-timeline><div class="sb__progress" data-progress></div></div>
            <div class="sb__controls">
              <div class="sb__ctrl sb__ctrl--sm" data-prev role="button" aria-label="Previous">${prevSvg}</div>
              <div class="sb__toggle">
                <div class="sb__ctrl sb__play" data-play role="button" aria-label="Play">${playSvg}</div>
                <div class="sb__ctrl sb__pause" data-pause role="button" aria-label="Pause">${pauseSvg}</div>
              </div>
              <div class="sb__ctrl sb__ctrl--sm" data-next role="button" aria-label="Next">${nextSvg}</div>
            </div>
            <div class="sb__credits">
              <p class="sb__credit">Icons :: <a href="https://angularicons.com/" target="_blank" rel="noreferrer">Angular Icons</a> / <a href="https://www.osmo.supply/" target="_blank" rel="noreferrer">Osmo</a></p>
              <p class="sb__credit">Original /Motion :: Xavier Jac (<a href="https://x.com/KMkota0" target="_blank" rel="noreferrer">@KMkota0</a>)</p>
            </div>
          </div>
        </div>
      </div>`;
        bar.appendChild(thumb);
        sb.append(scroll, bar);
        root.appendChild(sb);
        const q = (s) => thumb.querySelector(s);
        const minEl = q(".sb__min");
        const musicEl = q(".sb__music");
        const hourHand = q("[data-hour]");
        const minHand = q("[data-min]");
        const timeEl = q("[data-time]");
        const ampmEl = q("[data-ampm]");
        const tickClock = () => {
            const d = new Date();
            const h = d.getHours();
            const m = d.getMinutes();
            env.motion.tween(hourHand, { rotation: h % 12 * 30 + m * 0.5, transformOrigin: "center bottom", duration: 0.5, ease: "power2.out", overwrite: "auto" });
            env.motion.tween(minHand, { rotation: m * 6, transformOrigin: "center bottom", duration: 0.5, ease: "power2.out", overwrite: "auto" });
            timeEl.textContent = `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            ampmEl.textContent = h >= 12 ? "PM" : "AM";
        };
        tickClock();
        const clockInt = window.setInterval(tickClock, 1e3);
        const audio = env.audio();
        audio.preload = "none";
        let trackIdx = 0;
        const coverImg = q(".sb__cover img");
        const titleEl = q("[data-title]");
        const artistEl = q("[data-artist]");
        const progressEl = q("[data-progress]");
        const timelineEl = q("[data-timeline]");
        const playBtn = q("[data-play]");
        const pauseBtn = q("[data-pause]");
        env.motion.set(minEl, { x: "20%" });
        env.motion.set(musicEl, { x: "100%" });
        env.motion.set(pauseBtn, { scale: .5 });
        const waveLines = [...thumb.querySelectorAll(".sb__wave line")];
        let waveTl = null;
        const startWave = () => {
            waveTl?.kill();
            const waveHandles = [];
            waveTl = { kill: () => waveHandles.forEach(handle => handle.kill()) };
            waveLines.forEach((ln, i) => {
                const y1 = +ln.getAttribute("y1");
                const y2 = +ln.getAttribute("y2");
                const h = Math.abs(y2 - y1) * 0.4;
                waveHandles.push(env.motion.tween(ln, { attr: { y1: y1 - h, y2: y2 + h }, duration: 0.4 + i * 0.05, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * .08 }));
            });
        };
        const stopWave = () => {
            waveTl?.kill();
            waveTl = null;
            waveLines.forEach((ln) => {
                const y1 = ln.dataset.y1;
                const y2 = ln.dataset.y2;
                env.motion.tween(ln, { attr: { y1, y2 }, duration: 0.3, ease: "power2.out" });
            });
        };
        waveLines.forEach((ln) => {
            ln.dataset.y1 = ln.getAttribute("y1");
            ln.dataset.y2 = ln.getAttribute("y2");
        });
        const load = (i, play = false) => {
            trackIdx = (i + TRACKS.length) % TRACKS.length;
            const t = TRACKS[trackIdx];
            audio.src = t.src;
            coverImg.src = t.cover;
            titleEl.textContent = t.title;
            artistEl.textContent = t.artist;
            env.motion.set(progressEl, { scaleX: 0 });
            if (play)
                audio.play().catch(() => {
                });
        };
        audio.addEventListener("play", () => {
            env.motion.tween(playBtn, { opacity: 0, scale: 0.5, pointerEvents: "none", duration: 0.3, ease: "power2.out" });
            env.motion.tween(pauseBtn, { opacity: 1, scale: 1, pointerEvents: "auto", duration: 0.3, ease: "power2.out" });
            startWave();
        }, { signal });
        audio.addEventListener("pause", () => {
            env.motion.tween(playBtn, { opacity: 1, scale: 1, pointerEvents: "auto", duration: 0.3, ease: "power2.out" });
            env.motion.tween(pauseBtn, { opacity: 0, scale: 0.5, pointerEvents: "none", duration: 0.3, ease: "power2.out" });
            stopWave();
        }, { signal });
        audio.addEventListener("timeupdate", () => {
            if (audio.duration)
                env.motion.set(progressEl, { scaleX: audio.currentTime / audio.duration });
        }, { signal });
        audio.addEventListener("ended", () => load(trackIdx + 1, true), { signal });
        playBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            audio.play().catch(() => {
            });
        }, { signal });
        pauseBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            audio.pause();
        }, { signal });
        q("[data-prev]").addEventListener("click", (e) => {
            e.stopPropagation();
            load(trackIdx - 1, !audio.paused);
        }, { signal });
        q("[data-next]").addEventListener("click", (e) => {
            e.stopPropagation();
            load(trackIdx + 1, !audio.paused);
        }, { signal });
        timelineEl.addEventListener("click", (e) => {
            e.stopPropagation();
            const r = referenceRect(timelineEl);
            if (audio.duration)
                audio.currentTime = (env.clientX(e) - r.left) / r.width * audio.duration;
        }, { signal });
        load(0);
        let state = "default";
        const sizes = {
            default: [THUMB_W, THUMB_H, RADIUS],
            min: [MIN_W, MIN_H, RADIUS],
            music: [MUSIC_W, MUSIC_H, RADIUS]
        };
        const dims = { w: THUMB_W, h: THUMB_H, r: RADIUS };
        const applyDims = () => {
            setDesignStyle(thumb, "width", `${dims.w}px`);
            setDesignStyle(thumb, "height", `${dims.h}px`);
            setDesignStyle(thumb, "borderRadius", `${dims.r}px`);
        };
        const setState = (next) => {
            if (next === state)
                return;
            state = next;
            const showMin = next === "min";
            const showMusic = next === "music";
            const [w, h, r] = sizes[next];
            const dur = reduced ? 0 : next === "default" ? P.morphOut : P.morphIn;
            env.motion.tween(dims, { w, h, r, duration: dur, ease: "power3.inOut", overwrite: true, onUpdate: applyDims });
            env.motion.tween(thumb, { backgroundColor: next === "default" ? C_REST : C_INK, duration: reduced ? 0 : BG_MORPH, ease: next === "default" ? "power3.inOut" : "power3.out", overwrite: "auto" });
            env.motion.tween(minEl, { opacity: showMin ? 1 : 0, x: showMin ? "0%" : "20%", filter: `blur(${showMin ? 0 : 30}px)`, duration: reduced ? 0 : 0.6, ease: "power3.inOut", pointerEvents: showMin ? "auto" : "none", overwrite: "auto" });
            env.motion.tween(musicEl, { opacity: showMusic ? 1 : 0, x: showMusic ? "0%" : "100%", filter: `blur(${showMusic ? 0 : 30}px)`, duration: reduced ? 0 : showMusic ? 0.65 : 0.6, ease: "power3.inOut", pointerEvents: showMusic ? "auto" : "none", overwrite: "auto" });
        };
        let target = 0;
        let cur = 0;
        let vel = 0;
        let maxScroll = 0;
        let progress = 0;
        let hovering = false;
        let barDrag = false;
        let sectionKind = "min";
        let restTimer = null;
        const measureScroll = () => {
            setDesignStyle(sb, "--sb-vh", `${scroll.clientHeight}px`);
            maxScroll = Math.max(0, track.scrollHeight - scroll.clientHeight);
            target = clamp(target, 0, maxScroll);
        };
        const ro = env.resizeObserver(measureScroll);
        ro.observe(scroll);
        measureScroll();
        sb.addEventListener("wheel", (e) => {
            e.preventDefault();
            target = clamp(target + e.deltaY, 0, maxScroll);
        }, { passive: false, signal });
        let touchY = 0;
        sb.addEventListener("touchstart", (e) => {
            touchY = env.clientY(e.touches[0]);
        }, { passive: true, signal });
        sb.addEventListener("touchmove", (e) => {
            e.preventDefault();
            const y = env.clientY(e.touches[0]);
            target = clamp(target + (touchY - y) * 1.5, 0, maxScroll);
            touchY = y;
        }, { passive: false, signal });
        let barStartY = 0;
        let barStartTarget = 0;
        thumb.addEventListener("pointerdown", (e) => {
            if (state === "music")
                return;
            if (e.target.closest(".sb__note"))
                return;
            barDrag = true;
            barStartY = env.clientY(e);
            barStartTarget = target;
            thumb.setPointerCapture?.(e.pointerId);
        }, { signal });
        window.addEventListener("pointermove", (e) => {
            if (!barDrag)
                return;
            const range = Math.max(1, bar.clientHeight - sizes[state][1]);
            target = clamp(barStartTarget + (env.clientY(e) - barStartY) / range * maxScroll, 0, maxScroll);
        }, { signal });
        window.addEventListener("pointerup", () => barDrag = false, { signal });
        const currentKind = () => {
            const mid = cur + scroll.clientHeight / 2;
            const idx = clamp(Math.floor(mid / scroll.clientHeight), 0, SECTIONS.length - 1);
            return SECTIONS[idx].kind;
        };
        const note = q(".sb__note");
        let noteShown = false;
        env.motion.set(note, { y: "100%", opacity: 0, scale: 0.5, filter: "blur(20px)", pointerEvents: "none" });
        const showNote = (on) => {
            if (on === noteShown)
                return;
            noteShown = on;
            env.motion.tween(note, {
                y: on ? "0%" : "100%",
                opacity: on ? 1 : 0,
                scale: on ? 1 : 0.5,
                filter: on ? "blur(0px)" : "blur(20px)",
                duration: on ? 0.6 : 0.45,
                ease: "power3.inOut",
                pointerEvents: on ? "auto" : "none"
            });
        };
        let hoverLeaveTimer = null;
        thumb.addEventListener("pointerenter", () => {
            if (hoverLeaveTimer) {
                env.clearTimeout(hoverLeaveTimer);
                hoverLeaveTimer = null;
            }
            hovering = true;
            if (state === "default")
                setState("min");
        }, { signal });
        thumb.addEventListener("pointerleave", () => {
            hovering = false;
            if (hoverLeaveTimer)
                env.clearTimeout(hoverLeaveTimer);
            hoverLeaveTimer = env.setTimeout(() => {
                hoverLeaveTimer = null;
                if (!hovering && state === "min" && !barDrag)
                    setState("default");
            }, 120);
        }, { signal });
        note.addEventListener("click", (e) => {
            e.stopPropagation();
            if (sectionKind === "music")
                setState("music");
        }, { signal });
        musicEl.addEventListener("pointerleave", (e) => {
            if (state !== "music")
                return;
            if (thumb.contains(e.relatedTarget))
                return;
            setState("min");
        }, { signal });
        const tick = (_t, dtMs) => {
            const dt = Math.min(dtMs, 64) / 1e3 || 0.016;
            const prev = cur;
            cur = reduced ? target : damp(cur, target, 9, dt);
            if (Math.abs(target - cur) < 0.05)
                cur = target;
            vel = cur - prev;
            setDesignStyle(track, "transform", `translate3d(0, ${-cur}px, 0)`);
            progress = maxScroll > 0 ? cur / maxScroll : 0;
            sectionKind = currentKind();
            showNote(sectionKind === "music");
            const scrolling = Math.abs(vel) > 0.15 || Math.abs(target - cur) > 0.6;
            if (state === "music" && !barDrag && (scrolling || sectionKind !== "music")) {
                setState("min");
            }
            else if (!hovering && !barDrag) {
                if (scrolling || sectionKind === "music") {
                    if (restTimer) {
                        env.clearTimeout(restTimer);
                        restTimer = null;
                    }
                    if (state === "default")
                        setState("min");
                }
                else if (state === "min" && !restTimer) {
                    restTimer = env.setTimeout(() => {
                        restTimer = null;
                        if (!hovering && !barDrag && state === "min")
                            setState("default");
                    }, P.restDelay);
                }
            }
            const slimCentre = progress * (bar.clientHeight - THUMB_H) + THUMB_H / 2;
            const barY = clamp(slimCentre - dims.h / 2, 0, Math.max(0, bar.clientHeight - dims.h));
            setDesignStyle(thumb, "transform", `translateY(${barY}px)`);
        };
        env.clock.add(tick);
        if (!reduced)
            env.motion.from(thumb, { opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.1 });
        const set = (key, value) => {
            if (key === "accent") {
                setDesignStyle(sb, "--sb-accent", String(value));
            }
            else if (key in P) {
                P[key] = Number(value);
            }
        };
        const destroy = () => {
            ac.abort();
            env.clock.remove(tick);
            ro.disconnect();
            env.clearInterval(clockInt);
            if (restTimer)
                env.clearTimeout(restTimer);
            if (hoverLeaveTimer)
                env.clearTimeout(hoverLeaveTimer);
            waveTl?.kill();
            audio.pause();
            audio.src = "";
            env.motion.cancel([thumb, dims, minEl, musicEl, note, playBtn, pauseBtn, progressEl, ...waveLines]);
            sb.remove();
        };
        return { destroy, set };
    }
};
