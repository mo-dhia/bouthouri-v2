/** Reference path geometry and score measurements, ported to native DOM modules. */
let t = {
  wujhat: {
    id: "wujhat",
    meaning: "A flight taking shape",
    path: "M0 130 C38 130 92 171 86.59 147.35 L81.20 128.70 L87.38 125.41 L113.44 129.68 L157.53 103.97 L110.82 60.85 L123.18 54.28 L195.03 82.90 L242.35 61.14 Q259.12 52.22 265.41 53.40 Q268.12 54.23 267.29 56.93 Q264.38 62.11 247.98 71.73 L203.48 98.79 L187.03 174.36 L174.67 180.93 L165.04 118.10 L119.07 140.27 L108.04 164.26 L101.86 167.55 L89.41 152.65 C99 192 161 219 213 192 C261 167 275 130 320 130",
  },
  tranche: {
    id: "tranche",
    meaning: "Linked financial layers",
    path: "M0 130 C40 130 57 111 77 94 L123 62 Q135 54 147 62 L193 94 Q205 102 193 110 L147 142 Q135 150 123 142 L77 110 Q65 102 77 94 C105 76 151 163 181 147 L227 115 Q239 107 227 99 L181 67 Q169 59 157 67 L111 99 Q99 107 111 115 L157 147 Q169 155 181 147 C217 123 264 130 320 130",
  },
  remoteplatz: {
    id: "remoteplatz",
    meaning: "People connected beyond proximity",
    path: "M0 130 C35 130 62 130 79 130 C79 108 95 104 106 103 L106 85 C78 85 78 45 106 45 C134 45 134 85 106 85 L106 103 C137 103 151 124 154 145 C157 164 182 164 185 145 C188 124 202 103 230 103 L230 85 C202 85 202 45 230 45 C258 45 258 85 230 85 L230 103 C257 104 273 115 273 130 C295 130 306 130 320 130",
  },
  "8returns": {
    id: "8returns",
    meaning: "Two offset parcels in one continuing journey",
    path: "M0 130 C28 130 34 108 52 96 L102 66 L168 91 L110 122 L52 96 L52 152 L110 181 L110 122 L168 91 L168 150 L110 181 C148 200 192 194 214 142 L158 114 L158 51 L212 24 L270 49 L214 79 L158 51 L214 79 L214 142 L270 111 L270 49 C300 50 287 130 320 130",
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
    id: "wujhat",
    context: {
      company: { en: "RA3D", ar: "رعد" },
      location: { en: "Saudi Arabia", ar: "السعودية" },
      period: { start: "2024", end: null },
      websites: [
        { name: "Wujhat", domain: "wujhat.sa", url: "https://wujhat.sa" },
      ],
      role: {
        en: "Technical leadership across the product and system",
        ar: "القيادة التقنية للمنتج والنظام",
      },
    },
    seo: {
      en: {
        description:
          "A case study on building and technically directing Wujhat, connecting tailored travel, bookings, customer communication and operational tools.",
      },
      ar: {
        description:
          "دراسة عن بناء وجهات وتوجيهه تقنيًا، لربط الرحلات المصممة حسب الطلب بالحجوزات والتواصل مع العملاء وأدوات التشغيل.",
      },
    },
    mark: t.wujhat,
    slug: "wujhat",
    identity: {
      en: {
        name: "Wujhat",
        lines: ["Wujhat."],
        category: "TRAVEL TECHNOLOGY",
        descriptor: "From possibility to place.",
      },
      ar: {
        name: "وجهات",
        lines: ["وجهات"],
        category: "تقنيات السفر",
        descriptor: "من الفكرة إلى الوجهة.",
      },
    },
  },
  {
    id: "tranche",
    context: {
      company: { en: "Jibrel AG", ar: "Jibrel AG" },
      location: { en: "Switzerland / UAE", ar: "سويسرا / الإمارات" },
      period: { start: "2020", end: "2022" },
      websites: [
        {
          name: "Tranche Finance",
          domain: "tranche.finance",
          url: "https://tranche.finance",
        },
      ],
      role: {
        en: "Application development from the ground up / UI/UX",
        ar: "بناء التطبيق من البداية والمساهمة في تصميم تجربته وواجهته",
      },
    },
    seo: {
      en: {
        description:
          "Building Tranche Finance from the ground up as the product evolved from borrowing and lending through staking to structured risk management.",
      },
      ar: {
        description:
          "بناء تطبيق Tranche Finance من البداية، وتطوير بنيته وتجربته مع انتقال المنتج من الاقتراض والإقراض إلى التحصيص وإدارة المخاطر المهيكلة.",
      },
    },
    mark: t.tranche,
    slug: "tranche-finance",
    identity: {
      en: {
        name: "Tranche Finance",
        lines: ["Tranche", "Finance."],
        category: "DEFI / BLOCKCHAIN",
        descriptor: "A different financial structure.",
      },
      ar: {
        name: "Tranche Finance",
        lines: ["Tranche", "Finance."],
        category: "التمويل اللامركزي / البلوك تشين",
        descriptor: "بنية مختلفة للتمويل.",
      },
    },
  },
  {
    id: "remoteplatz",
    context: {
      company: { en: "Remoteplatz GmbH", ar: "Remoteplatz GmbH" },
      location: { en: "Germany", ar: "ألمانيا" },
      period: { start: "2019", end: "2020" },
      websites: [
        {
          name: "Remoteplatz",
          domain: "remoteplatz.ch",
          url: "https://remoteplatz.ch/",
        },
      ],
      role: {
        en: "Product development / development leadership for a period",
        ar: "تطوير المنتج وقيادة التطوير خلال فترة من العمل",
      },
    },
    seo: {
      en: {
        description:
          "Contributing to Remoteplatz and leading development for a period, connecting European companies with screened remote talent across several disciplines.",
      },
      ar: {
        description:
          "المساهمة في تطوير Remoteplatz وقيادة العمل خلال فترة منه، لربط الشركات الأوروبية بكفاءات مختارة للعمل عن بُعد في تخصصات متعددة.",
      },
    },
    mark: t.remoteplatz,
    slug: "remoteplatz",
    identity: {
      en: {
        name: "Remoteplatz",
        lines: ["Remoteplatz."],
        category: "REMOTE HIRING",
        descriptor: "Good people. Beyond proximity.",
      },
      ar: {
        name: "Remoteplatz",
        lines: ["Remoteplatz."],
        category: "التوظيف عن بُعد",
        descriptor: "كفاءات مميزة، أينما كانت.",
      },
    },
  },
  {
    id: "8returns",
    context: {
      company: { en: "malindo GmbH", ar: "malindo GmbH" },
      location: { en: "Germany", ar: "ألمانيا" },
      period: { start: "2018", end: "2020" },
      websites: [
        {
          name: "8returns",
          domain: "8returns.com",
          url: "http://8returns.com/",
        },
      ],
      role: {
        en: "Product development during the first two years",
        ar: "المساهمة في تطوير المنتج خلال أول عامين",
      },
    },
    seo: {
      en: {
        description:
          "Contributing to the first two years of a returns platform at Malindo, connecting customer, retailer and warehouse workflows as the product evolved.",
      },
      ar: {
        description:
          "المساهمة في أول عامين من تطوير منصة مرتجعات لدى Malindo، لربط تجارب العميل والمتجر والمستودع مع تطور المنتج.",
      },
    },
    mark: t["8returns"],
    slug: "8returns",
    identity: {
      en: {
        name: "8returns",
        lines: ["8", "returns."],
        category: "ECOMMERCE / RETURNS",
        descriptor: "The journey after the purchase.",
      },
      ar: {
        name: "8returns",
        lines: ["8returns."],
        category: "إدارة مرتجعات التجارة الإلكترونية",
        descriptor: "ما بعد الشراء جزء من التجربة.",
      },
    },
  },
].map((e, t) => ({ ...e, number: String(t + 1).padStart(2, "0") }));
export const WORK_PROJECTS = o;
export const projectCopy = function (e, t) {
  return e.identity[t];
};
export const projectHref = (e, t) => `/${e}/projects/${t}`;
