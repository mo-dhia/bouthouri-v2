// The tour is embedded same-origin, so it follows the host page's language.
const HOTSPOT_LABELS = {
  en: "Move to this location",
  fr: "Aller à cet endroit",
  es: "Ir a este lugar",
  ar: "الانتقال إلى هذا الموضع",
};
function hotspotLabel() {
  try {
    const lang = window.parent.document.documentElement.lang;
    return HOTSPOT_LABELS[lang] || HOTSPOT_LABELS.en;
  } catch {
    return HOTSPOT_LABELS.en;
  }
}

// Add only location hotspots to the existing Pano2VR skin and controls.
window.createTourNavigation = function createTourNavigation(player, skin) {
  let config = null;
  let interactionEnabled = false;
  let preloadEnabled = false;
  let preloadInFlight = false;
  let preloadTimer = null;
  const warmedUrls = new Set();

  skin.addSkinHotspot = function (hotspot) {
    const anchor = document.createElement("div");
    anchor.className = "tour-hotspot-anchor";
    anchor.ggVisible = true;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "tour-hotspot";
    button.disabled = !interactionEnabled;
    button.dataset.destination = hotspot.url.slice(1, -1);
    button.setAttribute("aria-label", hotspotLabel());

    const icon = document.createElement("img");
    icon.alt = "";
    icon.draggable = false;
    const reveal = () => {
      button.dataset.ready = "true";
    };
    icon.addEventListener("load", reveal, { once: true });
    icon.src = "tour-hotspot.svg";
    if (icon.complete && icon.naturalWidth > 0) reveal();
    button.appendChild(icon);
    anchor.appendChild(button);

    // Keep a location click/tap from starting the panorama's drag gesture.
    for (const event of ["pointerdown", "mousedown", "touchstart", "dblclick"]) {
      button.addEventListener(event, (e) => e.stopPropagation());
    }
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!interactionEnabled) return;
      player.openNext(hotspot.url, hotspot.target);
      skin.hotspotProxyClick(hotspot.id, hotspot.url);
    });

    // The player projects this anchor from the hotspot's pan/tilt on every
    // frame, so the icon stays at its actual location when dragging or zooming.
    return { __div: anchor, hotspot, player };
  };

  function getWarmupUrls() {
    if (!config) return [];

    const urls = [];
    for (const node of config.querySelectorAll("panorama")) {
      if (node.id === player.getCurrentNode()) continue;
      const input = node.querySelector("input");
      const template = input.getAttribute("leveltileurl");
      const tileSize = Number(input.getAttribute("leveltilesize"));
      const levels = [...input.querySelectorAll("level")].reverse();
      const tileUrl = (face, level, x, y) =>
        new URL(
          template
            .replace("%c", face)
            .replace("%l", level)
            .replace("%x", x)
            .replace("%y", y),
          document.baseURI,
        ).href;

      if (input.querySelector('preview[strip="1"]')) {
        urls.push(tileUrl(6, 0, 0, 0));
      }
      // Warm the same base level the engine preloads. Higher resolution
      // tiles remain viewport-driven and are requested by openNext on demand.
      levels.forEach((level, index) => {
        if (level.getAttribute("preload") !== "1") return;
        const columns = Math.ceil(Number(level.getAttribute("width")) / tileSize);
        const rows = Math.ceil(Number(level.getAttribute("height")) / tileSize);
        for (let face = 0; face < 6; face += 1) {
          for (let x = 0; x < columns; x += 1) {
            for (let y = 0; y < rows; y += 1) {
              urls.push(tileUrl(face, index, x, y));
            }
          }
        }
      });
    }
    return urls;
  }

  function warmNext() {
    window.clearTimeout(preloadTimer);
    if (
      !interactionEnabled || !preloadEnabled || preloadInFlight || document.hidden
    ) return;
    if (!player.getIsLoaded() || player.getIsTileLoading()) {
      preloadTimer = window.setTimeout(warmNext, 250);
      return;
    }
    const url = getWarmupUrls().find((candidate) => !warmedUrls.has(candidate));
    if (!url) return;

    preloadInFlight = true;
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    const settle = () => {
      warmedUrls.add(url);
      preloadInFlight = false;
      warmNext();
    };
    image.addEventListener("load", settle, { once: true });
    image.addEventListener("error", settle, { once: true });
    // Use Image to share the panorama renderer's image cache partition.
    image.src = url;
  }

  document.addEventListener("visibilitychange", warmNext);

  return {
    readConfig(xml) {
      config = new DOMParser().parseFromString(xml, "text/xml");
      player.readConfigXml(config);
    },
    setInteractionEnabled(enabled) {
      interactionEnabled = enabled;
      document.documentElement.dataset.tourInteractive = String(enabled);
      for (const button of document.querySelectorAll(".tour-hotspot")) {
        button.disabled = !enabled;
      }
      warmNext();
    },
    setPreloadEnabled(enabled) {
      preloadEnabled = enabled;
      warmNext();
    },
  };
}
