// ฉากอธิบายของใช้ในบ้านแบบตัดครึ่ง (ภาพเวกเตอร์ละเอียด) — คืนสตริง SVG ภายใน <g> หน่วยพิกัด 270x480
export type Focus = { cx: number; cy: number; z: number; box?: [number, number, number, number]; label?: string };
export type SceneIn = { frame: number; cue: string; p: number; ef: number };
export type SceneDef = { focus: Record<string, Focus>; render: (i: SceneIn) => string };

const f2 = (n: number) => Math.round(n * 100) / 100;
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
type Pt = [number, number];

const hexv = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mixc = (a: string, b: string, t: number) => {
  const A = hexv(a), B = hexv(b), u = cl(t);
  const h = (i: number) => Math.round(A[i] + (B[i] - A[i]) * u).toString(16).padStart(2, "0");
  return "#" + h(0) + h(1) + h(2);
};

const plen = (pts: Pt[]) => pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const along = (pts: Pt[], d: number): Pt => {
  let rest = d;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (rest <= l) return [pts[i - 1][0] + ((pts[i][0] - pts[i - 1][0]) * rest) / l, pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * rest) / l];
    rest -= l;
  }
  return pts[pts.length - 1];
};
const rpath = (pts: Pt[], r: number): string => {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1], c = pts[i], n = pts[i + 1];
    const l1 = Math.hypot(c[0] - p[0], c[1] - p[1]), l2 = Math.hypot(n[0] - c[0], n[1] - c[1]);
    const rr = Math.min(r, l1 / 2 - 0.01, l2 / 2 - 0.01);
    if (rr <= 0.2) { d += ` L${c[0]} ${c[1]}`; continue; }
    d += ` L${f2(c[0] + ((p[0] - c[0]) / l1) * rr)} ${f2(c[1] + ((p[1] - c[1]) / l1) * rr)} Q${c[0]} ${c[1]} ${f2(c[0] + ((n[0] - c[0]) / l2) * rr)} ${f2(c[1] + ((n[1] - c[1]) / l2) * rr)}`;
  }
  const l = pts[pts.length - 1];
  return d + ` L${l[0]} ${l[1]}`;
};
const tube = (pts: Pt[], w: number, base: string, hi: string, r = 3) => {
  const d = rpath(pts, r);
  return `<path d="${d}" fill="none" stroke="#252d46" stroke-width="${w + 2.2}" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/><path d="${d}" fill="none" stroke="${base}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${hi}" stroke-width="${f2(w * 0.28)}" stroke-linecap="round" stroke-linejoin="round" opacity=".7" transform="translate(-.5 -.7)"/>`;
};
const dot = (p: Pt, r: number, c: string) =>
  `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(r * 2.6)}" fill="${c}" opacity=".26"/><circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${r}" fill="${c}"/><circle cx="${f2(p[0] - r * 0.3)}" cy="${f2(p[1] - r * 0.3)}" r="${f2(r * 0.38)}" fill="#fff" opacity=".9"/>`;
const wave = (x0: number, x1: number, y: number, amp: number, ph: number, bottom: number, fill: string, op = 0.85) => {
  let d = `M${x0} ${bottom} L${x0} ${f2(y)}`;
  for (let x = x0; x <= x1; x += 3) d += ` L${x} ${f2(y + amp * Math.sin(x * 0.35 + ph))}`;
  d += ` L${x1} ${bottom} Z`;
  return `<path d="${d}" fill="${fill}" opacity="${op}"/>`;
};
const warrow = (x: number, y: number, c: string, a: number, dir = 1) =>
  `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${dir} 1)"><path d="M0 0q3-3 6 0t6 0t6 0" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><path d="M19-3.4l5 3.4l-5 3.4z" fill="${c}"/></g>`;
const varrow = (x: number, y: number, c: string, a: number, dir = 1) =>
  `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) rotate(${dir > 0 ? 90 : -90})"><path d="M0 0q3-3 6 0t6 0t6 0" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><path d="M19-3.4l5 3.4l-5 3.4z" fill="${c}"/></g>`;
const box = (b: [number, number, number, number] | undefined, ph: number) => {
  if (!b) return "";
  const [x, y, w, h] = b;
  const pulse = 0.55 + 0.45 * Math.sin(ph * 6);
  return `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="6" fill="#ffe14a" fill-opacity="${f2(0.07 * pulse)}" stroke="#ffe14a" stroke-width="1.8" opacity="${f2(0.4 + pulse * 0.6)}"/>`;
};

const DEFS = `<defs>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf3de"/><stop offset="1" stop-color="#ecd6ae"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9824f"/><stop offset="1" stop-color="#6f4527"/></linearGradient>
<linearGradient id="por" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d6dfeb"/><stop offset=".3" stop-color="#ffffff"/><stop offset=".75" stop-color="#e9eff7"/><stop offset="1" stop-color="#bac8da"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa6bd"/><stop offset=".3" stop-color="#e8edf5"/><stop offset=".55" stop-color="#aab5ca"/><stop offset="1" stop-color="#6e7a93"/></linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0ff"/><stop offset="1" stop-color="#2f8fe0"/></linearGradient>
<linearGradient id="glassd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".7"/><stop offset=".5" stop-color="#bfe6ff" stop-opacity=".25"/><stop offset="1" stop-color="#ffffff" stop-opacity=".5"/></linearGradient>
<linearGradient id="dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b5878"/><stop offset="1" stop-color="#2b3350"/></linearGradient>
<radialGradient id="light" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.2" flood-color="#2a1d10" flood-opacity=".35"/></filter>
<filter id="sh2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#10182a" flood-opacity=".4"/></filter>
<filter id="bl"><feGaussianBlur stdDeviation="1.6"/></filter>
</defs>`;

const room = (floorY = 412) =>
  `<rect x="-140" y="-140" width="550" height="${floorY + 140}" fill="url(#wall)"/><rect x="-140" y="-140" width="550" height="552" fill="url(#light)" transform="translate(40 -40) scale(.6 .8)"/>` +
  Array.from({ length: 16 }, (_, i) => `<rect x="${-126 + i * 36}" y="-140" width=".6" height="${floorY + 140}" fill="#d9bf8a" opacity=".5"/>`).join("") +
  `<rect x="-140" y="${floorY - 8}" width="550" height="9" fill="#a37646"/><rect x="-140" y="${floorY + 1}" width="550" height="220" fill="url(#floor)"/>` +
  Array.from({ length: 7 }, (_, i) => `<rect x="-140" y="${floorY + 18 + i * 22}" width="550" height="1" fill="#5d3a20" opacity=".5"/>`).join("");

const waterColor = "#58b8f8";

// ====================================================================
// ส้วมกดน้ำ
// ====================================================================
const TRAP: Pt[] = [[112, 288], [168, 290], [168, 262], [200, 262], [200, 348], [262, 348]];
const TRAP_L = plen(TRAP);
type TS = { t: number; b: number; h: number; f: number };
const T_STATE: Record<string, [TS, TS]> = {
  all: [{ t: 1, b: 0.74, h: 0, f: 0 }, { t: 1, b: 0.74, h: 0, f: 0 }],
  tank: [{ t: 1, b: 0.74, h: 0, f: 0 }, { t: 1, b: 0.74, h: 0, f: 0 }],
  handle: [{ t: 1, b: 0.74, h: 0, f: 0 }, { t: 1, b: 0.74, h: 1, f: 1 }],
  flapper: [{ t: 1, b: 0.74, h: 1, f: 1 }, { t: 0.25, b: 0.92, h: 1, f: 1 }],
  bowl: [{ t: 0.25, b: 0.92, h: 1, f: 1 }, { t: 0.2, b: 1, h: 0.3, f: 0.3 }],
  trap: [{ t: 0.2, b: 1, h: 0, f: 0 }, { t: 0.2, b: 0.02, h: 0, f: 0 }],
  vent: [{ t: 0.2, b: 0.02, h: 0, f: 0 }, { t: 0.2, b: 0.05, h: 0, f: 0 }],
  refill: [{ t: 0.2, b: 0.05, h: 0, f: 0 }, { t: 1, b: 0.74, h: 0, f: 0 }],
  end: [{ t: 1, b: 0.74, h: 0, f: 0 }, { t: 1, b: 0.74, h: 0, f: 0 }],
};
export const TOILET: SceneDef = {
  focus: {
    all: { cx: 150, cy: 235, z: 1.05 },
    tank: { cx: 165, cy: 120, z: 2.1, box: [116, 60, 100, 118], label: "ถังพักน้ำ" },
    handle: { cx: 128, cy: 112, z: 3.2, box: [100, 86, 40, 40], label: "คันโยก" },
    flapper: { cx: 152, cy: 158, z: 3.2, box: [136, 148, 32, 24], label: "ฝายาง" },
    bowl: { cx: 118, cy: 235, z: 2.2, box: [60, 172, 118, 124], label: "โถส้วม" },
    trap: { cx: 190, cy: 305, z: 2.1, box: [108, 254, 108, 104], label: "ท่อรูปตัว S" },
    vent: { cx: 235, cy: 200, z: 1.7, box: [246, 36, 16, 324], label: "ท่ออากาศ" },
    refill: { cx: 186, cy: 125, z: 3.0, box: [166, 84, 44, 92], label: "ลูกลอย" },
    end: { cx: 150, cy: 235, z: 1.05 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = T_STATE[cue] || T_STATE.all;
    const e = ease(p);
    const s: TS = { t: lerp(A.t, B.t, e), b: lerp(A.b, B.b, e), h: lerp(A.h, B.h, e), f: lerp(A.f, B.f, e) };
    const o: string[] = [DEFS, room()];
    o.push(`<ellipse cx="150" cy="412" rx="110" ry="8" fill="#1b1008" opacity=".38" filter="url(#bl)"/>`);
    // ท่อน้ำเสียในผนัง + ท่ออากาศ
    o.push(`<rect x="238" y="-20" width="34" height="430" fill="#e0c995" opacity=".55"/>`);
    o.push(tube([[255, 348], [255, 40]], 9, "#cfd6e3", "#fff", 2).replace(/opacity="\.92"/, 'opacity=".5"'));
    o.push(`<rect x="248" y="34" width="14" height="8" rx="3" fill="#8e99b0"/>`);
    // ฐานโถ
    o.push(`<g filter="url(#sh)"><path d="M62 178 H176 V200 Q176 296 120 300 Q96 330 100 405 H208 V412 H88 Q90 320 64 262 Q56 226 62 178Z" fill="url(#por)" stroke="#9aa9bf" stroke-width="1.2"/></g>`);
    // ตัวโถด้านใน (ตัดครึ่ง)
    o.push(`<path d="M70 184 H170 Q170 262 122 288 Q100 288 84 262 Q70 232 70 184Z" fill="#eaf1f9"/>`);
    // น้ำในโถ
    const by = 298 - 46 * s.b;
    o.push(`<clipPath id="bowlc"><path d="M70 184 H170 Q170 262 122 288 Q100 288 84 262 Q70 232 70 184Z"/></clipPath>`);
    o.push(`<g clip-path="url(#bowlc)">${wave(60, 180, by, 1.1, ph * 4, 300, "url(#water)")}</g>`);
    // ท่อดักกลิ่นตัว S
    o.push(tube(TRAP, 15, "#f1f5fb", "#fff", 8));
    const trapRun = cue === "trap" ? 1 : 0;
    const wtrap = cue === "trap" ? (p < 0.75 ? 1 : 1 - (p - 0.75) * 3) : cue === "vent" ? 0.1 : cue === "refill" ? 0.3 + 0.7 * p : cue === "bowl" ? 0.6 + 0.4 * p : cue === "flapper" ? 0.55 : 0.55;
    // น้ำในท่อ: เติมโค้งตั้งแต่ก้นโถถึงยอดโค้ง
    o.push(`<path d="${rpath(TRAP.slice(0, 3), 8)}" fill="none" stroke="${waterColor}" stroke-width="11" stroke-linecap="round" opacity="${f2(0.85 * cl(cue === "trap" && p > 0.8 ? 1 - (p - 0.8) * 4 : cue === "vent" ? 0.15 : 0.9))}"/>`);
    if (cue === "trap" || (cue === "bowl" && p > 0.4)) {
      const q = cue === "trap" ? 1 : (p - 0.4) / 0.6;
      const n = 16;
      for (let i = 0; i < n; i++) {
        const d = ((i / n) * TRAP_L + ph * 70) % TRAP_L;
        o.push(dot(along(TRAP, d), 2.2 * cl(q), waterColor));
      }
      o.push(`<path d="${rpath(TRAP, 8)}" fill="none" stroke="${waterColor}" stroke-width="10" stroke-linecap="round" opacity="${f2(0.7 * q * (cue === "trap" && p > 0.8 ? 1 - (p - 0.8) * 5 : 1))}"/>`);
    }
    // ฟองอากาศตอนเสียงดังโครก
    if (cue === "trap" && p > 0.78) for (let i = 0; i < 6; i++) o.push(`<circle cx="${f2(120 + i * 5 + Math.sin(ph * 6 + i) * 2)}" cy="${f2(284 - ((ph * 25 + i * 9) % 26))}" r="${f2(1.5 + (i % 3) * 0.6)}" fill="#fff" opacity=".8"/>`);
    // ท่อน้ำเข้าขอบโถ (รูสาดน้ำ)
    o.push(`<rect x="66" y="176" width="112" height="9" rx="4" fill="#d3dcea"/>`);
    // ถังพักน้ำ
    o.push(`<g filter="url(#sh)"><rect x="114" y="58" width="104" height="118" rx="8" fill="url(#por)" stroke="#9aa9bf" stroke-width="1.2"/><rect x="108" y="50" width="116" height="12" rx="5" fill="#f4f7fb" stroke="#9aa9bf" stroke-width="1"/></g>`);
    o.push(`<rect x="120" y="64" width="92" height="106" rx="4" fill="#f4f9ff"/>`);
    const ty = 168 - 82 * s.t;
    o.push(`<clipPath id="tankc"><rect x="120" y="64" width="92" height="106" rx="4"/></clipPath><g clip-path="url(#tankc)">${wave(118, 214, ty, 0.9, ph * 3, 172, "url(#water)", 0.82)}</g>`);
    // วาล์วท้ายถัง (ฝายาง) + รูทางออก
    o.push(`<rect x="140" y="166" width="24" height="6" rx="2" fill="#7a869c"/>`);
    const fa = -s.f * 55;
    o.push(`<g transform="translate(142 164) rotate(${f2(fa)})"><rect x="0" y="-3" width="22" height="4.5" rx="2" fill="#2f3a52"/><ellipse cx="18" cy="-1" rx="6" ry="2.6" fill="#5b6a88"/></g>`);
    // คันโยก + โซ่
    const lang = -s.h * 28;
    o.push(`<rect x="104" y="98" width="12" height="8" rx="2" fill="#8e99b0"/><g transform="translate(112 102) rotate(${f2(lang)})"><rect x="-16" y="-2" width="44" height="4" rx="2" fill="#c9d1df" stroke="#7a869c" stroke-width=".6"/><rect x="-22" y="-4" width="10" height="8" rx="3" fill="#ffe14a" stroke="#c9a400" stroke-width=".6"/></g>`);
    const lx = 112 + 26 * Math.cos((lang * Math.PI) / 180), ly = 102 + 26 * Math.sin((lang * Math.PI) / 180);
    const fx = 142 + 20 * Math.cos((fa * Math.PI) / 180), fy = 164 + 20 * Math.sin((fa * Math.PI) / 180);
    o.push(`<path d="M${f2(lx)} ${f2(ly)} L${f2(fx)} ${f2(fy)}" stroke="#4a5570" stroke-width=".9" stroke-dasharray="2 1.2" fill="none"/>`);
    // ท่อน้ำล้น + วาล์วเติมน้ำ + ลูกลอย
    o.push(`<rect x="196" y="96" width="5" height="74" rx="2" fill="#d3dcea" stroke="#9aa9bf" stroke-width=".6"/>`);
    o.push(`<rect x="203" y="86" width="8" height="84" rx="3" fill="url(#metal)"/><rect x="200" y="82" width="14" height="8" rx="3" fill="#4b5878"/>`);
    const fyb = ty - 3;
    o.push(`<path d="M186 ${f2(fyb)} L204 ${f2(Math.max(96, fyb - 2))}" stroke="#4a5570" stroke-width="1.4" fill="none"/><ellipse cx="180" cy="${f2(fyb)}" rx="8" ry="6" fill="#f08a3a" stroke="#b5561b" stroke-width=".8"/><ellipse cx="177.5" cy="${f2(fyb - 2)}" rx="2.6" ry="1.6" fill="#fff" opacity=".6"/>`);
    // น้ำไหลเข้าถังตอนเติม
    if (cue === "refill") {
      for (let i = 0; i < 5; i++) o.push(dot([207, 92 + ((ph * 40 + i * 14) % 70)], 1.3, waterColor));
      o.push(`<path d="M207 90v6" stroke="${waterColor}" stroke-width="2"/>`);
      // ท่อเล็กเติมโถ
      o.push(`<path d="M204 90 Q232 90 232 140 L232 184 L186 184" fill="none" stroke="#7fb4d8" stroke-width="1.6" stroke-dasharray="3 2"/>`);
    }
    // น้ำพุ่งจากถังลงโถ
    if (cue === "flapper" || cue === "bowl") {
      const a = cue === "flapper" ? 1 : 1 - p;
      for (let i = 0; i < 14; i++) {
        const u = ((ph * 1.4 + i / 14) % 1);
        o.push(dot([lerp(150, 80, u) + Math.sin(i) * 2, lerp(176, 262, u * u) ], 1.6 * a + 0.2, waterColor));
        o.push(dot([lerp(150, 164, u) , lerp(172, 262, u)], 1.4 * a + 0.2, waterColor));
      }
    }
    // ไอน้ำ/ลูกศรอากาศในท่อระบาย
    if (cue === "vent" || cue === "trap") {
      for (let k = 0; k < 4; k++) {
        const u = (ph * 0.5 + k * 0.25) % 1;
        o.push(varrow(255, 330 - u * 280, "#7fd0ff", Math.sin(Math.PI * u), -1).replace("rotate(-90)", "rotate(-90)"));
      }
    }
    o.push(box(TOILET.focus[cue]?.box, ph));
    return o.join("");
  },
};

// ====================================================================
// แอร์
// ====================================================================
const zig = (x0: number, x1: number, y0: number, step: number, n: number): Pt[] => {
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) { const y = y0 + step * k; const l2r = k % 2 === 1; out.push(l2r ? [x0, y] : [x1, y], l2r ? [x1, y] : [x0, y]); }
  return out;
};
const AC_Z: { name: string; pts: Pt[] }[] = [
  { name: "comp", pts: [[214, 347], [214, 335], [240, 335]] },
  { name: "disch", pts: [[240, 335], [258, 335], [258, 262], [248, 262]] },
  { name: "cond", pts: zig(202, 248, 262, 8, 7) },
  { name: "cap", pts: [[202, 310], [188, 310], [188, 58], [136, 58]] },
  { name: "evap", pts: zig(56, 136, 58, 7, 5) },
  { name: "suct", pts: [[56, 86], [56, 91], [180, 91], [180, 356], [214, 356], [214, 347]] },
];
const AC_PATH: { p: Pt; zone: string; u: number }[] = [];
(() => {
  const all: { p: Pt; zone: string }[] = [];
  AC_Z.forEach((z) => z.pts.forEach((p) => all.push({ p, zone: z.name })));
  const segs: { a: Pt; b: Pt; zone: string; start: number; len: number }[] = [];
  let tot = 0;
  for (let i = 0; i < all.length - 1; i++) {
    const a = all[i].p, b = all[i + 1].p;
    const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    if (!len) continue;
    segs.push({ a, b, zone: all[i + 1].zone, start: tot, len });
    tot += len;
  }
  (AC_PATH as any).segs = segs; (AC_PATH as any).tot = tot;
  const zr: Record<string, [number, number]> = {};
  segs.forEach((s) => { const r = zr[s.zone] || [s.start, s.start + s.len]; r[0] = Math.min(r[0], s.start); r[1] = Math.max(r[1], s.start + s.len); zr[s.zone] = r; });
  (AC_PATH as any).zr = zr;
})();
const acAt = (d: number) => {
  const segs = (AC_PATH as any).segs, tot = (AC_PATH as any).tot, zr = (AC_PATH as any).zr;
  const dd = ((d % tot) + tot) % tot;
  for (const s of segs) if (dd <= s.start + s.len) {
    const t = (dd - s.start) / s.len;
    return { p: [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t] as Pt, zone: s.zone as string, u: (dd - zr[s.zone][0]) / (zr[s.zone][1] - zr[s.zone][0]) };
  }
  return { p: segs[0].a as Pt, zone: "comp", u: 0 };
};
const acColor = (zone: string, u: number) =>
  zone === "comp" ? mixc("#8fe3ff", "#ff5a3c", u) : zone === "disch" ? "#ff3b30" : zone === "cond" ? mixc("#ff3b30", "#ffb02e", u) : zone === "cap" ? mixc("#ffb02e", "#6fe0ff", cl(u * 1.4)) : zone === "evap" ? mixc("#36c4ff", "#e6f8ff", u) : "#cfefff";

export const AC: SceneDef = {
  focus: {
    all: { cx: 135, cy: 225, z: 1.0 },
    room: { cx: 85, cy: 240, z: 1.7, box: [24, 196, 140, 176], label: "ห้องที่ร้อน" },
    indoor: { cx: 98, cy: 90, z: 2.5, box: [40, 48, 112, 82], label: "คอยล์เย็นในห้อง" },
    fan: { cx: 98, cy: 112, z: 3.4, box: [82, 98, 32, 30], label: "พัดลมเป่าลม" },
    comp: { cx: 226, cy: 336, z: 3.2, box: [204, 320, 46, 34], label: "คอมเพรสเซอร์" },
    outdoor: { cx: 226, cy: 285, z: 2.6, box: [196, 236, 66, 82], label: "คอยล์ร้อนนอกบ้าน" },
    cap: { cx: 190, cy: 185, z: 2.0, box: [184, 54, 10, 262], label: "ท่อน้ำยา" },
    end: { cx: 135, cy: 225, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const o: string[] = [DEFS, room(404)];
    // ห้อง + ผนัง
    o.push(`<rect x="170" y="-20" width="12" height="430" fill="#e5d3ac"/><rect x="170" y="-20" width="2" height="430" fill="#c9b27c"/>`);
    // ฝั่งนอกบ้าน (ท้องฟ้า)
    o.push(`<rect x="182" y="-20" width="100" height="425" fill="#cfeaff"/><rect x="182" y="-20" width="100" height="120" fill="#e9f6ff"/><ellipse cx="250" cy="20" rx="26" ry="10" fill="#fff" opacity=".8"/>`);
    o.push(`<rect x="182" y="404" width="100" height="10" fill="#7fae6a"/><rect x="182" y="414" width="100" height="100" fill="#5e8d4c"/>`);
    // แดดเข้าหน้าต่าง
    o.push(`<rect x="22" y="150" width="60" height="70" rx="3" fill="#8a5a33"/><rect x="26" y="154" width="52" height="62" fill="#cfeaff"/><circle cx="64" cy="168" r="9" fill="#ffe36a"/><circle cx="64" cy="168" r="14" fill="#ffe36a" opacity=".3"/>`);
    // อุณหภูมิห้อง: ร้อนแล้วเย็นลง
    const prog = cue === "all" ? 0 : cue === "end" ? 1 : cue === "room" ? p * 0.3 : cue === "indoor" ? 0.3 + p * 0.1 : cue === "fan" ? 0.4 + p * 0.3 : cue === "comp" || cue === "outdoor" || cue === "cap" ? 0.7 : 1;
    const temp = Math.round(34 - 9 * prog);
    // โซฟา + ต้นไม้
    o.push(`<g filter="url(#sh2)"><rect x="40" y="350" width="104" height="34" rx="8" fill="#7a6bd6"/><rect x="34" y="340" width="20" height="46" rx="8" fill="#6558c4"/><rect x="132" y="340" width="20" height="46" rx="8" fill="#6558c4"/><rect x="48" y="338" width="88" height="22" rx="8" fill="#8f82e6"/></g>`);
    o.push(`<rect x="152" y="376" width="12" height="28" rx="3" fill="#b0642e"/><path d="M158 376q-14-20-2-34q10 8 2 34zM158 376q14-18 6-32q-10 8-6 32z" fill="#4caf50"/>`);
    // ตัวเครื่องในบ้าน
    o.push(`<g filter="url(#sh)"><rect x="34" y="42" width="124" height="94" rx="10" fill="#f4f7fb" stroke="#9aa9bf" stroke-width="1"/></g><rect x="40" y="50" width="112" height="78" rx="6" fill="#dbeaf6"/>`);
    // ช่องอากาศเข้า (บน) + ช่องออก (ล่าง)
    o.push(`<rect x="44" y="40" width="104" height="6" rx="3" fill="#cdd6e3"/><path d="M42 128 L152 128 L146 136 L48 136Z" fill="#c5cfdd"/>`);
    // พัดลมกรงกระรอก
    const rot = ph * 540;
    o.push(`<g transform="translate(98 112)"><circle r="12" fill="#2b3350"/><g transform="rotate(${f2(rot)})">${Array.from({ length: 10 }, (_, i) => `<rect x="-1" y="-11" width="2" height="9" rx="1" fill="#9ad3f5" transform="rotate(${i * 36})"/>`).join("")}</g><circle r="3" fill="#c9d1df"/></g>`);
    // ท่อ
    const z = (n: string) => AC_Z.find((q) => q.name === n)!.pts;
    o.push(tube(z("disch"), 3.6, "#d8645e", "#ffd0c8", 3));
    o.push(tube(z("cond"), 3.6, "#d8645e", "#ffd0c8", 6));
    o.push(tube(z("cap"), 1.8, "#d9a15a", "#fff0c2", 3));
    o.push(tube(z("evap"), 3.4, "#5eaedd", "#fff", 3.4));
    o.push(tube(z("suct"), 3.4, "#7fb4d8", "#e5f5ff", 3));
    // คอมเพรสเซอร์ + ตู้เครื่องนอก
    o.push(`<g filter="url(#sh2)"><rect x="196" y="230" width="66" height="128" rx="6" fill="none" stroke="#8e99b0" stroke-width="1.6" stroke-dasharray="4 2"/></g>`);
    const vib = Math.sin(ph * 70) * 0.3;
    o.push(`<g transform="translate(${f2(vib)} 0)" filter="url(#sh2)"><rect x="204" y="322" width="46" height="32" rx="7" fill="#2b3350"/><rect x="206" y="324" width="42" height="28" rx="6" fill="url(#metal)"/><rect x="222" y="${f2(332 + 2 * Math.sin(ph * 14))}" width="10" height="7" rx="2" fill="#2b3350"/></g>`);
    // พัดลมนอกบ้าน
    o.push(`<g transform="translate(225 246)"><ellipse rx="22" ry="3.5" fill="#2b3350" opacity=".4" transform="translate(0 8)"/><g transform="rotate(${f2(ph * 720)})">${Array.from({ length: 3 }, (_, i) => `<ellipse cx="0" cy="-7" rx="3.4" ry="8" fill="#9ad3f5" transform="rotate(${i * 120})"/>`).join("")}</g><circle r="3" fill="#c9d1df"/></g>`);
    // อนุภาคสารทำความเย็น
    const tot = (AC_PATH as any).tot;
    for (let i = 0; i < Math.floor(tot / 12); i++) {
      const s = acAt(i * 12 + ph * 26);
      o.push(dot(s.p, s.zone === "cond" || s.zone === "cap" ? 1.3 : 1.7, acColor(s.zone, s.u)));
    }
    // ลมร้อนเข้าคอยล์เย็น (ห้อง) และลมเย็นออก
    const roomAir = cue === "room" || cue === "indoor" || cue === "fan" || cue === "all" || cue === "end";
    if (roomAir) {
      for (let k = 0; k < 4; k++) {
        const u = (ph * 0.5 + k * 0.25) % 1;
        o.push(varrow(60 + k * 26, 36 - 18 * (1 - u) + 14, "#ff8a3d", Math.sin(Math.PI * u) * (prog < 0.9 ? 1 : 0.4), 1));
      }
      for (let k = 0; k < 6; k++) {
        const u = (ph * 0.6 + k / 6) % 1;
        const x = 98 - u * 60 + k * 8, y = 138 + u * 130;
        o.push(`<g opacity="${f2(Math.sin(Math.PI * u) * 0.9)}"><path d="M${f2(x)} ${f2(y)} q-4 6 0 12 t0 12" fill="none" stroke="#7fd0ff" stroke-width="2" stroke-linecap="round"/><circle cx="${f2(x)}" cy="${f2(y)}" r="2" fill="#cfefff"/></g>`);
      }
    }
    // ลมร้อนออกนอกบ้าน
    if (cue === "outdoor" || cue === "all" || cue === "comp" || cue === "end") {
      for (let k = 0; k < 4; k++) {
        const u = (ph * 0.5 + k * 0.25) % 1;
        o.push(varrow(206 + k * 14, 232 - u * 38, "#ff5a36", Math.sin(Math.PI * u), -1));
      }
    }
    // เทอร์โมมิเตอร์ห้อง
    const tc = mixc("#ff5a3c", "#46b4ff", prog);
    o.push(`<rect x="6" y="236" width="12" height="130" rx="6" fill="#eef3fa" stroke="#9fb0c8"/><rect x="10" y="${f2(360 - 120 * (1 - prog * 0.75))}" width="4" height="${f2(120 * (1 - prog * 0.75))}" rx="2" fill="${tc}"/><circle cx="12" cy="372" r="9" fill="${tc}" stroke="#9fb0c8"/>`);
    o.push(`<text x="12" y="396" font-size="9" font-family="Kanit, sans-serif" font-weight="900" text-anchor="middle" fill="#46526b">${temp}°C</text>`);
    o.push(box(AC.focus[cue]?.box, ph));
    return o.join("");
  },
};

// ====================================================================
// เครื่องซักผ้า (ฝาหน้า)
// ====================================================================
type WS = { w: number; rot: number; spin: number; drain: number; inlet: number };
const W_STATE: Record<string, [Partial<WS>, Partial<WS>]> = {
  all: [{ w: 0 }, { w: 0 }],
  inlet: [{ w: 0, inlet: 1 }, { w: 0.5, inlet: 1 }],
  drawer: [{ w: 0.2, inlet: 1 }, { w: 0.5, inlet: 1 }],
  drum: [{ w: 0.5, rot: 1 }, { w: 0.5, rot: 1 }],
  motor: [{ w: 0.5, rot: 1 }, { w: 0.5, rot: 1 }],
  pump: [{ w: 0.5, drain: 1 }, { w: 0.02, drain: 1 }],
  spin: [{ w: 0, spin: 1 }, { w: 0, spin: 1 }],
  end: [{ w: 0 }, { w: 0 }],
};
export const WASH: SceneDef = {
  focus: {
    all: { cx: 135, cy: 235, z: 1.0 },
    inlet: { cx: 105, cy: 100, z: 2.3, box: [34, 70, 110, 52], label: "วาล์วน้ำเข้า" },
    drawer: { cx: 102, cy: 96, z: 3.0, box: [74, 80, 62, 34], label: "ช่องใส่ผงซักฟอก" },
    drum: { cx: 135, cy: 240, z: 1.9, box: [70, 175, 130, 130], label: "ถังซัก" },
    motor: { cx: 112, cy: 340, z: 2.6, box: [76, 318, 72, 54], label: "มอเตอร์" },
    pump: { cx: 175, cy: 355, z: 2.8, box: [152, 330, 56, 46], label: "ปั๊มน้ำทิ้ง" },
    spin: { cx: 135, cy: 240, z: 2.0, box: [70, 175, 130, 130], label: "ปั่นแห้ง" },
    end: { cx: 135, cy: 235, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = W_STATE[cue] || W_STATE.all;
    const e = ease(p);
    const g = (k: keyof WS) => lerp((A as any)[k] ?? 0, (B as any)[k] ?? 0, e);
    const w = g("w");
    const o: string[] = [DEFS, room()];
    o.push(`<ellipse cx="135" cy="412" rx="100" ry="8" fill="#1b1008" opacity=".38" filter="url(#bl)"/>`);
    // ก๊อกน้ำที่ผนัง + ท่อทิ้ง
    o.push(`<rect x="12" y="62" width="30" height="12" rx="4" fill="url(#metal)"/><rect x="12" y="50" width="10" height="24" rx="3" fill="#8e99b0"/>`);
    o.push(`<rect x="212" y="356" width="60" height="14" rx="5" fill="#cfd6e3" opacity=".7"/>`);
    // ตัวเครื่อง
    o.push(`<g filter="url(#sh)"><rect x="62" y="46" width="146" height="362" rx="10" fill="url(#por)" stroke="#9aa9bf" stroke-width="1.2"/></g>`);
    o.push(`<rect x="68" y="52" width="134" height="40" rx="6" fill="#e3ebf5"/>`);
    // แผงควบคุม
    o.push(`<circle cx="176" cy="72" r="13" fill="#2b3350"/><circle cx="176" cy="72" r="10" fill="#4b5878"/><rect x="175" y="62" width="2" height="9" rx="1" fill="#ffe14a" transform="rotate(${f2(ph * 30)} 176 72)"/>`);
    o.push(`<rect x="148" y="62" width="20" height="14" rx="3" fill="#10182a"/><text x="158" y="72.5" font-size="7" fill="#7fffd0" font-family="Kanit, sans-serif" font-weight="700" text-anchor="middle">${cue === "spin" ? "1200" : cue === "pump" ? "END" : "45:00"}</text>`);
    // ช่องผงซักฟอก
    o.push(`<rect x="76" y="62" width="58" height="24" rx="4" fill="#cdd9ea" stroke="#8fa1bd"/><rect x="80" y="66" width="22" height="16" rx="2" fill="#a9d9ff"/><rect x="106" y="66" width="22" height="16" rx="2" fill="#ffd6e6"/>`);
    // น้ำเข้า: ท่อจากก๊อก -> วาล์ว -> ช่องผง -> ถัง
    const inletPts: Pt[] = [[42, 68], [56, 68], [56, 96], [100, 96]];
    const hosePts: Pt[] = [[100, 88], [100, 120], [135, 150], [135, 180]];
    o.push(tube(inletPts, 5, "#8aa8c9", "#fff", 4));
    o.push(`<rect x="52" y="84" width="12" height="16" rx="3" fill="#ffb04a" stroke="#b5681b"/><circle cx="58" cy="92" r="2" fill="#fff" opacity=".6"/>`);
    o.push(tube(hosePts, 5, "#8aa8c9", "#fff", 5));
    if (g("inlet") > 0.1) {
      for (let i = 0; i < 12; i++) {
        const d = ((i / 12) * (plen(inletPts) + plen(hosePts)) + ph * 40) % (plen(inletPts) + plen(hosePts));
        const lp = plen(inletPts);
        o.push(dot(d < lp ? along(inletPts, d) : along(hosePts, d - lp), 1.5, waterColor));
      }
    }
    // ถัง + ประตูกระจก
    o.push(`<circle cx="135" cy="240" r="68" fill="#2b3350"/><circle cx="135" cy="240" r="64" fill="#dbe7f5"/>`);
    // น้ำในถัง
    o.push(`<clipPath id="drumc"><circle cx="135" cy="240" r="62"/></clipPath><g clip-path="url(#drumc)">${wave(70, 200, 302 - 124 * w, 1.1, ph * 4, 305, "url(#water)", 0.8)}</g>`);
    // ผ้าในถัง หมุน
    const spinning = g("spin") > 0.5;
    const rotOn = g("rot") > 0.5;
    const base = spinning ? ph * 1100 + 20 * p * ph * 60 : rotOn ? Math.sin(ph * 1.8) * 140 : 0;
    const cols = ["#ff7a7a", "#ffd24a", "#6fd0ff", "#a58cf0", "#7ee0a8", "#ff9fc6"];
    for (let i = 0; i < 6; i++) {
      const a = base + i * 60;
      const r = spinning ? 50 : 24 + (i % 2) * 14;
      const x = 135 + r * Math.cos((a * Math.PI) / 180), y = 240 + r * Math.sin((a * Math.PI) / 180);
      o.push(`<rect x="${f2(x - 9)}" y="${f2(y - 6)}" width="18" height="12" rx="4" fill="${cols[i]}" transform="rotate(${f2(a * 1.3)} ${f2(x)} ${f2(y)})" stroke="#fff" stroke-width=".6" opacity=".95"/>`);
    }
    // ฟองสบู่
    if (w > 0.2) for (let i = 0; i < 9; i++) o.push(`<circle cx="${f2(100 + ((i * 17 + ph * 12) % 70))}" cy="${f2(292 - 124 * w + 6 - ((ph * 18 + i * 7) % 10))}" r="${f2(2 + (i % 3))}" fill="#fff" opacity=".7" clip-path="url(#drumc)"/>`);
    // น้ำกระเด็นตอนปั่น
    if (spinning) for (let i = 0; i < 16; i++) { const a = (i / 16) * 360 + ph * 400; const u = (ph * 3 + i / 16) % 1; const rr = 64 + u * 12; o.push(`<circle cx="${f2(135 + rr * Math.cos((a * Math.PI) / 180))}" cy="${f2(240 + rr * Math.sin((a * Math.PI) / 180))}" r="1.5" fill="${waterColor}" opacity="${f2(1 - u)}"/>`); }
    o.push(`<circle cx="135" cy="240" r="64" fill="url(#glassd)"/><circle cx="135" cy="240" r="68" fill="none" stroke="#9aa9bf" stroke-width="3"/><path d="M96 200 Q110 186 132 182" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>`);
    // มอเตอร์ + สายพาน (ใต้ถัง)
    const mrot = spinning ? ph * 1400 : rotOn ? Math.sin(ph * 1.8) * 300 : 0;
    o.push(`<g filter="url(#sh2)"><rect x="82" y="324" width="62" height="36" rx="8" fill="url(#dark)"/><rect x="86" y="328" width="54" height="28" rx="6" fill="url(#metal)"/><circle cx="148" cy="342" r="9" fill="#2b3350"/><g transform="rotate(${f2(mrot)} 148 342)"><rect x="146" y="334" width="4" height="8" rx="1" fill="#ffd24a"/><circle cx="148" cy="342" r="3" fill="#c9d1df"/></g></g>`);
    o.push(`<path d="M148 333 Q150 300 135 306 M148 351 Q160 380 135 380" stroke="#2b3350" stroke-width="2" fill="none" opacity=".0"/>`);
    // ปั๊มน้ำทิ้ง + ท่อ
    const drain: Pt[] = [[135, 308], [135, 330], [160, 345], [186, 345], [186, 358], [270, 358]];
    o.push(tube(drain, 6, "#9aa7bd", "#fff", 5));
    o.push(`<g filter="url(#sh2)"><circle cx="172" cy="352" r="14" fill="#2b3350"/><circle cx="172" cy="352" r="11" fill="#dbe7f5"/><g transform="rotate(${f2(g("drain") > 0.5 ? ph * 900 : 0)} 172 352)">${Array.from({ length: 4 }, (_, i) => `<rect x="171" y="342" width="2.4" height="10" rx="1" fill="#4b8bd6" transform="rotate(${i * 90} 172 352)"/>`).join("")}</g></g>`);
    if (g("drain") > 0.2 || (w > 0.05 && cue === "pump")) {
      const dl = plen(drain);
      for (let i = 0; i < 16; i++) o.push(dot(along(drain, ((i / 16) * dl + ph * 60) % dl), 1.6, waterColor));
    }
    o.push(box(WASH.focus[cue]?.box, ph));
    return o.join("");
  },
};

export const SCENES: Record<string, SceneDef> = { toilet: TOILET, ac: AC, wash: WASH };

export const H = { f2, cl, lerp, ease, mixc, plen, along, rpath, tube, dot, wave, warrow, varrow, box, DEFS, room, waterColor };
