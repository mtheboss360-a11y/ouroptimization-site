// End-to-end checks for the call form on /contact (#call, Netlify form "dinner-call",
// assets/call.js), the /thanks page it posts to, and the old home page links that now lead there.
//
//   node tests/e2e-call.mjs            (local preview server on http://localhost:8770)
//   E2E_BASE_URL=http://127.0.0.1:8770 node tests/e2e-call.mjs
//
// Runs against a LOCAL server only and refuses anything else. Every request that is not a
// GET or HEAD is intercepted with route.fulfill and answered here, so no submission ever
// reaches a server. Requests to any other origin are aborted and recorded in `outside`; the home page
// scenarios assert there are none.
// Not part of `node --test` (it needs a browser and a running server).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const BASE = (process.env.E2E_BASE_URL || 'http://localhost:8770').replace(/\/+$/, '');
if (/ouroptimization\.com/i.test(BASE)) {
  console.error(`Refusing to run against ${BASE}: this script only runs against a local server.`);
  process.exit(2);
}
const baseUrl = new URL(BASE);
if (!['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname)) {
  console.error(`Refusing to run against ${BASE}: use localhost or 127.0.0.1.`);
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs'));
}

/* The thank-you page is served as the POST response, as Netlify does after a form post. */
const THANKS_HTML = readFileSync(new URL('../thanks.html', import.meta.url), 'utf8');

const VALID = {
  '#call-name': 'Jordan Lee',
  '#call-clinic': 'Example Aesthetics',
  '#call-phone': '(630) 555-0142',
  '#call-email': 'jordan@example.com',
  '#call-town': 'Naperville',
  '#call-message': 'Thursday works best.'
};
const REQUIRED_IDS = ['call-name', 'call-clinic', 'call-phone', 'call-town', 'call-time'];

const browser = await chromium.launch();
const results = [];

async function open({ width = 1280, height = 900, path = '/contact', js = true, motion = 'reduce', stub = {} } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion: motion });
  const page = await context.newPage();
  const posts = [];
  const jsErrors = [];
  const missing = [];
  const outside = [];
  page.on('pageerror', (e) => jsErrors.push(String(e)));
  page.on('response', (r) => { if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`); });
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== baseUrl.origin) { outside.push(req.url()); return route.abort(); }
    if (req.method() === 'GET' && Object.hasOwn(stub, url.pathname)) {
      const s = stub[url.pathname];
      return route.fulfill({ status: 200, contentType: s.type, body: s.body });
    }
    if (req.method() !== 'GET' && req.method() !== 'HEAD') {
      posts.push({ url: req.url(), method: req.method(), headers: req.headers(), body: req.postData() || '' });
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: THANKS_HTML });
    }
    return route.continue();
  });
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  return { page, posts, jsErrors, missing, outside, close: () => context.close() };
}

async function fillValid(page, { dinner = 'Referral routes', time = 'Afternoon, 2 to 5 pm' } = {}) {
  for (const [sel, val] of Object.entries(VALID)) await page.fill(sel, val);
  await page.selectOption('#call-time', time);
  await page.check(`input[name="dinner"][value="${dinner}"]`);
}

const invalidIds = (page) => page.$$eval('#dinner-call [aria-invalid="true"]', (els) => els.map((e) => e.id || `${e.name}:${e.value}`));
const shownErrors = (page) => page.$$eval('#dinner-call .err.on', (els) => els.map((e) => e.id));
const focusedId = (page) => page.evaluate(() => document.activeElement && (document.activeElement.id || `${document.activeElement.name}:${document.activeElement.value}`));

async function scenario(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`ok - ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`not ok - ${name}\n  ${String(err && err.stack || err).split('\n').slice(0, 6).join('\n  ')}`);
  }
}

await scenario('/contact loads with the form, no script errors, and JS validation takes over', async () => {
  const { page, jsErrors, missing, close } = await open();
  assert.equal(await page.$$eval('form[name="dinner-call"]', (f) => f.length), 1);
  assert.equal(await page.$eval('#dinner-call', (f) => f.noValidate), true, 'call.js turns off the browser bubbles');
  assert.equal(await page.$eval('#dinner-call', (f) => f.getAttribute('action')), '/thanks');
  assert.equal(await page.$eval('input[name="form-name"]', (i) => i.value), 'dinner-call');
  assert.equal(await page.$eval('input[name="bot-field"]', (i) => getComputedStyle(i.closest('.hp')).display), 'none', 'honeypot is hidden');
  assert.deepEqual(jsErrors, []);
  assert.deepEqual(missing, [], 'every stylesheet, script, font and image loads');
  await close();
});

await scenario('an empty submit is blocked: errors shown, fields marked, focus on the first error', async () => {
  const { page, posts, close } = await open();
  await page.click('#dinner-call button[type="submit"]');
  await page.waitForTimeout(150);
  assert.equal(posts.length, 0, 'nothing was posted');
  assert.equal(await focusedId(page), 'call-name');
  const invalid = await invalidIds(page);
  for (const id of REQUIRED_IDS) assert.ok(invalid.includes(id), `${id} is aria-invalid`);
  assert.ok(invalid.includes('dinner:Referral or flyer network') || invalid.some((x) => x.startsWith('dinner:')), 'the dinner radios are aria-invalid');
  assert.ok(!invalid.includes('call-email') && !invalid.includes('call-message'), 'optional fields are not flagged');
  const errs = await shownErrors(page);
  assert.deepEqual(errs.sort(), ['call-clinic-err', 'call-dinner-err', 'call-name-err', 'call-phone-err', 'call-time-err', 'call-town-err'].sort());
  const nameErr = await page.textContent('#call-name-err');
  assert.equal(nameErr, 'Enter your name.');
  /* the error is part of the field's accessible description */
  const desc = await page.$eval('#call-name', (el) => el.getAttribute('aria-describedby'));
  assert.ok(desc.split(' ').includes('call-name-err'));
  await close();
});

await scenario('focus goes to the first problem in form order, and errors clear as fields are fixed', async () => {
  const { page, posts, close } = await open();
  await fillValid(page);
  await page.fill('#call-phone', '555-01');
  await page.fill('#call-email', 'not-an-email');
  await page.click('#dinner-call button[type="submit"]');
  await page.waitForTimeout(150);
  assert.equal(posts.length, 0);
  assert.equal(await focusedId(page), 'call-phone');
  assert.deepEqual((await invalidIds(page)).sort(), ['call-email', 'call-phone']);
  assert.match(await page.textContent('#call-phone-err'), /area code/);
  await page.fill('#call-phone', '630-555-0142');
  assert.deepEqual(await invalidIds(page), ['call-email'], 'phone error cleared on input');
  await page.fill('#call-email', '');
  assert.deepEqual(await invalidIds(page), [], 'an empty optional email is fine');
  await close();
});

await scenario('only the topic missing: focus lands on the radio group', async () => {
  const { page, posts, close } = await open();
  for (const [sel, val] of Object.entries(VALID)) await page.fill(sel, val);
  await page.selectOption('#call-time', 'Any time');
  await page.click('#dinner-call button[type="submit"]');
  await page.waitForTimeout(150);
  assert.equal(posts.length, 0);
  assert.equal(await focusedId(page), 'dinner:Referral routes', 'the first choice is the referral routes');
  assert.equal(await page.textContent('#call-dinner-err'), 'Choose what you would like to talk about, or Not sure yet.');
  await page.check('input[name="dinner"][value="Referral routes"]');
  assert.deepEqual(await invalidIds(page), [], 'choosing a topic clears the error');
  assert.deepEqual(await page.$$eval('input[name="dinner"]', (r) => r.map((x) => x.value)), ['Referral routes', 'Online search / review tags / website', 'Patient dinner', 'Not sure yet'], 'four choices, the referral routes first');
  await close();
});

await scenario('a valid form posts once to /thanks with every field and an empty honeypot', async () => {
  const { page, posts, close } = await open();
  await fillValid(page, { dinner: 'Patient dinner' });
  await Promise.all([
    page.waitForURL('**/thanks'),
    page.click('#dinner-call button[type="submit"]')
  ]);
  assert.equal(posts.length, 1, 'one POST');
  const post = posts[0];
  assert.equal(new URL(post.url).pathname, '/thanks');
  assert.match(post.headers['content-type'], /application\/x-www-form-urlencoded/);
  const body = new URLSearchParams(post.body);
  assert.equal(body.get('form-name'), 'dinner-call');
  assert.equal(body.get('bot-field'), '');
  assert.equal(body.get('name'), 'Jordan Lee');
  assert.equal(body.get('clinic'), 'Example Aesthetics');
  assert.equal(body.get('phone'), '(630) 555-0142');
  assert.equal(body.get('email'), 'jordan@example.com');
  assert.equal(body.get('town'), 'Naperville');
  assert.equal(body.get('best_time'), 'Afternoon, 2 to 5 pm');
  assert.equal(body.get('dinner'), 'Patient dinner');
  assert.equal(body.get('message'), 'Thursday works best.');
  assert.deepEqual([...body.keys()].sort(), ['best_time', 'bot-field', 'clinic', 'dinner', 'email', 'form-name', 'message', 'name', 'phone', 'town']);
  assert.match(await page.textContent('h1'), /Thank you/);
  await close();
});

await scenario('a double click does not post twice', async () => {
  const { page, posts, close } = await open();
  await fillValid(page, { dinner: 'Online search / review tags / website' });
  await page.$eval('#dinner-call', (f) => { f.requestSubmit(); f.requestSubmit(); });
  await page.waitForURL('**/thanks');
  await page.waitForTimeout(200);
  assert.equal(posts.length, 1);
  await close();
});

await scenario('?about=website-design prefills the message and brings the form into view', async () => {
  const { page, close } = await open({ path: '/contact?about=website-design' });
  await page.waitForTimeout(250);
  assert.equal(await page.inputValue('#call-message'), "I'm asking about a website redesign.");
  const top = await page.$eval('#call', (el) => el.getBoundingClientRect().top);
  assert.ok(Math.abs(top) < 200, `#call is at the top of the view (top ${Math.round(top)})`);
  await close();
});

await scenario('?about=review-tags prefills; unknown keys leave the message empty', async () => {
  let s = await open({ path: '/contact?about=review-tags' });
  assert.equal(await s.page.inputValue('#call-message'), "I'm asking about review tags.");
  await s.close();
  s = await open({ path: '/contact?about=seo' });
  assert.equal(await s.page.inputValue('#call-message'), '');
  assert.equal(await s.page.evaluate(() => window.scrollY), 0, 'no scroll for an unknown key');
  await s.close();
});

await scenario('an old /?about=flyer-drops link is redirected to /contact?about=flyer-drops and prefills', async () => {
  const { page, jsErrors, close } = await open({ path: '/?about=flyer-drops' });
  await page.waitForTimeout(250);
  const url = new URL(page.url());
  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('about'), 'flyer-drops');
  assert.equal(await page.inputValue('#call-message'), "I'm asking about referral routes.", 'the flyer network folded into the referral routes');
  assert.deepEqual(jsErrors, []);
  await close();
});

await scenario('every service page key prefills on /contact, and the keys from before the rename still work', async () => {
  for (const [key, message] of [
    ['referral-network', "I'm asking about referral routes."], ['flyer-network', "I'm asking about referral routes."],
    ['patient-network', "I'm asking about a private patient dinner."], ['online-search-network', "I'm asking about Google Ads in my own account."],
    ['pricing', "I'm asking about pricing."], ['sample-contract', "I'm asking about the sample contract."],
    ['patient-dinners', "I'm asking about a private patient dinner."], ['flyer-drops', "I'm asking about referral routes."], ['google-ads', "I'm asking about Google Ads in my own account."]
  ]) {
    const s = await open({ path: `/contact?about=${key}` });
    assert.equal(await s.page.inputValue('#call-message'), message, key);
    await s.close();
  }
});

await scenario('old home section links open their new page (/#faq, /#formats, /#referrals, /#flyer-drops)', async () => {
  for (const [from, to] of [['/#faq', '/faq'], ['/#formats', '/patient-network#formats'], ['/#referrals', '/referral-network'], ['/#flyer-drops', '/referral-network']]) {
    const { page, jsErrors, close } = await open({ path: from });
    await page.waitForURL((u) => u.pathname !== '/', { timeout: 3000 });
    await page.waitForLoadState('load');
    assert.equal(await page.evaluate(() => location.pathname + location.hash), to, from);
    assert.deepEqual(jsErrors, []);
    await close();
  }
});

await scenario('the renamed service pages: each old path, with and without .html, 301s straight to its new page', async () => {
  // October 23, 2026: the flyer network folded into the referral routes, so every flyer path lands on /referral-network ("How it works").
  const RENAMED = [['/flyer-network', '/referral-network', 'How it works'], ['/flyer-drops', '/referral-network', 'How it works'], ['/patient-dinners', '/patient-network', null], ['/google-ads', '/online-search-network', null]];
  for (const [old, now, tab] of RENAMED) {
    for (const path of [old, `${old}.html`]) {
      const r = await fetch(`${BASE}${path}`, { redirect: 'manual' });
      assert.equal(r.status, 301, `${path} status`);
      assert.equal(r.headers.get('location'), now, `${path} goes straight to ${now}`);
      const next = await fetch(`${BASE}${now}`, { redirect: 'manual' });
      assert.equal(next.status, 200, `${now} is a page, not another redirect`);
    }
    const { page, jsErrors, missing, close } = await open({ path: `${old}#how` });
    assert.equal(new URL(page.url()).pathname, now);
    assert.equal(await page.$$eval('#site-nav a[aria-current="page"]', (a) => (a[0] ? a[0].textContent.trim() : null)), tab);
    assert.match(await page.title(), / \| Our Wellness Connections$/);
    assert.deepEqual(jsErrors, []);
    assert.deepEqual(missing, [], 'every stylesheet, script, font and image loads');
    await close();
  }
  // Older redirects that used to point at an old path go straight to the new page.
  for (const [path, to] of [['/events', '/patient-network'], ['/flyers', '/referral-network'], ['/direct-mail', '/referral-network'], ['/digital-marketing', '/online-search-network'], ['/how-it-works', '/referral-network'], ['/tracking', '/#dashboard']]) {
    const r = await fetch(`${BASE}${path}`, { redirect: 'manual' });
    assert.equal(r.status, 301, path);
    assert.equal(r.headers.get('location'), to, path);
  }
});

await scenario('the header shows the Our Wellness Connections logo, loaded and crisp (the footer is one legal line)', async () => {
  const { page, close } = await open({ path: '/' });
  await page.waitForFunction(() => [...document.querySelectorAll('img[src*="owc-logo"]')].every((i) => i.complete && i.naturalWidth === 360));
  const logos = await page.$$eval('img[src*="owc-logo"]', (imgs) => imgs.map((i) => ({ src: i.getAttribute('src'), cur: i.currentSrc, alt: i.alt, w: i.getBoundingClientRect().width })));
  assert.equal(logos.length, 1);
  for (const l of logos) {
    assert.equal(l.src, '/assets/img/owc-logo-360.png');
    assert.match(l.cur, /owc-logo-360\.webp$/, 'the WebP is used where supported');
    assert.equal(l.alt, 'Our Wellness Connections');
    assert.ok(l.w > 0 && l.w <= 180, `shown at ${l.w}px from a 360px file, so it stays sharp on 2x screens`);
  }
  await close();
});

await scenario('an old /review-tags#in-use link opens the NFC explainer, #nfc', async () => {
  const { page, jsErrors, close } = await open({ path: '/review-tags#in-use' });
  await page.waitForFunction(() => location.hash === '#nfc', null, { timeout: 3000 });
  assert.equal(await page.evaluate(() => location.pathname + location.hash), '/review-tags#nfc');
  const top = await page.evaluate(() => document.getElementById('nfc').getBoundingClientRect().top);
  assert.ok(top >= 0 && top < 400, `#nfc is in view (top ${Math.round(top)})`);
  assert.deepEqual(jsErrors, []);
  await close();
});

await scenario('without JavaScript the browser still blocks an empty form, and a valid one posts', async () => {
  const { page, posts, close } = await open({ js: false });
  assert.equal(await page.$eval('#dinner-call', (f) => f.noValidate), false);
  await page.click('#dinner-call button[type="submit"]');
  await page.waitForTimeout(200);
  assert.equal(posts.length, 0, 'native required checks stop the post');
  await fillValid(page, { dinner: 'Not sure yet' });
  await Promise.all([page.waitForURL('**/thanks'), page.click('#dinner-call button[type="submit"]')]);
  assert.equal(posts.length, 1);
  const body = new URLSearchParams(posts[0].body);
  assert.equal(body.get('form-name'), 'dinner-call');
  assert.equal(body.get('dinner'), 'Not sure yet');
  assert.equal(body.get('bot-field'), '');
  await close();
});

await scenario('phone width (390px): no sideways scroll, the form and the call-now line are usable', async () => {
  const { page, posts, close } = await open({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.locator('#call').scrollIntoViewIfNeeded();
  const btn = await page.$eval('#dinner-call button[type="submit"]', (b) => b.getBoundingClientRect().width);
  assert.ok(btn > 300, 'submit button spans the card');
  assert.match(await page.textContent('#call'), /Prefer to talk now\?\s*Call or text 331-271-6851\./);
  await fillValid(page, { dinner: 'Patient dinner' });
  await Promise.all([page.waitForURL('**/thanks'), page.click('#dinner-call button[type="submit"]')]);
  assert.equal(posts.length, 1);
  await close();
});

await scenario('an old link to the home call band (/#call?package=website) opens the call form on /contact, query kept', async () => {
  const { page, jsErrors, close } = await open({ path: '/#call?package=website' });
  await page.waitForURL((u) => u.pathname === '/contact', { timeout: 3000 });
  await page.waitForLoadState('load');
  assert.equal(await page.evaluate(() => location.pathname + location.search + location.hash), '/contact?package=website#call', 'the query moves in front of the #');
  assert.ok(await page.$('#dinner-call'), 'the call form is on the page');
  assert.deepEqual(jsErrors, []);
  await close();
});

await scenario('/estimate?package=website (a retired page) lands on /contact with no errors', async () => {
  const { page, jsErrors, close } = await open({ path: '/estimate?package=website' });
  assert.equal(new URL(page.url()).pathname, '/contact');
  assert.equal(await page.inputValue('#call-message'), '', 'an unknown key prefills nothing');
  assert.deepEqual(jsErrors, []);
  await close();
});

await scenario('/thanks loads on its own: noindex, the promise, and a way home', async () => {
  const { page, jsErrors, missing, close } = await open({ path: '/thanks' });
  assert.equal(await page.$eval('meta[name="robots"]', (m) => m.content), 'noindex');
  assert.match(await page.textContent('main'), /We’ll call you at the time you picked/);
  assert.doesNotMatch(await page.textContent('main'), /Mustafa/);
  assert.equal(await page.$eval('main a[href^="tel:"]', (a) => a.getAttribute('href')), 'tel:+13312716851');
  assert.equal(await page.$eval('main a.btn-primary', (a) => a.getAttribute('href')), '/');
  assert.deepEqual(jsErrors, []);
  assert.deepEqual(missing, [], 'every stylesheet, script, font and image loads');
  await close();
});

await scenario('home: the attorney line stays hidden until its one switch is turned on', async () => {
  let s = await open({ path: '/' });
  assert.equal(await s.page.$eval('[data-flag="attorneyReviewed"]', (p) => p.hidden), true);
  assert.doesNotMatch(await s.page.content(), /reviewed by a healthcare attorney/i, 'off: the sentence is not in the page');
  await s.close();
  s = await open({ path: '/', stub: { '/assets/site-config.js': { type: 'text/javascript', body: "window.OWC_CONFIG = { attorneyReviewed: true, attorneyReviewedText: 'Reviewed by counsel.' };" } } });
  await s.page.waitForTimeout(200);
  assert.equal(await s.page.$eval('[data-flag="attorneyReviewed"]', (p) => p.hidden), false);
  assert.equal(await s.page.$eval('[data-flag="attorneyReviewed"]', (p) => p.textContent.trim()), 'Reviewed by counsel.');
  assert.deepEqual(s.jsErrors, []);
  await s.close();
});

await scenario('home: the hero still shows without a video; with motion allowed the slot tries the video, and reduced motion never loads it', async () => {
  let s = await open({ path: '/', motion: 'reduce' });
  const reqs = [];
  s.page.on('request', (r) => { if (/van-route\.mp4/.test(r.url())) reqs.push(r.url()); });
  await s.page.waitForTimeout(500);
  assert.equal(await s.page.$('.owc-hero-video'), null, 'reduced motion: the video element is removed');
  assert.deepEqual(reqs, []);
  assert.ok(await s.page.$eval('.owc-hero-media img', (i) => i.complete && i.naturalWidth > 0), 'the still is shown');
  await s.close();
  s = await open({ path: '/', motion: 'no-preference' });
  await s.page.waitForFunction(() => !document.querySelector('.owc-hero-video') || document.querySelector('.owc-hero-media').classList.contains('is-playing'), null, { timeout: 5000 });
  assert.equal(await s.page.$('.owc-hero-video'), null, 'no van-route.mp4 yet: the slot removes itself after the failed load');
  assert.ok(await s.page.$eval('.owc-hero-media img', (i) => i.complete && i.naturalWidth > 0), 'the still stays');
  assert.deepEqual(s.jsErrors, []);
  await s.close();
});

/* The dashboard band: --p on .owc-dash-band, and the transform the screens actually get. */
const tiltState = (page) => page.evaluate(() => {
  const band = document.querySelector('.owc-dash-band');
  const cue = document.querySelector('.owc-scroll-cue');
  return {
    p: getComputedStyle(band).getPropertyValue('--p').trim(),
    tilting: band.classList.contains('is-tilting'),
    transform: getComputedStyle(document.querySelector('.owc-tilt .pt-stage')).transform,
    cue: getComputedStyle(cue).display,
    cueOpacity: Number(getComputedStyle(cue).opacity)
  };
});
const FLAT = ['none', 'matrix(1, 0, 0, 1, 0, 0)', 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'];
/* Scrolls so the top edge of the screens sits this far down the window (0.7 = 70% down). */
const placeTilt = (page, at) => page.evaluate((f) => {
  window.scrollBy({ top: document.querySelector('[data-tilt]').getBoundingClientRect().top - window.innerHeight * f, behavior: 'instant' });
}, at);

await scenario('home: the dashboard screens lie tipped back under "Scroll" and stand up flat as you scroll to them', async () => {
  for (const [width, height] of [[390, 844], [1280, 900]]) {
    const s = await open({ path: '/', width, height, motion: 'no-preference' });
    let st = await tiltState(s.page);
    assert.equal(st.tilting, true);
    assert.equal(Number(st.p), 0, `${width}px: below the fold the screens lie back`);
    assert.ok(!FLAT.includes(st.transform), st.transform);
    assert.equal(st.cue, 'flex', 'the Scroll cue shows');
    await placeTilt(s.page, 0.7);
    await s.page.waitForTimeout(150);
    st = await tiltState(s.page);
    assert.ok(Number(st.p) > 0.4 && Number(st.p) < 0.7, `${width}px: on the way up (p=${st.p})`);
    await placeTilt(s.page, 0.3);
    await s.page.waitForTimeout(150);
    st = await tiltState(s.page);
    assert.equal(Number(st.p), 1, `${width}px: flat`);
    assert.ok(FLAT.includes(st.transform), st.transform);
    assert.equal(st.cueOpacity, 0, 'the cue has faded out');
    assert.equal(await s.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${width}px: no sideways scroll`);
    assert.deepEqual(s.outside, [], 'no requests to other sites');
    assert.deepEqual(s.jsErrors, []);
    await s.close();
  }
});

await scenario('home: with reduced motion, or without JavaScript, the dashboard screens are simply flat and there is no cue', async () => {
  for (const opts of [{ motion: 'reduce' }, { motion: 'no-preference', js: false }]) {
    const s = await open({ path: '/', width: 390, height: 844, ...opts });
    const st = await tiltState(s.page);
    assert.equal(st.p, '1', JSON.stringify(opts));
    assert.equal(st.tilting, false);
    assert.ok(FLAT.includes(st.transform), st.transform);
    assert.equal(st.cue, 'none');
    assert.deepEqual(s.jsErrors, []);
    await s.close();
  }
});

await scenario('/growth-team: in the menu second, after Home; the page, its illustration and its clean URL', async () => {
  for (const width of [390, 1000, 1280]) {
    const s = await open({ path: '/growth-team', width, height: 844 });
    if (width < 1000) await s.page.click('.menu-btn');
    const items = await s.page.$$eval('#site-nav li:not(.nav-cta) a', (l) => l.map((a) => a.textContent.trim()));
    assert.deepEqual(items.slice(0, 3), ['Home', 'Growth team', 'How it works']);
    assert.equal(await s.page.$eval('#site-nav a[aria-current="page"]', (a) => a.getAttribute('href')), '/growth-team');
    if (width >= 1000) {
      const tops = await s.page.$$eval('#site-nav li', (l) => l.filter((li) => li.offsetParent).map((li) => li.getBoundingClientRect().top));
      assert.equal(new Set(tops.map(Math.round)).size, 1, `${width}px: the menu fits on one line`);
    }
    assert.equal(await s.page.textContent('h1'), 'Your Organic Growth Team.');
    assert.equal(await s.page.textContent('.gt-sub'), 'The boots on the ground maintaining your relationships.');
    assert.ok(await s.page.$eval('.gt-art img', (i) => i.complete && i.naturalWidth > 0), 'the illustration loads');
    assert.equal(await s.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${width}px: no sideways scroll`);
    assert.deepEqual(s.jsErrors, []);
    assert.deepEqual(s.missing, []);
    await s.close();
  }
  const r = await fetch(`${BASE}/growth-team.html`, { redirect: 'manual' });
  assert.equal(r.status, 301);
  assert.equal(new URL(r.headers.get('location'), BASE).pathname, '/growth-team');
});

await browser.close();
const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
console.log(`# e2e ${results.length} scenarios, ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
