// Shared helpers for the static page tests (not a test file itself; node --test runs *.test.mjs).
// Regex based: the markup is ours and regular.
import { readFileSync, readdirSync } from 'node:fs';

export const ROOT = new URL('../', import.meta.url);
export const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');

/* Every page of the site, with its clean URL and its item in the main menu (null: not in the menu).
   November 21, 2026: the full site without pricing. The menu is Home, Field Team, Industries, How It Works
   (/referral-network), FAQ, About and Contact, plus the Client Portal button. Pricing came off (/pricing 301s to
   /contact), and the eight industry pages became sections of /industries (their old addresses 301 there). */
export const PAGES = [
  { file: 'index.html', url: '/', nav: 'Home' },
  { file: 'field-team.html', url: '/field-team', nav: 'Field Team' },
  { file: 'industries.html', url: '/industries', nav: 'Industries' },
  { file: 'referral-network.html', url: '/referral-network', nav: 'How It Works' },
  { file: 'faq.html', url: '/faq', nav: 'FAQ' },
  { file: 'about.html', url: '/about', nav: 'About' },
  { file: 'contact.html', url: '/contact', nav: 'Contact' },
  { file: 'patient-network.html', url: '/patient-network', nav: null },
  { file: 'online-search-network.html', url: '/online-search-network', nav: null },
  { file: 'review-tags.html', url: '/review-tags', nav: null },
  { file: 'website-design.html', url: '/website-design', nav: null },
  { file: 'expo-vendors.html', url: '/expo-vendors', nav: null, brandOnly: true, noindex: true },
  { file: 'privacy.html', url: '/privacy', nav: null },
  { file: 'terms.html', url: '/terms', nav: null },
  { file: 'thanks.html', url: '/thanks', nav: null, noindex: true },
  { file: '404.html', url: null, nav: null, noindex: true }
];
/* The main menu, in order, then the Client Portal button. */
export const NAV = [['Home', '/'], ['Field Team', '/field-team'], ['Industries', '/industries'], ['How It Works', '/referral-network'], ['FAQ', '/faq'], ['About', '/about'], ['Contact', '/contact']];
/* The industries, in order: their sections on /industries (and the old /industries/<slug> pages that 301 there). */
export const INDUSTRIES = ['med-spas', 'dental', 'chiropractic-physical-therapy', 'gyms-fitness-studios', 'salons-barbershops', 'restaurants-cafes', 'home-services', 'auto-shops'];
export const PORTAL = 'https://www.ournetworkportal.com';
export const ORIGIN = 'https://ouroptimization.com';
/* Words that must never appear on the site, built from pieces so this file does not contain them. */
export const FORBIDDEN = [
  ['Our', 'Wellness', 'Connections'].join(' '), '$' + '400 a month', '$' + '800 a month', '$' + '500 a month', '$' + '700', '$' + '1,400',
  ['three', 'tap-to-sign-up', 'stands'].join(' '), ['signs made for you at no', 'extra cost'].join(' ')
];

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', eacute: 'é', middot: '·', copy: '©', hellip: '…' };
export const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => (n in ENTITIES ? ENTITIES[n] : m));
/* Visible text: comments, scripts and tags removed, entities decoded, curly quotes straight, spaces collapsed. */
export const text = (s) => decode(s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ''))
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
export const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? (m[1] ?? m[2]) : null;
};
export const hasAttr = (tag, name) => new RegExp(`\\s${name}(?:\\s*=|[\\s>/])`, 'i').test(tag);
export const tags = (src, name) => [...src.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
/* Inner HTML of the element with this id (handles nesting of the same tag name). */
export function byId(src, id) {
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
export const mainOf = (src) => src.slice(src.indexOf('<main'), src.indexOf('</main>'));
export const links = (src) => [...src.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: attr(m[0], 'href'), text: text(m[1]), tag: m[0] }));

/* Every text file in the repository (not .git, not the fonts, not images other than SVG). */
export function repoTextFiles() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(new URL(dir, ROOT), { withFileTypes: true })) {
      const p = dir + e.name;
      if (e.isDirectory()) { if (!['.git', 'node_modules', 'fonts'].includes(e.name)) walk(p + '/'); continue; }
      if (/\.(html|css|js|mjs|md|toml|xml|txt|webmanifest|json|svg)$/i.test(e.name) || ['.gitignore'].includes(e.name)) out.push(p);
    }
  };
  walk('');
  return out;
}
