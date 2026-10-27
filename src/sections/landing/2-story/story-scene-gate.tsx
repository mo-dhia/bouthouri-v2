"use client";

import { useStorySceneGate, useStorySceneMount, type StorySceneMountOptions } from "./story-scene-gate.logic";

/** Optional visuals only; all copy and fallback markup remain server-owned. */
export default function StorySceneGate() {
  const { failed, staticMode, onFailure } = useStorySceneGate();
  return failed ? null : <StorySceneMount staticMode={staticMode} onFailure={onFailure} />;
}

function StorySceneMount(props: StorySceneMountOptions) {
  useStorySceneMount(props);
  return null;
}
