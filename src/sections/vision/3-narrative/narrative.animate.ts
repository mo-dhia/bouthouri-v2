import { pixelsToVw, referenceStage } from '@/lib/viewport-design';
import { clamp01 } from '../1-opening/practice-hero';
import { createMaskedReveal } from '../masked-reveal';
import { range } from '../2-perspective/system-geometry';
import { leadershipPose, movingThought, voiceBeats, voiceWord, type ThoughtLayout } from './narrative-math';

function documentTop(element: HTMLElement) { let top = 0, current: HTMLElement | null = element; while (current) { top += current.offsetTop; current = current.offsetParent as HTMLElement | null; } return top; }

/** Four thoughts retain context while voices draw and speak before the final choice. */
export function createVisionNarrative(root: HTMLElement, rtl: boolean) {
  const other = root.querySelector<HTMLElement>('[data-about-other]')!, thoughts = root.querySelector<HTMLElement>('[data-about-thoughts]')!, leadership = root.querySelector<HTMLElement>('[data-about-leadership]')!, invitation = root.querySelector<HTMLElement>('[data-about-invitation]')!;
  const thoughtStage = thoughts.querySelector<HTMLElement>('.about-thought-stage')!;
  const masks = new Map([...root.querySelectorAll<HTMLElement>('[data-masked-reveal]')].filter(element => element.dataset.maskedReveal && !element.dataset.maskedReveal.startsWith('hero-')).map(element => [element.dataset.maskedReveal!, createMaskedReveal(element)]));
  const moving = [...thoughts.querySelectorAll<HTMLElement>('[data-moving-thought]')];
  const voices = [...leadership.querySelectorAll<HTMLElement>('[data-about-voice]')].map(element => { const words = [...element.querySelectorAll<HTMLElement>('[data-voice-word]')]; return { element, path: element.querySelector<SVGPathElement>('path')!, words, beats: voiceBeats(words.map(word => word.textContent ?? '')) }; });
  let scale = 1, width = 1920, height = 1080, layouts: ThoughtLayout[] = [], otherStart = 0, otherDistance = 1, thoughtStart = 0, thoughtDistance = 1, leadTop = 0, leadDistance = 1, endStart = 0, endDistance = 1;
  const reveal = (id: string, progress: number, reduced: boolean) => masks.get(id)?.set(progress, reduced);
  const top = (element: HTMLElement) => documentTop(element) / scale;
  return {
    measure(reduced: boolean) {
      const stage = referenceStage(innerWidth, innerHeight); scale = stage.scale; width = stage.width; height = stage.height;
      const portrait = width <= 700 || height / width > 1.12;
      const navBottom = (root.closest('[data-editorial-page]')?.querySelector('.editorial-nav')?.getBoundingClientRect().bottom ?? 0) / scale;
      leadership.style.setProperty('--lead-safe-top', pixelsToVw((navBottom + Math.max(22, Math.min(42, .045 * height))) * scale, innerWidth));
      masks.forEach(mask => mask.measure());
      const stageHeight = thoughtStage.offsetHeight / scale, dimensions = moving.map(element => ({ width: element.offsetWidth / scale, height: element.offsetHeight / scale, fontSize: parseFloat(getComputedStyle(element.querySelector('h2')!).fontSize) / scale }));
      const targetType = portrait ? Math.max(rtl ? 19 : 17, Math.min(22, .043 * width)) : Math.max(rtl ? 24 : 22, Math.min(rtl ? 34 : 32, width * (rtl ? .021 : .019)));
      const vertical = portrait ? [.2, .63, .36, .77] : [.22, .66, .4, .81];
      layouts = dimensions.map((dimension, index) => {
        const size = Math.min(.72, targetType / dimension.fontSize), finalWidth = dimension.width * size, secondScale = Math.min(.72, targetType / dimensions[1].fontSize), secondLeft = .86 * width - dimensions[1].width * secondScale;
        const defaultY = index === 2 && .07 * width + dimension.width > secondLeft - 16 ? Math.min(.36 * stageHeight, stageHeight * vertical[1] - dimension.height - 18) : stageHeight * [.34, .39, .36][index];
        let lastY = Math.min(.7 * stageHeight, .94 * stageHeight - dimension.height);
        if (index === 3 && .07 * width + dimension.width > secondLeft - 16) lastY = Math.min(.94 * stageHeight - dimension.height, Math.max(lastY, stageHeight * vertical[1] + dimensions[1].height * secondScale + 18));
        return { from: { x: rtl && index < 2 ? Math.max(.07 * width, .93 * width - dimension.width) : .07 * width, y: index === 3 ? lastY : defaultY }, to: { x: Math.max(.06 * width, Math.min(index === 1 || index === 3 ? width * (index === 1 ? .86 : .92) - finalWidth : width * (index === 0 ? .09 : .15), .94 * width - finalWidth)), y: Math.min(stageHeight * vertical[index], .94 * stageHeight - dimension.height * size) }, scale: size };
      });
      const label = other.querySelector<HTMLElement>('.editorial-eyebrow')!, copy = other.querySelector<HTMLElement>('.about-underneath-copy')!;
      otherStart = top(label) - .8 * height; otherDistance = Math.max(.85 * height, top(copy) + copy.offsetHeight / scale - .62 * height - otherStart);
      thoughtStart = top(thoughts) - .12 * height; thoughtDistance = Math.max(1, (thoughts.offsetHeight - thoughtStage.offsetHeight) / scale + .12 * height);
      leadTop = top(leadership); leadDistance = Math.max(1, (leadership.offsetHeight - leadership.querySelector<HTMLElement>('.about-leadership-stage')!.offsetHeight) / scale + .12 * height);
      const heading = invitation.querySelector<HTMLElement>('h2')!, actions = invitation.querySelector<HTMLElement>('.practice-end-actions')!;
      endStart = top(heading) - .85 * height; endDistance = Math.max(.65 * height, top(actions) + actions.offsetHeight / scale - .68 * height - endStart);
      if (reduced) moving.forEach(element => { element.style.removeProperty('transform'); element.style.removeProperty('color'); });
    },
    render(nativeScroll: number, reduced: boolean) {
      const scroll = nativeScroll / scale, otherProgress = clamp01((scroll - otherStart) / otherDistance), thoughtProgress = clamp01((scroll - thoughtStart) / thoughtDistance), leadProgress = clamp01((scroll + .12 * height - leadTop) / leadDistance), endProgress = clamp01((scroll - endStart) / endDistance);
      reveal('other-label', range(otherProgress, 0, .16), reduced); reveal('other-title', range(otherProgress, .12, .6), reduced); reveal('other-statement', range(otherProgress, .48, .76), reduced); reveal('other-copy', range(otherProgress, .64, 1), reduced); other.dataset.progress = String(otherProgress);
      moving.forEach((element, index) => {
        if (!layouts[index]) return;
        const pose = movingThought(thoughtProgress, index, layouts[index]); reveal(`thought-${index}`, pose.reveal, reduced);
        element.style.transform = reduced ? 'none' : `translate3d(${pixelsToVw(pose.x * scale, innerWidth)},${pixelsToVw(pose.y * scale, innerWidth)},0) scale(${pose.scale})`;
        const ink = 209 - 30 * pose.context; element.style.color = reduced ? '' : `rgb(${ink} ${ink - 3} ${ink - 11})`;
      }); thoughts.dataset.progress = String(thoughtProgress);
      const lead = leadershipPose(leadProgress); reveal('lead-title', lead.title, reduced); reveal('lead-copy', lead.copy, reduced); leadership.style.setProperty('--voice-ink', String(reduced ? .78 : 1 - .22 * lead.context));
      voices.forEach((voice, index) => {
        const pose = lead.voices[index], draw = reduced ? 1 : pose.draw, speech = reduced ? 1 : pose.speech;
        voice.path.style.strokeDasharray = `${draw} ${2 - draw}`; voice.path.style.visibility = draw === 0 ? 'hidden' : 'visible';
        voice.words.forEach((word, i) => { const pose = voiceWord(speech, voice.beats[i]); word.style.opacity = String(pose.opacity); word.style.filter = pose.blur > 0 ? `blur(${pose.blur}px)` : 'none'; word.style.transform = pose.y > 0 ? `translate3d(0,${pixelsToVw(pose.y * scale, innerWidth)},0)` : 'none'; });
        voice.element.dataset.draw = String(draw); voice.element.dataset.speech = String(speech);
      }); leadership.dataset.progress = String(leadProgress);
      reveal('end-title', range(endProgress, 0, .5), reduced); reveal('end-copy', range(endProgress, .38, .69), reduced); reveal('end-services', range(endProgress, .65, .88), reduced); reveal('end-contact', range(endProgress, .74, .98), reduced); invitation.dataset.progress = String(endProgress);
    },
    dispose() {
      masks.forEach(mask => mask.dispose()); leadership.style.removeProperty('--lead-safe-top'); leadership.style.removeProperty('--voice-ink');
      moving.forEach(element => { element.style.removeProperty('transform'); element.style.removeProperty('color'); });
      voices.forEach(voice => { voice.path.style.removeProperty('stroke-dasharray'); voice.path.style.removeProperty('visibility'); voice.words.forEach(word => { word.style.removeProperty('transform'); word.style.removeProperty('opacity'); word.style.removeProperty('filter'); }); delete voice.element.dataset.draw; delete voice.element.dataset.speech; });
      [other, thoughts, leadership, invitation].forEach(element => delete element.dataset.progress);
    },
  };
}
