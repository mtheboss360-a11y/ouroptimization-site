/* Home page hero: a wave of points and fine lines rolling under the headline, with your clinic's
   nearby wellness partners riding it. Each partner is an illustrated owner (a drawn figure, not a
   photo of a real person), joined to your clinic by a dashed line that breathes in and out: the
   introduction is out and the connection is still pending. Partners keep clear of the hero's words;
   one with no clear spot at a given size is left out. Plain 2D canvas, no libraries and no outside
   requests. Off screen it stops drawing; with reduced motion it is one still frame. */
(() => {
  const canvas = document.getElementById('wave');
  if (!canvas) return;
  const hero = canvas.closest('.hero-wave');
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let onScreen = true;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(canvas);

  let W = 0, H = 0, dpr = 1, narrow = false, colors = {};
  const readColors = () => {
    const s = getComputedStyle(hero), v = (n) => s.getPropertyValue(n).trim();
    colors = { line: v('--wave-line'), dot: v('--phthalo-lit'), lit: v('--phthalo-lit'), ink: v('--ink'),
      chip: v('--chip'), rule: v('--rule'), rose: v('--rose') };
  };

  // The wave: a grid on the floor, seen from above and in front, rolling outward from its middle.
  const S = 0.42, TILT = -0.15, ct = Math.cos(TILT), st = Math.sin(TILT);
  const Z1 = 9.66;
  let Z0 = -5;
  let COLS = 70, ROWS = 36, grid = null;
  const height = (x, z, t) => Math.sin(Math.hypot(x, z) * 0.9 - t) * 0.55 + Math.sin(x * 0.5 + t * 0.7) * 0.25;

  // The camera: at (0, 4.2, 9), looking at (0, -0.5, 0), a 55 degree field of view.
  const CY = 4.2, CZ = 9, UY = 0.8864, UZ = -0.4629, FY = -0.4629, FZ = -0.8864;
  let F = 1, OX = 0;
  function project(x, y, z, out) {
    const ry = y * ct - z * st, rz = y * st + z * ct;      // the floor is tipped a little toward you
    const vy = ry - CY, vz = rz - CZ;
    const depth = FY * vy + FZ * vz;
    if (depth < 0.6) return false;
    out[0] = W / 2 + OX + (x / depth) * F;
    out[1] = H / 2 - ((UY * vy + UZ * vz) / depth) * F;
    return true;
  }

  // Your clinic and its nearby wellness partners: illustrated owners, not photos of real people.
  const clinic = { label: 'Your clinic' };
  const partners = [
    { label: 'Devon · Gym', skin: '#8D5A3B', hair: '#1E1A17', shirt: '#2F5D4A', style: 'short', ang: -155 },
    { label: 'Rosa · Yoga studio', skin: '#E6B99A', hair: '#6B4A2E', shirt: '#7FA48F', style: 'bun', ang: -105 },
    { label: 'Owen · Physical therapy', skin: '#F0C8A8', hair: '#A8763E', shirt: '#3D5748', style: 'short', ang: -50 },
    { label: 'Nadia · Hair salon', skin: '#B7825F', hair: '#2A1C16', shirt: '#BD7189', style: 'long', ang: 160 },
    { label: 'Tina · Nail salon', skin: '#D9A07A', hair: '#3B2416', shirt: '#9E4F68', style: 'long', ang: 25 },
  ];
  let ride = 0.4;                                    // the people float a little calmer than the wave

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

  // Name tags.
  const FONT = '600 12px Inter, -apple-system, sans-serif', BOLD = '700 13px Inter, -apple-system, sans-serif';
  function tagSize(label, strong) {
    ctx.font = strong ? BOLD : FONT;
    return [ctx.measureText(label).width + 22, strong ? 30 : 26];
  }
  function tag(x, y, label, strong) {
    const [w, h] = tagSize(label, strong);
    const px = Math.max(8, Math.min(W - w - 8, x - w / 2)), py = y - h - 10;
    ctx.fillStyle = strong ? colors.ink : colors.chip;
    ctx.strokeStyle = strong ? colors.ink : colors.rule;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(px, py, w, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.font = strong ? BOLD : FONT;
    ctx.fillStyle = strong ? '#fff' : colors.ink;
    ctx.fillText(label, px + 11, py + h / 2 + .5);
  }
  // A node's footprint on screen: the face and the tag above it, with room for the wave's rise and fall.
  function boxOf(x, y, label, strong, up = 0, down = 0) {
    const [w, h] = tagSize(label, strong);
    const px = Math.max(8, Math.min(W - w - 8, x - w / 2));
    return [Math.min(px, x - 20), y - 10 - h - 10 - up - 4, Math.max(px + w, x + 20), y + 20 + down + 4];
  }
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

  // Keep the people off the words: each node takes the free grid spot nearest to where it would like
  // to be (the clinic to the right of the words or below them, the partners around it).
  let textBox = null;
  function layout() {
    const c = canvas.getBoundingClientRect(), pad = 16;
    const taken = [...hero.querySelectorAll('h1, .lede')].map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left - c.left - pad, r.top - c.top - pad, r.right - c.left + pad, r.bottom - c.top + pad];
    });
    textBox = taken.reduce((u, b) => [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])],
      [Infinity, Infinity, -Infinity, -Infinity]);
    const spots = [], p2 = [0, 0], hi = [0, 0], lo = [0, 0], A = 0.8 * ride;
    for (let gz = -3; gz <= 8; gz += 0.42) for (let gx = -12; gx <= 12; gx += 0.42) {
      if (project(gx, 0, gz, p2) && project(gx, A, gz, hi) && project(gx, -A, gz, lo)) {
        spots.push([gx, gz, p2[0], p2[1], p2[1] - hi[1], lo[1] - p2[1]]);
      }
    }
    const inside = (b) => b[0] >= 4 && b[2] <= W - 4 && b[1] >= 4 && b[3] <= H - 12;
    const place = (node, tx, ty, strong, reach) => {
      let best = null, bd = reach * reach;
      for (const s of spots) {
        const d = (s[2] - tx) ** 2 + (s[3] - ty) ** 2;
        if (d >= bd) continue;
        const b = boxOf(s[2], s[3], node.label, strong, s[4], s[5]);
        if (inside(b) && !taken.some((t) => hit(b, t))) { best = s; bd = d; }
      }
      node.hidden = !best;
      if (best) { node.gx = best[0]; node.gz = best[1]; taken.push(boxOf(best[2], best[3], node.label, strong, best[4], best[5])); }
      return best;
    };
    const below = textBox[3], room = H - below;
    if (narrow) {
      // phones: your clinic in the middle, the partners in two columns around it
      const c0 = place(clinic, W * 0.66, below + room * 0.5, true, Math.max(W, H));
      if (!c0) { partners.forEach((p) => { p.hidden = true; }); return; }
      const spot = [[.27, .14], [.72, .2], [.3, .45], [.28, .77], [.72, .8]];
      partners.forEach((p, i) => place(p, W * spot[i][0], below + room * spot[i][1], false, W * 0.7));
      return;
    }
    const c0 = place(clinic, W * 0.72, H * 0.58, true, Math.max(W, H));
    if (!c0) { partners.forEach((p) => { p.hidden = true; }); return; }
    const rx = Math.max(170, Math.min(W * 0.2, 290)), ry = rx * 0.62;
    for (const p of partners) {
      const a = p.ang * Math.PI / 180;
      place(p, c0[2] + Math.cos(a) * rx, c0[3] + Math.sin(a) * ry, false, rx * 1.6);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    narrow = W < 760;
    Z0 = narrow ? 0.5 : -5;
    ride = narrow ? 0.3 : 0.4;
    COLS = narrow ? 36 : 70; ROWS = Math.round((Z1 - Z0) / S) + 1;
    F = (H / 2) / Math.tan(27.5 * Math.PI / 180);
    OX = narrow ? 0 : W * 0.12;                    // the wave's middle sits right of the words on wide screens
    grid = new Float32Array(COLS * ROWS * 3);       // screen x, screen y, 1 if in front of the camera
    readColors();
    layout();
    if (still.matches) draw(performance.now());
  }

  // Soften the wave where the words are, at the far edge and where the hero meets the next section.
  function fade() {
    ctx.globalCompositeOperation = 'destination-out';
    if (textBox && isFinite(textBox[0])) {
      for (let i = 0; i < 12; i++) {
        const g = i * 12;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.roundRect(textBox[0] - g, textBox[1] - g, textBox[2] - textBox[0] + 2 * g, textBox[3] - textBox[1] + 2 * g, 24 + g);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    const top = narrow && textBox ? Math.min(H, textBox[3] + 200) : H * 0.42;
    let g = ctx.createLinearGradient(0, 0, 0, top);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, top);
    g = ctx.createLinearGradient(0, H * 0.78, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.globalCompositeOperation = 'source-over';
  }

  // The network builds once per visit: your clinic first, then a dashed line goes out to each partner
  // and their face and tag settle in. After that it stays: pending connections riding the wave.
  const KEY = 'own-network-open';
  let built = false;
  try { built = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  let startAt = 0, started = false;
  const LEAD = .6, BEAT = .45, DRAW = .45, POP = .35;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
  const back = (v) => 1 + 2.2 * Math.pow(v - 1, 3) + 1.2 * Math.pow(v - 1, 2);

  const p1 = [0, 0];
    function nodeAt(n, t, out) {
    return project(n.gx, height(n.gx, n.gz, t) * ride, n.gz, out);
  }
  function draw(now) {
    const t = still.matches ? 2.2 : now / 1000 * 1.2;   // the wave's own clock
    const since = (still.matches || built) ? 99 : (started ? (now - startAt) / 1000 : -1);
    ctx.clearRect(0, 0, W, H);

    // the wave: one path for every line, then the points
    const x0 = -(COLS / 2) * S, z0 = Z0;
    for (let r = 0, i = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++, i += 3) {
      const x = x0 + c * S, z = z0 + r * S;
      const ok = project(x, height(x, z, t), z, p1);
      grid[i] = p1[0]; grid[i + 1] = p1[1]; grid[i + 2] = ok ? 1 : 0;
    }
    ctx.lineWidth = 1; ctx.strokeStyle = colors.line; ctx.globalAlpha = .55;
    ctx.beginPath();
    for (let r = 0; r < ROWS; r++) {
      let pen = false;
      for (let c = 0; c < COLS; c++) {
        const i = (r * COLS + c) * 3;
        if (!grid[i + 2]) { pen = false; continue; }
        if (pen) ctx.lineTo(grid[i], grid[i + 1]); else ctx.moveTo(grid[i], grid[i + 1]);
        pen = true;
      }
    }
    for (let c = 0; c < COLS; c++) {
      let pen = false;
      for (let r = 0; r < ROWS; r++) {
        const i = (r * COLS + c) * 3;
        if (!grid[i + 2]) { pen = false; continue; }
        if (pen) ctx.lineTo(grid[i], grid[i + 1]); else ctx.moveTo(grid[i], grid[i + 1]);
        pen = true;
      }
    }
    ctx.stroke();
    ctx.fillStyle = colors.dot; ctx.globalAlpha = .6;
    for (let i = 0; i < grid.length; i += 3) if (grid[i + 2]) ctx.fillRect(grid[i] - .9, grid[i + 1] - .9, 1.8, 1.8);
    ctx.globalAlpha = 1;
    fade();

    // the network, riding the wave
    if (clinic.hidden || since < 0) return;
    const q = [0, 0];
    if (!nodeAt(clinic, t, q)) return;
    const shown = partners.filter((p) => !p.hidden);
    const pos = [0, 0];
    shown.forEach((p, i) => {
      if (!nodeAt(p, t, pos)) return;
      const begin = LEAD + i * BEAT, d = ease(clamp((since - begin) / DRAW));
      if (d <= 0) return;
      // the dashed line out from your clinic: marching slowly, breathing in and out while it waits
      const tx = q[0] + (pos[0] - q[0]) * d, ty = q[1] + (pos[1] - q[1]) * d;
      ctx.setLineDash([5, 6]); ctx.lineDashOffset = still.matches ? 0 : -t * 10;
      ctx.strokeStyle = colors.lit; ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t * 2 + i * 1.3);
      ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.setLineDash([]);
      if (d < 1) return;
      const pop = clamp((since - begin - DRAW) / POP);
      ctx.globalAlpha = Math.min(1, pop * 2.2);
      owner(pos[0], pos[1], p, Math.max(.01, back(pop)));
      const name = ease(clamp((since - begin - DRAW - .15) / .35));
      if (name > 0) { ctx.globalAlpha = name; tag(pos[0], pos[1] - 12 + (1 - name) * 8, p.label, false); }
    });
    const c = clamp(since / .5);
    ctx.globalAlpha = 1; ctx.fillStyle = colors.rose;
    ctx.beginPath(); ctx.arc(q[0], q[1], 11 * Math.max(.01, back(c)), 0, 6.283); ctx.fill();
    ctx.strokeStyle = colors.rose; ctx.lineWidth = 2; ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 2.4);
    ctx.beginPath(); ctx.arc(q[0], q[1], 19, 0, 6.283); ctx.stroke();
    const label = ease(clamp((since - .25) / .4));
    if (label > 0) { ctx.globalAlpha = label; tag(q[0], q[1] - 6 + (1 - label) * 6, clinic.label, true); }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (onScreen && !still.matches) draw(now);
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  still.addEventListener && still.addEventListener('change', () => draw(performance.now()));
  resize();
  // The network starts building half a second after the hero is first on screen; it is shown
  // complete if it was already built this visit, or with reduced motion.
  const go = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    go.disconnect();
    setTimeout(() => {
      started = true; startAt = performance.now();
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    }, built ? 0 : 500);
  });
  go.observe(canvas);
  requestAnimationFrame(frame);
  document.fonts && document.fonts.ready.then(() => { readColors(); layout(); if (still.matches) draw(performance.now()); });
})();
