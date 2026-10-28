// ฉากเครื่องตรวจจับควัน (ตัดครึ่ง 2 แบบ: ไอออไนซ์ + โฟโตอิเล็กทริก) — คืนสตริง SVG ภายในพิกัด 270x480
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, box, DEFS } = H;
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const F = `font-family="Kanit, sans-serif"`;
const lbl = (x: number, y: number, t: string, size = 7, c = "#27324f", anchor = "middle") =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" ${F} font-weight="700" text-anchor="${anchor}" fill="${c}" stroke="#fff" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">${t}</text>`;

const EXTRA = `<defs>
<linearGradient id="ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6dfd2"/><stop offset="1" stop-color="#b9b0a0"/></linearGradient>
<linearGradient id="shell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e7ebf3"/><stop offset=".4" stop-color="#ffffff"/><stop offset="1" stop-color="#c3ccdb"/></linearGradient>
<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6b0" stop-opacity=".95"/><stop offset="1" stop-color="#ffd84a" stop-opacity=".35"/></linearGradient>
<radialGradient id="glowr" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff4a3a" stop-opacity=".7"/><stop offset="1" stop-color="#ff4a3a" stop-opacity="0"/></radialGradient>
</defs>`;

type St = { sa: number; sb: number; fa: number; fb: number; btn: number; cig: number; life: number; big: number };
const Z0: St = { sa: 0, sb: 0, fa: 0, fb: 0, btn: 0, cig: 0, life: 0, big: 0 };
const S = (o: Partial<St>): St => ({ ...Z0, ...o });
const STATE: Record<string, [St, St]> = {
  all: [S({}), S({})],
  ion: [S({}), S({})],
  smoke: [S({}), S({ sa: 1 })],
  alarm: [S({ sa: 1 }), S({ sa: 1 })],
  photo: [S({}), S({})],
  scatter: [S({}), S({ sb: 1 })],
  compare: [S({ sa: 0.6, sb: 0.6, big: 1 }), S({ sa: 0.6, sb: 0.6, big: 1 })],
  fact: [S({ cig: 1 }), S({ cig: 1, sa: 1 })],
  test: [S({}), S({ btn: 1 })],
  life: [S({}), S({ life: 1 })],
  end: [S({}), S({})],
};

const AX = 115, AY = 163; // ตำแหน่งแหล่งอะเมริเซียมบนแผ่นล่าง (พิกัดในแผง)

// ---------- ส่วนโครงเครื่อง (ใช้ร่วมกัน) ----------
const waves = (alarm: number, ph: number) => {
  const o: string[] = [];
  // คลื่นเสียง
  if (alarm > 0.5) for (let k = 0; k < 3; k++) {
    const u = (ph * 1.6 + k / 3) % 1;
    const r = 14 + u * 34;
    o.push(`<path d="M${f2(76 - r * 0.9)} ${f2(59 + r * 0.45)} A${f2(r)} ${f2(r)} 0 0 0 ${f2(76 - r * 0.45)} ${f2(59 + r * 0.9)}" fill="none" stroke="#ff9a1a" stroke-width="2" stroke-linecap="round" opacity="${f2(0.9 * (1 - u))}" transform="translate(0 0)"/>`);
    o.push(`<path d="M${f2(76 + r * 0.9)} ${f2(59 + r * 0.45)} A${f2(r)} ${f2(r)} 0 0 1 ${f2(76 + r * 0.45)} ${f2(59 + r * 0.9)}" fill="none" stroke="#ff9a1a" stroke-width="2" stroke-linecap="round" opacity="${f2(0.9 * (1 - u))}"/>`);
  }
  return o.join("");
};
const housing = (alarm: number, ph: number, btn: number, ledOn: boolean) => {
  const o: string[] = [];
  o.push(`<g filter="url(#sh)"><path d="M40 42 H250 V168 Q250 204 214 204 H76 Q40 204 40 168 Z" fill="url(#shell)" stroke="#8e99b0" stroke-width="1.2"/></g>`);
  o.push(`<path d="M47 42 H243 V166 Q243 197 211 197 H79 Q47 197 47 166 Z" fill="#cdd6e6" stroke="#9aa9bf" stroke-width=".8"/>`);
  // รูระบายอากาศทางซ้าย
  for (let k = 0; k < 4; k++) o.push(`<rect x="39" y="${106 + k * 15}" width="9" height="8" rx="2" fill="#cdd6e6" stroke="#8e99b0" stroke-width=".6"/>`);
  // แผงวงจร
  o.push(`<rect x="52" y="46" width="186" height="26" rx="3" fill="#2f7d57" stroke="#1b4d36"/>`);
  o.push(`<path d="M58 66 H120 M150 52 H230 M140 66 H230" stroke="#9fe3b8" stroke-width=".8" fill="none" opacity=".7"/>`);
  o.push(`<rect x="124" y="50" width="30" height="18" rx="2" fill="#1b2238"/>`);
  for (let k = 0; k < 5; k++) o.push(`<rect x="${127 + k * 5.5}" y="47.5" width="2" height="3" fill="#c8ccd8"/><rect x="${127 + k * 5.5}" y="67.5" width="2" height="3" fill="#c8ccd8"/>`);
  // บัซเซอร์
  o.push(`<circle cx="76" cy="59" r="10" fill="#2b3350" stroke="#10182a"/><circle cx="76" cy="59" r="4" fill="#0b1226"/><circle cx="76" cy="59" r="7" fill="none" stroke="#4b5878" stroke-width=".8"/>`);
  // ไฟ LED สถานะ
  o.push(`<circle cx="222" cy="59" r="4" fill="${ledOn ? "#ff3a2a" : "#6a2a2a"}" stroke="#10182a" stroke-width=".6"/>`);
  if (ledOn) o.push(`<circle cx="222" cy="59" r="16" fill="url(#glowr)"/>`);
  // ปุ่มทดสอบ
  o.push(`<rect x="124" y="198" width="12" height="6" rx="2" fill="#c3ccdb"/>`);
  o.push(`<circle cx="130" cy="${f2(204 - 2.5 * (1 - btn) + 1.5 * btn)}" r="6.5" fill="#f4f6fa" stroke="#8e99b0" stroke-width="1"/><circle cx="130" cy="${f2(204 - 2.5 * (1 - btn) + 1.5 * btn)}" r="3" fill="#dfe5ef"/>`);
  return o.join("");
};

// มิเตอร์ด้านขวา (กระแส / สัญญาณ)
const meter = (title: string, val: number, thr: number, alarm: boolean, ph: number, flowWire: number) => {
  const o: string[] = [];
  o.push(`<rect x="196" y="82" width="46" height="108" rx="5" fill="#f4f6fa" stroke="#6e7a93" stroke-width="1"/>`);
  o.push(`<text x="219" y="93" font-size="8" ${F} font-weight="800" text-anchor="middle" fill="#27324f">${title}</text>`);
  const by = 100, bh = 80;
  o.push(`<rect x="212" y="${by}" width="14" height="${bh}" rx="3" fill="#dfe5ef" stroke="#9aa9bf"/>`);
  const h = bh * cl(val);
  const col = alarm ? "#ff4a2a" : "#3fbf6a";
  o.push(`<rect x="213.5" y="${f2(by + bh - h)}" width="11" height="${f2(h)}" rx="2" fill="${col}"/>`);
  const ty = by + bh - bh * thr;
  o.push(`<line x1="205" y1="${f2(ty)}" x2="233" y2="${f2(ty)}" stroke="#d6232a" stroke-width="1.2" stroke-dasharray="3 2"/>`);
  o.push(`<text x="203" y="${f2(ty - 2)}" font-size="5.5" ${F} font-weight="700" fill="#d6232a" text-anchor="middle">เกณฑ์</text>`);
  // เส้นลวด + อิเล็กตรอนวิ่ง
  void ph; void flowWire;
  return o.join("");
};

// ====================================================================
// แผง A: ไอออไนซ์
// ====================================================================
const panelA = (st: St, ph: number, cue: string) => {
  const o: string[] = [];
  const sa = st.sa, btn = st.btn;
  const eff = Math.max(sa, btn);
  const I = 1 - 0.62 * ease(cl(eff));
  const thr = 0.55;
  const alarm = I < thr;
  o.push(housing(alarm ? 1 : 0, ph, btn, alarm && Math.sin(ph * 14) > -0.2));
  // ห้องวัด (ฝาตาข่าย)
  o.push(`<rect x="52" y="82" width="128" height="108" rx="8" fill="#f1f5fb" stroke="#6e7a93" stroke-width="1.4"/>`);
  o.push(`<rect x="52" y="82" width="128" height="108" rx="8" fill="#e8f0fb" opacity=".9"/>`);
  // ช่องตาข่ายด้านซ้ายและขวา
  for (let k = 0; k < 5; k++) { o.push(`<rect x="50" y="${102 + k * 13}" width="5" height="7" rx="1.5" fill="#cdd6e6" stroke="#6e7a93" stroke-width=".6"/><rect x="177" y="${102 + k * 13}" width="5" height="7" rx="1.5" fill="#cdd6e6" stroke="#6e7a93" stroke-width=".6"/>`); }
  // แผ่นโลหะ
  o.push(`<rect x="64" y="95" width="104" height="7" rx="2" fill="#e24b4b" stroke="#8e1f1f"/><text x="116" y="101" font-size="7" ${F} font-weight="900" text-anchor="middle" fill="#fff">+  +  +  +  +</text>`);
  o.push(`<rect x="64" y="167" width="104" height="7" rx="2" fill="#3f72d9" stroke="#1f3f8e"/><text x="116" y="173" font-size="7" ${F} font-weight="900" text-anchor="middle" fill="#fff">−  −  −  −  −</text>`);
  // แหล่งอะเมริเซียม
  o.push(`<rect x="${AX - 9}" y="${AY - 1}" width="18" height="5" rx="1.5" fill="#d8c06a" stroke="#8a6d10"/>`);
  o.push(`<rect x="${AX - 5}" y="${AY - 5}" width="10" height="5" rx="2" fill="#bfc6d4" stroke="#6e7a93"/>`);
  // รังสีแอลฟา + ไอออน
  const showIons = true;
  const rays = [-150, -120, -95, -70, -40];
  const N = 12;
  // ไอออนที่ถูกควันจับ
  const caught = (i: number) => rnd(i + 50) < Math.min(0.92, eff * 1.05);
  if (showIons) {
    for (let r = 0; r < rays.length; r++) {
      const a = (rays[r] * Math.PI) / 180;
      const u = (ph * 1.2 + r * 0.21) % 1;
      const len = 30 + rnd(r) * 10;
      const x = AX + Math.cos(a) * len * u, y = AY - 4 + Math.sin(a) * len * u;
      o.push(`<line x1="${AX}" y1="${AY - 4}" x2="${f2(AX + Math.cos(a) * len)}" y2="${f2(AY - 4 + Math.sin(a) * len)}" stroke="#ffc93c" stroke-width=".5" stroke-dasharray="1.5 2.5" opacity=".6"/>`);
      o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="2.8" fill="#ffc93c" opacity=".35"/><circle cx="${f2(x)}" cy="${f2(y)}" r="1.5" fill="#ff9a1a"/>`);
    }
    for (let i = 0; i < N; i++) {
      const u = (ph * 0.42 + i / N) % 1;
      const x0 = 78 + rnd(i + 3) * 86, y0 = 118 + rnd(i + 9) * 38;
      if (caught(i)) continue;
      const wob = Math.sin(ph * 3 + i) * 1.2;
      const fade = cl(Math.min(u * 6, (1 - u) * 6));
      // ไอออนบวก (แดง) ลงไปหาแผ่นลบ  / ไอออนลบ (น้ำเงิน) ขึ้นไปหาแผ่นบวก
      const yp = y0 + u * (166 - y0), yn = y0 - u * (y0 - 103);
      o.push(`<g opacity="${f2(fade)}"><circle cx="${f2(x0 + wob)}" cy="${f2(yp)}" r="3" fill="#ff6a6a" stroke="#a31f1f" stroke-width=".6"/><text x="${f2(x0 + wob)}" y="${f2(yp + 2.2)}" font-size="5.5" ${F} font-weight="900" text-anchor="middle" fill="#fff">+</text>`);
      o.push(`<circle cx="${f2(x0 + 6 - wob)}" cy="${f2(yn)}" r="3" fill="#5a8cf0" stroke="#1f3f8e" stroke-width=".6"/><text x="${f2(x0 + 6 - wob)}" y="${f2(yn + 2)}" font-size="6" ${F} font-weight="900" text-anchor="middle" fill="#fff">−</text></g>`);
    }
  }
  // อนุภาคควัน
  const nS = 12;
  const rr = st.big > 0.5 ? 1.5 : 1.7;
  const cig = st.cig;
  for (let i = 0; i < nS; i++) {
    const e = ease(cl(eff * 1.5 - rnd(i + 70) * 0.5));
    if (e < 0.01) continue;
    const tx = 78 + rnd(i + 71) * 84, ty = 108 + rnd(i + 72) * 54;
    const sx = cig ? 38 : 30, sy = cig ? 128 : 105 + rnd(i + 73) * 55;
    const x = lerp(sx, tx, e) + Math.sin(ph * 1.7 + i) * 2.2 * e;
    const y = lerp(sy, ty, e) + Math.cos(ph * 1.3 + i * 1.7) * 2.2 * e;
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(rr * 1.9)}" fill="#7a7f8c" opacity=".28"/><circle cx="${f2(x)}" cy="${f2(y)}" r="${rr}" fill="#555a68"/>`);
    // ไอออนที่เกาะควัน
    if (e > 0.85 && caught(i)) o.push(`<circle cx="${f2(x + 3.4)}" cy="${f2(y - 1.5)}" r="1.6" fill="#ff8a8a" opacity=".85"/><circle cx="${f2(x - 3)}" cy="${f2(y + 2)}" r="1.6" fill="#7aa0f4" opacity=".85"/>`);
  }
  // มิเตอร์ + ลวด
  o.push(meter("กระแส", I, thr, alarm, ph, I));
  const wire = (y1: number, y2: number, sx: number, dir: number) => {
    let s = `<path d="M${sx} ${y1} H189 V${y2} H196" fill="none" stroke="#6e7a93" stroke-width="1.6"/>`;
    const L = (189 - sx) + Math.abs(y2 - y1) + 7;
    for (let k = 0; k < 4; k++) {
      let d = (((ph * 26 * I + k * L / 4) * dir) % L + L) % L;
      let x: number, y: number;
      if (d < 189 - sx) { x = sx + d; y = y1; } else if (d < 189 - sx + Math.abs(y2 - y1)) { x = 189; y = y1 + Math.sign(y2 - y1) * (d - (189 - sx)); } else { x = 189 + (d - (189 - sx) - Math.abs(y2 - y1)); y = y2; }
      s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="1.5" fill="#ffd84a" stroke="#8a6d10" stroke-width=".4" opacity="${f2(0.4 + 0.6 * I)}"/>`;
    }
    return s;
  };
  o.push(wire(98, 104, 168, 1) + wire(170, 164, 168, -1));
  // บุหรี่
  if (cig) {
    o.push(`<g transform="translate(6 126)"><rect x="0" y="0" width="22" height="5.5" rx="1.5" fill="#f8f8f4" stroke="#b9b9b0" stroke-width=".6"/><rect x="21" y="0" width="12" height="5.5" rx="1.5" fill="#d9a05a" stroke="#8a5a1a" stroke-width=".6"/><rect x="-2" y="0" width="4" height="5.5" rx="1.5" fill="#ff5a1a"/><circle cx="-1" cy="2.7" r="5" fill="#ff8a3a" opacity="${f2(0.4 + 0.2 * Math.sin(ph * 8))}" filter="url(#bl)"/></g>`);
    o.push(lbl(22, 150, "บุหรี่", 7));
  }
  // ป้ายชื่อชิ้นส่วน
  if (cue === "ion" || cue === "smoke") {
    o.push(lbl(AX - 18, AY + 22, "อะเมริเซียม-241", 7));
    o.push(lbl(116, 91, "แผ่นบวก", 6.5, "#a31f1f"));
    o.push(lbl(158, 184, "แผ่นลบ", 6.5, "#1f3f8e"));
  }
  o.push(waves(alarm ? 1 : 0, ph));
  return `<g>${o.join("")}</g>`;
};

// ====================================================================
// แผง B: โฟโตอิเล็กทริก
// ====================================================================
const panelB = (st: St, ph: number, cue: string) => {
  const o: string[] = [];
  const sb = st.sb;
  // สัญญาณจากการกระเจิงแสง
  const nS = 12;
  const rr = st.big > 0.5 ? 3.4 : 3.2;
  type P = { x: number; y: number; e: number; lit: boolean; seen: boolean };
  const ps: P[] = [];
  for (let i = 0; i < nS; i++) {
    const e = ease(cl(sb * 1.5 - rnd(i + 170) * 0.5));
    if (e < 0.01) continue;
    // เป้าหมายส่วนใหญ่อยู่ในลำแสง (y~158) และบางส่วนในอุโมงค์ตัวรับ
    const tx = 82 + rnd(i + 171) * 84, ty = 150 + rnd(i + 172) * 16;
    const sx = 30, sy = 125 + rnd(i + 173) * 60;
    const x = lerp(sx, tx, e) + Math.sin(ph * 1.5 + i) * 2 * e;
    const y = lerp(sy, ty, e) + Math.cos(ph * 1.1 + i * 1.9) * 2.5 * e;
    ps.push({ x, y, e, lit: x > 70 && x < 176 && Math.abs(y - 158) < 11, seen: x > 100 && x < 130 && Math.abs(y - 158) < 11 });
  }
  const nSeen = ps.filter((p) => p.seen && p.e > 0.9).length;
  const sig = cl(Math.min(1, nSeen / 2.0)) * (0.35 + 0.65 * cl(sb)) * 0.95;
  const val = sig;
  const thr = 0.5;
  const alarm = val > thr;
  o.push(housing(alarm ? 1 : 0, ph, 0, alarm && Math.sin(ph * 14) > -0.2));
  // ห้องแสง (ผนังดำ)
  o.push(`<rect x="52" y="82" width="132" height="108" rx="8" fill="#1b2238" stroke="#0b1226" stroke-width="1.4"/>`);
  // ครีบกันแสงภายนอก (ซ้ายขวา) ให้อากาศ/ควันผ่านได้
  for (let k = 0; k < 4; k++) {
    o.push(`<path d="M52 ${100 + k * 22} l12 7 l0 5 l-12 -7z" fill="#3a4666" stroke="#0b1226" stroke-width=".6"/>`);
    o.push(`<path d="M184 ${100 + k * 22} l-12 7 l0 5 l12 -7z" fill="#3a4666" stroke="#0b1226" stroke-width=".6"/>`);
  }
  // ผนังกั้น (อุโมงค์ตัวรับ)
  o.push(`<rect x="98" y="88" width="3" height="42" fill="#46526b"/><rect x="129" y="88" width="3" height="42" fill="#46526b"/>`);
  // โฟโตไดโอด
  o.push(`<g filter="url(#sh2)"><rect x="104" y="86" width="22" height="10" rx="2" fill="#7a86a2" stroke="#10182a" stroke-width=".7"/><rect x="108" y="94" width="14" height="4" rx="1" fill="${alarm ? "#7dffb0" : "#4fa0d8"}"/></g>`);
  // หลอด LED + เลนส์
  o.push(`<rect x="58" y="148" width="10" height="20" rx="2" fill="#9aa6bd" stroke="#10182a" stroke-width=".7"/><rect x="66" y="152" width="5" height="12" rx="2" fill="#fff4a8"/>`);
  o.push(`<circle cx="66" cy="158" r="9" fill="#ffe14a" opacity=".5" filter="url(#bl)"/>`);
  // ที่ดักแสง
  o.push(`<path d="M176 146 L188 146 L188 170 L176 170 L182 158Z" fill="#0b1226" stroke="#3a4666" stroke-width=".6"/>`);
  // ลำแสง
  const flick = 0.9 + 0.1 * Math.sin(ph * 6);
  o.push(`<path d="M71 155 L176 150 L176 166 L71 161 Z" fill="url(#beam)" opacity="${f2(0.9 * flick)}"/>`);
  for (let k = 0; k < 6; k++) { const x = 72 + ((ph * 55 + k * 18) % 104); o.push(`<circle cx="${f2(x)}" cy="${f2(158 + Math.sin(k * 3 + ph) * 1.6)}" r=".9" fill="#fff"/>`); }
  // อนุภาคควัน + รังสีกระเจิง
  for (const p of ps) {
    if (p.lit) {
      o.push(`<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${f2(rr * 2.2)}" fill="#ffe97a" opacity=".4" filter="url(#bl)"/>`);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + ph * 2;
        const len = 5 + 3 * Math.sin(ph * 6 + k);
        o.push(`<line x1="${f2(p.x + Math.cos(a) * (rr + 1))}" y1="${f2(p.y + Math.sin(a) * (rr + 1))}" x2="${f2(p.x + Math.cos(a) * (rr + 1 + len))}" y2="${f2(p.y + Math.sin(a) * (rr + 1 + len))}" stroke="#fff3a0" stroke-width=".7" opacity=".55"/>`);
      }
    }
    o.push(`<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${rr}" fill="${p.lit ? "#d8d4c4" : "#7d8394"}" stroke="#454b5e" stroke-width=".6"/>`);
    if (p.seen && p.e > 0.9) {
      // รังสีที่กระเจิงขึ้นไปตกบนโฟโตไดโอด
      const tx = 115 + (p.x - 115) * 0.12, ty = 98;
      o.push(`<line x1="${f2(p.x)}" y1="${f2(p.y - rr)}" x2="${f2(tx)}" y2="${ty}" stroke="#fff56a" stroke-width="1.5" stroke-dasharray="3 2.5" stroke-dashoffset="${f2(-ph * 22)}"/>`);
    }
  }
  if (alarm) o.push(`<circle cx="115" cy="92" r="15" fill="#7dffb0" opacity="${f2(0.35 + 0.15 * Math.sin(ph * 12))}" filter="url(#bl)"/>`);
  o.push(meter("สัญญาณ", val, thr, alarm, ph, val));
  // ลวดจากโฟโตไดโอดไปที่วงจร
  o.push(`<path d="M126 90 H189 V100 H196" fill="none" stroke="#6e7a93" stroke-width="1.6"/>`);
  for (let k = 0; k < 3; k++) { const L = 63 + 10 + 7; const d = (ph * 26 * val + (k * L) / 3) % L; const x = d < 63 ? 126 + d : d < 73 ? 189 : 189 + (d - 73); const y = d < 63 ? 90 : d < 73 ? 90 + (d - 63) : 100; if (val > 0.05) o.push(`<circle cx="${f2(x)}" cy="${y}" r="1.5" fill="#ffd84a" stroke="#8a6d10" stroke-width=".4"/>`); }
  if (cue === "photo" || cue === "scatter") {
    o.push(lbl(80, 178, "หลอดไฟ LED", 6.5, "#27324f"));
    o.push(lbl(115, 80, "ตัวรับแสง", 6.5, "#27324f"));
    o.push(lbl(172, 182, "ที่ดักแสง", 6.5, "#27324f"));
  }
  o.push(waves(alarm ? 1 : 0, ph));
  return `<g>${o.join("")}</g>`;
};

export const SCENE_SMOKE: SceneDef = {
  focus: {
    all: { cx: 135, cy: 240, z: 1.0 },
    ion: { cx: 118, cy: 132, z: 1.75, box: [52, 82, 128, 108], label: "ห้องไอออไนซ์" },
    smoke: { cx: 142, cy: 135, z: 1.35, box: [52, 82, 190, 108], label: "ควันจับไอออน" },
    alarm: { cx: 110, cy: 100, z: 2.0, box: [64, 46, 24, 26], label: "เสียงเตือนดัง" },
    photo: { cx: 130, cy: 305, z: 1.4, box: [52, 296, 132, 108], label: "ห้องแสง" },
    scatter: { cx: 135, cy: 318, z: 1.45, box: [98, 296, 36, 82], label: "แสงกระเจิง" },
    compare: { cx: 135, cy: 240, z: 1.0 },
    fact: { cx: 105, cy: 125, z: 1.4, box: [4, 122, 38, 16], label: "บุหรี่มวนเดียว" },
    test: { cx: 140, cy: 140, z: 1.6, box: [118, 196, 24, 16], label: "ปุ่มทดสอบ" },
    life: { cx: 135, cy: 320, z: 1.5, box: [30, 430, 210, 40], label: "ทุกสิบปี" },
    end: { cx: 135, cy: 240, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = STATE[cue] || STATE.all;
    const e = ease(cl(p));
    const g = (k: keyof St) => lerp(A[k], B[k], e);
    const st: St = { sa: g("sa"), sb: g("sb"), fa: g("fa"), fb: g("fb"), btn: g("btn"), cig: g("cig") > 0.5 ? 1 : 0, life: g("life"), big: g("big") };
    // ปุ่มทดสอบ: กดแล้วค้าง จนเสียงดัง
    if (cue === "test") st.btn = cl(p * 3);
    const o: string[] = [DEFS, EXTRA];
    o.push(`<rect x="-140" y="-140" width="550" height="800" fill="url(#wall)"/>`);
    // เพดาน
    for (const dy of [0, 214]) {
      o.push(`<rect x="-140" y="${dy - 140}" width="550" height="${182}" fill="url(#ceil)"/>`);
      o.push(`<rect x="-140" y="${dy + 40}" width="550" height="3" fill="#8a8272"/>`);
      o.push(`<rect x="130" y="${dy + 41}" width="10" height="3" fill="#6e7a93"/>`);
    }
    o.push(`<g>${panelA(st, ph, cue)}</g>`);
    o.push(`<g transform="translate(0 214)">${panelB(st, ph, cue)}</g>`);
    // ป้ายหัวแผง
    o.push(`<g ${F} font-weight="900" text-anchor="middle"><rect x="46" y="9" width="178" height="22" rx="11" fill="#27324f" opacity=".92"/><text x="135" y="24.5" font-size="11.5" fill="#ffe14a">แบบไอออไนซ์</text>`);
    o.push(`<rect x="36" y="223" width="198" height="22" rx="11" fill="#27324f" opacity=".92"/><text x="135" y="238.5" font-size="11.5" fill="#ffe14a">แบบโฟโตอิเล็กทริก</text></g>`);
    // เปรียบเทียบขนาดอนุภาค
    if (cue === "compare") {
      o.push(lbl(135, 218, "ไฟลุกไหม้ → ควันอนุภาคเล็กมาก", 7.5, "#a31f1f"));
      o.push(lbl(135, 438, "ไฟคุ (ไร้เปลว) → ควันอนุภาคใหญ่กว่า", 7.5, "#27324f"));
    }
    // ป้ายอายุ 10 ปี
    if (st.life > 0.01) {
      const a = cl(st.life * 2);
      o.push(`<g opacity="${f2(a)}"><rect x="30" y="430" width="210" height="40" rx="7" fill="#fffdf5" stroke="#8a8272" stroke-width="1.2" filter="url(#sh2)"/>`);
      o.push(`<text x="40" y="443" font-size="8" ${F} font-weight="800" fill="#27324f">นับจากวันผลิต</text>`);
      const k = Math.floor(cl((cue === "life" ? p : 1) * 1.15) * 10);
      for (let i = 0; i < 10; i++) o.push(`<rect x="${40 + i * 19}" y="451" width="16" height="12" rx="2" fill="${i < k ? (i === 9 ? "#e24b4b" : "#7bd6a0") : "#e6e0d0"}" stroke="#8a8272" stroke-width=".6"/><text x="${48 + i * 19}" y="460" font-size="7" ${F} font-weight="800" text-anchor="middle" fill="#27324f">${i + 1}</text>`);
      o.push(`<text x="236" y="443" font-size="7.5" ${F} font-weight="800" fill="#d6232a" text-anchor="end">ครบ 10 ปี → เปลี่ยนทั้งเครื่อง</text></g>`);
    }
    o.push(box(SCENE_SMOKE.focus[cue]?.box, ph));
    return o.join("");
  },
};
void mixc;
