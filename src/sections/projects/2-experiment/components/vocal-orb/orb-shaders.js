/** Source ray-marching/compositing math; source: Carter Ogunsola Lab /vocal-orb. */
export const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
export const FINISH_FN = `
vec3 finish(vec3 col, vec2 frag) {
  col = 1.0 - exp(-col * 1.1);
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  // interleaved gradient noise: an even, grain-free dither
  col += (fract(52.9829189 * fract(dot(frag, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  return uBg + col * (1.0 - uBg);
}`;
export const SCENE = (direct) => `#version 300 es
precision highp float;
${direct ? "#define DIRECT" : ""}
uniform vec2 uRes;
uniform float uTime;
uniform float uSize;
uniform float uShift; // the scene's centre, moved up from the stage's (device px)
uniform float uEnergy;
uniform float uSpread;
uniform float uFlare;
uniform float uLive;  // 0 asleep → 1 listening (sprung: it surges past 1 waking)
uniform float uDorm;  // how dormant, 0..1: asleep × Rest (dim, grey, calm, drawn in)
uniform float uVoice; // loudness, 0..1, normalised to the room
uniform vec3 uBands;  // low / mid / high, 0..1
uniform vec3 uMood;   // the felt colour (see MOODS)
uniform float uMoodAmt;    // how strongly it's felt, 0..1
uniform float uMoodEnergy; // calmer (<0) or livelier (>0)
uniform float uView;
uniform int uHeart; // 0 glass orb, 1 silver orb, 2 the void
uniform float uGlass; // the orb's face, 0 silver → 1 glass (eased: it turns as it wakes)
uniform vec2 uTilt; // the hand's parallax: the camera raised (degrees) and turned (radians)
uniform vec3 uBg;
out vec4 outColor;


const int STEPS = 420;
const float R_IN = 2.6;   // the disk's inner edge (just inside the last stable orbit)
const float R_OUT = 11.0; // where it has thinned to nothing
const float B_CRIT = 2.598; // the shadow's radius as seen from far away (3√3/2)


// ── value noise + fbm (the disk's streaks) ──
float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x),
                 mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x),
                 mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm2(vec3 p) {
  return (vnoise(p) * 0.5 + vnoise(p * 2.03 + vec3(1.7, 9.2, 3.1)) * 0.25) / 0.75;
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s / 0.9375;
}


// The disk is SOLID GLASS, not smoke: one wide body and a few outer bands,
// each a smooth slab with crisp edges. Their boundaries wander slowly with
// angle and time (a low-frequency wobble, sheared by the orbit), so the ring
// lives without dissolving into noise.
float band(float r, float a, float b, float e) {
  return smoothstep(a, a + e, r) * (1.0 - smoothstep(b - e, b, r));
}


// Coverage of the disk at radius r, and where across its band the point
// sits (0 at an edge, 1 mid-band) for the glass sheen. Every band edge rides
// its own share of two slow wobble fields (w1, w2 in 0..1), so the bands
// swell, pinch and nearly merge. The outer bands are STREAMS: each covers
// only part of the circle (m, a per-stream mask over angle), so it begins,
// swells, thins into a tail and ends, and the orbit carries it round. That
// is what makes the silhouette pour instead of holding a lens shape.
vec2 slabs(float r, float w1, float w2, float ripple, vec4 m, float E) {
  float u = w1 - 0.5;
  float v = w2 - 0.5;
  float e0 = 4.35 + v * 1.3 + ripple;
  float a1 = 4.55 + v * 0.7 + u * 0.4 + ripple * 0.8, b1 = 5.35 + u * 1.2;
  float a2 = 5.5 + u * 0.9,                          b2 = 6.2 + v * 1.2 + u * 0.3;
  float a3 = 6.35 + v * 0.8,                         b3 = 7.4 - u * 1.1;
  float a4 = 7.6 - v * 0.7,                          b4 = 8.3 + u * 0.8;
  // a stream thins toward its tails, not just fades
  b1 = a1 + max(b1 - a1, 0.12) * m.x; b2 = a2 + max(b2 - a2, 0.1) * m.y;
  b3 = a3 + max(b3 - a3, 0.15) * m.z; b4 = a4 + max(b4 - a4, 0.08) * m.w;
  float cov = band(r, R_IN, e0, E) + band(r, a1, b1, E) * 0.95 * m.x + band(r, a2, b2, E) * 0.85 * m.y
            + band(r, a3, b3, E) * 0.7 * m.z + band(r, a4, b4, E) * 0.5 * m.w;
  float s = 0.0;
  if (r < e0) s = (r - R_IN) / (e0 - R_IN);
  else if (r < b1) s = (r - a1) / max(b1 - a1, 1e-3);
  else if (r < b2) s = (r - a2) / max(b2 - a2, 1e-3);
  else if (r < b3) s = (r - a3) / max(b3 - a3, 1e-3);
  else s = (r - a4) / max(b4 - a4, 1e-3);
  return vec2(cov, 1.0 - abs(2.0 * clamp(s, 0.0, 1.0) - 1.0));
}


// ── THE MATERIAL: dispersive glass light ──
// Any object can wear it: hand it a coverage function sampled at a few
// offsets ACROSS an edge (here: radius), and it returns the light. Six
// wavelengths, each seeing the geometry a hair displaced and carrying its own
// spectral colour, sum back to white where coverage is solid, and fan out into
// a continuous spectrum (warm orange and yellow one side, cyan and blue the
// other) wherever an edge or a thread sits. RGB-only splitting can't do that:
// it fringes in three primaries.
const int TAPS = 6;
vec3 spectral(float x) {
  // x 0..1 → red … violet, a smooth ramp
  return clamp(vec3(
    1.4 - abs(x - 0.08) * 3.6,
    1.25 - abs(x - 0.42) * 3.4,
    1.4 - abs(x - 0.86) * 3.6), 0.0, 1.0);
}


// The threads' own colours: the reference's loop (orange, yellow, cyan, blue,
// magenta, back to orange). Green barely appears in it, so it barely appears
// here; the full spectrum is kept for the edge split above.
vec3 loopColour(float x) {
  x = fract(x) * 5.0;
  vec3 c0 = vec3(1.0, 0.42, 0.08), c1 = vec3(1.0, 0.86, 0.22), c2 = vec3(0.2, 0.86, 1.0),
       c3 = vec3(0.28, 0.36, 1.0), c4 = vec3(1.0, 0.28, 0.74);
  if (x < 1.0) return mix(c0, c1, x);
  if (x < 2.0) return mix(c1, c2, x - 1.0);
  if (x < 3.0) return mix(c2, c3, x - 2.0);
  if (x < 4.0) return mix(c3, c4, x - 3.0);
  return mix(c4, c0, x - 4.0);
}


// Blend two noise samples by weights that sum to 1 WITHOUT losing contrast
// (a plain mix of two unrelated noises flattens toward grey mid-fade).
float vpMix(float a, float b, float wa) {
  float wb = 1.0 - wa;
  return 0.5 + ((a - 0.5) * wa + (b - 0.5) * wb) / sqrt(wa * wa + wb * wb);
}


// Fine threads inside the bands, drawn along the flow: high frequency across
// the radius, low around the orbit, warped by the same wobble so they pour
// with the streams. Crisp (smoothstep), so every thread is an edge to split.
// Sampled in both flow phases (ringA / ringB, weight wa). Where a pixel
// covers more disk than a thread is wide (fp, the footprint), the detail
// fades to its average instead of aliasing.
// COST. This runs per wavelength per disk crossing, the hottest code in the
// experiment (with it, frames alternated 16/33ms; without it, a flat 60), so
// the noise is only computed where it can be seen: the coarse layer (which
// carries the rainbow fringe) per wavelength, the fine layer once per
// crossing (kFine, passed in), and neither where the footprint has faded it.
float threads(float r, vec2 ringA, vec2 ringB, float wa, float w1, float fp, float kFine) {
  float coarse = 1.0 - smoothstep(0.05, 0.14, fp);
  float n = 0.5;
  if (coarse > 0.0) {
    float zn = r * 9.0 + (w1 - 0.5) * 5.0;
    n = vpMix(vnoise(vec3(ringA * 1.4, zn)), vnoise(vec3(ringB * 1.4, zn)), wa);
  }
  float f = mix(0.5, n, coarse) * 0.7 + kFine * 0.3;
  float soft = 0.12 + fp * 2.0;
  return 0.45 + 0.55 * smoothstep(0.5 - soft, 0.5 + soft, f);
}


// The disk's slow shape fields at orbital angle a: two wobbles, the liquid
// ripple, and where round the circle each stream exists.
struct Shape { float w1; float w2; float ripple; vec4 m; };
Shape shapeAt(float a, float r, float t) {
  vec2 ring = vec2(cos(a), sin(a));
  Shape sh;
  // slow, broad wobbles: two octaves carry them (four cost double, unseen)
  sh.w1 = fbm2(vec3(ring * 1.1, r * 0.35 + t * 0.16));
  sh.w2 = fbm2(vec3(ring * 2.3 + 7.0, t * 0.22));
  sh.ripple = 0.22 * sin(a * 3.0 + t * 0.9) + 0.12 * sin(a * 5.0 - t * 1.3);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    sh.m[i] = vnoise(vec3(ring * 1.6 + fi * 3.7, t * (0.12 + 0.04 * fi) + fi));
  }
  return sh;
}


// The light a ray picks up crossing the disk plane at p, travelling along v;
// fp is how much disk (in radius) one pixel covers there.
//
// THE FLOW. Inner rings orbit faster than outer ones (Keplerian, ω ∝ r^−1.5),
// which is what shears the streams. Left to run, that shear winds the pattern
// tighter forever: after minutes it is finer than a pixel and the disk turns
// to moiré. So the orbit is split: a rigid turn that runs forever, plus the
// shear, which runs in two copies half a period apart. Each copy resets every
// FLOW_P seconds, but only while its weight is zero, so the eye only ever sees
// a flow that keeps pouring (the flow-map crossfade).
const float OMEGA_REF = 0.33; // the rigid turn: the orbit near mid-disk
const float FLOW_P = 10.0;
vec4 disk(vec3 p, vec3 v, float t, float fp) {
  // awake, it pours harder; spoken to, harder still
  float en = uEnergy * (1.0 + 0.35 * uLive + 0.6 * uVoice) * (1.0 + 0.45 * uMoodEnergy * uMoodAmt) * (1.0 - 0.6 * uDorm);
  float r = length(p.xz);
  if (r < R_IN - 0.3 || r > R_OUT) return vec4(0.0);
  float phi = atan(p.z, p.x);
  float rigid = phi + mod(t * OMEGA_REF, 6.28318);
  float shear = 3.2 * pow(r, -1.5) - OMEGA_REF;
  float tA = mod(t, FLOW_P);
  float tB = mod(t + 0.5 * FLOW_P, FLOW_P);
  float wa = 1.0 - abs(2.0 * tA / FLOW_P - 1.0);
  wa = wa * wa * (3.0 - 2.0 * wa);
  float aA = rigid + shear * tA;
  float aB = rigid + shear * tB;
  Shape A = shapeAt(aA, r, t);
  Shape B = shapeAt(aB, r, t);
  // two slow wobble fields shape the bands (scaled about 0.5 by Energy)
  float w1 = 0.5 + (vpMix(A.w1, B.w1, wa) - 0.5) * en;
  float w2 = 0.5 + (vpMix(A.w2, B.w2, wa) - 0.5) * en;
  // the body's edge ripples like a liquid surface
  float ripple = mix(B.ripple, A.ripple, wa) * en;
  // spoken to, the edge comes alive: the lows deepen the liquid ripple, the
  // mids add a finer, quicker one
  ripple *= 1.0 + 1.8 * uBands.x;
  ripple += 0.14 * uBands.y * sin(rigid * 8.0 - t * 5.0) * smoothstep(R_IN + 0.8, R_IN + 2.0, r);
  // where round the circle each stream exists (soft ends = tails)
  vec4 m;
  for (int i = 0; i < 4; i++) m[i] = smoothstep(0.32, 0.62, vpMix(A.m[i], B.m[i], wa));
  vec2 ringA = vec2(cos(aA), sin(aA));
  vec2 ringB = vec2(cos(aB), sin(aB));


  // edges: crisp, but never thinner than the pixel that draws them
  float E = max(0.04, fp * 1.3);


  // THE VOICE IN THE SHAPE. Loudness swells the whole disk outward (sampling
  // a smaller radius), and rings travel out from the centre through the band
  // edges, so each syllable visibly pushes through it.
  // (dormant, it draws in a little; waking, it breathes back out)
  float swell = (1.0 + 0.1 * uVoice) * (1.0 - 0.06 * uDorm);
  float rings = uVoice * 0.22 * sin(r * 2.6 - t * 7.0) * smoothstep(R_IN + 0.3, R_IN + 1.5, r);
  float rv = r / swell + rings;


  // the material: six wavelengths, each sampling the geometry (slabs ×
  // threads) at its own radius; dispersion grows outward, the hot lip stays
  // nearly white
  float sp = 0.26 * uSpread * (0.4 + 0.6 * smoothstep(R_IN, R_IN + 2.5, r)) * (1.0 - 0.6 * uDorm);
  vec3 light = vec3(0.0);
  vec3 norm = vec3(0.0);
  float covMid = 0.0;
  float across = 0.0;
  // the fine thread layer, once for this crossing (faded where too small)
  float fine = 1.0 - smoothstep(0.025, 0.07, fp);
  float kFine = 0.5;
  if (fine > 0.0) {
    float zk = rv * 17.0 - t * 0.1;
    kFine = mix(0.5, vpMix(vnoise(vec3(ringA * 3.1 + 2.0, zk)), vnoise(vec3(ringB * 3.1 + 2.0, zk)), wa), fine);
  }
  for (int k = 0; k < TAPS; k++) {
    float x = (float(k) + 0.5) / float(TAPS);
    float rk = rv + (x - 0.5) * sp;
    vec2 sl = slabs(rk, w1, w2, ripple, m, E);
    float c = sl.x * threads(rk, ringA, ringB, wa, w1, fp, kFine);
    vec3 w = spectral(x);
    light += w * c;
    norm += w;
    if (k == TAPS / 2) { covMid = sl.x; across = sl.y; }
  }
  vec3 cov = light / norm;


  // sheen across each band: edges catch more light than the middle, the way
  // a glass rod does
  float sheen = 0.7 + 0.6 * pow(1.0 - across, 3.0);
  // a highlight travelling round the ring, light sliding over a solid
  float glint = pow(max(cos(phi - 2.3 + 0.25 * sin(t * 0.3)), 0.0), 10.0);


  // white-hot inside; outward, each thread carries its own spectral colour
  // (hue steps fast across the radius, drifts slowly along the orbit), the
  // reference's orange-beside-yellow-beside-cyan
  float heat = exp(-(r - R_IN) * 0.5);
  float hue = r * 0.42 + (w1 - 0.5) * 0.8 + 0.15 * sin(rigid + 0.6) - t * 0.03;
  vec3 outer = mix(vec3(1.0, 0.55, 0.2), loopColour(hue), 0.82);
  // a felt mood tints the outer streams (the white-hot core stays white)
  outer = mix(outer, uMood * (0.75 + 0.25 * loopColour(hue)), 0.72 * uMoodAmt);
  // white belongs to the hot inner lip only; the streams keep their colour
  vec3 tint = mix(outer, vec3(1.0, 0.98, 0.95), smoothstep(0.32, 0.8, heat));


  // Doppler beaming: the side orbiting toward the camera burns brighter
  vec3 orbit = normalize(vec3(-sin(phi), 0.0, cos(phi)));
  float beam = pow(clamp(1.0 + 0.22 * dot(orbit, -normalize(v)), 0.4, 2.0), 3.0);


  // (dormant, the white-hot lip cools too: it sits far past white, where
  // dimming the whole only reads after the heat itself comes down)
  float lum = (1.5 + 2.0 * heat * (1.0 - 0.8 * uDorm)) * sheen * (1.0 + 1.5 * glint) * beam;
  vec3 c = tint * cov * lum * uFlare * (1.0 + 0.15 * uLive + 0.25 * uVoice);
  // DORMANT: embers. Dimmed and drained toward a warm grey, so waking has
  // somewhere to come up from
  c = mix(c, vec3(dot(c, vec3(0.3, 0.5, 0.2))) * vec3(1.0, 0.88, 0.76), 0.65 * uDorm) * (1.0 - 0.75 * uDorm);
  // solid: the body occludes what's behind it
  float alpha = clamp(covMid * 1.15, 0.0, 0.97);
  return vec4(c, alpha);
}


// ── THE ORB: a glass sphere at the heart, just outside the horizon ──
// Big enough that light bends round it the way it bends round the shadow
// (seen from far away its outline sits almost exactly on the shadow's edge),
// so the disk still arches over it and passes in front. Gravity decides WHERE
// it sits; its FACE is drawn as a sphere looking straight at you, like the
// references: dark glass above, light below, and between them an S-curve
// that wraps with the sphere's curvature and wears the disk's six-wavelength
// dispersion. (A truly lensed orb arrives glancing and rings white; a
// volumetric surface seen from a few degrees above reads as a band, not a
// line. Both were tried.)
//
// o: the point on the face, unit disc, x right / y up; zz: its depth (1 at
// the centre, 0 at the outline); lw: the line's width in face units.
const float R_ORB = 1.6;
const float ORB_EDGE_B = 2.6128; // its outline: R / sqrt(1 − 1/R), where rays just graze it
// The S-curve at x for strand k (0 = the main curve). Awake it moves more;
// the lows lift it, the mids ripple it.
float orbCurve(float x, float t, float k) {
  // awake, it breathes even in silence (so you can see it's listening)
  float amp = (1.0 + uLive * (0.3 + 0.18 * sin(t * 2.1)) + 0.8 * uBands.x + 0.35 * uVoice) * (1.0 - 0.65 * uDorm);
  float ph = k * 1.7;
  float y = 0.17 * amp * sin(x * 2.3 + t * 0.85 + ph)
          + 0.07 * (1.0 + 1.2 * uBands.y) * sin(x * 4.7 - t * 1.25 - ph * 0.6)
          + 0.025 * uBands.y * sin(x * 9.0 - t * 4.0 + ph * 2.0);
  return (y * (1.0 - 0.28 * k) + 0.12) * sqrt(max(1.0 - x * x * 0.55, 0.0));
}


vec3 orbShade(vec2 o, float zz, float t, float glass, float lw) {
  // the curve, following the sphere's curvature toward the outline
  float yw = orbCurve(o.x, t, 0.0);
  float d = o.y - yw;
  float fill = smoothstep(lw, -lw, d);
  // the dark glass: truly dark (0.004 linear reads ~30/255 after gamma)
  vec3 col = vec3(0.0004, 0.0004, 0.0007);
  // glass: coloured light pooled just under the curve, dying into the dark
  // glass (the Siri redesign): magenta → blue → cyan across the face
  vec3 tint = loopColour(0.5 + o.x * 0.3 + 0.08 * sin(t * 0.3));
  tint = mix(tint, uMood, 0.7 * uMoodAmt);
  vec3 glassC = tint * fill * (exp(d * (4.0 - 1.2 * uVoice)) * (0.9 + 0.5 * uLive + 0.9 * uVoice) + 0.04);
  // silver: liquid metal, brighter toward the bottom where it catches the
  // light (the macOS 27 orb)
  vec3 silverC = mix(vec3(0.72, 0.75, 0.82), uMood * 0.85, 0.45 * uMoodAmt) * fill * (0.16 + 0.34 * smoothstep(0.2, -0.95, o.y));
  // one turns into the other by POURING: the glass spreads from the middle
  // of the curve outward (and drains back the same way), a soft front
  // travelling across the face, never the whole face cross-fading at once
  float far = length(vec2(o.x, d * 1.6));
  // (the last tenth sweeps the front past the whole face: a curve lifted
  // by a loud voice reaches further than the resting one, and must not keep
  // a silver crescent at the bottom of a glass orb)
  float front = mix(-0.1, 2.6, glass) + 2.0 * smoothstep(0.9, 1.0, glass);
  col += mix(silverC, glassC, 1.0 - smoothstep(front - 0.35, front, far)) * (1.0 - 0.65 * uDorm);
  // the limb: a sphere darkens toward its outline
  col *= 0.35 + 0.65 * zz;


  // the curve itself: six wavelengths, each a hair higher or lower
  vec3 line = vec3(0.0);
  vec3 lnorm = vec3(0.0);
  for (int k = 0; k < TAPS; k++) {
    float x = (float(k) + 0.5) / float(TAPS);
    float dk = d + (x - 0.5) * 0.04 * uSpread * (1.0 + 1.5 * uBands.z);
    vec3 w = spectral(x);
    line += w * exp(-dk * dk / (lw * lw));
    lnorm += w;
  }
  col += (line / lnorm * (2.2 + 0.8 * uLive + 1.6 * uBands.z + 1.0 * uVoice) + exp(-d * d / 0.003) * (0.12 + 0.12 * uLive + 0.25 * uVoice)) * (1.0 - 0.6 * uDorm);


  // while you speak, fainter strands of the curve fan out round the main one,
  // each in its own colour (Siri's waves splitting)
  for (int s = 1; s <= 2; s++) {
    float ks = float(s);
    float ds = o.y - orbCurve(o.x, t, ks);
    float wk = lw * 1.4;
    vec3 sc = loopColour(0.45 + 0.22 * ks + o.x * 0.15);
    col += sc * exp(-ds * ds / (wk * wk)) * uVoice * (1.1 / ks) * zz;
  }


  // the glass: a rim lit warm by the disk all round it, a soft key above
  // (wide and low: a luminous falloff into the edge, not a drawn rim)
  float fres = pow(1.0 - zz, 2.5);
  col += fres * vec3(1.0, 0.86, 0.7) * (0.04 + 0.14 * smoothstep(0.4, -0.5, o.y));
  vec2 key = o - vec2(-0.32, 0.5);
  // (faint and tight: gamma lifts tiny linear values, and a broad 0.05 key
  // read as a grey dome over the dark glass)
  col += exp(-dot(key, key) * 14.0) * vec3(0.9, 0.93, 1.0) * 0.012;
  return col * uFlare;
}


${direct ? FINISH_FN : ""}


void main() {
  vec2 frag = gl_FragCoord.xy;
  float sh = min(uRes.x, uRes.y);
  vec2 uv = (frag - 0.5 * uRes - vec2(0.0, uShift)) / sh;
  float t = uTime;


  // camera: on a circle level with the disk, raised uView degrees (the hand
  // raises and turns it a little: uTilt), looking at the hole; the lens is
  // set so the shadow spans uSize of the short side
  float D = 26.0;
  float el = radians(max(uView + uTilt.x, 1.0));
  vec3 ro = vec3(sin(uTilt.y) * cos(el), sin(el), cos(uTilt.y) * cos(el)) * D;
  vec3 fw = normalize(-ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  float k = (B_CRIT / D) / (uSize * 0.5);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * k);
  // one pixel's angular size: with distance travelled, the footprint
  float pa = k / sh;


  // ── step the photon through the hole's gravity
  vec3 pos = ro;
  vec3 vel = rd;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  // light that has already wrapped round the hole once (the under-arc, the
  // ring hugging the shadow) is real but should whisper, not compete
  float pass_ = 1.0;
  float swallowed = 0.0;
  float travelled = 0.0;
  // the orb: rays carry on through it, so its edge can fade into the disk
  // wrapping behind; what lay in FRONT of it is kept apart
  float reached = 0.0;
  vec3 colFront = vec3(0.0);
  float alphaFront = 0.0;
  for (int i = 0; i < STEPS; i++) {
    float r2 = dot(pos, pos);
    if (r2 < 1.0) { swallowed = 1.0; break; } // fell in (alpha stays = the disk in front)
    // "behind" begins once the ray passes close to the orb, touching it or not
    // (rays that just miss it skim the photon sphere and gather speckle)
    if (uHeart < 2 && reached < 0.5 && r2 < (R_ORB + 0.2) * (R_ORB + 0.2)) {
      reached = 1.0;
      colFront = col;
      alphaFront = alpha;
      // aimed inside the edge (+ the fade's margin), nothing behind will show
      // (see "behind" below): stop here and save the steps
      if (sqrt(h2) < ORB_EDGE_B + 0.03) break;
    }
    float r = sqrt(r2);
    // small steps near the hole (finest where light orbits it, so the thin
    // ring hugging the shadow stays clean), long strides far out
    float dt = clamp(mix(0.022, 0.06, smoothstep(2.0, 4.5, r)) * r, 0.02, 1.2);
    travelled += dt;
    vec3 prev = pos;
    vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    pos += vel * dt;
    // the third and later images of the disk are thinner than a pixel: sampled,
    // they speckle. Past the second pass, the photon ring below stands in
    if (prev.y * pos.y < 0.0 && pass_ > 0.2) {
      vec3 cross_ = mix(prev, pos, prev.y / (prev.y - pos.y));
      // a pixel's footprint on the disk: wider with distance, much wider at
      // a grazing angle (the disk is seen nearly edge-on)
      float fp = pa * travelled / max(abs(normalize(vel).y), 0.03);
      // lensing squeezes the second image (the under-arc, the far side's wrap)
      // far below the pixel: draw it blurred, never sampled sharp
      // (and past the point where the thread noise switches off: it's cheap)
      if (pass_ < 1.0) fp += 0.16;
      vec4 d = disk(cross_, vel, t, fp);
      // the disk's underside (rays curling up under the hole: the under-arc)
      // glows faintly; its top surface carries the light
      float side = vel.y > 0.0 ? 0.22 : 1.0;
      col += (1.0 - alpha) * d.rgb * pass_ * side;
      alpha += (1.0 - alpha) * d.a * pass_ * side;
      pass_ *= 0.3;
      if (alpha > 0.99) break;
    } else if (prev.y * pos.y < 0.0) {
      pass_ *= 0.3;
    }
    // escaped: heading out past the disk's edge, a ray never turns back (in
    // this gravity an outgoing ray outside the photon sphere climbs forever)
    // and any plane it crosses out here holds no disk. Exact, and it spares
    // every background pixel the long climb it used to make to r = 40
    if (r2 > (R_OUT + 0.5) * (R_OUT + 0.5) && dot(pos, vel) > 0.0) break;
  }


  // The shadow, its edge and the photon ring all come from the IMPACT
  // PARAMETER b: how far off-centre the ray was aimed. It's set by the pixel
  // alone and varies smoothly across the screen, and Schwarzschild is exact
  // about it: aimed inside 3√3/2, the ray falls in. Anything measured along
  // the ray (closest approach, step count) flips within a sliver thinner than
  // a pixel there, and speckles.
  float b = sqrt(h2);
  float px = pa * D; // one pixel, in impact-parameter units
  float edgeB = B_CRIT;
  if (uHeart < 2) {
    // the orb: its outline is where rays just graze r = R_ORB
    edgeB = ORB_EDGE_B;
  }
  float inside = 1.0 - smoothstep(edgeB - px, edgeB + px, b);
  if (uHeart < 2) {
    if (reached < 0.5) { colFront = col; alphaFront = alpha; }
    // a soft edge: the orb fades over the outer ~6% of its radius, into
    // whatever lies behind it (the lensed disk), never cut on one pixel
    inside = 1.0 - smoothstep(edgeB - 0.16, edgeB + px, b);
    // only light from OUTSIDE the critical radius shows through the fade: inside
    // it, rays circle the hole before falling in and their disk light is
    // sub-pixel speckle
    vec3 behind = (col - colFront) * smoothstep(edgeB + 0.03, edgeB + 0.14, b);
    col = colFront + (1.0 - inside) * behind;
    if (inside > 0.0) {
      // Gravity decides WHERE the orb sits (its outline, what passes in front
      // of it), but its face is shaded as a plain sphere looking at you. Rays
      // that truly reach it arrive glancing (it sits just outside the photon
      // sphere, where light bends hardest), and a glancing orb rings white
      // all over; the references are calm, front-on spheres.
      float rUv = edgeB / (D * k); // the orb's radius on screen, in uv
      vec2 o = uv / rUv;
      float zz = sqrt(max(1.0 - dot(o, o), 0.0));
      float lw = max(0.012, 1.2 / (rUv * sh)); // never thinner than a pixel
      col += (1.0 - alphaFront) * orbShade(o, zz, t, uGlass, lw) * inside;
    }
  } else {
    // behind whatever disk lies in front, the shadow is black
    col *= 1.0 - inside * (1.0 - alpha);
  }
  // the photon ring: one clean hairline hugging the void (an orb has a soft
  // edge instead; a hairline round it read as an ink outline)
  if (uHeart == 2) {
    float pr = (b - edgeB - 1.5 * px) / max(px * 1.2, 0.004);
    col += vec3(1.0, 0.93, 0.85) * 0.55 * exp(-pr * pr) * (1.0 - alpha) * uFlare;
  }


#ifdef DIRECT
  outColor = vec4(finish(col, frag), 1.0);
#else
  // alpha marks the void, so the finish keeps the bloom out of it (the mask
  // fades across the edge with b, never stepping pixel by pixel). An orb
  // shines, so it takes the bloom.
  // (an orb's dark glass mostly keeps the disk's bloom off it too)
  float hole = uHeart < 2 ? inside * (1.0 - alphaFront) * 0.92 : max(inside, smoothstep(B_CRIT + 0.35, B_CRIT, b)) * (1.0 - alpha);
  outColor = vec4(col, hole);
#endif
}`;
export const DOWN = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uKnee; // first pass only: keep just the light past white
in vec2 vUv;
out vec4 outColor;
vec3 tap(vec2 uv) {
  vec3 c = texture(uSrc, uv).rgb;
  if (uKnee > 0.0) {
    float l = max(c.r, max(c.g, c.b));
    c *= smoothstep(uKnee, uKnee * 2.0, l);
  }
  return c;
}
void main() {
  vec2 h = uTexel * 0.5;
  vec3 c = tap(vUv) * 4.0;
  c += tap(vUv - h);
  c += tap(vUv + h);
  c += tap(vUv + vec2(h.x, -h.y));
  c += tap(vUv - vec2(h.x, -h.y));
  outColor = vec4(c / 8.0, 1.0);
}`;
export const UP = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 h = uTexel * 0.5;
  vec3 c = texture(uSrc, vUv + vec2(-h.x * 2.0, 0.0)).rgb;
  c += texture(uSrc, vUv + vec2(-h.x, h.y)).rgb * 2.0;
  c += texture(uSrc, vUv + vec2(0.0, h.y * 2.0)).rgb;
  c += texture(uSrc, vUv + vec2(h.x, h.y)).rgb * 2.0;
  c += texture(uSrc, vUv + vec2(h.x * 2.0, 0.0)).rgb;
  c += texture(uSrc, vUv + vec2(h.x, -h.y)).rgb * 2.0;
  c += texture(uSrc, vUv + vec2(0.0, -h.y * 2.0)).rgb;
  c += texture(uSrc, vUv + vec2(-h.x, -h.y)).rgb * 2.0;
  outColor = vec4(c / 12.0, 1.0);
}`;
export const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomAmt;
uniform float uCA;
uniform vec3 uBg;
in vec2 vUv;
out vec4 outColor;
${FINISH_FN}
void main() {
  // lens fringe: red and blue land a hair apart, more toward the frame's edge
  vec2 ca = (vUv - 0.5) * 0.006 * uCA;
  vec3 scene = vec3(texture(uScene, vUv + ca).r, texture(uScene, vUv).g, texture(uScene, vUv - ca).b);
  // the shadow stays black: bloom doesn't wash into it
  float hole = texture(uScene, vUv).a;
  vec3 col = scene + texture(uBloom, vUv).rgb * 0.11 * uBloomAmt * (1.0 - 0.9 * hole);
  outColor = vec4(finish(col, gl_FragCoord.xy), 1.0);
}`;
export const LEVELS = 6;
export const BG = [10 / 255, 10 / 255, 11 / 255];
