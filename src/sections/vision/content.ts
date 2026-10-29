import 'server-only';

import type { Locale } from '@/i18n/routing';
import copy from './content.json';

export type VisionCopy = (typeof copy)[Locale];

export function getVisionContent(locale: Locale): VisionCopy {
  return copy[locale];
}
