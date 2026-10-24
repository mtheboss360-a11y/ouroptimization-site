/* How it works, step 1 (matching): the same phthalo dot-orb as the home hero, shown whole. When it
   scrolls into view the network builds in front of you: your clinic first, then each matched
   business on a steady beat, sweeping around the orb. Illustrated owners, not photos of real people.
   Reduced motion shows it complete. */
(() => {
  const canvas = document.getElementById('match-orb');
  if (!canvas) return;
  const box = canvas.closest('.hiw-orb');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let onScreen = false, startedAt = null;
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen && startedAt === null && e.intersectionRatio >= .45) startedAt = performance.now() + 250;
  }, { threshold: [0, .45] }).observe(canvas);

  let W = 0, H = 0, dpr = 1, R = 0, cx = 0, cy = 0, colors = {};
  const readColors = () => {
    const s = getComputedStyle(box);
    colors = { dot: s.getPropertyValue('--phthalo').trim(), lit: s.getPropertyValue('--phthalo-lit').trim(),
      ink: s.getPropertyValue('--ink').trim(), chip: '#FFFFFF', rule: s.getPropertyValue('--line').trim(), rose: s.getPropertyValue('--rose').trim() };
  };

  // Fibonacci sphere: evenly spread points; only rotation moves them. Every dot is the same size.
  const N = 1600, pts = [], DOT = 1.05;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), t = i * 2.399963229728653;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r, 0.6 + 0.4 * Math.sin(i * 12.9898)]);
  }

  // The same six owners as the hero, placed evenly around the clinic, starting at the top.
  const partners = [
    { label: 'Devon · Gym', skin: '#8D5A3B', hair: '#1E1A17', shirt: '#2F5D4A', style: 'short' },
    { label: 'Nadia · Hair salon', skin: '#B7825F', hair: '#2A1C16', shirt: '#BD7189', style: 'long' },
    { label: 'Rosa · Yoga studio', skin: '#E6B99A', hair: '#6B4A2E', shirt: '#7FA48F', style: 'bun' },
    { label: 'Jasmine · Boutique', skin: '#6E4530', hair: '#141110', shirt: '#C9A46A', style: 'curly' },
    { label: 'Owen · Physical therapy', skin: '#F0C8A8', hair: '#A8763E', shirt: '#3D5748', style: 'short' },
    { label: 'Tina · Nail salon', skin: '#D9A07A', hair: '#3B2416', shirt: '#9E4F68', style: 'long' },
  ].map((p, i) => ({ ...p, a: -90 + i * 60, r: i % 2 ? .7 : .6 }));

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
  function pill(x, y, text, strong) {
    ctx.font = `${strong ? 700 : 600} ${strong ? 13 : 12}px Inter, -apple-system, sans-serif`;
    const w = ctx.measureText(text).width + 22, h = strong ? 30 : 26;
    const px = Math.max(6, Math.min(W - w - 6, x - w / 2)), py = y - h - 10;
    ctx.fillStyle = strong ? colors.ink : colors.chip; ctx.strokeStyle = strong ? colors.ink : colors.rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(px, py, w, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = strong ? '#fff' : colors.ink; ctx.textBaseline = 'middle'; ctx.fillText(text, px + 11, py + h / 2 + .5);
  }
  const at = (p) => { const a = p.a * Math.PI / 180; return [cx + Math.cos(a) * R * p.r, cy + Math.sin(a) * R * p.r]; };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(W, H) * .46; cx = W / 2; cy = H / 2 + 8;
    readColors();
  }

  const ease = (v) => v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
  const back = (v) => 1 + 2.2 * Math.pow(v - 1, 3) + 1.2 * Math.pow(v - 1, 2);
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const LEAD = .7, BEAT = .55, DRAW = .42, POP = .4;
  const done = LEAD + (partners.length - 1) * BEAT + DRAW + POP;
  let rot = 0, last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    if (!onScreen) { last = now; return; }
    const dt = Math.min(50, now - last); last = now;
    if (!reduce) rot += dt * 0.00012;
    const t = reduce ? 99 : startedAt === null ? -1 : (now - startedAt) / 1000;
    const open = clamp(t / .5);
    ctx.clearRect(0, 0, W, H);

    const cr = Math.cos(rot), sr = Math.sin(rot), tilt = -0.32, ct = Math.cos(tilt), st = Math.sin(tilt);
    ctx.fillStyle = colors.dot;
    for (const [x0, y0, z0, k] of pts) {
      const x1 = x0 * cr + z0 * sr, z1 = -x0 * sr + z0 * cr;
      const y2 = y0 * ct - z1 * st, z2 = y0 * st + z1 * ct;
      ctx.globalAlpha = (0.12 + 0.6 * ((z2 + 1) / 2) * k) * (1 - 0.45 * open);
      ctx.beginPath(); ctx.arc(cx + x1 * R, cy + y2 * R, DOT, 0, 6.283); ctx.fill();
    }
    if (t < 0) { ctx.globalAlpha = 1; return; }

    const ripple = (x, y, start, from, to, alpha) => {
      const k = clamp((t - start) / .9); if (k <= 0 || k >= 1) return;
      ctx.strokeStyle = colors.rose; ctx.lineWidth = 1.5; ctx.globalAlpha = alpha * (1 - k);
      ctx.beginPath(); ctx.arc(x, y, from + (to - from) * ease(k), 0, 6.283); ctx.stroke();
    };
    partners.forEach((p, i) => {
      const [x, y] = at(p), start = LEAD + i * BEAT;
      const draw = ease(clamp((t - start) / DRAW));
      if (draw <= 0) return;
      const tx = cx + (x - cx) * draw, ty = cy + (y - cy) * draw;
      ctx.strokeStyle = colors.lit; ctx.globalAlpha = .55; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty); ctx.stroke();
      if (draw < 1) { ctx.fillStyle = colors.lit; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(tx, ty, 3.4, 0, 6.283); ctx.fill(); return; }
      const landed = start + DRAW;
      ripple(x, y, landed, 14, 34, .5);
      const pop = clamp((t - landed) / POP);
      ctx.globalAlpha = Math.min(1, pop * 2.2); owner(x, y, p, Math.max(.01, back(pop)));
      const name = ease(clamp((t - landed - .16) / .34));
      if (name > 0) { ctx.globalAlpha = name; pill(x, y - 12 + (1 - name) * 8, p.label, false); }
      if (!reduce && t > done) {
        const f = (((t - done) * .45 + i * .37) % 1);
        ctx.globalAlpha = (1 - Math.abs(f - .5) * 1.2) * clamp((t - done) / .6);
        ctx.fillStyle = colors.lit; ctx.beginPath(); ctx.arc(x + (cx - x) * f, y + (cy - y) * f, 3.2, 0, 6.283); ctx.fill();
      }
    });
    ripple(cx, cy, 0, 11, 52, .7);
    partners.forEach((p, i) => ripple(cx, cy, LEAD + i * BEAT + DRAW, 12, 30, .35));
    ctx.globalAlpha = 1; ctx.fillStyle = colors.rose;
    ctx.beginPath(); ctx.arc(cx, cy, 11 * Math.max(.01, back(clamp(t / .55))), 0, 6.283); ctx.fill();
    if (t > done) {
      ctx.strokeStyle = colors.rose; ctx.lineWidth = 2; ctx.globalAlpha = (0.35 + 0.25 * Math.sin(t * 3)) * clamp((t - done) / .6);
      ctx.beginPath(); ctx.arc(cx, cy, 19, 0, 6.283); ctx.stroke();
    }
    const label = ease(clamp((t - .3) / .4));
    if (label > 0) { ctx.globalAlpha = label; pill(cx, cy - 6 + (1 - label) * 6, 'Your clinic', true); }
    ctx.globalAlpha = 1;
  }

  addEventListener('resize', resize);
  resize();
  document.fonts && document.fonts.ready.then(readColors);
  requestAnimationFrame(frame);
})();
