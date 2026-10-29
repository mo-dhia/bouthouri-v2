import { expect, test } from 'bun:test';
import { acquireOrbStream } from './orb-input';

test('a departed or superseded microphone request stops every late track', async () => {
  let resolve!: (stream: MediaStream) => void, stopped = 0, calls = 0, version = 1;
  const devices = { getUserMedia() { calls++; return new Promise<MediaStream>(done => { resolve = done; }); } };
  const pending = acquireOrbStream(devices, () => version === 1); version = 2;
  resolve({ getTracks: () => [{ stop() { stopped++; } }, { stop() { stopped++; } }] } as unknown as MediaStream);
  expect(await pending).toBeNull(); expect(stopped).toBe(2); expect(calls).toBe(1);
});

test('live microphone ownership returns the original stream without starting audio on its own', async () => {
  let calls = 0, stopped = 0;
  const stream = { getTracks: () => [{ stop() { stopped++; } }] } as unknown as MediaStream;
  const result = await acquireOrbStream({ getUserMedia: async options => { calls++; expect(options).toMatchObject({ audio: { echoCancellation: true } }); return stream; } }, () => true);
  expect(result).toBe(stream); expect(calls).toBe(1); expect(stopped).toBe(0);
});

test('unsupported and no-longer-current capture fail without requesting a real device', async () => {
  await expect(acquireOrbStream(undefined, () => true)).rejects.toThrow('HTTPS');
  expect(await acquireOrbStream({ getUserMedia: () => { throw new Error('must not request'); } }, () => false)).toBeNull();
});
