// The home page, section by section. November 28, 2026: the offer first, in the owner's words. 1. the hero (custom
// marketing stands, where they go, the software, three benefit lines), 2. the stands (#stands), 3. where your stands go
// (#industries), 4. how it works (#how), 5. pricing (#plans: Essentials and Route Runners), 6. your portal (#dashboard),
// then the call (#book).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { read, text, attr, hasAttr, tags, byId, mainOf, links, ROOT } from './html.mjs';

const html = read('index.html');
const main = mainOf(html);
const head = html.slice(0, html.indexOf('</head>'));
const sec = (id) => {
  const s = byId(html, id);
  assert.ok(s, `#${id} exists`);
  return s;
};
const meta = (attrName, name) => { const t = tags(head, 'meta').find((m) => attr(m, attrName) === name); return t ? attr(t, 'content') : null; };
const count = (hay, needle) => hay.split(needle).length - 1;
const LINE = 'Custom marketing stands in the businesses your customers already trust.';
/* the source of truth for the promises on the page: the terms */
const TERMS = text(read('terms.html'));
const hero = () => /<section class="hero-orb"[\s\S]*?<\/section>/.exec(main)[0];

describe('home: order, head and hero', () => {
  test('the six sections in order (November 28, 2026): the stands, where they go, how it works, pricing, the portal, the call', () => {
    const ids = [...main.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['stands', 'industries', 'how', 'plans', 'dashboard', 'book']);
    for (const gone of ['never', 'in-person', 'levels', 'network', 'treats', 'compliance']) assert.ok(!byId(main, gone), `#${gone} is gone`);
    const heroAt = main.indexOf('class="hero-orb"');
    assert.ok(heroAt >= 0 && heroAt < main.indexOf('id="stands"'), 'the hero comes first');
  });
  test('the title, the share titles, the descriptions (the offer and two towns) and the share image alt', () => {
    const title = 'Local Impressions | Custom Marketing Stands for Local Businesses';
    assert.equal(text(/<title>([\s\S]*?)<\/title>/.exec(head)[1]), title);
    assert.equal(meta('property', 'og:title'), title);
    assert.equal(meta('name', 'twitter:title'), title);
    const desc = 'Custom marketing stands with your logo, placed in nearby businesses that share your customers, never competitors. Software included. Franklin Park, Oak Brook and nearby.';
    for (const [a, n] of [['name', 'description'], ['property', 'og:description'], ['name', 'twitter:description']]) assert.equal(meta(a, n), desc, n);
    assert.ok(desc.length <= 175);
    assert.equal(meta('property', 'og:image'), 'https://ouroptimization.com/assets/img/og-network.jpg');
    assert.equal(meta('property', 'og:image:alt'), `The Local Impressions logo above the line: ${LINE}`);
    const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(head)[1]);
    assert.equal(ld.slogan, LINE);
    assert.equal(ld.description, 'Custom marketing stands with your logo and services, placed in nearby businesses that share your customers, plus the software to log every visit and track every scan. Serving local businesses in the Chicago area.');
    assert.deepEqual(ld.alternateName, ['Our Local Network', 'Our Wellness Network'], 'the old names stay only as alternate names (November 24, 2026: Local Impressions)');
    assert.equal(count(html, 'Our Local Network'), 1, 'only in alternateName');
    assert.equal(count(html, 'Our Wellness Network'), 1, 'only in alternateName');
    assert.doesNotMatch(html, /Boots on the ground|your next customers already trust|help build referral relationships/i, 'the old lines are retired from the home page, head included');
  });
  test('the hero: the stands first, then where they go, the software and the two ways to run it; three benefit lines; book a call or see pricing', () => {
    const h = hero();
    assert.match(h, /<h1 id="hero-h">Custom marketing stands in the businesses <em>your customers already trust\.<\/em><\/h1>/);
    assert.equal(text(/<p class="lede">([\s\S]*?)<\/p>/.exec(h)[1]), 'We design and build stands with your logo and services. They go to nearby businesses that share your customers, never your competitors. Our software lists who to visit, logs every conversation and tracks every scan. Your staff runs the routes, or our Route Runners do it for you.');
    const points = [.../<ul class="hero-points">([\s\S]*?)<\/ul>/.exec(h)[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]));
    assert.deepEqual(points, [
      'Stands made for you. Your logo, your services and a QR code that tracks every scan.',
      'Only complementary businesses. They share your customers. Direct competitors never go on your routes.',
      'Software included. Your list of businesses to visit, a log of every conversation, and every scan tracked.',
    ]);
    assert.deepEqual(links(h).map((l) => [l.text, l.href]), [['Book a call', '/contact'], ['See pricing', '#plans']]);
    assert.doesNotMatch(text(h), /coffee|treat|\$\d|referral relationship/i);
    assert.equal(tags(h, 'img').length, 0, 'the photos have their own section');
  });
  test('the half orb the owner picked (assets/home-orb.js): one canvas, your business at its gold centre, illustrated owners clear of the words', () => {
    const h = hero();
    assert.equal(tags(h, 'canvas').length, 1);
    assert.equal(attr(tags(h, 'canvas')[0], 'id'), 'orb');
    assert.match(html, /<script src="\/assets\/home-orb\.js" defer><\/script>/);
    for (const f of ['assets/home-wave.js', 'assets/network-orb.js']) assert.ok(!existsSync(new URL(f, ROOT)), f);
    assert.doesNotMatch(html, /home-wave|hero-wave|id="wave"/);
    const js = read('assets/home-orb.js');
    assert.match(js, /const clinic = \{ label: 'Your business'/);
    for (const b of ['Gym', 'Hair salon', 'Yoga studio', 'Boutique', 'Physical therapy', 'Nail salon']) assert.match(js, new RegExp(`label: '[A-Z][a-z]+ · ${b}'`), b);
    assert.match(js, /querySelectorAll\('h1, \.lede, \.hero-points, \.actions/, 'the owners keep clear of the words and the benefit lines');
    assert.match(js, /prefers-reduced-motion: reduce/);
    assert.match(js, /sessionStorage/, 'the network builds once per visit');
    assert.doesNotMatch(js, /https?:\/\/|import /, 'no libraries and no outside requests');
    assert.match(read('assets/site.css'), /\.hero-orb\{[^}]*--rose:var\(--gold\)/, 'the centre is the brand gold');
  });
});

describe('home: the copy rules', () => {
  const t = text(main);
  test('no "Level 1" or "Level 2" anywhere on the page, comments included', () => {
    assert.doesNotMatch(html, /Level\s*[12]|about=level-/i);
  });
  test('no em or en dashes, never the word sample, no legal wording, no guarantee on the home page', () => {
    assert.doesNotMatch(html, /[–—]|&[mn]dash;|&#821[12];/);
    assert.doesNotMatch(html, /sample/i);
    assert.doesNotMatch(t, /guarantee|compliant|legal|lawful|attorney|HIPAA|medical director/i);
  });
  test('the phone number only in the closing call', () => {
    const outside = main.replace(byId(main, 'book'), '');
    assert.doesNotMatch(outside, /tel:|331-271-6851|\(331\)/);
  });
  test('no coffee or treats on the home page; prices only in the pricing section', () => {
    assert.doesNotMatch(t, /coffee|treats|pastr/i);
    assert.doesNotMatch(text(main.replace(byId(main, 'plans'), '')), /\$\s?\d/, 'no prices outside #plans');
  });
});

describe('home: 2. the stands (#stands)', () => {
  const s = sec('stands');
  test('the head and the owner\'s three photos of real stands, each opening full size', () => {
    assert.match(s, /<p class="eyebrow">The stands<\/p>/);
    assert.equal(text(/<h2 id="stands-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Your stand. On their counter.');
    assert.match(text(s), /Each stand shows your logo, your services and a QR code\. It sits at the front desk of a business your customers already visit\./);
    const photos = ['salon', 'bakery', 'medspa'];
    assert.deepEqual(links(s).map((l) => l.href), photos.map((n) => `/assets/img/display-${n}.png`), 'the only links open the full-size photos');
    for (const n of photos) assert.ok(existsSync(new URL(`./assets/img/display-${n}.png`, ROOT)), n);
    assert.equal(tags(s, 'img').length, 3);
    for (const img of tags(s, 'img')) assert.ok(attr(img, 'alt').length > 40, 'each photo is described');
    assert.match(s, /<figcaption>Stands we have made for local businesses\.<\/figcaption>/);
  });
});

describe('home: 3. where your stands go (#industries)', () => {
  const s = sec('industries');
  const t = text(s);
  /* November 28, 2026: each kind of business on the home page is one the client portal can find and put on a route
     (our-wellness-portal/server/network/config.ts CATEGORY_RULES: fitness, yoga and pilates, physical therapy,
     chiropractic, salons and barbers, wellness retail). Daycares, schools and apartments are filtered out there on purpose. */
  const TYPES = [
    ['Gyms and fitness studios', 'fitness'],
    ['Yoga and pilates studios', 'yoga'],
    ['Physical therapy and chiropractic', 'physical-therapy, chiropractic'],
    ['Hair and nail salons', 'salon'],
    ['Juice bars and health food stores', 'wellness-retail'],
    ['Running and sporting goods stores', 'wellness-retail'],
  ];
  test('the head and the six kinds of business, each with one plain line', () => {
    assert.match(s, /<p class="eyebrow">Where your stands go<\/p>/);
    assert.equal(text(/<h2 id="industries-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Same customers. Never your competitor.');
    assert.match(t, /Your customers don't only come to you\. They go to the gym, the salon and the shops nearby\. That's where your stands go\./);
    const ul = /<ul class="cardgrid icon-side share-types reveal">([\s\S]*?)<\/ul>/.exec(s)[1];
    const items = [...ul.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    assert.deepEqual(items.map((li) => text(/<h3>([\s\S]*?)<\/h3>/.exec(li)[1])), TYPES.map((x) => x[0]), 'only kinds the client portal can find');
    for (const li of items) {
      const p = [...li.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => text(m[1]));
      assert.equal(p.length, 1, 'one line each');
      assert.equal((p[0].match(/[.!?]/g) || []).length, 1, `one sentence: ${p[0]}`);
      assert.doesNotMatch(p[0], /\d|%|more (customers|clients|bookings)|grow|results?|guarantee|refer/i, `an observation, no results and no numbers: ${p[0]}`);
      assert.match(li, /^<svg aria-hidden="true"><use href="#i-[a-z]+"\/><\/svg>/, 'an icon from the page sprite');
    }
    assert.doesNotMatch(t, /daycare|leasing|apartment|bridal|boutique/i, 'nothing the portal cannot route to');
  });
  test('never a competitor: three lines, each backed by the terms; one of your kind only with Route Runners', () => {
    const cards = /<ul class="cardgrid never-cards reveal">([\s\S]*?)<\/ul>/.exec(s)[1];
    assert.deepEqual([...cards.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((m) => text(m[1])), ['No competitors', 'You approve every name', 'One of your kind']);
    const c = text(cards);
    assert.match(c, /No competitors\s*A business that sells what you sell is marked as a competitor and never goes on your routes\./);
    assert.match(c, /You approve every name\s*You see the list first and can cross off any business\. We skip any business you already work with unless you ask\./);
    assert.match(c, /One of your kind\s*With Route Runners, we ask each partner to promote one business of your kind: yours, for as long as you are a client\./);
    assert.match(TERMS, /You approve the list before any visit, and we skip any business you already work with unless you ask\./);
    assert.match(TERMS, /The partners we sign for you agree to promote one business of your kind, yours, for as long as you are a client\./);
    assert.doesNotMatch(c, /certif|prestig|exclusive club|\bclub\b|decal|directory|member/i);
  });
  test('then "Pick your industry to see your matches." and a card for each industry on the home page; three keep their pages but no card (November 28, 2026)', () => {
    assert.match(t, /Which ones fit depends on what you sell\. Pick your industry to see your matches\./);
    assert.ok(s.indexOf('share-types') < s.indexOf('never-cards') && s.indexOf('never-cards') < s.indexOf('share-pick') && s.indexOf('share-pick') < s.indexOf('<!-- industries:start'), 'the kinds, the never lines, the pick line, then the cards');
    const hrefs = links(s).map((l) => l.href);
    assert.deepEqual(hrefs, ['/industries/med-spas', '/industries/dental', '/industries/chiropractic-physical-therapy', '/industries/gyms-fitness-studios', '/industries/salons-barbershops']);
    for (const h of hrefs) assert.ok(existsSync(new URL('.' + h + '.html', ROOT)), h);
    for (const off of ['restaurants-cafes', 'home-services', 'auto-shops']) {
      assert.equal(JSON.parse(read(`tools/industries/${off}.json`)).home, false, off);
      assert.ok(existsSync(new URL(`./industries/${off}.html`, ROOT)), `${off} keeps its page`);
    }
    for (const card of [...s.matchAll(/<span class="ind-card-text">([\s\S]*?)<\/span>/g)].map((m) => text(m[1]))) assert.match(card, /^Your stands go to the /, card);
    assert.match(s, /<!-- industries:start \(built by tools\/build-industries\.mjs; edit tools\/industries\/\*\.json\) -->[\s\S]*<!-- industries:end -->/);
  });
});

describe('home: 4. how it works (#how)', () => {
  const s = sec('how');
  test('four steps: we make the stands, you get the list, the stands go in, you oversee the network', () => {
    assert.match(s, /<p class="eyebrow">How it works<\/p>/);
    assert.equal(text(/<h2 id="how-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'From your logo to their counter.');
    const steps = [...s.matchAll(/<li><span class="num">(\d\d)<\/span><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/li>/g)].map((m) => [m[1], text(m[2]), text(m[3])]);
    assert.deepEqual(steps, [
      ['01', 'We make your stands.', 'Your logo, your services and a QR code. You approve the design before we print.'],
      ['02', 'You get your list.', 'Your software lists nearby businesses that share your customers. Competitors never go on a route, and you approve every name.'],
      ['03', 'The stands go in.', 'On Essentials, your staff places them and logs every conversation from a phone. On Route Runners, our team does it for you.'],
      ['04', 'You oversee your network.', 'Every visit, scan and callback request lands in your portal, business by business, month by month.'],
    ]);
  });
});

describe('home: 5. pricing (#plans)', () => {
  const s = sec('plans');
  const t = text(s);
  const cards = [...s.matchAll(/<li class="lv-card[^"]*">([\s\S]*?)<\/a>\s*<\/li>/g)].map((m) => m[1] + '</a>');
  test('two plans, the same setup fee; the only difference is who runs the routes', () => {
    assert.match(s, /<p class="eyebrow">Pricing<\/p>/);
    assert.equal(text(/<h2 id="plans-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Two plans. You pick who visits the businesses.');
    assert.match(t, /Both plans include your custom stands and the software\./);
    assert.equal(cards.length, 2);
    const plan = (c) => ({ name: text(/<h3><span class="lv-k">([\s\S]*?)<\/span>/.exec(c)[1]), head: text(/<h3><span class="lv-k">[\s\S]*?<\/span>([\s\S]*?)<\/h3>/.exec(c)[1]), price: text(/<p class="plan-price">([\s\S]*?)<\/p>/.exec(c)[1]), setup: text(/<p class="plan-setup">([\s\S]*?)<\/p>/.exec(c)[1]) });
    assert.deepEqual(plan(cards[0]), { name: 'Essentials', head: 'Your staff places the stands and visits.', price: '$100 a month', setup: 'Plus a $100 setup fee for your stands' });
    assert.deepEqual(plan(cards[1]), { name: 'Route Runners', head: 'Our Route Runners do it for you.', price: '$500 a month', setup: 'Plus a $100 setup fee for your stands' });
  });
  test('what each plan includes, in the owner\'s words; no stand count (the owner\'s call)', () => {
    const items = (c) => [...c.matchAll(/<li><svg aria-hidden="true"><use href="#i-check"\/><\/svg><span>([\s\S]*?)<\/span><\/li>/g)].map((m) => text(m[1]));
    assert.deepEqual(items(cards[0]), [
      'Custom stands with your logo, your services and a QR code',
      'Your list of nearby businesses that share your customers, with competitors kept off your routes',
      'Logins we set up for your staff to log every visit and conversation',
      'Every visit, scan and callback request tracked',
      'Your whole network in one view, with the status of each business',
    ]);
    assert.deepEqual(items(cards[1]), [
      'Everything in Essentials',
      'Our Route Runners run 2 routes a month for you',
      'They place your stands, check on them and log every visit',
      'They grow your network around the businesses that work for you',
      'We ask each partner to promote one business of your kind: yours',
    ]);
    assert.doesNotMatch(t, /\b\d+\s+(stands?|signs?)\b|trial|minimum term|\[[A-Z]/i, 'no stand count, no trial, no placeholder');
  });
  test('each plan books a call with its own message in the form', () => {
    assert.deepEqual(links(s).map((l) => [l.text, l.href]), [['Book a call about Essentials', '/contact?about=essentials'], ['Book a call about Route Runners', '/contact?about=route-runners']]);
    const js = read('assets/call.js');
    assert.match(js, /'essentials': "I'm interested in Essentials: the stands and the software, with my team running the routes\."/);
    assert.match(js, /'route-runners': "I'm interested in Route Runners: your team running the routes for me\."/);
  });
});

describe('home: 6. your portal (#dashboard)', () => {
  test('on the green band: every visit, every scan, in one place; the screens pop in like every other block, no scroll-driven tilt', () => {
    const s = sec('dashboard');
    assert.match(main, /<section class="section bg-ink owc-dash-band" aria-labelledby="dashboard-h" id="dashboard">/, 'on the green band');
    assert.match(s, /<p class="eyebrow">Your portal<\/p>/);
    assert.equal(text(/<h2 id="dashboard-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Every visit, every scan, in one place.');
    assert.match(s, /<div class="ptour reveal" data-ptour>/, 'the same smooth pop-in as the rest of the page');
    assert.doesNotMatch(s, /data-tilt|owc-tilt|owc-scroll-cue/, 'no tilt and no scroll cue (the owner\'s call)');
  });
  test('the screens and what they show; what the client sees, not what our team did; no Client Portal box (it is in the header)', () => {
    const s = sec('dashboard');
    const t = text(s);
    assert.doesNotMatch(s, /Sample account|illustrative data|sample-tag|sample-note/);
    assert.match(t, /See every business in your network and its status, plus every visit and scan, month by month\./);
    assert.match(t, /Every stop on your route, in order, with who was met and the sign-ups\./);
    assert.match(t, /Each business in your network and its status\./);
    assert.match(t, /The businesses near you, ranked by how well they fit and how close they are\./, 'what the software really does: fit and distance');
    assert.doesNotMatch(t, /where (each one|it) stands|booking/i, 'no stands pun, and no booking tracking the portal does not do');
    assert.doesNotMatch(t, /our team went|we met|we visit|before we leave/i);
    for (const label of ['Stops visited', 'Staff reached', 'Referral cards handed out', 'Staff sign-ups', 'Booked by the front desk']) assert.ok(t.includes(label), label);
    assert.match(read('assets/site.css'), /\.own-stats dd\{font-family:var\(--nums\)|\.own-stats dd\{font-family/, 'the numbers use the system face');
    assert.doesNotMatch(t, /visit log|\[STOPS/i, 'no visit log line, no placeholder');
    assert.ok(!links(s).some((l) => l.href === 'https://www.ournetworkportal.com'), 'no Client Portal box in this section');
    for (const img of tags(s, 'img')) assert.match(attr(img, 'src'), /^\/assets\/img\/portal2-/, 'screens from the client portal (November 14, 2026)');
  });
  test('no map anywhere: no Google request, no Maps key, no map images', () => {
    assert.doesNotMatch(html, /owc-geo|id="matching"|openstreetmap/i);
    assert.doesNotMatch(read('assets/site-config.js'), /googleMap/);
    assert.doesNotMatch(read('assets/site.js'), /googleapis|googleMap|owc-geo/);
    assert.match(read('netlify.toml'), /img-src 'self' data:;/, 'the CSP allows no outside images');
    assert.doesNotMatch(read('privacy.html'), /googleMap|Google Maps/);
    assert.ok(!existsSync(new URL('assets/img/map-base-1200.jpg', ROOT)));
  });
});

describe('home: what stays off the page, and the call', () => {
  test('no staff courtesy program, comments included', () => {
    assert.doesNotMatch(html, /courtesy/i);
  });
  test('no results section: no "real clinics, real numbers", no texting form, no results files', () => {
    assert.doesNotMatch(html, /id="results"|Real clinics|Oakbrook Terrace|results-updates|data-results/);
    assert.doesNotMatch(html, /results\.js/);
    assert.ok(!existsSync(new URL('assets/results.js', ROOT)));
    assert.ok(!existsSync(new URL('assets/data/results.json', ROOT)));
    assert.ok(!existsSync(new URL('updates-thanks.html', ROOT)));
  });
  test('no dinner on the home page (the FAQ links the add-ons)', () => {
    assert.doesNotMatch(main, /patient-network|patient dinner/i);
  });
  test('no placeholder text: the hidden case study template and the founding line are gone (November 21, 2026)', () => {
    assert.doesNotMatch(html, /\[[A-Z][A-Z :,'-]+\]|Case study|ind-founding|founding/i);
    assert.doesNotMatch(text(main), /\btrial\b/i, 'no trial');
  });
  test('the final call to action, with the phone number', () => {
    const s = sec('book');
    assert.match(text(s), /Book a 15-minute call\. We'll show you the businesses near you where your stands would go\./);
    assert.ok(links(s).some((l) => l.href === '/contact'));
    assert.ok(links(s).some((l) => l.href === 'tel:+13312716851' && /331-271-6851/.test(l.text)));
  });
});

describe('the pricing page stays retired (November 21, 2026); the prices live on the home page in #plans (November 28, 2026)', () => {
  test('no pricing page; its addresses go to /contact; nothing in the sitemap', () => {
    assert.ok(!existsSync(new URL('pricing.html', ROOT)));
    const toml = read('netlify.toml');
    assert.match(toml, /from = "\/pricing"\n  to = "\/contact"\n  status = 301\n  force = true/);
    assert.match(toml, /from = "\/pricing\.html"\n  to = "\/contact"/);
    assert.doesNotMatch(read('sitemap.xml'), /pricing/);
  });
  test('the terms keep how prices are agreed in writing, with no figures and no pricing page', () => {
    const t = text(mainOf(read('terms.html')));
    assert.doesNotMatch(t, /\$\d|pricing page|\[[A-Z]/);
  });
});

describe('the Field Team page (was Boots on the ground, and before that the growth team page)', () => {
  const gt = read('field-team.html');
  test('the headline; Treats for Staff never tied to referrals; no breadcrumb', () => {
    assert.ok(/<h1 id="pg-h">/.test(gt));
    assert.doesNotMatch(gt, /pg-crumbs/, 'no breadcrumb');
    assert.match(text(gt), /Treats for Staff/);
    assert.doesNotMatch(text(gt), /whether or not they ever send anyone|whether or not anyone refers/, 'only the FAQ says that');
    assert.doesNotMatch(gt, /courtesy|Growth team/i);
    assert.doesNotMatch(text(mainOf(gt)), /Boots on the ground/i, 'the old slogan is retired');
    assert.doesNotMatch(text(gt), /month after month|whether or not you stay/);
  });
  test('the illustration: the clay team visit, AVIF and WebP, never wider than its 560px box below 960px', () => {
    const hero = /<section class="pg-hero[\s\S]*?<\/section>/.exec(gt)[0];
    const sizes = tags(hero, 'source').concat(tags(hero, 'img')).map((t) => attr(t, 'sizes')).filter(Boolean);
    assert.ok(sizes.length >= 2);
    for (const v of sizes) assert.equal(v, '(min-width:1180px) 520px, (min-width:960px) 44vw, (min-width:600px) 560px, calc(100vw - 40px)');
    for (const t of tags(hero, 'img')) { assert.match(attr(t, 'src'), /team-visit-/); assert.ok(existsSync(new URL('.' + attr(t, 'src'), ROOT)), attr(t, 'src')); }
  });
});

/* November 14, 2026: the portal tour. The portal's screens behind tabs, as in the portal's own side rail. */
describe('the portal tour (home, /field-team, /referral-network)', () => {
  const SCREENS = ['route', 'network', 'partners', 'results'];
  for (const [file, id, prefix] of [['index.html', 'dashboard', 'pt'], ['field-team.html', 'tracking', 'bt'], ['referral-network.html', 'dashboard', 'hw']]) {
    const s = byId(read(file), id);
    test(`${file} #${id}: four tabs, each wired to its own screen; the first one showing`, () => {
      assert.match(s, /<div class="ptour reveal" data-ptour>/);
      assert.match(s, /<div class="ptour-tabs" role="tablist" aria-label="Screens from the client portal">/);
      const btns = tags(s, 'button');
      assert.equal(btns.length, 4);
      btns.forEach((b, i) => {
        assert.equal(attr(b, 'role'), 'tab');
        assert.equal(attr(b, 'type'), 'button');
        assert.equal(attr(b, 'id'), `${prefix}-tab-${SCREENS[i]}`);
        assert.equal(attr(b, 'aria-controls'), `${prefix}-${SCREENS[i]}`);
        assert.equal(attr(b, 'aria-selected'), i === 0 ? 'true' : 'false');
        assert.equal(hasAttr(b, 'tabindex'), i !== 0, 'only the chosen tab is in the tab order');
      });
      const panels = tags(s, 'figure');
      assert.equal(panels.length, 4);
      panels.forEach((f, i) => {
        assert.ok(!hasAttr(f, 'role') && !hasAttr(f, 'aria-labelledby'), 'plain figures until site.js makes them tab panels');
        assert.equal(attr(f, 'id'), `${prefix}-${SCREENS[i]}`);
        assert.equal(hasAttr(f, 'hidden'), i !== 0, 'only the first screen shows before a tab is chosen');
      });
    });
    test(`${file} #${id}: the phone screens on phones, the desktop screens elsewhere, every one described as the client portal`, () => {
      const imgs = tags(s, 'img');
      assert.equal(imgs.length, 4);
      for (const img of imgs) {
        assert.match(attr(img, 'src'), /^\/assets\/img\/portal2-(stops|network|partners|routes)-1280\.jpg$/);
        assert.match(attr(img, 'alt'), /^Screenshot of the client portal: /);
        assert.equal(attr(img, 'loading'), 'lazy');
      }
      const phone = tags(s, 'source').filter((t) => attr(t, 'media') === '(max-width:759.98px)');
      assert.equal(phone.length, 12, 'avif, webp and jpg for each of the four phone screens');
      for (const t of phone) assert.match(attr(t, 'srcset'), /\/assets\/img\/portal2-phone-/);
    });
  }
  test('site.js drives the tabs (click, arrow keys, Home, End) and every screen shows without it', () => {
    const js = read('assets/site.js');
    assert.match(js, /querySelectorAll\('\[data-ptour\]'\)/);
    assert.match(js, /panel\.setAttribute\('role', 'tabpanel'\); panel\.setAttribute\('aria-labelledby', t\.id\)/, 'the panels become tab panels only when the tabs work');
    for (const k of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) assert.ok(js.includes(k), k);
    assert.match(read('assets/site.css'), /html:not\(\.js\) \.ptour-panel\[hidden\]\{display:block\}/);
  });
  test('the old driver screens and driver photos are gone', () => {
    for (const f of ['index.html', 'field-team.html', 'referral-network.html']) assert.doesNotMatch(read(f), /drivers?-(card|next-route|orb|phone|stop|elena|marcus|omar|tasha)/, f);
    assert.ok(!existsSync(new URL('assets/img/drivers-card-546.jpg', ROOT)));
    assert.ok(!existsSync(new URL('assets/img/driver-marcus.jpg', ROOT)));
  });
});

describe('November 23, 2026: honest figures and a testimonial slot', () => {
  test('the five figures are labelled as a demo account, on the home page and the Field Team page', () => {
    for (const f of ['index.html', 'field-team.html']) {
      const m = mainOf(read(f));
      assert.match(m, /<p class="own-stats-note reveal">Example results from a demo account\.<\/p>\s*<dl class="own-stats reveal" aria-label="Example results from a demo account: five routes in the portal">/, f);
      for (const [k, v] of [['Stops visited', 35], ['Staff reached', 207], ['Referral cards handed out', 262], ['Staff sign-ups', 64], ['Booked by the front desk', 37]]) assert.match(m, new RegExp(`<dt>${k}</dt><dd>${v}</dd>`), `${f}: ${k}`);
    }
  });
  test('the testimonial stays hidden (commented out) until the owner gives a real quote; nothing invented shows', () => {
    const m = mainOf(read('index.html'));
    assert.doesNotMatch(m.replace(/<!--[\s\S]*?-->/g, ''), /id="testimonial"|own-quote/, 'not on the page');
    assert.match(m, /<!-- ===== Testimonial: HIDDEN[\s\S]*?id="testimonial"[\s\S]*?The client's exact words go here\.[\s\S]*?-->/, 'ready in a comment');
    assert.ok(m.indexOf('Testimonial: HIDDEN') > m.indexOf('id="dashboard"') && m.indexOf('Testimonial: HIDDEN') < m.indexOf('id="book"'), 'between the portal and the call');
  });
});
