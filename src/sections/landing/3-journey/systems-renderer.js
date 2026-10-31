import {
  systemPaths,
  arcLengths,
  pathSegment,
  takeoverPath,
  finalMarkSegments,
} from "./systems-geometry.js";
import { sampleWorkPen, workPenSegment } from "./work-renderer.js";
import { workSymbolLayout } from "./work-paths.js";
import { referencePixelsToVw } from "@/lib/viewport-design";
import { journeyGeometry } from "./journey-geometry";

const clamp = (a, b, t) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const smooth = (a, b, t) => {
  const x = clamp(a, b, t);
  return x * x * (3 - 2 * x);
};
const mix = (a, b, t) => a + (b - a) * t;

/** Native SVG/DOM presentation driven by the shared deterministic journey score. */
export function createSystemsRenderer(root, getPen) {
  const section = root.querySelector(".systems-story");
  const svg = section.querySelector(".systems-relationships");
  const paths = [
    ...svg.querySelectorAll(".systems-main-stroke,.systems-voice-stroke"),
  ];
  const tips = [...svg.querySelectorAll(".systems-pen-tip")];
  const blocks = [
    ".systems-build-copy",
    ".systems-human-copy",
    ".systems-ending",
  ].map((s) => section.querySelector(s));
  const words = blocks.map((b) => [...b.querySelectorAll(".systems-word")]);
  const captions = blocks.map((b) => b.querySelector(".systems-caption"));
  const build = section.querySelector(".systems-build-layout");
  const shared = section.querySelector(".systems-shared");
  const distinct = section.querySelector(".systems-distinct");
  const sceneFooter = root.querySelector(".scene-footer");
  const ending = blocks[2].querySelector("h2");
  const footer = section.querySelector(".home-footer");
  const wordmark = section.querySelector(".footer-word-text");
  const information = section.querySelector(".footer-information");
  const colophon = section.querySelector(".footer-colophon");
  const chrome = [...root.querySelectorAll(".scene-footer,.progress-track")];
  const connector = [
    ...root.querySelectorAll(
      '[data-stroke-project="3"] .work-connector,[data-stroke-project="3"] .work-connector-tip',
    ),
  ];
  let camera = journeyGeometry(innerWidth),
    width = 0,
    height = 0,
    stageHeight = 0,
    frames = [],
    pen,
    endingTop = 0,
    endingHeight = 0,
    score = 400;
  const lineStates = (time) =>
    [
      [
        [425, 451, 511, 533],
        [439, 466, 521, 543],
      ],
      [
        [514, 538, 594, 623],
        [529, 554, 610, 639],
      ],
      [
        [604, 629, 1000, 1001],
        [627, 655, 1000, 1001],
      ],
    ].map((pair) =>
      pair.map(([a, b, c, d]) => ({
        enter: smooth(a, b, time),
        exit: smooth(c, d, time),
      })),
    );
  // Frames are built on first use: a paint reads two of the 315, and their
  // cost grows with the forecasting mark's segment count.
  const frameAt = (index) =>
    (frames[index] ??= systemPaths(
      index + 400,
      width,
      height,
      stageHeight,
      pen,
    ).map((points) => ({ points, lengths: arcLengths(points) })));
  const render = () => {
    if (!pen) return;
    const time = Math.max(400, Math.min(714, score));
    const frame = Math.max(0, Math.min(314, time - 400));
    const index = Math.floor(frame),
      next = Math.min(314, index + 1),
      fraction = frame - index;
    const sampled = frameAt(index).map((value, pathIndex) => {
      const other = frameAt(next)[pathIndex];
      const lengths = value.lengths.map((v, i) =>
        mix(v, other.lengths[i], fraction),
      );
      const points =
        pathIndex === 0 && time <= pen.takeover
          ? takeoverPath(time, width, stageHeight, pen)
          : value.points.map((v, i) => mix(v, other.points[i], fraction));
      const total = lengths.at(-1),
        markLength = lengths[32 * finalMarkSegments];
      const completed = pen.windows[3].end;
      const head =
        pathIndex === 0
          ? time < completed
            ? markLength * workPenSegment(pen, sampleWorkPen(pen, time).head, 7)
            : mix(markLength, total, clamp(completed, 444, time))
          : total *
            clamp(
              pathIndex === 1 ? 444 : 468,
              pathIndex === 1 ? 468 : 494,
              time,
            );
      return {
        points,
        lengths,
        head,
        visible: pathIndex === 0 ? time >= pen.takeover : head > 0,
      };
    });
    section.style.opacity = score >= pen.takeover ? "1" : "0";
    section.setAttribute("aria-hidden", String(score < pen.takeover));
    section.dataset.systemsTime = score.toFixed(3);
    sampled.forEach((value, i) => {
      paths[i].setAttribute(
        "d",
        value.visible
          ? pathSegment(value.points, value.lengths, 0, value.head)
          : "",
      );
      tips[i].setAttribute(
        "d",
        value.visible && value.head < value.lengths.at(-1) - 0.01
          ? pathSegment(
              value.points,
              value.lengths,
              Math.max(0, value.head - 3),
              value.head,
            )
          : "",
      );
    });
    const previous = workSymbolLayout(
      width,
      stageHeight,
      2,
      2.72,
      true,
      pen.direction,
    );
    const last = workSymbolLayout(
      width,
      stageHeight,
      3,
      3.88,
      true,
      pen.direction,
    );
    const fromX = previous.exitX,
      fromY = previous.y + 130 * previous.scale;
    const toX =
      score >= pen.takeover
        ? sampled[0].points[0] +
          pen.direction * sampleWorkPen(pen, score).travel * width
        : last.entryX;
    const toY =
      score >= pen.takeover ? sampled[0].points[1] : last.y + 130 * last.scale;
    connector.forEach((p) =>
      p.setAttribute(
        "d",
        `M${fromX} ${fromY} C${mix(fromX, toX, 0.42)} ${fromY} ${mix(fromX, toX, 0.58)} ${toY} ${toX} ${toY}`,
      ),
    );
    const states = lineStates(score);
    blocks.forEach((block, i) => {
      const presence = Math.max(
        ...states[i].map((s) => Math.min(s.enter, 1 - s.exit)),
      );
      block.style.opacity = presence > 0 ? "1" : "0";
      block.style.visibility = presence > 0 ? "visible" : "hidden";
      block.setAttribute("aria-hidden", String(presence < 0.025));
      words[i].forEach((word, j) => {
        const s = states[i][j];
        word.style.transform = `translate3d(0,${(1 - s.enter) * 112 - s.exit * 112}%,0)`;
      });
    });
    const organize = smooth(444, 504, score),
      coordinate = smooth(514, 562, score),
      footerProgress = smooth(663, 714, score);
    build.style.transform = `translate3d(${referencePixelsToVw((1 - organize) * 6, camera.reference)},${referencePixelsToVw(height * (0.18 * (1 - smooth(425, 468, score)) - 0.08 * smooth(511, 544, score)), camera.reference)},0)`;
    shared.style.transform = `translate3d(0,${referencePixelsToVw(0.28 * height * (1 - coordinate), camera.reference)},0)`;
    captions[0].style.opacity = String(
      smooth(472, 489, score) * (1 - smooth(501, 518, score)),
    );
    captions[1].style.opacity = String(
      smooth(558, 573, score) * (1 - smooth(592, 612, score)),
    );
    const mobile = width <= 700,
      short = height <= 600,
      rtl = section.dir === "rtl";
    const scale =
      1 -
      footerProgress *
        (1 - (short ? (mobile ? 0.256 : 0.32) : mobile ? 0.496 : 0.36));
    const translate =
      -height *
      (short
        ? mobile
          ? 0.12
          : 0.195
        : mobile
          ? rtl
            ? 0.14
            : 0.16
          : rtl
            ? 0.19
            : 0.18) *
      footerProgress;
    let correction = 0;
    if ((rtl || mobile) && score >= 604) {
      let top = Infinity;
      for (let i = 1; i < sampled[0].points.length; i += 2)
        top = Math.min(top, sampled[0].points[i]);
      correction = Math.min(
        0,
        top -
          Math.max(22, 0.035 * height) -
          (endingTop + translate + endingHeight * scale),
      );
    }
    ending.style.transform = `translate3d(0,${referencePixelsToVw(translate + correction, camera.reference)},0) scale(${scale})`;
    const invitation = smooth(680, 699, score),
      metadata = smooth(710, 714, score),
      reveal = smooth(690, 714, score);
    if (footer) {
      footer.style.visibility = invitation > 0 ? "visible" : "hidden";
      footer.inert = invitation < 0.8;
      footer.setAttribute("aria-hidden", String(invitation < 0.025));
    }
    if (information) {
      information.style.opacity = String(invitation);
      information.style.transform = `translate3d(0,${referencePixelsToVw((1 - footerProgress) * height * 0.435 + (1 - invitation) * 12, camera.reference)},0)`;
    }
    if (colophon) {
      colophon.inert = metadata < 0.8;
      colophon.style.opacity = String(metadata);
      colophon.style.transform = `translate3d(0,${referencePixelsToVw((1 - metadata) * 12, camera.reference)},0)`;
    }
    if (wordmark)
      wordmark.style.transform = `translate3d(0,${(1 - reveal) * 112}%,0)`;
    chrome.forEach((el) => {
      el.style.opacity = String(1 - smooth(659, 685, score));
      el.inert = score > 680;
      el.style.pointerEvents = score > 680 ? "none" : "";
    });
  };
  const resize = () => {
    camera = journeyGeometry(innerWidth, root.querySelector(".stage").getBoundingClientRect().height || undefined);
    endingTop = ending.offsetTop / camera.scale;
    endingHeight = ending.offsetHeight / camera.scale;
    if (section.dir === "rtl")
      blocks[1].style.setProperty(
        "--systems-human-bottom",
        referencePixelsToVw((distinct.offsetTop + distinct.offsetHeight) / camera.scale, camera.reference),
      );
    else blocks[1].style.removeProperty("--systems-human-bottom");
    const lineHeight = parseFloat(getComputedStyle(captions[1]).lineHeight);
    const captionShift = Math.min(
      0,
      sceneFooter.getBoundingClientRect().top -
        section.getBoundingClientRect().top -
        lineHeight -
        Math.max(
          shared.offsetTop + shared.offsetHeight + 0.28 * section.clientHeight,
          distinct.offsetTop + distinct.offsetHeight,
          captions[1].offsetTop + captions[1].offsetHeight,
        ),
    );
    blocks[1].style.transform = captionShift
      ? `translate3d(0,${referencePixelsToVw(captionShift / camera.scale, camera.reference)},0)`
      : "";
    const w = camera.width,
      h = section.getBoundingClientRect().height / camera.scale,
      stage = camera.height,
      newPen = getPen();
    if (
      w === width &&
      h === height &&
      stage === stageHeight &&
      pen === newPen
    ) {
      render();
      return;
    }
    width = w;
    height = h;
    stageHeight = stage;
    pen = newPen;
    frames = [];
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    render();
  };
  window.addEventListener("resize", resize);
  resize();
  return {
    resize,
    update(time) {
      const next = Math.max(400, Math.min(714, time));
      if (next === score) return;
      score = next;
      render();
    },
    dispose() {
      window.removeEventListener("resize", resize);
      for (const el of [
        section,
        ...blocks,
        ...words.flat(),
        build,
        shared,
        ending,
        footer,
        wordmark,
        information,
        colophon,
        ...chrome,
        ...captions,
      ].filter(Boolean)) {
        el.removeAttribute("style");
        el.removeAttribute("aria-hidden");
        el.inert = false;
      }
    },
  };
}
