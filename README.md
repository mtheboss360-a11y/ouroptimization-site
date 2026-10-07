# ouroptimization.com: 2026 repositioning

Our Wellness Optimization (a brand of OUR Optimization LLC) as **Demographic & Community-Targeted Marketing**: we study your market, find where your customers are, and build the campaign to reach them.

This folder is the complete Netlify site, built on the uploaded `our-wellness-optimization-site.zip` source. Static HTML/CSS/JS, no build step.

## Deploy

Netlify site linked to this repo, branch `main`. No build command; publish directory `.` (set in `netlify.toml`).

The campaign-estimate form uses **Netlify Forms** (no function, no secrets):
- **Site configuration → Forms → Enable form detection** must be on. After turning it on the first time, redeploy.
- Email alerts: **Site configuration → Notifications → Form submission notifications → Add notification → Email notification**, form `campaign-estimate`, to mustafa@ouroptimization.com.
- Submissions are also listed under **Forms** in the Netlify UI.
- `/who-its-for` 301-redirects to `/industries` (see `netlify.toml`).

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Positioning, process, differentiator, community, language, physical + digital, materials, direct mail, industries, examples, pricing |
| `how-it-works.html` | Six-step process, what we research, carrier-route mail planning, how demographic/community information is used |
| `services.html` | 12-service grid, offers and promotional channels (Groupon), pricing |
| `community-marketing.html` | Touchpoints, sponsored events, flyer marketing, language and localization |
| `custom-marketing.html` | Branded materials, marketing kits (real photo), targeted direct mail |
| `digital-marketing.html` | Local SEO, Google Ads, Facebook/Instagram, physical + digital |
| `industries.html` | Med spas, dental, pediatric, chiropractic, PT, beauty and wellness |
| `market-research.html`, `direct-mail.html`, `flyers.html`, `marketing-kits.html`, `events.html` | Physical and community service pages, each with a "what success looks like" section |
| `google-ads.html`, `seo.html`, `social-media.html`, `groupon.html` | Digital and promotional service pages |
| `examples.html` | Two illustrative Example Spa campaigns, clearly labelled as fictional |
| `estimate.html` | Campaign estimate form (new fields: primary goal, target service, monthly budget, channels) |
| `sample-advertisements.html`, `gift-cards.html`, `tracking.html`, `faq.html`, `privacy.html`, `terms.html` | Kept and updated for the broader scope |
| `landing.html` | Unchanged noindex direct-mail ad landing page (brand updated only) |
