// The pricing page and the sample contract (October 22, 2026, held for the owner's go-ahead): the only pages,
// with this test, that may carry a price figure (pages.test.mjs scans every other text file for one). Locks the
// figures the owner set, what each plan includes, the drumroll before the number, and that the pages show prices,
// a process and an agreement, never results.
// Zero dependencies: node:test + node:assert. Run from the repo root: node --test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { read, text, byId, links, mainOf, tags, attr } from './html.mjs';

const src = read('pricing.html');
const main = mainOf(src);
const t = text(main);
const sec = (id) => text(byId(src, id));

describe('pricing.html', () => {
  test('the hero is a drumroll: no figure, no call button, a scroll cue to the reveal', () => {
    const hero = /<section class="pr-hero"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(text(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(hero)[1]), 'Start your referral network for… drumroll, please.');
    assert.doesNotMatch(text(hero), /\$|\d/, 'the number waits for the scroll');
    assert.doesNotMatch(hero, /class="btn|Book a 15-minute call/, 'no call button in the hero');
    assert.doesNotMatch(main, /pg-glance|At a glance/, 'the "At a glance" box is gone');
    assert.match(hero, /<div class="pr-drum" aria-hidden="true">/);
    assert.deepEqual(links(hero).map((l) => l.href), ['/', '#reveal']);
  });

  test('the reveal: $250 for the whole first month, and what the starter pack includes', () => {
    const r = sec('reveal');
    assert.equal(text(/<h2 id="reveal-h"[^>]*>([\s\S]*?)<\/h2>/.exec(src)[1]), '$250for your whole first month.');
    assert.match(r, /Yes, really\. That's the starter pack, and it includes all of this\./);
    const items = [...byId(src, 'reveal').matchAll(/<li><svg[^>]*><use href="#i-[a-z]+"\/><\/svg><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/li>/g)].map((m) => [text(m[1]), text(m[2])]);
    assert.deepEqual(items.map((i) => i[0]), ['One review tag for your clinic', 'Three tap-to-sign-up stands', 'The signs, made for you']);
    assert.match(r, /A tap opens the form for your first-visit offer, and the link shows which business it came from\./);
    assert.match(r, /Send us your flyer and we turn it into the signs for your stands, at no extra cost\./);
  });

  test('the referral network: $500 a month from month two, five new stands, one field day, the portal and report', () => {
    const p = text(/<article class="pr-network reveal"[\s\S]*?<\/article>/.exec(src)[0]);
    assert.match(p, /Then, from month two Referral Network \$500 a month/);
    assert.match(p, /Five new tap-to-sign-up stands every month, signs included, placed for you\./);
    assert.match(p, /One field day a month\./);
    assert.match(p, /Your client portal and a monthly report that show where your new leads come from\./);
    assert.match(t, /The fee never moves with referrals, leads, bookings or revenue\. Nobody is paid per patient\./);
  });

  test('the add-ons: the flyer network per location, online search plus the ad budget, dinners per event', () => {
    const a = sec('add-ons');
    assert.match(a, /Flyer Network .*\$700 a month, per location/);
    assert.match(a, /14 businesses you choose: two field days a month, seven businesses a day\./);
    assert.match(a, /Online Search Network .*\$200 a month, plus your ad budget/);
    assert.match(a, /Patient Network .*One flat fee per event, quoted per venue/);
    assert.deepEqual(links(byId(src, 'add-ons')).map((l) => l.href), ['/flyer-network', '#online-search', '#dinners']);
  });

  test('online search: how we build the ads, in four steps, with no results, numbers or guarantees', () => {
    const s = sec('online-search');
    assert.deepEqual([...byId(src, 'online-search').matchAll(/<li><span class="num">\d+<\/span><h3>([^<]+)<\/h3>/g)].map((m) => text(m[1])),
      ["Written to Google's rules", 'Built around your name', 'Your words, approved by you', 'One clear report']);
    assert.match(s, /We write yours to those policies from the first draft, before anything goes live\./);
    assert.match(s, /Google and Google Ads are trademarks of Google LLC, and we are not affiliated with or endorsed by Google\./);
    assert.doesNotMatch(s, /\d+\s?%|\bROAS\b|click-through|\bCTR\b|cost per|top of Google|first page|guarantee|approved by Google/i);
  });

  test('dinners: one flat fee per venue, with food, planning, materials and the custom setup handled', () => {
    const d = sec('dinners');
    assert.match(d, /Each dinner is priced per venue, as one flat fee\./);
    assert.deepEqual([...byId(src, 'dinners').matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]), ['Food', 'Planning', 'Marketing materials', 'Custom setup']);
    assert.match(d, /Custom tablecloths, name tags and table setups, made for your event\./);
  });

  test('the agreement: a preview of the sample contract that links to it', () => {
    const ag = byId(src, 'agreement');
    assert.ok(ag, '#agreement exists');
    assert.ok(links(ag).some((l) => l.href === '/sample-contract'));
    assert.match(text(ag), /\$1,400/);
  });

  test('the questions match the rest of the site', () => {
    const q = sec('questions');
    assert.match(q, /Either side can end it with 30 days' written notice, and email counts\./);
    assert.match(q, /Yes\. The flyer network is \$700 a month per location, and online search is \$200 a month plus your ad budget\./);
    assert.match(q, /Your clinic pays Google directly, from your own Google Ads account\./);
  });

  test('every call link on the page prefills the pricing question, and none sits in the hero', () => {
    const calls = links(main).filter((l) => /Book a 15-minute call/.test(l.text));
    assert.equal(calls.length, 2, 'the referral network card and the closing band');
    for (const l of calls) assert.equal(l.href, '/contact?about=pricing');
  });
});

describe('sample-contract.html', () => {
  const sc = read('sample-contract.html');
  const st = text(mainOf(sc));
  test('four sheets from the flyer network agreement: the cover, the schedule, the fees and the signatures', () => {
    assert.deepEqual([...sc.matchAll(/<h3 class="sc-title[^"]*" id="sc-t\d">([^<]+)<\/h3>/g)].map((m) => m[1]), ['Marketing Services Agreement', 'The schedule', 'Fees', 'Signatures']);
    assert.match(st, /14 businesses for each location, 28 in all, across 4 field days a month/);
    assert.match(st, /\$1,400/);
    assert.equal((st.match(/\$700/g) || []).length >= 3, true, 'each location at $700');
    assert.match(st, /Nobody is paid per patient\./);
  });
  test('no names: a sample practice with Location A and Location B, and no phone or email in the sheets', () => {
    assert.match(st, /Sample practice/);
    assert.doesNotMatch(st, /Vein|Med Spa and|331-271-6851|@|Mustafa/i);
  });
  test('the calls go to /contact with the sample contract question, and the page points to pricing', () => {
    const calls = links(mainOf(sc)).filter((l) => /Book a 15-minute call/.test(l.text));
    assert.equal(calls.length, 2);
    for (const l of calls) assert.equal(l.href, '/contact?about=sample-contract');
    assert.ok(links(mainOf(sc)).some((l) => l.href === '/pricing'));
  });
});
