// Static checks of every page of the multi-page site (October 22, 2026): the shared header, tabs
// and footer, each page's head tags and its one h1, the content of each page, and the copy rules
// that apply site-wide (no prices, no promised results, no names of prospects, nobody paid per patient).
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
      // The home page's share image leads with the referral network; /patient-dinners keeps the dinners one.
      assert.equal(meta('property', 'og:image'), `${SITE}/assets/img/${p.file === 'patient-dinners.html' ? 'og-best-patients.jpg' : 'og-neighbors.jpg'}`);
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
      assert.equal(text(/<div class="foot-brand">([\s\S]*?)<\/div>/.exec(f)[1]), "Referral networks, flyer drops and patient dinners for independent med spas, from Chicago's western suburbs.", 'the footer line leads with the referral network');
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

  test('the tabs run Home, the three steps, the extras, then About, FAQ and Contact', () => {
    assert.deepEqual(TABS.map((t) => t[0]), ['Home', 'Referral Network', 'Flyer Drops', 'Patient Dinners', 'Google Ads', 'Review Tags', 'Website Design', 'About', 'FAQ', 'Contact']);
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
    assert.match(html, /<meta property="og:image" content="https:\/\/ouroptimization\.com\/assets\/img\/og-neighbors\.jpg">/);
    const data = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
    assert.equal(data['@type'], 'ProfessionalService');
    assert.match(data.description, /We build referral networks for independent med spas/);
    assert.ok(data.description.indexOf('referral networks') < data.description.indexOf('dinners'), 'JSON-LD names the referral network first');
    assert.equal(data.telephone, '+1-331-271-6851');
    assert.doesNotMatch(JSON.stringify(data), /price|offers|rating|review/i);
    for (const p of PAGES.filter((x) => x.file !== 'index.html')) assert.doesNotMatch(page[p.file], /application\/ld\+json/, `JSON-LD only on the home page (${p.file})`);
  });

  test('hero: the two-line h1, the eyebrow, the lede and the two calls to action', () => {
    assert.equal(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)[1], 'Your neighbors bring you new patients. <em>Your best patients bring the next ones.</em>');
    const hero = m.slice(m.indexOf('<section class="hero'), m.indexOf('</section>'));
    assert.match(text(hero.slice(0, hero.indexOf('<h1'))), /Referral networks for independent med spas\s*$/);
    const lede = text(/<p class="lede">([\s\S]*?)<\/p>/.exec(hero)[1]);
    assert.equal(lede, 'The gym, the salon and the café down the street already know the people you want to meet. We find those businesses, sign them on as partners and keep your name at their front desk.');
    assert.deepEqual(links(hero).map((l) => [l.href, l.text]), [['/contact?about=referral-network', 'Book a 15-minute call'], ['/referral-network', 'How the referral network works'], ['tel:+13312716851', '331-271-6851']]);
    assert.match(text(/<p class="hero-note">([\s\S]*?)<\/p>/.exec(hero)[1]), /^You talk with Mustafa directly\. Call or text 331-271-6851\.$/);
  });

  test('the home page says "referral network" before it says "dinner"', () => {
    const t = text(m);
    assert.ok(t.search(/referral network/i) >= 0 && t.search(/referral network/i) < t.search(/dinner/i), 'referral network first');
  });

  test('the community map: the five places and their channels', () => {
    assert.match(html, /<img class="town-img" src="\/assets\/img\/hero-map\.svg" alt="" width="1100" height="1175" fetchpriority="high" decoding="async">/);
    const pairs = [.../<ul class="tp-list"[^>]*>([\s\S]*?)<\/ul>/.exec(html)[1].matchAll(/<li><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/li>/g)].map((x) => `${text(x[1])} / ${text(x[2])}`);
    assert.deepEqual(pairs, ['Offices / Referral network', 'Small businesses / Flyer drops', 'Training facilities / Partner referrals', 'Restaurants / Sponsored events', 'Neighborhoods / Google Ads']);
    assert.equal(text(/<p class="tp-note">([\s\S]*?)<\/p>/.exec(html)[1]), 'Sponsored events are your patient dinners, at a restaurant near your clinic. Partner referrals come from your referral network.');
  });

  test('"What we do": three numbered steps, the referral network first and largest, then the extras', () => {
    const sec = byId(html, 'services');
    const steps = /<ol class="hm-steps[^"]*"[^>]*>([\s\S]*?)<\/ol>/.exec(sec)[1];
    const items = [...steps.matchAll(/<li class="(hm-step[^"]*)">([\s\S]*?)<\/li>\s*(?=<li class="hm-step|$)/g)].map((x) => ({ cls: x[1], html: x[2] }));
    assert.equal(items.length, 3, 'three steps');
    assert.deepEqual(items.map((i) => /<h3><a href="([^"]+)">([^<]+)<\/a><\/h3>/.exec(i.html).slice(1).reverse()), [['Referral Network', '/referral-network'], ['Flyer Drops', '/flyer-drops'], ['Patient Dinners', '/patient-dinners']]);
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
    assert.doesNotMatch(text(sec), /every two weeks, someone walks|As we go, we add new places|The dinner is the core/i, 'the old wording is gone');
    const also = /<div class="hm-also[^"]*">([\s\S]*?)<\/div>/.exec(sec)[1];
    assert.equal(text(/<h3 class="hm-also-h">([^<]+)<\/h3>/.exec(also)[1]), 'Also');
    assert.deepEqual(links(also).map((l) => l.href), ['/google-ads', '/review-tags', '/website-design'], 'the extras: Google Ads, Review Tags, Website Design');
    assert.ok(sec.indexOf('hm-also') > sec.indexOf('</ol>'), 'the extras come after the three steps');
  });

  test('"How we work": fees set in advance, your words, the patient list, month to month', () => {
    const t = text(byId(html, 'how-we-work'));
    assert.match(t, /Monthly services have a flat monthly fee, set in advance, that never moves with referrals\. Each dinner has one fixed quote\./);
    assert.match(t, /You choose every business on your flyer drop list, and approve every word we use about your clinic\./);
    assert.match(t, /We never receive, see or keep your patient list\./);
    assert.match(t, /Monthly services run month to month, with 30 days' notice to end them\. Dinners have no monthly contract\./);
    assert.match(byId(html, 'how-we-work'), /href="\/about#how-we-work"/);
  });

  test('Grace Pediatrics, short, linking to /about', () => {
    const who = byId(html, 'who-we-are');
    assert.match(text(who), /Client work: Grace Pediatrics in Glendale Heights\. We ran its community marketing: flyers for local families, branded gift tins, an event table and QR codes that track every scan\./);
    assert.match(text(who), /We're setting up our first referral network now, and none of our patient dinners has been held yet, so there are no results to show\./);
    assert.match(who, /href="\/about"/);
    assert.match(who, /href="\/referral-network#example"/);
  });

  test('#call is a call to action band that leads to /contact (old /#call links land on it)', () => {
    const band = byId(html, 'call');
    assert.ok(band, '#call exists');
    assert.match(text(band), /Book a 15-minute call\./);
    assert.ok(links(band).some((l) => l.href === '/contact'));
    assert.equal(tags(html, 'form').length, 0, 'the form lives on /contact');
  });
});

/* ---------- the three steps ---------- */
describe('the three steps: Referral Network, Flyer Drops, Patient Dinners', () => {
  const STEPS = [
    { file: 'referral-network.html', n: 1, name: 'Referral Network', next: ['/referral-network', '/flyer-drops', 'Step 2 of 3: Flyer Drops'] },
    { file: 'flyer-drops.html', n: 2, name: 'Flyer Drops', next: ['/flyer-drops', '/patient-dinners', 'Step 3 of 3: Patient Dinners'] },
    { file: 'patient-dinners.html', n: 3, name: 'Patient Dinners', next: ['/patient-dinners', '/referral-network', 'Back to step 1: Referral Network'] }
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
      assert.doesNotMatch(text(m), /The dinner is the core/, 'the dinners are step 3 now');
    });
  }
});

/* ---------- /patient-dinners ---------- */
describe('/patient-dinners', () => {
  const html = page['patient-dinners.html'];

  test('the two dinners, in the brief\'s words, and the sales evening said plainly', () => {
    const f = text(byId(html, 'formats'));
    assert.match(f, /About 15 of your favorite patients each bring a friend who isn't a patient yet\./);
    assert.match(f, /Up to 30 of your best patients, at an evening built around a new treatment or package\. For spas whose books are already full\./);
    assert.match(f, /It is a sales evening, and we say so\./);
  });

  test('the pricing card has no figure: one fixed quote, restaurant and food included', () => {
    const f = text(byId(html, 'formats'));
    for (const line of ['No surprises', 'One fixed quote per dinner.', 'Restaurant and food included.', 'Quoted for your clinic after the 15-minute call.', 'The price is fixed in writing before you commit.', 'No monthly contract.']) assert.ok(f.includes(line), line);
    assert.match(byId(html, 'formats'), /<a class="btn btn-light" href="\/contact\?about=patient-dinners">Book a 15-minute call<\/a>/);
  });

  test('how the evening works: four steps, and the illustration with no caption', () => {
    const how = byId(html, 'how');
    assert.deepEqual([...how.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((x) => text(x[1])), ['Plan', 'Invitations', 'The night', 'The follow-up']);
    assert.match(text(how), /At 30 days you get a results sheet: who came, how many were new, and what they booked\./);
    assert.doesNotMatch(/<figure class="dn-illus">([\s\S]*?)<\/figure>/.exec(how)[1], /<figcaption/);
  });

  test('what we handle, the patient list promise, and one of us on site', () => {
    const h = byId(html, 'handle');
    const items = [...(/<ul class="dn-checks"[^>]*>([\s\S]*?)<\/ul>/.exec(h)[1]).matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => text(x[1]));
    assert.deepEqual(items, ['The restaurant and the food', 'The menu, set with the venue', "Invitations designed in your clinic's name", 'An RSVP page', 'Reminder messages', 'Name cards and seating', 'The run of the evening', 'An offer card with its own code', 'The next-day follow-up', 'A results sheet at 30 days: who came, how many were new, what they booked']);
    const t = text(h);
    assert.match(t, /Your patient list stays yours\. We never see it\./);
    assert.match(t, /We never receive, see or keep your patient list\./);
    assert.match(t, /One of us is there all evening, greeting guests and keeping the night on schedule, so you can host\./);
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
    assert.match(p, /Your front desk gives us the bookings and revenue as totals for each partner, so we never see patient records\./);
    assert.match(p, /we never drop a partner for its lead count\. Our fee is flat, set in advance, and does not change with them\. We never pay a place per patient\./);
    assert.doesNotMatch(text(m), /which partners? (are|is) working|which partnerships are working/i);
  });

  test('partners share the flyer drop route, and the NFC explainer is plain', () => {
    const nfc = text(byId(html, 'nfc'));
    assert.match(step('Every month'), /Each month the flyers and cards carry your current offer, with each partner's link on the flyers and its code on the cards\. Every partner gets a planned visit each month: restocking flyers and cards/);
    assert.match(text(byId(html, 'process')), /With flyer drops too, those visits happen on your field days, on the same route\./);
    assert.match(nfc, /^Tap or scan What is an NFC tag\? A small chip inside a partner's stand or flyer\./);
    assert.match(byId(html, 'nfc'), /href="\/review-tags#nfc"/);
    assert.match(nfc, /Hold the top of a phone near it and the page it carries opens, with no app to download\./);
    assert.match(nfc, /Tap and scan use different links, so you can see which one people actually use\./);
  });

  test('Example: ETHR LAB\'s training partner network, being set up now, with no price and no results', () => {
    const ex = byId(html, 'example');
    const t = text(ex);
    assert.match(ex, /<h2 id="ethr-h">Example: <span class="nowrap">ETHR LAB&rsquo;s<\/span> training partner network\.<\/h2>/);
    assert.equal(text(/<p class="et-ok">([\s\S]*?)<\/p>/.exec(ex)[1]), "We share this example with ETHR LAB's permission.");
    assert.match(t, /ETHR LAB is a recovery and wellness studio in Oakbrook Terrace\. We are setting up its network of training gyms nearby now, five in the first round\. Nothing has run yet, so there are no results to show\./);
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
    assert.match(t, /Status: being set up now\. We claim no results, sign-ups or numbers for it\./);
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

/* ---------- /flyer-drops ---------- */
describe('/flyer-drops', () => {
  const html = page['flyer-drops.html'];
  const t = text(main('flyer-drops.html'));

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

  test('each visit, and the visit log within five business days', () => {
    const v = byId(html, 'visit');
    assert.deepEqual([...v.matchAll(/<li>[\s\S]*?<h3>([\s\S]*?)<\/h3>/g)].map((x) => text(x[1])), ['Deliver and restock', 'Talk to the staff', 'Take notes', 'Come back']);
    assert.match(t, /placed where people will see them, with the location's permission\./);
    assert.match(t, /introduces your clinic and leaves a direct line for questions\./);
    assert.match(t, /Within five business days of each field day you get a visit log: every business visited, who was spoken to, what was left, and any follow-up asked for\./);
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
    assert.match(t, /We don't need or want protected health information, and none is required\./);
    assert.match(t, /Set in advance\. It never moves with referrals, and no part of it goes to a business or anyone we visit\. Month to month, with 30 days' written notice to end it\./);
    assert.match(t, /Works on its own or with Google Ads\.\s?If you add Google Ads, the two work side by side, and the ad budget goes straight to Google from your own account/);
  });
});

/* ---------- /google-ads ---------- */
describe('/google-ads', () => {
  const t = text(main('google-ads.html'));
  test('only what the site already said: the cherry on top, your own account, side by side with flyer drops', () => {
    assert.match(t, /Ads are there for the people who hear about you from a partner, from a friend or at a dinner, and then search for you\. You pay Google directly, in your own account\./);
    assert.match(t, /The cherry on top/i);
    assert.match(t, /We drive the growth behind the ads\./);
    assert.match(t, /The ad budget goes straight to Google from that account, so you keep control of what you spend there\./);
    assert.match(t, /Google Ads can run on its own\. If you also have flyer drops, the two work side by side\./);
    assert.match(t, /Our part is quoted for your clinic first\./);
    assert.equal((t.match(/Our part is quoted/g) || []).length, 1, 'said once');
    assert.deepEqual([...main('google-ads.html').matchAll(/<h3><a href="([^"]+)">/g)].map((x) => x[1]), ['/referral-network', '/flyer-drops', '/patient-dinners'], 'the steps in order, then the ads');
  });
  test('no invented features or results', () => {
    assert.doesNotMatch(t, /keyword|landing page|conversion|ROAS|click-through|\bCTR\b|bid|retarget|remarket|management fee|ranking|top of Google|first page/i);
  });
});

/* ---------- /about ---------- */
describe('/about', () => {
  const html = page['about.html'];
  const t = text(main('about.html'));
  test('who we are: honest that no dinner has been held, Grace Pediatrics, and Mustafa\'s contact', () => {
    assert.match(t, /We're running our first patient dinners now\. None has been held yet, so there are no reviews, results or photos from them on this page\./);
    assert.match(t, /Client work: Grace Pediatrics in Glendale Heights\./);
    assert.match(t, /We already run marketing for a wellness clinic nearby\./);
    assert.match(t, /With your permission, your clinic's results will be among our first case studies\./);
    assert.match(html, /<a href="tel:\+13312716851">[\s\S]*?331-271-6851<\/a>/);
    assert.match(html, /<a href="mailto:mustafa@ouroptimization\.com">[\s\S]*?mustafa@ouroptimization\.com<\/a>/);
  });
  test('how we work: the six commitments from our agreements', () => {
    const w = byId(html, 'how-we-work');
    assert.deepEqual([...w.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((x) => text(x[1])), ['Your words only', 'Your patient list stays yours', 'Yours to keep', 'Fees set in advance', 'Independent', 'Month to month']);
    const s = text(w);
    assert.match(s, /Flyer drops and the referral network need no patient information\. At a dinner, we see the RSVP replies guests send us and who comes on the night\./);
    assert.doesNotMatch(s, /none is required/, 'the promise is no wider than what is true for dinners');
    assert.match(s, /We talk about your clinic only in the words you approve\./);
    assert.match(s, /We never receive, see or keep your patient list\./);
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
  test('the brief\'s seven questions are one group, in their order, byte-for-byte unchanged', () => {
    const BRIEF = '86063fe3bc40995d522ed44277be9f67033b6173e4608e850af0d9638d7d7dbd';
    const all = [...m.matchAll(/<details>[\s\S]*?<\/details>/g)].map((x) => x[0]);
    // Find the seven wherever they sit on the page: exactly one run of seven entries in a row has the locked hash.
    const runs = all.map((_, i) => i).filter((i) => i + 7 <= all.length && sha(all.slice(i, i + 7).join('\n')) === BRIEF);
    assert.equal(runs.length, 1, 'the brief\'s seven FAQ entries are unchanged and together');
    const own = [...byId(html, 'dinners-faq').matchAll(/<details>[\s\S]*?<\/details>/g)].map((x) => x[0]);
    assert.deepEqual(own, all.slice(runs[0], runs[0] + 7), 'the seven are the whole Patient dinners group');
    assert.doesNotMatch(byId(html, 'dinners-faq'), /fq-more/, 'no new wrapping styles on the locked seven');
  });
  test('the referral network and flyer drop questions come first, then the seven, then working with us', () => {
    const order = [...m.matchAll(/<section class="section[^"]*fq-group" aria-labelledby="[^"]+" id="([^"]+)">/g)].map((x) => x[1]);
    assert.deepEqual(order, ['network-faq', 'flyer-drops-faq', 'dinners-faq', 'working-faq']);
    assert.deepEqual([...m.matchAll(/<h2 id="[^"]+-faq-h">([^<]+)<\/h2>/g)].map((x) => x[1]), ['Referral network', 'Flyer drops', 'Patient dinners', 'Working with us']);
    assert.deepEqual(links(/<ul class="fq-jump"[\s\S]*?<\/ul>/.exec(m)[0]).map((l) => l.href), ['#network-faq', '#flyer-drops-faq', '#dinners-faq', '#working-faq']);
  });
  test('every question, grouped by topic', () => {
    const group = (id) => [...byId(html, id).matchAll(/<summary>([\s\S]*?)<span class="sign"/g)].map((x) => text(x[1]));
    assert.deepEqual(group('dinners-faq'), ["Can't I just book a restaurant myself?", 'Will people actually come on a weeknight?', 'Is it a sales evening?', 'Do you ever see my patient list?', 'My rep already sponsors events. Why use you?', 'What does it cost?', 'Who are you?']);
    assert.deepEqual(group('flyer-drops-faq'), ['How do flyer drops work?', 'Who chooses the businesses?', 'What do I get after each field day?', 'Do I need a dinner or Google Ads to get flyer drops?']);
    assert.deepEqual(group('network-faq'), ["What if I don't have a referral network yet?", 'What does each partner get?', 'What is the code on the referral cards for?', 'How do leads from partners reach my clinic?', 'What is an NFC tag?', 'Does anyone pay partners for referrals?', 'What goes in the monthly report?']);
    assert.deepEqual(group('working-faq'), ['How long do I sign up for?', 'How do you talk about my clinic?']);
  });
  test('the new answers match the pages', () => {
    const a = text(m);
    assert.match(a, /fourteen for each location, on two field days a month, seven businesses a day\./);
    assert.match(a, /Flyer drops are quoted for your clinic before they start, at a flat monthly fee that never moves with referrals\./);
    assert.match(a, /You do\. You list them on one page, for example gyms, salons, primary care offices, chiropractors, physical therapy, boutiques, country clubs and employers\./);
    assert.match(a, /A visit log, within five business days: every business visited, who was spoken to, what was left, and any follow-up asked for\./);
    assert.match(a, /No\. Flyer drops run on their own or with Google Ads, and you can add them to a dinner, which is quoted on its own\./);
    assert.match(a, /It is a perk, not a payment, and the partner agreement says no payment is made for a referral\. Nobody is paid per patient\./);
    assert.match(a, /Your front desk gives us the bookings and revenue as totals for each partner, never names or patient records\./);
    assert.match(m, /<a href="\/review-tags#nfc">/);
    assert.match(a, /A small chip inside a partner's stand or flyer\./);
    assert.match(m, /<a href="\/contact\?about=flyer-drops">Book a <span class="nowrap">15-minute call<\/span> about flyer drops<\/a>/);
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

  test('"We never receive, see or keep your patient list" stays on the pages that make the promise', () => {
    for (const file of ['patient-dinners.html', 'about.html', 'index.html', 'privacy.html', 'faq.html']) {
      assert.match(text(page[file]), /We never receive, see or keep your patient list\./, file);
    }
  });

  test('hyphenated words in the new copy do not split across lines', () => {
    for (const file of ['referral-network.html', 'flyer-drops.html', 'faq.html', 'privacy.html', 'terms.html', 'review-tags.html']) {
      let body = main(file);
      if (file === 'faq.html') body = body.replace(byId(page['faq.html'], 'dinners-faq'), ' '); // the locked seven keep their bytes
      const loose = body.replace(/<span class="nowrap">[^<]*<\/span>/g, ' ').replace(/<[^>]+>/g, ' ');
      assert.doesNotMatch(loose, /\b(first-visit|one-page|fee-splitting|tap-to-review|two-location)\b/, file);
    }
  });
});
