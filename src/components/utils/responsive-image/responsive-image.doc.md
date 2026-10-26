# Responsive image

Server-compatible wrapper around `next/image`. Callers provide meaningful `alt`,
accurate `sizes`, and `aspectRatio` so the browser reserves the media geometry
before it decodes. The wrapper renders image markup in the initial document.

Use `preload` only for the measured LCP image. Other images retain Next's default
lazy loading; laziness affects fetching, not whether semantic image markup exists.
The CSS uses `object-fit: cover`; a caller can supply an image class for a measured
reference-specific fit. No client image loader or fade gate is required here.
