// ฉากอธิบาย: ผงขจัดคราบผ้าสูตรออกซิเจน (โซเดียมเปอร์คาร์บอเนต) — ละลายน้ำ ปล่อยออกซิเจนเป็นฟอง ดันคราบออกจากเส้นใย — SVG พิกัด 270x480
// โลกแนวตั้งเป็นการ์ดโซนละ 360 หน่วย: 0 ถังแช่ผ้า, 1 ผลึกผง, 2 ปฏิกิริยา+น้ำอุ่น, 3 เส้นใยผ้า, 4 ทดสอบผ้า, 5 ความปลอดภัย, 6 กระปุกเหลือเท่าไร
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
const OUT = "#40507a";
const ZS = 360; // ระยะห่างโซน
const zc = (k: number, ly = 135) => k * ZS + ly; // พิกัดโลกของจุดในโซน k

const DEFS = `<defs>
<linearGradient id="obg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8edfb"/><stop offset="1" stop-color="#d4dcf3"/></linearGradient>
<linearGradient id="owat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#7cc3f2"/></linearGradient>
<linearGradient id="ofab" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb8f0"/><stop offset="1" stop-color="#5f8fdc"/></linearGradient>
<clipPath id="obas"><path d="M52 112 H218 L206 238 Q205 244 198 244 H72 Q65 244 64 238 Z"/></clipPath>
<clipPath id="ocard"><rect x="14" y="16" width="242" height="238" rx="10"/></clipPath>
</defs>`;
const card = (fill = "#f7f9ff") => `<rect x="8" y="8" width="254" height="254" rx="14" fill="${fill}" stroke="#b7c0e0" stroke-width="1.3"/>`;
const bub = (x: number, y: number, r: number, a = 1, c = "#fff") =>
  `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${c}" fill-opacity="${f2(0.55 * a)}" stroke="#6fa6d2" stroke-width="${f2(Math.max(0.3, r * 0.12))}" stroke-opacity="${f2(a)}"/><circle cx="${f2(x - r * 0.3)}" cy="${f2(y - r * 0.3)}" r="${f2(r * 0.26)}" fill="#fff" opacity="${f2(0.9 * a)}"/>`;
const Oat = (x: number, y: number, r = 3) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="#ee5555" stroke="#8c1d22" stroke-width=".4"/>`;
const Hat = (x: number, y: number, r = 1.7) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="#fff" stroke="#5a6a8a" stroke-width=".4"/>`;
const h2o2 = (x: number, y: number, rot = 0, s = 1) => `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${s})"><path d="M-3.2 0 H3.2" stroke="#8c1d22" stroke-width="1.6"/>${Oat(-3.4, 0)}${Oat(3.4, 0)}${Hat(-6.4, -3.4)}${Hat(6.4, 3.4)}</g>`;
const h2o = (x: number, y: number, rot = 0, s = 1) => `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${s})">${Oat(0, 0)}${Hat(-3.8, 2.6)}${Hat(3.8, 2.6)}</g>`;
const o2 = (x: number, y: number, rot = 0, s = 1) => `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${s})"><path d="M-2.8 0 H2.8" stroke="#2a6fb8" stroke-width="2.2"/><circle cx="-3" r="3" fill="#7cc3f2" stroke="#1f5f9f" stroke-width=".5"/><circle cx="3" r="3" fill="#7cc3f2" stroke="#1f5f9f" stroke-width=".5"/></g>`;
const soda = (x: number, y: number, s = 1) => `<g transform="translate(${f2(x)} ${f2(y)}) scale(${s})"><rect x="-5.5" y="-4" width="11" height="8" rx="2" fill="#c3c9d6" stroke="#6b7488" stroke-width=".6"/><text x="0" y="1.8" font-size="4.2" fill="#3a4258" ${K} font-weight="800" text-anchor="middle">Na₂CO₃</text></g>`;

// ---------- Z0: ถังแช่ผ้า ----------
const zone0 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  const hero = cue === "all" || cue === "end";
  const u = hero ? (ph / 8) % 1 : cue === "time" ? 0.4 + 0.6 * p : 0.5;
  const pour = hero ? sm(0, 0.12, u) * (1 - sm(0.16, 0.22, u)) : 0;
  const act = hero ? sm(0.15, 0.5, u) * (1 - 0.35 * sm(0.6, 1, u)) : cue === "time" ? Math.max(0.12, 1 - 0.85 * p) : 0.6;
  const fade = hero ? sm(0.2, 0.95, u) : cue === "time" ? 0.9 : 0.5;
  o.push(`<path d="M52 112 H218 L206 238 Q205 244 198 244 H72 Q65 244 64 238 Z" fill="#eef1fa" stroke="${OUT}" stroke-width="2"/>`);
  o.push(`<g clip-path="url(#obas)"><rect x="40" y="128" width="190" height="130" fill="url(#owat)" opacity=".92"/>`);
  o.push(`<path d="M40 128 Q135 ${f2(131 + Math.sin(ph * 2))} 230 128" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8"/>`);
  // ผ้า + คราบ
  o.push(`<g transform="translate(135 192) rotate(${f2(Math.sin(ph * 0.8) * 2)})"><path d="M-46 -26 Q0 -32 46 -26 L50 26 Q0 32 -50 26Z" fill="url(#ofab)" stroke="#2f5fb0" stroke-width="1.4"/>`);
  for (let i = 0; i < 6; i++) o.push(`<path d="M-44 ${-18 + i * 8} Q0 ${-22 + i * 8} 44 ${-18 + i * 8}" stroke="#a9c8f6" stroke-width=".6" fill="none" opacity=".7"/>`);
  o.push(`<ellipse cx="6" cy="2" rx="${f2(16 * (1 - 0.1 * fade))}" ry="${f2(11 * (1 - 0.1 * fade))}" fill="#8a5a2b" opacity="${f2(0.95 * (1 - fade))}"/></g>`);
  // ฟองจากผ้า
  for (let i = 0; i < 26; i++) {
    const t = (ph * (0.25 + 0.35 * act) + rnd(i)) % 1, x = 92 + rnd(i * 3) * 86 + Math.sin(t * 9 + i) * 3, y = 190 - t * 70;
    if (act > 0.08 && rnd(i + 9) < act) o.push(bub(x, y, 1.2 + rnd(i + 4) * 2.4, 1 - t * 0.6));
  }
  // ผงลงน้ำ
  if (pour > 0.02) for (let i = 0; i < 22; i++) {
    const t = (ph * 0.8 + rnd(i)) % 1, x = 168 + (rnd(i * 2) - 0.5) * 20 - t * 20, y = 60 + t * 120;
    const sz = 1.6 * (1 - sm(0.65, 1, t));
    if (y > 120) o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(sz)}" fill="#fff" stroke="#9aa6c8" stroke-width=".4" opacity="${f2(pour)}"/>`);
  }
  o.push(`</g>`);
  if (pour > 0.02) {
    o.push(`<g transform="translate(205 52) rotate(${f2(-40 * pour - 10)})"><path d="M-14 -6 H14 L9 14 H-9Z" fill="#fff" stroke="${OUT}" stroke-width="1.4"/><rect x="12" y="-4" width="14" height="4" fill="#e8943a" stroke="#8a4a10" stroke-width=".8" transform="rotate(10)"/></g>`);
  }
  if (cue === "time") {
    const cx = 224, cy = 40;
    o.push(`<circle cx="${cx}" cy="${cy}" r="14" fill="#fffdf4" stroke="${OUT}" stroke-width="1.5"/><path d="M${cx} ${cy} L${f2(cx + Math.sin(p * 6.28) * 10)} ${f2(cy - Math.cos(p * 6.28) * 10)}" stroke="#d94b4b" stroke-width="1.8" stroke-linecap="round"/>`);
    o.push(`<rect x="22" y="40" width="110" height="9" rx="4.5" fill="#fff" stroke="${OUT}" stroke-width="1"/><rect x="23" y="41" width="${f2(108 * (1 - 0.85 * p))}" height="7" rx="3.5" fill="#43b97a"/>` + txt(22, 34, "ฤทธิ์ของสารละลาย", 6.2, "#2b3350", "start", 800));
    o.push(txt(22, 62, "ผสมแค่พอใช้ แช่ตามเวลาฉลาก", 6, "#456", "start", 700));
  }
  return o.join("");
};

// ---------- Z1: ผลึกผง ----------
const zone1 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  const dis = cue === "dissolve" ? sm(0.1, 0.9, p) : 0;
  if (cue === "dissolve") o.push(`<rect x="14" y="16" width="242" height="238" rx="10" fill="url(#owat)" opacity="${f2(0.55 * Math.min(1, dis * 3))}"/>`);
  o.push(`<g clip-path="url(#ocard)">`);
  // ผลึกเป็นตาราง
  const cols = 6, rows = 5, x0 = 66, y0 = 78, dx = 28, dy = 26;
  if (dis < 0.02) o.push(`<path d="M${x0 - 20} ${y0 - 20} L${x0 + 160} ${y0 - 20} L${x0 + 176} ${y0 - 34} L${x0 - 4} ${y0 - 34}Z M${x0 + 160} ${y0 - 20} L${x0 + 176} ${y0 - 34} L${x0 + 176} ${y0 + 112} L${x0 + 160} ${y0 + 126}Z" fill="#f2f4fb" stroke="#9aa6c8" stroke-width="1"/><rect x="${x0 - 20}" y="${y0 - 20}" width="180" height="146" rx="3" fill="#fbfcff" stroke="#9aa6c8" stroke-width="1.4"/>`);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const id = j * cols + i, isP = (i + j) % 2 === 0;
    const away = dis * (30 + rnd(id) * 50), ang = rnd(id + 7) * 6.28;
    const dirx = isP ? 1 : -1;
    const x = x0 + i * dx + Math.cos(ang) * away * 0.5 + dirx * dis * 24 + Math.sin(ph * 1.2 + id) * dis * 3, y = y0 + j * dy + Math.sin(ang) * away * 0.4 + Math.cos(ph + id) * dis * 3;
    o.push(isP ? h2o2(x, y, dis * 90 * (rnd(id) - 0.5) + 0, 1.5) : soda(x, y, 1.45));
  }
  o.push(`</g>`);
  o.push(txt(135, 30, cue === "dissolve" ? "ลงน้ำ แล้วแยกตัวออก" : "ผลึกโซเดียมเปอร์คาร์บอเนต", 8, "#2b3350", "middle", 900));
  // คำอธิบายสัญลักษณ์
  o.push(h2o2(34, 240, 0, 1.4) + txt(46, 242, "ไฮโดรเจนเปอร์ออกไซด์", 5.8, "#b02a2a", "start", 800) + soda(150, 240, 1.3) + txt(160, 242, "โซดาแอช (ด่างอ่อน)", 5.8, "#3a4258", "start", 800));
  if (cue === "dissolve" && p > 0.55) o.push(pill(135, 52, "น้ำเป็นด่างอ่อนๆ ช่วยให้คราบหลุดง่าย", "#e6f7d9"));
  return o.join("");
};

// ---------- Z2: ปฏิกิริยา + น้ำอุ่น ----------
const beaker = (x: number, rate: number, ph: number, label: string, col: string, hot: number) => {
  const o: string[] = [];
  o.push(`<path d="M${x - 34} 156 V232 Q${x - 34} 238 ${x - 28} 238 H${x + 28} Q${x + 34} 238 ${x + 34} 232 V156" fill="#eef7fd" stroke="${OUT}" stroke-width="1.8"/>`);
  o.push(`<path d="M${x - 33} 172 H${x + 33} V232 Q${x + 33} 237 ${x + 28} 237 H${x - 28} Q${x - 33} 237 ${x - 33} 232Z" fill="${col}" opacity=".8"/>`);
  for (let i = 0; i < 24; i++) { const t = (ph * (0.3 + 0.9 * rate) + rnd(i)) % 1; if (rnd(i + 3) < rate) o.push(bub(x - 26 + rnd(i * 2) * 52 + Math.sin(t * 9 + i) * 2, 232 - t * 60, 1 + rnd(i + 4) * 1.8, 1 - t * 0.5)); }
  o.push(txt(x, 254, label, 6.4, "#2b3350", "middle", 800));
  o.push(`<rect x="${x + 38}" y="162" width="5" height="60" rx="2.5" fill="#fff" stroke="${OUT}" stroke-width="1"/><rect x="${x + 39}" y="${f2(222 - 52 * hot)}" width="3" height="${f2(52 * hot)}" fill="${hot > 0.5 ? "#e53935" : "#3b82f6"}"/>`);
  return o.join("");
};
const zone2 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  // ครึ่งบน: H2O2 → H2O + O2
  o.push(`<rect x="14" y="16" width="242" height="116" rx="10" fill="#f1f5ff"/>`);
  o.push(txt(135, 30, "ไฮโดรเจนเปอร์ออกไซด์ สลายตัว", 7.4, "#2b3350", "middle", 900));
  const k = cue === "bubbles" ? p : 0.6;
  const pairs = 4;
  for (let i = 0; i < pairs; i++) {
    const u = sm(0.08 + i * 0.16, 0.5 + i * 0.16, k), y = 62 + i * 18;
    // ซ้าย H2O2 (หายไปเมื่อสลายตัว) → ขวา น้ำ + ออกซิเจนลอยขึ้น
    if (u < 0.5) o.push(h2o2(46 + Math.sin(ph * 3 + i) * 1.5, y, 0, 1.5));
    if (u > 0.2) o.push(h2o(150 + 0 * u, y + 4, 0, 1.5 * Math.min(1, (u - 0.2) * 3)));
    if (u > 0.3) { const t = (u - 0.3) / 0.7; const oy = lerp(y, 38, ease(t)), ox = 196 + i * 12 + Math.sin(ph * 4 + i) * 2; o.push(`<g opacity="${f2(Math.min(1, t * 3))}">${o2(ox, oy, 0, 1.4)}${bub(ox, oy, 8.5, 0.5)}</g>`); }
  }
  o.push(`<path d="M72 ${70 + 0} h46 m-6 -4 l6 4 l-6 4" stroke="#2b3350" stroke-width="1.6" fill="none"/>`);
  o.push(txt(46, 126, "เปอร์ออกไซด์", 5.6, "#b02a2a", "middle", 800) + txt(150, 126, "น้ำ", 5.6, "#1f5f9f", "middle", 800) + txt(212, 126, "ออกซิเจน (ฟอง)", 5.6, "#1f5f9f", "middle", 800));
  // ครึ่งล่าง: เย็น vs อุ่น
  o.push(`<rect x="14" y="138" width="242" height="116" rx="10" fill="#fff7ec"/>`);
  const wk = cue === "warm" ? sm(0.1, 0.6, p) : 0.3;
  o.push(beaker(72, 0.12, ph, "น้ำเย็น ช้า", "#cfe8ff", 0.15));
  o.push(beaker(188, 0.2 + 0.8 * wk, ph, "น้ำอุ่น เร็ว", "#ffe3c4", 0.2 + 0.7 * wk));
  return o.join("");
};

// ---------- Z3: เส้นใยผ้า ----------
const zone3 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card("#fbf8f1")];
  o.push(`<g clip-path="url(#ocard)">`);
  // เส้นด้ายสานกัน
  for (let r = 0; r < 9; r++) o.push(`<path d="M10 ${40 + r * 24} Q70 ${30 + r * 24 + (r % 2 ? 8 : -8)} 135 ${40 + r * 24} T260 ${40 + r * 24}" fill="none" stroke="#7b9ed6" stroke-width="9" stroke-linecap="round"/><path d="M10 ${40 + r * 24} Q70 ${30 + r * 24 + (r % 2 ? 8 : -8)} 135 ${40 + r * 24} T260 ${40 + r * 24}" fill="none" stroke="#a9c6f0" stroke-width="5" stroke-linecap="round"/>`);
  for (let c = 0; c < 10; c++) o.push(`<path d="M${22 + c * 26} 8 Q${14 + c * 26 + (c % 2 ? 6 : -6)} 130 ${22 + c * 26} 260" fill="none" stroke="#6d90ca" stroke-width="8" stroke-linecap="round" opacity=".9"/><path d="M${22 + c * 26} 8 Q${14 + c * 26 + (c % 2 ? 6 : -6)} 130 ${22 + c * 26} 260" fill="none" stroke="#9dbdec" stroke-width="4" stroke-linecap="round" opacity=".9"/>`);
  const k = cue === "push" ? p : 0.5;
  // คราบ
  for (let i = 0; i < 9; i++) {
    const bx = 30 + rnd(i * 2) * 210, by = 50 + rnd(i * 2 + 1) * 170;
    const lift = sm(0.25 + rnd(i) * 0.25, 0.9, k), fade = sm(0.15, 0.85, k);
    const x = bx + Math.sin(ph + i) * 1.5 * lift + lift * (rnd(i + 3) - 0.5) * 30, y = by - lift * (30 + rnd(i + 6) * 30);
    o.push(`<path d="M${f2(x - 8)} ${f2(y)} q2 -9 9 -6 q8 3 6 10 q-3 8 -10 6 q-6 -1 -5 -10z" fill="#7d4f24" opacity="${f2((1 - 0.7 * fade) * (1 - 0.7 * lift))}" stroke="#4b2d12" stroke-width=".6"/>`);
    // ฟองออกซิเจนใต้คราบ
    const bs = 2 + 5 * sm(0.0, 0.6, k) * (0.6 + 0.5 * rnd(i + 11));
    o.push(bub(bx + 2, by + 8 - lift * 14, bs, 0.95 * (1 - lift * 0.4)));
  }
  for (let i = 0; i < 20; i++) { const t = (ph * 0.5 + rnd(i)) % 1; o.push(bub(24 + rnd(i * 3) * 220, 250 - t * 230, 1 + rnd(i + 2) * 2.2, 0.8 * (1 - t) * sm(0.1, 0.4, k))); }
  o.push(`</g>`);
  o.push(txt(135, 24, k < 0.5 ? "คราบติดอยู่ในเส้นใยผ้า" : "ฟองออกซิเจนดันคราบ + ทำให้สีจาง", 7.6, "#2b3350", "middle", 900));
  return o.join("");
};

// ---------- Z4: ทดสอบผ้า (สามแถว) ----------
const swatch = (x: number, y: number, w: number, h: number, fill: string, inner = "") => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="#2b3350" stroke-width="1.2"/>${inner}</g>`;
const zone4 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  // แถว 1: ผ้าสี
  const k1 = cue === "colour" ? sm(0.15, 0.9, p) : 0.5;
  o.push(txt(135, 24, "คลอรีน vs ออกซิเจน บนผ้าสี", 7, "#2b3350", "middle", 900));
  o.push(swatch(24, 34, 94, 46, "#e0584f", `<ellipse cx="${f2(60 - 6)}" cy="57" rx="${f2(26 * k1)}" ry="${f2(15 * k1)}" fill="#fbe9e0" opacity=".95"/>`) + swatch(152, 34, 94, 46, "#e0584f", `<ellipse cx="190" cy="57" rx="${f2(18 * (1 - 0.8 * k1))}" ry="${f2(11 * (1 - 0.8 * k1))}" fill="#6b4a2a" opacity="${f2(1 - k1 * 0.9)}"/>`));
  o.push(txt(71, 92, "คลอรีน: สีซีดเป็นด่าง", 5.8, "#b02a2a", "middle", 800) + txt(199, 92, "ออกซิเจน: สีอยู่ คราบหาย", 5.8, "#1f7a3a", "middle", 800));
  // แถว 2: ขนสัตว์ / ไหม
  const k2 = cue === "but" ? sm(0.2, 0.95, p) : 0.3;
  const wool = (x: number) => { let s = ""; for (let i = 0; i < 12; i++) s += `<path d="M${f2(x + 6 + rnd(i) * 82)} ${f2(120 + rnd(i + 3) * 40)} q6 -5 12 0 q6 5 12 0" stroke="#d9cdb6" stroke-width="2" fill="none" stroke-linecap="round"/>`; return s; };
  const holes = (x: number) => { let s = ""; for (let i = 0; i < 6; i++) s += `<circle cx="${f2(x + 14 + rnd(i * 5) * 66)}" cy="${f2(128 + rnd(i * 5 + 1) * 28)}" r="${f2(1 + 4 * k2 * (0.5 + rnd(i)))}" fill="#f7f9ff" stroke="#8a7a60" stroke-width=".6"/>`; return s; };
  o.push(txt(135, 112, "ผ้าที่ไม่ควรใช้", 7, "#2b3350", "middle", 900));
  o.push(swatch(24, 118, 94, 46, "#efe6d2", wool(24) + holes(24)) + swatch(152, 118, 94, 46, "#f6e7ee", `<path d="M158 130 Q200 118 242 134 M158 148 Q200 138 242 152" stroke="#fff" stroke-width="3" opacity=".8" fill="none"/>` + holes(152)));
  o.push(txt(71, 176, "ขนสัตว์ (เส้นใยโปรตีน)", 5.8, "#b02a2a", "middle", 800) + txt(199, 176, "ไหม (เส้นใยโปรตีน)", 5.8, "#b02a2a", "middle", 800));
  // แถว 3: ขีดจำกัด
  const k3 = cue === "limit" ? sm(0.15, 0.85, p) : 0.4;
  o.push(txt(135, 196, "คราบแบบไหนหลุด / ไม่หลุด", 7, "#2b3350", "middle", 900));
  o.push(swatch(24, 202, 94, 40, "#f4f4f6", `<ellipse cx="71" cy="222" rx="${f2(22 * (1 - k3))}" ry="${f2(11 * (1 - k3))}" fill="#9a3b2a" opacity="${f2(1 - k3)}"/>`) + swatch(152, 202, 94, 40, "#f4f4f6", `<ellipse cx="199" cy="222" rx="22" ry="11" fill="#d9b44a" opacity=".9"/><ellipse cx="193" cy="218" rx="8" ry="3" fill="#fff6b0" opacity=".7"/>`));
  o.push(txt(71, 253, "อาหาร เครื่องดื่ม เหงื่อ", 5.6, "#1f7a3a", "middle", 800) + txt(199, 253, "คราบน้ำมัน อาจไม่หมด", 5.6, "#b02a2a", "middle", 800));
  return o.join("");
};

// ---------- Z5: ความปลอดภัย ----------
const zone5 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  o.push(`<path d="M135 20 V254" stroke="#b7c0e0" stroke-width="1" stroke-dasharray="4 3"/>`);
  // ซ้าย: ภาชนะปิดแน่น
  const k = cue === "seal" ? p : 0.3;
  const burst = cue === "seal" && p > 0.8;
  o.push(txt(72, 34, "ปิดฝาแน่น", 8, "#b02a2a", "middle", 900));
  o.push(`<rect x="38" y="110" width="68" height="100" rx="8" fill="#eef7fd" stroke="${OUT}" stroke-width="2"/><rect x="36" y="${burst ? 90 - 12 * Math.sin((p - 0.8) * 20) : 98}" width="72" height="12" rx="3" fill="#6aa0d8" stroke="${OUT}" stroke-width="1.6" transform="rotate(${burst ? f2(-18) : 0} 72 104)"/>`);
  o.push(`<rect x="39" y="${f2(210 - 55)}" width="66" height="55" rx="6" fill="#bfe6ff" opacity=".85"/>`);
  for (let i = 0; i < 14; i++) { const t = (ph * (0.4 + k) + rnd(i)) % 1; o.push(bub(46 + rnd(i * 2) * 52, 205 - t * 90, 1.2 + rnd(i + 3) * 2, 0.9)); }
  // เกจแรงดัน
  o.push(`<g transform="translate(72 62)"><path d="M-20 0 A20 20 0 0 1 20 0" fill="none" stroke="#43b97a" stroke-width="5"/><path d="M8 -17 A20 20 0 0 1 20 0" fill="none" stroke="#e53935" stroke-width="5"/><path d="M0 0 L${f2(Math.cos(Math.PI - k * Math.PI * 0.98) * 17)} ${f2(-Math.sin(Math.PI - k * Math.PI * 0.98) * 17)}" stroke="#2b3350" stroke-width="2" stroke-linecap="round"/><circle r="3" fill="#2b3350"/></g>`);
  o.push(txt(72, 80, "แรงดัน", 5.6, "#456", "middle", 700));
  if (burst) { o.push(`<path d="M72 104 l-12 -20 l10 8 l2 -18 l8 16 l12 -10 l-6 20z" fill="#ffb300" stroke="#e65100" stroke-width="1.2"/>`); for (let i = 0; i < 8; i++) o.push(`<circle cx="${f2(72 + Math.cos(i) * (14 + (p - 0.8) * 120))}" cy="${f2(100 + Math.sin(i * 2) * (10 + (p - 0.8) * 100))}" r="2" fill="#7cc3f2"/>`); }
  o.push(pill(72, 232, burst ? "แรงดันสูง ขวดอาจแตก" : "ก๊าซออกซิเจนไม่มีทางออก", burst ? "#ffd9d0" : "#fff6c9"));
  // ขวา: กระปุกผง เก็บแห้ง
  o.push(txt(200, 34, "เก็บให้แห้ง", 8, "#1f7a3a", "middle", 900));
  o.push(`<rect x="164" y="104" width="72" height="104" rx="9" fill="#f3efff" stroke="${OUT}" stroke-width="2"/><rect x="160" y="92" width="80" height="16" rx="4" fill="#7c6cc8" stroke="${OUT}" stroke-width="1.6"/><rect x="170" y="140" width="60" height="34" rx="3" fill="#fff" stroke="#9a8fe0" stroke-width=".8"/>` + txt(200, 160, "ผงออกซิเจน", 6.4, "#5a4aa8", "middle", 900));
  const wd = cue === "store" ? sm(0.1, 0.9, p) : 0.3;
  for (let i = 0; i < 4; i++) { const t = (ph * 0.5 + i / 4) % 1; o.push(`<path d="M${f2(196 + i * 8)} ${f2(60 + t * 36)} q-3 -5 0 -10 q3 5 0 10z" fill="#58b8f8" opacity="${f2(0.7 * (1 - t) * (0.4 + wd))}"/>`); }
  o.push(`<circle cx="200" cy="72" r="${f2(10 + 0 * wd)}" fill="none" stroke="#e53935" stroke-width="2.4" opacity="${f2(0.5 + 0.5 * wd)}"/><path d="M193 65 l14 14" stroke="#e53935" stroke-width="2.4" opacity="${f2(0.5 + 0.5 * wd)}"/>`);
  o.push(pill(200, 232, "แห้ง ปิดฝา พ้นมือเด็ก", "#e6f7d9"));
  return o.join("");
};

// ---------- Z6: กระปุกเหลือเท่าไร ----------
const zone6 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  const lvl = cue === "chk" ? lerp(0.9, 0.35, sm(0.1, 0.9, p)) : 0.9;
  o.push(`<rect x="96" y="70" width="78" height="150" rx="10" fill="#f3efff" stroke="${OUT}" stroke-width="2"/><rect x="92" y="56" width="86" height="18" rx="4" fill="#7c6cc8" stroke="${OUT}" stroke-width="1.6"/>`);
  o.push(`<clipPath id="otub"><rect x="97" y="71" width="76" height="148" rx="9"/></clipPath><g clip-path="url(#otub)"><rect x="97" y="${f2(219 - 148 * lvl)}" width="76" height="${f2(148 * lvl + 2)}" fill="#fff" stroke="#c9c2f0" stroke-width="1"/>`);
  for (let i = 0; i < 24; i++) o.push(`<circle cx="${f2(102 + rnd(i) * 66)}" cy="${f2(219 - rnd(i + 5) * 148 * lvl)}" r="1.2" fill="#d9d4f5"/>`);
  o.push(`</g>`);
  // สติกเกอร์วันที่เปิด
  o.push(`<g transform="rotate(-4 135 118)"><rect x="104" y="96" width="62" height="34" rx="3" fill="#fffbd0" stroke="#c9a800" stroke-width="1.2"/>${txt(135, 108, "เปิดใช้", 6, "#7a6200", "middle", 800)}<path d="M112 122 h46" stroke="#b09400" stroke-width="1.2" stroke-dasharray="2 1.5"/></g>`);
  // ปฏิทิน
  o.push(`<g transform="translate(206 100)"><rect x="-20" y="-22" width="40" height="44" rx="5" fill="#fff" stroke="${OUT}" stroke-width="1.4"/><rect x="-20" y="-22" width="40" height="11" rx="5" fill="#e57373"/>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${-16 + c * 9}" y="${-6 + r * 9}" width="6" height="6" rx="1" fill="${(r * 4 + c) < Math.floor(p * 12) + 1 ? "#7c6cc8" : "#e3e6f3"}"/>`).join("")).join("")}</g>`);
  o.push(txt(135, 30, "จดวันที่เปิดกระปุกไว้", 8, "#2b3350", "middle", 900));
  o.push(txt(135, 246, "ใช้หมดภายในกี่เดือน?", 7.4, "#5a4aa8", "middle", 900));
  return o.join("");
};

const ZONE_OF: Record<string, number> = { all: 0, time: 0, end: 0, powder: 1, dissolve: 1, bubbles: 2, warm: 2, push: 3, colour: 4, but: 4, limit: 4, seal: 5, store: 5, chk: 6 };

export const SCENE_OXYBLEACH: SceneDef = {
  focus: {
    all: { cx: 135, cy: zc(0), z: 1.0 },
    powder: { cx: 135, cy: zc(1), z: 1.02 },
    dissolve: { cx: 135, cy: zc(1), z: 1.02 },
    bubbles: { cx: 135, cy: zc(2, 75), z: 1.08 },
    warm: { cx: 135, cy: zc(2, 198), z: 1.1 },
    push: { cx: 135, cy: zc(3), z: 1.04 },
    colour: { cx: 135, cy: zc(4, 135), z: 1.04, box: [18, zc(4, 28), 234, 76] },
    but: { cx: 135, cy: zc(4, 135), z: 1.04, box: [18, zc(4, 108), 234, 76] },
    limit: { cx: 135, cy: zc(4, 135), z: 1.04, box: [18, zc(4, 192), 234, 66] },
    time: { cx: 135, cy: zc(0), z: 1.0 },
    seal: { cx: 72, cy: zc(5, 135), z: 1.7 },
    store: { cx: 200, cy: zc(5, 135), z: 1.7 },
    chk: { cx: 135, cy: zc(6), z: 1.04 },
    end: { cx: 135, cy: zc(0), z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const o: string[] = [DEFS, `<rect x="-300" y="-300" width="900" height="3200" fill="url(#obg)"/>`];
    const wrap = (k: number, z: string) => `<g transform="translate(0 ${k * ZS})">${z}</g>`;
    o.push(wrap(0, zone0(cue, p, ph)), wrap(1, zone1(cue, p, ph)), wrap(2, zone2(cue, p, ph)), wrap(3, zone3(cue, p, ph)), wrap(4, zone4(cue, p, ph)), wrap(5, zone5(cue, p, ph)), wrap(6, zone6(cue, p, ph)));
    const F = SCENE_OXYBLEACH.focus[cue] || SCENE_OXYBLEACH.focus.all;
    void ZONE_OF;
    const hud = (s: string, fill = "#fff6c9") => { const y = F.cy - 200 / F.z; o.push(`<g transform="translate(${F.cx} ${f2(y)}) scale(${f2(1.6 / F.z)}) translate(${-F.cx} ${f2(-y)})">${pill(F.cx, y, s, fill)}</g>`); };
    const HUD: Record<string, string> = { all: "ผงขจัดคราบสูตรออกซิเจน", end: "ดูข้างในของใช้ ยังไงนะ", powder: "ผลึกเกลือที่จับเปอร์ออกไซด์ไว้", dissolve: "ละลายน้ำ แยกตัวออกจากกัน", bubbles: "สลายเป็นน้ำ + ฟองออกซิเจน", warm: "น้ำอุ่นช่วยให้เร็วขึ้น", push: "ฟองดันคราบหลุดจากเส้นใย", colour: "ผ้าสีปลอดภัยกว่าคลอรีน", but: "ผ้าโปรตีน ห้ามใช้", limit: "บางคราบ อาจไม่หมด", time: "แช่ตามเวลาฉลาก", seal: "ห้ามปิดฝาแน่น", store: "เก็บผงให้แห้ง", chk: "จดวันที่เปิดกระปุก" };
    if (HUD[cue]) hud(HUD[cue], cue === "but" || cue === "seal" ? "#ffd9d0" : "#fff6c9");
    o.push(box(SCENE_OXYBLEACH.focus[cue]?.box, ph));
    return o.join("");
  },
};
