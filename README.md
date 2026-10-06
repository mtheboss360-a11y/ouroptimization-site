# ouroptimization.com: 2026 repositioning

OUR Optimization as **Demographic & Community-Targeted Marketing**: we study your market, find where your customers are, and build the campaign to reach them.

This folder is the complete Netlify site, built on the uploaded `our-wellness-optimization-site.zip` source. Same stack as before: static HTML/CSS/JS, no build step, plus one function.

## Deploy

Deploy **this whole folder** as the Netlify site root (`netlify.toml` sets `publish = "."` and `functions = "netlify/functions"`).

- Keep `netlify/functions/estimate.js` and `emails/campaign-estimate/`. The estimate form posts to the function, and the function sends the email. A drag-and-drop deploy of only the HTML would break the form.
- Environment variables are unchanged: `NETLIFY_EMAILS_SECRET` (required), plus optional `ESTIMATE_TO_EMAIL` and `ESTIMATE_FROM_EMAIL`.
- `/who-its-for` now 301-redirects to `/industries` (see `netlify.toml`).

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
| `examples.html` | Two illustrative sample campaigns, clearly labelled, with no performance figures |
| `estimate.html` | Campaign estimate form (new fields: primary goal, target service, monthly budget, channels) |
| `sample-advertisements.html`, `gift-cards.html`, `tracking.html`, `faq.html`, `privacy.html`, `terms.html` | Kept and updated for the broader scope |
| `landing.html` | Unchanged noindex direct-mail ad landing page (brand updated only) |
