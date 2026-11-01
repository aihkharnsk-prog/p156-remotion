// ฉากอธิบาย: กระทะสแตนเลส — ผิวโลหะขรุขระระดับจุลภาค, โปรตีนจับผิวตอนกระทะเย็น, อุ่นกระทะ + ฟิล์มน้ำมัน + ไลเดนฟรอสต์ — SVG พิกัด 270x480
// มุมมองหลัก: M = กระทะบนเตา (ตัดข้าง), U = หน้าตัดผิวโลหะขยายมาก, L = หน้าตัดก้นกระทะสามชั้น, E = สรุปสมการ, N = ผิวกระทะที่สึก
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#fff", anchor = "middle", w = 800) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, fill = "#fff6c9", size = 7.4) => {
  const w = s.length * size * 0.66 + 12;
  return `<rect x="${f2(x - w / 2)}" y="${f2(y - size - 1.5)}" width="${f2(w)}" height="${f2(size + 6)}" rx="${f2((size + 6) / 2)}" fill="${fill}" stroke="#2b2230" stroke-width=".9" opacity=".97"/>` + txt(x, y + 0.8, s, size, "#2b2230");
};
const lead = (x1: number, y1: number, x2: number, y2: number, c = "#fff") => `<path d="M${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)}" stroke="${c}" stroke-width=".8" fill="none"/><circle cx="${f2(x2)}" cy="${f2(y2)}" r="1.5" fill="${c}"/>`;
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));
const qb = (a: Pt, c: Pt, b: Pt, u: number): Pt => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; };

const ORDER = ["all", "rough", "stick", "preheat", "water", "leid", "oil", "food", "crust", "cold", "layers", "notnon", "nudge", "end"];
const KIND: Record<string, string> = { all: "M", rough: "U", stick: "U", preheat: "M", water: "M", leid: "U", oil: "U", food: "U", crust: "U", cold: "U", layers: "L", notnon: "E", nudge: "N", end: "M" };
// จุดที่ต้องการให้อยู่กลางภาพส่วนบน (ซับอยู่ล่าง) -> cy ชดเชยด้วย (240-150)/z
const fc = (x: number, y: number, z = 1) => ({ cx: x, cy: y + 90 / z, z });

const DEFS = `<defs>
<linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d2433"/><stop offset="1" stop-color="#14101b"/></linearGradient>
<linearGradient id="smet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d889f"/><stop offset=".3" stop-color="#d8dfee"/><stop offset=".55" stop-color="#9aa5bd"/><stop offset="1" stop-color="#6c778f"/></linearGradient>
<linearGradient id="smetv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6cee0"/><stop offset=".5" stop-color="#8f9ab3"/><stop offset="1" stop-color="#5f6a84"/></linearGradient>
<linearGradient id="salu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1c98a"/><stop offset="1" stop-color="#d89a52"/></linearGradient>
<linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd84a" stop-opacity=".95"/><stop offset="1" stop-color="#f0a21c" stop-opacity=".95"/></linearGradient>
<linearGradient id="smeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7c2b4"/><stop offset="1" stop-color="#e7938a"/></linearGradient>
<radialGradient id="sglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
</defs>`;
const bg = (ph: number) => {
  let s = `<rect x="-200" y="-200" width="670" height="880" fill="url(#sbg)"/>`;
  for (let i = 0; i < 18; i++) {
    const x = rnd(i) * 270, y = 480 - ((ph * (3 + rnd(i + 9) * 5) + rnd(i + 4) * 480) % 480);
    s += `<circle cx="${f2(x + Math.sin(ph + i) * 4)}" cy="${f2(y)}" r="${f2(1 + rnd(i + 2) * 2)}" fill="#ffc98a" opacity="${f2(0.06 + 0.06 * rnd(i + 7))}"/>`;
  }
  return s;
};

// ---------- ไฟเตา ----------
const flame = (cx: number, w: number, y0: number, h: number, ph: number, pw: number) => {
  if (pw < 0.02) return "";
  let s = "";
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = cx - w / 2 + ((i + 0.5) * w) / n;
    const hh = h * pw * (0.6 + 0.4 * Math.sin(ph * 13 + i * 1.9)) * (1 - Math.abs(i - (n - 1) / 2) / n * 0.7);
    s += `<path d="M${f2(x - 4)} ${y0} Q${f2(x - 3)} ${f2(y0 - hh * 0.55)} ${f2(x + Math.sin(ph * 9 + i) * 1.5)} ${f2(y0 - hh)} Q${f2(x + 3)} ${f2(y0 - hh * 0.55)} ${f2(x + 4)} ${y0} Z" fill="#ff8a2a"/>`;
    s += `<path d="M${f2(x - 2)} ${y0} Q${f2(x - 1.4)} ${f2(y0 - hh * 0.35)} ${f2(x)} ${f2(y0 - hh * 0.6)} Q${f2(x + 1.4)} ${f2(y0 - hh * 0.35)} ${f2(x + 2)} ${y0} Z" fill="#ffe27a"/>`;
  }
  return s;
};

// ================= M: กระทะบนเตา (หน้าตัดด้านข้าง) =================
const PY = 170; // พื้นในกระทะ
const pan = (ph: number, heat: number, inner: string, over = "") => {
  const o: string[] = [];
  o.push(`<rect x="-20" y="236" width="310" height="60" fill="#3a3040"/><rect x="-20" y="232" width="310" height="5" fill="#574a60"/>`);
  o.push(`<rect x="52" y="214" width="166" height="18" rx="4" fill="#26212d" stroke="#0f0c14" stroke-width="1"/>`);
  o.push(`<ellipse cx="135" cy="${f2(206)}" rx="${f2(40 + 70 * heat)}" ry="${f2(10 + 24 * heat)}" fill="url(#sglow)" opacity="${f2(0.25 + 0.7 * heat)}"/>`);
  o.push(flame(135, 120, 214, 36, ph, 0.25 + 0.75 * heat));
  // ตัวกระทะ
  const hot = mixc("#9aa5bd", "#ffb177", 0.55 * heat);
  o.push(`<path d="M42 116 L55 ${PY} L55 188 Q55 191 59 191 H211 Q215 191 215 188 V${PY} L228 116 H220 L208 ${PY - 2} H62 L50 116 Z" fill="${hot}" stroke="#2a2433" stroke-width="1.2"/>`);
  o.push(`<rect x="55" y="${PY}" width="160" height="5.5" fill="#cdd5e6" opacity=".9"/><rect x="55" y="${PY + 5.5}" width="160" height="7" fill="url(#salu)"/><rect x="55" y="${PY + 12.5}" width="160" height="5.5" fill="#aeb8cf"/>`);
  o.push(`<path d="M44 117 L56 ${PY - 1}" stroke="#eef2fb" stroke-width="1.4" opacity=".7"/>`);
  o.push(`<path d="M228 120 L262 106 L264 114 L228 128 Z" fill="#3b3346" stroke="#1a1520" stroke-width="1"/><circle cx="231" cy="123" r="1.6" fill="#cdd5e6"/>`);
  o.push(inner);
  // ไอร้อน
  if (heat > 0.5) for (let i = 0; i < 6; i++) {
    const x = 70 + i * 26, u = (ph * 0.7 + rnd(i) * 3) % 1;
    o.push(`<path d="M${x} ${f2(PY - 6 - u * 46)} q4 -5 0 -10 q-4 -5 0 -10" stroke="#ffd9a8" stroke-width="1.3" fill="none" opacity="${f2((1 - u) * 0.5 * (heat - 0.5) * 2)}"/>`);
  }
  o.push(over);
  return o.join("");
};
const eggAt = (x: number, y: number, k = 1, slide = 0) =>
  `<g transform="translate(${f2(x)} ${f2(y)}) scale(${k})"><path d="M-30 0 Q-34 -9 -12 -10 Q2 -16 20 -9 Q36 -6 30 0 Z" fill="#fffdf4" stroke="#d9d2bd" stroke-width=".8"/><circle cx="${f2(-2 + slide * 0)}" cy="-9" r="8" fill="#ffb81c" stroke="#e08a00" stroke-width=".7"/><circle cx="-5" cy="-12" r="2.2" fill="#fff0a8" opacity=".8"/></g>`;
const spatula = (x: number, y: number, rot: number) =>
  `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)})"><rect x="-1.6" y="-60" width="3.2" height="46" rx="1.4" fill="#4a3d56"/><path d="M-14 -14 H14 L11 4 H-11 Z" fill="#c9d1e3" stroke="#2a2433" stroke-width=".9"/></g>`;
const thermo = (x: number, v: number) =>
  `<rect x="${x}" y="70" width="9" height="108" rx="4.5" fill="#201a28" stroke="#fff" stroke-width=".8" opacity=".95"/><rect x="${x + 2}" y="${f2(176 - 104 * v)}" width="5" height="${f2(104 * v)}" rx="2.5" fill="${mixc("#6fb6ff", "#ff6a3a", v)}"/><circle cx="${x + 4.5}" cy="184" r="8" fill="${mixc("#6fb6ff", "#ff6a3a", v)}" stroke="#fff" stroke-width=".8"/><path d="M${x - 3} ${f2(176 - 104 * 0.82)} H${x + 12}" stroke="#ffe27a" stroke-width="1" stroke-dasharray="2 1.5"/>`;

const viewM = (c: string, ph: number, p: number): string => {
  if (c === "all") {
    const shake = Math.sin(ph * 16) * 2.2 * (1 - 0.3 * p);
    const inner = eggAt(112, PY, 1) + `<ellipse cx="112" cy="${PY + 0.5}" rx="40" ry="1.6" fill="#f0a21c" opacity=".75"/>` + spatula(150 + shake, PY - 1, 42 + Math.sin(ph * 16) * 3);
    const over = pill(135, 70, "ไข่ติดกระทะ!", "#ffd8cf", 9) + `<path d="M118 ${PY - 22} l-5 -7 M126 ${PY - 26} l-1 -9 M134 ${PY - 22} l5 -7" stroke="#ff6a5a" stroke-width="1.4" stroke-linecap="round" opacity="${f2(0.5 + 0.5 * Math.sin(ph * 12))}"/>`;
    return pan(ph, 0.35, inner, over);
  }
  if (c === "end") {
    // ไข่ไหลลื่น
    const u = (ph * 0.45) % 1, x = lerp(80, 150, sm(0.1, 0.9, u));
    const inner = eggAt(x, PY, 1) + `<ellipse cx="${f2(x)}" cy="${PY + 0.5}" rx="42" ry="1.6" fill="#f0a21c" opacity=".7"/>`;
    let sp = ""; for (let i = 0; i < 6; i++) { const a = ph * 3 + i * 1.05; sp += `<path d="M${f2(135 + Math.cos(a) * 70)} ${f2(110 + Math.sin(a * 1.3) * 22)} l0 -4 m-2 2 h4" stroke="#ffe27a" stroke-width="1.3" opacity="${f2(0.4 + 0.6 * Math.abs(Math.sin(a * 2)))}"/>`; }
    return pan(ph, 0.55, inner, sp + pill(135, 70, "ไข่ไหลลื่น", "#d9ffd0", 9));
  }
  if (c === "preheat") {
    const heat = sm(0.05, 0.95, p);
    const wave = Array.from({ length: 5 }, (_, i) => `<path d="M${72 + i * 30} ${PY - 4} q5 -6 0 -12 q-5 -6 0 -12" stroke="#ffd9a8" stroke-width="1.1" fill="none" opacity="${f2(0.55 * heat)}" transform="translate(0 ${f2(-((ph * 14 + i * 7) % 20))})"/>`).join("");
    const over = thermo(22, heat) + pill(135, 66, "อุ่นกระทะเปล่าก่อน", "#fff6c9", 9) + txt(38, 62, "ร้อนพอ", 6.4, "#ffe27a", "start");
    return pan(ph, heat, wave, over);
  }
  // water
  const ready = sm(0.45, 0.6, p);
  const heat = lerp(0.55, 0.9, ready);
  let drops = "";
  for (let i = 0; i < 3; i++) {
    const bx = 92 + i * 42;
    if (ready < 0.5) {
      // น้ำแบนติดผิว ฟู่เป็นไอ
      const life = (ph * 0.8 + i * 0.3) % 1;
      drops += `<ellipse cx="${bx}" cy="${PY - 1}" rx="${f2(8 * (1 - life * 0.7))}" ry="${f2(2.2 * (1 - life * 0.6))}" fill="#9fd8ff" opacity="${f2(0.9)}"/>`;
      for (let k = 0; k < 3; k++) { const u = (life * 1.5 + k / 3) % 1; drops += `<circle cx="${f2(bx + Math.sin(k * 3 + ph * 4) * 5)}" cy="${f2(PY - 4 - u * 22)}" r="${f2(1.2 + u * 2.6)}" fill="#fff" opacity="${f2((1 - u) * 0.6)}"/>`; }
    } else {
      const rx = bx + Math.sin(ph * 2.2 + i * 2.1) * 26, bob = Math.sin(ph * 6 + i) * 0.8;
      drops += `<ellipse cx="${f2(rx)}" cy="${f2(PY - 6.2 + bob)}" rx="6.4" ry="6.2" fill="#9fd8ff" stroke="#e9f7ff" stroke-width=".8"/><circle cx="${f2(rx - 2)}" cy="${f2(PY - 8.2 + bob)}" r="1.7" fill="#fff" opacity=".9"/>`;
    }
  }
  const over = ready < 0.5 ? pill(135, 66, "ยังไม่ร้อน: น้ำฟู่หายเร็ว", "#ffd8cf", 8.6) : pill(135, 66, "ร้อนพอ: น้ำกลิ้งเป็นเม็ด", "#d9ffd0", 8.6);
  return pan(ph, heat, drops, over + thermo(22, ready < 0.5 ? 0.55 : 0.88));
};

// ================= U: หน้าตัดผิวโลหะขยาย =================
const surfAt = (x: number, m: number) => 214 + m * (11 * Math.sin(x * 0.11 + 0.5) + 6.5 * Math.sin(x * 0.29 + 1.7) + 3.4 * Math.sin(x * 0.61 + 0.3));
const PEAKS: number[] = [], VALS: number[] = [];
for (let x = 6; x < 266; x += 1) {
  const a = surfAt(x - 1, 1), b = surfAt(x, 1), d = surfAt(x + 1, 1);
  if (b < a && b < d) PEAKS.push(x);
  if (b > a && b > d) VALS.push(x);
}
let SY0 = 999, SY1 = 0;
for (let x = 0; x <= 270; x++) { SY0 = Math.min(SY0, surfAt(x, 1)); SY1 = Math.max(SY1, surfAt(x, 1)); }
const metal = (m: number, tint: string) => {
  let d = `M-10 ${f2(surfAt(-10, m))}`;
  for (let x = -6; x <= 280; x += 3) d += ` L${x} ${f2(surfAt(x, m))}`;
  d += " L280 560 L-10 560 Z";
  let g = "";
  for (let i = 0; i < 26; i++) g += `<path d="M${f2(rnd(i) * 270)} ${f2(SY1 + 14 + rnd(i + 3) * 160)} l${f2(8 + rnd(i + 5) * 14)} ${f2(rnd(i + 8) * 5 - 2.5)}" stroke="#5f6a84" stroke-width=".6" opacity=".45"/>`;
  return `<path d="${d}" fill="url(#smetv)" stroke="#2a2433" stroke-width="1.2"/>` + (tint ? `<path d="${d}" fill="${tint}" opacity=".5"/>` : "") + g;
};
const foodBlock = (yb: number, col1: string, col2: string, crust = 0) => {
  const top = yb - 52;
  let s = `<rect x="22" y="${top}" width="226" height="${f2(yb - top)}" rx="8" fill="${col1}" stroke="#7a3a38" stroke-width="1"/>`;
  s += `<rect x="22" y="${f2(yb - 11)}" width="226" height="11" rx="5" fill="${col2}" opacity="${f2(0.35 + 0.65 * crust)}"/>`;
  for (let i = 0; i < 7; i++) s += `<path d="M${34 + i * 32} ${top + 8} q10 14 0 28" stroke="#d9786f" stroke-width=".9" fill="none" opacity=".5"/>`;
  return s;
};
// สายโปรตีน: ปล่อยจากท้องอาหารลงไปจับร่องตามความคืบ k (0..1)
const strands = (yb: number, k: number, ph: number, col = "#ff7a4a") => {
  let s = "";
  const n = Math.min(VALS.length, 9);
  for (let i = 0; i < n; i++) {
    const vx = VALS[i * Math.floor(VALS.length / n)], vy = surfAt(vx, 1) - 1;
    const a: Pt = [vx + (rnd(i + 20) - 0.5) * 16, yb], b: Pt = [vx, vy];
    const kk = cl(k * 1.3 - rnd(i) * 0.3);
    if (kk <= 0.01) continue;
    let d = `M${f2(a[0])} ${f2(a[1])}`;
    for (let u = 0.1; u <= kk + 0.001; u += 0.1) { const q = qb(a, [a[0] + 8 * Math.sin(i), (a[1] + b[1]) / 2], b, u); d += ` L${f2(q[0] + Math.sin(u * 14 + ph * 3 + i) * 1.4)} ${f2(q[1])}`; }
    s += `<path d="${d}" stroke="${col}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    if (kk > 0.95) s += `<circle cx="${vx}" cy="${f2(vy)}" r="${f2(2.1 + Math.sin(ph * 6 + i) * 0.5)}" fill="#ff3a2a" stroke="#fff" stroke-width=".6"/>`;
  }
  return s;
};
const magn = (ph: number) => `<g opacity=".95"><circle cx="232" cy="104" r="13" fill="none" stroke="#ffe27a" stroke-width="2.4"/><path d="M241 113 L252 124" stroke="#ffe27a" stroke-width="3.2" stroke-linecap="round"/><path d="M226 104 q3 -6 9 -3" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/></g>`;

const viewU = (c: string, ph: number, p: number): string => {
  const o: string[] = [];
  let m = 1;
  if (c === "rough") m = sm(0.08, 0.6, p);
  const tint = c === "cold" ? "#6fa8ff" : c === "preheat" ? "#ff9a5a" : "";
  if (c === "rough") {
    o.push(`<rect x="0" y="80" width="270" height="${f2(surfAt(0, 0) - 80)}" fill="#1c1624" opacity=".0"/>`);
    o.push(metal(m, ""));
    // ไฮไลต์เงามัน
    o.push(`<path d="M0 ${f2(surfAt(0, m) - 1)} ${Array.from({ length: 60 }, (_, i) => `L${i * 4.6} ${f2(surfAt(i * 4.6, m) - 1)}`).join(" ")}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".6"/>`);
    o.push(magn(ph));
    o.push(pill(135, 98, m < 0.5 ? "ผิวเรียบเป็นเงา" : "ขยายดู: ขรุขระ!", m < 0.5 ? "#fff6c9" : "#ffd8cf", 9));
    if (m > 0.8) {
      const pe = PEAKS[3], va = VALS[4];
      o.push(lead(pe, surfAt(pe, 1), pe + 24, 160) + pill(pe + 24, 158, "เนิน", "#e7efff", 7.4));
      o.push(lead(va, surfAt(va, 1), va - 26, 232) + pill(va - 26, 246, "ร่อง", "#e7efff", 7.4));
    }
    return o.join("");
  }
  if (c === "leid") {
    o.push(metal(1, "#ff9a5a"));
    // กลิ้งเม็ดน้ำบนชั้นไอ
    const bx = 135 + Math.sin(ph * 2) * 40, by = SY0 - 38 + Math.sin(ph * 5) * 1.2;
    for (let i = 0; i < 26; i++) {
      const u = (ph * 0.9 + rnd(i) * 3) % 1, side = i % 2 ? 1 : -1;
      const x0 = bx + (rnd(i + 5) - 0.5) * 36;
      o.push(`<circle cx="${f2(x0 + side * u * 60)}" cy="${f2(by + 28 - u * 6 + (rnd(i + 2) - 0.5) * 3)}" r="${f2(1.2 + rnd(i + 4))}" fill="#fff" opacity="${f2((1 - u) * 0.8)}"/>`);
    }
    o.push(`<ellipse cx="${f2(bx)}" cy="${f2(by)}" rx="30" ry="${f2(28 + Math.sin(ph * 5) * 0.6)}" fill="#9fd8ff" stroke="#e9f7ff" stroke-width="1.2"/><ellipse cx="${f2(bx - 10)}" cy="${f2(by - 12)}" rx="7" ry="4" fill="#fff" opacity=".7" transform="rotate(-25 ${f2(bx - 10)} ${f2(by - 12)})"/>`);
    o.push(`<path d="M${f2(bx - 34)} ${f2(by + 31)} H${f2(bx + 34)}" stroke="#ffffff" stroke-width="2" opacity=".35"/>`);
    o.push(lead(bx + 42, by + 30, 218, 96, "#fff") + pill(206, 92, "ชั้นไอรองใต้เม็ดน้ำ", "#fff6c9", 7.6));
    o.push(pill(135, 70, "เม็ดน้ำลอยบนไอ", "#d9ffd0", 9));
    return o.join("");
  }
  // อาหาร + ผิวโลหะ
  const lvlOil = c === "oil" ? lerp(SY1 + 4, SY0 - 3, sm(0.12, 0.7, p)) : c === "food" || c === "crust" ? SY0 - 3 : c === "cold" ? lerp(SY0 - 3, SY0 + 14, sm(0.1, 0.8, p)) : SY1 + 30;
  const hasOil = c === "oil" || c === "food" || c === "crust" || c === "cold";
  if (hasOil) o.push(`<rect x="-10" y="${f2(lvlOil)}" width="290" height="140" fill="url(#soil)"/>`);
  o.push(metal(1, tint));
  if (hasOil) {
    for (let i = 0; i < 8; i++) o.push(`<circle cx="${f2(14 + rnd(i) * 245)}" cy="${f2(lvlOil + 2 + rnd(i + 3) * 6)}" r="${f2(0.8 + rnd(i + 2))}" fill="#fff8c0" opacity="${f2(0.25 + 0.4 * Math.abs(Math.sin(ph * 2 + i)))}"/>`);
    o.push(`<path d="M-10 ${f2(lvlOil)} H280" stroke="#fff3a8" stroke-width="1.3" opacity=".8"/>`);
  }
  if (c === "oil") {
    const warm = sm(0.05, 0.5, p);
    o.push(`<path d="M30 130 q8 8 0 16 M60 128 q8 8 0 16" stroke="#ffd9a8" stroke-width="1.2" fill="none" opacity="${f2(warm * 0.6)}"/>`);
    o.push(`<g transform="translate(228 108)"><path d="M-6 -22 Q0 -34 6 -22 Q9 -12 0 -8 Q-9 -12 -6 -22 Z" fill="url(#soil)" stroke="#a86c10" stroke-width=".8"/></g>`);
    // หยดน้ำมันหยดลงร่อง
    for (let i = 0; i < 3; i++) { const u = (ph * 0.7 + i / 3) % 1; if (p < 0.8) o.push(`<ellipse cx="${f2(228 - 18 * u - i * 4)}" cy="${f2(130 + u * 52)}" rx="2.3" ry="3" fill="#ffc83a"/>`); }
    o.push(pill(135, 96, p < 0.5 ? "น้ำมันร้อนบางและเหลว" : "ไหลเกลี่ยลงทุกร่อง", "#fff6c9", 8.6));
    return o.join("");
  }
  if (c === "stick" || c === "cold") {
    const cold = c === "cold" ? sm(0.1, 0.7, p) : 0.0;
    const k = c === "stick" ? sm(0.1, 0.8, p) : sm(0.3, 0.9, p);
    const yb = c === "stick" ? lerp(SY0 - 36, SY0 - 1, sm(0, 0.35, p)) : SY0 - 1;
    const base = c === "cold" ? mixc("#f7c2b4", "#bcd8ff", 0.8) : "#f7c2b4";
    o.push(foodBlock(yb, c === "cold" ? mixc("#e7938a", "#8fb7ee", 0.8) : "url(#smeat)", base));
    if (c === "cold") for (let i = 0; i < 14; i++) o.push(`<circle cx="${f2(30 + rnd(i) * 210)}" cy="${f2(yb - 48 + rnd(i + 4) * 44)}" r="1.3" fill="#fff" opacity=".7"/>`);
    o.push(strands(yb, k, ph));
    if (c === "cold") {
      o.push(`<rect x="22" y="${f2(yb)}" width="226" height="4" fill="#bcd8ff" opacity="${f2(0.35 * cold)}"/>`);
      o.push(pill(135, 76, "ของเย็นจัด ดึงความร้อนผิวกระทะ", "#e0eeff", 8.4));
      o.push(pill(135, 98, "ฟิล์มบางลง โปรตีนจับร่องอีก", "#ffd8cf", 8.4));
    } else {
      o.push(pill(135, 76, "กระทะเย็น + อาหารสด", "#e0eeff", 9));
      o.push(pill(135, 98, k > 0.6 ? "โปรตีนยึดติดโลหะ" : "โปรตีนจับตัวเมื่อโดนความร้อน", "#ffd8cf", 8.4));
    }
    return o.join("");
  }
  if (c === "food") {
    const yb = SY0 - 7 - Math.sin(ph * 5) * 0.4;
    o.push(foodBlock(yb, "url(#smeat)", "#f0b098", 0.2));
    // ไอน้ำใต้ท้องอาหาร
    for (let i = 0; i < 16; i++) {
      const u = (ph * 0.8 + rnd(i) * 4) % 1, x0 = 40 + rnd(i + 3) * 190;
      o.push(`<circle cx="${f2(x0 + Math.sin(u * 8 + i) * 6)}" cy="${f2(yb + 3 - u * 0 + Math.sin(u * 5) * 1.2)}" r="${f2(1 + rnd(i + 5) * 1.8)}" fill="#fff" opacity="${f2(0.75 * (1 - u * u))}" transform="translate(${f2((x0 > 135 ? 1 : -1) * u * 26)} 0)"/>`);
    }
    o.push(lead(40, 190, 18, 126) + pill(28, 122, "ฟิล์มน้ำมัน", "#fff6c9", 7.6));
    o.push(lead(200, yb + 3, 226, 96) + pill(214, 92, "ไอน้ำใต้อาหาร", "#e7f6ff", 7.6));
    o.push(pill(135, 70, "ฟิล์มกันโปรตีนไม่ให้แตะโลหะ", "#d9ffd0", 8.4));
    return o.join("");
  }
  // crust
  const cr = sm(0.05, 0.7, p), lift = sm(0.55, 1, p);
  const yb = SY0 - 6 - lift * 26 - Math.sin(ph * 4) * 0.3;
  o.push(foodBlock(yb, mixc("#f7c2b4", "#e9a77f", cr), mixc("#e8b88a", "#a8571f", cr), cr));
  for (let i = 0; i < 9; i++) o.push(`<circle cx="${f2(30 + i * 26 + rnd(i) * 8)}" cy="${f2(yb - 2 - rnd(i + 3) * 5)}" r="${f2(1.5 + rnd(i + 2) * 1.6)}" fill="#7a3a12" opacity="${f2(0.55 * cr)}"/>`);
  if (lift > 0.1) o.push(`<path d="M135 ${f2(yb - 60)} l0 -18 m-6 7 l6 -9 l6 9" stroke="#ffe27a" stroke-width="2" fill="none" stroke-linecap="round" opacity="${f2(lift)}" transform="translate(0 ${f2(Math.sin(ph * 6) * 1.5)})"/>`);
  o.push(pill(135, 70, lift < 0.2 ? "ผิวสุกเป็นเปลือก" : "หลุดจากกระทะเอง", lift < 0.2 ? "#fff6c9" : "#d9ffd0", 9.4));
  return o.join("");
};

// ================= L: ก้นกระทะสามชั้น =================
const viewL = (ph: number, p: number): string => {
  const o: string[] = [];
  const top = 146;
  o.push(`<rect x="14" y="${top}" width="242" height="18" fill="#c3cbde" stroke="#2a2433" stroke-width="1"/>`);
  o.push(`<rect x="14" y="${top + 18}" width="242" height="30" fill="url(#salu)" stroke="#2a2433" stroke-width="1"/>`);
  o.push(`<rect x="14" y="${top + 48}" width="242" height="18" fill="#aab4cb" stroke="#2a2433" stroke-width="1"/>`);
  // เตาร้อนเฉพาะจุดกลาง
  o.push(`<ellipse cx="135" cy="${top + 80}" rx="${f2(30 + 20 * Math.sin(ph * 4) * 0.2)}" ry="16" fill="url(#sglow)"/>`);
  o.push(flame(135, 60, top + 94, 26, ph, 1));
  // จุดความร้อนไหลออกด้านข้างในชั้นอะลูมิเนียม
  for (let i = 0; i < 36; i++) {
    const side = i % 2 ? 1 : -1, u = (ph * 0.55 + i / 36 * 3) % 1;
    const x = 135 + side * u * 112, y = top + 22 + ((i * 7) % 22) + Math.sin(u * 10 + i) * 1;
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(1.5 + (1 - u) * 1.3)}" fill="#ff5a2a" opacity="${f2(0.95 - u * 0.5)}"/>`);
  }
  const stk = (x: number, y: number, t: string, sz: number) => `<text x="${x}" y="${y}" font-size="${sz}" ${K} font-weight="800" fill="#2a2433" stroke="#fff6e0" stroke-width="2.4" paint-order="stroke" stroke-linejoin="round">${t}</text>`;
  o.push(stk(22, top + 12, "สแตนเลส", 7) + stk(22, top + 62, "สแตนเลส", 7) + stk(22, top + 30, "อะลูมิเนียม", 7.6));
  const k = sm(0.2, 0.9, p);
  // ความร้อนขึ้นไปที่ผิวแบบสม่ำเสมอ
  for (let i = 0; i < 9; i++) {
    const x = 34 + i * 25;
    o.push(`<path d="M${x} ${top - 2} v${f2(-14 - 5 * Math.sin(ph * 3 + i))}" stroke="#ff9a5a" stroke-width="2" stroke-linecap="round" opacity="${f2(k * 0.9)}"/><path d="M${x - 3} ${f2(top - 12 - 5 * Math.sin(ph * 3 + i))} l3 -5 l3 5" stroke="#ff9a5a" stroke-width="2" fill="none" stroke-linecap="round" opacity="${f2(k * 0.9)}"/>`);
  }
  o.push(pill(135, 96, "แกนอะลูมิเนียมกระจายความร้อน", "#fff6c9", 8.8));
  o.push(pill(135, 118, k > 0.4 ? "ผิวกระทะร้อนทั่วกัน" : "ไม่ร้อนแค่จุดเดียว", "#d9ffd0", 8.4));
  return o.join("");
};

// ================= E: สมการสรุป =================
const viewE = (ph: number, p: number): string => {
  const o: string[] = [];
  const Y = 120;
  const card = (x: number, w: number, title: string, body: string, a = 1) => `<g opacity="${f2(a)}"><rect x="${x}" y="${Y - 38}" width="${w}" height="76" rx="9" fill="#2f2538" stroke="#ffd27a" stroke-width="1.2"/>${body}${txt(x + w / 2, Y + 32, title, 7.4, "#ffe9c0")}</g>`;
  const a1 = sm(0.05, 0.25, p), a2 = sm(0.3, 0.5, p), a3 = sm(0.55, 0.8, p);
  o.push(card(10, 70, "ความร้อนพอดี", flame(45, 36, Y + 12, 34, ph, 1), a1));
  o.push(`<g opacity="${f2(a2)}">${txt(88, Y + 6, "+", 20, "#ffd27a")}</g>`);
  o.push(card(98, 70, "ฟิล์มน้ำมัน", `<path d="M133 ${Y - 24} Q143 ${Y - 8} 133 ${Y + 6} Q123 ${Y - 8} 133 ${Y - 24} Z" fill="url(#soil)" stroke="#a86c10" stroke-width=".8"/><path d="M110 ${Y + 14} q6 -4 12 0 t12 0 t12 0 t12 0" stroke="#ffc83a" stroke-width="2" fill="none"/>`, a2));
  o.push(`<g opacity="${f2(a3)}">${txt(176, Y + 6, "=", 20, "#ffd27a")}</g>`);
  const x = lerp(0, 22, (ph * 0.5) % 1);
  o.push(card(186, 74, "ไม่ติด", `<rect x="196" y="${Y + 6}" width="54" height="4" rx="2" fill="#9aa5bd"/><g transform="translate(${f2(212 + x)} ${Y + 6}) scale(.7)"><path d="M-30 0 Q-34 -9 -12 -10 Q2 -16 20 -9 Q36 -6 30 0 Z" fill="#fffdf4" stroke="#d9d2bd" stroke-width=".8"/><circle cx="-2" cy="-9" r="8" fill="#ffb81c"/></g>`, a3));
  o.push(pill(135, 210, "ไม่ได้ลื่นเอง แต่ลื่นเพราะทำถูกขั้นตอน", "#fff6c9", 8.4));
  return o.join("");
};

// ================= N: ผิวกระทะที่สึก =================
const viewN = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(`<ellipse cx="135" cy="150" rx="118" ry="66" fill="#5e6983" stroke="#2a2433" stroke-width="1.5"/>`);
  o.push(`<ellipse cx="135" cy="150" rx="106" ry="57" fill="url(#smet)"/>`);
  o.push(`<clipPath id="spc"><ellipse cx="135" cy="150" rx="106" ry="57"/></clipPath>`);
  let burn = "";
  const blobs: [number, number, number, number][] = [[98, 140, 20, 11], [168, 160, 24, 12], [140, 120, 12, 7], [118, 172, 14, 7]];
  for (const [bx, by, rx, ry] of blobs) {
    let d = ""; for (let a = 0; a < 14; a++) { const t = (a / 14) * Math.PI * 2, r = 1 + (rnd(bx + a) - 0.5) * 0.35; d += (a ? " L" : "M") + f2(bx + Math.cos(t) * rx * r) + " " + f2(by + Math.sin(t) * ry * r); }
    burn += `<path d="${d} Z" fill="#3a2414" opacity=".88"/><path d="${d} Z" fill="none" stroke="#7a4a24" stroke-width=".8" opacity=".7"/>`;
  }
  for (let i = 0; i < 22; i++) { const x = 50 + rnd(i) * 170, y = 110 + rnd(i + 3) * 80; burn += `<path d="M${f2(x)} ${f2(y)} l${f2(8 + rnd(i + 6) * 20)} ${f2((rnd(i + 8) - 0.5) * 10)}" stroke="#4d566e" stroke-width=".7" opacity=".7"/>`; }
  o.push(`<g clip-path="url(#spc)">${burn}`);
  // แสงกวาดผ่านผิว
  const sx = lerp(10, 262, (p * 1.6) % 1);
  o.push(`<ellipse cx="${f2(sx)}" cy="150" rx="26" ry="80" fill="#fff" opacity=".28" transform="rotate(18 ${f2(sx)} 150)"/>`);
  o.push(`</g>`);
  o.push(`<path d="M20 150 q5 -66 115 -66" stroke="#eef2fb" stroke-width="2" fill="none" opacity=".4"/>`);
  o.push(lead(168, 160, 232, 220, "#ffd27a") + pill(212, 232, "คราบไหม้เกาะ", "#ffd8cf", 8));
  o.push(lead(100, 124, 40, 232, "#ffd27a") + pill(60, 246, "รอยขีดข่วน", "#ffd8cf", 8));
  o.push(pill(135, 62, "ผิวขรุขระกว่าเดิม", "#fff6c9", 9));
  return o.join("");
};

const draw = (c: string, ph: number, p: number): string => {
  const k = KIND[c];
  if (k === "M") return viewM(c, ph, p);
  if (k === "U") return viewU(c, ph, p);
  if (k === "L") return viewL(ph, p);
  if (k === "E") return viewE(ph, p);
  return viewN(ph, p);
};

export const SCENE_STEELPAN: SceneDef = {
  focus: {
    all: fc(150, 160, 1.0), rough: fc(135, 205, 1.0), stick: fc(135, 190, 1.0), preheat: fc(150, 160, 1.0), water: fc(150, 160, 1.05), leid: fc(135, 190, 1.0),
    oil: fc(135, 200, 1.0), food: fc(135, 190, 1.0), crust: fc(135, 190, 1.0), cold: fc(135, 190, 1.0), layers: fc(135, 185, 1.1), notnon: fc(135, 130, 1.0), nudge: fc(135, 150, 1.0), end: fc(150, 160, 1.0),
  },
  render: ({ frame, cue, p, ef }) => {
    const ph = frame / 30;
    const c = ORDER.includes(cue) ? cue : "all";
    const i = ORDER.indexOf(c), prev = i > 0 ? ORDER[i - 1] : null;
    const e = sm(0, 16, ef);
    const o: string[] = [DEFS, bg(ph)];
    if (prev && e < 1 && KIND[prev] !== KIND[c]) {
      o.push(`<g opacity="${f2(1 - e)}">${draw(prev, ph, 1)}</g><g opacity="${f2(e)}">${draw(c, ph, p)}</g>`);
    } else o.push(draw(c, ph, p));
    return o.join("");
  },
};
