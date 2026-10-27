import { createElement, type CSSProperties } from "react";
import type { Locale } from "@/i18n/routing";
import Footer from "@/components/layout/footer/footer";
import MotionToggle from "@/components/motion-toggle/motion-toggle";
import StorySceneGate from "../2-story/story-scene-gate";
import type { Dictionary } from "@/i18n/dictionaries";
import en from "./journey-en.json";
import ar from "./journey-ar.json";
import JourneyGate from "./journey-gate";
import styles from "./journey.module.css";
import { staticSystemsPaths } from "./systems-geometry.js";

type ContentNode =
  | string
  | { tag: string; props: Record<string, unknown>; children: ContentNode[] };

// Static, local content data. React renders real server HTML; no HTML injection or
// serialized browser component tree is used to supply the only copy of the text.
function renderContent(
  node: ContentNode,
  key = "root",
  footer?: React.ReactNode,
): React.ReactNode {
  if (typeof node === "string") return node;
  const props: Record<string, unknown> = { ...node.props, key };
  if (props.style) props.style = props.style as CSSProperties;
  const children = node.children.map((child, index) =>
    renderContent(child, `${key}-${index}`, footer),
  );
  const classes = String(props.className ?? "").split(" ");
  const stillTime = classes.includes("systems-build-copy")
    ? 501
    : classes.includes("systems-human-copy")
      ? 576
      : classes.includes("systems-ending")
        ? 658
        : null;
  if (stillTime !== null)
    children.push(
      <svg
        key={`${key}-still`}
        className="systems-still"
        viewBox="0 0 1000 650"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {staticSystemsPaths(stillTime).map((path, index) => (
          <path key={index} d={path} />
        ))}
      </svg>,
    );
  if (
    String(props.className ?? "")
      .split(" ")
      .includes("systems-story")
  )
    children.push(footer);
  return createElement(node.tag, props, ...children);
}

export default function Journey({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <div className={styles.journey} data-journey-root>
      <JourneyGate />
      <StorySceneGate />
      <div className="experience is-reduced">
        <MotionToggle className="motion-access" labels={dictionary.motion} />
        {renderContent(
          (locale === "ar" ? ar : en) as ContentNode,
          "journey",
          <Footer copy={dictionary.footer} locale={locale} key="home-footer" />,
        )}
      </div>
    </div>
  );
}
