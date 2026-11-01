// ฉากอธิบาย: เครื่องเกมพกพา 400 เกม — เกมเก็บในแฟลช, ชิปจำลองเครื่องเก่า, จอแอลซีดี, ปุ่มกด, แบตลิเธียม — SVG พิกัด 270x480 (หนึ่งมุมมองต่อหนึ่ง cue ครอสเฟดเมื่อเปลี่ยน)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const TAU = Math.PI * 2;
const INK = "#1a1236";
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
const BG1 = "#2c2050", BG2 = "#110b26", DOT = "#9fe0ff";
const ORDER = ["all", "rom", "chip", "menu", "cpu", "pixels", "lcd", "color", "btn", "limit", "batt", "age", "nudge", "end"];
const KIND: Record<string, string> = { all: "D", end: "D", rom: "R", chip: "C", menu: "M", cpu: "U", pixels: "P", lcd: "L", color: "K", btn: "T", limit: "G", batt: "B", age: "A", nudge: "N" };
const FOCUS: Record<string, { cx: number; cy: number; z: number }> = {};
for (const c of ORDER) FOCUS[c] = fc(135, 150, 1);
FOCUS.all = fc(135, 140, 1.0);
FOCUS.end = fc(135, 140, 1.0);

// ภาพเกมพิกเซลสมมติ (วาดเอง) ใน viewBox 130x92
const gameScreen = (x: number, y: number, w: number, h: number, ph: number, glitch = 0): string => {
  const o: string[] = [];
  o.push(`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 130 92" overflow="hidden" shape-rendering="crispEdges">`);
  o.push(`<rect width="130" height="92" fill="#58b8ff"/><rect y="50" width="130" height="14" fill="#8fd4ff"/>`);
  const cx = (ph * 8) % 130;
  o.push(`<rect x="${f2(130 - cx)}" y="12" width="22" height="7" fill="#fff"/><rect x="${f2(138 - cx)}" y="8" width="12" height="5" fill="#fff"/>`);
  // พื้นอิฐเลื่อน
  const off = (ph * 36) % 16;
  o.push(`<rect y="70" width="130" height="22" fill="#c8602a"/>`);
  for (let r = 0; r < 2; r++) for (let i = -1; i < 10; i++) o.push(`<rect x="${f2(i * 16 - off + (r ? 8 : 0))}" y="${70 + r * 11}" width="15" height="10" fill="#e08a3c"/>`);
  o.push(`<rect y="70" width="130" height="2" fill="#6bd04a"/>`);
  // ท่อเลื่อน
  const px = 150 - ((ph * 36) % 190);
  o.push(`<rect x="${f2(px)}" y="52" width="14" height="18" fill="#2eae4a"/><rect x="${f2(px - 2)}" y="52" width="18" height="5" fill="#44d062"/>`);
  // ตัวเอกกระโดด
  const jt = (ph * 1.1) % 1.6, jh = jt < 0.9 ? Math.sin((jt / 0.9) * Math.PI) * 30 : 0;
  const hy = 62 - jh;
  o.push(`<rect x="28" y="${f2(hy)}" width="10" height="3" fill="#e63b3b"/><rect x="28" y="${f2(hy + 3)}" width="10" height="5" fill="#ffd0a0"/><rect x="27" y="${f2(hy + 8)}" width="12" height="5" fill="#3b5bd6"/><rect x="28" y="${f2(hy + 13)}" width="4" height="3" fill="#6a3a1a"/><rect x="34" y="${f2(hy + 13)}" width="4" height="3" fill="#6a3a1a"/>`);
  // เหรียญ
  for (let i = 0; i < 3; i++) { const cxp = (px + 70 + i * 14) % 150; o.push(`<rect x="${f2(cxp)}" y="${f2(34 + Math.sin(ph * 6 + i) * 2)}" width="5" height="7" fill="#ffd23a"/>`); }
  if (glitch > 0) for (let i = 0; i < 6; i++) { const gy = rnd(Math.floor(ph * 8) + i) * 88; o.push(`<rect x="${f2((rnd(i + Math.floor(ph * 8)) - 0.5) * 24)}" y="${f2(gy)}" width="130" height="${f2(2 + rnd(i + 4) * 5)}" fill="${["#ff3bd0", "#3bffd9", "#ffffff"][i % 3]}" opacity="${f2(0.55 * glitch)}"/>`); }
  o.push(`</svg>`);
  return o.join("");
};
const device = (ph: number, glow = 0, press = -1): string => {
  const o: string[] = [];
  o.push(rect(40, 30, 190, 228, "#d9d2f2", 30, INK, 1.6));
  o.push(rect(46, 36, 178, 216, "#efeaff", 26, "none", 0, 'opacity=".55"'));
  o.push(rect(60, 48, 150, 118, "#1b1830", 10, INK, 1.2));
  o.push(rect(68, 57, 134, 96, "#000", 3));
  o.push(gameScreen(70, 59, 130, 92, ph));
  o.push(`<rect x="70" y="59" width="130" height="92" fill="#fff" opacity="${f2(0.05 + glow * 0.1)}"/>`);
  // ปุ่ม
  o.push(rect(70, 198, 38, 12, "#34305a", 4) + rect(83, 185, 12, 38, "#34305a", 4) + circ(89, 204, 4, "#26224a"));
  o.push(circ(188, 200, 10, press === 0 ? "#ff8a9a" : "#ff4a6a", `stroke="${INK}" stroke-width="1.2"`) + circ(166, 214, 10, press === 1 ? "#ffe08a" : "#ffc83a", `stroke="${INK}" stroke-width="1.2"`));
  o.push(rect(112, 232, 18, 6, "#8b84b8", 3) + rect(138, 232, 18, 6, "#8b84b8", 3));
  for (let i = 0; i < 4; i++) o.push(rect(188 + i * 5, 232 + i * 0, 2, 12, "#9a93c4", 1));
  return o.join("");
};

// ---------- หน่วยย่อย ----------
const boardBase = () => rect(16, 38, 238, 240, "#1f7a58", 12, INK, 1.4) + Array.from({ length: 12 }, (_, i) => `<path d="M${24 + i * 19} 44 v${40 + (i % 3) * 20} M${24 + i * 19} 270 v${-30 - (i % 4) * 14}" stroke="#4bd29a" stroke-width=".8" opacity=".45"/>`).join("");
const chipBox = (x: number, y: number, w: number, h: number, label: string, col: string, ph = 0, hi = 0) => {
  let s = "";
  for (let i = 0; i < 7; i++) { const t = 6 + (i * (w - 12)) / 6; s += rect(x + t - 1.4, y - 5, 2.8, 5, "#c9ccd9") + rect(x + t - 1.4, y + h, 2.8, 5, "#c9ccd9"); }
  for (let i = 0; i < 7; i++) { const t = 6 + (i * (h - 12)) / 6; s += rect(x - 5, y + t - 1.4, 5, 2.8, "#c9ccd9") + rect(x + w, y + t - 1.4, 5, 2.8, "#c9ccd9"); }
  s += rect(x, y, w, h, col, 5, INK, 1.4);
  if (hi > 0) s += `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="7" fill="none" stroke="#ffe27a" stroke-width="${f2(1.2 + hi)}" opacity="${f2(0.5 + 0.5 * Math.sin(ph * 6))}"/>`;
  s += circ(x + 7, y + 7, 2, "#ffffff55");
  return s + txt(x + w / 2, y + h / 2 + 3, label, 8, "#fff");
};

const viewR = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(boardBase());
  o.push(chipBox(30, 60, 110, 64, "", "#26224a", ph, 1));
  // แผนที่ความจำ: 400 ช่อง = 400 เกม
  const n = Math.floor(400 * sm(0.05, 0.85, p));
  for (let i = 0; i < 400; i++) {
    const cx = 38 + (i % 40) * 2.4, cy = 70 + Math.floor(i / 40) * 5.2;
    o.push(rect(cx, cy, 1.9, 4.2, i < n ? mixc("#ff6a8a", "#6af0ff", rnd(i) ) : "#3a3470", 0.4));
  }
  o.push(txt(85, 135, "ชิปแฟลช", 7.6, "#d8f4ff"));
  o.push(pill(135, 164, `${n} เกม`, "#fff6c9", 13));
  // เปรียบเทียบขนาด: เกมหนึ่งเล็กนิดเดียว
  o.push(rect(30, 190, 210, 12, "#3a3470", 4, "#8ad", 0.8));
  o.push(rect(30, 190, 210 * 0.62, 12, "#6af0ff", 4, "none", 0, 'opacity=".55"'));
  o.push(rect(30 + 210 * 0.62 + 2, 190, 3, 12, "#ff6a8a", 1));
  o.push(txt(135, 218, "เกมหนึ่งชิ้นเล็กมาก เมื่อเทียบกับความจุแฟลช", 7.4, "#fff"));
  o.push(txt(30 + 210 * 0.62 + 3.5, 186, "1 เกม", 6.4, "#ffb0c0"));
  return o.join("");
};

const viewC = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(boardBase());
  o.push(chipBox(88, 84, 94, 78, "ชิปหลัก", "#2c2a58", ph, 0.5));
  // เงาเครื่องเก่าซ้อน
  const g = 0.5 + 0.5 * Math.sin(ph * 3);
  o.push(`<g opacity="${f2(0.25 + 0.55 * sm(0.1, 0.4, p))}" transform="translate(${f2(Math.sin(ph) * 2)} 0)">${rect(68, 66, 134, 114, "none", 14, "#ffe27a", 1.4, 'stroke-dasharray="4 3"')}${txt(135, 62, "ทำตัวเป็นเครื่องเกมรุ่นเก่า", 8, "#ffe27a")}</g>`);
  const a = Math.floor(ph * 0.5) % 2;
  o.push(rect(24, 196, 104, 54, a === 0 ? "#ffe27a" : "#35306a", 8, INK, 1) + txt(76, 218, "วงจรเลียนแบบ", 8, a === 0 ? INK : "#fff") + txt(76, 232, "เครื่องเก่าในชิป", 7.2, a === 0 ? INK : "#cfd")); 
  o.push(rect(142, 196, 104, 54, a === 1 ? "#ffe27a" : "#35306a", 8, INK, 1) + txt(194, 218, "ชิปทั่วไป", 8, a === 1 ? INK : "#fff") + txt(194, 232, "รันโปรแกรมจำลอง", 7.2, a === 1 ? INK : "#cfd"));
  o.push(`<path d="M135 164 L76 196 M135 164 L194 196" stroke="#ffe27a" stroke-width="1.2" stroke-dasharray="3 2" fill="none"/>`);
  return o.join("");
};

const viewM = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(rect(14, 40, 118, 190, "#1b1830", 10, INK, 1.3));
  const names = ["รถแข่งหรรษา", "ลุยด่านผจญภัย", "ยิงอวกาศ", "ต่อบล็อก", "กระโดดเก็บเหรียญ", "ตีไม้ตีลูก", "เขาวงกตผี", "ฟุตบอลจิ๋ว"];
  const sel = Math.floor(sm(0.05, 0.6, p) * 4.99);
  for (let i = 0; i < names.length; i++) {
    const y = 56 + i * 20;
    o.push(rect(20, y - 9, 106, 16, i === sel ? "#ffe27a" : "#2a2650", 4) + txt(26, y + 2.5, names[i], 6.8, i === sel ? INK : "#fff", "start"));
  }
  // ชิปแฟลชกับชิปหลัก + แพ็กเก็ตข้อมูล
  o.push(chipBox(158, 56, 84, 46, "แฟลช", "#3a3470", ph, 0.4));
  o.push(chipBox(158, 150, 84, 58, "ชิปหลัก", "#2c2a58", ph, 0));
  o.push(`<path d="M200 107 L200 145" stroke="#6af0ff" stroke-width="1.4" stroke-dasharray="3 2"/>`);
  for (let i = 0; i < 6; i++) { const u = (ph * 0.9 + i / 6) % 1; if (p > 0.55) o.push(rect(196, 108 + u * 34, 8, 4, "#ffe27a", 1)); }
  o.push(`<path d="M126 ${56 + sel * 20} L158 80" stroke="#ffe27a" stroke-width="1" stroke-dasharray="2 2" fill="none"/>`);
  o.push(pill(135, 250, p > 0.55 ? "อ่านข้อมูลเกมที่เลือกขึ้นมา" : "เลือกเกมจากเมนู", "#fff6c9", 8.4));
  return o.join("");
};

const viewU = (ph: number, p: number): string => {
  const o: string[] = [];
  const codes = ["A9 01", "8D 00 20", "AD 16 40", "29 01", "D0 05", "E6 10", "18", "69 02", "85 12", "4C 00 80"];
  const step = Math.floor(ph * 2.2);
  o.push(rect(14, 50, 112, 196, "#141028", 8, INK, 1.2));
  for (let i = 0; i < 10; i++) {
    const act = (step % 10) === i;
    o.push(rect(18, 56 + i * 18.5, 104, 15, act ? "#ffe27a" : "#241d4a", 3) + txt(28, 67 + i * 18.5, String(i + 1).padStart(2, "0"), 6, act ? INK : "#8d86c0", "start") + txt(58, 67 + i * 18.5, codes[i], 7, act ? INK : "#bfb8ff", "start", 700));
  }
  o.push(`<path d="M126 ${f2(63 + (step % 10) * 18.5)} L152 150" stroke="#ffe27a" stroke-width="1.4" fill="none"/>`);
  o.push(chipBox(152, 112, 92, 84, "ชิปหลัก", "#2c2a58", ph, 0.6));
  const regs = ["ตัวเลข A", "ตำแหน่งภาพ", "ปุ่มที่กด"];
  for (let i = 0; i < 3; i++) o.push(rect(158, 128 + i * 20, 80, 15, "#4a4690", 3) + txt(164, 138.5 + i * 20, regs[i], 6.4, "#fff", "start") + txt(232, 138.5 + i * 20, (step * (3 + i * 5) % 99).toString(), 6.8, "#ffe27a", "end"));
  o.push(txt(198, 104, "อ่าน → ทำตาม → ถัดไป", 7.2, "#ffe27a"));
  o.push(pill(135, 262, "ทำตามคำสั่งทีละบรรทัด ซ้ำๆ", "#fff6c9", 8.4));
  return o.join("");
};

const heartMap = [
  "................", "..##....##......", ".####..####.....", "######.######...", "###########.....", ".#########......", "..#######.......", "...#####........", "....###.........", ".....#..........", "................", "................"];
const viewP = (ph: number, p: number): string => {
  const o: string[] = [];
  const cw = 8.6, ox = 135 - (cw * 16) / 2, oy = 60;
  const row = Math.floor(((ph * 0.7) % 1) * 13);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 16; c++) {
    const on = heartMap[r][c] === "#" || (r === 5 && c === 12 && false);
    const col = on ? mixc("#ff4a6a", "#ff9ab0", r / 9) : (r + c) % 2 ? "#5ab8ff" : "#4fb0f8";
    const show = r < row || row >= 12;
    o.push(rect(ox + c * cw, oy + r * cw, cw - 0.5, cw - 0.5, show ? col : "#1b1830"));
  }
  o.push(rect(ox - 4, oy - 4, cw * 16 + 8, cw * 12 + 8, "none", 4, "#ffe27a", 1.6));
  o.push(rect(ox - 2, oy + row * cw - 1, cw * 16 + 4, 3, "#fff", 1, "none", 0, 'opacity=".85"'));
  o.push(pill(135, 40, "ตารางจุดสี: คำนวณทีละแถว", "#fff6c9", 8.4));
  const fr = 1 + Math.floor(ph * 8);
  o.push(rect(ox, oy + cw * 12 + 12, cw * 16, 22, "#241d4a", 6) + txt(ox + 10, oy + cw * 12 + 27, `เฟรมที่ ${fr}`, 8.4, "#6af0ff", "start") + txt(ox + cw * 16 - 8, oy + cw * 12 + 27, "ราว 6 หมื่นจุด/เฟรม", 7.4, "#ffe27a", "end"));
  o.push(txt(135, oy + cw * 12 + 54, "วาดใหม่หลายสิบเฟรมต่อวินาที", 7.6, "#fff"));
  return o.join("");
};

const viewL = (ph: number, p: number): string => {
  const o: string[] = [];
  const x0 = 24, x1 = 246, cols = 12, cw = (x1 - x0) / cols;
  // ไฟหลังจอ
  o.push(rect(x0, 214, x1 - x0, 12, "#fff7c8", 3, INK, 1) + rect(x0 - 8, 212, 8, 16, "#ffe45a", 2, INK, 1));
  o.push(txt(135, 240, "ไฟหลังจอ (แอลอีดี)", 7.6, "#ffe27a"));
  // โพลาไรเซอร์ล่าง
  o.push(rect(x0, 196, x1 - x0, 5, "#7a6fd0", 1.5));
  // ผลึกเหลว
  o.push(rect(x0, 148, x1 - x0, 40, "#2a2650", 4, "#8ad", 0.8));
  for (let c = 0; c < cols; c++) {
    const cx = x0 + cw * (c + 0.5);
    const tw = 0.5 + 0.5 * Math.sin(ph * 1.6 + c * 0.7); // 0..1 บิดมาก->ผ่านมาก
    const ang = tw * 90;
    for (let k = 0; k < 3; k++) o.push(`<ellipse cx="${f2(cx)}" cy="${f2(158 + k * 12)}" rx="${f2(2.6 + 5 * (1 - tw) * 1)}" ry="${f2(1.8 + 3 * tw)}" fill="#6af0ff" transform="rotate(${f2(ang)} ${f2(cx)} ${f2(158 + k * 12)})" opacity=".9"/>`);
    // ลำแสงขึ้น
    for (let k = 0; k < 3; k++) {
      const u = (ph * 0.8 + k / 3 + c * 0.1) % 1;
      o.push(rect(cx - 1, 210 - u * 90, 2, 10, "#fff7a0", 1, "none", 0, `opacity="${f2(0.9 * (u < 0.5 ? 0.35 + 0.65 * tw : 1) * (u > 0.45 ? tw : 1))}"`));
    }
    // ความสว่างที่ออกมาด้านบน
    o.push(rect(cx - cw / 2 + 1, 120, cw - 2, 14, mixc("#1b1830", "#fff7d0", tw), 2));
  }
  o.push(rect(x0, 138, x1 - x0, 6, "#7a6fd0", 1.5));
  o.push(txt(135, 112, "ภาพที่ตามองเห็น", 7.6, "#fff"));
  o.push(pill(135, 70, "ผลึกเหลวบิดตามไฟฟ้า คุมแสงที่ผ่าน", "#fff6c9", 8.2));
  o.push(txt(135, 262, "บิดมาก ผ่านน้อย / บิดน้อย ผ่านมาก (ภาพวาดย่อ)", 6.4, "#cfc8ff"));
  return o.join("");
};

const viewK = (ph: number, p: number): string => {
  const o: string[] = [];
  const combos: [string, number, number, number, string][] = [["แดง + เขียว = เหลือง", 1, 1, 0, "#ffe23a"], ["แดง + เขียว + น้ำเงิน = ขาว", 1, 1, 1, "#ffffff"], ["น้ำเงินอย่างเดียว = น้ำเงิน", 0, 0, 1, "#3a5bff"], ["แดง + เขียวน้อย = ส้ม", 1, 0.45, 0, "#ff9a2a"]];
  const idx = Math.floor(ph * 0.8) % 4, k = combos[idx];
  const cols = ["#ff3b3b", "#35e05a", "#3b6bff"], vals = [k[1], k[2], k[3]];
  o.push(rect(40, 60, 130, 130, "#10101c", 8, INK, 1.4));
  for (let i = 0; i < 3; i++) {
    o.push(rect(46 + i * 40, 66, 34, 118, "#222234", 3));
    o.push(rect(46 + i * 40, f2(66 + 118 * (1 - vals[i])), 34, f2(118 * vals[i]), cols[i], 3));
  }
  o.push(txt(63, 204, "แดง", 7.4, "#ffb0b0") + txt(103, 204, "เขียว", 7.4, "#b0ffc0") + txt(143, 204, "น้ำเงิน", 7.4, "#b0c0ff"));
  o.push(rect(184, 100, 56, 56, k[4], 10, "#fff", 1.4));
  o.push(txt(212, 172, "สีที่ตาเห็น", 7.4, "#fff"));
  o.push(`<path d="M172 128 H182" stroke="#ffe27a" stroke-width="2" marker-end=""/><path d="M178 123 l5 5 l-5 5" stroke="#ffe27a" stroke-width="2" fill="none"/>`);
  o.push(pill(135, 38, k[0], "#fff6c9", 9));
  o.push(txt(135, 232, "จุดภาพ 1 จุด = ช่องย่อย 3 สี", 7.8, "#cfc8ff"));
  return o.join("");
};

const viewT = (ph: number, p: number): string => {
  const o: string[] = [];
  const u = (ph * 0.55) % 1, down = u < 0.45 ? sm(0.05, 0.3, u) : u < 0.6 ? 1 : 1 - sm(0.6, 0.85, u);
  o.push(rect(30, 190, 170, 16, "#1f7a58", 3, INK, 1));
  o.push(rect(78, 186, 30, 4, "#e0a04a", 1) + rect(122, 186, 30, 4, "#e0a04a", 1));
  // โดมยาง
  const ap = lerp(150, 176, down);
  o.push(`<path d="M72 186 Q115 ${f2(2 * ap - 186)} 158 186" fill="#8e86c8" fill-opacity=".35" stroke="#8e86c8" stroke-width="5" stroke-linecap="round"/>`);
  o.push(rect(104, f2(ap + 2), 22, 8, "#222233", 2, INK, 0.8));
  // นิ้วกด
  o.push(rect(98, f2(ap - 56), 34, 54, "#f0c6a0", 12, INK, 1.2));
  const on = down > 0.9;
  o.push(`<circle cx="115" cy="187" r="${on ? 8 : 0}" fill="#ffe27a" opacity=".8"/>`);
  o.push(`<path d="M80 188 H108 M122 188 H150" stroke="${on ? "#ffe27a" : "#5aa"}" stroke-width="2"/>`);
  // สัญญาณไปชิป
  o.push(`<path d="M200 198 H214 V120" stroke="${on ? "#ffe27a" : "#566"}" stroke-width="2" fill="none"/>`);
  o.push(chipBox(188, 78, 62, 40, "ชิป", "#2c2a58", ph, on ? 0.6 : 0));
  o.push(txt(219, 70, on ? "ปุ่ม = 1" : "ปุ่ม = 0", 8, on ? "#ffe27a" : "#9aa"));
  o.push(pill(110, 40, on ? "แผ่นยางแตะ ต่อวงจร" : "ชิปคอยตรวจว่าปุ่มต่อหรือยัง", "#fff6c9", 8.2));
  o.push(txt(115, 232, "แผ่นสัมผัสสองฝั่งบนแผงวงจร", 7.2, "#cfc8ff"));
  return o.join("");
};

const viewG = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(rect(14, 56, 118, 98, "#1b1830", 8, INK, 1.2));
  o.push(gameScreen(18, 60, 110, 78, ph, 1));
  o.push(txt(73, 172, "ภาพกระตุก/เสียงเพี้ยน", 7.4, "#ffb0c0"));
  const rows: [string, number][] = [["ลุยด่านผจญภัย", 1], ["ลุยด่านผจญภัย 2", 1], ["ลุยด่านภาคพิเศษ", 1], ["ยิงอวกาศ", 2], ["ยิงอวกาศ 2", 2], ["ต่อบล็อก", 3]];
  const pulse = 0.5 + 0.5 * Math.sin(ph * 4);
  for (let i = 0; i < rows.length; i++) {
    const y = 62 + i * 25, dup = rows[i][1] < 3;
    o.push(rect(142, y - 11, 112, 21, dup ? "#3b2a58" : "#2a2650", 5, dup ? "#ffe27a" : "none", dup ? 0.8 + pulse * 0.6 : 0));
    o.push(rect(147, y - 7, 12, 12, ["#ff6a8a", "#6af0ff", "#ffe27a"][rows[i][1] - 1], 2));
    o.push(txt(164, y + 3, rows[i][0], 6.8, "#fff", "start"));
  }
  o.push(pill(198, 222, "เกมเดียวกัน ชื่อต่างกัน", "#fff6c9", 7.8));
  o.push(pill(135, 40, "ชิปราคาถูกจำลองไม่เป๊ะ", "#ffd8cf", 9));
  return o.join("");
};

const viewB = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(rect(24, 96, 82, 84, "#444a66", 6, INK, 1.2) + rect(164, 96, 82, 84, "#9a6a4a", 6, INK, 1.2) + rect(106, 96, 58, 84, "#2a2650", 0, "none", 0));
  o.push(txt(65, 92, "ขั้วลบ", 7.6, "#cfd8ff") + txt(205, 92, "ขั้วบวก", 7.6, "#ffd0b0"));
  for (let i = 0; i < 6; i++) o.push(`<path d="M${30 + i * 12} 102 v72" stroke="#666d8a" stroke-width="1" opacity=".5"/>`);
  o.push(`<path d="M135 96 v84" stroke="#fff" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>`);
  // ไอออนวิ่งจากลบไปบวก
  for (let i = 0; i < 12; i++) {
    const u = (ph * 0.45 + i / 12) % 1, y = 106 + ((i * 13) % 66) + Math.sin(u * 9 + i) * 2;
    o.push(circ(40 + u * 180, y, 3.2, "#6af0ff", `stroke="#fff" stroke-width=".6"`) + `<text x="${f2(40 + u * 180)}" y="${f2(y + 1.6)}" font-size="4.6" fill="${INK}" text-anchor="middle" ${K} font-weight="900">+</text>`);
  }
  // วงจรภายนอก: อิเล็กตรอนไปเลี้ยงชิป
  o.push(`<path d="M65 180 V222 H205 V180" stroke="#ffe27a" stroke-width="2" fill="none"/>`);
  for (let i = 0; i < 8; i++) { const u = (ph * 0.5 + i / 8) % 1, x = 65 + u * 140; o.push(circ(x, 222, 2.2, "#ffe27a")); }
  o.push(chipBox(108, 202, 54, 36, "เครื่องเกม", "#2c2a58", ph, 0.5));
  o.push(pill(135, 40, "ไอออนลิเธียมวิ่งผ่านตัวกั้นไปอีกขั้ว", "#fff6c9", 8.2));
  o.push(pill(135, 262, "อิเล็กตรอนวิ่งทางนอก เลี้ยงชิปและจอ", "#e0f4ff", 8));
  return o.join("");
};

const viewA = (ph: number, p: number): string => {
  const o: string[] = [];
  const n = 6, bw = 28;
  for (let i = 0; i < n; i++) {
    const cap = 1 - 0.55 * (i / (n - 1)) * sm(0.05 + i * 0.08, 0.3 + i * 0.12, p);
    const x = 30 + i * (bw + 8), h = 100;
    o.push(rect(x, 80, bw, h, "#241d4a", 4, "#8ad", 0.8));
    o.push(rect(x, 80 + h * (1 - cap), bw, h * cap, mixc("#ff7a6a", "#58e08a", cap), 4));
    o.push(rect(x, 80, bw, h * (1 - cap), "#ff8a7a", 4, "none", 0, 'opacity=".25"'));
    o.push(txt(x + bw / 2, 196, i === 0 ? "ใหม่" : `รอบ ${i}`, 6.4, "#cfc8ff"));
  }
  // ลิเธียมที่ถูกกัก
  const trapped = Math.floor(14 * sm(0.1, 0.9, p));
  for (let i = 0; i < trapped; i++) o.push(circ(40 + rnd(i) * 190, 224 + rnd(i + 3) * 26, 3, "#7a7a99", `stroke="#444" stroke-width=".6"`));
  o.push(txt(135, 212, "ลิเธียมบางส่วนถูกกัก ใช้ไม่ได้", 7.4, "#ffb0c0"));
  o.push(pill(135, 52, "ชาร์จซ้ำหลายรอบ ความจุลดลง", "#fff6c9", 8.8));
  return o.join("");
};

const viewN = (ph: number, p: number): string => {
  const o: string[] = [];
  const a = sm(0.05, 0.5, p), b = sm(0.4, 0.9, p);
  o.push(txt(135, 60, "ตัวอย่างเวลาเล่นต่อการชาร์จ", 8.4, "#fff"));
  o.push(txt(30, 100, "เมื่อก่อน", 7.6, "#cfc8ff", "start") + rect(30, 106, 210, 22, "#241d4a", 6, "#8ad", 0.8) + rect(30, 106, 210 * a, 22, "#58e08a", 6) + txt(236, 121, "~7 ชม.", 8, INK, "end"));
  o.push(txt(30, 160, "ตอนนี้", 7.6, "#cfc8ff", "start") + rect(30, 166, 210, 22, "#241d4a", 6, "#8ad", 0.8) + rect(30, 166, 210 * 0.4 * b, 22, "#ff7a6a", 6) + txt(30 + 210 * 0.4 * b + 6, 181, "ไม่ถึง 3 ชม.", 8, "#ffb0c0", "start"));
  o.push(pill(135, 232, "แบตก้อนนั้นใกล้หมดอายุ", "#ffd8cf", 9.4));
  o.push(txt(135, 258, "(ตัวเลขเป็นตัวอย่าง)", 6.4, "#9a93c4"));
  return o.join("");
};

const draw = (c: string, ph: number, p: number): string => {
  switch (KIND[c]) {
    case "D": { const o: string[] = []; const cnt = c === "all" ? Math.floor(400 * sm(0.05, 0.8, p)) : 400; o.push(device(ph, 0, Math.floor(ph * 2) % 3 - 1)); o.push(pill(135, 22, c === "all" ? `เกมในเครื่อง ${cnt}` : "พร้อมเล่นแล้ว", "#fff6c9", 11)); if (c === "end") for (let i = 0; i < 6; i++) { const a = ph * 2.5 + i; o.push(`<path d="M${f2(135 + Math.cos(a) * 118)} ${f2(120 + Math.sin(a * 1.3) * 70)} l0 -4 m-2 2 h4" stroke="#ffe27a" stroke-width="1.4" opacity="${f2(0.4 + 0.6 * Math.abs(Math.sin(a * 2)))}"/>`); } return o.join(""); }
    case "R": return viewR(ph, p);
    case "C": return viewC(ph, p);
    case "M": return viewM(ph, p);
    case "U": return viewU(ph, p);
    case "P": return viewP(ph, p);
    case "L": return viewL(ph, p);
    case "K": return viewK(ph, p);
    case "T": return viewT(ph, p);
    case "G": return viewG(ph, p);
    case "B": return viewB(ph, p);
    case "A": return viewA(ph, p);
    default: return viewN(ph, p);
  }
};
export const SCENE_RETROGAME: SceneDef = {
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
