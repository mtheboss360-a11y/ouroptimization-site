// The industry pages (November 20, 2026): one template, one data file per industry, built by tools/build-industries.mjs.
// The pages on disk must be exactly what the data builds, so an edit to the data without a rebuild fails here.
// November 23, 2026: the med spa page is "focused": after its hero it follows the home page's beats around the owner's idea,
// "We connect you with the businesses that already share your customers, and never with your competitors":
// who shares your clients (#partners), who we never connect you with (#never), how the connection is made (#visits),
// then the questions and the call. The other seven pages keep the full template.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { build, loadIndustries } from '../tools/build-industries.mjs';
import { read, text, attr, tags, byId, mainOf, links } from './html.mjs';

test('every industry page and the home page cards are up to date with tools/industries/*.json', () => {
  const { stale } = build({ check: true });
  assert.deepEqual(stale, [], 'run: node tools/build-industries.mjs');
});

test('eight industries, Med Spas & Wellness first, healthcare marked on the three healthcare pages only', () => {
  const list = loadIndustries();
  assert.deepEqual(list.map((d) => d.slug), ['med-spas', 'dental', 'chiropractic-physical-therapy', 'gyms-fitness-studios', 'salons-barbershops', 'restaurants-cafes', 'home-services', 'auto-shops']);
  assert.deepEqual(list.filter((d) => d.healthcare).map((d) => d.slug), ['med-spas', 'dental', 'chiropractic-physical-therapy']);
});

test('the treats stay modest on every industry page, and the healthcare pages name no healthcare partners', () => {
  for (const d of loadIndustries()) {
    for (const t of d.treatExamples) assert.doesNotMatch(t, /gift|cash|card|free |discount|voucher/i, `${d.slug}: ${t}`);
    if (d.healthcare) for (const p of d.partners) assert.doesNotMatch(p.name, /doctor|dentist|dental|pharmac|therap|chiropract|optomet|clinic|hospital|medical|physician|lab/i, `${d.slug}: ${p.name}`);
  }
});

/* the sources of truth: the terms, and the partner agreement summary on How it works */
const TERMS = text(read('terms.html'));
const AGREEMENT = text(byId(read('referral-network.html'), 'agreement') || '');
const sectionIds = (main) => [...main.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);

test('one focused page, the med spa page; the other seven keep the full template', () => {
  const list = loadIndustries();
  assert.deepEqual(list.filter((d) => d.focused === true).map((d) => d.slug), ['med-spas']);
  for (const d of list.filter((x) => x.focused !== true)) {
    const html = read(`industries/${d.slug}.html`);
    const main = mainOf(html);
    assert.deepEqual(sectionIds(main), ['partners', 'visits', 'portal', 'good-to-know', 'questions'], d.slug);
    assert.match(main, /<section class="pg-hero ind-hero"/, `${d.slug}: the hero`);
    assert.match(main, /<section class="section bg-ink pg-cta"/, `${d.slug}: the call`);
    assert.match(main, /<ul class="cardgrid ind-partners reveal">/, `${d.slug}: the partner cards`);
    assert.equal(tags(/<ul class="own-scenes reveal">([\s\S]*?)<\/ul>/.exec(main)[1], 'li').length, 3, `${d.slug}: the three visit scenes`);
    assert.match(main, /<figure class="ind-shot reveal">/, `${d.slug}: the portal screen`);
    assert.match(main, /<p class="ind-excl reveal">/, `${d.slug}: the exclusivity line`);
    assert.equal(tags(/<ul class="cardgrid owc-comply reveal">([\s\S]*?)<\/ul>/.exec(main)[1], 'li').length, 3, `${d.slug}: the three notes`);
    assert.equal((main.match(/<details>/g) || []).length, 3, `${d.slug}: three questions`);
    assert.doesNotMatch(main, /id="never"|share-types|never-cards|ind-visit-cards|visit-words/, `${d.slug}: none of the focused beats`);
  }
});

test('the other seven pages: one of your kind and the partner agreement hold when our team visits, as a commitment (November 23, 2026)', () => {
  for (const d of loadIndustries().filter((x) => x.focused !== true)) {
    assert.match(d.exclusivity, /^When our team visits, (each partner agrees|partners agree) to promote one /, `${d.slug}: exclusivity`);
    const note = d.notes.find((n) => n.title === 'A one-page partner agreement');
    assert.ok(note, `${d.slug}: the agreement note`);
    assert.match(note.text, /^When our team visits, you and each partner agree to promote each other\. Nobody is paid per referral or per (customer|patient)\.$/, `${d.slug}: agreement`);
    const main = mainOf(read(`industries/${d.slug}.html`));
    assert.match(text(/<p class="ind-excl reveal">([\s\S]*?)<\/p>/.exec(main)[1]), /^When our team visits, /, `${d.slug}: the exclusivity line on the page`);
    assert.doesNotMatch(text(main), /\bpromotes (only )?(you|yours|one)\b/, `${d.slug}: a commitment, never a fact`);
  }
  assert.match(TERMS, /The partners we sign for you agree to promote one business of your kind, yours, for as long as you are a client\./);
  assert.match(AGREEMENT, /When our team visits, every partner we sign for you signs it\./);
});

describe('the med spa page (November 23, 2026): the home page\'s beats, for med spas', () => {
  const d = loadIndustries().find((x) => x.slug === 'med-spas');
  const html = read('industries/med-spas.html');
  const main = mainOf(html);
  const t = text(main);
  const sec = (id) => { const s = byId(main, id); assert.ok(s, `#${id}`); return s; };
  const items = (ul) => [...ul.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
  const card = (li) => ({ icon: (/^<svg aria-hidden="true"><use href="#(i-[a-z]+)"\/><\/svg>/.exec(li) || [])[1], h: text(/<h3>([\s\S]*?)<\/h3>/.exec(li)[1]), p: text(/<p>([\s\S]*?)<\/p>/.exec(li)[1]) });

  test('the beats in order: the hero, who shares your clients, who we never connect you with, how the connection is made, what you see, the questions, the call', () => {
    assert.deepEqual(sectionIds(main), ['partners', 'never', 'visits', 'see', 'questions']);
    const at = (s) => main.indexOf(s);
    assert.ok(at('class="pg-hero ind-hero"') >= 0 && at('class="pg-hero ind-hero"') < at('id="partners"'), 'the hero first');
    assert.ok(at('id="questions"') < at('class="section bg-ink pg-cta"'), 'the call last');
    assert.doesNotMatch(main, /id="portal"|id="good-to-know"|class="ind-excl|class="cardgrid ind-partners|own-scenes|ind-shot|<img\b/, 'no scenes, no screenshot, no separate portal or notes section: they are folded into the beats or live on the home page');
  });

  test('the hero: the h1 as it was, the intro is the idea for med spas, and the call to book', () => {
    assert.equal(d.h1, 'New clients for your med spa,');
    assert.equal(d.h1Em, 'from the businesses next door.');
    assert.match(main, /<h1 id="pg-h">New clients for your med spa, <em class="dn-line">from the businesses next door\.<\/em><\/h1>/);
    assert.match(main, /<p class="intro">We connect your med spa with the gyms, studios, salons and shops that already share your clients, and never with your competitors\.<\/p>/);
    assert.ok(links(main).some((l) => l.href === '/contact?about=med-spas' && l.text === 'Book a 15-minute call'));
  });

  test('2. who shares your clients: the six med spa partners, each with its icon and its one plain line', () => {
    const s = sec('partners');
    assert.match(s, /<p class="eyebrow">Who shares your clients<\/p>/);
    assert.equal(text(/<h2 id="partners-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Same clients, different businesses.');
    assert.match(text(s), /Your clients already spend time at these places, and the staff see them often\./);
    const cards = items(/<ul class="cardgrid icon-side share-types reveal">([\s\S]*?)<\/ul>/.exec(s)[1]).map(card);
    assert.deepEqual(cards.map((c) => c.h), ['Gyms and fitness studios', 'Yoga and pilates studios', 'Hair salons', 'Nail salons', 'Bridal shops', 'Clothing boutiques']);
    assert.deepEqual(cards, d.partners.map((p) => ({ icon: p.icon, h: p.name, p: p.why })), 'the names, lines and icons from tools/industries/med-spas.json');
    for (const c of cards) {
      assert.match(html, new RegExp(`<symbol id="${c.icon}"`), `${c.icon} is in the page sprite`);
      assert.doesNotMatch(c.p, /\d|%|guarantee|refer|result/i, `an observation, no results and no numbers: ${c.p}`);
    }
  });

  test('3. who we never connect you with: no other med spa, one med spa (a commitment, when our team visits), you approve every name', () => {
    const s = sec('never');
    const st = text(s);
    assert.match(s, /<p class="eyebrow">Never a competitor<\/p>/);
    assert.equal(text(/<h2 id="never-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Who we never connect you with.');
    assert.match(st, /Your partners share your clients, not your services\. Here is how we keep it that way\./);
    const cards = items(/<ul class="cardgrid never-cards reveal">([\s\S]*?)<\/ul>/.exec(s)[1]).map(card);
    assert.deepEqual(cards, [
      { icon: 'i-no', h: 'No competitors', p: 'We never put another med spa, aesthetics or injectables practice on your route.' },
      { icon: 'i-shield', h: 'One med spa, yours', p: 'When our team visits, each partner agrees to promote one med spa, yours, for as long as you are a client.' },
      { icon: 'i-check', h: 'You approve every name', p: 'You approve the list before any visit, and you can cross any business off it. We skip any business you already work with unless you ask.' }
    ]);
    assert.doesNotMatch(t, /\bpromotes (only )?(you|yours|one)|partner promotes one/, 'one of your kind is a commitment, never a fact');
    assert.doesNotMatch(st, /certif|prestig|exclusive club|\bclub\b|decal|directory|member/i);
    assert.ok(links(s).some((l) => l.href === '/referral-network#agreement' && l.text === 'What the partner agreement says'));
    assert.match(TERMS, /ranks the non-competing ones that share your customers\. You approve the list before any visit, and we skip any business you already work with unless you ask\./);
    assert.match(TERMS, /The partners we sign for you agree to promote one business of your kind, yours, for as long as you are a client\./);
    assert.match(AGREEMENT, /When our team visits, every partner we sign for you signs it\./);
    assert.match(AGREEMENT, /Each partner agrees to promote one business of your kind: yours\. This holds for as long as you are a client\./);
  });

  test('4. how the connection is made: in person, every month, when our team visits', () => {
    const s = sec('visits');
    assert.match(s, /<p class="eyebrow">How the connection is made<\/p>/);
    assert.equal(text(/<h2 id="visits-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'In person, every month.');
    assert.match(text(s), /When our team visits, we go to every business on your route each month\. Here is what happens on each visit\./);
  });

  test('the coffee and treats in their own block: modest, for the whole staff, the med spa examples, and no word about referrals or sign-ups', () => {
    const s = sec('visits');
    const block = /<div class="ind-treats visit-treats reveal">([\s\S]*?)<\/div>/.exec(s)[1];
    const bt = text(block);
    assert.equal(bt, `Coffee and treats For the whole staff on every visit, from the front desk to the stylists. ${d.treatExamples.join(' ')} We keep it modest: coffee, pastries and snacks. Never gift cards, cash, free services or anything of real value. More about our visits`);
    assert.deepEqual(d.treatExamples, ["Coffee and pastries for a hair salon's morning stylists", "Muffins and coffee for a gym's opening front desk crew", "Cookies and iced coffee for a nail salon's afternoon shift"]);
    assert.doesNotMatch(bt, /refer|send|sign-?up|code|recommend|customer|client|patient|promot|partner|book|lead|result|reward|perform|exchange|return/i, 'nothing about referrals, sign-ups or customers');
    assert.deepEqual(links(block).map((l) => l.href), ['/field-team#treats']);
    assert.match(TERMS, /our field team brings modest coffee and treats, such as pastries and snacks, for the whole staff of each partner business\. We never give gift cards, cash, free services or anything of meaningful value\./);
    // the only other mention is the hero's at-a-glance line, on its own
    const glance = /<aside class="pg-glance[\s\S]*?<\/aside>/.exec(main)[0];
    assert.match(glance, /<li><svg aria-hidden="true"><use href="#i-coffee"\/><\/svg><span><b>Treats for Staff<\/b> on every visit\.<\/span><\/li>/);
    assert.doesNotMatch(text(main.replace(block, ' ').replace(glance, ' ')), /coffee|treat|pastr|snack|muffin|cookie/i, 'the treats are said in their own block only');
  });

  test('what every visit brings: the staff cards, the one-page agreement, no patient records, the portal; in the words of the terms', () => {
    const s = sec('visits');
    const cards = items(/<ul class="cardgrid icon-side ind-visit-cards reveal">([\s\S]*?)<\/ul>/.exec(s)[1]).map(card);
    assert.deepEqual(cards, [
      { icon: 'i-tap', h: 'A tap-to-schedule card for each staff member', p: 'Every staff member we meet gets a personal card with an NFC tag and a QR code. A tap or a scan opens your first-visit offer and a short sign-up form.' },
      { icon: 'i-doc', h: 'A one-page partner agreement', p: 'Every partner signs one. Each side promotes the other. Nobody is paid per referral or per patient.' },
      { icon: 'i-lock', h: 'No patient records, ever', p: 'We never receive patient records, and partners never see who signed up. The sign-up form asks no health questions.' },
      { icon: 'i-track', h: 'Every visit in your portal', p: 'Your portal logs each visit.' }
    ]);
    const see = sec('see');
    assert.match(text(see), /What you see Every stop, every sign-up\. Your portal shows every route, every stop, the staff we met and every sign-up\. Your front desk makes the follow-up calls\. Sign-ups show how your campaign is doing and are never used to reward anyone\./, 'beat 5, in words');
    assert.ok(links(see).some((l) => l.href === '/portals' && l.text === 'See the three portals'), 'the portals, from beat 5');
    assert.doesNotMatch(see, /<img\b|own-stats|demo account/, 'no screenshot and no demo figures: those live on the home page');
    for (const c of cards) assert.match(html, new RegExp(`<symbol id="${c.icon}"`), `${c.icon} is in the page sprite`);
    assert.doesNotMatch(cards.map((c) => c.p).join(' '), /coffee|treat|pastr|snack/i, 'the treats are only in their own block');
    assert.match(TERMS, /Every staff member we meet gets a personal tap-and-scan code: an NFC tag and a QR code\. A tap opens your first-visit offer and a short sign-up form/);
    assert.match(TERMS, /Every partner business signs a one-page agreement: mutual promotion, nobody is paid per referral or per customer, and no patient records are shared\./);
    assert.match(TERMS, /our service does not need your patient records, and we never receive them\. No partner business receives any patient information through us\./);
    assert.match(TERMS, /asks no health questions/);
    assert.match(TERMS, /Your team calls the people who sign up, from your dashboard\./);
    for (const a of ['Each side promotes the other.', 'Partners never see who signed up.', 'we never receive patient records.', 'The sign-up form asks no health questions.']) assert.ok(AGREEMENT.includes(a), a);
  });

  test('your words only, the healthcare link and the HIPAA line (hidden until the owner turns it on), once each', () => {
    const s = sec('visits');
    assert.match(text(s), /Your words only\. We make no medical or health claims\. We describe your services only in words you approve\./);
    assert.ok(links(s).some((l) => l.href === '/faq#healthcare' && l.text === 'Healthcare practices: how it works for you'));
    assert.equal((html.match(/data-flag="hipaaConfirmed"/g) || []).length, 1);
    assert.match(s, /<p class="hipaa-line" data-flag="hipaaConfirmed" data-flag-text="hipaaText" hidden><span><\/span><\/p>/);
    for (const line of ['We make no medical or health claims.', 'Nobody is paid per referral or per patient.', 'partners never see who signed up.', 'The sign-up form asks no health questions.']) assert.equal(t.split(line).length - 1, 1, line);
  });

  test('the questions: the two for med spa owners, the healthcare sentence word for word, the attorney notes kept', () => {
    const s = sec('questions');
    assert.equal(text(/<h2 id="questions-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Questions from med spa owners');
    const qs = [...s.matchAll(/<summary>([\s\S]*?)<span class="sign"/g)].map((m) => text(m[1]));
    assert.deepEqual(qs, ["Can't I just walk into the gym next door myself?", 'What about the rules for healthcare practices?']);
    assert.match(text(s), /Partner programs for healthcare practices are reviewed for compliance with applicable state rules before launch\. If your lawyer wants to read the partner agreement, we'll send it\./);
    const TODO = '<!-- TODO: attorney review of courtesy program before publishing healthcare pages -->';
    assert.equal(html.split(TODO).length - 1, 2, 'one at the top of the page, one over the healthcare question');
    assert.match(s, /<!-- TODO: attorney review of courtesy program before publishing healthcare pages -->\n\s*<details>\n\s*<summary>What about the rules for healthcare practices\?/);
    assert.ok(links(s).some((l) => l.href === '/faq' && l.text === 'All questions'));
  });

  test('the call: every booking link carries the med spa key', () => {
    assert.match(t, /See the businesses around your med spa\. On a 15-minute call, we'll show you the businesses we would visit near you\./);
    const contact = links(main).filter((l) => l.href.startsWith('/contact'));
    assert.equal(contact.length, 2);
    for (const l of contact) assert.equal(l.href, '/contact?about=med-spas');
    assert.equal(d.aboutKey, 'med-spas');
  });

  test('the copy rules: no dashes, no "sample", no numbered levels, no phone, no pricing, no guarantee, the old name only in the structured data', () => {
    assert.doesNotMatch(html, /[–—]|&[mn]dash;|&#821[12];/);
    assert.doesNotMatch(html, /sample/i);
    assert.doesNotMatch(html, /Level\s*[12]\b|about=level-/i);
    assert.doesNotMatch(main, /tel:|331-271-6851|\(331\)/);
    assert.doesNotMatch(t, /\$\s?\d|pricing|\btrial\b|guarantee|money back/i);
    assert.doesNotMatch(main, /href="\/pricing/);
    assert.doesNotMatch(html, /Boots on the ground/i);
    assert.equal(html.split('Our Wellness Network').length - 1, 1, 'only as the alternate name in the JSON-LD');
    assert.equal(JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]).alternateName, 'Our Wellness Network');
    for (const img of tags(main, 'img')) assert.fail(`no images in the med spa main: ${attr(img, 'src')}`);
  });
});
