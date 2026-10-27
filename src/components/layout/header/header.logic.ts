import { uiStore } from "@/store/uiStore";
import {
  attachAudioLifecycle,
  playMaterialSound,
  setAudioEnabled,
} from "@/lib/audio/material-audio";
import { attachSectionWhispers } from "@/lib/audio/section-whispers";
import menuStyles from "./menu.module.css";
import {
  heroWorldEvent,
  heroWorldPose,
  type HeroWorldPose,
} from "@/sections/landing/1-hero/hero-world";

const ease = "cubic-bezier(.65, 0, .25, 1)";
const origins = [
  [78.5, 70, 0],
  [133.5, 70, 0],
  [212.5, 70, 0],
];
const assembled = [
  [118.913103479137, 88.38151229152174, -410.3550821110788 / Math.PI],
  [137.4465684964374, 51.9042756629948, 0],
  [163.5457992608359, 22.70018681765191, 0],
];

export function mountHeader(root: HTMLElement): () => void {
  const dialog = root.querySelector<HTMLDialogElement>("#portfolio-navigation");
  const utilities = root.querySelector<HTMLElement>("[data-hero-utilities]");
  const hero = root.querySelector<HTMLElement>('[data-nav-layer="hero"]');
  const persistent = root.querySelector<HTMLElement>(
    '[data-nav-layer="persistent"]',
  );
  if (!dialog || !utilities || !hero || !persistent) return () => {};
  const detachAudio = attachAudioLifecycle();
  const stage = document.querySelector<HTMLElement>("#top");
  const detachWhispers = stage
    ? attachSectionWhispers(stage, root.dataset.locale === "ar" ? "ar" : "en")
    : () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () =>
    query.matches ||
    uiStore.getState().quietMode ||
    uiStore.getState().homeSceneFailed;
  const buttons = () =>
    document.querySelectorAll<HTMLButtonElement>("[data-menu-control]");
  const soundControls = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-sound-control]"),
  );
  const rolls = Array.from(
    persistent.querySelectorAll<HTMLElement>("[data-nav-roll]"),
  );
  const side = root.querySelector<HTMLElement>("[data-shell-side-menu]");
  const sideRoll = side?.querySelector<HTMLElement>("[data-nav-side-roll]");
  const animations = new Set<Animation>();
  const activeAnimations = new Map<Element, Animation>();
  const disposers: Array<() => void> = [];
  const sourceSides = new Map<
    HTMLElement,
    { style: string | null; inert: boolean; hidden: string | null }
  >();
  let disposed = false;
  let opener: HTMLElement | undefined;
  let savedOverflow = "";
  let savedGutter = "";
  let lockedX = 0;
  let lockedY = 0;
  let clockTimer: ReturnType<typeof setTimeout> | undefined;
  let copiedTimer: ReturnType<typeof setTimeout> | undefined;
  let openRequest = 0;
  let lastPose = heroWorldPose(0);

  const animate = (
    element: Element | null,
    frames: Keyframe[],
    duration: number,
    delay = 0,
  ) => {
    if (!element || typeof element.animate !== "function") return undefined;
    const previous = activeAnimations.get(element);
    if (previous) {
      previous.cancel();
      animations.delete(previous);
    }
    const animation = element.animate(frames, {
      duration: reduced() ? 0 : duration,
      delay: reduced() ? 0 : delay,
      easing: ease,
      fill: "both",
    });
    animations.add(animation);
    activeAnimations.set(element, animation);
    return animation;
  };
  const cancelAnimations = () => {
    animations.forEach((animation) => animation.cancel());
    animations.clear();
    activeAnimations.clear();
  };
  const syncSound = () => {
    const state = uiStore.getState();
    soundControls.forEach((button) => {
      button.setAttribute("aria-pressed", String(state.soundEnabled));
      button.setAttribute(
        "aria-label",
        (state.soundEnabled
          ? button.dataset.labelOn
          : button.dataset.labelOff) ?? "",
      );
      button.title =
        (state.audioState === "error"
          ? button.dataset.titleError
          : state.audioState === "starting"
            ? button.dataset.titleStarting
            : state.audioState === "awaiting-user-gesture"
              ? button.dataset.titlePending
              : state.soundEnabled
                ? button.dataset.titleOn
                : button.dataset.titleOff) ?? "";
      button.dataset.audioState = state.audioState;
      button.dataset.audioPreference = state.audioPreference ?? "unset";
      const label = button.querySelector<HTMLElement>("[data-sound-label]");
      if (label)
        label.textContent =
          (state.soundEnabled
            ? button.dataset.soundOn
            : button.dataset.soundOff) ?? "";
    });
  };
  const unsubscribe = uiStore.subscribe(syncSound);
  syncSound();

  let waveFrame = 0;
  const paths = soundControls.map((button) =>
    button.querySelector<SVGPathElement>("[data-sound-wave]"),
  );
  const wave = (now: number) => {
    waveFrame = 0;
    if (
      disposed ||
      document.hidden ||
      !uiStore.getState().soundEnabled ||
      reduced()
    )
      return;
    paths.forEach((path) => {
      if (!path || !path.getClientRects().length) return;
      let d = "";
      for (let i = 0; i <= 40; i++) {
        const x = (i * 26) / 40;
        const y =
          13 +
          Math.sin((i / 40) * Math.PI * 4 + now / 350) *
            Math.sin((i / 40) * Math.PI) *
            4;
        d += `${i ? "L" : "M"}${x.toFixed(3)},${y.toFixed(3)}`;
      }
      path.setAttribute("d", d);
    });
    waveFrame = requestAnimationFrame(wave);
  };
  const syncWave = () => {
    cancelAnimationFrame(waveFrame);
    waveFrame = 0;
    if (uiStore.getState().soundEnabled && !document.hidden && !reduced())
      waveFrame = requestAnimationFrame(wave);
    else paths.forEach((path) => path?.setAttribute("d", "M0 13H26"));
  };
  const unsubscribeWave = uiStore.subscribe(syncWave);
  document.addEventListener("visibilitychange", syncWave);
  query.addEventListener("change", syncWave);

  const updateClock = () => {
    clearTimeout(clockTimer);
    if (disposed || document.hidden || !dialog.open) return;
    const now = new Date();
    dialog
      .querySelectorAll<HTMLTimeElement>("[data-shell-clock]")
      .forEach((time) => {
        const value = new Intl.DateTimeFormat("en-GB", {
          timeZone: time.dataset.shellClock,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(now);
        if (!time.children.length) {
          time.replaceChildren(
            ...[...value].map((digit, index) => {
              const slot = document.createElement("span");
              slot.setAttribute("aria-hidden", "true");
              if (index === 2) {
                slot.textContent = ":";
                return slot;
              }
              slot.className = menuStyles["menu-clock-digit"];
              slot.dataset.clockDigit = String(index);
              const roll = document.createElement("span");
              for (let i = 0; i < 2; i++) {
                const line = document.createElement("span");
                line.textContent = digit;
                roll.append(line);
              }
              slot.append(roll);
              return slot;
            }),
          );
        } else {
          time
            .querySelectorAll<HTMLElement>("[data-clock-digit]")
            .forEach((slot) => {
              const index = Number(slot.dataset.clockDigit);
              if (value[index] === time.dataset.clockValue?.[index]) return;
              const roll = slot.firstElementChild as HTMLElement;
              roll.firstElementChild!.textContent =
                time.dataset.clockValue?.[index] ?? value[index];
              roll.lastElementChild!.textContent = value[index];
              animate(
                roll,
                [
                  { transform: "translateY(0)" },
                  { transform: "translateY(-50%)" },
                ],
                360,
              );
            });
        }
        time.dataset.clockValue = value;
        time.setAttribute("aria-label", value);
        time.dateTime = now.toISOString();
      });
    clockTimer = setTimeout(updateClock, 60000 - (Date.now() % 60000) + 15);
  };
  document.addEventListener("visibilitychange", updateClock);

  const finishClose = () => {
    dialog.close();
    document.documentElement.style.overflow = savedOverflow;
    document.documentElement.style.scrollbarGutter = savedGutter;
    delete document.documentElement.dataset.menuOpen;
    uiStore.getState().setMenuOpen(false);
    if (uiStore.getState().entryPhase === "complete")
      globalThis.__bouthouriLenis?.start();
    buttons().forEach((button) => {
      if (!button.hasAttribute("data-menu-close"))
        button.setAttribute("aria-expanded", "false");
    });
    if (opener?.isConnected && !opener.closest("[inert]"))
      opener.focus({ preventScroll: true });
    cancelAnimations();
  };
  const close = (immediate = false) => {
    if (!dialog.open) return;
    const request = ++openRequest;
    if (reduced() || immediate) {
      finishClose();
      return;
    }
    cancelAnimations();
    const animation = animate(
      dialog.querySelector("[data-menu-surface]"),
      [{ clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)" }],
      340,
    );
    animate(
      dialog.querySelector("[data-menu-scroll]"),
      [{ opacity: 1 }, { opacity: 0 }],
      180,
    );
    void animation?.finished
      .then(() => {
        if (!disposed && request === openRequest) finishClose();
      })
      .catch(() => {});
    if (!animation) finishClose();
  };
  const open = (button: HTMLElement) => {
    if (dialog.open) return;
    ++openRequest;
    opener = button;
    lockedX = scrollX;
    lockedY = scrollY;
    savedOverflow = document.documentElement.style.overflow;
    savedGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = "stable";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.dataset.menuOpen = "true";
    uiStore.getState().setMenuOpen(true);
    globalThis.__bouthouriLenis?.stop();
    buttons().forEach((control) =>
      control.setAttribute("aria-expanded", "true"),
    );
    dialog.showModal();
    measureInk();
    dialog
      .querySelector<HTMLButtonElement>("[data-menu-close]")
      ?.focus({ preventScroll: true });
    updateClock();
    cancelAnimations();
    animate(
      dialog.querySelector("[data-menu-surface]"),
      [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }],
      360,
    );
    animate(
      dialog.querySelector("[data-menu-scroll]"),
      [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }],
      120,
      360,
    );
    animate(
      dialog.querySelector('[class*="menu-opening-line"]'),
      [
        { transform: "scaleX(0)", opacity: 1 },
        { transform: "scaleX(1)", opacity: 1 },
        { transform: "scaleX(1)", opacity: 0 },
      ],
      390,
      360,
    );
    dialog
      .querySelectorAll("[data-menu-link-inner]")
      .forEach((link, i) =>
        animate(
          link,
          [{ transform: "translateY(112%)" }, { transform: "translateY(0)" }],
          360,
          400 + i * 45,
        ),
      );
    dialog
      .querySelectorAll("[data-menu-secondary]")
      .forEach((item, i) =>
        animate(
          item,
          [{ transform: "translateY(105%)" }, { transform: "translateY(0)" }],
          300,
          540 + i * 45,
        ),
      );
    animate(
      dialog.querySelector("[data-menu-bottom]"),
      [{ transform: "translateY(110%)" }, { transform: "translateY(0)" }],
      250,
      650,
    );
  };
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const menuButton = target?.closest<HTMLElement>("[data-menu-control]");
    if (menuButton) {
      event.preventDefault();
      if (dialog.open) close();
      else open(menuButton);
      return;
    }
    const sound = target?.closest("[data-sound-control]");
    if (sound) {
      void setAudioEnabled(!uiStore.getState().soundEnabled);
      return;
    }
    if (target?.closest("[data-material-sound]")) playMaterialSound("click");
    const copy = target?.closest<HTMLButtonElement>("[data-menu-copy]");
    if (copy) {
      const status = dialog.querySelector<HTMLElement>("[data-copy-status]");
      void navigator.clipboard
        ?.writeText("hello@thisisgazzar.com")
        .then(() => {
          if (disposed) return;
          copy.textContent = copy.dataset.copiedLabel ?? "";
          if (status) status.textContent = copy.textContent;
          clearTimeout(copiedTimer);
          copiedTimer = setTimeout(() => {
            copy.textContent = copy.dataset.copyLabel ?? "";
            if (status) status.textContent = "";
          }, 1600);
        })
        .catch(() => {
          if (status) status.textContent = copy.dataset.copyError ?? "";
        });
    }
    if (
      target?.closest("a[href]") &&
      dialog.contains(target) &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    )
      close(true);
  };
  document.addEventListener("click", onClick);
  const keepMenuPosition = () => {
    if (
      dialog.open &&
      (Math.abs(scrollY - lockedY) > 0.5 || scrollX !== lockedX)
    ) {
      window.scrollTo({ top: lockedY, left: lockedX, behavior: "instant" });
    }
  };
  window.addEventListener("scroll", keepMenuPosition, { passive: true });
  const onCancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  dialog.addEventListener("cancel", onCancel);

  const selectMenu = (item: HTMLElement) => {
    const index = item.dataset.menuItem;
    dialog.querySelectorAll<HTMLElement>("[data-menu-item]").forEach((link) => {
      link.dataset.selected = String(link === item);
    });
    dialog
      .querySelectorAll<HTMLElement>("[data-menu-description]")
      .forEach((description) => {
        const selected = description.dataset.menuDescription === index;
        description.setAttribute("aria-hidden", String(!selected));
        animate(
          description,
          [
            { transform: `translateY(${selected ? 115 : 0}%)` },
            { transform: `translateY(${selected ? 0 : -115}%)` },
          ],
          320,
        );
      });
    const rail = dialog.querySelector<HTMLElement>("[data-menu-rail]");
    if (rail)
      rail.style.transform = `translateY(${item.offsetTop + item.offsetHeight / 2}px)`;
  };
  dialog.querySelectorAll<HTMLElement>("[data-menu-item]").forEach((item) => {
    const select = () => selectMenu(item);
    item.addEventListener("pointerenter", select);
    item.addEventListener("focus", select);
    disposers.push(() => {
      item.removeEventListener("pointerenter", select);
      item.removeEventListener("focus", select);
    });
  });

  const applyNavigation = (pose: HeroWorldPose) => {
    lastPose = pose;
    const height =
      parseFloat(getComputedStyle(utilities).top) +
      (utilities.firstElementChild?.clientHeight ?? 44) +
      12;
    const heroVisible = pose.navTravel < 1 && pose.navOpacity > 0.015;
    const persistentVisible = pose.persistentY.some((y) => y < 100);
    hero.style.transform = `translate3d(0,${-pose.navTravel * height}px,0)`;
    hero.style.opacity = String(pose.navOpacity);
    hero.style.visibility = heroVisible ? "inherit" : "hidden";
    hero.inert = !heroVisible;
    hero.setAttribute("aria-hidden", String(!heroVisible));
    rolls.forEach((roll, i) => {
      roll.style.transform = `translate3d(0,${pose.persistentY[Math.min(i, 3)]}%,0)`;
    });
    persistent.style.visibility = persistentVisible ? "inherit" : "hidden";
    persistent.inert = heroVisible || !persistentVisible;
    persistent.setAttribute("aria-hidden", String(persistent.inert));
    const sideVisible = pose.sideY < 100;
    if (side && sideRoll) {
      side.style.visibility = sideVisible ? "visible" : "hidden";
      side.inert = !sideVisible;
      side.setAttribute("aria-hidden", String(!sideVisible));
      sideRoll.style.transform = `translateY(${pose.sideY}%)`;
    }
    // The source stage keeps its semantic masthead. The shell supplies the styled
    // control because the stage deliberately loads only its own scoped CSS.
    document
      .querySelectorAll<HTMLElement>(".masthead .chapter-side")
      .forEach((original) => {
        if (!sourceSides.has(original))
          sourceSides.set(original, {
            style: original.getAttribute("style"),
            inert: original.inert,
            hidden: original.getAttribute("aria-hidden"),
          });
        original.style.visibility = "hidden";
        original.inert = true;
        original.setAttribute("aria-hidden", "true");
      });
    utilities.dataset.navMode =
      pose.progress === 0
        ? "hero"
        : pose.progress === 1
          ? "persistent"
          : "replacing";
    utilities.dataset.navContext = heroVisible
      ? "hero"
      : persistentVisible
        ? "persistent"
        : "none";
  };
  const onWorld = (event: Event) => {
    const detail = (event as CustomEvent<{ progress: number }>).detail;
    if (detail && Number.isFinite(detail.progress))
      applyNavigation(heroWorldPose(detail.progress));
  };
  window.addEventListener(heroWorldEvent, onWorld);
  const measureInk = () => {
    if (disposed) return;
    const context = document.createElement("canvas").getContext("2d");
    if (!context) return;
    root.querySelectorAll<HTMLElement>("[data-nav-ink]").forEach((ink) => {
      if (!ink.getClientRects().length) return;
      ink.style.removeProperty("translate");
      const baseline = ink.querySelector<HTMLElement>(
        "[data-nav-ink-baseline]",
      );
      if (!baseline) return;
      const style = getComputedStyle(ink);
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.direction = style.direction === "rtl" ? "rtl" : "ltr";
      const metrics = context.measureText(ink.textContent ?? "");
      const bounds = ink.getBoundingClientRect();
      const center =
        baseline.getBoundingClientRect().top +
        (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) /
          2;
      ink.style.translate = `0 ${((bounds.top + bounds.bottom) / 2 - center).toFixed(3)}px`;
    });
  };
  const onResize = () => {
    applyNavigation(lastPose);
    measureInk();
  };
  window.addEventListener("resize", onResize, { passive: true });
  void document.fonts.ready.then(measureInk);
  const onQuietScroll = () => {
    const identity = document.querySelector<HTMLElement>("#identity");
    const progress = Number(identity?.dataset.heroWorld);
    if (identity?.hasAttribute("data-enhanced")) {
      if (Number.isFinite(progress)) applyNavigation(heroWorldPose(progress));
    } else {
      const top = identity ? identity.getBoundingClientRect().top + scrollY : 0;
      applyNavigation(
        heroWorldPose(
          identity && scrollY >= top + identity.offsetHeight ? 1 : 0,
        ),
      );
    }
  };
  // The hero may have completed a deep restore before this lazy shell chunk
  // mounts. Replay its current pose rather than waiting for a changed frame.
  applyNavigation(lastPose);
  onQuietScroll();
  const unsubscribeNavigation = uiStore.subscribe(onQuietScroll);
  window.addEventListener("scroll", onQuietScroll, { passive: true });

  const onHover = (event: PointerEvent) => {
    if (
      event.target instanceof Element &&
      event.target.closest("[data-material-sound]")
    )
      playMaterialSound("hover");
  };
  document.addEventListener("pointerover", onHover, { passive: true });
  root.querySelectorAll<HTMLElement>("[data-home-link]").forEach((link) => {
    const pieces = Array.from(
      link.querySelectorAll<SVGElement>("[data-hero-logo-piece]"),
    );
    let motion: Animation[] = [];
    const morph = (active: boolean) => {
      const current = pieces.map((piece) => getComputedStyle(piece).transform);
      motion.forEach((animation) => animation.cancel());
      motion = pieces.map((piece, i) => {
        const from = current[i];
        const to = active ? assembled[i] : origins[i];
        const transform = (v: number[]) =>
          `translate(${v[0]}px,${v[1]}px) rotate(${v[2]}deg)`;
        const animation = piece.animate(
          [{ transform: from }, { transform: transform(to) }],
          {
            duration: reduced() ? 160 : 480 + i * 35,
            easing: ease,
            fill: "both",
          },
        );
        return animation;
      });
    };
    const enter = () => morph(true);
    const leave = () => morph(false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        morph(false);
        link.blur();
      }
    };
    link.addEventListener("pointerenter", enter);
    link.addEventListener("pointerleave", leave);
    link.addEventListener("focus", enter);
    link.addEventListener("blur", leave);
    link.addEventListener("keydown", escape);
    disposers.push(() => {
      motion.forEach((animation) => animation.cancel());
      link.removeEventListener("pointerenter", enter);
      link.removeEventListener("pointerleave", leave);
      link.removeEventListener("focus", enter);
      link.removeEventListener("blur", leave);
      link.removeEventListener("keydown", escape);
    });
  });
  const first = dialog.querySelector<HTMLElement>("[data-menu-item]");
  if (first) selectMenu(first);
  return () => {
    disposed = true;
    ++openRequest;
    if (dialog.open) finishClose();
    cancelAnimations();
    clearTimeout(clockTimer);
    clearTimeout(copiedTimer);
    cancelAnimationFrame(waveFrame);
    unsubscribe();
    unsubscribeWave();
    unsubscribeNavigation();
    detachWhispers();
    detachAudio();
    disposers.forEach((dispose) => dispose());
    document.removeEventListener("click", onClick);
    window.removeEventListener("scroll", keepMenuPosition);
    document.removeEventListener("pointerover", onHover);
    dialog.removeEventListener("cancel", onCancel);
    window.removeEventListener(heroWorldEvent, onWorld);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onQuietScroll);
    document.removeEventListener("visibilitychange", syncWave);
    document.removeEventListener("visibilitychange", updateClock);
    query.removeEventListener("change", syncWave);
    [hero, persistent, ...rolls, side, sideRoll].forEach((element) =>
      element?.removeAttribute("style"),
    );
    root
      .querySelectorAll<HTMLElement>("[data-nav-ink]")
      .forEach((ink) => ink.style.removeProperty("translate"));
    sourceSides.forEach((previous, element) => {
      if (previous.style === null) element.removeAttribute("style");
      else element.setAttribute("style", previous.style);
      element.inert = previous.inert;
      if (previous.hidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", previous.hidden);
    });
    delete utilities.dataset.navMode;
    delete utilities.dataset.navContext;
    persistent.inert = true;
    persistent.setAttribute("aria-hidden", "true");
    hero.inert = false;
    hero.removeAttribute("aria-hidden");
  };
}
