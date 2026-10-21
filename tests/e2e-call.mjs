// End-to-end checks for the patient dinner call form on the home page (#call, Netlify form
// "dinner-call", assets/call.js) and the /thanks page it posts to.
//
//   node tests/e2e-call.mjs            (local preview server on http://localhost:8770)
//   E2E_BASE_URL=http://127.0.0.1:8770 node tests/e2e-call.mjs
//
// Runs against a LOCAL server only and refuses anything else. Every request that is not a
// GET or HEAD is intercepted with route.fulfill and answered here, so no submission ever
// reaches a server. Requests to any other origin are aborted.
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

async function open({ width = 1280, height = 900, path = '/', js = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const posts = [];
  const jsErrors = [];
  const missing = [];
  page.on('pageerror', (e) => jsErrors.push(String(e)));
  page.on('response', (r) => { if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`); });
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== baseUrl.origin) return route.abort();
    if (req.method() !== 'GET' && req.method() !== 'HEAD') {
      posts.push({ url: req.url(), method: req.method(), headers: req.headers(), body: req.postData() || '' });
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: THANKS_HTML });
    }
    return route.continue();
  });
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  return { page, posts, jsErrors, missing, close: () => context.close() };
}

async function fillValid(page, { dinner = 'VIP Night', time = 'Afternoon, 2 to 5 pm' } = {}) {
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

await scenario('home page loads with the form, no script errors, and JS validation takes over', async () => {
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
  assert.ok(invalid.includes('dinner:Plus-One Dinner') || invalid.some((x) => x.startsWith('dinner:')), 'the dinner radios are aria-invalid');
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

await scenario('only the dinner missing: focus lands on the radio group', async () => {
  const { page, posts, close } = await open();
  for (const [sel, val] of Object.entries(VALID)) await page.fill(sel, val);
  await page.selectOption('#call-time', 'Any time');
  await page.click('#dinner-call button[type="submit"]');
  await page.waitForTimeout(150);
  assert.equal(posts.length, 0);
  assert.equal(await focusedId(page), 'dinner:Plus-One Dinner');
  assert.equal(await page.textContent('#call-dinner-err'), 'Choose a dinner, or Not sure yet.');
  await page.check('input[name="dinner"][value="Not sure yet"]');
  assert.deepEqual(await invalidIds(page), [], 'choosing a dinner clears the error');
  await close();
});

await scenario('a valid form posts once to /thanks with every field and an empty honeypot', async () => {
  const { page, posts, close } = await open();
  await fillValid(page, { dinner: 'VIP Night' });
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
  assert.equal(body.get('dinner'), 'VIP Night');
  assert.equal(body.get('message'), 'Thursday works best.');
  assert.deepEqual([...body.keys()].sort(), ['best_time', 'bot-field', 'clinic', 'dinner', 'email', 'form-name', 'message', 'name', 'phone', 'town']);
  assert.match(await page.textContent('h1'), /Thank you/);
  await close();
});

await scenario('a double click does not post twice', async () => {
  const { page, posts, close } = await open();
  await fillValid(page, { dinner: 'Plus-One Dinner' });
  await page.$eval('#dinner-call', (f) => { f.requestSubmit(); f.requestSubmit(); });
  await page.waitForURL('**/thanks');
  await page.waitForTimeout(200);
  assert.equal(posts.length, 1);
  await close();
});

await scenario('?about=website-design prefills the message and brings the form into view', async () => {
  const { page, close } = await open({ path: '/?about=website-design' });
  await page.waitForTimeout(250);
  assert.equal(await page.inputValue('#call-message'), "I'm asking about a website redesign.");
  const top = await page.$eval('#call', (el) => el.getBoundingClientRect().top);
  assert.ok(Math.abs(top) < 200, `#call is at the top of the view (top ${Math.round(top)})`);
  await close();
});

await scenario('?about=review-tags prefills; unknown keys leave the message empty', async () => {
  let s = await open({ path: '/?about=review-tags' });
  assert.equal(await s.page.inputValue('#call-message'), "I'm asking about review tags.");
  await s.close();
  s = await open({ path: '/?about=seo' });
  assert.equal(await s.page.inputValue('#call-message'), '');
  assert.equal(await s.page.evaluate(() => window.scrollY), 0, 'no scroll for an unknown key');
  await s.close();
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
  assert.match(await page.textContent('#call'), /Prefer to talk now\?\s*Call or text Mustafa at 331-271-6851\./);
  await fillValid(page, { dinner: 'Plus-One Dinner' });
  await Promise.all([page.waitForURL('**/thanks'), page.click('#dinner-call button[type="submit"]')]);
  assert.equal(posts.length, 1);
  await close();
});

await scenario('an old link whose query landed after the # (/#call?package=website) still opens the form', async () => {
  const { page, jsErrors, close } = await open({ path: '/#call?package=website' });
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => location.pathname + location.search + location.hash), '/?package=website#call', 'the query moves in front of the #');
  const top = await page.$eval('#call', (el) => el.getBoundingClientRect().top);
  assert.ok(Math.abs(top) < 200, `#call is at the top of the view (top ${Math.round(top)})`);
  assert.equal(await page.inputValue('#call-message'), '', 'an unknown key prefills nothing');
  assert.deepEqual(jsErrors, []);
  await close();
});

await scenario('/thanks loads on its own: noindex, the promise, and a way home', async () => {
  const { page, jsErrors, missing, close } = await open({ path: '/thanks' });
  assert.equal(await page.$eval('meta[name="robots"]', (m) => m.content), 'noindex');
  assert.match(await page.textContent('main'), /Mustafa will call you at the time you picked/);
  assert.equal(await page.$eval('main a[href^="tel:"]', (a) => a.getAttribute('href')), 'tel:+13312716851');
  assert.equal(await page.$eval('main a.btn-primary', (a) => a.getAttribute('href')), '/');
  assert.deepEqual(jsErrors, []);
  assert.deepEqual(missing, [], 'every stylesheet, script, font and image loads');
  await close();
});

await browser.close();
const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
console.log(`# e2e ${results.length} scenarios, ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
