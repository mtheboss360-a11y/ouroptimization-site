// Unit tests for the campaign estimate validators (assets/estimate.js).
// Zero dependencies: node:test + node:assert. Run: node --test tests/
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const v = require('../assets/estimate.js');
const html = readFileSync(new URL('../estimate.html', import.meta.url), 'utf8');

// A complete, valid submission. Individual tests override one field at a time.
const valid = Object.freeze({
  clinic: 'Example Dental',
  clinic_type: 'Dental office',
  business_type_other: '',
  address: '60540',
  contact: 'Jordan Lee',
  email: 'jordan@example.com',
  phone: '(630) 555-0142',
  website: '',
  promote: '',
  target_service: '',
  budget: '',
  target_area: '',
  notes: ''
});
const withValues = (patch) => ({ ...valid, ...patch });
const errorFor = (name, patch) => v.validateField(name, withValues(patch));

describe('module shape', () => {
  test('exports validators without touching a DOM', () => {
    assert.equal(typeof v.isWebsite, 'function');
    assert.equal(typeof v.validateAll, 'function');
    assert.equal(typeof globalThis.document, 'undefined');
  });

  test('rules cover every posted field in form order', () => {
    assert.deepEqual(v.order, [
      'clinic', 'clinic_type', 'business_type_other', 'address', 'contact', 'email', 'phone',
      'website', 'promote', 'target_service', 'budget', 'target_area', 'notes'
    ]);
  });

  test('a complete submission passes', () => {
    assert.deepEqual(v.validateAll(valid), []);
  });

  test('send timeout is 15 seconds', () => {
    assert.equal(v.TIMEOUT_MS, 15000);
  });
});

describe('website (optional)', () => {
  const accept = [
    'https://example.com?ref=google',
    'https://example.com#about',
    'example.com/about?x=1#y',
    'www.example.co.uk',
    'http://sub.example.com:8080/path/',
    'EXAMPLE.COM',
    'example.com',
    'https://example.com',
    'HTTPS://Example.com/Path',
    '  example.com  ',
    'medium.com/@someone',
    'example.com:8080',
    'my-business.example.org/services/teeth-whitening'
  ];
  for (const value of accept) {
    test(`accepts ${JSON.stringify(value)}`, () => {
      assert.equal(v.isWebsite(value), true);
      assert.equal(errorFor('website', { website: value }), '');
    });
  }

  const reject = [
    'example .com',
    'https://exa mple.com',
    'example.com/about us',
    'localhost',
    'http://localhost:3000',
    'example',
    'https://example',
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'ftp://x.com',
    'mailto:me@example.com',
    'data:text/html,hi',
    'me@example.com',
    'https://me@example.com',
    'http:example.com',
    'example.c',
    'example.123',
    '192.168.0.1',
    'https://',
    'example..com',
    '-example.com',
    'x'.repeat(290) + '.example.com'
  ];
  for (const value of reject) {
    test(`rejects ${JSON.stringify(value.length > 40 ? value.slice(0, 40) + '…' : value)}`, () => {
      assert.equal(v.isWebsite(value), false);
      assert.notEqual(errorFor('website', { website: value }), '');
    });
  }

  test('empty is fine because the field is optional', () => {
    assert.equal(errorFor('website', { website: '' }), '');
    assert.equal(errorFor('website', { website: '   ' }), '');
  });
});

describe('email (required)', () => {
  for (const value of ['jordan@example.com', 'Jordan.Lee+estimate@Example.co.uk', 'a@b.io', '  me@example.com ']) {
    test(`accepts ${JSON.stringify(value)}`, () => {
      assert.equal(v.isEmail(value), true);
      assert.equal(errorFor('email', { email: value }), '');
    });
  }
  for (const value of ['jordan', 'jordan@', '@example.com', 'jordan@example', 'jordan@localhost',
    'jor dan@example.com', 'a@b@example.com', 'jordan@example.c', '.jordan@example.com',
    'jordan..lee@example.com', 'jordan@exa_mple.com', 'jordan@example.com/path']) {
    test(`rejects ${JSON.stringify(value)}`, () => {
      assert.equal(v.isEmail(value), false);
      assert.notEqual(errorFor('email', { email: value }), '');
    });
  }
  test('empty is an error', () => {
    assert.match(errorFor('email', { email: '' }), /email/i);
  });
});

describe('phone (optional, US)', () => {
  const accept = [
    '(630) 555-0142', '630-555-0142', '630.555.0142', '630 555 0142', '6305550142',
    '+1 630 555 0142', '+1 (630) 555-0142', '1-630-555-0142', '16305550142', '+16305550142'
  ];
  for (const value of accept) {
    test(`accepts ${JSON.stringify(value)}`, () => {
      assert.equal(v.isPhone(value), true);
      assert.equal(errorFor('phone', { phone: value }), '');
    });
  }
  const reject = [
    '555-0142', '630-555-014', '630-555-01422', '+44 20 7946 0958', '+2 630 555 0142',
    '2-630-555-0142', '630-555-01ab', 'call me', '(030) 555-0142', '(630) 055-0142',
    '630+555+0142', '630/555/0142'
  ];
  for (const value of reject) {
    test(`rejects ${JSON.stringify(value)}`, () => {
      assert.equal(v.isPhone(value), false);
      assert.notEqual(errorFor('phone', { phone: value }), '');
    });
  }
  test('empty is fine because the field is optional', () => {
    assert.equal(errorFor('phone', { phone: '' }), '');
    assert.equal(errorFor('phone', { phone: '   ' }), '');
    assert.equal(errorFor('phone', { phone: undefined }), '');
    assert.deepEqual(v.validateAll(withValues({ phone: '' })), []);
  });
  test('a number that is filled in must still be valid', () => {
    assert.match(errorFor('phone', { phone: '555-0142' }), /phone number/i);
    assert.deepEqual(v.validateAll(withValues({ phone: '555-0142' })).map((p) => p.name), ['phone']);
  });
});

describe('required fields', () => {
  for (const name of ['clinic', 'clinic_type', 'address', 'contact', 'email']) {
    test(`${name} is required`, () => {
      assert.notEqual(errorFor(name, { [name]: '' }), '');
      assert.notEqual(errorFor(name, { [name]: '   ' }), '', 'whitespace only does not count');
      const names = v.validateAll(withValues({ [name]: '' })).map((p) => p.name);
      assert.deepEqual(names, [name]);
    });
  }

  test('an empty form lists every required field, in form order', () => {
    const empty = Object.fromEntries(v.order.map((n) => [n, '']));
    assert.deepEqual(v.validateAll(empty).map((p) => p.name),
      ['clinic', 'clinic_type', 'address', 'contact', 'email']);
  });

  test('business type must be one of the listed options', () => {
    for (const type of v.BUSINESS_TYPES) assert.equal(errorFor('clinic_type', { clinic_type: type }), '');
    assert.notEqual(errorFor('clinic_type', { clinic_type: 'Car wash' }), '');
  });

  test('business location accepts a city or a ZIP code', () => {
    for (const ok of ['60540', '60540-1234', 'Naperville', 'Naperville, IL', 'Oak Park 60302', 'La Grange']) {
      assert.equal(errorFor('address', { address: ok }), '', ok);
    }
    for (const bad of ['605', '6054012', '60540-12', 'x', '12']) {
      assert.notEqual(errorFor('address', { address: bad }), '', bad);
    }
  });

  test('names need at least two characters', () => {
    assert.notEqual(errorFor('clinic', { clinic: 'A' }), '');
    assert.notEqual(errorFor('contact', { contact: 'J' }), '');
    assert.equal(errorFor('contact', { contact: 'Jo' }), '');
  });

  test('long values are capped', () => {
    assert.notEqual(errorFor('clinic', { clinic: 'x'.repeat(151) }), '');
    assert.notEqual(errorFor('address', { address: 'Naperville '.repeat(20) }), '');
  });
});

describe('"Something else" business type', () => {
  test('requires a description only when "Something else" is chosen', () => {
    assert.equal(errorFor('business_type_other', { clinic_type: 'Med spa', business_type_other: '' }), '');
    assert.match(errorFor('business_type_other', { clinic_type: v.OTHER_TYPE, business_type_other: '' }),
      /what type of business/i);
    assert.notEqual(errorFor('business_type_other', { clinic_type: v.OTHER_TYPE, business_type_other: '  ' }), '');
  });

  test('the error clears once the description is filled', () => {
    const before = v.validateAll(withValues({ clinic_type: v.OTHER_TYPE, business_type_other: '' }));
    assert.deepEqual(before.map((p) => p.name), ['business_type_other']);
    const after = v.validateAll(withValues({ clinic_type: v.OTHER_TYPE, business_type_other: 'Massage studio' }));
    assert.deepEqual(after, []);
  });

  test('switching away from "Something else" drops the requirement', () => {
    assert.deepEqual(v.validateAll(withValues({ clinic_type: 'Chiropractor', business_type_other: '' })), []);
  });

  test('the dependency is declared so the page rechecks it when the type changes', () => {
    assert.deepEqual(v.dependents.clinic_type, ['business_type_other']);
  });

  test('the error sits on the description field, not on the select', () => {
    assert.equal(errorFor('clinic_type', { clinic_type: v.OTHER_TYPE, business_type_other: '' }), '');
  });
});

describe('optional fields', () => {
  for (const name of ['phone', 'website', 'promote', 'target_service', 'budget', 'target_area', 'notes']) {
    test(`${name} accepts empty`, () => {
      assert.equal(errorFor(name, { [name]: '' }), '');
      assert.equal(errorFor(name, { [name]: undefined }), '');
    });
  }

  test('length limits on free-text optional fields', () => {
    assert.equal(errorFor('target_service', { target_service: 'x'.repeat(150) }), '');
    assert.notEqual(errorFor('target_service', { target_service: 'x'.repeat(151) }), '');
    assert.equal(errorFor('target_area', { target_area: 'x'.repeat(300) }), '');
    assert.notEqual(errorFor('target_area', { target_area: 'x'.repeat(301) }), '');
    assert.equal(errorFor('notes', { notes: 'x'.repeat(2000) }), '');
    assert.notEqual(errorFor('notes', { notes: 'x'.repeat(2001) }), '');
  });
});

describe('package links (?package=digital)', () => {
  const accept = [
    '?package=digital', 'package=digital', '?utm_source=mailer&package=digital', '?package=Digital',
    '?package=DIGITAL', '?package=%20digital%20', '?package=+digital', '?package=digital#form',
    '?package=digital&package=print'
  ];
  for (const search of accept) {
    test(`recognizes ${JSON.stringify(search)}`, () => {
      assert.equal(v.packageFromSearch(search), 'digital');
    });
  }

  const ignore = [
    '', '?', '?package', '?package=', '?package=print', '?package=digitals', '?mypackage=digital',
    '?package=__proto__', '?package=toString', '?package=constructor', '?package=%E0%A4%A',
    '?package=print&package=digital', undefined, null
  ];
  for (const search of ignore) {
    test(`ignores ${JSON.stringify(search) ?? String(search)}`, () => {
      assert.equal(v.packageFromSearch(search), '');
    });
  }

  test('the digital package ticks Local SEO, Facebook & Instagram and Offers & promotions', () => {
    assert.deepEqual(Object.keys(v.PACKAGES), ['digital']);
    assert.equal(v.PACKAGES.digital.name, 'Digital Growth Package');
    assert.deepEqual(v.PACKAGES.digital.channels, ['Local SEO', 'Facebook and Instagram ads', 'Offers and promotions']);
  });

  test('every prefilled channel is an existing checkbox in the static HTML (no new form fields)', () => {
    const values = [...html.matchAll(/<input type="checkbox" name="channels\[\]" value="([^"]+)">/g)].map((m) => m[1]);
    assert.ok(values.length >= 3, 'channel checkboxes found');
    for (const pkg of Object.values(v.PACKAGES)) {
      for (const channel of pkg.channels) assert.ok(values.includes(channel), `"${channel}" is a checkbox value`);
    }
  });

  test('the package line is in the static HTML, hidden until the script shows it, with the small print', () => {
    const m = /<p\b[^>]*\bid="est-package"[^>]*>([\s\S]*?)<\/p>/.exec(html);
    assert.ok(m, 'the #est-package line exists');
    assert.match(m[0], /\bdata-package="digital"/);
    assert.match(m[0], /\shidden>/);
    assert.match(m[1], /You&rsquo;re asking about the Digital Growth Package \(\$900\/month\)\./);
    assert.match(m[1], /Ad spend and platform fees are separate and paid directly to Google, Meta and Groupon\./);
    assert.ok(html.indexOf('id="est-package"') < html.indexOf('<form name="campaign-estimate"'), 'the line sits above the form');
    assert.doesNotMatch(m[0], /<input|<select|<textarea|\bname=/, 'the line adds no form field');
  });
});
