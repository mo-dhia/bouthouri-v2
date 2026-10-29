import 'server-only';

import { viewportDesigns } from '@/lib/viewport-design';
import type { VisionCopy } from '../content';
import { Masked } from '../components/vision-markup';
import { practiceHeroLayout } from './practice-hero';

export default function Opening({ content }: { content: VisionCopy }) {
  return (
    <header className='practice-opening' data-editorial-composition data-hero-concept='perspective' data-route-hero>
      <div aria-hidden className='practice-hero-geometry'>
        {Object.values(viewportDesigns).map(design => {
          const layout = practiceHeroLayout('about', design.width, design.height);
          return <svg key={design.key} className={`practice-hero-poster poster-${design.key}`} viewBox={`0 0 ${design.width} ${design.height}`} fill='none' preserveAspectRatio='none'><defs><linearGradient id={`vision-logo-fallback-${design.key}`} x1='0' y1='0' x2='1' y2='1'><stop stopColor='#9a978e' /><stop offset='.45' stopColor='#262622' /><stop offset='.75' stopColor='#76746d' /><stop offset='1' stopColor='#1b1b18' /></linearGradient></defs><path transform={`translate(${layout.x} ${layout.y}) scale(${layout.size / 73.600516})`} d='M 0.16283161449966 36.76676079027144 A 36.62617153347209 36.76712414115423 0 1 1 0.16283161449966 -36.76676079027144 L 0.16283161449966 -22.502439339404283 A 22.379709467186295 22.503034981546598 0 1 0 0.16283161449966 22.502439339404283 Z' fill={`url(#vision-logo-fallback-${design.key})`} /></svg>;
        })}
        <canvas className='practice-depth' aria-hidden />
      </div>
      <div className='editorial-kicker' data-editorial-layer='meta'><Masked id='hero-index'>{content.index}</Masked><Masked id='hero-identity'><bdi>{content.name}</bdi></Masked></div>
      <div className='practice-hero-type'>
        <h1 data-editorial-layer='heading'>{content.hero.map((line, index) => <span className='editorial-line' key={index}><Masked id={`hero-title-${index}`} renderedLines>{line}</Masked></span>)}</h1>
        <div className='practice-opening-foot'>
          <p data-editorial-layer='copy'>{content.intro.includes('\n') ? <Masked id='hero-copy' lines={content.intro.split('\n')} /> : <Masked id='hero-copy' renderedLines>{content.intro}</Masked>}</p>
          <Masked id='hero-action'><a href='#vision-content' className='editorial-text-link' data-vision-advance>{content.read}<i aria-hidden /></a></Masked>
        </div>
      </div>
    </header>
  );
}
