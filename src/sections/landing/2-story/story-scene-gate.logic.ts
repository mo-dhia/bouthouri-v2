"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSceneActivation } from "@/lib/scene/sceneActivation";
import { useSceneBootSlot } from "@/lib/scene/sceneBootGate";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { uiStore, useUIStore } from "@/store/uiStore";
import { environmentOwner, type EnvironmentLease } from "@/components/layout/environment/environment.logic";
import type { StorySceneController } from "./story-scene.animate";

const loadScene = () => import("./story-scene.animate");

export type StorySceneMountOptions = { staticMode: boolean; onFailure: () => void };

/** HOME failure and reading preferences; progress stays in the imperative owners. */
export function useStorySceneGate() {
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
  return { failed: failed || sharedFailure, staticMode, onFailure };
}

export function useStorySceneMount({ staticMode, onFailure }: StorySceneMountOptions) {
  const target = useRef<HTMLElement | null>(null);
  const [settled, setSettled] = useState(false);
  const controller = useRef<StorySceneController | null>(null);
  const mode = useRef(staticMode);
  useEffect(() => {
    mode.current = staticMode;
    controller.current?.setStaticMode(staticMode);
  }, [staticMode]);
  useEffect(() => { target.current = document.getElementById("top"); }, []);
  const { shouldMount } = useSceneActivation({ targetRef: target, prewarmMargin: "300px" });
  const boot = useSceneBootSlot(shouldMount, settled, target);
  useEffect(() => {
    const stage = target.current;
    if (!shouldMount || !boot || !stage) return;
    stage.dataset.storyScene = "loading";
    let cancelled = false;
    let owned: StorySceneController | undefined;
    void loadScene().then(({ createStoryScene }) => {
      if (!cancelled) {
        owned = createStoryScene(stage, { staticMode: mode.current, onReady: () => setSettled(true), onFailure: () => { setSettled(true); onFailure(); } });
        controller.current = owned;
      }
    }).catch((error: unknown) => {
      if (!cancelled) { setSettled(true); onFailure(); }
      console.error("Optional story controller failed to load.", error);
    });
    return () => { cancelled = true; owned?.dispose(); if (controller.current === owned) controller.current = null; };
  }, [shouldMount, boot, onFailure]);
}

/** This lease belongs to HOME, outside the optional failed object child. */
export function useHomeEnvironment(staticMode: boolean) {
  const lease = useRef<EnvironmentLease | null>(null);
  const mode = useRef(staticMode);
  useLayoutEffect(() => {
    const stage = document.getElementById("top"), page = stage?.closest<HTMLElement>("main[data-route-path]");
    const owner = stage?.closest<HTMLElement>(".experience");
    if (!stage || !page?.dataset.routePath || !owner) return;
    environmentOwner.navigate(location.pathname);
    const owned = environmentOwner.register({ kind: "home", stage, page, owner, heroRoot: page.querySelector<HTMLElement>("#identity") }, page.dataset.routePath, mode.current);
    lease.current = owned;
    return () => { owned.release(); if (lease.current === owned) lease.current = null; };
  }, []);
  useLayoutEffect(() => { mode.current = staticMode; lease.current?.setReducedMode(staticMode); }, [staticMode]);
}
