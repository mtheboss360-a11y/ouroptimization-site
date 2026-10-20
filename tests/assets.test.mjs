// Guard tests for the site's static assets: every local file a page points at exists,
// every page carries the favicon set, removed images stay removed, and the favicons
// are real artwork (the old ones had decayed into near-solid black squares).
// Zero dependencies: node:test + node:assert + node:zlib. Run from the repo root: node --test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const isFile = (p) => existsSync(join(ROOT, p)) && statSync(join(ROOT, p)).isFile();
const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();

// The favicon block every page head carries. Root-absolute, so the 404 page works at any depth.
const FAVICON_LINKS = [
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'icon', href: '/assets/favicon.svg' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest' }
];

// AI-generated images that were removed. Nothing may link to them again.
const REMOVED = ['assets/img/hero-town.png', 'assets/img/hero-town.webp', 'assets/img/hero-town-700.webp'];

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

/* Every local file URL a page references: src, srcset, data-zoom, poster, file hrefs. */
function fileRefs(html) {
  const refs = [];
  for (const [tag] of html.matchAll(/<[a-z][^>]*>/gi)) {
    for (const name of ['src', 'data-zoom', 'poster']) {
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
  test('pages were found', () => {
    assert.ok(pages.length >= 20, `found ${pages.length} pages`);
    assert.ok(pages.includes('404.html') && pages.includes('index.html'));
  });

  for (const page of pages) {
    test(`${page}: every src, srcset, data-zoom, poster, <source> and asset href exists`, () => {
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
    });
  }

  test('the linked favicon files exist', () => {
    for (const { href } of FAVICON_LINKS) assert.ok(isFile(localPath(href)), href);
  });

  test('netlify.toml has no redirect that would swallow the favicon files', () => {
    const froms = [...read('netlify.toml').matchAll(/^\s*from\s*=\s*"([^"]+)"/gm)].map((m) => m[1]);
    const matches = (pattern, path) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`).test(path);
    for (const { href } of FAVICON_LINKS) {
      for (const from of froms) assert.ok(!matches(from, href), `redirect from "${from}" catches ${href}`);
    }
  });

  test('the manifest parses and its icons exist at the sizes it declares', () => {
    const manifest = JSON.parse(read('site.webmanifest'));
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
    for (const icon of manifest.icons) {
      const path = localPath(icon.src);
      assert.ok(isFile(path), icon.src);
      const { width, height } = decodePng(readFileSync(join(ROOT, path)));
      assert.equal(`${width}x${height}`, icon.sizes, `${icon.src} size`);
    }
  });

  test('favicon.ico is an icon file with a 32x32 entry', () => {
    const ico = readFileSync(join(ROOT, 'favicon.ico'));
    assert.equal(ico.readUInt16LE(0), 0, 'reserved');
    assert.equal(ico.readUInt16LE(2), 1, 'type 1 (icon)');
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + i * 16] || 256);
    assert.ok(sizes.includes(32), `entries: ${sizes.join(', ')}`);
  });

  test('favicon.svg is the drawn mark: the ink tile and a light color, no raster', () => {
    const svg = read('assets/favicon.svg');
    assert.match(svg, /<svg\b[^>]*viewBox=/);
    assert.match(svg, /#1C3A2C/i, 'ink tile');
    assert.match(svg, /#(F9FBF8|EFBCCB|FFFFFF)/i, 'a light color for the mark');
    assert.doesNotMatch(svg, /<image\b|base64/i, 'no embedded raster');
  });

  const icons = [
    ['assets/favicon-16.png', 16], ['assets/favicon-32.png', 32], ['assets/favicon-48.png', 48],
    ['assets/favicon-180.png', 180], ['apple-touch-icon.png', 180], ['assets/icon-192.png', 192], ['assets/icon-512.png', 512]
  ];
  for (const [path, size] of icons) {
    test(`${path} is a ${size}px mark, not a near-solid black square`, () => {
      const { width, height, pixels } = decodePng(readFileSync(join(ROOT, path)));
      assert.equal(`${width}x${height}`, `${size}x${size}`);
      const t = tones(pixels);
      assert.ok(t.distinct > 1, 'more than one pixel value');
      assert.ok(t.nearBlack < 0.5, `near-black share ${t.nearBlack.toFixed(2)} (the broken icon was 1.00)`);
      assert.ok(t.light >= 0.05, `light share ${t.light.toFixed(2)}: the mark is visible`);
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
