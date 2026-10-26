"use client";

import { useMotionToggle } from "./motion-toggle.logic";

export default function MotionToggle({ labels }: { labels: { quiet: string; full: string } }) {
  const { quietMode, toggle } = useMotionToggle();
  return <button type="button" aria-pressed={quietMode} onClick={toggle}>{quietMode ? labels.full : labels.quiet}</button>;
}
