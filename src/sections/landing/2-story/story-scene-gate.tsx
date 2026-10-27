"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSceneActivation } from "@/lib/scene/sceneActivation";
import { useSceneBootSlot } from "@/lib/scene/sceneBootGate";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { uiStore, useUIStore } from "@/store/uiStore";

const loadScene = () => import("./story-scene.animate");
const loadEnvironment = () => import("./story-environment.animate");

/** SSR text remains in 3-journey. This null leaf imports only optional visuals. */
export default function StorySceneGate() {
  const quiet = useUIStore((state) => state.quietMode);
  const sharedFailure = useUIStore((state) => state.homeSceneFailed);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const onFailure = useCallback(() => {
    const stage = document.getElementById("top");
    if (stage) { stage.dataset.storyFailed = "true"; stage.dataset.storyScene = "failed"; stage.dataset.storyBoot = "failed"; }
    setFailed(true);
    uiStore.getState().setHomeSceneFailed(true);
  }, []);
  useEffect(() => {
    const stage = document.getElementById("top");
    return () => {
      if (stage) { delete stage.dataset.storyFailed; delete stage.dataset.storyBoot; delete stage.dataset.storyScene; }
      uiStore.getState().setHomeSceneFailed(false);
    };
  }, []);
  const staticMode = quiet || reduced;
  return failed || sharedFailure ? null : <StorySceneMount key={staticMode ? "static" : "motion"} staticMode={staticMode} onFailure={onFailure} />;
}

function StorySceneMount({ staticMode, onFailure }: { staticMode: boolean; onFailure: () => void }) {
  const target = useRef<HTMLElement | null>(null);
  const [settled, setSettled] = useState(false);
  useEffect(() => { target.current = document.getElementById("top"); }, []);
  const { shouldMount } = useSceneActivation({ targetRef: target, prewarmMargin: "300px" });
  const boot = useSceneBootSlot(shouldMount, settled, target);
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const start = () => {
      void loadEnvironment().then(({ mountStoryEnvironment }) => {
        const stage = target.current;
        if (!cancelled && stage) cleanup = mountStoryEnvironment(stage, { reduced: staticMode });
      }).catch((error: unknown) => console.error("Optional home material could not load.", error));
    };
    const supportsIdle = typeof window.requestIdleCallback === "function";
    const idle = supportsIdle ? window.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 32);
    return () => {
      cancelled = true;
      if (supportsIdle) window.cancelIdleCallback(idle); else window.clearTimeout(idle);
      cleanup?.();
    };
  }, [staticMode]);
  useEffect(() => {
    const stage = target.current;
    if (!shouldMount || !boot || !stage) return;
    stage.dataset.storyScene = "loading";
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void loadScene().then(({ mountStoryScene }) => {
      if (!cancelled) cleanup = mountStoryScene(stage, { staticMode, onReady: () => setSettled(true), onFailure: () => { setSettled(true); onFailure(); } });
    }).catch((error: unknown) => {
      if (!cancelled) { setSettled(true); onFailure(); }
      console.error("Optional story controller failed to load.", error);
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [staticMode, shouldMount, boot, onFailure]);
  return null;
}
