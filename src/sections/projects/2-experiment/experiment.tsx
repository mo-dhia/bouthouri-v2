import 'server-only';
import Link from 'next/link';
import type { Locale } from '@/i18n/routing';
import experiments from './experiments.json';
import configs from './config.json';
import ExperimentGate from './experiment-gate';
import styles from './experiment.module.css';
import heart from './components/heart/heart.module.css';
import dots from './components/polka-dots/polka-dots.module.css';
import dial from './components/dial/dial.module.css';
import scrollbar from './components/dynamic-scrollbar/dynamic-scrollbar.module.css';
import gallery from './components/rotating-gallery/rotating-gallery.module.css';
import paste from './components/paste-up/paste-up.module.css';
import three from './components/threejs-test/threejs-test.module.css';
import orb from './components/vocal-orb/vocal-orb.module.css';
import cursors from './components/live-cursors/live-cursors.module.css';

export const experimentSlugs = experiments.map(item => item.slug);
export const findExperiment = (slug: string) => experiments.find(item => item.slug === slug);
type Control = { key: string; label: string; type: string; default: unknown; min?: number; max?: number; step?: number; options?: { id: string; label?: string; value?: string }[] | null };
const cameras: Record<string, string> = { 'live-cursors': cursors.camera, heart: heart.camera, 'polka-dots': dots.camera, dial: dial.camera, 'dynamic-scrollbar': scrollbar.camera, 'rotating-gallery': gallery.camera, 'paste-up': paste.camera, 'threejs-test': three.camera, 'vocal-orb': orb.camera };

function ConfigControl({ control }: { control: Control }) {
  const { key, label, type, default: value } = control;
  if (type === 'spring' && value && typeof value === 'object') return <fieldset className={styles.spring}><legend>{label}</legend>{Object.entries(value).map(([part, n]) => <label key={part}>{part}<input data-config-key={key} data-config-part={part} type='range' min={part === 'mass' ? .1 : .001} max={part === 'mass' ? 4 : 1} step='.001' defaultValue={Number(n)} /><output>{String(n)}</output></label>)}</fieldset>;
  if (type === 'easing' && Array.isArray(value)) return <fieldset className={styles.spring}><legend>{label}</legend>{value.map((n, i) => <label key={i}>{['X1', 'Y1', 'X2', 'Y2'][i]}<input data-config-key={key} data-config-index={i} type='range' min={i % 2 ? -1 : 0} max={i % 2 ? 2 : 1} step='.01' defaultValue={n} /><output>{n}</output></label>)}</fieldset>;
  if (type === 'segment' || type === 'swatch') return <label className={styles.control}>{label}<select data-config-key={key} defaultValue={String(value)}>{(control.options ?? []).map(option => <option key={option.id} value={type === 'swatch' ? option.value ?? option.id : option.id}>{option.label ?? option.id}</option>)}</select></label>;
  return <label className={styles.control}>{label}<input data-config-key={key} type='range' min={control.min ?? 0} max={control.max ?? 1} step={control.step ?? .01} defaultValue={Number(value)} /><output>{String(value)}</output></label>;
}

export default function Experiment({ locale, slug }: { locale: Locale; slug: string }) {
  const item = findExperiment(slug)!;
  const index = experiments.indexOf(item), previous = experiments[(index + experiments.length - 1) % experiments.length], next = experiments[(index + 1) % experiments.length];
  const arabic = locale === 'ar', controls = configs[slug as keyof typeof configs] as Control[];
  return <section className={styles.root} data-experiment-root data-experiment={slug} data-locale={locale} aria-labelledby='experiment-heading'>
    <ExperimentGate slug={slug} />
    <div className={styles.stage} data-experiment-stage>
      <div className={`${styles.camera} ${cameras[slug] ?? ''}`} data-experiment-camera />
      <div className={styles.fallback} data-experiment-fallback>
        {/* The original poster remains useful when a renderer is unavailable. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.poster} width='960' height='720' alt='' decoding='async' fetchPriority='high' data-preview-ink={slug !== 'vocal-orb' ? 'true' : undefined} />
        <p data-experiment-status role='status'>{arabic ? 'جاري تحضير التجربة. يبقى هذا العرض متاحًا إذا تعذّر تشغيلها.' : 'Preparing the experiment. This preview remains available if enhancement cannot run.'}</p>
      </div>
      <div className={styles.heading}><h1 id='experiment-heading'>{item.name}</h1><span>{item.category}</span></div>
      <details className={styles.notes} data-experiment-notes>
        <summary>{arabic ? 'عن التجربة' : 'Notes'}</summary>
        <div className={styles.panel}>
          <h2>{item.name}</h2><p>{item.instructions[locale]}</p>
          <p>{arabic ? 'دراسة تفاعلية مقتبسة من مختبر كارتر أوغونسولا، ومندمجة في النظام البصري لبوثوري.' : 'An interaction study adapted from Carter Ogunsola’s Lab, integrated with the Bouthouri visual system.'}</p>
          {slug === 'vocal-orb' && <p>{arabic ? 'تُعالَج التسجيلات على جهازك. يحتاج الميكروفون إلى اتصال HTTPS وإذن منك. تنزيل نماذج التعرّف والكلام اختياري.' : 'Audio is processed on your device. Microphone access requires HTTPS and your permission. Speech and voice model downloads are optional.'}</p>}
          <a href={item.original} rel='external'>{arabic ? 'المصدر والملاحظات والشيفرة' : 'Original notes and source code'} ↗</a>
        </div>
      </details>
      <details className={styles.settings} data-experiment-settings>
        <summary>{arabic ? 'الضبط' : 'Tune'}</summary>
        <div className={styles.panel}>
          <h2>{arabic ? 'ضبط التجربة' : 'Tune the experiment'}</h2>
          <fieldset disabled data-config-controls>{controls.map(control => <ConfigControl key={control.key} control={control} />)}</fieldset>
          <button type='button' data-config-reset disabled>{arabic ? 'إعادة الضبط' : 'Reset'}</button>
        </div>
      </details>
      <nav className={styles.navigation} aria-label={arabic ? 'التجارب' : 'Experiments'}>
        <Link href={`/${locale}/projects/${previous.slug}`} aria-label={`${arabic ? 'التجربة السابقة' : 'Previous experiment'}: ${previous.name}`}>←</Link>
        <Link href={`/${locale}/projects`}>{String(index + 1).padStart(2, '0')} / 09</Link>
        <Link href={`/${locale}/projects/${next.slug}`} aria-label={`${arabic ? 'التجربة التالية' : 'Next experiment'}: ${next.name}`}>→</Link>
      </nav>
    </div>
    <p className={styles.instructions}>{item.instructions[locale]}</p>
  </section>;
}
