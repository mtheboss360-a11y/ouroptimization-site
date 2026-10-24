/* Home page hero: a phthalo dot-orb rising from the corner that opens into the clinic's partner
   network on hover (on touch, by itself). Illustrated owners, not photos of real people. Each owner
   steers clear of the hero's words; one with no clear spot at a given size is left out. Once
   opened, the network stays open for the rest of the visit. */
(() => {
  const canvas = document.getElementById('orb');
  if (!canvas) return;
  const hero = canvas.closest('.hero-orb');
  const ctx = canvas.getContext('2d');
  const hint = document.getElementById('hint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  if (touch) hint.textContent = 'Tap the dots to replay';
  // Off-screen, the orb stops drawing.
  let onScreen = true;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(canvas);

  let W = 0, H = 0, dpr = 1, R = 0, cx = 0, cy = 0, colors = {};
  const readColors = () => {
    const s = getComputedStyle(hero);
    colors = { dot: s.getPropertyValue('--phthalo').trim(), lit: s.getPropertyValue('--phthalo-lit').trim(),
      ink: s.getPropertyValue('--ink').trim(), chip: s.getPropertyValue('--chip').trim(),
      rule: s.getPropertyValue('--rule').trim(), bg: s.getPropertyValue('--bg').trim(), rose: s.getPropertyValue('--rose').trim() };
  };

  // Fibonacci sphere: evenly spread points, fixed; only rotation moves them.
  const N = 2200, pts = [], DOT = 1.1; // every dot is a circle of the same size; depth shows only in opacity
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), t = i * 2.399963229728653;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r, 0.6 + 0.4 * Math.sin(i * 12.9898)]);
  }

  // The network. Angles are measured from the corner, inside the visible quarter (180-270 degrees).
  const clinic = { label: 'Your clinic', a: 223, r: .40 };
  // Illustrated business owners: drawn figures, no photos of real people.
  const partners = [
    { label: 'Devon · Gym', a: 186, r: .78, skin: '#8D5A3B', hair: '#1E1A17', shirt: '#2F5D4A', style: 'short' },
    { label: 'Nadia · Hair salon', a: 201, r: .93, skin: '#B7825F', hair: '#2A1C16', shirt: '#BD7189', style: 'long' },
    { label: 'Rosa · Yoga studio', a: 214, r: .70, skin: '#E6B99A', hair: '#6B4A2E', shirt: '#7FA48F', style: 'bun' },
    { label: 'Jasmine · Boutique', a: 232, r: .90, skin: '#6E4530', hair: '#141110', shirt: '#C9A46A', style: 'curly' },
    { label: 'Owen · Physical therapy', a: 247, r: .72, skin: '#F0C8A8', hair: '#A8763E', shirt: '#3D5748', style: 'short' },
    { label: 'Tina · Nail salon', a: 262, r: .88, skin: '#D9A07A', hair: '#3B2416', shirt: '#9E4F68', style: 'long' },
  ];
  function owner(x, y, p, k) {
    const R0 = 17 * k;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, R0, 0, 6.283); ctx.closePath();
    ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = colors.lit; ctx.stroke();
    ctx.clip();
    ctx.fillStyle = '#E3EDE4'; ctx.fillRect(x - R0, y - R0, R0 * 2, R0 * 2);
    ctx.fillStyle = p.shirt; ctx.beginPath(); ctx.ellipse(x, y + R0 * 0.95, R0 * 0.78, R0 * 0.55, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = p.skin; ctx.fillRect(x - R0 * 0.12, y + R0 * 0.08, R0 * 0.24, R0 * 0.3);
    if (p.style === 'long') { ctx.fillStyle = p.hair; ctx.beginPath(); ctx.ellipse(x, y - R0 * 0.02, R0 * 0.42, R0 * 0.5, 0, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = p.skin; ctx.beginPath(); ctx.ellipse(x, y - R0 * 0.12, R0 * 0.3, R0 * 0.36, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = p.hair; ctx.beginPath();
    if (p.style === 'curly') { for (let i = -2; i <= 2; i++) { ctx.moveTo(x + i * R0 * 0.14 + R0 * 0.12, y - R0 * 0.42); ctx.arc(x + i * R0 * 0.14, y - R0 * 0.42, R0 * 0.12, 0, 6.283); } }
    else ctx.ellipse(x, y - R0 * 0.36, R0 * 0.32, R0 * 0.17, 0, Math.PI, 0);
    ctx.fill();
    if (p.style === 'bun') { ctx.beginPath(); ctx.arc(x, y - R0 * 0.58, R0 * 0.13, 0, 6.283); ctx.fill(); }
    ctx.restore();
  }
  const at = (n) => { const a = (n.pa ?? n.a) * Math.PI / 180, r = n.pr ?? n.r; return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r]; };

  // Keep the people off the words. Each owner (face + name pill) is nudged around its spot,
  // then pulled in toward the corner, until it clears the headline, the paragraph, the proof
  // strip, the clinic and every owner placed before it.
  function boxOf(x, y, label, strong) {
    ctx.font = `${strong ? 700 : 600} ${strong ? 13 : 12}px Inter, -apple-system, sans-serif`;
    const w = ctx.measureText(label).width + 22, h = strong ? 30 : 26;
    const px = Math.max(8, Math.min(W - w - 8, x - w / 2));
    const top = y - (strong ? 6 : 12) - h - 10;
    return [Math.min(px, x - 19), top, Math.max(px + w, x + 19), y + 19];
  }
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  function layout() {
    const c = canvas.getBoundingClientRect(), pad = 14;
    const taken = [...hero.querySelectorAll('h1, .lede, .actions, .proof-row, .eyebrow, .orb-hint:not(.gone)')].map(el => {
      const r = el.getBoundingClientRect();
      return [r.left - c.left - pad, r.top - c.top - pad, r.right - c.left + pad, r.bottom - c.top + pad];
    });
    const [qx, qy] = at(clinic);
    taken.push(boxOf(qx, qy, clinic.label, true), [qx - 22, qy - 22, qx + 22, qy + 22]);
    const clear = (b) => b[0] >= 0 && b[2] <= W && b[1] >= 0 && b[3] <= H && !taken.some(t => hit(b, t));
    for (const p of partners) {
      let best = null;
      search: for (let dr = 0; dr <= 0.5; dr += 0.03) {
        for (const da of [0, 3, -3, 6, -6, 9, -9, 12, -12]) {
          const pr = Math.max(0.3, p.r - dr), pa = p.a + da;
          p.pr = pr; p.pa = pa;
          const [x, y] = at(p);
          const b = boxOf(x, y, p.label, false);
          if (clear(b)) { best = b; break search; }
        }
      }
      // No clear spot at this size: leave this owner out rather than draw it over the words.
      p.hidden = !best;
      if (best) taken.push(best);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const narrow = W < 760;
    R = narrow ? Math.min(W * 0.92, 420) : Math.min(H * 0.86, W * 0.5, 760);
    cx = W + (narrow ? R * 0.06 : R * 0.02); cy = H + (narrow ? R * 0.04 : R * 0.02);
    readColors();
    layout();
  }

  // open: 0 = plain orb, 1 = network fully shown. It eases toward target.
  let open = 0, target = 0, openedAt = 0, rot = 0, last = performance.now();
  const KEY = 'own-network-open';
  let stuck = false;
  try { stuck = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  function setOpen(v) {
    if (stuck && !v) return;                 // once seen, the network stays
    if (v && !target) openedAt = performance.now();
    target = v;
    if (v) { hint.classList.add('gone'); stuck = true; try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }
  }

  function pill(x, y, text, strong) {
    ctx.font = `${strong ? 700 : 600} ${strong ? 13 : 12}px Inter, -apple-system, sans-serif`;
    const w = ctx.measureText(text).width + 22, h = strong ? 30 : 26;
    const px = Math.max(8, Math.min(W - w - 8, x - w / 2)), py = y - h - 10;
    ctx.fillStyle = strong ? colors.ink : colors.chip;
    ctx.strokeStyle = strong ? colors.ink : colors.rule;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(px, py, w, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = strong ? '#fff' : colors.ink;
    ctx.textBaseline = 'middle'; ctx.fillText(text, px + 11, py + h / 2 + .5);
  }

  function frame(now) {
    if (!onScreen) { last = now; requestAnimationFrame(frame); return; }
    const dt = Math.min(50, now - last); last = now;
    if (!reduce) rot += dt * 0.00012;
    open += (target - open) * (reduce ? 1 : Math.min(1, dt * 0.004));
    ctx.clearRect(0, 0, W, H);

    // Dots: the sphere recedes and dims a little as the network opens.
    const cr = Math.cos(rot), sr = Math.sin(rot), tilt = -0.32, ct = Math.cos(tilt), st = Math.sin(tilt);
    ctx.fillStyle = colors.dot;
    for (const [x0, y0, z0, k] of pts) {
      const x1 = x0 * cr + z0 * sr, z1 = -x0 * sr + z0 * cr;
      const y2 = y0 * ct - z1 * st, z2 = y0 * st + z1 * ct;
      const depth = (z2 + 1) / 2;
      const px = cx + x1 * R, py = cy + y2 * R;
      if (px < -4 || py < -4 || px > W + 4 || py > H + 4) continue;
      ctx.globalAlpha = (0.12 + 0.6 * depth * k) * (1 - 0.45 * open);
      ctx.beginPath(); ctx.arc(px, py, DOT, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (open > 0.01) {
      const [qx, qy] = at(clinic);
      const t = (now - openedAt) / 1000;
      partners.forEach((p, i) => {
        if (p.hidden) return;
        const [x, y] = at(p);
        const grow = reduce ? 1 : Math.max(0, Math.min(1, (t - i * 0.12) / 0.6)) * open;
        if (grow <= 0) return;
        // link draws from partner toward the clinic
        ctx.strokeStyle = colors.lit; ctx.globalAlpha = 0.55 * open; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (qx - x) * grow, y + (qy - y) * grow); ctx.stroke();
        // referral pulse travelling to the clinic once the link is drawn
        if (grow >= 1 && !reduce) {
          const f = ((t * 0.45 + i * 0.37) % 1);
          ctx.globalAlpha = open * (1 - Math.abs(f - .5) * 1.2);
          ctx.fillStyle = colors.lit; ctx.beginPath(); ctx.arc(x + (qx - x) * f, y + (qy - y) * f, 3.2, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = open * Math.min(1, grow * 1.4);
        owner(x, y, p, 0.55 + 0.45 * Math.min(1, grow * 1.4));
        pill(x, y - 12, p.label, false);
      });
      ctx.globalAlpha = open;
      ctx.fillStyle = colors.rose; ctx.beginPath(); ctx.arc(qx, qy, 11, 0, 6.283); ctx.fill();
      ctx.strokeStyle = colors.rose; ctx.lineWidth = 2; ctx.globalAlpha = open * (0.35 + 0.25 * Math.sin(t * 3));
      ctx.beginPath(); ctx.arc(qx, qy, 19, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = open; pill(qx, qy - 6, clinic.label, true);
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }

  const inOrb = (e) => { const r = canvas.getBoundingClientRect(); return Math.hypot(e.clientX - r.left - cx, e.clientY - r.top - cy) < R; };
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && inOrb(e)) setOpen(1); });
    canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' && inOrb(e)) { target = 0; open = 0; setTimeout(() => setOpen(1), 60); } });

  addEventListener('resize', resize);
  resize();
  // Phones and reduced motion: show the network on its own; desktop waits for hover.
  if (stuck) { target = 1; open = 1; openedAt = performance.now() - 5000; hint.classList.add('gone'); }
  else if (touch || reduce) setTimeout(() => setOpen(1), reduce ? 0 : 1800);
  requestAnimationFrame(frame);
  document.fonts && document.fonts.ready.then(() => { readColors(); layout(); });
})();
