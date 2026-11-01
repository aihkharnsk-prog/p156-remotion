// ฉากอธิบาย: หูฟังตัดเสียงรบกวน (ANC) — ไมค์จับเสียง, ชิปสร้างคลื่นกลับเฟส, ลำโพงหักล้าง, ข้อจำกัดเสียงสูง/ฉับพลัน, แบตเสื่อม — SVG พิกัด 270x480 (หนึ่งมุมมองต่อหนึ่ง cue ครอสเฟดเมื่อเปลี่ยน)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const TAU = Math.PI * 2;
const INK = "#1a1440";
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
const BG1 = "#272055", BG2 = "#0f0b28", DOT = "#a8b8ff";
const ORDER = ["all", "sound", "mics", "dsp", "invert", "speak", "music", "phase", "inner", "low", "sudden", "seal", "batt", "nudge", "end"];
const KIND: Record<string, string> = { all: "E", end: "E", sound: "S", mics: "M", dsp: "D", invert: "I", speak: "Sp", music: "Mu", phase: "Ph", inner: "In", low: "Lo", sudden: "Su", seal: "Se", batt: "Ba", nudge: "Nu" };
const FOCUS: Record<string, { cx: number; cy: number; z: number }> = {};
for (const c of ORDER) FOCUS[c] = fc(135, 150, 1);
const CN = "#ff9a3a", CA = "#58b4ff", CS = "#58e08a", CM = "#d28aff"; // เสียงรบกวน / กลับเฟส / ผลรวม / เพลง

const plot = (x: number, y: number, w: number, h: number, label: string, col: string) =>
  rect(x, y, w, h, "#141238", 6, "#6a76c8", 0.9) + `<path d="M${x + 4} ${f2(y + h / 2)} H${x + w - 4}" stroke="#3a4488" stroke-width=".8"/>` + txt(x + 6, y + 9, label, 6.8, col, "start");
const earbudShape = (x: number, y: number, k = 1, rot = 0) =>
  `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${rot}) scale(${k})"><path d="M-22 -26 Q-22 -42 0 -42 Q22 -42 22 -26 L22 6 Q22 22 8 24 L8 56 Q8 62 2 62 H-2 Q-8 62 -8 56 V24 Q-22 22 -22 6 Z" fill="#f2f4ff" stroke="${INK}" stroke-width="2"/><circle cx="0" cy="-18" r="9" fill="#cfd6ff" stroke="${INK}" stroke-width="1.2"/><rect x="-5" y="-50" width="10" height="9" rx="3" fill="#8a96d8" stroke="${INK}" stroke-width="1"/></g>`;

const viewE = (c: string, ph: number, p: number): string => {
  const o: string[] = [];
  const ph2 = ph * 5, yb = 120, dec = c === "end" ? 1 : sm(0.1, 0.7, p);
  // รถ/เครื่องยนต์ด้านซ้าย
  o.push(rect(10, 98, 36, 20, "#ff7a6a", 6, INK, 1.2) + circ(20, 122, 5, "#222") + circ(38, 122, 5, "#222") + rect(16, 90, 18, 10, "#ffc9a0", 3, INK, 1));
  // คลื่นเสียงรบกวน แอมพลิจูดลดลงหลังหูฟัง
  let d = "";
  for (let x = 52; x <= 262; x += 2) { const a = x < 150 ? 20 : 20 * (1 - dec * 0.95 * sm(150, 185, x)); d += (x === 52 ? "M" : " L") + x + " " + f2(yb + a * Math.sin((x / 16) * 1 - ph2)); }
  o.push(`<path d="${d}" stroke="${CN}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  // หูฟัง
  o.push(rect(150, 70, 34, 100, "#f2f4ff", 12, INK, 1.8) + circ(167, 120, 9, "#cfd6ff", `stroke="${INK}" stroke-width="1.2"`) + txt(167, 188, "หูฟัง", 8, "#fff"));
  o.push(txt(100, 66, "เสียงรอบตัว", 8, CN) + txt(220, 66, dec > 0.6 ? "ในหู: เบาลงมาก" : "ในหู", 8, CS));
  // หู
  o.push(`<path d="M196 90 Q240 80 244 124 Q246 164 206 168" fill="#f0c6a0" stroke="${INK}" stroke-width="1.6" opacity=".9"/>`);
  if (c === "end") for (let i = 0; i < 6; i++) { const a = ph * 2.5 + i; o.push(`<path d="M${f2(135 + Math.cos(a) * 118)} ${f2(150 + Math.sin(a * 1.3) * 80)} l0 -4 m-2 2 h4" stroke="#ffe27a" stroke-width="1.4" opacity="${f2(0.4 + 0.6 * Math.abs(Math.sin(a * 2)))}"/>`); }
  return o.join("");
};

const viewS = (ph: number, p: number): string => {
  const o: string[] = [];
  // อนุภาคอากาศ: ความหนาแน่นแกว่งตามคลื่น
  const rows = 7, cols = 34;
  o.push(rect(14, 54, 242, 100, "#141238", 8, "#6a76c8", 0.9));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = 22 + c * 7, disp = 3.2 * Math.sin((x0 / 24) * Math.PI * 1.0 - ph * 5);
    o.push(circ(x0 + disp, 64 + r * 13 + (c % 2) * 3, 1.5, "#cfd8ff"));
  }
  // กราฟความดัน
  o.push(plot(14, 176, 242, 62, "ความดันอากาศ", "#cfd8ff"));
  o.push(wave(18, 252, 207, 20, 48, ph * 5 * 0.45 * 7 / 7 * 1.0 - ph * 0 + 0, "#cfd8ff", 2));
  o.push(txt(30, 170, "อัด", 7.4, "#ffc9a0") + txt(70, 170, "เบาบาง", 7.4, "#a8d8ff"));
  o.push(pill(135, 36, "เสียง = คลื่นอัด-เบาบางของอากาศ", "#fff6c9", 8.4));
  o.push(txt(135, 262, "เดินทางมาถึงแก้วหูเป็นจังหวะ", 7.6, "#cfd8ff"));
  return o.join("");
};

const bud = (ph: number, extra: string) => {
  const o: string[] = [];
  // ช่องหู + ตัวหูฟังตัดครึ่ง
  o.push(`<path d="M30 70 Q30 56 60 56 H140 L212 100 L212 160 L140 204 H60 Q30 204 30 190 Z" fill="#f2f4ff" stroke="${INK}" stroke-width="2.2"/>`);
  o.push(`<path d="M212 100 L246 100 Q256 130 246 160 L212 160 Z" fill="#f0c6a0" stroke="${INK}" stroke-width="1.6"/><text x="236" y="134" font-size="6.6" fill="${INK}" ${K} font-weight="800" text-anchor="middle">ช่องหู</text>`);
  o.push(rect(44, 80, 120, 100, "#cfd6ff", 8, "#8a96d8", 1));
  o.push(rect(150, 106, 14, 48, "#6a76c8", 2, INK, 1) + txt(124, 134, "ลำโพง", 6.8, INK));
  o.push(rect(52, 90, 40, 24, "#a7b4f0", 3, INK, 1) + txt(72, 105, "ชิป", 7.6, INK));
  o.push(extra);
  return o.join("");
};

const viewM = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(bud(ph, ""));
  // ไมค์ด้านนอก
  o.push(circ(60, 52, 8, "#ffe27a", `stroke="${INK}" stroke-width="1.4"`) + circ(60, 52, 3, "#a78a1a"));
  o.push(lead(60, 44, 100, 28, "#ffe27a") + txt(101, 26, "ไมค์ด้านนอก", 7.6, "#ffe27a", "start"));
  for (let i = 0; i < 4; i++) { const u = (ph * 0.8 + i / 4) % 1; o.push(`<path d="M${f2(-6 + u * 52)} ${f2(20 + 18 * 0)} q6 14 0 28" stroke="${CN}" stroke-width="2" fill="none" opacity="${f2(1 - u)}" transform="translate(${f2(0)} ${f2(8)})"/>`); }
  o.push(`<path d="M0 36 q10 14 0 28" stroke="${CN}" stroke-width="2.4" fill="none" opacity="0"/>`);
  o.push(pill(135, 236, "จับเสียงรอบตัวก่อนเข้าถึงหู", "#fff6c9", 8.6));
  return o.join("");
};

const viewD = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(plot(14, 50, 112, 66, "ไมค์ได้ยิน", CN));
  o.push(wave(18, 122, 85, 18, 30, -ph * 5, CN, 2));
  o.push(rect(140, 62, 52, 40, "#a7b4f0", 6, INK, 1.4) + txt(166, 86, "ชิป", 9, INK));
  o.push(`<path d="M126 83 H140 M192 83 H206" stroke="#ffe27a" stroke-width="2"/>`);
  o.push(plot(206, 50, 52, 66, "", CA));
  o.push(wave(208, 256, 85, 14, 24, -ph * 5 + Math.PI, CA, 2));
  // เส้นเวลา
  const T0 = 22, T1 = 248, ty = 178;
  o.push(`<path d="M${T0} ${ty} H${T1}" stroke="#cfd8ff" stroke-width="1.6"/>`);
  const t1 = 60, t2 = 150, t3 = 210;
  o.push(circ(t1, ty, 4, CN) + txt(t1, ty + 16, "ไมค์ได้ยิน", 7, CN) + circ(t2, ty, 4, "#ffe27a") + txt(t2, ty + 16, "ชิปคำนวณเสร็จ", 7, "#ffe27a") + circ(t3, ty, 4, CS) + txt(t3, ty + 16, "เสียงถึงหู", 7, CS));
  const cur = lerp(t1, t3, ((ph * 0.5) % 1));
  o.push(`<path d="M${f2(cur)} ${ty - 14} V${ty + 4}" stroke="#fff" stroke-width="2"/>`);
  o.push(`<path d="M${t1} ${ty - 12} H${t3}" stroke="#fff" stroke-width="1" stroke-dasharray="2 2"/>`);
  o.push(txt((t1 + t3) / 2, ty - 18, "ช่วงเวลาสั้นมาก ที่ต้องทำให้ทัน", 7.2, "#fff"));
  o.push(pill(135, 36, "ชิปดูรูปคลื่น แล้วคำนวณล่วงหน้า", "#fff6c9", 8.6));
  return o.join("");
};

const viewI = (ph: number, p: number): string => {
  const o: string[] = [];
  const m = sm(0.1, 0.6, p);
  o.push(plot(24, 50, 222, 76, "เสียงรบกวนเดิม", CN));
  o.push(wave(28, 242, 88, 24, 40, -ph * 3, CN, 2.4));
  o.push(plot(24, 160, 222, 76, "คลื่นกลับเฟส", CA));
  // คลื่นกลับเฟสพลิกจากเดิม (ใช้ m เป็นสัดส่วนการพลิก)
  const ampf = Math.cos(m * Math.PI); // 1 -> -1
  let d = ""; for (let x = 28; x <= 242; x += 2) d += (x === 28 ? "M" : " L") + x + " " + f2(198 + 24 * ampf * Math.sin(((x - 28) / 40) * TAU - ph * 3));
  o.push(`<path d="${d}" stroke="${CA}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  o.push(`<path d="M135 130 V156" stroke="#ffe27a" stroke-width="2"/><path d="M129 150 l6 8 l6 -8" stroke="#ffe27a" stroke-width="2" fill="none"/>` + txt(160, 148, "พลิกกลับด้าน", 7.6, "#ffe27a", "start"));
  // เส้นเชื่อมจุดสูง-ต่ำ
  const px = 28 + 40 * (0.25 + Math.floor(ph * 0.5)) * 0 + 28 * 0 + 52;
  o.push(`<path d="M${px} 56 V232" stroke="#fff" stroke-width=".8" stroke-dasharray="2 3" opacity=".5"/>`);
  o.push(pill(135, 262, "อัด → เบาบาง   เบาบาง → อัด", "#fff6c9", 8.6));
  return o.join("");
};

const viewSp = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(plot(24, 44, 222, 56, "เสียงรบกวน", CN) + wave(28, 242, 72, 18, 40, -ph * 3, CN, 2.2));
  o.push(txt(135, 112, "+", 16, "#fff"));
  o.push(plot(24, 118, 222, 56, "เสียงกลับเฟสจากลำโพง", CA) + wave(28, 242, 146, 18, 40, -ph * 3 + Math.PI, CA, 2.2));
  o.push(txt(135, 186, "=", 16, "#fff"));
  const rip = 2 + Math.sin(ph * 4) * 0.8;
  o.push(plot(24, 192, 222, 56, "ที่หู: เหลือน้อยมาก", CS));
  let d = ""; for (let x = 28; x <= 242; x += 2) d += (x === 28 ? "M" : " L") + x + " " + f2(220 + rip * Math.sin(x * 0.4 - ph * 7));
  o.push(`<path d="${d}" stroke="${CS}" stroke-width="2.4" fill="none"/>`);
  o.push(pill(135, 262, "คลื่นสองลูกหักล้างกัน", "#fff6c9", 9));
  return o.join("");
};

const viewMu = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(plot(24, 44, 222, 46, "เสียงรบกวน", CN) + wave(28, 242, 67, 14, 36, -ph * 3, CN, 2));
  o.push(plot(24, 98, 222, 46, "คลื่นกลับเฟส", CA) + wave(28, 242, 121, 14, 36, -ph * 3 + Math.PI, CA, 2));
  o.push(plot(24, 152, 222, 46, "เพลงจากหูฟัง", CM));
  let m = ""; for (let x = 28; x <= 242; x += 2) m += (x === 28 ? "M" : " L") + x + " " + f2(175 + 9 * Math.sin(x * 0.12 - ph * 2) + 6 * Math.sin(x * 0.31 - ph * 3.3));
  o.push(`<path d="${m}" stroke="${CM}" stroke-width="2" fill="none"/>`);
  o.push(`<path d="M135 92 V96 M135 146 V150" stroke="#fff" stroke-width="1.6"/>`);
  o.push(plot(24, 212, 222, 44, "ที่หู: ได้ยินแต่เพลง", CS));
  let r = ""; for (let x = 28; x <= 242; x += 2) r += (x === 28 ? "M" : " L") + x + " " + f2(237 + 9 * Math.sin(x * 0.12 - ph * 2) + 6 * Math.sin(x * 0.31 - ph * 3.3));
  o.push(`<path d="${r}" stroke="${CS}" stroke-width="2.2" fill="none"/>`);
  o.push(pill(135, 32, "เพลงผสมไปกับคลื่นกลับเฟส", "#fff6c9", 8.8));
  return o.join("");
};

const viewPh = (ph: number, p: number): string => {
  const o: string[] = [];
  const sh = (Math.sin(ph * 0.9) * 0.5 + 0.5) * Math.PI; // 0..pi เลื่อนช้าไป
  const amp = Math.abs(Math.cos(sh / 2)); // 1 = ดังขึ้น 0 = เงียบ
  const a2 = Math.abs(Math.sin(sh / 2)); // 0 เมื่อตรงกัน (เฟสกลับพอดี)
  o.push(plot(24, 44, 222, 50, "เสียงรบกวน", CN) + wave(28, 242, 69, 15, 40, 0, CN, 2));
  o.push(plot(24, 100, 222, 50, "คลื่นกลับเฟส (เลื่อนช้าไป)", CA) + wave(28, 242, 125, 15, 40, Math.PI + sh, CA, 2));
  o.push(plot(24, 156, 222, 50, "ผลที่หู", CS));
  let d = ""; for (let x = 28; x <= 242; x += 2) { const t = ((x - 28) / 40) * TAU; d += (x === 28 ? "M" : " L") + x + " " + f2(181 + 15 * (Math.sin(t) + Math.sin(t + Math.PI + sh))); }
  o.push(`<path d="${d}" stroke="${CS}" stroke-width="2.4" fill="none"/>`);
  const good = sh < 0.5;
  o.push(rect(24, 216, 222, 14, "#141238", 7, "#6a76c8", 0.9) + rect(24, 216, 222 * clamp01(a2), 14, mixc("#58e08a", "#ff5a4a", clamp01(a2)), 7));
  o.push(txt(135, 246, good ? "ตรงเวลา: เงียบลง" : "ช้าไป: บางส่วนเพี้ยน ดังขึ้นได้", 7.8, good ? "#b8ffd0" : "#ffb0a0"));
  o.push(pill(135, 32, "ถ้าช้าหรือเฟสเพี้ยน ก็หักล้างไม่หมด", "#fff6c9", 8.6));
  return o.join("");
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const viewIn = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(bud(ph, ""));
  o.push(circ(188, 108, 7, "#58e08a", `stroke="${INK}" stroke-width="1.4"`) + circ(188, 108, 2.4, "#1a6a3a"));
  o.push(lead(188, 114, 226, 196, "#58e08a") + txt(226, 208, "ไมค์ด้านใน", 7.6, "#58e08a"));
  // เส้นวนปรับ
  o.push(`<path d="M188 100 Q150 40 72 88" stroke="#ffe27a" stroke-width="1.4" stroke-dasharray="3 3" fill="none"/>`);
  for (let i = 0; i < 4; i++) { const u = (ph * 0.8 + i / 4) % 1, q = qb([188, 100], [150, 40], [72, 88], u); o.push(circ(q[0], q[1], 2.2, "#ffe27a")); }
  o.push(wave(168, 212, 134, 3, 10, -ph * 8, CS, 1.6, 2));
  o.push(txt(135, 28, "ฟังเสียงที่ยังเหลือในช่องหู", 8, "#b8ffd0") + txt(135, 40, "แล้วส่งให้ชิปปรับ", 8, "#ffe27a"));
  o.push(pill(135, 236, "ตรวจซ้ำ ปรับให้แม่นขึ้น", "#fff6c9", 8.6));
  return o.join("");
};

const viewLo = (ph: number, p: number): string => {
  const o: string[] = [];
  const x0 = 34, x1 = 244, y0 = 200, yT = 70;
  o.push(rect(24, 50, 226, 170, "#141238", 8, "#6a76c8", 0.9));
  o.push(txt(135, 66, "ตัดเสียงได้มาก-น้อยแค่ไหน", 7.8, "#cfd8ff"));
  const f = (t: number) => 1 / (1 + Math.exp((t - 0.38) * 9)); // สูงที่เสียงต่ำ
  let d = `M${x0} ${y0}`; const tN = sm(0.05, 0.8, p);
  for (let i = 0; i <= 60; i++) { const t = i / 60; if (t > tN) break; d += ` L${f2(x0 + t * (x1 - x0))} ${f2(y0 - f(t) * (y0 - yT - 14))}`; }
  o.push(`<path d="${d}" stroke="${CS}" stroke-width="2.6" fill="none"/>`);
  o.push(`<path d="${d} L${f2(x0 + tN * (x1 - x0))} ${y0} L${x0} ${y0} Z" fill="${CS}" opacity=".18"/>`);
  o.push(`<path d="M${x0} ${y0} H${x1}" stroke="#cfd8ff" stroke-width="1"/>`);
  o.push(txt(x0, y0 + 12, "เสียงต่ำ", 7.2, "#cfd8ff", "start") + txt(x1, y0 + 12, "เสียงสูง", 7.2, "#cfd8ff", "end"));
  o.push(rect(36, 100, 56, 14, "#2a3470", 7) + txt(64, 110, "เครื่องยนต์ แอร์", 6.4, "#fff"));
  o.push(rect(160, 150, 64, 14, "#4a2a60", 7) + txt(192, 160, "เสียงคนพูด", 6.4, "#fff"));
  o.push(pill(135, 36, "ถนัดเสียงต่ำที่สม่ำเสมอ", "#fff6c9", 9));
  o.push(txt(135, 240, "คลื่นยาวและคาดเดาได้ ชิปตามทัน", 7.6, "#cfd8ff"));
  return o.join("");
};

const viewSu = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(plot(24, 60, 222, 70, "เสียงปรบมือถึงหู", CN));
  const cur = sm(0.05, 0.95, p);
  const spike = (x: number, h: number, col: string) => `<path d="M${x - 6} 95 L${x} ${f2(95 - h)} L${x + 5} 108 L${x + 12} 95" stroke="${col}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`;
  o.push(`<path d="M28 95 H${f2(24 + 222 * 0.3)}" stroke="${CN}" stroke-width="1.6"/>` + spike(24 + 222 * 0.3, 28, CN) + `<path d="M${f2(24 + 222 * 0.3 + 12)} 95 H242" stroke="${CN}" stroke-width="1.6"/>`);
  o.push(plot(24, 150, 222, 70, "เสียงกลับเฟส (มาช้ากว่า)", CA));
  o.push(`<path d="M28 185 H${f2(24 + 222 * 0.55)}" stroke="${CA}" stroke-width="1.6"/>` + spike(24 + 222 * 0.55, -28, CA) + `<path d="M${f2(24 + 222 * 0.55 + 12)} 185 H242" stroke="${CA}" stroke-width="1.6"/>`);
  const cx = 24 + 222 * cur;
  o.push(`<path d="M${f2(cx)} 56 V222" stroke="#fff" stroke-width="1.4" opacity=".85"/>`);
  o.push(`<path d="M${f2(24 + 222 * 0.3 + 4)} 140 H${f2(24 + 222 * 0.55 + 4)}" stroke="#ffe27a" stroke-width="1.4" marker-end=""/><path d="M${f2(24 + 222 * 0.55 - 2)} 135 l7 5 l-7 5" stroke="#ffe27a" stroke-width="1.6" fill="none"/>` + txt(24 + 222 * 0.43, 134, "ตามไม่ทัน", 7.2, "#ffe27a"));
  o.push(pill(135, 32, "เสียงฉับพลัน มาถึงก่อนชิปคำนวณเสร็จ", "#fff6c9", 8.4));
  o.push(txt(135, 244, "จึงยังได้ยินเสียงสูงฉับพลันอยู่บ้าง", 7.8, "#ffb0a0"));
  return o.join("");
};

const viewSe = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(`<path d="M20 60 H150 V180 H20 Z" fill="#232050" stroke="#6a76c8" stroke-width="1"/>`);
  o.push(`<path d="M150 90 H240 Q256 120 240 150 H150" fill="#f0c6a0" stroke="${INK}" stroke-width="1.6"/>`);
  o.push(`<path d="M150 80 L190 96 Q200 120 190 144 L150 160 Z" fill="#7a86d8" stroke="${INK}" stroke-width="1.6"/>` + txt(172, 124, "จุกหู", 7.4, "#fff"));
  o.push(txt(210, 126, "ช่องหู", 7.4, INK));
  // คลื่นเสียงสูง (ถี่) วิ่งมาชนจุกแล้วสะท้อนกลับ
  for (let i = 0; i < 3; i++) {
    const u = (ph * 0.7 + i / 3) % 1, y = 90 + i * 26, ref = u > 0.75;
    const x = ref ? 150 - (u - 0.75) * 4 * 110 : 24 + u / 0.75 * 100;
    o.push(wave(x - 12, x + 12, y, 5, 6, -ph * 12, "#ffd070", 2, 1.5));
    if (u > 0.7 && u < 0.8) o.push(circ(152, y, 5, "#ffd070", 'opacity=".5"'));
  }
  o.push(txt(86, 52, "เสียงสูง ถูกจุกหูกั้นไว้", 7.8, "#ffd070"));
  o.push(wave(20, 100, 170, 4, 14, -ph * 8, CN, 1.8, 2));
  o.push(txt(60, 196, "(เสียงต่ำผ่านได้ จึงใช้ชิปตัดอีกทาง)", 6.8, "#cfd8ff"));
  o.push(pill(135, 236, "ตัดสองทาง: ปิดกั้น + หักล้างด้วยคลื่น", "#fff6c9", 8.6));
  return o.join("");
};

const viewBa = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(earbudShape(52, 98, 1.1, 0));
  o.push(rect(116, 86, 70, 40, "#141238", 8, "#6a76c8", 1) + rect(186, 98, 6, 16, "#6a76c8", 2));
  const cap = 1 - 0.5 * sm(0.1, 0.9, p), sagging = 0.35 + 0.3 * Math.sin(ph * 2);
  o.push(rect(120, 90, 62 * cap * (0.6 + 0.4 * (0.5 + 0.5 * Math.sin(ph * 1.2))), 32, mixc("#ff7a6a", "#58e08a", cap), 5));
  o.push(txt(151, 80, "แบตก้อนเล็ก", 7.4, "#cfd8ff"));
  // วงจรไฟไปเลี้ยงชิป/ไมค์/ลำโพง
  o.push(txt(135, 168, "ไมค์ + ชิป + ลำโพง ใช้ไฟตลอดที่เปิดตัดเสียง", 7.2, "#ffd070"));
  const n = 6;
  for (let i = 0; i < n; i++) {
    const c = 1 - 0.5 * (i / (n - 1)) * sm(0.05 + i * 0.1, 0.35 + i * 0.12, p), x = 34 + i * 36;
    o.push(rect(x, 200, 28, 44, "#141238", 4, "#6a76c8", 0.8) + rect(x, 200 + 44 * (1 - c), 28, 44 * c, mixc("#ff7a6a", "#58e08a", c), 4) + txt(x + 14, 258, i ? `รอบ ${i}` : "ใหม่", 6.2, "#cfd8ff"));
  }
  o.push(pill(135, 36, "ชาร์จซ้ำ ความจุลดลงทีละน้อย", "#fff6c9", 9));
  return o.join("");
};

const viewNu = (ph: number, p: number): string => {
  const o: string[] = [];
  const lv = [0.12 + 0.03 * Math.sin(ph * 3), 0.55];
  const names = ["ข้างซ้าย", "ข้างขวา"];
  for (let i = 0; i < 2; i++) {
    const x = 70 + i * 130;
    o.push(earbudShape(x, 110, 1.15, 0));
    o.push(rect(x - 30, 190, 60, 16, "#141238", 8, "#6a76c8", 1) + rect(x - 28, 192, 56 * lv[i], 12, mixc("#ff5a4a", "#58e08a", lv[i] * 1.3), 6));
    o.push(txt(x, 224, names[i], 8, "#fff") + txt(x, 238, `${Math.round(lv[i] * 100)}%`, 8, i ? "#b8ffd0" : "#ffb0a0"));
  }
  const bl = 0.5 + 0.5 * Math.sin(ph * 6);
  o.push(circ(70, 176, 4, "#ff5a4a", `opacity="${f2(0.3 + 0.7 * bl)}"`));
  o.push(pill(135, 32, "ข้างเดียวหมดก่อนอีกข้างบ่อยๆ", "#ffd8cf", 9.2));
  return o.join("");
};

const draw = (c: string, ph: number, p: number): string => {
  switch (KIND[c]) {
    case "E": return viewE(c, ph, p);
    case "S": return viewS(ph, p);
    case "M": return viewM(ph, p);
    case "D": return viewD(ph, p);
    case "I": return viewI(ph, p);
    case "Sp": return viewSp(ph, p);
    case "Mu": return viewMu(ph, p);
    case "Ph": return viewPh(ph, p);
    case "In": return viewIn(ph, p);
    case "Lo": return viewLo(ph, p);
    case "Su": return viewSu(ph, p);
    case "Se": return viewSe(ph, p);
    case "Ba": return viewBa(ph, p);
    default: return viewNu(ph, p);
  }
};
export const SCENE_ANCEARTBUDS: SceneDef = {
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
