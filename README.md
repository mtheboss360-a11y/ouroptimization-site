# ouroptimization.com

**Our Wellness Connections** ("Your Organic Growth Team.") is a brand of OUR Optimization LLC, a local company in Chicago's western suburbs. The site sells one service to independent med spas, **referral routes**: our business matching software maps the businesses around a clinic and ranks the non-competing ones that share its customers; the owner approves the list; a rep visits a route of 5 matched businesses and introduces the clinic to their staff; every staff member met gets a personal tap-and-scan code (NFC tag and QR) that opens the clinic's first-visit offer, tagged with who sent it; every sign-up lands in the clinic's client portal for its front desk to call.

The site was rebuilt to the owner's brief of October 23, 2026. Its job: a med spa owner scans a card our rep left at her front desk, reads the site on her phone between patients and books a 15-minute call.

Static HTML/CSS/JS, no build step, no dependencies, no third-party requests.

## Deploy

Netlify site "ouroptimization", linked to this repo, branch `main`. No build command; publish directory `.` (set in `netlify.toml`). Pull requests get a numbered deploy preview (`deploy-preview-N--ouroptimization.netlify.app`). The owner approves a deploy preview before anything goes to production.

## Pages

| URL | File | In the menu | Notes |
| --- | --- | --- | --- |
| `/` | `index.html` | Home | Hero (no buttons), the business map, the dashboard, the staff courtesy, results, the pricing teaser, compliance (with the sample contract link), the dinner add-on, the closing call (with the phone number). |
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
| `/privacy`, `/terms` | `privacy.html`, `terms.html` | footer | Last updated October 23, 2026. |
| `/thanks`, `/updates-thanks` | `thanks.html`, `updates-thanks.html` | no | Form confirmations (noindex). |
| (any unknown URL) | `404.html` | no | Served with status 404. |

Every page shares the same header (the menu: Home, How it works, Pricing, Sample contract, FAQ, About, Contact, and the Client Portal button to https://www.ournetworkportal.com), the same one-line footer (OUR Optimization LLC, Privacy Policy, Terms of Service) and the same head pattern: its own title and description, a canonical URL, Open Graph and Twitter tags (`assets/img/og-connections.jpg`) and LocalBusiness structured data (name, legal name, phone, email, service area Chicago's western suburbs). The expo page has a brand-only header. When you change the menu or the footer, change it on every page; `node --test` checks they match.

## Forms (Netlify Forms)

**Site configuration > Forms > Enable form detection** must be on. Netlify reads the forms from the static HTML at deploy, so redeploy after changing a form's fields. Set an email notification per form under **Site configuration > Notifications > Form submission notifications**.

- **`dinner-call`** on `/contact`, posts to `/thanks`, honeypot `bot-field`, validated by `assets/call.js`. Fields: `name`, `clinic`, `phone`, `email` (optional), `town`, `best_time`, `dinner` (what to talk about: Referral routes / Online search / review tags / website / Patient dinner / Not sure yet; the field keeps its old name so Netlify keeps one column) and `message` (optional; its help text asks for no patient information). Links like `/contact?about=pricing` prefill the message; the keys are in `assets/call.js`.
- **`results-updates`** on the home page (`#results`), posts to `/updates-thanks`, honeypot `bot-field`. Fields: `phone` and `text_consent` (a required, unticked consent box for results texts). Texting: use a provider that handles STOP, and only text the numbers that gave consent.
- **`expo-vendor`** on `/expo-vendors`: unchanged, byte for byte (a test pins it). The family QR-code forms for the expo live outside this repo; do not move their routes or endpoints.

## Results (`assets/data/results.json`)

The home page's results section reads this file. While `clinics` is empty it shows: "Our first routes are running now with a recovery clinic in Oakbrook Terrace. Leave your number and we'll text you the results as they come in, good or bad." Add one entry per clinic with real, tracked numbers only:

```json
{ "town": "Oakbrook Terrace", "type": "Recovery clinic", "signups60": 0, "bookedFirstVisits60": 0, "referenceCalls": true }
```

`signups60` and `bookedFirstVisits60` are whole numbers for the clinic's first 60 days. An entry with a missing or invalid value is skipped. Never put example numbers in this file.

## Switches (`assets/site-config.js`)

- `attorneyReviewed` (default `false`): shows "The partner agreement and the courtesy terms have been reviewed by a healthcare attorney." in the home page's compliance section. Turn it on only once that review is done.
- `googleMapsKey` (default empty): puts Google's map under the home page's business map (see below) and shows `googleMapText` in the privacy policy's "Who else sees it" section.

## The business map (home, `#matching`)

Real streets of a downtown in Chicago's western suburbs, tipped back like a 3D view, with every business on the map as a dot, your clinic in the middle, five matched businesses as small 3D buildings, each with its owner's portrait, and the route between them along the streets. Under the map, "The owners on your route": one card per business with the owner's portrait, their role, the real walking time from the clinic on this map, and why that kind of business matches.

- **Base map:** our own render of OpenStreetMap data (`assets/img/map-base-{800,1200,1800,2400}.{avif,webp,jpg}`), styled in the brand greens. OpenStreetMap's licence (ODbL) requires the credit "© OpenStreetMap contributors", shown in the corner of the map; keep it.
- **Overlays:** the dots, the highlighted lots, the route and the rings are inline SVG in the page, drawn in a 640 x 427 frame at zoom 16 around 41.7935, -88.0105 (the `data-geo-*` attributes on the figure). The six buildings (`assets/img/map-*.webp`) were made with Higgsfield in the hero's style.
- **The owners:** the portraits (`assets/img/map-face-*.webp`) are Higgsfield illustrations in the buildings' clay style, not photos, and the cards carry no names. Do not swap in photos or names of real business owners without their written consent: Illinois' Right of Publicity Act forbids using a person's identity in advertising without it. Walking times come from the street network of the map (about 80 m a minute).
- **Motion:** the route flows, a light travels it and rings pulse from the clinic, only while the map is on screen, and never for visitors who ask for reduced motion.
- **Google Maps instead of our base:** in Google Cloud, create a key with only the **Maps Static API** enabled, restrict it to the websites `ouroptimization.com/*`, `www.ouroptimization.com/*` and `*.netlify.app/*`, and put it in `googleMapsKey` in `assets/site-config.js`. The page then asks Google for one styled image of the same frame and lays the same overlays on it; Google's map is shown flat and uncropped so its logo and attribution stay visible (their terms). If the key is refused, our map stays. Static Maps is billed per image after Google's monthly free allowance. The CSP already allows `https://maps.googleapis.com` for images.

## Hero video

The home hero shows a still (`assets/img/hero-van-{480,768,1080,1344}.{avif,webp,jpg}`, cut out so it sits on the page colour). To add the video, put an H.264 MP4 at **`assets/video/van-route.mp4`** and deploy: after the page loads it plays muted, looping and inline over the still, which stays as the poster. Visitors who ask for reduced motion always get the still, and if the file is missing or fails to load the still stays. The video's own background should be white or the page colour (it is blended with multiply). Do not ship the draft `van-route*.mp4` files.

## Brand assets

- Logo lockup (the infinity-W mark over "Our Wellness Connections", in Playfair Display): `assets/img/owc-logo-360.{webp,png}` in the header, `assets/img/owc-logo.png` (600 px) for structured data.
- The mark alone: `assets/img/owc-mark-light.{webp,png}` for light backgrounds, `assets/img/owc-mark-on-dark.{webp,png}` for dark ones (the closing band).
- Favicons (the mark on a cream square): `favicon.ico`, `apple-touch-icon.png`, `assets/owo-favicon.ico`, `assets/owo-icon-{16,32,192,512}.png`, `assets/owo-apple-touch-icon.png`, `assets/favicon-*.png`, `assets/icon-*.png`; the manifest is `site.webmanifest`.
- Share image: `assets/img/og-connections.jpg` (1200 x 630). The old share images and the old logo 301 to the new ones.
- Business matching illustration: `assets/img/matching-map-*` (on `/referral-network`, labelled "Example").
- Business map: `assets/img/map-base-*` and `assets/img/map-{clinic,cafe,salon,gym,boutique,studio}.webp` (see above).
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

- `tests/site.test.mjs`: every page's head (title, description, canonical, Open Graph, Twitter, icons, one h1), the LocalBusiness data, the header and footer, the retired words, dashes, where the phone number may appear, internal links and anchors, images, the redirects (flyer paths, no chains, blocked files), the sitemap, the three forms (the expo form pinned byte for byte) and the favicon set.
- `tests/home.test.mjs`: the home page section by section (order, hero, the business map and the Google Maps switch, the courtesy, the dashboard, results and `results.json`, the pricing teaser, compliance and the switch, the add-on, the closing call) and the pricing page's offer.
- `tests/call.test.mjs`: the call form and `assets/call.js` (validation rules and `?about=` prefills).
- `tests/html.mjs`: shared helpers and the page list (not a test file).

Browser tests (Playwright, against a local server that applies the `netlify.toml` redirects; every form POST is intercepted, nothing is ever submitted):

```
E2E_BASE_URL=http://localhost:8770 node tests/e2e-call.mjs
```

They cover the call form end to end, the `?about=` prefills, the old links and redirects, the logo, the results section (empty and with a stubbed entry), the results-updates form and its consent, the attorney switch, the hero video slot (reduced motion and a missing video) and the business map (no request to Google without a key; with a key, Google's image under the overlays and the privacy line; a refused key).

## The client portal

A separate app (repo `our-wellness-portal`, on Render behind Cloudflare at https://www.ournetworkportal.com). The site only links to it; the screenshots on the site come from its sample account.
