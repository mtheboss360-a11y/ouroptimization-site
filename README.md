# ouroptimization.com

Our Wellness Optimization (a brand of OUR Optimization LLC): **community-based marketing for local businesses**. We study your market, find where your customers live, shop and gather, and build the campaign to reach them, in print, in person and online.

Static HTML/CSS/JS, no build step, no dependencies, no third-party requests.

## Deploy

Netlify site linked to this repo, branch `main`. No build command; publish directory `.` (set in `netlify.toml`). Pull requests get a Netlify deploy preview.

The campaign-estimate form uses **Netlify Forms** (no function, no secrets):
- **Site configuration → Forms → Enable form detection** must be on. After turning it on the first time, redeploy.
- Email alerts: **Site configuration → Notifications → Form submission notifications → Add notification → Email notification**, form `campaign-estimate`, to mustafa@ouroptimization.com.
- Submissions are also listed under **Forms** in the Netlify UI.
- After changing form fields, redeploy so Netlify re-reads the form. The field list lives in the static HTML of `estimate.html`, including the hidden `business_type_other` field.

The **Baby & Kids Health Expo** practice sign-up page (`expo-vendors.html`, `/expo-vendors`, short link `/vendors`) uses a second Netlify form, `expo-vendor`, set up the same way. Add an email notification for it so each table request reaches you. The page is `noindex`; update the "Where" and "When" facts once the venue and date are set. Parent follow-up requests at the expo are collected outside this site (a Google Form and Sheet per practice, each with its own QR code).

## URLs

Clean, extensionless URLs are canonical (`/how-it-works`, not `/how-it-works.html`). Internal links, canonical tags, `og:url` and `sitemap.xml` all use them, and `netlify.toml` 301-redirects every old `.html` URL to its clean URL. Other redirects:
- `/who-its-for` → `/industries`
- `/landing` → `/direct-mail` (the old direct-mail ad page was retired)
- `/vendors` → `/expo-vendors` (short link for practice outreach)
- `/tests/*` and `/README.md` return 404 (repository-only files)

## Structure

| Page | Purpose |
|---|---|
| `index.html` | Community map hero ("Marketing targeted to your service niches and community", meeting-first buttons); community → channel map; 7-step model; 8 strategy pillars (pillar 02, Community Marketing & Events, includes the events we host); community event hosting section as part of the plan (Reserve a Table → `/vendors`); physical + digital; industries; an example campaign; working together (`#working-together`: the Digital Growth Package and what it includes, no price) |
| `how-it-works.html` | The 7-step operating model in detail |
| `services.html` | The 8 strategy pillars and how they work together |
| `community-marketing.html` | The core differentiator: touchpoints, sponsorships and partnerships, events, language, and **Our approach** (`#our-approach`), the one place the demographic-information statement lives (with one FAQ answer) |
| `custom-marketing.html` | Materials organized by where they are used |
| `digital-marketing.html` | Digital as a layer on the local strategy; the **Digital Growth Package** card (`#package`: what the package includes, no price) |
| `industries.html`, `examples.html` | Industry cards (challenge + channels); example campaigns for the sample brands |
| `estimate.html` + `assets/estimate.js` | Strategy-meeting request form (Netlify form `campaign-estimate`; validation and submission script). `/meeting` redirects here. `?package=digital` prefills the package's channels and shows a one-line note. |
| `events.html` | Community Event Hosting: how our events work, the next event, other community events. Part of the Community Marketing pillar (the nav marks Community Marketing as its section); linked from the homepage, services, FAQ, community marketing page and footer. |
| `website-design.html` | Website Redesign service: what we build, how a redesign runs, what we need, scope note (separate from the Digital Growth Package). CTAs use `/estimate?package=website`. |
| `review-tags.html` | Tap-to-review NFC tags (QR on the same piece) that open the client's own Google review link directly, with the review rules (ask everyone, no incentives, no staff reviews). Separate from the Digital Growth Package. CTAs use `/estimate?package=reviews`. |
| `expo-vendors.html` | Baby & Kids Health Expo practice table requests (Netlify form `expo-vendor`, inline validation script). Standalone header with no site nav. `/vendors` redirects here. |
| `market-research`, `direct-mail`, `flyers`, `marketing-kits`, `seo`, `google-ads`, `social-media`, `groupon` (Promotional Platforms), `gift-cards` (offer strategy), `tracking`, `sample-advertisements`, `faq`, `privacy`, `terms` | Pillar detail and supporting pages |

No prices: the site publishes no prices or quote language for our own services (no package price, no event-table price, no "quoted after the meeting" notes). Dollar amounts on sample ads, sample campaigns and mockups are placeholder offer values that show what a client's ad looks like, and `terms.html` keeps the legal quote and payment clauses. Keep it that way unless the owner asks for prices to go back on the site.

Shared UI lives in `assets/site.css` (`.cc` community → channel rows, `.journey`, `.ind-meta`, `.excase`/`.ex-flow`).

Integrative Wellness and Integrative Spa are sample brands, not clients. That is disclosed in the footer and in one sentence in the /examples and /sample-advertisements intros; example visuals carry no per-image labels, and the examples contain no results or performance figures. The `mockup-01`–`04` images on /sample-advertisements are campaign mockups prepared for real med spas, with business details blurred; they are never presented as client work. Grace Pediatrics (Glendale Heights, IL) is a real client, shown by name with the practice's permission in the home page `#client-work` section and in the captions and alt text of the `kit-tins` photo (home page and /marketing-kits hero); these show the work we did and claim no results. Add a result only with the client's written OK and figures that back it. Its photos and video are `assets/img/grace-*` (EXIF and location metadata stripped; WebM first, MP4 fallback) and `assets/img/kit-tins.*` / `kit-tins-640.*`. Service area: nationwide (US). Type: Bricolage Grotesque (display) and Figtree (text), self-hosted, OFL.

Images: the sample visuals (scenes, merch, mailers, ads, deal pages and the home page map) are flat illustrations and layouts drawn in code (SVG or HTML and CSS, rasterised with Playwright). That includes `kit-tins-b*`, the Keepsake tins tile on /marketing-kits: a code-drawn illustration of Integrative Wellness sample tins, not a photo. The photos and video on the site are the owner's own (`grace-*` and `kit-tins.*` / `kit-tins-640.*`) plus the blurred `mockup-*` campaign mockups. `kit-tins.*` is the owner's unedited photo of gift tins we branded for Grace Pediatrics, with the practice's own labels; it is captioned as Grace work on the home page and the /marketing-kits hero. Keep it unedited: never paste sample labels onto it. The QR codes inside the sample illustrations are real and open `/estimate?ref=sample-mailer` (the review stand opens `/review-tags?ref=sample-stand`).

Share image: every page's `og:image` is `assets/img/og-niches.jpg` (1200 x 630). Social platforms cache link previews by image URL, so when the share image changes, save it under a new file name and update `og:image` on every page, then re-scrape the home page in the Facebook Sharing Debugger and the LinkedIn Post Inspector. `og.jpg` and `og-community.jpg` hold the same art so older links to those paths show the current image.

Favicons: `favicon.ico` (16, 32 and 48 px), `assets/favicon.svg`, `apple-touch-icon.png` and `site.webmanifest` (with `assets/icon-192.png` and `assets/icon-512.png`) are linked from every page. `assets/favicon-32.png` and `assets/favicon-180.png` are no longer linked but stay, with the new mark, for old cached pages that still point at them; `assets/favicon-16.png` and `assets/favicon-48.png` are spare PNG copies of the sizes inside `favicon.ico`.

## Tests

No dependencies are needed for the unit tests (Node 18+):

```
node --test
```

This runs both unit test files:
- `tests/estimate.test.mjs` covers the form validators in `assets/estimate.js`.
- `tests/assets.test.mjs` guards the static assets: every local file a page references (src, srcset, data-zoom, poster, file hrefs, og:image) exists, every page links the root-absolute favicon set, the manifest icons match their declared sizes, the favicon PNGs are real artwork and not near-black squares, and the removed AI hero images stay gone.

`tests/e2e-estimate.mjs` is a Playwright end-to-end check of the form. It needs a local server and Playwright; every form POST is intercepted, so nothing is ever submitted. It refuses to run against the production domain.
