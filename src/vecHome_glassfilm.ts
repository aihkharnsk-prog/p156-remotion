// ฉากอธิบาย: ฟิล์มกระจกกันรอย 9H — โครงสร้างหลายชั้น, สเกลดินสอ 9H, ผิวกระจกถูกอัด/แกนถูกดึง, การแตกซับพลังงาน, ขอบเป็นจุดอ่อน — SVG พิกัด 270x480 (หนึ่งมุมมองต่อหนึ่ง cue ครอสเฟดเมื่อเปลี่ยน)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const TAU = Math.PI * 2;
const INK = "#0b1c28";
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
const BG1 = "#17394a", BG2 = "#091722", DOT = "#9fe8ff";
const ORDER = ["all", "layers", "oleo", "scale", "notmohs", "temper", "comp", "impact", "glue", "point", "edge", "cracked", "nudge", "end"];
const KIND: Record<string, string> = { all: "A", end: "A", layers: "Ly", oleo: "Ol", scale: "Sc", notmohs: "Nm", temper: "Te", comp: "Co", impact: "Im", glue: "Gl", point: "Pt", edge: "Ed", cracked: "Cr", nudge: "Nu" };
const FOCUS: Record<string, { cx: number; cy: number; z: number }> = {};
for (const c of ORDER) FOCUS[c] = fc(135, 150, 1);
const GL = "#bfeaff", AD = "#f0d28a", OL = "#7af0d8", DS = "#1a2140";

// รอยร้าวแบบแฉกจากจุดกระแทก (คืน path) — ความคืบ k 0..1
const crackPath = (cx: number, cy: number, n: number, len: number, k: number, seed = 0): string => {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd(seed + i) * 0.5, L = len * (0.55 + 0.45 * rnd(seed + i + 9)) * k;
    let x = cx, y = cy; d += `M${f2(x)} ${f2(y)}`;
    const seg = 5;
    for (let s = 1; s <= seg; s++) { const aa = a + (rnd(seed + i * 7 + s) - 0.5) * 0.6; x += Math.cos(aa) * (L / seg); y += Math.sin(aa) * (L / seg); d += ` L${f2(x)} ${f2(y)}`; if (s === 3 && k > 0.5) d += ` M${f2(x)} ${f2(y)} l${f2(Math.cos(aa + 0.9) * L * 0.25)} ${f2(Math.sin(aa + 0.9) * L * 0.25)} M${f2(x)} ${f2(y)}`; }
  }
  return d;
};
const phone = (x: number, y: number, w: number, h: number, rot = 0, crack = 0, cx0 = 0.3, cy0 = 0.35, glow = 0) => {
  let s = `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)})">`;
  s += rect(-w / 2, -h / 2, w, h, "#2b3556", 16, INK, 2) + rect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, DS, 12);
  s += rect(-w / 2 + 8, -h / 2 + 18, w - 16, h - 36, mixc("#3a6bd0", "#7ad0ff", 0.4 + glow * 0.4), 4);
  for (let i = 0; i < 5; i++) s += rect(-w / 2 + 14, -h / 2 + 28 + i * 16, (w - 28) * (0.5 + 0.4 * rnd(i + 3)), 6, "#ffffff55", 3);
  s += rect(-w / 2 + 6, -h / 2 + 16, w - 12, h - 32, "#cfefff", 5, "none", 0, 'opacity=".12"');
  if (crack > 0.01) s += `<clipPath id="pcl"><rect x="${f2(-w / 2 + 6)}" y="${f2(-h / 2 + 16)}" width="${f2(w - 12)}" height="${f2(h - 32)}" rx="5"/></clipPath><g clip-path="url(#pcl)"><path d="${crackPath(-w / 2 + w * cx0, -h / 2 + h * cy0, 9, w * 0.8, crack, 3)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".95"/><path d="${crackPath(-w / 2 + w * cx0, -h / 2 + h * cy0, 9, w * 0.8, crack, 3)}" stroke="#7ad0ff" stroke-width="3" fill="none" opacity=".25"/></g>`;
  return s + `</g>`;
};

const viewA = (c: string, ph: number, p: number): string => {
  const o: string[] = [];
  o.push(rect(10, 236, 250, 10, "#5a6a7a", 3, INK, 1.2));
  const tt = c === "end" ? 1 : sm(0.0, 0.5, p);
  const y = lerp(60, 184, tt * tt), rot = lerp(-24, 0, tt);
  const hit = c === "end" ? 1 : sm(0.5, 0.85, p);
  o.push(phone(135, y, 92, 100 + 6, rot, hit, 0.78, 0.9, hit));
  if (hit > 0 && hit < 1) for (let i = 0; i < 6; i++) { const a = -Math.PI * (i / 5); o.push(`<path d="M${f2(135 + Math.cos(a) * 54)} ${f2(236 + Math.sin(a) * 18)} l${f2(Math.cos(a) * 10)} ${f2(Math.sin(a) * 10)}" stroke="#fff" stroke-width="1.6" opacity="${f2(1 - hit)}"/>`); }
  o.push(pill(135, 32, c === "end" ? "จอยังรอด" : hit > 0.3 ? "ฟิล์มร้าว แต่จอยังไม่เป็นไร" : "ตกกระแทก!", c === "end" ? "#d9ffd0" : hit > 0.3 ? "#d9ffd0" : "#ffd8cf", 9.4));
  if (c === "end") for (let i = 0; i < 6; i++) { const a = ph * 2.5 + i; o.push(`<path d="M${f2(135 + Math.cos(a) * 118)} ${f2(130 + Math.sin(a * 1.3) * 80)} l0 -4 m-2 2 h4" stroke="#ffe27a" stroke-width="1.4" opacity="${f2(0.4 + 0.6 * Math.abs(Math.sin(a * 2)))}"/>`); }
  return o.join("");
};

const layerStack = (gap: number, y0: number) => {
  const o: string[] = [];
  const x = 104, w = 146, th = [10, 30, 14, 36], cols = [OL, GL, AD, DS], names = ["เคลือบกันรอยนิ้วมือ", "กระจก", "ชั้นกาวซิลิโคน", "หน้าจอ"], nc = ["#bfffee", "#d6f2ff", "#ffe9b0", "#cfd8ff"];
  let y = y0;
  for (let i = 0; i < 4; i++) {
    o.push(rect(x, y, w, th[i], cols[i], 3, INK, 1.2, i === 1 ? 'opacity=".9"' : ""));
    if (i === 3) for (let k = 0; k < 10; k++) o.push(rect(x + 6 + k * 13, y + 8, 8, 8, ["#ff5a5a", "#58e08a", "#5a8aff"][k % 3], 1));
    o.push(txt(x - 4, y + th[i] / 2 + 2.6, names[i], 7.2, nc[i], "end"));
    y += th[i] + gap;
  }
  return o.join("");
};
const viewLy = (ph: number, p: number): string => {
  const o: string[] = [];
  const gap = lerp(26, 3, sm(0.45, 0.95, p)) + Math.sin(ph * 2) * 0.6;
  o.push(layerStack(gap, 80));
  o.push(pill(135, 40, "ฟิล์ม 1 แผ่น มีหลายชั้น", "#fff6c9", 9));
  o.push(txt(135, 250, "ประกอบกันบนจอ", 7.6, "#cfeaff"));
  return o.join("");
};

const viewOl = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(rect(20, 170, 230, 10, OL, 3, INK, 1) + rect(20, 180, 230, 30, GL, 3, INK, 1));
  // หยดน้ำมันกลิ้ง
  for (let i = 0; i < 4; i++) {
    const t = (ph * 0.3 + i / 4) % 1, x = 40 + t * 190, r = 10 + (i % 2) * 4;
    o.push(`<path d="M${f2(x - r)} 170 A${r} ${r} 0 0 1 ${f2(x + r)} 170 Z" fill="#ffd45a" stroke="#c9961a" stroke-width="1" opacity=".95"/>`);
  }
  // นิ้วไถผ่านอย่างลื่น
  const fx = 40 + ((ph * 0.4) % 1) * 190;
  o.push(rect(fx - 14, 112, 28, 54, "#f0c6a0", 12, INK, 1.4));
  o.push(`<path d="M${f2(fx - 40)} 160 H${f2(fx - 18)}" stroke="#fff" stroke-width="1.4" opacity=".7"/>`);
  o.push(pill(135, 40, "หยดน้ำมันจับเป็นเม็ด กลิ้งหลุดง่าย", "#fff6c9", 8.6));
  o.push(txt(135, 240, "นิ้วปาดลื่น คราบเช็ดออกง่าย", 8, "#cfeaff"));
  return o.join("");
};

const GR = ["6B", "4B", "2B", "HB", "2H", "4H", "6H", "8H", "9H"];
const viewSc = (ph: number, p: number): string => {
  const o: string[] = [];
  // กระจกฟิล์มด้านล่างและรอยขีด
  const sel = Math.min(8, Math.floor(sm(0.05, 0.95, p) * 9));
  o.push(rect(20, 160, 230, 20, GL, 3, INK, 1.2));
  for (let i = 0; i < 9; i++) {
    const x = 34 + i * 24;
    const mark = i < 8; // 9H ไม่ทิ้งรอย
    if (i <= sel) o.push(mark ? `<path d="M${x - 8} 169 H${x + 8}" stroke="#2a3a4a" stroke-width="${f2(3.2 - i * 0.28)}" stroke-linecap="round" opacity="${f2(0.95 - i * 0.07)}"/>` : `<path d="M${x - 8} 169 H${x + 8}" stroke="#58e08a" stroke-width="1" stroke-dasharray="2 3" opacity=".8"/>`);
    // ดินสอ (เรียงแถว)
    o.push(`<g transform="translate(${x} 96)"><rect x="-4" y="-34" width="8" height="44" rx="1.5" fill="${i === 8 ? "#58e08a" : mixc("#ffd45a", "#d08a2a", i / 8)}" stroke="${INK}" stroke-width="1" opacity="${i === sel ? 1 : 0.55}"/><path d="M-4 10 L0 22 L4 10 Z" fill="#f0c6a0" stroke="${INK}" stroke-width=".8"/><path d="M-1.4 17 L0 22 L1.4 17 Z" fill="${INK}"/></g>`);
    o.push(txt(x, 78, GR[i], 6.6, i === sel ? "#ffe27a" : "#9fc0d0"));
  }
  // ดินสอที่กำลังทดสอบ ลากเอียง 45 องศา
  const tx = 34 + sel * 24 - 40 + ((ph * 0.8) % 1) * 36;
  o.push(`<g transform="translate(${f2(tx + 22)} 150) rotate(45)"><rect x="-4" y="-48" width="8" height="46" fill="${sel === 8 ? "#58e08a" : "#d08a2a"}" stroke="${INK}" stroke-width="1"/></g>`);
  o.push(pill(135, 40, sel === 8 ? "9H: ไม่ทิ้งรอย" : "ดินสอเกรดนี้ ทิ้งรอยขีด", sel === 8 ? "#d9ffd0" : "#fff6c9", 9));
  o.push(txt(135, 206, "ไล่จากอ่อนไปแข็ง ดูว่าเกรดแข็งสุดที่ไม่ทิ้งรอยคือเกรดไหน", 6.6, "#cfeaff"));
  return o.join("");
};

const viewNm = (ph: number, p: number): string => {
  const o: string[] = [];
  const u = (ph * 0.5) % 1;
  // ซ้าย: เม็ดทราย ขีดผิว
  o.push(rect(14, 150, 120, 28, GL, 3, INK, 1.2));
  const gx = 30 + u * 90;
  o.push(`<path d="M30 150 H${f2(gx)}" stroke="#2a4a5a" stroke-width="2.2"/>`);
  o.push(`<path d="M${f2(gx - 8)} 150 l4 -12 l9 -3 l6 9 l-4 10 Z" fill="#e8d4a0" stroke="${INK}" stroke-width="1.2"/>`);
  o.push(txt(74, 124, "เม็ดทราย (ควอตซ์)", 7.4, "#ffe9b0") + txt(74, 194, "ผิวถูกขีดเป็นรอย", 7.4, "#ffb0a0"));
  // ขวา: ค้อนกระแทก ผิวแข็งก็ร้าวได้
  o.push(rect(146, 150, 110, 28, GL, 3, INK, 1.2));
  const hu = (ph * 0.45) % 1, hy = 90 + (hu < 0.4 ? sm(0, 0.4, hu) * 48 : 48 - sm(0.4, 0.7, hu) * 48);
  o.push(rect(188, hy - 30, 26, 18, "#8a96a8", 4, INK, 1.2) + rect(199, hy - 12, 4, 14, "#a0784a", 1) );
  const kk = hu > 0.4 ? sm(0.4, 0.55, hu) : 0;
  o.push(`<path d="${crackPath(201, 150, 6, 52, kk, 11)}" stroke="#fff" stroke-width="1.4" fill="none"/>`);
  o.push(txt(201, 124, "แรงกระแทก", 7.4, "#ffe9b0") + txt(201, 194, "ร้าวได้ แม้ผิวแข็ง", 7.4, "#ffb0a0"));
  o.push(`<path d="M140 96 V210" stroke="#6a8aa0" stroke-width="1" stroke-dasharray="3 3"/>`);
  o.push(pill(135, 40, "แข็ง (ต้านรอย) ≠ ทน (ไม่แตก)", "#fff6c9", 9));
  o.push(txt(135, 238, "9H บอกได้แค่เรื่องรอยขีด", 8, "#cfeaff"));
  return o.join("");
};

const viewTe = (ph: number, p: number): string => {
  const o: string[] = [];
  const x = 40, w = 190, y = 120, h = 56;
  const heat = sm(0, 0.3, p), cool = sm(0.35, 0.7, p), shr = sm(0.72, 0.98, p);
  // แผ่นกระจกตัดขวาง: ผิวบน/ล่างกับแกนกลาง
  const skin = 12 + 0 * cool;
  const colCore = mixc("#a8d8ff", mixc("#ffb04a", "#ff5a2a", heat), 1 - 0.0 * shr);
  const colSkin = mixc(mixc("#a8d8ff", "#ff7a3a", heat), "#7ab8ff", cool);
  const colCore2 = mixc(colCore, "#c8a0a0", shr * 0.8);
  o.push(rect(x, y, w, h, colCore2, 3, INK, 1.4));
  o.push(rect(x, y, w, skin * (0.5 + 0.7 * cool), colSkin, 3) + rect(x, y + h - skin * (0.5 + 0.7 * cool), w, skin * (0.5 + 0.7 * cool), colSkin, 3));
  // ไอเป่าเย็น
  if (cool > 0.02 && shr < 0.5) for (let i = 0; i < 8; i++) { const u = (ph * 1.2 + i / 8) % 1; for (const side of [-1, 1]) o.push(`<path d="M${f2(x + 12 + i * 23)} ${f2(y + (side < 0 ? -34 : h + 34) + side * 0 + (side < 0 ? u * 28 : -u * 28))} v${side < 0 ? 8 : -8}" stroke="#9fe8ff" stroke-width="2" stroke-linecap="round" opacity="${f2(cool * (1 - u * 0.5))}"/>`); }
  // ลูกศรหดตัวของแกนกลาง ดึงผิว
  if (shr > 0.05) for (let i = 0; i < 4; i++) { const ax = x + 28 + i * 44; o.push(`<path d="M${ax - 8} ${y + h / 2} h6 m-3 -3 l3 3 l-3 3 M${ax + 8} ${y + h / 2} h-6 m3 -3 l-3 3 l3 3" stroke="#ffe27a" stroke-width="1.6" fill="none" opacity="${f2(shr)}"/>`); }
  const lab = p < 0.3 ? "อบกระจกให้ร้อนจัด" : p < 0.7 ? "เป่าลมเย็นใส่ผิวทั้งสองด้าน" : "แกนกลางเย็นทีหลัง หดตัว";
  o.push(pill(135, 40, lab, "#fff6c9", 9));
  o.push(txt(135, 214, p < 0.7 ? "ผิวเย็นและแข็งตัวก่อน" : "ดึงผิวให้ถูกอัดไว้", 8, "#cfeaff"));
  o.push(`<path d="M30 ${y - 4} v${h + 8}" stroke="${mixc("#ff7a3a", "#7ab8ff", cool)}" stroke-width="0"/>`);
  return o.join("");
};

const viewCo = (ph: number, p: number): string => {
  const o: string[] = [];
  const x = 24, w = 222, y = 100, h = 100, sk = 22;
  o.push(rect(x, y, w, h, "#f3b88a", 3, INK, 1.4) + rect(x, y, w, sk, "#8ed0ff", 3) + rect(x, y + h - sk, w, sk, "#8ed0ff", 3));
  const pu = 0.5 + 0.5 * Math.sin(ph * 3);
  for (let i = 0; i < 9; i++) {
    const ax = x + 14 + i * 24;
    // ผิวถูกอัด: ลูกศรชนกัน
    o.push(`<path d="M${ax - 9} ${y + sk / 2} h${f2(5 + pu * 2)} m-3 -3 l3 3 l-3 3 M${ax + 9} ${y + sk / 2} h${-f2(5 + pu * 2)} m3 -3 l-3 3 l3 3" stroke="#0a4a8a" stroke-width="1.6" fill="none"/>`);
    o.push(`<path d="M${ax - 9} ${y + h - sk / 2} h${f2(5 + pu * 2)} m-3 -3 l3 3 l-3 3 M${ax + 9} ${y + h - sk / 2} h${-f2(5 + pu * 2)} m3 -3 l-3 3 l3 3" stroke="#0a4a8a" stroke-width="1.6" fill="none"/>`);
    if (i % 2 === 0) o.push(`<path d="M${ax - 4} ${y + h / 2} h-8 m3 -3 l-3 3 l3 3 M${ax + 4} ${y + h / 2} h8 m-3 -3 l3 3 l-3 3" stroke="#a83a10" stroke-width="1.6" fill="none"/>`);
  }
  // รอยร้าวจิ๋วที่ผิว ถูกอัดปิด
  const gap = 4 * (1 - sm(0.2, 0.7, p));
  o.push(`<path d="M135 ${y} l${f2(-gap)} 12 l${f2(gap * 0.5)} 6" stroke="#10243a" stroke-width="2" fill="none"/>`);
  o.push(lead(135, y + 8, 200, y - 24, "#fff") + txt(200, y - 28, "รอยร้าวจิ๋ว ถูกกดปิด", 7.4, "#fff", "start"));
  o.push(txt(x + 4, y + sk + 20, "แกนกลางถูกดึง", 7.6, "#7a2a08", "start") + txt(x + 4, y - 6, "ผิวถูกอัด", 7.6, "#9fe0ff", "start"));
  o.push(pill(135, 40, "ผิวถูกอัด แกนกลางถูกดึง", "#fff6c9", 9));
  o.push(txt(135, 240, "รอยร้าวที่ผิวลามยาก ต้องใช้แรงมากขึ้น", 8, "#cfeaff"));
  return o.join("");
};

const viewIm = (ph: number, p: number): string => {
  const o: string[] = [];
  const hit = sm(0.2, 0.6, p), cr = sm(0.25, 0.85, p);
  o.push(rect(24, 150, 222, 14, GL, 3, INK, 1.2) + rect(24, 164, 222, 8, AD, 2, INK, 1) + rect(24, 172, 222, 30, DS, 3, INK, 1.2));
  const by = lerp(40, 138, hit);
  o.push(circ(135, by, 12, "#c8d0dc", `stroke="${INK}" stroke-width="1.4"`));
  o.push(`<path d="${crackPath(135, 150, 8, 88, cr, 21)}" stroke="#fff" stroke-width="1.4" fill="none"/>`);
  // แถบพลังงาน
  const eb = (x: number, v: number, col: string, lab: string) => rect(x, 214, 100, 12, "#0b1c28", 6, "#6aa0c0", 1) + rect(x, 214, 100 * v, 12, col, 6) + txt(x + 50, 240, lab, 7.2, "#fff");
  o.push(eb(24, 1, "#ff9a3a", "พลังงานกระแทก") + eb(146, 1 - 0.7 * cr, "#58e08a", "พลังงานที่ถึงจอ"));
  o.push(`<path d="M128 220 h14 m-4 -3 l4 3 l-4 3" stroke="#fff" stroke-width="1.6" fill="none"/>`);
  o.push(pill(135, 40, "การแตกใช้พลังงาน ไปกับรอยร้าว", "#fff6c9", 9));
  return o.join("");
};

const viewGl = (ph: number, p: number): string => {
  const o: string[] = [];
  const lift = Math.sin(ph * 5) * 1.2 * sm(0.1, 0.3, p);
  o.push(rect(24, 176, 222, 12, AD, 2, INK, 1) + rect(24, 188, 222, 30, DS, 3, INK, 1.2));
  const shards: [number, number][] = [[34, 0], [76, 6], [118, -4], [160, 8], [202, 0]];
  shards.forEach(([sx, sy], i) => {
    o.push(`<path d="M${sx} ${f2(168 - lift * (i % 2 + 1) + sy)} l32 -4 l8 12 l-34 6 Z" fill="${GL}" stroke="${INK}" stroke-width="1.2" opacity=".95"/>`);
    // เส้นใยกาวยึดเศษ
    o.push(`<path d="M${sx + 10} ${f2(176)} q2 ${f2(-4 - lift)} 0 ${f2(-6 - lift)} M${sx + 26} 176 q2 ${f2(-4 - lift)} 0 ${f2(-6 - lift)}" stroke="#d8aa3a" stroke-width="1.6" fill="none"/>`);
  });
  o.push(lead(246, 182, 250, 120, "#ffe9b0") + txt(198, 114, "กาวยึดเศษไว้", 7.6, "#ffe9b0"));
  // ลูกศรแรงสะเทือนถูกซับ
  for (let i = 0; i < 4; i++) { const u = (ph * 0.9 + i / 4) % 1; o.push(`<path d="M${40 + i * 56} ${f2(80 + u * 60)} v10 m-3 -3 l3 3 l3 -3" stroke="#ff9a3a" stroke-width="2" fill="none" opacity="${f2(1 - u * 0.9)}"/>`); }
  o.push(pill(135, 40, "ยึดเศษ ไม่ให้กระเด็น + ซับแรง", "#fff6c9", 9));
  return o.join("");
};

const viewPt = (ph: number, p: number): string => {
  const o: string[] = [];
  const u = sm(0.15, 0.6, p);
  const pane = (x: number, w: number) => rect(x, 150, w, 14, GL, 3, INK, 1.2) + rect(x, 164, w, 28, DS, 3, INK, 1.2);
  o.push(pane(14, 116) + pane(142, 114));
  // ซ้าย: แรงกระจายกว้าง
  o.push(rect(30, 104 + u * 24, 84, 18, "#8a96a8", 4, INK, 1.2));
  for (let i = 0; i < 7; i++) o.push(`<path d="M${38 + i * 12} ${f2(130 + u * 24)} v${f2(14 - u * 2)} m-3 -3 l3 3 l3 -3" stroke="#58e08a" stroke-width="1.6" fill="none"/>`);
  o.push(txt(72, 90, "พื้นผิวกว้าง แรงกระจาย", 7.4, "#b8ffd0"));
  // ขวา: ปลายแหลมกระจุกจุดเดียว
  const ty = 100 + u * 44;
  o.push(`<path d="M199 ${f2(ty - 24)} L190 ${f2(ty)} L199 ${f2(ty + 12 + 0)} L208 ${f2(ty)} Z" fill="#8a7a6a" stroke="${INK}" stroke-width="1.2"/>`);
  o.push(circ(199, 150, 4 + u * 4, "#ff5a4a", `opacity="${f2(0.4 + 0.5 * u)}"`));
  o.push(`<path d="${crackPath(199, 150, 6, 50, sm(0.5, 0.95, p), 31)}" stroke="#fff" stroke-width="1.3" fill="none"/>`);
  o.push(txt(199, 90, "จุดแหลม แรงกระจุก", 7.4, "#ffb0a0"));
  o.push(pill(135, 40, "แรงกระจุกที่จุดเล็กๆ ก็ร้าวได้", "#fff6c9", 9));
  o.push(txt(135, 226, "แรงต่อพื้นที่ สูงกว่ามาก", 7.8, "#cfeaff"));
  return o.join("");
};

const viewEd = (ph: number, p: number): string => {
  const o: string[] = [];
  const u = sm(0.15, 0.6, p);
  // มุมเหลี่ยม vs มุมมน
  const corner = (x: number, rr: number, lab: string, bad: boolean) => {
    let s = `<path d="M${x} 214 V${70 + rr} Q${x} 70 ${x + rr} 70 H${x + 100}" fill="none" stroke="${GL}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="M${x} 214 V${70 + rr} Q${x} 70 ${x + rr} 70 H${x + 100}" fill="none" stroke="${INK}" stroke-width="1" opacity=".5"/>`;
    // แรงที่ตกมุม
    const hx = x + (bad ? 4 : 12), hy = 74 + (bad ? 4 : 10);
    s += `<path d="M${hx - 22 + 0} ${hy - 22} L${hx - 4} ${hy - 4}" stroke="#ff9a3a" stroke-width="3" opacity="${f2(0.4 + 0.6 * (1 - u))}"/>`;
    // ความเค้น: จุดสีแดง
    const n = bad ? 7 : 12;
    for (let i = 0; i < n; i++) s += circ(bad ? hx + 2 + (i % 3) * 3 : x + 6 + i * 3 + (i > 5 ? 8 : 0), bad ? hy + Math.floor(i / 3) * 3 : 74 + (i % 4) * 3 + (i > 5 ? 8 : 0), bad ? 3.4 : 2.2, bad ? "#ff3a2a" : "#ffb04a", `opacity="${f2(0.3 + 0.6 * u)}"`);
    if (bad) s += `<path d="${crackPath(hx + 6, hy + 6, 5, 40, sm(0.5, 0.95, p), 41)}" stroke="#fff" stroke-width="1.3" fill="none"/>`;
    return s + txt(x + 60, 240, lab, 7.8, bad ? "#ffb0a0" : "#b8ffd0");
  };
  o.push(corner(24, 6, "มุมเหลี่ยม แรงกระจุก", true));
  o.push(corner(150, 28, "ขอบโค้งมน กระจายแรง", false));
  o.push(pill(135, 40, "ขอบและมุม คือจุดอ่อน", "#fff6c9", 9));
  return o.join("");
};

const viewCr = (ph: number, p: number): string => {
  const o: string[] = [];
  const k = sm(0.1, 0.8, p);
  o.push(phone(135, 128, 100, 150, 0, 1, 0.3, 0.3, 0));
  // รอยร้าวใหม่ลามต่อจากรอยเดิม
  o.push(`<g transform="translate(85 53)"><path d="${crackPath(30, 45, 9, 100, 0.55 + 0.45 * k, 3)}" stroke="#ff6a5a" stroke-width="1.8" fill="none"/></g>`);
  const hy = 30 + Math.abs(Math.sin(ph * 2)) * 6;
  o.push(circ(212, hy + 40, 9, "#c8d0dc", `stroke="${INK}" stroke-width="1.2"`) + `<path d="M205 ${f2(hy + 52)} l-14 14" stroke="#ff9a3a" stroke-width="2.4"/>`);
  // แถบความสามารถซับแรง
  o.push(rect(24, 218, 100, 12, "#0b1c28", 6, "#6aa0c0", 1) + rect(24, 218, 100, 12, "#58e08a", 6) + txt(74, 244, "ฟิล์มใหม่ ซับได้เต็มที่", 7, "#b8ffd0"));
  o.push(rect(146, 218, 100, 12, "#0b1c28", 6, "#6aa0c0", 1) + rect(146, 218, 100 * (1 - 0.65 * k), 12, "#ff7a6a", 6) + txt(196, 244, "ร้าวแล้ว ซับได้น้อยลง", 7, "#ffb0a0"));
  o.push(pill(135, 28, "รอยร้าวเดิม = จุดอ่อน ลามต่อง่าย", "#ffd8cf", 8.6));
  return o.join("");
};

const viewNu = (ph: number, p: number): string => {
  const o: string[] = [];
  o.push(phone(135, 128, 120, 160, 0, 0, 0, 0, 0));
  // ขอบฟิล์มลอย + ฟองอากาศ
  const lift = 5 + Math.sin(ph * 3) * 1.2;
  o.push(`<path d="M75 52 q6 ${f2(-lift)} 22 0" stroke="#fff" stroke-width="2" fill="none" opacity=".9"/><path d="M75 52 q4 ${f2(-lift - 5)} 10 -2" stroke="#9fe8ff" stroke-width="1.4" fill="none"/>`);
  for (let i = 0; i < 4; i++) o.push(circ(88 + i * 9, 62 + (i % 2) * 5, 2.6 + (i % 2), "#ffffff55", `stroke="#fff" stroke-width=".8"`));
  // นิ้วลูบรอบขอบ
  const u = (ph * 0.25) % 1, side = Math.floor(u * 4), t = (u * 4) % 1;
  const pts: Pt[] = [[75, 48], [195, 48], [195, 208], [75, 208], [75, 48]];
  const a = pts[side], b = pts[side + 1];
  const fx = lerp(a[0], b[0], t), fy = lerp(a[1], b[1], t);
  o.push(circ(fx, fy, 9, "#f0c6a0", `stroke="${INK}" stroke-width="1.4"`));
  o.push(pill(135, 20, "ลูบรอบขอบ: สะดุด หรือขอบลอก", "#fff6c9", 8.6));
  o.push(txt(135, 240, "รอยร้าว / ขอบลอก / ฟองอากาศ = ถึงเวลาเปลี่ยน", 7.8, "#ffd8cf"));
  return o.join("");
};

const draw = (c: string, ph: number, p: number): string => {
  switch (KIND[c]) {
    case "A": return viewA(c, ph, p);
    case "Ly": return viewLy(ph, p);
    case "Ol": return viewOl(ph, p);
    case "Sc": return viewSc(ph, p);
    case "Nm": return viewNm(ph, p);
    case "Te": return viewTe(ph, p);
    case "Co": return viewCo(ph, p);
    case "Im": return viewIm(ph, p);
    case "Gl": return viewGl(ph, p);
    case "Pt": return viewPt(ph, p);
    case "Ed": return viewEd(ph, p);
    case "Cr": return viewCr(ph, p);
    default: return viewNu(ph, p);
  }
};
export const SCENE_GLASSFILM: SceneDef = {
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
