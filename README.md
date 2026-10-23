# Our Wellness Connections

Static website for OUR Optimization LLC. This is a review release; do not publish to production without the owner's approval.

## Existing design retained
The site uses its original CSS system, Playfair Display and Inter fonts, OWO van hero animation and client-portal screenshots. No framework or production build step has been added.

## Hosting
Netlify publishes the project root. Keep netlify.toml: it contains the security headers, existing redirects and the forced 301 from /flyer-network to /referral-network.

## Forms
- Contact: Netlify form dinner-call, POST /thanks.
- Expo vendors: Netlify form expo-vendor, POST /expo-vendors?sent=1.
- Both honeypots and original field names are retained.
- Preserve the existing Netlify Forms notifications in the live hosting account.
- The separate family QR-code forms are not included in this source. Do not replace their routes or endpoints.

## Verification
Run `node --test tests/connections.test.mjs` for focused source regression checks. Browser checks at 390px and 1440px are summarized in the accompanying review handoff. No live submissions were sent.

## Approval
The review preview is https://our-wellness-connections-preview.higgsfield.app. It is separate from production and disables submissions. That preview-only guard is not included in these static production-source files.

## OWO hero animation
The homepage embeds `assets/owo-exact-scene.html`, copied unchanged from the supplied animation. The frame keeps the scene’s 1344:752 aspect ratio on mobile and desktop, includes its pause/play control, and respects reduced-motion settings. The previous hero map overlays and location chips have been removed from the homepage. Other pages, forms and hosting configuration are unchanged.
