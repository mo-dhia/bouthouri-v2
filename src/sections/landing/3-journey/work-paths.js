/** Reference path geometry and score measurements, ported to native DOM modules. */
let t = {
  artefact: {
    id: "artefact",
    meaning: "A VR headset with a skyline in its visor",
    path: "M0 130 C18 130 38 122 56 122 L56 116 C56 112.69 58.69 110 62 110 L76 110 L76 100 C76 85.64 87.64 74 102 74 L218 74 C232.36 74 244 85.64 244 100 L244 110 L244 122 L244 134 L244 122 L244 110 L258 110 C261.31 110 264 112.69 264 116 L264 122 L244 122 L233 122 L233 100 C233 91.72 226.28 85 218 85 L102 85 C93.72 85 87 91.72 87 100 L87 122 L87 140 C87 148.28 93.72 155 102 155 L119 155 C121.88 140.12 137.45 131 160 131 C182.55 131 198.12 140.12 201 155 L218 155 C226.28 155 233 148.28 233 140 L233 122 L218 122 L218 110 L203 110 L203 122 L195 122 L195 100 L180 100 L180 122 L141 122 L141 89 L126 89 L126 122 L118 122 L118 106 L106.5 93 L95 106 L95 122 L87 122 L76 122 L56 122 L56 128 C56 131.31 58.69 134 62 134 L76 134 L76 122 L76 110 L76 122 L76 134 L76 140 C76 154.36 87.64 166 102 166 L130 166 C132.88 151.12 143.5 142 160 142 C176.5 142 187.12 151.12 190 166 L218 166 C232.36 166 244 154.36 244 140 L244 134 L258 134 C261.31 134 264 131.31 264 128 L264 122 C282 122 302 130 320 130",
  },
  vawzen: {
    id: "vawzen",
    meaning: "A browser with growth bars, a phone, and a like",
    path: "M0 130 C14 130 18 84 30 84 L30 80 C30 74.48 34.48 70 40 70 L176 70 C181.52 70 186 74.48 186 80 L186 160 C186 165.52 181.52 170 176 170 L106 170 L106 130 L92 130 L92 170 L84 170 L84 143 L70 143 L70 170 L62 170 L62 155 L48 155 L48 170 L40 170 C34.48 170 30 165.52 30 160 L30 84 L43 84 C45.49 84 47.5 81.99 47.5 79.5 C47.5 77.01 45.49 75 43 75 C40.51 75 38.5 77.01 38.5 79.5 C38.5 81.99 40.51 84 43 84 L55 84 C57.49 84 59.5 81.99 59.5 79.5 C59.5 77.01 57.49 75 55 75 C52.51 75 50.5 77.01 50.5 79.5 C50.5 81.99 52.51 84 55 84 L67 84 C69.49 84 71.5 81.99 71.5 79.5 C71.5 77.01 69.49 75 67 75 C64.51 75 62.5 77.01 62.5 79.5 C62.5 81.99 64.51 84 67 84 L226 84 L226 63 C226 55.82 220.18 50 213 50 L205 50 C202 50 203 56 199 56 L189 56 C185 56 186 50 183 50 L175 50 C167.82 50 162 55.82 162 63 L162 167 C162 174.18 167.82 180 175 180 L213 180 C220.18 180 226 174.18 226 167 L226 84 C240 84 252.4 108.93 266 99.87 C259.2 93.07 249 86.27 249 77.2 C249 68.13 262.6 64.73 266 74.93 C269.4 64.73 283 68.13 283 77.2 C283 86.27 272.8 93.07 266 99.87 C279.6 108.93 300 130 320 130",
  },
  batiprix: {
    id: "batiprix",
    meaning: "A house and its price",
    path: "M0 130 C40 130 62 70 90.48 56.98 L145.52 32.9 L183.36 96.54 L128.32 121.48 L90.48 56.98 L54.36 97.4 L54.36 136.1 L80.16 147.28 L80.16 124.06 L103.38 134.38 L103.38 157.6 L128.32 168.78 L128.32 121.48 L128.32 168.78 L183.36 142.98 L183.36 96.54 C193.36 100.54 194.73 117 208.73 117 L220.73 117 L240.73 117 L220.73 117 C223.23 105.1 231.9 95.44 243.46 91.67 C255.02 87.91 267.71 90.6 276.75 98.73 C267.71 90.6 255.02 87.91 243.46 91.67 C231.9 95.44 223.23 105.1 220.73 117 C219.76 121.62 219.76 126.38 220.73 131 L240.73 131 L220.73 131 L208.73 131 L220.73 131 C223.23 142.9 231.9 152.56 243.46 156.33 C255.02 160.09 267.71 157.4 276.75 149.27 C288.75 141.27 300 130 320 130",
  },
  forecasting: {
    id: "forecasting",
    meaning: "A systems card where a seasonal trend fans into forecasts",
    path: "M0 130 C18 130 26 150 44 150 L44 153 L44 156 L44 159 L44 162 L44 165 L44 168 C44 173.52 48.48 178 54 178 L88 178 L88 171 L88 178 L132 178 L132 171 L132 178 L176 178 L176 171 L176 178 L220 178 L220 171 L220 178 L229.5 178 L239 178 L248.5 178 L258 178 C263.52 178 268 173.52 268 168 L268 161.47 L268 154.95 L268 148.42 L268 141.89 L268 135.37 L268 128.84 L268 122.32 L268 115.79 L268 109.26 L268 102.74 L268 96.21 L268 89.68 L268 83.16 L268 76.63 L268 70.11 L268 63.58 L268 57.05 L268 50.53 L268 44 C268 38.48 263.52 34 258 34 L247.26 34 L236.53 34 L225.79 34 L215.05 34 L204.32 34 L193.58 34 L182.84 34 L172.11 34 L161.37 34 L150.63 34 L139.89 34 L129.16 34 L118.42 34 L107.68 34 L96.95 34 L86.21 34 L75.47 34 L64.74 34 L54 34 C48.48 34 44 38.48 44 44 L44 150 C46.75 145.54 49.25 141.48 52.25 140.61 C58.26 138.87 62.74 151.56 68.75 149.82 C74.76 148.08 79.24 132.78 85.25 131.04 C91.26 129.3 95.74 141.99 101.75 140.25 C107.76 138.51 112.24 123.21 118.25 121.47 C124.26 119.73 128.74 132.42 134.75 130.68 C140.76 128.94 145.24 113.64 151.25 111.9 C157.26 110.16 161.74 122.85 167.75 121.11 C170.75 120.24 173.25 116.18 176 111.72 C202 97.72 224 61.04 268 61.04 L268 109.04 C224 109.04 202 123.72 176 111.72 C206.67 102.83 237.33 93.93 268 85.04 C286 79.82 300 130 320 130",
  },
};
Object.values(t);
let r = [1.11, 1.13, 1.12, 1.12],
  n = new Map();
export const WORK_MARKS = t;
export const WORK_SYMBOL_GROWTH = r;
export const createWorkOrigin = () => ({
  x: 0.75,
  y: 0.65,
  radius: 4,
  ready: !1,
  direction: "ltr",
});
export const directedWorkPath = function (e, t = 1) {
  if (t > 0) return e;
  let r = n.get(e);
  if (r) return r;
  let o = e.match(/[MLCQ]|-?\d*\.?\d+/g),
    i = [],
    a = [0, 0];
  for (let e = 0; e < o.length;) {
    let t = o[e++],
      r = "C" === t ? 6 : "Q" === t ? 4 : 2,
      n = o.slice(e, e + r).map(Number);
    {
      e += r;
      if ("M" !== t) {
        i.push({ command: t, start: a, values: n });
      }
      a = n.slice(-2);
    }
  }
  let s = [`M${a.join(" ")}`];
  for (let { command: e, start: t, values: r } of i.reverse()) {
    let n =
      "C" === e
        ? [...r.slice(2, 4), ...r.slice(0, 2)]
        : "Q" === e
          ? r.slice(0, 2)
          : [];
    s.push(`${e}${[...n, ...t].join(" ")}`);
  }
  let l = s.join(" ");
  return (n.set(e, l), l);
};
export const placeWorkPath = function (e, t, r, n) {
  let o = 0;
  return e.replace(/-?\d*\.?\d+/g, (e) =>
    String(Number(e) * n + (o++ % 2 ? r : t)),
  );
};
export const workSymbolLayout = function (e, t, n, o, i = !0, a = 1) {
  let s = e <= 700,
    l =
      (s ? Math.min(0.966 * e, 0.476 * t) : Math.min(0.5115 * e, 0.66 * t)) *
      (i ? r[n] : 1),
    c = s ? 0.5 : 0.72,
    u = (o * a + (a < 0 ? 1 - c : c)) * e - l / 2;
  return {
    x: u,
    entryX: a < 0 ? u + l : u,
    exitX: a < 0 ? u : u + l,
    y: t * (s ? 0.58 : 0.6) + (n % 2 ? 0.028 * t : 0) - (130 * l) / 320,
    scale: l / 320,
    size: l,
  };
};
let o = [
  {
    id: "artefact",
    context: {
      company: { en: "Artefact Studio", ar: "Artefact Studio" },
      location: { en: "Tunisia", ar: "تونس" },
      period: { start: null, end: null },
      websites: [
        {
          name: "Artefact Studio",
          domain: "artefactstudio.org",
          url: "https://artefactstudio.org/",
        },
      ],
      role: {
        en: "Design & development, through Vawzen",
        ar: "التصميم والتطوير عبر Vawzen",
      },
    },
    seo: {
      en: {
        description: "A case study of Artefact Studio, bringing architectural design, visualization and 360° virtual tours into an immersive web experience.",
      },
      ar: {
        description: "دراسة حالة لمشروع Artefact Studio، تجمع التصميم المعماري والإظهار والجولات الافتراضية بزاوية 360 درجة في تجربة ويب غامرة.",
      },
    },
    mark: t.artefact,
    slug: "artefact",
    identity: {
      en: {
        name: "Artefact Studio",
        lines: ["Artefact", "Studio."],
        category: "ARCHITECTURE / 360° TOURS",
        descriptor: "Walk it before it is built.",
      },
      ar: {
        name: "Artefact Studio",
        lines: ["Artefact", "Studio."],
        category: "العمارة / الجولات الافتراضية",
        descriptor: "تجوّل في المكان قبل أن يُبنى.",
      },
    },
  },
  {
    id: "vawzen",
    context: {
      company: { en: "Vawzen", ar: "Vawzen" },
      location: { en: "Tunis, Tunisia", ar: "تونس" },
      period: { start: "2020", end: null },
      websites: [
        {
          name: "Vawzen",
          domain: "vawzen.org",
          url: "https://vawzen.org/",
        },
      ],
      role: {
        en: "Full-stack development & interactions",
        ar: "تطوير الويب المتكامل والتفاعلات",
      },
    },
    seo: {
      en: {
        description: "A case study on developing Vawzen's agency website, bringing its brand, digital services and selected work into one expressive experience. Built by Med D. Bouthouri with a focus on interactive web development.",
      },
      ar: {
        description: "دراسة حالة لتطوير موقع وكالة Vawzen، يجمع هويتها وخدماتها الرقمية ومختارات من أعمالها في تجربة معبّرة. طوّره محمد ضياء بوثوري مع التركيز على التفاعل وتجربة الويب.",
      },
    },
    mark: t.vawzen,
    slug: "vawzen",
    identity: {
      en: {
        name: "Vawzen",
        lines: ["Vawzen."],
        category: "DIGITAL AGENCY",
        descriptor: "Digital craft, with a twist.",
      },
      ar: {
        name: "Vawzen",
        lines: ["Vawzen."],
        category: "وكالة رقمية",
        descriptor: "حِرفة رقمية بلمسة مختلفة.",
      },
    },
  },
  {
    id: "batiprix",
    context: {
      company: { en: "Infopro Digital", ar: "Infopro Digital" },
      location: { en: "France", ar: "فرنسا" },
      period: { start: "2023", end: "2025" },
      websites: [
        {
          name: "Batiprix",
          domain: "batiprix.com",
          url: "https://www.batiprix.com/",
        },
      ],
      role: {
        en: "Head of the JavaScript department",
        ar: "رئيس قسم جافاسكريبت",
      },
    },
    seo: {
      en: {
        description: "A case study on JavaScript leadership and workflow automation for Batiprix at Infopro Digital, connecting construction pricing data, internal tools and client applications to support reliable project estimates.",
      },
      ar: {
        description: "دراسة حالة حول قيادة تطوير تطبيقات جافاسكريبت وأتمتة سير العمل في Batiprix ضمن Infopro Digital، لربط بيانات تكاليف البناء بالأدوات الداخلية وتطبيقات العملاء ودعم إعداد تقديرات موثوقة للمشاريع.",
      },
    },
    mark: t.batiprix,
    slug: "batiprix",
    identity: {
      en: {
        name: "Batiprix",
        lines: ["Batiprix."],
        category: "CONSTRUCTION PRICING",
        descriptor: "From blueprint to clear cost.",
      },
      ar: {
        name: "Batiprix",
        lines: ["Batiprix."],
        category: "تسعير أعمال البناء",
        descriptor: "من المخطّط إلى كلفة واضحة.",
      },
    },
  },
  {
    id: "forecasting",
    context: {
      company: { en: "FORAXION", ar: "FORAXION" },
      location: { en: "London / Tunis", ar: "لندن / تونس" },
      period: { start: "2025", end: null },
      websites: [
        {
          name: "The Forecasting Machine",
          domain: "theforecastingmachine.com",
          url: "https://theforecastingmachine.com/",
        },
      ],
      role: {
        en: "Senior software engineer / frontend lead",
        ar: "مهندس برمجيات أول وقائد تطوير الواجهات",
      },
    },
    seo: {
      en: {
        description: "A case study on leading frontend architecture for The Forecasting Machine, bringing evidence-backed AI forecasts, probability tracking and collaborative decision tools into a clear product experience.",
      },
      ar: {
        description: "دراسة حالة في قيادة بنية الواجهات لمنصة The Forecasting Machine، وتجسيد تنبؤات الذكاء الاصطناعي المدعومة بالأدلة في تجربة واضحة لمتابعة الاحتمالات ودعم القرار الجماعي.",
      },
    },
    mark: t.forecasting,
    slug: "the-forecasting-machine",
    identity: {
      en: {
        name: "The Forecasting Machine",
        lines: ["The Forecasting", "Machine."],
        category: "AI FORECASTING",
        descriptor: "From uncertainty to informed action.",
      },
      ar: {
        name: "The Forecasting Machine",
        lines: ["The Forecasting", "Machine."],
        category: "التنبؤ بالذكاء الاصطناعي",
        descriptor: "من الغموض إلى قرار بصير.",
      },
    },
  },
].map((e, t) => ({ ...e, number: String(t + 1).padStart(2, "0") }));
export const WORK_PROJECTS = o;
export const projectCopy = function (e, t) {
  return e.identity[t];
};
export const projectHref = (e, t) => `/${e}/projects/${t}`;
