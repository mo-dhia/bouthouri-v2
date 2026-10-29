import { createNavigationId } from '@/lib/navigation/navigation-id';
import type { createExperimentEnvironment } from '../../experiment-environment';
import { setDesignStyle, referenceRect } from '../../experiment-dom';
import { leftSvg, rightSvg } from './cursor-icons';

type Environment = ReturnType<typeof createExperimentEnvironment>;
type Peer = { x: number; y: number; tx: number; ty: number; dir: number; shown: number; at: number; element: HTMLDivElement; pointer: HTMLSpanElement };
const colors = ['#3f76b5', '#838348', '#c2661f', '#9c6b77', '#a67f1e', '#8670a2'];
const first = ['quiet', 'swift', 'warm', 'spare', 'lucid', 'keen', 'soft', 'bright'], last = ['otter', 'heron', 'lynx', 'moth', 'fox', 'wren', 'koi', 'hare'];
const hash = (id: string) => { let n = 0; for (const c of id) n = n * 31 + c.charCodeAt(0) | 0; return Math.abs(n); };
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Source peer geometry and easing, with an owned same-origin transport. */
export const experiment = {
  mount(root: HTMLElement, env: Environment) {
    const win = root.ownerDocument.defaultView!, abort = new AbortController();
    const wrap = root.ownerDocument.createElement('div'); wrap.className = 'lc';
    const hint = root.ownerDocument.createElement('p'); hint.className = 'lc__hint';
    const arabic = root.closest<HTMLElement>('[data-locale]')?.dataset.locale === 'ar';
    hint.textContent = arabic ? 'افتح التجربة في تبويب آخر لرؤية المؤشر الآخر.' : 'Open this experiment in another tab to see each other move.';
    wrap.append(hint); root.append(wrap);
    const id = createNavigationId(win.crypto), peers = new Map<string, Peer>();
    const channel = new BroadcastChannel('bouthouri-projects-cursors-v1');
    let self: { x: number; y: number } | undefined, sentAt = 0, smoothing = 18, size = 1, disposed = false;
    const remove = (key: string) => { peers.get(key)?.element.remove(); peers.delete(key); if (!peers.size) { hint.style.opacity = '1'; env.clock.remove(frame); } };
    const receive = (raw: unknown) => {
      if (!raw || typeof raw !== 'object') return;
      const message = raw as Record<string, unknown>;
      if (message.id === id || typeof message.id !== 'string' || message.id.length > 128) return;
      if (message.type === 'hello') { if (self) send(true); return; }
      if (message.type === 'leave') { remove(message.id); return; }
      if (message.type !== 'cursor' || typeof message.x !== 'number' || !Number.isFinite(message.x) || typeof message.y !== 'number' || !Number.isFinite(message.y)) return;
      const x = clamp(message.x), y = clamp(message.y);
      let peer = peers.get(message.id);
      if (!peer) {
        if (peers.size >= 64) return;
        const n = hash(message.id), color = colors[n % colors.length];
        const element = root.ownerDocument.createElement('div'); element.className = 'lc__peer';
        const pointer = root.ownerDocument.createElement('span'); pointer.className = 'lc__ptr'; pointer.style.color = color; pointer.innerHTML = rightSvg;
        const name = root.ownerDocument.createElement('span'); name.className = 'lc__name'; name.style.background = color; name.textContent = `${first[n % first.length]} ${last[(n >> 3) % last.length]}`;
        element.append(pointer, name); wrap.append(element);
        peer = { x, y, tx: x, ty: y, dir: 1, shown: 1, at: env.now(), element, pointer }; peers.set(message.id, peer);
      }
      if (x > peer.tx + .004) peer.dir = 1; else if (x < peer.tx - .004) peer.dir = -1;
      peer.tx = x; peer.ty = y; peer.at = env.now(); hint.style.opacity = '0';
      if (env.reduced) { peer.x = x; peer.y = y; }
      env.clock.add(frame);
    };
    const send = (replyToJoin = false) => { if (self && !disposed && (replyToJoin || !root.ownerDocument.hidden)) { channel.postMessage({ type: 'cursor', id, ...self }); sentAt = env.now(); } };
    function frame(_seconds: number, delta: number) {
      const alpha = env.reduced ? 1 : 1 - Math.exp(-smoothing * Math.min(delta, 50) / 1000);
      peers.forEach((peer, key) => {
        if (env.now() - peer.at > 12_000) { remove(key); return; }
        peer.x += (peer.tx - peer.x) * alpha; peer.y += (peer.ty - peer.y) * alpha;
        setDesignStyle(peer.element, 'transform', `translate3d(${peer.x * wrap.clientWidth}px, ${peer.y * wrap.clientHeight}px, 0) scale(${size})`);
        if (peer.dir !== peer.shown) { peer.pointer.innerHTML = peer.dir === 1 ? rightSvg : leftSvg; peer.shown = peer.dir; }
      });
    }
    channel.addEventListener('message', event => receive(event.data));
    channel.postMessage({ type: 'hello', id });
    wrap.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const rect = referenceRect(wrap);
      if (!rect.width || !rect.height) return;
      self = { x: clamp((env.clientX(event) - rect.left) / rect.width), y: clamp((env.clientY(event) - rect.top) / rect.height) };
      if (env.now() - sentAt >= 50) send();
    }, { signal: abort.signal, passive: true });
    const heartbeat = win.setInterval(send, 4000);
    return {
      set(key: string, value: unknown) { if (key === 'smoothing') smoothing = Math.max(4, Math.min(40, Number(value))); if (key === 'size') size = Math.max(.6, Math.min(1.8, Number(value))); },
      destroy() { disposed = true; channel.postMessage({ type: 'leave', id }); channel.close(); win.clearInterval(heartbeat); abort.abort(); env.clock.remove(frame); peers.forEach(peer => peer.element.remove()); peers.clear(); wrap.remove(); },
    };
  },
};
