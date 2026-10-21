# ouroptimization.com

Our Wellness Optimization (a brand of OUR Optimization LLC) is a local marketing company in Chicago's western suburbs. The site's main offer is **private patient dinners for independent med spas**, and the referral network around the clinic:

- **The Plus-One Dinner** (new patients): about 15 of the clinic's favourite patients each bring a friend who is not a patient yet.
- **The VIP Night** (existing patients): up to 30 of the clinic's best patients, an evening built around a new treatment or package. For spas whose books are already full.

At both, the owner gives a short talk and makes an offer they have approved, and guests can book on the night. It is a sales evening and the site says so. No price figure appears on the site (removed at the owner's request on October 21, 2026: a number up front scares people off). The site says each dinner gets one fixed quote, restaurant and food included, given after the 15-minute call and fixed in writing before the clinic commits, with no monthly contract. Add-ons: the referral network (offices, small businesses, training facilities and restaurants near the clinic), flyer drops, and Google Ads as the cherry on top (the clinic pays Google directly, in its own account).

Static HTML/CSS/JS, no build step, no dependencies, no third-party requests.

## Deploy

Netlify site linked to this repo, branch `main`. No build command; publish directory `.` (set in `netlify.toml`). Pull requests get a Netlify deploy preview. Show the owner a deploy preview before anything goes to production.

Forms use **Netlify Forms** (no function, no secrets):
- **Site configuration > Forms > Enable form detection** must be on. After turning it on the first time, redeploy.
- **`dinner-call`**: the "Book a 15-minute call" form on the home page (`index.html`, `#call`, script `assets/call.js`). It posts to `/thanks` (`thanks.html`, `noindex`) and has a `bot-field` honeypot. Fields: `name`, `clinic`, `phone`, `email` (optional), `town`, `best_time`, `dinner` (Plus-One Dinner / VIP Night / Not sure yet) and `message` (optional), with the line "Please don't include any patient information." Links from other pages use `/?about=website-design#call` and `/?about=review-tags#call`, which prefill the message.
- **`expo-vendor`**: the **Baby & Kids Health Expo** practice sign-up page (`expo-vendors.html`, `/expo-vendors`, short link `/vendors`). Printed QR codes may point at it: do not change its URL or form name. The page is `noindex`; update the "Where" and "When" facts once the venue and date are set. Parent follow-up requests at the expo are collected outside this site (a Google Form and Sheet per practice, each with its own QR code).
- Email alerts: **Site configuration > Notifications > Form submission notifications > Add notification > Email notification**, one for each form, to mustafa@ouroptimization.com. Submissions are also listed under **Forms** in the Netlify UI.
- After changing form fields, redeploy so Netlify re-reads the form from the static HTML.
- The old `campaign-estimate` form (`estimate.html`) is retired. Any past submissions can still be viewed or deleted under Forms in the Netlify UI, and the privacy policy covers them.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Home. Community map hero (h1 "Your best patients bring the next ones." under the eyebrow "Patient dinners for independent med spas"), then `#formats` (the two dinners and the "No surprises" pricing card, with no figure), `#how` (plan, invitations, the night, the follow-up), `#handle` (what we handle, and "Your patient list stays yours. We never see it."), `#who` (who we are), `#add-ons` (`#referrals` referral network, then flyer drops, then Google Ads last), `#faq` (seven questions) and `#call` (the `dinner-call` form). |
| `thanks.html` | Thank-you page the call form posts to. `noindex`, not in the sitemap. |
| `website-design.html` | Website redesign. CTAs go to `/?about=website-design#call`. |
| `review-tags.html` | Tap-to-review NFC tags (QR on the same piece) that open the client's own Google review link, with the review rules (ask everyone, no incentives, no staff reviews). CTAs go to `/?about=review-tags#call`. |
| `expo-vendors.html` | Baby & Kids Health Expo practice table requests (form `expo-vendor`, inline validation script). Same site header and footer as every other page; the expo content and form are unchanged. `noindex`. |
| `privacy.html`, `terms.html` | Privacy policy (describes the `dinner-call` and `expo-vendor` forms, and what we see of guests' RSVP replies) and terms of service (the dinners, the add-ons, how prices are agreed with no figure, and both forms). Both last updated October 21, 2026; the October 2026 wording still needs Mustafa's OK before launch. |
| `404.html` | Not-found page. Root-absolute asset paths so it works at any depth. |

Every page carries the same header and footer (only the last footer line differs, as below). Header nav: Home (`/`), Patient Dinners (`/#formats`), How It Works (`/#how`), Referral Network (`/#referrals`), FAQ (`/#faq`), and "Book a 15-minute call" (`/#call`). Footer: the logo and a one-line description, "Talk to Mustafa" (phone and email links), "On this site" (the four home sections, Website Redesign and Review Tags) and "Legal" (privacy, terms). The review tag and website redesign illustrations show Integrative Wellness, a sample brand and not a client: each has a caption under it ("Sample design. Integrative Wellness is a sample brand we use to show our work, not a client."), "a made-up brand" in its alt text, and the footer line "Integrative Wellness is a sample brand used to show our work." Pages that show no sample brand carry no such line (the expo page says instead that the expo is organized by Our Wellness Optimization).

## URLs and redirects

Clean, extensionless URLs are canonical (`/privacy`, not `/privacy.html`). Internal links, canonical tags, `og:url` and `sitemap.xml` use them, and `netlify.toml` 301-redirects each kept page's `.html` URL to its clean URL (`/index.html` to `/`, `/thanks.html` to `/thanks`, and so on).

**Retired pages.** In October 2026 the old community marketing service pages were retired. Their `.html` files are deleted, and both `/name` and `/name.html` 301 (forced) to the home page or the closest home section:

| Retired | Now goes to |
|---|---|
| `/how-it-works` | `/#how` |
| `/services`, `/industries`, `/examples`, `/sample-advertisements` | `/` |
| `/community-marketing`, `/market-research` | `/#referrals` |
| `/custom-marketing`, `/digital-marketing`, `/direct-mail`, `/flyers`, `/seo`, `/google-ads`, `/social-media`, `/groupon`, `/gift-cards` | `/#add-ons` |
| `/estimate` | `/#call` |
| `/events` | `/#formats` |
| `/marketing-kits`, `/tracking` | `/#handle` |
| `/faq` | `/#faq` |

Older redirects point straight at their final target, with no chains: `/who-its-for` to `/`, `/landing` to `/#add-ons`, `/meeting` to `/#call`. `/vendors` and `/expo-vendors.html` go to `/expo-vendors`. `/tests/*`, `/README.md` and `/netlify.toml` return 404 (repository-only files). When adding a redirect, point it at a page that exists, never at another redirected path.

`sitemap.xml` lists only the kept, indexable pages: `/`, `/review-tags`, `/website-design`, `/privacy` and `/terms`.

## Content rules

- No fake reviews, testimonials, statistics, client logos or "as seen on". No made-up results. We're running our first patient dinners now, and the site says nothing has been run yet. Every dinner gets a results sheet; a clinic's results will be among our first case studies. Add a result only with the clinic's written OK and figures that back it.
- No medical or results claims. Never promise a number of patients, bookings or a return.
- The clinic sends invitations from its own list. We never receive, see or keep its patient list. Guests reply on an RSVP page in the clinic's name.
- Referral network: we find the businesses near a clinic using mapping software and local business data (describe it only that way: no named platform, database size or accuracy claim), then set up, or help the clinic set up, the network. Partnerships are introductions and cross-promotion, with referral cards that carry each partner's own code. Nobody is paid per patient (medical fee-splitting rules).
- No em or en dashes in visible copy or alt text. Plain hyphens inside words (Plus-One, 15-minute) are fine.
- The dinner image on the home page is a placeholder until a real dinner has been photographed, and it is never captioned as one of our events. Today it is an illustration drawn in code (`assets/img/dinner-table.svg`, no visible caption; its alt text says it is an illustration).
- The only photo is client proof in `#who`: the owner's unedited Grace Pediatrics gift-tin photo (`kit-tins.*`, `kit-tins-640.*`) beside the line about the community marketing we ran for Grace Pediatrics. It is never called a dinner and carries no numbers or results.

## Images

Visuals are drawn in code (SVG or HTML and CSS, rasterised with Playwright where a bitmap is needed). Never use AI image or video generation. The home hero is `assets/img/hero-map.svg`: your clinic at the hub, with offices (referral network), small businesses (flyer drops), training facilities (partner referrals), restaurants (sponsored events, where the patient dinners happen) and neighborhoods (Google Ads); the school is unlabelled scenery.

Share image: `assets/img/og-best-patients.jpg` (1200 x 630, headline "Your best patients bring the next ones.") on every page that has share tags. Social platforms cache link previews by image URL, so when the share image changes, save it under a new file name and update `og:image` on every page, then re-scrape the home page in the Facebook Sharing Debugger and the LinkedIn Post Inspector. `og-dinners.jpg`, `og-community.jpg` and `og.jpg` are byte-for-byte copies of `og-best-patients.jpg`, so links shared earlier (which still point at those names) show the new art once a platform re-scrapes them.

Images used only by the retired pages, the old hero (`hero-community.svg`) and the other Grace Pediatrics photos and video were deleted in October 2026. `assets/img` holds only what a kept page uses: `hero-map.svg`, `dinner-table.svg`, the Grace Pediatrics gift-tin photo (`kit-tins*`), `owo-logo.png`, the share images, and the `review-tag*` and `website-redesign*` illustrations.

Type: Bricolage Grotesque (display) and Figtree (text), self-hosted, OFL. Shared UI lives in `assets/site.css`; shared behaviour (contact email, header, menu, reveal) in `assets/site.js`. `site.js` also catches an old link whose query string a redirect left after the fragment (`/#call?package=website`): it moves the query in front of the `#` and opens the section. Still check `/estimate?package=website` on a Netlify deploy preview.

Favicons: `favicon.ico` (16, 32 and 48 px), `assets/favicon.svg`, `apple-touch-icon.png` and `site.webmanifest` (with `assets/icon-192.png` and `assets/icon-512.png`) are linked from every page. `assets/favicon-32.png` and `assets/favicon-180.png` are no longer linked but stay, with the new mark, for old cached pages that still point at them; `assets/favicon-16.png` and `assets/favicon-48.png` are spare PNG copies of the sizes inside `favicon.ico`.

## Tests

No dependencies are needed for the unit tests (Node 18+):

```
node --test
```

This runs:
- `tests/call.test.mjs`: static checks of the home page and `thanks.html` (sections, copy rules, nav, the `dinner-call` form markup) and unit tests for the form rules in `assets/call.js`.
- `tests/assets.test.mjs`: every local file a page references exists, every page links the root-absolute favicon set, the favicons are real artwork, removed images and deleted files stay gone, every retired page has a forced 301 to its section in `netlify.toml`, redirects have no chains and catch no kept page or asset, no page links a retired page, and `sitemap.xml` lists only the kept, indexable pages. It also checks that `assets/img` holds only images something uses, plus `og.jpg` and `og-community.jpg` as copies of `og-dinners.jpg`; that the `expo-vendor` form block and its script are byte-for-byte unchanged (stored SHA-256, plus its name, form-name value and field names); that no kept page has an em or en dash in its copy, alt text or meta tags, or a duplicate id; that the sample brand is disclosed exactly where it is shown; and that the privacy and terms pages describe today's offer and forms.

End-to-end check of the call form (needs a local server and Playwright; not part of `node --test`):

```
node tests/e2e-call.mjs
```

It runs against `http://localhost:8770` by default (set `E2E_BASE_URL` to change it) and refuses any non-local host. Every form POST is intercepted, so nothing is ever submitted. It fails if any stylesheet, script, font or image on the home page or `/thanks` returns an error, and checks the `/#call?package=...` fallback in `site.js`.
