// The call form on /contact (contact.html, Netlify form "dinner-call"), the thank-you page it posts
// to, and unit tests for the form rules and the ?about= prefill in assets/call.js.
// Zero dependencies: node:test + node:assert. Run from the repo root: node --test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { read, PAGES, text, attr, hasAttr, tags, byId, links } from './html.mjs';

const require = createRequire(import.meta.url);
const call = require('../assets/call.js');
const html = read('contact.html');
const thanks = read('thanks.html');
const js = read('assets/call.js');
const formOpen = tags(html, 'form').find((t) => attr(t, 'name') === 'dinner-call');
const form = html.slice(html.indexOf(formOpen), html.indexOf('</form>', html.indexOf(formOpen)));

describe('/contact: the call form', () => {
  test('the form lives on /contact only, in the #call section, with call.js', () => {
    for (const p of PAGES) {
      const has = /<form name="dinner-call"/.test(read(p.file));
      assert.equal(has, p.file === 'contact.html', `${p.file} ${has ? 'has' : 'does not have'} the form`);
    }
    assert.match(byId(html, 'call'), /<form name="dinner-call"/);
    assert.match(html, /<script src="\/assets\/call\.js" defer><\/script>/);
    assert.equal(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)[1], 'Book a <em class="dn-keep">15-minute call.</em>');
  });

  test('Netlify form: name, method, action, detection and honeypot', () => {
    assert.ok(formOpen, 'form[name="dinner-call"] exists');
    assert.equal(attr(formOpen, 'method'), 'POST');
    assert.equal(attr(formOpen, 'action'), '/thanks');
    assert.equal(attr(formOpen, 'data-netlify'), 'true');
    assert.equal(attr(formOpen, 'netlify-honeypot'), 'bot-field');
    assert.ok(!hasAttr(formOpen, 'novalidate'), 'native validation stays on without JS');
    assert.match(form, /<input type="hidden" name="form-name" value="dinner-call">/);
    assert.match(form, /<p class="hp" aria-hidden="true"><label>[^<]*<input name="bot-field" tabindex="-1" autocomplete="off"><\/label><\/p>/);
    assert.equal(tags(html, 'form').length, 1, 'one form on the page');
  });

  test('fields: names, types, autocomplete, required and labels', () => {
    const controls = [...tags(form, 'input'), ...tags(form, 'select'), ...tags(form, 'textarea')]
      .filter((t) => attr(t, 'type') !== 'hidden' && attr(t, 'name') !== 'bot-field');
    const by = (name) => controls.filter((t) => attr(t, 'name') === name);
    const one = (name) => { const list = by(name); assert.equal(list.length, 1, name); return list[0]; };

    assert.ok(hasAttr(one('name'), 'required')); assert.equal(attr(one('name'), 'autocomplete'), 'name');
    assert.ok(hasAttr(one('clinic'), 'required')); assert.equal(attr(one('clinic'), 'autocomplete'), 'organization');
    assert.ok(hasAttr(one('phone'), 'required')); assert.equal(attr(one('phone'), 'type'), 'tel'); assert.equal(attr(one('phone'), 'autocomplete'), 'tel');
    assert.ok(!hasAttr(one('email'), 'required')); assert.equal(attr(one('email'), 'type'), 'email'); assert.equal(attr(one('email'), 'autocomplete'), 'email');
    assert.ok(hasAttr(one('town'), 'required'));
    assert.ok(hasAttr(one('best_time'), 'required')); assert.match(one('best_time'), /^<select/);
    assert.ok(!hasAttr(one('message'), 'required')); assert.match(one('message'), /^<textarea/);

    const radios = by('dinner');
    // The referral network comes first (the owner's order: the steps, then the extras, then "Not sure yet").
    assert.deepEqual(radios.map((t) => attr(t, 'value')), ['Referral or flyer network', 'Plus-One Dinner', 'VIP Night', 'Online search network, review tags or a website', 'Not sure yet']);
    assert.deepEqual([...form.matchAll(/<label><input type="radio" name="dinner" value="([^"]+)"[^>]*>([^<]+)<\/label>/g)].map((m) => m[1] === m[2]), [true, true, true, true, true], 'each label reads the same as its value');
    assert.ok(radios.every((t) => attr(t, 'type') === 'radio' && hasAttr(t, 'required')));
    assert.deepEqual(radios.map((t) => attr(t, 'value')), call.DINNERS, 'call.js knows the same five choices');
    assert.match(form, /<legend>What would you like to talk about\?<\/legend>/);

    for (const t of controls) {
      const id = attr(t, 'id');
      if (id) assert.match(form, new RegExp(`<label for="${id}">`), `label for #${id}`);
      else assert.ok(new RegExp(`<label>${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(form), `${attr(t, 'name')} is wrapped in its label`);
    }
    assert.match(text(form), /Email \(optional\)/);
    assert.match(text(form), /Message \(optional\)/);

    const posted = new Set(controls.map((t) => attr(t, 'name')));
    assert.deepEqual([...posted].sort(), [...call.ORDER].sort(), 'call.js validates every posted field');
    for (const t of controls) {
      const max = attr(t, 'maxlength');
      if (max) assert.equal(Number(max), call.MAX[attr(t, 'name')], `maxlength of ${attr(t, 'name')}`);
    }
  });

  test('every error message has a home, and fields point at it', () => {
    for (const id of ['call-name', 'call-clinic', 'call-phone', 'call-email', 'call-town', 'call-time', 'call-dinner', 'call-message']) {
      assert.match(form, new RegExp(`<p class="err" id="${id}-err"></p>`), `${id}-err`);
      assert.match(form, new RegExp(`aria-describedby="[^"]*${id}-err`), `something points at ${id}-err`);
    }
  });

  test('the message help, the submit button and the call-now line, with no patient information line', () => {
    const t = text(byId(html, 'call'));
    assert.doesNotMatch(t, /patient information/i);
    assert.doesNotMatch(form, /call-message-note/);
    assert.match(form, /<p class="help" id="call-message-help">Anything you&rsquo;d like us to know before the call\.<\/p>/);
    assert.match(form, /aria-describedby="call-message-help call-message-err"/);
    assert.match(form, /<button class="btn btn-primary" type="submit">Book my 15-minute call<\/button>/);
    assert.match(t, /Prefer to talk now\? Call or text Mustafa at 331-271-6851\./);
    assert.match(t, /We use these details to call you back about your request\./);
    assert.match(t, /What fits your clinic: the referral network, the flyer network, a dinner or one of the extras/);
  });
});

describe('thanks page', () => {
  test('noindex, canonical, favicon block and the site stylesheet', () => {
    assert.match(thanks, /<meta name="robots" content="noindex">/);
    assert.match(thanks, /<link rel="canonical" href="https:\/\/ouroptimization\.com\/thanks">/);
    for (const link of ['<link rel="icon" href="/assets/owo-favicon.ico" sizes="16x16 32x32 48x48">', '<link rel="apple-touch-icon" href="/assets/owo-apple-touch-icon.png">', '<link rel="manifest" href="/site.webmanifest?v=own1">']) {
      assert.ok(thanks.includes(link), link);
    }
    assert.match(thanks, /<link rel="stylesheet" href="\/assets\/site\.css">/);
  });

  test('says we will call at the time they picked, with our number, email and a way home', () => {
    const t = text(thanks.slice(thanks.indexOf('<main'), thanks.indexOf('</main>')));
    assert.equal(text(/<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(thanks)[1]), "Thank you. We'll call you.");
    assert.match(t, /We'll call you at the time you picked, to talk through what fits your clinic\./);
    assert.match(t, /If that time stops working, or you'd rather talk sooner, call or text us at 331-271-6851\./);
    assert.doesNotMatch(t, /Mustafa/, 'the page says "we"');
    assert.doesNotMatch(t, /patient information/i);
    assert.match(thanks, /<a href="tel:\+13312716851">331-271-6851<\/a>/);
    assert.match(thanks, /<a href="mailto:mustafa@ouroptimization\.com">mustafa@ouroptimization\.com<\/a>/);
    assert.match(thanks, /<a class="btn btn-primary" href="\/">Back to the home page<\/a>/);
    assert.ok(links(thanks).some((l) => l.href === '/referral-network#process'), 'how the referral network works, on its own page');
  });
});

/* ---------- assets/call.js ---------- */
const valid = Object.freeze({
  name: 'Jordan Lee',
  clinic: 'Example Aesthetics',
  phone: '(630) 555-0142',
  email: '',
  town: 'Naperville',
  best_time: 'Afternoon, 2 to 5 pm',
  dinner: 'Plus-One Dinner',
  message: ''
});
const errorFor = (name, patch) => call.validateField(name, { ...valid, ...patch });

describe('call.js: module shape', () => {
  test('exports pure functions without touching a DOM', () => {
    for (const fn of ['isEmail', 'isPhone', 'validateField', 'validateAll', 'aboutFromSearch', 'prefillFor']) {
      assert.equal(typeof call[fn], 'function', fn);
    }
    assert.equal(typeof globalThis.document, 'undefined');
  });

  test('rules cover every posted field in form order', () => {
    assert.deepEqual(call.ORDER, ['name', 'clinic', 'phone', 'email', 'town', 'best_time', 'dinner', 'message']);
  });

  test('a complete submission passes', () => {
    assert.deepEqual(call.validateAll(valid), []);
    assert.deepEqual(call.validateAll({ ...valid, email: 'jordan@example.com', message: 'Hello', dinner: 'VIP Night' }), []);
    assert.deepEqual(call.validateAll({ ...valid, dinner: 'Referral or flyer network' }), []);
    assert.deepEqual(call.validateAll({ ...valid, dinner: 'Online search network, review tags or a website' }), []);
  });

  test('an empty form lists the required fields, in order', () => {
    const empty = Object.fromEntries(call.ORDER.map((k) => [k, '']));
    assert.deepEqual(call.validateAll(empty).map((p) => p.name), ['name', 'clinic', 'phone', 'town', 'best_time', 'dinner']);
    for (const p of call.validateAll(empty)) assert.ok(p.message.length > 5 && p.message.endsWith('.'), p.message);
  });

  test('no network calls in the script', () => {
    assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|sendBeacon|navigator\.|import\(/);
  });
});

describe('call.js: required text fields', () => {
  for (const name of ['name', 'clinic', 'town']) {
    test(`${name}: required, trimmed, length-limited`, () => {
      assert.notEqual(errorFor(name, { [name]: '' }), '');
      assert.notEqual(errorFor(name, { [name]: '   ' }), '');
      assert.equal(errorFor(name, { [name]: '  ok  ' }), '');
      assert.equal(errorFor(name, { [name]: 'x'.repeat(call.MAX[name]) }), '');
      assert.notEqual(errorFor(name, { [name]: 'x'.repeat(call.MAX[name] + 1) }), '');
    });
  }
  test('best time: required', () => {
    assert.notEqual(errorFor('best_time', { best_time: '' }), '');
    assert.equal(errorFor('best_time', { best_time: 'Any time' }), '');
  });
});

describe('call.js: phone (required)', () => {
  for (const v of ['(630) 555-0142', '630-555-0142', '630.555.0142', '6305550142', '+1 630 555 0142', '1 (630) 555-0142', '  630 555 0142  ']) {
    test(`accepts ${JSON.stringify(v)}`, () => {
      assert.equal(call.isPhone(v), true);
      assert.equal(errorFor('phone', { phone: v }), '');
    });
  }
  for (const v of ['', '555-0142', '123', 'call me', '630-555-0142 ext 2', '630/555/0142', '+1 (630) 555-0142 0000 0000 0', 'abc6305550142']) {
    test(`rejects ${JSON.stringify(v)}`, () => {
      assert.equal(call.isPhone(v), false);
      assert.notEqual(errorFor('phone', { phone: v }), '');
    });
  }
});

describe('call.js: email (optional)', () => {
  test('empty is fine', () => {
    assert.equal(errorFor('email', { email: '' }), '');
    assert.equal(errorFor('email', { email: '   ' }), '');
  });
  for (const v of ['jordan@example.com', 'Jordan.Lee+spa@Example.co.uk', '  me@example.com ']) {
    test(`accepts ${JSON.stringify(v)}`, () => assert.equal(errorFor('email', { email: v }), ''));
  }
  for (const v of ['jordan', 'jordan@', '@example.com', 'jordan@example', 'jor dan@example.com', 'a@b..com', 'a@b.c', `${'x'.repeat(250)}@example.com`]) {
    test(`rejects ${JSON.stringify(v.length > 40 ? v.slice(0, 40) + '...' : v)}`, () => assert.notEqual(errorFor('email', { email: v }), ''));
  }
});

describe('call.js: what to talk about (required radio, field name "dinner")', () => {
  for (const v of ['Referral or flyer network', 'Plus-One Dinner', 'VIP Night', 'Online search network, review tags or a website', 'Not sure yet']) {
    test(`accepts ${v}`, () => assert.equal(errorFor('dinner', { dinner: v }), ''));
  }
  // The labels from before the rename (October 22, 2026) are no longer choices on the form.
  for (const v of ['', 'Plus-One', 'vip night', 'Flyer drops', 'Flyer drops or referral network', 'Referral network or flyer drops', 'Google Ads, review tags or a website', 'referral or flyer network', 'Something else']) {
    test(`rejects ${JSON.stringify(v)}`, () => assert.notEqual(errorFor('dinner', { dinner: v }), ''));
  }
  test('the error names the question, not only dinners', () => {
    assert.equal(errorFor('dinner', { dinner: '' }), 'Choose what you would like to talk about, or Not sure yet.');
  });
});

describe('call.js: message (optional)', () => {
  test('empty is fine, very long is not', () => {
    assert.equal(errorFor('message', { message: '' }), '');
    assert.equal(errorFor('message', { message: 'x'.repeat(2000) }), '');
    assert.notEqual(errorFor('message', { message: 'x'.repeat(2001) }), '');
  });
});

describe('call.js: ?about= prefill', () => {
  // One key for each service page (named after its URL), plus the keys from before the pages were renamed
  // (October 22, 2026), which keep working and prefill the same message as the new key.
  const KEYS = {
    'patient-network': "I'm asking about the patient dinners.",
    'referral-network': "I'm asking about the referral network.",
    'flyer-network': "I'm asking about flyer drops.",
    'online-search-network': "I'm asking about Google Ads.",
    'review-tags': "I'm asking about review tags.",
    'website-design': "I'm asking about a website redesign.",
    'client-portal': "I'm asking about the client portal.",
    'patient-dinners': "I'm asking about the patient dinners.",
    'flyer-drops': "I'm asking about flyer drops.",
    'google-ads': "I'm asking about Google Ads."
  };
  test('one key for each service page, and the old keys still work', () => {
    assert.deepEqual(call.ABOUT, KEYS);
    for (const [old, now] of [['patient-dinners', 'patient-network'], ['flyer-drops', 'flyer-network'], ['google-ads', 'online-search-network']]) {
      assert.equal(call.prefillFor(`?about=${old}`, ''), call.prefillFor(`?about=${now}`, ''), `${old} and ${now} prefill the same message`);
    }
    for (const p of PAGES.filter((x) => x.tab && !['Home', 'About', 'FAQ', 'Contact'].includes(x.tab))) {
      assert.ok(Object.hasOwn(KEYS, p.url.slice(1)), `${p.url} has a key`);
    }
    for (const [key, message] of Object.entries(KEYS)) {
      assert.equal(call.aboutFromSearch(`?about=${key}`), key);
      assert.equal(call.prefillFor(`?about=${key}`, ''), message);
    }
    assert.equal(call.aboutFromSearch('?ref=x&about=Review-Tags'), 'review-tags');
    assert.equal(call.aboutFromSearch('?about=%20website-design%20'), 'website-design');
  });
  test('anything else is ignored', () => {
    for (const s of ['', '?', '?about=', '?about=seo', '?about=website-design-x', '?xabout=review-tags', '?about=%E0%A4%A', '?about=__proto__', '?about=constructor']) {
      assert.equal(call.aboutFromSearch(s), '', s);
    }
  });
  test('prefill text, only into an empty message', () => {
    assert.equal(call.prefillFor('?about=review-tags', '   '), "I'm asking about review tags.");
    assert.equal(call.prefillFor('?about=review-tags', 'My own words'), '');
    assert.equal(call.prefillFor('?about=nothing', ''), '');
    assert.equal(call.prefillFor('', ''), '');
  });
});
