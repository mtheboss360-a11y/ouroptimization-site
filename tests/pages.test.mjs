// Static checks of every page of the multi-page site (October 22, 2026): the shared header, tabs
// and footer, each page's head tags and its one h1, the content of each page, and the copy rules
// that apply site-wide (no prices, no promised results, no names of prospects, nobody paid per patient,
// no promises about patient data, the name and number only where they belong, no "we're new" lines).
// Zero dependencies: node:test + node:assert. Run from the repo root: node --test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { read, PAGES, TABS, text, attr, tags, byId, mainOf, links, repoTextFiles, decode } from './html.mjs';

const require = createRequire(import.meta.url);
const call = require('../assets/call.js');
const page = Object.fromEntries(PAGES.map((p) => [p.file, read(p.file)]));
const main = (file) => mainOf(page[file]);
const SITE = 'https://ouroptimization.com';
/* The marketing pages (everything but the legal pages, the thank-you page and the 404). */
const MARKETING = PAGES.filter((p) => p.tab).map((p) => p.file);
const sha = (s) => createHash('sha256').update(s).digest('hex');
/* The shared header and footer of a page. */
const headerOf = (src) => /<header class="site-header"[\s\S]*?<\/header>/.exec(src)[0];
const footerOf = (src) => /<footer class="site-foot">[\s\S]*?<\/footer>/.exec(src)[0];
/* Everything a reader or a search result can see: the visible text, plus meta content and alt text. */
const copyOf = (src) => [text(src), ...tags(src, 'meta').map((t) => attr(t, 'content') || ''), ...tags(src, 'img').map((t) => attr(t, 'alt') || '')]
  .map((x) => decode(x).replace(/[‘’]/g, "'")).join(' \n ');
/* SHA-256 of each name that must never appear (prospects, the gyms in the ETHR LAB kit, people), lowercased. */
const NAME_HASHES = new Set([
  'c74078a3ebc16cd97e4e9dbb1b0c60081632b9c917722f600863e7f52d5dba14',
  '747a5a4b790c8e9a7c6ad6886862075517519fd01c81e00748f43a859f8e8d60',
  '8a884b0c8547032594cb6eadf415f3ab68edfea303bccc999aa8bbaff243806e',
  '66c9ad24ea18f3686161fd5902b3461da0530fcdeaffe882d607f852c29112d3',
  '002b97a2e7c4942065f5070f33cfc3f71fb9f0081b573934124d877eae45b6d3',
  '11ec008d37b87b081034260fcf9d6e1e438969101d31dbce2d8e42caa49a968f',
  '76370ae20734a8d341f355e8091fb0a5340ff3d9cb264da20528c71ac69f6aab',
  '5681cd61a0fb6102485a25523419a89ae8876df4418334a134cbbfa3ead9aa5f',
  'fffacee1653cf049fafbc6d38c97f623b388846034702625c67f0a508710ce7e',
  'b30dfe3a359c4dfbd77bc1baf9b28c6e7ba822da313b96e6593f52ea5184c001',
  'beb36072d305626f55b4f3450d71e4cc8f9c5b0ebbb73bd8712eed8bc3e18c82',
  '4a0c40e6b7d4ce03faf332036bb51961952570da5b6319bd713ca8b3443c19d9',
  '5b8af9e5e961575968f7b58564fdd527b898ca76cf364fe1ca8b3c582753796c'
]);

/* ---------- every page ---------- */
describe('every page: head, one h1, header tabs, breadcrumbs and footer', () => {
  const header = (src) => /<header class="site-header"[\s\S]*?<\/header>/.exec(src)[0];
  const footer = (src) => /<footer class="site-foot">[\s\S]*?<\/footer>/.exec(src)[0];
  const homeHeader = header(page['index.html']).replace(' aria-current="page"', '');

  for (const p of PAGES) {
    const src = page[p.file];
    test(`${p.file}: one h1, its own title and description, canonical and share tags`, () => {
      assert.equal((src.match(/<h1\b/g) || []).length, 1, 'exactly one h1');
      const metas = tags(src, 'meta');
      const meta = (k, v) => { const t = metas.find((m) => attr(m, k) === v); return t && decode(attr(t, 'content')); };
      const title = decode(/<title>([^<]+)<\/title>/.exec(src)[1]);
      assert.ok(title.length > 10, 'title');
      assert.ok((meta('name', 'description') || '').length > 30, 'meta description');
      if (p.url === null || p.url === '/thanks') assert.equal(meta('name', 'robots'), 'noindex');
      else assert.equal(meta('name', 'robots'), undefined, 'indexable');
      if (p.url) {
        const url = SITE + (p.url === '/' ? '/' : p.url);
        assert.ok(src.includes(`<link rel="canonical" href="${url}">`), 'canonical');
        assert.equal(meta('property', 'og:url'), url);
      }
      assert.equal(meta('property', 'og:title'), title);
      assert.equal(meta('name', 'twitter:title'), title);
      assert.equal(meta('property', 'og:description'), meta('name', 'description'));
      assert.equal(meta('name', 'twitter:description'), meta('name', 'description'));
      // The home page's share image leads with the referral network; /patient-network keeps the dinners one.
      assert.equal(meta('property', 'og:image'), `${SITE}/assets/img/${p.file === 'patient-network.html' ? 'og-network-best-patients.jpg' : 'og-network-neighbors.jpg'}`);
      assert.equal(meta('property', 'og:site_name'), 'Our Wellness Network');
      assert.match(meta('property', 'og:image:alt'), /^Our Wellness Network logo with the words /);
      assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
    });

    test(`${p.file}: the shared header, with ${p.tab ? `"${p.tab}"` : 'no tab'} as the current tab`, () => {
      const h = header(src);
      const navLinks = links(/<nav class="site-nav"[\s\S]*?<\/nav>/.exec(h)[0]);
      assert.deepEqual(navLinks.map((l) => [l.text, l.href]), [...TABS, ['Book a 15-minute call', '/contact']], 'every page is a tab, then the call link for phones');
      const current = navLinks.filter((l) => /aria-current="page"/.test(l.tag)).map((l) => l.text);
      assert.deepEqual(current, p.tab ? [p.tab] : [], 'aria-current marks the tab of this page');
      assert.equal(h.replace(' aria-current="page"', ''), homeHeader, 'the header is the same on every page');
      assert.match(h, /<a class="btn btn-primary btn-head" href="\/contact">Book a 15-minute call<\/a>/);
      assert.match(h, /<a class="head-tel" href="tel:\+13312716851">/);
    });

    test(`${p.file}: the shared footer lists every page`, () => {
      const f = footer(src);
      const onSite = /<h2>On this site<\/h2>\s*<ul>([\s\S]*?)<\/ul>/.exec(f)[1];
      assert.deepEqual(links(onSite).map((l) => [l.text, l.href]), TABS);
      assert.deepEqual(links(/<h2>Legal<\/h2>\s*<ul>([\s\S]*?)<\/ul>/.exec(f)[1]).map((l) => l.href), ['/privacy', '/terms']);
      assert.doesNotMatch(f, /<h3>/, 'the footer headings are h2, so no page skips a heading level');
      assert.equal(text(/<div class="foot-brand">([\s\S]*?)<\/div>/.exec(f)[1]), "Referral, flyer and patient networks for independent med spas, from Chicago's western suburbs.", 'the footer line leads with the referral network');
      assert.equal(text(/<div class="foot-bottom">\s*<p>([\s\S]*?)<\/p>/.exec(f)[1]), '© 2026 OUR Optimization LLC. Our Wellness Network is a brand of OUR Optimization LLC.');
      assert.equal(f.replace(/\n\s*<p>Integrative Wellness is a sample brand used to show our work\.<\/p>/, ''), footer(page['index.html']), 'the footer is the same on every page');
    });

    if (p.tab && p.url !== '/') {
      test(`${p.file}: breadcrumbs lead back home`, () => {
        const crumbs = /<nav class="pg-crumbs" aria-label="Breadcrumb">([\s\S]*?)<\/nav>/.exec(src);
        assert.ok(crumbs, 'breadcrumbs');
        assert.equal(text(crumbs[1]), `Home${p.tab}`);
        assert.match(crumbs[1], /<li><a href="\/">Home<\/a><\/li><li><span aria-current="page">[^<]+<\/span><\/li>/);
      });
    }
  }

  test('every page carries the same portal bar: the client login, off-site', () => {
    const barOf = (src) => /<div class="portal-bar">[\s\S]*?<\/div>\s*<\/div>/.exec(src);
    const first = barOf(page['index.html']);
    assert.ok(first, 'the home page has a portal bar');
    for (const p of PAGES) {
      const bar = barOf(page[p.file]);
      assert.ok(bar, `${p.file}: portal bar`);
      assert.equal(bar[0], first[0], `${p.file}: the portal bar is identical on every page`);
    }
    assert.deepEqual(links(first[0]).map((l) => [l.href, l.text]), [
      ['https://ournetworkportal.com', 'Client Portal']
    ]);
    // The portal is a separate application on its own host, so these are the only off-site links.
    for (const p of PAGES) {
      const offsite = [...page[p.file].matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1])
        .filter((h) => !h.startsWith('https://ouroptimization.com'));
      for (const href of offsite) assert.match(href, /^https:\/\/ournetworkportal\.com$/, `${p.file}: unexpected off-site link ${href}`);
    }
  });

  test('the tabs run Home, the three steps, the extras, then About, FAQ and Contact', () => {
    assert.deepEqual(TABS.map((t) => t[0]), ['Home', 'Referral Network', 'Flyer Network', 'Patient Network', 'Online Search Network', 'Review Tags', 'Website Design', 'About', 'FAQ', 'Contact']);
    assert.deepEqual(TABS.map((t) => t[1]), ['/', '/referral-network', '/flyer-network', '/patient-network', '/online-search-network', '/review-tags', '/website-design', '/about', '/faq', '/contact']);
    for (const p of PAGES) {
      const nav = links(/<nav class="site-nav"[\s\S]*?<\/nav>/.exec(page[p.file])[0]).map((l) => l.text);
      assert.deepEqual(nav.slice(0, 10), TABS.map((t) => t[0]), `${p.file}: header order`);
    }
    const pages404 = links(/<ul class="pg-links"[\s\S]*?<\/ul>/.exec(page['404.html'])[0]).map((l) => l.text);
    assert.deepEqual(pages404, TABS.slice(1).map((t) => t[0]), '404.html: the page links follow the tabs');
  });

  test('every page has its own title', () => {
    const titles = PAGES.map((p) => /<title>([^<]+)<\/title>/.exec(page[p.file])[1]);
    assert.equal(new Set(titles).size, titles.length);
  });

  test('every "Book a 15-minute call" link goes to /contact, with a known ?about= key where it has one', () => {
    for (const p of PAGES) {
      for (const l of links(page[p.file]).filter((x) => /Book a 15-minute call|Book my 15-minute call/i.test(x.text) && x.href)) {
        const m = /^\/contact(?:\?about=([\w-]+))?$/.exec(l.href);
        assert.ok(m, `${p.file}: "${l.text}" -> ${l.href}`);
        if (m[1]) assert.ok(Object.hasOwn(call.ABOUT, m[1]), `${p.file}: ?about=${m[1]} is a prefill key`);
      }
    }
  });

  test('no page links an old home section or the old /?about= form links', () => {
    for (const p of PAGES) {
      for (const l of links(page[p.file])) {
        assert.doesNotMatch(l.href || '', /^\/#(?!call$|services$)|^\/\?about=/, `${p.file} links ${l.href}`);
      }
    }
  });

  test('each marketing page ends with a way to book the call', () => {
    for (const file of MARKETING.filter((f) => f !== 'contact.html')) {
      const m = main(file);
      const last = m.slice(m.lastIndexOf('<section'));
      assert.match(last, /class="section bg-ink pg-cta"/, `${file}: closing call to action band`);
      assert.ok(links(last).some((l) => /^\/contact/.test(l.href)), `${file}: the band links /contact`);
    }
  });
});

/* ---------- home ---------- */
describe('home page', () => {
  const html = page['index.html'];
  const m = main('index.html');

  test('title, description, share image and JSON-LD lead with the referral network', () => {
    assert.match(html, /<title>Your Neighbors Bring You New Patients \| Referral Networks for Med Spas<\/title>/);
    const desc = decode(attr(tags(html, 'meta').find((t) => attr(t, 'name') === 'description'), 'content'));
    assert.ok(desc.startsWith('Your neighbors bring you new patients. We build referral networks for independent med spas'), desc);
    assert.match(html, /<meta property="og:image" content="https:\/\/ouroptimization\.com\/assets\/img\/og-network-neighbors\.jpg">/);
    const data = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
    assert.equal(data['@type'], 'ProfessionalService');
    assert.match(data.description, /We build referral networks for independent med spas/);
    assert.ok(data.description.indexOf('referral networks') < data.description.indexOf('dinners'), 'JSON-LD names the referral network first');
    assert.equal(data.telephone, '+1-331-271-6851');
    assert.equal(data.name, 'Our Wellness Network');
    assert.equal(data.legalName, 'OUR Optimization LLC');
    assert.equal(data.logo, 'https://ouroptimization.com/assets/img/our-wellness-network-logo.png');
    assert.doesNotMatch(JSON.stringify(data), /price|offers|rating|review/i);
    for (const p of PAGES.filter((x) => x.file !== 'index.html')) assert.doesNotMatch(page[p.file], /application\/ld\+json/, `JSON-LD only on the home page (${p.file})`);
  });

  test('hero: the two-line h1, the eyebrow, the lede and the two calls to action', () => {
    assert.equal(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)[1], 'Your neighbors bring you new patients. <em>Your best patients bring the next ones.</em>');
    const hero = m.slice(m.indexOf('<section class="hero'), m.indexOf('</section>'));
    assert.match(text(hero.slice(0, hero.indexOf('<h1'))), /Referral networks for independent med spas\s*$/);
    const lede = text(/<p class="lede">([\s\S]*?)<\/p>/.exec(hero)[1]);
    assert.equal(lede, 'The gym, the salon and the café down the street already know the people you want to meet. We find those businesses, sign them on as partners and keep your name at their front desk.');
    assert.deepEqual(links(hero).map((l) => [l.href, l.text]), [['/contact?about=referral-network', 'Book a 15-minute call'], ['/referral-network', 'How the referral network works']]);
    assert.doesNotMatch(hero, /hero-note|Mustafa|331-271-6851|tel:/, 'no name or number under the hero: the header carries the phone');
  });

  test('the home page says "referral network" before it says "dinner"', () => {
    const t = text(m);
    assert.ok(t.search(/referral network/i) >= 0 && t.search(/referral network/i) < t.search(/dinner/i), 'referral network first');
  });

  test('the community map: the five places and their channels', () => {
    assert.match(html, /<img class="town-img" src="\/assets\/img\/hero-map\.svg" alt="" width="1100" height="1175" fetchpriority="high" decoding="async">/);
    const pairs = [.../<ul class="tp-list"[^>]*>([\s\S]*?)<\/ul>/.exec(html)[1].matchAll(/<li><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/li>/g)].map((x) => `${text(x[1])} / ${text(x[2])}`);
    assert.deepEqual(pairs, ['Offices / Referral network', 'Small businesses / Flyer network', 'Training facilities / Partner referrals', 'Restaurants / Sponsored events', 'Neighborhoods / Online search network']);
    assert.equal(text(/<p class="tp-note">([\s\S]*?)<\/p>/.exec(html)[1]), 'Sponsored events are your patient dinners, at a restaurant near your clinic. Partner referrals come from your referral network.');
  });

  test('"What we do": three numbered steps, the referral network first and largest, then the extras', () => {
    const sec = byId(html, 'services');
    const steps = /<ol class="hm-steps[^"]*"[^>]*>([\s\S]*?)<\/ol>/.exec(sec)[1];
    const items = [...steps.matchAll(/<li class="(hm-step[^"]*)">([\s\S]*?)<\/li>\s*(?=<li class="hm-step|$)/g)].map((x) => ({ cls: x[1], html: x[2] }));
    assert.equal(items.length, 3, 'three steps');
    assert.deepEqual(items.map((i) => /<h3><a href="([^"]+)">([^<]+)<\/a><\/h3>/.exec(i.html).slice(1).reverse()), [['Referral Network', '/referral-network'], ['Flyer Network', '/flyer-network'], ['Patient Network', '/patient-network']]);
    assert.deepEqual(items.map((i) => text(/<span class="hm-more"[^>]*>([\s\S]*?)<\/span>/.exec(i.html)[1])), ['How the referral network works', 'How the flyer network runs', 'See the patient network']);
    assert.equal(text(/<p class="intro">([\s\S]*?)<\/p>/.exec(sec)[1]), 'Start with the referral network. Add the flyer network and the patient network when you are ready. Each step has its own page.');
    assert.deepEqual(items.map((i) => text(/<span class="hm-step-n"[^>]*>([^<]+)<\/span>/.exec(i.html)[1])), ['1', '2', '3']);
    assert.deepEqual(items.map((i) => text(/<span class="dn-k">([^<]+)<\/span>/.exec(i.html)[1])), ['Step 1 of 3', 'Step 2 of 3', 'Step 3 of 3']);
    assert.equal(items[0].cls, 'hm-step hm-step-lead', 'the referral network is the large lead card');
    assert.ok(items.slice(1).every((i) => i.cls === 'hm-step'));
    assert.ok(/<ul class="hm-kit"/.test(items[0].html), 'only the referral network lists what each partner gets');
    const build = items.map((i) => text(/<p class="hm-build">([\s\S]*?)<\/p>/.exec(i.html)[1]));
    assert.deepEqual(build, [
      'Start here: the businesses near you keep your name at their front desk.',
      'Builds on step 1: more businesses you choose, on the same route as your partners.',
      'Builds on steps 1 and 2: your best patients bring the next ones.'
    ], 'each step says in one line how it builds on the last');
    assert.match(text(steps), /We map 15 to 20 businesses near your clinic, aim to sign 5 to 10 as partners and give each one a partner kit, so every lead shows where it came from\./);
    assert.match(text(steps), /A representative walks your flyers into 14 businesses you choose for each location, on two field days a month, and you get a visit log after each one\./);
    assert.equal(text(/<p class="hm-track">([\s\S]*?)<\/p>/.exec(items[1].html)[1]), 'Track every drop: the log shows how many flyers went to each business.', 'one line on tracking, on the Flyer Network step');
    assert.equal((steps.match(/class="hm-track"/g) || []).length, 1, 'the tracking line is on the Flyer Network step only');
    assert.doesNotMatch(text(sec), /every two weeks, someone walks|As we go, we add new places|The dinner is the core/i, 'the old wording is gone');
    const also = /<div class="hm-also[^"]*">([\s\S]*?)<\/div>/.exec(sec)[1];
    assert.equal(text(/<h3 class="hm-also-h">([^<]+)<\/h3>/.exec(also)[1]), 'Also');
    assert.deepEqual(links(also).map((l) => l.href), ['/online-search-network', '/review-tags', '/website-design'], 'the extras: Online Search Network, Review Tags, Website Design');
    assert.deepEqual([...also.matchAll(/<b>([^<]+)<\/b>/g)].map((x) => x[1]), ['Online Search Network', 'Review Tags', 'Website Design']);
    assert.ok(sec.indexOf('hm-also') > sec.indexOf('</ol>'), 'the extras come after the three steps');
  });

  test('"How we work": four cards in one row: fees set in advance, your words, reports in writing, month to month', () => {
    const t = text(byId(html, 'how-we-work'));
    assert.match(byId(html, 'how-we-work'), /<ul class="cardgrid c4 hm-how reveal">/);
    assert.deepEqual([...byId(html, 'how-we-work').matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((x) => text(x[1])), ['Fees set in advance', 'Your call, your words', 'Reports in writing', 'Month to month'], 'four cards fill the four-column row');
    assert.match(t, /Monthly services have a flat monthly fee, set in advance, that never moves with referrals\. Each dinner has one fixed quote\./);
    assert.match(t, /You choose every business on your flyer drop list, and approve every word we use about your clinic\./);
    assert.match(t, /A visit log within five business days of every field day, and a report on your referral network every month\./);
    assert.match(t, /Monthly services run month to month, with 30 days' notice to end them\. Dinners have no monthly contract\./);
    assert.match(byId(html, 'how-we-work'), /href="\/about#how-we-work"/);
  });

  test('who we are: what we do, in confident present tense, Grace Pediatrics, and the program we built', () => {
    const who = byId(html, 'who-we-are');
    assert.match(text(who), /Client work: Grace Pediatrics in Glendale Heights\. We ran its community marketing: flyers for local families, branded gift tins, an event table and QR codes that track every scan\./);
    assert.match(text(who), /We're a local marketing company in Chicago's western suburbs\. We build referral networks around independent med spas, run flyer drops on set field days and plan private patient dinners, with the terms in writing before anything starts\. You deal with us directly, from the 15-minute call on\./);
    assert.deepEqual(links(who).map((l) => [l.href, l.text]), [['/about', 'About us'], ['/referral-network#example', 'A partner program we built']]);
  });

  test('#call is a call to action band that leads to /contact (old /#call links land on it)', () => {
    const band = byId(html, 'call');
    assert.ok(band, '#call exists');
    assert.match(text(band), /Book a 15-minute call\./);
    assert.match(text(band), /Tell us about your clinic and when to call\. We'll call you at the time you pick\./);
    assert.ok(links(band).some((l) => l.href === '/contact'));
    assert.equal(tags(html, 'form').length, 0, 'the form lives on /contact');
  });
});

/* ---------- the three steps ---------- */
describe('the three steps: Referral Network, Flyer Network, Patient Network', () => {
  const STEPS = [
    { file: 'referral-network.html', n: 1, name: 'Referral Network', next: ['/referral-network', '/flyer-network', 'Step 2 of 3: Flyer Network', 'See the flyer network'] },
    { file: 'flyer-network.html', n: 2, name: 'Flyer Network', next: ['/flyer-network', '/patient-network', 'Step 3 of 3: Patient Network', 'See the patient network'] },
    { file: 'patient-network.html', n: 3, name: 'Patient Network', next: ['/patient-network', '/referral-network', 'Back to step 1: Referral Network', 'See the referral network'] }
  ];
  for (const st of STEPS) {
    test(`${st.file}: "Step ${st.n} of 3" in the page head, and a "Next step" link at the end`, () => {
      const m = main(st.file);
      const head = m.slice(m.indexOf('<section class="pg-hero'), m.indexOf('<h1'));
      assert.equal(text(/<p class="eyebrow">([\s\S]*?)<\/p>/.exec(head)[1]), `Step ${st.n} of 3 · ${st.name}`);
      const sections = [...m.matchAll(/<section\b[^>]*>/g)];
      const nextSec = m.slice(sections.at(-2).index, sections.at(-1).index);
      assert.match(nextSec, /^<section class="section pg-next"/, 'the section before the closing band leads on');
      const card = /<div class="pg-step-next">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/.exec(nextSec)[1];
      assert.equal(text(/<p class="eyebrow">([\s\S]*?)<\/p>/.exec(card)[1]), 'Next step');
      assert.deepEqual(links(card).map((l) => [l.href, l.text]), [[st.next[1], st.next[2]]]);
      assert.ok(card.lastIndexOf('pg-step-go') > card.indexOf('<h2'), 'the arrow line comes last');
      assert.equal(text(/<span class="pg-step-go"[^>]*>([\s\S]*?)<\/span>/.exec(card)[1]), st.next[3]);
      assert.equal(text(/<nav class="pg-crumbs"[^>]*>([\s\S]*?)<\/nav>/.exec(m)[1]), `Home${st.name}`);
      assert.doesNotMatch(text(m), /The dinner is the core/, 'the dinners are step 3 now');
    });
  }
});

/* ---------- /patient-network ---------- */
describe('/patient-network', () => {
  const html = page['patient-network.html'];

  test('the two dinners, in the brief\'s words, and the sales evening said plainly', () => {
    const f = text(byId(html, 'formats'));
    assert.match(f, /About 15 of your favorite patients each bring a friend who isn't a patient yet\./);
    assert.match(f, /Up to 30 of your best patients, at an evening built around a new treatment or package\. For spas whose books are already full\./);
    assert.match(f, /It is a sales evening, and we say so\./);
  });

  test('the pricing card has no figure: one fixed quote, restaurant and food included', () => {
    const f = text(byId(html, 'formats'));
    for (const line of ['No surprises', 'One fixed quote per dinner.', 'Restaurant and food included.', 'Quoted for your clinic after the 15-minute call.', 'The price is fixed in writing before you commit.', 'No monthly contract.']) assert.ok(f.includes(line), line);
    assert.match(byId(html, 'formats'), /<a class="btn btn-light" href="\/contact\?about=patient-network">Book a 15-minute call<\/a>/);
  });

  test('how the evening works: four steps, and the illustration with no caption', () => {
    const how = byId(html, 'how');
    assert.deepEqual([...how.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((x) => text(x[1])), ['Plan', 'Invitations', 'The night', 'The follow-up']);
    assert.match(text(how), /At 30 days you get a results sheet: who came, how many were new, and what they booked\./);
    assert.doesNotMatch(/<figure class="dn-illus">([\s\S]*?)<\/figure>/.exec(how)[1], /<figcaption/);
  });

  test('what we handle, working with your rep, and one of us on site', () => {
    const h = byId(html, 'handle');
    const items = [...(/<ul class="dn-checks"[^>]*>([\s\S]*?)<\/ul>/.exec(h)[1]).matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => text(x[1]));
    assert.deepEqual(items, ['The restaurant and the food', 'The menu, set with the venue', "Invitations designed in your clinic's name", 'An RSVP page', 'Reminder messages', 'Name cards and seating', 'The run of the evening', 'An offer card with its own code', 'The next-day follow-up', 'A results sheet at 30 days: who came, how many were new, what they booked']);
    const t = text(h);
    assert.match(t, /Your rep sponsors events\? Keep them\. If your Allergan or Galderma rep sponsors events, we plan the dinner with them\. What we add is the work around the evening, from the invitations to the results sheet\./);
    assert.match(t, /One of us is there all evening, greeting guests and keeping the night on schedule, so you can host\./);
    assert.match(text(/<aside class="pg-glance"[\s\S]*?<\/aside>/.exec(html)[0]), /One of us there all evening, so you can host\./);
    assert.match(text(byId(html, 'how')), /We design the invitations in your clinic's name\. Guests reply on an RSVP page in your clinic's name/);
  });
});

/* ---------- /referral-network ---------- */
describe('/referral-network', () => {
  const html = page['referral-network.html'];
  const m = main('referral-network.html');
  const steps = () => [...byId(html, 'process').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => ({
    n: text(/<span class="dn-step-n"[^>]*>([\s\S]*?)<\/span>/.exec(x[1])[1]),
    h: text(/<h3>([\s\S]*?)<\/h3>/.exec(x[1])[1]),
    p: text(/<p>([\s\S]*?)<\/p>/.exec(x[1])[1]),
    html: x[1]
  }));
  const step = (h) => steps().find((s) => s.h === h).p;

  test('the network: 5 to 10 partners, mapping software, its own code and link, and the two kept lines', () => {
    const r = text(byId(html, 'referrals'));
    assert.match(r, /We aim to put your clinic at the center of 5 to 10 local partners, such as gyms, salons, cafés and offices\./);
    assert.match(r, /We use mapping software and local business data to find them, then we set up, or help you set up, a referral network with them\./);
    assert.match(r, /Cross-promotion\. Each side promotes the other, including nearby trainers and studios\./);
    assert.match(r, /Each partner gets cards with its own code, and a stand and flyers with its own link, so every lead shows where it came from\./);
    assert.match(byId(html, 'referrals'), /<h2 id="referrals-h">Partners near your clinic\.<\/h2>/);
    assert.equal(text(/<p class="dn-note">([\s\S]*?)<\/p>/.exec(byId(html, 'referrals'))[1]), 'Partners promote each other. Nobody is paid per patient.');
    const places = /<ul class="dn-places"[^>]*>([\s\S]*?)<\/ul>/.exec(byId(html, 'referrals'))[1];
    assert.deepEqual([...places.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => text(x[1])), ['Gyms and training studios', 'Salons', 'Cafés and restaurants', 'Offices and small businesses']);
  });

  test('five steps: your partners, the partner kit, tap or scan, every month, your monthly report', () => {
    assert.deepEqual(steps().map((s) => `${s.n} ${s.h}`), ['01 Your partners', '02 The partner kit', '03 Tap or scan', '04 Every month', '05 Your monthly report']);
    assert.match(step('Your partners'), /we map 15 to 20 nearby businesses, then walk in and aim to sign 5 to 10 of them\./);
    assert.match(step('Your partners'), /one-page agreement with your clinic that covers display space and privacy, says no payment is made for a referral, and lets either side end it at any time\./);
  });

  test('one answer to what a partner gets, and what the printed code is for', () => {
    const kit = step('The partner kit');
    assert.match(kit, /Each partner gets referral cards with its own code, flyers and a counter stand for its front desk\./);
    assert.match(kit, /The stand and the flyers carry an NFC tag and a QR code linked to that partner/);
    assert.match(kit, /The code on the cards is for people who call or walk in instead: it only tells your front desk which partner sent them\./);
    assert.match(kit, /the same for every employee, whether or not they ever refer anyone\. It is a perk, not a payment\./);
    const faq = text(byId(page['faq.html'], 'network-faq'));
    assert.match(faq, /A partner kit: referral cards with its own code, flyers and a counter stand for its front desk\./);
    assert.match(faq, /It only tells your front desk which partner a new client came from, for people who call or walk in instead of tapping or scanning\./);
    assert.doesNotMatch(text(m) + faq, /nobody types a code/i, 'no contradiction with the printed code');
  });

  test('tap or scan: no speed promise, and the review stand is the same tap but a different page', () => {
    const p = step('Tap or scan');
    assert.match(p, /When the form is sent, the lead goes to your front desk by email or text, with a copy to us, and you call or text back to book the first visit\./);
    assert.match(p, /it is the same tap, but a partner's tag opens your offer form instead of your review page\./);
    assert.doesNotMatch(p, /As soon as|straight to/);
  });

  test('the monthly report: where your new leads come from, totals from the clinic, the fee does not move', () => {
    const p = step('Your monthly report');
    assert.match(p, /leads from each partner, how many booked, and first-visit revenue, so you can see where your new leads come from\./);
    assert.match(p, /Your front desk gives us the bookings and revenue as totals for each partner\. The numbers are for your report only/);
    assert.match(p, /we never drop a partner for its lead count\. Our fee is flat, set in advance, and does not change with them\. We never pay a place per patient\./);
    assert.doesNotMatch(text(m), /which partners? (are|is) working|which partnerships are working/i);
  });

  test('partners share the flyer drop route, and the NFC explainer is plain', () => {
    const nfc = text(byId(html, 'nfc'));
    assert.match(step('Every month'), /Each month the flyers and cards carry your current offer, with each partner's link on the flyers and its code on the cards\. Every partner gets a planned visit each month: restocking flyers and cards/);
    assert.match(text(byId(html, 'process')), /With the flyer network too, those visits happen on your field days, on the same route\./);
    assert.match(byId(html, 'process'), /With the <a href="\/flyer-network">flyer network<\/a> too/);
    assert.match(nfc, /^Tap or scan What is an NFC tag\? A small chip inside a partner's stand or flyer\./);
    assert.match(byId(html, 'nfc'), /href="\/review-tags#nfc"/);
    assert.match(nfc, /Hold the top of a phone near it and the page it carries opens, with no app to download\./);
    assert.match(nfc, /Tap and scan use different links, so you can see which one people actually use\./);
  });

  test('Example: the training partner program we built for ETHR LAB, with no price and no results', () => {
    const ex = byId(html, 'example');
    const t = text(ex);
    assert.match(ex, /<h2 id="ethr-h">Example: the training partner program we built for <span class="nowrap">ETHR LAB\.<\/span><\/h2>/);
    assert.equal(text(/<p class="eyebrow">([\s\S]*?)<\/p>/.exec(ex)[1]), 'Our work');
    assert.equal(text(/<p class="et-ok">([\s\S]*?)<\/p>/.exec(ex)[1]), "We share this example with ETHR LAB's permission.");
    assert.match(t, /ETHR LAB is a recovery and wellness studio in Oakbrook Terrace\. We built its partner program for the training gyms nearby: the partner kit, the one-page agreement, and a link and lead form for each gym\. Here is how it works\./);
    assert.match(t, /"Your athletes train here\. Let them recover with us\."/);
    for (const item of ['A one-page owner handout', "Referral cards with the gym's own code", 'Staff perk cards', 'A one-page partner agreement with two signatures', "A 5x7 flyer for the gym's athletes, with a QR code and an NFC tag, each linked to that gym"]) assert.ok(t.includes(item), item);
    assert.match(t, /The studio's front desk keeps a monthly code log\./);
    assert.match(t, /A free cryotherapy session, every month For everyone on the gym's team, whether or not they ever send anyone\./);
    assert.match(t, /Their own first-visit offer Members show the card with their gym's code, or tap or scan the flyer\./);
    assert.match(t, /Keep a stack of cards at the front desk, restocked for them, and let coaches mention it when a member is sore or recovering\./);
    assert.match(t, /Nothing No fees and no contract: a one-page agreement, and either side can stop at any time\./);
    assert.match(t, /"Your code only tells us which partner a new client came from, so we can thank the right gym\. Nobody is paid per referral\."/);
    assert.match(t, /Tap and scan use different links, so the studio can see which one people actually use\. Each gym has its own short lead form, and every submission arrives by email and lands in one spreadsheet, with a tab for each gym\./);
    assert.match(t, /Equipment and session length only It never says what anything does to a body\./);
    assert.doesNotMatch(t, /Status:|being set up|set up now|first round|Nothing has run|no results to show|claim no results/i, 'no "being set up" lines');
    assert.doesNotMatch(ex, /et-status/);
    assert.doesNotMatch(t, /\$|\bfor \d+\b|\d+\s?(dollars|off)\b/i, 'no price for the members\' offer');
    assert.doesNotMatch(t, /both ways|two-way|New people/i, 'the handout\'s two-way line is not repeated');
  });

  test('the ETHR LAB mockups: both images, with alt text that says they are mockups and no visible caption', () => {
    const ex = byId(html, 'example');
    const figs = [...ex.matchAll(/<figure class="et-shot">([\s\S]*?)<\/figure>/g)].map((x) => x[1]);
    if (!figs.length) {
      assert.match(ex, /<!-- ETHR LAB sample mockups:/, 'the slot is marked');
      return;
    }
    assert.equal(figs.length, 2);
    for (const f of figs) {
      assert.match(f, /<picture><source type="image\/webp"/);
      const img = tags(f, 'img')[0];
      assert.match(attr(img, 'src'), /^\/assets\/img\/ethr-mockup-(stand|tap)(-600)?\.jpg$/);
      assert.equal(attr(img, 'loading'), 'lazy');
      assert.ok(Number(attr(img, 'width')) > 0 && Number(attr(img, 'height')) > 0);
      assert.match(attr(img, 'alt'), /^Sample mockup, not a real photo: /);
      assert.doesNotMatch(f, /<figcaption/, 'the owner asked for the captions to go');
    }
  });
});

/* ---------- /flyer-network ---------- */
describe('/flyer-network', () => {
  const html = page['flyer-network.html'];
  const t = text(main('flyer-network.html'));

  test('the schedule: fourteen businesses and two field days per location, seven a day, weeks 1 to 4', () => {
    assert.match(t, /Each location gets its own fourteen businesses and its own two field days each month, seven businesses per day, on a weekly rotation\./);
    assert.match(t, /four field days and 28 businesses a month, each one seen once a month\./);
    const rows = [.../<tbody>([\s\S]*?)<\/tbody>/.exec(byId(html, 'schedule'))[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((x) => [...x[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => text(c[1])));
    assert.deepEqual(rows, [
      ['One', 'Location A', 'Its businesses 1 to 7', 'Week 1'],
      ['Two', 'Location B', 'Its businesses 1 to 7', 'Week 2'],
      ['Three', 'Location A', 'Its businesses 8 to 14', 'Week 3'],
      ['Four', 'Location B', 'Its businesses 8 to 14', 'Week 4']
    ]);
    assert.match(t, /One location\? It gets field days one and three: its 14 businesses, seven in week 1 and seven in week 3\./);
  });

  test('the fourteen and the partners do not contradict each other', () => {
    assert.match(t, /The fourteen are the businesses you choose for drops\. Partners from your referral network, the businesses that sign on for the partner kit, sit on the same route and are visited on the same field days\./);
    assert.doesNotMatch(t, /5 to 10/, 'the partner target belongs to the referral network page');
  });

  test('each visit: the four steps, two by two, and every visit goes in the visit log', () => {
    const v = byId(html, 'visit');
    assert.deepEqual([...v.matchAll(/<li>[\s\S]*?<h3>([\s\S]*?)<\/h3>/g)].map((x) => text(x[1])), ['Deliver and restock', 'Talk to the staff', 'Take notes', 'Come back']);
    assert.match(v, /<ol class="dn-steps fd-visit-steps reveal">/, 'four steps in a two-by-two grid, so no column is left empty');
    assert.match(text(v), /At each visit our representative does four things, and every visit goes in your visit log\./);
    assert.match(v, /<a href="#track">visit log<\/a>/);
    assert.doesNotMatch(v, /fd-log/, 'the log is described once, in #track');
    assert.match(t, /placed where people will see them, with the location's permission\./);
    assert.match(t, /introduces your clinic and leaves a direct line for questions\./);
  });

  test('track every drop: the visit log counts the flyers, month by month, and each partner\'s own link', () => {
    const tr = byId(html, 'track');
    assert.ok(tr, '#track exists');
    const order = [...main('flyer-network.html').matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((x) => x[1]);
    assert.deepEqual(order.slice(0, 4), ['schedule', 'visit', 'track', 'choose'], 'tracking comes right after each visit');
    const k = text(tr);
    assert.equal(text(/<p class="eyebrow">([\s\S]*?)<\/p>/.exec(tr)[1]), 'Tracking');
    assert.equal(text(/<h2 id="track-h">([\s\S]*?)<\/h2>/.exec(tr)[1]), 'Track every drop, flyer by flyer.');
    assert.match(k, /See exactly how many flyers you're dropping off, and at which businesses\. It all comes to you in writing\./);
    const log = /<div class="fd-track-log">([\s\S]*?)<\/div>/.exec(tr)[1];
    assert.equal(text(/<h3>([\s\S]*?)<\/h3>/.exec(log)[1]), 'Your visit log');
    assert.match(text(log), /Within five business days of each field day, you get a visit log\. It lists every business visited, and for each one:/);
    assert.deepEqual([...log.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => text(x[1])), ['Who we spoke with', 'How many flyers we left there', 'Any follow-up they asked for']);
    const more = [.../<ul class="fd-track-more">([\s\S]*?)<\/ul>/.exec(tr)[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => ({ h: text(/<h3>([\s\S]*?)<\/h3>/.exec(x[1])[1]), p: text(/<p>([\s\S]*?)<\/p>/.exec(x[1])[1]) }));
    assert.deepEqual(more, [
      { h: 'Month by month', p: 'Every log counts the flyers, so month by month you can see how many went out and where.' },
      { h: 'Each partner, its own link', p: "With a referral network too, each partner's QR code and NFC tag carry its own link, so every lead from it shows which partner it came from." }
    ]);
    assert.ok(links(tr).some((l) => l.href === '/referral-network'));
    assert.doesNotMatch(k, /\b\d+\b/, 'no numbers promised');
    assert.doesNotMatch(k, /(tap|scan)s? (count|total)|how many (people )?(tap|scan)|number of (taps|scans)/i, 'no tap or scan counts promised');
    assert.match(text(/<aside class="pg-glance"[\s\S]*?<\/aside>/.exec(html)[0]), /Every drop tracked: a visit log within five business days of each field day\./);
    assert.match(t, /A visit log after every field day, with the flyers counted\./);
  });

  test('you choose every business: examples, swaps, opt-outs, routes and 25 miles', () => {
    const chips = [.../<ul class="ex-chips fd-chips"[^>]*>([\s\S]*?)<\/ul>/.exec(html)[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => text(x[1]));
    assert.deepEqual(chips, ['Gyms', 'Salons', 'Primary care offices', 'Chiropractors', 'Physical therapy', 'Boutiques', 'Country clubs', 'Employers']);
    assert.match(t, /Swap any business\. Tell us in writing before the next field day\./);
    assert.match(t, /If it asks not to be visited again, it is dropped and you name a replacement\./);
    assert.match(t, /We group the businesses into routes, so the order within a field day can change\./);
    assert.match(t, /Within 25 miles\. Businesses farther out can be added by agreement, with travel handled separately\./);
  });

  test('who supplies what, how we represent you, the flat fee and the notice period', () => {
    assert.match(t, /Printed flyers, cards or offer sheets, delivered at least five days before each field day\. We can design and print them for you, quoted separately\./);
    assert.match(t, /Your approval of any offer, price or claim before it is printed or published\./);
    assert.match(t, /The representative, the vehicle, the mileage and the time for every field day\./);
    assert.match(t, /Our representative talks about your clinic only in the words you approve\. No medical claim, outcome, price or guarantee beyond your approved materials\./);
    assert.deepEqual([...byId(html, 'represent').matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((x) => text(x[1])), ['Approved words only', 'No medical advice', 'Yours to keep', 'A flat monthly fee'], 'four cards fill the four-column row');
    assert.match(t, /Your list, materials, photos, content and logos belong to your clinic, during and after\./);
    assert.doesNotMatch(t, /protected health information|none is required|No patient information/i);
    assert.match(t, /Set in advance\. It never moves with referrals, and no part of it goes to a business or anyone we visit\. Month to month, with 30 days' written notice to end it\./);
    assert.match(t, /Works on its own or with the online search network\.\s?If you add the online search network, the two work side by side, and the ad budget goes straight to Google from your own account/);
    assert.match(t, /You can also add flyer drops to a dinner, which is quoted on its own\./);
    assert.match(t, /It starts with a 15-minute call, and the flyer network is quoted for your clinic before it starts\./);
  });
});

/* ---------- /online-search-network ---------- */
describe('/online-search-network', () => {
  const t = text(main('online-search-network.html'));
  test('only what the site already said: the cherry on top, your own account, side by side with the flyer network', () => {
    assert.equal(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(page['online-search-network.html'])[1], 'Online search, <em>for when they look you up.</em>');
    assert.match(t, /Ads are there for the people who hear about you from a partner, from a friend or at a dinner, and then search for you\. You pay Google directly, in your own account\./);
    assert.match(t, /The cherry on top/i);
    assert.match(t, /We drive the growth behind the ads\./);
    assert.match(t, /The ad budget goes straight to Google from that account, so you keep control of what you spend there\./);
    assert.match(t, /The online search network can run on its own\. If you also have the flyer network, the two work side by side\./);
    assert.match(t, /Your ads run in your clinic's own Google Ads account\./, 'Google Ads, the product, keeps its name');
    assert.match(t, /Our part is quoted for your clinic first\./);
    assert.equal((t.match(/Our part is quoted/g) || []).length, 1, 'said once');
    assert.deepEqual([...main('online-search-network.html').matchAll(/<h3><a href="([^"]+)">/g)].map((x) => x[1]), ['/referral-network', '/flyer-network', '/patient-network'], 'the steps in order, then the ads');
    assert.deepEqual([...main('online-search-network.html').matchAll(/<h3>(?:<a [^>]+>)?([^<]+)/g)].map((x) => x[1]).slice(0, 4), ['Referral network', 'Flyer network', 'Patient network', 'Then the online search network']);
  });
  test('no invented features or results', () => {
    assert.doesNotMatch(t, /keyword|landing page|conversion|ROAS|click-through|\bCTR\b|bid|retarget|remarket|management fee|ranking|top of Google|first page/i);
  });
});

/* ---------- /about ---------- */
describe('/about', () => {
  const html = page['about.html'];
  const t = text(main('about.html'));
  test('who we are: what we do, Grace Pediatrics, the program we built, and the contact box', () => {
    assert.match(t, /We build referral networks, run flyer drops and plan private patient dinners for independent med spas in Chicago's western suburbs, with the terms in writing before anything starts\./);
    assert.match(t, /Client work: Grace Pediatrics in Glendale Heights\./);
    const who = text(byId(html, 'who'));
    assert.match(who, /^Our work Real work, for a real clinic\./);
    assert.match(who, /We run marketing for a wellness clinic nearby\./);
    assert.match(who, /We built a training partner program for a recovery and wellness studio in Oakbrook Terrace\. The partner kit, the one-page agreement, and a link and lead form for each gym\. See the example\./);
    assert.match(who, /Every dinner gets a results sheet at 30 days\. Who came, how many were new and what they booked\./);
    assert.ok(links(byId(html, 'who')).some((l) => l.href === '/referral-network#example'));
    assert.doesNotMatch(main('about.html'), /ETHR/, 'ETHR LAB is named on /referral-network only');
    const box = text(/<div class="dn-contact ab-contact">([\s\S]*?)<\/ul>\s*<\/div>/.exec(html)[1]);
    assert.equal(box, 'Your contact Mustafa You deal with him directly, from the 15-minute call on. mustafa@ouroptimization.com');
    assert.match(html, /<a href="mailto:mustafa@ouroptimization\.com">[\s\S]*?mustafa@ouroptimization\.com<\/a>/);
    assert.doesNotMatch(main('about.html'), /href="tel:/, 'the phone is in the header and footer only');
  });
  test('how we work: the six commitments from our agreements, three by two', () => {
    const w = byId(html, 'how-we-work');
    assert.match(w, /<h2 id="how-we-work-h">Six things we put <em>in writing\.<\/em><\/h2>/);
    assert.match(w, /<ul class="cardgrid ab-commit reveal">/);
    assert.deepEqual([...w.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((x) => text(x[1])), ['Your words only', 'A log of every visit', 'Yours to keep', 'Fees set in advance', 'Independent', 'Month to month']);
    const s = text(w);
    assert.match(s, /Within five business days of each field day, you get a visit log: every business visited, who was spoken to, what was left and any follow-up asked for\./);
    assert.match(s, /We talk about your clinic only in the words you approve\./);
    assert.match(s, /Your lists, materials, photos, content and logos belong to your clinic, while we work together and after\./);
    assert.match(s, /Neither is based on the number or value of patients anyone sends you\./);
    assert.match(s, /We never pay anyone for referrals, or offer anything of value in exchange for sending patients\./);
    assert.match(s, /Either side can end them with 30 days' written notice, and email counts\./);
  });
  test('Grace Pediatrics appears only on the home page and /about', () => {
    for (const p of PAGES.filter((x) => !['index.html', 'about.html'].includes(x.file))) assert.doesNotMatch(main(p.file), /Grace/i, p.file);
  });
});

/* ---------- /faq ---------- */
describe('/faq', () => {
  const html = page['faq.html'];
  const m = main('faq.html');
  test('the intro sends unanswered questions to the 15-minute call', () => {
    assert.match(text(/<p class="intro">([\s\S]*?)<\/p>/.exec(m)[1]), /Can't find yours\? Ask us on a 15-minute call\.$/);
    assert.ok(links(/<p class="intro">([\s\S]*?)<\/p>/.exec(m)[1]).some((l) => l.href === '/contact'));
  });
  test('the patient dinners answers, as the owner changed them', () => {
    const d = text(byId(html, 'dinners-faq'));
    assert.match(d, /You can\. The room is the easy part\. The work is everything around it: invitations in your clinic's name, the RSVP page, reminder messages, name cards and seating, the run of the evening, an offer card with its own code, the next-day follow-up and a results sheet at 30 days\. We handle all of it, so you can host\./);
    assert.match(d, /We don't promise a number\. Here is how the evening is built: the invitation comes from your clinic, the guests are patients who already trust you \(at the Plus-One Dinner, each brings a friend they chose\), guests reply on an RSVP page, and reminder messages go out before the night\. We pick the date with you\./);
    assert.match(d, /Yes\. You give a short talk and make an offer you have approved, and guests can book on the night\. We say so plainly, because that is the point of the evening\./);
    assert.match(d, /Keep them\. If your Allergan or Galderma rep sponsors events, we plan the dinner with them\./);
    assert.match(d, /It depends on the dinner, the number of guests and the restaurant\. The restaurant and food are included\. We quote it for your clinic after the 15-minute call, the price is fixed in writing before you commit, and there is no monthly contract\./);
    assert.match(d, /A local marketing company in Chicago's western suburbs\. We run marketing for a wellness clinic nearby, and we built the training partner program in our referral network example\. Every dinner gets a results sheet at 30 days: who came, how many were new and what they booked\. You deal with us directly, from the 15-minute call on\. More about us\./);
    assert.deepEqual(links(/<div class="faq dn-faq">([\s\S]*)<\/div>/.exec(byId(html, 'dinners-faq'))[1]).map((l) => l.href), ['/referral-network#example', '/about']);
    assert.doesNotMatch(d, /Mustafa|331-271-6851|being held|first case stud|can't promise/i);
  });
  test('the referral network and flyer network questions come first, then the patient network, then working with us', () => {
    const order = [...m.matchAll(/<section class="section[^"]*fq-group" aria-labelledby="[^"]+" id="([^"]+)">/g)].map((x) => x[1]);
    assert.deepEqual(order, ['network-faq', 'flyer-drops-faq', 'dinners-faq', 'working-faq']);
    assert.deepEqual([...m.matchAll(/<h2 id="[^"]+-faq-h">([^<]+)<\/h2>/g)].map((x) => x[1]), ['Referral network', 'Flyer network', 'Patient network', 'Working with us']);
    assert.deepEqual(links(/<ul class="fq-jump"[\s\S]*?<\/ul>/.exec(m)[0]).map((l) => l.text), ['Referral network', 'Flyer network', 'Patient network', 'Working with us']);
    assert.deepEqual(links(/<ul class="fq-jump"[\s\S]*?<\/ul>/.exec(m)[0]).map((l) => l.href), ['#network-faq', '#flyer-drops-faq', '#dinners-faq', '#working-faq']);
  });
  test('every question, grouped by topic', () => {
    const group = (id) => [...byId(html, id).matchAll(/<summary>([\s\S]*?)<span class="sign"/g)].map((x) => text(x[1]));
    assert.deepEqual(group('dinners-faq'), ["Can't I just book a restaurant myself?", 'Will people actually come on a weeknight?', 'Is it a sales evening?', 'My rep already sponsors events. Why use you?', 'What does it cost?', 'Who are you?']);
    assert.deepEqual(group('flyer-drops-faq'), ['How does the flyer network work?', 'Who chooses the businesses?', 'What do I get after each field day?', 'Can I track my flyer drops?', 'Can I get the flyer network on its own?']);
    assert.deepEqual(group('network-faq'), ["What if I don't have a referral network yet?", 'What does each partner get?', 'What is the code on the referral cards for?', 'How do leads from partners reach my clinic?', 'What is an NFC tag?', 'Does anyone pay partners for referrals?', 'What goes in the monthly report?']);
    assert.deepEqual(group('working-faq'), ['How long do I sign up for?', 'How do you talk about my clinic?']);
  });
  test('the new answers match the pages', () => {
    const a = text(m);
    assert.match(a, /fourteen for each location, on two field days a month, seven businesses a day\./);
    assert.match(a, /The flyer network is quoted for your clinic before it starts, at a flat monthly fee that never moves with referrals\./);
    assert.match(a, /You do\. You list them on one page, for example gyms, salons, primary care offices, chiropractors, physical therapy, boutiques, country clubs and employers\./);
    assert.match(a, /A visit log, within five business days: every business visited, who we spoke with, how many flyers we left there, and any follow-up they asked for\./);
    assert.match(a, /Yes\. It runs on its own or with the online search network\. You can also add flyer drops to a dinner, which is quoted separately\. If you add the online search network, the ad budget goes straight to Google from your own account\./);
    assert.match(a, /The referral and flyer networks run month to month\. Either side can end them with 30 days' written notice, and email counts\./);
    assert.match(a, /It is a perk, not a payment, and the partner agreement says no payment is made for a referral\. Nobody is paid per patient\./);
    assert.match(a, /Your front desk gives us the bookings and revenue as totals for each partner\. The numbers are for your report only, and we never drop a partner for its lead count\./);
    assert.match(m, /<a href="\/review-tags#nfc">/);
    assert.match(a, /A small chip inside a partner's stand or flyer\./);
    assert.match(m, /<a href="\/contact\?about=flyer-network">Book a <span class="nowrap">15-minute call<\/span> about the flyer network<\/a>/);
  });
  test('"Can I track my flyer drops?": the visit log counts the flyers, month by month, and partner links, with no numbers promised', () => {
    const entry = [...byId(html, 'flyer-drops-faq').matchAll(/<details>([\s\S]*?)<\/details>/g)].map((x) => x[1]).find((x) => /Can I track my flyer drops\?/.test(x));
    assert.ok(entry, 'the entry is in the flyer drops group');
    const ans = /<div class="answer">([\s\S]*?)<\/div>/.exec(entry)[1];
    assert.equal(text(ans), "Yes. Every visit log says how many flyers we left at each business, so you see exactly how many you're dropping off, and where. Month by month, you can see how many went out and which businesses got them. If you have a referral network too, each partner's QR code and NFC tag carry its own link, so every lead from it shows which partner it came from. How tracking works.");
    assert.deepEqual(links(ans).map((l) => l.href), ['/flyer-network#track']);
    assert.doesNotMatch(text(ans), /\b\d+\b|(tap|scan)s? (count|total)|how many (people )?(tap|scan)|number of (taps|scans)/i, 'no numbers and no tap or scan counts');
  });
});

/* ---------- the brand: Our Wellness Network (renamed October 22, 2026) ---------- */
describe('the brand: Our Wellness Network', () => {
  // Put together here, so this file does not contain the old name either.
  const OLD = new RegExp(['wellness', 'optimization'].join('[\\s\\u00a0]+'), 'i');
  const LOGO = '/assets/img/our-wellness-network-logo.png';

  test('the old brand name is gone from every page, script, stylesheet, test, the manifest, netlify.toml and the sitemap', () => {
    for (const file of repoTextFiles().filter((f) => f !== 'README.md')) {
      const src = read(file);
      const hit = OLD.exec(decode(src));
      assert.equal(hit, null, `${file}: ${hit && decode(src).slice(Math.max(0, hit.index - 40), hit.index + 40)}`);
    }
  });

  test('README names the old brand only where it explains the rename', () => {
    const lines = read('README.md').split('\n').filter((l) => OLD.test(l));
    assert.ok(lines.length <= 1, `${lines.length} README lines name the old brand`);
    for (const l of lines) assert.match(l, /renamed/i, `README: "${l.slice(0, 120)}"`);
    assert.match(read('README.md'), /^Our Wellness Network \(a brand of OUR Optimization LLC\)/m);
  });

  test('the manifest carries the new name', () => {
    const m = JSON.parse(read('site.webmanifest'));
    assert.equal(m.name, 'Our Wellness Network');
    assert.equal(m.short_name, 'Our Wellness Network');
  });

  for (const p of PAGES) {
    test(`${p.file}: the new logo in the header and footer, with the new name`, () => {
      const src = page[p.file];
      const brand = /<a aria-label="([^"]+)" class="brand" href="\/">\s*(<img [^>]+>)\s*<\/a>/.exec(headerOf(src));
      assert.ok(brand, 'the header brand link');
      assert.equal(brand[1], 'Our Wellness Network home');
      for (const img of [brand[2], tags(/<div class="foot-brand">[\s\S]*?<\/div>/.exec(footerOf(src))[0], 'img')[0]]) {
        assert.equal(attr(img, 'src'), LOGO);
        assert.equal(attr(img, 'alt'), 'Our Wellness Network');
        assert.equal(attr(img, 'width'), '480');
        assert.equal(attr(img, 'height'), '174');
      }
      assert.equal(tags(src, 'img').filter((t) => /logo/.test(attr(t, 'src') || '')).length, 2, 'the logo appears twice: header and footer');
      const title = decode(/<title>([^<]+)<\/title>/.exec(src)[1]);
      if (p.file !== 'index.html') assert.match(title, / \| Our Wellness Network$/, title);
    });
  }

  test('the expo page: the new logo in its own header, the new name in its footer, its form untouched', () => {
    const src = read('expo-vendors.html');
    const brand = /<a aria-label="([^"]+)" class="brand" href="\/">\s*(<img [^>]+>)\s*<\/a>/.exec(src);
    assert.equal(brand[1], 'Our Wellness Network home');
    assert.equal(attr(brand[2], 'src'), LOGO.slice(1), 'the expo page keeps its relative logo path');
    assert.equal(attr(brand[2], 'alt'), 'Our Wellness Network');
    assert.match(text(src), /Organized by Our Wellness Network, a brand of OUR Optimization LLC\./);
  });

  test('the legal entity, the domain and the email stay the same', () => {
    assert.match(text(page['privacy.html']), /This website is operated by OUR Optimization LLC \(trading as Our Wellness Network\)\./);
    assert.match(text(page['privacy.html']), /OUR Optimization LLC \(trading as Our Wellness Network\) is responsible for the information described in this policy\. Our website is https:\/\/ouroptimization\.com\./);
    assert.match(text(page['terms.html']), /Our Wellness Network is the customer-facing brand of OUR Optimization LLC\./);
    assert.match(text(page['terms.html']), /"We", "us" and "our" mean OUR Optimization LLC, operating as Our Wellness Network\./);
    assert.match(text(page['terms.html']), /Our Wellness Network, a brand of OUR Optimization LLC\. Contact us at mustafa@ouroptimization\.com, or through https:\/\/ouroptimization\.com\./);
    for (const p of PAGES) assert.match(footerOf(page[p.file]), /mailto:mustafa@ouroptimization\.com/, p.file);
  });

  test('the service names: networks where the service is named, plain words for the activity and the products', () => {
    const all = PAGES.map((p) => copyOf(page[p.file])).join('\n');
    assert.doesNotMatch(all, /Flyer Drops|Patient Dinners/, 'no old service name in title case (tabs, titles, headings)');
    for (const p of PAGES) {
      const crumbs = /<nav class="pg-crumbs"[^>]*>([\s\S]*?)<\/nav>/.exec(page[p.file]);
      if (crumbs) assert.doesNotMatch(text(crumbs[1]), /Flyer Drops|Patient Dinners|Google Ads/, `${p.file}: breadcrumbs`);
    }
    // The activity and the products keep their plain words.
    assert.match(text(main('index.html')), /Track every drop: the log shows how many flyers went to each business\./);
    assert.match(text(main('patient-network.html')), /The Plus-One Dinner and the VIP Night\./);
    assert.match(text(main('online-search-network.html')), /The ads run in your clinic's Google Ads account\./);
    // The related links on the extras pages.
    for (const file of ['review-tags.html', 'website-design.html']) {
      assert.deepEqual(links(/<ul class="related">[\s\S]*?<\/ul>/.exec(main(file))[0]).map((l) => [l.text, l.href]),
        [['Referral network', '/referral-network'], ['Flyer network', '/flyer-network'], ['Patient network', '/patient-network'], ['Online search network', '/online-search-network']], file);
    }
    assert.match(text(main('review-tags.html')), /Tags are a separate order from our referral, flyer and patient networks\./);
    assert.match(text(main('website-design.html')), /A redesign is agreed on its own, separately from our referral, flyer and patient networks\./);
  });
});

/* ---------- copy rules, site-wide ---------- */
describe('copy rules across the site', () => {
  test('no fee or price figures in any text file of the repository, tests included', () => {
    const figure = [/\$\s?\d/, /\b\d[\d,.]*\s?(dollars|usd)\b/i, /\b\d[\d,.]*\s*(\/|per|a)\s*(mo|month)\b/i, /\bsetup fee\b/i, /\bfee of\b/i];
    for (const file of repoTextFiles().filter((f) => !f.endsWith('.svg'))) {
      const src = read(file);
      for (const re of figure) {
        const hit = re.exec(src);
        assert.equal(hit, null, `${file}: ${hit && src.slice(Math.max(0, hit.index - 30), hit.index + 30)}`);
      }
    }
  });

  test('no prospect, gym or person from the source documents is named anywhere', () => {
    // NAME_HASHES holds the SHA-256 of each lowercased name (one to three words), so this public
    // file does not spell them out. Every one-, two- and three-word run of every text file is checked.
    for (const file of repoTextFiles()) {
      const words = read(file).toLowerCase().replace(/&rsquo;|’/g, "'").split(/[^a-z0-9']+/).filter(Boolean);
      for (let i = 0; i < words.length; i++) {
        for (const n of [1, 2, 3]) {
          if (i + n > words.length) break;
          assert.ok(!NAME_HASHES.has(sha(words.slice(i, i + n).join(' '))), `${file}: a name from the source documents, at word ${i}`);
        }
      }
    }
  });

  const marketing = MARKETING.map((f) => [f, text(main(f))]);

  test('no "two-way" promotion line, and only the two kept promotion statements', () => {
    for (const [file, t] of marketing) {
      assert.doesNotMatch(t, /two-way|two ways|both ways|both directions|promote them back/i, file);
      const promo = (t.match(/[^.?!]*\bpromot[^.?!]*[.?!]/gi) || []).map((s) => s.trim());
      const allowed = file === 'referral-network.html' ? ['Cross-promotion.', 'Each side promotes the other, including nearby trainers and studios.', 'Partners promote each other.'] : [];
      assert.deepEqual(promo, allowed, file);
    }
  });

  test('nobody is paid per patient or per referral, and a partner\'s value never depends on its referrals', () => {
    for (const [file, t] of marketing) {
      assert.doesNotMatch(t, /commission|referral fee|finder'?s fee|kickback|bounty|reward|per referred|per client|what each one sends/i, file);
      for (const s of t.match(/[^.?!"]*\bpaid\b[^.?!"]*[.?!]/gi) || []) assert.match(s.trim(), /^Nobody is paid per (patient|referral)\.$/, `${file}: "${s.trim()}"`);
      assert.doesNotMatch(t, /which partners? (are|is) working|best partners|top partners|reward (the )?partners/i, file);
    }
  });

  test('events stay out of the network copy', () => {
    const net = [text(byId(page['referral-network.html'], 'referrals')), text(byId(page['referral-network.html'], 'process')), text(byId(page['faq.html'], 'network-faq'))].join(' ');
    assert.doesNotMatch(net, /\bevents?\b/i);
  });

  test('no invented proof, no promised results, no callback times, no lead counts', () => {
    for (const [file, t] of marketing) {
      assert.doesNotMatch(t, /testimonial|as seen on|\d+\s?%|\b5[- ]star|\brated\b|we guarantee|guaranteed/i, file);
      assert.doesNotMatch(t, /\b(will|we'll) (get|bring|fill|double|triple|grow)\b/i, `${file}: promised outcome`);
      assert.doesNotMatch(t, /callback within|(call|text)s? (you |them )?back within|within (a|an|one|the) (day|hour|minute)|\bhours?\b/i, `${file}: callback time`);
      assert.doesNotMatch(t, /\b\d+\s+(new )?(leads|bookings)\b|leads (a|per|each) (week|month)/i, `${file}: lead count`);
    }
  });

  test('no "Sample mockup" caption anywhere, and the sample brand stays the only brand in a mockup caption', () => {
    for (const p of PAGES) assert.doesNotMatch(page[p.file], /Sample mockup made for this page/, p.file);
  });

  /* Every HTML file in the repository, the expo page included. */
  const html = repoTextFiles().filter((f) => f.endsWith('.html')).map((f) => [f, copyOf(read(f))]);

  test('no promise about patient data and no "leave patient information out" line, in any HTML file', () => {
    assert.ok(html.length >= PAGES.length + 1, 'every page and the expo page are checked');
    for (const [file, c] of html) {
      assert.doesNotMatch(c, /\b(never|not|don't|won't|do not)\b[^.]{0,40}\b(see|sees|seen|receive|receives|keep|keeps|get|access)\b[^.]{0,40}\bpatient (list|records|information|data)\b/i, `${file}: a promise about patient data`);
      assert.doesNotMatch(c, /patient list|stays yours\. We never/i, `${file}: the patient list`);
      assert.doesNotMatch(c, /please (don't|do not) (include|send) any patient information|please never send us names or patient records|No patient information|need no patient information/i, `${file}: a "leave patient information out" line`);
    }
    // What stays: the privacy sentence and the terms disclaimer on the two business inquiry forms.
    assert.match(copyOf(page['privacy.html']), /We do not ask for payment details or health information anywhere on this site\./);
    assert.match(copyOf(page['terms.html']), /Please do not send patient information, protected health information, or any sensitive personal data through the call or expo forms\. They are business inquiry forms and are not built for that\./);
  });

  test('name and number: outside the header and footer, Mustafa only on /about and /contact, the phone only on /contact and /thanks', () => {
    const NAME = { 'about.html': 1, 'contact.html': 1 };
    const PHONE = { 'contact.html': 1, 'thanks.html': 1 };
    const HEAD_PHONE = { 'index.html': 1, 'contact.html': 3 }; // the home JSON-LD; the /contact description, og and twitter tags
    for (const p of PAGES) {
      const src = page[p.file];
      const head = src.slice(0, src.indexOf('<body'));
      const body = src.slice(src.indexOf('<body')).replace(headerOf(src), ' ').replace(footerOf(src), ' ');
      assert.equal((body.match(/Mustafa/g) || []).length, NAME[p.file] || 0, `${p.file}: "Mustafa" outside the header and footer`);
      assert.equal((body.match(/331-271-6851/g) || []).length, PHONE[p.file] || 0, `${p.file}: the phone number outside the header and footer`);
      assert.equal((body.match(/href="tel:/g) || []).length, PHONE[p.file] || 0, `${p.file}: tel links outside the header and footer`);
      assert.doesNotMatch(head, /Mustafa/, `${p.file}: the name in the head`);
      assert.equal((head.match(/331.?271.?6851/g) || []).length, HEAD_PHONE[p.file] || 0, `${p.file}: the phone number in the head`);
      // The header and the footer carry the phone (and the footer the email) on every page.
      assert.match(headerOf(src), /Call or text 331-271-6851/, `${p.file}: header phone`);
      assert.match(footerOf(src), /<h2>Contact<\/h2>\s*<ul>\s*<li><a href="tel:\+13312716851">Call or text 331-271-6851<\/a><\/li>\s*<li><a class="foot-mail" href="mailto:mustafa@ouroptimization\.com">mustafa@ouroptimization\.com<\/a><\/li>/, `${p.file}: footer contact column`);
      assert.doesNotMatch(footerOf(src), /Mustafa/, `${p.file}: the footer heading is "Contact"`);
      // The call to action bands carry no name, number or email.
      for (const band of [...src.matchAll(/<section class="section bg-ink pg-cta"[\s\S]*?<\/section>/g)].map((x) => x[0])) {
        assert.doesNotMatch(band, /Mustafa|331-271-6851|tel:|mailto:|@ouroptimization|contact-name|data-email-slot/, `${p.file}: the call to action band`);
      }
    }
    assert.match(text(byId(page['contact.html'], 'call')), /Prefer to talk now\? Call or text Mustafa at 331-271-6851\./);
    assert.match(text(page['about.html']), /Your contact Mustafa You deal with him directly/);
  });

  test('none of the removed "we\'re new" or Mustafa lines come back, on any page', () => {
    const GONE = [
      /being set up/i, /\bset(ting)? up now\b/i, /we(?:'re| are) setting up/i, /first round/i, /nothing has run/i, /no results to show/i,
      /claim no results/i, /first case stud/i, /has been held/i, /running our first/i, /our first (referral network|patient dinner)/i,
      /what we can tell you/i, /\bwe're new\b|\bwe are new\b/i, /no reviews, results or photos/i, /we can't promise a number/i,
      /You talk with Mustafa/i, /Mustafa will call/i, /Talk to Mustafa/i, /Ask Mustafa/i, /Mustafa directly/i, /Mustafa · 331/i
    ];
    for (const [file, c] of html) {
      if (file.endsWith('expo-vendors.html')) continue; // left untouched
      for (const re of GONE) assert.doesNotMatch(c, re, file);
    }
  });

  test('hyphenated words in the new copy do not split across lines', () => {
    for (const file of ['referral-network.html', 'flyer-network.html', 'faq.html', 'privacy.html', 'terms.html', 'review-tags.html']) {
      const body = main(file);
      const loose = body.replace(/<span class="nowrap">[^<]*<\/span>/g, ' ').replace(/<[^>]+>/g, ' ');
      assert.doesNotMatch(loose, /\b(first-visit|one-page|fee-splitting|tap-to-review|two-location)\b/, file);
    }
  });
});
