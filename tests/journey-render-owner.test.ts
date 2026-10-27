import { expect, test } from "bun:test";
import { createJourneyRenderOwner, isJourneyRendering, journeyOwnsRender, journeyRenderOwnerEvent } from "../src/sections/landing/3-journey/journey-render-owner";

test("journey ownership announces transitions, scopes publication and releases after exceptions", () => {
  const stage = new EventTarget() as HTMLElement;
  const transitions: boolean[] = [];
  stage.addEventListener(journeyRenderOwnerEvent, () => transitions.push(journeyOwnsRender(stage)));
  const owner = createJourneyRenderOwner(stage);
  owner.setPending(true); owner.setPending(true);
  expect(transitions).toEqual([false, true]);
  expect(isJourneyRendering(stage)).toBe(false);
  owner.render(() => { expect(journeyOwnsRender(stage)).toBe(true); expect(isJourneyRendering(stage)).toBe(true); });
  expect(isJourneyRendering(stage)).toBe(false);
  expect(() => owner.render(() => { throw new Error("publication failed"); })).toThrow("publication failed");
  expect(isJourneyRendering(stage)).toBe(false);
  owner.setPending(false); owner.dispose(); owner.dispose();
  expect(transitions).toEqual([false, true, false, false]);
  expect(journeyOwnsRender(stage)).toBe(false);
});

test("late readers and motion remounts cannot be overwritten by a superseded render owner", () => {
  const stage = new EventTarget() as HTMLElement;
  const old = createJourneyRenderOwner(stage); old.setPending(true);
  expect(journeyOwnsRender(stage)).toBe(true);
  const current = createJourneyRenderOwner(stage); current.setPending(true);
  old.dispose(); old.setPending(false);
  expect(journeyOwnsRender(stage)).toBe(true);
  let stalePublication = false;
  old.render(() => { stalePublication = true; });
  expect(stalePublication).toBe(false);
  current.render(() => expect(isJourneyRendering(stage)).toBe(true));
  current.dispose(); expect(journeyOwnsRender(stage)).toBe(false);
});
