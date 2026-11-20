// The home page, section by section, against the owner's brief of October 23, 2026 and their notes on the preview, and the pricing page's offer.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { read, text, attr, hasAttr, tags, byId, mainOf, links, FORBIDDEN, ROOT } from './html.mjs';

const html = read('index.html');
const main = mainOf(html);
const sec = (id) => {
  const s = byId(html, id);
  assert.ok(s, `#${id} exists`);
  return s;
};

describe('home: order and hero', () => {
  test('the sections (November 20, 2026): the general promise, Industries, in person, the portal, Treats for Staff, in writing, the call; no pricing, no map', () => {
    const ids = [...main.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['industries', 'in-person', 'dashboard', 'treats', 'compliance', 'book']);
    assert.doesNotMatch(text(main), /\$\d/, 'no prices on the home page (pricing is its own page)');
    assert.ok(main.indexOf('hero-wave') < main.indexOf('id="in-person"'), 'the hero comes first');
  });
  test('the hero: headline and line, with no buttons and no example card', () => {
    const hero = /<section class="hero-wave"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(text(/<h1 id="hero-h">([\s\S]*?)<\/h1>/.exec(hero)[1]), 'Your outsourced field sales team.');
    assert.equal(text(/<p class="lede">([\s\S]*?)<\/p>/.exec(hero)[1]),
      'We visit the businesses around you, build relationships with their staff, and turn them into a referral network you can track.');
    assert.deepEqual(links(hero), [], 'no links: the Devon\'s gym card came off on October 26, 2026');
    assert.doesNotMatch(hero, /class="btn/, 'no buttons');
    assert.doesNotMatch(text(hero), /Devon|30 clients|tap-to-schedule/, 'the owner took the card down');
    assert.doesNotMatch(hero, /proof-row|proof-one/);
    assert.doesNotMatch(text(hero), /Marcus/);
    assert.doesNotMatch(text(hero), /staff reached|sign-ups|booked/);
  });
  test('the wave: one canvas drawn by home-wave.js, the wellness partners riding it, clear of the words', () => {
    const hero = /<section class="hero-wave"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(tags(hero, 'canvas').length, 1);
    assert.match(attr(tags(hero, 'canvas')[0], 'aria-label'), /pending connections to a nearby gym, yoga studio, physical therapy practice, hair salon and nail salon/);
    assert.match(html, /<script src="\/assets\/home-wave\.js" defer><\/script>/);
    assert.ok(!existsSync(new URL('assets/home-orb.js', ROOT)), 'the dot orb is gone');
    assert.doesNotMatch(html, /home-orb|hero-orb|id="orb"/);
    const js = read('assets/home-wave.js');
    assert.match(js, /querySelectorAll\('h1, \.lede'\)/, 'the people keep clear of the words');
    for (const b of ['Gym', 'Yoga studio', 'Physical therapy', 'Hair salon', 'Nail salon']) assert.match(js, new RegExp(`label: '[A-Z][a-z]+ · ${b}'`), b);
    assert.doesNotMatch(js, /Boutique/, 'wellness businesses only');
    assert.doesNotMatch(js, /'Pending'/, 'no Pending labels: the dashed lines say it (the owner\'s call)');
    assert.match(js, /setLineDash\(\[5, 6\]\)/, 'dashed, pending connections');
    assert.match(js, /height\(n\.gx, n\.gz, t\) \* ride/, 'the people ride the wave');
    assert.match(js, /prefers-reduced-motion: reduce/);
    assert.match(js, /sessionStorage/, 'the network builds once per visit');
    assert.doesNotMatch(js, /https?:\/\/|THREE|import /, 'no libraries and no outside requests');
  });
});

describe('home: the sections', () => {
  test('b. the dashboard on the green band: the screens pop in like every other block, no scroll-driven tilt', () => {
    const s = sec('dashboard');
    assert.match(main, /<section class="section bg-ink owc-dash-band" aria-labelledby="dashboard-h" id="dashboard">/, 'on the green band');
    assert.equal(text(/<h2 id="dashboard-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Your drivers, your routes, and every sign-up.');
    assert.match(s, /<div class="ptour reveal" data-ptour>/, 'the same smooth pop-in as the rest of the page');
    assert.doesNotMatch(s, /data-tilt|owc-tilt|owc-scroll-cue/, 'no tilt and no scroll cue (the owner\'s call)');
  });
  test('b. no map anywhere: no Google request, no Maps key, no map images', () => {
    assert.doesNotMatch(html, /owc-geo|id="matching"|openstreetmap/i);
    assert.doesNotMatch(read('assets/site-config.js'), /googleMap/);
    assert.doesNotMatch(read('assets/site.js'), /googleapis|googleMap|owc-geo/);
    assert.match(read('netlify.toml'), /img-src 'self' data:;/, 'the CSP allows no outside images');
    assert.doesNotMatch(read('privacy.html'), /googleMap|Google Maps/);
    assert.ok(!existsSync(new URL('assets/img/map-base-1200.jpg', ROOT)));
  });
  test('c. Treats for Staff: hospitality on every visit, modest, never tied to referrals (November 20, 2026)', () => {
    const t = text(sec('treats'));
    assert.match(t, /Treats for Staff: hospitality, every visit\./);
    assert.match(t, /brings coffee and treats for the entire staff of each partner business/);
    assert.match(t, /modest by design: coffee, pastries and snacks/);
    assert.doesNotMatch(t, /refer|send|sign-up|code/i, 'treats are never connected to referrals, sign-ups or performance');
    assert.doesNotMatch(html, /courtesy/i, 'the staff courtesy program is gone, comments included');
  });
  test('a2. Industries: one card per industry page, built from the industry data', () => {
    const s = sec('industries');
    const hrefs = links(s).map((l) => l.href);
    assert.deepEqual(hrefs, ['/industries/med-spas', '/industries/dental', '/industries/chiropractic-physical-therapy', '/industries/gyms-fitness-studios', '/industries/salons-barbershops', '/industries/restaurants-cafes', '/industries/home-services', '/industries/auto-shops']);
    for (const h of hrefs) assert.ok(existsSync(new URL('.' + h + '.html', ROOT)), h);
  });
  test('b. the dashboard: the screens and what it shows; no visit log line and no Client Portal box (it is in the header)', () => {
    const s = sec('dashboard');
    const t = text(s);
    const labels = (s.match(/<span class="owc-tag sample-tag">Sample account, illustrative data<\/span>/g) || []).length;
    assert.equal(labels, 5, 'a visible sample label beside each of the 4 screens and beside the figures (November 20, 2026)');
    assert.match(s, /<p class="sample-note reveal"><span class="owc-tag sample-tag">Sample account, illustrative data<\/span><\/p>\n    <dl class="own-stats/);
    assert.doesNotMatch(t, /Inside your referral network portal/);
    assert.match(t, /who is driving your next route, every business they walked into/);
    for (const label of ['Stops visited', 'Staff reached', 'Referral cards handed out', 'Staff sign-ups', 'Booked by the front desk']) assert.ok(t.includes(label), label);
    assert.match(read('assets/site.css'), /\.own-stats dd\{font-family:var\(--nums\)|\.own-stats dd\{font-family/, 'the numbers use the system face');
    assert.doesNotMatch(t, /visit log/i, 'the owner took the visit log line out');
    assert.ok(!links(s).some((l) => l.href === 'https://www.ournetworkportal.com'), 'no Client Portal box in this section');
    for (const img of tags(s, 'img')) assert.match(attr(img, 'src'), /^\/assets\/img\/portal2-/, 'screens from the client portal (November 14, 2026)');
  });
  test('no results section: no "real clinics, real numbers", no texting form, no results files', () => {
    assert.doesNotMatch(html, /id="results"|Real clinics|Oakbrook Terrace|results-updates|data-results/);
    assert.doesNotMatch(html, /results\.js/);
    assert.ok(!existsSync(new URL('assets/results.js', ROOT)));
    assert.ok(!existsSync(new URL('assets/data/results.json', ROOT)));
    assert.ok(!existsSync(new URL('updates-thanks.html', ROOT)));
  });
  test('a. in person: coffee, treats and real people, three scenes', () => {
    const s = sec('in-person');
    const t = text(s);
    assert.match(t, /Coffee, treats and a real hello\./);
    assert.equal(tags(s, 'img').length, 3);
    for (const img of tags(s, 'img')) assert.match(attr(img, 'src'), /^\/assets\/img\/visit-(treats|chat|tap)-/);
  });
  test('e. in writing, for every business: no legal conclusions, no attorney review claimed anywhere, the HIPAA line held back', () => {
    const t = text(sec('compliance'));
    assert.ok(t.includes('Every partner business signs a one-page agreement: mutual promotion, and nobody is paid per referral or per customer.'));
    assert.ok(t.includes('Partners never see who signed up.'));
    assert.ok(t.includes("We never describe your services in words you haven't approved, and we make no medical or health claims."));
    assert.doesNotMatch(t, /medical director|compliant|legal/i);
    const cfg = read('assets/site-config.js');
    assert.doesNotMatch(cfg, /attorney/i, 'no attorney review claimed, not even in a switched-off line');
    assert.match(cfg, /hipaaConfirmed: false,\n  hipaaText: ''/, 'no HIPAA sentence until the owner confirms it');
    assert.match(html, /<script src="\/assets\/site-config\.js" defer><\/script>\n<script src="\/assets\/site\.js" defer>/);
  });
  test('f. no dinner on the home page (pricing only)', () => {
    assert.doesNotMatch(main, /patient-network|patient dinner/i);
  });
  test('f2. the case study is a hidden template (a comment), with placeholders only', () => {
    const c = /<!-- ===== f\. Case study[\s\S]*?===== -->/.exec(html);
    assert.ok(c, 'the template is there, commented out');
    for (const ph of ['[CLIENT NAME]', '[INDUSTRY]', '[STOPS]', '[SIGN-UPS]', '[BOOKINGS]', '[CLIENT QUOTE]']) assert.ok(c[0].includes(ph), ph);
    assert.doesNotMatch(text(main), /\[CLIENT/, 'nothing of it is visible');
  });
  test('g. the final call to action, with the phone number', () => {
    const s = sec('book');
    assert.match(text(s), /Book a 15-minute call\. We'll show you your matched businesses on the call\./);
    assert.ok(links(s).some((l) => l.href === '/contact'));
    assert.ok(links(s).some((l) => l.href === 'tel:+13312716851' && /331-271-6851/.test(l.text)));
  });
});

describe('pricing page: the offer', () => {
  const p = read('pricing.html');
  const t = text(mainOf(p));
  test('the trial and the two plans', () => {
    assert.match(t, /\$450/);
    for (const [plan, price] of [['Neighborhood', '$600'], ['Community', '$1,100']]) {
      assert.match(t, new RegExp(plan), plan);
      assert.ok(t.includes(price), price);
    }
    assert.match(t, /1 route/i);
    assert.match(t, /2 routes/i);
    assert.doesNotMatch(t, /4 routes|Starter|Reach/);
    assert.match(t, /fresh-baked treats/i);
  });
  test('the trial guarantee: all 5 visits and the codes within 30 days; no sign-up guarantee (the owner took it out, November 19, 2026)', () => {
    assert.match(t, /If we haven't visited all 5 businesses and set up your codes within 30 days, the \$450 comes back\./);
    assert.match(t, /keep the partner relationships/i);
    assert.doesNotMatch(t, /45 days|tracked sign-ups|both guarantees|two (trial |written )?guarantees|Guarantee 2/i);
  });
  test('terms, who supplies what, add-ons priced on a call', () => {
    assert.match(t, /month to month/i);
    assert.match(t, /30 days'? notice/i);
    assert.match(t, /never moves with referrals, leads or bookings/i);
    assert.match(t, /printed materials/i);
    assert.match(t, /at no charge/i);
    assert.match(t, /priced on a call/i);
    for (const href of ['/online-search-network', '/review-tags', '/website-design', '/patient-network']) assert.ok(links(p).some((l) => l.href === href), href);
  });
  test('no old price or old starter item', () => {
    for (const w of FORBIDDEN) assert.ok(!p.includes(w), w);
    assert.doesNotMatch(t, /\$200|\$2,000/);
  });
});

describe('the Field Team page (was Boots on the ground, and before that the growth team page)', () => {
  const gt = read('field-team.html');
  test('the headline; Treats for Staff never tied to referrals; no breadcrumb', () => {
    assert.ok(/<h1 id="pg-h">/.test(gt));
    assert.doesNotMatch(gt, /pg-crumbs/, 'no breadcrumb');
    assert.match(text(gt), /Treats for Staff/);
    assert.doesNotMatch(text(gt), /whether or not they ever send anyone|whether or not anyone refers/, 'only the FAQ says that');
    assert.doesNotMatch(gt, /courtesy|Boots on the ground|Growth team/i);
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
    test(`${file} #${id}: the phone screens on phones, the desktop screens elsewhere, every one described as the sample account`, () => {
      const imgs = tags(s, 'img');
      assert.equal(imgs.length, 4);
      for (const img of imgs) {
        assert.match(attr(img, 'src'), /^\/assets\/img\/portal2-(stops|network|partners|routes)-1280\.jpg$/);
        assert.match(attr(img, 'alt'), /^Screenshot of the portal's sample account: /);
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

