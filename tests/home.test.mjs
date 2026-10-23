// The home page, section by section, against the owner's brief of October 23, 2026, and the pricing page's offer.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { read, text, attr, hasAttr, tags, byId, mainOf, links, FORBIDDEN, ROOT } from './html.mjs';

const html = read('index.html');
const main = mainOf(html);
const sec = (id) => {
  const s = byId(html, id);
  assert.ok(s, `#${id} exists`);
  return s;
};

describe('home: order and hero', () => {
  test('the sections, in the brief\'s order', () => {
    const ids = [...main.matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['how-it-works', 'matching', 'courtesy', 'dashboard', 'results', 'try', 'compliance', 'who', 'dinner', 'book']);
    assert.ok(main.indexOf('owc-hero') < main.indexOf('id="how-it-works"'), 'the hero comes first');
  });
  test('headline, sub, line and the two buttons', () => {
    const hero = /<section class="hero owc-hero"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(text(/<h1 id="hero-h">([\s\S]*?)<\/h1>/.exec(hero)[1]), 'Your Organic Growth Team.');
    assert.match(text(hero), /We put your brand into the community\./);
    assert.match(text(hero), /We get your clinic recommended by the staff of the gyms, salons and boutiques near you, and show you every lead and booking that comes from it\./);
    const btns = links(hero).filter((l) => /class="btn/.test(l.tag)).map((l) => [l.text, l.href]);
    assert.deepEqual(btns, [['Book a 15-minute call', '/contact'], ['See a sample dashboard', '#dashboard']]);
  });
  test('the hero visual: responsive AVIF and WebP, first-screen priority, and a video slot that works without a video', () => {
    const hero = /<section class="hero owc-hero"[\s\S]*?<\/section>/.exec(main)[0];
    const sources = tags(hero, 'source');
    assert.deepEqual(sources.map((s) => attr(s, 'type')), ['image/avif', 'image/webp']);
    for (const s of sources) assert.equal(attr(s, 'srcset').split(',').length, 4, 'four widths');
    const img = tags(hero, 'img')[0];
    assert.equal(attr(img, 'fetchpriority'), 'high');
    assert.ok(!hasAttr(img, 'loading'), 'never lazy');
    assert.ok(attr(img, 'sizes'));
    const video = tags(hero, 'video')[0];
    assert.equal(attr(video, 'data-src'), '/assets/video/van-route.mp4');
    for (const a of ['muted', 'loop', 'playsinline']) assert.ok(hasAttr(video, a), a);
    assert.equal(attr(video, 'preload'), 'none');
    assert.ok(existsSync(new URL(attr(video, 'poster').slice(1), ROOT)), 'the still is the poster');
    assert.ok(!hasAttr(video, 'src'), 'the video is attached by site.js after load, never in the markup');
    const js = read('assets/site.js');
    assert.match(js, /prefers-reduced-motion: reduce/);
    assert.match(js, /addEventListener\('error', dropVideo/);
  });
});

describe('home: sections a to j', () => {
  test('a. how it works: the four steps, word for word', () => {
    const steps = [...sec('how-it-works').matchAll(/<li>[\s\S]*?<h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/li>/g)].map((m) => [text(m[1]), text(m[2])]);
    assert.deepEqual(steps.map((s) => s[0]), ['We match you.', 'We run your routes.', 'Every staff member gets a code.', 'Every lead lands in your dashboard.']);
    assert.equal(steps[0][1], "Our business matching software maps the businesses around your clinic and ranks the non-competing ones that share your customers, including ones you don't already know. You approve the list before any visit, and we skip any business you already work with unless you ask.");
    assert.equal(steps[1][1], 'A rep visits a route of 5 matched businesses and introduces your clinic to their staff.');
    assert.equal(steps[2][1], 'Each staff member we meet gets a personal tap-and-scan code (NFC tag and QR). A tap opens your first-visit offer, tagged with who sent it.');
    assert.equal(steps[3][1], 'Each sign-up appears in your client portal right away: name, phone, the service they asked about, and which business and staff member sent them, ready for your front desk to call.');
  });
  test('b. business matching: the illustrated map, labelled Example, with no numbers', () => {
    const s = sec('matching');
    assert.match(text(s), /Business matching, built for your clinic\./);
    assert.match(s, /<span class="owc-tag owc-map-tag">Example<\/span>/);
    assert.match(text(/<figcaption>([\s\S]*?)<\/figcaption>/.exec(s)[1]), /^Example:/);
    assert.doesNotMatch(text(s).replace(/5 matched|five matched/gi, ''), /\d+\s?%|score/i);
  });
  test('c. the staff courtesy, word for word', () => {
    const t = text(sec('courtesy'));
    assert.match(t, /The staff courtesy: you set it and cap it\./);
    assert.ok(t.includes("For your trial the default courtesy is a complimentary consultation, which costs you only a few minutes and often turns into a booking itself. You can choose something else, like a complimentary add-on or a product sample, and you set a cap, for example up to 3 staff per business, so a route means at most 15 courtesies. It's the same for every staff member and is given whether or not they ever send anyone, which keeps it a courtesy and not a payment for referrals."));
  });
  test('d. the dashboard: sample screens, what it shows, the visit log and the Client Portal', () => {
    const s = sec('dashboard');
    const t = text(s);
    assert.match(t, /Sample account, fictional clinic/);
    assert.match(t, /routes completed, businesses visited, codes active, the leads list, and leads and bookings by source, month by month/);
    assert.match(t, /After every field day you also get a written visit log within 5 business days\./);
    assert.ok(links(s).some((l) => l.href === 'https://www.ournetworkportal.com' && l.text === 'Client Portal'));
    for (const img of tags(s, 'img')) assert.match(attr(img, 'src'), /^\/assets\/img\/portal-/);
  });
  test('e. results: read from results.json, empty for now, the empty message and no example numbers', () => {
    const s = sec('results');
    assert.match(s, /data-results="\/assets\/data\/results\.json"/);
    assert.match(text(s), /Our first routes are running now with a recovery clinic in Oakbrook Terrace\. Leave your number and we'll text you the results as they come in, good or bad\./);
    assert.match(s, /<ul class="owc-results-list" hidden><\/ul>/, 'no result cards in the markup');
    const data = JSON.parse(read('assets/data/results.json'));
    assert.deepEqual(data.clinics, [], 'never filled with example numbers');
    assert.match(html, /<script src="\/assets\/results\.js" defer><\/script>/);
    assert.match(read('assets/results.js'), /textContent/, 'values go in as text, never as HTML');
    assert.doesNotMatch(read('assets/results.js'), /innerHTML/);
  });
  test('f. the pricing teaser', () => {
    const s = sec('try');
    assert.match(text(s), /Try it for one month: \$250\./);
    assert.ok(links(s).some((l) => l.href === '/pricing'));
  });
  test('g. the compliance part, in writing, and the attorney line behind one switch that is off', () => {
    const t = text(sec('compliance'));
    assert.ok(t.includes('Every partner business signs a one-page agreement: mutual promotion, nobody is paid per referral or per patient, no patient records are shared.'));
    assert.ok(t.includes('We send it and the courtesy terms to your medical director before you sign anything.'));
    assert.ok(t.includes("We never describe your treatments in words you haven't approved, and we make no medical claims."));
    const flagged = /<p class="owc-attorney" data-flag="attorneyReviewed" hidden>/.test(sec('compliance'));
    assert.ok(flagged, 'the attorney line is hidden by default');
    assert.match(read('assets/site-config.js'), /attorneyReviewed: false/);
    assert.match(html, /<script src="\/assets\/site-config\.js" defer><\/script>\n<script src="\/assets\/results\.js" defer><\/script>\n<script src="\/assets\/site\.js" defer>/);
  });
  test('h. who we are, with the Grace Pediatrics client work', () => {
    const t = text(sec('who'));
    assert.match(t, /A local company in Chicago's western suburbs\./);
    assert.match(t, /You deal with the owner directly by phone or text\./);
    assert.match(t, /Grace Pediatrics in Glendale Heights/);
    assert.match(t, /flyers, gift tins, an event table and QR codes that tracked every scan/);
  });
  test('i. the add-on card leads to the dinner page', () => {
    const s = sec('dinner');
    assert.match(text(s), /Add-on.*A private patient dinner\..*Quoted per event\./);
    assert.ok(links(s).some((l) => l.href === '/patient-network'));
  });
  test('j. the final call to action, with the phone number', () => {
    const s = sec('book');
    assert.match(text(s), /Book a 15-minute call\. We'll show you your matched businesses on the call\./);
    assert.ok(links(s).some((l) => l.href === '/contact'));
    assert.ok(links(s).some((l) => l.href === 'tel:+13312716851' && /331-271-6851/.test(l.text)));
  });
});

describe('pricing page: the offer', () => {
  const p = read('pricing.html');
  const t = text(mainOf(p));
  test('the trial and the three plans', () => {
    assert.match(t, /\$250/);
    for (const [plan, price] of [['Starter', '$250'], ['Growth', '$400'], ['Reach', '$800']]) {
      assert.match(t, new RegExp(plan), plan);
      assert.ok(t.includes(price), price);
    }
    assert.match(t, /1 route/i);
    assert.match(t, /2 routes/i);
    assert.match(t, /4 routes/i);
  });
  test('the two trial guarantees', () => {
    assert.match(t, /30 days/);
    assert.match(t, /45 days/);
    assert.match(t, /fewer than 5 tracked sign-ups/);
    assert.match(t, /keep the partner relationships/i);
  });
  test('terms, who supplies what, add-ons priced on a call', () => {
    assert.match(t, /month to month/i);
    assert.match(t, /30 days'? notice/i);
    assert.match(t, /never moves with referrals, leads or bookings/i);
    assert.match(t, /printed materials/i);
    assert.match(t, /at no charge/i);
    assert.match(t, /priced on a call/i);
    for (const href of ['/online-search-network', '/review-tags', '/website-design', '/patient-network']) assert.ok(links(p).some((l) => l.href === href), href);
  });
  test('no old price or old starter item', () => {
    for (const w of FORBIDDEN) assert.ok(!p.includes(w), w);
    assert.doesNotMatch(t, /\$200|\$2,000/);
  });
});
