# Deferred material audio

No AudioContext, ambient media or whisper fetch starts before explicit sound
intent. Preference is `portfolio-audio-preference-v2` (`sound`/`quiet`), separate
from reduced reading and marquee pause. Header/menu controls synchronize through
Storio `soundEnabled`, `audioState`, and `audioPreference`. Saved sound can resume
after restored entry; autoplay denial becomes awaiting-user-gesture and a later
trusted activation retries. Lifecycle teardown aborts fetches, disposes sources /
nodes/context and removes unlock/visibility listeners.

Ambient is original `/assets/sounds/ambient-loop.mp3`; master ramps to .38 in
2.5s and to zero in 1.5s when muted. UI hover/click sine impulses and filtered
noise layers for portrait motion / footer friction are native Web Audio.

`attachSectionWhispers(stage, locale)` listens on `#top` for the parent's
`journey-frame {time,openingTime,progress}`. Opening must finish at26 before
any chapter voice. Chapter boundaries are source 28/73/124/241/282/445/541/639/
663; logo and projects have no whisper. Seven EN/AR stems are deduped and
sequentially prepared only while sound is enabled. No React progress updates.

A changed chapter waits180ms; global cooldown650ms and per-stem cooldown1800ms
prevent scroll jitter replay. Availability/locale/audio transitions reset the
baseline, rather than narrating a new current chapter immediately. Reverse
scroll cancels the closing voice; forward entry into footer allows its tail.
Menu, hidden document, blur, disable and teardown stop voice. Whisper gain is
`.44 * 10^(gainDb/20)` with18ms attack /75ms release and slight music duck.

| Stem | EN gain dB | AR gain dB |
| --- | ---: | ---: |
| perspective | -1.72 | -8.46 |
| look-closer | 5.39 | -9.76 |
| beyond | 17.71 | -5.10 |
| put-to-work | 9.20 | -5.52 |
| clarity | 14.48 | -9.74 |
| set-free | 10.04 | -7.95 |
| space-for-what-comes-next | 7.27 | -7.21 |

Downloaded originals are in `public/assets/sounds/sections/`. Source intent and
state flow are implemented. Audible balance and autoplay recovery still need
listening/denial QA. Pass2 adds the original long-lived sine layers: 57Hz motion bed, 72Hz impulse
and 900Hz UI hover, all initially silent behind the opt-in master. Motion sources
expire 140ms after their last update; max intensity drives noise at
`.024*level^1.35` (rise tau .045 / decay .11) and 57Hz at `.005*level` (tau .1).
Portrait impulse sweeps 72→43Hz over .17s with source .035 gain envelope.
UI hover/click reuse the original oscillators and timing, rather than creating
oscillators per event. Footer friction has an independent 140ms expiry, 310Hz
bandpass plus 440*speed, source .009 gain and stereo pan. Noise loop gets the
source 512-sample seam blend. Blur/hidden/mute clear the interaction layers;
all oscillators, timers, nodes and context are stopped/disposed on teardown.

An isolated Web Audio graph probe verified oscillator frequencies 57/72/900,
57Hz target gain .004 for motion intensity .8, impulse 72→43/.17s, and clear-to-zero.
The parent verified trusted SOUND entry reaches playing, trusted mute reaches
muted, and trusted COPY completes its clipboard promise. These control/graph
checks do not establish audible balance or subjective listening parity.
