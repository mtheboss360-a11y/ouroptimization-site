# ouroptimization.com

**Our Wellness Connections** ("Your Organic Growth Team.") is a brand of OUR Optimization LLC, a local company in Chicago's western suburbs. The site sells one service to independent med spas, **referral routes**: our business matching software maps the businesses around a clinic and ranks the non-competing ones that share its customers; the owner approves the list; a rep visits a route of 5 matched businesses and introduces the clinic to their staff; every staff member met gets a personal tap-and-scan code (NFC tag and QR) that opens the clinic's first-visit offer, tagged with who sent it; every sign-up lands in the clinic's client portal for its front desk to call.

The site was rebuilt to the owner's brief of October 23, 2026, with the owner's notes of October 24 (new hero lines, the dashboard on the green band, no map, no results section, the Growth team page). Its job: a med spa owner scans a card our rep left at her front desk, reads the site on her phone between patients and books a 15-minute call.

Static HTML/CSS/JS, no build step, no dependencies, no third-party requests.

## Deploy

Netlify site "ouroptimization", linked to this repo, branch `main`. No build command; publish directory `.` (set in `netlify.toml`). Pull requests get a numbered deploy preview (`deploy-preview-N--ouroptimization.netlify.app`). The owner approves a deploy preview before anything goes to production.

## Pages

| URL | File | In the menu | Notes |
| --- | --- | --- | --- |
| `/` | `index.html` | Home | Hero (no buttons): "Your Organic Growth Team.", "We put your community into the brand." and the boots-on-the-ground line. Then the dashboard on the green band (the screens tip up flat as you scroll), the staff courtesy, the pricing teaser, compliance (with the sample contract link), the dinner add-on, the closing call (with the phone number). |
| `/growth-team` | `growth-team.html` | Growth team | "Your Organic Growth Team." and "The boots on the ground maintaining your relationships.": what our people do on a route (treats and coffee, meeting the staff, the codes, the visit log) and how the relationships are kept up month after month. The illustration (`assets/img/team-visit-*`) is Higgsfield clay figurines in the hero's style, not real people. |
| `/referral-network` | `referral-network.html` | How it works | Referral routes end to end. The old flyer network is folded in here. |
| `/pricing` | `pricing.html` | Pricing | The trial ($250), Starter ($250/mo), Growth ($400/mo), Reach ($800/mo), the two trial guarantees, terms, who supplies what, add-ons priced on a call. The one page with a closing call band. |
| `/sample-contract` | `sample-contract.html` | Sample contract | A sample referral-route agreement. |
| `/faq` | `faq.html` | FAQ | Ten questions from the brief. |
| `/about` | `about.html` | About | Who we are, the Grace Pediatrics client work, what we put in writing. |
| `/contact` | `contact.html` | Contact | The call form (see Forms). |
| `/patient-network` | `patient-network.html` | no | The private patient dinner add-on, reached from the home add-on card. Quoted per event. |
| `/online-search-network` | `online-search-network.html` | no | Add-on: Google Ads in the clinic's own account. |
| `/review-tags` | `review-tags.html` | no | Add-on: tap-to-review tags. Keep the URL (printed tags may point at it). |
| `/website-design` | `website-design.html` | no | Add-on: a website. Keep the URL. |
| `/expo-vendors` | `expo-vendors.html` | no | Baby & Kids Health Expo table requests (noindex). Keep the URL and the form. |
| `/privacy`, `/terms` | `privacy.html`, `terms.html` | footer | Last updated October 24, 2026. |
| `/thanks` | `thanks.html` | no | The call form's confirmation (noindex). |
| (any unknown URL) | `404.html` | no | Served with status 404. |

Every page shares the same header (the menu: Home, Growth team, How it works, Pricing, Sample contract, FAQ, About, Contact, and the Client Portal button to https://www.ournetworkportal.com), the same one-line footer (OUR Optimization LLC, Privacy Policy, Terms of Service) and the same head pattern: its own title and description, a canonical URL, Open Graph and Twitter tags (`assets/img/og-connections.jpg`) and LocalBusiness structured data (name, legal name, phone, email, service area Chicago's western suburbs). The expo page has a brand-only header. When you change the menu or the footer, change it on every page; `node --test` checks they match.

## Forms (Netlify Forms)

**Site configuration > Forms > Enable form detection** must be on. Netlify reads the forms from the static HTML at deploy, so redeploy after changing a form's fields. Set an email notification per form under **Site configuration > Notifications > Form submission notifications**.

- **`dinner-call`** on `/contact`, posts to `/thanks`, honeypot `bot-field`, validated by `assets/call.js`. Fields: `name`, `clinic`, `phone`, `email` (optional), `town`, `best_time`, `dinner` (what to talk about: Referral routes / Online search / review tags / website / Patient dinner / Not sure yet; the field keeps its old name so Netlify keeps one column) and `message` (optional; its help text asks for no patient information). Links like `/contact?about=pricing` prefill the message; the keys are in `assets/call.js`.
- **`expo-vendor`** on `/expo-vendors`: unchanged, byte for byte (a test pins it). The family QR-code forms for the expo live outside this repo; do not move their routes or endpoints.

## Switches (`assets/site-config.js`)

- `attorneyReviewed` (default `false`): shows "The partner agreement and the courtesy terms have been reviewed by a healthcare attorney." in the home page's compliance section. Turn it on only once that review is done.

## The dashboard on the green band (home, `#dashboard`)

The portal screens (`assets/img/portal-*`, a sample account for a fictional clinic) lie tipped back under a "Scroll" cue and stand up flat as the visitor scrolls to them. `assets/site.js` sets `--p` on the band from 0 to 1 by scroll position; the CSS turns it into the tilt and fades the cue. Without JavaScript, or for visitors who ask for reduced motion, the screens are simply flat and the cue never shows.

## Hero video

The home hero shows a still (`assets/img/hero-van-{480,768,1080,1344}.{avif,webp,jpg}`, cut out so it sits on the page colour). To add the video, put an H.264 MP4 at **`assets/video/van-route.mp4`** and deploy: after the page loads it plays muted, looping and inline over the still, which stays as the poster. Visitors who ask for reduced motion always get the still, and if the file is missing or fails to load the still stays. The video's own background should be white or the page colour (it is blended with multiply). Do not ship the draft `van-route*.mp4` files.

## Brand assets

- Logo lockup (the infinity-W mark over "Our Wellness Connections", in Playfair Display): `assets/img/owc-logo-360.{webp,png}` in the header, `assets/img/owc-logo.png` (600 px) for structured data.
- The mark alone: `assets/img/owc-mark-light.{webp,png}` for light backgrounds, `assets/img/owc-mark-on-dark.{webp,png}` for dark ones (the closing band).
- Favicons (the mark on a cream square): `favicon.ico`, `apple-touch-icon.png`, `assets/owo-favicon.ico`, `assets/owo-icon-{16,32,192,512}.png`, `assets/owo-apple-touch-icon.png`, `assets/favicon-*.png`, `assets/icon-*.png`; the manifest is `site.webmanifest`.
- Share image: `assets/img/og-connections.jpg` (1200 x 630), with "Your Organic Growth Team." and "We put your community into the brand.". The old share images and the old logo 301 to the new ones.
- Business matching illustration: `assets/img/matching-map-*` (on `/referral-network`, labelled "Example").
- Growth team illustration: `assets/img/team-visit-{480,768,1080}.{avif,webp}`, clay figurines made with Higgsfield in the hero's style (not real people).
- Portal screenshots: `assets/img/portal-*`, from the portal's sample account (a fictional clinic, 555 phone numbers, `.invalid` emails, made-up partner names). On the home page they carry no label (the owner's call); their alt text says they are the sample account.

Fonts are self-hosted (Playfair Display and Inter, SIL Open Font License, licences in `assets/fonts/`).

## URLs and redirects (`netlify.toml`)

- Clean URLs: every page's `.html` URL 301s to its clean URL.
- `/flyer-network`, `/flyer-network.html` and every older flyer path (`/flyer-drops`, `/flyers`, `/direct-mail`, ...) 301 straight to `/referral-network`, so old links and printed QR codes keep working.
- Retired pages 301 to the page that covers them; no redirect points at another redirect (a test checks this).
- `/tests/*`, `/README.md`, `/netlify.toml` and `/.claude/*` return 404: they are in the repo but not part of the site.
- Security headers (CSP, `nosniff`, frame and referrer policies) are set for every path.

## Content rules

- The brand is Our Wellness Connections; the company in legal text is OUR Optimization LLC. Service area: Chicago's western suburbs.
- Never on the site: invented reviews, testimonials, statistics, scores or results, and medical claims. Examples are labelled "Example".
- The phone number appears only on the home page's closing call, `/contact` and `/thanks` (plus the structured data).
- The clinic's front desk calls the leads; the site never says we do. Nobody is paid per referral or per patient; the staff courtesy is the same for everyone and given whether or not they refer.
- Copy uses no em or en dashes.
- `node --test` holds a list of retired words that must appear nowhere in the files the site serves.

## Tests

Unit tests (Node 18+, no dependencies):

```
node --test
```

- `tests/site.test.mjs`: every page's head (title, description, canonical, Open Graph, Twitter, icons, one h1), the LocalBusiness data, the header and footer, the retired words, dashes, where the phone number may appear, internal links and anchors, images, the redirects (flyer paths, no chains, blocked files), the sitemap, the two forms (the expo form pinned byte for byte) and the favicon set.
- `tests/home.test.mjs`: the home page section by section (order, hero, the dashboard on the green band and its scroll tilt, no map and no results section, the courtesy, the pricing teaser, compliance and the switch, the add-on, the closing call) and the pricing page's offer.
- `tests/call.test.mjs`: the call form and `assets/call.js` (validation rules and `?about=` prefills).
- `tests/html.mjs`: shared helpers and the page list (not a test file).

Browser tests (Playwright, against a local server that applies the `netlify.toml` redirects; every form POST is intercepted, nothing is ever submitted):

```
E2E_BASE_URL=http://localhost:8770 node tests/e2e-call.mjs
```

They cover the call form end to end, the `?about=` prefills, the old links and redirects, the logo, the attorney switch, the hero video slot (reduced motion and a missing video), the dashboard tilt (tipped back below the fold, flat once in view, flat and still with reduced motion or without JavaScript, at 390 and 1280 px) and the Growth team page (second in the menu, the menu on one line at 1000 and 1280 px, the illustration, the clean URL).

## The client portal

A separate app (repo `our-wellness-portal`, on Render behind Cloudflare at https://www.ournetworkportal.com). The site only links to it; the screenshots on the site come from its sample account.
