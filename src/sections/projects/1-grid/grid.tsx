import 'server-only';
import type { Locale } from '@/i18n/routing';
import experiments from './content.json';
import GridGate from './grid-gate';
import styles from './grid.module.css';

const categories: Record<string, string> = { Interaction: 'تفاعل', Canvas: 'كانفاس', '3D': '3D', UI: 'واجهات', Gallery: 'معرض', Transition: 'انتقال' };
export default function ProjectsGrid({ locale }: { locale: Locale }) {
  const arabic = locale === 'ar';
  return <section className={styles.root} data-projects-root data-locale={locale} aria-labelledby='projects-heading'>
    <GridGate />
    <h1 className={styles.title} id='projects-heading'>{arabic ? 'المشاريع' : 'Projects'}</h1>
    <p className={styles.instructions} id='projects-instructions'>{arabic ? 'مساحة لاستكشاف التفاعل والحركة. اسحب أو مرّر في أي اتجاه، أو استخدم مفتاح Tab لاختيار تجربة. تفتح البطاقات التجارب الأصلية لكارتر أوغونسولا.' : 'A space to explore interaction and motion. Drag or scroll in any direction, or Tab to an experiment. Cards open the original experiments by Carter Ogunsola.'}</p>
    <div className={styles.viewport} data-grid-viewport aria-describedby='projects-instructions'>
      <div className={styles.plane} data-grid-plane>
        {experiments.map((item, index) => <a key={item.href} className={styles.item} data-grid-item data-reel={item.reel} href={item.href} rel='external' aria-label={`${item.name} — ${arabic ? 'تجربة كارتر أوغونسولا' : 'experiment by Carter Ogunsola'}`}>
          <span className={styles.card} data-grid-card>
            <span className={styles.media} data-grid-media>
              {/* The source poster is the useful no-JS image, not a client placeholder. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.poster} width={960} height={720} alt='' loading={index === 8 ? 'eager' : 'lazy'} decoding='async' draggable={false} fetchPriority={index === 8 ? 'high' : 'auto'} />
            </span>
            <span className={styles.caption}><span className={styles.name}>{item.name}</span><span className={styles.tags}><span className={styles.chip}>{arabic ? categories[item.category] : item.category}</span>{item.isNew && <span className={`${styles.chip} ${styles.new}`}>{arabic ? 'جديد' : 'New'}</span>}</span></span>
          </span>
        </a>)}
      </div>
    </div>
    <a className={styles.credit} href='https://carterogunsola.com/lab' rel='external'>Interaction studies · Carter Ogunsola ↗</a>
  </section>;
}
