// ฉากอธิบาย: น้ำยาล้างชักโครก (สูตรกรด) ละลายหินปูน + คำเตือนห้ามผสมกับน้ำยาฟอกขาว/คลอรีน — SVG พิกัด 270x480
// โลกแนวตั้งหลายโซน: A = โถส้วมตัดครึ่ง, M = ระดับจุลภาค (หินปูน+กรด), D = ห้ามผสม/ก๊าซคลอรีน, S = ถ้าเผลอผสม, P = ข้อควรระวังตอนใช้, C = ขวดเหลือเท่าไร
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, box } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#2b3350", anchor = "middle", w = 700) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, fill = "#fff6c9") => {
  const w = s.length * 4.5 + 10;
  return `<rect x="${f2(x - w / 2)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".97"/>` + txt(x, y + 0.4, s, 6.4);
};
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));
const OUT = "#3e4d6b";

const DEFS = `<defs>
<linearGradient id="bbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef3fa"/><stop offset="1" stop-color="#dbe4f0"/></linearGradient>
<linearGradient id="bcer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfe7ef"/><stop offset=".45" stop-color="#ffffff"/><stop offset="1" stop-color="#d9e2ec"/></linearGradient>
<linearGradient id="bwat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8f7"/><stop offset="1" stop-color="#5bb3ea"/></linearGradient>
<linearGradient id="bacid" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e45a5a"/><stop offset=".5" stop-color="#f58a7a"/><stop offset="1" stop-color="#cf4646"/></linearGradient>
<linearGradient id="bble" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2dd62"/><stop offset=".5" stop-color="#fff2a1"/><stop offset="1" stop-color="#e0c53c"/></linearGradient>
<linearGradient id="bph" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e53935"/><stop offset=".25" stop-color="#fb8c00"/><stop offset=".5" stop-color="#7cb342"/><stop offset=".75" stop-color="#1e88e5"/><stop offset="1" stop-color="#6a1b9a"/></linearGradient>
<clipPath id="bmic"><rect x="14" y="286" width="242" height="206" rx="12"/></clipPath>
<clipPath id="bbowl"><path d="M44 118 H226 Q228 190 164 228 Q135 244 106 228 Q42 190 44 118Z"/></clipPath>
</defs>`;

const zonePanel = (y0: number, y1: number, fill = "#f6f9fd") => `<rect x="8" y="${y0}" width="254" height="${y1 - y0}" rx="14" fill="${fill}" stroke="#b7c5d8" stroke-width="1.2"/>`;
const bub = (x: number, y: number, r: number, a = 1) =>
  `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#fff" fill-opacity="${f2(0.6 * a)}" stroke="#7aa6c8" stroke-width="${f2(Math.max(0.3, r * 0.12))}" stroke-opacity="${f2(a)}"/>`;
const ion = (x: number, y: number, kind: "H" | "Cl" | "Ca" | "CO3", a = 1, r = 2.6) => {
  const c = kind === "H" ? ["#ff6b6b", "+"] : kind === "Cl" ? ["#5fcf7c", "−"] : kind === "Ca" ? ["#5b9cf0", "2+"] : ["#9aa3b5", "2−"];
  return `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${c[0]}" stroke="#2b3350" stroke-width=".4"/>${txt(x, y + r * 0.42, c[1], r * 1.05, "#fff", "middle", 900)}</g>`;
};

// ---------- โซน A: โถส้วม ----------
const wallPt = (t: number): Pt => { const v = 1 - t; return [v * v * 50 + 2 * v * t * 48 + t * t * 112, v * v * 124 + 2 * v * t * 196 + t * t * 226]; };
const rightPt = (t: number): Pt => { const [x, y] = wallPt(t); return [270 - x, y]; };
const zoneA = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  const hero = cue === "all" || cue === "end";
  o.push(zonePanel(10, 262));
  // โถ
  o.push(`<path d="M34 108 H236 Q240 196 170 236 Q135 254 100 236 Q30 196 34 108Z" fill="url(#bcer)" stroke="#8da0b8" stroke-width="2"/>`);
  o.push(`<path d="M44 118 H226 Q228 190 164 228 Q135 244 106 228 Q42 190 44 118Z" fill="#f2f6fb" stroke="#b9c6d6" stroke-width="1"/>`);
  o.push(`<g clip-path="url(#bbowl)"><rect x="40" y="196" width="190" height="60" fill="url(#bwat)" opacity=".9"/>`);
  // เส้นระดับน้ำ
  o.push(`<path d="M40 196 Q135 199 230 196" stroke="#fff" stroke-width="1.2" opacity=".7" fill="none"/></g>`);
  o.push(`<rect x="30" y="102" width="210" height="10" rx="4" fill="#fff" stroke="#8da0b8" stroke-width="1.6"/>`);
  // ความคืบหน้า: สัดส่วนหินปูนที่เหลือ
  let c = 1, gel = 0, fizz = 0, pour = 0, flush = 0;
  if (hero) { const u = (ph / 7) % 1; pour = u < 0.3 ? sm(0, 0.08, u) * (1 - sm(0.22, 0.3, u)) : 0; gel = sm(0.08, 0.3, u) * (1 - sm(0.8, 0.92, u)); fizz = u > 0.3 && u < 0.8 ? 1 : 0; c = 1 - sm(0.3, 0.8, u); flush = sm(0.82, 0.98, u); }
  else if (cue === "stain") { c = 1; }
  else if (cue === "gel") { gel = 1; fizz = 0.4 + 0.6 * p; c = 1 - 0.4 * p; pour = p < 0.2 ? 1 : 0; }
  else if (cue === "time") { gel = 1 - sm(0.55, 0.8, p); fizz = p < 0.45 ? 1 : 0; c = 1 - sm(0.05, 0.5, p); flush = sm(0.7, 0.95, p); }
  else if (cue === "chk") c = 1;
  // หินปูนตามแนวผนัง
  const seg = (t0: number, t1: number, w: number) => {
    let d = ""; const n = 10;
    for (let i = 0; i <= n; i++) { const t = lerp(t0, t1, i / n), [x, y] = wallPt(t), [rx2] = rightPt(t); void rx2; d += `${i ? "L" : "M"}${f2(x + 1.5 + w * (0.6 + 0.4 * rnd(i + t0 * 9)))} ${f2(y)} `; }
    for (let i = n; i >= 0; i--) { const t = lerp(t0, t1, i / n), [x, y] = wallPt(t); d += `L${f2(x + 0.5)} ${f2(y)} `; }
    return d + "Z";
  };
  const w = 4.2 * c;
  if (c > 0.03) {
    o.push(`<g clip-path="url(#bbowl)"><path d="${seg(0.04, 0.22, w * 0.8)}" fill="#d8c9a0" stroke="#9a8a5c" stroke-width=".7"/><path d="${seg(0.5, 0.74, w * 1.3)}" fill="#d8c9a0" stroke="#9a8a5c" stroke-width=".7"/>`);
    const m = (t0: number, t1: number, ww: number) => { const [x, y] = rightPt(t0), [x2, y2] = rightPt(t1); void x2; void y2; return `<path d="M${f2(x - 0.5)} ${f2(y)} ${Array.from({ length: 11 }, (_, i) => { const t = lerp(t0, t1, i / 10), [px, py] = rightPt(t); return `L${f2(px - ww * (0.6 + 0.4 * rnd(i + t0 * 7)))} ${f2(py)}`; }).join(" ")} L${f2(rightPt(t1)[0] - 0.5)} ${f2(rightPt(t1)[1])}Z" fill="#d8c9a0" stroke="#9a8a5c" stroke-width=".7"/>`; };
    o.push(m(0.04, 0.22, w * 0.8), m(0.5, 0.74, w * 1.3), `</g>`);
  }
  // เจลน้ำยา
  if (gel > 0.02) {
    o.push(`<g clip-path="url(#bbowl)">`);
    for (let i = 0; i < 12; i++) {
      const side = i % 2, t0 = 0.02 + (i / 12) * 0.78, t = cl(t0 + ((ph * 0.012 * (1 + rnd(i)) + rnd(i + 9) * 0.02) % 0.05));
      const [x, y] = side ? rightPt(t) : wallPt(t);
      o.push(`<ellipse cx="${f2(x + (side ? -2.6 : 2.6))}" cy="${f2(y)}" rx="${f2(3.4 * gel)}" ry="${f2(4.2 * gel)}" fill="#c8f2d4" stroke="#4aa86a" stroke-width=".8" opacity=".95"/>`);
    }
    o.push(`</g>`);
  }
  // ฟองฟู่ที่คราบ
  if (fizz > 0.02 && c > 0.05) for (let i = 0; i < 16; i++) {
    const side = i % 2, tt = i % 4 < 2 ? 0.04 + rnd(i) * 0.18 : 0.5 + rnd(i) * 0.24, [x, y] = side ? rightPt(tt) : wallPt(tt);
    const u = (ph * 0.9 + rnd(i + 5)) % 1;
    o.push(bub(x + (side ? -3 : 3) + (side ? -1 : 1) * u * 5, y - u * 11, 0.9 + rnd(i + 2) * 1.2, fizz * (1 - u)));
  }
  // ขวดเทเจล
  if (pour > 0.02) {
    o.push(`<g transform="translate(70 62) rotate(${f2(120 * sm(0, 1, pour))})"><rect x="-13" y="-26" width="26" height="40" rx="6" fill="#e7f5ff" stroke="${OUT}" stroke-width="1.6"/><rect x="-6" y="-34" width="12" height="9" rx="2" fill="#6aa0d8" stroke="${OUT}" stroke-width="1.2"/><rect x="-10" y="-14" width="20" height="18" rx="2" fill="#fff" stroke="#9db0c8" stroke-width=".8"/></g>`);
    o.push(`<path d="M58 94 Q54 108 52 124" stroke="#c8f2d4" stroke-width="3.2" stroke-linecap="round" fill="none" opacity="${f2(pour)}"/>`);
  }
  // ล้างน้ำ
  if (flush > 0.02) for (let i = 0; i < 8; i++) o.push(`<path d="M${f2(80 + i * 15)} ${f2(120 + flush * 40)} v${f2(30 * flush)}" stroke="#58b8f8" stroke-width="3" stroke-linecap="round" opacity="${f2(0.7 * (1 - sm(0.9, 1, flush)))}"/>`);
  if (cue === "time") { const cx = 215, cy = 54; o.push(`<circle cx="${cx}" cy="${cy}" r="12" fill="#fffdf4" stroke="${OUT}" stroke-width="1.4"/><path d="M${cx} ${cy} L${f2(cx + Math.sin(p * 6.28 * 2) * 8.5)} ${f2(cy - Math.cos(p * 6.28 * 2) * 8.5)}" stroke="#d94b4b" stroke-width="1.6" stroke-linecap="round"/>`); }
  if (cue === "stain") o.push(`<path d="M${f2(wallPt(0.62)[0] + 14)} 168 l-10 -6" stroke="#2b3350" stroke-width=".8"/>`);
  return o.join("");
};

// ---------- โซน M: จุลภาค ----------
const BLK_W = 15, BLK_H = 9, MY = 478; // พื้นผิวเซรามิก
const zoneM = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  o.push(zonePanel(272, 504, "#eaf4fb"));
  o.push(`<g clip-path="url(#bmic)">`);
  const mode = cue === "stain" ? 0 : cue === "acid" ? 1 : 2;
  // น้ำ
  const wl = mode === 0 ? lerp(118, 6, sm(0.05, 0.85, p)) : 130;
  o.push(`<rect x="14" y="${f2(MY - wl)}" width="242" height="${f2(wl)}" fill="#bfe4f7" opacity=".85"/>`);
  o.push(`<path d="M14 ${f2(MY - wl)} Q135 ${f2(MY - wl + 2 * Math.sin(ph * 2))} 256 ${f2(MY - wl)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>`);
  // เซรามิก
  o.push(`<rect x="14" y="${MY}" width="242" height="30" fill="url(#bcer)" stroke="#9fb3c4" stroke-width="1"/>`);
  // หินปูนเป็นบล็อก
  const rows = mode === 0 ? 4 * sm(0.3, 0.95, p) : mode === 1 ? 4 : 4 * (1 - sm(0.08, 0.92, p)) + 0.0;
  for (let r = 0; r < 4; r++) for (let cx = 0; cx < 14; cx++) {
    const vis = cl(rows - r);
    if (vis <= 0.02) continue;
    const jag = rnd(r * 17 + cx) * 0.35;
    if (mode === 2 && rnd(cx * 3 + r) < (1 - vis) * 0.35) continue;
    const x = 16 + cx * BLK_W, y = MY - (r + 1) * BLK_H + (1 - vis) * BLK_H * 0.5;
    o.push(`<rect x="${f2(x)}" y="${f2(y)}" width="${f2(BLK_W - 1.2)}" height="${f2(BLK_H * (0.8 + jag * 0.5) * vis + 1)}" rx="1.2" fill="#e8dcc0" stroke="#a8996f" stroke-width=".7" opacity="${f2(0.5 + 0.5 * vis)}"/>`);
  }
  // ไอออนในน้ำ
  const nI = 26;
  for (let i = 0; i < nI; i++) {
    const x = 20 + rnd(i * 2) * 230 + Math.sin(ph * 0.9 + i) * 6, yb = MY - 8 - rnd(i * 2 + 1) * 110 + Math.cos(ph * 0.7 + i * 1.3) * 5;
    if (yb < MY - wl + 4) continue;
    if (mode === 0) o.push(i % 2 ? ion(x, yb, "Ca", 0.9 * (1 - sm(0.2 + rnd(i) * 0.4, 0.5 + rnd(i) * 0.4, p))) : ion(x, yb, "CO3", 0.9 * (1 - sm(0.2 + rnd(i) * 0.4, 0.5 + rnd(i) * 0.4, p))));
    else if (mode === 1) o.push(i % 2 ? ion(x, yb, "H", 0.95) : ion(x, yb, "Cl", 0.95));
    else {
      if (i % 3 === 0) o.push(ion(x, yb, "Cl", 0.9)); else if (i % 3 === 1) {
        const k = (ph * 0.35 + rnd(i)) % 1; // H+ พุ่งเข้าหาคราบ
        o.push(ion(x, lerp(yb, MY - 12, k), "H", 0.95 * (1 - k * 0.3)));
      } else o.push(ion(x, yb - ((ph * 6 + i * 9) % 40) * 0.0, "Ca", 0.9 * sm(0.1, 0.5, p)));
    }
  }
  // ก๊าซ CO2 ลอยขึ้น
  if (mode === 2) for (let i = 0; i < 18; i++) {
    const u = (ph * 0.55 + rnd(i)) % 1, x = 24 + rnd(i * 3) * 220 + Math.sin(u * 8 + i) * 3, y = MY - rows * BLK_H - u * 100;
    if (rows > 0.15) o.push(bub(x, y, 1.8 + rnd(i + 4) * 2.6, 1 - u * 0.4));
  }
  o.push(`</g>`);
  if (mode === 0) o.push(txt(135, 296, "น้ำระเหยแห้ง แร่ธาตุจับตัวเป็นผลึก", 6.2, "#456b82", "middle", 800));
  if (mode === 2) o.push(txt(135, 296, "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂", 6.6, "#b02a2a", "middle", 800));
  if (mode === 1) {
    // เกณฑ์ pH
    o.push(`<rect x="34" y="310" width="202" height="10" rx="5" fill="url(#bph)" stroke="${OUT}" stroke-width="1"/>`);
    for (let i = 0; i <= 14; i += 7) o.push(txt(35 + (i / 14) * 200, 334, String(i), 6, "#2b3350", "middle", 800));
    const mx = 35 + (1 / 14) * 200 + Math.sin(ph * 4) * 1.2;
    o.push(`<path d="M${f2(mx)} 304 l-4 -8 h8z" fill="#2b3350"/>`);
    o.push(txt(mx + 4, 292, "กรดแรง", 6.4, "#c62828", "start", 800) + txt(135, 346, "pH ต่ำ = เป็นกรด", 5.8, "#456b82", "middle", 700));
    // หยดกรดตก
    for (let i = 0; i < 6; i++) { const u = (ph * 0.6 + i / 6) % 1; o.push(`<path d="M${f2(60 + i * 30)} ${f2(356 + u * 40)} q-3 -5 0 -10 q3 5 0 10z" fill="#f06a6a" opacity="${f2(1 - u * 0.6)}"/>`); }
  }
  return o.join("");
};

// ---------- โซน D: ห้ามผสม ----------
const bottle = (x: number, y: number, kind: "acid" | "bleach", rot = 0, s = 1) => {
  const body = kind === "acid" ? "url(#bacid)" : "url(#bble)", lab = kind === "acid" ? "กรด" : "ฟอกขาว", sub = kind === "acid" ? "ล้างชักโครก" : "คลอรีน";
  return `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${s})"><rect x="-17" y="-30" width="34" height="56" rx="8" fill="${body}" stroke="${OUT}" stroke-width="1.6"/><rect x="-7" y="-39" width="14" height="10" rx="2.5" fill="#fff" stroke="${OUT}" stroke-width="1.3"/><rect x="-13" y="-16" width="26" height="30" rx="3" fill="#fff" stroke="#9db0c8" stroke-width=".8"/>${txt(0, -3, lab, 7.4, kind === "acid" ? "#c62828" : "#8a6d00", "middle", 900)}${txt(0, 6.5, sub, 4.6, "#46526b", "middle", 700)}</g>`;
};
const gasCloud = (cx: number, cy: number, ph: number, a: number, n = 26) => {
  const o: string[] = [];
  for (let i = 0; i < n; i++) {
    const u = (ph * 0.28 + rnd(i)) % 1, x = cx + (rnd(i * 3) - 0.5) * 70 * (0.4 + u) + Math.sin(ph * 1.3 + i) * 5, y = cy - u * 130;
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(7 + u * 14 + rnd(i + 4) * 5)}" fill="#c4e83a" opacity="${f2(a * 0.2 * (1 - u * 0.5))}"/>`);
  }
  for (let i = 0; i < 12; i++) {
    const u = (ph * 0.34 + rnd(i + 50)) % 1, x = cx + (rnd(i * 5 + 1) - 0.5) * 60 * (0.5 + u) + Math.sin(ph * 2 + i) * 4, y = cy - 6 - u * 120;
    o.push(`<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(ph * 90 + i * 40)})" opacity="${f2(a * (1 - u * 0.4))}"><circle cx="-2.2" r="2.6" fill="#7ed321" stroke="#3f6b0a" stroke-width=".5"/><circle cx="2.2" r="2.6" fill="#7ed321" stroke="#3f6b0a" stroke-width=".5"/></g>`);
  }
  return o.join("");
};
const miniBowl = (cx: number, cy: number, acid: number, bleach: number) => {
  let o = `<path d="M${cx - 44} ${cy - 22} H${cx + 44} Q${cx + 46} ${cy + 18} ${cx + 8} ${cy + 34} Q${cx} ${cy + 38} ${cx - 8} ${cy + 34} Q${cx - 46} ${cy + 18} ${cx - 44} ${cy - 22}Z" fill="url(#bcer)" stroke="#8da0b8" stroke-width="2"/>`;
  o += `<path d="M${cx - 38} ${cy - 16} H${cx + 38} Q${cx + 40} ${cy + 14} ${cx + 6} ${cy + 28} Q${cx} ${cy + 31} ${cx - 6} ${cy + 28} Q${cx - 40} ${cy + 14} ${cx - 38} ${cy - 16}Z" fill="#f2f6fb"/>`;
  o += `<path d="M${cx - 40} ${cy + 4} Q${cx} ${cy + 8} ${cx + 40} ${cy + 4} Q${cx + 38} ${cy + 20} ${cx + 6} ${cy + 30} Q${cx} ${cy + 32} ${cx - 6} ${cy + 30} Q${cx - 38} ${cy + 20} ${cx - 40} ${cy + 4}Z" fill="${acid > 0.02 && bleach < 0.5 ? "#f6b4b0" : bleach > 0.5 ? "#e7e08a" : "#9fd8f7"}" opacity=".9"/>`;
  return o;
};
const zoneD = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  o.push(zonePanel(512, 770, "#fdf4f1"));
  const isBut = cue === "but", isGas = cue === "gas";
  if (isBut || !(isGas)) {
    // สองขวดแยกกัน + เครื่องหมายห้าม
    o.push(bottle(66, 596, "acid", 0, 1.35) + bottle(204, 596, "bleach", 0, 1.35));
    o.push(txt(135, 600, "+", 30, "#2b3350", "middle", 900));
    const a = 0.55 + 0.45 * Math.sin(ph * 4);
    const k = isBut ? sm(0.35, 0.6, p) : 0;
    if (k > 0.01) o.push(`<g opacity="${f2(k)}"><circle cx="135" cy="596" r="${f2(27 + 2 * a)}" fill="none" stroke="#e53935" stroke-width="5"/><path d="M${f2(135 - 19)} ${f2(596 - 19)} L${f2(135 + 19)} ${f2(596 + 19)}" stroke="#e53935" stroke-width="5" stroke-linecap="round"/></g>`);
    o.push(txt(66, 666, "น้ำยากรด", 7.6, "#c62828", "middle", 900) + txt(204, 666, "น้ำยาฟอกขาว (คลอรีน)", 6.2, "#8a6d00", "middle", 900));
    if (isBut) o.push(txt(135, 540, "ห้ามผสมเด็ดขาด", 11, "#c62828", "middle", 900));
  }
  if (isGas) {
    // เทลงโถพร้อมกัน → ก๊าซ
    const k = sm(0, 0.35, p), g = sm(0.3, 0.6, p);
    o.push(miniBowl(135, 710, k, k > 0.5 ? 1 : 0));
    o.push(bottle(62 + 10 * k, 596 - 8 * k, "acid", 72 * k, 1.0) + bottle(208 - 10 * k, 596 - 8 * k, "bleach", -72 * k, 1.0));
    o.push(gasCloud(135, 700, ph, g));
    if (g > 0.4) { o.push(`<rect x="70" y="522" width="130" height="14" rx="7" fill="#e8f5c0" stroke="#7a9b1a" stroke-width=".8"/>` + txt(135, 532, "ก๊าซคลอรีน (พิษ)", 7.2, "#3f5c00", "middle", 900)); }
    if (p > 0.62) { const a = sm(0.62, 0.8, p); o.push(`<g opacity="${f2(a)}">${txt(40, 748, "แสบตา", 6.6, "#b02a2a", "middle", 800)}${txt(100, 748, "แสบจมูก คอ", 6.6, "#b02a2a", "middle", 800)}${txt(160, 748, "ไอ", 6.6, "#b02a2a", "middle", 800)}${txt(215, 748, "หายใจลำบาก", 6.6, "#b02a2a", "middle", 800)}</g>`); }
  }
  if (cue === "seq") {
    // โถยังมีน้ำยาแรกค้าง → เทน้ำยาที่สอง
    const ph1 = p < 0.38, ph2 = p >= 0.38 && p < 0.72, ph3 = p >= 0.72;
    o.push(miniBowl(135, 650, ph3 ? 0 : 1, ph2 ? 1 : 0));
    if (ph2) { o.push(bottle(196, 592, "bleach", -72 * sm(0.38, 0.5, p), 0.95)); o.push(gasCloud(135, 640, ph, sm(0.46, 0.62, p), 14)); }
    if (ph1) o.push(bottle(86, 592, "acid", 0, 0.95));
    if (ph3) for (let i = 0; i < 8; i++) o.push(`<path d="M${f2(100 + i * 10)} ${f2(600 + ((ph * 40 + i * 9) % 30))} v12" stroke="#58b8f8" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`);
    o.push(pill(135, 540, ph1 ? "เทน้ำยาแรกไว้ แล้วทิ้งไว้" : ph2 ? "เทน้ำยาที่สอง ทั้งที่ของเก่ายังค้าง" : "ล้างด้วยน้ำให้หมดก่อน", ph2 ? "#ffd9d0" : ph3 ? "#d9f7de" : "#fff6c9"));
    if (ph2 && p > 0.55) o.push(`<circle cx="214" cy="552" r="9" fill="#e53935"/><path d="M209 547 l10 10 M219 547 l-10 10" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`);
    if (ph3) o.push(`<circle cx="214" cy="552" r="9" fill="#2e9e55"/><path d="M209.5 552 l3.2 3.4 l6 -7" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
  }
  return o.join("");
};

// ---------- โซน S: ถ้าเผลอผสม ----------
const zoneS = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  o.push(zonePanel(780, 1000, "#f1f8f1"));
  // ห้อง + ประตู + หน้าต่าง
  o.push(`<rect x="20" y="800" width="230" height="160" rx="6" fill="#fff" stroke="#9fb3c4" stroke-width="1.4"/>`);
  o.push(`<rect x="204" y="830" width="40" height="130" rx="3" fill="#cdeccf" stroke="#2e9e55" stroke-width="1.6"/>`);
  o.push(`<path d="M${204} 830 q-30 14 0 0" stroke="none"/>` + txt(224, 826, "ทางออก", 5.8, "#2e7d32", "middle", 800));
  o.push(`<rect x="34" y="822" width="46" height="38" rx="3" fill="#dff1ff" stroke="#6aa0d8" stroke-width="1.4"/><path d="M57 822 V860 M34 841 H80" stroke="#6aa0d8" stroke-width="1"/>`);
  const act = cue === "act" ? p : 0;
  const wo = sm(0.3, 0.55, act);
  // ก๊าซในห้อง (จางลง เมื่อเปิดหน้าต่าง/ประตู)
  const gA = cue === "act" ? 0.9 - 0.6 * sm(0.45, 1, p) : 0.9;
  o.push(gasCloud(70, 950, ph, gA, 16));
  // คน: เดินไปที่ประตู
  const px = lerp(110, 222, sm(0.0, 0.5, act)), py = 934;
  o.push(`<g transform="translate(${f2(px)} ${py})"><circle cx="0" cy="-34" r="7" fill="#f1b894" stroke="#a8643f" stroke-width="1"/><rect x="-7" y="-26" width="14" height="30" rx="5" fill="#4a79c4" stroke="#2b3f66" stroke-width="1"/><path d="M-5 4 L-7 22 M5 4 L${f2(7 + Math.sin(ph * 8) * 3)} 22" stroke="#2b3f66" stroke-width="3" stroke-linecap="round"/></g>`);
  if (act < 0.5) o.push(`<path d="M${f2(px - 12)} ${f2(py - 40)} l-4 -3 M${f2(px + 12)} ${f2(py - 40)} l4 -3" stroke="#d94b4b" stroke-width="1.2" stroke-linecap="round"/>`);
  // ลมจากหน้าต่าง
  if (wo > 0.05) for (let i = 0; i < 3; i++) { const u = (ph * 0.5 + i / 3) % 1; o.push(`<path d="M${f2(30 + u * 40)} ${f2(836 + i * 8)} h10 m-3 -3 l3 3 l-3 3" stroke="#6aa0d8" stroke-width="1.3" fill="none" opacity="${f2(wo * (1 - u * 0.5))}"/>`); }
  // โทรศัพท์
  const phA = sm(0.55, 0.8, act);
  o.push(`<g opacity="${f2(cue === "act" ? phA : 0.4)}" transform="translate(135 812)"><rect x="-44" y="-8" width="88" height="16" rx="8" fill="#fff6c9" stroke="${OUT}" stroke-width=".9"/>${txt(0, 3, "ศูนย์พิษวิทยา โทร 1367", 6.6, "#2b3350", "middle", 800)}</g>`);
  return o.join("");
};

// ---------- โซน P: ข้อควรระวังตอนใช้ ----------
const tile = (x: number, y: number, label: string, on: number, inner: string) =>
  `<g><rect x="${x}" y="${y}" width="116" height="92" rx="10" fill="${on > 0.5 ? "#fffbe6" : "#fff"}" stroke="${on > 0.5 ? "#e8a400" : "#b7c5d8"}" stroke-width="${on > 0.5 ? 2 : 1.2}"/><g transform="translate(${x + 58} ${y + 42})">${inner}</g>${txt(x + 58, y + 84, label, 6.4, "#2b3350", "middle", 800)}</g>`;
const glove = (flip: number) => `<g transform="scale(${flip} 1)"><path d="M-8 18 V-2 Q-9 -10 -5 -11 Q-2 -11 -2 -4 V-14 Q-2 -22 2 -21 Q5 -21 5 -14 V-4 Q6 -22 10 -21 Q13 -20 12 -8 V0 Q16 -6 18 -2 Q18 4 12 12 L10 18 Z" fill="#ffd54a" stroke="#a87a00" stroke-width="1.2"/></g>`;
const zoneP = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  o.push(zonePanel(1010, 1210, "#f6f9fd"));
  const sel = cue === "ppe" ? Math.min(3, Math.floor(p * 4)) : -1;
  o.push(tile(16, 1020, "สวมถุงมือ", sel === 0 ? 1 : 0, `<g transform="translate(-14 0)">${glove(1)}</g><g transform="translate(14 0)">${glove(-1)}</g>`));
  let blades = ""; for (let i = 0; i < 3; i++) blades += `<ellipse cx="0" cy="-8" rx="4.4" ry="9" fill="#9fc3e8" stroke="#3e6ea8" stroke-width="1" transform="rotate(${f2(i * 120 + ph * 300)})"/>`;
  o.push(tile(138, 1020, "เปิดให้อากาศถ่ายเท", sel === 1 ? 1 : 0, `<rect x="-26" y="-26" width="52" height="46" rx="3" fill="#dff1ff" stroke="#6aa0d8" stroke-width="1.4"/>${blades}<circle r="2.6" fill="#3e6ea8"/>`));
  o.push(tile(16, 1120, "เก็บให้พ้นมือเด็ก", sel === 2 ? 1 : 0, `<rect x="-30" y="-24" width="60" height="4" fill="#8a6a3b"/>${bottle(0, -36, "acid", 0, 0.36)}<circle cx="-14" cy="12" r="6" fill="#f1b894" stroke="#a8643f"/><rect x="-20" y="18" width="12" height="12" rx="3" fill="#e57373"/><path d="M-26 -14 L26 30" stroke="#e53935" stroke-width="3" stroke-linecap="round" opacity=".85"/>`));
  o.push(tile(138, 1120, "ระวังก๊อกโลหะ/หินอ่อน", sel === 3 ? 1 : 0, `<path d="M-22 -14 H6 Q14 -14 14 -6 V2 H8 V-6 H-22Z" fill="#cfd8e3" stroke="#6b7c93" stroke-width="1.2"/><path d="M${f2(10 + Math.sin(ph * 3))} ${f2(4 + ((ph * 20) % 18))} q-3 -5 0 -10 q3 5 0 10z" fill="#f06a6a"/><rect x="-26" y="22" width="52" height="8" rx="2" fill="#ece6dc" stroke="#9a8f7d"/>`));
  return o.join("");
};

// ---------- โซน C: ขวดเหลือเท่าไร ----------
const zoneC = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  o.push(zonePanel(1220, 1380, "#f6f9fd"));
  const lvl = cue === "chk" ? lerp(0.5, 0.22, sm(0.15, 0.85, p)) : 0.5;
  const bx = 100, by = 1240, bw = 70, bh = 112;
  o.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="12" fill="#f4fbff" stroke="${OUT}" stroke-width="2"/>`);
  const ly = by + bh - bh * lvl;
  o.push(`<clipPath id="bcb"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="12"/></clipPath><g clip-path="url(#bcb)"><rect x="${bx}" y="${f2(ly)}" width="${bw}" height="${f2(bh * lvl + 2)}" fill="#c8f2d4" stroke="#4aa86a" stroke-width="1"/></g>`);
  for (let i = 1; i <= 4; i++) { const y = by + bh - (bh * i) / 5; o.push(`<path d="M${bx + bw} ${f2(y)} h9" stroke="${OUT}" stroke-width="1"/>` + txt(bx + bw + 20, y + 2, `${i}`, 6, "#2b3350", "start", 800)); }
  o.push(txt(bx + bw + 12, by - 4, "ครั้งที่ใช้ได้", 5.8, "#456b82", "start", 700));
  o.push(`<rect x="${bx + 20}" y="${by - 12}" width="30" height="12" rx="3" fill="#6aa0d8" stroke="${OUT}" stroke-width="1.2"/>`);
  return o.join("");
};

export const SCENE_BOWLCLEANER: SceneDef = {
  focus: {
    all: { cx: 135, cy: 140, z: 1.0 },
    stain: { cx: 135, cy: 520, z: 1.04 },
    acid: { cx: 135, cy: 520, z: 1.04 },
    react: { cx: 135, cy: 520, z: 1.04 },
    gel: { cx: 75, cy: 160, z: 2.6, box: [44, 118, 40, 90], label: "เจลข้นเกาะค้าง" },
    time: { cx: 135, cy: 140, z: 1.0 },
    but: { cx: 135, cy: 880, z: 1.04 },
    gas: { cx: 135, cy: 900, z: 1.04 },
    seq: { cx: 135, cy: 900, z: 1.04 },
    act: { cx: 135, cy: 1280, z: 1.04 },
    ppe: { cx: 135, cy: 1630, z: 1.04 },
    chk: { cx: 135, cy: 1960, z: 1.6 },
    end: { cx: 135, cy: 140, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const o: string[] = [DEFS, `<rect x="-300" y="-300" width="900" height="3600" fill="url(#bbg)"/>`];
    const wrap = (dy: number, z: string) => `<g transform="translate(0 ${dy})">${z}</g>`;
    o.push(zoneA(cue, p, ph), wrap(130, zoneM(cue, p, ph)), wrap(260, zoneD(cue, p, ph)), wrap(390, zoneS(cue, p, ph)), wrap(520, zoneP(cue, p, ph)), wrap(650, zoneC(cue, p, ph)));
    const F = SCENE_BOWLCLEANER.focus[cue] || SCENE_BOWLCLEANER.focus.all;
    const hud = (s: string, fill = "#fff6c9") => { const y = F.cy - 200 / F.z; o.push(`<g transform="translate(${F.cx} ${f2(y)}) scale(${f2(1.6 / F.z)}) translate(${-F.cx} ${f2(-y)})">${pill(F.cx, y, s, fill)}</g>`); };
    if (cue === "all") hud("น้ำยาล้างชักโครก");
    if (cue === "end") hud("ดูข้างในของใช้ ยังไงนะ");
    if (cue === "stain") hud("คราบเหลืองกร้าน = หินปูน");
    if (cue === "acid") hud("น้ำยาสูตรเข้มข้น เป็นกรด");
    if (cue === "react") hud("กรดกัดหินปูน เกิดฟองก๊าซ");
    if (cue === "gel") hud("เจลข้นเกาะผนัง ให้เวลากรดทำงาน");
    if (cue === "time") hud(p < 0.5 ? "รอตามเวลาบนฉลาก" : "ล้างออกด้วยน้ำ", p < 0.5 ? "#fff6c9" : "#d9f7de");
    if (cue === "but") hud("ห้ามผสมกับน้ำยาฟอกขาว", "#ffd9d0");
    if (cue === "gas") hud("กรด + คลอรีน = ก๊าซพิษ", "#ffd9d0");
    if (cue === "seq") hud("ใช้ต่อกัน ของเก่าค้าง ก็ผสมได้", "#ffe1c9");
    if (cue === "act") hud("ออกห่างทันที ไปรับอากาศสด", "#d9f7de");
    if (cue === "ppe") hud("ใช้อย่างปลอดภัย");
    if (cue === "chk") hud("ขวดนี้ ใช้ได้อีกกี่รอบ?");
    o.push(box(SCENE_BOWLCLEANER.focus[cue]?.box, ph));
    return o.join("");
  },
};
