/* OUR Optimization — shared site behaviour.
   Loaded with defer on every page. No dependencies, no third-party requests. */
(function () {
  var root = document.documentElement;
  /* Tells the inline head script that behaviour loaded, so it keeps the .js styles. */
  window.__owoReady = true;
  root.classList.add('js'); /* restore it if a slow load made the head script drop it */

  /* Contact email — read from data-contact-email on <html>.
     Empty means: no email line and no mailto link, anywhere. */
  var EMAIL = (root.getAttribute('data-contact-email') || '').trim();
  if (/^[^\s@<>"']+@[^\s@<>"']+\.[A-Za-z]{2,}$/.test(EMAIL)) {
    document.querySelectorAll('[data-email-slot]').forEach(function (slot) {
      var link = document.createElement('a');
      link.href = 'mailto:' + EMAIL;
      link.textContent = EMAIL;
      /* The footer lists contact lines without labels, like the phone number. */
      if (slot.classList.contains('foot-email')) slot.append(link);
      else slot.append('Email · ', link);
      slot.hidden = false;
    });
  }

  /* The home page used to hold every section. Old links to those sections now open their own page
     (/#faq opens /faq). #call stays on the home page, where it is the call to action band. */
  var MOVED = {
    formats: '/patient-dinners#formats', how: '/patient-dinners#how', handle: '/patient-dinners#handle',
    who: '/about', 'add-ons': '/referral-network', referrals: '/referral-network',
    'flyer-drops': '/flyer-drops', faq: '/faq'
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
     the old query string after the fragment (/#call?package=website), put the query back in front
     of the # and open the section, so the visitor still lands on it. */
  var stray = /^#([A-Za-z][\w-]*)\?(.*)$/.exec(window.location.hash);
  var strayTarget = stray && document.getElementById(stray[1]);
  if (strayTarget) {
    var query = window.location.search;
    if (stray[2]) query = (query ? query + '&' : '?') + stray[2];
    try { window.history.replaceState(window.history.state, '', window.location.pathname + query + '#' + stray[1]); } catch (e) { /* keep the URL as it is */ }
    strayTarget.scrollIntoView();
  }

  /* Header: hairline once the page scrolls; mobile menu. */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    var setMenu = function (open) {
      menuBtn.setAttribute('aria-expanded', String(open));
      root.classList.toggle('menu-open', open);
    };
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    /* Escape closes an open menu and returns focus to the button that opened it. */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || menuBtn.getAttribute('aria-expanded') !== 'true') return;
      setMenu(false);
      menuBtn.focus();
    });
    /* Tabbing out of the header closes the menu, so focus is never hidden under the panel. */
    if (header) {
      header.addEventListener('focusout', function (e) {
        if (menuBtn.getAttribute('aria-expanded') === 'true' && !header.contains(e.relatedTarget)) setMenu(false);
      });
    }
    /* In-page links (e.g. #anchors) should not leave the menu open over the target. */
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  /* Gentle reveal on scroll. Content is only hidden once JS has run (.js .reveal),
     and anything the observer cannot handle is shown immediately. */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }
})();
