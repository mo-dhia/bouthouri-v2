import type { EnvironmentAttachment, EnvironmentBinding, PersistentStoryEnvironmentController } from "@/sections/landing/2-story/story-environment.animate";

type Runtime = Pick<typeof import("@/sections/landing/2-story/story-environment.animate"), "createPersistentStoryEnvironment">;
type Registration = { binding: EnvironmentBinding; path: string; reduced: boolean; attachment?: EnvironmentAttachment };
export type EnvironmentLease = { invalidate(): void; setReducedMode(enabled: boolean): void; release(): void };
const load = () => import("@/sections/landing/2-story/story-environment.animate");
const normalize = (path: string) => path.replace(/\/$/, "");

/** Kept small in the layout graph; the only heavy edge is load(), after a lease. */
export function createEnvironmentOwner(loadRuntime: () => Promise<Runtime> = load) {
  let parking: HTMLElement | undefined, locale = "", path: string | undefined;
  let current: Registration | undefined, resource: PersistentStoryEnvironmentController | undefined;
  let generation = 0, loading = false, failed = false, runtime: Runtime | undefined;
  let cancelIdle: (() => void) | undefined, media: MediaQueryList | undefined;
  let mountToken: object | undefined, releaseMedia: (() => void) | undefined;
  const eligible = (value: string) => new RegExp(`^/${locale}(?:/(?:vision|services|contact))?$`).test(normalize(value));
  const mode = () => current?.reduced || media?.matches || false;
  const detach = () => { current?.attachment?.release(); if (current) current.attachment = undefined; };
  const stop = () => {
    generation++; cancelIdle?.(); cancelIdle = undefined;
    loading = failed = false; detach(); resource?.dispose(); resource = undefined;
  };
  const adopt = () => {
    if (!parking || !current || !path || !eligible(path) || current.path !== path) return;
    if (!resource && runtime) resource = runtime.createPersistentStoryEnvironment(parking, { reduced: mode() });
    if (resource && !current.attachment) {
      resource.setReducedMode(mode()); current.attachment = resource.bind(current.binding);
    }
  };
  const start = () => {
    if (!parking || !current || !path || !eligible(path) || current.path !== path || failed) return;
    if (runtime || resource) { adopt(); return; }
    if (loading) return;
    loading = true;
    const ownedGeneration = generation;
    void loadRuntime().then((loaded) => {
      if (generation !== ownedGeneration || !parking) return;
      runtime = loaded; loading = false; adopt();
    }).catch(() => { if (generation === ownedGeneration) { loading = false; failed = true; } });
  };
  const schedule = () => {
    if (!parking || !current || !path || !eligible(path) || current.path !== path) return;
    // A pending HOME idle boot must not delay an editorial that now needs it.
    if (current.binding.kind === "editorial" || resource || runtime) {
      cancelIdle?.(); cancelIdle = undefined; start(); return;
    }
    if (cancelIdle || loading || failed) return;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => { cancelIdle = undefined; start(); }, { timeout: 1200 });
      cancelIdle = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(() => { cancelIdle = undefined; start(); }, 32);
      cancelIdle = () => window.clearTimeout(id);
    }
  };
  const navigate = (nextPath: string) => {
    path = normalize(nextPath);
    if (!parking) return;
    if (!eligible(path)) { stop(); current = undefined; return; }
    if (current && current.path !== path) { detach(); current = undefined; resource?.setReducedMode(mode()); }
    schedule();
  };
  return {
    mount(host: HTMLElement, language: string, pathname: string) {
      if (parking) { releaseMedia?.(); stop(); current = undefined; }
      parking = host; locale = language;
      const token = {}; mountToken = token;
      media = matchMedia("(prefers-reduced-motion: reduce)");
      const preference = () => resource?.setReducedMode(mode());
      media.addEventListener("change", preference);
      const ownedMedia = media;
      releaseMedia = () => ownedMedia.removeEventListener("change", preference);
      navigate(pathname); schedule();
      return () => {
        if (mountToken !== token) return;
        releaseMedia?.(); releaseMedia = undefined; stop(); mountToken = undefined;
        parking = undefined; media = undefined; path = undefined; current = undefined;
      };
    },
    navigate,
    register(binding: EnvironmentBinding, pathname: string, reduced: boolean): EnvironmentLease {
      const next: Registration = { binding, path: normalize(pathname), reduced };
      if (parking && (next.path !== path || !eligible(next.path))) return { invalidate() {}, setReducedMode() {}, release() {} };
      // bind() replaces its old attachment atomically. In particular, a newer
      // publisher on the same page must survive a superseded lease's cleanup.
      current = next; schedule();
      return {
        invalidate() { if (current === next) next.attachment?.invalidate(); },
        setReducedMode(enabled: boolean) { if (current !== next) return; next.reduced = enabled; resource?.setReducedMode(mode()); },
        release() {
          if (current !== next) return;
          detach(); current = undefined; cancelIdle?.(); cancelIdle = undefined;
          resource?.setReducedMode(mode());
        },
      };
    },
  };
}

export const environmentOwner = createEnvironmentOwner();
