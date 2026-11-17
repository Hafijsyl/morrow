/* preview capture switches: ?face=0 hides the face, ?ui=0 hides the text, ?ui=only keeps only the text */
{ const q = new URLSearchParams(location.search); if (q.get('face') === '0') document.documentElement.dataset.noface = '1'; if (q.get('ui')) document.documentElement.dataset.ui = q.get('ui'); }
import { initTreatments } from './treat-viewer.js?v=9';
import { initHero } from './hero.js?v=59';
window.lucide?.createIcons({ attrs: { 'stroke-width': 1.5 } });

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* ---------------- smooth scroll ---------------- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
gsap.registerPlugin(ScrollTrigger);
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  const el = id.length > 1 ? $(id) : null;
  if (!el && id !== '#top') return;
  e.preventDefault();
  lenis ? lenis.scrollTo(el || 0, { duration: 1.6 }) : (el || document.body).scrollIntoView({ behavior: 'smooth' });
}));

/* ---------------- navbar hide on scroll down ---------------- */
{
  const nav = $('[data-nav]');
  let last = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const d = y - last;
    if (y < 120) nav.classList.remove('is-hidden');
    else if (d > 0.5) nav.classList.add('is-hidden');
    else if (d < -0.5) nav.classList.remove('is-hidden');
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
}

/* ---------------- headline line reveals ---------------- */
$$('.reveal-lines').forEach((el) => {
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map((p) => `<span class="ln"><span>${p.trim()}</span></span>`).join('');
});
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });
$$('.reveal-lines').forEach((el) => io.observe(el));


/* paper grain tile (matches the hero's shader grain: per-pixel tooth plus soft fibres) */
{
  const dpr = Math.min(devicePixelRatio || 1, 2), N = 384;
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const x = cv.getContext('2d'), im = x.createImageData(N, N), px = im.data;
  for (let i = 0; i < N * N; i++) { const t = (Math.random() + Math.random() - 1) * 46; const v = 128 + t; px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v; px[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
  x.lineCap = 'round';
  for (let i = 0; i < 1400; i++) {
    const a = Math.random() * Math.PI, l = 3 + Math.random() * 9, cx = Math.random() * N, cy = Math.random() * N;
    x.strokeStyle = Math.random() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'; x.lineWidth = .7;
    for (const ox of [0, -N, N]) for (const oy of [0, -N, N]) { x.beginPath(); x.moveTo(cx + ox, cy + oy); x.lineTo(cx + ox + Math.cos(a) * l, cy + oy + Math.sin(a) * l); x.stroke(); }
  }
  document.documentElement.style.setProperty('--paper', `url(${cv.toDataURL('image/png')})`);
  document.documentElement.style.setProperty('--paper-size', `${N / dpr}px`);
}

/* =========================================================
   01 HERO — engraved portrait + water reveal (see hero.js)
   ========================================================= */
const hero = initHero({ finePointer });
/* hero title: "your mornings again." is sized to run exactly the width of the content */
{
  const big = $('[data-fit]'), inner = $('.hero__inner');
  const fit = () => {
    if (!big || innerWidth <= 1024) { if (big) { big.style.fontSize = ''; big.closest('h1').style.fontSize = ''; } if (hero.setChin) hero.setChin(null); return; }
    const cs = getComputedStyle(inner), w = (inner.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) * ((window.__hv || {}).titleW || 1);
    big.closest('h1').style.fontSize = '100px'; big.style.fontSize = '';
    const t = big.firstElementChild.getBoundingClientRect().width;
    big.closest('h1').style.fontSize = (100 * w / t).toFixed(2) + 'px';
    big.style.fontSize = '';
    const hr = $('[data-hero]').getBoundingClientRect(), tr = big.closest('h1').getBoundingClientRect();
    if (hero.setChin) hero.setChin(tr.top - hr.top + tr.height * 0.04);
  };
  fit(); addEventListener('resize', fit); if (document.fonts) document.fonts.ready.then(fit);
}
{
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to(hero, { intro: 1, duration: 2.4, ease: 'power2.inOut' }, 0)
    .to('.hero__title .line > span', { y: 0, duration: 1.6, stagger: .12 }, .3)
    .from('.hero__lead, .hero__actions', { opacity: 0, y: 16, duration: 1.2, stagger: .08 }, .9)
    .from('.index li, .hero__hint', { opacity: 0, y: 10, duration: 1, stagger: .05 }, 1.1)
    .from('.nav__block', { opacity: 0, y: -12, duration: 1, stagger: .06 }, .3);
  if (!finePointer) { const h = $('[data-hint]'); if (h) h.lastChild.textContent = 'Drag to reveal'; }
  $('[data-hero]').addEventListener('pointermove', () => { const h = $('[data-hint]'); if (h) h.style.opacity = 0; }, { once: true });
}

/* =========================================================
   02 Why Morrow — a 24-hour clock behind the man; what changes cycles on the right
   ========================================================= */
{
  const root = $('[data-why]'), stage = $('[data-why-stage]'), fit = $('[data-why-fit]');
  // fit the 1440 x 960 stage into one viewport, edge to edge
  const fitScale = () => { const w = fit.clientWidth, hgt = innerHeight - 96; root.style.setProperty('--ws', w > 720 ? Math.min(w / 1440, hgt / 1060, 1.2).toFixed(4) : 1); };
  fitScale(); addEventListener('resize', fitScale);

  // clock: midnight at the bottom, 6 am left, noon top, 6 pm right; the morning peak lights up
  const svg = $('[data-why-clock]', root), R = 316;
  const pt = (h, r) => { const a = h / 24 * Math.PI * 2; return [-Math.sin(a) * r, Math.cos(a) * r]; };
  const peak = (h) => Math.exp(-((h - 7) ** 2) / 6);
  let s = '';
  for (let i = 0; i < 144; i++) {
    const h = i / 6, major = i % 6 === 0, lit = peak(h);
    const len = major ? 16 : 9 + lit * 8;
    const [x1, y1] = pt(h, R - len), [x2, y2] = pt(h, R);
    s += `<line data-h="${h}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:var(--tick);stroke-width:${major ? 1.6 : 1.2}px;stroke-linecap:round"/>`;
  }
  const [sx, sy] = pt(7, R + 20);
  s += `<circle cx="${sx}" cy="${sy}" r="5" style="fill:var(--tick-on)"/><circle class="sun" cx="${sx}" cy="${sy}" r="11" style="fill:none;stroke:var(--tick-on)"/>`;
  svg.innerHTML = s;
  const ticks = $$('line', svg);
  ScrollTrigger.create({ trigger: root, start: 'top 60%', once: true, onEnter: () => ticks.forEach((t) => {
    const lit = peak(+t.dataset.h); if (lit < .25) return;
    setTimeout(() => { t.style.stroke = `color-mix(in srgb, var(--tick-on) ${Math.round(45 + lit * 55)}%, var(--tick))`; t.style.strokeWidth = '1.8px'; }, 300 + Math.abs(+t.dataset.h - 7) * 260);
  }) });
  gsap.from('.w3__head > *, .w3 .portrait', { scrollTrigger: { trigger: root, start: 'top 70%' }, autoAlpha: 0, y: 24, duration: 1.4, stagger: .12, ease: 'expo.out', clearProps: 'transform,opacity,visibility' });
  gsap.from('.w3 .list, .w3 .side, .w3 .tt', { scrollTrigger: { trigger: root, start: 'top 45%' }, autoAlpha: 0, y: 16, duration: 1.1, stagger: .1, delay: .3, ease: 'expo.out', clearProps: 'transform,opacity,visibility' });

  const D = [
    { ic: 'messages-square', t: 'Visits that take time', was: 'Ten-minute visits', p: 'A real first visit, then your clinician on message any day.', tag: 'Same-day replies' },
    { ic: 'test-tube', t: 'Labs at home', was: 'One lab a year', p: 'A finger-prick kit at your door. Results in three days.', tag: 'Every six weeks' },
    { ic: 'stethoscope', t: 'A clinician who stays', was: 'A new doctor every time', p: 'The same clinician from week one, who knows your numbers.', tag: 'Start to finish' },
    { ic: 'syringe', t: 'A dose tuned to you', was: 'Guesswork dosing', p: 'Set from your labs, adjusted at every six‑week check.', tag: 'Adjusted at week six' },
    { ic: 'activity', t: 'Track how you feel', was: '"It\'s just age"', p: 'Sleep, energy and drive checked weekly, so change shows.', tag: 'Weekly check-in' },
  ];
  const lis = $$('[data-why-list] li', root), call = $('[data-why-call]', root);
  const show = (k) => {
    lis.forEach((li, i) => li.classList.toggle('on', i === k));
    call.classList.add('is-out');
    setTimeout(() => {
      const d = D[k];
      $('[data-why-ic]', root).innerHTML = `<i data-lucide="${d.ic}"></i>`;
      $('[data-why-t]', root).textContent = d.t; $('[data-why-was]', root).textContent = d.was;
      $('[data-why-p]', root).textContent = d.p; $('[data-why-tag]', root).textContent = d.tag;
      window.lucide?.createIcons({ attrs: { 'stroke-width': 1.75 } });
      call.classList.remove('is-out');
    }, 260);
  };
  let k = 1, seen = false, paused = false;
  show(k);
  lis.forEach((li, i) => { li.addEventListener('click', () => { k = i; show(k); }); li.addEventListener('pointerenter', () => { paused = true; k = i; show(k); }); li.addEventListener('pointerleave', () => { paused = false; }); });
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; }, { threshold: .3 }).observe(root);
  setInterval(() => { if (!seen || paused) return; k = (k + 1) % D.length; show(k); }, 3800);
  const cnt = $('[data-why-count]', root), tt = $('.w3 .tt', root);
  ScrollTrigger.create({ trigger: tt, start: 'top 98%', once: true, onEnter: () => { const o = { v: 287 }; gsap.to(o, { v: 642, duration: 2.2, ease: 'power3.out', onUpdate: () => (cnt.textContent = Math.round(o.v)) }); } });
}

/* =========================================================
   03 Treatments (Three.js outline drawing)
   ========================================================= */
initTreatments({ lenis });

/* =========================================================
   04 Plan prototype: the person shown sits in the middle and larger; Dr. Chen reads three things,
   each on a small range bar; the plan arrives with its dosing days and her signature
   ========================================================= */
{
  // pos: where the value sits on the bar (0-100); band: the healthy range [from, width]
  const people = [
    { name: 'Marcus', age: 34, time: '7:42 am', feel: 'flat since his second kid, sleeping five hours a night.',
      rows: [{ k: 'Total T', v: '312 ng/dL', pos: 22, band: [40, 42], tag: 'Low for 34', low: 1 },
             { k: 'LH', v: '2.1 IU/L', pos: 30, band: [34, 40], tag: 'Can make more', low: 1 },
             { k: 'Goal', v: 'Kids in 2 yrs', tag: 'Protect fertility' }],
      plan: 'Enclomiphene, every other morning', days: [1, 0, 1, 0, 1, 0, 1], chips: ['Protects fertility', 'Labs again at week 6', 'Sleep plan included'], after: 6 },
    { name: 'Dev', age: 41, time: '9:15 pm', feel: 'foggy at work and gaining weight around the middle.',
      rows: [{ k: 'Total T', v: '268 ng/dL', pos: 16, band: [40, 42], tag: 'Low', low: 1 },
             { k: 'SHBG', v: '62 nmol/L', pos: 82, band: [24, 46], tag: 'High', low: 1 },
             { k: 'BP', v: '122 / 78', pos: 52, band: [30, 44], tag: 'Normal' }],
      plan: 'Testosterone cream, daily at 7am', days: [1, 1, 1, 1, 1, 1, 1], chips: ['Steady levels', 'No needles', 'Recheck at week 6'], after: 5 },
    { name: 'Alan', age: 56, time: '6:30 am', feel: 'tired every afternoon, and recovery takes days.',
      rows: [{ k: 'Total T', v: '241 ng/dL', pos: 12, band: [40, 42], tag: 'Low', low: 1 },
             { k: 'Hematocrit', v: '44%', pos: 48, band: [28, 44], tag: 'Safe to treat' },
             { k: 'PSA', v: '1.1 ng/mL', pos: 26, band: [6, 50], tag: 'Normal for age' }],
      plan: 'Weekly injection, low dose', days: [1, 0, 0, 0, 0, 0, 0], chips: ['Self-inject at home', 'Hematocrit watched', 'Peptides for recovery'], after: 7 },
  ];
  const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const root = $('[data-plan]');
  const flow = $('.proto__flow', root);
  const btns = $$('[data-person]', root), steps = $$('[data-steps] li', root);
  const nameEl = $('[data-p-name]'), ageEl = $('[data-p-age]'), feelEl = $('[data-p-feel]'), metaEl = $('[data-p-meta]');
  const list = $('[data-think-list]'), card = $('[data-planc]'), readEl = $('[data-read]');
  const DUR = 10000;
  let idx = 0, timers = [], ringTween = null, running = false;

  const clear = () => { timers.forEach(clearTimeout); timers = []; ringTween && ringTween.kill(); };
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const setStep = (n) => steps.forEach((s, i) => s.classList.toggle('is-on', i <= n));
  const row = (r) => {
    const el = document.createElement('div'); el.className = 'tA__row';
    const bar = r.pos == null ? '<span class="tA__bar tA__bar--none"></span>'
      : `<span class="tA__bar"><em style="left:${r.band[0]}%;width:${r.band[1]}%"></em><i style="left:${r.pos}%"></i></span>`;
    el.innerHTML = `<span>${r.k}</span><b>${r.v}</b>${bar}<span class="tA__tag${r.low ? ' is-low' : ''}">${r.tag}</span>`;
    return el;
  };
  // the person being shown moves to the middle and grows; the other two keep their order either side
  const seat = (n) => {
    const others = [0, 1, 2].filter((i) => i !== n);
    btns.forEach((b, i) => { b.style.order = i === n ? 1 : (i === others[0] ? 0 : 2); b.classList.toggle('is-on', i === n); });
  };
  const play = (n) => {
    clear(); idx = n; const p = people[n];
    seat(n);
    gsap.fromTo('[data-feeling]', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .6, ease: 'expo.out' });
    nameEl.textContent = p.name; ageEl.textContent = p.age; feelEl.textContent = p.feel; metaEl.textContent = `${p.name} · intake, ${p.time}`;
    list.innerHTML = ''; readEl.textContent = '0'; card.classList.remove('is-on'); flow.classList.remove('has-plan'); setStep(0);
    const ring = $('.ring circle', btns[n]);
    $$('.ring circle', root).forEach((c) => (c.style.strokeDashoffset = ''));
    ringTween = gsap.fromTo(ring, { strokeDashoffset: 189 }, { strokeDashoffset: 0, duration: DUR / 1000, ease: 'none' });
    later(() => setStep(1), 700);
    p.rows.forEach((r, i) => later(() => {
      setStep(i ? 2 : 1); readEl.textContent = String(i + 1);
      const el = row(r); list.appendChild(el);
      gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .6, ease: 'expo.out' });
      const dot = $('i', el); if (dot) gsap.fromTo(dot, { left: '0%' }, { left: r.pos + '%', duration: 1.1, ease: 'expo.out', delay: .15 });
    }, 1000 + i * 1300));
    later(() => {
      setStep(3);
      $('[data-plan-who]').textContent = `${p.name} · week 1`;
      $('[data-plan-title]').textContent = p.plan;
      $('[data-plan-week]').innerHTML = p.days.map((d, i) => `<span class="${d ? 'on' : ''}">${DAYS[i]}</span>`).join('');
      $('[data-plan-chips]').innerHTML = p.chips.slice(0, 2).map((c) => `<span>${c}</span>`).join('');
            flow.classList.add('has-plan'); card.classList.add('is-on');
    }, 1000 + p.rows.length * 1300 + 300);
    later(() => play((idx + 1) % people.length), DUR);
  };
  btns.forEach((b, i) => b.addEventListener('click', () => play(i)));
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; play(idx); }
    else if (!e.isIntersecting && running) { running = false; clear(); }
  }, { threshold: .3 }).observe(root);
}

/* =========================================================
   05 Sync your body
   ========================================================= */
{
  const root = $('[data-sync]');
  // orbit
  const items = $$('.orbit__item', root);
  let a = 0, visible = false;
  const spin = () => {
    requestAnimationFrame(spin); if (!visible) return;
    a += 0.0028;
    items.forEach((el, i) => {
      const ang = a + (i / items.length) * Math.PI * 2;
      el.style.transform = `translate(${Math.cos(ang) * 92}px, ${Math.sin(ang) * 92}px)`;
    });
  };
  spin();
  // lab chart: four draws on a smooth line that runs edge to edge, the optimal band, the latest draw called out
  const LAB = [[287, 'Aug'], [412, 'Sep'], [561, 'Oct'], [642, 'Nov']];
  const W = 248, H = 104, B = 84, T = 10;
  const X = (i) => 22 + i * (W - 44) / 3, Y = (v) => B - (v - 220) / 700 * (B - T);
  const pts = LAB.map((p, i) => [X(i), Y(p[0])]);
  const ext = [[0, pts[0][1] + 6], ...pts, [W, pts[3][1] - 3]];
  let d = `M${ext[0][0]} ${ext[0][1].toFixed(1)}`;
  for (let i = 0; i < ext.length - 1; i++) {
    const p0 = ext[i - 1] || ext[i], p1 = ext[i], p2 = ext[i + 1], p3 = ext[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const lp = pts[3], pc = (x, y) => `left:${(x / W * 100).toFixed(2)}%;top:${(y / H * 100).toFixed(2)}%`;
  $('[data-c4]', root).innerHTML = `<span class="c4__lab">Optimal 450–900</span><div class="c4__plot">
    <svg class="c4" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="c4a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d07434" stop-opacity=".2"/><stop offset="1" stop-color="#d07434" stop-opacity="0"/></linearGradient></defs>
    <rect x="0" y="${Y(900).toFixed(1)}" width="${W}" height="${(Y(450) - Y(900)).toFixed(1)}" class="c4__band"/>
    <line x1="0" x2="${W}" y1="${Y(450).toFixed(1)}" y2="${Y(450).toFixed(1)}" class="c4__edge"/>
    <path d="${d} L${W} ${H} L0 ${H} Z" fill="url(#c4a)" class="c4__area"/><path d="${d}" class="c4__line" pathLength="1"/><path d="${d}" class="c4__flow" pathLength="1"/>
    <line x1="${lp[0].toFixed(1)}" x2="${lp[0].toFixed(1)}" y1="${lp[1].toFixed(1)}" y2="${H}" class="c4__guide"/></svg>
    ${pts.map((p, i) => `<i class="c4__pt${i === 3 ? ' c4__pt--now' : ''}" style="${pc(p[0], p[1])}"></i>`).join('')}
    <span class="c4__tip" style="${pc(lp[0], lp[1])}">642</span></div>
    <div class="c4__ax">${LAB.map((p, i) => `<span style="left:${(X(i) / W * 100).toFixed(2)}%"${i === 3 ? ' class="is-now"' : ''}>${p[1]}</span>`).join('')}</div>`;
  // wires: from the real right edge of each card to the phone, the chips riding halfway
  const wire = () => {
    const st = $('.sync__stage', root), sv = $('.sync__wires', root);
    if (!st || !sv || getComputedStyle(sv).display === 'none') return;
    const r = st.getBoundingClientRect(), rel = (el) => { const q = el.getBoundingClientRect(); return { l: q.left - r.left, r: q.right - r.left, t: q.top - r.top, b: q.bottom - r.top }; };
    const sl = rel($('.sleep3', root)), o = rel($('.orbit', root)), ph = rel($('.phone', root));
    sv.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    const cy = (ph.t + ph.b) / 2, ay = (sl.t + sl.b) / 2, ox = o.r - 20, oy = (o.t + o.b) / 2 - 16, px = ph.l + 4, mx = (sl.r + px) / 2;
    const p1 = `M${sl.r} ${ay} C${mx} ${ay} ${mx} ${cy - 14} ${px} ${cy - 14}`, p2 = `M${ox} ${oy} C${mx} ${oy} ${mx} ${cy + 14} ${px} ${cy + 14}`;
    const ws = $$('.wire', sv); [p1, p2, p1, p2].forEach((p, i) => ws[i] && ws[i].setAttribute('d', p));
    const ca = $('.sync__chip--a', root), cb = $('.sync__chip--b', root);
    ca.style.left = `${mx}px`; ca.style.top = `${(ay + cy - 14) / 2}px`; cb.style.left = `${mx}px`; cb.style.top = `${(oy + cy + 14) / 2}px`;
  };
  wire(); addEventListener('resize', wire); addEventListener('load', wire); if (document.fonts) document.fonts.ready.then(wire);
  setTimeout(wire, 1800);
  const count = $('[data-count]', root);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (e.isIntersecting && !root.classList.contains('is-in')) {
      root.classList.add('is-in'); wire();
      const o = { v: 287 };
      gsap.to(o, { v: 642, duration: 2, delay: .4, ease: 'power3.out', onUpdate: () => (count.textContent = Math.round(o.v)) });
    }
  }, { threshold: .25 }).observe(root);
  gsap.from('.phone', { scrollTrigger: { trigger: '.sync__stage', start: 'top 80%' }, y: 80, rotate: 4, opacity: 0, duration: 1.6, ease: 'expo.out' });
  gsap.from('.sync__left > *', { scrollTrigger: { trigger: '.sync__stage', start: 'top 80%' }, y: 40, opacity: 0, duration: 1.4, stagger: .12, ease: 'expo.out' });
}

/* =========================================================
   06 Care and results — four cards that stay alive
   ========================================================= */
{
  const root = $('[data-care]');
  gsap.utils.toArray('.ccard').forEach((t, i) => {
    gsap.from(t, { scrollTrigger: { trigger: t, start: 'top 90%' }, y: 40, opacity: 0, duration: 1.3, delay: (i % 2) * .08, ease: 'expo.out' });
  });
  let seen = false;
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; }, { threshold: .1 }).observe(root);
  // A: what returns, lit one by one
  const moods = $$('[data-cc-mood] li', root); let mi = 0;
  setInterval(() => { if (!seen) return; moods.forEach((x, i) => x.classList.toggle('is-on', i === mi)); mi = (mi + 1) % moods.length; }, 1400);
  // C: dose clock + steps
  const clock = $('[data-cc-clock]', root), prog = $('[data-cc-prog]', root), steps = $$('[data-cc-steps] li', root);
  let t = 42;
  setInterval(() => {
    if (!seen) return;
    t = t <= 0 ? 42 : t - 1;
    clock.textContent = `0:${String(t).padStart(2, '0')}`;
    prog.style.transition = t === 42 ? 'none' : 'width 1s linear'; prog.style.width = `${(1 - t / 42) * 100}%`;
    const k = Math.min(2, Math.floor((42 - t) / 14)); steps.forEach((x, i) => x.classList.toggle('is-on', i === k));
  }, 1000);
  // D: Saturday lights up, then resets
  const target = $('[data-cc-days] .is-target', root);
  setInterval(() => { if (seen) target.classList.toggle('is-lit'); }, 2400);
}

/* =========================================================
   07 CTA — grain ribbon + fanned cards
   ========================================================= */
{
  const fan = $('[data-fan]'), cards = $$('.fcard', fan);
  const spread = (k) => cards.forEach((c, i) => {
    const o = i - (cards.length - 1) / 2;
    c.style.transform = `translateX(${o * 134 * k}px) translateY(${o * o * 10 * k}px) rotate(${o * 8 * k}deg)`;
    c.style.zIndex = 10 - Math.abs(Math.round(o));
  });
  spread(0);
  if (new URLSearchParams(location.search).get('shot')) { document.body.dataset.shot = '1'; spread(1); }
  ScrollTrigger.create({ trigger: fan, start: 'top 85%', onEnter: () => spread(1) });
  fan.addEventListener("pointerenter", () => spread(1.18));
  fan.addEventListener('pointerleave', () => spread(1));

  const canvas = $('[data-ribbon]'), ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, on = false;
  const N = 14000;
  const seeds = Array.from({ length: N }, () => [Math.random(), Math.random() * 2 - 1, Math.random()]);
  const size = () => { dpr = Math.min(devicePixelRatio, 2); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; };
  size(); addEventListener('resize', size);
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  // colour studies: ?cta=a|b|c swaps the light (and the ribbon) without touching the layout
  const study = new URLSearchParams(location.search).get('cta') || 'b';   // B · Golden hour is the chosen light
  if (study) document.body.dataset.cta = study;
  const PAL = { a: [[176, 186, 236], [246, 166, 118], [255, 238, 200]], b: [[226, 168, 120], [246, 210, 150], [255, 246, 222]], c: [[200, 176, 214], [242, 172, 152], [255, 240, 212]] };
  const [C1, C2, C3] = PAL[study] || [[150, 168, 222], [236, 140, 104], [250, 222, 180]];
  const draw = (time) => {
    requestAnimationFrame(draw); if (!on) return;
    const t = time / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++) {
      const [u, v, w] = seeds[i];
      const x = u * (W + 200) - 100;
      const center = H * (.82 - .52 * u) + Math.sin(u * 5.2 + t * .25) * H * .07 + Math.sin(u * 13 + t * .4) * 10;
      const width = H * (.06 + .14 * Math.sin(u * 3.1 + 1.2) ** 2);
      const spreadv = v * Math.abs(v) ** .4;
      const y = center + spreadv * width + Math.sin(t * .6 + w * 6.28) * 2;
      const edge = 1 - Math.abs(spreadv);
      const col = u < .55 ? mix(C1, C2, u / .55) : mix(C2, C3, (u - .55) / .45);
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(.28 + .66 * edge * (.4 + .6 * w)).toFixed(3)})`;
      ctx.fillRect(x, y, 1.7, 1.7);
    }
  };
  requestAnimationFrame(draw);
  new IntersectionObserver(([e]) => (on = e.isIntersecting)).observe(canvas);
  gsap.from('.cta__panel', { scrollTrigger: { trigger: '.cta__panel', start: 'top 85%' }, y: 60, opacity: 0, duration: 1.6, ease: 'expo.out' });
}

/* faq: one open at a time; the answer grows to its own height and the line under the question draws across */
{
  const items = $$('[data-fq]');
  const set = (it, open) => {
    const q = $('.fq__q', it), a = $('.fq__a', it), inner = a.firstElementChild;
    it.classList.toggle('is-open', open); q.setAttribute('aria-expanded', open);
    gsap.to(a, { height: open ? inner.offsetHeight : 0, duration: open ? .7 : .5, ease: open ? 'expo.out' : 'power3.inOut', onComplete: () => ScrollTrigger.refresh() });
    gsap.fromTo(inner, { opacity: open ? 0 : 1, y: open ? -8 : 0 }, { opacity: open ? 1 : 0, y: 0, duration: open ? .6 : .3, delay: open ? .08 : 0, ease: 'expo.out' });
  };
  items.forEach((it) => {
    $('.fq__a', it).style.height = '0px';
    $('.fq__q', it).addEventListener('click', () => { const open = !it.classList.contains('is-open'); items.forEach((o) => o !== it && o.classList.contains('is-open') && set(o, false)); set(it, open); });
  });
  if (items[0]) set(items[0], true);
}
gsap.from('.fq, .foot__top, .foot__trust, .foot__sky', { scrollTrigger: { trigger: '.faq', start: 'top 85%' }, opacity: 0, y: 16, duration: 1, stagger: .05, ease: 'expo.out' });

/* treatments title: each word fills in as you scroll past it */
{
  const t = $('.treat__title');
  if (t) {
    const wrap = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w)); else { const s = document.createElement('span'); s.className = 'tw'; s.textContent = w; frag.appendChild(s); } });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(t);
    gsap.fromTo($$('.tw', t), { opacity: .14 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: t, start: 'top 82%', end: 'bottom 38%', scrub: .6 } });
  }
}

/* how it works: the step list starts level with the clinician's card */
{
  const steps = $('.proto__steps'), think = $('[data-think]'), flow = $('.proto__flow');
  const align = () => { if (!steps || !think || innerWidth <= 1024) { if (steps) steps.style.marginTop = ''; return; } steps.style.marginTop = (think.getBoundingClientRect().top - flow.getBoundingClientRect().top) + 'px'; };
  align(); addEventListener('resize', align); addEventListener('load', align); if (document.fonts) document.fonts.ready.then(align);
}

/* hero treatment index: Wellio-style squares, active follows hover */
{
  const items = $$('[data-index] li');
  items.forEach((li) => li.addEventListener('pointerenter', () => items.forEach((x) => x.classList.toggle('is-on', x === li))));
}

addEventListener('load', () => {
  ScrollTrigger.refresh();
  // ?shot=cta jumps to the CTA (for the colour-study screenshots)
});
if (new URLSearchParams(location.search).get('shot') === 'cta') {
  [600, 1600, 2800].forEach((t) => setTimeout(() => { const p = $('.cta__panel'); const y = p.getBoundingClientRect().top + scrollY - 50; lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }, t));
}
