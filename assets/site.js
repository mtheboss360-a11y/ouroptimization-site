/* Our Wellness Connections: shared site behaviour.
   Loaded with defer on every page. No dependencies, no third-party requests. */
(function () {
  var root = document.documentElement;
  /* Tells the inline head script that behaviour loaded, so it keeps the .js styles. */
  window.__owoReady = true;
  root.classList.add('js'); /* restore it if a slow load made the head script drop it */

  /* The home page used to hold every section. Old links to those sections now open their own page
     (/#faq opens /faq). The home page's call band came off on October 22, 2026, so /#call opens the
     call form on /contact, with any old query (/#call?package=website) carried along. */
  var MOVED = {
    formats: '/patient-network#formats', how: '/referral-network', 'how-it-works': '/referral-network', handle: '/patient-network#handle',
    who: '/about', 'add-ons': '/pricing', referrals: '/referral-network',
    'flyer-drops': '/referral-network', faq: '/faq', call: '/contact#call'
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

  /* The home page's portal sections became #dashboard (October 23, 2026): /#portal and /#breakdown open it. */
  var ALIAS = { portal: 'dashboard', breakdown: 'dashboard' };
  var alias = /^#([A-Za-z][\w-]*)$/.exec(window.location.hash);
  if (alias && ALIAS[alias[1]] && !document.getElementById(alias[1])) {
    var aliasTarget = document.getElementById(ALIAS[alias[1]]);
    if (aliasTarget) {
      try { window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search + '#' + ALIAS[alias[1]]); } catch (e) { /* keep the URL */ }
      aliasTarget.scrollIntoView();
    }
  }

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

  /* Home hero: the van video. It loads after the page (the still is the first paint), plays muted and looped,
     and fades in over the still once it is actually playing. Missing file, a failed load or reduced motion:
     the element is removed and the still stays. */
  var heroVideo = document.querySelector('.owc-hero-video');
  if (heroVideo) {
    var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var dropVideo = function () { if (heroVideo.parentNode) heroVideo.parentNode.removeChild(heroVideo); };
    if (reduce.matches || !heroVideo.getAttribute('data-src') || typeof heroVideo.play !== 'function') {
      dropVideo();
    } else {
      var startVideo = function () {
        heroVideo.addEventListener('playing', function () { heroVideo.parentNode && heroVideo.parentNode.classList.add('is-playing'); }, { once: true });
        heroVideo.addEventListener('error', dropVideo, { once: true });
        heroVideo.muted = true;
        /* the poster is the still already on screen (its responsive size, from the cache), never a second download */
        var still = document.querySelector('.owc-hero-media img');
        if (still && still.currentSrc) heroVideo.poster = still.currentSrc;
        heroVideo.src = heroVideo.getAttribute('data-src');
        var played = heroVideo.play();
        if (played && played.catch) played.catch(function () { /* autoplay refused: the still stays */ });
      };
      if (document.readyState === 'complete') startVideo(); else window.addEventListener('load', startVideo, { once: true });
      if (reduce.addEventListener) reduce.addEventListener('change', function (e) { if (e.matches) { heroVideo.pause && heroVideo.pause(); dropVideo(); } });
    }
  }

  /* Home dashboard (#dashboard): the screens lie tipped back and stand up flat as you scroll to them. --p on the band
     runs from 0 (the screens' top edge at the bottom of the window) to 1 (their top edge 45% of the way down).
     Without this, or with reduced motion, --p keeps its CSS value of 1, so the screens are simply flat. */
  var tilt = document.querySelector('[data-tilt]');
  var tiltBand = tilt && tilt.closest('.owc-dash-band');
  var still = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  if (tiltBand && window.requestAnimationFrame && !still.matches) {
    var tiltQueued = false;
    var tiltUpdate = function () {
      tiltQueued = false;
      if (still.matches) { tiltBand.classList.remove('is-tilting'); tiltBand.style.removeProperty('--p'); return; }
      tiltBand.classList.add('is-tilting');
      var vh = window.innerHeight || root.clientHeight;
      var p = (vh - tilt.getBoundingClientRect().top) / (vh * 0.55);
      tiltBand.style.setProperty('--p', (p < 0 ? 0 : p > 1 ? 1 : p).toFixed(3));
    };
    var tiltQueue = function () { if (!tiltQueued) { tiltQueued = true; window.requestAnimationFrame(tiltUpdate); } };
    tiltBand.classList.add('is-tilting');
    tiltUpdate();
    window.addEventListener('scroll', tiltQueue, { passive: true });
    window.addEventListener('resize', tiltQueue);
    if (still.addEventListener) still.addEventListener('change', tiltQueue);
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
