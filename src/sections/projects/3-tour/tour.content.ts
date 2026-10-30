import 'server-only';

export const tourProject = {
  slug: '360-tour',
  name: '360° Tour',
  poster: '/assets/projects/tour/cafe.jpg',
  viewer: '/assets/projects/tour/viewer/index.html',
  source: 'https://artefactstudio.org/#vr',
  instructions: {
    en: 'Explore Artefact Studio’s café in 360°. Drag or use the arrow keys to look around, zoom in, and select a hotspot to move between three viewpoints.',
    ar: 'استكشف مقهى آرتيفاكت ستوديو بزاوية ٣٦٠°. اسحب أو استخدم مفاتيح الأسهم للنظر حولك، وقرّب العرض، واختر نقطة تنقّل للانتقال بين ثلاثة مواضع.'
  }
};

export const tourCopy = {
  en: {
    title: '360° Tour', category: 'Virtual tour', enter: 'Enter the tour', loading: 'Loading the tour…', retry: 'Try again',
    failed: 'The tour could not load. Try again or visit Artefact Studio below.', stop: 'Close tour', back: 'All projects',
    notes: 'Notes', about: 'Step inside', source: 'View on Artefact Studio',
    description: 'The interactive café tour from Artefact Studio. Three connected viewpoints, with drag navigation, zoom and fullscreen controls.',
    noScript: 'Enable JavaScript to explore the tour. You can still view the café preview and visit Artefact Studio.',
    controls: ['Exit fullscreen', 'Enter fullscreen', 'Enter VR', 'Zoom in', 'Zoom out', 'Toggle device orientation'],
    image: 'Warm café interior with timber seating, pendant lights and a long counter.'
  },
  ar: {
    title: 'جولة ٣٦٠°', category: 'جولة افتراضية', enter: 'ابدأ الجولة', loading: 'جارٍ تحميل الجولة…', retry: 'حاول مجددًا',
    failed: 'تعذّر تحميل الجولة. حاول مجددًا أو زُر آرتيفاكت ستوديو أدناه.', stop: 'إغلاق الجولة', back: 'كل المشاريع',
    notes: 'عن الجولة', about: 'ادخل إلى المكان', source: 'شاهدها على آرتيفاكت ستوديو',
    description: 'جولة المقهى التفاعلية من آرتيفاكت ستوديو. ثلاثة مواضع متصلة، مع السحب للتنقّل والتقريب والعرض بملء الشاشة.',
    noScript: 'فعّل JavaScript لاستكشاف الجولة. يمكنك مشاهدة صورة المقهى وزيارة آرتيفاكت ستوديو.',
    controls: ['الخروج من ملء الشاشة', 'العرض بملء الشاشة', 'دخول الواقع الافتراضي', 'تكبير', 'تصغير', 'تبديل توجيه الجهاز'],
    image: 'داخل مقهى دافئ بمقاعد خشبية ومصابيح معلّقة ومنضدة طويلة.'
  }
};
