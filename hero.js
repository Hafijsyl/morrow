/* 01 HERO — a port of OTTO's hero system (ottoobjects.com), re-dressed for Morrow.
   - bare:     the light, laid out like OTTO (dark top, hard blend, pale sun low-left) in Daylight colours
   - marks:    the man's face as dried residue stains (mask: r = way bottom→top, g = height, b = shape),
               drawn like OTTO's "still film": the light bent through a thin film, caustic lines, a lit rim
   - climbing: every 3.5s a wet sheet climbs the marks bottom → top (OTTO: every 3.5, width .04, bend 20, gain .66)
   - hover:    OTTO's fluid field (512 px short side, half float), preset "Breath, misting", revealing the real portrait
   - grain:    heavy animated film grain */

const V = `#version 300 es
in vec2 a; out vec2 vUv; void main(){ vUv = a*.5+.5; gl_Position = vec4(a,0.,1.); }`;

const COMMON = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ return noise(p)*.55 + noise(p*2.6)*.3 + noise(p*6.3)*.15; }
float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
float ss(float a, float b, float x){ return smoothstep(a, b, x); }
float fall(float a, float b, float x){ return 1. - smoothstep(a, b, x); }
uint pcg(uint v){ uint s = v*747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
float rnd(vec2 p){ uvec2 q = uvec2(ivec2(floor(p)) + 32768); return float(pcg(q.x + pcg(q.y))) / 4294967295.; }
`;

/* ---------- OTTO fluid: splat + step ---------- */
const SPLAT = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uField; uniform float uAspect; uniform vec2 uPoint; uniform vec3 uColor; uniform float uRadius;
void main(){
  vec2 p = vUv - uPoint; p.x *= uAspect;
  float g = exp(-dot(p,p) / uRadius);
  vec4 f = texture(uField, vUv);
  float w = clamp(g * uColor.x, 0., 1.);
  o = vec4(f.r + g*uColor.x, mix(f.g, uColor.y, w), mix(f.b, uColor.z, w), f.a);
}`;
const STEP = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uField; uniform vec2 uTexel; uniform float uDt, uFriction, uSpread, uDecay, uWobble, uGrain, uTime, uDry, uDryGrain; uniform vec2 uMark;
${COMMON}
void main(){
  vec2 vel = texture(uField, vUv).gb;
  vec2 coord = vUv - vel*uDt;
  vec4 s = texture(uField, coord);
  float t = uTime*.3;
  vec2 warp = (vec2(fbm(vUv*11.+t), fbm(vUv*11.+37.2-t)) - .5) * 2. * uWobble * uTexel;
  vec4 nL = texture(uField, coord + vec2(-uTexel.x,0.) + warp);
  vec4 nR = texture(uField, coord + vec2( uTexel.x,0.) + warp);
  vec4 nT = texture(uField, coord + vec2(0., uTexel.y) + warp);
  vec4 nB = texture(uField, coord + vec2(0.,-uTexel.y) + warp);
  float d = mix(s.r, (nL.r+nR.r+nT.r+nB.r)*.25, uSpread);
  vec2 v = mix(s.gb, (nL.gb+nR.gb+nT.gb+nB.gb)*.25, uSpread*.5);
  float g = fbm(vUv*15. + 5.1 + t*.6);
  d *= 1. / (1. + (uDecay + uGrain*uDecay*(g-.5)*2.) * uDt);
  v *= 1. / (1. + uFriction*uDt);
  float pt = fbm(vUv*5. + 11.3);
  float mark = max(s.a - uDt/uDry*(1. + uDryGrain*(pt-.5)*2.), 0.);
  mark = max(mark, smoothstep(uMark.x, uMark.y, d));
  o = vec4(max(d,0.), v, mark);
}`;

/* ---------- shared scene (bare light, portrait, placement) ---------- */
const SCENE = `
uniform vec2 uPlane;      // css px
uniform float uS;         // css px per design px (design width 1440)
uniform vec4 uFace;       // face box in design px: x, y (top), w, h
uniform sampler2D uPhoto;
uniform sampler2D uCut;   // the man cut out of the photo (Vision), so the carving follows him, not the photo's box
const vec3 cTop = vec3(.128,.080,.054);   // warm burnt-orange dark (Daylight's shadow, not black)
const vec3 cTop2 = vec3(.072,.050,.038);
const vec3 cOr  = vec3(.700,.468,.200);   // Daylight orange
const vec3 cSun = vec3(.965,.915,.770);   // morning sun, near white
vec2 D(){ return uPlane / uS; }
vec3 bare(vec2 q){
  vec2 uv = q / D();                        // y down
  float y = 1. - uv.y;                      // 0 bottom, 1 top
  float wob = (noise(q/420.) - .5)*.05;
  // OTTO: the dark gives way to the light over a short distance, but softly (smootherstep, no hard edge)
  float k = clamp((y + wob - .12) / .46, 0., 1.); k = k*k*k*(k*(k*6.-15.)+10.);
  vec3 col = mix(cOr, cTop, k);
  col = mix(col, cTop2, ss(.55, 1., y) * .8);   // a little deeper toward the very top
  // pale sun low-left
  vec2 g = (uv - vec2(.30, 1.08)) * vec2(D().x/D().y*.6, 1.);
  float sun = exp(-dot(g,g)*4.6);
  col = mix(col, cSun, ss(.08, .8, sun));
  col *= mix(1., .86, ss(.6, 1., uv.x) * ss(.2, .6, y));
  return col;
}
vec2 faceUv(vec2 q){ return (q - uFace.xy) / uFace.zw; }
vec2 photoUv(vec2 f){ return vec2(mix(.36, .98, f.x), f.y); }
float cutAt(vec2 f, float lod){ return textureLod(uCut, photoUv(f), lod).r; }
float inBox(vec2 f){ return step(0.,f.x)*step(f.x,1.)*step(0.,f.y)*step(f.y,1.); }
float faceFade(vec2 f){ return fall(.6, .94, f.y) * ss(0., .08, f.x) * fall(.9, 1., f.x); }
// the hidden picture: the real portrait, warm graded, in the bare light
vec3 portrait(vec2 q){
  vec3 b = bare(q);
  vec2 f = faceUv(q);
  if (inBox(f) < .5) return b;
  vec3 ph = texture(uPhoto, photoUv(f)).rgb;
  float l = lum(ph);
  vec3 graded = mix(vec3(l), ph, .85) * vec3(1.14,.97,.82) * 1.15;
  return mix(b, graded, ss(.02, .16, l) * faceFade(f));
}
`;

/* ---------- mask (once per resize): r = way, g = height, b = shape ----------
   OTTO's marks are sparse, short raised dashes that trace the flowers' forms. Here: contour lines of the
   softened portrait (like an engraver's lines), broken into short dashes, thinned where they crowd. */
const MASK = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
${COMMON}
${SCENE}
// the portrait read like an engraver: gradient (direction + strength) and tone at a point
vec3 edgeAt(vec2 q, float lod){
  vec2 f = faceUv(q);
  if (inBox(f) < .5) return vec3(0.);
  vec2 pu = photoUv(f);
  vec2 d = vec2(.62 / uFace.z, 1. / uFace.w) * 3.;
  float gx = lum(textureLod(uPhoto, pu + vec2(d.x,0.), lod).rgb) - lum(textureLod(uPhoto, pu - vec2(d.x,0.), lod).rgb);
  float gy = lum(textureLod(uPhoto, pu + vec2(0.,d.y), lod).rgb) - lum(textureLod(uPhoto, pu - vec2(0.,d.y), lod).rgb);
  return vec3(gx, gy, length(vec2(gx, gy)));
}
float toneAt(vec2 q){ vec2 f = faceUv(q); if (inBox(f) < .5) return 0.; return lum(textureLod(uPhoto, photoUv(f), 2.2).rgb); }
float bodyAt(vec2 q){ vec2 f = faceUv(q); if (inBox(f) < .5) return 0.; return ss(.2, .8, cutAt(f, 2.)) * faceFade(f); }
float seg(vec2 p, vec2 a, vec2 b, float r){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa,ba)/dot(ba,ba), 0., 1.); return length(pa - ba*h) - r; }
// OTTO's flowers are drawn by their marks: dashes that run along every contour of the form, so the shape reads first.
// Contour dashes follow the edge; fine hatching fills the shadowed planes for the inner shade.
// long fine scratches across the head (face-box units), broken into lengths like OTTO's hairlines
float scratches(vec2 q){
  float m = 0.;
  vec4 S[4] = vec4[4](vec4(.46, .27, .70, .17), vec4(.36, .60, .55, .47), vec4(.64, .66, .86, .52), vec4(.52, .09, .74, .04));
  for (int k = 0; k < 4; k++) {
    vec2 A = uFace.xy + S[k].xy * uFace.zw, B = uFace.xy + S[k].zw * uFace.zw;
    vec2 pa = q - A, ba = B - A; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
    float d = length(pa - ba * h) - .32;
    float along = h * length(ba);
    float gap = step(.78, fract(along / 17. + float(k) * .37));            // breaks along the line
    m = max(m, (1. - ss(-.1, .55, d)) * (1. - gap) * .3 * ss(0., .08, h) * fall(.92, 1., h));
  }
  return m;
}
// OTTO's flowers are drawn by where the marks gather, never by a line or a fill: short level dashes and dot pairs,
// sparse, broken into runs along the big forms, clearer where the light is and dissolving toward the top and edges
float shapeAt(vec2 q){
  const vec2 C = vec2(8., 7.);
  vec2 cell = floor(q / C);
  float m = 0.;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 c = cell + vec2(float(i), float(j));
    vec2 ctr = (c + .5 + (vec2(rnd(c*3.+1.), rnd(c*5.+2.)) - .5) * .85) * C;
    float body = bodyAt(ctr);
    vec2 fo = faceUv(ctr); vec2 dd = vec2(.62 / uFace.z, 1. / uFace.w) * 2.5;
    vec2 go = vec2(textureLod(uCut, photoUv(fo) + vec2(dd.x,0.), 1.5).r - textureLod(uCut, photoUv(fo) - vec2(dd.x,0.), 1.5).r,
                   textureLod(uCut, photoUv(fo) + vec2(0.,dd.y), 1.5).r - textureLod(uCut, photoUv(fo) - vec2(0.,dd.y), 1.5).r);
    vec3 eo = vec3(go, length(go) * .5);                            // the silhouette, from the cutout
    if (body < .02 && eo.z < .05) continue;
    vec3 e = edgeAt(ctr, 2.6) * ss(.3, .9, body);                  // inner forms: only the strongest (eye, nose, lips, ear)
    float contour = max(ss(.045, .16, e.z) * .75, ss(.035, .18, eo.z) * faceFade(fo) * 1.15);
    contour = max(contour, body * .08);                         // a few loose drops inside the forms, as in the flowers
    float run = ss(.36, .62, noise(ctr / 24. + 7.1));               // runs and gaps along each form
    float lit = mix(.45, 1., ss(.04, .7, fo.y)) * (1. - .35 * ss(.24, .5, abs(fo.x - .6)));
    float pr = contour * (.3 + .7 * run) * .95 * (.55 + .45 * lit);
    if (rnd(c*7.+3.) > pr) continue;
    vec2 g = eo.z > e.z * 1.6 ? eo.xy : e.xy;
    vec2 t = normalize(vec2(-g.y, g.x) + 1e-5); if (t.x < 0.) t = -t;
    vec2 dir = normalize(mix(t, vec2(1., -.08), .5));               // they follow a form but lean level, like dried drops
    float len = mix(1.4, 5.2, rnd(c*13.+5.));
    float r = mix(.45, .72, rnd(c*19.+7.));
    float tint = (.55 + .45 * rnd(c*37.+11.)) * lit;
    vec2 nrm = vec2(-dir.y, dir.x);
    float kind = rnd(c*11.+4.), dist;
    if (kind < .26) {                                               // broken dash "- -"
      float gp = mix(1.2, 2.6, rnd(c*23.+8.));
      dist = min(seg(q, ctr - dir*len, ctr - dir*gp*.5, r), seg(q, ctr + dir*gp*.5, ctr + dir*len*.7, r));
    } else if (kind < .46) {                                        // dot pair ". ."
      dist = min(length(q - ctr) - r*1.2, length(q - ctr - dir*mix(2.6, 5., rnd(c*29.+9.))) - r);
    } else {                                                        // plain dash with a slight bow
      float sb = clamp(dot(q - ctr, dir) / len, -1., 1.);
      dist = seg(q - nrm * (1. - sb*sb) * (rnd(c*31.+10.) - .5) * 1.4, ctr - dir*len, ctr + dir*len, r);
    }
    m = max(m, (1. - ss(-.15, .7, dist)) * tint);
  }
  return max(m, scratches(q));
}
void main(){
  vec2 q = vec2(vUv.x, 1.-vUv.y) * D();
  float sh = shapeAt(q);
  float h = sh;   // the main pass reads the slope from neighbouring mask texels
  vec2 f = faceUv(q);
  float way = clamp(1. - f.y, 0., 1.) + (noise(q/40.)-.5)*.04;
  o = vec4(way, h, sh, 1.);
}`;

/* ---------- final image ---------- */
const MAIN = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uMask, uField;
uniform vec2 uMaskTexel, uFieldTexel;
uniform float uNow, uFade, uFieldEdge, uFluid, uIntro, uMotion, uDpr;
${COMMON}
${SCENE}
float rnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(rnd(i),rnd(i+vec2(1,0)),f.x), mix(rnd(i+vec2(0,1)),rnd(i+vec2(1,1)),f.x), f.y); }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
// OTTO still film + climbing wave
const float STILL = .35, STILL_BEND = 7.9;
const vec4 FILM_C = vec4(20., 3.7, 7.5, .05); const float FILM_RIM = .45;
const float EVERY = 3.5, WIDTH = .04, WBEND = 20., GAIN = .66;
// the engraved face itself: a faint pressed silhouette with light and shadow (OTTO's flowers are a shape first, marks second)
float hgt(vec2 p){ vec2 f = faceUv(p); if (inBox(f) < .5) return 0.; return lum(textureLod(uPhoto, photoUv(f), 2.4).rgb) * faceFade(f); }
float silAt(vec2 p){ vec2 f = faceUv(p); if (inBox(f) < .5) return 0.; return cutAt(f, 3.2) * faceFade(f); }
// no drawn fill: only the faint shade the head casts in the light, so the shape reads the way OTTO's flowers do
vec3 relief(vec2 p, vec3 b){
  vec2 f = faceUv(p);
  if (inBox(f) < .5) return b;
  float sil = silAt(p);
  vec2 L = vec2(-.3, -.95) * 4.;
  float rim = max(silAt(p) - silAt(p - L), 0.);                // the upper edge, turned to the light
  vec3 c = b * (1. - .12 * sil);
  c += (vec3(1., .93, .82) - c) * rim * .1;
  return mix(b, c, uIntro);
}

// ---------- the morning mirror: his face behind a misted bathroom mirror, only within the shape of his head ----------
vec3 graded(vec2 f, float lod){ vec3 ph = textureLod(uPhoto, photoUv(f), lod).rgb; float l = lum(ph); return mix(vec3(l), ph, .85) * vec3(1.14, .97, .82) * 1.15; }
float headAt(vec2 f){ return ss(.04, .92, cutAt(f, 5.4)) * fall(.6, .98, f.y) * ss(0., .08, f.x) * fall(.9, 1., f.x); }   // a soft edge, like the mist thinning at the rim
// condensation: drops of many sizes on a loose grid; each one is a tiny clear lens with a light catch at its top
vec2 dropsAt(vec2 q){
  const float C = 13.;
  vec2 cell = floor(q / C);
  float cov = 0., hl = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = cell + vec2(float(i), float(j));
    if (rnd(c * 3.1 + 7.) > .62) continue;
    vec2 ctr = (c + .5 + (vec2(rnd(c * 5.3 + 1.), rnd(c * 7.7 + 2.)) - .5) * .9) * C;
    float k = rnd(c * 11.9 + 3.);
    float r = k < .35 ? 1.2 : k < .65 ? 1.8 : k < .85 ? 2.6 : k < .95 ? 3.6 : 5.4;
    float d = length(q - ctr);
    cov = max(cov, 1. - ss(r - .7, r + .3, d));
    vec2 hq = (q - ctr - vec2(-.3, -.45) * r) / vec2(r * .25, r * .2);
    hl = max(hl, (1. - ss(.6, 1.2, length(hq))) * step(1.6, r));
  }
  return vec2(cov, hl);
}
// three slow drips that have run through the mist
float dripsAt(vec2 f, vec2 q){
  float m = 0.;
  vec3 D[3] = vec3[3](vec3(.47, .14, .5), vec3(.56, .2, .44), vec3(.69, .1, .52));   // x, start, length (face units)
  for (int k = 0; k < 3; k++) {
    float y = (f.y - D[k].y) / D[k].z;
    if (y < 0. || y > 1.) continue;
    float x = D[k].x + sin(f.y * 38. + float(k) * 2.) * .0035;
    float w = (1.6 + .8 * smoothstep(.85, 1., y)) / uFace.z;                  // a little fuller where it has gathered
    m = max(m, (1. - ss(w * .5, w * 1.2, abs(f.x - x))) * ss(0., .06, y));
  }
  return m;
}
vec3 mirror(vec2 p, vec3 b){
  vec2 f = faceUv(p);
  if (inBox(f) < .5) return b;
  float head = headAt(f);
  if (head < .002) return b;
  vec3 sharp = graded(f, .8);
  vec3 fog = mix(graded(f, 4.6), vec3(.62, .6, .57), .22);                      // the misted glass
  float haze = .12 + .08 * (1. - f.y);
  fog = mix(fog, vec3(.55, .52, .49), haze);
  vec2 dr = dropsAt(p);
  float drip = dripsAt(f, p);
  float clearAmt = max(dr.x, drip) * .8;                                         // drops and drips clear the mist where they sit
  vec3 col = mix(fog, sharp, clearAmt) + dr.y * .35;
  return mix(b, col, head * .9 * uIntro);
}
vec4 maskAt(vec2 q){ return texture(uMask, vec2(q.x/D().x, 1. - q.y/D().y)); }
vec3 behind(vec2 q){ return bare(q); }
vec3 film(vec2 p, vec3 b, float shape, vec2 slope, float rim){
  float t = uNow * uMotion;
  vec2 q = p / FILM_C.x; float ts = t * FILM_C.y;
  vec2 drift = vec2(noise(q*.3 + ts*.05), noise(q*.3 + 9.1 - ts*.04)) * 3.;
  float n1 = noise(q + drift + vec2(ts*.09, 0.));
  float n2 = noise(q*1.3 + drift + vec2(7.3,2.1) - vec2(0., ts*.08));
  float lines = pow(clamp(1. - abs(n1-n2)*FILM_C.z, 0., 1.), 4.) * (.6 + .4*noise(q*.5 - ts*.03));
  vec3 bent = behind(p + slope*STILL_BEND);
  vec3 lit = bent + (.02 + lines*FILM_C.w + rim*FILM_RIM) * (1. - bent);
  vec3 still = mix(bent, lit, STILL);
  still += .22 * (1. - still);                 // the pale dried residue itself
  return mix(b, still, min(1., shape * uIntro * 1.4));
}
vec3 wave(vec2 p, vec3 b){
  vec4 m = maskAt(p);
  float shape = m.b;
  if (shape < .002) { float ab = maskAt(p - vec2(.3, 1.1)).b; return b * (1. - .22 * ab * uIntro); }   // each drop's small shadow, just beneath it
  vec2 st = uMaskTexel * 1.2 * D();
  vec2 du = vec2(st.x, 0.), dv = vec2(0., st.y);
  vec2 slope = vec2(maskAt(p+du).g - maskAt(p-du).g, maskAt(p+dv).g - maskAt(p-dv).g);
  vec3 normal = normalize(vec3(-slope*3., 1.));
  vec3 light = normalize(vec3(-.15, -.75, .65));
  float rim = pow(clamp(dot(normal, light), 0., 1.), 14.);
  // raised, like OTTO's dried drops: a soft grey film on the surface, its top edge catching the light, a shadow beneath
  vec3 gn = normalize(vec3(-slope * 6., 1.));
  vec3 Lc = normalize(vec3(-.3, -.85, .45));             // light from above (y is down)
  float wall = dot(gn, Lc) - Lc.z;
  vec3 dried = b + (vec3(.84, .82, .78) - b) * .2;
  dried += (vec3(1., .95, .88) - dried) * min(max(wall, 0.) * 1.7, .3);
  dried *= 1. - min(max(-wall, 0.) * 1.3, .32);
  vec3 base = mix(b, dried, min(1., shape * 1.5) * uIntro);
  float under = maskAt(p - vec2(.3, 1.1)).b;
  base *= 1. - .22 * under * (1. - shape) * uIntro;
  float phase = fract(uNow / EVERY);
  float run = .85;
  if (phase > run || uMotion < .5) return base;
  float way = m.r, tail = WIDTH;
  float u = phase / run;
  float head = mix(-.04, 1. + tail, mix(u, u*u*(3.-2.*u), .7));
  float life = ss(0., .12, u) * fall(.82, 1., u);
  float creep = (noise(p/9. + vec2(0., -uNow*.6)) - .5) * .03;
  float behindIt = head - (way + creep);
  if (behindIt < -.06 || behindIt > tail) return base;
  float sheet = ss(0., .016, behindIt) * fall(tail*.25, tail, behindIt);
  float lip = exp(-pow(behindIt/.016, 2.));
  vec2 cell = floor(p/9.); float h = hash(cell);
  vec2 bead = (cell + .5 + (vec2(hash(cell+7.1), hash(cell+3.3)) - .5)*.6) * 9.;
  float ahead = -behindIt;
  float beads = ss(.78,.9,h) * fall(1.,2.4,length(p-bead)) * ss(0.,.02,ahead) * fall(.025,.07,ahead) * ss(.55,.85,m.g);
  float wet = max(sheet, lip);
  if (wet < .002 && beads < .002) return base;
  vec3 through = behind(p + slope*WBEND*wet);
  // our marks sit on the dark, so the wet light is lifted toward the warm sun to read like OTTO's on its pale ground
  float sheen = sheet*(.14 + rim*.6) + lip*(.75 + rim*.9) + beads*1.2;
  vec3 water = through + sheen*GAIN*(vec3(1.,.93,.80) - through);
  return mix(base, water, min(1., shape*1.3) * max(wet, beads) * life * uIntro);
}
// OTTO "Breath, misting": the hidden picture opens where the water is; mist lingers where it was
vec3 breath(vec2 p, vec3 still, float w, vec2 gw, float t){
  float open = ss(.85 - .68*uFade, 1.15 + .5*uFade, w);
  float tt = uNow*.04*uMotion;
  float mist = t*(.7 + .6*noise(p/30.)) + (noise(p/11.) - .5)*.08*min(t*4., 1.);
  float fog = pow(ss(.02, .95, mist), 1.6) * (1. - open);
  fog *= .5 + .35*noise(p/70. + vec2(tt, -tt*.7)) + .15*noise(p/22. - tt);
  vec3 col = still;
  if (fog > .002) {
    vec3 b = vec3(0.);
    for (int i=0;i<8;i++){ float a = float(i)*2.39996 + .7; b += portrait(p + vec2(cos(a),sin(a))*9.*sqrt((float(i)+.5)/8.)); }
    b /= 8.;
    vec3 misted = b*.9 + vec3(.055,.058,.062)*(.9 + .2*hash(floor(p*1.5)));
    col = mix(col, misted, fog*.62);
  }
  if (open > .001) {
    vec2 inward = gw / max(length(gw), 1e-4);
    float rim = exp(-pow((w - 1.)/.25, 2.));
    col = mix(col, portrait(p + inward*rim*2.5), open);
  }
  return col;
}
void main(){
  vec2 p = vec2(vUv.x, 1. - vUv.y) * D();
  vec3 col = mirror(p, bare(p));                     // the morning mirror (the old engraved marks are retired)
  if (uFluid > .5) {
    vec4 f = texture(uField, vUv);
    if (f.r > .001 || f.a > .001) {
      vec2 tx = vec2(uFieldTexel.x*1.5, 0.), ty = vec2(0., uFieldTexel.y*1.5);
      vec2 span = 3. * uFieldTexel * D();
      float gx = (texture(uField, vUv+tx).r - texture(uField, vUv-tx).r) / span.x;
      float gy = (texture(uField, vUv-ty).r - texture(uField, vUv+ty).r) / span.y;
      col = breath(p, col, f.r / uFieldEdge, vec2(gx, gy) / uFieldEdge, f.a);
    }
  }
  vec2 v = vUv - .5; col *= 1. - dot(v*vec2(.85,1.1), v*vec2(.85,1.1))*.5;
  // paper grain, static: fine random tooth + soft fibres + faint mottling (no lattice, no lines)
  vec2 fc = gl_FragCoord.xy;
  vec2 cp = fc / uDpr;                                   // css px
  float tooth = (rnd(fc) + rnd(fc + 911.) - 1.);          // triangular noise, per device pixel
  float fib = 0.;
  fib += rnoise(rot(.42) * cp * vec2(.45, .12)) - .5;     // short soft fibres at three angles, no single direction
  fib += rnoise(rot(-1.15) * cp * vec2(.45, .12) + 50.) - .5;
  fib += rnoise(rot(2.3) * cp * vec2(.4, .14) + 90.) - .5;
  fib /= 1.7;
  float mott = rnoise(cp / 9.) * .6 + rnoise(cp / 3.1 + 20.) * .4 - .5;
  float L = lum(col);
  col += tooth * .085 * (.45 + .55*L);
  col *= 1. + fib * .032 + mott * .05;
  o = vec4(max(col, 0.), 1.);
}`;

export function initHero({ finePointer }) {
  const heroEl = document.querySelector('[data-hero]');
  const canvas = document.querySelector('[data-hero-gl]');
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  const state = { intro: 0 };
  if (!gl) { canvas.remove(); return state; }
  const floatOK = !!gl.getExtension('EXT_color_buffer_float');

  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o; };
  const prog = (fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, V)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p)); return p; };
  const P = { splat: prog(SPLAT), step: prog(STEP), mask: prog(MASK), main: prog(MAIN) };
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; const u = (p, n) => { const k = p + n; return U[k] ??= gl.getUniformLocation(P[p], n); };

  const target = (w, h, half) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    if (half) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { t, f, w, h };
  };
  const drop = (x) => { if (x) { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); } };

  const photo = gl.createTexture(); let photoReady = false;
  gl.bindTexture(gl.TEXTURE_2D, photo);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, photo);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    photoReady = true; buildMask();
  };
  img.src = 'img/hero.jpg';
  // the cutout: loaded alongside, the mask is rebuilt once both are in
  const cut = gl.createTexture(); let cutReady = false;
  gl.bindTexture(gl.TEXTURE_2D, cut);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  const cimg = new Image();
  cimg.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, cut);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cimg);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    cutReady = true; buildMask();
  };
  cimg.src = 'img/hero-mask.png';

  // OTTO preset "Breath, misting" with its tuned hover values
  const W = { radius: 0.0012, amount: 3, push: 0.8, maxSpeed: 4, friction: 3.2, spread: 0.74, decay: 0.9, wobble: 5, grain: 0.6, threshold: 0.395, dry: 1, dryGrain: 0, markFrom: 0.3, markTo: 0.65, short: 512 };

  let cssW = 1, cssH = 1, S = 1, face = [0, 0, 1, 1], mask = null, A = null, B = null, aspect = 1;
  const sceneUniforms = (p) => {
    gl.uniform2f(u(p, 'uPlane'), cssW, cssH); gl.uniform1f(u(p, 'uS'), S); gl.uniform4f(u(p, 'uFace'), ...face);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, photo); gl.uniform1i(u(p, 'uPhoto'), 0);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, cut); gl.uniform1i(u(p, 'uCut'), 3);
  };
  let chinPx = null;   // css px from the hero top where "Feel like" starts; the face is sized so his chin meets it
  state.setChin = (px) => { chinPx = px; layoutFace(); buildMask(); };
  function layoutFace() {
    const Dw = 1440, Dh = cssH / S, mobile = cssW < 700;
    if (chinPx && !mobile) {
      const V = window.__hv || {};   // preview-only overrides (variants/vx.js)
      const top = Dh * (V.top ?? -0.06), h = Math.max(Dh * 0.4, (chinPx / S - Dh * 0.03) / 0.6) * (V.scale || 1.55);   // a larger head, crown near the top, to balance the big title   // chin/teeth sit ~60% down the photo
      const w = h * (0.62 * 1376 / 768);
      face = [Dw * (V.cx || 0.5) - w * 0.5, top, w, h]; return;
    }
    // smaller than the full height and weighted to the top, so the title sits at the chin
    const h = Dh * (mobile ? 0.6 : 0.8);
    const w = h * (0.62 * 1376 / 768);
    face = [Dw / 2 - w * (mobile ? 0.46 : 0.5), Dh * (mobile ? 0.08 : 0.04), w, h];
  }
  function buildMask() {
    if (!photoReady || !cutReady || !mask) return;
    gl.useProgram(P.mask); gl.bindFramebuffer(gl.FRAMEBUFFER, mask.f); gl.viewport(0, 0, mask.w, mask.h);
    sceneUniforms('mask');
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  const resize = () => {
    cssW = canvas.clientWidth || innerWidth; cssH = canvas.clientHeight || innerHeight; S = cssW / 1440; aspect = cssW / cssH;
    const dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(3.6e6 / (cssW * cssH)));
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    layoutFace();
    drop(mask); mask = target(Math.round(cssW), Math.round(cssH), false);
    if (floatOK) {
      const fw = aspect >= 1 ? Math.min(Math.round(W.short * aspect), 1440) : W.short;
      const fh = aspect >= 1 ? W.short : Math.min(Math.round(W.short / aspect), 1440);
      drop(A); drop(B); A = target(fw, fh, true); B = target(fw, fh, true);
    }
    buildMask();
  };
  resize();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });

  const swap = () => { const t = A; A = B; B = t; };
  const splat = (x, y, vx, vy) => {
    gl.useProgram(P.splat); gl.bindFramebuffer(gl.FRAMEBUFFER, B.f); gl.viewport(0, 0, B.w, B.h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(u('splat', 'uField'), 0);
    gl.uniform1f(u('splat', 'uAspect'), aspect); gl.uniform2f(u('splat', 'uPoint'), x, y);
    gl.uniform3f(u('splat', 'uColor'), W.amount, vx, vy); gl.uniform1f(u('splat', 'uRadius'), W.radius);
    gl.drawArrays(gl.TRIANGLES, 0, 3); swap();
  };
  // OTTO stroke: hand velocity clamped and pushed, splats spaced by 0.4·sqrt(radius)
  const stroke = (x0, y0, x1, y1, vx, vy) => {
    const l = W.maxSpeed;
    const px = Math.max(-l, Math.min(l, vx)) * W.push, py = Math.max(-l, Math.min(l, vy)) * W.push;
    const dist = Math.hypot((x1 - x0) * aspect, y1 - y0);
    const n = Math.min(64, Math.max(1, Math.ceil(dist / (0.4 * Math.sqrt(W.radius)))));
    for (let i = 0; i < n; i++) { const s = n === 1 ? 1 : (i + 1) / n; splat(x0 + (x1 - x0) * s, y0 + (y1 - y0) * s, px, py); }
  };
  const step = (dt, t) => {
    gl.useProgram(P.step); gl.bindFramebuffer(gl.FRAMEBUFFER, B.f); gl.viewport(0, 0, B.w, B.h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(u('step', 'uField'), 0);
    gl.uniform2f(u('step', 'uTexel'), 1 / A.w, 1 / A.h); gl.uniform1f(u('step', 'uDt'), dt);
    gl.uniform1f(u('step', 'uFriction'), W.friction); gl.uniform1f(u('step', 'uSpread'), W.spread); gl.uniform1f(u('step', 'uDecay'), W.decay);
    gl.uniform1f(u('step', 'uWobble'), W.wobble); gl.uniform1f(u('step', 'uGrain'), W.grain); gl.uniform1f(u('step', 'uTime'), t);
    gl.uniform1f(u('step', 'uDry'), W.dry); gl.uniform1f(u('step', 'uDryGrain'), W.dryGrain); gl.uniform2f(u('step', 'uMark'), W.markFrom, W.markTo);
    gl.drawArrays(gl.TRIANGLES, 0, 3); swap();
  };

  // pointer: raw position each frame; velocity = delta / dt (OTTO)
  let H = null, J = null, inside = false, lastStroke = -1e4, fade = 1;
  const onMove = (cx, cy) => {
    const r = heroEl.getBoundingClientRect();
    inside = cy >= r.top && cy <= r.bottom && cx >= r.left && cx <= r.right;
    H = inside ? { u: (cx - r.left) / r.width, v: 1 - (cy - r.top) / r.height } : null;
  };
  addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
  heroEl.addEventListener('pointerleave', () => { inside = false; H = null; });
  addEventListener('touchmove', (e) => { const t = e.touches[0]; t && onMove(t.clientX, t.clientY); }, { passive: true });
  addEventListener('touchend', () => setTimeout(() => { inside = false; H = null; }, 700), { passive: true });
  state.move = onMove; // for testing

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(heroEl);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now(); let last = t0, autoT = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible) { last = now; return; }
    const t = (now - t0) / 1000, dt = Math.min((now - last) / 1000, 1 / 30); last = now;

    if (floatOK && A) {
      if (!finePointer && !inside && !reduce) {
        // phones between touches: a slow wandering hand so the water still shows
        autoT += dt;
        const a = { u: 0.5 + Math.sin(autoT * 0.45) * 0.17, v: 0.62 + Math.sin(autoT * 0.31 + 1.2) * 0.2 };
        if (J) stroke(J.u, J.v, a.u, a.v, (a.u - J.u) / Math.max(dt, 0.004), (a.v - J.v) / Math.max(dt, 0.004));
        J = a; lastStroke = t;
      } else if (inside && H) {
        if (J && (H.u !== J.u || H.v !== J.v)) { const e = Math.max(dt, 0.004); stroke(J.u, J.v, H.u, H.v, (H.u - J.u) / e, (H.v - J.v) / e); lastStroke = t; }
        J = { u: H.u, v: H.v };
      } else J = null;
      if (dt > 0) step(dt, t);
      // uFade: 0 while the hand moves, rising to 1 from .15s after the last stroke over 1.5s
      const s = Math.min(1, Math.max(0, (t - lastStroke - 0.15) / 1.5));
      fade += (s - fade) * (1 - Math.exp(-dt / (s > fade ? 0.25 : 0.1)));
    }

    gl.useProgram(P.main); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    sceneUniforms('main');
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mask.t); gl.uniform1i(u('main', 'uMask'), 1);
    gl.uniform2f(u('main', 'uMaskTexel'), 1 / mask.w, 1 / mask.h);
    if (floatOK && A) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(u('main', 'uField'), 2); gl.uniform2f(u('main', 'uFieldTexel'), 1 / A.w, 1 / A.h); }
    else gl.uniform1i(u('main', 'uField'), 1);
    gl.uniform1f(u('main', 'uFluid'), floatOK && A ? 1 : 0);
    gl.uniform1f(u('main', 'uNow'), t); gl.uniform1f(u('main', 'uFade'), fade);
    gl.uniform1f(u('main', 'uFieldEdge'), W.threshold); gl.uniform1f(u('main', 'uDpr'), canvas.width / cssW);
    gl.uniform1f(u('main', 'uIntro'), document.documentElement.dataset.noface ? 0 : state.intro);   // ?face=0: the bare light (for concept previews) gl.uniform1f(u('main', 'uMotion'), reduce ? 0 : 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  requestAnimationFrame(frame);
  return state;
}
