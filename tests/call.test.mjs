// Static checks of the patient dinner home page (index.html, thanks.html) and unit tests
// for the call form rules in assets/call.js.
// Zero dependencies: node:test + node:assert. Run from the repo root: node --test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const call = require('../assets/call.js');
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const html = read('index.html');
const thanks = read('thanks.html');
const js = read('assets/call.js');
const css = read('assets/site.css');

/* ---------- tiny HTML helpers (regex based; the markup is ours and regular) ---------- */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', eacute: 'é', middot: '·', copy: '©', hellip: '…' };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => (n in ENTITIES ? ENTITIES[n] : m));
/* Visible text: tags removed, entities decoded, curly apostrophes made straight, spaces collapsed. */
const text = (s) => decode(s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ''))
  .replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? (m[1] ?? m[2]) : null;
};
const hasAttr = (tag, name) => new RegExp(`\\s${name}(?:\\s*=|[\\s>/])`, 'i').test(tag);
const tags = (src, name) => [...src.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
/* Inner HTML of the element with this id (handles nesting of the same tag name). */
function byId(src, id) {
  const open = new RegExp(`<([a-z0-9]+)\\b[^>]*\\sid="${id}"[^>]*>`, 'i').exec(src);
  if (!open) return null;
  const name = open[1];
  const re = new RegExp(`<${name}\\b[^>]*>|</${name}>`, 'gi');
  re.lastIndex = open.index + open[0].length;
  let depth = 1, m;
  while ((m = re.exec(src))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return src.slice(open.index + open[0].length, m.index);
  }
  return null;
}
const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const formOpen = tags(html, 'form').find((t) => attr(t, 'name') === 'dinner-call');
const form = html.slice(html.indexOf(formOpen), html.indexOf('</form>', html.indexOf(formOpen)));

/* ---------- the page ---------- */
describe('home page: head', () => {
  test('title, description and share image', () => {
    assert.match(html, /<title>Your Best Patients Bring the Next Ones \| Patient Dinners for Med Spas<\/title>/);
    const metas = tags(html, 'meta');
    const meta = (key, val) => metas.find((t) => attr(t, key) === val);
    for (const [k, v] of [['name', 'description'], ['property', 'og:description'], ['name', 'twitter:description']]) {
      const content = decode(attr(meta(k, v), 'content'));
      assert.ok(content.startsWith('Your best patients bring the next ones. '), `${v} leads with the headline idea`);
      assert.match(content, /patient dinners/i, `${v} mentions patient dinners`);
      assert.match(content, /med spas/i, `${v} mentions med spas`);
      assert.match(content, /western suburbs/i, `${v} names the area`);
    }
    assert.equal(attr(meta('property', 'og:image'), 'content'), 'https://ouroptimization.com/assets/img/og-dinners.jpg');
    assert.equal(attr(meta('property', 'og:image:width'), 'content'), '1200');
    assert.equal(attr(meta('property', 'og:image:height'), 'content'), '630');
    assert.ok(attr(meta('property', 'og:image:alt'), 'content').length > 20, 'og:image:alt is descriptive');
    assert.match(html, /<link rel="canonical" href="https:\/\/ouroptimization\.com\/">/);
  });

  test('JSON-LD: ProfessionalService with phone and email, and no prices, ratings or reviews', () => {
    const raw = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1];
    const data = JSON.parse(raw);
    assert.equal(data['@type'], 'ProfessionalService');
    assert.equal(data.telephone, '+1-331-271-6851');
    assert.equal(data.email, 'mustafa@ouroptimization.com');
    assert.match(data.description, /patient dinners/i);
    assert.doesNotMatch(raw, /price|offers|rating|review/i);
  });
});

describe('home page: hero', () => {
  test('h1 is exactly "Your best patients bring the next ones."', () => {
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(h1s.length, 1, 'one h1');
    assert.equal(h1s[0][1], 'Your best patients <em>bring the next ones.</em>');
    assert.equal(text(h1s[0][1]), 'Your best patients bring the next ones.');
  });

  test('the eyebrow above the h1 stays', () => {
    const hero = html.slice(html.indexOf('<section class="hero'), html.indexOf('<h1'));
    assert.match(text(hero), /Patient dinners for independent med spas\s*$/i);
  });

  test('the old "demographic and community" wording is gone', () => {
    assert.doesNotMatch(html, /demographic/i);
  });

  test('lede says what we do, without repeating the h1', () => {
    const lede = text(/<p class="lede">([\s\S]*?)<\/p>/.exec(html)[1]);
    assert.doesNotMatch(lede, /bring the next ones/i, 'the h1 line is not said twice');
    assert.ok(lede.startsWith('We plan and run '), lede);
    assert.match(lede, /private restaurant dinners for independent med spas/);
    assert.match(lede, /referral network around your clinic/);
  });

  test('CTAs: the call booking and the phone number', () => {
    const hero = html.slice(html.indexOf('<section class="hero'), html.indexOf('</section>'));
    const links = [...hero.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: attr(m[0], 'href'), text: text(m[1]) }));
    assert.deepEqual(links, [
      { href: '/#call', text: 'Book a 15-minute call' },
      { href: 'tel:+13312716851', text: 'Call or text 331-271-6851' }
    ]);
    assert.match(text(hero), /You talk with Mustafa directly\./);
    assert.doesNotMatch(text(hero), /\bfree\b/i, 'the brief never says the call is free');
  });

  test('map: new art, the five places and their channels, no school line', () => {
    assert.match(html, /<img class="town-img" src="assets\/img\/hero-map\.svg" alt="" width="1100" height="1175" fetchpriority="high" decoding="async">/);
    const chips = [...html.matchAll(/<li class="tp\b[^"]*"[^>]*>([\s\S]*?)<\/li>/g)]
      .map((m) => [...m[1].matchAll(/<span class="tp-(?:place|ch)">([\s\S]*?)<\/span>/g)].map((s) => text(s[1])).join(' / '));
    assert.deepEqual(chips.sort(), [
      'Neighborhoods / Google Ads',
      'Offices / Referral network',
      'Restaurants / Sponsored events',
      'Small businesses / Flyer drops',
      'Training facilities / Partner referrals',
      'Your clinic'
    ]);
    const tpList = /<ul class="tp-list"[^>]*>([\s\S]*?)<\/ul>/.exec(html)[1];
    const pairs = [...tpList.matchAll(/<li><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/li>/g)].map((m) => `${text(m[1])} / ${text(m[2])}`);
    assert.deepEqual(pairs, [
      'Offices / Referral network',
      'Small businesses / Flyer drops',
      'Training facilities / Partner referrals',
      'Restaurants / Sponsored events',
      'Neighborhoods / Google Ads'
    ]);
    const net = /<svg class="net"[\s\S]*?<\/svg>/.exec(html)[0];
    const dots = [...net.matchAll(/<circle class="net-dot"[^>]*cx="(\d+)" cy="(\d+)"/g)].map((m) => `${m[1]},${m[2]}`);
    assert.deepEqual(dots.sort(), ['119,600', '265,250', '269,470', '399,830', '575,214', '830,752', '927,540'].sort());
    assert.equal((net.match(/class="net-line"/g) || []).length, 7);
    assert.doesNotMatch(net, /871 262|871,262|cx="871"/, 'no line or dot to the school');
    assert.doesNotMatch(html, /mosque|church|temple|festival/i, 'worship places and the festival are gone');
    const note = text(/<p class="tp-note">([\s\S]*?)<\/p>/.exec(html)[1]);
    assert.equal(note, 'Sponsored events are your patient dinners, at a restaurant near your clinic.', 'visible note under the map');
    const label = attr(tags(html, 'figure').find((t) => /class="town"/.test(t)), 'aria-label');
    for (const word of ['clinic', 'offices', 'referral network', 'flyer drops', 'training facilities', 'restaurants', 'Google Ads']) {
      assert.ok(label.includes(word), `map label mentions ${word}`);
    }
  });
});

describe('home page: sections', () => {
  test('sections in order: formats, how, handle, who, add-ons, faq, call', () => {
    const ids = ['formats', 'how', 'handle', 'who', 'add-ons', 'faq', 'call'];
    const at = ids.map((id) => main.search(new RegExp(`<section\\b[^>]*\\sid="${id}"`)));
    for (let i = 0; i < ids.length; i++) assert.ok(at[i] > 0, `section #${ids[i]} exists`);
    assert.deepEqual([...at].sort((a, b) => a - b), at, 'sections are in order');
  });

  test('add-ons: referral network first (#referrals), flyer drops, Google Ads last as the cherry on top', () => {
    const addons = byId(html, 'add-ons');
    const ref = addons.indexOf('id="referrals"');
    const flyers = addons.indexOf('Flyer drops');
    const ads = addons.indexOf('>Google Ads</h3>');
    assert.ok(ref > 0 && flyers > ref && ads > flyers, 'order: referrals, flyers, Google Ads');
    assert.match(text(byId(html, 'referrals')), /The growth behind the ads\./);
    assert.match(text(byId(html, 'referrals')), /mapping software and local business data/);
    assert.match(text(byId(html, 'referrals')), /we set up, or help you set up, a referral network/);
    const adsCard = text(addons.slice(addons.lastIndexOf('<article', ads)));
    assert.match(adsCard, /The cherry on top/);
    assert.match(adsCard, /You pay Google directly, in your own account\./);
    assert.match(adsCard, /We drive the growth behind the ads\./);
  });

  test('referral partnerships stay introductions and cross-promotion, with no per-patient payments', () => {
    const ref = text(byId(html, 'referrals'));
    assert.match(ref, /Cross-promotion\./);
    assert.match(ref, /Nobody is paid per patient\./);
    assert.doesNotMatch(text(main), /referral fee|per referral|commission|kickback/i);
    assert.doesNotMatch(text(main), /\b(AI|proprietary|algorithm|database of)\b/, 'the mapping tool is described generically');
  });

  test('two formats with the brief\'s numbers, and the sales evening said plainly', () => {
    const formats = text(byId(html, 'formats'));
    assert.match(formats, /The Plus-One Dinner/);
    assert.match(formats, /About 15 of your favorite patients each bring a friend who isn't a patient yet\./);
    assert.match(formats, /The VIP Night/);
    assert.match(formats, /Up to 30 of your best patients/);
    assert.match(formats, /For spas whose books are already full\./);
    assert.match(formats, /It is a sales evening, and we say so\./);
  });

  test('no price figure: the card and the FAQ explain how pricing works instead', () => {
    const formats = text(byId(html, 'formats'));
    for (const line of ['No surprises', 'One fixed quote per dinner.', 'Restaurant and food included.', 'Quoted for your clinic after the 15-minute call.', 'The price is fixed in writing before you commit.', 'No monthly contract.']) {
      assert.ok(formats.includes(line), line);
    }
    const faq = text(byId(html, 'faq'));
    assert.match(faq, /We quote it for your clinic after the 15-minute call/);
    assert.doesNotMatch(text(html), /\$\s?\d|\b\d[\d,]*\s?(dollars|usd)\b|\bfrom \$|per dinner, restaurant/i, 'no dollar amounts anywhere on the home page');
    assert.doesNotMatch(html, /2,000/, 'the old price is gone from the markup too');
  });

  test('how it works: four steps, plan, invitations, the night, the follow-up', () => {
    const how = byId(html, 'how');
    const steps = [...how.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((m) => text(m[1]));
    assert.deepEqual(steps, ['Plan', 'Invitations', 'The night', 'The follow-up']);
    assert.match(text(how), /results sheet: who came, how many were new, and what they booked/);
  });

  test('what we handle: the brief\'s checklist and the patient list promise', () => {
    const handle = byId(html, 'handle');
    const list = /<ul class="dn-checks"[^>]*>([\s\S]*?)<\/ul>/.exec(handle)[1];
    const items = [...list.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]));
    assert.deepEqual(items, [
      'The restaurant and the food',
      'The menu, set with the venue',
      "Invitations designed in your clinic's name",
      'An RSVP page',
      'Reminder messages',
      'Name cards and seating',
      'The run of the evening',
      'An offer card with its own code',
      'The next-day follow-up',
      'A results sheet at 30 days: who came, how many were new, what they booked'
    ]);
    const t = text(handle);
    assert.match(t, /Your patient list stays yours\. We never see it\./);
    assert.match(t, /We never receive, see or keep your patient list\./);
    assert.match(t, /If your Allergan or Galderma rep sponsors events, we plan the dinner with them\./);
  });

  test('who we are: honest that nothing has been held yet, and Mustafa\'s contact links', () => {
    const who = byId(html, 'who');
    const t = text(who);
    assert.match(t, /running our first patient dinners now/);
    assert.match(t, /None has been held yet/);
    assert.match(t, /With your permission, your clinic's results will be among our first case studies\./);
    assert.match(t, /We already run marketing for a wellness clinic nearby\./);
    assert.match(who, /<a href="tel:\+13312716851">[\s\S]*?331-271-6851<\/a>/);
    assert.match(who, /<a href="mailto:mustafa@ouroptimization\.com">[\s\S]*?mustafa@ouroptimization\.com<\/a>/);
  });

  test('FAQ: exactly the seven questions from the brief, in order', () => {
    const faq = byId(html, 'faq');
    const qs = [...faq.matchAll(/<summary>([\s\S]*?)<span class="sign"/g)].map((m) => text(m[1]));
    assert.deepEqual(qs, [
      "Can't I just book a restaurant myself?",
      'Will people actually come on a weeknight?',
      'Is it a sales evening?',
      'Do you ever see my patient list?',
      'My rep already sponsors events. Why use you?',
      'What does it cost?',
      'Who are you?'
    ]);
    const answers = [...faq.matchAll(/<div class="answer">([\s\S]*?)<\/div>/g)].map((m) => text(m[1]));
    assert.equal(answers.length, 7);
    assert.ok(answers[2].startsWith('Yes.'), 'the sales evening answer is a plain yes');
    assert.ok(answers[3].startsWith('No.'), 'we never see the patient list');
    assert.match(answers[3], /We see the replies guests send there/, 'says what we do see');
    assert.match(answers[6], /with your permission, your clinic's results/, 'case studies need the clinic\'s permission');
    assert.match(answers[1], /can't promise a number/, 'no turnout promise');
  });

  test('content images: the dinner illustration, and the Grace Pediatrics photo as client proof', () => {
    const imgs = tags(main, 'img');
    const content = imgs.filter((t) => !/class="town-img"/.test(t));
    assert.deepEqual(content.map((t) => attr(t, 'src')), ['assets/img/dinner-table.svg', 'assets/img/kit-tins-640.jpg']);
    assert.match(attr(content[0], 'alt'), /^Illustration of a restaurant table set for a private dinner/);
    const illus = /<figure class="dn-illus">([\s\S]*?)<\/figure>/.exec(main)[1];
    assert.doesNotMatch(illus, /<figcaption/, 'no visible caption on the dinner illustration, and never one calling it our event');
    assert.match(attr(content[1], 'alt'), /Grace Pediatrics/);
    assert.doesNotMatch(main, /<video\b/i, 'no video on the home page');
  });

  test('Grace Pediatrics appears once, in Who we are, as community marketing proof', () => {
    const who = main.slice(main.indexOf('id="who"'), main.indexOf('id="add-ons"'));
    const proof = /<figure class="dn-proof">[\s\S]*?<figcaption>([\s\S]*?)<\/figcaption>/.exec(who);
    assert.ok(proof, 'the client work figure sits in #who');
    assert.equal(text(proof[1]), 'Client work: Grace Pediatrics in Glendale Heights. We ran its community marketing: flyers for local families, branded gift tins, an event table and QR codes that track every scan.');
    assert.doesNotMatch(text(proof[1]), /\d|dinner/i, 'no numbers or results, and not called a dinner');
    assert.match(text(who), /None has been held yet/, 'still says no dinner has been held');
    const outside = main.replace(who, '');
    assert.doesNotMatch(outside, /grace/i, 'Grace appears only in Who we are');
  });

  test('referral network: mutual promotion only, nothing paid per patient or client', () => {
    const addons = text(main.slice(main.indexOf('id="add-ons"'), main.indexOf('id="faq"')));
    assert.ok(addons.includes('Partners promote each other. Nobody is paid per patient.'), 'the no-payment note');
    for (const k of ['Introductions.', 'Cross-promotion.', 'Referral cards with their own code.']) assert.ok(addons.includes(k), k);
    assert.doesNotMatch(text(main), /commission|referral fee|finder'?s fee|kickback|reward|bounty|earns?\b|per (client|referral|referred)|what each one sends/i);
    assert.equal((text(main).match(/\bpaid\b/gi) || []).length, 1, '"paid" appears only in the no-payment note');
  });

  test('no invented proof: no testimonials, ratings, statistics or "as seen on"', () => {
    const t = text(main);
    assert.doesNotMatch(t, /testimonial|as seen on|\d+\s?%|\b5[- ]star|rated\b|guarantee/i);
    assert.doesNotMatch(t, /\b(will|we'll) (get|bring|fill|double|triple)\b/i, 'no promised outcomes');
    assert.doesNotMatch(t, /are your future patients|demand your community network creates/i, 'no outcome stated as certain');
  });

  test('no em or en dashes anywhere in the new pages, the script or the new CSS block', () => {
    const block = css.slice(css.indexOf('Patient dinners (October 2026)'));
    for (const [name, src] of [['index.html', html], ['thanks.html', thanks], ['assets/call.js', js], ['site.css dinner block', block]]) {
      assert.doesNotMatch(src, /[–—]|&mdash;|&ndash;|&#821[12];/, name);
    }
  });

  test('header and footer link only to kept pages and home sections', () => {
    const retired = ['how-it-works', 'services', 'community-marketing', 'custom-marketing', 'digital-marketing', 'industries', 'examples', 'estimate', 'market-research', 'direct-mail', 'events', 'flyers', 'marketing-kits', 'seo', 'google-ads', 'social-media', 'groupon', 'gift-cards', 'tracking', 'sample-advertisements', 'faq'];
    for (const [name, src] of [['index.html', html], ['thanks.html', thanks]]) {
      const hrefs = tags(src, 'a').map((t) => attr(t, 'href'));
      for (const r of retired) assert.ok(!hrefs.some((h) => new RegExp(`^/?${r}(?:\\.html)?(?:[?#]|$)`).test(h)), `${name} links /${r}`);
    }
    const nav = /<nav class="site-nav"[\s\S]*?<\/nav>/.exec(html)[0];
    const items = [...nav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) => `${text(m[1])} ${attr(m[0], 'href')}`);
    assert.deepEqual(items, ['Home /', 'Patient Dinners /#formats', 'How It Works /#how', 'Referral Network /#referrals', 'FAQ /#faq', 'Book a 15-minute call /#call']);
  });
});

describe('home page: the call form', () => {
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
    assert.deepEqual(radios.map((t) => attr(t, 'value')), ['Plus-One Dinner', 'VIP Night', 'Not sure yet']);
    assert.ok(radios.every((t) => attr(t, 'type') === 'radio' && hasAttr(t, 'required')));
    assert.deepEqual(radios.map((t) => attr(t, 'value')), call.DINNERS, 'call.js knows the same three dinners');

    for (const t of controls) {
      const id = attr(t, 'id');
      if (id) assert.match(form, new RegExp(`<label for="${id}">`), `label for #${id}`);
      else assert.ok(new RegExp(`<label>${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(form), `${attr(t, 'name')} is wrapped in its label`);
    }
    assert.match(text(byId(html, 'call')), /Email \(optional\)/);
    assert.match(text(byId(html, 'call')), /Message \(optional\)/);

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

  test('the patient information line, the submit button and the call-now line', () => {
    const t = text(byId(html, 'call'));
    assert.match(t, /Please don't include any patient information\./);
    assert.match(form, /aria-describedby="call-message-help call-message-note call-message-err"/);
    assert.match(form, /<button class="btn btn-primary" type="submit">Book my 15-minute call<\/button>/);
    assert.match(t, /Prefer to talk now\? Call or text Mustafa at 331-271-6851\./);
    assert.match(html, /<script src="assets\/call\.js" defer><\/script>/);
  });
});

describe('thanks page', () => {
  test('noindex, canonical, favicon block and the site stylesheet', () => {
    assert.match(thanks, /<meta name="robots" content="noindex">/);
    assert.match(thanks, /<link rel="canonical" href="https:\/\/ouroptimization\.com\/thanks">/);
    for (const link of ['<link rel="icon" href="/favicon.ico" sizes="32x32">', '<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">', '<link rel="apple-touch-icon" href="/apple-touch-icon.png">', '<link rel="manifest" href="/site.webmanifest">']) {
      assert.ok(thanks.includes(link), link);
    }
    assert.match(thanks, /<link rel="stylesheet" href="\/assets\/site\.css">/);
  });

  test('says Mustafa will call at the time they picked, with his number, email and a way home', () => {
    const t = text(thanks.slice(thanks.indexOf('<main'), thanks.indexOf('</main>')));
    assert.match(t, /Mustafa will call you at the time you picked/);
    assert.match(thanks, /<a href="tel:\+13312716851">331-271-6851<\/a>/);
    assert.match(thanks, /<a href="mailto:mustafa@ouroptimization\.com">mustafa@ouroptimization\.com<\/a>/);
    assert.match(thanks, /<a class="btn btn-primary" href="\/">Back to the home page<\/a>/);
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

describe('call.js: which dinner (required radio)', () => {
  for (const v of ['Plus-One Dinner', 'VIP Night', 'Not sure yet']) {
    test(`accepts ${v}`, () => assert.equal(errorFor('dinner', { dinner: v }), ''));
  }
  for (const v of ['', 'Plus-One', 'vip night', 'Something else']) {
    test(`rejects ${JSON.stringify(v)}`, () => assert.notEqual(errorFor('dinner', { dinner: v }), ''));
  }
});

describe('call.js: message (optional)', () => {
  test('empty is fine, very long is not', () => {
    assert.equal(errorFor('message', { message: '' }), '');
    assert.equal(errorFor('message', { message: 'x'.repeat(2000) }), '');
    assert.notEqual(errorFor('message', { message: 'x'.repeat(2001) }), '');
  });
});

describe('call.js: ?about= prefill', () => {
  test('known keys', () => {
    assert.equal(call.aboutFromSearch('?about=website-design'), 'website-design');
    assert.equal(call.aboutFromSearch('?about=review-tags'), 'review-tags');
    assert.equal(call.aboutFromSearch('?ref=x&about=Review-Tags'), 'review-tags');
    assert.equal(call.aboutFromSearch('?about=%20website-design%20'), 'website-design');
  });
  test('anything else is ignored', () => {
    for (const s of ['', '?', '?about=', '?about=seo', '?about=website-design-x', '?xabout=review-tags', '?about=%E0%A4%A', '?about=__proto__', '?about=constructor']) {
      assert.equal(call.aboutFromSearch(s), '', s);
    }
  });
  test('prefill text, only into an empty message', () => {
    assert.equal(call.prefillFor('?about=website-design', ''), "I'm asking about a website redesign.");
    assert.equal(call.prefillFor('?about=review-tags', '   '), "I'm asking about review tags.");
    assert.equal(call.prefillFor('?about=review-tags', 'My own words'), '');
    assert.equal(call.prefillFor('?about=nothing', ''), '');
    assert.equal(call.prefillFor('', ''), '');
  });
});
