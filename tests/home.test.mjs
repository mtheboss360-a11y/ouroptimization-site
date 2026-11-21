// The home page and the pricing page of the simplified site (the owner's brief of November 21, 2026): the owner's
// plain-language copy, one portal screenshot, a short FAQ in place of the Field Team, Industries, About and FAQ pages,
// and confirmed prices only.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { read, text, attr, tags, byId, mainOf, links, FORBIDDEN, ROOT, MERGED } from './html.mjs';

const html = read('index.html');
const main = mainOf(html);
const sec = (id) => {
  const s = byId(html, id);
  assert.ok(s, `#${id} exists`);
  return s;
};
const PLACEHOLDER = /\[[A-Z][A-Z0-9 :,'.-]*\]/;

describe('home: the owner\'s copy (November 21, 2026)', () => {
  test('the sections, in order: the hero, How it works, What you get, the questions, the call', () => {
    const ids = [...main.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['how-it-works', 'what-you-get', 'faq', 'book']);
    assert.ok(main.indexOf('class="s-hero"') < main.indexOf('id="how-it-works"'), 'the hero comes first');
  });
  test('the hero: the headline, the intro and the two buttons', () => {
    const hero = /<section class="s-hero"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(text(/<h1 id="hero-h">([\s\S]*?)<\/h1>/.exec(hero)[1]), 'More local customers, through real connections.');
    assert.equal(text(/<p class="s-lede">([\s\S]*?)<\/p>/.exec(hero)[1]),
      'Our team visits nearby businesses, introduces your practice, and leaves your approved materials. Your portal shows visits and sign-ups.');
    assert.deepEqual(links(hero).map((l) => [l.text, l.href, /btn-primary/.test(l.tag)]), [['Book a call', '/contact', true], ['View pricing', '/pricing', false]]);
  });
  test('How it works: the three steps, word for word', () => {
    const steps = [...sec('how-it-works').matchAll(/<li><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/li>/g)].map((m) => [text(m[1]), text(m[2])]);
    assert.deepEqual(steps, [
      ['Choose nearby businesses', 'We find local businesses that may share your customers. You approve the list before we visit.'],
      ['We visit in person', 'Our team introduces your business and leaves approved materials.'],
      ['Track results', 'Your portal shows visits, staff cards, and sign-ups.']
    ]);
    assert.match(sec('how-it-works'), /<ol class="s-steps">/, 'a numbered list');
  });
  test('What you get: the four items, beside the one portal screenshot', () => {
    const s = sec('what-you-get');
    assert.deepEqual([...s.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1])),
      ['In-person visits', 'Approved materials', 'Trackable staff cards', 'Access to your client portal']);
    assert.equal(tags(main, 'figure').length, 1, 'one screenshot on the page');
    assert.equal(tags(main, 'img').length, 1);
    const img = tags(s, 'img')[0];
    assert.equal(attr(img, 'src'), '/assets/img/portal2-routes-1280.jpg');
    assert.match(attr(img, 'alt'), /^Screenshot of the portal's sample account: totals for stops visited/);
    for (const m of main.matchAll(/srcset="([^"]+)"/g)) {
      for (const u of m[1].split(',').map((x) => x.trim().split(' ')[0])) {
        assert.match(u, /^\/assets\/img\/portal2-(phone-)?routes-\d+\.(avif|webp|jpg)$/, u);
        assert.ok(existsSync(new URL('.' + u, ROOT)), u);
      }
    }
  });
  test('no decoration: no canvas, no icons, no illustrations, no scroll animation, no ornaments', () => {
    assert.doesNotMatch(main, /<canvas|<svg|class="[^"]*\b(reveal|eyebrow|rule|dn-line)\b/);
    assert.doesNotMatch(html, /home-wave|match-orb|hero-wave|data-ptour|own-stats|class="sprite"/);
    for (const f of ['assets/home-wave.js', 'assets/match-orb.js']) assert.ok(!existsSync(new URL(f, ROOT)), f);
    assert.match(html, /<script src="\/assets\/site-config\.js" defer><\/script>\n<script src="\/assets\/site\.js" defer><\/script>\n<\/body>/);
  });
  test('the questions: who it is for (the eight industries), partners, visits, pay, healthcare', () => {
    const s = sec('faq');
    assert.deepEqual([...s.matchAll(/<summary>([\s\S]*?)<span/g)].map((m) => text(m[1])), [
      'Who is this for?', 'Which businesses do you visit?', 'What do you bring on a visit?',
      'Are partner businesses paid for referrals?', 'What about healthcare practices?'
    ]);
    const who = text(byId(html, 'who'));
    for (const i of ['med spas and wellness', 'dental', 'chiropractic and physical therapy', 'gyms and fitness studios', 'salons and barbershops', 'restaurants and cafes', 'home services', 'auto shops']) assert.ok(who.includes(i), i);
    assert.match(who, /Chicago's western suburbs/);
    assert.match(text(byId(html, 'partners')), /Each partner agrees to promote one business of your kind: yours\./);
    assert.match(text(byId(html, 'paid')), /nobody is paid per referral or per customer\. Partners never see who signed up\. Your team makes the calls\./);
  });
  test('compliance: the treats sentence, the healthcare sentence, the TODO comment and the switched-off HIPAA slot', () => {
    const visits = text(byId(html, 'visits'));
    assert.ok(visits.includes('Treats are shared with the whole staff on every visit, whether or not anyone refers a customer.'));
    assert.ok(visits.includes('so you can see which partnerships are working'), 'the cards measure the campaign, never reward anyone');
    const hc = byId(html, 'healthcare');
    assert.ok(text(hc).includes('Partner programs for healthcare practices are reviewed for compliance with applicable state rules before launch.'));
    assert.match(text(hc), /We never receive patient records, and we make no medical or health claims\./);
    assert.match(html, /<!-- TODO: attorney review of courtesy program before publishing healthcare pages -->\n      <details id="healthcare">/);
    assert.match(hc, /<p class="hipaa-line" data-flag="hipaaConfirmed" data-flag-text="hipaaText" hidden><span><\/span><\/p>/);
    assert.match(read('assets/site-config.js'), /hipaaConfirmed: false,\n  hipaaText: ''/, 'no HIPAA sentence until the owner confirms it');
    assert.doesNotMatch(text(main), /HIPAA|compliant|attorney|gift card|cash/i);
  });
  test('each detail is explained once: coffee and treats, the tap and QR cards, only in "What do you bring on a visit?"', () => {
    const outside = text(main.replace(/<details id="visits">[\s\S]*?<\/details>/, ''));
    assert.doesNotMatch(outside, /coffee|treat|tap|QR|NFC|scan/i);
    assert.equal((text(main).match(/coffee/gi) || []).length, 1);
    assert.equal((text(main).match(/QR/g) || []).length, 1);
  });
  test('no prices, no dinner and no placeholders on the home page', () => {
    assert.doesNotMatch(text(main), /\$\d/, 'prices live on the pricing page');
    assert.doesNotMatch(main, /patient-network|patient dinner/i);
    assert.doesNotMatch(html, PLACEHOLDER);
    for (const w of FORBIDDEN) assert.ok(!html.includes(w), w);
  });
  test('the call band: Book a call, View pricing, and the phone number', () => {
    const s = sec('book');
    assert.deepEqual(links(s).map((l) => [l.text, l.href]), [['Book a call', '/contact'], ['View pricing', '/pricing'], ['331-271-6851', 'tel:+13312716851']]);
    assert.match(text(s), /You'll talk to the owner\./);
  });
  test('the head: title, description with the six towns, canonical, and the business data in the new words', () => {
    assert.match(html, /<title>Our Wellness Network \| More Local Customers, Through Real Connections<\/title>/);
    const d = attr(/<meta name="description"[^>]*>/.exec(html)[0], 'content');
    for (const town of ['Oak Brook', 'Lombard', 'Elmhurst', 'Naperville', 'Downers Grove', 'Hinsdale']) assert.ok(d.includes(town), town);
    const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
    assert.equal(ld.slogan, 'More local customers, through real connections.');
    assert.doesNotMatch(JSON.stringify(ld), /field sales/i);
  });
});

describe('pricing page: confirmed prices only (November 21, 2026)', () => {
  const p = read('pricing.html');
  const pm = mainOf(p);
  const t = text(pm);
  test('the first month and the two plans', () => {
    const plans = [...pm.matchAll(/<li class="s-plan[^"]*"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]));
    assert.equal(plans.length, 3);
    assert.match(plans[0], /^First month \$450 all in One route: 5 nearby businesses you approve, visited in person\./);
    assert.equal(plans[1], 'Neighborhood $600 a month 1 route a month.');
    assert.equal(plans[2], 'Community $1,100 a month 2 routes a month.');
    assert.match(t, /A route is 5 matched businesses near you, visited in person by our team\. Plans start after your first month\./);
  });
  test('the guarantee, word for word, and nothing more promised', () => {
    assert.match(t, /Guarantee: if we haven't visited all 5 businesses and set up your codes within 30 days, the \$450 comes back\. You keep the partner relationships either way\./);
    assert.doesNotMatch(t, /45 days|tracked sign-ups|both guarantees|two (trial |written )?guarantees/i);
  });
  test('what every plan includes, and the terms in three lines', () => {
    assert.deepEqual([...byId(p, 'included').split('id="terms"')[0].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1])), [
      'In-person visits', 'Approved materials, left at each business (you supply the printing)', 'Trackable staff cards, supplied at no charge',
      "Coffee and treats for each partner's staff on every visit", 'Access to your client portal'
    ]);
    assert.match(t, /Nothing renews on its own after the first month\./);
    assert.match(t, /Plans run month to month, with 30 days' notice\./);
    assert.match(t, /It never changes with referrals, leads or bookings, and nobody is paid per referral or per customer\./);
    assert.ok(links(p).some((l) => l.href === '/terms#tm-prices'));
    assert.equal((t.match(/coffee/gi) || []).length, 1, 'coffee and treats, once');
    assert.doesNotMatch(t, /tap-to-schedule|QR|NFC|tap-and-scan/i, 'the cards are explained on the home page');
  });
  test('the add-ons, priced on a call, each linking to its page', () => {
    assert.match(t, /Add-ons, priced on a call/);
    for (const href of ['/online-search-network', '/review-tags', '/website-design', '/patient-network']) assert.ok(links(pm).some((l) => l.href === href), href);
  });
  test('no placeholders, no founding program, no minimum term, no drumroll', () => {
    assert.doesNotMatch(p, PLACEHOLDER);
    assert.doesNotMatch(t, /founding|minimum term|starting price|drumroll/i);
    assert.doesNotMatch(pm, /<svg|pr-drum|class="[^"]*\breveal\b/);
    for (const w of FORBIDDEN) assert.ok(!p.includes(w), w);
    assert.doesNotMatch(t, /\$200|\$2,000/);
  });
  test('the call band goes to the form with the pricing message', () => {
    assert.deepEqual(links(byId(p, 'book')).map((l) => [l.text, l.href]), [['Book a call', '/contact?about=pricing']]);
  });
});

describe('the merged pages (November 21, 2026)', () => {
  const toml = read('netlify.toml');
  const rules = [...toml.matchAll(/\[\[redirects\]\]\n  from = "([^"]+)"\n  to = "([^"]+)"\n  status = (\d+)(\n  force = true)?/g)].map((m) => ({ from: m[1], to: m[2], status: Number(m[3]), force: !!m[4] }));
  test('the pages are gone, with the generator and its data', () => {
    for (const f of ['field-team.html', 'about.html', 'faq.html', 'referral-network.html', 'industries', 'tools']) assert.ok(!existsSync(new URL(f, ROOT)), f);
  });
  test('each old address 301s to the part of the home page that answers it', () => {
    for (const [from, to] of Object.entries(MERGED)) {
      const r = rules.find((x) => x.from === from) || rules.find((x) => x.from === '/industries/*' && from.startsWith('/industries/'));
      assert.ok(r, from);
      assert.equal(r.to, to, from);
      assert.equal(r.status, 301, from);
      assert.ok(r.force, from);
    }
    for (const id of ['how-it-works', 'faq', 'who']) assert.ok(byId(html, id) !== null, id);
  });
  test('no redirect points at a page that is gone', () => {
    for (const r of rules) assert.ok(!Object.keys(MERGED).includes(r.to.split(/[?#]/)[0]) && !/^\/industries\//.test(r.to), `${r.from} -> ${r.to}`);
  });
});
