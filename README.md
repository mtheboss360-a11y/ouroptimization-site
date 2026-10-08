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

## URLs

Clean, extensionless URLs are canonical (`/how-it-works`, not `/how-it-works.html`). Internal links, canonical tags, `og:url` and `sitemap.xml` all use them, and `netlify.toml` 301-redirects every old `.html` URL to its clean URL. Other redirects:
- `/who-its-for` → `/industries`
- `/landing` → `/direct-mail` (the old direct-mail ad page was retired)
- `/tests/*` and `/README.md` return 404 (repository-only files)

## Structure

| Page | Purpose |
|---|---|
| `index.html` | Community map hero; community → channel map; 7-step model; 8 strategy pillars; physical + digital; industries; an illustrative campaign; pricing approach |
| `how-it-works.html` | The 7-step operating model in detail |
| `services.html` | The 8 strategy pillars and how they work together |
| `community-marketing.html` | The core differentiator: touchpoints, sponsorships and partnerships, events, language, and **Our approach** (`#our-approach`), the one place the demographic-information statement lives (with one FAQ answer) |
| `custom-marketing.html` | Materials organized by where they are used |
| `digital-marketing.html` | Digital as a layer on the local strategy |
| `industries.html`, `examples.html` | Industry cards (challenge + channels); illustrative Example Spa campaigns |
| `estimate.html` + `assets/estimate.js` | Campaign estimate form (validation and submission script) |
| `market-research`, `direct-mail`, `flyers`, `marketing-kits`, `events`, `seo`, `google-ads`, `social-media`, `groupon` (Promotional Platforms), `gift-cards` (offer strategy), `tracking`, `sample-advertisements`, `faq`, `privacy`, `terms` | Pillar detail and supporting pages |

Shared UI lives in `assets/site.css` (`.cc` community → channel rows, `.journey`, `.ind-meta`, `.excase`/`.ex-flow`, `.badge-illus`).

Example Spa is a fictional business. Every example visual carries an "Illustrative" label, and the examples contain no results or performance figures.

## Tests

No dependencies are needed for the unit tests (Node 18+):

```
node --test
```

This runs `tests/estimate.test.mjs`, which covers the form validators in `assets/estimate.js`.

`tests/e2e-estimate.mjs` is a Playwright end-to-end check of the form. It needs a local server and Playwright; every form POST is intercepted, so nothing is ever submitted. It refuses to run against the production domain.
