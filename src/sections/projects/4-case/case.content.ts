import 'server-only';

import type { Locale } from '@/i18n/routing';
import type { CaseId } from './case-geometry';

/** Case-page chrome, translated from the original's caseUi and context labels. */
export const caseUi = {
  en: {
    starting: 'THE STARTING POINT', inside: 'THE PRODUCT IN PRACTICE', closer: 'A CLOSER READING', through: 'THE THROUGH LINE',
    concept: 'Explore the conceptual model', read: 'READ THE STORY', projects: 'PROJECTS', back: 'BACK TO PROJECTS',
    previous: 'PREVIOUS PROJECT', next: 'NEXT PROJECT', skip: 'Skip to the story',
    context: 'PROJECT CONTEXT', company: 'COMPANY', location: 'LOCATION', period: 'PERIOD', present: 'Present', role: 'ROLE',
    website: 'WEBSITE', websites: 'WEBSITES', external: 'Opens in a new tab',
  },
  ar: {
    starting: 'نقطة البداية', inside: 'المنتج في الاستخدام', closer: 'نظرة أقرب', through: 'الفكرة التي تجمعها',
    concept: 'استكشف النموذج المفاهيمي', read: 'اقرأ القصة', projects: 'المشاريع', back: 'العودة للمشاريع',
    previous: 'المشروع السابق', next: 'المشروع التالي', skip: 'انتقل إلى القصة',
    context: 'عن المشروع', company: 'الشركة', location: 'المكان', period: 'الفترة', present: 'حتى الآن', role: 'الدور',
    website: 'الموقع الإلكتروني', websites: 'المواقع الإلكترونية', external: 'يفتح في علامة تبويب جديدة',
  },
} as const;

type Step = { label: string; title: string; copy: string[] };
export type CaseFigure =
  | { kind: 'tour'; spaces: { meta: string; name: string }[]; caption: string }
  | { kind: 'fold'; labels: string[] }
  | { kind: 'trip'; sides: string[]; services: string[]; caption: string }
  | { kind: 'reference'; spine: string; perspectives: string[] };
export type CaseStory = {
  deck: string; thesis: string[]; context: string[]; fieldTitle: string; word?: string; labels: string[]; steps: Step[]; note: string;
  detailTitle: string[]; detailCopy: string[]; detailLink?: { label: string; route: string }; figure: CaseFigure; reflection: string[]; closing: string[];
};

/** Facts come from each product's public site, its source and the author's own records; nothing here is invented to fill a layout. */
const stories: Record<CaseId, Record<Locale, CaseStory>> = {
  artefact: {
    en: {
      deck: 'Architecture you can walk through, before the first stone.',
      thesis: ['Step inside', 'before it is built.'],
      context: [
        'Artefact Studio is a practice for architecture, design and visualization: interiors, exteriors, 3D renders, CG animation and virtual tours. Its mission is plain, “We help people feel good in a space”, and its rule is older: less is more.',
        'Through Vawzen, I designed and developed the studio’s website: sixteen projects, four languages including right-to-left Arabic, and tours you can actually walk.',
      ],
      fieldTitle: 'From a brief to a place you can visit.',
      word: 'walk',
      labels: ['Brief', 'Render', 'Tour'],
      steps: [
        { label: 'Brief', title: 'Start with what you have.', copy: ['The request form begins with what a client already holds: PDF or AutoCAD drawings, a sketch, a 3D model, site photos, measurements, references or a moodboard. A budget band follows, from under 2K to above 10K USD, with the option to ask for help estimating.'] },
        { label: 'Render', title: 'Drafts before finals.', copy: ['Preliminary results come back for review and feedback before the final visualization is made. The site sets out that rhythm before anyone writes, so a draft never arrives as a surprise.'] },
        { label: 'Tour', title: 'Then, walk it.', copy: ['The finished space becomes a 360° Pano2VR tour, with WebXR for headsets. Hotspots join the viewpoints, so a visitor moves from room to room instead of flicking through a slideshow.'] },
      ],
      note: 'The plan is drawn; the walk is the visitor’s. Each ring is a viewpoint, each opening a hotspot.',
      detailTitle: ['Seven panoramas,', 'eighteen hotspots.'],
      detailCopy: [
        'Two tours live on the site: a café in three panoramas and a villa in four. Every viewpoint opens onto every other, six hotspots in the café and twelve in the villa, so there is no wrong turn and no dead end.',
        'Hotspot labels follow the page language, Arabic included.',
      ],
      detailLink: { label: 'Walk the café tour', route: '/projects/360-tour' },
      figure: { kind: 'tour', spaces: [{ meta: '01 · 3 PANORAMAS / 6 HOTSPOTS', name: 'Café' }, { meta: '02 · 4 PANORAMAS / 12 HOTSPOTS', name: 'Villa' }], caption: 'ONE WALK THROUGH EACH SPACE — A RING PER PANORAMA, A TICK PER HOTSPOT' },
      reflection: ['A brief becomes', 'a place to visit.'],
      closing: ['The site does the studio’s first job before anyone calls: it lets people stand in a room that does not exist yet, and decide how it should feel.'],
    },
    ar: {
      deck: 'عمارة يمكنك التجوّل فيها قبل وضع الحجر الأول.',
      thesis: ['ادخل المكان', 'قبل أن يُبنى.'],
      context: [
        'آرتيفاكت ستوديو مكتب للعمارة والتصميم والإظهار المعماري: تصميم داخلي وخارجي، وصور ثلاثية الأبعاد، ورسوم متحركة، وجولات افتراضية. رسالته بسيطة: «نساعد الناس على الشعور بالراحة في المكان»، وقاعدته أقدم منها: الأقل أكثر.',
        'عبر Vawzen صمّمت موقع الاستوديو وطوّرته: ستة عشر مشروعًا، وأربع لغات منها العربية من اليمين إلى اليسار، وجولات يمكن التجوّل فيها فعلًا.',
      ],
      fieldTitle: 'من موجز المشروع إلى مكان يمكن زيارته.',
      word: 'تجوّل',
      labels: ['الموجز', 'التصوّر', 'الجولة'],
      steps: [
        { label: 'الموجز', title: 'ابدأ بما لديك.', copy: ['يبدأ نموذج الطلب بما يملكه العميل: مخططات PDF أو AutoCAD، رسم أولي، نموذج ثلاثي الأبعاد، صور الموقع، قياسات، مراجع أو لوحة إلهام. ثم تأتي فئة الميزانية، من أقل من 2K إلى أكثر من 10K دولار، مع خيار طلب المساعدة في التقدير.'] },
        { label: 'التصوّر', title: 'مسودات قبل النسخة النهائية.', copy: ['تُعرض النتائج الأولية للمراجعة والملاحظات قبل إنجاز الإظهار النهائي. يشرح الموقع هذا الإيقاع قبل أن يكتب أحد، فلا تصل مسودة على سبيل المفاجأة.'] },
        { label: 'الجولة', title: 'ثم تجوّل فيه.', copy: ['يتحوّل المكان المكتمل إلى جولة Pano2VR بزاوية 360°، مع دعم WebXR لنظارات الواقع الافتراضي. نقاط التنقّل تربط زوايا الرؤية، فينتقل الزائر من غرفة إلى أخرى بدل تقليب عرض شرائح.'] },
      ],
      note: 'المخطط مرسوم، والمسار للزائر. كل حلقة زاوية رؤية، وكل فتحة نقطة تنقّل.',
      detailTitle: ['سبع صور بانورامية،', 'ثماني عشرة نقطة تنقّل.'],
      detailCopy: [
        'على الموقع جولتان: مقهى في ثلاث صور بانورامية وفيلا في أربع. كل زاوية رؤية تنفتح على كل الزوايا الأخرى، ست نقاط تنقّل في المقهى واثنتا عشرة في الفيلا، فلا منعطف خاطئ ولا طريق مسدود.',
        'تتبع تسميات نقاط التنقّل لغة الصفحة، والعربية منها.',
      ],
      detailLink: { label: 'تجوّل في المقهى', route: '/projects/360-tour' },
      figure: { kind: 'tour', spaces: [{ meta: '01 · 3 صور بانورامية / 6 نقاط تنقّل', name: 'مقهى' }, { meta: '02 · 4 صور بانورامية / 12 نقطة تنقّل', name: 'فيلا' }], caption: 'مسار واحد في كل مكان: حلقة لكل صورة بانورامية، وعلامة لكل نقطة تنقّل' },
      reflection: ['يصير الموجز', 'مكانًا يُزار.'],
      closing: ['يؤدي الموقع أول مهمة للاستوديو قبل أي اتصال: يتيح للناس الوقوف في غرفة لم توجد بعد، واختيار الإحساس الذي يريدونه فيها.'],
    },
  },
  vawzen: {
    en: {
      deck: 'An agency site that refuses to look like everyone else’s.',
      thesis: ['In a sea of sameness,', 'build the twist.'],
      context: [
        'Vawzen is a digital agency in El Aouina, Tunis. It shapes startups, then designs and builds the apps and websites they run on.',
        'I have worked there as a full-stack developer since 2020. In the summer of 2023 we built the agency’s own website, the one project where the client is also the critic.',
      ],
      fieldTitle: 'An agency site that argues for itself.',
      word: 'twist',
      labels: ['Voice', 'Craft', 'Contact'],
      steps: [
        { label: 'Voice', title: 'Copy that picks a fight.', copy: ['The site opens on a claim, the world is drowning in a sea of sameness, and backs it with a counter of 1,392,620 Apple look-alikes. For a startup, the argument goes, it is evolve or die.'] },
        { label: 'Craft', title: 'Motion written in-house.', copy: ['The scroll interactions run on our own library, vz-scroll-interactions, published on npm. Owning the engine let the motion follow the copy instead of a template.'] },
        { label: 'Contact', title: 'A brief in three steps.', copy: ['“Let’s join forces!” opens a short guided brief: first the lay of the land, then the primary goal, then the kind of project, from a mobile app or a website to an admin dashboard, a renovation, business automation or a full solution.'] },
      ],
      note: 'Four squares stand still. The fifth turns as it travels: the same shape, said differently.',
      detailTitle: ['The same craft,', 'for other people.'],
      detailCopy: [
        'The same team carried that work to clients. For Artefact Studio, a four-language site with tours you can walk.',
        'For CCI Services, between January and April 2025: a site scoring around 98 on PageSpeed and first on Google for “cci nettoyage”, with an on-demand AI chatbot and a blog that syncs with its social channels.',
      ],
      figure: { kind: 'fold', labels: ['Vawzen', 'Artefact Studio', 'CCI Services'] },
      reflection: ['Say it differently,', 'then make it move.'],
      closing: ['The footer closes the argument the way the first screen opened it: “We push boundaries, question assumptions and get results. Ready?”'],
    },
    ar: {
      deck: 'موقع وكالة يرفض أن يشبه مواقع الآخرين.',
      thesis: ['في بحر من التشابه،', 'اصنع اللمسة.'],
      context: [
        'Vawzen وكالة رقمية في العوينة بتونس. تساعد الشركات الناشئة على التشكّل، ثم تصمّم وتبني التطبيقات والمواقع التي تعمل عليها.',
        'أعمل فيها مطوّر ويب متكاملًا منذ 2020. في صيف 2023 بنينا موقع الوكالة نفسها، المشروع الوحيد الذي يكون فيه العميل هو الناقد أيضًا.',
      ],
      fieldTitle: 'موقع وكالة يدافع عن نفسه.',
      word: 'اللمسة',
      labels: ['الصوت', 'الحِرفة', 'التواصل'],
      steps: [
        { label: 'الصوت', title: 'نصوص تختار المواجهة.', copy: ['يفتتح الموقع بادّعاء: العالم يغرق في بحر من التشابه، ثم يسنده بعدّاد يبلغ 1,392,620 نسخة تشبه Apple. والحجة واضحة لكل شركة ناشئة: تطوّر أو تندثر.'] },
        { label: 'الحِرفة', title: 'حركة مكتوبة داخليًا.', copy: ['تعمل تفاعلات التمرير على مكتبتنا الخاصة vz-scroll-interactions المنشورة على npm. امتلاك المحرّك سمح للحركة بأن تتبع النص بدل قالب جاهز.'] },
        { label: 'التواصل', title: 'موجز في ثلاث خطوات.', copy: ['تفتح عبارة «لنوحّد قوانا!» موجزًا قصيرًا موجّهًا: أولًا التعرّف على الوضع، ثم الهدف الرئيسي، ثم نوع المشروع، من تطبيق جوال أو موقع إلى لوحة تحكم أو تجديد أو أتمتة أعمال أو حل متكامل.'] },
      ],
      note: 'أربعة مربعات ثابتة، والخامس يدور وهو يتقدّم: الشكل نفسه، بطريقة مختلفة.',
      detailTitle: ['الحِرفة نفسها،', 'لأشخاص آخرين.'],
      detailCopy: [
        'حمل الفريق نفسه هذا العمل إلى العملاء. لآرتيفاكت ستوديو، موقع بأربع لغات وجولات يمكن التجوّل فيها.',
        'ولـ CCI Services، بين يناير وأبريل 2025: موقع بنتيجة تقارب 98 على PageSpeed وفي المرتبة الأولى على Google لعبارة «cci nettoyage»، مع روبوت محادثة بالذكاء الاصطناعي عند الطلب ومدوّنة تتزامن مع قنواته الاجتماعية.',
      ],
      figure: { kind: 'fold', labels: ['Vawzen', 'Artefact Studio', 'CCI Services'] },
      reflection: ['قلها بطريقة مختلفة،', 'ثم اجعلها تتحرّك.'],
      closing: ['يختم التذييل الحجة كما افتتحتها الشاشة الأولى: «نتجاوز الحدود، ونسائل المسلّمات، ونحقّق النتائج. مستعد؟»'],
    },
  },
  batiprix: {
    en: {
      deck: 'Thirty thousand construction prices, kept current every month.',
      thesis: ['A price is a promise', 'that has to stay true.'],
      context: [
        'Batiprix has been the French reference for construction estimating since 1983, published by Groupe Moniteur within Infopro Digital. Its library holds more than 30,000 ouvrages, each priced from labour time, hourly rate and materials: the déboursé sec.',
        'From 2023 to 2025 I led the JavaScript department, taking its tools from conception to deployment.',
      ],
      fieldTitle: 'From a yearly spreadsheet to a living library.',
      labels: ['Once a year, by hand', 'Read at source', 'Every month'],
      steps: [
        { label: 'Collect', title: 'Read prices at the source.', copy: ['Reusable Puppeteer routines read supplier sites and PDF catalogues directly. Our update cycle went from once a year to once a month.'] },
        { label: 'Maintain', title: 'One workspace behind every number.', copy: ['A React dashboard replaced the Excel workflow: supplies, materials, ouvrages, companies and settings in one place, edited by the people who answer for the prices.'] },
        { label: 'Deliver', title: 'One codebase, web and Windows.', copy: ['Clients read the same library in the browser or on the desktop, from one React and Electron codebase.'] },
      ],
      note: 'The dotted curve is the market. The bright line is the price a client reads: from one yearly step to twelve monthly ones.',
      detailTitle: ['Two databases,', 'one daily sync.'],
      detailCopy: [
        'An internal base where prices are prepared, a client base where they are read, and a synchronization between them every day, with caching and load balancing in front.',
        'Nine lots and twenty-three trades travel that path every day.',
      ],
      figure: { kind: 'trip', sides: ['Supplier sites & PDFs', 'Internal base', 'Client base'], services: ['Puppeteer routines', 'React dashboard', 'React + Electron'], caption: 'ONE PRICE — READ AT SOURCE, SYNCED DAILY, DELIVERED TO WEB AND WINDOWS' },
      reflection: ['Keep the number honest,', 'every month.'],
      closing: ['An estimate is only as good as the price under it. The work was making sure that price was read, checked and delivered on time, and that nobody had to type it twice.'],
    },
    ar: {
      deck: 'ثلاثون ألف سعر للبناء، محدّثة كل شهر.',
      thesis: ['السعر وعد', 'يجب أن يبقى صادقًا.'],
      context: [
        'Batiprix هو المرجع الفرنسي في تقدير كلفة البناء منذ 1983، تصدره مجموعة Moniteur ضمن Infopro Digital. تضم مكتبته أكثر من 30,000 بند أشغال، يُحسب سعر كلٍّ منها من وقت العمل والأجر الساعي والمواد: الكلفة المباشرة.',
        'من 2023 إلى 2025 قدت قسم جافاسكريبت، وحملت أدواته من التصوّر إلى النشر.',
      ],
      fieldTitle: 'من جدول سنوي إلى مكتبة حيّة.',
      labels: ['مرة في السنة، يدويًا', 'من المصدر مباشرة', 'كل شهر'],
      steps: [
        { label: 'الجمع', title: 'اقرأ الأسعار من مصدرها.', copy: ['تقرأ إجراءات Puppeteer قابلة لإعادة الاستخدام مواقع الموردين وكتالوجات PDF مباشرة. انتقلت دورة التحديث لدينا من مرة في السنة إلى مرة في الشهر.'] },
        { label: 'الصيانة', title: 'مساحة عمل واحدة خلف كل رقم.', copy: ['حلّت لوحة تحكم React محل سير العمل على Excel: التوريدات والمواد وبنود الأشغال والشركات والإعدادات في مكان واحد، يحرّرها من يتحمّلون مسؤولية الأسعار.'] },
        { label: 'التسليم', title: 'شيفرة واحدة للويب وWindows.', copy: ['يقرأ العملاء المكتبة نفسها في المتصفح أو على سطح المكتب، من شيفرة React وElectron واحدة.'] },
      ],
      note: 'المنحنى المنقّط هو السوق، والخط المضيء هو السعر الذي يقرؤه العميل: من درجة سنوية واحدة إلى اثنتي عشرة درجة شهرية.',
      detailTitle: ['قاعدتا بيانات،', 'ومزامنة يومية واحدة.'],
      detailCopy: [
        'قاعدة داخلية تُعَدّ فيها الأسعار، وقاعدة للعملاء تُقرأ فيها، ومزامنة بينهما كل يوم، مع التخزين المؤقت وموازنة الحمل في الواجهة.',
        'تسعة أقسام أشغال وثلاث وعشرون حرفة تسلك هذا المسار كل يوم.',
      ],
      figure: { kind: 'trip', sides: ['مواقع الموردين وملفات PDF', 'القاعدة الداخلية', 'قاعدة العملاء'], services: ['إجراءات Puppeteer', 'لوحة React', 'React + Electron'], caption: 'سعر واحد: يُقرأ من مصدره، ويُزامَن يوميًا، ويصل إلى الويب وWindows' },
      reflection: ['أبقِ الرقم صادقًا،', 'كل شهر.'],
      closing: ['لا يصلح التقدير إلا بقدر صلاح السعر الذي تحته. كان العمل أن يُقرأ ذلك السعر ويُراجَع ويصل في وقته، دون أن يضطر أحد إلى كتابته مرتين.'],
    },
  },
  forecasting: {
    en: {
      deck: 'Evidence-backed forecasts, from a question to a probability.',
      thesis: ['The future is uncertain,', 'not unmeasurable.'],
      context: [
        'The Forecasting Machine is built by FORAXION, a London company founded in 2024 as an AI-first spinoff of Hypermind, which has run prediction markets for businesses since 2000. It turns open questions into reasoned probabilities, then keeps them current against millions of articles.',
        'Since 2025 I have led its frontend architecture: a clean white interface driven by the reading experience, developed once and shipped across web, desktop and mobile.',
      ],
      fieldTitle: 'A probability you can read, and defend.',
      word: 'measure',
      labels: ['Question', 'Evidence', 'Probability'],
      steps: [
        { label: 'Question', title: 'A question worth forecasting.', copy: ['The machine first drafts a precise, resolvable question with named outcomes. A vague worry becomes something that can be checked.'] },
        { label: 'Evidence', title: 'Evidence before the answer.', copy: ['It reads the news, sorts sources into six levels of credibility and reasons with models from Anthropic, OpenAI and Google. A forecast takes four to eight minutes.'] },
        { label: 'Probability', title: 'A number a leader can use.', copy: ['The result travels as a PDF brief, an embeddable live widget or a public report, or through the API and alerts.'] },
      ],
      note: 'The cone is what we do not know. Each step narrows it, until the line ends in a probability.',
      detailTitle: ['Develop once,', 'ship everywhere.'],
      detailCopy: [
        'One frontend serves the browser, the desktop and the phone, so a forecast reads the same wherever a decision is made.',
        'Among its users: the OECD Strategic Foresight Unit, Institut Montaigne and CMAP at École Polytechnique.',
      ],
      figure: { kind: 'reference', spine: 'One codebase', perspectives: ['Web', 'Desktop', 'Mobile'] },
      reflection: ['Measure the future,', 'then make it legible.'],
      closing: ['A forecast is only useful if someone can read it, question it and act on it. The interface keeps the evidence one step away from the number.'],
    },
    ar: {
      deck: 'تنبؤات مدعومة بالأدلة، من السؤال إلى الاحتمال.',
      thesis: ['المستقبل غير مؤكد،', 'لكنه قابل للقياس.'],
      context: [
        'تبني FORAXION منصة The Forecasting Machine، وهي شركة في لندن تأسست في 2024 فرعًا يعتمد الذكاء الاصطناعي أولًا من Hypermind، التي تدير أسواق التنبؤ للشركات منذ 2000. تحوّل المنصة الأسئلة المفتوحة إلى احتمالات معلّلة، ثم تبقيها محدّثة في ضوء ملايين المقالات.',
        'منذ 2025 أقود بنية واجهاتها: واجهة بيضاء نظيفة تقودها تجربة القراءة، تُطوَّر مرة واحدة وتُنشر على الويب وسطح المكتب والجوال.',
      ],
      fieldTitle: 'احتمال يمكنك قراءته والدفاع عنه.',
      word: 'قياس',
      labels: ['السؤال', 'الأدلة', 'الاحتمال'],
      steps: [
        { label: 'السؤال', title: 'سؤال يستحق التنبؤ.', copy: ['تصوغ الآلة أولًا سؤالًا دقيقًا قابلًا للحسم بنتائج مسمّاة. يتحوّل القلق المبهم إلى شيء يمكن التحقّق منه.'] },
        { label: 'الأدلة', title: 'الأدلة قبل الإجابة.', copy: ['تقرأ الأخبار، وتصنّف المصادر في ست درجات من المصداقية، وتستدل بنماذج من Anthropic وOpenAI وGoogle. يستغرق التنبؤ الواحد من أربع إلى ثماني دقائق.'] },
        { label: 'الاحتمال', title: 'رقم يستطيع القائد استخدامه.', copy: ['تصل النتيجة في موجز PDF، أو أداة حيّة قابلة للتضمين، أو تقرير عام، أو عبر واجهة البرمجة والتنبيهات.'] },
      ],
      note: 'المخروط هو ما لا نعرفه. كل خطوة تضيّقه، حتى ينتهي الخط باحتمال.',
      detailTitle: ['طوّر مرة واحدة،', 'وانشر في كل مكان.'],
      detailCopy: [
        'واجهة واحدة تخدم المتصفح وسطح المكتب والهاتف، فيُقرأ التنبؤ بالطريقة نفسها أينما اتُّخذ القرار.',
        'ومن مستخدميها وحدة الاستشراف الاستراتيجي في منظمة التعاون الاقتصادي والتنمية، ومعهد مونتين، ومختبر CMAP في المدرسة متعددة التقنيات.',
      ],
      figure: { kind: 'reference', spine: 'شيفرة واحدة', perspectives: ['الويب', 'سطح المكتب', 'الجوال'] },
      reflection: ['قِس المستقبل،', 'ثم اجعله مقروءًا.'],
      closing: ['لا ينفع التنبؤ إلا إذا استطاع أحد قراءته ومساءلته والعمل به. تبقي الواجهة الأدلة على بعد خطوة واحدة من الرقم.'],
    },
  },
};

export const caseStory = (id: CaseId, locale: Locale) => stories[id][locale];
