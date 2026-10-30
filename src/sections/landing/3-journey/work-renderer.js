/** Reference path geometry and score measurements, ported to native DOM modules. */
import * as a from "./work-paths.js";
import * as s from "./work-paths.js";
import { referencePixelsToVw } from "@/lib/viewport-design";
import { journeyGeometry } from "./journey-geometry";
let l = (e) => Math.max(0, Math.min(1, e)),
  c = [
    1165.3478317209444, 908.0867198035749, 1216.3426685460572, 801.3538420795223,
  ];
function u(e, t, r, n, o, i = 1) {
  if (10 !== e.length || e.some((e) => !Number.isFinite(e) || e <= 0))
    throw Error("The Work pen requires ten measured, connected paths.");
  let a = 0,
    l = e.map((e) => ({ start: a, end: (a += e), length: e })),
    d = t <= 700 ? 21 : 15,
    p = n.map((e, n) => c[n] * (0, s.workSymbolLayout)(t, r, n, e, !1).scale),
    m = p.reduce((e, t) => e + t, 0) / (n.length * d),
    h = o.map((t, r) => {
      let n = e[2 * r + 1] / m;
      return { start: t - 0.85 * n, end: t + 0.15 * n, duration: n };
    }),
    g = o.map((e, t) => {
      let r = p[t] / m;
      return { start: e - 0.85 * r, end: e + 0.15 * r, duration: r };
    }),
    y = [[270, 0]],
    f = [
      [264, -1.35],
      [285, -1.15],
    ];
  {
    n.forEach((e, n) => {
      let i = h[n],
        a = g[n],
        c = (0, s.workSymbolLayout)(t, r, n, e, !1);
      {
        y.push([i.start, l[2 * n + 1].start], [i.end, l[2 * n + 1].end]);
        f.push([a.start, c.x / t - 0.8], [o[n], e], [a.end, e + 0.065]);
      }
    });
    y.push([433, l[8].end], [438, a]);
    f.push([421, 3.99], [448, 5.04]);
  }
  let w = g[3].start + 0.76 * g[3].duration;
  return {
    segments: l,
    direction: i,
    total: a,
    windows: h,
    compositionWindows: g,
    takeover: w,
    ink: y,
    travel: {
      keys: f,
      slopes: f.map(([e, t], r) => {
        if (!r || r === f.length - 1) return 0;
        let n = (t - f[r - 1][1]) / (e - f[r - 1][0]),
          o = (f[r + 1][1] - t) / (f[r + 1][0] - e);
        return n > 0 && o > 0 ? (2 * n * o) / (n + o) : 0;
      }),
    },
    speed: m,
  };
}
function d(e, t) {
  let r = (function (e, t) {
    if (t <= e[0][0]) return e[0][1];
    if (t >= e.at(-1)[0]) return e.at(-1)[1];
    for (let r = 1; r < e.length - 1; r++) {
      let [n, o] = e[r],
        [i, a] = e[r - 1],
        [s, l] = e[r + 1],
        c = Math.min(0.22, (n - i) * 0.025, (s - n) * 0.025);
      if (Math.abs(t - n) <= c) {
        let e = (o - a) / (n - i),
          r = (l - o) / (s - n),
          u = (t - n + c) / (2 * c);
        return o - e * c + 2 * c * (e * u + ((r - e) * u * u) / 2);
      }
    }
    let r = e.findIndex((r, n) => n < e.length - 1 && t < e[n + 1][0]),
      [n, o] = e[r],
      [i, a] = e[r + 1];
    return o + ((a - o) * (t - n)) / (i - n);
  })(e.ink, t);
  return {
    head: r,
    progress: r / e.total,
    travel: (function ({ keys: e, slopes: t }, r) {
      if (r <= e[0][0]) return e[0][1];
      if (r >= e.at(-1)[0]) return e.at(-1)[1];
      let n = e.findIndex((t, n) => n < e.length - 1 && r < e[n + 1][0]),
        [o, i] = e[n],
        [a, s] = e[n + 1],
        l = (r - o) / (a - o),
        c = l * l,
        u = c * l;
      return (
        (2 * u - 3 * c + 1) * i +
        (u - 2 * c + l) * t[n] * (a - o) +
        (-2 * u + 3 * c) * s +
        (u - c) * t[n + 1] * (a - o)
      );
    })(e.travel, t),
  };
}
function p(e, t, r) {
  let n = e.segments[r];
  return l((t - n.start) / n.length);
}
function m(e, t, r) {
  let n = e.compositionWindows[r];
  return l((t - n.start) / n.duration);
}
export const createWorkPen = u;
export const sampleWorkPen = d;
export const workCompositionProgress = m;
export const workPenSegment = p;
let h = [0, 1.22, 2.72, 3.88],
  g = [308, 345, 381, 413],
  y = (e) => Math.max(0, Math.min(1, e)),
  f = (e, t, r) => {
    let n = y((r - e) / (t - e));
    return n * n * (3 - 2 * n);
  },
  w = (e, t, r) => e + (t - e) * r,
  b = [
    [264, -1.35],
    [285, -1.15],
    [308, 0],
    [320, 0.14],
    [345, 1.22],
    [355, 1.42],
    [381, 2.72],
    [389, 2.81],
    [413, 3.88],
    [421, 3.99],
    [448, 5.04],
  ],
  E = b.map(([e, t], r) => {
    if (0 === r || r === b.length - 1) return 0;
    let n = (t - b[r - 1][1]) / (e - b[r - 1][0]),
      o = (b[r + 1][1] - t) / (b[r + 1][0] - e);
    return (2 * n * o) / (n + o);
  });
function v(e, t) {
  return {
    progress: y((e - 264) / 184),
    travel: t
      ? d(t, e).travel
      : (function (e) {
          if (e <= 264) return b[0][1];
          if (e >= 448) return b.at(-1)[1];
          let t = b.findIndex(
              (t, r) => r < b.length - 1 && e >= t[0] && e < b[r + 1][0],
            ),
            [r, n] = b[t],
            [o, i] = b[t + 1],
            a = (e - r) / (o - r),
            s = a * a,
            l = s * a;
          return (
            (2 * l - 3 * s + 1) * n +
            (l - 2 * s + a) * E[t] * (o - r) +
            (-2 * l + 3 * s) * i +
            (l - s) * E[t + 1] * (o - r)
          );
        })(e),
    entry: f(270, 284, e),
    clear: f(430, 451, e),
    intro: f(281, 289, e) * (1 - f(299, 307, e)),
    handoff: f(436, 442, e),
  };
}
function L(e, t, r) {
  let n = h[t] - v(e, r).travel;
  return { offset: n, focus: 1 - f(0.08, 0.84, Math.abs(n)) };
}
function S(e, t) {
  let r = t ? 60.8 : 62.8,
    n = f(420, 438, e),
    o = f(438, 470, e),
    i = t ? 68.77 : 58.3;
  return {
    x1: w(w(92, 64, n), t ? 23 : 43, o),
    y1: w(w(r, 28, n), i, o),
    x2: w(w(92, 64, n), 89, o),
    y2: w(w(r, 82, n), i, o),
  };
}
export const WORK_ANCHORS = h;
export const WORK_MOMENTS = g;
export const createHorizontalRenderer = function (e, t, r = () => !1) {
  let n = e.querySelector(".work-world"),
    o = n.querySelector(".work-track"),
    i = n.querySelector(".work-stroke"),
    l = n.querySelector(".work-origin"),
    c = n.querySelector(".work-outgoing"),
    y = n.querySelector(".work-carry"),
    b = n.querySelector(".work-outgoing-tip"),
    E = n.querySelector(".work-carry-tip"),
    T = [...n.querySelectorAll(".work-composition")].map((e, t) => {
      let r = i.querySelector(`[data-stroke-project="${t}"]`);
      return {
        section: e,
        group: r,
        title: e.querySelector(".work-title-plane"),
        meta: e.querySelector(".work-meta-plane"),
        index: e.querySelector(".work-index-plane"),
        button: e.querySelector(".work-explore"),
        symbol: r.querySelector(".work-symbol"),
        ink: r.querySelector(".work-symbol-ink"),
        tip: r.querySelector(".work-symbol .work-drawing-tip"),
        hit: r.querySelector(".work-symbol-hit"),
        connector: r.querySelector(".work-connector"),
        connectorTip: r.querySelector(".work-connector-tip"),
      };
    }),
    k = T.flatMap((e) => [
      { ink: e.connector, tip: e.connectorTip },
      { ink: e.ink, tip: e.tip },
    ]).concat([
      { ink: c, tip: b },
      { ink: y, tip: E },
    ]),
    N,
    A = 0,
    R = -1.35,
    O = !1,
    I = NaN,
    M = 0,
    camera = journeyGeometry(innerWidth, e.querySelector(".stage")?.getBoundingClientRect().height || undefined),
    x = camera.width,
    $ = camera.height,
    C = x <= 700,
    F = -1,
    P = r() ? -1 : 1,
    H = h.map((e, t) => (0, s.workSymbolLayout)(x, $, t, e, !0, P)),
    q = matchMedia("(hover:hover) and (pointer:fine)"),
    _ = () => {
      for (let e of T) {
        delete e.group.dataset.emphasis;
        delete e.section.dataset.workHover;
      }
    },
    W = T.map((e, t) => {
      let r = () => {
          {
            if (!(F !== t || 1 > p(N, A, 2 * t + 1))) {
              e.group.dataset.emphasis = "true";
              e.section.dataset.workHover = "true";
            }
          }
        },
        n = () => {
          {
            if (q.matches && !C) {
              r();
            }
          }
        },
        o = () => {
          {
            delete e.group.dataset.emphasis;
            delete e.section.dataset.workHover;
          }
        };
      return (
        e.hit.addEventListener("pointerenter", n),
        e.hit.addEventListener("pointerleave", o),
        e.button.addEventListener("pointerenter", n),
        e.button.addEventListener("pointerleave", o),
        e.button.addEventListener("focus", r),
        e.button.addEventListener("blur", o),
        () => {
          {
            e.hit.removeEventListener("pointerenter", n);
            e.hit.removeEventListener("pointerleave", o);
            e.button.removeEventListener("pointerenter", n);
            e.button.removeEventListener("pointerleave", o);
            e.button.removeEventListener("focus", r);
            e.button.removeEventListener("blur", o);
          }
        }
      );
    }),
    D = (e) => {
      M = e;
      let r = Math.max(264, Math.min(470, e));
      if (r === I) return;
      I = r;
      let i = v(r, N),
        a = d(N, r),
        s = r >= N.takeover,
        u = r >= 296 && r < 434;
      {
        A = a.head;
        R = i.travel;
      }
      let h = u ? T.findIndex((e, t) => L(r, t, N).focus > 0.7) : -1;
      {
        if (F !== h) {
          _();
          F = h;
        }
        n.style.opacity = String(e >= 270 && e < 469 ? 1 - f(451, 469, r) : 0);
        n.style.visibility = e >= 270 && e < 469 ? "visible" : "hidden";
        n.setAttribute("aria-hidden", String(e < 270 || e >= 469));
        n.dataset.travel = i.travel.toFixed(4);
        n.dataset.workProgress = i.progress.toFixed(4);
        n.dataset.penProgress = a.progress.toFixed(6);
        n.dataset.penHead = A.toFixed(3);
        o.style.transform = `translate3d(${referencePixelsToVw(-P * i.travel * x, camera.reference)},0,0)`;
      }
      let g = t.current,
        O = f(280, 292, r),
        W = v(280, P < 0 ? N : void 0).travel,
        D = (g.x + P * w(i.travel, W, O)) * x,
        U = g.y * $,
        Y = H[0],
        z = Y.y + 130 * Y.scale,
        B = G(D, U, Y.entryX, z);
      {
        T[0].connector.setAttribute("d", B);
        T[0].connectorTip.setAttribute("d", B);
        l.setAttribute("cx", String(D));
        l.setAttribute("cy", String(U));
        l.setAttribute("r", String(w(g.radius / camera.scale, 0.75, f(270, 282, r))));
        l.style.visibility = g.ready ? "visible" : "hidden";
        n.dataset.origin = `${g.x.toFixed(4)},${g.y.toFixed(4)}`;
        T.forEach(
          (
            {
              section: e,
              group: t,
              title: n,
              meta: o,
              index: a,
              button: s,
              hit: l,
            },
            c,
          ) => {
            let { offset: d, focus: h } = L(r, c, N),
              g = p(N, A, 2 * c + 1),
              y = C ? 0.25 : x <= 1e3 ? 0.6 : 1,
              w = m(N, r, c),
              b = 1.3 > Math.abs(d) && i.clear < 0.995,
              E = u && h > 0.45 && w > 0.65 && i.clear < 0.5;
            {
              e.setAttribute("aria-hidden", String(!b));
              e.inert = !E;
              s.tabIndex = E ? 0 : -1;
              n.style.transform = `translate3d(${-P * d * 2.8 * y}vw,0,0)`;
              n.style.opacity = String(
                (0.25 + 0.75 * f(0, 0.8, w)) *
                  (0.64 + 0.36 * h) *
                  (1 - i.clear),
              );
              o.style.transform = `translate3d(${P * d * 1.3 * y}vw,${referencePixelsToVw((1 - h) * 9, camera.reference)},0)`;
              o.style.clipPath = `inset(${(1 - f(0.08, 0.65, h) * f(0.35, 0.8, w)) * 100}% ${referencePixelsToVw(-8, camera.reference)} ${referencePixelsToVw(-8, camera.reference)})`;
              o.style.opacity = String(1 - i.clear);
              a.style.transform = `translate3d(${P * d * y}vw,0,0)`;
              a.style.opacity = String((0.65 + 0.35 * h) * (1 - i.clear));
              if (g < 1) {
                delete t.dataset.emphasis;
                delete e.dataset.workHover;
              }
              t.dataset.draw = g.toFixed(4);
              e.dataset.focus = h.toFixed(3);
              l.style.pointerEvents =
                F === c && g >= 1 && q.matches && !C ? "stroke" : "none";
            }
          },
        );
      }
      let j = H[3],
        K = S(r, C),
        J = (P * i.travel + K.x1 / 100) * x,
        Q = (K.y1 / 100) * $,
        X = f(440, 448, r),
        V = w(j.exitX, J, X),
        Z = w(j.y + 130 * j.scale, Q, X),
        ee = `M${V} ${Z} C${w(V, J, 0.6)} ${Z} ${J} ${w(Z, Q, 0.65)} ${J} ${Q}`;
      {
        c.setAttribute("d", ee);
        b.setAttribute("d", ee);
      }
      let et = `M${(K.x1 / 100) * x} ${(K.y1 / 100) * $} L${(K.x2 / 100) * x} ${(K.y2 / 100) * $}`;
      for (let e of (y.setAttribute("d", et),
      E.setAttribute("d", et),
      k.forEach(({ ink: e, tip: t }, r) => {
        let n = N.segments[r],
          o = p(N, A, r);
        {
          e.style.strokeDasharray = o >= 1 ? "none" : "1 1";
          e.style.strokeDashoffset = String(1 - o);
          e.style.visibility = o > 0 ? "visible" : "hidden";
        }
        let i = Math.min(n.length, Math.max(0, A - n.start)),
          s = Math.max(0, A - n.start - 3),
          l = Math.max(0, i - s);
        {
          t.style.visibility = l > 0 && a.progress < 1 ? "visible" : "hidden";
          t.style.strokeDasharray = `${l / n.length} 1`;
          t.style.strokeDashoffset = String(-s / n.length);
        }
      }),
      (T[3].symbol.style.display = s ? "none" : ""),
      [c, b, y, E]))
        e.style.display = s ? "none" : "";
    },
    G = (e, t, r, n) =>
      `M${e} ${t} C${e + P * x * 0.26} ${t} ${r - P * x * 0.2} ${n} ${r} ${n}`,
    U = () => {
      {
        camera = journeyGeometry(innerWidth, e.querySelector(".stage")?.getBoundingClientRect().height || undefined);
        x = camera.width;
        $ = camera.height;
        C = x <= 700;
        P = r() ? -1 : 1;
        T.forEach(({ section: e }, t) => {
          {
            if (P < 0) {
              e.style.left = referencePixelsToVw(-h[t] * x, camera.reference);
            } else {
              e.style.removeProperty("left");
            }
          }
        });
        H = h.map((e, t) => (0, s.workSymbolLayout)(x, $, t, e, !0, P));
        i.setAttribute("viewBox", `0 0 ${5.6 * x} ${$}`);
        i.style.width = referencePixelsToVw(5.6 * x, camera.reference);
        i.style.height = referencePixelsToVw($, camera.reference);
        H.forEach((e, t) => {
          let r = (0, s.placeWorkPath)(
            (0, s.directedWorkPath)(a.WORK_PROJECTS[t].mark.path, P),
            e.x,
            e.y,
            e.scale,
          );
          if (
            (T[t].symbol
              .querySelectorAll("path")
              .forEach((e) => e.setAttribute("d", r)),
            t)
          ) {
            let r = H[t - 1],
              n = r.exitX,
              o = r.y + 130 * r.scale,
              i = e.y + 130 * e.scale,
              a = `M${n} ${o} C${n + (e.entryX - n) * 0.42} ${o} ${e.entryX - (e.entryX - n) * 0.42} ${i} ${e.entryX} ${i}`;
            {
              T[t].connector.setAttribute("d", a);
              T[t].connectorTip.setAttribute("d", a);
            }
          }
        });
      }
      let o = H[0],
        l = H[3],
        d = t.current;
      T[0].connector.setAttribute(
        "d",
        G(
          (d.x + P * v(280).travel) * x,
          d.y * $,
          o.entryX,
          o.y + 130 * o.scale,
        ),
      );
      let p = S(433, C),
        m = l.exitX,
        f = l.y + 130 * l.scale,
        b = (P * v(433).travel + p.x1 / 100) * x,
        E = (p.y1 / 100) * $;
      {
        c.setAttribute(
          "d",
          `M${m} ${f} C${w(m, b, 0.6)} ${f} ${b} ${w(f, E, 0.65)} ${b} ${E}`,
        );
        n.querySelector(".work-carry-field").setAttribute(
          "viewBox",
          `0 0 ${x} ${$}`,
        );
        y.setAttribute(
          "d",
          `M${0.64 * x} ${0.28 * $} L${0.64 * x} ${0.82 * $}`,
        );
        O = d.ready;
        N = u(
          k.map(({ ink: e }) => Math.max(0.01, e.getTotalLength())),
          x,
          $,
          h,
          g,
          P,
        );
        n.dataset.penWindows = JSON.stringify(N.windows);
        n.dataset.penLengths = JSON.stringify(N.segments.map((e) => e.length));
        _();
        I = NaN;
        D(M);
      }
    };
  return (
    (t.current.changed = () => {
      {
        if (!O && t.current.ready) {
          U();
        } else {
          I = NaN;
          D(M);
        }
      }
    }),
    window.addEventListener("resize", U),
    window.addEventListener("blur", _),
    document.addEventListener("visibilitychange", _),
    U(),
    {
      update: D,
      resize: U,
      get pen() {
        return N;
      },
      get travel() {
        return R;
      },
      dispose() {
        for (let e of ((t.current.changed = void 0),
        _(),
        W.forEach((e) => e()),
        window.removeEventListener("resize", U),
        window.removeEventListener("blur", _),
        document.removeEventListener("visibilitychange", _),
        T))
          for (let t of (e.symbol.style.removeProperty("display"),
          e.section.style.removeProperty("left"),
          (e.section.inert = !1),
          e.section.removeAttribute("aria-hidden"),
          e.button.removeAttribute("tabindex"),
          [e.title, e.meta, e.index, e.ink, e.tip, e.hit, e.connector]))
            t.removeAttribute("style");
        for (let { ink: e, tip: t } of k) {
          e.removeAttribute("style");
          t.removeAttribute("style");
        }
        for (let e of [n, o, i, l, c, y]) e.removeAttribute("style");
        n.removeAttribute("aria-hidden");
      },
    }
  );
};
