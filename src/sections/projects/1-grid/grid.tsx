import 'server-only';
import type { Locale } from '@/i18n/routing';
import projects from './content.json';
import GridGate from './grid-gate';
import styles from './grid.module.css';

const categories: Record<string, string> = { Website: 'موقع', Interaction: 'تفاعل', Canvas: 'كانفاس', '3D': '3D', UI: 'واجهات', Gallery: 'معرض', Transition: 'انتقال' };
export default function ProjectsGrid({ locale }: { locale: Locale }) {
  const arabic = locale === 'ar';
  return <section className={styles.root} data-projects-root data-locale={locale} aria-labelledby='projects-heading'>
    <GridGate />
    <h1 className={styles.title} id='projects-heading'>{arabic ? 'المشاريع' : 'Projects'}</h1>
    <p className={styles.instructions} id='projects-instructions'>{arabic ? 'مواقع صمّمتها وطوّرتها، إلى جانب دراسات تفاعلية مقتبسة من مختبر كارتر أوغونسولا. اسحب أو مرّر في أي اتجاه، أو استخدم مفتاح Tab لاختيار مشروع.' : 'Websites I designed and built, alongside interaction studies adapted from Carter Ogunsola’s Lab. Drag or scroll in any direction, or Tab to a project.'}</p>
    <div className={styles.viewport} data-grid-viewport aria-describedby='projects-instructions'>
      <div className={styles.plane} data-grid-plane>
        {projects.map((item, index) => {
          // Websites open the live client site; studies stay on their local detail route.
          const website = item.kind === 'website';
          return <a key={item.href} className={styles.item} data-grid-item data-reel={item.reel} href={website ? item.href : `/${locale}/projects/${item.href.split('/').at(-1)}`} target={website ? '_blank' : undefined} rel={website ? 'external noopener' : undefined}
            aria-label={`${item.name} — ${website ? arabic ? 'موقع ويب، يُفتح في علامة تبويب جديدة' : 'website, opens in a new tab' : arabic ? 'دراسة تفاعلية' : 'interactive study'}`}>
            <span className={styles.card} data-grid-card>
              {/* Website posters are composed on the inked ground already; studies need the tonal filter. */}
              <span className={styles.media} data-grid-media data-preview-ink={!website && item.name !== 'Vocal Orb' ? 'true' : undefined}>
                {/* The source poster is the useful no-JS image, not a client placeholder. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.poster} width={960} height={720} alt='' loading={index === 8 ? 'eager' : 'lazy'} decoding='async' draggable={false} fetchPriority={index === 8 ? 'high' : 'auto'} />
              </span>
              <span className={styles.caption} data-grid-caption><span className={styles.name}>{item.name}</span><span className={styles.tags}><span className={styles.chip}>{arabic ? categories[item.category] : item.category}</span>{item.isNew && <span className={`${styles.chip} ${styles.new}`}>{arabic ? 'جديد' : 'New'}</span>}</span></span>
            </span>
          </a>;
        })}
      </div>
    </div>
    <a className={styles.credit} href='https://carterogunsola.com/lab' rel='external'>Interaction studies · Carter Ogunsola ↗</a>
  </section>;
}
