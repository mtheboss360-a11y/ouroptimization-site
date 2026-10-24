/* The call form on /contact (#call): validation and the ?about= prefill.
   Classic script, loaded with defer. No dependencies and no network calls: a valid form
   submits the normal way to /thanks (Netlify form "dinner-call"). Without JavaScript the
   browser's own required checks apply and the form still posts.
   The rules are pure functions so Node can test them (tests/call.test.mjs); the DOM
   wiring only runs in a browser. */
(function () {
  'use strict';

  /* The "What would you like to talk about?" radios, in the order the form shows them: the referral routes
     first, then the add-ons, then "Not sure yet". Each value reads the same as its label. Since October 23,
     2026 there were four; on October 24 "Patient dinner" came off (the dinner is mentioned only on the pricing
     page now, and /contact?about=patient-network still prefills the message). The older labels (the referral or
     flyer network, Plus-One Dinner, VIP Night, the online search network) are no longer choices. The field keeps its original name, "dinner", so Netlify
     keeps one column for it across old and new submissions. */
  var DINNERS = ['Referral routes', 'Online search / review tags / website', 'Not sure yet'];
  var ORDER = ['name', 'clinic', 'phone', 'email', 'town', 'best_time', 'dinner', 'message'];
  var MAX = { name: 120, clinic: 150, phone: 30, email: 254, town: 120, best_time: 60, message: 2000 };

  /* Links from the other pages: /contact?about=pricing, /contact?about=referral-network and so on, one key per
     page (named after its URL).
     Old links (/?about=review-tags#call) are redirected to /contact?about=... by netlify.toml.
     Keys that outlived their pages keep working and prefill a message about what replaced them:
     - flyer-network and flyer-drops: the flyer network folded into the referral routes on October 23, 2026
       (/flyer-network 301s to /referral-network), so they prefill the referral routes message.
     - patient-dinners (now patient-network, the private patient dinner page) and google-ads (now
       online-search-network) were renamed on October 22, 2026 and prefill the same message as the new key. */
  var ABOUT = {
    'pricing': "I'm asking about pricing.",
    'referral-network': "I'm asking about referral routes.",
    'flyer-network': "I'm asking about referral routes.",
    'patient-network': "I'm asking about a private patient dinner.",
    'online-search-network': "I'm asking about Google Ads in my own account.",
    'review-tags': "I'm asking about review tags.",
    'website-design': "I'm asking about a website redesign.",
    'sample-contract': "I'm asking about the sample contract.",
    'patient-dinners': "I'm asking about a private patient dinner.",
    'flyer-drops': "I'm asking about referral routes.",
    'google-ads': "I'm asking about Google Ads in my own account."
  };

  function str(v) { return v == null ? '' : String(v); }
  function trim(v) { return str(v).replace(/^\s+|\s+$/g, ''); }

  function isEmail(v) {
    v = trim(v);
    return v.length <= MAX.email && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,63}$/.test(v) && !/\.\./.test(v);
  }

  /* A phone number we can call or text: digits with the usual separators, 10 to 15 digits. */
  function isPhone(v) {
    v = trim(v);
    if (!v || v.length > MAX.phone || !/^\+?[0-9().\s-]+$/.test(v)) return false;
    var digits = v.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  function tooLong(name, v) { return MAX[name] && trim(v).length > MAX[name]; }

  /* Returns '' when the field is fine, otherwise the message shown under it. */
  function validateField(name, values) {
    var v = trim(values && values[name]);
    switch (name) {
      case 'name':
        if (!v) return 'Enter your name.';
        if (tooLong(name, v)) return 'Use ' + MAX.name + ' characters or fewer.';
        return '';
      case 'clinic':
        if (!v) return 'Enter the name of your clinic.';
        if (tooLong(name, v)) return 'Use ' + MAX.clinic + ' characters or fewer.';
        return '';
      case 'phone':
        if (!v) return 'Enter a phone number we can call or text.';
        if (!isPhone(v)) return 'Enter a full phone number, with area code.';
        return '';
      case 'email':
        if (!v) return '';
        if (!isEmail(v)) return 'Enter an email address like name@yourclinic.com, or leave it blank.';
        return '';
      case 'town':
        if (!v) return 'Enter the town your clinic is in.';
        if (tooLong(name, v)) return 'Use ' + MAX.town + ' characters or fewer.';
        return '';
      case 'best_time':
        if (!v) return 'Pick the best time to call.';
        if (tooLong(name, v)) return 'Pick one of the times in the list.';
        return '';
      case 'dinner':
        if (DINNERS.indexOf(v) === -1) return 'Choose what you would like to talk about, or Not sure yet.';
        return '';
      case 'message':
        if (tooLong(name, v)) return 'Keep the message to ' + MAX.message + ' characters or fewer.';
        return '';
      default:
        return '';
    }
  }

  /* Every problem, in form order: [{ name, message }]. Empty when the form can be sent. */
  function validateAll(values) {
    var out = [];
    for (var i = 0; i < ORDER.length; i++) {
      var message = validateField(ORDER[i], values);
      if (message) out.push({ name: ORDER[i], message: message });
    }
    return out;
  }

  /* Reads ?about=<key> from a query string. Returns a known key, or ''. */
  function aboutFromSearch(search) {
    var m = /(?:^|[?&])about=([^&#]*)/.exec(str(search));
    if (!m) return '';
    var key;
    try { key = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return ''; }
    key = trim(key).toLowerCase();
    return Object.prototype.hasOwnProperty.call(ABOUT, key) ? key : '';
  }

  /* The text to put in an empty message box for this query string, or '' to leave it alone. */
  function prefillFor(search, current) {
    var key = aboutFromSearch(search);
    if (!key || trim(current)) return '';
    return ABOUT[key];
  }

  var api = {
    DINNERS: DINNERS,
    ORDER: ORDER,
    MAX: MAX,
    ABOUT: ABOUT,
    isEmail: isEmail,
    isPhone: isPhone,
    validateField: validateField,
    validateAll: validateAll,
    aboutFromSearch: aboutFromSearch,
    prefillFor: prefillFor
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    return;
  }
  if (typeof document === 'undefined') return;

  /* ---------- browser wiring ---------- */
  var form = document.querySelector('form[name="dinner-call"]');
  if (!form) return;
  var els = form.elements;

  /* Our messages replace the browser's bubbles once the script runs. */
  form.noValidate = true;

  function controlsFor(name) {
    var el = els[name];
    if (!el) return [];
    return el.length != null && !el.tagName ? Array.prototype.slice.call(el) : [el];
  }
  function errFor(name) {
    var c = controlsFor(name)[0];
    if (!c) return null;
    if (name === 'dinner') return document.getElementById('call-dinner-err');
    return document.getElementById(c.id + '-err');
  }
  function values() {
    var out = {};
    for (var i = 0; i < ORDER.length; i++) {
      var el = els[ORDER[i]];
      out[ORDER[i]] = el ? el.value : '';
    }
    return out;
  }
  function show(name, message) {
    var controls = controlsFor(name);
    var err = errFor(name);
    for (var i = 0; i < controls.length; i++) {
      if (message) controls[i].setAttribute('aria-invalid', 'true');
      else controls[i].removeAttribute('aria-invalid');
    }
    if (err) {
      err.textContent = message;
      err.classList.toggle('on', !!message);
    }
  }
  function focusField(name) {
    var controls = controlsFor(name);
    if (!controls.length) return;
    var target = controls[0];
    for (var i = 0; i < controls.length; i++) if (controls[i].checked) target = controls[i];
    target.focus();
  }

  var attempted = false;
  var sending = false;

  form.addEventListener('submit', function (e) {
    if (sending) { e.preventDefault(); return; }
    attempted = true;
    var problems = validateAll(values());
    for (var i = 0; i < ORDER.length; i++) show(ORDER[i], '');
    if (problems.length) {
      e.preventDefault();
      for (var j = 0; j < problems.length; j++) show(problems[j].name, problems[j].message);
      focusField(problems[0].name);
      return;
    }
    /* Valid: let the browser post the form to /thanks. A second click does not post twice. */
    sending = true;
  });

  /* After a first attempt, fix messages as people correct the fields. */
  function recheck(e) {
    if (!attempted || !e.target || !e.target.name) return;
    var name = e.target.name;
    if (ORDER.indexOf(name) === -1) return;
    show(name, validateField(name, values()));
  }
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  /* Coming back with the Back button re-enables sending. */
  window.addEventListener('pageshow', function () { sending = false; });

  /* ?about= prefill: only into an empty message box, then bring the form into view. */
  var message = els.message;
  var text = message ? prefillFor(window.location.search, message.value) : '';
  if (text) {
    message.value = text;
    var section = document.getElementById('call');
    if (section) {
      var go = function () { section.scrollIntoView({ block: 'start' }); };
      if (window.requestAnimationFrame) window.requestAnimationFrame(go); else go();
    }
  }
})();
