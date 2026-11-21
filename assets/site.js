/* Our Wellness Network: shared site behaviour.
   Loaded with defer on every page. No dependencies, no third-party requests. */
(function () {
  var root = document.documentElement;
  /* Tells the inline head script that behaviour loaded, so it keeps the .js styles. */
  window.__owoReady = true;
  root.classList.add('js'); /* restore it if a slow load made the head script drop it */

  /* Every page opens at its top. Some browsers and embedded previews carry the last page's scroll position
     over when a menu tab is clicked, which dropped visitors at the bottom of the new page. A link to a
     section (#pricing-faq) still opens at that section. */
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  var toTop = function () { if (!window.location.hash) { try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); } } };
  toTop();
  window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });

  /* Old links to home page sections that now live on other pages: /#formats opens the dinner page, /#add-ons the
     pricing page's add-ons, and /#call (the home page's call band came off on October 22, 2026) the call form on
     /contact, with any old query (/#call?package=website) carried along. Sections that moved back onto the home page
     on November 21, 2026 (#how-it-works, #faq, #who) are handled below. */
  var MOVED = {
    formats: '/patient-network#formats', handle: '/patient-network#handle',
    'add-ons': '/pricing#add-ons', call: '/contact#call'
  };
  var old = /^#([A-Za-z][\w-]*)(?:\?(.*))?$/.exec(window.location.hash);
  if (old && (window.location.pathname === '/' || window.location.pathname === '/index.html') &&
      Object.prototype.hasOwnProperty.call(MOVED, old[1]) && !document.getElementById(old[1])) {
    var to = MOVED[old[1]].split('#');
    var q = window.location.search;
    if (old[2]) q = (q ? q + '&' : '?') + old[2];
    window.location.replace(to[0] + q + (to[1] ? '#' + to[1] : ''));
    return;
  }

  /* /review-tags#in-use (the stand photo section, removed October 22, 2026) now opens the NFC explainer, #nfc. */
  if (/^\/review-tags(?:\.html)?$/.test(window.location.pathname) && window.location.hash === '#in-use' && !document.getElementById('in-use')) {
    var nfc = document.getElementById('nfc');
    if (nfc) {
      try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + '#nfc'); } catch (e) { /* keep the URL as it is */ }
      nfc.scrollIntoView();
    }
  }

  /* Old links to retired pages 301 to a page or a section (/meeting to /contact). If a redirect carried
     the old query string after the fragment (/patient-network#how?ref=x), put the query back in front
     of the # and open the section, so the visitor still lands on it. */
  var stray = /^#([A-Za-z][\w-]*)\?(.*)$/.exec(window.location.hash);
  var strayTarget = stray && document.getElementById(stray[1]);
  if (strayTarget) {
    var query = window.location.search;
    if (stray[2]) query = (query ? query + '&' : '?') + stray[2];
    try { window.history.replaceState(window.history.state, '', window.location.pathname + query + '#' + stray[1]); } catch (e) { /* keep the URL as it is */ }
    strayTarget.scrollIntoView();
  }

  /* Old names for sections of the home page (simplified November 21, 2026): /#dashboard and /#portal open the portal
     screenshot, /#industries opens "Who is this for?", and the old How it works and treats sections open their answers. */
  var ALIAS = {
    portal: 'what-you-get', breakdown: 'what-you-get', dashboard: 'what-you-get', how: 'how-it-works', referrals: 'how-it-works',
    'flyer-drops': 'how-it-works', industries: 'who', treats: 'visits', 'in-person': 'visits', compliance: 'paid',
    /* sections of the old How it works page (/referral-network now 301s to the home page, keeping its #section) */
    matching: 'how-it-works', choosing: 'how-it-works', route: 'how-it-works', month: 'how-it-works', roles: 'how-it-works',
    nfc: 'visits', agreement: 'paid'
  };
  var alias = /^#([A-Za-z][\w-]*)$/.exec(window.location.hash);
  if (alias && ALIAS[alias[1]] && !document.getElementById(alias[1])) {
    var aliasTarget = document.getElementById(ALIAS[alias[1]]);
    if (aliasTarget) {
      try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + '#' + ALIAS[alias[1]]); } catch (e) { /* keep the URL */ }
      aliasTarget.scrollIntoView();
    }
  }

  /* A link to one of the home page's questions (/#healthcare) opens that answer. */
  var openAnswer = function () {
    var id = /^#([A-Za-z][\w-]*)$/.exec(window.location.hash);
    var el = id && document.getElementById(id[1]);
    if (el && el.tagName === 'DETAILS') el.open = true;
  };
  openAnswer();
  window.addEventListener('hashchange', openAnswer);

  /* Site switches from /assets/site-config.js: an element with data-flag="name" stays hidden until that switch is
     true. With data-flag-text="key", its text comes from that config value, so the sentence is not in the page
     while the switch is off. */
  var config = window.OWC_CONFIG || {};
  document.querySelectorAll('[data-flag]').forEach(function (el) {
    if (config[el.getAttribute('data-flag')] !== true) return;
    var key = el.getAttribute('data-flag-text');
    if (key) {
      var slot = el.querySelector('span') || el;
      if (typeof config[key] !== 'string' || !config[key]) return;
      slot.textContent = config[key];
    }
    el.hidden = false;
  });

  /* Header: hairline once the page scrolls. */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
