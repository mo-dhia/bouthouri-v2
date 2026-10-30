/** Reference cubic path measurements; native SVG geometry, independent of GSAP. */
import * as $ from "./work-paths.js";
import * as B from "./work-renderer.js";
let W = (e, t, r) => Math.max(0, Math.min(1, (r - e) / (t - e))),
  D = (e, t, r) => {
    let a = W(e, t, r);
    return a * a * (3 - 2 * a);
  },
  Y = (e, t, r) => e + (t - e) * r,
  F = [0, 1.22, 2.72, 3.88],
  G = [308, 345, 381, 413],
  U = (e) => new Float64Array(e);
function z(e) {
  let t = e.match(/[MLCQ]|-?\d*\.?\d+/g),
    r = 0,
    a = 0,
    n = 0,
    i = [];
  for (; r < t.length;) {
    let e = t[r++],
      o = "C" === e ? 6 : "Q" === e ? 4 : 2,
      s = t.slice(r, r + o).map(Number);
    {
      r += o;
      if ("M" === e || "C" === e) {
        i.push(...s);
      } else {
        if ("L" === e) {
          i.push(
            Y(a, s[0], 1 / 3),
            Y(n, s[1], 1 / 3),
            Y(a, s[0], 2 / 3),
            Y(n, s[1], 2 / 3),
            ...s,
          );
        } else {
          i.push(
            a + ((s[0] - a) * 2) / 3,
            n + ((s[1] - n) * 2) / 3,
            s[2] + ((s[0] - s[2]) * 2) / 3,
            s[3] + ((s[1] - s[3]) * 2) / 3,
            s[2],
            s[3],
          );
        }
      }
      a = s.at(-2);
      n = s.at(-1);
    }
  }
  return U(i);
}
let V = z($.WORK_MARKS.forecasting.path),
  K = z((0, $.directedWorkPath)($.WORK_MARKS.forecasting.path, -1)),
  X = (V.length - 2) / 6,
  J = X + 4;
function Q(e) {
  let t = new Float64Array((e.length - 1) * 6 + 2);
  t.set(e[0]);
  let r = (t) => {
    let r = e[Math.max(0, t - 1)],
      a = e[Math.min(e.length - 1, t + 1)];
    return [
      (a[0] - r[0]) / (0 === t || t === e.length - 1 ? 3 : 6),
      0 === t || t === e.length - 1 ? 0 : (a[1] - r[1]) / 6,
    ];
  };
  for (let a = 0; a < e.length - 1; a++) {
    let n = e[a],
      i = e[a + 1],
      o = r(a),
      s = r(a + 1);
    t.set(
      [n[0] + o[0], n[1] + o[1], i[0] - s[0], i[1] - s[1], ...i],
      2 + 6 * a,
    );
  }
  return t;
}
function Z(e, t, r) {
  let a = t <= 700,
    n = D([447, 461, 455][r], [483, 504, 496][r], e),
    i = (
      a
        ? [
            [0.54, 0.61, 0.65, 0.24, -0.08],
            [0.62, 0.68, 0.67, 0.22, 0.065],
            [0.52, 0.72, 0.62, 0.25, -0.045],
          ]
        : [
            [0.76, 0.43, 0.32, 0.34, -0.075],
            [0.79, 0.55, 0.345, 0.31, 0.065],
            [0.69, 0.54, 0.31, 0.38, -0.04],
          ]
    )[r],
    o = a
      ? [0.59 - 0.027 * r, 0.6 + 0.033 * r, 0.66, 0.23, 0]
      : [0.76 - 0.025 * r, 0.47 + 0.033 * r, 0.34, 0.35, 0];
  return {
    x: Y(i[0], o[0], n) + 0.005 * D(484, 526, e),
    y: Y(i[1], o[1], n),
    w: Y(i[2], o[2], n),
    h: Y(i[3], o[3], n),
    angle: Y(i[4], 0, n),
  };
}
function ee(e, t, r, a) {
  let n = (0, $.workSymbolLayout)(t, r, 3, 3.88, !0, a.direction),
    i = a.direction < 0 ? K : V,
    o = (0, B.sampleWorkPen)(a, e).travel,
    s = new Float64Array(6 * J + 2);
  for (let e = 0; e < i.length; e += 2) {
    s[e] = n.x - a.direction * o * t + i[e] * n.scale;
    s[e + 1] = n.y + i[e + 1] * n.scale;
  }
  for (let e = i.length; e < s.length; e += 2) {
    s[e] = s[i.length - 2];
    s[e + 1] = s[i.length - 1];
  }
  return s;
}
let et = (e) => e.takeover;
function er(e, t, r, a, n) {
  let i = [];
  for (let o = 0; o < 3; o++) {
    let s = o ? Z(e, t, o - 1) : null,
      l = s ? (-s.w * t) / 2 : 0,
      d = s ? (s.h * r) / 2 - 0.012 * Math.min(t, r) : 0,
      c = s
        ? [
            s.x * t + l * Math.cos(s.angle) - d * Math.sin(s.angle),
            s.y * r + l * Math.sin(s.angle) + d * Math.cos(s.angle),
          ]
        : [-0.2 * t, (t <= 700 ? 0.73 : 0.68) * r],
      u = (function (e, t, r, a) {
        let { x: n, y: i, angle: o } = e,
          s = (n - e.w / 2) * t,
          l = (n + e.w / 2) * t,
          d = (i - e.h / 2) * r,
          c = (i + e.h / 2) * r,
          u = 0.012 * Math.min(t, r),
          p = U([
            s,
            c - u,
            s,
            c - u + 0.55228475 * u,
            s + u - 0.55228475 * u,
            c,
            s + u,
            c,
            Y(s + u, l - u, 1 / 3),
            c,
            Y(s + u, l - u, 2 / 3),
            c,
            l - u,
            c,
            l - u + 0.55228475 * u,
            c,
            l,
            c - u + 0.55228475 * u,
            l,
            c - u,
            l,
            Y(c - u, d + u, 1 / 3),
            l,
            Y(c - u, d + u, 2 / 3),
            l,
            d + u,
            l,
            d + u - 0.55228475 * u,
            l - u + 0.55228475 * u,
            d,
            l - u,
            d,
            Y(l - u, s + u, 1 / 3),
            d,
            Y(l - u, s + u, 2 / 3),
            d,
            s + u,
            d,
            s + u - 0.55228475 * u,
            d,
            s,
            d + u - 0.55228475 * u,
            s,
            d + u,
            s,
            Y(d + u, c - u, 1 / 3),
            s,
            Y(d + u, c - u, 2 / 3),
            s,
            c - u,
          ]);
        for (let e = 0; e < p.length; e += 2) {
          let a = p[e] - n * t,
            s = p[e + 1] - i * r;
          {
            p[e] = n * t + a * Math.cos(o) - s * Math.sin(o);
            p[e + 1] = i * r + a * Math.sin(o) + s * Math.cos(o);
          }
        }
        let h = p[0],
          m = p[1],
          f = [
            ...a,
            Y(a[0], h, 0.58),
            a[1],
            h - 12 * Math.sin(o),
            m - 12 * Math.cos(o),
            h,
            m,
          ];
        for (let e = 0; e < 8; e++) {
          let t = Array.from(p.slice(6 * e, 6 * e + 8)),
            r = e % 2 ? 4 : 1;
          for (let e = 0; e < r; e++) {
            let a = es(t, (e + 1) / r)[0];
            {
              if (e) {
                a = es(a, e / (e + 1))[1];
              }
              f.push(...a.slice(2));
            }
          }
        }
        return (f.length - 2) / 6 === J
          ? U(f)
          : (function (e) {
              let t = [e[0], e[1]],
                r = (e.length - 2) / 6;
              for (let a = 0; a < r; a++) {
                let n = Math.floor(J / r) + +(a < J % r),
                  i = Array.from(e.slice(6 * a, 6 * a + 8));
                for (let e = 0; e < n; e++) {
                  let r = es(i, (e + 1) / n)[0];
                  {
                    if (e) {
                      r = es(r, e / (e + 1))[1];
                    }
                    t.push(...r.slice(2));
                  }
                }
              }
              return U(t);
            })(U(f));
      })(Z(e, t, o), t, r, c);
    if (0 === o && e < 444) {
      let r = ee(e, t, a, n),
        i = D(et(n), 444, e);
      u = r.map((e, t) => Y(e, u[t], i));
    }
    let p = D(505 + 6 * o, 555 + 5 * o, e),
      h = (function (e, t, r, a) {
        let n = [0.47, 0.37, 0.59][a] + 0.012 * D(550, 600, e),
          i = D(574, 596, e) * (1 - D(599, 626, e)),
          o = D(600 + 3 * a, 656, e),
          s = D(663, 714, e),
          l = [
            [-0.3, n],
            [0.04, n],
            [0.24, n + [-0.035, 0.05, -0.06][a]],
            [0.43, n + [-0.09, 0.065, -0.015][a]],
            [0.63, n + [-0.025, 0.1, -0.09][a]],
            [0.85, n + 0.04],
            [1.12, n + 0.06],
            [1.35, n + 0.055],
            [1.58, n + 0.05],
          ];
        for (let t = 0; t < l.length; t++) {
          let r = t / (l.length - 1),
            n = Math.sin(Math.PI * r) ** 3;
          {
            l[t][1] += n * i * [0.085, 0.18, -0.2][a];
            if (0 === a) {
              l[t][1] = Y(l[t][1], Y(0.735, 0.3, s), o);
            } else {
              l[t][1] += (1 === a ? -1 : 1) * o * 1.18;
            }
            l[t][0] += 0.04 * o * r + 0.06 * D(650, 714, e) * r;
          }
        }
        let d = Q(l),
          c = (d.length - 2) / 6;
        return Q(
          Array.from({ length: J + 1 }, (e, a) => {
            let n = (a / J) * c,
              i = Math.min(c - 1, Math.floor(n)),
              o = ea(d, i, n - i);
            return [o.x * t, o.y * r];
          }),
        );
      })(e, t, r, o);
    if (((u = u.map((e, t) => Y(e, h[t], p))), p > 0 && p < 1)) {
      let e = Q(
          Array.from({ length: 8 }, (e, t) => {
            let r = (t / 7) * J,
              a = Math.min(J - 1, Math.floor(r)),
              n = ea(u, a, r - a);
            return [n.x, n.y];
          }),
        ),
        t = Q(
          Array.from({ length: J + 1 }, (t, r) => {
            let a = (r / J) * 7,
              n = Math.min(6, Math.floor(a)),
              i = ea(e, n, a - n);
            return [i.x, i.y];
          }),
        ),
        r = Math.sin(Math.PI * p) ** 0.4;
      u = u.map((e, a) => Y(e, t[a], r));
    }
    i.push(u);
  }
  return i;
}
function ea(e, t, r) {
  let a = 6 * t,
    n = 1 - r,
    i = 3 * n * n * r,
    o = 3 * n * r * r,
    s = r * r * r;
  return {
    x: n * n * n * e[a] + i * e[a + 2] + o * e[a + 4] + s * e[a + 6],
    y: n * n * n * e[a + 1] + i * e[a + 3] + o * e[a + 5] + s * e[a + 7],
  };
}
function en(e) {
  let t = new Float64Array(((e.length - 2) / 6) * 32 + 1),
    r = { x: e[0], y: e[1] },
    a = 0;
  for (let n = 1; n < t.length; n++) {
    let i = ea(e, Math.floor((n - 1) / 32), (((n - 1) % 32) + 1) / 32);
    {
      a += Math.hypot(i.x - r.x, i.y - r.y);
      t[n] = a;
      r = i;
    }
  }
  return t;
}
function ei(e, t) {
  let r = F.map((r, a) => (0, $.workSymbolLayout)(e, t, a, r));
  return (0, B.createWorkPen)(
    r
      .flatMap((t, r) => [
        e,
        en(z($.WORK_PROJECTS[r].mark.path)).at(-1) * t.scale,
      ])
      .concat([0.6 * e, 0.54 * t]),
    e,
    t,
    F,
    G,
  );
}
function eo(e, t) {
  if (t <= 0) return 0;
  if (t >= e.at(-1)) return (e.length - 1) / 32;
  let r = 0,
    a = e.length - 1;
  for (; a - r > 1;) {
    let n = (r + a) >> 1;
    {
      if (e[n] < t) {
        r = n;
      } else {
        a = n;
      }
    }
  }
  return (r + (t - e[r]) / Math.max(1e-6, e[a] - e[r])) / 32;
}
function es(e, t) {
  let r = [Y(e[0], e[2], t), Y(e[1], e[3], t)],
    a = [Y(e[2], e[4], t), Y(e[3], e[5], t)],
    n = [Y(e[4], e[6], t), Y(e[5], e[7], t)],
    i = [Y(r[0], a[0], t), Y(r[1], a[1], t)],
    o = [Y(a[0], n[0], t), Y(a[1], n[1], t)],
    s = [Y(i[0], o[0], t), Y(i[1], o[1], t)];
  return [
    [e[0], e[1], ...r, ...i, ...s],
    [...s, ...o, ...n, e[6], e[7]],
  ];
}
function el(e, t, r = 0, a = t.at(-1)) {
  let n = eo(t, r),
    i = eo(t, a),
    o = (e.length - 2) / 6;
  if (i <= n) return "";
  let s = "";
  for (let t = Math.floor(n); t < Math.min(o, Math.ceil(i)); t++) {
    let r = Math.max(0, n - t),
      a = Math.min(1, i - t),
      o = Array.from(e.slice(6 * t, 6 * t + 8));
    {
      if (a < 1) {
        o = es(o, a)[0];
      }
      if (r > 0) {
        o = es(o, r / a)[1];
      }
    }
    let l = (e) => e.toFixed(3);
    {
      if (!s) {
        s = `M${l(o[0])} ${l(o[1])}`;
      }
      s += ` C${o.slice(2).map(l).join(" ")}`;
    }
  }
  return s;
}
export {
  er as systemPaths,
  en as arcLengths,
  el as pathSegment,
  ee as takeoverPath,
  X as finalMarkSegments,
  et as takeoverTime,
};
export function staticSystemsPaths(time) {
  return systemPathsForStill(time);
}
function systemPathsForStill(time) {
  return er(time, 1000, 650, 650, ei(1000, 650))
    .slice(0, time >= 656 ? 1 : 3)
    .map((points) => el(points, en(points)));
}
