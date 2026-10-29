# Reference assets and media

`public/assets/{images,models,textures,sounds,fonts}` is reserved for local
assets for the Gazzar-derived experience and user-directed rebranding. The
active hero portrait is now the user-supplied image, converted to lossless WebP;
the original portrait remains as reference evidence. The original logo, favicon,
Questrial, and Cairo fonts are local. Their provenance is in
[reference-assets.md](reference-assets.md). The home additionally uses the
original folded glasses, sculpture model/texture, LTC tables, scene fonts,
fallback poster, ambient audio and localized whisper stems. Home work marks are
local SVG drawings. Media for the remaining routes is outside the home pass.

Record a local asset's source, role, dimensions, format, and version when adding
it. Preserve the reference's crop, typography, material, and composition. Keep
font license files alongside self-hosted fonts. Avoid runtime hotlinking for
critical visual assets.

`public/assets/projects/lab/` holds the nine user-requested Carter Ogunsola Lab
reference posters and muted preview reels. The complete original URLs and
controller fingerprint are retained in the local `projects-grid-20261029`
evidence; the card data links the original experiments and the page visibly
attributes their author. These previews are not Bouthouri-authored portfolio
claims. Images are local JPEG posters; reels remain their original MP4s, loaded
only after intent. No source header, theme, presence service or analytics is used.

`ResponsiveImage` is a server-compatible Next Image wrapper with mandatory
alt text, an explicit `sizes` string, and an aspect-ratio reservation. Use
Next 16's `preload` only for a genuine LCP image; below-fold images remain lazy.
Image-sequence frames may use browser image caches directly instead of sending
every frame through the optimizer. Observe an unclipped wrapper before a reveal.

`loadGLTF(url)` dynamically imports Three's loader, caches in-flight/successful
model promises, and removes failed entries so later calls can retry. Clone
cached scenes before changing them. Cache eviction and GPU resource disposal
are different operations; the mounting scene owns renderer/material/texture
cleanup. Three r180 matches the revision observed in Gazzar's runtime.

`useSceneActivation`, `useSceneBootSlot`, and `viewportDistance` are reusable
loading tools. Mount near the viewport, activate on screen, pause when hidden,
and bound render resolution. A model's readiness does not prove that every
shader/texture upload is warm; inspect first-use and repeat behavior separately.
