import 'server-only';

import type { Locale } from '@/i18n/routing';
import Opening from './1-opening/opening';
import Perspective from './2-perspective/perspective';
import Narrative from './3-narrative/narrative';
import { getVisionContent } from './content';
import VisionGate from './vision-gate';
import styles from './vision.module.css';

export default function VisionContent({ locale }: { locale: Locale }) {
  const content = getVisionContent(locale), rtl = locale === 'ar';
  return <div className={styles.vision} data-vision-root dir={rtl ? 'rtl' : 'ltr'}>
    <Opening content={content} />
    <Perspective locale={locale} content={content} />
    <Narrative locale={locale} content={content} />
    <VisionGate />
  </div>;
}
