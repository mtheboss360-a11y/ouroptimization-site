# ouroptimization.com

**Our Wellness Network** ("Boots on the ground for your local business.") is a service of OUR Optimization LLC, a local company in Chicago's western suburbs (Oak Brook, Lombard, Elmhurst, Naperville, Downers Grove, Hinsdale). Our team visits the businesses near a client, introduces the client's business to their staff, and tracks every visit and sign-up in the client portal.

Static HTML/CSS/JS, no build step on Netlify, no dependencies, no third-party requests. The industry pages are generated locally by `tools/build-industries.mjs` and committed (see Industry pages).

## Deploy

Netlify site "ouroptimization", linked to this repo, branch `main`. No build command; publish directory `.` (set in `netlify.toml`). Pull requests get a numbered deploy preview (`deploy-preview-N--ouroptimization.netlify.app`). The owner approves a deploy preview before anything goes to production.

## Pages

| URL | File | In the menu | Notes |
| --- | --- | --- | --- |
| `/` | `index.html` | Home | Hero (no buttons): "Boots on the ground for your local business." over the half orb (`assets/home-orb.js`). Then Industries (cards to the industry pages), in person, the portal on the green band, Treats for Staff, in writing, the closing call. |
| `/field-team` | `field-team.html` | Field Team | What the field team does on every visit: Treats for Staff, drop-offs, the codes, every stop tracked. Was `/boots-on-the-ground` (301). |
| `/#industries` | (home section) | Industries | The menu item jumps to the home page's Industries cards. `/industries` itself still 301s home (an old page). |
| `/industries/<slug>` | `industries/<slug>.html` | no | Eight industry pages from one template: med-spas, dental, chiropractic-physical-therapy, gyms-fitness-studios, salons-barbershops, restaurants-cafes, home-services, auto-shops. Generated; do not edit by hand. |
| `/referral-network` | `referral-network.html` | How it works | Matching, the route, the staff cards, a typical month, the portal, the partner agreement, who does what. |
| `/faq` | `faq.html` | FAQ | Short answers that point to the page that explains each topic: visits and treats, how it works (with the add-ons, `#add-ons`), partners and results, leads and data, healthcare practices. |
| `/about` | `about.html` | About | Who we are, what we put in writing. |
| `/contact` | `contact.html` | Contact | The call form (see Forms). |
| `/patient-network` | `patient-network.html` | no | Add-on: private dinners for your best customers (linked from the FAQ's add-ons answer). Keep the URL. |
| `/online-search-network` | `online-search-network.html` | no | Add-on: Google Ads in your own account. |
| `/review-tags` | `review-tags.html` | no | Add-on: tap-to-review tags. Keep the URL (printed tags may point at it). |
| `/website-design` | `website-design.html` | no | Add-on: a website. Keep the URL. |
| `/expo-vendors` | `expo-vendors.html` | no | Baby & Kids Health Expo table requests (noindex). Keep the URL and the form. |
| `/privacy`, `/terms` | `privacy.html`, `terms.html` | footer | Terms last updated November 21, 2026. |
| `/thanks` | `thanks.html` | no | The call form's confirmation (noindex). |
| (any unknown URL) | `404.html` | no | Served with status 404. |

Every page shares the same header (the menu: Home, Field Team, Industries, How it works, FAQ, About, Contact, and the Client Portal button to https://www.ournetworkportal.com; on phones the bottom tab bar: Home, Field Team, Industries, How it works, More) and the same one-line footer ("Our Wellness Network is a service of OUR Optimization LLC.", Privacy Policy, Terms of Service).


November 21, 2026: same pages, tabs and section order as before, simpler wording on every page, and no pricing anywhere: `/pricing` (and `/pricing.html`) 301s to `/contact`. The section that held only campaign length and commitment terms came off How it works.

## Industry pages (`tools/`)

Each industry is one JSON file in `tools/industries/<slug>.json` (partner business types, treat examples, notes, questions, title and description). `tools/build-industries.mjs` builds `industries/<slug>.html` from one template and writes the home page's Industries cards between the `industries:start` and `industries:end` markers. The header, footer and structured data are copied from `index.html`, so change those there first.

```
node tools/build-industries.mjs           # write the pages
node tools/build-industries.mjs --check   # fail if a page is out of date (tests/industries.test.mjs runs this)
```

The healthcare pages (med-spas, dental, chiropractic-physical-therapy) carry `<!-- TODO: attorney review of courtesy program before publishing healthcare pages -->`. `/tools/*` returns 404 on the site.

## Forms (Netlify Forms)

**Site configuration > Forms > Enable form detection** must be on. Netlify reads the forms from the static HTML at deploy, so redeploy after changing a form's fields. Set an email notification per form under **Site configuration > Notifications > Form submission notifications**.

- **`dinner-call`** on `/contact`, posts to `/thanks`, honeypot `bot-field`, validated by `assets/call.js`. Fields: `name`, `clinic`, `phone`, `email` (optional), `town`, `best_time`, `dinner` (what to talk about: Referral routes / Online search / review tags / website / Patient dinner / Not sure yet; the field keeps its old name so Netlify keeps one column) and `message` (optional; its help text asks for no patient information). Links like `/contact?about=pricing` prefill the message; the keys are in `assets/call.js`.
- **`expo-vendor`** on `/expo-vendors`: unchanged, byte for byte (a test pins it). The family QR-code forms for the expo live outside this repo; do not move their routes or endpoints.

## Switches (`assets/site-config.js`)

- `hipaaConfirmed` (default `false`) and `hipaaText` (default empty): a HIPAA sentence on the healthcare industry pages and the FAQ. Leave both off until the owner has confirmed it is true for every healthcare client (business associate agreements, a documented risk assessment, safeguards for the sign-ups the portal holds). This file is public, so no unconfirmed claim goes in it.

## The orbs and the portal tour (home, `/field-team`, `/referral-network`)

The home hero carries the half orb the owner picked (`assets/home-orb.js`, first shipped October 24, 2026): a green dot-orb rising from the corner, your business at its gold centre, and six illustrated owners (a first name and a kind of business, never a real person or business) connecting to it. It builds once per visit, keeps the owners clear of the words and sits above the phone tab bar. How it works uses the same orb, whole (`assets/match-orb.js`).


Four portal screens (`assets/img/portal2-*`, the portal's sample account: invented businesses and figures) behind tabs styled as the portal's side rail. No visible sample labels (the owner's call, November 21, 2026); the alt text says the screens are from the sample account.


## Brand assets

- Logo lockup (the infinity-W mark over "Our Wellness Network", in Playfair Display): `assets/img/owc-logo-360.{webp,png}` in the header, `assets/img/own-logo.png` (600 px) for structured data.
- The mark alone: `assets/img/owc-mark-light.{webp,png}` for light backgrounds, `assets/img/owc-mark-on-dark.{webp,png}` for dark ones (the closing band).
- Favicons (the mark on a cream square): `favicon.ico`, `apple-touch-icon.png`, `assets/owo-favicon.ico`, `assets/owo-icon-{16,32,192,512}.png`, `assets/owo-apple-touch-icon.png`, `assets/favicon-*.png`, `assets/icon-*.png`; the manifest is `site.webmanifest`.
- Share image: `assets/img/og-network.jpg` (1200 x 630): the logo above "Boots on the ground for your local business." (November 21, 2026). The old share images and the old logo 301 to the new ones.
- Business matching illustration: `assets/img/matching-map-*` (on `/referral-network`, labelled "Example").
- Field team illustration: `assets/img/team-visit-{480,768,1080}.{avif,webp}`, clay figurines made with Higgsfield in the hero's style (not real people).
- Portal screenshots: `assets/img/portal2-*`, from the portal's sample account (a fictional business, invented partner names, street addresses reduced to towns). The business names, and the Partners screen's notice about real businesses, are covered with grey bars (November 21, 2026), so no business is shown.

Fonts: headlines in Plus Jakarta Sans and Inter as the text fallback, both self-hosted (SIL Open Font License, licences in `assets/fonts/`). Text uses the phone's own face first: SF Pro on Apple devices, Roboto on Android. The big brands' own faces (Google Sans, SF Pro as a web font, Samsung Sharp Sans, Nike Futura, adidas) are licensed to their owners only, so they are not shipped.

## URLs and redirects (`netlify.toml`)

- Clean URLs: every page's `.html` URL 301s to its clean URL.
- `/flyer-network`, `/flyer-network.html` and every older flyer path (`/flyer-drops`, `/flyers`, `/direct-mail`, ...) 301 straight to `/referral-network`, so old links and printed QR codes keep working.
- Retired pages 301 to the page that covers them; no redirect points at another redirect (a test checks this).
- `/tests/*`, `/tools/*`, `/README.md`, `/netlify.toml` and `/.claude/*` return 404: they are in the repo but not part of the site.
- `/boots-on-the-ground`, `/growth-team` (and their `.html`) 301 straight to `/field-team`.
- Security headers (CSP, `nosniff`, frame and referrer policies) are set for every path.

## Content rules

- The brand is Our Wellness Network; the company in legal text is OUR Optimization LLC. Service area: Chicago's western suburbs.
- Never on the site: invented reviews, testimonials, statistics, scores or results, and medical claims. Examples are labelled "Example".
- The phone number appears only on the home page's closing call, `/contact` and `/thanks` (plus the structured data).
- The client's team calls the leads; the site never says we do. Nobody is paid per referral or per customer.
- Treats for Staff: modest coffee, pastries and snacks for the whole staff of each partner business on every visit. Never gift cards, cash, free services or anything of real value. Never connected to referrals, sign-ups or results anywhere except the one FAQ line that says they are shared whether or not anyone refers a customer.
- Name-tracked sign-ups are described only as measuring campaign performance for the client, never as a basis for rewarding anyone.
- No legal conclusions and no claims of attorney review. Healthcare pages carry the attorney-review TODO comment.
- No placeholder text anywhere, and no pricing: no prices, trial, plans or money-back guarantee on any page, and nothing links to `/pricing` (November 21, 2026; the terms keep how prices are agreed in writing, with no figures).
- Plain words, short sentences; each page explains its own topic and points to the others instead of repeating them.
- Copy uses no em or en dashes.
- `node --test` holds a list of retired words that must appear nowhere in the files the site serves.

## Tests

Unit tests (Node 18+, no dependencies):

```
node --test tests/*.test.mjs
```

- `tests/site.test.mjs`: every page's head (title, description, canonical, Open Graph, Twitter, icons, one h1), the LocalBusiness data, the header and footer, the retired words, dashes, where the phone number may appear, internal links and anchors, images, the redirects (flyer paths, no chains, blocked files), the sitemap, the two forms (the expo form pinned byte for byte) and the favicon set.
- `tests/home.test.mjs`: the home page section by section (order, hero, Industries, the portal, Treats for Staff, in writing and the HIPAA switch, the hidden case study, the closing call), the pricing offer, the Field Team page and the portal tour on its three pages.
- `tests/call.test.mjs`: the call form and `assets/call.js` (validation rules and `?about=` prefills).
- `tests/industries.test.mjs`: the industry pages match their data (the generator's `--check`), the order, healthcare marking, modest treats.
- `tests/html.mjs`: shared helpers and the page list (not a test file).

Browser tests (Playwright, against a local server that applies the `netlify.toml` redirects; every form POST is intercepted, nothing is ever submitted):

```
E2E_BASE_URL=http://localhost:8770 node tests/e2e-call.mjs
```

They cover the call form end to end, the `?about=` prefills, the old links and redirects (including /boots-on-the-ground and /growth-team to /field-team, and /pricing to /contact), the logo, the HIPAA switch on a healthcare page, the half orb hero, the portal tour, the phone tab bar and its More sheet, and the Field Team page.

## The client portal

A separate app (repo `our-wellness-portal`, on Render behind Cloudflare at https://www.ournetworkportal.com). The site only links to it; the screenshots on the site come from its sample account.
