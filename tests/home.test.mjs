// The home page, section by section. November 23, 2026: five beats around the owner's idea, "We connect you with the
// businesses that already share your customers, and never with your competitors": 1. the connection (the hero),
// 2. who shares your customers (#industries), 3. who we never connect you with (#never), 4. how the connection is made
// (#in-person, with the two ways to run it inside it, #levels), 5. what you see (#dashboard), then the call (#book).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { read, text, attr, hasAttr, tags, byId, mainOf, links, ROOT } from './html.mjs';

const html = read('index.html');
const main = mainOf(html);
const head = html.slice(0, html.indexOf('</head>'));
const sec = (id) => {
  const s = byId(html, id);
  assert.ok(s, `#${id} exists`);
  return s;
};
const meta = (attrName, name) => { const t = tags(head, 'meta').find((m) => attr(m, attrName) === name); return t ? attr(t, 'content') : null; };
const count = (hay, needle) => hay.split(needle).length - 1;
const TOWNS = ['Oak Brook', 'Lombard', 'Elmhurst', 'Naperville', 'Downers Grove', 'Hinsdale'];
/* the sources of truth: the terms, and the partner agreement summary on How it works */
const TERMS = text(read('terms.html'));
const AGREEMENT = text(byId(read('referral-network.html'), 'agreement') || '');

describe('home: order, head and hero', () => {
  test('the five beats in order (November 23, 2026): Industries, never, in person (with the two ways inside it), the portal, the call; no pricing, no map', () => {
    const ids = [...main.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['industries', 'never', 'in-person', 'dashboard', 'book']);
    assert.ok(sec('in-person').includes('id="levels"'), 'the two ways sit inside beat 4, not as a beat of their own');
    for (const gone of ['network', 'treats', 'compliance']) assert.ok(!byId(main, gone), `#${gone} is folded into the beats`);
    assert.doesNotMatch(text(main), /\$\d/, 'no prices on the home page');
    const heroAt = main.indexOf('class="hero-orb"');
    assert.ok(heroAt >= 0 && heroAt < main.indexOf('id="industries"'), 'the hero comes first');
  });
  test('the title, the share titles, the descriptions (the idea, the six towns) and the share image alt', () => {
    const title = 'Our Local Network | Your Customers Are Already Next Door';
    assert.equal(text(/<title>([\s\S]*?)<\/title>/.exec(head)[1]), title);
    assert.equal(meta('property', 'og:title'), title);
    assert.equal(meta('name', 'twitter:title'), title);
    const desc = 'In Oak Brook, Lombard, Elmhurst, Naperville, Downers Grove and Hinsdale, we connect you with the businesses that already share your customers, and never with your competitors.';
    for (const [a, n] of [['name', 'description'], ['property', 'og:description'], ['name', 'twitter:description']]) assert.equal(meta(a, n), desc, n);
    for (const t of TOWNS) assert.ok(desc.includes(t), t);
    assert.ok(desc.length <= 175);
    assert.equal(meta('property', 'og:image'), 'https://ouroptimization.com/assets/img/og-network.jpg');
    assert.equal(meta('property', 'og:image:alt'), 'The Our Local Network logo above the line: Your customers are already next door.');
    const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(head)[1]);
    assert.equal(ld.slogan, 'Your customers are already next door.');
    assert.equal(ld.alternateName, 'Our Wellness Network', 'the old name stays only as the alternate name');
    assert.doesNotMatch(html, /Boots on the ground/i, 'the old slogan is retired from the home page, head included');
    assert.equal(count(html, 'Our Wellness Network'), 1, 'only in alternateName');
  });
  test('the hero: the connection, not the coffee (November 23, 2026), and the three display photos, with no buttons and no example card', () => {
    const hero = /<section class="hero-orb"[\s\S]*?<\/section>/.exec(main)[0];
    assert.match(hero, /<h1 id="hero-h">Your customers are <em>already next door\.<\/em><\/h1>/);
    assert.match(hero, /<p class="lede">We connect your business with the businesses your potential customers already go to\. Same clientele\. Never a competitor\.<\/p>/);
    assert.doesNotMatch(text(hero), /coffee|treat/i, 'the hero is about the connection');
    const photos = ['salon', 'bakery', 'medspa'];
    assert.deepEqual(links(hero).map((l) => l.href), photos.map((n) => `/assets/img/display-${n}.png`), 'the only links open the full-size photos');
    for (const n of photos) assert.ok(existsSync(new URL(`./assets/img/display-${n}.png`, ROOT)), n);
    assert.equal(tags(hero, 'img').length, 3);
    for (const img of tags(hero, 'img')) assert.ok(attr(img, 'alt').length > 40, 'each photo is described');
    assert.match(hero, /<figcaption>Displays we have made for local businesses\.<\/figcaption>/);
    assert.doesNotMatch(hero, /class="btn/, 'no buttons');
    assert.doesNotMatch(hero, /hero-lv|Level [12]/, 'the two ways are further down the page');
    assert.doesNotMatch(text(hero), /Devon|30 clients|tap-to-schedule/, 'the owner took the card down');
    assert.doesNotMatch(hero, /proof-row|proof-one/);
    assert.doesNotMatch(text(hero), /Marcus/);
    assert.doesNotMatch(text(hero), /staff reached|sign-ups|booked/);
  });
  test('the half orb the owner picked (assets/home-orb.js): one canvas, your business at its gold centre, illustrated owners clear of the words', () => {
    const hero = /<section class="hero-orb"[\s\S]*?<\/section>/.exec(main)[0];
    assert.equal(tags(hero, 'canvas').length, 1);
    assert.equal(attr(tags(hero, 'canvas')[0], 'id'), 'orb');
    assert.match(html, /<script src="\/assets\/home-orb\.js" defer><\/script>/);
    for (const f of ['assets/home-wave.js', 'assets/network-orb.js']) assert.ok(!existsSync(new URL(f, ROOT)), f);
    assert.doesNotMatch(html, /home-wave|hero-wave|id="wave"/);
    const js = read('assets/home-orb.js');
    assert.match(js, /const clinic = \{ label: 'Your business'/);
    for (const b of ['Gym', 'Hair salon', 'Yoga studio', 'Boutique', 'Physical therapy', 'Nail salon']) assert.match(js, new RegExp(`label: '[A-Z][a-z]+ · ${b}'`), b);
    assert.match(js, /querySelectorAll\('h1, \.lede, \.actions/, 'the owners keep clear of the words');
    assert.match(js, /prefers-reduced-motion: reduce/);
    assert.match(js, /sessionStorage/, 'the network builds once per visit');
    assert.doesNotMatch(js, /https?:\/\/|import /, 'no libraries and no outside requests');
    assert.match(read('assets/site.css'), /\.hero-orb\{[^}]*--rose:var\(--gold\)/, 'the centre is the brand gold');
  });
});

describe('home: the copy rules (November 23, 2026)', () => {
  const t = text(main);
  test('no "Level 1" or "Level 2" anywhere on the page, comments included; the plain names stay', () => {
    assert.doesNotMatch(html, /Level\s*[12]|lv-k|about=level-/i);
    assert.match(sec('levels'), /<h3>Your team visits<\/h3>/);
    assert.match(sec('levels'), /<h3>Our team visits<\/h3>/);
  });
  test('no em or en dashes, never the word sample, no legal wording, no guarantee on the home page', () => {
    assert.doesNotMatch(html, /[–—]|&[mn]dash;|&#821[12];/);
    assert.doesNotMatch(html, /sample/i);
    assert.doesNotMatch(t, /guarantee|compliant|legal|lawful|attorney|HIPAA|medical director/i);
  });
  test('the phone number only in the closing call', () => {
    const outside = main.replace(byId(main, 'book'), '');
    assert.doesNotMatch(outside, /tel:|331-271-6851|\(331\)/);
  });
  test('the treats are said once on the page, and the four "In writing" lines once each', () => {
    assert.equal((t.match(/treats/gi) || []).length, 1, 'one coffee and treats card');
    for (const s of ['Nobody is paid per referral or per customer.', 'Partners never see who signed up.', 'We only use words you have approved. We make no medical or health claims.']) assert.equal(count(t, s), 1, s);
    assert.equal(links(main).filter((l) => l.href === '/faq#healthcare').length, 1, 'the healthcare link');
  });
});

describe('home: 2. who shares your customers (#industries)', () => {
  const s = sec('industries');
  const t = text(s);
  /* each kind of business on the home page, and the partner names in tools/industries/*.json it stands for */
  const TYPES = [
    ['Gyms and fitness studios', ['Gyms and fitness studios']],
    ['Yoga and pilates studios', ['Yoga and pilates studios']],
    ['Hair and nail salons', ['Hair salons', 'Nail salons', 'Hair salons and barbershops']],
    ['Boutiques and bridal shops', ['Clothing boutiques', 'Bridal shops']],
    ["Daycares and kids' schools", ['Daycares and preschools', "Kids' swim and dance schools"]],
    ['Apartment leasing offices', ['Apartment leasing offices']]
  ];
  test('the head and the six kinds of business, each with one plain line', () => {
    assert.match(s, /<p class="eyebrow">Who shares your customers<\/p>/);
    assert.match(t, /Same customers, different businesses\./);
    assert.match(t, /Your customers don't only come to you\. They go to the gym, the salon and the shops nearby\. We find those businesses near you\./);
    const ul = /<ul class="cardgrid icon-side share-types reveal">([\s\S]*?)<\/ul>/.exec(s)[1];
    const items = [...ul.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    assert.deepEqual(items.map((li) => text(/<h3>([\s\S]*?)<\/h3>/.exec(li)[1])), TYPES.map((x) => x[0]));
    for (const li of items) {
      const p = [...li.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => text(m[1]));
      assert.equal(p.length, 1, 'one line each');
      assert.equal((p[0].match(/[.!?]/g) || []).length, 1, `one sentence: ${p[0]}`);
      assert.doesNotMatch(p[0], /\d|%|more (customers|clients|bookings)|grow|results?|guarantee|refer/i, `an observation, no results and no numbers: ${p[0]}`);
      assert.match(li, /^<svg aria-hidden="true"><use href="#i-[a-z]+"\/><\/svg>/, 'an icon from the page sprite');
    }
  });
  test('each kind recurs in the partner lists of the industry pages (tools/industries/*.json)', () => {
    const dir = new URL('tools/industries/', ROOT);
    const names = readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(read('tools/industries/' + f)).partners.map((p) => p.name));
    for (const [type, from] of TYPES) {
      for (const n of from) assert.ok(names.includes(n), `${type}: "${n}" is a partner on an industry page`);
      assert.ok(names.filter((n) => from.includes(n)).length >= 2, `${type} comes up on more than one industry page`);
    }
  });
  test('then "Pick your industry to see your matches." and one card per industry page, built from the industry data', () => {
    assert.match(t, /Which ones fit depends on what you sell\. Pick your industry to see your matches\./);
    assert.ok(s.indexOf('share-types') < s.indexOf('share-pick') && s.indexOf('share-pick') < s.indexOf('<!-- industries:start'), 'the kinds first, then the line, then the cards');
    const hrefs = links(s).map((l) => l.href);
    assert.deepEqual(hrefs, ['/industries/med-spas', '/industries/dental', '/industries/chiropractic-physical-therapy', '/industries/gyms-fitness-studios', '/industries/salons-barbershops', '/industries/restaurants-cafes', '/industries/home-services', '/industries/auto-shops']);
    for (const h of hrefs) assert.ok(existsSync(new URL('.' + h + '.html', ROOT)), h);
    assert.match(s, /<!-- industries:start \(built by tools\/build-industries\.mjs; edit tools\/industries\/\*\.json\) -->[\s\S]*<!-- industries:end -->/);
  });
});

describe('home: 3. who we never connect you with (#never), only what is already true', () => {
  const s = sec('never');
  const t = text(s);
  test('the head, the three points and the link to the partner agreement', () => {
    assert.match(t, /Who we never connect you with\./);
    assert.match(t, /Your partners share your customers, not your services\./);
    const cards = [.../<ul class="cardgrid never-cards reveal">([\s\S]*?)<\/ul>/.exec(s)[1].matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((m) => text(m[1]));
    assert.deepEqual(cards, ['No competitors', 'One of your kind', 'You approve every name']);
    assert.match(t, /No competitors\s*We never put a business that sells what you sell on your list\./);
    assert.match(t, /One of your kind\s*When our team visits, each partner agrees to promote one business of your kind: yours, for as long as you are a client\./);
    assert.match(t, /You approve every name\s*You approve the list before any visit, and you can cross any business off it\. We skip any business you already work with unless you ask\./);
    assert.ok(links(s).some((l) => l.href === '/referral-network#agreement' && l.text === 'What the partner agreement says'));
  });
  test('a commitment, not a claim; one of your kind only when our team visits; no claim the network cannot back', () => {
    assert.doesNotMatch(t, /\bpromotes (only )?(you|yours|one)|partner promotes one|Read the partner agreement/);
    assert.match(t, /When our team visits, each partner agrees to promote one business of your kind/);
    assert.doesNotMatch(t, /certif|prestig|exclusive club|\bclub\b|decal|directory|member/i);
    assert.doesNotMatch(t, /send (each other|you) (customers|patients|clients)|referral swap|refer (each other|patients)/i);
  });
  test('the terms and the partner agreement back every line', () => {
    assert.match(TERMS, /ranks the non-competing ones that share your customers\. You approve the list before any visit, and we skip any business you already work with unless you ask\./);
    assert.match(TERMS, /The partners we sign for you agree to promote one business of your kind, yours, for as long as you are a client\./);
    assert.match(AGREEMENT, /Each partner agrees to promote one business of your kind: yours\./);
  });
});

describe('home: 4. how the connection is made (#in-person) and the two ways to run it (#levels)', () => {
  const s = sec('in-person');
  const t = text(s);
  const treats = /<ul class="own-scenes own-scenes-one visit-treats reveal">([\s\S]*?)<\/ul>/.exec(s)[1];
  const cards = /<ul class="cardgrid icon-side visit-cards reveal">([\s\S]*?)<\/ul>/.exec(s)[1];
  test('the head: in person, every month, when our team visits', () => {
    assert.match(s, /<p class="eyebrow">How the connection is made<\/p>/);
    assert.match(t, /In person, every month\./);
    assert.match(t, /When our team visits, we go to every business on your route each month\. Here is what happens on each visit\./);
  });
  test('the coffee and treats, in their own card: modest, for the whole staff, and never next to referrals, sign-ups or customers', () => {
    const c = text(treats);
    assert.equal(tags(treats, 'li').length, 1, 'one card');
    assert.match(c, /^Coffee and treats\s*For the whole staff, on every visit\.\s*We keep it modest: coffee, pastries and snacks\.\s*More about our visits$/);
    assert.doesNotMatch(c, /refer|send|sign-?up|code|recommend|customer|client|patient|promot|partner|book|lead|result|reward|perform|exchange|return/i, 'nothing about referrals, sign-ups or customers');
    assert.ok(links(treats).some((l) => l.href === '/field-team#treats'));
    assert.doesNotMatch(text(cards), /coffee|treat|pastr|snack/i, 'the treats are only in their own card');
    assert.doesNotMatch(text(sec('levels')), /coffee|treat/i);
  });
  test('the one visit-treats scene, at the width its image sizes describe (440px card)', () => {
    assert.equal(tags(s, 'img').length, 1, 'one scene only');
    const img = tags(s, 'img')[0];
    assert.match(attr(img, 'src'), /^\/assets\/img\/visit-treats-/);
    assert.ok(attr(img, 'alt').length > 40);
    for (const t2 of tags(treats, 'source').concat([img])) assert.equal(attr(t2, 'sizes'), '(min-width:480px) 410px, calc(100vw - 70px)');
    const css = read('assets/site.css');
    assert.match(css, /\.own-scenes\.own-scenes-one\{[^}]*max-width:440px/);
    assert.match(css, /\.visit-grid\{grid-template-columns:440px minmax\(0,1fr\)/);
  });
  test('the staff cards, the one-page agreement and the portal, in the words of the terms', () => {
    const heads = [...cards.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((m) => text(m[1]));
    assert.deepEqual(heads, ['A tap-to-schedule card for each staff member', 'A one-page partner agreement', 'Every visit in your portal'], "the owner's name for the staff card");
    const c = text(cards);
    assert.match(c, /Every staff member we meet gets a personal card with an NFC tag and a QR code\. A tap or a scan opens your first-visit offer and a short sign-up form\./);
    assert.match(c, /Every partner signs one\. Each side promotes the other\. Nobody is paid per referral or per customer\. Partners never see who signed up\./);
    assert.match(c, /Your portal logs each visit\. Your own team makes the follow-up calls\./);
    assert.match(TERMS, /Every staff member we meet gets a personal tap-and-scan code: an NFC tag and a QR code\. A tap opens your first-visit offer and a short sign-up form/);
    assert.match(TERMS, /Every partner business signs a one-page agreement: mutual promotion, nobody is paid per referral or per customer/);
    for (const a of ['Each side promotes the other.', 'Nobody is paid per referral or per customer.', 'Partners never see who signed up.']) assert.ok(AGREEMENT.includes(a), a);
  });
  test('"In writing" folded in: your words only, no medical or health claims, and the healthcare link; nothing about attorneys or HIPAA', () => {
    assert.match(t, /Your words only\. We only use words you have approved\. We make no medical or health claims\./);
    assert.ok(links(s).some((l) => l.href === '/faq#healthcare' && l.text === 'Healthcare practices: how it works for you'));
    assert.match(TERMS, /We make no medical or health claims/);
    const cfg = read('assets/site-config.js');
    assert.doesNotMatch(cfg, /attorney/i, 'no attorney review claimed, not even in a switched-off line');
    assert.match(cfg, /hipaaConfirmed: false,\n  hipaaText: ''/, 'no HIPAA sentence until the owner confirms it');
    assert.match(html, /<script src="\/assets\/site-config\.js" defer><\/script>\n<script src="\/assets\/site\.js" defer>/);
  });
  test('the two ways to run it: the plain names, no numbered labels, the full detail on How it works', () => {
    const l = sec('levels');
    const lt = text(l);
    assert.match(l, /<h3 class="lv-sub-h reveal" id="levels-h">Your team or ours\./, 'a sub-heading inside beat 4, not an eyebrow or a section');
    assert.match(lt, /Your team or ours\. You choose who visits\. Either way, we choose the businesses near you that share your customers\./);
    assert.match(lt, /Your team visits We give you the businesses to visit\. Your team makes the displays\. Your team drops them off\./);
    assert.match(lt, /Our team visits We make the displays with your team, or you make them\. Our team sets them up every month, with each business's permission\. Your portal tracks every visit and sign-up\./);
    assert.ok(links(l).some((a) => a.href === '/referral-network#levels' && a.text === 'See what each level includes'), 'the link keeps its name (no renaming beyond the labels)');
  });
});

describe('home: 5. what you see (#dashboard)', () => {
  test('on the green band: every route, every stop, every sign-up; the screens pop in like every other block, no scroll-driven tilt', () => {
    const s = sec('dashboard');
    assert.match(main, /<section class="section bg-ink owc-dash-band" aria-labelledby="dashboard-h" id="dashboard">/, 'on the green band');
    assert.match(s, /<p class="eyebrow">What you see<\/p>/);
    assert.equal(text(/<h2 id="dashboard-h">([\s\S]*?)<\/h2>/.exec(s)[1]), 'Every route, every stop, every sign-up.');
    assert.match(s, /<div class="ptour reveal" data-ptour>/, 'the same smooth pop-in as the rest of the page');
    assert.doesNotMatch(s, /data-tilt|owc-tilt|owc-scroll-cue/, 'no tilt and no scroll cue (the owner\'s call)');
  });
  test('the screens and what it shows; no visit log line and no Client Portal box (it is in the header)', () => {
    const s = sec('dashboard');
    const t = text(s);
    assert.doesNotMatch(s, /Sample account|illustrative data|sample-tag|sample-note/, 'no visible sample labels (the owner took them off, November 21, 2026)');
    assert.doesNotMatch(t, /Inside your referral network portal/);
    assert.match(t, /Your client portal shows where our team went, who they met and who signed up\./);
    assert.doesNotMatch(t, /before we leave/i, 'no stop-logging timing claim; the terms promise a written visit log within 5 business days');
    for (const label of ['Stops visited', 'Staff reached', 'Referral cards handed out', 'Staff sign-ups', 'Booked by the front desk']) assert.ok(t.includes(label), label);
    assert.match(read('assets/site.css'), /\.own-stats dd\{font-family:var\(--nums\)|\.own-stats dd\{font-family/, 'the numbers use the system face');
    assert.doesNotMatch(t, /visit log|\[STOPS/i, 'no visit log line, no placeholder');
    assert.ok(!links(s).some((l) => l.href === 'https://www.ournetworkportal.com'), 'no Client Portal box in this section');
    for (const img of tags(s, 'img')) assert.match(attr(img, 'src'), /^\/assets\/img\/portal2-/, 'screens from the client portal (November 14, 2026)');
  });
  test('no map anywhere: no Google request, no Maps key, no map images', () => {
    assert.doesNotMatch(html, /owc-geo|id="matching"|openstreetmap/i);
    assert.doesNotMatch(read('assets/site-config.js'), /googleMap/);
    assert.doesNotMatch(read('assets/site.js'), /googleapis|googleMap|owc-geo/);
    assert.match(read('netlify.toml'), /img-src 'self' data:;/, 'the CSP allows no outside images');
    assert.doesNotMatch(read('privacy.html'), /googleMap|Google Maps/);
    assert.ok(!existsSync(new URL('assets/img/map-base-1200.jpg', ROOT)));
  });
});

describe('home: what stays off the page, and the call', () => {
  test('no staff courtesy program, comments included', () => {
    assert.doesNotMatch(html, /courtesy/i);
  });
  test('no results section: no "real clinics, real numbers", no texting form, no results files', () => {
    assert.doesNotMatch(html, /id="results"|Real clinics|Oakbrook Terrace|results-updates|data-results/);
    assert.doesNotMatch(html, /results\.js/);
    assert.ok(!existsSync(new URL('assets/results.js', ROOT)));
    assert.ok(!existsSync(new URL('assets/data/results.json', ROOT)));
    assert.ok(!existsSync(new URL('updates-thanks.html', ROOT)));
  });
  test('no dinner on the home page (the FAQ links the add-ons)', () => {
    assert.doesNotMatch(main, /patient-network|patient dinner/i);
  });
  test('no placeholder text: the hidden case study template and the founding line are gone (November 21, 2026)', () => {
    assert.doesNotMatch(html, /\[[A-Z][A-Z :,'-]+\]|Case study|ind-founding|founding/i);
    assert.doesNotMatch(text(main), /\$\d|pricing|trial/i, 'no pricing on the home page');
  });
  test('the final call to action, with the phone number', () => {
    const s = sec('book');
    assert.match(text(s), /Book a 15-minute call\. We'll show you the businesses near you we would visit\./);
    assert.ok(links(s).some((l) => l.href === '/contact'));
    assert.ok(links(s).some((l) => l.href === 'tel:+13312716851' && /331-271-6851/.test(l.text)));
  });
});

describe('pricing came off (November 21, 2026)', () => {
  test('no pricing page; its addresses go to /contact; nothing in the sitemap', () => {
    assert.ok(!existsSync(new URL('pricing.html', ROOT)));
    const toml = read('netlify.toml');
    assert.match(toml, /from = "\/pricing"\n  to = "\/contact"\n  status = 301\n  force = true/);
    assert.match(toml, /from = "\/pricing\.html"\n  to = "\/contact"/);
    assert.doesNotMatch(read('sitemap.xml'), /pricing/);
  });
  test('the terms keep how prices are agreed in writing, with no figures and no pricing page', () => {
    const t = text(mainOf(read('terms.html')));
    assert.doesNotMatch(t, /\$\d|pricing page|\[[A-Z]/);
  });
});

describe('the Field Team page (was Boots on the ground, and before that the growth team page)', () => {
  const gt = read('field-team.html');
  test('the headline; Treats for Staff never tied to referrals; no breadcrumb', () => {
    assert.ok(/<h1 id="pg-h">/.test(gt));
    assert.doesNotMatch(gt, /pg-crumbs/, 'no breadcrumb');
    assert.match(text(gt), /Treats for Staff/);
    assert.doesNotMatch(text(gt), /whether or not they ever send anyone|whether or not anyone refers/, 'only the FAQ says that');
    assert.doesNotMatch(gt, /courtesy|Growth team/i);
    assert.doesNotMatch(text(mainOf(gt)), /Boots on the ground/i, 'the old slogan is retired');
    assert.doesNotMatch(text(gt), /month after month|whether or not you stay/);
  });
  test('the illustration: the clay team visit, AVIF and WebP, never wider than its 560px box below 960px', () => {
    const hero = /<section class="pg-hero[\s\S]*?<\/section>/.exec(gt)[0];
    const sizes = tags(hero, 'source').concat(tags(hero, 'img')).map((t) => attr(t, 'sizes')).filter(Boolean);
    assert.ok(sizes.length >= 2);
    for (const v of sizes) assert.equal(v, '(min-width:1180px) 520px, (min-width:960px) 44vw, (min-width:600px) 560px, calc(100vw - 40px)');
    for (const t of tags(hero, 'img')) { assert.match(attr(t, 'src'), /team-visit-/); assert.ok(existsSync(new URL('.' + attr(t, 'src'), ROOT)), attr(t, 'src')); }
  });
});

/* November 14, 2026: the portal tour. The portal's screens behind tabs, as in the portal's own side rail. */
describe('the portal tour (home, /field-team, /referral-network)', () => {
  const SCREENS = ['route', 'network', 'partners', 'results'];
  for (const [file, id, prefix] of [['index.html', 'dashboard', 'pt'], ['field-team.html', 'tracking', 'bt'], ['referral-network.html', 'dashboard', 'hw']]) {
    const s = byId(read(file), id);
    test(`${file} #${id}: four tabs, each wired to its own screen; the first one showing`, () => {
      assert.match(s, /<div class="ptour reveal" data-ptour>/);
      assert.match(s, /<div class="ptour-tabs" role="tablist" aria-label="Screens from the client portal">/);
      const btns = tags(s, 'button');
      assert.equal(btns.length, 4);
      btns.forEach((b, i) => {
        assert.equal(attr(b, 'role'), 'tab');
        assert.equal(attr(b, 'type'), 'button');
        assert.equal(attr(b, 'id'), `${prefix}-tab-${SCREENS[i]}`);
        assert.equal(attr(b, 'aria-controls'), `${prefix}-${SCREENS[i]}`);
        assert.equal(attr(b, 'aria-selected'), i === 0 ? 'true' : 'false');
        assert.equal(hasAttr(b, 'tabindex'), i !== 0, 'only the chosen tab is in the tab order');
      });
      const panels = tags(s, 'figure');
      assert.equal(panels.length, 4);
      panels.forEach((f, i) => {
        assert.ok(!hasAttr(f, 'role') && !hasAttr(f, 'aria-labelledby'), 'plain figures until site.js makes them tab panels');
        assert.equal(attr(f, 'id'), `${prefix}-${SCREENS[i]}`);
        assert.equal(hasAttr(f, 'hidden'), i !== 0, 'only the first screen shows before a tab is chosen');
      });
    });
    test(`${file} #${id}: the phone screens on phones, the desktop screens elsewhere, every one described as the client portal`, () => {
      const imgs = tags(s, 'img');
      assert.equal(imgs.length, 4);
      for (const img of imgs) {
        assert.match(attr(img, 'src'), /^\/assets\/img\/portal2-(stops|network|partners|routes)-1280\.jpg$/);
        assert.match(attr(img, 'alt'), /^Screenshot of the client portal: /);
        assert.equal(attr(img, 'loading'), 'lazy');
      }
      const phone = tags(s, 'source').filter((t) => attr(t, 'media') === '(max-width:759.98px)');
      assert.equal(phone.length, 12, 'avif, webp and jpg for each of the four phone screens');
      for (const t of phone) assert.match(attr(t, 'srcset'), /\/assets\/img\/portal2-phone-/);
    });
  }
  test('site.js drives the tabs (click, arrow keys, Home, End) and every screen shows without it', () => {
    const js = read('assets/site.js');
    assert.match(js, /querySelectorAll\('\[data-ptour\]'\)/);
    assert.match(js, /panel\.setAttribute\('role', 'tabpanel'\); panel\.setAttribute\('aria-labelledby', t\.id\)/, 'the panels become tab panels only when the tabs work');
    for (const k of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) assert.ok(js.includes(k), k);
    assert.match(read('assets/site.css'), /html:not\(\.js\) \.ptour-panel\[hidden\]\{display:block\}/);
  });
  test('the old driver screens and driver photos are gone', () => {
    for (const f of ['index.html', 'field-team.html', 'referral-network.html']) assert.doesNotMatch(read(f), /drivers?-(card|next-route|orb|phone|stop|elena|marcus|omar|tasha)/, f);
    assert.ok(!existsSync(new URL('assets/img/drivers-card-546.jpg', ROOT)));
    assert.ok(!existsSync(new URL('assets/img/driver-marcus.jpg', ROOT)));
  });
});

describe('November 23, 2026: honest figures and a testimonial slot', () => {
  test('the five figures are labelled as a demo account, on the home page and the Field Team page', () => {
    for (const f of ['index.html', 'field-team.html']) {
      const m = mainOf(read(f));
      assert.match(m, /<p class="own-stats-note reveal">Example results from a demo account\.<\/p>\s*<dl class="own-stats reveal" aria-label="Example results from a demo account: five routes in the portal">/, f);
      for (const [k, v] of [['Stops visited', 35], ['Staff reached', 207], ['Referral cards handed out', 262], ['Staff sign-ups', 64], ['Booked by the front desk', 37]]) assert.match(m, new RegExp(`<dt>${k}</dt><dd>${v}</dd>`), `${f}: ${k}`);
    }
  });
  test('the testimonial stays hidden (commented out) until the owner gives a real quote; nothing invented shows', () => {
    const m = mainOf(read('index.html'));
    assert.doesNotMatch(m.replace(/<!--[\s\S]*?-->/g, ''), /id="testimonial"|own-quote/, 'not on the page');
    assert.match(m, /<!-- ===== Testimonial: HIDDEN[\s\S]*?id="testimonial"[\s\S]*?The client's exact words go here\.[\s\S]*?-->/, 'ready in a comment');
    assert.ok(m.indexOf('Testimonial: HIDDEN') > m.indexOf('id="dashboard"') && m.indexOf('Testimonial: HIDDEN') < m.indexOf('id="book"'), 'between the portal and the call');
  });
});
