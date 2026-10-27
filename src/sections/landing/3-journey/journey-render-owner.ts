/** GPU followers yield their idle RAF while the journey has a pending tick. */
export const journeyRenderOwnerEvent = "gazzar:journey-render-owner";

type RenderOwner = { pending: boolean; rendering: boolean };
const owners = new WeakMap<HTMLElement, RenderOwner>();

export function journeyOwnsRender(stage: HTMLElement) {
  const owner = owners.get(stage);
  return !!owner && (owner.pending || owner.rendering);
}

export function isJourneyRendering(stage: HTMLElement) {
  return owners.get(stage)?.rendering ?? false;
}

/** No clock or RAF here: the existing journey tick remains authoritative. */
export function createJourneyRenderOwner(stage: HTMLElement) {
  const owner: RenderOwner = { pending: false, rendering: false };
  owners.set(stage, owner);
  const current = () => owners.get(stage) === owner;
  const notify = () => stage.dispatchEvent(new Event(journeyRenderOwnerEvent));
  // A new motion mount also releases any superseded mount's pending ownership.
  notify();
  return {
    setPending(pending: boolean) {
      if (!current() || owner.pending === pending) return;
      owner.pending = pending;
      notify();
    },
    render(callback: () => void) {
      if (!current()) return;
      owner.rendering = true;
      try { callback(); }
      finally { owner.rendering = false; }
    },
    dispose() {
      if (!current()) return;
      owners.delete(stage);
      notify();
    },
  };
}
