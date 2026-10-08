/* Campaign estimate form: validation and submission.
   Classic script, loaded with defer on /estimate. No dependencies, no eval, no inline
   handlers, no requests other than the Netlify Forms POST to "/".
   The validators are pure functions so they can run in Node (tests/estimate.test.mjs);
   the DOM wiring only runs in the browser. */
(function () {
  'use strict';

  var OTHER_TYPE = 'Something else';
  var BUSINESS_TYPES = [
    'Med spa',
    'Dental office',
    'Chiropractor',
    'Physical therapy clinic',
    'Beauty or wellness business',
    OTHER_TYPE
  ];
  var MAX = {
    clinic: 150,
    contact: 120,
    business_type_other: 120,
    address: 200,
    email: 254,
    website: 300,
    target_service: 150,
    target_area: 300,
    notes: 2000
  };
  var TIMEOUT_MS = 15000;

  function str(v) { return v == null ? '' : String(v); }
  function trim(v) { return str(v).replace(/^\s+|\s+$/g, ''); }

  var LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  var TLD_RE = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

  /* A public host name: two or more valid labels, ending in a TLD of 2+ letters
     (or a punycode TLD). Rejects "localhost", "example", IP addresses, empty labels. */
  function isHostname(host) {
    var h = str(host).toLowerCase();
    if (!h || h.length > 253) return false;
    var labels = h.split('.');
    if (labels.length < 2) return false;
    for (var i = 0; i < labels.length; i++) {
      if (!LABEL_RE.test(labels[i])) return false;
    }
    return TLD_RE.test(labels[labels.length - 1]);
  }

  /* Website: parsed with the URL API after adding https:// when no scheme is given.
     Never fetched or requested. Accepts paths, queries, fragments and ports. */
  function isWebsite(value) {
    var s = trim(value);
    if (!s || s.length > MAX.website || /\s/.test(s)) return false;
    if (!/^https?:\/\//i.test(s)) {
      // Anything shaped like another scheme ("javascript:", "ftp:", "mailto:", or a
      // malformed "http:x") is refused. "host:8080" is a port, not a scheme.
      if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s)) return false;
      s = 'https://' + s;
    }
    var url;
    try { url = new URL(s); } catch (e) { return false; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.username || url.password) return false; // "me@example.com" is an email
    return isHostname(url.hostname);
  }

  function isEmail(value) {
    var s = trim(value);
    if (!s || s.length > MAX.email || /\s/.test(s)) return false;
    var at = s.indexOf('@');
    if (at < 1 || at !== s.lastIndexOf('@')) return false;
    var local = s.slice(0, at);
    var domain = s.slice(at + 1);
    if (local.length > 64 || /^\.|\.$|\.\./.test(local)) return false;
    if (/[<>()[\]\\,;:"]/.test(local)) return false;
    if (/[/?#:[\]\\%]/.test(domain)) return false;
    if (/[^\x00-\x7f]/.test(domain)) {
      // International domain: let the URL parser convert it to punycode.
      try { domain = new URL('https://' + domain).hostname; } catch (e) { return false; }
    }
    return isHostname(domain);
  }

  /* US number: 10 digits with any common punctuation, optionally led by 1 or +1. */
  function isPhone(value) {
    var s = trim(value);
    if (!s || s.length > 30) return false;
    if (!/^\+?[\d\s().-]+$/.test(s)) return false;
    var d = s.replace(/\D/g, '');
    if (s.charAt(0) === '+' && !(d.length === 11 && d.charAt(0) === '1')) return false;
    if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
    // NANP: area code and exchange never start with 0 or 1.
    return /^[2-9]\d{2}[2-9]\d{6}$/.test(d);
  }

  function tooLong(v, name) { return str(v).length > MAX[name]; }

  /* Each rule takes (value, allValues) and returns an error message, or '' when the
     value is acceptable. Keys are the posted field names, in form order. */
  var rules = {
    clinic: function (v) {
      var s = trim(v);
      if (!s) return 'Enter your business name.';
      if (s.length < 2) return 'Enter the full business name.';
      if (tooLong(s, 'clinic')) return 'Keep the business name under ' + MAX.clinic + ' characters.';
      return '';
    },
    clinic_type: function (v) {
      var s = trim(v);
      if (!s) return 'Choose the type of business.';
      if (BUSINESS_TYPES.indexOf(s) < 0) return 'Choose a business type from the list.';
      return '';
    },
    business_type_other: function (v, all) {
      if (trim(all && all.clinic_type) !== OTHER_TYPE) return '';
      var s = trim(v);
      if (!s) return 'Tell us what type of business it is.';
      if (s.length < 2) return 'Describe the business type in a word or two.';
      if (tooLong(s, 'business_type_other')) return 'Keep the business type under ' + MAX.business_type_other + ' characters.';
      return '';
    },
    address: function (v) {
      var s = trim(v);
      if (!s) return 'Enter the city or ZIP code where your business is.';
      if (tooLong(s, 'address')) return 'Keep the location under ' + MAX.address + ' characters. A city or ZIP code is enough.';
      if (/^[\d\s-]+$/.test(s)) {
        return /^\d{5}(?:-\d{4})?$/.test(s) ? '' : 'Enter a 5-digit ZIP code, or the city name.';
      }
      if ((s.match(/[A-Za-zÀ-ɏ]/g) || []).length < 2) return 'Enter the city or ZIP code where your business is.';
      return '';
    },
    contact: function (v) {
      var s = trim(v);
      if (!s) return 'Enter your name.';
      if (s.length < 2) return 'Enter your name as you would like us to use it.';
      if (tooLong(s, 'contact')) return 'Keep your name under ' + MAX.contact + ' characters.';
      return '';
    },
    email: function (v) {
      if (!trim(v)) return 'Enter your email address.';
      return isEmail(v) ? '' : 'Enter an email address like name@yourbusiness.com.';
    },
    phone: function (v) {
      if (!trim(v)) return ''; // optional; a number that is entered must be a valid US number
      return isPhone(v) ? '' : 'Enter a 10-digit US phone number with the area code, like (630) 555-0142, or leave this blank.';
    },
    website: function (v) {
      if (!trim(v)) return '';
      return isWebsite(v) ? '' : 'Enter a web address like yourbusiness.com, or leave this blank.';
    },
    promote: function () { return ''; },
    target_service: function (v) {
      return tooLong(v, 'target_service') ? 'Keep the target service under ' + MAX.target_service + ' characters.' : '';
    },
    budget: function () { return ''; },
    target_area: function (v) {
      return tooLong(v, 'target_area') ? 'Keep the target area under ' + MAX.target_area + ' characters. The main ZIP codes or towns are plenty.' : '';
    },
    notes: function (v) {
      return tooLong(v, 'notes') ? 'Keep your notes under 2,000 characters.' : '';
    }
  };

  var order = Object.keys(rules);

  /* Rules that read another field: when the key changes, recheck the listed fields. */
  var dependents = { clinic_type: ['business_type_other'] };

  function validateField(name, values) {
    var rule = rules[name];
    if (!rule) return '';
    var all = values || {};
    return rule(all[name], all);
  }

  function validateAll(values) {
    var out = [];
    order.forEach(function (name) {
      var message = validateField(name, values);
      if (message) out.push({ name: name, message: message });
    });
    return out;
  }

  var validators = {
    OTHER_TYPE: OTHER_TYPE,
    BUSINESS_TYPES: BUSINESS_TYPES,
    MAX: MAX,
    TIMEOUT_MS: TIMEOUT_MS,
    isHostname: isHostname,
    isWebsite: isWebsite,
    isEmail: isEmail,
    isPhone: isPhone,
    rules: rules,
    order: order,
    dependents: dependents,
    validateField: validateField,
    validateAll: validateAll
  };

  /* ------------------------------------------------------------------ DOM ---- */
  function wire(v) {
    var form = document.getElementById('estimate-form');
    if (!form) return;
    var submit = document.getElementById('submit');
    var alertSlot = document.getElementById('alert');
    var summary = document.getElementById('est-summary');
    var summaryH = document.getElementById('est-summary-h');
    var summaryList = document.getElementById('est-summary-list');
    var sent = document.getElementById('sent');
    var sentH = document.getElementById('sent-h');
    var formArea = document.getElementById('form-area');
    var intro = document.getElementById('est-intro');
    var otherWrap = document.getElementById('type-other-field');
    var submitLabel = submit.textContent;
    var sending = false;

    var field = function (name) {
      var el = form.elements[name];
      return el && el.nodeType === 1 ? el : null;
    };

    var values = function () {
      var out = {};
      v.order.forEach(function (name) {
        var el = field(name);
        out[name] = el ? el.value : '';
      });
      return out;
    };

    var errSlot = function (el) { return el ? document.getElementById(el.id + '-err') : null; };
    var isFlagged = function (el) { return !!el && el.getAttribute('aria-invalid') === 'true'; };

    var setError = function (name, message) {
      var el = field(name);
      var slot = errSlot(el);
      if (!slot) return;
      slot.textContent = '';
      if (message) {
        var tag = document.createElement('span');
        tag.className = 'visually-hidden';
        tag.textContent = 'Error: ';
        slot.appendChild(tag);
        slot.appendChild(document.createTextNode(message));
      }
      slot.classList.toggle('on', !!message);
      if (message) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
      // The error is read first, then any help text the field already had.
      var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (t) {
        return t && t !== slot.id;
      });
      if (message) ids.unshift(slot.id);
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
      else el.removeAttribute('aria-describedby');
    };

    var check = function (name) {
      var message = v.validateField(name, values());
      setError(name, message);
      return message;
    };

    /* "Something else" reveals a required description field; any other choice hides
       it and drops the requirement. */
    var syncOther = function () {
      var other = field('business_type_other');
      if (!other || !otherWrap) return;
      var on = field('clinic_type').value === v.OTHER_TYPE;
      otherWrap.hidden = !on;
      other.required = on;
      if (!on) setError('business_type_other', '');
    };

    /* Rebuild the list only when its content changes, so a link that is being
       pressed or focused is never replaced underneath the user. */
    var lastSummary = null;
    var renderSummary = function (problems) {
      var sig = JSON.stringify(problems);
      if (sig === lastSummary) { summary.hidden = problems.length === 0; return; }
      lastSummary = sig;
      summaryList.textContent = '';
      problems.forEach(function (p) {
        var el = field(p.name);
        if (!el) return;
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + el.id;
        a.textContent = p.message; // each message names its field
        li.appendChild(a);
        summaryList.appendChild(li);
      });
      var n = problems.length;
      summaryH.textContent = n === 1 ? 'Check 1 field before sending' : 'Check ' + n + ' fields before sending';
      summary.hidden = n === 0;
    };

    /* Keep an open summary in step with the fields as they are fixed. */
    var refreshSummary = function () {
      if (summary.hidden) return;
      var current = [];
      v.order.forEach(function (name) {
        var el = field(name);
        if (isFlagged(el)) current.push({ name: name, message: v.validateField(name, values()) });
      });
      renderSummary(current);
    };

    var recheck = function (name) {
      if (!v.rules[name]) return;
      if (isFlagged(field(name))) check(name);
      (v.dependents[name] || []).forEach(function (dep) {
        if (isFlagged(field(dep))) check(dep);
      });
      refreshSummary();
    };

    var onEdit = function (e) {
      var name = e.target && e.target.name;
      if (!name) return;
      if (name === 'clinic_type') syncOther();
      recheck(name);
    };
    form.addEventListener('input', onEdit);
    form.addEventListener('change', onEdit);

    // Leaving a field checks it once there is something to check; empty required
    // fields are only flagged on submit, so tabbing through the form stays quiet.
    form.addEventListener('focusout', function (e) {
      var el = e.target;
      var name = el && el.name;
      if (!name || !v.rules[name] || el.type === 'checkbox') return;
      if (trim(el.value) || isFlagged(el)) {
        check(name);
        // Moving into the summary itself must not rebuild it under the focus.
        if (!(e.relatedTarget && summary.contains(e.relatedTarget))) refreshSummary();
      }
    });

    // Pressing a summary link keeps focus on the current field until the click
    // handler moves it, so the list is not rebuilt mid-click (mouse and touch).
    summaryList.addEventListener('mousedown', function (e) {
      if (e.target.closest && e.target.closest('a')) e.preventDefault();
    });

    summaryList.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'center' });
    });

    var clearFailure = function () { alertSlot.textContent = ''; };

    var showFailure = function () {
      var box = document.createElement('div');
      box.className = 'form-alert on est-fail';
      var lead = document.createElement('p');
      var strong = document.createElement('strong');
      strong.textContent = 'We couldn’t confirm that your request was sent.';
      lead.appendChild(strong);
      var rest = document.createElement('p');
      rest.appendChild(document.createTextNode('Everything you entered is still here. Please try again, or call Mustafa at '));
      var tel = document.createElement('a');
      tel.href = 'tel:+13312716851';
      tel.textContent = '331-271-6851';
      rest.appendChild(tel);
      rest.appendChild(document.createTextNode('.'));
      box.appendChild(lead);
      box.appendChild(rest);
      alertSlot.textContent = '';
      alertSlot.appendChild(box);
    };

    var setBusy = function (busy) {
      sending = busy;
      submit.disabled = busy;
      if (busy) {
        submit.setAttribute('aria-busy', 'true');
        submit.textContent = 'Sending…';
      } else {
        submit.removeAttribute('aria-busy');
        submit.textContent = submitLabel;
      }
    };

    var onSuccess = function () {
      formArea.hidden = true;
      if (intro) intro.hidden = true;
      sent.hidden = false;
      document.title = 'Meeting request sent | Our Wellness Optimization';
      sentH.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    };

    var onFailure = function () {
      setBusy(false);
      showFailure();
      var active = document.activeElement;
      if (!active || active === document.body) submit.focus();
    };

    var send = function () {
      setBusy(true);
      clearFailure();
      var body = new URLSearchParams(new FormData(form));
      if (field('clinic_type').value !== v.OTHER_TYPE) body.set('business_type_other', '');

      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer;
      var timeout = new Promise(function (resolve, reject) {
        timer = setTimeout(function () {
          if (ctrl) ctrl.abort();
          reject(new Error('timeout'));
        }, v.TIMEOUT_MS);
      });
      var request = fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        credentials: 'same-origin',
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        if (!res.ok) throw new Error('status ' + res.status);
      });

      Promise.race([request, timeout]).then(function () {
        clearTimeout(timer);
        onSuccess();
      }, function () {
        clearTimeout(timer);
        onFailure();
      });
    };

    form.addEventListener('submit', function (e) {
      var canSend = typeof window.fetch === 'function' && typeof window.URLSearchParams === 'function' && typeof window.FormData === 'function';
      if (canSend || sending) e.preventDefault();
      if (sending) return;

      syncOther();
      var vals = values();
      var problems = v.validateAll(vals);
      v.order.forEach(function (name) { setError(name, v.validateField(name, vals)); });

      if (problems.length) {
        e.preventDefault();
        clearFailure();
        renderSummary(problems);
        summaryH.focus({ preventScroll: true });
        summary.scrollIntoView({ block: 'start' });
        return;
      }
      renderSummary([]);
      if (canSend) send(); // otherwise the browser posts the form natively
    });

    syncOther();
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = validators;
  } else {
    wire(validators);
  }
})();
