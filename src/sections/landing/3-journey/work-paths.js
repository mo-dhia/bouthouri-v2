/** Reference path geometry and score measurements, ported to native DOM modules. */
let t = {
  artefact: {
    id: "artefact",
    meaning: "A headset opening onto a skyline",
    path: "M0 130 C32 130 58 140 88 140 L98 140 L98 124 L110 113 L122 124 L122 140 L132 140 L132 101 L146 101 L146 140 L156 140 L156 131 C156 112 186 112 186 131 L186 140 L221.69 140 C223.53 120.18 221.5 97.41 218 82 Q238 82 250 94 C259 104 260 123 253 137 Q250 143 242 148 L217 163 L185 169 C177 170 178 148 161 150 C146 152 148 175 140 177 L103 183 C90 185 82 176 81 163 L77 120 Q76 108 79 102 C113 92 174 82 218 82 C223 104 225 141 217 163 C207 186 221 198 244 183 C277 162 287 130 320 130",
  },
  vawzen: {
    id: "vawzen",
    meaning: "A crowned browser window, built with a twist",
    path: "M0 130 C34 130 57 141 91 139 L77 65 Q76 61 80 64 L123 88 L150 32 Q152 28 154 32 L181 78 L229 45 Q232 43 232 47 L226 131 C184 151 132 158 91 139 C99 178 136 203 180 200 C246 196 271 130 320 130",
  },
  batiprix: {
    id: "batiprix",
    meaning: "A house measured and priced",
    path: "M0 130 C47 130 75 75 128 53 L192 25 L236 99 L172 128 L128 53 L86 100 L86 145 L116 158 L116 131 L143 143 L143 170 L172 183 L172 128 L236 99 L236 153 L172 183 L185.16 211.07 L182.19 204.73 L246.19 174.73 L238.55 158.43 L249.16 181.07 C257.65 199.18 286 130 320 130",
  },
  forecasting: {
    id: "forecasting",
    meaning: "Evidence opening into possible futures",
    path: "M0 130 C16 130 24 137 35 138 L54 123 L67 130 L81 108 L99 116 L112 103 L131 108 C148.5 101 168 86.75 189.75 71.63 C211.5 56.5 235.5 40.5 262 30 C271 49 275.75 73.5 275.88 98.63 C276 123.75 271.5 149.5 262 171 C237 163 213 150.75 190.88 138.75 C168.75 126.75 148.5 115 131 108 C148 113 169 110 191.25 106.13 C213.5 102.25 237 97.5 259 99 C272 99.5 280 107.25 288.38 114.88 C296.75 122.5 305.5 130 320 130",
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
