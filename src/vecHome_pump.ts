// ฉากปั๊มน้ำถังแรงดัน (ตัดครึ่ง: ใบพัด + เปลือกก้นหอย, วาล์วกันกลับ, สวิตช์แรงดัน, ถังแรงดันแบบแผ่นยาง) — คืนสตริง SVG ภายในพิกัด 270x480
// ปริมาตรน้ำในถังคำนวณจากกฎของบอยล์ (ลมถูกอัดตามแรงดัน) จึงสมสัดส่วนกับแรงดันที่เกจอ่าน
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, along, plen, rpath, tube, dot, warrow, box, DEFS } = H;
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const F = `font-family="Kanit, sans-serif"`;
const lbl = (x: number, y: number, t: string, size = 6.5, c = "#27324f", anchor = "middle") =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" ${F} font-weight="700" text-anchor="${anchor}" fill="${c}" stroke="#fff" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">${t}</text>`;
const tw = (t: string, size: number) => t.replace(/[ัิ-ฺ็-๎]/g, "").length * size * 0.56;
const note = (x: number, y: number, t: string, size = 6.5, bg = "#27324f", fg = "#ffe14a") => {
  const w = tw(t, size) + 9, h = size + 6;
  return `<g><rect x="${f2(x - w / 2)}" y="${f2(y - h / 2)}" width="${f2(w)}" height="${f2(h)}" rx="${f2(h / 2)}" fill="${bg}" opacity=".93"/><text x="${f2(x)}" y="${f2(y + size * 0.36)}" font-size="${size}" ${F} font-weight="800" text-anchor="middle" fill="${fg}">${t}</text></g>`;
};
const line = (x1: number, y1: number, x2: number, y2: number, c = "#27324f", w = 0.9) =>
  `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;

// ---------- พิกัดหลัก ----------
const CX = 62, CY = 386;          // ศูนย์กลางใบพัด
const PY = 400;                   // ท่อหลักแนวนอน
const RX = 140;                   // ท่อแยกแนวตั้ง (สวิตช์ เกจ ก๊อก)
const TX0 = 164, TX1 = 252, TY0 = 128, TY1 = 412;   // ถังแรงดัน
const IX0 = 169, IX1 = 247, IY0 = 133, IY1 = 406;   // ด้านในถัง
const IH = IY1 - IY0;
const GX = 116, GY = 305, GR = 17;                  // เกจแรงดัน
const SX0 = 98, SX1 = 132, SY0 = 340, SY1 = 378;    // กล่องสวิตช์
const PRE = 28;                                     // ลมอัดไว้ล่วงหน้า (ตัวอย่างสวิตช์ 30/50 → ต่ำกว่าค่าตัดเข้า 2)
const CUTIN = 30, CUTOUT = 50;
const FAUCET_X = 34;

const EXTRA = `<defs>
<linearGradient id="tankm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa6bd"/><stop offset=".3" stop-color="#e8edf5"/><stop offset=".6" stop-color="#b3bdd0"/><stop offset="1" stop-color="#6e7a93"/></linearGradient>
<linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a7650"/><stop offset="1" stop-color="#6b4b2e"/></linearGradient>
<linearGradient id="wtr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd6ff"/><stop offset="1" stop-color="#2f8fe0"/></linearGradient>
<clipPath id="tankin"><rect x="${IX0}" y="${IY0}" width="${IX1 - IX0}" height="${IY1 - IY0}" rx="26"/></clipPath>
</defs>`;

// ---------- สถานะตามคิว ----------
type St = { P: number; run: number; tap: number; tire: number; hl: number; cyc: number };
const ramp = (p: number, a: number, b: number) => cl((p - a) / (b - a));
// รอบการทำงานต่อเนื่อง (คิว cycle): [เริ่ม, จบ, psi เริ่ม, psi จบ, ปั๊มทำงาน]
const CYC: [number, number, number, number, number][] = [
  [0, 0.1, 35, 50, 1], [0.1, 0.38, 50, 30, 0], [0.38, 0.5, 30, 50, 1],
  [0.5, 0.78, 50, 30, 0], [0.78, 0.9, 30, 50, 1], [0.9, 1.0, 50, 44, 0],
];
const cycP = (p: number): { P: number; run: number } => {
  for (const [a, b, p0, p1, r] of CYC) if (p <= b + 1e-9) return { P: lerp(p0, p1, cl((p - a) / (b - a))), run: r };
  return { P: 44, run: 0 };
};
const stateOf = (cue: string, p: number): St => {
  const s: St = { P: 40, run: 0, tap: 0, tire: 0, hl: 0, cyc: 0 };
  switch (cue) {
    case "impeller": s.P = 30 + 2 * p; s.run = 1; break;
    case "volute": s.P = 32 + 2 * p; s.run = 1; break;
    case "tank": s.P = 34 + 14 * ease(p); s.run = 1; break;
    case "switch": s.P = 48 + 2 * ramp(p, 0, 0.4); s.run = p < 0.4 ? 1 : 0; break;
    case "check": s.P = 50; s.run = 0; break;
    case "tap": s.tap = ease(ramp(p, 0, 0.15)); s.P = 50 - 19 * ease(ramp(p, 0.1, 1)); break;
    case "cutin": s.tap = 1; s.P = p < 0.25 ? 31 - ramp(p, 0, 0.25) : 30 + 5 * ramp(p, 0.3, 1); s.run = p >= 0.25 ? 1 : 0; break;
    case "cycle": { const c = cycP(p); s.P = c.P; s.run = c.run; s.tap = 1; s.cyc = 1; break; }
    case "fact": s.P = 40; s.hl = 1; break;
    case "tip": s.tap = 1; s.P = 40 * (1 - ease(ramp(p, 0, 0.45))); s.tire = ease(ramp(p, 0.5, 0.7)); break;
    default: break;
  }
  return s;
};

const waterFrac = (P: number) => (P > PRE ? 1 - (PRE + 14.7) / (P + 14.7) : 0); // กฎของบอยล์ (ความดันสัมบูรณ์)

// ---------- เกจ ----------
const gaugeAngle = (v: number, max: number) => -135 + (270 * cl(v / max));
const arcPts = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const pt = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const A = pt(a0), B = pt(a1);
  return `M${f2(A[0])} ${f2(A[1])} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f2(B[0])} ${f2(B[1])}`;
};
const dial = (cx: number, cy: number, r: number, v: number, max: number, marks: [number, string][], band?: [number, number]) => {
  const o: string[] = [];
  o.push(`<circle cx="${cx}" cy="${cy}" r="${r + 2}" fill="#8e99b0" stroke="#4b5878" stroke-width=".8"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fbfcff" stroke="#27324f" stroke-width=".7"/>`);
  if (band) o.push(`<path d="${arcPts(cx, cy, r - 3.2, gaugeAngle(band[0], max), gaugeAngle(band[1], max))}" fill="none" stroke="#7bd6a0" stroke-width="2.6" opacity=".9"/>`);
  for (const [m, t] of marks) {
    const a = (gaugeAngle(m, max) * Math.PI) / 180;
    o.push(line(cx + (r - 1.2) * Math.sin(a), cy - (r - 1.2) * Math.cos(a), cx + (r - 4.2) * Math.sin(a), cy - (r - 4.2) * Math.cos(a), "#27324f", 0.8));
    o.push(`<text x="${f2(cx + (r - 7.6) * Math.sin(a))}" y="${f2(cy - (r - 7.6) * Math.cos(a) + 1.5)}" font-size="4.2" ${F} font-weight="800" text-anchor="middle" fill="#27324f">${t}</text>`);
  }
  const na = (gaugeAngle(v, max) * Math.PI) / 180;
  o.push(`<line x1="${cx}" y1="${cy}" x2="${f2(cx + (r - 3.5) * Math.sin(na))}" y2="${f2(cy - (r - 3.5) * Math.cos(na))}" stroke="#e0242c" stroke-width="1.5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="2" fill="#27324f"/>`);
  return o.join("");
};

// ---------- ถังแรงดัน ----------
const tank = (st: St, ph: number, cue: string) => {
  const o: string[] = [];
  const hw = waterFrac(st.P) * IH;                       // ความสูงของน้ำ (พิกเซล)
  const yM = IY1 - hw;                                   // ตำแหน่งแผ่นยาง
  const Pa = Math.max(st.P, PRE);                        // แรงดันลมในถัง
  const aT = cl((Pa - PRE) / 24);
  o.push(`<g filter="url(#sh)"><rect x="${TX0}" y="${TY0}" width="${TX1 - TX0}" height="${TY1 - TY0}" rx="32" fill="url(#tankm)" stroke="#4b5878" stroke-width="1.2"/></g>`);
  // ขอบฐาน
  o.push(`<rect x="${TX0 + 12}" y="${TY1 - 2}" width="14" height="9" rx="2" fill="#6e7a93"/><rect x="${TX1 - 26}" y="${TY1 - 2}" width="14" height="9" rx="2" fill="#6e7a93"/>`);
  o.push(`<rect x="${IX0}" y="${IY0}" width="${IX1 - IX0}" height="${IY1 - IY0}" rx="26" fill="${mixc("#e6f1ff", "#ffd3d6", aT)}"/>`);
  o.push(`<g clip-path="url(#tankin)">`);
  // อนุภาคลม
  const N = 34;
  const airH = Math.max(8, yM - IY0 - 3);
  for (let i = 0; i < N; i++) {
    const bx = IX0 + 6 + rnd(i + 5) * (IX1 - IX0 - 12), by = IY0 + 6 + rnd(i + 9) * (airH - 10);
    const sp = 0.8 + aT * 1.4;
    const x = bx + Math.sin(ph * 2.2 * sp + i * 1.7) * (2.4 + 1.6 * aT);
    const y = IY0 + 5 + ((by - IY0 - 5) / Math.max(1, airH - 10)) * Math.max(4, airH - 12) + Math.cos(ph * 1.9 * sp + i * 2.3) * (2 + aT);
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.6" fill="${mixc("#7aa3d6", "#e0525e", aT)}" opacity=".85"/>`);
  }
  // น้ำ
  if (hw > 0.3) {
    o.push(`<rect x="${IX0}" y="${f2(yM)}" width="${IX1 - IX0}" height="${f2(hw + 2)}" fill="url(#wtr)"/>`);
    for (let i = 0; i < 6; i++) {
      const bx = IX0 + 8 + rnd(i + 31) * 62, by = yM + 6 + ((ph * 5 + i * 17) % Math.max(6, hw - 8));
      if (by < IY1 - 3) o.push(`<circle cx="${f2(bx)}" cy="${f2(by)}" r="1.1" fill="#fff" opacity=".5"/>`);
    }
  }
  // แผ่นยาง (ผนังกั้นลม–น้ำ)
  let d = `M${IX0} ${f2(yM)}`;
  for (let x = IX0; x <= IX1; x += 3) d += ` L${x} ${f2(yM + 1.3 * Math.sin(x * 0.28 + ph * 2))}`;
  o.push(`<path d="${d}" fill="none" stroke="#2b3350" stroke-width="2.4" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#6a7599" stroke-width=".7" transform="translate(0 -.6)"/>`);
  o.push(`</g>`);
  o.push(`<rect x="${IX0}" y="${IY0}" width="${IX1 - IX0}" height="${IY1 - IY0}" rx="26" fill="none" stroke="#4b5878" stroke-width="1"/>`);
  // วาล์วเติมลมด้านบน
  o.push(`<rect x="205.2" y="119" width="5.6" height="11" rx="1.2" fill="#8e99b0" stroke="#4b5878" stroke-width=".7"/><rect x="204" y="115.5" width="8" height="5.5" rx="1.6" fill="#2f9e5e" stroke="#16603a" stroke-width=".7"/>`);
  // ป้ายในถัง
  if (cue === "tank" || cue === "tap" || cue === "cutin" || cue === "check" || cue === "switch") {
    o.push(lbl(208, IY0 + 22, "ลมอัด", 8, "#a31f1f"));
    if (hw > 22) o.push(lbl(208, yM + 14, "น้ำ", 8, "#12508a"));
    o.push(lbl(208, yM - 5, "แผ่นยางกั้น", 6, "#27324f"));
  }
  return o.join("");
};

// ---------- ปั๊ม ----------
const ro = (th: number) => 20 + (9.5 * th) / (2 * Math.PI);
const pump = (st: St, ph: number, cue: string, frame: number) => {
  const o: string[] = [];
  const run = st.run > 0.5;
  // มอเตอร์
  o.push(`<g filter="url(#sh2)"><rect x="6" y="368" width="34" height="36" rx="6" fill="url(#metal)" stroke="#4b5878" stroke-width="1"/></g>`);
  for (let k = 0; k < 5; k++) o.push(`<rect x="${11 + k * 6}" y="372" width="2.6" height="28" rx="1" fill="#6e7a93" opacity=".55"/>`);
  o.push(`<rect x="38" y="382" width="14" height="8" fill="#8e99b0" stroke="#4b5878" stroke-width=".6"/>`);
  o.push(`<rect x="12" y="404" width="22" height="16" fill="#6e7a93"/><rect x="60" y="414" width="0" height="0"/>`);
  // ท่อดูดจากแหล่งน้ำ
  o.push(tube([[CX, 476], [CX, 410]], 8, "#8f9bb3", "#dfe6f2", 1));
  o.push(`<path d="M${CX} 476 L${CX} 410" stroke="#58b8f8" stroke-width="5" opacity=".85"/>`);
  // เปลือกก้นหอย (ตัดครึ่งให้เห็นข้างใน)
  const pts = (add: number) => { const a: string[] = []; for (let k = 0; k <= 56; k++) { const th = (k / 56) * Math.PI * 2; const r = ro(th) + add; a.push(`${f2(CX + r * Math.cos(th))} ${f2(CY + r * Math.sin(th))}`); } return a.join(" L"); };
  o.push(`<rect x="${CX + 17}" y="${CY}" width="16" height="${PY - CY - 1}" rx="2" fill="#6e7a93"/>`);
  o.push(`<g filter="url(#sh2)"><path d="M${pts(3)} Z" fill="#6e7a93" stroke="#27324f" stroke-width="1"/></g>`);
  o.push(`<path d="M${pts(0)} Z" fill="#bfe3ff"/>`);
  o.push(`<rect x="${CX + 20}" y="${CY - 1}" width="9.6" height="${PY - CY + 2}" fill="#bfe3ff"/>`);
  o.push(`<rect x="${CX + 20}" y="${CY + 8}" width="9.6" height="${PY - CY - 6}" fill="#bfe3ff"/>`);
  // ใบพัด
  const ang = run ? frame * 0.3 : 0.4;
  o.push(`<circle cx="${CX}" cy="${CY}" r="18" fill="#9cb8de" opacity=".55" stroke="#4b5878" stroke-width=".8"/>`);
  let bl = "";
  for (let k = 0; k < 6; k++) bl += `<path d="M5 0 C 9 -1, 14 -4, 17 -11" fill="none" stroke="#27324f" stroke-width="2.5" stroke-linecap="round" transform="rotate(${f2((k * 60 + (ang * 180) / Math.PI) % 360)})"/>`;
  o.push(`<g transform="translate(${CX} ${CY})">${bl}</g>`);
  o.push(`<circle cx="${CX}" cy="${CY}" r="5" fill="#4b5878" stroke="#10182a" stroke-width=".8"/><circle cx="${CX}" cy="${CY}" r="1.6" fill="#dfe5ef"/>`);
  // ลูกศรทิศหมุน (ตามเข็มนาฬิกา)
  if (cue === "impeller" || cue === "volute") {
    o.push(`<path d="M${CX - 11} ${CY - 12} A 16 16 0 0 1 ${CX + 11} ${CY - 12}" fill="none" stroke="#e0242c" stroke-width="1.4" stroke-linecap="round" opacity=".9"/><path d="M${CX + 11} ${CY - 12} l-1 -4.5 l-4 3.5z" fill="#e0242c" transform="rotate(30 ${CX + 11} ${CY - 12})" opacity=".9"/>`);
  }
  // อนุภาคน้ำ
  const n = 15, tt = run ? frame / 30 : 0;
  const th1 = -Math.PI / 2 + 1.8 * Math.PI;
  for (let i = 0; i < n; i++) {
    const u = (tt * (0.5 + 0.06 * rnd(i)) + i / n) % 1;
    let x: number, y: number, a = 1, tx = 0, ty = 0;
    if (u < 0.22) { const v = u / 0.22; x = CX + (rnd(i + 1) - 0.5) * 3; y = 470 - (470 - CY) * v; a = y < 416 ? 0.75 * (1 - v * 0.3) : 1; }
    else if (u < 0.5) { const v = (u - 0.22) / 0.28; const r = 4 + 14 * v, th = -Math.PI / 2 + 1.8 * Math.PI * v; x = CX + r * Math.cos(th); y = CY + r * Math.sin(th); tx = -Math.sin(th); ty = Math.cos(th); }
    else if (u < 0.88) { const v = (u - 0.5) / 0.38; const th = th1 + (2 * Math.PI - th1 + 2 * Math.PI * 0) * v; const rr = lerp(18, ro(th - 2 * Math.PI * Math.floor(th / (2 * Math.PI))) - 4.5, Math.min(1, v * 3)); x = CX + rr * Math.cos(th); y = CY + rr * Math.sin(th); tx = -Math.sin(th); ty = Math.cos(th); }
    else { const v = (u - 0.88) / 0.12; x = CX + 25 + (rnd(i + 3) - 0.5) * 3; y = CY + (PY - CY) * v; ty = 1; }
    if (run && (tx || ty) && u >= 0.22 && u < 0.88) o.push(`<line x1="${f2(x)}" y1="${f2(y)}" x2="${f2(x - tx * 6)}" y2="${f2(y - ty * 6)}" stroke="#1d6fb8" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>`);
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.9" fill="#2f8fe0" stroke="#fff" stroke-width=".5" opacity="${f2(a)}"/>`);
  }
  // ป้ายชื่อ
  if (cue === "impeller") {
    o.push(lbl(CX, 343, "ใบพัด", 8, "#27324f"));
    o.push(line(CX, 346, CX + 7, CY - 8, "#27324f", 0.7));
    o.push(lbl(22, 416, "มอเตอร์", 6.5));
    o.push(lbl(54, 452, "ท่อดูดน้ำ", 6.5, "#27324f", "end"));
    o.push(note(90, 438, "น้ำเข้าตรงกลาง", 5.2, "#12508a", "#fff"));
  }
  if (cue === "volute") {
    o.push(lbl(CX - 18, 346, "เปลือกก้นหอย", 7, "#27324f"));
    o.push(note(CX + 10, 430, "ช่องกว้างขึ้นไปทางท่อออก", 5.4, "#12508a", "#fff"));
  }
  return o.join("");
};

// ---------- สวิตช์แรงดัน ----------
const switchBox = (st: St, ph: number, cue: string) => {
  const o: string[] = [];
  const closed = st.run > 0.5;
  o.push(tube([[132, 369], [RX, 369]], 4, "#8f9bb3", "#dfe6f2", 1));
  o.push(`<g filter="url(#sh2)"><rect x="${SX0}" y="${SY0}" width="${SX1 - SX0}" height="${SY1 - SY0}" rx="4" fill="#d6dbe6" stroke="#4b5878" stroke-width="1"/></g>`);
  o.push(`<rect x="${SX0 + 3}" y="${SY0 + 3}" width="${SX1 - SX0 - 6}" height="${SY1 - SY0 - 6}" rx="3" fill="#2b3350"/>`);
  // ห้องรับแรงดัน + ลูกสูบดันก้านขึ้น
  const pis = 372 - 6 * cl(st.P / 60);
  o.push(`<rect x="121" y="362" width="10" height="13" rx="1.5" fill="#2f8fe0" opacity=".85"/>`);
  o.push(`<rect x="121.5" y="${f2(pis - 2)}" width="9" height="3" rx="1" fill="#dfe5ef"/>`);
  o.push(`<line x1="126" y1="${f2(pis - 2)}" x2="126" y2="${f2(closed ? 358 : 354)}" stroke="#dfe5ef" stroke-width="1.4"/>`);
  // ขั้วหน้าสัมผัส
  o.push(`<rect x="103" y="352" width="6" height="6" rx="1" fill="#e8a33d" stroke="#8a5a1a" stroke-width=".6"/><rect x="117" y="352" width="6" height="6" rx="1" fill="#e8a33d" stroke="#8a5a1a" stroke-width=".6"/>`);
  const by = closed ? 352 : 345;
  o.push(`<rect x="104" y="${by}" width="18" height="2.6" rx="1" fill="${closed ? "#ffe14a" : "#c8ccd8"}" stroke="#8a6d10" stroke-width=".5"/>`);
  if (!closed) o.push(`<text x="113" y="${by - 2}" font-size="5" ${F} font-weight="900" text-anchor="middle" fill="#ff7a6a">เปิด</text>`);
  else o.push(`<text x="113" y="348.5" font-size="5" ${F} font-weight="900" text-anchor="middle" fill="#7dffb0">ต่อ</text>`);
  // สายไฟจากกล่องไปมอเตอร์ + อิเล็กตรอน
  const W: [number, number][] = [[SX0, 355], [14, 355], [14, 369]];
  o.push(`<path d="M${SX0} 355 H14 V369" fill="none" stroke="#27324f" stroke-width="2.4"/><path d="M${SX0} 355 H14 V369" fill="none" stroke="${closed ? "#ffd84a" : "#9aa6bd"}" stroke-width="1.2"/>`);
  if (closed) { const L = plen(W as any); for (let k = 0; k < 6; k++) { const q = along(W as any, (((ph * 30 + k * L / 6) % L) + L) % L); o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="1.5" fill="#ffd84a" stroke="#8a6d10" stroke-width=".4"/>`); } }
  // ไฟเข้า
  o.push(`<path d="M126 340 V333" stroke="#27324f" stroke-width="2.4"/><path d="M126 340 V333" stroke="#ffd84a" stroke-width="1.2"/>`);
  if (cue === "switch" || cue === "cutin") { o.push(lbl(126, 329.5, "ไฟบ้าน", 5.6)); o.push(lbl(118, 389, "สวิตช์แรงดัน", 6.5)); }
  return o.join("");
};

// ---------- วาล์วกันกลับ ----------
const checkValve = (st: St, ph: number, cue: string) => {
  const o: string[] = [];
  const open = st.run > 0.5 || (st.tap > 0.5 && false);
  o.push(`<g filter="url(#sh2)"><rect x="103" y="392.5" width="22" height="15" rx="4" fill="#d6dbe6" stroke="#4b5878" stroke-width="1"/></g>`);
  o.push(`<rect x="105" y="395" width="18" height="10" rx="2" fill="#bfe3ff"/>`);
  o.push(`<rect x="110.4" y="395" width="3" height="3.4" fill="#6e7a93"/><rect x="110.4" y="401.8" width="3" height="3.4" fill="#6e7a93"/>`);
  const al = (open ? 74 : 0) * Math.PI / 180;
  const hx = 112, hy = 395.4, L = 9.4;
  o.push(`<line x1="${hx}" y1="${hy}" x2="${f2(hx + L * Math.sin(al))}" y2="${f2(hy + L * Math.cos(al))}" stroke="#27324f" stroke-width="2.2" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="1.3" fill="#e8a33d"/>`);
  if (cue === "check") {
    o.push(lbl(114, 389, "วาล์วกันกลับ", 7.5));
    if (!open) {
      o.push(warrow(144, 412, "#e0242c", 0.5 + 0.5 * Math.sin(ph * 6), -1));
      o.push(`<g stroke="#e0242c" stroke-width="2.2" stroke-linecap="round"><line x1="127.5" y1="396.5" x2="133.5" y2="403.5"/><line x1="133.5" y1="396.5" x2="127.5" y2="403.5"/></g>`);
      o.push(note(112, 426, "ปั๊มหยุด วาล์วปิด น้ำไหลย้อนไม่ได้", 5.4, "#a31f1f", "#fff"));
    }
  }
  return o.join("");
};

// ---------- ก๊อกน้ำ + อ่าง ----------
const faucet = (st: St, ph: number, cue: string) => {
  const o: string[] = [];
  const t = cl(st.tap);
  // อ่าง
  o.push(`<path d="M8 300 H66 L61 326 H13 Z" fill="#e6ebf3" stroke="#6e7a93" stroke-width="1.1"/><path d="M12 318 H62 L61 326 H13 Z" fill="#58b8f8" opacity=".8"/>`);
  // ตัวก๊อก
  o.push(`<rect x="${FAUCET_X - 9}" y="244" width="18" height="12" rx="3" fill="url(#metal)" stroke="#4b5878" stroke-width=".9"/>`);
  o.push(`<path d="M${FAUCET_X - 3} 256 h6 v10 q0 3 -3 3 q-3 0 -3 -3z" fill="url(#metal)" stroke="#4b5878" stroke-width=".9"/>`);
  o.push(`<rect x="${FAUCET_X - 2}" y="238" width="4" height="7" fill="#8e99b0" stroke="#4b5878" stroke-width=".6"/>`);
  o.push(`<g transform="translate(${FAUCET_X} 237) rotate(${f2(90 * t)})"><rect x="-9" y="-2" width="18" height="4" rx="2" fill="#e24b4b" stroke="#8e1f1f" stroke-width=".7"/></g>`);
  // ลำน้ำ
  if (t > 0.5) {
    o.push(`<rect x="${FAUCET_X - 1.3}" y="269" width="2.6" height="${f2(318 - 269)}" fill="#7fd0ff" opacity=".6"/>`);
    for (let k = 0; k < 7; k++) { const y = 269 + ((ph * 90 + k * 8) % 49); o.push(`<circle cx="${FAUCET_X + Math.sin(k * 2) * 0.8}" cy="${f2(y)}" r="1.5" fill="#58b8f8" stroke="#fff" stroke-width=".4"/>`); }
    for (let k = 0; k < 3; k++) { const u = (ph * 2 + k / 3) % 1; o.push(`<ellipse cx="${FAUCET_X}" cy="318.5" rx="${f2(2 + 8 * u)}" ry="${f2(0.8 + 1.2 * u)}" fill="none" stroke="#fff" stroke-width=".8" opacity="${f2(0.9 * (1 - u))}"/>`); }
  }
  if (cue === "tap") o.push(lbl(FAUCET_X, 232, "เปิดก๊อก", 7.5));
  return o.join("");
};

const SC = 1;
export const SCENE_PUMP: SceneDef = {
  focus: {
    all: { cx: 135, cy: 240, z: 1.0 },
    impeller: { cx: 62, cy: 385, z: 2.5, box: [CX - 22, CY - 22, 44, 44], label: "ใบพัด" },
    volute: { cx: 66, cy: 385, z: 2.5, box: [CX - 30, CY - 30, 60, 60], label: "เปลือกก้นหอย" },
    tank: { cx: 196, cy: 270, z: 1.6, box: [TX0, TY0, TX1 - TX0, TY1 - TY0], label: "ถังแรงดัน" },
    switch: { cx: 118, cy: 330, z: 2.5, box: [SX0, SY0, SX1 - SX0, SY1 - SY0], label: "สวิตช์แรงดัน" },
    check: { cx: 112, cy: 384, z: 2.7, box: [103, 392, 22, 16], label: "วาล์วกันกลับ" },
    tap: { cx: 135, cy: 255, z: 1.12, box: [24, 236, 22, 34], label: "เปิดก๊อก" },
    cutin: { cx: 100, cy: 340, z: 1.55, box: [SX0, SY0, SX1 - SX0, SY1 - SY0], label: "ค่าตัดเข้า" },
    cycle: { cx: 135, cy: 240, z: 1.0 },
    fact: { cx: 208, cy: 150, z: 3.2, box: [202, 114, 12, 18], label: "วาล์วเติมลม" },
    tip: { cx: 160, cy: 245, z: 1.25, box: [195, 76, 26, 54], label: "วัดลมในถัง" },
    end: { cx: 135, cy: 240, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const st = stateOf(cue, p);
    const run = st.run > 0.5;
    const o: string[] = [DEFS, EXTRA];
    // ฉากหลัง + พื้น + ดิน/น้ำใต้ดิน
    o.push(`<rect x="-140" y="-140" width="550" height="560" fill="url(#wall)"/>`);
    o.push(`<rect x="-140" y="420" width="550" height="12" fill="#aeb4c0"/><rect x="-140" y="431" width="550" height="2" fill="#8e95a3"/>`);
    o.push(`<rect x="-140" y="433" width="550" height="120" fill="url(#soil)"/>`);
    o.push(H.wave(-140, 410, 458, 1.2, ph * 2, 560, "#4aa6e8", 0.85));
    o.push(lbl(110, 470, "แหล่งน้ำ", 7));
    o.push(tank(st, ph, cue));
    // ท่อ (มีน้ำเต็มท่อ)
    const mainPipe: [number, number][] = [[87, 392], [87, PY], [176, PY]];
    const riser: [number, number][] = [[RX, PY], [RX, 250], [FAUCET_X, 250], [FAUCET_X, 258]];
    for (const pp of [mainPipe, riser]) {
      o.push(tube(pp, 7, "#8f9bb3", "#dfe6f2", 4));
      o.push(`<path d="${rpath(pp, 4)}" fill="none" stroke="#58b8f8" stroke-width="4.1" opacity=".85" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    // เกจ
    o.push(tube([[GX + GR + 1, GY], [RX, GY]], 3.6, "#8f9bb3", "#dfe6f2", 1));
    o.push(dial(GX, GY, GR, st.P, 80, [[0, "0"], [30, "30"], [50, "50"], [80, "80"]], [CUTIN, CUTOUT]));
    o.push(`<text x="${GX}" y="${GY + 9.5}" font-size="4" ${F} font-weight="800" text-anchor="middle" fill="#6e7a93">psi</text>`);
    if (cue === "switch" || cue === "cutin" || cue === "cycle") o.push(lbl(GX, GY - GR - 5, "เกจวัดแรงดัน", 6.2));
    o.push(switchBox(st, ph, cue));
    o.push(faucet(st, ph, cue));
    o.push(pump(st, ph, cue, frame));
    o.push(checkValve(st, ph, cue));
    // ชั้นของไหลในท่อ
    const flowDots = (pts: [number, number][], dir: number, n: number, sp: number) => {
      const L = plen(pts as any);
      for (let k = 0; k < n; k++) {
        const d = (((ph * sp * dir + (k * L) / n) % L) + L) % L;
        const q = along(pts as any, d);
        o.push(dot(q as any, 1.5, "#2f8fe0"));
      }
    };
    const fill = run && !(st.tap > 0.5 && st.P >= CUTOUT);
    const drain = !run && st.tap > 0.5 && st.P > PRE - 0 && false;
    if (run) flowDots([[87, 394], [87, PY], [RX, PY]], 1, 7, 26);
    if (fill) flowDots([[RX, PY], [176, PY]], 1, 4, 26);
    if (!run && st.tap > 0.5 && st.P > PRE) flowDots([[176, PY], [RX, PY]], 1, 4, 22);
    void drain;
    if (st.tap > 0.5 && st.P > 1) flowDots([[RX, PY - 4], [RX, 250], [FAUCET_X, 250], [FAUCET_X, 262]], 1, 11, 28);
    // ป้ายสถานะ + แผงอ่านค่า (เห็นเมื่อซูมออก)
    o.push(`<g ${F} font-weight="900" text-anchor="middle"><rect x="46" y="9" width="178" height="22" rx="11" fill="#27324f" opacity=".92"/><text x="135" y="24.5" font-size="11.5" fill="#ffe14a">ปั๊มน้ำถังแรงดัน</text></g>`);
    o.push(`<g ${F}><rect x="8" y="40" width="82" height="19" rx="9.5" fill="${run ? "#1f8a4c" : "#a31f1f"}" opacity=".94"/><circle cx="19" cy="49.5" r="4" fill="${run ? "#7dffb0" : "#ffb0a8"}"/><text x="28" y="53.7" font-size="10.5" font-weight="900" fill="#fff">ปั๊ม ${run ? "ทำงาน" : "หยุด"}</text></g>`);
    o.push(`<g ${F}><rect x="8" y="64" width="82" height="40" rx="7" fill="#fffdf5" stroke="#8a8272" stroke-width="1"/><text x="14" y="76" font-size="7" font-weight="800" fill="#27324f">แรงดันในระบบ</text><text x="14" y="97" font-size="17" font-weight="900" fill="#d6232a">${Math.round(st.P)}</text><text x="${Math.round(st.P) >= 100 ? 52 : 40}" y="97" font-size="8" font-weight="800" fill="#6e7a93">psi</text></g>`);
    if (cue === "all" || cue === "end" || cue === "cycle") o.push(lbl(49, 116, "ตัวอย่างตั้งไว้ 30 / 50 psi", 6));
    // กราฟรอบการทำงาน
    if (st.cyc) {
      const gx = 8, gy = 124, gw = 142, gh = 96, ymin = 20, ymax = 55;
      const Y = (v: number) => gy + gh - ((v - ymin) / (ymax - ymin)) * gh;
      o.push(`<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="6" fill="#fffdf5" stroke="#8a8272" stroke-width="1"/>`);
      o.push(`<line x1="${gx + 4}" y1="${f2(Y(50))}" x2="${gx + gw - 4}" y2="${f2(Y(50))}" stroke="#d6232a" stroke-width=".8" stroke-dasharray="3 2"/><line x1="${gx + 4}" y1="${f2(Y(30))}" x2="${gx + gw - 4}" y2="${f2(Y(30))}" stroke="#2f6fd0" stroke-width=".8" stroke-dasharray="3 2"/>`);
      o.push(`<text x="${gx + gw - 5}" y="${f2(Y(50) - 2)}" font-size="5.6" ${F} font-weight="800" text-anchor="end" fill="#d6232a">ตัดออก 50</text><text x="${gx + gw - 5}" y="${f2(Y(30) + 7)}" font-size="5.6" ${F} font-weight="800" text-anchor="end" fill="#2f6fd0">ตัดเข้า 30</text>`);
      o.push(`<text x="${gx + 6}" y="${gy + 9}" font-size="6.4" ${F} font-weight="800" fill="#27324f">แรงดันตามเวลา</text>`);
      let prev: [number, number] | null = null;
      const steps = 120;
      for (let k = 0; k <= steps; k++) {
        const q = (k / steps) * p; const c = cycP(q);
        const x = gx + 6 + (q * (gw - 12));
        const y = Y(c.P);
        if (prev) o.push(`<line x1="${f2(prev[0])}" y1="${f2(prev[1])}" x2="${f2(x)}" y2="${f2(y)}" stroke="${c.run ? "#1f8a4c" : "#6e7a93"}" stroke-width="2" stroke-linecap="round"/>`);
        prev = [x, y];
      }
      if (prev) o.push(`<circle cx="${f2(prev[0])}" cy="${f2(prev[1])}" r="2.6" fill="#ffe14a" stroke="#27324f" stroke-width=".8"/>`);
      o.push(`<g ${F} font-size="5.6" font-weight="800"><rect x="${gx + 6}" y="${gy + gh - 9}" width="8" height="2.6" fill="#1f8a4c"/><text x="${gx + 17}" y="${gy + gh - 6.3}" fill="#27324f">ปั๊มทำงาน</text><rect x="${gx + 62}" y="${gy + gh - 9}" width="8" height="2.6" fill="#6e7a93"/><text x="${gx + 73}" y="${gy + gh - 6.3}" fill="#27324f">ปั๊มหยุด (ถังจ่ายน้ำ)</text></g>`);
    }
    // ป้ายเฉพาะคิว
    if (cue === "tank") o.push(note(200, 240, "น้ำเข้า → ลมถูกอัด → แรงดันขึ้น", 6.4, "#12508a", "#fff"));
    if (cue === "switch" && !run) o.push(note(116, 417, "ถึงค่าตัดออก → สวิตช์เปิด → ตัดไฟ", 5.6, "#a31f1f", "#fff"));
    if (cue === "tap") o.push(note(208, 106, "ลมที่ถูกอัดดันน้ำออก", 6.2, "#12508a", "#fff"));
    if (cue === "cutin") o.push(note(112, 417, run ? "สวิตช์ต่อไฟ → ปั๊มเริ่มเดิน" : "แรงดันตกถึงค่าตัดเข้า", 5.8, run ? "#1f8a4c" : "#a31f1f", "#fff"));
    if (cue === "fact") {
      o.push(lbl(208, 84, "วาล์วแบบเดียวกับยางรถ", 5.8, "#27324f"));
      o.push(`<g transform="translate(181 104)"><circle r="11" fill="#2b3350" stroke="#10182a" stroke-width="1"/><circle r="7.5" fill="#cdd6e6" stroke="#6e7a93" stroke-width=".8"/><circle r="2" fill="#6e7a93"/><rect x="-1.6" y="-12" width="3.2" height="5" rx="1" fill="#2f9e5e" stroke="#16603a" stroke-width=".6"/></g>`);
      o.push(lbl(181, 124, "ยางรถ", 5.4, "#27324f"));
    }
    if (cue === "tip" || st.tire > 0) {
      const a = cl(st.tire);
      const gx = 208, gy = 88, r = 14;
      o.push(`<g opacity="${f2(a)}" transform="translate(0 ${f2((1 - a) * -10)})"><rect x="205" y="${gy + r}" width="6" height="${117 - gy - r}" fill="#8e99b0" stroke="#4b5878" stroke-width=".7"/>`);
      o.push(dial(gx, gy, r, PRE, 60, [[0, "0"], [60, "60"]]));
      o.push(`<text x="${gx}" y="${gy + 9}" font-size="6.5" ${F} font-weight="900" text-anchor="middle" fill="#d6232a">28</text></g>`);
    }
    if (cue === "tip") {
      o.push(note(168, 62, "1 ปิดไฟปั๊ม  2 ระบายน้ำจากถังจนหมด", 5.8, "#27324f", "#ffe14a"));
      if (st.tire > 0.3) o.push(note(146, 94, "ลมในถัง ≈ ต่ำกว่าค่าตัดเข้า 2 psi", 5.2, "#2f9e5e", "#fff"));
    }
    void SC;
    o.push(box(SCENE_PUMP.focus[cue]?.box, ph));
    return o.join("");
  },
};
void mixc;
