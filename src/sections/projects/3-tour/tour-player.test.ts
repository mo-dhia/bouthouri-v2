import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function fixture() {
  const frames: (() => void)[] = [], timers: (() => void)[] = [];
  let draws = 0, recoveries = 0, orientations = 0, gyro = true;
  const events = new Map<string, (() => void)[]>();
  const emit = (event: string) => events.get(event)?.forEach(callback => callback());
  const image = { src: '/tile.jpg', complete: false, naturalWidth: 0 };
  const player = {
    kc: [image], cm: '/placeholder', nb: { Kh: false }, K: { Uh: false },
    Eh() { draws++; frames.push(() => player.Eh()); }, vn() { recoveries++; timers.push(() => player.vn()); }, ir() { orientations++; },
    vj() { return () => {}; }, Ba: { oo() { return () => {}; }, Si(tile: { v: EventTarget | null }) { tile.v = new EventTarget(); } }, readConfigXml(_config: unknown) { void _config; },
    addListener(name: string, callback: () => void) { events.set(name, [...events.get(name) ?? [], callback]); }, triggerEvent: emit,
    getUseGyro: () => gyro, stopAutorotate() {}, requestRedraw() {}, getIsLoaded: () => true, getIsTileLoading: () => false,
  };
  const runtime = { createTourLifecycle: null as unknown as (value: typeof player) => { setSuspended(value: boolean): void; getLoadState(): string } };
  runInNewContext(readFileSync(new URL('../../../../public/assets/projects/tour/viewer/tour-lifecycle.js', import.meta.url), 'utf8'), { window: runtime, document: { hidden: false } });
  const lifecycle = runtime.createTourLifecycle(player);
  const flush = () => { const callbacks = [...frames.splice(0), ...timers.splice(0)]; callbacks.forEach(callback => callback()); };
  return { player, lifecycle, frames, timers, image, emit, flush, get counts() { return { draws, recoveries, orientations }; }, gyro(value: boolean) { gyro = value; } };
}

test('suspension drains both player owners and quick resume never creates duplicate loops', () => {
  const h = fixture(); h.player.Eh(); h.player.vn();
  h.lifecycle.setSuspended(true); h.flush(); expect(h.counts).toEqual({ draws: 1, recoveries: 1, orientations: 0 });
  expect(h.frames.length + h.timers.length).toBe(0);
  h.lifecycle.setSuspended(false); expect(h.frames).toHaveLength(1); expect(h.timers).toHaveLength(1);
  h.lifecycle.setSuspended(true); h.lifecycle.setSuspended(false);
  expect(h.frames).toHaveLength(1); expect(h.timers).toHaveLength(1);
  h.flush(); expect(h.frames).toHaveLength(1); expect(h.timers).toHaveLength(1);
});
test('gyro events cannot alter the parked camera; resume preserves selection and recalibrates', () => {
  const h = fixture(); h.player.ir(); h.lifecycle.setSuspended(true); h.player.ir();
  expect(h.counts.orientations).toBe(1); expect(h.player.getUseGyro()).toBe(true);
  h.lifecycle.setSuspended(false); expect(h.player.nb.Kh).toBe(true); h.player.ir(); expect(h.counts.orientations).toBe(2);
});
test('failed complete images never satisfy readiness, even when the vendor flags report success', () => {
  const h = fixture(); expect(h.lifecycle.getLoadState()).toBe('loading');
  h.image.complete = true; expect(h.lifecycle.getLoadState()).toBe('failed');
  h.image.naturalWidth = 502; expect(h.lifecycle.getLoadState()).toBe('ready');
});
test('current image errors are retained; aborted or previous-room requests cannot fail the new room', () => {
  const h = fixture(); h.image.complete = true; h.image.naturalWidth = 502;
  const oldError = h.player.vj() as unknown as (event: { type: string }) => void;
  h.emit('beforechangenode'); oldError({ type: 'error' }); expect(h.lifecycle.getLoadState()).toBe('ready');
  const currentError = h.player.Ba.oo() as unknown as (event: { type: string }) => void;
  currentError({ type: 'abort' }); expect(h.lifecycle.getLoadState()).toBe('ready');
  currentError({ type: 'error' }); expect(h.lifecycle.getLoadState()).toBe('failed');
});
test('pending previous-room images cannot block readiness of decoded current-room images', () => {
  const h = fixture(), old = { v: null as EventTarget | null }, current = { v: null as EventTarget | null };
  h.image.complete = true; h.image.naturalWidth = 502; h.player.Ba.Si(old); expect(h.lifecycle.getLoadState()).toBe('loading');
  h.emit('beforechangenode'); h.player.Ba.Si(current); expect(h.lifecycle.getLoadState()).toBe('loading');
  current.v!.dispatchEvent(new Event('load')); expect(h.lifecycle.getLoadState()).toBe('ready');
  old.v!.dispatchEvent(new Event('load')); expect(h.lifecycle.getLoadState()).toBe('ready');
});
test('outgoing transition snapshots never acquire the destination resource or error owner', () => {
  const h = fixture(), outgoing = { v: null as EventTarget | null };
  h.image.complete = true; h.image.naturalWidth = 502; h.emit('beforechangenode'); h.player.K.Uh = true;
  h.player.Ba.Si(outgoing); const error = h.player.Ba.oo() as unknown as (event: { type: string }) => void;
  h.player.K.Uh = false; expect(h.lifecycle.getLoadState()).toBe('ready');
  error({ type: 'error' }); expect(h.lifecycle.getLoadState()).toBe('ready');
});
test('configuration disables startup autorotation before any images or initial frames are ready', () => {
  const h = fixture(), values: string[] = [];
  h.player.readConfigXml({ querySelectorAll: () => [{ setAttribute(_name: string, value: string) { values.push(value); } }] });
  expect(values).toEqual(['0']);
});
