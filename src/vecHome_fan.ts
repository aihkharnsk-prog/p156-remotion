// ฉากพัดลมไฟฟ้า (ตัดครึ่ง: มอเตอร์เหนี่ยวนำ + ตัวเก็บประจุ + ปุ่มปรับแรงลม + กลไกส่าย) — คืนสตริง SVG ภายในพิกัด 270x480
// แผงบน = มองด้านข้างของหัวพัดลม (ตัดครึ่ง) / แผงล่าง = เปลี่ยนตามคิว (สเตเตอร์มองหน้าตัด, วงจรปุ่ม, กลไกส่าย ฯลฯ)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, box, DEFS, warrow, varrow } = H;
const F = `font-family="Kanit, sans-serif"`;
const TAU = Math.PI * 2;
const lbl = (x: number, y: number, t: string, size = 7, c = "#27324f", anchor = "middle") =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" ${F} font-weight="700" text-anchor="${anchor}" fill="${c}" stroke="#fff" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">${t}</text>`;
const leader = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)}" stroke="#27324f" stroke-width=".8" fill="none"/><circle cx="${f2(x2)}" cy="${f2(y2)}" r="1.5" fill="#27324f"/>`;
const chip = (y: number, t: string, w = 200) =>
  `<g ${F} font-weight="900" text-anchor="middle"><rect x="${f2(135 - w / 2)}" y="${y}" width="${w}" height="22" rx="11" fill="#27324f" opacity=".92"/><text x="135" y="${y + 15.5}" font-size="11.5" fill="#ffe14a">${t}</text></g>`;

const EXTRA = `<defs>
<linearGradient id="fgl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9f6ee"/><stop offset="1" stop-color="#ece5d3"/></linearGradient>
<linearGradient id="cap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a5d9c"/><stop offset=".4" stop-color="#5b9be0"/><stop offset="1" stop-color="#244a7c"/></linearGradient>
<linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6cfa6"/><stop offset="1" stop-color="#e2a979"/></linearGradient>
</defs>`;

// ---------------------------------------------------------------- สถานะตามคิว
const OMEGA = 0.9; // รอบ/วินาที ของสนามหมุน (ภาพช้ากว่าจริงมาก)
const REST = 0.85; // โรเตอร์หมุนเป็นสัดส่วนของสนาม (ภาพวาดเกินจริงให้เห็นว่าช้ากว่าเล็กน้อย)
const DN = 7; // ความยาวคิวโดยประมาณ (วินาที) ใช้ทำภาพ "ค่อยๆ เริ่ม/หยุด"
const smooth = (p: number, a: number, b: number) => ease(cl((p - a) / (b - a)));
const levOf = (p: number) => smooth(p, 0.26, 0.36) + smooth(p, 0.58, 0.68); // 0..2
const LEVR = [0.55, 0.75, 0.95];
const rotAt = (cue: string, u: number): number => {
  switch (cue) {
    case "single": return REST * (1 - smooth(u, 0.05, 0.5));
    case "cap": return REST * smooth(u, 0.3, 0.85);
    case "taps": { const l = levOf(u); return l <= 1 ? lerp(LEVR[0], LEVR[1], l) : lerp(LEVR[1], LEVR[2], l - 1); }
    case "tip": return REST * (1 - smooth(u, 0.5, 0.78));
    default: return REST;
  }
};
const auxAt = (cue: string, u: number) => (cue === "single" ? 1 - smooth(u, 0, 0.12) : cue === "cap" ? smooth(u, 0, 0.3) : 1);
const RAMP = new Set(["single", "cap", "taps", "tip"]);
// จำนวนรอบของโรเตอร์/ใบพัด (แกนเดียวกัน)
const turns = (cue: string, p: number, ph: number) => {
  if (!RAMP.has(cue)) return OMEGA * REST * ph;
  let s = 0; const N = 40;
  for (let i = 0; i < N; i++) s += rotAt(cue, ((i + 0.5) / N) * cl(p));
  return OMEGA * DN * (s / N) * cl(p) + (cue === "single" ? 0 : 0);
};

// ---------------------------------------------------------------- เครื่องมือเล็ก ๆ
const coilBlock = (x0: number, y0: number, cols: number, rows: number, bright: string, glow: number) => {
  const o: string[] = [];
  const c = mixc("#9a5b2a", bright, cl(glow));
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
    o.push(`<circle cx="${f2(x0 + 3.6 + i * 7)}" cy="${f2(y0 + 3.6 + j * 7)}" r="3.1" fill="${c}" stroke="#4a2a10" stroke-width=".5"/><circle cx="${f2(x0 + 3 + i * 7)}" cy="${f2(y0 + 2.8 + j * 7)}" r=".9" fill="#fff" opacity="${f2(0.35 + 0.3 * glow)}"/>`);
  return o.join("");
};

// ---------------------------------------------------------------- แผงบน: หัวพัดลมมองด้านข้าง
const CY = 134, HX = 150;
const panelA = (cue: string, ph: number, Tr: number, rot: number, aux: number) => {
  const o: string[] = [];
  const im = Math.cos(TAU * OMEGA * ph);
  const ia = aux * Math.cos(TAU * OMEGA * ph + Math.PI / 2);
  o.push(`<rect x="8" y="38" width="254" height="198" rx="10" fill="url(#fgl)" stroke="#b9a88a" stroke-width="1.2"/>`);
  // คอพัดลม
  o.push(`<rect x="82" y="170" width="14" height="66" fill="url(#metal)" stroke="#6e7a93" stroke-width=".8"/><circle cx="89" cy="176" r="6" fill="#aab5ca" stroke="#6e7a93" stroke-width=".8"/>`);
  // เกียร์ส่ายด้านหลัง (แผนผัง)
  o.push(`<g filter="url(#sh2)"><rect x="14" y="116" width="30" height="36" rx="5" fill="#cfd6e4" stroke="#6e7a93" stroke-width="1"/></g>`);
  o.push(`<rect x="18" y="130" width="22" height="8" rx="2" fill="#8f9bb3" stroke="#4b5878" stroke-width=".6"/>`);
  for (let k = 0; k < 7; k++) { const xx = 19 + ((k * 3.4 + Tr * 24) % 20); o.push(`<line x1="${f2(xx)}" y1="130" x2="${f2(xx + 2.4)}" y2="138" stroke="#e8edf5" stroke-width="1.1"/>`); }
  o.push(`<circle cx="29" cy="145" r="5.5" fill="#e0c36a" stroke="#8a6d10" stroke-width=".7"/><circle cx="29" cy="145" r="1.6" fill="#8a6d10"/>`);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + ph * 0.3; o.push(`<rect x="${f2(29 + 6.2 * Math.cos(a) - 0.9)}" y="${f2(145 + 6.2 * Math.sin(a) - 0.9)}" width="1.8" height="1.8" fill="#b79a3c"/>`); }
  // ตัวเรือนมอเตอร์ (ตัดครึ่ง)
  o.push(`<g filter="url(#sh)"><rect x="44" y="92" width="90" height="84" rx="9" fill="#e9edf5" stroke="#6e7a93" stroke-width="1.2"/></g>`);
  o.push(`<rect x="48" y="96" width="82" height="76" rx="6" fill="#cfd6e4" stroke="#9aa9bf" stroke-width=".8"/>`);
  // แกน
  o.push(`<rect x="40" y="131" width="112" height="6" rx="2" fill="url(#metal)" stroke="#4b5878" stroke-width=".7"/>`);
  // แกนเหล็กสเตเตอร์ + ขดลวด (บน/ล่าง)
  o.push(`<rect x="60" y="98" width="58" height="26" rx="3" fill="#8f9bb3" stroke="#4b5878" stroke-width=".8"/><rect x="60" y="144" width="58" height="26" rx="3" fill="#8f9bb3" stroke="#4b5878" stroke-width=".8"/>`);
  const gm = Math.abs(im), ga = Math.abs(ia);
  o.push(coilBlock(63, 101, 3, 3, "#ff7a3a", gm) + coilBlock(63, 147, 3, 3, "#ff7a3a", gm));
  o.push(coilBlock(90, 101, 3, 3, "#3f9bff", ga) + coilBlock(90, 147, 3, 3, "#3f9bff", ga));
  // โรเตอร์
  o.push(`<rect x="64" y="125" width="50" height="18" rx="2" fill="#aab4c8" stroke="#4b5878" stroke-width=".8"/>`);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU - TAU * Tr;
    const yy = 134 + 7.4 * Math.sin(a), vis = Math.cos(a);
    if (vis > -0.2) o.push(`<rect x="66" y="${f2(yy - 0.8)}" width="46" height="1.6" fill="${vis > 0 ? "#e8edf5" : "#7d89a3"}" opacity="${f2(0.5 + 0.5 * Math.max(0, vis))}"/>`);
  }
  o.push(`<rect x="62" y="125" width="3.5" height="18" rx="1" fill="#6e7a93"/><rect x="112.5" y="125" width="3.5" height="18" rx="1" fill="#6e7a93"/>`);
  o.push(`<rect x="40" y="131" width="112" height="6" rx="2" fill="url(#metal)" opacity=".0"/>`);
  // ตัวเก็บประจุ
  const pul = 0.5 + 0.5 * ga;
  o.push(`<g filter="url(#sh2)"><rect x="74" y="60" width="26" height="30" rx="5" fill="url(#cap)" stroke="#16335c" stroke-width="1"/></g><rect x="78" y="64" width="6" height="22" rx="2" fill="#fff" opacity=".22"/>`);
  o.push(`<rect x="80" y="55" width="4" height="6" fill="#c3ccdb" stroke="#6e7a93" stroke-width=".5"/><rect x="90" y="55" width="4" height="6" fill="#c3ccdb" stroke="#6e7a93" stroke-width=".5"/>`);
  o.push(`<path d="M92 90 V94 H104 V100" stroke="#3f9bff" stroke-width="1.4" fill="none" opacity="${f2(0.4 + 0.6 * pul)}"/>`);
  o.push(`<text x="87" y="78" font-size="7" ${F} font-weight="900" text-anchor="middle" fill="#fff">+  −</text>`);
  // ใบพัด
  const R = 66, r0 = 8, w = 18, phi = 0.35;
  if (rot > 0.05) o.push(`<ellipse cx="${HX}" cy="${CY}" rx="5" ry="${R}" fill="#9bd2f5" opacity="${f2(0.28 * rot)}"/>`);
  const bl = [0, 1, 2].map((k) => { const th = -TAU * Tr + (k * TAU) / 3; return { th, z: Math.cos(th) }; }).sort((a, b) => a.z - b.z);
  for (const b of bl) {
    const s = Math.sin(b.th), c = Math.cos(b.th);
    const dx = (w / 2) * Math.sin(phi), dy = (w / 2) * Math.cos(phi) * c, dxT = dx * 0.8, dyT = dy * 0.8;
    const y0 = CY + r0 * s, yR = CY + R * s;
    o.push(`<path d="M${f2(HX - dx)} ${f2(y0 - dy)} L${f2(HX + dx)} ${f2(y0 + dy)} L${f2(HX + dxT)} ${f2(yR + dyT)} L${f2(HX - dxT)} ${f2(yR - dyT)} Z" fill="${b.z > 0 ? "#8fcdf3" : "#5f93bf"}" stroke="#2b4d73" stroke-width=".9" stroke-linejoin="round" opacity=".96"/>`);
  }
  o.push(`<circle cx="${HX}" cy="${CY}" r="7.5" fill="#cfd6e4" stroke="#4b5878" stroke-width="1"/><circle cx="${HX}" cy="${CY}" r="2.6" fill="#6e7a93"/>`);
  // ตะแกรงหน้า (มองด้านข้าง)
  const gx = (r: number) => HX + 38 * Math.sqrt(Math.max(0, 1 - (r / 72) ** 2));
  let g = "";
  for (const r of [72, 58, 44, 29, 14]) g += `<line x1="${f2(gx(r))}" y1="${f2(CY - r)}" x2="${f2(gx(r))}" y2="${f2(CY + r)}" stroke="#4a5470" stroke-width=".8" opacity=".55"/>`;
  for (const be of [0, 0.45, 0.95, 1.5]) {
    for (const sg of [1, -1]) {
      let d = "";
      for (let i = 0; i <= 16; i++) { const s2 = i / 16; d += `${i ? "L" : "M"}${f2(HX + 38 * Math.sqrt(1 - s2 * s2))} ${f2(CY + sg * 72 * s2 * Math.cos(be))} `; }
      g += `<path d="${d}" fill="none" stroke="#4a5470" stroke-width=".7" opacity=".5"/>`;
      if (be === 0) break;
    }
  }
  o.push(g);
  o.push(`<line x1="${HX}" y1="${CY - 72}" x2="${HX}" y2="${CY + 72}" stroke="#4a5470" stroke-width="1.6" opacity=".7"/>`);
  // ลม
  if (rot > 0.05) for (let k = 0; k < 5; k++) {
    const yy = [84, 110, 134, 158, 184][k];
    const u = ((ph * 0.55 * rot + k * 0.23) % 1);
    const xx = 192 + u * 44;
    o.push(warrow(xx, yy, "#59b6ea", f2(rot * Math.min(1, u * 6, (1 - u) * 5)) as unknown as number, 1));
  }
  // ป้ายชื่อ
  if (cue === "motor") {
    o.push(lbl(102, 196, "ขดลวดสเตเตอร์ (อยู่กับที่)", 6.8, "#27324f", "start"));
    o.push(leader(104, 193, 100, 166));
    o.push(lbl(102, 216, "โรเตอร์ (หมุนได้)", 6.8, "#27324f", "start"));
    o.push(leader(104, 213, 104, 141));
    o.push(lbl(104, 74, "ตัวเก็บประจุ", 7, "#16335c", "start"));
  }
  if (cue === "blade") {
    o.push(lbl(150, 52, "ใบพัดเอียงเป็นมุม", 7.5));
    o.push(lbl(205, 214, "ลมไปข้างหน้า", 7.5, "#1d6fa5"));
  }
  if (cue === "cap") o.push(lbl(104, 74, "ตัวเก็บประจุ", 7, "#16335c", "start"));
  return o.join("");
};

// ---------------------------------------------------------------- แผงล่าง 1: มอเตอร์มองหน้าตัด (สนามหมุน)
const CX = 135, CYB = 110;
const pt = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
const vecArrow = (x1: number, y1: number, x2: number, y2: number, w: number, c: string, outline = "#27324f") => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 1.2) return "";
  const ux = dx / L, uy = dy / L, hl = Math.min(9, L * 0.5), hw = hl * 0.62;
  const bx = x2 - ux * hl, by = y2 - uy * hl;
  return `<path d="M${f2(x1)} ${f2(y1)} L${f2(bx)} ${f2(by)}" stroke="${outline}" stroke-width="${w + 1.8}" stroke-linecap="round" fill="none"/><path d="M${f2(x2)} ${f2(y2)} L${f2(bx - uy * hw)} ${f2(by + ux * hw)} L${f2(bx + uy * hw)} ${f2(by - ux * hw)} Z" fill="${c}" stroke="${outline}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${f2(x1)} ${f2(y1)} L${f2(bx)} ${f2(by)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
};
const sine = (x0: number, y0: number, W: number, A: number, shift: number, c: string, amp = 1) => {
  let d = "";
  for (let i = 0; i <= 40; i++) { const s = (i / 40) * TAU; d += `${i ? "L" : "M"}${f2(x0 + (i / 40) * W)} ${f2(y0 - A * amp * Math.cos(s + shift))} `; }
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
};
const graph = (x0: number, W: number, title: string, shift: number, c: string, amp: number, ph: number, cue: string) => {
  const y0 = 208, A = 15;
  const u = (ph * OMEGA) % 1;
  const s = u * TAU;
  const o: string[] = [];
  o.push(`<rect x="${x0}" y="178" width="${W}" height="54" rx="5" fill="#fff" stroke="#c9bfa8" stroke-width=".8"/>`);
  o.push(`<line x1="${x0 + 4}" y1="${y0}" x2="${x0 + W - 4}" y2="${y0}" stroke="#b9b2a0" stroke-width=".7"/>`);
  o.push(`<text x="${x0 + 5}" y="188" font-size="6.8" ${F} font-weight="800" fill="${c}">${title}</text>`);
  o.push(sine(x0 + 8, y0, W - 16, A, shift, c, amp));
  const cx = x0 + 8 + u * (W - 16), cyv = y0 - A * amp * Math.cos(s + shift);
  o.push(`<line x1="${f2(cx)}" y1="192" x2="${f2(cx)}" y2="226" stroke="#27324f" stroke-width=".6" stroke-dasharray="2 2"/><circle cx="${f2(cx)}" cy="${f2(cyv)}" r="3" fill="${c}" stroke="#fff" stroke-width="1"/>`);
  void cue;
  return o.join("");
};

const panelStator = (cue: string, ph: number, Tr: number, rot: number, aux: number) => {
  const o: string[] = [];
  const t = ph * OMEGA;
  const im = Math.cos(TAU * t), ia = aux * Math.cos(TAU * t + Math.PI / 2);
  const af = Math.atan2(ia, im); // มุมสนามรวม (คณิตศาสตร์ ทวนเข็มเป็นบวก)
  const mag = Math.hypot(im, ia);
  o.push(`<rect x="8" y="38" width="254" height="198" rx="10" fill="url(#fgl)" stroke="#b9a88a" stroke-width="1.2"/>`);
  // วงแหวนเหล็ก
  o.push(`<g filter="url(#sh)"><circle cx="${CX}" cy="${CYB}" r="63" fill="#aeb9cc" stroke="#6e7a93" stroke-width="1.4"/></g><circle cx="${CX}" cy="${CYB}" r="58" fill="#d3dae7" stroke="#8f9bb3" stroke-width=".8"/>`);
  // ขดลวด 4 ชุด: หลัก (บน/ล่าง) ช่วย (ซ้าย/ขวา)
  const coil = (deg: number, bright: string, glow: number) => {
    const c = mixc("#9a5b2a", bright, cl(glow));
    let s = `<g transform="translate(${CX} ${CYB}) rotate(${deg})">`;
    s += `<rect x="33" y="-12" width="23" height="24" rx="4" fill="${c}" stroke="#4a2a10" stroke-width="1"/>`;
    for (let k = 0; k < 4; k++) s += `<line x1="${36 + k * 5.2}" y1="-10" x2="${36 + k * 5.2}" y2="10" stroke="#4a2a10" stroke-width=".6" opacity=".55"/>`;
    s += `<path d="M30 -14 Q32 -14 32 -12 V12 Q32 14 30 14 L24 14 Q22 0 24 -14 Z" fill="#8f9bb3" stroke="#4b5878" stroke-width=".8"/>`;
    return s + `</g>`;
  };
  const gm = Math.abs(im), ga = Math.abs(ia);
  o.push(coil(-90, "#ff7a3a", gm) + coil(90, "#ff7a3a", gm) + coil(0, "#3f9bff", ga) + coil(180, "#3f9bff", ga));
  // โรเตอร์
  const th = TAU * Tr;
  o.push(`<circle cx="${CX}" cy="${CYB}" r="29" fill="#e3e8f1" stroke="#4b5878" stroke-width="1.3"/>`);
  const ind = cue === "rotor" || cue === "all" || cue === "end" || cue === "cap" || cue === "blade" || cue === "motor" ? (rot > 0.02 ? Math.min(1, 0.45 + (1 - rot) * 2.5) : 0) : 0;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU + th;
    const [bx, by] = pt(CX, CYB, 22.5, a);
    const v = ind * Math.cos(a - af) * mag;
    const rr = 2.6 + 1.6 * Math.abs(v);
    if (Math.abs(v) < 0.12) { o.push(`<circle cx="${f2(bx)}" cy="${f2(by)}" r="2.6" fill="#b3bdd0" stroke="#4b5878" stroke-width=".7"/>`); continue; }
    const col = v > 0 ? "#ff9a1a" : "#4a7fe0";
    o.push(`<circle cx="${f2(bx)}" cy="${f2(by)}" r="${f2(rr + 1.8)}" fill="${col}" opacity=".3"/><circle cx="${f2(bx)}" cy="${f2(by)}" r="${f2(rr)}" fill="${col}" stroke="#27324f" stroke-width=".7"/>`);
    if (v > 0) o.push(`<circle cx="${f2(bx)}" cy="${f2(by)}" r="1" fill="#fff"/>`);
    else o.push(`<path d="M${f2(bx - 1.5)} ${f2(by - 1.5)} l3 3 m0 -3 l-3 3" stroke="#fff" stroke-width=".9"/>`);
  }
  // เครื่องหมายหมุน + แกน
  const [tx, ty] = pt(CX, CYB, 15, th + 0.0);
  o.push(`<line x1="${CX}" y1="${CYB}" x2="${f2(tx)}" y2="${f2(ty)}" stroke="#27324f" stroke-width="2.4" stroke-linecap="round"/><line x1="${CX}" y1="${CYB}" x2="${f2(tx)}" y2="${f2(ty)}" stroke="#fff" stroke-width=".9" stroke-linecap="round"/>`);
  o.push(`<circle cx="${CX}" cy="${CYB}" r="5.5" fill="#6e7a93" stroke="#27324f" stroke-width="1"/>`);
  // เวกเตอร์สนาม
  const L = 27;
  const [mx, my] = [CX, CYB - im * L];
  const [ax, ay] = [CX + ia * L, CYB];
  if (Math.abs(im) > 0.04) o.push(vecArrow(CX, CYB, mx, my, 1.8, "#ff7a3a", "#7a2f08"));
  if (Math.abs(ia) > 0.04) o.push(vecArrow(CX, CYB, ax, ay, 1.8, "#3f9bff", "#123a78"));
  const [rx, ry] = [CX + ia * L, CYB - im * L];
  if (aux > 0.05 && mag > 0.3) o.push(`<path d="M${f2(mx)} ${f2(my)} L${f2(rx)} ${f2(ry)} L${f2(ax)} ${f2(ay)}" stroke="#27324f" stroke-width=".8" stroke-dasharray="2 2" fill="none"/>`);
  o.push(vecArrow(CX, CYB, rx, ry, 3.2, "#ffd23a", "#27324f"));
  // ตัวเก็บประจุในวงจรขดช่วย
  if (cue !== "single") o.push(`<path d="M196 ${CYB} H212" stroke="#27324f" stroke-width="1.6" fill="none"/><line x1="212" y1="${CYB - 9}" x2="212" y2="${CYB + 9}" stroke="#27324f" stroke-width="2.4"/><line x1="218" y1="${CYB - 9}" x2="218" y2="${CYB + 9}" stroke="#27324f" stroke-width="2.4"/><path d="M218 ${CYB} H230 V${CYB + 34}" stroke="#27324f" stroke-width="1.6" fill="none"/>`);
  o.push(`<path d="M67 ${CYB} H48 V${CYB + 34}" stroke="#27324f" stroke-width="1.6" fill="none" opacity=".0"/>`);
  o.push(`<text x="40" y="170" font-size="6" ${F} font-weight="700" text-anchor="middle" fill="#8a8272">ภาพช้ากว่าจริงมาก</text>`);
  // กราฟกระแส
  o.push(graph(14, 118, "กระแสขดหลัก", 0, "#e8590c", 1, ph, cue));
  o.push(graph(138, 118, "กระแสขดช่วย (นำหน้า ≈90°)", Math.PI / 2, "#1c7ae0", aux, ph, cue));
  // ป้ายชื่อ
  const L3 = (x: number, y: number, a: string, b: string, c3: string, col: string) => lbl(x, y, a, 7, col) + (b ? lbl(x, y + 9, b, 7, col) : "") + (c3 ? lbl(x, y + 18, c3, 7, col) : "");
  if (cue === "single" || cue === "cap" || cue === "motor") {
    o.push(lbl(40, 56, "ขดหลัก", 7.5, "#a8480a"));
    o.push(leader(58, 58, 118, 70));
  }
  if (cue === "cap") {
    o.push(lbl(222, 88, "ตัวเก็บประจุ", 7, "#16335c"));
    o.push(lbl(222, 148, "ขดช่วย", 7.5, "#123a78")); o.push(leader(208, 142, 188, 118));
    o.push(L3(40, 140, "สองสนามรวมกัน", "= สนามหมุน", "", "#7a5a00"));
  }
  if (cue === "single") o.push(L3(231, 62, "สนามแกว่ง", "ไปมา", "แนวเดียว", "#a8480a"));
  if (cue === "rotor") {
    o.push(L3(42, 130, "โรเตอร์ตาม", "ช้ากว่าสนาม", "เล็กน้อย", "#e8590c"));
    o.push(lbl(231, 62, "กระแสเหนี่ยวนำ", 7, "#5a3a00"));
    o.push(`<circle cx="212" cy="75" r="3.4" fill="#ff9a1a" stroke="#27324f" stroke-width=".7"/><circle cx="212" cy="75" r="1" fill="#fff"/>` + lbl(218, 77.5, "ไหลออก", 6.5, "#27324f", "start"));
    o.push(`<circle cx="212" cy="88" r="3.4" fill="#4a7fe0" stroke="#27324f" stroke-width=".7"/><path d="M210.5 86.5 l3 3 m0 -3 l-3 3" stroke="#fff" stroke-width=".9"/>` + lbl(218, 90.5, "ไหลเข้า", 6.5, "#27324f", "start"));
  }
  return o.join("");
};

// ---------------------------------------------------------------- แผงล่าง 2: ปุ่มปรับแรงลม
const panelTaps = (ph: number, Tr: number, rot: number, p: number) => {
  const o: string[] = [];
  const lev = levOf(p);
  const li = lev < 0.5 ? 0 : lev < 1.5 ? 1 : 2;
  o.push(`<rect x="8" y="38" width="254" height="198" rx="10" fill="url(#fgl)" stroke="#b9a88a" stroke-width="1.2"/>`);
  const SY = [78, 120, 162];
  const P0: [number, number] = [66, 120];
  // ไฟบ้าน
  o.push(`<circle cx="28" cy="120" r="13" fill="#fff" stroke="#27324f" stroke-width="1.4"/><path d="M21 120 q3.5-7 7 0 t7 0" stroke="#d6232a" stroke-width="1.6" fill="none"/>`);
  o.push(lbl(28, 146, "ไฟบ้าน", 7));
  // เส้นต่อ
  const path: [number, number][] = [[41, 120], P0];
  o.push(`<path d="M41 120 H66" stroke="#6e7a93" stroke-width="2" fill="none"/>`);
  // ขั้วสวิตช์
  for (let k = 0; k < 3; k++) {
    o.push(`<path d="M118 ${SY[k]} H150" stroke="#6e7a93" stroke-width="2" fill="none"/>`);
    o.push(`<circle cx="118" cy="${SY[k]}" r="4" fill="${k === li ? "#ffd23a" : "#fff"}" stroke="#27324f" stroke-width="1.2"/>`);
    o.push(`<text x="110" y="${SY[k] - 7}" font-size="8" ${F} font-weight="900" text-anchor="middle" fill="#27324f">${k + 1}</text>`);
  }
  // คันสวิตช์
  const ty = lerp(lerp(SY[0], SY[1], cl(lev)), SY[2], cl(lev - 1));
  const ang = Math.atan2(ty - P0[1], 118 - P0[0]);
  o.push(`<g transform="translate(${P0[0]} ${P0[1]}) rotate(${f2((ang * 180) / Math.PI)})"><rect x="0" y="-3" width="${f2(Math.hypot(118 - P0[0], ty - P0[1]))}" height="6" rx="3" fill="#d6232a" stroke="#6a1015" stroke-width="1"/></g><circle cx="${P0[0]}" cy="${P0[1]}" r="5" fill="#cfd6e4" stroke="#27324f" stroke-width="1.2"/>`);
  o.push(lbl(68, 104, "สวิตช์ปรับแรงลม", 7));
  // ขดลวดมีหลายจุดต่อ
  const flux = 0.25 + 0.75 * ((rot - 0.5) / 0.45);
  const cc = mixc("#9a5b2a", "#ff9a4a", cl(flux));
  o.push(`<rect x="150" y="64" width="34" height="112" rx="7" fill="${cc}" stroke="#4a2a10" stroke-width="1.2"/>`);
  for (let k = 0; k < 9; k++) o.push(`<path d="M153 ${72 + k * 11} q14 -5 28 0" stroke="#4a2a10" stroke-width="1.2" fill="none" opacity=".65"/>`);
  for (let k = 0; k < 3; k++) o.push(`<circle cx="150" cy="${SY[k]}" r="3.4" fill="${k === li ? "#ffd23a" : "#fff"}" stroke="#27324f" stroke-width="1.1"/>`);
  o.push(lbl(167, 190, "ขดลวดมอเตอร์", 7)); o.push(lbl(167, 200, "(มีหลายจุดต่อ)", 6.5));
  // เส้นกลับ
  o.push(`<path d="M184 170 H196 V204 H28 V133" stroke="#6e7a93" stroke-width="2" fill="none"/>`);
  // อิเล็กตรอนวิ่ง
  const act: [number, number][] = [P0, [118, SY[li]], [150, SY[li]], [167, SY[li]], [167, 170], [196, 170], [196, 204], [28, 204], [28, 133], [28, 120], P0];
  let tot = 0; const seg: number[] = [];
  for (let i = 1; i < act.length; i++) { const l = Math.hypot(act[i][0] - act[i - 1][0], act[i][1] - act[i - 1][1]); seg.push(l); tot += l; }
  for (let k = 0; k < 12; k++) {
    let d = ((ph * 34 + (k * tot) / 12) % tot);
    let i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const f = d / seg[i];
    const x = lerp(act[i][0], act[i + 1][0], f), y = lerp(act[i][1], act[i + 1][1], f);
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.9" fill="#ffd84a" stroke="#8a6d10" stroke-width=".5"/>`);
  }
  void path;
  // โรเตอร์ย่อ + ลูกศรแรงลม
  const th = TAU * Tr;
  o.push(`<circle cx="228" cy="108" r="22" fill="#e3e8f1" stroke="#4b5878" stroke-width="1.3"/>`);
  for (let k = 0; k < 8; k++) { const [bx, by] = pt(228, 108, 15.5, (k / 8) * TAU + th); o.push(`<circle cx="${f2(bx)}" cy="${f2(by)}" r="2" fill="#b3bdd0" stroke="#4b5878" stroke-width=".6"/>`); }
  const [tx, ty2] = pt(228, 108, 18, th);
  o.push(`<line x1="228" y1="108" x2="${f2(tx)}" y2="${f2(ty2)}" stroke="#27324f" stroke-width="2.2" stroke-linecap="round"/><circle cx="228" cy="108" r="3.4" fill="#6e7a93"/>`);
  o.push(`<path d="M186 112 H204" stroke="#ff9a4a" stroke-width="${f2(1 + 3 * flux)}" opacity="${f2(0.35 + 0.6 * flux)}" stroke-linecap="round"/>`);
  o.push(lbl(228, 142, "โรเตอร์", 7));
  const names = ["ช้า", "กลาง", "เร็ว"];
  const cols = ["#7bd6a0", "#ffd23a", "#ff8a5a"];
  o.push(`<rect x="204" y="152" width="48" height="22" rx="11" fill="${cols[li]}" stroke="#27324f" stroke-width="1.3"/><text x="228" y="167" font-size="11" ${F} font-weight="900" text-anchor="middle" fill="#27324f">${names[li]}</text>`);
  o.push(lbl(228, 188, "สนามแรงต่างกัน", 6.5)); o.push(lbl(228, 197, "โรเตอร์จึงหมุน", 6.5)); o.push(lbl(228, 206, "ช้าเร็วต่างกัน", 6.5));
  return o.join("");
};

// ---------------------------------------------------------------- แผงล่าง 3: กลไกส่ายหน้า (มองจากด้านบน)
const PV: [number, number] = [135, 164];
const C0: [number, number] = [157, 204]; // ศูนย์กลางล้อเฟือง (ในกรอบของหัวพัดลม)
const CRK = 11; // รัศมีแขนหมุน
const QP: [number, number] = [214, 208]; // จุดยึดก้านต่อ (อยู่กับที่)
const ROD = 58;
const rotp = (q: [number, number], a: number): [number, number] => { const dx = q[0] - PV[0], dy = q[1] - PV[1]; return [PV[0] + dx * Math.cos(a) - dy * Math.sin(a), PV[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
const solvePsi = (phi: number) => {
  const c: [number, number] = [C0[0] + CRK * Math.cos(phi), C0[1] + CRK * Math.sin(phi)];
  let best = 0, bd = 1e9;
  const f = (a: number) => { const w = rotp(c, a); return Math.hypot(w[0] - QP[0], w[1] - QP[1]) - ROD; };
  let prev = f(-1.2);
  for (let a = -1.2; a <= 1.2; a += 0.004) {
    const v = f(a);
    if ((prev <= 0 && v > 0) || (prev >= 0 && v < 0)) { let lo = a - 0.004, hi = a; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if ((f(lo) <= 0) === (f(m) <= 0)) lo = m; else hi = m; } const r = (lo + hi) / 2; if (Math.abs(r) < bd) { bd = Math.abs(r); best = r; } }
    prev = v;
  }
  return bd < 1e8 ? best : 0;
};
const PSI: number[] = Array.from({ length: 120 }, (_, i) => solvePsi((i / 120) * TAU));
const PMIN = Math.min(...PSI), PMAX = Math.max(...PSI);
const psiAt = (phi: number) => { const u = (((phi / TAU) % 1) + 1) % 1 * 120; const i = Math.floor(u), f = u - i; return lerp(PSI[i % 120], PSI[(i + 1) % 120], f); };

const panelOsc = (ph: number, Tr: number, rot: number, cue: string) => {
  const o: string[] = [];
  const phi = (TAU * ph) / 4.2;
  const psi = psiAt(phi);
  o.push(`<rect x="8" y="38" width="254" height="198" rx="10" fill="url(#fgl)" stroke="#b9a88a" stroke-width="1.2"/>`);
  // บริเวณที่ลมกวาดถึง
  const R2 = 112;
  const a1 = [PV[0] + R2 * Math.sin(PMIN), PV[1] - R2 * Math.cos(PMIN)], a2 = [PV[0] + R2 * Math.sin(PMAX), PV[1] - R2 * Math.cos(PMAX)];
  o.push(`<path d="M${PV[0]} ${PV[1]} L${f2(a1[0])} ${f2(a1[1])} A${R2} ${R2} 0 0 1 ${f2(a2[0])} ${f2(a2[1])} Z" fill="#59b6ea" opacity=".16" stroke="#59b6ea" stroke-width=".8" stroke-dasharray="3 3"/>`);
  // ส่วนที่อยู่กับที่: คอพัดลม + จุดยึดก้านต่อ
  o.push(`<circle cx="${PV[0]}" cy="${PV[1]}" r="10" fill="#aab5ca" stroke="#6e7a93" stroke-width="1.2"/>`);
  o.push(`<rect x="${QP[0] - 6}" y="${QP[1] - 6}" width="12" height="12" rx="2" fill="#8f9bb3" stroke="#27324f" stroke-width="1"/><circle cx="${QP[0]}" cy="${QP[1]}" r="2.6" fill="#27324f"/>`);
  // ส่วนที่หมุนตามหัวพัดลม
  const deg = (psi * 180) / Math.PI;
  o.push(`<g transform="rotate(${f2(deg)} ${PV[0]} ${PV[1]})">`);
  // ลม
  if (rot > 0.05) for (let k = 0; k < 5; k++) {
    const xx = 135 + (k - 2) * 24;
    const u = (ph * 0.5 + k * 0.21) % 1;
    o.push(varrow(xx, 86 - 2 - u * 8, "#59b6ea", f2(Math.min(1, u * 5, (1 - u) * 4)) as unknown as number, -1));
  }
  // ตะแกรง + ใบพัด (เห็นด้านข้าง)
  o.push(`<path d="M76 98 A59 34 0 0 1 194 98" fill="none" stroke="#4a5470" stroke-width="1" opacity=".6"/><path d="M92 98 A43 24 0 0 1 178 98" fill="none" stroke="#4a5470" stroke-width=".8" opacity=".5"/>`);
  o.push(`<rect x="78" y="95" width="114" height="6" rx="3" fill="#8fcdf3" stroke="#2b4d73" stroke-width=".9" opacity="${f2(0.45 + 0.5 * (1 - rot))}"/>`);
  o.push(`<circle cx="135" cy="98" r="6" fill="#cfd6e4" stroke="#4b5878" stroke-width="1"/>`);
  // แกน + ตัวเรือนมอเตอร์
  o.push(`<rect x="133" y="102" width="4" height="96" fill="url(#metal)" stroke="#4b5878" stroke-width=".6"/>`);
  o.push(`<rect x="108" y="116" width="54" height="66" rx="8" fill="#e9edf5" stroke="#6e7a93" stroke-width="1.2" opacity=".96"/>`);
  o.push(`<rect x="113" y="121" width="9" height="56" rx="2" fill="#a8662f" stroke="#4a2a10" stroke-width=".7"/><rect x="148" y="121" width="9" height="56" rx="2" fill="#a8662f" stroke="#4a2a10" stroke-width=".7"/>`);
  o.push(`<rect x="124" y="126" width="22" height="44" rx="2" fill="#aab4c8" stroke="#4b5878" stroke-width=".8"/><rect x="133" y="100" width="4" height="100" fill="url(#metal)" stroke="#4b5878" stroke-width=".6"/>`);
  // เฟืองตัวหนอนที่ปลายแกนด้านหลัง
  o.push(`<rect x="130" y="186" width="10" height="24" rx="3" fill="#e0c36a" stroke="#8a6d10" stroke-width=".8"/>`);
  for (let k = 0; k < 6; k++) { const yy = 188 + ((k * 4 + Tr * 40) % 22); o.push(`<line x1="130" y1="${f2(yy)}" x2="140" y2="${f2(yy + 2.5)}" stroke="#8a6d10" stroke-width="1"/>`); }
  // ล้อเฟือง + แขนหมุน
  o.push(`<g transform="translate(${C0[0]} ${C0[1]}) rotate(${f2((phi * 180) / Math.PI)})"><circle r="14" fill="#e0c36a" stroke="#8a6d10" stroke-width="1.2"/>${Array.from({ length: 14 }, (_, k) => `<rect x="-1.4" y="-17" width="2.8" height="4" fill="#b79a3c" transform="rotate(${k * (360 / 14)})"/>`).join("")}<circle r="3" fill="#8a6d10"/><line x1="0" y1="0" x2="${CRK}" y2="0" stroke="#8a6d10" stroke-width="1.4"/></g>`);
  const pin: [number, number] = [C0[0] + CRK * Math.cos(phi), C0[1] + CRK * Math.sin(phi)];
  o.push(`<circle cx="${f2(pin[0])}" cy="${f2(pin[1])}" r="3" fill="#d6232a" stroke="#27324f" stroke-width=".9"/>`);
  o.push(`</g>`);
  // ก้านต่อ (จากเข็มบนล้อเฟืองไปจุดยึดที่อยู่กับที่)
  const wp = rotp(pin, psi);
  o.push(`<path d="M${f2(wp[0])} ${f2(wp[1])} L${QP[0]} ${QP[1]}" stroke="#27324f" stroke-width="4.2" stroke-linecap="round"/><path d="M${f2(wp[0])} ${f2(wp[1])} L${QP[0]} ${QP[1]}" stroke="#ff8a5a" stroke-width="2.4" stroke-linecap="round"/><circle cx="${f2(wp[0])}" cy="${f2(wp[1])}" r="3" fill="#d6232a" stroke="#27324f" stroke-width=".9"/>`);
  // ป้าย
  o.push(lbl(135, 52, "บริเวณที่ลมกวาดถึง", 7, "#1d6fa5"));
  if (cue === "osc") {
    const wl = rotp([C0[0] - 14, C0[1] + 10], psi);
    o.push(lbl(14, 196, "เฟืองตัวหนอน", 7, "#27324f", "start")); o.push(leader(66, 194, 129, 198));
    o.push(lbl(14, 222, "ล้อเฟือง (ทดรอบ", 6.5, "#27324f", "start")); o.push(lbl(14, 230, "ให้ช้าลงมาก)", 6.5, "#27324f", "start")); o.push(leader(68, 224, wl[0], wl[1]));
    o.push(lbl(214, 168, "ก้านต่อ", 7, "#a8480a")); o.push(leader(214, 172, f2((wp[0] + QP[0]) / 2 + 4), f2((wp[1] + QP[1]) / 2) - 2));
    o.push(lbl(218, 232, "จุดยึด (อยู่กับที่)", 6.5)); o.push(leader(222, 226, QP[0] + 2, QP[1] + 5));
  }
  return o.join("");
};

// ---------------------------------------------------------------- แผงล่าง 4: ทำไมรู้สึกเย็น
const panelFact = (ph: number, p: number) => {
  const o: string[] = [];
  const e = ease(cl(p * 1.1));
  o.push(`<rect x="8" y="38" width="254" height="198" rx="10" fill="url(#fgl)" stroke="#b9a88a" stroke-width="1.2"/>`);
  o.push(`<line x1="135" y1="46" x2="135" y2="228" stroke="#b9b2a0" stroke-width="1" stroke-dasharray="4 3"/>`);
  o.push(`<text x="72" y="56" font-size="9.5" ${F} font-weight="900" text-anchor="middle" fill="#27324f">ไม่มีลม</text><text x="198" y="56" font-size="9.5" ${F} font-weight="900" text-anchor="middle" fill="#1d6fa5">มีลมพัดผ่าน</text>`);
  // เทอร์โมมิเตอร์อากาศ (ระดับเท่าเดิม)
  o.push(`<g><rect x="128" y="62" width="14" height="44" rx="7" fill="#fff" stroke="#27324f" stroke-width="1.2"/><circle cx="135" cy="112" r="8" fill="#fff" stroke="#27324f" stroke-width="1.2"/><rect x="132.5" y="80" width="5" height="32" rx="2.5" fill="#d6232a"/><circle cx="135" cy="112" r="5.5" fill="#d6232a"/></g>`);
  o.push(lbl(135, 128, "อุณหภูมิอากาศ", 6.5)); o.push(lbl(135, 137, "ไม่ได้ลดลง", 6.5, "#d6232a"));
  // ผิว
  const skinR = mixc("#e2a979", "#cfcde8", 0.55 * e);
  o.push(`<rect x="14" y="184" width="116" height="46" rx="8" fill="#ecc09a" stroke="#a87a50" stroke-width="1.2"/>`);
  o.push(`<rect x="140" y="184" width="116" height="46" rx="8" fill="${skinR}" stroke="#a87a50" stroke-width="1.2"/>`);
  o.push(lbl(72, 224, "ผิวหนัง", 7)); o.push(lbl(198, 224, "ผิวหนัง (เย็นลง)", 7));
  // หยดเหงื่อ
  for (let k = 0; k < 4; k++) {
    const rL = 6.2 * (1 - 0.15 * e), rR = 6.2 * (1 - 0.8 * e);
    const xL = 32 + k * 28, xR = 158 + k * 28;
    o.push(`<ellipse cx="${xL}" cy="${f2(184 - rL * 0.5)}" rx="${f2(rL)}" ry="${f2(rL * 0.85)}" fill="#8fd8ff" stroke="#2f8fe0" stroke-width=".9"/><ellipse cx="${f2(xL - rL * 0.3)}" cy="${f2(184 - rL * 0.8)}" rx="${f2(rL * 0.25)}" ry="${f2(rL * 0.18)}" fill="#fff" opacity=".8"/>`);
    if (rR > 0.5) o.push(`<ellipse cx="${xR}" cy="${f2(184 - rR * 0.5)}" rx="${f2(rR)}" ry="${f2(rR * 0.85)}" fill="#8fd8ff" stroke="#2f8fe0" stroke-width=".9"/>`);
    // ไอน้ำ: ซ้ายลอยขึ้นช้าๆ ค้างอยู่ / ขวาถูกลมพัดพาไป
    for (let j = 0; j < 2; j++) {
      const uL = (ph * 0.25 + k * 0.31 + j * 0.5) % 1;
      o.push(`<circle cx="${f2(xL + Math.sin(ph * 2 + k) * 3)}" cy="${f2(176 - uL * 26)}" r="1.6" fill="#8fb4cc" opacity="${f2(0.5 * (1 - uL) * (0.3 + 0.7 * (1 - e * 0.3)))}"/>`);
      const uR = (ph * 0.9 + k * 0.27 + j * 0.5) % 1;
      o.push(`<circle cx="${f2(xR + uR * 34)}" cy="${f2(176 - uR * 20)}" r="${f2(1.6 + uR * 0.8)}" fill="#8fb4cc" opacity="${f2(0.8 * (1 - uR) * e)}"/>`);
    }
  }
  // ลมฝั่งขวา
  for (let k = 0; k < 3; k++) {
    const yy = 152 + k * 8 - 8;
    const u = (ph * 0.6 + k * 0.33) % 1;
    o.push(warrow(146 + u * 70, yy + 4, "#59b6ea", f2(Math.min(1, u * 6, (1 - u) * 5)) as unknown as number, 1));
  }
  // ความร้อนถูกพาไปกับไอน้ำ
  o.push(lbl(198, 100, "เหงื่อระเหยเร็วขึ้น", 7, "#1d6fa5")); o.push(lbl(198, 109, "พาความร้อนออกจากผิว", 7, "#1d6fa5"));
  o.push(lbl(72, 100, "ระเหยช้ากว่า", 7)); o.push(lbl(72, 109, "(ไม่มีลมพัดพา)", 7));
  return o.join("");
};

// ---------------------------------------------------------------- แผงล่าง 5: ไม่มีคน ปิดได้เลย
const panelTip = (ph: number, p: number, Tr: number, rot: number) => {
  const o: string[] = [];
  const off = smooth(p, 0.5, 0.62);
  o.push(`<rect x="8" y="38" width="254" height="198" rx="10" fill="url(#fgl)" stroke="#b9a88a" stroke-width="1.2"/>`);
  o.push(`<rect x="8" y="196" width="254" height="40" rx="0" fill="#c9a572" opacity=".55"/><line x1="8" y1="196" x2="262" y2="196" stroke="#8a6a3a" stroke-width="1.2"/>`);
  // พัดลมตั้งพื้น (มองจากหน้า)
  const fx = 64, fy = 114;
  o.push(`<rect x="${fx - 3}" y="${fy + 28}" width="6" height="64" fill="url(#metal)" stroke="#4b5878" stroke-width=".7"/><rect x="${fx - 22}" y="190" width="44" height="7" rx="3" fill="#8f9bb3" stroke="#4b5878" stroke-width=".8"/>`);
  o.push(`<circle cx="${fx}" cy="${fy}" r="30" fill="#f5f8fc" stroke="#6e7a93" stroke-width="1.4"/>`);
  const th = TAU * Tr;
  for (let k = 0; k < 3; k++) {
    const a = th + (k * TAU) / 3;
    o.push(`<path d="M${fx} ${fy} L${f2(fx + 26 * Math.cos(a - 0.28))} ${f2(fy - 26 * Math.sin(a - 0.28))} Q${f2(fx + 30 * Math.cos(a))} ${f2(fy - 30 * Math.sin(a))} ${f2(fx + 26 * Math.cos(a + 0.22))} ${f2(fy - 26 * Math.sin(a + 0.22))} Z" fill="#8fcdf3" stroke="#2b4d73" stroke-width=".8" opacity=".92"/>`);
  }
  o.push(`<circle cx="${fx}" cy="${fy}" r="4.5" fill="#cfd6e4" stroke="#4b5878" stroke-width=".9"/>`);
  for (const r of [10, 20, 30]) o.push(`<circle cx="${fx}" cy="${fy}" r="${r}" fill="none" stroke="#4a5470" stroke-width=".5" opacity=".45"/>`);
  // ลม
  if (rot > 0.05) for (let k = 0; k < 3; k++) {
    const u = (ph * 0.5 * rot + k * 0.33) % 1;
    o.push(warrow(100 + u * 44, 104 + k * 12, "#59b6ea", f2(rot * Math.min(1, u * 6, (1 - u) * 5)) as unknown as number, 1));
  }
  // เก้าอี้ว่าง
  o.push(`<g stroke="#8a5a2a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M182 126 V192"/><path d="M182 154 H224"/><path d="M224 154 V192"/><path d="M182 126 H188"/></g><rect x="178" y="150" width="50" height="7" rx="3" fill="#c98f52" stroke="#8a5a2a" stroke-width="1.2"/>`);
  o.push(lbl(205, 116, "ไม่มีคนอยู่", 8.5, "#a8480a"));
  // สวิตช์
  const sx = 238, sy = 70;
  o.push(`<rect x="${sx - 14}" y="${sy - 14}" width="28" height="40" rx="6" fill="#fff" stroke="#27324f" stroke-width="1.4"/>`);
  o.push(`<rect x="${sx - 8}" y="${f2(lerp(sy - 8, sy + 6, off))}" width="16" height="18" rx="3" fill="${off > 0.5 ? "#9aa6bd" : "#7bd6a0"}" stroke="#27324f" stroke-width="1.1"/>`);
  o.push(`<text x="${sx}" y="${sy - 18}" font-size="7" ${F} font-weight="900" text-anchor="middle" fill="#27324f">${off > 0.5 ? "ปิด" : "เปิด"}</text>`);
  if (off > 0.5) o.push(lbl(135, 70, "ลมไม่ได้ทำให้ห้องเย็นขึ้น", 8.5, "#1d6fa5"));
  else o.push(lbl(135, 70, "ลมช่วยเฉพาะคนที่อยู่ในลม", 8.5, "#27324f"));
  return o.join("");
};

// ----------------------------------------------------------------
const CHIP: Record<string, string> = {
  single: "ไฟบ้าน: ขดลวดชุดเดียว", cap: "เพิ่มขดลวด + ตัวเก็บประจุ", rotor: "สนามหมุน ดึงโรเตอร์ตาม", taps: "ปุ่มปรับแรงลม",
  osc: "กลไกส่ายหน้า (มองจากด้านบน)", fact: "ทำไมถึงรู้สึกเย็น", tip: "ไม่มีคนอยู่ ปิดได้เลย",
};

export const SCENE_FAN: SceneDef = {
  focus: {
    all: { cx: 135, cy: 240, z: 1.0 },
    motor: { cx: 108, cy: 135, z: 1.7, box: [44, 92, 90, 84], label: "มอเตอร์" },
    single: { cx: 135, cy: 335, z: 1.1, box: [71, 283, 128, 128], label: "ขดลวดชุดเดียว" },
    cap: { cx: 135, cy: 335, z: 1.1, box: [71, 283, 160, 128], label: "ขดช่วย + ตัวเก็บประจุ" },
    rotor: { cx: 135, cy: 340, z: 1.12, box: [105, 320, 60, 60], label: "โรเตอร์" },
    blade: { cx: 168, cy: 134, z: 1.8, box: [136, 62, 56, 144], label: "ใบพัด" },
    taps: { cx: 135, cy: 335, z: 1.1, box: [90, 300, 120, 100], label: "จุดต่อบนขดลวด" },
    osc: { cx: 135, cy: 345, z: 1.1, box: [78, 330, 150, 140], label: "กลไกส่าย" },
    fact: { cx: 135, cy: 335, z: 1.1, box: [14, 424, 242, 46], label: "เหงื่อระเหย" },
    tip: { cx: 135, cy: 335, z: 1.1, box: [170, 355, 60, 80], label: "เก้าอี้ว่าง" },
    end: { cx: 135, cy: 240, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const Tr = turns(cue, p, ph);
    const rot = rotAt(cue, cl(p));
    const aux = auxAt(cue, cl(p));
    const o: string[] = [DEFS, EXTRA];
    o.push(`<rect x="-140" y="-140" width="550" height="800" fill="url(#wall)"/>`);
    o.push(`<g>${panelA(cue, ph, Tr, rot, aux)}</g>`);
    o.push(`<g transform="translate(0 240)">`);
    if (cue === "taps") o.push(panelTaps(ph, Tr, rot, cl(p)));
    else if (cue === "osc") o.push(panelOsc(ph, Tr, rot, cue));
    else if (cue === "fact") o.push(panelFact(ph, cl(p)));
    else if (cue === "tip") o.push(panelTip(ph, cl(p), Tr, rot));
    else o.push(panelStator(cue, ph, Tr, rot, aux));
    o.push(chip(9, CHIP[cue] || "มองหน้าตัดมอเตอร์ (แผนผัง)", 220));
    o.push(`</g>`);
    o.push(chip(9, "พัดลมตัดครึ่ง (มองด้านข้าง)", 220));
    o.push(box(SCENE_FAN.focus[cue]?.box, ph));
    return o.join("");
  },
};
void mixc; void lerp; void ease; void varrow;
