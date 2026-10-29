# Cursor Study — local simulation

The user explicitly rejected live cursor sharing and a backend. This controller
is a decorative, local-only demonstration of cursor movement. It never creates
visitor/session identities, opens a channel, contacts a server, reads another
tab or stores cursor positions. The reference `live-cursors` URL is retained as
a compatibility slug; both the card and page title now say Cursor Study.

Three pointers are labeled Demo / محاكاة. Authored paths use varied pauses and
curved moves; the source cursor shapes, direction and damped following are
retained. Local pointer/touch input briefly guides the demonstration, then it
returns to those paths. A persistent simulation label reads the server-rendered
instructions. Reduced motion has no ambient frame owner and updates only after
local input or settings changes.

The parent environment pauses the one scene callback for hidden/menu/offscreen
state. Destroy removes the callback, aborts all local listeners and removes only
this detail page’s nodes. No site-wide cursor overlay is created. The shared
reference camera still converts physical input once and emits width-based CSS.

Source pointer artwork: https://carterogunsola.com/lab/live-cursors.
Authored simulation paths intentionally replace its realtime transport.
