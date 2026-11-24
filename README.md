# ouroptimization.com

**Local Impressions** ("Meet the local businesses your next customers already trust.") is a service of OUR Optimization LLC, a local company in Chicago's western suburbs (Franklin Park, Oak Brook, Lombard, Elmhurst, Naperville, Downers Grove, Hinsdale). The idea the site is built around (November 23, 2026): "We connect you with the businesses that already share your customers, and never with your competitors." Our team visits the businesses near a client, introduces the client's business to their staff, and tracks every visit and sign-up in the client portal. The site has one job: get an owner to book a 15-minute call.

November 24, 2026: the business was renamed **Local Impressions** (it was Our Local Network, and before that Our Wellness Network; both stay in the structured data as `alternateName`). The logo keeps the mark; "Local" stays in gold and "Impressions" is set in the same serif (Newsreader). The domain, the email address, the portal address and the legal name, OUR Optimization LLC, are unchanged.

Static HTML/CSS/JS, no build step on Netlify, no dependencies, no third-party requests. The industry pages are generated locally by `tools/build-industries.mjs` and committed (see Industry pages).

## Deploy

Netlify site "ouroptimization", linked to this repo, branch `main`. No build command; publish directory `.` (set in `netlify.toml`). Pull requests get a numbered deploy preview (`deploy-preview-N--ouroptimization.netlify.app`). The owner approves a deploy preview before anything goes to production.

## Pages

| URL | File | In the menu | Notes |
| --- | --- | --- | --- |
| `/` | `index.html` | Home | Five beats around the idea (November 23, 2026). 1. The hero (no buttons; November 24, 2026, the owner's words): "Meet the local businesses your next customers already trust." then "We find nearby businesses that serve the same kinds of people you do, then introduce your business and help build referral relationships. No direct competitors." over the half orb (`assets/home-orb.js`), with the owner's photos of three counter displays. 2. `#industries` "Who shares your customers": six kinds of business, each with one plain line, then "Pick your industry to see your matches." and the industry cards. 3. `#never` "Who we never connect you with": no competitors, one of your kind (when our team visits, each partner agrees to promote one business of your kind), you approve every name. 4. `#in-person` "How the connection is made": the coffee and treats in their own card (the only mention of treats on the page), the tap-to-schedule card, the one-page partner agreement, the portal ("Your portal logs each visit."), and the "Your words only" note; then, inside the same beat, `#levels` (a sub-block, not a section): "Your team visits" and "Our team visits", with "See what each level includes". 5. `#dashboard` "What you see": the portal tour, "Example results from a demo account." and the five figures. Then the hidden testimonial and the closing call (`#book`, the phone number). The old `#network`, `#treats` and `#compliance` sections are gone. |
| `/field-team` | `field-team.html` | Field Team | What the field team does on every visit: Treats for Staff (modest: coffee, pastries and snacks), drop-offs (your displays and a tap-to-schedule card for each staff member), every stop tracked. The partner agreement is signed when our team visits (November 23, 2026). Was `/boots-on-the-ground` (301). |
| `/#industries` | (home section) | Industries | The menu item jumps to the home page's "Who shares your customers" beat: the six kinds of business, then the industry cards. `/industries` itself still 301s home (an old page). |
| `/industries/<slug>` | `industries/<slug>.html` | no | Eight industry pages: med-spas, dental, chiropractic-physical-therapy, gyms-fitness-studios, salons-barbershops, restaurants-cafes, home-services, auto-shops. Generated; do not edit by hand. The med spa page is "focused" (November 23, 2026): after its hero it follows the home page's beats (`#partners`, `#never`, `#visits`, `#see` "What you see" in words, then the questions and the call), with no scenes, no portal screenshot and no demo figures. Its partner lines are its own (yoga and pilates, nail salons rewritten so none repeats the home page). The other seven keep the full template; their exclusivity line and their partner agreement note start "When our team visits". |
| `/referral-network` | `referral-network.html` | How it works | Matching (November 23, 2026: one short beat, businesses near you that already serve your customers, never a competitor, you approve the list; no claim about software), the route, the tap-to-schedule staff cards, a typical month, the portal, the partner agreement (signed when our team visits), who does what (`#levels`: "Your team visits" and "Our team visits"; we make the displays with your team, or you make them; the buttons still link to `/contact?about=level-1` and `?about=level-2`). Every anchor other pages link to stays. |
| `/faq` | `faq.html` | FAQ | Short answers that point to the page that explains each topic: visits and treats, how it works (with the add-ons, `#add-ons`), partners and results, leads and data, healthcare practices. November 23, 2026: every question has a real answer; the add-ons answer names three add-ons in their own pages' words (tap-to-review tags, Google Ads in your own account, a website redesign); "Is there a page for my kind of practice?" links all eight industry pages; the displays answer says your team makes them either way; the 30-day guarantee appears here once, word for word as in the terms. |
| `/about` | `about.html` | About | Who we are, our story (`#story`, November 23, 2026: Mustafa Siddiqui, his mom Dr. Farhana's pediatric clinic, the flyers he ran himself, its growth from 380K to more than 800K in revenue, and that clients work with him directly; add nothing he has not said), how we work, what we put in writing (the one-page partner agreement, signed when our team visits). |
| `/contact` | `contact.html` | Contact | The call form (see Forms). |
| `/online-search-network` | `online-search-network.html` | no | Add-on: Google Ads in your own account ("Your ads can be there when they do."). |
| `/review-tags` | `review-tags.html` | no | Add-on: tap-to-review tags. Keep the URL (printed tags may point at it). |
| `/website-design` | `website-design.html` | no | Add-on: a website. Keep the URL. |
| `/portals` | `portals.html` | Portals | The three portals: owner, front desk and runner, and what each login sees. Sign-ups reach your portal, and us; in the portal only you and your front desk see names and numbers, and our team's logins see counts; partners never see who signed up (November 23, 2026). On phones it sits under More. |
| `/expo-vendors` | `expo-vendors.html` | no | Baby & Kids Health Expo table requests (noindex). Its header is the logo plus the Book a call button (November 23, 2026), with no menu and no portal button. Keep the URL and the form (byte for byte). |
| `/privacy`, `/terms` | `privacy.html`, `terms.html` | footer | Terms last updated November 21, 2026. |
| `/thanks` | `thanks.html` | no | The call form's confirmation (noindex). |
| (any unknown URL) | `404.html` | no | Served with status 404. |

Every page shares the same header (the menu: Home, Field Team, Industries, How it works, Portals, FAQ, About, Contact, then a Book a call button to /contact (in the pinned menu row on desktop) and a quieter Client Portal button to https://www.ournetworkportal.com, which reads "Portal" on phones and moves under More below 380px (November 23, 2026); on phones the bottom tab bar: Home, Field Team, Industries, How it works, More) and the same one-line footer ("Local Impressions is a service of OUR Optimization LLC.", Privacy Policy, Terms of Service). The one exception is `/expo-vendors`: the logo and the Book a call button only. Every page also shares the home page's structured data and the share image's description (a test checks both).


November 21, 2026: same pages, tabs and section order as before, simpler wording on every page, and no pricing anywhere: `/pricing` (and `/pricing.html`) 301s to `/contact`. The section that held only campaign length and commitment terms came off How it works.

## Industry pages (`tools/`)

Each industry is one JSON file in `tools/industries/<slug>.json` (partner business types, treat examples, notes, questions, title and description). A data file with `"focused": true` (today only `med-spas.json`) builds the home page's beats instead of the full template; it needs `people`, `competitors` and an `icon` on each partner, has no `notes`, `notesTitle` or `exclusivity`, and has 2 or 3 questions. The agreement, exclusivity and treats wording for focused pages is written once in the builder, in the words of `terms.html` and `/referral-network#agreement`. `tools/build-industries.mjs` builds `industries/<slug>.html` from one template and writes the home page's Industries cards between the `industries:start` and `industries:end` markers. The header, footer and structured data are copied from `index.html`, so change those there first.

```
node tools/build-industries.mjs           # write the pages
node tools/build-industries.mjs --check   # fail if a page is out of date (tests/industries.test.mjs runs this)
```

The healthcare pages (med-spas, dental, chiropractic-physical-therapy) carry `<!-- TODO: attorney review of courtesy program before publishing healthcare pages -->`. `/tools/*` returns 404 on the site.

## Forms (Netlify Forms)

**Site configuration > Forms > Enable form detection** must be on. Netlify reads the forms from the static HTML at deploy, so redeploy after changing a form's fields. Set an email notification per form under **Site configuration > Notifications > Form submission notifications**.

- **`dinner-call`** on `/contact`, posts to `/thanks`, honeypot `bot-field`, validated by `assets/call.js`. Fields: `name`, `clinic`, `phone`, `email` (optional), `town`, `best_time`, `dinner` (what to talk about: Referral routes / Online search / review tags / website / Patient dinner / Not sure yet; the field keeps its old name so Netlify keeps one column) and `message` (optional; its help text asks for no patient information). Links like `/contact?about=pricing` prefill the message; the keys are in `assets/call.js`. `?about=level-1` and `?about=level-2` keep their keys but prefill in plain words ("I'm interested in my team visiting the businesses." and "I'm interested in your team visiting the businesses.").
- **`expo-vendor`** on `/expo-vendors`: unchanged, byte for byte (a test pins it). The family QR-code forms for the expo live outside this repo; do not move their routes or endpoints.

## Switches (`assets/site-config.js`)

- `hipaaConfirmed` (default `false`) and `hipaaText` (default empty): a HIPAA sentence on the healthcare industry pages and the FAQ. Leave both off until the owner has confirmed it is true for every healthcare client (business associate agreements, a documented risk assessment, safeguards for the sign-ups the portal holds). This file is public, so no unconfirmed claim goes in it.

## The orbs and the portal tour (home, `/field-team`, `/referral-network`)

The home hero carries the half orb the owner picked (`assets/home-orb.js`, first shipped October 24, 2026): a green dot-orb rising from the corner, your business at its gold centre, and six illustrated owners (a first name and a kind of business, never a real person or business) connecting to it. It builds once per visit, keeps the owners clear of the words and sits above the phone tab bar. How it works uses the same orb, whole (`assets/match-orb.js`).


Four portal screens (`assets/img/portal2-*`, the portal's demo account: invented businesses and figures; the five figures under them, 35, 207, 262, 64 and 37, are recomputed from the portal's samples/field-log.sample.json and labelled "Example results from a demo account." on the home and Field Team pages, November 23, 2026) behind tabs styled as the portal's side rail. No visible sample labels (the owner's call, November 21, 2026); the alt text says the screens are from the sample account.


## Brand assets

- Logo lockup (the infinity-W mark over "Local Impressions": "Local" in gold, "Impressions" in Newsreader, on the same baseline): `assets/img/own-logo-360.{webp,png}` (360 x 130) in the header, `assets/img/own-logo.png` (480 x 174) for structured data.
- The mark alone: `assets/img/owc-mark-light.{webp,png}` for light backgrounds, `assets/img/owc-mark-on-dark.{webp,png}` for dark ones (the closing band).
- Favicons (the mark on a cream square): `favicon.ico`, `apple-touch-icon.png`, `assets/owo-favicon.ico`, `assets/owo-icon-{16,32,192,512}.png`, `assets/owo-apple-touch-icon.png`, `assets/favicon-*.png`, `assets/icon-*.png`; the manifest is `site.webmanifest`.
- Share image: `assets/img/og-network.jpg` (1200 x 630): the logo above "Meet the local businesses your next customers already trust." (November 24, 2026; rendered with `assets/img/own-logo.png`, because the `logo.png` in the old share image generator is the retired logo). Every page's `og:image:alt` describes it that way. The old share images and the old logo 301 to the new ones.
- Business matching illustration: `assets/img/matching-map-*` (on `/referral-network`, labelled "Example").
- Field team illustration: `assets/img/team-visit-{480,768,1080}.{avif,webp}`, clay figurines made with Higgsfield in the hero's style (not real people).
- Portal screenshots: `assets/img/portal2-*`, from the portal's sample account (a fictional business, invented partner names, street addresses reduced to towns). The business names, and the Partners screen's notice about real businesses, are covered with grey bars (November 21, 2026), so no business is shown.

Fonts: headlines in Plus Jakarta Sans and Inter as the text fallback, both self-hosted (SIL Open Font License, licences in `assets/fonts/`). Text uses the phone's own face first: SF Pro on Apple devices, Roboto on Android. The big brands' own faces (Google Sans, SF Pro as a web font, Samsung Sharp Sans, Nike Futura, adidas) are licensed to their owners only, so they are not shipped.

## URLs and redirects (`netlify.toml`)

- Clean URLs: every page's `.html` URL 301s to its clean URL.
- `/flyer-network`, `/flyer-network.html` and every older flyer path (`/flyer-drops`, `/flyers`, `/direct-mail`, ...) 301 straight to `/referral-network`, so old links and printed QR codes keep working.
- Retired pages 301 to the page that covers them; no redirect points at another redirect (a test checks this).
- November 24, 2026: the private dinners page was retired. `/patient-network`, `/patient-network.html` and the older paths that led to it (`/patient-dinners`, `/events`, with and without `.html`) 301 to the home page; it is out of the sitemap, and `/contact?about=patient-network` prefills a plain call request. The contact form keeps its Netlify name `dinner-call` and its field name `dinner` (renaming them would split the form's submission history); visitors never see either name. The terms and the privacy policy still mention the dinner: they are legal text, for the owner and the attorney to update.
- `/tests/*`, `/tools/*`, `/README.md`, `/netlify.toml` and `/.claude/*` return 404: they are in the repo but not part of the site.
- `/boots-on-the-ground`, `/growth-team` (and their `.html`) 301 straight to `/field-team`.
- Security headers (CSP, `nosniff`, frame and referrer policies) are set for every path.

## Content rules

- The brand is Local Impressions; the company in legal text is OUR Optimization LLC. Service area: Chicago's western suburbs.
- Never on the site: invented reviews, testimonials, statistics, scores or results, and medical claims. Examples are labelled "Example".
- The phone number appears only on the home page's closing call, `/contact` and `/thanks` (plus the structured data).
- The client's team calls the leads; the site never says we do. Nobody is paid per referral or per customer.
- November 23, 2026: the two ways to run it are "Your team visits" and "Our team visits"; the old "Level 1" and "Level 2" labels appear nowhere (pages, prefills and tests check this). The one-page partner agreement and one of your kind ("agrees to promote", a commitment) hold when our team visits. The staff card is the tap-to-schedule card, as the terms call it. The client provides the displays (the terms: "You provide your printed materials."). No timing promise about logging a stop; the terms promise a written visit log within 5 business days.
- Treats for Staff: modest coffee, pastries and snacks for the whole staff of each partner business on every visit. Never gift cards, cash, free services or anything of real value. Never connected to referrals, sign-ups or results anywhere except the one FAQ line that says they are shared whether or not anyone refers a customer.
- Name-tracked sign-ups are described only as measuring campaign performance for the client, never as a basis for rewarding anyone.
- No legal conclusions and no claims of attorney review. Healthcare pages carry the attorney-review TODO comment.
- The 30-day guarantee appears once, in the FAQ, word for word as in the terms (November 23, 2026). A testimonial section waits, commented out, in index.html until the owner gives a real quote.
- No placeholder text anywhere, and no pricing: no prices, trial, plans or money-back guarantee on any page (apart from that one FAQ guarantee), and nothing links to `/pricing` (November 21, 2026; the terms keep how prices are agreed in writing, with no figures).
- Plain words, short sentences; each page explains its own topic and points to the others instead of repeating them.
- Copy uses no em or en dashes.
- `node --test` holds a list of retired words that must appear nowhere in the files the site serves.

## Tests

Unit tests (Node 18+, no dependencies):

```
node --test tests/*.test.mjs
```

- `tests/site.test.mjs`: every page's head (title, description, canonical, Open Graph, Twitter, icons, one h1), the LocalBusiness data, the header and footer (Book a call on every page, the expo page included), the retired words, dashes, where the phone number may appear, internal links and anchors, images, the redirects (flyer paths, no chains, blocked files), the sitemap, the two forms (the expo form pinned byte for byte) and the favicon set. November 23, 2026: every FAQ question has a real answer, the add-ons and industry links, no "Level 1" or "Level 2", the matching beat, the same share image description and structured data on every page, and the wording held to the owner and the terms (the staff card's name, tap-to-schedule, and what a tap opens; who makes the displays, with your team or you; the agreement when our team visits; the Portals privacy line scoped to the portal; the treats; the expo and the ads lines).
- `tests/home.test.mjs`: the home page beat by beat (order, head tags, hero, who shares your customers, who we never connect you with, how the connection is made and the two ways, what you see, the hidden testimonial, the closing call), each line checked against the terms and the partner agreement, the treats said once, no Level labels; pricing, the Field Team page and the portal tour on its three pages.
- `tests/call.test.mjs`: the call form and `assets/call.js` (validation rules and `?about=` prefills; the two ways to run it prefill in plain words).
- `tests/industries.test.mjs`: the industry pages match their data (the generator's `--check`), the order, healthcare marking, modest treats, the med spa page's beats and truth rules, the other seven on the full template, and "When our team visits" on their exclusivity and agreement lines.
- `tests/html.mjs`: shared helpers and the page list (not a test file).

Browser tests (Playwright, against a local server that applies the `netlify.toml` redirects; every form POST is intercepted, nothing is ever submitted):

```
E2E_BASE_URL=http://localhost:8770 node tests/e2e-call.mjs
```

They cover the call form end to end, the `?about=` prefills, the old links and redirects (including /boots-on-the-ground and /growth-team to /field-team, and /pricing to /contact), the logo, Book a call in every header (the expo page included), the HIPAA switch on a healthcare page, the half orb hero and the page title, the home page's five beats in order at 320, 390, 768 and 1280 px, no "Level 1" or "Level 2" on any page or prefill, the med spa page's beats, the portal tour, the phone tab bar and its More sheet, and the Field Team page.

## The client portal

A separate app (repo `our-wellness-portal`, on Render behind Cloudflare at https://www.ournetworkportal.com). The site only links to it; the screenshots on the site come from its sample account.
