import { describe, expect, test } from 'bun:test';
import { viewportDesign } from '@/lib/viewport-design';
import { practiceHeroLayout, practiceHeroPose } from './1-opening/practice-hero';
import { compileWord, extractWord, systemPhases, systemReading } from './2-perspective/system-geometry';
import { movingThought, voiceBeats, voiceWord } from './3-narrative/narrative-math';
import outlines from './2-perspective/word-outlines.json';
import fixtures from './2-perspective/source-fixtures.json';
import content from './content.json';

describe('Vision source extraction', () => {
  test('source phase and source outline fixtures retain both reading directions', () => {
    for (const fixture of fixtures.phases) expect(systemPhases(fixture.progress)).toEqual({ phases: fixture.expected.phases, settle: fixture.expected.settle, descriptions: fixture.expected.descriptions });
    for (const fixture of fixtures.words) {
      const word = outlines[fixture.locale as 'en' | 'ar'].words[fixture.index], pose = extractWord(compileWord(word.outline, word.advance), fixture.progress, fixture.locale === 'ar');
      expect(pose.d.slice(0, 180)).toBe(fixture.expected.pathStart); expect(pose.d.slice(-180)).toBe(fixture.expected.pathEnd);
      for (const key of ['band', 'spine', 'seam', 'exit', 'lightX', 'threadBoundary', 'bridgeBoundary'] as const) expect(pose[key]).toBeCloseTo(fixture.expected[key], 8);
      expect(pose.bridge).toBe(fixture.expected.bridge);
    }
  });
  test('the ten percent reading extension is continuous and reversible at the endpoints', () => {
    const start = 950, end = 3000, extra = (end - start) * .1;
    expect(systemReading(start, start, end, false)).toEqual({ progress: 0, scroll: start, offset: 0 });
    const finish = systemReading(end + extra, start, end, false); expect(finish.progress).toBe(1); expect(finish.scroll).toBeCloseTo(end); expect(finish.offset).toBeCloseTo(extra);
    let previous = -Infinity;
    for (let scroll = start - 30; scroll <= end + extra + 30; scroll += 7) { const pose = systemReading(scroll, start, end, false); expect(pose.scroll).toBeGreaterThan(previous); previous = pose.scroll; }
    expect(systemReading(1800, start, end, true)).toEqual({ progress: (1800 - start) / (end - start), scroll: 1800, offset: 0 });
  });
});

describe('Vision fixed camera and narrative', () => {
  test('all profiles preserve source framing through width changes', () => {
    for (const actualWidth of [320, 412, 600, 601, 650, 768, 1024, 1025, 1440, 1920, 2560]) {
      const design = viewportDesign(actualWidth), source = practiceHeroLayout('about', design.width, design.height), pose = practiceHeroPose('about', design.width, design.height, false, 0, 0, 0, true);
      expect(pose.x).toBe(source.x); expect(pose.y).toBe(source.y); expect(pose.size).toBe(source.size);
      expect(pose.depth).toBe(0); expect(pose.rotation).toEqual([.1, -.16, 0]);
      const services = practiceHeroLayout('services', design.width, design.height); expect(services.x).toBe(design.width * .5);
    }
  });
  test('thoughts start at narrative size and retain context at their destination', () => {
    const layout = { from: { x: 70, y: 300 }, to: { x: 1100, y: 660 }, scale: .23 };
    for (let index = 0; index < 4; index++) {
      const from = movingThought(0, index, layout), to = movingThought(1, index, layout);
      expect(from.reveal).toBe(0); expect(from.scale).toBe(1); expect(from.x).toBe(70); expect(from.y).toBe(300);
      expect(to.reveal).toBe(1); expect(to.scale).toBeCloseTo(.23); expect(to.x).toBe(1100); expect(to.y).toBe(660);
    }
  });
  test('all voice sentences finish in order, including Arabic punctuation', () => {
    for (const locale of ['en', 'ar'] as const) for (const question of content[locale].leadership.questions) {
      const beats = voiceBeats(question.split(/\s+/u)); let previous = -1;
      for (const beat of beats) { expect(beat.start).toBeGreaterThan(previous); previous = beat.start; expect(voiceWord(0, beat).opacity).toBe(0); expect(voiceWord(1, beat).opacity).toBe(1); }
    }
  });
});
