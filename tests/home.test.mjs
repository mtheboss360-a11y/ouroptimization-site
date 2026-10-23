// The home page, section by section, against the owner's brief of October 23, 2026 and their notes on the preview, and the pricing page's offer.
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
  test('the sections, in the owner\'s order: the map, then the dashboard, then the courtesy', () => {
    const ids = [...main.matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['matching', 'dashboard', 'courtesy', 'results', 'try', 'compliance', 'dinner', 'book']);
    assert.ok(main.indexOf('owc-hero') < main.indexOf('id="matching"'), 'the hero comes first');
  });
  test('headline, sub and line, with no buttons', () => {
    const hero = /<section class="hero owc-hero"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(text(/<h1 id="hero-h">([\s\S]*?)<\/h1>/.exec(hero)[1]), 'Your Organic Growth Team.');
    assert.match(text(hero), /We put your brand into the community\./);
    assert.match(text(hero), /We get your clinic recommended by the staff of the gyms, salons and boutiques near you, and show you every lead and booking that comes from it\./);
    assert.deepEqual(links(hero), [], 'no buttons or links in the hero');
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
    assert.ok(!hasAttr(video, 'poster'), 'no poster in the markup: phones never download the largest still twice');
    assert.match(read('assets/site.js'), /heroVideo\.poster = still\.currentSrc/, 'the still on screen becomes the poster');
    assert.ok(!hasAttr(video, 'src'), 'the video is attached by site.js after load, never in the markup');
    const js = read('assets/site.js');
    assert.match(js, /prefers-reduced-motion: reduce/);
    assert.match(js, /addEventListener\('error', dropVideo/);
  });
});

describe('home: the sections', () => {
  test('b. business matching: one line, a real map with the five businesses and the route, no numbers', () => {
    const s = sec('matching');
    assert.equal(text(/<h2 id="match-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'We map the businesses around your clinic.');
    assert.doesNotMatch(text(s), /Example|software/i, 'no Example label, nothing about the software');
    assert.doesNotMatch(text(s), /\d+\s?%|score/i);
    const fig = /<figure class="owc-geo[\s\S]*?<\/figure>/.exec(s)[0];
    assert.equal(attr(tags(fig, 'figure')[0], 'data-geo-zoom'), '16');
    assert.equal(attr(tags(fig, 'figure')[0], 'data-geo-size'), '640x427', 'the Google Static Maps frame the overlays are drawn in');
    assert.deepEqual(tags(fig, 'source').map((t) => attr(t, 'type')), ['image/avif', 'image/webp']);
    const base = tags(fig, 'img').find((t) => /owc-geo-base/.test(t));
    assert.match(attr(base, 'alt'), /real streets/);
    const pins = tags(fig, 'img').filter((t) => /owc-geo-pin/.test(t));
    assert.equal(pins.length, 6, 'the clinic and five businesses');
    assert.equal(pins.filter((t) => /owc-geo-pin--home/.test(t)).length, 1);
    for (const t of pins) {
      assert.equal(attr(t, 'alt'), '');
      assert.ok(existsSync(new URL('.' + attr(t, 'src'), ROOT)), attr(t, 'src'));
    }
    assert.match(fig, /<path class="owc-geo-route" pathLength="1000" d="M[\d. ]+"/);
    assert.ok(links(fig).some((l) => l.href === 'https://www.openstreetmap.org/copyright'), 'the OpenStreetMap credit');
  });
  test('b. the Google Maps option: off until a key is set, then a styled static image under the same overlays', () => {
    const cfg = read('assets/site-config.js');
    assert.match(cfg, /googleMapsKey: '',/, 'no key in the repo');
    const js = read('assets/site.js');
    assert.match(js, /config\.googleMap = mapsKey !== ''/);
    assert.match(js, /maps\.googleapis\.com\/maps\/api\/staticmap/);
    assert.match(js, /addEventListener\('error'/);
    assert.match(read('netlify.toml'), /img-src 'self' data: https:\/\/maps\.googleapis\.com;/);
    assert.match(read('privacy.html'), /<p data-flag="googleMap" data-flag-text="googleMapText" hidden><\/p>/, 'the privacy line appears only with the map');
    assert.doesNotMatch(read('privacy.html'), /comes from Google Maps/, 'and is not in the page while the key is empty');
  });
  test('c. the staff courtesy, word for word', () => {
    const t = text(sec('courtesy'));
    assert.match(t, /The staff courtesy: you set it and cap it\./);
    assert.ok(t.includes("For your trial the default courtesy is a complimentary consultation, which costs you only a few minutes and often turns into a booking itself. You can choose something else, like a complimentary add-on or a product sample, and you set a cap, for example up to 3 staff per business, so a route means at most 15 courtesies. It's the same for every staff member and is given whether or not they ever send anyone, which keeps it a courtesy and not a payment for referrals."));
  });
  test('d. the dashboard: the screens, what it shows, the visit log and the Client Portal', () => {
    const s = sec('dashboard');
    const t = text(s);
    assert.doesNotMatch(t, /Sample account/, 'no sample labels on the screens (the owner\'s call)');
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
    const flagged = /<p class="owc-attorney" data-flag="attorneyReviewed" data-flag-text="attorneyReviewedText" hidden>/.test(sec('compliance'));
    assert.ok(flagged, 'the attorney line is an empty, hidden slot by default');
    assert.doesNotMatch(html, /reviewed by a healthcare attorney/i, 'the claim is not in the page while the switch is off');
    assert.match(read('assets/site-config.js'), /attorneyReviewed: false,/);
    assert.match(read('assets/site-config.js'), /attorneyReviewedText: 'The partner agreement and the courtesy terms have been reviewed by a healthcare attorney\.'/);
    assert.match(html, /<script src="\/assets\/site-config\.js" defer><\/script>\n<script src="\/assets\/results\.js" defer><\/script>\n<script src="\/assets\/site\.js" defer>/);
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
