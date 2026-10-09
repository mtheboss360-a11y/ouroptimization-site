// End-to-end checks for the strategy meeting request form (estimate.html + assets/estimate.js).
// The page lives at /estimate and posts the Netlify form "campaign-estimate"; both names stay for printed links and the registered form.
//
//   node tests/e2e-estimate.mjs            (local preview server on http://localhost:8770)
//   E2E_BASE_URL=http://127.0.0.1:8770 node tests/e2e-estimate.mjs
//
// Runs against a LOCAL server only and refuses anything else. Every POST is intercepted
// with page.route and fulfilled here (200 or 500, or held to test the timeout), so no
// submission ever reaches a real server. Requests to any other origin are aborted.
// Not part of `node --test tests/` (it needs a browser and a running server).
import assert from 'node:assert/strict';

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
const PAGE = `${BASE}/estimate`;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs'));
}

const VALID = {
  '#clinic': 'Example Dental',
  '#address': 'Naperville, IL',
  '#contact': 'Jordan Lee',
  '#email': 'jordan@example.com',
  '#phone': '(630) 555-0142'
};

const browser = await chromium.launch();
const results = [];

/* Opens the page with POST interception. `respond` decides what each POST gets:
   a number (status), or 'hold' to never answer. */
async function open({ width = 1280, height = 900, respond = 200, delay = 0, clock = false, path = '/estimate' } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const ctl = { respond };
  const posts = [];
  const held = [];
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== baseUrl.origin) return route.abort();
    if (req.method() !== 'GET' && req.method() !== 'HEAD') {
      posts.push({ url: req.url(), method: req.method(), headers: req.headers(), body: req.postData() || '' });
      const status = ctl.respond;
      if (status === 'hold') { held.push(route); return; }
      if (delay) await new Promise((r) => setTimeout(r, delay));
      return route.fulfill({ status, contentType: 'text/html', body: status < 300 ? 'ok' : 'error' });
    }
    return route.continue();
  });
  if (clock) await page.clock.install();
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  const close = async () => {
    for (const r of held) await r.abort().catch(() => {});
    await context.close();
  };
  return { page, posts, consoleErrors, close, ctl };
}

async function fillValid(page, extra = {}) {
  await page.selectOption('#type', 'Dental office');
  for (const [sel, val] of Object.entries({ ...VALID, ...extra })) await page.fill(sel, val);
}

const state = (page, sel) => page.$eval(sel, (el) => {
  const err = document.getElementById(el.id + '-err');
  return {
    invalid: el.getAttribute('aria-invalid') === 'true',
    describedby: el.getAttribute('aria-describedby') || '',
    error: err && err.classList.contains('on') ? err.textContent.trim() : ''
  };
});

const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

const checkedChannels = (page) => page.$$eval('input[name="channels[]"]:checked', (els) => els.map((el) => el.value));
const PACKAGE_CHANNELS = ['Local SEO', 'Facebook and Instagram ads', 'Offers and promotions'];

async function scenario(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
    console.log(`ok   - ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`FAIL - ${name}\n       ${String(err && err.message || err).split('\n').join('\n       ')}`);
  }
}

await scenario('static HTML keeps the Netlify Forms contract', async () => {
  const { page, close } = await open();
  const html = await (await page.request.get(PAGE)).text();
  assert.match(html, /<form name="campaign-estimate"[^>]*data-netlify="true"[^>]*netlify-honeypot="bot-field"/);
  assert.match(html, /<input type="hidden" name="form-name" value="campaign-estimate">/);
  assert.match(html, /name="bot-field"/);
  assert.match(html, /name="business_type_other"/, 'the "Something else" field is in the static HTML');
  assert.match(html, /<script src="assets\/estimate\.js" defer><\/script>/);
  assert.doesNotMatch(html, /Build My Campaign/);
  assert.match(html, /<button class="btn btn-primary" type="submit" id="submit">Request My Strategy Meeting<\/button>/);
  // the retired labels must stay gone
  assert.doesNotMatch(html, /Get a Campaign Estimat(?:e)|Request My Campaign Estimat(?:e)|Illustrat(?:ive)/i);

  // Phone is optional (email stays required); the field keeps its name and input hints.
  const phone = await page.$eval('#phone', (el) => ({
    name: el.name, type: el.type, autocomplete: el.getAttribute('autocomplete'), inputmode: el.getAttribute('inputmode'),
    required: el.required, ariaRequired: el.getAttribute('aria-required'),
    describedby: el.getAttribute('aria-describedby') || '',
    label: document.querySelector('label[for="phone"]').textContent.replace(/\s+/g, ' ').trim()
  }));
  assert.deepEqual(phone, {
    name: 'phone', type: 'tel', autocomplete: 'tel', inputmode: 'tel', required: false, ariaRequired: null,
    describedby: 'phone-help', label: 'Phone (optional)'
  });
  assert.match(await page.textContent('#phone-help'), /optional|call/i);
  assert.equal(await page.$eval('#email', (el) => el.required), true, 'email is still required');
  assert.equal(await page.locator('.est-row #email').count(), 1, 'email and phone share the contact row');
  assert.equal(await page.locator('.est-row #phone').count(), 1, 'email and phone share the contact row');
  await close();
});

await scenario('website accepts query strings and fragments, rejects other schemes', async () => {
  const { page, close, consoleErrors } = await open();
  for (const url of ['https://example.com?ref=google', 'https://example.com#about', 'example.com/about?x=1#y', 'www.example.co.uk', 'EXAMPLE.COM']) {
    await page.fill('#website', url);
    await page.locator('#website').blur();
    assert.deepEqual((await state(page, '#website')).invalid, false, `${url} should be accepted`);
  }
  await page.fill('#website', 'javascript:alert(1)');
  await page.locator('#website').blur();
  const bad = await state(page, '#website');
  assert.equal(bad.invalid, true);
  assert.ok(bad.describedby.split(' ').includes('website-err'), 'error is linked with aria-describedby');
  assert.ok(bad.describedby.split(' ').includes('website-help'), 'help text stays linked');
  await page.fill('#website', 'https://example.com?ref=google');
  const fixed = await state(page, '#website');
  assert.equal(fixed.invalid, false, 'flagged field clears on input, before blur');
  assert.equal(fixed.error, '');
  assert.deepEqual(consoleErrors, []);
  await close();
});

await scenario('"Something else" reveals a required field and its error clears once filled', async () => {
  const { page, posts, close } = await open();
  assert.equal(await page.isHidden('#type-other-field'), true);
  await fillValid(page);
  await page.selectOption('#type', 'Something else');
  assert.equal(await page.isVisible('#type-other'), true);
  assert.equal(await page.$eval('#type-other', (el) => el.required), true);
  assert.equal(await page.textContent('label[for="type-other"]').then((t) => t.includes('What type of business is it?')), true);

  await page.click('#submit');
  assert.equal(posts.length, 0, 'nothing is sent while a field is invalid');
  assert.equal((await state(page, '#type-other')).invalid, true);
  assert.equal(await page.isVisible('#est-summary'), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'est-summary-h', 'focus moves to the error summary');
  assert.equal(await page.locator('#est-summary-list a[href="#type-other"]').count(), 1);

  await page.locator('#type-other').pressSequentially('Massage studio');
  const after = await state(page, '#type-other');
  assert.equal(after.invalid, false, 'error clears while typing');
  assert.equal(after.error, '');
  assert.equal(await page.isHidden('#est-summary'), true, 'summary goes away once nothing is left to fix');

  // Switching away drops the requirement and hides the field.
  await page.fill('#type-other', '');
  await page.click('#submit');
  assert.equal((await state(page, '#type-other')).invalid, true);
  await page.selectOption('#type', 'Chiropractor');
  assert.equal(await page.isHidden('#type-other-field'), true);
  assert.equal(await page.$eval('#type-other', (el) => el.required), false);
  assert.equal((await state(page, '#type-other')).invalid, false);
  await close();
});

await scenario('error summary links move focus to the field', async () => {
  const { page, close } = await open();
  await page.click('#submit');
  const links = await page.$$eval('#est-summary-list a', (as) => as.map((a) => a.getAttribute('href')));
  assert.deepEqual(links, ['#clinic', '#type', '#address', '#contact', '#email']);
  assert.equal(await page.textContent('#est-summary-h'), 'Check 5 fields before sending');
  assert.doesNotMatch(await page.textContent('#est-summary'), /phone/i, 'an empty phone is not listed');
  await page.click('#est-summary-list a[href="#email"]');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'email');
  for (const sel of ['#clinic', '#type', '#address', '#contact', '#email']) {
    assert.equal((await state(page, sel)).invalid, true, `${sel} flagged`);
  }
  assert.deepEqual(await state(page, '#phone'), { invalid: false, describedby: 'phone-help', error: '' }, 'empty phone is not flagged');
  await close();
});

await scenario('phone left empty: the request still sends and shows #sent', async () => {
  const { page, posts, close, consoleErrors } = await open();
  await fillValid(page, { '#phone': '' });
  await page.click('#submit');
  await page.waitForSelector('#sent', { state: 'visible' });
  assert.equal(posts.length, 1, `expected 1 POST, got ${posts.length}`);
  const body = new URLSearchParams(posts[0].body);
  assert.equal(body.get('form-name'), 'campaign-estimate');
  assert.equal(body.get('email'), 'jordan@example.com');
  assert.ok(!body.get('phone'), 'phone is posted empty (or not at all)');
  assert.equal(await page.isHidden('#form-area'), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'sent-h');
  assert.deepEqual(consoleErrors, []);
  await close();
});

await scenario('a phone number that is filled in is still checked', async () => {
  const { page, posts, close } = await open();
  await fillValid(page, { '#phone': '555-0142' });
  await page.click('#submit');
  assert.equal(posts.length, 0, 'nothing is sent with an invalid phone number');
  const bad = await state(page, '#phone');
  assert.equal(bad.invalid, true);
  assert.match(bad.error, /10-digit US phone number/);
  assert.deepEqual(bad.describedby.split(' '), ['phone-err', 'phone-help'], 'error first, then the help line');
  assert.deepEqual(await page.$$eval('#est-summary-list a', (as) => as.map((a) => a.getAttribute('href'))), ['#phone']);

  // Clearing the number is a valid fix, as is correcting it.
  await page.fill('#phone', '');
  assert.deepEqual(await state(page, '#phone'), { invalid: false, describedby: 'phone-help', error: '' });
  assert.equal(await page.isHidden('#est-summary'), true, 'summary goes away once nothing is left to fix');
  await page.click('#submit');
  await page.waitForSelector('#sent', { state: 'visible' });
  assert.equal(posts.length, 1);
  await close();
});

await scenario('double-click sends exactly one POST; success shows #sent and moves focus', async () => {
  const { page, posts, close, consoleErrors } = await open({ delay: 600 });
  await fillValid(page, { '#website': 'example.com/about?x=1#y' });
  await page.check('input[name="channels[]"][value="Direct mail"]');
  await page.check('input[name="channels[]"][value="Local SEO"]');
  await page.dblclick('#submit');
  const busy = await page.$eval('#submit', (b) => ({ disabled: b.disabled, busy: b.getAttribute('aria-busy'), text: b.textContent }));
  assert.deepEqual(busy, { disabled: true, busy: 'true', text: 'Sending…' });
  await page.keyboard.press('Enter');
  // A submit event that bypasses the disabled button is ignored by the script too.
  await page.evaluate(() => document.getElementById('estimate-form').dispatchEvent(new Event('submit', { cancelable: true })));
  await page.waitForSelector('#sent', { state: 'visible' });
  assert.equal(posts.length, 1, `expected 1 POST, got ${posts.length}`);

  const post = posts[0];
  assert.equal(new URL(post.url).pathname, '/');
  assert.equal(post.headers['content-type'], 'application/x-www-form-urlencoded');
  const body = new URLSearchParams(post.body);
  assert.equal(body.get('form-name'), 'campaign-estimate');
  assert.equal(body.get('bot-field'), '');
  assert.equal(body.get('clinic'), 'Example Dental');
  assert.equal(body.get('clinic_type'), 'Dental office');
  assert.equal(body.get('business_type_other'), '');
  assert.equal(body.get('address'), 'Naperville, IL');
  assert.equal(body.get('phone'), '(630) 555-0142');
  assert.equal(body.get('website'), 'example.com/about?x=1#y');
  assert.deepEqual(body.getAll('channels[]'), ['Direct mail', 'Local SEO']);

  const html = await (await page.request.get(PAGE)).text();
  const staticNames = new Set([...html.matchAll(/\bname="([^"]+)"/g)].map((m) => m[1]));
  for (const key of new Set(body.keys())) assert.ok(staticNames.has(key), `posted field "${key}" exists in the static HTML`);

  assert.equal(await page.isHidden('#form-area'), true, 'form is hidden');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'sent-h', 'focus on the success heading');
  const copy = await page.textContent('#sent');
  assert.match(copy, /request is in/i);
  assert.match(copy, /set up a time to talk/i);
  assert.doesNotMatch(copy, /\b(hour|hours|day|days|business day|within|24)\b/i, 'no timeframe promised');
  assert.deepEqual(consoleErrors, []);
  await close();
});

await scenario('server error keeps the data, shows an alert with the phone number, re-enables the button', async () => {
  const { page, posts, close, ctl } = await open({ respond: 500 });
  await fillValid(page, { '#notes': 'Spring opening in Oak Park.' });
  await page.selectOption('#budget', '$2,500 – $5,000');
  await page.click('#submit');
  await page.waitForSelector('#alert .est-fail');
  assert.equal(posts.length, 1);
  assert.equal(await page.getAttribute('#alert', 'role'), 'alert');
  assert.match(await page.textContent('#alert'), /331-271-6851/);
  assert.equal(await page.isHidden('#sent'), true);
  assert.equal(await page.isVisible('#estimate-form'), true);
  for (const [sel, val] of Object.entries({ ...VALID, '#notes': 'Spring opening in Oak Park.' })) {
    assert.equal(await page.inputValue(sel), val, `${sel} kept`);
  }
  assert.equal(await page.inputValue('#budget'), '$2,500 – $5,000');
  const btn = await page.$eval('#submit', (b) => ({ disabled: b.disabled, busy: b.hasAttribute('aria-busy'), text: b.textContent }));
  assert.deepEqual(btn, { disabled: false, busy: false, text: 'Request My Strategy Meeting' });

  // Retrying once the server answers 200 goes through and clears the alert.
  ctl.respond = 200;
  await page.click('#submit');
  await page.waitForSelector('#sent', { state: 'visible' });
  assert.equal(posts.length, 2);
  assert.equal(await page.textContent('#alert'), '');
  await close();
});

await scenario('no answer within 15 seconds counts as a failure', async () => {
  const { page, posts, close } = await open({ respond: 'hold', clock: true });
  await fillValid(page);
  await page.click('#submit');
  await page.waitForFunction(() => document.getElementById('submit').disabled);
  await page.clock.runFor(14000);
  assert.equal(await page.$eval('#submit', (b) => b.disabled), true, 'still waiting at 14s');
  await page.clock.runFor(1500);
  await page.waitForSelector('#alert .est-fail');
  assert.equal(posts.length, 1);
  assert.equal(await page.$eval('#submit', (b) => b.disabled), false);
  assert.equal(await page.inputValue('#clinic'), 'Example Dental');
  await close();
});

await scenario('keyboard-only completion', async () => {
  const { page, posts, close } = await open();
  const typed = {
    clinic: 'Example Dental', 'type-other': 'Massage studio', address: '60540',
    contact: 'Jordan Lee', email: 'jordan@example.com', phone: '630-555-0142'
  };
  const visited = new Set();
  let recovered = false;
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press('Tab');
    const el = await page.evaluate(() => {
      const a = document.activeElement;
      return { id: a.id, tag: a.tagName, type: a.type || '', value: a.value || '', href: a.getAttribute('href') || '' };
    });
    if (el.id === 'clinic' && !recovered) {
      // Submit empty with Enter, then use the summary to get back here.
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'est-summary-h');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '#clinic');
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'clinic');
      recovered = true;
    }
    if (typed[el.id] !== undefined && !visited.has(el.id)) {
      await page.keyboard.type(typed[el.id]);
      visited.add(el.id);
    } else if (el.id === 'type' && !visited.has('type')) {
      await page.keyboard.type('Something');
      visited.add('type');
      assert.equal(await page.inputValue('#type'), 'Something else');
    } else if (el.type === 'checkbox' && !visited.has('check')) {
      await page.keyboard.press('Space');
      visited.add('check');
    } else if (el.id === 'submit') {
      await page.keyboard.press('Enter');
      break;
    }
  }
  assert.ok(recovered, 'reached the form with Tab');
  await page.waitForSelector('#sent', { state: 'visible' });
  assert.equal(posts.length, 1);
  const body = new URLSearchParams(posts[0].body);
  assert.equal(body.get('clinic_type'), 'Something else');
  assert.equal(body.get('business_type_other'), 'Massage studio');
  assert.equal(body.getAll('channels[]').length, 1);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'sent-h');
  await close();
});

await scenario('?package=digital: nothing is prefilled without it, or for an unknown package', async () => {
  for (const path of ['/estimate', '/estimate?package=print', '/estimate?package=']) {
    const { page, close, consoleErrors } = await open({ path });
    assert.equal(await page.isHidden('#est-package'), true, `${path}: package line hidden`);
    assert.deepEqual(await checkedChannels(page), [], `${path}: no channel prefilled`);
    assert.deepEqual(consoleErrors, []);
    await close();
  }
});

await scenario('?package=digital prefills the package channels, shows the line, and posts them (POST intercepted)', async () => {
  const { page, posts, close, consoleErrors } = await open({ path: '/estimate?package=digital' });
  assert.equal(await page.isVisible('#est-package'), true, 'package line shown');
  const line = (await page.textContent('#est-package')).replace(/\s+/g, ' ').trim();
  assert.match(line, /^You’re asking about the Digital Growth Package \(\$900\/month\)\./);
  assert.match(line, /Ad spend and platform fees are separate and paid directly to Google, Meta and Groupon\.$/);
  assert.ok(await page.evaluate(() => {
    const note = document.getElementById('est-package').getBoundingClientRect();
    const form = document.getElementById('estimate-form').getBoundingClientRect();
    return note.bottom <= form.top;
  }), 'the line sits above the form');
  assert.deepEqual(await checkedChannels(page), PACKAGE_CHANNELS);

  // Validation is unchanged: an empty submit sends nothing, lists the five required fields
  // and leaves the prefilled boxes alone.
  await page.click('#submit');
  assert.equal(posts.length, 0, 'nothing is sent while required fields are empty');
  assert.deepEqual(await page.$$eval('#est-summary-list a', (as) => as.map((a) => a.getAttribute('href'))),
    ['#clinic', '#type', '#address', '#contact', '#email']);
  assert.deepEqual(await checkedChannels(page), PACKAGE_CHANNELS, 'prefill survives a failed submit');

  await fillValid(page);
  assert.equal(await page.isHidden('#est-summary'), true, 'summary clears once the fields are fixed');
  await page.click('#submit');
  await page.waitForSelector('#sent', { state: 'visible' });
  assert.equal(posts.length, 1, `expected 1 POST, got ${posts.length}`);
  const post = posts[0];
  assert.equal(new URL(post.url).pathname, '/');
  assert.equal(post.method, 'POST');
  assert.equal(post.headers['content-type'], 'application/x-www-form-urlencoded');
  const body = new URLSearchParams(post.body);
  assert.equal(body.get('form-name'), 'campaign-estimate');
  assert.equal(body.get('clinic'), 'Example Dental');
  assert.deepEqual(body.getAll('channels[]'), PACKAGE_CHANNELS);
  assert.equal(body.has('package'), false, 'no new field is posted');
  const html = await (await page.request.get(PAGE)).text();
  const staticNames = new Set([...html.matchAll(/\bname="([^"]+)"/g)].map((m) => m[1]));
  for (const key of new Set(body.keys())) assert.ok(staticNames.has(key), `posted field "${key}" exists in the static HTML`);
  assert.equal(await page.isHidden('#est-package'), true, 'the line goes away with the form');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'sent-h');
  assert.deepEqual(consoleErrors, []);
  await close();
});

await scenario('?package=digital: the prefilled channels stay editable', async () => {
  const { page, posts, close } = await open({ path: '/estimate?package=digital', width: 360, height: 780 });
  assert.ok(await noOverflow(page), 'no overflow at 360px with the package line');
  await page.uncheck('input[name="channels[]"][value="Offers and promotions"]');
  await page.check('input[name="channels[]"][value="Direct mail"]');
  await fillValid(page);
  await page.click('#submit');
  await page.waitForSelector('#sent', { state: 'visible' });
  assert.equal(posts.length, 1);
  assert.deepEqual(new URLSearchParams(posts[0].body).getAll('channels[]'), ['Direct mail', 'Local SEO', 'Facebook and Instagram ads']);
  await close();
});

await scenario('no horizontal overflow at 360px (initial, errors, success)', async () => {
  const { page, close } = await open({ width: 360, height: 780 });
  assert.ok(await noOverflow(page), 'initial');
  await page.selectOption('#type', 'Something else');
  await page.fill('#website', 'https://a-very-long-subdomain-name.example-business-site.com/path?ref=google');
  await page.click('#submit');
  assert.ok(await noOverflow(page), 'error state');
  await fillValid(page, { '#website': '' });
  await page.selectOption('#type', 'Something else');
  await page.fill('#type-other', 'Massage studio');
  await page.click('#submit');
  await page.waitForSelector('#sent', { state: 'visible' });
  assert.ok(await noOverflow(page), 'success state');
  await close();
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n# e2e ${results.length} scenarios, ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
