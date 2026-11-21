# ouroptimization.com

**Our Wellness Network** ("More local customers, through real connections.") is a service of OUR Optimization LLC, a local company in Chicago's western suburbs (Oak Brook, Lombard, Elmhurst, Naperville, Downers Grove, Hinsdale). Our team visits nearby businesses, introduces the client's business, and leaves their approved materials; the client portal shows visits and sign-ups.

Static HTML/CSS/JS, no build step, no dependencies, no third-party requests.

## Deploy

Netlify site "ouroptimization", linked to this repo, branch `main`. No build command; publish directory `.` (set in `netlify.toml`). Pull requests get a numbered deploy preview (`deploy-preview-N--ouroptimization.netlify.app`). The owner approves a deploy preview before anything goes to production.

## Pages

Simplified on November 21, 2026 so a business owner understands the offer quickly: four menu items, one portal screenshot, plain language, no animation and no illustrations on the main pages.

| URL | File | In the menu | Notes |
| --- | --- | --- | --- |
| `/` | `index.html` | Home | The owner's copy: "More local customers, through real connections.", the intro, Book a call and View pricing; How it works (3 steps, `#how-it-works`, also the menu's How It Works); What you get with the one portal screenshot (`#what-you-get`); the short FAQ (`#faq`: who it is for with the eight industries `#who`, partners, what we bring `#visits`, partner pay `#paid`, healthcare `#healthcare`); the closing call with the phone number. No prices (they live on `/pricing`). |
| `/pricing` | `pricing.html` | Pricing | Confirmed prices only: first month $450 all in (one route of 5 businesses, with the written guarantee), Neighborhood $600 a month (1 route), Community $1,100 a month (2 routes); what every plan includes; the terms in three lines; add-ons priced on a call. |
| `/contact` | `contact.html` | Contact | The call form (see Forms). |
| `/patient-network` | `patient-network.html` | no | Add-on: private dinners for your best customers (reached from pricing). Keep the URL. |
| `/online-search-network` | `online-search-network.html` | no | Add-on: Google Ads in your own account. |
| `/review-tags` | `review-tags.html` | no | Add-on: tap-to-review tags. Keep the URL (printed tags may point at it). |
| `/website-design` | `website-design.html` | no | Add-on: a website. Keep the URL. |
| `/expo-vendors` | `expo-vendors.html` | no | Baby & Kids Health Expo table requests (noindex). Keep the URL and the form. |
| `/privacy`, `/terms` | `privacy.html`, `terms.html` | footer | Terms last updated November 21, 2026. |
| `/thanks` | `thanks.html` | no | The call form's confirmation (noindex). |
| (any unknown URL) | `404.html` | no | Served with status 404. |

Every page but `/expo-vendors` shares the same header: the logo, Home, How It Works (`/#how-it-works`), Pricing, Contact, and the Client Portal button (https://www.ournetworkportal.com), on one line from 760px. On phones the same four links are a bottom tab bar and Client Portal stays in the header. The footer is one legal line ("Our Wellness Network is a service of OUR Optimization LLC.", Privacy Policy, Terms of Service).

Merged into the home page on November 21, 2026 (each old address 301s there, see URLs and redirects): `/field-team`, `/about`, `/faq`, `/referral-network` (How it works) and the eight industry pages under `/industries/`. The industry page generator (`tools/`) went with them; it is in the git history if vertical landing pages are wanted again.

## Forms (Netlify Forms)

**Site configuration > Forms > Enable form detection** must be on. Netlify reads the forms from the static HTML at deploy, so redeploy after changing a form's fields. Set an email notification per form under **Site configuration > Notifications > Form submission notifications**.

- **`dinner-call`** on `/contact`, posts to `/thanks`, honeypot `bot-field`, validated by `assets/call.js`. Fields: `name`, `clinic`, `phone`, `email` (optional), `town`, `best_time`, `dinner` (what to talk about: Referral routes / Online search / review tags / website / Patient dinner / Not sure yet; the field keeps its old name so Netlify keeps one column) and `message` (optional; its help text asks for no patient information). Links like `/contact?about=pricing` prefill the message; the keys are in `assets/call.js`.
- **`expo-vendor`** on `/expo-vendors`: unchanged, byte for byte (a test pins it). The family QR-code forms for the expo live outside this repo; do not move their routes or endpoints.

## Switches (`assets/site-config.js`)

- `hipaaConfirmed` (default `false`) and `hipaaText` (default empty): a HIPAA sentence in the home page's healthcare answer (`#healthcare`). Leave both off until the owner has confirmed it is true for every healthcare client (business associate agreements, a documented risk assessment, safeguards for the sign-ups the portal holds). This file is public, so no unconfirmed claim goes in it.

## The portal screenshot

One screenshot on the home page, `#what-you-get`: the portal's Activity & results totals (`assets/img/portal2-routes-*` on tablets and computers, `assets/img/portal2-phone-routes-*` on phones, cropped to the totals). It comes from the portal's sample account (a fictional business and invented figures). No visible sample label (the owner's call, November 21, 2026); the alt text says it is the sample account.

## Brand assets

- Logo lockup (the infinity-W mark over "Our Wellness Network", in Playfair Display): `assets/img/owc-logo-360.{webp,png}` in the header, `assets/img/own-logo.png` (600 px) for structured data.
- The mark alone: `assets/img/owc-mark-light.{webp,png}` for light backgrounds, `assets/img/owc-mark-on-dark.{webp,png}` for dark ones (not used on the pages since November 21, 2026).
- Favicons (the mark on a cream square): `favicon.ico`, `apple-touch-icon.png`, `assets/owo-favicon.ico`, `assets/owo-icon-{16,32,192,512}.png`, `assets/owo-apple-touch-icon.png`, `assets/favicon-*.png`, `assets/icon-*.png`; the manifest is `site.webmanifest`.
- Share image: `assets/img/og-network.jpg` (1200 x 630): the logo above "More local customers, through real connections." on the page colour (no illustration, November 21, 2026). The old share images and the old logo 301 to it.
- Portal screenshots: `assets/img/portal2-*`, from the portal's sample account (a fictional business, invented partner names, street addresses reduced to towns). Only the routes totals are shown on the site.

Fonts: headlines in Plus Jakarta Sans and Inter as the text fallback, both self-hosted (SIL Open Font License, licences in `assets/fonts/`). Text uses the phone's own face first: SF Pro on Apple devices, Roboto on Android. The big brands' own faces (Google Sans, SF Pro as a web font, Samsung Sharp Sans, Nike Futura, adidas) are licensed to their owners only, so they are not shipped.

## URLs and redirects (`netlify.toml`)

- Clean URLs: every page's `.html` URL 301s to its clean URL.
- `/flyer-network`, `/flyer-network.html` and every older flyer path (`/flyer-drops`, `/flyers`, `/direct-mail`, ...) 301 straight to `/#how-it-works`, so old links and printed QR codes keep working.
- The merged pages: `/field-team`, `/about`, `/boots-on-the-ground` and `/growth-team` go to `/`; `/faq` to `/#faq`; `/referral-network` to `/` (so an old link's own `#section` carries through); `/industries` and `/industries/*` to `/#who` (the "Who is this for?" answer, which opens). Their `.html` addresses go to the same places. `assets/site.js` maps old home links (`/#dashboard`, `/#industries`, `/#treats`, ...) to the new sections and opens a question when a link points at it.
- Retired pages 301 to the page that covers them; no redirect points at another redirect (a test checks this).
- `/tests/*`, `/tools/*`, `/README.md`, `/netlify.toml` and `/.claude/*` return 404 (`/tools/` is no longer in the repo; the rule stays as a guard).
- Security headers (CSP, `nosniff`, frame and referrer policies) are set for every path.

## Content rules

- The brand is Our Wellness Network; the company in legal text is OUR Optimization LLC. Service area: Chicago's western suburbs.
- Never on the site: invented reviews, testimonials, statistics, scores or results, and medical claims. Examples are labelled "Example".
- The phone number appears only on the home page's closing call, `/contact` and `/thanks` (plus the structured data).
- The client's team calls the leads; the site never says we do. Nobody is paid per referral or per customer.
- Treats for Staff: modest coffee, pastries and snacks for the whole staff of each partner business on every visit. Never gift cards, cash, free services or anything of real value. Explained once, in the home page's "What do you bring on a visit?" answer (and listed once on pricing). Never connected to referrals, sign-ups or results anywhere except the one line that says they are shared whether or not anyone refers a customer.
- Name-tracked sign-ups are described only as measuring campaign performance for the client, never as a basis for rewarding anyone.
- No legal conclusions and no claims of attorney review. The home page's healthcare answer carries the attorney-review TODO comment.
- No placeholder text anywhere (November 21, 2026): only confirmed prices and package details. A figure the owner has not confirmed stays off the site until they do (a test checks).
- Coffee and treats, the tap and QR staff cards, and portal tracking are each explained once, where they help.
- Copy uses no em or en dashes.
- `node --test` holds a list of retired words that must appear nowhere in the files the site serves.

## Tests

Unit tests (Node 18+, no dependencies):

```
node --test tests/*.test.mjs
```

- `tests/site.test.mjs`: every page's head (title, description, canonical, Open Graph, Twitter, icons, one h1), the LocalBusiness data, the header and footer, the retired words, dashes, where the phone number may appear, internal links and anchors, images, the redirects (flyer paths, no chains, blocked files), the sitemap, the two forms (the expo form pinned byte for byte) and the favicon set.
- `tests/home.test.mjs`: the home page against the owner's copy word for word (hero, steps, what you get, the one screenshot, the questions and their compliance lines, each detail explained once, no prices, no decoration), the pricing page (confirmed prices only, the guarantee, the terms) and the merged pages' redirects.
- `tests/call.test.mjs`: the call form and `assets/call.js` (validation rules and `?about=` prefills).
- `tests/html.mjs`: shared helpers and the page list (not a test file).

Browser tests (Playwright, against a local server that applies the `netlify.toml` redirects; every form POST is intercepted, nothing is ever submitted):

```
E2E_BASE_URL=http://localhost:8770 node tests/e2e-call.mjs
```

They cover the call form end to end, the `?about=` prefills, the old links and redirects (the merged pages and old home links land on the right home page section, and a linked question opens), the logo, the HIPAA switch on the home page, the one screenshot on phones and desktops with nothing animated, the questions, and the header and phone tab bar at four widths.

## The client portal

A separate app (repo `our-wellness-portal`, on Render behind Cloudflare at https://www.ournetworkportal.com). The site only links to it; the screenshots on the site come from its sample account.
