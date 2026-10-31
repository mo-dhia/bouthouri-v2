# Website media

Previews of websites designed and built by Med D. Bouthouri, listed in the previous portfolio's projects section. They were captured from the live sites on 2026-10-29. The previous portfolio's device mockups are not reused.

| Local stem | Live site | Poster | Reel |
| --- | --- | --- | --- |
| `vibrand` | [vibrand.vercel.app](https://vibrand.vercel.app/) | JPEG 960×720 | h264, 960×720, 8.200s |
| `vstore` | [v-stores.vercel.app](https://v-stores.vercel.app/) | JPEG 960×720 | h264, 960×720, 8.233s |
| `afrah` | [afrah-events.vercel.app](https://afrah-events.vercel.app/) | JPEG 960×720 | h264, 960×720, 7.667s |
| `xsustain` | [xsustain.vercel.app](https://xsustain.vercel.app/) | JPEG 960×720 | h264, 960×720, 8.133s |
| `cci` | [cci-demo.vercel.app](https://cci-demo.vercel.app/) | JPEG 960×720 | h264, 960×720, 8.067s |
| `bored-kiwi` | [bored-kiwi.vercel.app](https://bored-kiwi.vercel.app/) | JPEG 960×720 | h264, 960×720, 8.233s |
| `vawzen` | [vawzen.org](https://vawzen.org/) | JPEG 960×720 | h264, 960×720, 8.233s |
| `old-portfolio` | [old.bouthouri.co](https://old.bouthouri.co/) | JPEG 960×720 | h264, 960×720, 9.233s |
| `artefact` | [artefactstudio.org](https://artefactstudio.org/) | JPEG 960×720 | h264, 960×720, 9.033s |
| `batiprix` | [batiprix.com](https://www.batiprix.com/) | JPEG 960×720 | h264, 960×720, 8.200s |
| `the-forecasting-machine` | [theforecastingmachine.com](https://www.theforecastingmachine.com/) | JPEG 960×720 | h264, 960×720, 8.200s |

The previous portfolio linked ViBrand at vibrand.space, which no longer resolves; the Vercel deployment is used instead.

The previous portfolio itself was added on 2026-10-30. It is labeled and linked as old.bouthouri.co, where it is planned to move once this site takes bouthouri.co. It was recorded from www.bouthouri.co/en/ in the dark color scheme, because old.bouthouri.co did not serve it yet.

Artefact Studio was added on 2026-10-30. The site draws its own scrollbar as a DOM overlay (`scrollable-container-module__*__scrollbarTrack`, `…Thumb`, `…Handle`). A style injected before the settle hid it, so it does not double the dashed track.

Batiprix and The Forecasting Machine were added on 2026-10-31 as case study cards; Artefact Studio and Vawzen now also link to their case pages. Both were captured with Playwright's headless Chromium 1248 rather than Chrome for Testing 155, with the same viewport, settle, timing and composition. Batiprix's HubSpot chat (`#hubspot-messages-iframe-container`) was hidden, like the Artefact scrollbar overlay. The Forecasting Machine was recorded from www.theforecastingmachine.com. Their labels are 10 and 11, after Artefact Studio's 09.

## Capture

- Headless Chrome for Testing 155 at 1440×900, DPR 1, no reduced motion, scrollbars hidden.
- A warm visit first scrolls the page to load lazy assets into the HTTP cache. A fresh visit then settles for 4.5s, or longer so that a loader finishes: 8s for the previous portfolio, 10s for Artefact Studio.
- A CDP screencast (JPEG q94) records 0.9s still, an eased wheel scroll over 6s (7s for the previous portfolio and Artefact Studio), and a 0.7s tail.
- Scroll distances, in CSS pixels: ViBrand 3000, Bored Kiwi 1300, CCI 2400, the previous portfolio 4200, Artefact Studio 3600, the others 2700 (including Batiprix and The Forecasting Machine).

## Composition

- Each frame is placed in a 704×440 rounded hairline frame at (128, 140) on a 960×720 rgb(5,5,5) ground.
- The domain sits above the frame, with the site kind and an index below it. Measured against the posters, these labels are a Helvetica-metric sans, not Questrial: the domain at about 15.5px, the kind and index at 11px with 1.5px tracking. The 2026-10-31 cards match them in Arimo with a 0.25px stroke.
- A dashed track runs beside the frame. Its thumb follows the recorded scroll as a share of the page height.
- Reels are 30fps. Each picks the latest screencast frame at every tick and crossfades over 0.6s back to its first frame, so it loops cleanly.
- Encoding: libx264 high, yuv420p, faststart, no audio, CRF 23 (Vawzen 26, the previous portfolio 25).
- The poster is the reel's first frame as JPEG q86, because the grid starts each reel at zero under its poster.
- The ground is already inked, so these media take no tonal filter.

`SHA256SUMS` lists the checksums for every file here.
