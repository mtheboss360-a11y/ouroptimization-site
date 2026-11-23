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
    assert.deepEqual(ids, ['industries', 'network', 'in-person', 'dashboard', 'levels', 'treats', 'compliance', 'book']);
    assert.doesNotMatch(text(main), /\$\d/, 'no prices on the home page');
    const heroAt = main.indexOf('class="hero-orb"');
    assert.ok(heroAt >= 0 && heroAt < main.indexOf('id="industries"'), 'the hero comes first');
  });
  test('the hero: the owner\'s line (November 21, 2026) and the three display photos (November 23, 2026), with no buttons and no example card', () => {
    const hero = /<section class="hero-orb"[\s\S]*?<\/section>/.exec(main)[0];
    /* November 23, 2026: the outcome first, the how second; two short sentences */
    assert.equal(text(/<h1 id="hero-h">([\s\S]*?)<\/h1>/.exec(hero)[1]), 'New customers and bookings from the businesses near you.');
    assert.equal(text(/<p class="lede">([\s\S]*?)<\/p>/.exec(hero)[1]),
      'Every month our team visits local businesses that recommend you to their customers.');
    const photos = ['salon', 'bakery', 'medspa'];
    assert.deepEqual(links(hero).map((l) => l.href), photos.map((n) => `/assets/img/display-${n}.png`), 'the only links open the full-size photos');
    for (const n of photos) assert.ok(existsSync(new URL(`./assets/img/display-${n}.png`, ROOT)), n);
    assert.equal(tags(hero, 'img').length, 3);
    for (const img of tags(hero, 'img')) assert.ok(attr(img, 'alt').length > 40, 'each photo is described');
    assert.doesNotMatch(hero, /class="btn/, 'no buttons');
    assert.doesNotMatch(hero, /hero-lv|Level [12]/, 'the levels are further down the page');
    assert.doesNotMatch(text(hero), /Devon|30 clients|tap-to-schedule/, 'the owner took the card down');
    assert.doesNotMatch(hero, /proof-row|proof-one/);
    assert.doesNotMatch(text(hero), /Marcus/);
    assert.doesNotMatch(text(hero), /staff reached|sign-ups|booked/);
  });
  test('the half orb the owner picked (assets/home-orb.js): one canvas, your business at its gold centre, illustrated owners clear of the words', () => {
    const hero = /<section class="hero-orb"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(tags(hero, 'canvas').length, 1);
    assert.equal(attr(tags(hero, 'canvas')[0], 'id'), 'orb');
    assert.match(html, /<script src="\/assets\/home-orb\.js" defer><\/script>/);
    for (const f of ['assets/home-wave.js', 'assets/network-orb.js']) assert.ok(!existsSync(new URL(f, ROOT)), f);
    assert.doesNotMatch(html, /home-wave|hero-wave|id="wave"/);
    const js = read('assets/home-orb.js');
    assert.match(js, /const clinic = \{ label: 'Your business'/);
    for (const b of ['Gym', 'Hair salon', 'Yoga studio', 'Boutique', 'Physical therapy', 'Nail salon']) assert.match(js, new RegExp(`label: '[A-Z][a-z]+ · ${b}'`), b);
    assert.match(js, /querySelectorAll\('h1, \.lede, \.actions/, 'the owners keep clear of the words');
    assert.match(js, /prefers-reduced-motion: reduce/);
    assert.match(js, /sessionStorage/, 'the network builds once per visit');
    assert.doesNotMatch(js, /https?:\/\/|import /, 'no libraries and no outside requests');
    assert.match(read('assets/site.css'), /\.hero-orb\{[^}]*--rose:var\(--gold\)/, 'the centre is the brand gold');
  });
});

describe('home: the sections', () => {
  test('b. the dashboard on the green band: the screens pop in like every other block, no scroll-driven tilt', () => {
    const s = sec('dashboard');
    assert.match(main, /<section class="section bg-ink owc-dash-band" aria-labelledby="dashboard-h" id="dashboard">/, 'on the green band');
    assert.equal(text(/<h2 id="dashboard-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'See every visit and every sign-up.');
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
    assert.match(t, /Treats for Staff: a warm hello, every visit\./);
    assert.match(t, /We bring coffee and treats for everyone on shift\./);
    assert.match(t, /The treats are modest: coffee, pastries and snacks\./);
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
    assert.doesNotMatch(s, /Sample account|illustrative data|sample-tag|sample-note/, 'no visible sample labels (the owner took them off, November 21, 2026)');
    assert.doesNotMatch(t, /Inside your referral network portal/);
    assert.match(t, /Your client portal shows where our team went, who they met and who signed up\./);
    for (const label of ['Stops visited', 'Staff reached', 'Referral cards handed out', 'Staff sign-ups', 'Booked by the front desk']) assert.ok(t.includes(label), label);
    assert.match(read('assets/site.css'), /\.own-stats dd\{font-family:var\(--nums\)|\.own-stats dd\{font-family/, 'the numbers use the system face');
    assert.doesNotMatch(t, /visit log|\[STOPS/i, 'no visit log line, no placeholder');
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
    assert.ok(t.includes('Nobody is paid per referral or per customer.'));
    assert.ok(t.includes('Partners never see who signed up.'));
    assert.ok(t.includes('We only use words you have approved. We make no medical or health claims.'));
    assert.doesNotMatch(t, /medical director|compliant|legal/i);
    const cfg = read('assets/site-config.js');
    assert.doesNotMatch(cfg, /attorney/i, 'no attorney review claimed, not even in a switched-off line');
    assert.match(cfg, /hipaaConfirmed: false,\n  hipaaText: ''/, 'no HIPAA sentence until the owner confirms it');
    assert.match(html, /<script src="\/assets\/site-config\.js" defer><\/script>\n<script src="\/assets\/site\.js" defer>/);
  });
  test('f. no dinner on the home page (the FAQ links the add-ons)', () => {
    assert.doesNotMatch(main, /patient-network|patient dinner/i);
  });
  test('f2. no placeholder text: the hidden case study template and the founding line are gone (November 21, 2026)', () => {
    assert.doesNotMatch(html, /\[[A-Z][A-Z :,'-]+\]|Case study|ind-founding|founding/i);
    assert.doesNotMatch(text(main), /\$\d|pricing|trial/i, 'no pricing on the home page');
  });
  test('g. the final call to action, with the phone number', () => {
    const s = sec('book');
    assert.match(text(s), /Book a 15-minute call\. We'll show you the businesses near you we would visit\./);
    assert.ok(links(s).some((l) => l.href === '/contact'));
    assert.ok(links(s).some((l) => l.href === 'tel:+13312716851' && /331-271-6851/.test(l.text)));
  });
});

describe('pricing came off (November 21, 2026)', () => {
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
    assert.doesNotMatch(text(mainOf(gt)), /Boots on the ground/i, 'the home hero has that line');
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
  });
});

describe('November 23, 2026: the network, only what is already true', () => {
  const net = text(sec('network'));
  test('the head and the two cards say what the terms and the partner agreement say', () => {
    assert.match(net, /Local businesses, promoting each other\./);
    assert.match(net, /We bring together businesses that share customers but don.t compete\. On Level 2, every partner signs a one-page agreement: each side promotes the other\./);
    assert.match(net, /We pick the businesses near you that share your customers and don.t compete with you\. You approve every one before a visit\./);
    assert.match(net, /On Level 2, each partner promotes one business of your kind: yours, for as long as you are a client\./);
    assert.match(sec('network'), /href="\/referral-network#agreement"/, 'links to the agreement itself');
  });
  test('no claim the network cannot back: no certification, prestige, perks, or members trading customers', () => {
    assert.doesNotMatch(net, /certif|prestig|exclusive club|\bclub\b|decal|directory|member/i);
    assert.doesNotMatch(net, /send (each other|you) (customers|patients|clients)|referral swap|refer (each other|patients)/i);
  });
  test('the terms still back every line', () => {
    const terms = text(read('terms.html'));
    assert.match(terms, /ranks the non-competing ones that share your customers\. You approve the list before any visit/);
    assert.match(terms, /The partners we sign for you agree to promote one business of your kind, yours, for as long as you are a client\./);
    const rn = text(read('referral-network.html'));
    assert.match(rn, /On Level 2, every partner we sign for you signs it\./);
    assert.match(rn, /Each side promotes the other\./);
  });
});
