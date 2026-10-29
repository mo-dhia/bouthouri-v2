# Reference asset inventory

Acquired from the public Gazzar reference on 2026-10-27. These are the original
assets, not substitute illustrations. Asset acquisition does not establish that
the reference's choreography has been reproduced.

| Local path | Reference source | Role |
| --- | --- | --- |
| `public/assets/images/hero-portrait.webp` | `https://www.thisisgazzar.com/images/hero-portrait.webp` | Identity portrait, 1536 × 1024 |
| `public/assets/images/identity-logo.svg` | Inline SVG in the identity hero's home link at `https://www.thisisgazzar.com/en` | Original three-piece logo, 280 × 140 viewBox |
| `public/icon.svg` | Generated from `src/components/layout/header/identity-mark.ts` (2026-10-29) | BOUTHOURI assembled B; keeps the original icon's tile, colors and 1/9 corner ratio |
| `public/assets/fonts/questrial-regular.woff2` | `https://www.thisisgazzar.com/_next/static/immutable/media/Questrial_Regular-s.p.3x3y0nhc6wbcr.woff2` | English typography |
| `public/assets/fonts/cairo-variable.woff2` | `https://www.thisisgazzar.com/_next/static/immutable/media/Cairo_Variable-s.p.2nkn5kw540dey.woff2` | Arabic typography |
| `public/assets/images/glasses-fallback.png` | `https://www.thisisgazzar.com/images/glasses-fallback.png` | Original WebGL-failure poster |
| `public/assets/models/glasses-folded.glb` | `https://www.thisisgazzar.com/models/glasses-folded.glb` | Named glasses geometry and materials |
| `public/assets/models/logo-finished-components.glb` | `https://www.thisisgazzar.com/models/logo-finished-components.glb` | Three independent sculptures; embedded titanium texture |
| `public/assets/models/logo-lighting-r180.bin` | `https://www.thisisgazzar.com/models/logo-lighting-r180.bin` | Original LTC area-light tables |
| `public/assets/textures/questrial-studio.woff` | `https://www.thisisgazzar.com/fonts/Questrial-studio.woff` | English Three scene typography |
| `public/assets/textures/cairo-studio.woff` | `https://www.thisisgazzar.com/fonts/Cairo-studio.woff` | Arabic Three scene typography |
| `public/assets/sounds/ambient-loop.mp3` | `https://www.thisisgazzar.com/sounds/ambient-loop.mp3` | Ambient music |
| `public/assets/sounds/sections/{name}-{en\|ar}.mp3` | `https://www.thisisgazzar.com/sounds/sections/{name}-{en\|ar}.mp3` | Seven whispered section stems per language |

Font OFL notices are included beside the fonts, sourced from the Google Fonts
`ofl/questrial/OFL.txt` and `ofl/cairo/OFL.txt` files. The selected language's
font is preloaded from the server layout; both use `font-display: swap`.

The whisper names are `perspective`, `look-closer`, `beyond`, `put-to-work`,
`clarity`, `set-free`, and `space-for-what-comes-next`. Home project visuals are
the original SVG line drawings, rendered from local semantic data; raster case
media belongs to future case routes. The scene-font coverage JSON files are
local generated data used to keep text rendering self-contained.

Three, text rendering, models, lighting and audio remain in deferred controller
graphs. None of the original application bundles are shipped. Detailed model
fingerprints and the measured reference inventory are in
[the reference map](home-reference-map.md).


## User-approved rebranding assets — 2026-10-28

| Local path | User source | Role |
| --- | --- | --- |
| `public/assets/images/hero-portrait-rebrand.webp` | `bouthouri-hero-natural-glasses-refined.png`, supplied from the user's T3 imagegen output directory | Active hero photograph and deferred portrait texture,1536×1024,lossless WebP with alpha |

Source PNG SHA-256: `850fc0bfecc4df353b00d6f72e1a6ca66257fb44e593ceef342a94680703940a`. Visible RGB samples and all alpha samples are
verified unchanged after conversion; only RGB under fully transparent pixels
may be normalized by the encoder. The original Gazzar photograph is retained
but is no longer the active hero image. This replacement changes no crop,
width profile, loading boundary, shader or animation timing.
