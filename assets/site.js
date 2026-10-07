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
      slot.append('Email · ', link);
      slot.hidden = false;
    });
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

  /* Enlarge a mailed advertisement. */
  var zoom = document.getElementById('zoom');
  if (!zoom) return;
  var zoomImg = document.getElementById('zoom-img');
  var opener = null;
  var BACKDROP = 'header.site-header, main, footer.site-foot';
  var setInert = function (on) {
    document.querySelectorAll(BACKDROP).forEach(function (el) {
      if (on) { el.inert = true; el.setAttribute('aria-hidden', 'true'); }
      else { el.inert = false; el.removeAttribute('aria-hidden'); }
    });
  };
  var closeZoom = function () {
    zoom.hidden = true;
    zoomImg.removeAttribute('src');
    document.body.style.overflow = '';
    setInert(false);
    if (opener) { opener.focus(); opener = null; }
  };
  document.querySelectorAll('[data-zoom]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      opener = btn;
      zoomImg.src = btn.getAttribute('data-zoom');
      zoomImg.alt = btn.getAttribute('data-zoom-alt') || '';
      zoom.hidden = false;
      document.body.style.overflow = 'hidden';
      setInert(true);
      zoom.querySelector('.zoom-close').focus();
    });
  });
  /* Keep Tab inside the dialog while it is open. */
  zoom.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = zoom.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  zoom.addEventListener('click', function (e) { if (!e.target.closest('#zoom-img')) closeZoom(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !zoom.hidden) closeZoom(); });
})();
