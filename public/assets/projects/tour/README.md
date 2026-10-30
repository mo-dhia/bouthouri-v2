# Artefact Studio 360° Tour

Source: the user's Artefact Studio project, `artifact/public/vr/03-Home/Output`,
used by its landing section `src/components/landing/sections/4-vr` and shared
`src/components/ui/virtual-tour`. Imported on 2026-10-30. The café has three
connected panoramic viewpoints. The generated Pano2VR distribution, skin and
WebXR libraries retain their source content and notices. Panoramic tile content
and resolution are preserved, with the JPEG encoding optimization described below.

Local integration changes:

- `viewer/index.html`: descriptive title, correct preview path, relative branding
  stylesheet and watermark paths, so this directory can be served independently.
- `viewer/artefact-lockup.svg`: the existing Artefact brand asset, unchanged.
- `viewer/tour-branding.css`: relative watermark reference and host-width-scaled
  control/brand dimensions. Generated skin and player code remain unchanged.
- `viewer/tour-navigation.js`: expose the existing factory on `window` for the
  standalone page; preserve original localized hotspot and preload behavior.
- `viewer/tour-navigation.css`: marker artwork scales with the host composition;
  projected positions still belong to Pano2VR.


## Tile encoding

The 2026-10-30 loading review reproduced a 45-second timeout in both locales at
1.6 Mb/s, 150 ms latency, 4× CPU and mobile DPR 3. The 381 JPEG tiles were
re-encoded from the pristine Artefact source using MozJPEG quality 82 and 4:2:0
chroma sampling. No dimensions, cube faces, tile coordinates or panorama framing
changed. Total tile bytes decreased from 50,080,774 to 15,198,525 (69.7%). This is
lossy JPEG compression, not a lossless byte optimization.

Reproduce from the original source, not already-compressed output:

```sh
bun scripts/optimize-tour-tiles.ts /path/to/artifact/public/vr/03-Home/Output/tiles
```

Cold browser tests at the same throttling with normal motion now reached the
live tour in 14.046 s (EN) and 10.298 s (AR) against the local production build.
Reduced-motion runs took 10.204 s and 9.573 s respectively. These measurements are
specific to that test setup; public deployment checks are recorded in the review.

`cafe.jpg` is a 1440×900 screenshot of the real viewer at pan/tilt 0/0 and FOV 70,
with controls and hotspots hidden during capture. It is the useful page poster.
`360-tour.jpg` is the 960×720 grid composition: the original rendered tour framed
on the same ink ground as the other projects. `360-tour.mp4` turns the original
panorama from 0° to −55° and back, an approximately 16-second seamless muted
H.264 preview (15 fps, CRF 24, yuv420p, faststart). Its decoder is shared with the
existing intent-owned grid previews. No iframe or tile is loaded by the grid.

`SHA256SUMS` covers the viewer snapshot and these three media assets. The heavy
distribution is fetched only after the visitor enters the tour; the initial
page contains its poster, copy and links. This copy does not modify the Artefact
source checkout.
