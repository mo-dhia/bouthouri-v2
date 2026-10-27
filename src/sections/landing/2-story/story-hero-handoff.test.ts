import { expect, test } from "bun:test";
import { createHeroWorldClock, createHeroWorldPublisher, heroWorldEvent, heroWorldPose, readHeroWorldPose } from "../1-hero/hero-world";
import source from "../1-hero/hero-world-source.json";
import { createStoryHeroHandoff } from "./story-hero-handoff";
import { sampleStoryScore } from "./story-score";

for (const fixture of source.cases) test(`glasses use the displayed hero handoff: ${fixture.label}`, () => {
  const events = new EventTarget(), hero = {} as HTMLElement;
  const publisher = createHeroWorldPublisher(hero, events), clock = createHeroWorldClock();
  const read = () => readHeroWorldPose(hero) ?? heroWorldPose(0);
  let demands = 0;
  const handoff = createStoryHeroHandoff(read, () => { demands++; }, events);
  clock.snap(fixture.from); clock.retarget(fixture.to, 0);
  for (const sample of fixture.samples) {
    publisher.publish(clock.sample(sample.ms, fixture.mobile));
    // A delayed 480ms journey may still have openingTime=0; it cannot own
    // emergence. The reverse case also rejects stale completed openingTime=26.
    for (const openingTime of [0, 26]) {
      const frame = handoff.sample({ time: 0, openingTime, progress: 0, emergence: 0.5 });
      const score = sampleStoryScore(frame, fixture.mobile);
      expect(score.emergence).toBeCloseTo(sample.chapterPresence, 14);
      expect(score.opacity).toBeCloseTo(sample.openingOpacity, 14);
    }
    // GPU/font boot can finish here: a new subscriber starts at the exact
    // displayed pose even if native input has already advanced to its target.
    const late = createStoryHeroHandoff(read, () => {}, events);
    expect(late.sample({ time: 0, openingTime: 0, progress: 0 }).emergence).toBeCloseTo(sample.chapterPresence, 14);
    late.dispose();
  }
  expect(demands).toBeGreaterThan(0);
  const settledDemands = demands;
  publisher.publish(clock.sample(200, fixture.mobile));
  expect(demands).toBe(settledDemands);
  handoff.dispose(); publisher.publish(heroWorldPose(0.9));
  expect(demands).toBe(settledDemands);
  publisher.dispose();
});

test("cold fallback, retained reading mode and re-enable preserve independent clock ownership", () => {
  const events = new EventTarget();
  let pose = heroWorldPose(0.9154013015184381), demands = 0;
  const handoff = createStoryHeroHandoff(() => pose, () => { demands++; }, events);
  const narrative = { time: 0, openingTime: 0, progress: 0 };
  expect(handoff.sample(narrative).emergence).toBeCloseTo(0.5817874186447456, 14);
  const reading = sampleStoryScore({ time: 0, openingTime: 26, progress: 26 / 740, emergence: 1 });
  reading.idle = 0;
  expect(reading).toMatchObject({ time: 0, openingTime: 26, emergence: 1, opacity: 1, idle: 0 });
  pose = heroWorldPose(0); handoff.refresh();
  expect(handoff.sample(narrative).emergence).toBe(0);
  // The legacy progress-only teardown packet also updates the same handoff.
  events.dispatchEvent(new CustomEvent(heroWorldEvent, { detail: { progress: 1 } }));
  expect(handoff.sample(narrative).emergence).toBe(1);
  expect(demands).toBe(2);
  handoff.dispose();
});
