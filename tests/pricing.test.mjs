// The pricing page (October 22, 2026): the only page, with this test, that may carry a price figure
// (pages.test.mjs scans every other text file for one). Locks the figures the owner set, what each plan
// includes, and that the page shows prices and a process, never results.
// Zero dependencies: node:test + node:assert. Run from the repo root: node --test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { read, text, byId, links, mainOf } from './html.mjs';

const src = read('pricing.html');
const main = mainOf(src);
const t = text(main);
const sec = (id) => text(byId(src, id));

describe('pricing.html', () => {
  test('the hero: the starter month, then one flat monthly fee', () => {
    assert.equal(text(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(src)[1]), 'Start your referral network for $250.');
    assert.match(t, /That's your first month, with the starter pack\. From month two, your referral network is one flat fee of \$500 a month\./);
    const glance = text(/<aside class="pg-glance"[\s\S]*?<\/aside>/.exec(src)[0]);
    for (const line of ['Month one: $250.', 'From month two: $500 a month.', 'Month to month.']) assert.ok(glance.includes(line), line);
  });

  test('the starter pack: $250 for the first month, one review tag, three stands, the signs made for you', () => {
    const p = text(/<article class="pr-plan" aria-labelledby="starter-h">([\s\S]*?)<\/article>/.exec(src)[1]);
    assert.match(p, /Starter pack \$250 for your first month/);
    assert.match(p, /One review tag for your clinic\./);
    assert.match(p, /Three tap-to-sign-up stands, placed for you in businesses near your clinic\./);
    assert.match(p, /Send us your flyer and we turn it into the signs for your stands, at no extra cost\./);
  });

  test('the referral network: $500 a month from month two, five new stands, one field day, the monthly report', () => {
    const p = text(/<article class="pr-plan pr-feature" aria-labelledby="network-h">([\s\S]*?)<\/article>/.exec(src)[1]);
    assert.match(p, /From month two Referral Network \$500 a month/);
    assert.match(p, /Five new tap-to-sign-up stands every month, signs included, placed for you\./);
    assert.match(p, /One field day a month\./);
    assert.match(p, /A monthly report that shows where your new leads come from\./);
    assert.match(t, /One flat fee, set in advance\. It never moves with referrals, leads, bookings or revenue\. Nobody is paid per patient\./);
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
    assert.match(s, /The ad budget never passes through us, and our fee stays flat\./);
    assert.match(s, /Google and Google Ads are trademarks of Google LLC, and we are not affiliated with or endorsed by Google\./);
    assert.doesNotMatch(s, /\d+\s?%|\bROAS\b|click-through|\bCTR\b|cost per|top of Google|first page|guarantee|approved by Google/i);
  });

  test('dinners: one flat fee per venue, with food, planning, materials and the custom setup handled', () => {
    const d = sec('dinners');
    assert.match(d, /Each dinner is priced per venue, as one flat fee\./);
    assert.deepEqual([...byId(src, 'dinners').matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]), ['Food', 'Planning', 'Marketing materials', 'Custom setup']);
    assert.match(d, /Custom tablecloths, name tags and table setups, made for your event\./);
    assert.match(d, /fixed in writing before you commit\. No monthly contract\./);
  });

  test('the questions match the rest of the site', () => {
    const q = sec('questions');
    assert.match(q, /Either side can end it with 30 days' written notice, and email counts\./);
    assert.match(q, /Yes\. It is \$700 a month per location, on its own or with your referral network\./);
    assert.match(q, /Your clinic pays Google directly, from your own Google Ads account\./);
  });

  test('every call link on the page prefills the pricing question', () => {
    const calls = links(main).filter((l) => /Book a 15-minute call/.test(l.text));
    assert.equal(calls.length, 4, 'the hero, both plans and the closing band');
    for (const l of calls) assert.equal(l.href, '/contact?about=pricing');
  });
});
