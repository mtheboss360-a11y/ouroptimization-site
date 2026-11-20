// Builds the industry landing pages (industries/<slug>.html) and the home page's Industries cards from one
// template and one data file per industry (tools/industries/<slug>.json).
//
//   node tools/build-industries.mjs           write the pages
//   node tools/build-industries.mjs --check   exit 1 if any page on disk differs from what the data would build
//
// The site has no build step on Netlify: run this locally after editing the data, and commit its output.
// The header, footer, head script and structured data are copied from index.html, so every page stays identical
// to the rest of the site. Nothing here is time-based: the same data always builds the same bytes.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');
const ORIGIN = 'https://ouroptimization.com';
const TOWNS = ['Oak Brook', 'Lombard', 'Elmhurst', 'Naperville', 'Downers Grove', 'Hinsdale'];

/* ---------- text ---------- */
// Plain text in the data becomes HTML: & < > " escaped, straight apostrophes curled the way the site writes them.
export const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  .replace(/'/g, '&rsquo;');
const decode = (s) => s.replace(/&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/* ---------- data ---------- */
export function loadIndustries() {
  const dir = new URL('tools/industries/', ROOT);
  const list = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
  list.sort((a, b) => a.order - b.order);
  const problems = [];
  const need = ['slug', 'order', 'name', 'noun', 'healthcare', 'title', 'description', 'cardBlurb', 'h1', 'h1Em', 'intro', 'partnersIntro',
    'partners', 'treatsIntro', 'treatExamples', 'portalNote', 'notesTitle', 'notes', 'exclusivity', 'faq', 'aboutKey', 'aboutText'];
  for (const d of list) {
    for (const k of need) if (d[k] === undefined || d[k] === '') problems.push(`${d.slug}: missing ${k}`);
    if (!/^[a-z0-9-]+$/.test(d.slug || '')) problems.push(`${d.slug}: bad slug`);
    if ((d.partners || []).length !== 6) problems.push(`${d.slug}: needs exactly 6 partners`);
    if ((d.notes || []).length !== 3) problems.push(`${d.slug}: needs exactly 3 notes`);
    if ((d.faq || []).length !== 3) problems.push(`${d.slug}: needs exactly 3 questions`);
    const t = d.title || '';
    if (t.length < 15 || t.length > 70 || !t.endsWith(' | Our Wellness Network')) problems.push(`${d.slug}: title "${t}" (${t.length})`);
    const desc = esc(d.description || '');
    if (desc.length < 70 || desc.length > 175) problems.push(`${d.slug}: description is ${desc.length} characters as HTML (70-175)`);
    const all = JSON.stringify(d);
    if (/[–—]/.test(all)) problems.push(`${d.slug}: an em or en dash`);
    if (/courtesy|complimentary|gift card|testimonial/i.test(all)) problems.push(`${d.slug}: a retired or forbidden word`);
    if (/[<>]|&[a-z]+;/i.test(all)) problems.push(`${d.slug}: HTML in the data (write plain text)`);
    if (d.healthcare && !d.faq.some((q) => q.a.includes('Partner programs for healthcare practices are reviewed for compliance with applicable state rules before launch.'))) problems.push(`${d.slug}: the healthcare compliance sentence is missing`);
  }
  if (problems.length) throw new Error('Industry data problems:\n  ' + problems.join('\n  '));
  return list;
}

/* ---------- pieces copied from index.html ---------- */
function shell() {
  const index = read('index.html');
  const take = (re, what) => { const m = re.exec(index); if (!m) throw new Error(`index.html: no ${what}`); return m[0]; };
  const header = take(/<header class="site-header"[\s\S]*?<\/header>/, 'header').replaceAll(' aria-current="page"', '');
  const footer = take(/<footer class="site-foot">[\s\S]*?<\/footer>/, 'footer');
  const headScript = take(/<script>document\.documentElement[\s\S]*?<\/script>/, 'head script');
  const ld = take(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, 'structured data');
  const ogAlt = /<meta property="og:image:alt" content="([^"]*)">/.exec(index)[1];
  const scene = (name) => take(new RegExp(`<picture><source type="image/avif" srcset="/assets/img/visit-${name}-480\\.avif[\\s\\S]*?</picture>`), `visit-${name} picture`);
  // every sprite symbol on the site, one definition per id (index.html wins)
  const symbols = new Map();
  const files = ['index.html', ...readdirSync(ROOT).filter((f) => f.endsWith('.html') && f !== 'index.html').sort()];
  for (const f of files) for (const m of read(f).matchAll(/<symbol id="([\w-]+)"[\s\S]*?<\/symbol>/g)) if (!symbols.has(m[1])) symbols.set(m[1], m[0]);
  return { header, footer, headScript, ld, ogAlt, scenes: { treats: scene('treats'), chat: scene('chat'), tap: scene('tap') }, symbols };
}

const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
const ARROW = icon('i-arrow');

const PH = '(max-width:759.98px)';
const SHOT_SIZES = '(min-width:1180px) 640px, (min-width:900px) 52vw, calc(100vw - 64px)';
const PHONE_SIZES = 'min(286px, calc(82vw - 14px))';
const stopsPicture = (alt) => '<picture>'
  + `<source media="${PH}" type="image/avif" srcset="/assets/img/portal2-phone-stops-390.avif 390w, /assets/img/portal2-phone-stops-780.avif 780w" sizes="${PHONE_SIZES}" width="780" height="1688">`
  + `<source media="${PH}" type="image/webp" srcset="/assets/img/portal2-phone-stops-390.webp 390w, /assets/img/portal2-phone-stops-780.webp 780w" sizes="${PHONE_SIZES}" width="780" height="1688">`
  + `<source media="${PH}" srcset="/assets/img/portal2-phone-stops-780.jpg 780w" sizes="${PHONE_SIZES}" width="780" height="1688">`
  + `<source type="image/avif" srcset="/assets/img/portal2-stops-800.avif 800w, /assets/img/portal2-stops-1280.avif 1280w, /assets/img/portal2-stops-1920.avif 1920w" sizes="${SHOT_SIZES}" width="1280" height="800">`
  + `<source type="image/webp" srcset="/assets/img/portal2-stops-800.webp 800w, /assets/img/portal2-stops-1280.webp 1280w, /assets/img/portal2-stops-1920.webp 1920w" sizes="${SHOT_SIZES}" width="1280" height="800">`
  + `<img src="/assets/img/portal2-stops-1280.jpg" width="1280" height="800" alt="${alt}" loading="lazy" decoding="async">`
  + '</picture>';

/* ---------- the page template ---------- */
function main(d) {
  const key = d.aboutKey;
  const care = d.healthcare;
  const neighbors = d.partners.slice(0, 3).map((p) => p.name.toLowerCase());
  const out = [];
  out.push(`<main id="main" class="dn-page ind-page" tabindex="-1">`);
  out.push(`<!-- ===== Industry page: built by tools/build-industries.mjs from tools/industries/${d.slug}.json. Edit the data, then run node tools/build-industries.mjs ===== -->`);
  if (care) out.push(`<!-- TODO: attorney review of courtesy program before publishing healthcare pages -->`);

  // hero
  out.push(`<section class="pg-hero ind-hero" aria-labelledby="pg-h">
  <div class="wrap pg-hero-grid">
    <div class="pg-hero-copy">
      <nav class="pg-crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/#industries">Industries</a></li><li><span aria-current="page">${esc(d.name)}</span></li></ol></nav>
      <h1 id="pg-h">${esc(d.h1)} <em class="dn-line">${esc(d.h1Em)}</em></h1>
      <p class="intro">${esc(d.intro)}</p>
      <div class="actions">
        <a class="btn btn-primary" href="/contact?about=${key}">Book a 15-minute call</a>
        <a class="btn btn-ghost" href="/referral-network">How it works</a>
      </div>
    </div>
    <aside class="pg-glance reveal" aria-label="At a glance">
      <p class="dg-k">At a glance</p>
      <ul>
        <li>${icon('i-pin')}<span><b>Your neighbors:</b> ${esc(neighbors.join(', '))}, and more, matched to your ${esc(d.noun)}.</span></li>
        <li>${icon('i-coffee')}<span><b>Treats for Staff</b> on every visit, for the whole staff.</span></li>
        <li>${icon('i-track')}<span><b>Your portal:</b> every stop and every sign-up, as it comes in.</span></li>
        <li>${icon('i-check')}<span><b>You approve</b> every business before we visit.</span></li>
      </ul>
    </aside>
  </div>
</section>`);

  // who shares your customers
  out.push(`
<section class="section bg-paper" aria-labelledby="partners-h" id="partners">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow">Who shares your customers</p>
      <h2 id="partners-h">The businesses around you <em class="dn-line">that already know your customers.</em></h2>
      <p class="intro">${esc(d.partnersIntro)}</p>
    </div>
    <ul class="cardgrid ind-partners reveal">
${d.partners.map((p) => `      <li><h3>${esc(p.name)}</h3><p>${esc(p.why)}</p></li>`).join('\n')}
    </ul>
    <p class="ind-excl reveal">${icon('i-shield')}<span>${esc(d.exclusivity)}</span></p>
  </div>
</section>`);

  // the visits: Treats for Staff, in person, codes
  const scenes = shell.cache.scenes;
  out.push(`
<section class="section" aria-labelledby="visits-h" id="visits">
  <div class="wrap">
    <div class="section-head center reveal">
      <p class="eyebrow">Treats for Staff</p>
      <h2 id="visits-h">Coffee, treats <em class="dn-line">and a real hello.</em></h2>
      <p class="intro">${esc(d.treatsIntro)}</p>
    </div>
    <ul class="own-scenes reveal">
      <li>${scenes.treats}
        <h3>Treats for Staff</h3><p>Coffee and treats for the whole staff, on every visit.</p></li>
      <li>${scenes.chat}
        <h3>Real people, in person</h3><p>We meet the staff, introduce your ${esc(d.noun)} by name and come back every month.</p></li>
      <li>${scenes.tap}
        <h3>A code for every staff member</h3><p>Each staff member gets a personal <span class="nowrap">tap-to-schedule</span> card, so you can see which partnerships are working.</p></li>
    </ul>
    <div class="ind-treats reveal">
      <p class="dg-k">What we bring</p>
      <ul class="ex-chips">
${d.treatExamples.map((t) => `        <li>${esc(t)}</li>`).join('\n')}
      </ul>
      <p class="ind-modest">Modest by design: coffee, pastries and snacks. Never gift cards, cash, free services or anything of real value.</p>
    </div>
  </div>
</section>`);

  // the portal
  const measure = care
    ? 'Sign-ups measure how your campaign is performing. They are never used to reward anyone.'
    : 'Sign-ups measure how your campaign is performing: which businesses, visits and routes are working.';
  out.push(`
<section class="section bg-paper" aria-labelledby="portal-h" id="portal">
  <div class="wrap ind-portal">
    <div class="reveal">
      <p class="eyebrow">Your client portal</p>
      <h2 id="portal-h">Every stop and every sign-up, <em class="dn-line">in one place.</em></h2>
      <p class="intro">${esc(d.portalNote)}</p>
      <ul class="dn-checks">
        <li>${icon('i-check')}<span>Every route, stop by stop, with the staff we met.</span></li>
        <li>${icon('i-check')}<span>Every partner business and where it stands.</span></li>
        <li>${icon('i-check')}<span>Every sign-up, with the business and staff code it came through, ready for your team to call.</span></li>
        <li>${icon('i-check')}<span>${esc(measure)}</span></li>
      </ul>
      <p class="owc-more"><a class="textlink" href="/referral-network#dashboard">See everything in the portal${ARROW}</a></p>
    </div>
    <figure class="ind-shot reveal">
      <div class="pt-browser"><div class="pt-bar" aria-hidden="true"><span></span><span></span><span></span><span class="pt-url">ournetworkportal.com</span></div>${stopsPicture("Screenshot of the portal's sample account: one route on a map, the business in the middle and ten numbered stops around it, beside the list of stops with the sign-ups from each.")}</div>
      <figcaption><span class="owc-tag sample-tag">Sample account, illustrative data</span> Your route, stop by stop.</figcaption>
    </figure>
  </div>
</section>`);

  // good to know (healthcare: the protections)
  const noteIcons = ['i-doc', 'i-shield', 'i-pen'];
  out.push(`
<section class="section" aria-labelledby="notes-h" id="good-to-know">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow">${care ? 'For healthcare practices' : 'Good to know'}</p>
      <h2 id="notes-h">${esc(d.notesTitle)}</h2>
    </div>
    <ul class="cardgrid owc-comply reveal">
${d.notes.map((n, i) => `      <li>${icon(noteIcons[i])}<h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></li>`).join('\n')}
    </ul>${care ? `
    <p class="hipaa-line" data-flag="hipaaConfirmed" data-flag-text="hipaaText" hidden><span></span></p>` : ''}
  </div>
</section>`);

  // questions
  out.push(`
<section class="section bg-paper" aria-labelledby="questions-h" id="questions">
  <div class="wrap">
    <div class="fq-head">
      <h2 id="questions-h">Questions from ${esc(d.noun)} owners</h2>
      <a class="textlink" href="/faq">All questions${ARROW}</a>
    </div>
    <div class="faq dn-faq fq-more">
${d.faq.map((q) => {
    const todo = care && q.a.includes('reviewed for compliance') ? '      <!-- TODO: attorney review of courtesy program before publishing healthcare pages -->\n' : '';
    return `${todo}      <details>
        <summary>${esc(q.q)}<span class="sign" aria-hidden="true"></span></summary>
        <div class="answer"><p>${esc(q.a)}</p></div>
      </details>`;
  }).join('\n')}
    </div>
  </div>
</section>`);

  // results: hidden until there is a real client with real figures
  out.push(`
<!-- ===== Case study: hidden until there are real results. To publish, replace every [PLACEHOLDER] with a real client's
     figures and words (with their written permission), then remove this comment wrapper. Never fill it with examples.
<section class="section" aria-labelledby="case-h" id="case-study">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow">Results</p>
      <h2 id="case-h">[CLIENT NAME], <em class="dn-line">[INDUSTRY] in [TOWN].</em></h2>
    </div>
    <dl class="own-stats case-stats reveal" aria-label="[CLIENT NAME]'s results">
      <div><dt>Stops visited</dt><dd>[STOPS]</dd></div>
      <div><dt>Sign-ups</dt><dd>[SIGN-UPS]</dd></div>
      <div><dt>Bookings</dt><dd>[BOOKINGS]</dd></div>
    </dl>
    <blockquote class="case-quote reveal"><p>[CLIENT QUOTE]</p><footer>[CLIENT NAME, ROLE]</footer></blockquote>
  </div>
</section>
===== -->`);

  // next step
  out.push(`
<section class="section bg-ink pg-cta" aria-labelledby="cta-h">
  <div class="wrap">
    <div class="cta-inner reveal">
      <p class="eyebrow">Next step</p>
      <h2 id="cta-h">See the businesses <em class="dn-line">around your ${esc(d.noun)}.</em></h2>
      <p class="intro">On a 15-minute call we&rsquo;ll show you the businesses we would match near you and what a month with our field team looks like.</p>
      <div class="actions"><a class="btn btn-light" href="/contact?about=${key}">Book a 15-minute call</a></div>
      <p class="ind-founding">Founding clients: [FOUNDING SPOTS] spots at [FOUNDING RATE], in exchange for a case study published only with your written approval. <a href="/pricing#founding">How the founding program works</a></p>
    </div>
  </div>
</section>
</main>`);
  return out.join('\n');
}

export function renderPage(d) {
  const s = shell.cache || (shell.cache = shell());
  const body = main(d);
  const used = [...new Set([...body.matchAll(/href="#(i-[\w-]+)"/g)].map((m) => m[1]))].sort();
  for (const id of used) if (!s.symbols.has(id)) throw new Error(`no sprite symbol ${id}`);
  const url = `/industries/${d.slug}`;
  const title = esc(d.title);
  const desc = esc(d.description);
  return `<!doctype html>
<html lang="en" data-contact-email="mustafa@ouroptimization.com">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#F3F6F2">
<link rel="icon" href="/assets/owo-favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/owo-icon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/owo-icon-16.png">
<link rel="apple-touch-icon" href="/assets/owo-apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest?v=owc1">
<link rel="canonical" href="${ORIGIN}${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Our Wellness Network">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${ORIGIN}${url}">
<meta property="og:image" content="${ORIGIN}/assets/img/og-network.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${s.ogAlt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ORIGIN}/assets/img/og-network.jpg">
<link rel="preload" href="/assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
${s.headScript}
${s.ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<svg class="sprite" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
${used.map((id) => s.symbols.get(id)).join('\n')}
</svg>

${s.header}

${body}

${s.footer}

<script src="/assets/site-config.js" defer></script>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

/* ---------- the home page's Industries cards ---------- */
export function renderCards(list) {
  return list.map((d) => `      <li><a class="ind-card" href="/industries/${d.slug}"><span class="ind-card-name">${esc(d.name)}</span><span class="ind-card-text">${esc(d.cardBlurb)}</span><span class="ind-card-go">See how it works for you${ARROW}</span></a></li>`).join('\n');
}
const CARDS_START = '<!-- industries:start (built by tools/build-industries.mjs; edit tools/industries/*.json) -->';
const CARDS_END = '<!-- industries:end -->';

export function build({ check = false } = {}) {
  shell.cache = shell();
  const list = loadIndustries();
  const outputs = new Map();
  for (const d of list) outputs.set(`industries/${d.slug}.html`, renderPage(d));
  const index = read('index.html');
  const a = index.indexOf(CARDS_START), b = index.indexOf(CARDS_END);
  if (a < 0 || b < a) throw new Error('index.html: the industries markers are missing');
  outputs.set('index.html', index.slice(0, a + CARDS_START.length) + '\n' + renderCards(list) + '\n      ' + index.slice(b));
  const stale = [];
  for (const [file, html] of outputs) {
    const path = new URL(file, ROOT);
    const now = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (now === html) continue;
    stale.push(file);
    if (!check) { mkdirSync(new URL('industries/', ROOT), { recursive: true }); writeFileSync(path, html); }
  }
  return { list, stale };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const { list, stale } = build({ check });
  if (check && stale.length) { console.error('Out of date (run node tools/build-industries.mjs):\n  ' + stale.join('\n  ')); process.exit(1); }
  console.log(`${list.length} industries; ${check ? 'all pages up to date' : stale.length ? 'wrote ' + stale.join(', ') : 'nothing changed'}.`);
  console.log('Towns for titles and descriptions: ' + TOWNS.join(', ') + '.');
}
