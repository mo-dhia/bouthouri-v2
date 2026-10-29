import { expect, test } from 'bun:test';
import { createGridPreview } from './grid-preview.logic';

function harness() {
  let now = 0, serial = 0, enabled = true;
  const timers = new Map<number, { at: number; run: () => void }>();
  class Video extends EventTarget {
    dataset: Record<string, string> = {}; style = { transform: '' }; hidden = true;
    muted = false; loop = false; playsInline = false; preload = ''; paused = true; currentTime = 0;
    src = ''; loads = 0; removed = false; parent: object | null = null;
    setAttribute() {} getAttribute() { return this.src || null; }
    removeAttribute() { this.src = ''; }
    play() { this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
    pause() { this.paused = true; } load() { this.loads++; } remove() { this.removed = true; this.parent = null; }
  }
  const videos: Video[] = [], doc = { defaultView: {
    setTimeout(run: () => void, delay: number) { const id = ++serial; timers.set(id, { at: now + delay, run }); return id; },
    clearTimeout(id: number) { timers.delete(id); },
  }, createElement() { const video = new Video(); videos.push(video); return video; } };
  const item = (name: string) => {
    const value = { isConnected: true, dataset: { reel: `/assets/${name}.mp4` }, contains(video: Video) { return video.parent === value; },
      querySelector(selector: string) { return selector === 'img' ? { style: { transform: name } } : { append(video: Video) { video.parent = value; } }; } };
    return value as unknown as HTMLAnchorElement;
  };
  return { preview: createGridPreview({ ownerDocument: doc } as unknown as HTMLElement, { enabled: () => enabled }), item, timers, videos,
    enabled(value: boolean) { enabled = value; },
    advance(time: number) { now += time; for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.run(); } },
  };
}
test('220ms hover intent owns one muted inline decoder, never an eager media request', () => {
  const h = harness(), a = h.item('a'); h.preview.choose(a); h.advance(219);
  expect(h.videos).toHaveLength(0); expect(h.preview.pending).toBe(true); h.advance(1);
  expect(h.videos).toHaveLength(1); const video = h.videos[0];
  expect(video.src).toBe('/assets/a.mp4'); expect(video.muted && video.loop && video.playsInline).toBe(true);
  expect(video.preload).toBe('none'); expect(video.paused).toBe(false); expect(video.hidden).toBe(false);
  h.preview.dispose(); expect(h.timers.size).toBe(0);
});
test('crossing cards cancels stale interest and reparents the one existing decoder', () => {
  const h = harness(), a = h.item('a'), b = h.item('b');
  h.preview.choose(a); h.advance(100); h.preview.choose(b); h.advance(120); expect(h.videos).toHaveLength(0);
  h.advance(100); expect(h.videos[0].src).toBe('/assets/b.mp4');
  h.preview.choose(a); h.advance(220); expect(h.videos).toHaveLength(1); expect(h.videos[0].src).toBe('/assets/a.mp4');
  expect(h.videos[0].parent).toBe(a); expect(h.videos[0].style.transform).toBe('a'); h.preview.dispose();
});
test('leave fades and resets, while null intent cancels a hover without allocation', () => {
  const h = harness(), a = h.item('a'); h.preview.choose(a); h.preview.choose(null); h.advance(1000); expect(h.videos).toHaveLength(0);
  h.preview.choose(a); h.advance(220); const video = h.videos[0]; video.currentTime = 3.25;
  h.preview.clear(); expect(video.hidden).toBe(true); expect(video.paused).toBe(false); h.advance(199); expect(video.paused).toBe(false);
  h.advance(1); expect(video.paused).toBe(true); expect(video.currentTime).toBe(0); h.preview.dispose();
});
test('hidden suspension pauses immediately and resumes the retained frame time', () => {
  const h = harness(), a = h.item('a'); h.preview.choose(a); h.advance(220); const video = h.videos[0]; video.currentTime = 4.2;
  h.preview.suspend(); expect(video.paused).toBe(true); expect(h.timers.size).toBe(0); h.advance(50000); expect(video.currentTime).toBe(4.2);
  h.preview.resume(a); expect(video.paused).toBe(false); expect(video.currentTime).toBe(4.2); expect(h.videos).toHaveLength(1); h.preview.dispose();
});
test('reduced, Save-Data and disconnected eligibility reject early and delayed work', () => {
  const h = harness(), a = h.item('a'); h.enabled(false); h.preview.choose(a); h.advance(1000); expect(h.videos).toHaveLength(0);
  h.enabled(true); h.preview.choose(a); h.enabled(false); h.advance(220); expect(h.videos).toHaveLength(0);
  h.enabled(true); h.preview.choose(a); (a as unknown as { isConnected: boolean }).isConnected = false; h.advance(220); expect(h.videos).toHaveLength(0); h.preview.dispose();
});
test('menu/reduced clear and disposal release media and every pending timer exactly once', () => {
  const h = harness(), a = h.item('a'); h.preview.choose(a); h.advance(220); const video = h.videos[0];
  h.preview.clear(true); expect(video.paused).toBe(true); expect(video.hidden).toBe(true); expect(h.timers.size).toBe(0);
  h.preview.choose(a); h.preview.dispose(); h.advance(1000); expect(video.src).toBe(''); expect(video.removed).toBe(true); expect(video.loads).toBe(1);
  expect(h.preview.element).toBeNull(); expect(h.timers.size).toBe(0); h.preview.dispose(); expect(video.loads).toBe(1);
});
