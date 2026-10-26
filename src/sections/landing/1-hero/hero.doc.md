# Hero

Server-rendered first pass of the identity hero, using Gazzar's original portrait,
font, name, support copy, and background sentence. CSS uses observed reference
geometry and the 700px portrait breakpoint. This is not the completed hero.

`HeroAnimateGate` renders nothing. Its logic observes `#top` and imports
`hero.animate.ts` near the viewport when motion is allowed. The controller uses
a compositor marquee and one custom scroll registration to pause it past the
hero. It also pauses in hidden documents. Cleanup removes observers/listeners,
the registration, and the animation. The baseline drift was observed at roughly
133px/s on a 1912px viewport; full responsive motion still needs comparison.

Quiet/reduced motion keeps visible, static content. Signature drawing, particle
portrait, entry timings, navigation docking, hover/pointer motion, exact marquee
phase, and scroll choreography remain pending. The header is still the minimal
locale/motion foundation, not Gazzar's completed navigation system.
