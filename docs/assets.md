# Reference assets and media

`public/assets/{images,models,textures,sounds,fonts}` is reserved for local
assets needed by the identical Gazzar clone. The original portrait, logo, favicon,
Questrial, and Cairo fonts are local. Their provenance is in
[reference-assets.md](reference-assets.md). Models, textures, project media, and
sound still need to be acquired and wired as their sections are implemented.

Record a local asset's source, role, dimensions, format, and version when adding
it. Preserve the reference's crop, typography, material, and composition. Keep
font license files alongside self-hosted fonts. Avoid runtime hotlinking for
critical visual assets.

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
