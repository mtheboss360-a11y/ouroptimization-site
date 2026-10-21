// Guard tests for the site's static assets: every local file a page points at exists,
// every page carries the favicon set, removed images and deleted files stay removed, the
// favicons are real artwork (the old ones had decayed into near-solid black squares), and the
// retired service pages (October 2026) stay retired: each has a forced 301 in netlify.toml,
// no kept page links to one, and the sitemap lists only the kept, indexable pages.
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

// The favicon block every page head carries. Root-absolute, so the 404 page works at any depth.
const FAVICON_LINKS = [
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'icon', href: '/assets/favicon.svg' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest' }
];

// AI-generated images that were removed. Nothing may link to them again.
const REMOVED = ['assets/img/hero-town.png', 'assets/img/hero-town.webp', 'assets/img/hero-town-700.webp'];

// The pages the site keeps after the October 2026 patient dinner rebuild.
const KEPT = ['404.html', 'expo-vendors.html', 'index.html', 'privacy.html', 'review-tags.html', 'terms.html', 'thanks.html', 'website-design.html'];

// Retired service pages and the home page section each one now 301s to (with and without .html).
const RETIRED = {
  'how-it-works': '/#how', services: '/', 'community-marketing': '/#referrals', 'custom-marketing': '/#add-ons',
  'digital-marketing': '/#add-ons', industries: '/', examples: '/', estimate: '/#call', 'market-research': '/#referrals',
  'direct-mail': '/#add-ons', events: '/#formats', flyers: '/#add-ons', 'marketing-kits': '/#handle', seo: '/#add-ons',
  'google-ads': '/#add-ons', 'social-media': '/#add-ons', groupon: '/#add-ons', 'gift-cards': '/#add-ons', tracking: '/#handle',
  'sample-advertisements': '/', faq: '/#faq'
};

// Files deleted with the retired pages (the old strategy meeting form, its script and its tests).
const DELETED = ['assets/estimate.js', 'tests/estimate.test.mjs', 'tests/e2e-estimate.mjs', ...Object.keys(RETIRED).map((n) => `${n}.html`)];

/* The [[redirects]] rules in netlify.toml, as { from, to, status, force }. */
function redirects() {
  return read('netlify.toml').split(/^\[\[redirects\]\]\s*$/m).slice(1).map((block) => {
    const body = block.split(/^\[/m)[0];
    const get = (key) => { const m = new RegExp(`^\\s*${key}\\s*=\\s*(?:"([^"]*)"|(\\S+))`, 'm').exec(body); return m ? (m[1] ?? m[2]) : null; };
    return { from: get('from'), to: get('to'), status: Number(get('status') ?? 301), force: get('force') === 'true' };
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
    });
  }

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

describe('retired pages', () => {
  const rules = redirects();
  const ruleFor = (path) => rules.find((r) => matchesRule(r.from, path));

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

  test('redirects go straight to their final target: no chains, no loops, no missing targets', () => {
    for (const r of rules.filter((x) => x.status === 301)) {
      const to = pathOf(r.to);
      const hop = ruleFor(to);
      assert.ok(!hop, `${r.from} -> ${r.to} chains into ${hop && hop.from} -> ${hop && hop.to}`);
      const file = to === '/' ? 'index.html' : `${to.replace(/^\//, '')}.html`;
      assert.ok(isFile(file), `${r.from} -> ${r.to}: ${file} exists`);
    }
  });

  test('no redirect catches a kept page, the assets or the site files', () => {
    const keep = ['/', '/expo-vendors', '/privacy', '/terms', '/review-tags', '/website-design', '/thanks', '/404.html',
      '/assets/site.css', '/assets/site.js', '/assets/call.js', '/assets/favicon.svg', '/assets/img/owo-logo.png',
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

  test('sitemap.xml lists only the kept, indexable pages', () => {
    const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.deepEqual(locs.sort(), ['/', '/privacy', '/review-tags', '/terms', '/website-design'].map((p) => `https://ouroptimization.com${p}`).sort());
    for (const loc of locs) {
      const path = localPath(loc);
      const file = path === '' ? 'index.html' : `${path}.html`;
      assert.ok(isFile(file), `${loc}: ${file} exists`);
      assert.doesNotMatch(read(file), /<meta name="robots" content="noindex"/, `${loc} is indexable`);
    }
  });
});

describe('image folder', () => {
  // og.jpg and og-community.jpg are kept only as byte-for-byte copies of the current share image,
  // so links shared before October 2026 (which still point at those names) show the new art.
  const LEGACY_SHARE = ['og.jpg', 'og-community.jpg'];

  test('assets/img holds only images a page, the stylesheet, a script or a site file uses', () => {
    const text = [...KEPT, 'assets/site.css', 'assets/site.js', 'assets/call.js', 'site.webmanifest', 'netlify.toml', 'sitemap.xml']
      .map((f) => read(f)).join('\n');
    const unused = readdirSync(join(ROOT, 'assets/img')).filter((f) => !LEGACY_SHARE.includes(f) && !text.includes(f));
    assert.deepEqual(unused, [], 'unreferenced images in assets/img');
  });

  test('the legacy share image names are copies of og-dinners.jpg', () => {
    const current = readFileSync(join(ROOT, 'assets/img/og-dinners.jpg'));
    for (const name of LEGACY_SHARE) assert.ok(readFileSync(join(ROOT, 'assets/img', name)).equals(current), `${name} matches og-dinners.jpg`);
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
    assert.doesNotMatch(t, /\$\s?\d/, 'no price figures in the terms');
    assert.match(t, /Chicago's western suburbs/);
    assert.match(t, /Book a 15-minute call/);
    assert.match(t, /Last updated: October 21, 2026/);
  });

  test('privacy describes both forms and what we see of guests\' RSVP replies', () => {
    const t = visible('privacy.html');
    assert.match(t, /Last updated: October 21, 2026/);
    assert.match(t, /We never receive, see or keep your patient list\./);
    assert.match(t, /Guests who reply to an invitation/);
    assert.match(t, /we see the replies guests send there/);
    assert.match(t, /any optional extras you tick/);
  });
});
