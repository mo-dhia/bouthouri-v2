import { clamp01, smooth01 } from '../1-opening/practice-hero';
import { range } from '../2-perspective/system-geometry';

export const voiceContours = [
  'M12 18 C31 8 52 9 60 22 C66 30 60 34 69 41 Q77 47 68 49 L63 50 Q63 54 70 56 Q73 58 65 60 Q73 63 68 65 C60 65 64 74 54 77 L45 77 C43 90 30 95 13 98',
  'M16 12 C38 10 56 16 58 29 C58 37 66 42 73 48 Q78 53 64 53 Q61 57 68 59 Q73 61 65 63 Q72 67 65 69 C63 77 57 82 45 79 C43 92 33 96 19 97',
  'M8 24 C23 12 48 8 57 22 C62 31 60 36 68 44 Q77 50 64 52 L62 55 Q67 56 70 60 L64 63 Q71 65 65 68 C61 75 53 79 45 77 C44 89 30 99 10 102',
  'M18 16 C38 7 56 13 61 25 C65 33 61 38 70 45 Q78 51 65 53 Q62 56 70 59 Q71 62 64 63 Q71 67 65 70 C60 77 54 79 46 78 C47 91 38 98 17 102',
];
export type ThoughtLayout = { from: { x: number; y: number }; to: { x: number; y: number }; scale: number };
export function movingThought(progress: number, index: number, layout: ThoughtLayout) {
  const start = [0, .23, .46, .69][index], interval = [[.14, .27], [.37, .5], [.59, .72], [.83, .96]][index];
  const context = smooth01(range(progress, interval[0], interval[1]));
  return { reveal: range(progress, start, start + .115), x: layout.from.x + (layout.to.x - layout.from.x) * (index === 3 ? context * context : context), y: layout.from.y + (layout.to.y - layout.from.y) * context, scale: 1 + (layout.scale - 1) * context, context };
}
export function voiceBeats(words: string[]) {
  let elapsed = 0;
  const starts = words.map(word => { const start = elapsed, letters = word.replace(/[^\p{L}\p{N}]/gu, '').length; elapsed += .65 + .075 * Math.min(9, letters) + .3 * Number(/[،,;:؛.!?؟]$/u.test(word)); return start; });
  const duration = (starts.at(-1) ?? 0) + 1.55;
  return starts.map(start => ({ start: start / duration, duration: 1.55 / duration }));
}
export function voicePose(progress: number) { return { draw: smooth01(range(progress, 0, .64)), speech: range(progress, .42, 1) }; }
export function voiceWord(progress: number, beat: { start: number; duration: number }) { const opacity = smooth01(range(progress, beat.start, beat.start + beat.duration)); return { opacity, blur: 2.4 * (1 - opacity), y: 3 * (1 - opacity) }; }
export function leadershipPose(progress: number) {
  const p = clamp01(progress);
  return { title: range(p, .72, .88), copy: range(p, .84, .98), context: smooth01(range(p, .78, .98)), voices: [.015, .185, .355, .525].map(start => voicePose(range(p, start, start + .18))) };
}
