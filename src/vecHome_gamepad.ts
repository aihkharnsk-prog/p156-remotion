// ฉากอธิบาย: จอยเกมไร้สาย — ปุ่ม, ก้านอนาล็อก (โพเทนชิโอมิเตอร์), บลูทูธ, เซนเซอร์เอียง/ไจโร, มอเตอร์สั่น, ก้านดริฟต์ — SVG พิกัด 270x480 (หนึ่งมุมมองต่อหนึ่ง cue ครอสเฟดเมื่อเปลี่ยน)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const TAU = Math.PI * 2;
const INK = "#0e1633";
const txt = (x: number, y: number, s: string, size = 6, fill = "#fff", anchor = "middle", w = 800) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, fill = "#fff6c9", size = 7.4) => {
  const w = s.length * size * 0.66 + 12;
  return `<rect x="${f2(x - w / 2)}" y="${f2(y - size - 1.5)}" width="${f2(w)}" height="${f2(size + 6)}" rx="${f2((size + 6) / 2)}" fill="${fill}" stroke="${INK}" stroke-width=".9" opacity=".97"/>` + txt(x, y + 0.8, s, size, INK);
};
const lead = (x1: number, y1: number, x2: number, y2: number, c = "#fff") => `<path d="M${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)}" stroke="${c}" stroke-width=".8" fill="none"/><circle cx="${f2(x2)}" cy="${f2(y2)}" r="1.5" fill="${c}"/>`;
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));
const qb = (a: Pt, c: Pt, b: Pt, u: number): Pt => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; };
const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 0, stroke = "none", sw = 1, extra = "") =>
  `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const circ = (x: number, y: number, r: number, fill: string, extra = "") => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${fill}" ${extra}/>`;
const wave = (x0: number, x1: number, y: number, amp: number, wl: number, phs: number, col: string, sw = 1.6, step = 3) => {
  let d = "";
  for (let x = x0; x <= x1; x += step) d += (x === x0 ? "M" : " L") + f2(x) + " " + f2(y + amp * Math.sin(((x - x0) / wl) * TAU + phs));
  return `<path d="${d}" stroke="${col}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
};
const fc = (x: number, y: number, z = 1) => ({ cx: x, cy: y + 90 / z, z });
const bgf = (ph: number, c1: string, c2: string, dot: string) => {
  let s = `<defs><linearGradient id="gbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="-200" y="-200" width="670" height="880" fill="url(#gbg)"/>`;
  for (let i = 0; i < 18; i++) {
    const x = rnd(i) * 270, y = 480 - ((ph * (3 + rnd(i + 9) * 5) + rnd(i + 4) * 480) % 480);
    s += `<circle cx="${f2(x + Math.sin(ph + i) * 4)}" cy="${f2(y)}" r="${f2(1 + rnd(i + 2) * 2)}" fill="${dot}" opacity="${f2(0.06 + 0.06 * rnd(i + 7))}"/>`;
  }
  return s;
};
const BG1 = "#1b2a52", BG2 = "#0a1128", DOT = "#7fe3ff";
const ORDER = ["all", "btn", "stick", "adc", "trig", "pair", "ble", "tilt", "gyro", "rumble", "wear", "dead", "hall", "nudge", "end"];
const KIND: Record<string, string> = { all: "G", end: "G", btn: "T", stick: "S", adc: "V", trig: "R", pair: "Pr", ble: "Bt", tilt: "Ac", gyro: "Gy", rumble: "Ru", wear: "W", dead: "D", hall: "Ha", nudge: "N" };
const FOCUS: Record<string, { cx: number; cy: number; z: number }> = {};
for (const c of ORDER) FOCUS[c] = fc(135, 150, 1);
const C1 = "#4da3ff", C2 = "#ffd23a", C3 = "#ff5a7a", C4 = "#58e08a";

const tv = (x: number, y: number, w: number, h: number, hx: number, walk = false, ph = 0) => {
  let s = rect(x - 4, y - 4, w + 8, h + 8, "#0b0d18", 6, "#8fa2d8", 1.2) + rect(x, y, w, h, "#20315e", 3);
  s += rect(x, y + h - 10, w, 10, "#3f8a4a", 0) + rect(x + 6, y + 6, 18, 6, "#ffffff22", 2);
  const bob = walk ? Math.abs(Math.sin(ph * 8)) * 2 : 0;
  s += rect(hx - 4, y + h - 24 - bob, 8, 5, "#e63b3b") + rect(hx - 4, y + h - 19 - bob, 8, 5, "#ffd0a0") + rect(hx - 5, y + h - 14 - bob, 10, 4, "#3b5bd6");
  return s;
};
const padShape = `M-90 -30 Q-90 -50 -60 -50 H60 Q90 -50 90 -30 L100 30 Q108 62 80 62 Q62 62 54 40 H-54 Q-62 62 -80 62 Q-108 62 -100 30 Z`;
const stickCap = (x: number, y: number, ox: number, oy: number, hi = false) =>
  circ(x, y, 15, "#10121f", `stroke="#5b6aa0" stroke-width="1"`) + circ(x + ox * 4, y + oy * 4, 11, hi ? "#7a8cc8" : "#3a456e", `stroke="#9fb0e8" stroke-width="1.2"`) + circ(x + ox * 4 - 3, y + oy * 4 - 3, 3, "#ffffff55");
const pad = (cx: number, cy: number, k: number, rot: number, lx: number, ly: number, btn = -1, hiS = false, glow = "") => {
  let s = `<g transform="translate(${f2(cx)} ${f2(cy)}) rotate(${f2(rot)}) scale(${k})">`;
  s += `<path d="${padShape}" fill="#e9eefc" stroke="${INK}" stroke-width="2.4"/><path d="${padShape}" fill="url(#none)" opacity="0"/>`;
  s += rect(-70, -54, 28, 7, "#aab6dc", 3) + rect(42, -54, 28, 7, "#aab6dc", 3);
  s += stickCap(-52, -12, lx, ly, hiS) + stickCap(22, 24, 0, 0);
  s += rect(-40, 12, 28, 8, "#34406a", 2) + rect(-30, 2, 8, 28, "#34406a", 2);
  const bc = [C4, C3, C1, C2], bp = [[58, -4], [72, -18], [44, -18], [58, -32]];
  for (let i = 0; i < 4; i++) s += circ(bp[i][0], bp[i][1], 7.6, bc[i], `stroke="${INK}" stroke-width="1.2" opacity="${btn === i ? 1 : 0.8}"`) + (btn === i ? circ(bp[i][0], bp[i][1], 11, "none", `stroke="#fff" stroke-width="1.6"`) : "");
  s += glow + `</g>`;
  return s;
};
const arcs = (x: number, y: number, ph: number, dir: number, n = 3, col = "#6af0ff") => Array.from({ length: n }, (_, i) => {
  const u = (ph * 0.9 + i / n) % 1, r = 10 + u * 34;
  return `<path d="M${f2(x - r * 0.7)} ${f2(y - dir * r * 0.7)} Q${f2(x)} ${f2(y - dir * r * 1.2)} ${f2(x + r * 0.7)} ${f2(y - dir * r * 0.7)}" stroke="${col}" stroke-width="2" fill="none" stroke-linecap="round" opacity="${f2(1 - u)}"/>`;
}).join("");

const viewG = (c: string, ph: number, p: number): string => {
  const o: string[] = [];
  const lx = Math.sin(ph * 1.7), ly = Math.cos(ph * 1.3) * 0.6;
  const hx = 135 + lx * 36;
  o.push(tv(75, 26, 120, 70, hx, true, ph));
  o.push(arcs(135, 140, ph, 1));
  o.push(pad(135, 196, 0.86, 0, lx, ly, Math.floor(ph * 2.4) % 5 - 1));
  if (c === "end") for (let i = 0; i < 6; i++) { const a = ph * 2.5 + i; o.push(`<path d="M${f2(135 + Math.cos(a) * 118)} ${f2(150 + Math.sin(a * 1.3) * 80)} l0 -4 m-2 2 h4" stroke="#ffe27a" stroke-width="1.4" opacity="${f2(0.4 + 0.6 * Math.abs(Math.sin(a * 2)))}"/>`); }
  else o.push(pill(135, 262, "ไม่มีสาย แต่รู้ทุกการขยับ", "#fff6c9", 8.8));
  return o.join("");
};

const viewT = (ph: number, p: number): string => {
  const o: string[] = [];
  const u = (ph * 0.55) % 1, down = u < 0.45 ? sm(0.05, 0.3, u) : u < 0.6 ? 1 : 1 - sm(0.6, 0.85, u);
  o.push(rect(24, 190, 150, 14, "#1f8a62", 3, INK, 1) + rect(62, 186, 26, 4, "#e0a04a", 1) + rect(108, 186, 26, 4, "#e0a04a", 1));
  const ap = lerp(146, 174, down);
  o.push(`<path d="M52 186 Q98 ${f2(2 * ap - 186)} 144 186" fill="#8e86c8" fill-opacity=".3" stroke="#a79ce0" stroke-width="5" stroke-linecap="round"/>`);
  o.push(rect(88, f2(ap + 2), 20, 7, "#222233", 2, INK, 0.8));
  o.push(rect(82, f2(ap - 52), 32, 50, C4, 12, INK, 1.4));
  const on = down > 0.9;
  o.push(circ(98, 187, on ? 8 : 0, "#ffe27a", 'opacity=".85"'));
  o.push(`<path d="M64 188 H92 M106 188 H134" stroke="${on ? "#ffe27a" : "#5aa"}" stroke-width="2"/><path d="M174 197 H194 V150" stroke="${on ? "#ffe27a" : "#566"}" stroke-width="2" fill="none"/>`);
  o.push(rect(172, 112, 72, 38, "#2c2a58", 5, INK, 1.2) + txt(208, 128, "ชิปในจอย", 7.4, "#fff") + txt(208, 142, on ? "ปุ่ม A = 1" : "ปุ่ม A = 0", 8, on ? "#ffe27a" : "#8a93b8"));
  o.push(pill(135, 40, on ? "ยางแตะแผงวงจร ต่อวงจร" : "แผ่นยางรอเหนือแผ่นสัมผัส", "#fff6c9", 8.4));
  o.push(txt(98, 226, "ข้างใต้ปุ่มมีแผ่นนำไฟฟ้า", 7.4, "#cfe0ff"));
  return o.join("");
};

const viewS = (ph: number, p: number): string => {
  const o: string[] = [];
  const sx = Math.sin(ph * 1.4) * 0.9, sy = Math.cos(ph * 1.1 + 0.6) * 0.8;
  const X0 = 40, Y0 = 62, S = 120, cx = X0 + S / 2, cy = Y0 + S / 2;
  o.push(rect(X0, Y0, S, S, "#141c3a", 10, "#8fa2d8", 1.2));
  o.push(`<path d="M${cx} ${Y0 + 6} V${Y0 + S - 6} M${X0 + 6} ${cy} H${X0 + S - 6}" stroke="#34406a" stroke-width="1"/>`);
  const dx = cx + sx * 46, dy = cy + sy * 46;
  o.push(circ(dx, dy, 14, "#3a456e", `stroke="#9fb0e8" stroke-width="1.4"`) + circ(dx - 4, dy - 4, 4, "#ffffff55"));
  // แกน X ด้านล่าง
  const ty = Y0 + S + 22;
  o.push(rect(X0, ty - 5, S, 10, "#ffb04a", 5, INK, 1) + circ(dx, ty, 6, "#fff", `stroke="${INK}" stroke-width="1.2"`));
  o.push(`<path d="M${f2(dx)} ${f2(dy + 14)} V${ty - 6}" stroke="#ffe27a" stroke-width="1" stroke-dasharray="2 2"/>`);
  o.push(txt(cx, ty + 20, "แกน X: ซ้าย-ขวา", 7.8, "#ffe0b0"));
  // แกน Y ด้านขวา
  const tx = X0 + S + 26;
  o.push(rect(tx - 5, Y0, 10, S, "#7ab8ff", 5, INK, 1) + circ(tx, dy, 6, "#fff", `stroke="${INK}" stroke-width="1.2"`));
  o.push(`<path d="M${f2(dx + 14)} ${f2(dy)} H${tx - 6}" stroke="#ffe27a" stroke-width="1" stroke-dasharray="2 2"/>`);
  o.push(txt(tx, Y0 - 6, "แกน Y", 7.8, "#b8dcff"));
  o.push(txt(tx, Y0 + S + 12, "ขึ้น-ลง", 7.4, "#b8dcff"));
  o.push(pill(135, 40, "โพเทนชิโอมิเตอร์ 2 ตัว ต่อ 1 ก้าน", "#fff6c9", 8.4));
  return o.join("");
};

const viewV = (ph: number, p: number): string => {
  const o: string[] = [];
  const f = 0.5 + 0.42 * Math.sin(ph * 1.5);
  const x0 = 34, x1 = 236, y = 100;
  // ตัวต้านทาน (ซิกแซก)
  let d = `M${x0} ${y}`; for (let i = 0; i < 16; i++) d += ` L${f2(x0 + 6 + i * 12.5)} ${y + (i % 2 ? 9 : -9)}`; d += ` L${x1} ${y}`;
  o.push(`<path d="${d}" stroke="#ffb04a" stroke-width="3" fill="none" stroke-linejoin="round"/>`);
  o.push(txt(x0, y - 18, "+ไฟเลี้ยง", 7, "#ffe0b0", "start") + txt(x1, y - 18, "กราวด์", 7, "#ffe0b0", "end"));
  const wx = x0 + (x1 - x0) * f;
  o.push(`<path d="M${f2(wx)} ${y - 36} L${f2(wx)} ${y - 10}" stroke="#fff" stroke-width="2"/><path d="M${f2(wx - 6)} ${y - 40} H${f2(wx + 6)} L${f2(wx)} ${y - 28} Z" fill="#ffe27a" stroke="${INK}" stroke-width="1"/>`);
  o.push(txt(wx, y - 46, "ตัวสัมผัส", 7, "#ffe27a"));
  // เกจแรงดัน
  o.push(rect(x0, 142, x1 - x0, 16, "#141c3a", 8, "#8fa2d8", 1) + rect(x0, 142, (x1 - x0) * f, 16, "#58e08a", 8));
  o.push(txt(135, 136, "แรงดันที่ตัวสัมผัสอ่านได้", 7.4, "#cfe0ff"));
  // ตัวเลข
  const val = Math.round(f * 255);
  const bits = val.toString(2).padStart(8, "0");
  o.push(rect(34, 180, 202, 52, "#10162e", 8, "#ffe27a", 1.2));
  o.push(txt(54, 200, "ชิปแปลงเป็นตัวเลข", 7.4, "#ffe27a", "start"));
  for (let i = 0; i < 8; i++) o.push(rect(54 + i * 14, 208, 12, 16, bits[i] === "1" ? "#ffe27a" : "#2a3260", 2) + txt(60 + i * 14, 220, bits[i], 9, bits[i] === "1" ? INK : "#7d89c8"));
  o.push(txt(214, 222, String(val), 14, "#fff", "end"));
  o.push(txt(135, 250, "(ตัวอย่าง: ช่วง 0–255)", 6.6, "#9fb0e8"));
  o.push(pill(135, 40, "เอียงมาก แรงดันก็ต่าง", "#fff6c9", 9));
  return o.join("");
};

const viewR = (ph: number, p: number): string => {
  const o: string[] = [];
  const f = 0.5 + 0.5 * Math.sin(ph * 1.6 - 1);
  const rot = 4 + 30 * f;
  // ตัวจอยด้านข้าง + ไกที่หมุนรอบจุดหมุน
  o.push(`<path d="M40 70 Q40 52 70 52 H150 L170 96 Q176 130 150 134 H70 Q40 134 40 110 Z" fill="#e9eefc" stroke="${INK}" stroke-width="2.4"/>`);
  o.push(`<g transform="translate(150 96) rotate(${f2(-rot + 30)})"><rect x="-6" y="-5" width="50" height="14" rx="6" fill="#aab6dc" stroke="${INK}" stroke-width="1.6"/></g>`);
  o.push(circ(150, 96, 4, "#34406a"));
  // นิ้วกดที่ปลายไก
  const tx = 150 + Math.cos(((30 - rot) * Math.PI) / 180) * 40, ty2 = 96 - Math.sin(((30 - rot) * Math.PI) / 180) * 40;
  o.push(rect(tx - 7, ty2 - 2, 20, 52, "#f0c6a0", 10, INK, 1.2));
  o.push(rect(184, 130, 42, 12, "#ffb04a", 4, INK, 1) + circ(184 + 42 * f, 136, 4, "#fff", `stroke="${INK}" stroke-width="1"`));
  o.push(txt(205, 154, "แผ่นความต้านทาน", 6.6, "#ffe0b0"));
  // เกจ
  o.push(rect(34, 190, 202, 18, "#141c3a", 9, "#8fa2d8", 1) + rect(34, 190, 202 * f, 18, mixc("#58e08a", "#ff5a4a", f), 9));
  o.push(txt(34, 184, "ค่าที่ชิปอ่านได้ (กดลึกแค่ไหน)", 7.4, "#cfe0ff", "start"));
  // รถ
  const cx = 40 + 190 * f;
  o.push(rect(cx - 14, 228, 28, 10, C3, 4, INK, 1) + circ(cx - 8, 240, 4, "#222") + circ(cx + 8, 240, 4, "#222"));
  for (let i = 0; i < 4; i++) o.push(`<path d="M${f2(cx - 20 - i * 8)} ${232 + i * 2} h-8" stroke="#fff" stroke-width="1.4" opacity="${f2(f * (1 - i / 4))}"/>`);
  o.push(pill(135, 40, "ยิ่งกดลึก ค่ายิ่งมาก", "#fff6c9", 9));
  return o.join("");
};

const viewPr = (ph: number, p: number): string => {
  const o: string[] = [];
  const m = sm(0.1, 0.55, p), ok = sm(0.55, 0.8, p);
  o.push(pad(65, 130, 0.46, 0, 0, 0));
  o.push(rect(170, 100, 80, 58, "#2c2a58", 8, INK, 1.4) + txt(210, 134, "เครื่องเล่น", 8, "#fff"));
  // กุญแจสองดอกวิ่งมาเจอกัน
  const k = (x: number, col: string) => `<g transform="translate(${f2(x)} 60)"><circle r="7" fill="none" stroke="${col}" stroke-width="3"/><path d="M7 0 H26 M20 0 V8 M26 0 V6" stroke="${col}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  o.push(k(lerp(40, 98, m), "#6af0ff") + k(lerp(250, 150, m) - 26, "#ffe27a"));
  o.push(`<path d="M65 108 Q135 ${f2(60 - 10 * m)} 210 98" stroke="#6af0ff" stroke-width="1.2" stroke-dasharray="3 3" fill="none" opacity="${f2(m)}"/>`);
  if (ok > 0.05) o.push(`<g opacity="${f2(ok)}"><rect x="111" y="46" width="28" height="22" rx="4" fill="#58e08a" stroke="${INK}" stroke-width="1.4"/><path d="M117 46 v-6 a8 8 0 0 1 16 0 v6" stroke="#58e08a" stroke-width="3" fill="none"/></g>`);
  // ข้อมูลไหลหลังจับคู่ + ตัวแปลกหน้าถูกกั้น
  o.push(pad(65, 226, 0.4, 0, 0, 0, -1, false) + `<g opacity=".0"></g>`);
  o.push(txt(65, 256, "จอยตัวอื่น", 6.8, "#9fb0e8"));
  o.push(`<path d="M92 226 H168" stroke="#ff5a7a" stroke-width="2" stroke-dasharray="4 3"/><path d="M122 218 l12 16 m0 -16 l-12 16" stroke="#ff5a7a" stroke-width="2.4"/>`);
  for (let i = 0; i < 4; i++) { const u = (ph * 0.8 + i / 4) % 1; if (ok > 0.5) o.push(rect(98 + u * 66, 123, 8, 5, "#ffe27a", 1.5)); }
  o.push(pill(135, 24, ok > 0.5 ? "จับคู่แล้ว: รับเฉพาะจอยนี้" : "แลกรหัสกัน", "#fff6c9", 8.8));
  return o.join("");
};

const viewBt = (ph: number, p: number): string => {
  const o: string[] = [];
  const nch = 6;
  for (let i = 0; i < nch; i++) o.push(rect(40 + i * 32, 56, 22, 112, "#141c3a", 4, "#34406a", 0.8) + txt(51 + i * 32, 52, `ช่อง ${i + 1}`, 5.6, "#8fa2d8"));
  o.push(txt(135, 36, "แพ็กเก็ตสลับช่องความถี่ 2.4 GHz", 7.8, "#fff"));
  for (let k = 0; k < 4; k++) {
    const t = (ph * 0.9 + k / 4) % 1, ch = Math.floor(rnd(Math.floor((ph * 0.9 + k / 4)) * 3 + k) * nch);
    const y = 164 - t * 104;
    o.push(rect(42 + ch * 32, y, 18, 9, "#ffe27a", 2, INK, 0.8));
  }
  o.push(pad(60, 218, 0.34, 0, 0, 0) + rect(176, 196, 70, 40, "#2c2a58", 7, INK, 1.2) + txt(211, 220, "เครื่องเล่น", 7.4, "#fff"));
  o.push(`<path d="M100 214 H172" stroke="#6af0ff" stroke-width="1.4" stroke-dasharray="3 3"/>`);
  const pk = ["A=1", "X=+0.52", "Y=-0.10", "ปุ่มอื่น=0"];
  const i = Math.floor(ph * 1.6) % 4;
  o.push(rect(88, 244, 94, 18, "#10162e", 5, "#ffe27a", 1) + txt(135, 256.5, "แพ็กเก็ต: " + pk[i], 7.6, "#ffe27a"));
  return o.join("");
};

const viewAc = (ph: number, p: number): string => {
  const o: string[] = [];
  const th = Math.sin(ph * 1.2) * 28;
  o.push(`<g transform="translate(135 112) rotate(${f2(th)})">`);
  o.push(rect(-100, -44, 200, 88, "#141c3a", 8, "#8fa2d8", 1.4));
  const sinT = Math.sin((th * Math.PI) / 180);
  const mx = sinT * 34;
  o.push(rect(-100, -30, 6, 60, "#8fa2d8", 1) + rect(94, -30, 6, 60, "#8fa2d8", 1));
  // สปริง
  const spring = (xa: number, xb: number) => { let d = `M${xa} 0`; const n = 8; for (let i = 0; i < n; i++) d += ` L${f2(xa + ((i + 0.5) * (xb - xa)) / n)} ${i % 2 ? 7 : -7}`; return `<path d="${d} L${xb} 0" stroke="#ffb04a" stroke-width="2" fill="none" stroke-linejoin="round"/>`; };
  o.push(spring(-94, -26 + mx) + spring(26 + mx, 94));
  o.push(rect(-26 + mx, -22, 52, 44, "#6af0ff", 5, INK, 1.2) + txt(mx, 4, "ตัวถ่วง", 7.4, INK));
  // ฟันหวีเก็บประจุ
  for (let i = 0; i < 4; i++) o.push(rect(-26 + mx + 4 + i * 10, -38, 2, 14, "#ffe27a") + rect(-26 + mx + 4 + i * 10, 24, 2, 14, "#ffe27a"));
  o.push(`</g>`);
  // แรงโน้มถ่วง ในกรอบโลก
  o.push(`<path d="M232 60 V120" stroke="#ff7a8a" stroke-width="3" marker-end=""/><path d="M226 112 L232 124 L238 112" stroke="#ff7a8a" stroke-width="3" fill="none"/>` + txt(232, 52, "แรงโน้มถ่วง", 6.8, "#ffb0c0"));
  o.push(rect(34, 186, 202, 16, "#141c3a", 8, "#8fa2d8", 1) + rect(135, 186, sinT * 100, 16, sinT > 0 ? "#58e08a" : "#ff9a5a", 4));
  o.push(`<path d="M135 182 V206" stroke="#fff" stroke-width="1.2"/>` + txt(135, 220, "ค่าที่เซนเซอร์อ่านได้ เปลี่ยนตามมุมเอียง", 7.4, "#cfe0ff"));
  o.push(pill(135, 26, "ตัวถ่วงจิ๋วบนสปริง ถูกแรงโน้มถ่วงดึง", "#fff6c9", 8.4));
  return o.join("");
};

const viewGy = (ph: number, p: number): string => {
  const o: string[] = [];
  const x0 = 24, x1 = 246, y0 = 120, W = x1 - x0;
  const om = (t: number) => Math.exp(-(((t - 0.4) / 0.18) ** 2)) * 1.0 - 0.45 * Math.exp(-(((t - 0.78) / 0.1) ** 2));
  o.push(rect(x0, 60, W, 110, "#141c3a", 8, "#8fa2d8", 1) + `<path d="M${x0} ${y0} H${x1}" stroke="#4a5890" stroke-width="1"/>`);
  let area = "", line = "", acc = 0;
  const tN = cl(p * 1.05 + 0.02);
  for (let i = 0; i <= 60; i++) { const t = i / 60; if (t > tN) break; const y = y0 - om(t) * 44; line += (i ? " L" : "M") + f2(x0 + 6 + t * (W - 12)) + " " + f2(y); acc += om(t) / 60; }
  area = line + ` L${f2(x0 + 6 + tN * (W - 12))} ${y0} L${x0 + 6} ${y0} Z`;
  o.push(`<path d="${area}" fill="#58e08a" opacity=".35"/><path d="${line}" stroke="#58e08a" stroke-width="2" fill="none"/>`);
  o.push(txt(x0 + 6, 74, "ความเร็วหมุน", 7.6, "#b8ffd0", "start"));
  o.push(txt(x1 - 6, 163, "เวลา →", 6.6, "#9fb0e8", "end"));
  // หน้าปัดมุม
  const ang = acc * 520;
  o.push(circ(80, 232, 30, "#141c3a", `stroke="#ffe27a" stroke-width="1.4"`));
  o.push(`<path d="M80 232 L${f2(80 + Math.sin((ang * Math.PI) / 180) * 26)} ${f2(232 - Math.cos((ang * Math.PI) / 180) * 26)}" stroke="#ffe27a" stroke-width="3" stroke-linecap="round"/>`);
  o.push(txt(80, 274, "มุมที่หมุน", 7.4, "#ffe27a"));
  o.push(pad(186, 232, 0.36, ang * 0.5, 0, 0));
  o.push(txt(135, 218, "สะสม", 7, "#b8ffd0") + `<path d="M118 222 h-6 m3 -3 l-3 3 l3 3" stroke="#b8ffd0" stroke-width="1.6" fill="none"/>`);
  o.push(pill(135, 36, "เอาความเร็วมารวมต่อเนื่อง ได้มุม", "#fff6c9", 8.6));
  return o.join("");
};

const viewRu = (ph: number, p: number): string => {
  const o: string[] = [];
  const a = ph * 12, sh = Math.cos(a) * 2.4 * sm(0.05, 0.2, p), sh2 = Math.sin(a) * 1.4 * sm(0.05, 0.2, p);
  o.push(`<g transform="translate(${f2(sh)} ${f2(sh2)})">`);
  o.push(rect(50, 70, 170, 130, "#e9eefc", 28, INK, 2));
  o.push(rect(78, 88, 114, 94, "#141c3a", 12, "#8fa2d8", 1.2));
  // มอเตอร์ + ตุ้มเยื้องศูนย์
  o.push(circ(135, 135, 36, "#2c2a58", `stroke="#8fa2d8" stroke-width="1.4"`));
  const wx = 135 + Math.cos(a) * 12, wy = 135 + Math.sin(a) * 12;
  o.push(`<path d="M135 135 L${f2(135 + Math.cos(a) * 30)} ${f2(135 + Math.sin(a) * 30)}" stroke="#7a86b8" stroke-width="3"/>`);
  o.push(`<g transform="rotate(${f2((a * 180) / Math.PI)} 135 135)"><path d="M135 135 m-24 0 a24 24 0 0 1 24 -24 a24 24 0 0 1 0 48 z" fill="#ffb04a" stroke="${INK}" stroke-width="1.2" transform="translate(3 0) scale(1) rotate(0 135 135)"/></g>`);
  o.push(circ(135, 135, 4, "#fff"));
  o.push(`</g>`);
  for (let i = 0; i < 3; i++) { const u = (ph * 1.3 + i / 3) % 1; o.push(`<path d="M44 ${f2(135 - 24 - u * 16)} q-8 24 0 48 M226 ${f2(135 - 24 - u * 16)} q8 24 0 48" stroke="#ffe27a" stroke-width="2" fill="none" opacity="${f2(1 - u)}"/>`); }
  o.push(pill(135, 40, "เกมสั่ง → มอเตอร์หมุน", "#fff6c9", 9));
  o.push(txt(135, 226, "ตุ้มติดเยื้องศูนย์ ถ่วงด้านเดียว จึงเหวี่ยงจอยสะเทือน", 7.2, "#cfe0ff"));
  return o.join("");
};

const viewW = (ph: number, p: number): string => {
  const o: string[] = [];
  const w = p;
  const tx0 = 24, tx1 = 246, ty = 126;
  // แผ่นความต้านทาน (ลายซูม)
  o.push(rect(tx0, ty, tx1 - tx0, 26, "#5a4a3a", 3, INK, 1.2));
  for (let i = 0; i < 40; i++) o.push(rect(tx0 + 4 + ((i * 17) % 210), ty + 3 + ((i * 5) % 18), 8, 1.2, "#3a2e22", 0.6, "none", 0, 'opacity=".6"'));
  // ร่องสึกตรงกลาง
  let gd = `M${tx0 + 70} ${ty}`; for (let x = tx0 + 70; x <= tx0 + 150; x += 4) gd += ` L${x} ${f2(ty + 2 + w * 9 * Math.exp(-(((x - 135) / 26) ** 2)) * (0.7 + 0.3 * Math.sin(x)))}`; gd += ` L${tx0 + 150} ${ty} Z`;
  o.push(`<path d="${gd}" fill="#1a130c"/>`);
  // เศษฝุ่น
  const n = Math.floor(18 * w);
  for (let i = 0; i < n; i++) o.push(circ(60 + rnd(i) * 150, ty - 2 - rnd(i + 5) * 5, 1 + rnd(i + 8) * 1.6, i % 3 ? "#9a8a78" : "#e0d4c0"));
  // ตัวสัมผัสไถ
  const wx = 135 + Math.sin(ph * 1.6) * 40;
  o.push(`<path d="M${f2(wx - 14)} ${ty - 42} L${f2(wx + 14)} ${ty - 42} L${f2(wx + 2)} ${ty - 2} L${f2(wx - 2)} ${ty - 2} Z" fill="#cdd5e6" stroke="${INK}" stroke-width="1.2"/>`);
  o.push(txt(wx, ty - 48, "ตัวสัมผัส", 7, "#fff"));
  // สปริงคืนศูนย์
  const len = 40 - 14 * w, sx = 135;
  let d = `M${sx} 190`; for (let i = 0; i < 9; i++) d += ` L${f2(sx + (i % 2 ? 9 : -9))} ${f2(190 + ((i + 1) * len) / 9)}`;
  o.push(`<path d="${d}" stroke="${mixc("#ffb04a", "#8a7a68", w)}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`);
  o.push(txt(sx + 22, 205, "สปริงคืนศูนย์", 7, "#ffe0b0", "start") + txt(sx + 22, 215, w > 0.5 ? "อ่อนลง" : "ยังตึง", 7, w > 0.5 ? "#ff9a8a" : "#b8ffd0", "start"));
  // ค่าตอนปล่อยก้าน
  const off = 0.12 * w;
  o.push(rect(24, 238, 222, 18, "#141c3a", 9, "#8fa2d8", 1) + `<path d="M135 234 V260" stroke="#fff" stroke-width="1.2"/>` + circ(135 + off * 700, 247, 5, off > 0.05 ? "#ff5a4a" : "#58e08a", `stroke="#fff" stroke-width="1"`));
  o.push(txt(135, 276, "ค่าตอนปล่อยก้าน (ควรอยู่กึ่งกลางพอดี)", 6.8, "#cfe0ff"));
  o.push(pill(135, 40, w < 0.4 ? "ไถซ้ำๆ แผ่นเริ่มสึก" : "แผ่นสึก + ฝุ่นเกาะ", "#fff6c9", 8.8));
  return o.join("");
};

const viewD = (ph: number, p: number): string => {
  const o: string[] = [];
  const x0 = 34, x1 = 236, yb = 150, H0 = 76;
  o.push(rect(x0, 56, x1 - x0, 126, "#141c3a", 8, "#8fa2d8", 1));
  o.push(rect(x0 + 2, yb - 16, x1 - x0 - 4, 32, "#6af0ff", 0, "none", 0, 'opacity=".2"'));
  o.push(txt(x0 + 6, yb + 12, "ช่วงที่ซอฟต์แวร์ยอมให้คลาดเคลื่อน", 6.4, "#b8f4ff", "start"));
  o.push(`<path d="M${x0} ${yb} H${x1}" stroke="#4a5890" stroke-width="1"/>`);
  const f = (t: number) => 3 + 62 * t * t;
  const tN = sm(0.05, 0.85, p);
  let d = ""; for (let i = 0; i <= 50; i++) { const t = i / 50; if (t > tN) break; d += (i ? " L" : "M") + f2(x0 + 8 + t * (x1 - x0 - 16)) + " " + f2(yb - f(t)); }
  o.push(`<path d="${d}" stroke="#ffb04a" stroke-width="2.4" fill="none"/>`);
  const cx = x0 + 8 + tN * (x1 - x0 - 16), cy = yb - f(tN), out = f(tN) > 16;
  o.push(circ(cx, cy, 4.4, out ? "#ff5a4a" : "#58e08a", `stroke="#fff" stroke-width="1"`));
  o.push(txt(x0 + 6, 70, "ค่าตอนปล่อยก้าน", 7.2, "#ffe0b0", "start") + txt(x1 - 6, 176, "ใช้นานขึ้น →", 6.6, "#9fb0e8", "end"));
  // จอทีวี
  const hx = out ? 135 + ((ph * 14) % 60) - 10 : 135;
  o.push(tv(90, 200, 90, 50, hx, out, ph));
  o.push(pill(135, 268, out ? "เกินช่วง: ตัวละครเดินเอง!" : "ยังอยู่ในช่วง ซอฟต์แวร์ชดเชยได้", out ? "#ffd8cf" : "#d9ffd0", 8.4));
  return o.join("");
};

const viewHa = (ph: number, p: number): string => {
  const o: string[] = [];
  const a = Math.sin(ph * 1.4) * 0.7; // rad
  o.push(rect(70, 190, 130, 14, "#1f8a62", 3, INK, 1) + rect(118, 176, 34, 14, "#2c2a58", 3, INK, 1.2) + txt(135, 186.5, "เซนเซอร์ฮอลล์", 6.4, "#fff"));
  // เส้นแรงแม่เหล็ก
  o.push(`<g transform="translate(135 120) rotate(${f2((a * 180) / Math.PI)})">`);
  o.push(rect(-9, -40, 18, 80, "#ddd", 2, INK, 1.2) + rect(-9, -40, 18, 40, "#ff5a5a", 2, INK, 1.2) + rect(-9, 0, 18, 40, "#5a8aff", 2, INK, 1.2) + txt(0, -22, "N", 11, "#fff") + txt(0, 30, "S", 11, "#fff"));
  for (let i = 0; i < 4; i++) { const r = 24 + i * 12; o.push(`<path d="M-9 -30 C${-r - 10} -48 ${-r - 10} 48 -9 30 M9 -30 C${r + 10} -48 ${r + 10} 48 9 30" stroke="#ffe27a" stroke-width="1" fill="none" opacity="${f2(0.7 - i * 0.12)}" stroke-dasharray="3 3"/>`); }
  o.push(`</g>`);
  o.push(`<path d="M135 160 V172" stroke="#fff" stroke-width="1" stroke-dasharray="2 2"/>` + txt(172, 168, "ช่องว่าง ไม่แตะกัน", 7.2, "#ffe27a", "start"));
  o.push(`<path d="M135 78 L135 40" stroke="#ddd" stroke-width="10" stroke-linecap="round" transform="rotate(${f2((a * 180) / Math.PI)} 135 120)"/>`);
  o.push(rect(34, 226, 202, 16, "#141c3a", 8, "#8fa2d8", 1) + circ(135 + a * 130, 234, 5, "#58e08a", `stroke="#fff" stroke-width="1"`));
  o.push(txt(135, 258, "เซนเซอร์อ่านมุมจากทิศของสนามแม่เหล็ก", 7.2, "#cfe0ff"));
  o.push(pill(135, 26, "แม่เหล็ก + เซนเซอร์ฮอลล์ ไม่มีส่วนเสียดสี", "#fff6c9", 8.2));
  return o.join("");
};

const viewN = (ph: number, p: number): string => {
  const o: string[] = [];
  const hx = 120 + ((ph * 16) % 60);
  o.push(tv(75, 26, 120, 70, hx, true, ph));
  o.push(pad(135, 168, 0.86, 0, 0, 0));
  o.push(`<path d="M0 0" /><g opacity="${f2(0.4 + 0.6 * Math.abs(Math.sin(ph * 4)))}"><path d="M96 168 q-12 -10 0 -20" stroke="#ff5a4a" stroke-width="2" fill="none"/></g>`);
  o.push(pill(135, 116, "ไม่ได้แตะก้าน", "#e7efff", 8));
  o.push(pill(135, 244, "ปล่อยก้านแล้วยังเดินเอง", "#ffd8cf", 9.4));
  o.push(txt(135, 266, "ปรับเทียบแล้วก็ยังเดิน = ก้านสึก", 7.4, "#cfe0ff"));
  return o.join("");
};

const draw = (c: string, ph: number, p: number): string => {
  switch (KIND[c]) {
    case "G": return viewG(c, ph, p);
    case "T": return viewT(ph, p);
    case "S": return viewS(ph, p);
    case "V": return viewV(ph, p);
    case "R": return viewR(ph, p);
    case "Pr": return viewPr(ph, p);
    case "Bt": return viewBt(ph, p);
    case "Ac": return viewAc(ph, p);
    case "Gy": return viewGy(ph, p);
    case "Ru": return viewRu(ph, p);
    case "W": return viewW(ph, p);
    case "D": return viewD(ph, p);
    case "Ha": return viewHa(ph, p);
    default: return viewN(ph, p);
  }
};
export const SCENE_GAMEPAD: SceneDef = {
  focus: FOCUS,
  render: ({ frame, cue, p, ef }) => {
    const ph = frame / 30;
    const c = ORDER.includes(cue) ? cue : "all";
    const i = ORDER.indexOf(c), prev = i > 0 ? ORDER[i - 1] : null;
    const e = sm(0, 16, ef);
    const o: string[] = [bgf(ph, BG1, BG2, DOT)];
    if (prev && e < 1 && KIND[prev] !== KIND[c]) o.push(`<g opacity="${f2(1 - e)}">${draw(prev, ph, 1)}</g><g opacity="${f2(e)}">${draw(c, ph, p)}</g>`);
    else o.push(draw(c, ph, p));
    return o.join("");
  },
};
