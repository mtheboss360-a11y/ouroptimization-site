// Guard tests for the site's static assets: every local file a page points at exists,
// every page carries the favicon set, removed images and deleted files stay removed, the
// favicons are the OWO logo mark on a cream tile (no SVG icon: browsers prefer one over the PNGs), and the
// retired service pages (October 2026) stay retired: each has a forced 301 in netlify.toml to the
// page that now covers it, no kept page links to one, and the sitemap lists every indexable page.
// Zero dependencies: node:test + node:assert + node:zlib. Run from the repo root: node --test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const isFile = (p) => existsSync(join(ROOT, p)) && statSync(join(ROOT, p)).isFile();
const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
// SHA-256 of the Our Wellness Network logo and of the two share images re-rendered with it (October 22, 2026).
const LOGO_SHA = 'e9449659d931e5100943919ed541bb7eab554da8758021dc0cc0d29b7e2abb6d';
const OG_NEIGHBORS_SHA = '4c1a20f134c6bb06c614e753a3d391e8e77f90d73a657ddc3194e9968f215bf8';
const OG_BEST_SHA = 'c0e4916dc272f15a5b669883d4b5315bbf8e69fc0905b237b942d9e5dc6cfe60';

// The favicon block every page head carries. Root-absolute, so the 404 page works at any depth.
// There is no SVG icon: browsers prefer an SVG over the PNG and ICO files, and the OWO mark ships as PNG and ICO only.
// Browsers cache favicons by URL and ignore normal cache headers (Safari even across private windows, and it can
// ignore a ?v= query), so the linked icons use OWO-specific file names no browser saw before the switch.
// When the icon art changes again, give the files new names and update the links here, on every page and in the manifest.
const FAVICON_LINKS = [
  { rel: 'icon', href: '/assets/owo-favicon.ico' },
  { rel: 'icon', href: '/assets/owo-icon-32.png' },
  { rel: 'icon', href: '/assets/owo-icon-16.png' },
  { rel: 'apple-touch-icon', href: '/assets/owo-apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest?v=own1' }
];

// Images that were removed. Nothing may link to them again: the AI hero, the client stand photo
// that /review-tags showed until October 22, 2026 (replaced by a sample stand mockup), and the ETHR LAB mockups
// (the example came off /referral-network on October 22, 2026, at the owner's request).
const REMOVED = ['assets/img/hero-town.png', 'assets/img/hero-town.webp', 'assets/img/hero-town-700.webp',
  'assets/img/review-stand.jpg', 'assets/img/review-stand.webp', 'assets/img/review-stand-600.jpg', 'assets/img/review-stand-600.webp',
  ...['stand', 'tap'].flatMap((n) => [`assets/img/ethr-mockup-${n}.jpg`, `assets/img/ethr-mockup-${n}.webp`, `assets/img/ethr-mockup-${n}-600.jpg`, `assets/img/ethr-mockup-${n}-600.webp`])];

// The pages of the site (the multi-page site of October 22, 2026), and the clean URL of each.
const KEPT = ['404.html', 'about.html', 'client-portal.html', 'contact.html', 'expo-vendors.html', 'faq.html', 'flyer-network.html', 'online-search-network.html', 'index.html',
  'patient-network.html', 'privacy.html', 'referral-network.html', 'review-tags.html', 'terms.html', 'thanks.html', 'website-design.html'];
const CLEAN = ['/', '/referral-network', '/flyer-network', '/patient-network', '/online-search-network', '/review-tags', '/website-design', '/about',
  '/faq', '/contact', '/privacy', '/terms', '/thanks', '/expo-vendors'];
// The pages the sitemap lists: every page people should find from a search.
const INDEXABLE = ['/', '/referral-network', '/flyer-network', '/patient-network', '/online-search-network', '/review-tags', '/website-design', '/client-portal', '/about', '/faq', '/contact', '/privacy', '/terms'];

// The service pages renamed on October 22, 2026, when the brand became Our Wellness Network: old path -> new path.
const RENAMED = { 'flyer-drops': '/flyer-network', 'patient-dinners': '/patient-network', 'google-ads': '/online-search-network' };

// Retired service pages and the page (or section) each one now 301s to, with and without .html.
const RETIRED = {
  'how-it-works': '/patient-network#how', services: '/#services', 'community-marketing': '/referral-network', 'custom-marketing': '/referral-network',
  'digital-marketing': '/online-search-network', industries: '/', examples: '/', estimate: '/contact', 'market-research': '/referral-network',
  'direct-mail': '/flyer-network', events: '/patient-network', flyers: '/flyer-network', 'marketing-kits': '/patient-network#handle', seo: '/website-design',
  'social-media': '/#services', groupon: '/#services', 'gift-cards': '/#services', tracking: '/patient-network#handle',
  'sample-advertisements': '/'
};

// Files deleted with the retired pages (the old strategy meeting form, its script and its tests), the old SVG favicon,
// the old logo (replaced by our-wellness-network-logo.png) and the old file names of the renamed pages.
const DELETED = ['assets/estimate.js', 'tests/estimate.test.mjs', 'tests/e2e-estimate.mjs', 'assets/favicon.svg', 'assets/img/owo-logo.png',
  ...Object.keys(RETIRED).map((n) => `${n}.html`), ...Object.keys(RENAMED).map((n) => `${n}.html`)];

/* The [[redirects]] rules in netlify.toml, as { from, to, status, force, query }. query is null, or the
   Netlify query condition ({ about: ':about' }): such a rule only applies when the URL carries those keys. */
function redirects() {
  return read('netlify.toml').split(/^\[\[redirects\]\]\s*$/m).slice(1).map((block) => {
    const body = block.split(/^\[/m)[0];
    const get = (key) => { const m = new RegExp(`^\\s*${key}\\s*=\\s*(?:"([^"]*)"|(\\S+))`, 'm').exec(body); return m ? (m[1] ?? m[2]) : null; };
    const q = /^\s*query\s*=\s*\{([^}]*)\}/m.exec(body);
    const query = q ? Object.fromEntries([...q[1].matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)].map((m) => [m[1], m[2]])) : null;
    return { from: get('from'), to: get('to'), status: Number(get('status') ?? 301), force: get('force') === 'true', query };
  });
}
/* Netlify-style match: a splat (*) matches anything, and a trailing slash is ignored. */
const matchesRule = (pattern, path) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}/?$`).test(path);
const pathOf = (url) => url.split(/[?#]/)[0] || '/';

const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? (m[1] ?? m[2]) : null;
};

/* Turns a URL found in a page into a repo path, or null when it is not a local file. */
function localPath(url) {
  let u = url.trim().replace(/&amp;/g, '&');
  if (!u || u.startsWith('#') || /^(data|mailto|tel|javascript):/i.test(u)) return null;
  const site = /^https?:\/\/(www\.)?ouroptimization\.com(\/.*)?$/i.exec(u);
  if (site) u = site[2] || '/';
  else if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(u)) return null; // another origin
  u = decodeURIComponent(u.split(/[?#]/)[0]).replace(/^\.?\//, '');
  return u;
}

/* Every local file URL a page references: src, srcset, poster, file hrefs. */
function fileRefs(html) {
  const refs = [];
  for (const [tag] of html.matchAll(/<[a-z][^>]*>/gi)) {
    for (const name of ['src', 'poster']) {
      const v = attr(tag, name);
      if (v != null) refs.push(v);
    }
    const srcset = attr(tag, 'srcset');
    if (srcset != null) for (const part of srcset.split(',')) if (part.trim()) refs.push(part.trim().split(/\s+/)[0]);
    const href = attr(tag, 'href');
    // Assets, plus any href that names a file (clean page URLs such as /events have no extension).
    if (href != null && (/^\/?assets\//.test(href) || /\.[a-z0-9]{2,5}$/i.test(href.split(/[?#]/)[0]))) refs.push(href);
    const content = attr(tag, 'content');
    if (content != null && /^https:\/\/ouroptimization\.com\/assets\//.test(content)) refs.push(content);
  }
  return refs.map((url) => ({ url, path: localPath(url) })).filter((r) => r.path !== null);
}

/* Minimal PNG decoder: 8-bit, non-interlaced, grey/RGB/palette/grey-alpha/RGBA. Returns RGBA pixels. */
function decodePng(buf) {
  assert.equal(buf.toString('latin1', 1, 4), 'PNG', 'PNG signature');
  let off = 8, ihdr, plte, trns;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], color: data[9], interlace: data[12] };
    else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  assert.ok(ihdr, 'IHDR chunk');
  assert.equal(ihdr.depth, 8, 'test decoder handles 8-bit PNGs');
  assert.equal(ihdr.interlace, 0, 'test decoder handles non-interlaced PNGs');
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.color];
  assert.ok(channels, `supported color type (${ihdr.color})`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = ihdr.w * channels;
  const out = Buffer.alloc(stride * ihdr.h);
  for (let y = 0; y < ihdr.h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y * stride + x - channels] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? out[(y - 1) * stride + x - channels] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      assert.notEqual(pred, undefined, `known filter type (${filter})`);
      out[y * stride + x] = (line[x] + pred) & 0xff;
    }
  }
  const pixels = [];
  for (let i = 0; i < ihdr.w * ihdr.h; i++) {
    const s = out.subarray(i * channels, (i + 1) * channels);
    if (ihdr.color === 0) pixels.push([s[0], s[0], s[0], 255]);
    else if (ihdr.color === 2) pixels.push([s[0], s[1], s[2], 255]);
    else if (ihdr.color === 3) pixels.push([plte[s[0] * 3], plte[s[0] * 3 + 1], plte[s[0] * 3 + 2], trns && s[0] < trns.length ? trns[s[0]] : 255]);
    else if (ihdr.color === 4) pixels.push([s[0], s[0], s[0], s[1]]);
    else pixels.push([s[0], s[1], s[2], s[3]]);
  }
  return { width: ihdr.w, height: ihdr.h, pixels };
}

/* Shares of near-black and light pixels among the opaque ones, plus the distinct colour count. */
function tones(pixels) {
  const opaque = pixels.filter((p) => p[3] >= 128);
  const lum = (p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  return {
    distinct: new Set(pixels.map((p) => p.join(','))).size,
    nearBlack: opaque.filter((p) => lum(p) < 40).length / opaque.length,
    light: opaque.filter((p) => lum(p) > 160).length / opaque.length
  };
}

describe('local file references', () => {
  test('the kept pages were found', () => {
    for (const page of KEPT) assert.ok(pages.includes(page), `${page} exists`);
  });

  for (const page of pages) {
    test(`${page}: every src, srcset, poster, <source> and asset href exists`, () => {
      const refs = fileRefs(read(page));
      assert.ok(refs.length > 0, 'the page references local files');
      const missing = refs.filter((r) => !isFile(r.path)).map((r) => r.url);
      assert.deepEqual([...new Set(missing)], [], `missing files on ${page}`);
    });
  }

  test('every url() in the stylesheet resolves', () => {
    const css = read('assets/site.css');
    const urls = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]).filter((u) => !u.startsWith('data:') && !u.startsWith('#'));
    for (const u of urls) assert.ok(isFile(join('assets', u.split(/[?#]/)[0])), `assets/site.css url(${u})`);
  });
});

describe('favicon set', () => {
  for (const page of pages) {
    test(`${page}: links the root-absolute favicon set`, () => {
      const links = [...read(page).matchAll(/<link\b[^>]*>/gi)].map(([tag]) => ({ rel: attr(tag, 'rel'), href: attr(tag, 'href') }));
      for (const want of FAVICON_LINKS) {
        assert.ok(links.some((l) => l.rel === want.rel && l.href === want.href), `<link rel="${want.rel}" href="${want.href}">`);
      }
      assert.ok(!links.some((l) => /icon/.test(l.rel || '') && !l.href.startsWith('/')), 'icon links are root-absolute');
      assert.ok(!links.some((l) => /icon/.test(l.rel || '') && /\.svg$/i.test(l.href)), 'no SVG icon (a browser would prefer it over the OWO mark)');
      assert.doesNotMatch(read(page), /favicon\.svg|type="image\/svg\+xml"/, 'favicon.svg is not linked');
    });
  }

  test('assets/favicon.svg is not shipped', () => {
    assert.ok(!isFile('assets/favicon.svg'), 'assets/favicon.svg is back');
    for (const file of ['site.webmanifest', 'netlify.toml', 'assets/site.css', 'assets/site.js']) assert.doesNotMatch(read(file), /favicon\.svg/, file);
  });

  test('the linked favicon files exist', () => {
    for (const { href } of FAVICON_LINKS) assert.ok(isFile(localPath(href)), href);
  });

  test('netlify.toml has no redirect that would swallow the favicon files', () => {
    const froms = redirects().map((r) => r.from);
    for (const { href } of FAVICON_LINKS) {
      for (const from of froms) assert.ok(!matchesRule(from, href), `redirect from "${from}" catches ${href}`);
    }
  });

  test('the manifest parses and its icons exist at the sizes it declares', () => {
    const manifest = JSON.parse(read('site.webmanifest'));
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
    for (const icon of manifest.icons) {
      assert.match(icon.src, /^\/assets\/owo-icon-\d+\.png$/, `${icon.src} is an OWO-named icon`);
      const path = localPath(icon.src);
      assert.ok(isFile(path), icon.src);
      const { width, height } = decodePng(readFileSync(join(ROOT, path)));
      assert.equal(`${width}x${height}`, icon.sizes, `${icon.src} size`);
    }
  });

  test('favicon.ico is an icon file with 16, 32 and 48 px entries', () => {
    const ico = readFileSync(join(ROOT, 'favicon.ico'));
    assert.equal(ico.readUInt16LE(0), 0, 'reserved');
    assert.equal(ico.readUInt16LE(2), 1, 'type 1 (icon)');
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + i * 16] || 256);
    assert.deepEqual(sizes.sort((a, b) => a - b), [16, 32, 48], `entries: ${sizes.join(', ')}`);
  });

  const icons = [
    ['assets/favicon-16.png', 16], ['assets/favicon-32.png', 32], ['assets/favicon-48.png', 48],
    ['assets/favicon-180.png', 180], ['apple-touch-icon.png', 180], ['assets/icon-192.png', 192], ['assets/icon-512.png', 512],
    ['assets/owo-icon-16.png', 16], ['assets/owo-icon-32.png', 32], ['assets/owo-apple-touch-icon.png', 180],
    ['assets/owo-icon-192.png', 192], ['assets/owo-icon-512.png', 512]
  ];
  for (const [path, size] of icons) {
    test(`${path} is the ${size}px OWO mark on a cream tile, not a near-solid black square`, () => {
      const { width, height, pixels } = decodePng(readFileSync(join(ROOT, path)));
      assert.equal(`${width}x${height}`, `${size}x${size}`);
      const t = tones(pixels);
      assert.ok(t.distinct > 1, 'more than one pixel value');
      assert.ok(t.nearBlack < 0.5, `near-black share ${t.nearBlack.toFixed(2)} (the broken icon was 1.00)`);
      assert.ok(t.light >= 0.05, `light share ${t.light.toFixed(2)}: the mark is visible`);
      // The tile: the most common opaque colour is the cream of the logo (#F3F0EA).
      const opaque = pixels.filter((p) => p[3] >= 128);
      const counts = new Map();
      for (const p of opaque) { const k = p.slice(0, 3).join(','); counts.set(k, (counts.get(k) || 0) + 1); }
      const tile = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
      assert.ok(Math.abs(tile[0] - 0xF3) <= 12 && Math.abs(tile[1] - 0xF0) <= 12 && Math.abs(tile[2] - 0xEA) <= 12, `cream tile, got rgb(${tile})`);
      // The mark: the gold W and the dark half of the infinity loop.
      const gold = opaque.filter((p) => p[0] - p[2] > 50 && p[0] > 120).length / opaque.length;
      const dark = opaque.filter((p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2] < 90).length / opaque.length;
      assert.ok(gold > 0.015, `gold share ${gold.toFixed(3)}`);
      assert.ok(dark > 0.008, `dark share ${dark.toFixed(3)}`);
    });
  }
});

describe('removed images', () => {
  test('no page, stylesheet, script or config references a removed image', () => {
    const sources = [...pages, 'assets/site.css', 'assets/site.js', 'site.webmanifest', 'netlify.toml', 'sitemap.xml', 'README.md'];
    for (const file of sources) {
      const text = read(file);
      for (const removed of REMOVED) {
        const name = removed.split('/').pop();
        assert.ok(!text.includes(name), `${file} references ${name}`);
      }
      // The hero-town CSS class stays; only files named hero-town are banned.
      assert.doesNotMatch(text, /hero-town[\w-]*\.(png|jpe?g|webp|gif|avif|svg)/i, `${file} references a hero-town image`);
    }
  });

  test('the removed AI hero files are gone from the repo', () => {
    for (const removed of REMOVED) assert.ok(!isFile(removed), `${removed} is back`);
  });
});

describe('retired pages', () => {
  const rules = redirects();
  /* The rule Netlify applies to a plain path (no query string): rules with a query condition never match it. */
  const ruleFor = (path) => rules.find((r) => !r.query && matchesRule(r.from, path));

  test('the retired pages and their form script and tests are deleted', () => {
    for (const file of DELETED) assert.ok(!isFile(file), `${file} is back`);
  });

  for (const [name, target] of Object.entries(RETIRED)) {
    test(`/${name} and /${name}.html have a forced 301 to ${target}`, () => {
      for (const path of [`/${name}`, `/${name}.html`]) {
        const rule = ruleFor(path);
        assert.ok(rule, `a redirect rule catches ${path}`);
        assert.equal(rule.from, path, `${path} has its own rule`);
        assert.equal(rule.to, target, `${path} target`);
        assert.equal(rule.status, 301, `${path} status`);
        assert.ok(rule.force, `${path} force = true`);
      }
    });
  }

  for (const [name, target] of Object.entries(RENAMED)) {
    test(`renamed: /${name} and /${name}.html have a forced 301 straight to ${target}`, () => {
      for (const path of [`/${name}`, `/${name}.html`]) {
        const rule = ruleFor(path);
        assert.ok(rule, `a redirect rule catches ${path}`);
        assert.deepEqual([rule.from, rule.to, rule.status, rule.force], [path, target, 301, true], path);
        assert.equal(ruleFor(pathOf(rule.to)), undefined, `${path} -> ${rule.to} is not a chain`);
      }
      assert.ok(isFile(`${target.slice(1)}.html`), `${target.slice(1)}.html exists`);
      assert.ok(!isFile(`${name}.html`), `${name}.html is gone`);
      assert.equal(ruleFor(target), undefined, `nothing redirects ${target}`);
      // No rule anywhere still targets the old path.
      for (const r of rules) assert.notEqual(pathOf(r.to), `/${name}`, `${r.from} still targets /${name}`);
    });
  }

  test('no page, script, sitemap or manifest links an old service path', () => {
    for (const file of [...pages, 'assets/site.js', 'sitemap.xml', 'site.webmanifest']) {
      for (const [tag] of read(file).matchAll(/<a\b[^>]*>|<link\b[^>]*>|<loc>[^<]*<\/loc>|'\/[\w-]+(?:#[\w-]+)?'/gi)) {
        const href = attr(tag, 'href') ?? tag.replace(/<\/?loc>|'/g, '');
        const path = localPath(href);
        if (path === null) continue;
        assert.ok(!Object.hasOwn(RENAMED, path.replace(/\.html$/, '')), `${file} links ${href}, an old service path`);
      }
    }
  });

  test('redirects go straight to their final target: no chains, no loops, no missing targets', () => {
    for (const r of rules.filter((x) => x.status === 301)) {
      const to = pathOf(r.to);
      const hop = ruleFor(to);
      assert.ok(!hop, `${r.from} -> ${r.to} chains into ${hop && hop.from} -> ${hop && hop.to}`);
      const file = to === '/' ? 'index.html' : `${to.replace(/^\//, '')}.html`;
      assert.ok(isFile(file), `${r.from} -> ${r.to}: ${file} exists`);
      const frag = r.to.split('#')[1];
      if (frag) assert.match(read(file), new RegExp(`\\sid="${frag}"`), `${r.from} -> ${r.to}: #${frag} exists on ${file}`);
    }
  });

  test('every page\'s .html URL has a forced 301 to its clean URL', () => {
    for (const clean of CLEAN) {
      const file = clean === '/' ? 'index.html' : `${clean.slice(1)}.html`;
      assert.ok(isFile(file), file);
      const rule = ruleFor(`/${file}`);
      assert.ok(rule && rule.from === `/${file}` && rule.to === clean && rule.status === 301 && rule.force, `/${file} -> ${clean}`);
    }
  });

  test('old /?about= links go to /contact with the same about value (Netlify query matching)', () => {
    const q = rules.filter((r) => r.query);
    assert.equal(q.length, 1, 'one rule with a query condition');
    assert.deepEqual(q[0], { from: '/', to: '/contact?about=:about', status: 301, force: true, query: { about: ':about' } });
    assert.ok(rules.indexOf(q[0]) < rules.findIndex((r) => r.from === '/how-it-works'), 'listed before the retired pages');
  });

  test('no redirect catches a kept page, the assets or the site files', () => {
    const keep = [...CLEAN, '/404.html',
      '/assets/site.css', '/assets/site.js', '/assets/call.js', '/assets/icon-192.png', '/assets/icon-512.png', '/assets/img/our-wellness-network-logo.png',
      '/favicon.ico', '/apple-touch-icon.png', '/site.webmanifest', '/robots.txt', '/sitemap.xml'];
    for (const path of keep) {
      const rule = ruleFor(path);
      assert.ok(!rule, `redirect from "${rule && rule.from}" catches ${path}`);
    }
  });

  test('the expo sign-up links keep working', () => {
    for (const path of ['/vendors', '/expo-vendors.html']) {
      const rule = ruleFor(path);
      assert.ok(rule && rule.to === '/expo-vendors' && rule.status === 301, `${path} -> /expo-vendors`);
    }
    assert.match(read('expo-vendors.html'), /<form name="expo-vendor"[^>]*data-netlify="true"/, 'the expo-vendor Netlify form');
  });

  for (const page of pages) {
    test(`${page}: links no retired page`, () => {
      const hrefs = [...read(page).matchAll(/<a\b[^>]*>/gi)].map(([tag]) => attr(tag, 'href')).filter((h) => h != null);
      for (const href of hrefs) {
        const path = localPath(href);
        if (path === null) continue; // anchors on this page, mail, tel and other sites
        const name = path.replace(/\.html$/, '').replace(/\/$/, '');
        assert.ok(!Object.hasOwn(RETIRED, name), `${page} links ${href}, a retired page`);
      }
    });
  }

  test('no page, script or stylesheet references a deleted file', () => {
    const sources = [...pages, 'assets/site.css', 'assets/site.js', 'site.webmanifest', 'sitemap.xml'];
    if (isFile('assets/call.js')) sources.push('assets/call.js');
    for (const file of sources) {
      const text = read(file);
      for (const deleted of DELETED.filter((d) => d.startsWith('assets/'))) assert.ok(!text.includes(deleted.split('/').pop()), `${file} references ${deleted}`);
    }
  });

  test('sitemap.xml lists every indexable page, last modified October 22, 2026', () => {
    const xml = read('sitemap.xml');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.deepEqual(locs, INDEXABLE.map((p) => `https://ouroptimization.com${p}`));
    assert.equal((xml.match(/<lastmod>2026-10-22<\/lastmod>/g) || []).length, locs.length);
    for (const loc of locs) {
      const path = localPath(loc);
      const file = path === '' ? 'index.html' : `${path}.html`;
      assert.ok(isFile(file), `${loc}: ${file} exists`);
      assert.doesNotMatch(read(file), /<meta name="robots" content="noindex"/, `${loc} is indexable`);
    }
  });
});

describe('image folder', () => {
  // og.jpg, og-community.jpg, og-dinners.jpg and og-neighbors.jpg are kept only as byte-for-byte copies of the home page's
  // current share image (og-network-neighbors.jpg), and og-best-patients.jpg as a copy of /patient-network's
  // (og-network-best-patients.jpg), so links shared earlier (which still point at those names) show the new art.
  // The new logo got new file names because platforms cache a preview image by its URL.
  const LEGACY_SHARE = { 'og.jpg': 'og-network-neighbors.jpg', 'og-community.jpg': 'og-network-neighbors.jpg', 'og-dinners.jpg': 'og-network-neighbors.jpg', 'og-neighbors.jpg': 'og-network-neighbors.jpg', 'og-best-patients.jpg': 'og-network-best-patients.jpg' };

  test('assets/img holds only images a page, the stylesheet, a script or a site file uses', () => {
    const text = [...KEPT, 'assets/site.css', 'assets/site.js', 'assets/call.js', 'site.webmanifest', 'netlify.toml', 'sitemap.xml']
      .map((f) => read(f)).join('\n');
    const unused = readdirSync(join(ROOT, 'assets/img')).filter((f) => !(f in LEGACY_SHARE) && !text.includes(f));
    assert.deepEqual(unused, [], 'unreferenced images in assets/img');
  });

  test('the legacy share image names are copies of the current share images', () => {
    for (const [name, current] of Object.entries(LEGACY_SHARE)) assert.ok(readFileSync(join(ROOT, 'assets/img', name)).equals(readFileSync(join(ROOT, 'assets/img', current))), `${name} matches ${current}`);
  });

  test('the share images: og-network-neighbors.jpg on the home page, og-network-best-patients.jpg on /patient-network, both 1200 x 630 with no EXIF', () => {
    const og = (page) => /<meta property="og:image" content="https:\/\/ouroptimization\.com\/assets\/img\/([^"]+)">/.exec(read(page))[1];
    assert.equal(og('index.html'), 'og-network-neighbors.jpg');
    assert.equal(og('patient-network.html'), 'og-network-best-patients.jpg');
    for (const name of ['og-network-neighbors.jpg', 'og-network-best-patients.jpg']) {
      const i = jpegInfo(readFileSync(join(ROOT, 'assets/img', name)));
      assert.deepEqual([i.width, i.height, i.exif], [1200, 630, false], name);
    }
    assert.match(read('index.html'), /<meta property="og:image:alt" content="[^"]*Your neighbors bring you new patients\.[^"]*">/);
    // Re-rendered on October 22, 2026 with the Our Wellness Network logo (same layout, new file names).
    const SHARE_SHA = { 'og-network-neighbors.jpg': OG_NEIGHBORS_SHA, 'og-network-best-patients.jpg': OG_BEST_SHA };
    for (const [name, want] of Object.entries(SHARE_SHA)) assert.equal(createHash('sha256').update(readFileSync(join(ROOT, 'assets/img', name))).digest('hex'), want, `${name} is the share image with the new logo`);
  });

  test('the logo is the Our Wellness Network logo (the old one is deleted)', () => {
    // The same mark and colors as before; only the last word changed, from the old name to "Network".
    const file = 'assets/img/our-wellness-network-logo.png';
    const buf = readFileSync(join(ROOT, file));
    assert.equal(createHash('sha256').update(buf).digest('hex'), LOGO_SHA, `${file} is the new logo`);
    const { width, height, pixels } = decodePng(buf);
    assert.deepEqual([width, height], [480, 174], 'the size every page states');
    const opaque = pixels.filter((p) => p[3] >= 128);
    assert.ok(opaque.filter((p) => p[0] - p[2] > 50 && p[0] > 120).length / opaque.length > 0.2, 'the gold of the W and "Wellness"');
    assert.ok(opaque.filter((p) => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2] < 60).length / opaque.length > 0.2, 'the dark loop and words');
    assert.ok(!isFile('assets/img/owo-logo.png'), 'the old logo file is gone');
    for (const page of pages) {
      const logos = [...read(page).matchAll(/<img\b[^>]*>/g)].map(([t]) => attr(t, 'src')).filter((s) => /logo/.test(s));
      assert.ok(logos.length >= 1, `${page} shows the logo`);
      for (const src of logos) assert.equal(src.replace(/^\//, ''), file, `${page}: ${src}`);
    }
  });
});

describe('expo sign-up form', () => {
  // The Baby & Kids Health Expo form is printed on QR codes: its URL, form name and fields must not change.
  // These hashes are of the <form name="expo-vendor">...</form> block and its inline script as they were
  // before the October 2026 rebuild. If a change is deliberate (and Mustafa has OK'd it), update them.
  const FORM_SHA = '9b90cacb95089ed848f8039dc3a257ab6c739ecf227c67b1adf1f70cb98999d8';
  const SCRIPT_SHA = '72376c39e213173eba5f3f81d9341cba087f2ce470a86ec283861fe5b2039c87';
  const src = read('expo-vendors.html');
  const start = src.indexOf('<form name="expo-vendor"');
  const form = src.slice(start, src.indexOf('</form>', start) + '</form>'.length);
  const sha = (s) => createHash('sha256').update(s).digest('hex');

  test('the form keeps its name, Netlify detection, form-name value, honeypot and fields', () => {
    assert.ok(start > 0, 'form[name="expo-vendor"] exists');
    assert.match(form, /^<form name="expo-vendor" id="xp-form" method="POST" [^>]*data-netlify="true" netlify-honeypot="bot-field"/);
    assert.match(form, /<input type="hidden" name="form-name" value="expo-vendor">/);
    const names = [...form.matchAll(/<(?:input|select|textarea)\b[^>]*\sname="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(names)], ['form-name', 'event', 'bot-field', 'practice', 'specialty', 'contact', 'role', 'email', 'phone', 'website', 'extras[]', 'notes']);
  });

  test('the form block and its script are byte-for-byte unchanged', () => {
    assert.equal(sha(form), FORM_SHA, 'the <form name="expo-vendor"> block changed');
    const scripts = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((s) => /xp-form/.test(s));
    assert.equal(scripts.length, 1, 'one inline script drives the form');
    assert.equal(sha(scripts.join('\n')), SCRIPT_SHA, 'the expo form script changed');
  });
});

describe('every kept page', () => {
  /* The page minus comments, scripts and styles: visible text plus the attributes people or tools read. */
  const markup = (page) => read(page).replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ');

  for (const page of KEPT) {
    test(`${page}: no em or en dashes in copy, alt text or meta tags`, () => {
      const m = /.{0,40}(?:[–—]|&mdash;|&ndash;|&#821[12];|&#x201[34];).{0,40}/i.exec(markup(page));
      assert.equal(m, null, `dash in ${page}: ${m && m[0]}`);
    });

    test(`${page}: no duplicate ids`, () => {
      const ids = [...markup(page).matchAll(/<[a-z][^>]*\sid="([^"]+)"/gi)].map((m) => m[1]);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      assert.deepEqual([...new Set(dup)], [], `duplicate ids on ${page}`);
    });

    test(`${page}: the sample brand is disclosed only where it is shown`, () => {
      const src = read(page);
      const shows = /Integrative Wellness/.test(src.replace(/<footer[\s\S]*<\/footer>/, ''));
      if (shows) {
        assert.match(src, /class="sample-cap">Sample design\. Integrative Wellness is a sample brand we use to show our work, not a client\./, 'a caption under the sample');
        for (const [tag] of src.matchAll(/<img\b[^>]*alt="[^"]*Integrative Wellness[^"]*"/g)) assert.match(tag, /a made-up brand/, 'the alt text says it is made up');
      } else {
        assert.doesNotMatch(src, /sample brand/i, `${page} shows no sample brand, so it needs no disclosure`);
      }
    });
  }
});

describe('legal pages', () => {
  const visible = (page) => read(page).replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&rsquo;/g, "'").replace(/\s+/g, ' ');

  test('terms describe the dinners and today\'s forms, not the retired services', () => {
    const t = visible('terms.html');
    assert.doesNotMatch(t, /demographic|Digital Growth Package|Groupon|Meta\b|Strategy Meeting|direct.mail|across the United States/i);
    assert.match(t, /Each dinner is quoted for your clinic, with the restaurant and food included\./);
    assert.match(t, /Chicago's western suburbs/);
    assert.match(t, /Book a 15-minute call/);
    assert.match(t, /Last updated: October 22, 2026/);
    assert.match(t, /form on the contact page asks for your name, your clinic's name, phone number, email address \(optional\), the town your clinic is in, the best time to call, what you would like to talk about, and a message \(optional\)\./);
  });

  test('privacy describes the call form on /contact, the expo form, and what we see of guests\' RSVP replies', () => {
    const t = visible('privacy.html');
    assert.match(t, /Last updated: October 22, 2026/);
    assert.doesNotMatch(t, /patient list|never receive the clinic's patient records|Ask for Mustafa|Phone: 331/i);
    assert.match(t, /You can reach us about privacy by email at mustafa@ouroptimization\.com\./);
    assert.match(t, /We do not ask for payment details or health information anywhere on this site\./);
    assert.match(t, /Guests who reply to an invitation/);
    assert.match(t, /we see the replies guests send there/);
    assert.match(t, /any optional extras you tick/);
    assert.match(t, /form on our contact page is where a clinic asks us to call/);
    assert.match(t, /What you would like to talk about: the referral or flyer network, the Plus-One Dinner, the VIP Night, the online search network, review tags or a website, or not sure yet/);
  });

  test('privacy describes the partner offer form: the fields, no health questions, the consent, and a copy to us', () => {
    const t = visible('privacy.html');
    const sec = /<h2>People who claim an offer at a partner<\/h2>([\s\S]*?)<\/section>/.exec(read('privacy.html'));
    assert.ok(sec, 'the partner offer form has its own section');
    const items = [...sec[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1].trim());
    assert.deepEqual(items, ['Your first name', 'Phone number', 'Email address (optional)', 'The kind of service you are interested in, picked from a short list', 'The best time to reach you']);
    assert.match(t, /It asks no health questions/);
    assert.match(t, /You tick a box to agree that the clinic can call or text you about the offer, and the form tells you that a copy comes to us\./);
    assert.match(t, /The partner business does not receive it\./);
    assert.match(t, /The booking and first-visit revenue numbers in that report come from the clinic as totals for each partner\./);
    assert.match(t, /What you send goes to that clinic's front desk by email or text, with a copy to us\./);
    assert.match(t, /When you claim an offer at a partner, the clinic making the offer receives what you send/);
  });

  test('privacy and terms agree on the forms: two on this site, and the offer form separate, sent by email and text', () => {
    const p = visible('privacy.html');
    const t = visible('terms.html');
    assert.match(p, /Apart from the expo table form described below, it is the only form on this site where we ask you to give us information about you or your clinic\. The partner offer form, also described below, is separate: it opens from the tag or code at a partner\./);
    assert.match(p, /Submissions from the call request form and the expo table form are handled by Netlify Forms and emailed to us\./);
    assert.match(p, /Partner offer form submissions are also sent over HTTPS, and are delivered to the clinic's front desk, and to us, through email and text services\./);
    assert.match(p, /The email and text services that deliver it carry it to the clinic's front desk and to us\./);
    assert.doesNotMatch(p, /both forms/);
    assert.match(t, /This site has two forms of its own\./);
    assert.match(t, /It is separate from this site's two forms and is described in our Privacy Policy ?\. Leads from it reach your front desk, and us, through email and text services, so delivery depends on those services\./);
  });
});

describe('the referral network and the flyer network in the terms', () => {
  const t = read('terms.html').replace(/<[^>]+>/g, ' ').replace(/&rsquo;/g, "'").replace(/\s+/g, ' ');
  test('the service list, the clinic\'s duties and the tracking caveat cover the partner kit and the offer form', () => {
    assert.match(t, /The referral network: .*one-page agreement between your clinic and each partner that says no payment is made for a referral; a partner kit for each partner \(referral cards with its own code, and flyers and a counter stand carrying an NFC tag and a QR code linked to that partner\)/);
    assert.match(t, /The flyer network: a representative visits, in person, the businesses you choose for each location on set field days each month, delivers and restocks your printed materials, and sends you a visit log within five business days of each field day/);
    assert.match(t, /The referral and flyer networks have a flat monthly fee, set in advance\. It does not change with referrals, leads, bookings or revenue\./);
    assert.match(t, /The patient network, for each patient dinner \(the Plus-One Dinner or the VIP Night\): the restaurant and the food/);
    assert.match(t, /The online search network: Google Ads, run in your clinic's own Google Ads account/);
    assert.match(t, /Your first-visit offer and any staff perk you give partner staff, and making sure both follow the rules that apply to your clinic, including rules on fee-splitting/);
    assert.match(t, /Calling and texting the people who claim your offer: only about the offer they asked about, within the consent they gave, and stopping as soon as anyone asks you to/);
    assert.match(t, /Sending us the bookings and first-visit revenue for the monthly partner report as totals for each partner/);
    assert.match(t, /The bookings and first-visit revenue in the monthly partner report come from your clinic as totals for each partner\./);
    assert.doesNotMatch(t, /never names or patient records|Please never send us names or patient records|Contact Mustafa/);
    assert.match(t, /Contact us at mustafa@ouroptimization\.com, or through https:\/\/ouroptimization\.com\./);
    assert.match(t, /how many local businesses agree to be partners/);
    assert.match(t, /the monthly partner report, and the codes and links on offer cards, referral cards and partner stands cannot capture every response/);
    assert.match(t, /postal, email or text delivery delays or failures/);
  });
});

/* Width and height of a baseline or progressive JPEG, and whether it carries EXIF (APP1) data. */
function jpegInfo(buf) {
  assert.equal(buf.readUInt16BE(0), 0xffd8, 'JPEG signature');
  let off = 2, exif = false;
  while (off < buf.length) {
    const marker = buf.readUInt16BE(off);
    const len = buf.readUInt16BE(off + 2);
    if (marker === 0xffe1) exif = true;
    if ((marker >= 0xffc0 && marker <= 0xffc3) || (marker >= 0xffc5 && marker <= 0xffcb)) {
      return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7), exif };
    }
    off += 2 + len;
  }
  throw new Error('no SOF marker');
}
/* Width and height of a WebP, and whether it carries EXIF or XMP chunks. */
function webpInfo(buf) {
  assert.equal(buf.toString('latin1', 0, 4) + buf.toString('latin1', 8, 12), 'RIFFWEBP', 'WebP signature');
  let off = 12, size = null, meta = false;
  while (off + 8 <= buf.length) {
    const id = buf.toString('latin1', off, off + 4), len = buf.readUInt32LE(off + 4), d = off + 8;
    if (id === 'EXIF' || id === 'XMP ') meta = true;
    if (id === 'VP8X') size = { width: 1 + buf.readUIntLE(d + 4, 3), height: 1 + buf.readUIntLE(d + 7, 3) };
    if (id === 'VP8 ' && !size) size = { width: buf.readUInt16LE(d + 6) & 0x3fff, height: buf.readUInt16LE(d + 8) & 0x3fff };
    if (id === 'VP8L' && !size) { const b = buf.readUInt32LE(d + 1); size = { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }; }
    off = d + len + (len % 2);
  }
  return { ...size, meta };
}

describe('review tags: the sample stand mockup and the NFC explainer', () => {
  const html = read('review-tags.html');
  const how = /<section[^>]*id="how"[^>]*>([\s\S]*?)<\/section>/.exec(html)[1];
  const fig = /<figure class="rt-shot">([\s\S]*?)<\/figure>/.exec(how);

  test('the stand photo section is gone, and no file in the repository names the spa it showed', () => {
    assert.doesNotMatch(html, /id="in-use"|rt-real|On a real front desk/);
    for (const f of REMOVED.filter((r) => r.includes('review-stand'))) assert.ok(!isFile(f), `${f} is back`);
    const all = [...pages, 'README.md', 'assets/site.css', 'assets/site.js', 'assets/call.js', 'netlify.toml', 'sitemap.xml', 'site.webmanifest',
      ...readdirSync(join(ROOT, 'tests')).map((f) => `tests/${f}`)];
    // The name is put together here, so this file does not contain it either.
    const spa = new RegExp(['pure', 'medical', 'spa'].join('\\s+'), 'i');
    for (const file of all) assert.doesNotMatch(read(file), spa, file);
  });

  test('the mockup sits in how it works: lazy, honest alt text, the sizes the markup states', () => {
    assert.ok(fig, 'the mockup figure is in #how');
    const img = /<img [^>]*>/.exec(fig[1])[0];
    assert.match(fig[1], /<source type="image\/webp" srcset="assets\/img\/review-stand-ai-600\.webp 600w, assets\/img\/review-stand-ai\.webp 1200w"/);
    assert.equal(attr(img, 'src'), 'assets/img/review-stand-ai-600.jpg');
    assert.equal(attr(img, 'srcset'), 'assets/img/review-stand-ai-600.jpg 600w, assets/img/review-stand-ai.jpg 1200w');
    assert.equal(attr(img, 'loading'), 'lazy', 'below the fold');
    const alt = attr(img, 'alt');
    assert.match(alt, /^Mockup, not a real photo: /);
    assert.match(alt, /Integrative Wellness, a made-up brand/);
    assert.match(alt, /How did we do\? Review us on Google/);
    assert.doesNotMatch(fig[1], /<figcaption/, 'the page caption and footer line about the sample brand cover it');
    const w = Number(attr(img, 'width')), h = Number(attr(img, 'height'));
    assert.equal(w, 1200, 'the width attribute is the large file\'s real width');
    for (const [file, width] of [['review-stand-ai.jpg', 1200], ['review-stand-ai-600.jpg', 600]]) {
      const i = jpegInfo(readFileSync(join(ROOT, 'assets/img', file)));
      assert.equal(i.width, width, file);
      assert.equal(Math.abs(i.height - Math.round(h * width / w)) <= 1, true, `${file} keeps the ratio the markup states`);
      assert.equal(i.exif, false, `${file} has no EXIF`);
    }
    for (const [file, width] of [['review-stand-ai.webp', 1200], ['review-stand-ai-600.webp', 600]]) {
      const i = webpInfo(readFileSync(join(ROOT, 'assets/img', file)));
      assert.equal(i.width, width, file);
      assert.equal(i.meta, false, `${file} has no EXIF or XMP`);
    }
  });

  test('"What is an NFC tag?" (#nfc): plain, the QR code optional, and the neutral ask', () => {
    const nfc = /<div class="rt-nfc" id="nfc">([\s\S]*?)<\/div>/.exec(how);
    assert.ok(nfc, '#nfc is the explainer beside the mockup');
    assert.match(nfc[1], /<h3 class="rt-nfc-h">What is an NFC tag\?<\/h3>/);
    const t = nfc[1].replace(/<[^>]+>/g, '').replace(/&rsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"');
    assert.match(t, /Hold the top of a phone near it and the page it carries opens, with no app to download\./);
    assert.match(t, /For phones that don't read NFC, a QR code printed on the same piece, if it has one, opens the same page\./);
    assert.match(t, /We use a neutral ask, such as "How did we do\?", so every customer gets the same ask\./);
    assert.doesNotMatch(html, /A QR code on every piece|tap only/);
  });

  test('every link to the old #in-use section now points at #nfc', () => {
    for (const page of pages) assert.doesNotMatch(read(page), /\/review-tags#in-use/, page);
    for (const page of ['faq.html', 'referral-network.html']) assert.match(read(page), /href="\/review-tags#nfc"/, page);
    assert.match(read('assets/site.js'), /'#in-use'/, 'site.js sends old #in-use links to #nfc');
  });
});
