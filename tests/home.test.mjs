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
  test('the sections, in the owner\'s order: in person, the portal on the green band, then the courtesy; no pricing, no map, no results', () => {
    const ids = [...main.matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['in-person', 'dashboard', 'courtesy', 'compliance', 'book']);
    assert.doesNotMatch(text(main), /\$\d/, 'no prices on the home page (pricing is its own page)');
    assert.ok(main.indexOf('hero-orb') < main.indexOf('id="in-person"'), 'the hero comes first');
  });
  test('the approved orb hero: headline, line and one driver, with no buttons', () => {
    const hero = /<section class="hero-orb"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(text(/<h1 id="hero-h">([\s\S]*?)<\/h1>/.exec(hero)[1]), 'Your in-person sales team out in your community.');
    assert.equal(text(/<p class="lede">([\s\S]*?)<\/p>/.exec(hero)[1]),
      'Our software finds the businesses that share your clients. Our people walk in and build the relationships. Their staff send you referrals, and our portal walks you through it all.');
    assert.deepEqual(links(hero).map((l) => l.href), ['#dashboard'], 'only the drivers strip, which jumps to the portal');
    assert.doesNotMatch(hero, /class="btn/, 'no buttons');
    assert.match(text(hero), /Marcus Reed delivered 2,000 pieces of marketing material\. Friendly and kind at every front desk\./, 'one driver, no promised results');
    assert.doesNotMatch(text(hero), /staff reached|sign-ups|booked/);
  });
  test('the orb: one canvas, drawn by home-orb.js, which keeps the network clear of the words', () => {
    const hero = /<section class="hero-orb"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(tags(hero, 'canvas').length, 1);
    assert.ok(attr(tags(hero, 'canvas')[0], 'aria-label'));
    assert.match(html, /<script src="\/assets\/home-orb\.js" defer><\/script>/);
    const js = read('assets/home-orb.js');
    assert.match(js, /querySelectorAll\('h1, \.lede, \.actions, \.proof-row, \.eyebrow, \.orb-hint:not\(\.gone\)'\)/);
    assert.match(js, /prefers-reduced-motion: reduce/);
    assert.match(js, /sessionStorage/, 'once opened, the network stays open for the visit');
  });
});

describe('home: the sections', () => {
  test('b. the dashboard on the green band: the screens lie tipped back and stand up flat as you scroll', () => {
    const s = sec('dashboard');
    assert.match(main, /<section class="section bg-ink owc-dash-band" aria-labelledby="dashboard-h" id="dashboard">/, 'on the green band');
    assert.equal(text(/<h2 id="dashboard-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Your drivers, your routes, and every sign-up.');
    assert.match(s, /<p class="owc-scroll-cue" aria-hidden="true"><span>Scroll<\/span>/, 'the scroll cue is decoration only');
    const stage = /<div class="owc-tilt" data-tilt>\s*<div class="pt-stage">/.exec(s);
    assert.ok(stage, 'the screens sit in the tilt wrapper');
    assert.doesNotMatch(s, /class="pt-stage reveal"/, 'no reveal transform fighting the tilt');
    const css = read('assets/site.css');
    assert.match(css, /\.owc-dash-band\{--p:1;/, 'flat by default: no JS means flat screens');
    assert.match(css, /\.owc-tilt \.pt-stage\{transform:rotateX\(calc\(\(1 - var\(--p\)\) \* 26deg\)\) scale\(calc\(\.86 \+ \.14 \* var\(--p\)\)\)/);
    assert.match(css, /\.owc-scroll-cue\{display:none;/, 'the cue shows only while the screens can move');
    assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.owc-dash-band\{--p:1 !important\}\.owc-scroll-cue\{display:none !important\}\}/);
    const js = read('assets/site.js');
    assert.match(js, /document\.querySelector\('\[data-tilt\]'\)/);
    assert.match(js, /window\.addEventListener\('scroll', tiltQueue, \{ passive: true \}\)/);
    assert.match(js, /requestAnimationFrame\(tiltUpdate\)/);
    assert.match(js, /if \(tiltBand && window\.requestAnimationFrame && !still\.matches\)/, 'nothing moves with reduced motion');
  });
  test('b. no map anywhere: no Google request, no Maps key, no map images', () => {
    assert.doesNotMatch(html, /owc-geo|id="matching"|openstreetmap/i);
    assert.doesNotMatch(read('assets/site-config.js'), /googleMap/);
    assert.doesNotMatch(read('assets/site.js'), /googleapis|googleMap|owc-geo/);
    assert.match(read('netlify.toml'), /img-src 'self' data:;/, 'the CSP allows no outside images');
    assert.doesNotMatch(read('privacy.html'), /googleMap|Google Maps/);
    assert.ok(!existsSync(new URL('assets/img/map-base-1200.jpg', ROOT)));
  });
  test('c. the staff courtesy, word for word', () => {
    const t = text(sec('courtesy'));
    assert.match(t, /The staff courtesy: the same for everyone\./);
    assert.doesNotMatch(t, /cap/i, 'every staff member can send people, so there is no cap');
    assert.ok(t.includes('from the front desk to every trainer and stylist, gets the same courtesy from your clinic'));
  });
  test('b. the dashboard: the screens and what it shows; no visit log line and no Client Portal box (it is in the header)', () => {
    const s = sec('dashboard');
    const t = text(s);
    assert.doesNotMatch(t, /Sample account/, 'no sample labels on the screens (the owner\'s call)');
    assert.match(t, /Inside your referral network portal/);
    assert.match(t, /who is driving your next route, every business they walked into/);
    for (const label of ['Stops visited', 'Staff reached', 'Referral cards handed out', 'Staff sign-ups', 'Booked by the front desk']) assert.ok(t.includes(label), label);
    assert.match(read('assets/site.css'), /\.own-stats dd\{font-family:var\(--nums\)|\.own-stats dd\{font-family/, 'the numbers use the system face');
    assert.doesNotMatch(t, /visit log/i, 'the owner took the visit log line out');
    assert.ok(!links(s).some((l) => l.href === 'https://www.ournetworkportal.com'), 'no Client Portal box in this section');
    for (const img of tags(s, 'img')) assert.match(attr(img, 'src'), /^\/assets\/img\/drivers-/, 'screens from the referral network portal');
  });
  test('no results section: no "real clinics, real numbers", no texting form, no results files', () => {
    assert.doesNotMatch(html, /id="results"|Real clinics|Oakbrook Terrace|results-updates|data-results/);
    assert.doesNotMatch(html, /results\.js/);
    assert.ok(!existsSync(new URL('assets/results.js', ROOT)));
    assert.ok(!existsSync(new URL('assets/data/results.json', ROOT)));
    assert.ok(!existsSync(new URL('updates-thanks.html', ROOT)));
  });
  test('a. in person: coffee, treats and real people, three scenes', () => {
    const s = sec('in-person');
    const t = text(s);
    assert.match(t, /Coffee, treats and a real hello\./);
    assert.equal(tags(s, 'img').length, 3);
    for (const img of tags(s, 'img')) assert.match(attr(img, 'src'), /^\/assets\/img\/visit-(treats|chat|tap)-/);
  });
  test('e. the compliance part, in writing, no medical director line, and the attorney line behind one switch that is off', () => {
    const t = text(sec('compliance'));
    assert.ok(t.includes('Every partner business signs a one-page agreement: mutual promotion, nobody is paid per referral or per patient, no patient records are shared.'));
    assert.doesNotMatch(t, /medical director/i, 'the owner\'s call: these med spas have no medical director');
    assert.ok(t.includes('Partners never see who they sent.'));
    assert.ok(t.includes("We never describe your treatments in words you haven't approved, and we make no medical claims."));
    const flagged = /<p class="owc-attorney" data-flag="attorneyReviewed" data-flag-text="attorneyReviewedText" hidden>/.test(sec('compliance'));
    assert.ok(flagged, 'the attorney line is an empty, hidden slot by default');
    assert.doesNotMatch(html, /reviewed by a healthcare attorney/i, 'the claim is not in the page while the switch is off');
    assert.match(read('assets/site-config.js'), /attorneyReviewed: false,/);
    assert.match(read('assets/site-config.js'), /attorneyReviewedText: 'The partner agreement and the courtesy terms have been reviewed by a healthcare attorney\.'/);
    assert.match(html, /<script src="\/assets\/site-config\.js" defer><\/script>\n<script src="\/assets\/site\.js" defer>/);
  });
  test('f. no dinner on the home page (pricing only)', () => {
    assert.doesNotMatch(main, /patient-network|patient dinner/i);
  });
  test('g. the final call to action, with the phone number', () => {
    const s = sec('book');
    assert.match(text(s), /Book a 15-minute call\. We'll show you your matched businesses on the call\./);
    assert.ok(links(s).some((l) => l.href === '/contact'));
    assert.ok(links(s).some((l) => l.href === 'tel:+13312716851' && /331-271-6851/.test(l.text)));
  });
});

describe('pricing page: the offer', () => {
  const p = read('pricing.html');
  const t = text(mainOf(p));
  test('the trial and the two plans', () => {
    assert.match(t, /\$450/);
    for (const [plan, price] of [['Neighborhood', '$600'], ['Community', '$1,100']]) {
      assert.match(t, new RegExp(plan), plan);
      assert.ok(t.includes(price), price);
    }
    assert.match(t, /1 route/i);
    assert.match(t, /2 routes/i);
    assert.doesNotMatch(t, /4 routes|Starter|Reach/);
    assert.match(t, /fresh-baked treats/i);
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
