// The whole site: every page's head, header, footer and structured data; the words that must never appear;
// internal links, images and redirects; the sitemap; the forms. October 23, 2026: Local Impressions.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { read, PAGES, NAV, PORTAL, ORIGIN, FORBIDDEN, text, attr, hasAttr, tags, byId, mainOf, links, repoTextFiles, ROOT } from './html.mjs';

const page = Object.fromEntries(PAGES.map((p) => [p.file, read(p.file)]));
const headOf = (src) => src.slice(0, src.indexOf('</head>'));
const bodyOf = (src) => src.slice(src.indexOf('<body'));
const headerOf = (src) => /<header class="site-header"[\s\S]*?<\/header>/.exec(src)[0];
const footerOf = (src) => /<footer class="site-foot">[\s\S]*?<\/footer>/.exec(src)[0];
const meta = (src, key, name) => {
  const tag = tags(headOf(src), 'meta').find((t) => attr(t, key) === name);
  return tag ? attr(tag, 'content') : null;
};
const toml = read('netlify.toml');
const REDIRECTS = [...toml.matchAll(/\[\[redirects\]\]([\s\S]*?)(?=\n\[\[|\n# |$)/g)].map((m) => {
  const b = m[1];
  const get = (k) => (new RegExp(`\\n\\s*${k}\\s*=\\s*"([^"]*)"`).exec(b) || [])[1];
  const status = Number((/\n\s*status\s*=\s*(\d+)/.exec(b) || [])[1]);
  return { from: get('from'), to: get('to'), status, force: /\n\s*force\s*=\s*true/.test(b), query: /\n\s*query\s*=/.test(b) };
}).filter((r) => r.from);
const fileForUrl = (url) => {
  const path = url.split('#')[0].split('?')[0];
  if (path === '/') return 'index.html';
  const clean = path.replace(/^\//, '');
  for (const c of [clean, clean + '.html', clean.replace(/\/$/, '') + '/index.html']) if (c && existsSync(new URL(c, ROOT))) return c;
  return null;
};

describe('every page: head', () => {
  const titles = new Map();
  const descs = new Map();
  for (const p of PAGES) {
    const src = page[p.file];
    test(`${p.file}: title, description, canonical, Open Graph, Twitter, icons and the stylesheet`, () => {
      assert.match(src, /^<!doctype html>\n<html lang="en"/);
      const title = text(/<title>([\s\S]*?)<\/title>/.exec(src)[1]);
      assert.ok(title.length >= 15 && title.length <= 70, `title length ${title.length}: ${title}`);
      if (!p.brandOnly) assert.match(title, /Local Impressions/); // the expo page keeps its own event title
      assert.ok(!titles.has(title), `title also used by ${titles.get(title)}`);
      titles.set(title, p.file);
      const desc = meta(src, 'name', 'description');
      assert.ok(desc && desc.length >= 70 && desc.length <= 175, `description length ${desc && desc.length}`);
      assert.ok(!descs.has(desc), `description also used by ${descs.get(desc)}`);
      descs.set(desc, p.file);
      if (p.noindex) {
        assert.equal(meta(src, 'name', 'robots'), 'noindex');
        assert.doesNotMatch(src, /rel="canonical"/);
      } else {
        assert.match(src, new RegExp(`<link rel="canonical" href="${ORIGIN}${p.url}">`));
        assert.equal(meta(src, 'property', 'og:url'), ORIGIN + p.url);
      }
      assert.equal(meta(src, 'property', 'og:type'), 'website');
      assert.equal(meta(src, 'property', 'og:site_name'), 'Local Impressions');
      assert.equal(meta(src, 'property', 'og:title'), meta(src, 'name', 'twitter:title'));
      assert.ok(meta(src, 'property', 'og:description'));
      assert.equal(meta(src, 'property', 'og:image'), `${ORIGIN}/assets/img/og-network.jpg`);
      assert.equal(meta(src, 'property', 'og:image:width'), '1200');
      assert.equal(meta(src, 'property', 'og:image:height'), '630');
      assert.ok(meta(src, 'property', 'og:image:alt'));
      assert.equal(meta(src, 'name', 'twitter:card'), 'summary_large_image');
      // the raw attribute holds single-escaped entities (&rsquo;); a double escape (&amp;rsquo;) would show as text in previews
      for (const t of tags(headOf(src), 'meta')) assert.doesNotMatch(attr(t, 'content') || '', /&amp;(?:[a-z]+|#\d+);/i, `${p.file}: double-escaped text in ${t.slice(0, 60)}`);
      assert.match(src, /<link rel="icon" href="\/assets\/owo-favicon\.ico"/);
      assert.match(src, /<link rel="apple-touch-icon" href="\/assets\/owo-apple-touch-icon\.png">/);
      assert.match(src, /<link rel="manifest" href="\/site\.webmanifest\?v=owc1">/);
      assert.match(src, /<link rel="stylesheet" href="\/assets\/site\.css">/);
      assert.match(src, /<script src="\/assets\/site\.js" defer><\/script>/);
      assert.equal((src.match(/<h1\b/g) || []).length, 1, 'one h1');
    });
    test(`${p.file}: LocalBusiness structured data (name, phone, service area)`, () => {
      const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(headOf(src));
      assert.ok(m, 'JSON-LD in the head');
      const d = JSON.parse(m[1]);
      assert.equal(d['@type'], 'LocalBusiness');
      assert.equal(d.name, 'Local Impressions');
      assert.equal(d.legalName, 'OUR Optimization LLC');
      assert.equal(d.telephone, '+1-331-271-6851');
      assert.deepEqual(d.areaServed.map((a) => [a['@type'], a.name]), ['Franklin Park', 'Oak Brook', 'Lombard', 'Elmhurst', 'Naperville', 'Downers Grove', 'Hinsdale'].map((t) => ['City', t + ', IL']), 'the seven towns (November 24, 2026: Franklin Park added)');
      assert.deepEqual([d.address.addressRegion, d.address.addressCountry], ['IL', 'US'], 'region and country only: no invented street address');
      assert.equal(d.url, ORIGIN + '/');
      assert.ok(existsSync(new URL(d.logo.replace(ORIGIN + '/', ''), ROOT)), 'the logo file exists');
    });
  }
  test('og-network.jpg exists', () => assert.ok(existsSync(new URL('assets/img/og-network.jpg', ROOT))));
});

describe('every page: header and footer', () => {
  const home = headerOf(page['index.html']).replaceAll(' aria-current="page"', '');
  for (const p of PAGES) {
    const src = page[p.file];
    test(`${p.file}: the header`, () => {
      const h = headerOf(src);
      assert.match(h, /<a aria-label="Local Impressions home" class="brand" href="\/">/);
      assert.match(h, /<img src="\/assets\/img\/own-logo-360\.png" alt="Local Impressions" width="360" height="130">/);
      if (p.brandOnly) {
        /* November 23, 2026: the expo page keeps its logo-only header, plus the one Book a call button; no menu, no portal button */
        assert.doesNotMatch(h, /<nav|class="menu-btn"|btn-portal/);
        assert.match(h, /<\/picture><\/a>\s*<a class="btn btn-primary btn-head btn-book" href="\/contact">Book a call<\/a>\s*<\/div>\s*<\/header>/, 'Book a call right after the logo, as on every page');
        return;
      }
      assert.equal(h.replaceAll(' aria-current="page"', ''), home, 'the same header on every page');
      const nav = links(/<nav class="site-nav"[\s\S]*?<\/nav>/.exec(h)[0]);
      assert.deepEqual(nav.map((l) => [l.text, l.href]), [...NAV, ['Client Portal', PORTAL]]);
      const current = nav.filter((l) => /aria-current="page"/.test(l.tag)).map((l) => l.href);
      assert.deepEqual(current, p.nav ? [NAV.find((n) => n[0] === p.nav)[1]] : []);
      /* November 23, 2026: Book a call is the header's main action on every page; Client Portal sits beside it */
      assert.match(h, /<a class="btn btn-primary btn-head btn-book" href="\/contact">Book a call<\/a>\s*<a class="btn btn-ghost btn-head btn-portal" href="https:\/\/www\.ournetworkportal\.com"><span class="bh-client">Client&nbsp;<\/span>Portal<\/a>/);
      assert.ok(h.indexOf('class="menu-btn"') < h.indexOf('<nav class="site-nav"'), 'the menu button comes before the menu it opens');
      /* phones: the portal's bottom tab bar, inside the header (November 14, 2026) */
      const bar = /<nav class="tabbar" aria-label="Shortcuts">[\s\S]*?<\/nav>/.exec(h);
      assert.ok(bar, 'the tab bar');
      assert.ok(h.indexOf('<nav class="site-nav"') < h.indexOf('<nav class="tabbar"'), 'after the main menu');
      assert.deepEqual(links(bar[0]).map((l) => [l.text, l.href]), NAV.slice(0, 4), 'the first four menu items, then More (Pricing came off, November 21, 2026)');
      assert.match(bar[0], /<button class="tab tab-more" type="button" aria-expanded="false" aria-controls="site-nav">/, 'More opens the full menu');
      const tabNow = links(bar[0]).filter((l) => /aria-current="page"/.test(l.tag)).map((l) => l.href);
      const onBar = NAV.slice(0, 4).map((n) => n[1]);
      assert.deepEqual(tabNow, current.filter((c) => onBar.includes(c)), 'the tab for this page is marked, like the menu');
    });
    test(`${p.file}: the footer names the company`, () => {
      const f = text(footerOf(src));
      assert.match(f, /© 2026 OUR Optimization LLC/);
      assert.match(f, /Local Impressions is a service of OUR Optimization LLC\./, 'the brand line, the same everywhere (November 20, 2026)');
      assert.deepEqual(links(footerOf(src)).map((l) => l.href), ['/privacy', '/terms']);
      assert.match(f, /^Serving Franklin Park, Oak Brook, Lombard, Elmhurst, Naperville, Downers Grove and Hinsdale\. /, 'the service area, first in the footer (November 24, 2026)');
    });
  }
  test('the private dinners page is retired (November 24, 2026): no served page links it or offers the dinner', () => {
    assert.ok(!existsSync(new URL('patient-network.html', ROOT)), 'the page is gone');
    assert.ok(!existsSync(new URL('assets/img/dinner-table.svg', ROOT)), 'its illustration is gone');
    for (const from of ['/patient-network', '/patient-network.html', '/patient-dinners', '/patient-dinners.html', '/events', '/events.html']) assert.ok(REDIRECTS.some((r) => r.from === from && r.to === '/' && r.status === 301), `${from} 301s to the home page`);
    assert.ok(!REDIRECTS.some((r) => r.to === '/patient-network' || r.to.startsWith('/patient-network#')), 'nothing redirects to the retired page');
    assert.doesNotMatch(read('sitemap.xml'), /patient-network/, 'not in the sitemap');
    assert.doesNotMatch(read('assets/site.js'), /'\/patient-network/, 'no old home anchor sends visitors to it');
    for (const p of PAGES) {
      if (['privacy.html', 'terms.html'].includes(p.file)) continue; // legal text: the owner and the attorney update it
      assert.doesNotMatch(bodyOf(page[p.file]), /patient-network|patient dinner/i, p.file);
    }
  });
  test('every page header has the Book a call button, once, the expo page included (November 23, 2026)', () => {
    for (const p of PAGES) {
      const h = headerOf(page[p.file]);
      assert.equal(h.split('<a class="btn btn-primary btn-head btn-book" href="/contact">Book a call</a>').length - 1, 1, p.file);
    }
  });
});

describe('words and claims', () => {
  test('none of the retired words appear in any file the site serves', () => {
    for (const f of repoTextFiles()) {
      if (f.startsWith('tests/')) continue;
      const src = read(f);
      for (const w of FORBIDDEN) assert.ok(!src.includes(w), `${f} contains "${w}"`);
    }
  });
  test('no em or en dashes in any page copy', () => {
    for (const p of PAGES) assert.doesNotMatch(text(bodyOf(page[p.file])), /[–—]/, p.file);
  });
  test('the phone number appears only on the home page, /contact and /thanks', () => {
    const allowed = new Set(['index.html', 'contact.html', 'thanks.html']);
    for (const p of PAGES) {
      const has = /331.?271.?6851/.test(bodyOf(page[p.file]));
      assert.equal(has, allowed.has(p.file), p.file);
    }
  });
  test('no testimonials, reviews, ratings or scores', () => {
    for (const p of PAGES) {
      const t = text(mainOf(page[p.file]));
      // the legal pages may name testimonial text among the materials a clinic hands us; no page shows one
      const legal = ['privacy.html', 'terms.html'].includes(p.file);
      assert.doesNotMatch(t, legal ? /★|\b\d(\.\d)? out of 5\b|five[- ]star/i : /testimonial|★|\b\d(\.\d)? out of 5\b|five[- ]star/i, p.file);
      assert.doesNotMatch(page[p.file], /AggregateRating|"review"/, p.file);
    }
  });
});

describe('links, images and redirects', () => {
  test('every internal link opens a page, a file or a redirect, and every #anchor exists', () => {
    for (const p of PAGES) {
      for (const l of links(page[p.file])) {
        const h = l.href;
        if (!h || /^(https?:|mailto:|tel:)/.test(h)) continue;
        if (h.startsWith('#')) {
          if (h.length > 1) assert.ok(new RegExp(`\\sid="${h.slice(1)}"`).test(page[p.file]), `${p.file}: ${h}`);
          continue;
        }
        const path = h.split('#')[0].split('?')[0];
        const f = fileForUrl(path);
        const r = REDIRECTS.find((x) => x.from === path && !x.query);
        assert.ok(f || r, `${p.file}: ${h} goes nowhere`);
        const hash = h.includes('#') ? h.split('#')[1] : null;
        if (f && hash && f.endsWith('.html')) assert.ok(new RegExp(`\\sid="${hash}"`).test(read(f)), `${p.file}: ${h}, no #${hash} on ${f}`);
      }
    }
  });
  test('every image, source and poster on every page exists, and every <img> has width and height', () => {
    for (const p of PAGES) {
      const src = page[p.file];
      const urls = [];
      for (const t of [...tags(src, 'img'), ...tags(src, 'source'), ...tags(src, 'video')]) {
        for (const a of ['src', 'srcset', 'poster']) {
          const v = attr(t, a);
          if (!v) continue;
          for (const part of v.split(',')) urls.push(part.trim().split(/\s+/)[0]);
        }
      }
      for (const t of tags(src, 'img')) assert.ok(attr(t, 'width') && attr(t, 'height'), `${p.file}: ${t.slice(0, 80)}`);
      for (const u of urls.filter((x) => x.startsWith('/'))) {
        if (u === '/assets/video/van-route.mp4') continue;
        assert.ok(existsSync(new URL(u.slice(1), ROOT)), `${p.file}: missing ${u}`);
      }
    }
  });
  test('/flyer-network and every older flyer path 301 straight to /referral-network (printed QR codes keep working)', () => {
    for (const from of ['/flyer-network', '/flyer-network.html', '/flyer-drops', '/flyer-drops.html', '/flyers', '/direct-mail']) {
      const r = REDIRECTS.find((x) => x.from === from);
      assert.ok(r, from);
      assert.deepEqual([r.to, r.status, r.force], ['/referral-network', 301, true], from);
    }
    assert.ok(!existsSync(new URL('flyer-network.html', ROOT)), 'the flyer page file is gone');
  });
  test('no redirect points at another redirect, and every target exists', () => {
    const froms = new Set(REDIRECTS.filter((r) => !r.query).map((r) => r.from));
    for (const r of REDIRECTS) {
      if (r.status === 404) continue;
      const to = r.to.split('#')[0].split('?')[0];
      assert.ok(!froms.has(to), `${r.from} -> ${r.to} chains`);
      assert.ok(fileForUrl(to) || to === '/', `${r.from} -> ${r.to}: no such page`);
    }
  });
  test('the sample contract page is gone (November 19, 2026): its old address and its .html go straight to /contact, and nothing links to it', () => {
    assert.ok(!existsSync(new URL('sample-contract.html', ROOT)));
    for (const from of ['/sample-contract', '/sample-contract.html']) {
      const r = REDIRECTS.find((x) => x.from === from);
      assert.ok(r, from);
      assert.deepEqual([r.to, r.status, r.force], ['/contact', 301, true], from);
    }
    for (const p of PAGES) assert.doesNotMatch(page[p.file], /href="\/sample-contract/, p.file);
    assert.doesNotMatch(read('sitemap.xml'), /sample-contract/);
  });
  test('only one trial guarantee anywhere: the 45-day sign-up guarantee is gone from every page, the terms and the privacy policy', () => {
    for (const p of PAGES) assert.doesNotMatch(text(bodyOf(page[p.file])), /45 days|fewer than 5 tracked|two trial guarantees|both guarantees|second trial guarantee|two written guarantees/i, p.file);
    for (const p of PAGES) assert.doesNotMatch(page[p.file], /two guarantees|two trial guarantees|two written guarantees/i, `${p.file}: no "two guarantees" anywhere, meta descriptions included`);
  });
  test('the URLs that must not change still exist', () => {
    for (const f of ['privacy.html', 'terms.html', 'review-tags.html', 'website-design.html', 'expo-vendors.html', 'online-search-network.html']) assert.ok(existsSync(new URL(f, ROOT)), f);
    assert.ok(REDIRECTS.some((r) => r.from === '/vendors' && r.to === '/expo-vendors'));
  });
  test('repository files that are not the site are not served', () => {
    for (const from of ['/tests/*', '/tools/*', '/README.md', '/netlify.toml', '/.claude/*']) {
      const r = REDIRECTS.find((x) => x.from === from);
      assert.ok(r && r.status === 404 && r.force, from);
    }
  });
});

describe('sitemap and robots', () => {
  const sm = read('sitemap.xml');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  test('the sitemap lists every indexable page once, and nothing else', () => {
    const want = PAGES.filter((p) => !p.noindex).map((p) => ORIGIN + p.url).sort();
    assert.deepEqual([...locs].sort(), want);
    assert.equal(new Set(locs).size, locs.length);
    assert.equal((sm.match(/<lastmod>2026-\d\d-\d\d<\/lastmod>/g) || []).length, locs.length, 'every page has a lastmod date');
  });
  test('robots.txt points at the sitemap', () => assert.match(read('robots.txt'), /Sitemap: https:\/\/ouroptimization\.com\/sitemap\.xml/));
});

describe('forms (Netlify detects them from the static HTML)', () => {
  test('dinner-call on /contact: the three topics, the honeypot and the patient information line', () => {
    const src = page['contact.html'];
    const form = /<form\b[^>]*name="dinner-call"[\s\S]*?<\/form>/.exec(src)[0];
    const open = /<form\b[^>]*>/.exec(form)[0];
    assert.equal(attr(open, 'method'), 'POST');
    assert.equal(attr(open, 'action'), '/thanks');
    assert.equal(attr(open, 'data-netlify'), 'true');
    assert.equal(attr(open, 'netlify-honeypot'), 'bot-field');
    assert.match(form, /<input type="hidden" name="form-name" value="dinner-call">/);
    assert.match(form, /name="bot-field"/);
    const radios = tags(form, 'input').filter((t) => attr(t, 'name') === 'dinner');
    assert.deepEqual(radios.map((t) => attr(t, 'value')), ['Referral routes', 'Online search / review tags / website', 'Not sure yet']);
    assert.match(text(form), /Please don't include any health or patient information\./);
    for (const name of ['name', 'clinic', 'phone', 'email', 'town', 'best_time', 'message']) assert.match(form, new RegExp(`name="${name}"`), name);
  });
  test('expo-vendor on /expo-vendors: the form and its script are byte-for-byte the live ones', () => {
    const src = page['expo-vendors.html'];
    const form = /<form\b[^>]*name="expo-vendor"[\s\S]*?<\/form>/.exec(src)[0];
    assert.equal(createHash('sha256').update(form).digest('hex'), '9b90cacb95089ed848f8039dc3a257ab6c739ecf227c67b1adf1f70cb98999d8');
    const inline = [...src.matchAll(/<script>[\s\S]*?<\/script>/g)].map((m) => m[0]).filter((s) => /expo/i.test(s) || /getElementById/.test(s));
    assert.ok(inline.some((s) => createHash('sha256').update(s).digest('hex') === 'f530f0a4ae2fbdd10d37e2bdc9056f2e217ac406d57dfb18336d85a82cf213bf'), 'the inline form script is unchanged');
  });
  test('only these two forms exist on the site', () => {
    const names = PAGES.flatMap((p) => [...page[p.file].matchAll(/<form\b[^>]*name="([^"]+)"/g)].map((m) => m[1]));
    assert.deepEqual(names.sort(), ['dinner-call', 'expo-vendor']);
  });
});

describe('assets', () => {
  test('no draft van videos ship', () => {
    const vids = existsSync(new URL('assets/video/', ROOT)) ? readdirSync(new URL('assets/video/', ROOT)) : [];
    assert.deepEqual(vids.filter((f) => /^van-route.+\.mp4$/.test(f)), []);
  });
  test('the favicon set and the manifest carry the new name', () => {
    const m = JSON.parse(read('site.webmanifest'));
    assert.equal(m.name, 'Local Impressions');
    for (const f of ['favicon.ico', 'assets/owo-favicon.ico', 'assets/owo-icon-16.png', 'assets/owo-icon-32.png', 'assets/owo-icon-192.png', 'assets/owo-icon-512.png', 'assets/owo-apple-touch-icon.png', 'apple-touch-icon.png']) assert.ok(existsSync(new URL(f, ROOT)), f);
  });
});

/* November 20, 2026: the vertical-led site. The field team, Treats for Staff, the compliance wording, no sample labels,
   the placeholders the owner fills in, and the naming. These hold on every page, generated industry pages included. */
describe('every page: the November 20, 2026 rules', () => {
  const PLACEHOLDERS = []; /* November 21, 2026: no placeholder text anywhere */
  const HEALTHCARE = ['industries/med-spas.html', 'industries/dental.html', 'industries/chiropractic-physical-therapy.html'];
  const TODO = '<!-- TODO: attorney review of courtesy program before publishing healthcare pages -->';
  for (const p of PAGES) {
    const src = page[p.file];
    const t = text(bodyOf(src));
    test(`${p.file}: no staff courtesy, no old names, treats never tied to referrals`, () => {
      const withoutTodo = src.replaceAll(TODO, '');
      assert.doesNotMatch(withoutTodo, /courtesy|complimentary consultation/i, 'the staff courtesy program is gone');
      assert.doesNotMatch(src, /Organic Growth Team|Growth team|outsourced field sales team/i);
      if (p.file !== 'index.html') assert.doesNotMatch(t, /Boots on the ground/i, 'the home hero\'s line, used once (November 21, 2026)');
      if (p.file !== 'faq.html') assert.doesNotMatch(t, /whether or not (they|anyone) (ever )?(send|refer)/i, 'only the FAQ says the treats do not depend on referrals');
      assert.doesNotMatch(t, /HIPAA[- ]compliant/i, 'the HIPAA sentence waits for the owner (assets/site-config.js)');
    });
    test(`${p.file}: no visible "Sample account, illustrative data" label anywhere (the owner took them off, November 21, 2026)`, () => {
      assert.doesNotMatch(t, /Sample account|illustrative data/i);
      assert.doesNotMatch(src, /class="[^"]*\bsample-(tag|note)\b/);
    });
    test(`${p.file}: no unfinished placeholder text, visible or hidden (November 21, 2026)`, () => {
      for (const ph of t.match(/\[[A-Z][A-Z :,'-]+\]/g) || []) assert.ok(PLACEHOLDERS.includes(ph), ph);
      assert.doesNotMatch(src, /\[(STARTING PRICE|MINIMUM TERM|CAMPAIGN LENGTH|STOPS PER MONTH[^\]]*|FOUNDING [A-Z]+|CLIENT [A-Z, ]+|PLACEHOLDER|TOWN|INDUSTRY|STOPS|SIGN-UPS|BOOKINGS|CLIENT QUOTE)\]/);
    });
    test(`${p.file}: no pricing: no prices, trial, plans, money-back guarantee or links to /pricing (November 21, 2026)`, () => {
      if (p.file === 'terms.html') return; /* the legal terms keep how prices are agreed in writing, with no figures */
      assert.doesNotMatch(src, /href="\/pricing|\?about=pricing/);
      /* the one exception (November 23, 2026): the 30-day guarantee, in the FAQ, in the terms' own words */
      const tt = p.file === 'faq.html' ? t.replace('If we have not visited all 5 businesses and set up your codes within 30 days, your trial fee comes back. You keep the partner relationships either way.', '') : t;
      assert.doesNotMatch(tt, /\$\s?\d|\btrial\b|first-month|Neighborhood plan|Community plan|money back|comes back|priced on a call|included in your plan|at no charge|founding/i);
      assert.doesNotMatch(t, /\bPricing\b/);
    });
  }
  test('the 30-day guarantee (November 23, 2026): once on the site, in the FAQ, word for word as in the terms; the terms keep it', () => {
    const g = 'If we have not visited all 5 businesses and set up your codes within 30 days, your trial fee comes back. You keep the partner relationships either way.';
    assert.ok(text(page['terms.html']).includes(g), 'the terms keep the guarantee');
    const where = PAGES.filter((p) => p.file !== 'terms.html').filter((p) => text(page[p.file]).includes('within 30 days')).map((p) => p.file);
    assert.deepEqual(where, ['faq.html'], 'only the FAQ states it');
    assert.equal(text(page['faq.html']).split(g).length - 1, 1, 'once, verbatim');
  });
  test('the healthcare industry pages and the FAQ carry the attorney-review note and the state-rules line', () => {
    for (const f of HEALTHCARE) {
      assert.ok(page[f].includes(TODO), f);
      assert.match(text(bodyOf(page[f])), /Partner programs for healthcare practices are reviewed for compliance with applicable state rules before launch\./, f);
      assert.match(page[f], /<p class="hipaa-line" data-flag="hipaaConfirmed" data-flag-text="hipaaText" hidden><span><\/span><\/p>/, f);
    }
    const faq = page['faq.html'];
    assert.ok(faq.includes(TODO));
    assert.match(text(bodyOf(faq)), /Partner programs for healthcare practices are reviewed for compliance with applicable state rules before launch\./);
    assert.match(text(bodyOf(faq)), /Treats are shared with the whole staff on every visit, whether or not anyone refers a customer\./);
    assert.match(faq, /<script src="\/assets\/site-config\.js" defer><\/script>\n<script src="\/assets\/site\.js" defer>/);
  });
  test('the industry pages: titles and descriptions name the towns; each page is in the menu-less list and the sitemap', () => {
    const towns = ['Franklin Park', 'Oak Brook', 'Lombard', 'Elmhurst', 'Naperville', 'Downers Grove', 'Hinsdale'];
    for (const p of PAGES.filter((x) => x.industry)) {
      const d = meta(page[p.file], 'name', 'description');
      assert.ok(towns.filter((x) => d.includes(x)).length >= 2, `${p.file}: ${d}`);
      assert.ok(read('sitemap.xml').includes(`<loc>${ORIGIN}${p.url}</loc>`), p.url);
    }
  });
});

/* November 23, 2026: the FAQ answers every question; the add-ons and the industry pages, named as their own pages name
   them; "Level 1" and "Level 2" are gone (the plain names are "Your team visits" and "Our team visits"); and How it works
   says how matching works without claims about software. */
describe('November 23, 2026: every question answered, plain names, matching', () => {
  /* the words a visitor sees: an element marked hidden does not count as an answer */
  const visible = (s) => text(s.replace(/<([a-z0-9]+)\b[^>]*\shidden\b[^>]*>[\s\S]*?<\/\1>/gi, ' '));
  const questions = (src) => [...src.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)].map((m) => {
    const q = /<summary>([\s\S]*?)<\/summary>([\s\S]*)$/.exec(m[1]);
    return { q: q ? text(q[1]) : '', rest: q ? q[2] : m[1] };
  });
  const faqQ = (summary) => questions(page['faq.html']).find((x) => x.q === summary);
  test('every FAQ question on every page has a real answer under it', () => {
    assert.ok(questions(page['faq.html']).length >= 15, 'the FAQ page has its questions');
    for (const p of PAGES) {
      for (const { q, rest } of questions(page[p.file])) {
        assert.match(q, /\?$/, `${p.file}: a question in the summary: "${q}"`);
        const ans = /^\s*<div class="answer">([\s\S]*)<\/div>\s*$/.exec(rest);
        assert.ok(ans, `${p.file}: "${q}" has an answer block right under it`);
        const a = visible(ans[1]);
        assert.ok(a.split(' ').length >= 4 && /\w[.?!]/.test(a), `${p.file}: "${q}" has an empty or unfinished answer: "${a}"`);
      }
    }
  });
  test('"Do you offer anything besides the visits?": the three add-on pages, each described in its own words', () => {
    const a = faqQ('Do you offer anything besides the visits?');
    assert.ok(a, 'the question is on the FAQ');
    assert.ok(byId(page['faq.html'], 'add-ons').includes('Do you offer anything besides the visits?'), 'it keeps id="add-ons" (/faq#add-ons)');
    assert.deepEqual(links(a.rest).map((l) => l.href), ['/review-tags', '/online-search-network', '/website-design']);
    const said = text(a.rest).toLowerCase();
    for (const [f, phrases] of [
      ['review-tags.html', ['counter stands, table tents, cards and stickers', 'in your logo and colors', 'one tap or scan opens your google review form']],
      ['online-search-network.html', ['google ads in your own account', 'pay google directly']],
      ['website-design.html', ['rebuilt around the customers you want', 'call or book on every page']]
    ]) {
      const own = (text(page[f]) + ' ' + meta(page[f], 'name', 'description')).toLowerCase();
      for (const w of phrases) {
        assert.ok(said.includes(w), `the FAQ says "${w}"`);
        assert.ok(own.includes(w), `${f} says "${w}" itself`);
      }
    }
  });
  test('"Is there a page for my kind of practice?": all eight industry pages, named as in tools/industries/*.json', () => {
    const a = faqQ('Is there a page for my kind of practice?');
    assert.ok(a, 'the question is on the FAQ');
    const got = links(a.rest).map((l) => [l.text, l.href]);
    const files = readdirSync(new URL('tools/industries/', ROOT)).filter((f) => f.endsWith('.json'));
    const want = files.map((f) => JSON.parse(read('tools/industries/' + f))).sort((x, y) => x.order - y.order).map((j) => [j.name, '/industries/' + j.slug]);
    assert.equal(want.length, 8);
    assert.deepEqual(got, want);
    for (const [, href] of got) assert.ok(PAGES.some((p) => p.url === href), href);
  });
  test('no page says "Level 1" or "Level 2": the plain names are "Your team visits" and "Our team visits"', () => {
    for (const p of PAGES) assert.doesNotMatch(page[p.file].replace(/<!--[\s\S]*?-->/g, ' '), /\bLevel [12]\b/i, p.file);
    const lv = text(byId(page['referral-network.html'], 'levels'));
    assert.match(lv, /Your team visits/);
    assert.match(lv, /Our team visits/);
    assert.match(text(page['referral-network.html']), /When our team visits, every partner we sign for you signs it\./);
    assert.match(text(page['faq.html']), /Not when our team visits\. Each partner we sign for you agrees to promote one business of your kind, yours, for as long as you are a client\./);
  });
  test('How it works: how matching works, in one short beat, and no claims about software', () => {
    const m = text(byId(page['referral-network.html'], 'matching'));
    assert.match(m, /We look for businesses near you that already serve your customers\. Same customers, different service\. You approve the list before anyone is visited\./);
    assert.match(m, /We never match you with a business that competes with you\./);
    for (const p of PAGES) {
      if (p.file === 'terms.html') continue; /* the legal terms keep their own wording */
      assert.doesNotMatch(text(page[p.file]), /matching software|ranks the best fits|you may not know yet/i, p.file);
    }
    for (const id of ['matching', 'choosing', 'route', 'nfc', 'treats', 'month', 'dashboard', 'agreement', 'levels']) assert.match(page['referral-network.html'], new RegExp(`\\sid="${id}"`), `#${id} stays: other pages link here`);
  });
});

/* November 23, 2026 (integration): one share image for every page, so one description of it and one set of structured
   data; and the claims the review found that the terms and the partner agreement do not back, held to their sources. */
describe('November 23, 2026: the share image, and only what the terms back', () => {
  const TERMS = text(read('terms.html'));
  const ldOf = (src) => /<script type="application\/ld\+json">[\s\S]*?<\/script>/.exec(headOf(src))[0];
  test('every page describes the share image as it is, and carries the home page\'s structured data (the new slogan)', () => {
    const alt = meta(page['index.html'], 'property', 'og:image:alt');
    assert.equal(alt, 'The Local Impressions logo above the line: Meet the local businesses your next customers already trust.');
    for (const p of PAGES) {
      assert.equal(meta(page[p.file], 'property', 'og:image:alt'), alt, p.file);
      assert.equal(ldOf(page[p.file]), ldOf(page['index.html']), `${p.file}: the same LocalBusiness data as the home page`);
      assert.doesNotMatch(headOf(page[p.file]), /Boots on the ground/i, `${p.file}: the old slogan is retired from the head`);
    }
  });
  test('the staff card: the owner\'s name for it (tap-to-schedule), and what a tap really opens (the terms)', () => {
    assert.match(TERMS, /personal tap-and-scan code: an NFC tag and a QR code/);
    for (const f of ['index.html', 'referral-network.html', 'field-team.html', 'industries/med-spas.html']) assert.match(text(page[f]), /tap-to-schedule card/, f);
    for (const f of ['index.html', 'industries/med-spas.html']) assert.match(text(page[f]), /A tap or a scan opens your first-visit offer and a short sign-up form\./, f);
  });
  test('the displays (the owner, November 2026): when our team visits, we make them with your team, or you make your own', () => {
    assert.match(text(byId(page['referral-network.html'], 'levels')), /Make your displays with your team, or use the ones you make\./);
    assert.match(text(page['faq.html']), /When your team visits, your team makes them and drops them off\. When our team visits, we make them with your team, or you make your own\./);
    assert.match(text(page['field-team.html']), /Your displays, made with us or by you, at the front counter\./);
  });
  test('About: the owner\'s story in his own facts (November 23, 2026), nothing added', () => {
    const st = text(byId(page['about.html'], 'story'));
    assert.match(st, /Our story It started with my mom.s clinic\./);
    assert.match(st, /I.m Mustafa Siddiqui\. My mom, Dr\. Farhana, runs a pediatric clinic\. I started out as her marketing team, and I ran the flyers for her business myself\./);
    assert.match(st, /While I did, her clinic grew from 380K in revenue to more than 800K\. I got to see what that meant for her\./);
    assert.match(st, /When you work with us, you work with me directly\./);
    assert.doesNotMatch(st, /families who found her|patients|\$\d/, 'no facts he did not give; the figures are revenue, written without a dollar sign');
  });
  test('the partner agreement is signed when our team visits, on About and Field Team too', () => {
    assert.match(text(mainOf(page['about.html'])), /A one-page partner agreement\s*When our team visits, every partner signs one\./);
    assert.match(text(mainOf(page['field-team.html'])), /When our team visits, each partner signs a one-page agreement\. You promote each other\./);
    for (const f of ['about.html', 'field-team.html']) assert.doesNotMatch(text(mainOf(page[f])), /Every partner business signs|agreement with your business/, f);
  });
  test('the portals: names and numbers reach your portal and us (the terms), and the runner list keeps the treats out', () => {
    const t = text(mainOf(page['portals.html']));
    assert.match(TERMS, /Sign-ups reach your client portal, and us/);
    assert.match(t, /Sign-ups reach your portal, and us\. In the portal, only you and your front desk see names and numbers\. Our team.s logins see counts, not names\./, 'the terms: sign-ups reach the portal and us; the portal code: admin logins see counts only');
    assert.doesNotMatch(t, /Only you and your front desk see names/, 'scoped to the portal, never absolute');
    assert.match(t, /What they are carrying: flyers and staff cards\./);
    assert.doesNotMatch(t, /treats and referral cards/);
  });
  test('no promises the terms do not make: the treats as the terms say them, the expo, the ads', () => {
    const ft = text(mainOf(page['field-team.html']));
    assert.match(ft, /Modest by design: coffee, pastries and snacks\. Never gift cards, cash, free services or anything of real value\./);
    assert.doesNotMatch(ft, /picked up that morning|fresh-baked/i);
    const expo = text(mainOf(page['expo-vendors.html']));
    assert.match(expo, /expecting and new parents meet local providers for their family\./);
    assert.doesNotMatch(expo, /next decade|future patients/i);
    assert.match(text(mainOf(page['online-search-network.html'])), /Your ads can be there when they do\./);
  });
});
