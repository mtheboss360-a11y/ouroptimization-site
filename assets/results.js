/* Results on the home page (#results). Reads /assets/data/results.json and shows one card per clinic.
   While the file has no clinics, the page keeps its "first routes are running now" message and the
   text-updates form. Values are inserted as text, never as HTML. */
(function () {
  'use strict';
  var box = document.querySelector('[data-results]');
  if (!box || !window.fetch) return;
  var list = box.querySelector('.owc-results-list');
  var empty = box.querySelector('.owc-results-empty');
  var more = box.querySelector('.owc-results-more');

  function whole(n) { return typeof n === 'number' && isFinite(n) && n >= 0 && Math.floor(n) === n; }
  function text(s) { return typeof s === 'string' && s.replace(/\s+/g, ' ').trim().length > 0; }
  function valid(c) {
    return c && text(c.town) && text(c.type) && whole(c.signups60) && whole(c.bookedFirstVisits60) && typeof c.referenceCalls === 'boolean';
  }
  function el(tag, cls, content) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  }
  function card(c) {
    var li = el('li', 'owc-result');
    li.appendChild(el('p', 'owc-result-where', c.town.trim()));
    li.appendChild(el('p', 'owc-result-type', c.type.trim()));
    var dl = el('dl', 'owc-result-nums');
    var pairs = [['Tracked sign-ups, first 60 days', c.signups60], ['Booked first visits, first 60 days', c.bookedFirstVisits60]];
    pairs.forEach(function (p) {
      var d = el('div');
      d.appendChild(el('dt', null, p[0]));
      d.appendChild(el('dd', null, String(p[1])));
      dl.appendChild(d);
    });
    li.appendChild(dl);
    li.appendChild(el('p', 'owc-result-ref', c.referenceCalls ? 'The owner takes reference calls.' : 'The owner isn’t taking reference calls.'));
    return li;
  }

  fetch(box.getAttribute('data-results'), { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var clinics = data && Array.isArray(data.clinics) ? data.clinics.filter(valid) : [];
      if (!clinics.length) return;
      clinics.forEach(function (c) { list.appendChild(card(c)); });
      list.hidden = false;
      if (empty) empty.hidden = true;
      if (more) more.hidden = false;
    })
    .catch(function () { /* keep the message and the form */ });
})();
