// The site's pages against the owner's brief of November 21, 2026: the full site again (Home, Field Team, Industries,
// How It Works, FAQ, About, Contact), "Boots on the ground for your local business." on the home page with the orb they
// picked, each page with its own job, and no pricing anywhere.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { read, text, attr, hasAttr, tags, byId, mainOf, links, FORBIDDEN, ROOT, INDUSTRIES } from './html.mjs';

const html = read('index.html');
const main = mainOf(html);
const sec = (id) => {
  const s = byId(html, id);
  assert.ok(s, `#${id} exists`);
  return s;
};

describe('home: the hero and the orb', () => {
  test('the sections: the hero, what we do, industries, the portal, the call', () => {
    const ids = [...main.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['what-we-do', 'industries', 'dashboard', 'book']);
    assert.ok(main.indexOf('class="hero-orb"') < main.indexOf('id="what-we-do"'), 'the hero comes first');
  });
  test('the hero: the owner\'s exact line, the main message, Book a call and How it works', () => {
    const hero = /<section class="hero-orb"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(text(/<h1 id="hero-h">([\s\S]*?)<\/h1>/.exec(hero)[1]), 'Boots on the ground for your local business.');
    assert.equal(text(/<p class="lede">([\s\S]*?)<\/p>/.exec(hero)[1]),
      'Our team visits the businesses near you, introduces your business to their staff, and tracks every visit and sign-up in your portal.');
    assert.deepEqual(links(hero).map((l) => [l.text, l.href]), [['Book a call', '/contact'], ['See how it works', '/referral-network']]);
    assert.match(read('index.html'), /<title>Our Wellness Network \| Boots on the Ground for Your Local Business<\/title>/);
  });
  test('the orb the owner picked (assets/home-orb.js): one canvas in the hero, your business at its centre, illustrated owners, no real business', () => {
    const hero = /<section class="hero-orb"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(tags(hero, 'canvas').length, 1);
    assert.equal(attr(tags(hero, 'canvas')[0], 'id'), 'orb');
    assert.match(attr(tags(hero, 'canvas')[0], 'aria-label'), /^Your referral network: your business/);
    assert.match(html, /<script src="\/assets\/home-orb\.js" defer><\/script>/);
    const js = read('assets/home-orb.js');
    assert.match(js, /const clinic = \{ label: 'Your business'/);
    assert.doesNotMatch(js, /'Your clinic'/);
    for (const b of ['Gym', 'Hair salon', 'Yoga studio', 'Boutique', 'Physical therapy', 'Nail salon']) assert.match(js, new RegExp(`label: '[A-Z][a-z]+ · ${b}'`), b);
    assert.match(js, /prefers-reduced-motion: reduce/);
    assert.match(js, /sessionStorage/, 'the network builds once per visit');
    assert.match(js, /querySelectorAll\('h1, \.lede, \.actions/, 'the owners keep clear of the words');
    assert.doesNotMatch(js, /https?:\/\/|import /, 'no libraries and no outside requests');
    assert.match(read('assets/site.css'), /\.hero-orb\{[^}]*--rose:var\(--gold\)/, 'the centre is the brand gold');
    for (const f of ['assets/home-wave.js', 'assets/network-orb.js']) assert.ok(!existsSync(new URL(f, ROOT)), f);
  });
});

describe('home: one short section per page it points to', () => {
  test('what we do: three steps, each pointing to the page that explains it', () => {
    const s = sec('what-we-do');
    assert.deepEqual(links(s).map((l) => l.href), ['/referral-network#matching', '/field-team', '/referral-network#dashboard']);
    assert.equal(tags(s, 'li').length, 3);
  });
  test('industries: one card per industry, each opening its section of /industries', () => {
    const hrefs = links(sec('industries')).map((l) => l.href);
    assert.deepEqual(hrefs, [...INDUSTRIES.map((i) => `/industries#${i}`), '/industries']);
    assert.doesNotMatch(text(sec('industries')), /leasing/i);
  });
  test('the portal: one screen, the Client Portal link, and How It Works for the rest', () => {
    const s = sec('dashboard');
    assert.equal(tags(s, 'img').length, 1);
    assert.match(attr(tags(s, 'img')[0], 'src'), /portal2-routes-1280\.jpg$/);
    assert.ok(links(s).some((l) => l.href === 'https://www.ournetworkportal.com'));
    assert.ok(links(s).some((l) => l.href === '/referral-network#dashboard'));
  });
  test('the call band: Book a call and the phone number', () => {
    const s = sec('book');
    assert.ok(links(s).some((l) => l.href === '/contact' && l.text === 'Book a call'));
    assert.ok(links(s).some((l) => l.href === 'tel:+13312716851' && /331-271-6851/.test(l.text)));
  });
  test('no prices, no treats talk, no dinner, no placeholders on the home page', () => {
    assert.doesNotMatch(text(main), /\$\d|pricing|trial|coffee|treats/i);
    assert.doesNotMatch(main, /patient-network|patient dinner|\[[A-Z]/i);
    for (const w of FORBIDDEN) assert.ok(!html.includes(w), w);
  });
});

describe('the Industries page (November 21, 2026)', () => {
  const ind = read('industries.html');
  test('one section per industry, in order, each with the kinds of business we visit', () => {
    const ids = [...ind.matchAll(/<li class="ind-item[^"]*" id="([^"]+)">/g)].map((m) => m[1]);
    assert.deepEqual(ids, INDUSTRIES);
    for (const id of INDUSTRIES) assert.equal(tags(byId(ind, id), 'li').length, 6, id);
    assert.deepEqual(links(/<nav class="ind-jump"[\s\S]*?<\/nav>/.exec(ind)[0]).map((l) => l.href), INDUSTRIES.map((i) => `#${i}`));
  });
  test('healthcare points to the FAQ instead of repeating it; the call goes to the form', () => {
    assert.ok(links(ind).some((l) => l.href === '/faq#healthcare'));
    assert.doesNotMatch(text(ind), /reviewed for compliance/);
    assert.ok(links(ind).some((l) => l.href === '/contact?about=industries' && l.text === 'Book a call'));
  });
  test('the eight old industry pages and the generator are gone; their addresses 301 to their sections', () => {
    assert.ok(!existsSync(new URL('industries/', ROOT)));
    assert.ok(!existsSync(new URL('tools/', ROOT)));
    const toml = read('netlify.toml');
    for (const i of INDUSTRIES) {
      assert.match(toml, new RegExp(`from = "/industries/${i}"\\n  to = "/industries#${i}"\\n  status = 301\\n  force = true`), i);
      assert.match(toml, new RegExp(`from = "/industries/${i}\\.html"\\n  to = "/industries#${i}"`), i);
    }
    assert.doesNotMatch(toml, /from = "\/industries"\n  to = "\/"/, '/industries is a page again');
  });
});

describe('pricing came off (November 21, 2026)', () => {
  test('no pricing page; its addresses go to /contact', () => {
    assert.ok(!existsSync(new URL('pricing.html', ROOT)));
    const toml = read('netlify.toml');
    assert.match(toml, /from = "\/pricing"\n  to = "\/contact"\n  status = 301\n  force = true/);
    assert.match(toml, /from = "\/pricing\.html"\n  to = "\/contact"/);
    assert.doesNotMatch(read('sitemap.xml'), /pricing/);
  });
  test('the terms keep how prices are agreed in writing, with no figures and no pricing page', () => {
    const t = text(mainOf(read('terms.html')));
    assert.doesNotMatch(t, /\$\d|pricing page|\[[A-Z]/);
    assert.match(t, /After any minimum term agreed in writing before you start, plans run month to month/);
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
    assert.doesNotMatch(text(mainOf(gt)), /Boots on the ground/i, 'the home page has that line');
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
describe('the portal tour (How It Works only, November 21, 2026)', () => {
  const SCREENS = ['route', 'network', 'partners', 'results'];
  for (const [file, id, prefix] of [['referral-network.html', 'dashboard', 'hw']]) {
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
  test('the tour is on How It Works only; the home page shows one screen and Field Team links to the tour', () => {
    assert.doesNotMatch(read('index.html'), /data-ptour/);
    assert.doesNotMatch(read('field-team.html'), /data-ptour/);
    assert.ok(links(read('field-team.html')).some((l) => l.href === '/referral-network#dashboard'));
  });
  test('the old driver screens and driver photos are gone', () => {
    for (const f of ['index.html', 'field-team.html', 'referral-network.html']) assert.doesNotMatch(read(f), /drivers?-(card|next-route|orb|phone|stop|elena|marcus|omar|tasha)/, f);
    assert.ok(!existsSync(new URL('assets/img/drivers-card-546.jpg', ROOT)));
    assert.ok(!existsSync(new URL('assets/img/driver-marcus.jpg', ROOT)));
  });
});

