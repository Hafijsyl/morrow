/* 03 Treatments — Apple "Take a closer look" viewer.
   Pills spring open into cards (Apple's spring and timing); one large product sits on the right and
   crossfades to a close-up for each pill. No 3D canvas, no outlines, no label lines. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- spring (damping ratio .77, ω 15 → ~2% overshoot at ~330ms, settled ~650ms) ---------- */
const ZETA = 0.77, OMEGA = 15;
class Spring {
  constructor(v) { this.x = v; this.v = 0; this.t = v; }
  step(dt) {
    const a = -OMEGA * OMEGA * (this.x - this.t) - 2 * ZETA * OMEGA * this.v;
    this.v += a * dt; this.x += this.v * dt;
    if (Math.abs(this.x - this.t) < 0.05 && Math.abs(this.v) < 0.05) { this.x = this.t; this.v = 0; return false; }
    return true;
  }
}

export function initTreatments() {
  const root = $('[data-viewer]');
  if (!root) return;
  const canvas = $('[data-viewer-gl]', root);
  const controls = $('[data-controls]', root);
  const list = $$('.vi', root);
  const paddles = $('[data-paddles]', root);
  const prev = $('[data-prev]', root), next = $('[data-next]', root);
  const closeBtn = $('[data-close]', root);
  const intro = $('[data-intro]', root);
  const mobile = () => matchMedia('(max-width:1024px)').matches;

  /* ---------- sizes + springs ---------- */
  const st = list.map((li) => ({ li, btn: $('.vi__open', li), inner: $('.vi__inner', li), label: $('.vi__label', li), w: new Spring(56), h: new Spring(56), cw: 0, ew: 0, eh: 0 }));
  const measure = () => st.forEach((s) => {
    s.cw = Math.ceil(s.btn.scrollWidth);
    s.ew = Math.ceil(s.inner.offsetWidth);
    s.eh = Math.ceil(s.inner.offsetHeight);
  });
  const apply = (s) => { s.li.style.width = `${s.w.x}px`; s.li.style.height = `${s.h.x}px`; };
  let raf = 0, last = 0;
  const run = (now) => {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016); last = now;
    let moving = false;
    st.forEach((s) => { const a = s.w.step(dt), b = s.h.step(dt); apply(s); moving = moving || a || b; });
    raf = moving ? requestAnimationFrame(run) : 0;
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(run); } };

  /* ---------- state ---------- */
  let active = -1, introDone = false;
  const setTargets = () => st.forEach((s, i) => {
    const open = i === active;
    s.w.t = open ? s.ew : s.cw;
    s.h.t = open ? s.eh : 56;
  });
  const pop = (el, show) => gsap.to(el, { scale: show ? 1 : 0, autoAlpha: show ? 1 : 0, duration: show ? 0.5 : 0.3, ease: show ? 'back.out(1.8)' : 'power2.in' });

  const select = (i) => {
    if (!introDone || i === active) return;
    const was = active;
    active = i;
    controls.classList.toggle('is-engaged', i >= 0);
    st.forEach((s, k) => { s.li.classList.toggle('is-open', k === i); s.btn.setAttribute('aria-expanded', k === i ? 'true' : 'false'); });
    // Apple waits ~100ms before the shapes start moving
    setTimeout(() => { setTargets(); kick(); }, was >= 0 && i >= 0 ? 100 : 0);
    if (!mobile()) pop(paddles, i >= 0);
    pop(closeBtn, i >= 0);
    prev.disabled = i <= 0; next.disabled = i >= st.length - 1;
    flyTo(i);
  };
  st.forEach((s, i) => s.btn.addEventListener('click', () => select(i)));
  prev.addEventListener('click', () => select(Math.max(0, active - 1)));
  next.addEventListener('click', () => select(Math.min(st.length - 1, active + 1)));
  closeBtn.addEventListener('click', () => select(-1));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') select(-1);
    if (active >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); select(Math.min(st.length - 1, Math.max(0, active + (e.key === 'ArrowDown' ? 1 : -1)))); }
  });

  /* ---------- intro beat: a circle, then the pills grow out of it ---------- */
  const playIntro = () => {
    measure();
    st.forEach((s) => { s.w.x = 56; s.w.t = 56; s.h.x = 56; s.h.t = 56; apply(s); });
    const tl = gsap.timeline();
    tl.to(intro, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' })
      .add(() => {
        st.forEach((s, i) => setTimeout(() => {
          gsap.to(s.li, { opacity: 1, duration: 0.2 });
          s.w.t = s.cw; kick();
          gsap.to(s.label, { opacity: 1, duration: 0.3, delay: 0.2, ease: 'power1.out' });
        }, i * 50));
      }, '+=0.05')
      .to(intro, { opacity: 0, duration: 0.3 }, '+=0.15')
      .add(() => { introDone = true; });
  };
  new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { playIntro(); obs.disconnect(); } }, { threshold: 0.35 }).observe(root);

  /* ---------- scroll steps: the card pins and each scroll step opens the next pill ---------- */
  const steps = st.length + 1; // overview + one per pill
  ScrollTrigger.matchMedia({
    '(min-width: 1025px)': () => {
      ScrollTrigger.create({
        trigger: root, start: 'center center', end: () => `+=${Math.round(innerHeight * 0.6 * steps)}`,
        pin: true, pinSpacing: true, anticipatePin: 1,
        onUpdate: (self) => {
          if (!introDone) return;
          const k = Math.min(steps - 1, Math.floor(self.progress * steps * 0.999)) - 1;
          if (k !== active) select(k);
        },
      });
    },
  });
  addEventListener('resize', () => { measure(); if (introDone) { setTargets(); kick(); } });
  document.fonts && document.fonts.ready.then(() => { measure(); if (introDone) { setTargets(); kick(); } });

  /* ---------- the product stage: one image at a time, crossfading like Apple's tour media ---------- */
  const shots = $$('[data-shot]', root);
  const byKey = (k) => shots.find((s) => +s.dataset.shot === k);
  let current = byKey(-1);
  function flyTo(i) {
    const nextShot = byKey(i) || byKey(-1);
    if (nextShot === current) return;
    const prevShot = current; current = nextShot;
    prevShot.classList.remove('is-cur'); nextShot.classList.add('is-cur');
    root.querySelectorAll('[data-note]').forEach((n) => n.classList.toggle('is-cur', +n.dataset.note === i));
    if (typeof warm === 'function') warm(nextShot);
    gsap.killTweensOf([prevShot, nextShot]);
    if (nextShot.tagName === 'VIDEO') { try { nextShot.currentTime = 0; nextShot.play(); } catch (e) {} }
    if (prevShot.tagName === 'VIDEO') setTimeout(() => { if (prevShot !== current) prevShot.pause(); }, 450);
    gsap.to(prevShot, { autoAlpha: 0, scale: 0.94, y: -30, duration: 0.45, ease: 'power2.in' });
    gsap.fromTo(nextShot, { autoAlpha: 0, scale: 0.86, y: 70, rotation: -4 }, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, duration: 1.15, delay: 0.18, ease: 'expo.out' });
  }
  /* ---------- rendered 3D products: a turntable of real frames drawn to a canvas ---------- */
  let inView = false;
  const seqs = shots.filter((s) => s.dataset.seq).map((s) => {
    const n = +s.dataset.n, base = s.dataset.seq, fps = +(s.dataset.fps || 24);
    const cv = document.createElement('canvas'); cv.className = 'seq';
    cv.width = +s.dataset.w; cv.height = +s.dataset.h;
    s.querySelector('.shot__body').replaceChildren(cv);
    const ctx = cv.getContext('2d');
    const frames = []; let loaded = 0, f = 0, last = 0, started = false;
    const load = () => {
      if (started) return; started = true;
      for (let i = 0; i < n; i++) { const im = new Image(); im.decoding = 'async'; im.onload = () => { loaded++; if (i === 0) draw(0); }; im.src = `${base}${String(i).padStart(3, '0')}.webp`; frames[i] = im; }
    };
    // fine still grain, laid only where the product is (source-atop), so it never sits on the card
    const gr = document.createElement('canvas'); gr.width = gr.height = 256;
    { const g = gr.getContext('2d'), d = g.createImageData(256, 256); for (let k = 0; k < d.data.length; k += 4) { const v = Math.random() * 255; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; } g.putImageData(d, 0, 0); }
    const pat = ctx.createPattern(gr, 'repeat');
    const draw = (i) => { const im = frames[i]; if (im && im.complete && im.naturalWidth) {
      ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(im, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.22; ctx.fillStyle = pat; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = 'destination-in'; ctx.globalAlpha = 1; ctx.drawImage(im, 0, 0); ctx.restore(); } };
    // sway: frames cover one side-to-side swing; play it back and forth on a cosine so it eases at each end
    const sway = s.dataset.mode === 'sway', period = +(s.dataset.period || 10) * 1000; let t0 = 0, shown = -1;
    const tick = (now) => {
      if (s !== current || !inView || loaded < n) { last = now; t0 = 0; return; }
      if (sway) {
        if (!t0) t0 = now;
        // starts with the label straight on, swings to one side, through centre, to the other, and back
        const j = Math.round((1 + Math.sin(((now - t0) / period) * Math.PI * 2)) / 2 * (n - 1));
        if (j !== shown) { shown = j; draw(j); }
        return;
      }
      if (now - last >= 1000 / fps) { last = now; f = (f + 1) % n; draw(f); }
    };
    return { s, load, tick, reset: () => { f = 0; draw(0); } };
  });
  // load only what is about to be seen: the product on screen and the next one in the list
  const warm = (shot) => { const i = shots.indexOf(shot); [shots[i], shots[i + 1]].forEach((s2) => { const q = seqs.find((x) => x.s === s2); if (q) q.load(); }); };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) warm(current); }, { rootMargin: '600px 0px' }).observe(root);
  const loop = (now) => { requestAnimationFrame(loop); seqs.forEach((q) => q.tick(now)); };
  requestAnimationFrame(loop);
  // the overview plays when the section comes into view
  new IntersectionObserver(([e]) => { const v = current; if (v && v.tagName === 'VIDEO') { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); } }, { threshold: 0.2 }).observe(root);
  // a calm idle drift and a little pointer parallax so the product feels alive
  const stage = $('[data-stage]', root);
  let tx = 0, ty = 0, mx = 0, my = 0;
  root.addEventListener('pointermove', (e) => { const r = root.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; });
  root.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  const t0 = performance.now();
  const drift = () => {
    requestAnimationFrame(drift);
    const t = (performance.now() - t0) / 1000;
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    stage.style.transform = `translate3d(${(mx * -14).toFixed(2)}px, ${(Math.sin(t * 0.8) * 6 + my * -10).toFixed(2)}px, 0) rotate(${(Math.sin(t * 0.5) * 0.6 + mx * 1.2).toFixed(3)}deg)`;
  };
  drift();
}
