"use client";

import { useMotionToggle } from "./motion-toggle.logic";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function MotionToggle({ labels, className }: { labels: { quiet: string; full: string; following: string; followingTitle: string; quietTitle: string }; className?: string }) {
  const { quietMode, toggle } = useMotionToggle();
  const reduced = useReducedMotion();
  return <button type="button" className={className} aria-pressed={quietMode || reduced} disabled={reduced} title={reduced ? labels.followingTitle : labels.quietTitle} onClick={toggle}>{reduced ? labels.following : quietMode ? labels.full : labels.quiet}</button>;
}
