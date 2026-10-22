# ouroptimization.com

Our Wellness Optimization (a brand of OUR Optimization LLC) is a local marketing company in Chicago's western suburbs. The site's main offer is **private patient dinners for independent med spas**, and the referral network around the clinic:

- **The Plus-One Dinner** (new patients): about 15 of the clinic's favourite patients each bring a friend who is not a patient yet.
- **The VIP Night** (existing patients): up to 30 of the clinic's best patients, an evening built around a new treatment or package. For spas whose books are already full.

At both, the owner gives a short talk and makes an offer they have approved, and guests can book on the night. It is a sales evening and the site says so. No price figure appears on the site (removed at the owner's request on October 21, 2026: a number up front scares people off). The site says each dinner gets one fixed quote, restaurant and food included, given after the 15-minute call and fixed in writing before the clinic commits, with no monthly contract. Around the dinners: the referral network (gyms and training studios, salons, cafés and restaurants, offices and small businesses near the clinic, each with a partner kit), flyer drops (a representative visits the businesses the clinic chooses, on set field days, with a visit log after each), and Google Ads as the cherry on top (the clinic pays Google directly, in its own account). Flyer drops and the referral network have a flat monthly fee set in advance that never moves with referrals, month to month with 30 days' notice. Review tags and website redesign are separate orders.

Since October 22, 2026 it is a multi-page site: every service has its own page and its own tab in the header (the owner asked for "everything its own tab ... every page with its own page").

Static HTML/CSS/JS, no build step, no dependencies, no third-party requests.

## Deploy

Netlify site linked to this repo, branch `main`. No build command; publish directory `.` (set in `netlify.toml`). Pull requests get a Netlify deploy preview. Show the owner a deploy preview before anything goes to production.

Forms use **Netlify Forms** (no function, no secrets):
- **Site configuration > Forms > Enable form detection** must be on. After turning it on the first time, redeploy.
- **`dinner-call`**: the "Book a 15-minute call" form on the contact page (`contact.html`, `/contact`, `#call`, script `assets/call.js`). It posts to `/thanks` (`thanks.html`, `noindex`) and has a `bot-field` honeypot. Fields: `name`, `clinic`, `phone`, `email` (optional), `town`, `best_time`, `dinner` and `message` (optional), with the line "Please don't include any patient information." The `dinner` field keeps its name (so Netlify keeps one column for old and new submissions) but its legend is "What would you like to talk about?" with Plus-One Dinner / VIP Night / Flyer drops or referral network / Not sure yet. Every call to action on the site links to `/contact`, with `?about=` where it fits: `patient-dinners`, `referral-network`, `flyer-drops`, `google-ads`, `review-tags` and `website-design` each prefill the message. Old links (`/?about=review-tags#call`) are redirected to `/contact?about=review-tags`.
- **`expo-vendor`**: the **Baby & Kids Health Expo** practice sign-up page (`expo-vendors.html`, `/expo-vendors`, short link `/vendors`). Printed QR codes may point at it: do not change its URL or form name. The page is `noindex`; update the "Where" and "When" facts once the venue and date are set. Parent follow-up requests at the expo are collected outside this site (a Google Form and Sheet per practice, each with its own QR code).
- Email alerts: **Site configuration > Notifications > Form submission notifications > Add notification > Email notification**, one for each form, to mustafa@ouroptimization.com. Submissions are also listed under **Forms** in the Netlify UI.
- After changing form fields, redeploy so Netlify re-reads the form from the static HTML.
- The old `campaign-estimate` form (`estimate.html`) is retired. Any past submissions can still be viewed or deleted under Forms in the Netlify UI, and the privacy policy covers them.

## Pages

| Page | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Home. The community map hero (h1 "Your best patients bring the next ones." under the eyebrow "Patient dinners for independent med spas"), `#services` ("What we do": one card per service page), `#how-we-work` (fees set in advance, your call and your words, the patient list, month to month; links to `/about#how-we-work`), `#who-we-are` (short, with the Grace Pediatrics photo, links to `/about`) and `#call` (a call to action band that links to `/contact`, so old `/#call` links still land on one). JSON-LD lives here only. |
| `patient-dinners.html` | `/patient-dinners` | The two dinners and the "No surprises" pricing card with no figure (`#formats`), how the evening works (`#how`), what we handle and the patient list promise (`#handle`), with "one of us is there all evening" from the agreement. |
| `referral-network.html` | `/referral-network` | The network (`#referrals`), the five steps of building it (`#process`: your partners, the partner kit, tap or scan, every month, the monthly report), the NFC explainer (`#nfc`) and "Example: ETHR LAB's training partner network" (`#example`), in the studio's charcoal, gold and cream, with a marked slot for two sample mockups. |
| `flyer-drops.html` | `/flyer-drops` | How our flyer drop agreement runs: the schedule table for a two-location practice (`#schedule`), each visit and the visit log (`#visit`), you choose every business (`#choose`), who supplies what (`#supplies`), how we represent you (`#represent`), and Google Ads alongside. |
| `google-ads.html` | `/google-ads` | Google Ads as the cherry on top, from the site's existing wording only: why ads come last, your own account and budget, side by side with flyer drops. No features or results beyond that. |
| `review-tags.html` | `/review-tags` | Tap-to-review NFC tags (a QR code on the same piece if wanted), the Pure Medical Spa stand in use (`#in-use`), the review rules. |
| `website-design.html` | `/website-design` | Website redesign. |
| `about.html` | `/about` | Who we are (the Grace Pediatrics photo, Mustafa's contact) and `#how-we-work`: six commitments from our written agreements. |
| `faq.html` | `/faq` | Every FAQ entry, grouped: `#dinners-faq` (the brief's seven, byte-for-byte; a test hashes them), `#flyer-drops-faq`, `#network-faq`, `#working-faq`. |
| `contact.html` | `/contact` | The `dinner-call` form (`#call`) and the "On the call" aside. |
| `thanks.html` | `/thanks` | Thank-you page the call form posts to. `noindex`, not in the sitemap. |
| `expo-vendors.html` | `/expo-vendors` | Baby & Kids Health Expo practice table requests (form `expo-vendor`, inline validation script). Left untouched: it keeps its own brand-only header and short footer, and is `noindex`. |
| `privacy.html`, `terms.html` | `/privacy`, `/terms` | Privacy policy (the call form on `/contact`, the expo form, the partner offer form, which is separate from this site and travels by email and text, and what we see of guests' RSVP replies) and terms of service (the dinners, the referral network and flyer drops, how prices are agreed with no figure, the clinic's duties on staff perks, calling and texting within the consent given, and sending report numbers as totals). Both last updated October 22, 2026; the October 2026 wording still needs Mustafa's OK before launch. |
| `404.html` | | Not-found page, with a link to every page. Root-absolute asset paths so it works at any depth. |

Every page except the expo page carries the same header and footer. The header has two rows on desktops (1000px and up): the logo, "Call or text 331-271-6851" and the "Book a 15-minute call" button, then the tab bar with every page (Home, Patient Dinners, Referral Network, Flyer Drops, Google Ads, Review Tags, Website Design, About, FAQ, Contact). Only the tab bar stays at the top when the page scrolls. The current page's tab carries `aria-current="page"`. Below 1000px the tabs move into the Menu panel. Each page under the home page opens with breadcrumbs, an eyebrow, its h1 and (on the service pages) an "At a glance" card, and ends with a call to action band. Footer: the logo and a one-line description, "Talk to Mustafa", "On this site" (every page) and "Legal". The review tag and website redesign illustrations show Integrative Wellness, a sample brand and not a client: each has a caption under it ("Sample design. Integrative Wellness is a sample brand we use to show our work, not a client."), "a made-up brand" in its alt text, and the footer line "Integrative Wellness is a sample brand used to show our work." Pages that show no sample brand carry no such line.

The pages are plain static HTML. They were generated once from shared header, footer and icon parts, but there is no build step: edit each page directly, and keep the header and footer identical on every page (a test compares them).

## URLs and redirects

Clean, extensionless URLs are canonical (`/flyer-drops`, not `/flyer-drops.html`). Internal links, canonical tags, `og:url` and `sitemap.xml` use them, and `netlify.toml` 301-redirects every page's `.html` URL to its clean URL (`/index.html` to `/`).

**Old call links.** `/` with `?about=<key>` 301s to `/contact?about=<key>` (a Netlify query-matching rule, `query = {about = ":about"}`). The plain home page is untouched. **Old home sections.** `assets/site.js` sends old home anchors to their new page with `location.replace`: `/#formats`, `/#how` and `/#handle` to the same section on `/patient-dinners`, `/#who` to `/about`, `/#add-ons` and `/#referrals` to `/referral-network`, `/#flyer-drops` to `/flyer-drops` and `/#faq` to `/faq`. `/#call` stays on the home page.

**Retired pages.** In October 2026 the old community marketing service pages were retired. Their `.html` files are deleted, and both `/name` and `/name.html` 301 (forced) to the page that now covers them:

| Retired | Now goes to |
|---|---|
| `/how-it-works` | `/patient-dinners#how` |
| `/events` | `/patient-dinners` |
| `/marketing-kits`, `/tracking` | `/patient-dinners#handle` |
| `/community-marketing`, `/market-research`, `/custom-marketing` | `/referral-network` |
| `/flyers`, `/direct-mail` | `/flyer-drops` |
| `/digital-marketing` | `/google-ads` |
| `/seo` | `/website-design` |
| `/estimate` | `/contact` |
| `/services`, `/social-media`, `/groupon`, `/gift-cards` | `/#services` |
| `/industries`, `/examples`, `/sample-advertisements` | `/` |

`/faq` and `/google-ads` were retired in October 2026 and are real pages again since October 22, 2026, so their old redirects are gone. Older redirects point straight at their final target, with no chains: `/who-its-for` to `/`, `/landing` to `/#services`, `/meeting` to `/contact`. `/vendors` and `/expo-vendors.html` go to `/expo-vendors`. `/tests/*`, `/README.md` and `/netlify.toml` return 404 (repository-only files). When adding a redirect, point it at a page that exists, never at another redirected path.

`sitemap.xml` lists every indexable page (lastmod 2026-10-22): `/`, `/patient-dinners`, `/referral-network`, `/flyer-drops`, `/google-ads`, `/review-tags`, `/website-design`, `/about`, `/faq`, `/contact`, `/privacy` and `/terms`. `robots.txt` is unchanged.

## Content rules

- No prices or fee figures anywhere: not in copy, alt text, comments, tests or this file. Describe how a price is set (one fixed quote per dinner; a flat monthly fee set in advance for flyer drops and the referral network), never a number. A test scans every text file for dollar figures.
- No fake reviews, testimonials, statistics, client logos or "as seen on". No made-up results. We're running our first patient dinners now, and the site says nothing has been run yet. Every dinner gets a results sheet; a clinic's results will be among our first case studies. Add a result only with the clinic's written OK and figures that back it.
- No medical or results claims. Never promise a number of patients, leads, partners, bookings, a callback time or a return.
- Never name a prospect, or anyone from a prospect's or a partner's documents. Describe the agreement only as "our flyer drop agreement" or "a two-location practice" (Location A and Location B). The gyms in the ETHR LAB kit and the people behind it are never named. A test checks every text file against a list of hashed names, so the names are not spelled out in the repository either.
- ETHR LAB may be named, and its look used, on `/referral-network` only, as an example of a training partner network we are setting up now for a recovery and wellness studio in Oakbrook Terrace. Say it is being set up; claim no results, sign-ups or numbers; never state the members' offer price; never repeat the handout's two-way line. Its flyer describes equipment and session length only.
- The clinic sends invitations from its own list. We never receive, see or keep its patient list. Guests reply on an RSVP page in the clinic's name.
- Referral network: we find the businesses near a clinic using mapping software and local business data (describe it only that way: no named platform, database size or accuracy claim), map 15 to 20 and aim to sign 5 to 10, then set up, or help the clinic set up, the network. One answer to what a partner gets, everywhere: referral cards with its own code, flyers and a counter stand, the stand and flyers carrying an NFC tag and a QR code linked to that partner, and a staff perk card. The printed code only tells the front desk which partner a walk-in or caller came from; a tap or a scan carries the partner in its link. Partner staff get a perk from the clinic that is the same for every employee, whether or not they refer anyone; it is a perk, not a payment. The monthly report shows where new leads come from (never "which partners are working"); the clinic sends bookings and first-visit revenue as totals per partner, never names or patient records. Our fee never changes with leads, bookings or revenue, and a partner is never dropped for its lead count. The partner offer form is described in `privacy.html`; it is separate from the site's two forms. Nobody is paid per patient (medical fee-splitting rules). Keep the owner's two cross-promotion lines as they are ("Cross-promotion. Each side promotes the other, including nearby trainers and studios." and "Partners promote each other. Nobody is paid per patient.") and add no other promotion statements. Never bring back the removed sentence that each place promotes the clinic and the clinic promotes them back, or any "both ways" line. Keep events out of the network copy.
- Flyer drops follow our flyer drop agreement: each location gets its own fourteen businesses and two field days a month, seven a day, on a weekly rotation; a visit log within five business days of each field day; the clinic chooses every business and can swap one with written notice; a business that asks is dropped; driving routes within 25 miles; the clinic supplies the printed materials (we can design and print them under a separate quote); we supply the representative, vehicle, mileage and time; the representative speaks only in the clinic's approved words. The fourteen are the businesses chosen for drops; partners from the referral network ride the same route. Keep the two pages consistent.
- The brief's seven FAQ entries (the first seven on `/faq`) stay byte-for-byte as they are; a test hashes them. CSS that changes how text wraps (`text-wrap`) is scoped to the newer entries (`.fq-more`) so the seven render as before.
- No em or en dashes in visible copy or alt text. Plain hyphens inside words (Plus-One, 15-minute) are fine; wrap a hyphenated word in `<span class="nowrap">` where it would otherwise split across lines.
- The dinner image is a placeholder until a real dinner has been photographed, and it is never captioned as one of our events. Today it is an illustration drawn in code (`assets/img/dinner-table.svg` on `/patient-dinners`, no visible caption; its alt text says it is an illustration).

## Photos and images

There are two photos, both client proof shown with the client's OK, and both are the owner's own, only cropped, with no AI edits and no EXIF data:
- The Grace Pediatrics gift-tin photo (`kit-tins.*`, `kit-tins-640.*`), on the home page (`#who-we-are`) and on `/about`, beside the line about the community marketing we ran for Grace Pediatrics. It is never called a dinner and carries no numbers or results.
- One of our tap-to-review Google stands at the front desk of Pure Medical Spa (`review-stand.*` at 732 x 1520 and `review-stand-600.*` at 600 x 1246), on `/review-tags` `#in-use` only, with the caption "Our stand at Pure Medical Spa, shown with their permission." (the `sample-cap` style, like the caption above it). It is re-cropped from the owner's original so no part of the second stand on the desk, or its QR code, is in the frame. The pictured stand is tap only, and the page says so; it also says new stands use a neutral ask such as "How did we do?". Name no other client without their OK.

Other visuals are drawn in code (SVG or HTML and CSS, rasterised with Playwright where a bitmap is needed). AI-made images are allowed only as clearly captioned sample mockups: today that means the two ETHR LAB mockups on `/referral-network` (`ethr-mockup-stand*` and `ethr-mockup-tap*`, made with an image generator, saved as JPEG and WebP at 1200 and 600 px wide with no metadata), each captioned "Sample mockup made for this page, not a photo of a real gym." with alt text that says it is a sample mockup. Never present an AI image as a photo, a client or a result. The home hero is `assets/img/hero-map.svg`: your clinic at the hub, with offices (referral network), small businesses (flyer drops), training facilities (partner referrals), restaurants (sponsored events, where the patient dinners happen) and neighborhoods (Google Ads); the school is unlabelled scenery.

Share image: `assets/img/og-best-patients.jpg` (1200 x 630, headline "Your best patients bring the next ones.") on every page that has share tags. Social platforms cache link previews by image URL, so when the share image changes, save it under a new file name and update `og:image` on every page, then re-scrape the home page in the Facebook Sharing Debugger and the LinkedIn Post Inspector. `og-dinners.jpg`, `og-community.jpg` and `og.jpg` are byte-for-byte copies of `og-best-patients.jpg`, so links shared earlier (which still point at those names) show the new art once a platform re-scrapes them.

`assets/img` holds only what a page uses (a test checks it): `hero-map.svg`, `dinner-table.svg`, the Grace Pediatrics photo (`kit-tins*`), `owo-logo.png`, the share images, the `review-tag*` and `website-redesign*` illustrations, the Pure Medical Spa stand photo (`review-stand*`) and the two ETHR LAB sample mockups (`ethr-mockup-*`).

Type: Bricolage Grotesque (display) and Figtree (text), self-hosted, OFL. The ETHR LAB example uses the system serif (Georgia) for the studio's wordmark and quote; no font is added for it. Shared UI lives in `assets/site.css` (the page-level styles added on October 22, 2026 use the prefixes `pg-` for every page, `hm-` home, `rn-` referral network, `et-` the ETHR LAB example, `fd-` flyer drops, `ga-` Google Ads, `ab-` about, `fq-` FAQ and `ct-` contact); shared behaviour (contact email, header, menu, reveal, the old home anchors) in `assets/site.js`. `site.js` also catches an old link whose query string a redirect left after the fragment (`/#call?package=website`): it moves the query in front of the `#` and opens the section. Still check `/estimate?package=website` and `/?about=flyer-drops` on a Netlify deploy preview.

Favicons: `favicon.ico` (16, 32 and 48 px), `assets/favicon.svg`, `apple-touch-icon.png` and `site.webmanifest` (with `assets/icon-192.png` and `assets/icon-512.png`) are linked from every page. `assets/favicon-32.png` and `assets/favicon-180.png` are no longer linked but stay, with the new mark, for old cached pages that still point at them; `assets/favicon-16.png` and `assets/favicon-48.png` are spare PNG copies of the sizes inside `favicon.ico`.

## Tests

No dependencies are needed for the unit tests (Node 18+):

```
node --test
```

This runs:
- `tests/pages.test.mjs`: every page has one h1, its own title, description, canonical and share tags; the header (with the right tab marked `aria-current="page"`) and the footer ("On this site" lists every page) are identical on every page; breadcrumbs; every "Book a 15-minute call" link goes to `/contact` with a known `?about=` key; each page's content (the dinners, the referral network and its ETHR LAB example with no price and no gym names, the flyer drop schedule, Google Ads with no invented features, about, the FAQ and its locked seven); and the site-wide copy rules (no fee figures in any text file, tests included; no names from the source documents; only the two kept promotion lines; nobody paid per patient; no promised results, callback times or lead counts).
- `tests/call.test.mjs`: the `dinner-call` form on `/contact` (fields, honeypot, labels, errors), `thanks.html`, and unit tests for the form rules and the `?about=` prefill in `assets/call.js`.
- `tests/assets.test.mjs`: every local file a page references exists, every page links the root-absolute favicon set, the favicons are real artwork, removed images and deleted files stay gone, every page's `.html` URL and every retired page has a forced 301 to the right page in `netlify.toml` (fragments included), the `/?about=` query rule, redirects have no chains and catch no page or asset, no page links a retired page, and `sitemap.xml` lists every indexable page. It also checks that `assets/img` holds only images something uses; the stand photo's size, crop and missing EXIF; the ETHR LAB mockups when present; that the `expo-vendor` form block and its script are byte-for-byte unchanged; that no page has an em or en dash in its copy, alt text or meta tags, or a duplicate id; that the sample brand is disclosed exactly where it is shown; and that the privacy and terms pages describe today's offer and forms and agree with each other.
- `tests/html.mjs` holds the shared helpers and the list of pages (it is not a test file).

End-to-end check of the call form (needs a local server and Playwright; not part of `node --test`):

```
node tests/e2e-call.mjs
```

It runs against `http://localhost:8770/contact` by default (set `E2E_BASE_URL` to change the server) and refuses any non-local host. Every form POST is intercepted, so nothing is ever submitted. It fails if any stylesheet, script, font or image on `/contact` or `/thanks` returns an error, and checks the `?about=` prefills, the `/?about=flyer-drops` redirect to `/contact?about=flyer-drops`, the old home anchors (`/#faq` opens `/faq`), `/estimate?package=...` and the `/#call?package=...` fallback in `site.js`. The local server must apply the `netlify.toml` redirects, including the query rule, the way Netlify does.
