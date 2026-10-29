import { heroWorldEvent, worldProgressFromScroll } from "../1-hero/hero-world";
import { smoothRange } from "./journey-clock";
import { designPixels, pixelsToVw } from "@/lib/viewport-design";
import { journeyGeometry } from "./journey-geometry";
/** Reference glyph metrics and line masks, driven by the shared hero-world handoff. */
export function createOpeningType(root) {
  const e = root.querySelector(".glasses-opening");
  const heading = e.querySelector(".opening-heading");
  const originals = [...heading.childNodes].map((n) => n.cloneNode(true));
  const t = document.createElement("canvas").getContext("2d");
  let a = true,
    groups = [],
    progress = 0,
    mobile;
  const n = () => {
    const words = [...e.querySelectorAll(".opening-word")],
      tops = [];
    for (const top of words
      .map((w) => w.parentElement.getBoundingClientRect().top)
      .sort((a, b) => a - b))
      if (!tops.some((t) => Math.abs(t - top) <= designPixels(1, innerWidth))) tops.push(top);
    groups = tops.map(() => []);
    words.forEach((word) => {
      const line = tops.findIndex(
        (t) =>
          Math.abs(t - word.parentElement.getBoundingClientRect().top) <= designPixels(1, innerWidth),
      );
      word.dataset.openingLine = String(line);
      groups[line].push(word);
    });
    paint();
  };
  const fit = () => {
    if (!a) return;
    const { width: openingWidth, height: openingHeight } = e.getBoundingClientRect();
    let r = e.querySelector(".opening-heading");
    if (!r) return;
    if ("ar" === document.documentElement.lang) {
      let a = Array.from(r.querySelectorAll(".opening-ar-line")).map((r) => {
          let a = r.querySelector(".opening-word-metric"),
            n = getComputedStyle(a),
            i = Array.from(a.querySelectorAll(".opening-ar-metric-line"));
          t.font = `${n.fontWeight} 100px ${n.fontFamily}`;
          let o = i.map((e) => t.measureText(e.textContent ?? ""));
          return {
            row: r,
            metric: a,
            lines: i,
            size:
              (0.96 * openingWidth) /
              (Math.max(...o.map((e) => e.width)) / 100),
            count: o.length,
            ascent: Math.max(...o.map((e) => e.actualBoundingBoxAscent)) / 100,
            descent:
              Math.max(...o.map((e) => e.actualBoundingBoxDescent)) / 100,
          };
        }),
        i = designPixels(journeyGeometry(innerWidth).mobile ? 10 : 14, innerWidth),
        o = a.reduce(
          (e, t) =>
            e + t.size * (t.ascent + t.descent + 1.18 * (t.count - 1)) + i,
          0,
        ),
        s = Math.min(1, (openingHeight - designPixels(16, innerWidth)) / o);
      {
        a.forEach(
          ({
            row: e,
            metric: t,
            lines: r,
            size: a,
            count: n,
            ascent: o,
            descent: l,
          }) => {
            let d = a * s;
            e.style.fontSize = pixelsToVw(d, innerWidth);
            let c = document.createElement("span");
            {
              Object.assign(c.style, {
                display: "inline-block",
                width: "0",
                height: "0",
                verticalAlign: "baseline",
              });
              r[n - 1].appendChild(c);
            }
            let u =
              c.getBoundingClientRect().top -
              t.getBoundingClientRect().top -
              1.18 * d * (n - 1);
            {
              c.remove();
              e.style.setProperty(
                "--ar-row-box",
                pixelsToVw(d * (o + l + 1.18 * (n - 1)) + i, innerWidth),
              );
              e.style.setProperty("--ar-row-top", pixelsToVw(i / 2 + d * o - u, innerWidth));
            }
            let p = t.parentElement.getBoundingClientRect(),
              h = e.querySelectorAll(".opening-ar-word-mask"),
              m = document.createRange(),
              f = d * (o + l) + i,
              g = 0;
            r.forEach((e, t) => {
              for (let r of (e.textContent ?? "").matchAll(/\S+/gu)) {
                let a = h[g++];
                if (!a || !e.firstChild) continue;
                {
                  m.setStart(e.firstChild, r.index);
                  m.setEnd(e.firstChild, r.index + r[0].length);
                }
                let n = m.getBoundingClientRect();
                Object.assign(a.style, {
                  left: pixelsToVw(n.left - p.left - 0.025 * d, innerWidth),
                  top: pixelsToVw(t * d * 1.18, innerWidth),
                  width: pixelsToVw(n.width + 0.05 * d, innerWidth),
                  height: pixelsToVw(f, innerWidth),
                });
              }
            });
          },
        );
        e.style.setProperty("--opening-optical-y", "0vw");
        e.style.setProperty("--opening-fit", "1");
        e.dataset.typeFit = s.toFixed(4);
        e.dataset.inkHeight = (o * s).toFixed(2);
        n();
      }
      return;
    }
    e.style.setProperty("--opening-fit", "1");
    let i = r.cloneNode(!0);
    {
      i.querySelectorAll("[style]").forEach((e) => e.removeAttribute("style"));
      i.removeAttribute("style");
      i.setAttribute("aria-hidden", "true");
      Object.assign(i.style, {
        position: "absolute",
        visibility: "hidden",
        pointerEvents: "none",
        top: "0",
        left: "0",
        width: "100%",
        transform: "none",
      });
      e.appendChild(i);
    }
    let o = 1 / 0,
      s = -1 / 0,
      l = 1,
      d = i.getBoundingClientRect(),
      c = d.left + d.width / 2,
      u = Math.max(designPixels(2, innerWidth), 0.005 * openingWidth),
      p = new Map();
    for (let e of i.querySelectorAll(".opening-word-metric")) {
      let r = e.textContent ?? "",
        a = getComputedStyle(e),
        n = document.createElement("span");
      {
        Object.assign(n.style, {
          display: "inline-block",
          width: "0",
          height: "0",
          padding: "0",
          margin: "0",
          verticalAlign: "baseline",
        });
        e.appendChild(n);
        t.font = `${a.fontWeight} ${a.fontSize} ${a.fontFamily}`;
      }
      let i = t.measureText(r),
        l = n.getBoundingClientRect().top;
      {
        o = Math.min(o, l - i.actualBoundingBoxAscent);
        s = Math.max(s, l + i.actualBoundingBoxDescent);
        n.remove();
      }
      let d = e.closest(".opening-row"),
        c = e.getBoundingClientRect(),
        u = parseFloat(a.letterSpacing) || 0,
        h = c.left - i.actualBoundingBoxLeft,
        m = c.right + i.actualBoundingBoxRight - i.width - u,
        f = p.get(d);
      p.set(d, {
        left: Math.min(f?.left ?? 1 / 0, h),
        right: Math.max(f?.right ?? -1 / 0, m),
      });
    }
    for (let [t, r] of p) {
      let a = t.getBoundingClientRect(),
        n = a.left + a.width / 2,
        i = openingWidth / 2 - u - Math.abs(n - c),
        o = Math.max(n - r.left, r.right - n);
      {
        if (o > 0) {
          l = Math.min(l, i / o);
        }
      }
    }
    let h = s - o,
      m = Math.min(1, l, Math.max(0.1, (openingHeight - designPixels(12, innerWidth)) / h)),
      f = -((o + s) / 2 - (d.top + d.height / 2)) * m;
    {
      i.remove();
      if (Number.isFinite(m) && Number.isFinite(f)) {
        e.style.setProperty("--opening-fit", String(m));
        e.style.setProperty("--opening-optical-y", pixelsToVw(f, innerWidth));
        e.dataset.typeFit = m.toFixed(4);
        e.dataset.inkHeight = (h * m).toFixed(2);
        n();
      }
    }
  };
  function paint() {
    const value = e.closest(".is-reduced") ? 1 : progress;
    groups.forEach((words, index) => {
      const duration =
          (0.995 - 0.745) / (1 + Math.max(0, groups.length - 1) * 0.55),
        start = 0.745 + index * duration * 0.55;
      const y = 155 * (1 - smoothRange(start, start + duration, value));
      words.forEach(
        (word) => (word.style.transform = "translate3d(0," + y + "%,0)"),
      );
    });
    const clip = 112 * (1 - smoothRange(0.72, 0.79, value));
    root
      .querySelectorAll(".scene-footer,.progress-track")
      .forEach((node) => (node.style.clipPath = "inset(" + clip + "% 0 0)"));
  }
  function measure() {
    if (!a) return;
    const next = journeyGeometry(innerWidth).compactOpening;
    if (document.documentElement.lang === "ar" && next !== mobile) {
      mobile = next;
      const lines = next
        ? ["من زاوية أخرى\nترى ما لم يكن", "ظاهرًا", "فتكتمل\nالصورة"]
        : ["من زاوية أخرى ترى", "ما لم يكن ظاهرًا", "فتكتمل الصورة"];
      [...heading.querySelectorAll(".opening-ar-line")].forEach((row, i) => {
        const mask = row.querySelector(".opening-mask"),
          metric = document.createElement("span");
        metric.className = "opening-word-metric";
        for (const line of lines[i].split("\n")) {
          const span = document.createElement("span");
          span.className = "opening-ar-metric-line";
          span.textContent = line;
          metric.append(span);
        }
        mask.replaceChildren(metric);
        for (const word of lines[i].match(/\S+/gu)) {
          const outer = document.createElement("span"),
            inner = document.createElement("span");
          outer.className = "opening-ar-word-mask";
          inner.className =
            "opening-word opening-word-" + ["shift", "see", "look"][i];
          inner.dataset.localeText = "true";
          inner.textContent = word;
          outer.append(inner);
          mask.append(outer);
        }
      });
    }
    if (t) fit();
  }
  function update(event) {
    const value = event.detail?.progress;
    if (Number.isFinite(value)) {
      progress = value;
      paint();
    }
  }
  window.addEventListener(heroWorldEvent, update);
  progress = worldProgressFromScroll(
    scrollY,
    document.getElementById("identity")?.getBoundingClientRect().height || innerHeight,
    journeyGeometry(innerWidth).mobile,
  );
  measure();
  return {
    measure,
    dispose() {
      a = false;
      window.removeEventListener(heroWorldEvent, update);
      heading.replaceChildren(...originals);
      e.removeAttribute("style");
      delete e.dataset.typeFit;
      delete e.dataset.inkHeight;
      root
        .querySelectorAll(".scene-footer,.progress-track")
        .forEach((node) => node.style.removeProperty("clip-path"));
    },
  };
}
