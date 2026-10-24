// The whole site: every page's head, header, footer and structured data; the words that must never appear;
// internal links, images and redirects; the sitemap; the forms. October 23, 2026: Our Wellness Network.
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
      if (!p.brandOnly) assert.match(title, /Our Wellness Network/); // the expo page keeps its own event title
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
      assert.equal(meta(src, 'property', 'og:site_name'), 'Our Wellness Network');
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
      assert.equal(d.name, 'Our Wellness Network');
      assert.equal(d.legalName, 'OUR Optimization LLC');
      assert.equal(d.telephone, '+1-331-271-6851');
      assert.match(d.areaServed.name, /^Chicago's western suburbs/);
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
      assert.match(h, /<a aria-label="Our Wellness Network home" class="brand" href="\/">/);
      assert.match(h, /<img src="\/assets\/img\/own-logo-360\.png" alt="Our Wellness Network" width="360" height="130">/);
      if (p.brandOnly) {
        assert.doesNotMatch(h, /<nav/);
        return;
      }
      assert.equal(h.replaceAll(' aria-current="page"', ''), home, 'the same header on every page');
      const nav = links(/<nav class="site-nav"[\s\S]*?<\/nav>/.exec(h)[0]);
      assert.deepEqual(nav.map((l) => [l.text, l.href]), [...NAV, ['Client Portal', PORTAL]]);
      const current = nav.filter((l) => /aria-current="page"/.test(l.tag)).map((l) => l.href);
      assert.deepEqual(current, p.nav ? [NAV.find((n) => n[0] === p.nav)[1]] : []);
      assert.match(h, new RegExp(`<a class="btn btn-primary btn-head" href="${PORTAL}">Client Portal</a>`));
      assert.ok(h.indexOf('class="menu-btn"') < h.indexOf('<nav class="site-nav"'), 'the menu button comes before the menu it opens');
    });
    test(`${p.file}: the footer names the company`, () => {
      const f = text(footerOf(src));
      assert.match(f, /© 2026 OUR Optimization LLC/);
      assert.match(f, /Our Wellness Network is a brand of OUR Optimization LLC/);
      assert.deepEqual(links(footerOf(src)).map((l) => l.href), ['/privacy', '/terms']);
    });
  }
  test('the dinner is on the pricing page only: out of the menu, off the home page, linked from pricing alone', () => {
    for (const p of PAGES) {
      if (['pricing.html', 'patient-network.html', 'privacy.html', 'terms.html'].includes(p.file)) continue;
      assert.doesNotMatch(bodyOf(page[p.file]), /patient-network|patient dinner/i, p.file);
    }
    assert.ok(links(page['pricing.html']).some((l) => l.href === '/patient-network'));
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
      const legal = ['privacy.html', 'terms.html', 'sample-contract.html'].includes(p.file);
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
  test('the URLs that must not change still exist', () => {
    for (const f of ['privacy.html', 'terms.html', 'review-tags.html', 'website-design.html', 'expo-vendors.html', 'patient-network.html', 'online-search-network.html']) assert.ok(existsSync(new URL(f, ROOT)), f);
    assert.ok(REDIRECTS.some((r) => r.from === '/vendors' && r.to === '/expo-vendors'));
  });
  test('repository files that are not the site are not served', () => {
    for (const from of ['/tests/*', '/README.md', '/netlify.toml', '/.claude/*']) {
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
    assert.equal((sm.match(/<lastmod>2026-10-24<\/lastmod>/g) || []).length, locs.length);
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
    assert.match(text(form), /Please don't include any patient information\./);
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
    assert.equal(m.name, 'Our Wellness Network');
    for (const f of ['favicon.ico', 'assets/owo-favicon.ico', 'assets/owo-icon-16.png', 'assets/owo-icon-32.png', 'assets/owo-icon-192.png', 'assets/owo-icon-512.png', 'assets/owo-apple-touch-icon.png', 'apple-touch-icon.png']) assert.ok(existsSync(new URL(f, ROOT)), f);
  });
});
