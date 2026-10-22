// Shared helpers for the static page tests (not a test file itself; node --test runs *.test.mjs).
// Regex based: the markup is ours and regular.
import { readFileSync, readdirSync } from 'node:fs';

export const ROOT = new URL('../', import.meta.url);
export const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');

/* Every page of the site, with its clean URL and its tab in the header (null: no tab). */
export const PAGES = [
  { file: 'index.html', url: '/', tab: 'Home' },
  { file: 'referral-network.html', url: '/referral-network', tab: 'Referral Network' },
  { file: 'flyer-network.html', url: '/flyer-network', tab: 'Flyer Network' },
  { file: 'patient-network.html', url: '/patient-network', tab: 'Patient Network' },
  { file: 'online-search-network.html', url: '/online-search-network', tab: 'Online Search Network' },
  { file: 'review-tags.html', url: '/review-tags', tab: 'Review Tags' },
  { file: 'website-design.html', url: '/website-design', tab: 'Website Design' },
  { file: 'client-portal.html', url: '/client-portal', tab: 'Client Portal' },
  { file: 'about.html', url: '/about', tab: 'About' },
  { file: 'faq.html', url: '/faq', tab: 'FAQ' },
  { file: 'contact.html', url: '/contact', tab: 'Contact' },
  { file: 'privacy.html', url: '/privacy', tab: null },
  { file: 'terms.html', url: '/terms', tab: null },
  { file: 'thanks.html', url: '/thanks', tab: null },
  { file: '404.html', url: null, tab: null }
];
/* The header tabs, in order: Home, the three steps (Referral Network, Flyer Network, Patient Network), the extras, then About, FAQ and Contact. */
export const TABS = PAGES.filter((p) => p.tab).map((p) => [p.tab, p.url]);
/* The pages in the top row of the desktop header, beside the button (they stay in the menu on phones). */
export const UTIL = ['/about', '/faq', '/contact'];

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
