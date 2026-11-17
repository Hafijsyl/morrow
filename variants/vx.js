/* preview-only: per-variant settings read by main.js (title width) and hero.js (face size/position) */
(function () {
  var v = document.documentElement.dataset.vx;
  var M = {
    h1: { titleW: 0.64, scale: 1.42, cx: 0.6, top: -0.04 },   // smaller type, bigger man
    h2: { titleW: 1, scale: 1.55, cx: 0.5, top: -0.06 },      // same type, much bigger man
    h3: { titleW: 0.8, scale: 1.3, cx: 0.66, top: 0.0 }       // middle ground
  };
  window.__hv = M[v] || {};
})();

/* s1 · Connect your day with hand-built UI: a real sleep report and a real app screen */
document.addEventListener('DOMContentLoaded', function () {
  if (!/^s[12]$/.test(document.documentElement.dataset.vx)) return;
  // last night, in minutes per stage (11:04 pm to 6:46 am)
  var S = [['l',14],['d',38],['l',22],['r',16],['l',28],['d',31],['l',18],['a',4],['l',20],['r',24],['l',34],['d',17],['l',26],['r',31],['a',6],['l',22],['r',29],['l',16],['a',4],['l',20],['r',22]];
  var row = { a: 0, r: 1, l: 2, d: 3 }, col = { a: '#efe2cf', r: '#93a7cc', l: '#a07a5c', d: '#e6924c' };
  var total = S.reduce(function (s, x) { return s + x[1]; }, 0), W = 232, x = 0, bars = '', links = '', prev = null;
  S.forEach(function (s) {
    var w = s[1] / total * W, y = row[s[0]] * 15 + 2;
    if (prev !== null) links += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + (Math.min(prev, y) + 5) + '" y2="' + (Math.max(prev, y) + 5) + '"/>';
    bars += '<rect x="' + (x + .4).toFixed(1) + '" y="' + y + '" width="' + Math.max(1.2, w - .8).toFixed(1) + '" height="10" rx="3" fill="' + col[s[0]] + '"/>';
    x += w; prev = y;
  });
  var sleep = document.querySelector('.sleep');
  sleep.className = 'sleep2';
  sleep.innerHTML =
    '<div class="sl2__top"><span class="sl2__src"><i data-lucide="circle-dot"></i>Ring · synced 6:51 am</span><span class="sl2__more"><i data-lucide="ellipsis"></i></span></div>' +
    '<div class="sl2__score"><div><p class="sl2__k">Sleep score</p><p class="sl2__n">86<small>/100</small></p></div><span class="sl2__chip"><i data-lucide="trending-up"></i>+9 vs avg</span></div>' +
    '<div class="sl2__hyp"><div class="sl2__rows"><span>Awake</span><span>REM</span><span>Light</span><span>Deep</span></div>' +
    '<svg viewBox="0 0 232 60" preserveAspectRatio="none"><g class="sl2__grid"><line x1="0" x2="232" y1="7" y2="7"/><line x1="0" x2="232" y1="22" y2="22"/><line x1="0" x2="232" y1="37" y2="37"/><line x1="0" x2="232" y1="52" y2="52"/></g><g class="sl2__links">' + links + '</g>' + bars + '</svg></div>' +
    '<div class="sl2__axis"><span>11:04 pm</span><span>1 am</span><span>3 am</span><span>5 am</span><span>6:46</span></div>' +
    '<div class="sl2__stats"><div><b>7h 42m</b><span>Asleep</span></div><div><b>1h 26m</b><span><i style="background:#e6924c"></i>Deep</span></div><div><b>52</b><span>Resting bpm</span></div></div>';

  // the app: today, a lab trend with each draw marked, the panel behind it, a note from the clinician
  var pts = [[0, 287, 'Aug 4'], [1, 412, 'Sep 15'], [2, 561, 'Oct 27'], [3, 642, 'Nov 15']];
  var X = function (i) { return 14 + i * 64; }, Y = function (v) { return 96 - (v - 200) / 800 * 90; };
  var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
  var area = line + ' L' + X(3) + ' 100 L' + X(0) + ' 100 Z';
  var dots = pts.map(function (p, i) { var last = i === 3; return '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]).toFixed(1) + '" r="' + (last ? 4 : 2.6) + '" class="' + (last ? 'is-last' : '') + '"/><text x="' + X(p[0]) + '" y="' + (Y(p[1]) - 8).toFixed(1) + '" text-anchor="middle">' + p[1] + '</text>'; }).join('');
  var scr = document.querySelector('.phone__screen');
  scr.className = 'phone__screen ph2';
  scr.innerHTML =
    '<div class="ph2__bar"><span>9:41</span><span class="phone__island"></span><span class="ph2__sig"><i data-lucide="signal"></i><i data-lucide="wifi"></i><i data-lucide="battery-full"></i></span></div>' +
    '<div class="ph2__hi"><div><p class="ph2__date">Sunday, Nov 16</p><p class="ph2__name">Morning, Marcus</p></div><img src="img/p1.jpg?v=3" alt=""></div>' +
    '<div class="ph2__card">' +
      '<div class="ph2__ch"><p>Total testosterone</p><span class="ph2__ok">In range</span></div>' +
      '<p class="ph2__val">642<small>ng/dL</small><em>+355 since Aug</em></p>' +
      '<svg class="ph2__chart" viewBox="0 0 220 104"><rect x="0" y="' + Y(900).toFixed(1) + '" width="220" height="' + (Y(450) - Y(900)).toFixed(1) + '" class="ph2__band"/>' +
      '<text x="218" y="' + (Y(450) - 3).toFixed(1) + '" text-anchor="end" class="ph2__bandt">Optimal 450–900</text>' +
      '<path d="' + area + '" class="ph2__area"/><path d="' + line + '" class="ph2__line"/>' + dots + '</svg>' +
      '<div class="ph2__ax">' + pts.map(function (p) { return '<span>' + p[2] + '</span>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="ph2__panel">' +
      '<div class="ph2__row"><span>Free T</span><b>18.2</b><span class="ph2__rb"><i style="left:58%"></i></span></div>' +
      '<div class="ph2__row"><span>Estradiol</span><b>28</b><span class="ph2__rb"><i style="left:44%"></i></span></div>' +
      '<div class="ph2__row"><span>Hematocrit</span><b>46%</b><span class="ph2__rb"><i style="left:66%"></i></span></div>' +
    '</div>' +
    '<div class="ph2__msg"><img src="img/av-doc.jpg?v=3" alt=""><div><p><b>Dr. Chen</b><span>8:02 am</span></p><p>Great draw. Keep the 7 am dose.</p></div></div>' +
    '<div class="ph2__tabs"><span class="is-on"><i data-lucide="sun"></i>Today</span><span><i data-lucide="flask-conical"></i>Labs</span><span><i data-lucide="calendar"></i>Plan</span><span><i data-lucide="message-circle"></i>Chat</span></div>' +
    '<span class="phone__home"></span>';
  if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
});

/* s2 · the phone, calmer: one focus (the lab trend), two quiet tiles, a clinician line; depth over detail */
document.addEventListener('DOMContentLoaded', function () {
  if (!/^s[2345]$/.test(document.documentElement.dataset.vx)) return;
  var P = [[287, 'Aug'], [412, 'Sep'], [561, 'Oct'], [642, 'Nov']];
  var X = function (i) { return 10 + i * 66; }, Y = function (v) { return 84 - (v - 220) / 520 * 70; };
  var pts = P.map(function (p, i) { return [X(i), Y(p[0])]; });
  var d = 'M' + pts[0][0] + ' ' + pts[0][1].toFixed(1);
  for (var i = 0; i < pts.length - 1; i++) {   // catmull-rom → bezier, so the line is drawn, not plotted
    var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0] + ' ' + p2[1].toFixed(1);
  }
  var last = pts[3], area = d + ' L' + last[0] + ' 96 L' + pts[0][0] + ' 96 Z';
  var scr = document.querySelector('.phone__screen');
  scr.className = 'phone__screen ph3';
  scr.innerHTML =
    '<div class="ph3__bar"><span>9:41</span><span class="phone__island"></span><span class="ph3__sig"><i data-lucide="signal"></i><i data-lucide="wifi"></i><i data-lucide="battery-full"></i></span></div>' +
    '<header class="ph3__head"><div><p class="ph3__date">Sunday 16 November</p><h4 class="ph3__title">Your labs</h4></div><img src="img/p1.jpg?v=3" alt=""></header>' +
    '<section class="ph3__hero">' +
      '<p class="ph3__k">Total testosterone</p>' +
      '<p class="ph3__v">642<small>ng/dL</small></p>' +
      '<p class="ph3__s"><i></i>In your range since October</p>' +
      '<svg class="ph3__chart" viewBox="0 0 220 100"><defs><linearGradient id="ph3a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d57a36" stop-opacity=".18"/><stop offset="1" stop-color="#d57a36" stop-opacity="0"/></linearGradient></defs>' +
        '<rect x="0" y="' + Y(900).toFixed(1) + '" width="220" height="' + (Y(450) - Y(900)).toFixed(1) + '" rx="4" class="ph3__band"/>' +
        '<line x1="0" x2="220" y1="' + Y(450).toFixed(1) + '" y2="' + Y(450).toFixed(1) + '" class="ph3__edge"/>' +
        '<text x="214" y="' + (Y(900) + 10).toFixed(1) + '" text-anchor="end" class="ph3__bt">Optimal 450–900</text>' +
        '<path d="' + area + '" fill="url(#ph3a)"/><path d="' + d + '" class="ph3__line"/>' +
        pts.slice(0, 3).map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1].toFixed(1) + '" r="2.2" class="ph3__pt"/>'; }).join('') +
        '<circle cx="' + last[0] + '" cy="' + last[1].toFixed(1) + '" r="7" class="ph3__halo"/><circle cx="' + last[0] + '" cy="' + last[1].toFixed(1) + '" r="3.4" class="ph3__now"/>' +
      '</svg>' +
      '<div class="ph3__ax">' + P.map(function (p, i) { return '<span' + (i === 3 ? ' class="is-now"' : '') + '>' + p[1] + '</span>'; }).join('') + '</div>' +
    '</section>' +
    '<div class="ph3__tiles">' +
      '<div class="ph3__tile"><p><i data-lucide="moon"></i>Sleep</p><b>7h 42m</b><span>+48m this week</span></div>' +
      '<div class="ph3__tile"><p><i data-lucide="activity"></i>HRV</p><b>58 ms</b><span>+12% this week</span></div>' +
    '</div>' +
    '<div class="ph3__note"><img src="img/av-doc.jpg?v=3" alt=""><p><b>Dr. Chen</b> Keep the 7 am dose. Next draw in 12 days.</p></div>' +
    '<nav class="ph3__tabs"><span><i data-lucide="sun"></i>Today</span><span class="is-on"><i data-lucide="flask-conical"></i>Labs</span><span><i data-lucide="pill"></i>Plan</span><span><i data-lucide="message-circle"></i>Care</span></nav>' +
    '<span class="phone__home"></span>';
  if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
});

/* s3 · quieter sleep card, a fuller chart, tighter tab bar */
document.addEventListener('DOMContentLoaded', function () {
  if (!/^s[345]$/.test(document.documentElement.dataset.vx)) return;
  var sl = document.querySelector('.sleep');
  sl.className = 'sleep3';
  sl.innerHTML =
    '<div class="s3__top"><span><i data-lucide="moon"></i>Last night</span><span>11:04 pm – 6:46 am</span></div>' +
    '<div class="s3__main"><p class="s3__n">86</p><div><p class="s3__k">Sleep score</p><p class="s3__d">7h 42m asleep · <b>+48m</b></p></div></div>' +
    '<div class="s3__bar"><i style="flex:19;background:#d99a62"></i><i style="flex:24;background:#8f9cb3"></i><i style="flex:52;background:#7a6253"></i><i style="flex:5;background:#d9cbb8"></i></div>' +
    '<div class="s3__leg"><span><i style="background:#d99a62"></i>Deep 1h 26m</span><span><i style="background:#8f9cb3"></i>REM 1h 52m</span><span><i style="background:#7a6253"></i>Light</span></div>';
  // the lab chart, finished: a scale, the optimal band named, every draw dated, the latest one called out
  var P = [[287, 'Aug 4'], [412, 'Sep 15'], [561, 'Oct 27'], [642, 'Nov 15']];
  var L = 26, R = 210, T = 6, B = 96;
  var X = function (i) { return L + 8 + i * (R - L - 16) / 3; }, Y = function (v) { return B - (v - 220) / 720 * (B - T); };
  var pts = P.map(function (p, i) { return [X(i), Y(p[0])]; });
  var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (var i = 0; i < 3; i++) { var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1); }
  var lp = pts[3], area = d + ' L' + lp[0].toFixed(1) + ' ' + B + ' L' + pts[0][0].toFixed(1) + ' ' + B + ' Z';
  var grid = [300, 600, 900].map(function (v) { return '<line x1="' + L + '" x2="' + R + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="c3__g"/><text x="' + (L - 6) + '" y="' + (Y(v) + 2.5).toFixed(1) + '" text-anchor="end" class="c3__y">' + v + '</text>'; }).join('');
  var svg = '<svg class="ph3__chart c3" viewBox="0 0 220 110"><defs><linearGradient id="c3a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d07434" stop-opacity=".16"/><stop offset="1" stop-color="#d07434" stop-opacity="0"/></linearGradient></defs>' +
    '<rect x="' + L + '" y="' + Y(900).toFixed(1) + '" width="' + (R - L) + '" height="' + (Y(450) - Y(900)).toFixed(1) + '" class="c3__band"/>' +
    '<text x="' + (L + 5) + '" y="' + (Y(900) + 9).toFixed(1) + '" class="c3__bt">Optimal</text>' + grid +
    '<line x1="' + L + '" x2="' + R + '" y1="' + B + '" y2="' + B + '" class="c3__base"/>' +
    '<path d="' + area + '" fill="url(#c3a)"/><path d="' + d + '" class="ph3__line"/>' +
    '<line x1="' + lp[0].toFixed(1) + '" x2="' + lp[0].toFixed(1) + '" y1="' + (lp[1] + 6).toFixed(1) + '" y2="' + B + '" class="c3__guide"/>' +
    pts.slice(0, 3).map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.3" class="ph3__pt"/>'; }).join('') +
    '<circle cx="' + lp[0].toFixed(1) + '" cy="' + lp[1].toFixed(1) + '" r="7" class="ph3__halo"/><circle cx="' + lp[0].toFixed(1) + '" cy="' + lp[1].toFixed(1) + '" r="3.4" class="ph3__now"/>' +
    '<g transform="translate(' + (lp[0] - 15).toFixed(1) + ' ' + (lp[1] - 24).toFixed(1) + ')"><rect width="30" height="15" rx="7.5" class="c3__tip"/><path d="M12 15 L15 18 L18 15 Z" class="c3__tip"/><text x="15" y="10.4" text-anchor="middle" class="c3__tipt">642</text></g>' +
    P.map(function (p, i) { return '<text x="' + X(i).toFixed(1) + '" y="' + (B + 12) + '" text-anchor="middle" class="c3__x' + (i === 3 ? ' is-now' : '') + '">' + p[1] + '</text>'; }).join('') + '</svg>';
  var old = document.querySelector('.ph3__chart'); if (old) old.outerHTML = svg;
  var ax = document.querySelector('.ph3__ax'); if (ax) ax.remove();
  if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
});

/* s4 · a polished chart that bleeds to the card edges; everything pulled in and wired to where it actually sits */
document.addEventListener('DOMContentLoaded', function () {
  if (!/^s[45]$/.test(document.documentElement.dataset.vx)) return;
  var P = [[287, 'Aug'], [412, 'Sep'], [561, 'Oct'], [642, 'Nov']];
  var W = 248, H = 104, B = 84, T = 10;
  var X = function (i) { return 22 + i * (W - 44) / 3; }, Y = function (v) { return B - (v - 220) / 700 * (B - T); };
  var pts = P.map(function (p, i) { return [X(i), Y(p[0])]; });
  var ext = [[0, pts[0][1] + 6]].concat(pts, [[W, pts[3][1] - 3]]);   // the line enters and leaves the card, as if the history goes on
  var d = 'M' + ext[0][0] + ' ' + ext[0][1].toFixed(1);
  for (var i = 0; i < ext.length - 1; i++) { var p0 = ext[i - 1] || ext[i], p1 = ext[i], p2 = ext[i + 1], p3 = ext[i + 2] || p2;
    d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1); }
  var lp = pts[3];
  var svg = '<svg class="c4" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><defs><linearGradient id="c4a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d07434" stop-opacity=".2"/><stop offset="1" stop-color="#d07434" stop-opacity="0"/></linearGradient></defs>' +
    '<rect x="0" y="' + Y(900).toFixed(1) + '" width="' + W + '" height="' + (Y(450) - Y(900)).toFixed(1) + '" class="c4__band"/>' +
    '<line x1="0" x2="' + W + '" y1="' + Y(450).toFixed(1) + '" y2="' + Y(450).toFixed(1) + '" class="c4__edge"/>' +
    '<path d="' + d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z" fill="url(#c4a)"/><path d="' + d + '" class="c4__line"/>' +
    '<line x1="' + lp[0].toFixed(1) + '" x2="' + lp[0].toFixed(1) + '" y1="' + lp[1].toFixed(1) + '" y2="' + H + '" class="c4__guide"/>' +
    pts.slice(0, 3).map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.4" class="c4__pt"/>'; }).join('') +
    '<circle cx="' + lp[0].toFixed(1) + '" cy="' + lp[1].toFixed(1) + '" r="8" class="c4__halo"/><circle cx="' + lp[0].toFixed(1) + '" cy="' + lp[1].toFixed(1) + '" r="3.6" class="c4__now"/></svg>';
  var hero = document.querySelector('.ph3__hero');
  hero.querySelector('.ph3__chart').remove(); var ax = hero.querySelector('.ph3__ax'); if (ax) ax.remove();
  var box = document.createElement('div'); box.className = 'c4__wrap';
  box.innerHTML = '<span class="c4__lab">Optimal 450–900</span>' + svg +
    '<span class="c4__tip" style="left:' + (lp[0] / W * 100).toFixed(2) + '%;top:' + (lp[1] / H * 100).toFixed(2) + '%">642</span>' +
    '<div class="c4__ax">' + P.map(function (p, i) { return '<span style="left:' + (X(i) / W * 100).toFixed(2) + '%"' + (i === 3 ? ' class="is-now"' : '') + '>' + p[1] + '</span>'; }).join('') + '</div>';
  hero.appendChild(box);
  // re-draw the wires between the real edges of the cards and the phone
  var wire = function () {
    var st = document.querySelector('.sync__stage'), sv = document.querySelector('.sync__wires'); if (!st || !sv) return;
    var r = st.getBoundingClientRect(), rel = function (el) { var b = el.getBoundingClientRect(); return { l: b.left - r.left, r: b.right - r.left, t: b.top - r.top, b: b.bottom - r.top }; };
    var a = rel(document.querySelector('.sleep3')), o = rel(document.querySelector('.orbit')), ph = rel(document.querySelector('.phone'));
    sv.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height); sv.setAttribute('preserveAspectRatio', 'none');
    var cy = (ph.t + ph.b) / 2, ax0 = a.r, ay = (a.t + a.b) / 2, ox = o.r - 20, oy = (o.t + o.b) / 2 - 16, px = ph.l + 4, mx = (ax0 + px) / 2;
    var p1 = 'M' + ax0 + ' ' + ay + ' C' + mx + ' ' + ay + ' ' + mx + ' ' + (cy - 14) + ' ' + px + ' ' + (cy - 14);
    var p2 = 'M' + ox + ' ' + oy + ' C' + mx + ' ' + oy + ' ' + mx + ' ' + (cy + 14) + ' ' + px + ' ' + (cy + 14);
    var ws = sv.querySelectorAll('.wire'); ws[0].setAttribute('d', p1); ws[1].setAttribute('d', p2);
    var ca = document.querySelector('.sync__chip--a'), cb = document.querySelector('.sync__chip--b');
    ca.style.left = mx + 'px'; ca.style.top = ((ay + cy - 14) / 2) + 'px'; cb.style.left = mx + 'px'; cb.style.top = ((oy + cy + 14) / 2) + 'px';
  };
  setTimeout(wire, 300); setTimeout(wire, 1500); addEventListener('load', wire);
});

document.addEventListener('DOMContentLoaded', function () {   // s5: a shorter phone, the note goes, everything else stays
  if (document.documentElement.dataset.vx !== 's5') return;
  var n = document.querySelector('.ph3__note'); if (n) n.remove();
});
/* preview-only: ?open=<n> opens that Treatments pill after the intro */
(function(){ var n = new URLSearchParams(location.search).get('open'); if (n === null) return;
  addEventListener('load', function(){ setTimeout(function(){ var b = document.querySelectorAll('.vi__open')[+n]; b && b.click(); }, 5500); }); })();
