// ฉากเบรกเกอร์ (ความร้อน-แม่เหล็ก) + เครื่องตัดไฟรั่ว (RCD) แบบตัดครึ่ง — คืนสตริง SVG ภายในพิกัด 270x480
// บน: เบรกเกอร์ (ไบเมทัลงอ + แม่เหล็กไฟฟ้าดึง → ปลดสลัก → สปริงดีดหน้าสัมผัส)
// ล่าง: RCD (สายเฟส+นิวทรัลลอดวงแหวนแม่เหล็ก → ผลต่างกระแส → รีเลย์ → หน้าสัมผัสเปิด)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, box, DEFS, plen, along, tube } = H;
type Pt = [number, number];
const F = `font-family="Kanit, sans-serif"`;
const lbl = (x: number, y: number, t: string, size = 6.5, c = "#27324f", anchor = "middle") =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" ${F} font-weight="700" text-anchor="${anchor}" fill="${c}" stroke="#fff" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">${t}</text>`;
const chip = (x: number, y: number, t: string, w: number, bg = "#27324f", fg = "#ffe14a", size = 7) =>
  `<g><rect x="${f2(x - w / 2)}" y="${f2(y - 7.5)}" width="${w}" height="12.5" rx="6.2" fill="${bg}" opacity=".94"/><text x="${f2(x)}" y="${f2(y + 1.6)}" font-size="${size}" ${F} font-weight="800" text-anchor="middle" fill="${fg}">${t}</text></g>`;
const rot = (x: number, y: number, cx: number, cy: number, a: number): Pt => {
  const dx = x - cx, dy = y - cy, c = Math.cos(a), s = Math.sin(a);
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
};
// จุดกระแสไหลตามเส้น (alpha ของแต่ละจุดขึ้นกับความหนาแน่น dens 0..1)
const flow = (pts: Pt[], ph: number, speed: number, dens: number, a = 1, c = "#ffd84a", n = 12) => {
  const L = plen(pts);
  if (L < 1 || dens <= 0.001 || a <= 0.01) return "";
  let s = "";
  for (let k = 0; k < n; k++) {
    const al = cl(dens * n - k) * a;
    if (al < 0.02) continue;
    const d = (((ph * speed * 26 + (k * L) / n) % L) + L) % L;
    const q = along(pts, d);
    s += `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="1.8" fill="${c}" stroke="#8a6d10" stroke-width=".45" opacity="${f2(al)}"/>`;
  }
  return s;
};
const spring = (a: Pt, b: Pt, n = 9, amp = 3.2) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  let d = `M${f2(a[0])} ${f2(a[1])}`;
  for (let i = 1; i < n * 2; i++) {
    const t = i / (n * 2), sg = i % 2 ? 1 : -1;
    d += ` L${f2(a[0] + dx * t + nx * amp * sg)} ${f2(a[1] + dy * t + ny * amp * sg)}`;
  }
  d += ` L${f2(b[0])} ${f2(b[1])}`;
  return `<path d="${d}" fill="none" stroke="#6e7a93" stroke-width="1.5" stroke-linejoin="round"/>`;
};

const EXTRA = `<defs>
<linearGradient id="shellb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e7ebf3"/><stop offset=".4" stop-color="#ffffff"/><stop offset="1" stop-color="#c3ccdb"/></linearGradient>
<linearGradient id="coreb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d889f"/><stop offset=".5" stop-color="#3f4a66"/><stop offset="1" stop-color="#262d45"/></linearGradient>
<radialGradient id="glowy" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd24a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd24a" stop-opacity="0"/></radialGradient>
<radialGradient id="glowrd" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff4a2a" stop-opacity=".75"/><stop offset="1" stop-color="#ff4a2a" stop-opacity="0"/></radialGradient>
<clipPath id="rhalf"><rect x="128" y="0" width="80" height="240"/></clipPath>
</defs>`;

// ====================================================================
// ส่วน A: เบรกเกอร์
// ====================================================================
type AS = { h: number; m: number; o: number; cur: number; chip: string };
const aState = (cue: string, p: number): AS => {
  const s: AS = { h: 0, m: 0, o: 0, cur: 0.7, chip: "" };
  if (cue === "heat") {
    s.h = 0.78 * ease(cl(p));
    s.cur = 0.7 + 0.8 * cl(p * 1.6);
    s.chip = "กระแสเกินพิกัดนานๆ";
  } else if (cue === "heat2") {
    s.h = 0.78 + 0.14 * cl(p / 0.6) + 0.05 * cl((p - 0.6) / 0.2);
    s.o = ease(cl((p - 0.62) / 0.14));
    s.cur = 1.5 * (1 - s.o);
    s.chip = "กระแสเกินพิกัดนานๆ";
  } else if (cue === "short") {
    s.m = ease(cl((p - 0.3) / 0.15));
    s.o = ease(cl((p - 0.42) / 0.09));
    s.cur = (0.7 + 3.0 * s.m) * (1 - s.o);
    s.chip = p > 0.28 ? "ลัดวงจร! กระแสพุ่งสูงมาก" : "";
  }
  return s;
};

const renderA = (cue: string, p: number, ph: number, fo: string) => {
  const s = aState(cue, p);
  const o: string[] = [];
  const bend = Math.min(26 * s.h, 25.6);
  const dPl = Math.min(20 * s.m, 17.3); // ระยะที่แกนเหล็กถูกดึง
  let th = Math.max(0, (bend - 15.5) / 46, (113 + dPl - 125) / 24);
  th = Math.min(th, 0.22);
  if (s.o > 0.001 && th < 0.2) th = 0.2;
  const phi = 0.36 * s.o; // มุมที่แขนหน้าสัมผัสเปิด
  const tipX = 105 + bend;
  const hot = cl(s.h);
  const openAmt = s.o;

  // ตัวเรือน
  o.push(`<g filter="url(#sh)"><rect x="22" y="40" width="228" height="176" rx="14" fill="url(#shellb)" stroke="#8e99b0" stroke-width="1.3"/></g>`);
  o.push(`<rect x="29" y="47" width="214" height="162" rx="9" fill="#e9eef7" stroke="#aab5ca" stroke-width=".8"/>`);
  o.push(`<rect x="29" y="196" width="214" height="13" rx="6" fill="#d6deea" opacity=".8"/>`);
  // คันโยก
  const ha = lerp(16, -14, ease(openAmt));
  o.push(`<rect x="156" y="42" width="28" height="9" rx="3" fill="#2b3350"/>`);
  o.push(`<g transform="rotate(${f2(ha)} 170 50)"><rect x="165.5" y="22" width="9" height="30" rx="3.5" fill="#2b3350"/><rect x="164" y="20" width="12" height="9" rx="4" fill="#5a6890"/></g><circle cx="170" cy="50" r="4.2" fill="#9aa6bd" stroke="#2b3350" stroke-width=".8"/>`);
  // ขั้วต่อสาย
  for (const [tx, tn] of [[28, "ไฟเข้า"], [216, "ไฟออก"]] as [number, string][]) {
    o.push(`<rect x="${tx}" y="52" width="28" height="24" rx="4" fill="#d9a85a" stroke="#8a6d10" stroke-width=".9"/><circle cx="${tx + 14}" cy="60" r="5.2" fill="#aab5ca" stroke="#4b5878" stroke-width=".8"/><path d="M${tx + 10.5} 56.5 L${tx + 17.5} 63.5" stroke="#4b5878" stroke-width="1.2"/>`);
    void tn;
  }
  // ลวดนำไฟ (ฐาน)
  o.push(tube([[56, 64], [100, 64]], 3, "#cf8a3c", "#ffe0a8", 2));
  o.push(tube([[204, 104], [204, 64], [218, 64]], 3, "#cf8a3c", "#ffe0a8", 3));
  o.push(tube([[96, 160], [96, 200], [204, 200]], 3, "#cf8a3c", "#ffe0a8", 3));
  // จุดยึดไบเมทัล
  o.push(`<rect x="97" y="59" width="16" height="10" rx="2" fill="#6e7a93" stroke="#2b3350" stroke-width=".8"/>`);

  // ความร้อนเรืองรอบไบเมทัล
  if (hot > 0.05) o.push(`<ellipse cx="${f2(110 + bend / 2)}" cy="98" rx="${f2(16 + 12 * hot)}" ry="${f2(40)}" fill="url(#glowrd)" opacity="${f2(hot * 0.8)}"/>`);
  // ไบเมทัล: สองชั้น (ชั้นซ้ายขยายตัวมากกว่า → งอไปทางขวา)
  const ptsL: string[] = [], ptsR: string[] = [];
  for (let y = 68; y <= 128; y += 4) {
    const dx = bend * Math.pow((y - 68) / 60, 2);
    ptsL.push(`${f2(105 + dx - 1.9)} ${y}`);
    ptsR.push(`${f2(105 + dx + 1.9)} ${y}`);
  }
  const cL = mixc("#e8913a", "#ff3b1f", hot), cR = mixc("#7c8bb0", "#d9544a", hot * 0.85);
  o.push(`<path d="M${ptsL.join(" L")}" fill="none" stroke="#2b3350" stroke-width="5.6" stroke-linecap="butt"/>`);
  o.push(`<path d="M${ptsL.join(" L")}" fill="none" stroke="${cL}" stroke-width="3.6"/>`);
  o.push(`<path d="M${ptsR.join(" L")}" fill="none" stroke="${cR}" stroke-width="3.6"/>`);
  o.push(`<rect x="${f2(tipX + 1)}" y="124" width="4" height="8" rx="1.5" fill="#4b5878"/>`);
  // คลื่นความร้อน
  if (hot > 0.15) for (let k = 0; k < 3; k++) {
    let d = "";
    for (let y = 96; y >= 72; y -= 3) d += `${d ? " L" : "M"}${f2(116 + k * 3.8 + Math.sin(y * 0.4 - ph * 7 + k * 2) * 1.3)} ${y}`;
    o.push(`<path d="${d}" fill="none" stroke="#ff7a3a" stroke-width="1.1" stroke-linecap="round" opacity="${f2(0.25 + 0.55 * hot)}"/>`);
  }
  // สายถัก (braid) จากปลายไบเมทัลไปขดลวด
  const braid = `M${f2(tipX + 3)} 130 C${f2(tipX - 18)} 138 74 118 52 139`;
  o.push(`<path d="${braid}" fill="none" stroke="#2b3350" stroke-width="4.2" stroke-linecap="round"/><path d="${braid}" fill="none" stroke="#c9d0dd" stroke-width="3" stroke-linecap="round"/><path d="${braid}" fill="none" stroke="#6e7a93" stroke-width="3" stroke-dasharray="1 1.4" stroke-linecap="round"/>`);

  // ขดลวด + แกนเหล็ก
  o.push(`<rect x="52" y="138" width="44" height="24" rx="4" fill="#f4efe2" stroke="#6e7a93" stroke-width="1"/>`);
  o.push(`<rect x="${f2(40 + dPl)}" y="145" width="38" height="10" rx="2" fill="url(#metal)" stroke="#2b3350" stroke-width=".8"/>`);
  o.push(`<rect x="${f2(78 + dPl)}" y="148.4" width="35" height="3.2" fill="#8d99b2" stroke="#2b3350" stroke-width=".6"/>`);
  for (let i = 0; i < 10; i++) {
    const x = 55 + i * 4.2;
    o.push(`<path d="M${f2(x)} 138 L${f2(x + 2)} 144 M${f2(x)} 162 L${f2(x + 2)} 156" stroke="#c77b2e" stroke-width="2.4" stroke-linecap="round"/>`);
  }
  o.push(`<rect x="52" y="138" width="44" height="24" rx="4" fill="none" stroke="#6e7a93" stroke-width="1"/>`);
  if (s.m > 0.05) {
    // เส้นแรงแม่เหล็กรอบขดลวด
    for (let k = 0; k < 3; k++) {
      const u = (ph * 1.3 + k / 3) % 1;
      o.push(`<ellipse cx="74" cy="150" rx="${f2(30 + 14 * u)}" ry="${f2(18 + 10 * u)}" fill="none" stroke="#9a5cff" stroke-width="1.4" stroke-dasharray="3 3" opacity="${f2(s.m * (1 - u) * 0.9)}"/>`);
    }
  }
  if (s.cur > 1.8) o.push(`<rect x="46" y="132" width="56" height="36" rx="8" fill="url(#glowy)" opacity="${f2(cl((s.cur - 1.8) / 1.5))}"/>`);

  // คันปลด (rod) + ตะขอ — หมุนรอบ (128,174)
  o.push(`<g transform="rotate(${f2((th * 180) / Math.PI)} 128 174)"><rect x="125" y="98" width="6" height="76" rx="2" fill="#8a97b3" stroke="#2b3350" stroke-width=".9"/><path d="M128 167 H181 V157 H177 V167 Z M128 167 V176 H181 V167 Z" fill="#8a97b3" stroke="#2b3350" stroke-width=".9" stroke-linejoin="round"/></g>`);
  o.push(`<circle cx="128" cy="174" r="4.4" fill="#aab5ca" stroke="#2b3350" stroke-width=".9"/>`);

  // แขนหน้าสัมผัส + สลัก (หมุนรอบ (204,198))
  const a = phi;
  o.push(`<circle cx="204" cy="198" r="5" fill="#aab5ca" stroke="#2b3350" stroke-width=".9"/>`);
  o.push(`<g transform="rotate(${f2((a * 180) / Math.PI)} 204 198)"><rect x="201" y="110" width="6" height="88" rx="2" fill="#6e7a93" stroke="#2b3350" stroke-width=".9"/><rect x="198" y="108" width="12" height="5" rx="1.5" fill="#e8c26a" stroke="#8a6d10" stroke-width=".8"/><rect x="175" y="148" width="29" height="4" fill="#8a97b3" stroke="#2b3350" stroke-width=".7"/><rect x="171" y="148" width="4.2" height="18" fill="#8a97b3" stroke="#2b3350" stroke-width=".7"/></g>`);
  o.push(`<circle cx="204" cy="198" r="2.2" fill="#2b3350"/>`);
  // หน้าสัมผัสอยู่กับที่
  o.push(`<rect x="198" y="102" width="12" height="6" rx="1.5" fill="#e8c26a" stroke="#8a6d10" stroke-width=".8"/>`);
  // สปริงดึงแขน
  const att = rot(207, 170, 204, 198, a);
  o.push(spring(att, [246, 156]));
  o.push(`<rect x="244" y="150" width="5" height="12" rx="1.5" fill="#6e7a93"/>`);
  // ประกายตอนหน้าสัมผัสแยก
  if (openAmt > 0.02 && openAmt < 0.5) {
    const u = openAmt / 0.5, sx = 204 + 6 * u;
    o.push(`<circle cx="${f2(sx)}" cy="108" r="${f2(8 - 3 * u)}" fill="url(#glowy)"/>`);
    for (let k = 0; k < 6; k++) { const ag = k * 1.05 + 0.4; o.push(`<line x1="${f2(sx)}" y1="108" x2="${f2(sx + Math.cos(ag) * (5 + 6 * u))}" y2="${f2(108 + Math.sin(ag) * (5 + 6 * u))}" stroke="#fff3a0" stroke-width="1.2" stroke-linecap="round"/>`); }
  }

  // กระแสไฟไหล
  const bimet: Pt[] = [];
  for (let y = 68; y <= 128; y += 6) bimet.push([105 + bend * Math.pow((y - 68) / 60, 2), y]);
  const path: Pt[] = [[56, 64], [105, 64], ...bimet, [tipX, 130], [84, 126], [58, 128], [52, 139], [96, 139], [96, 162], [96, 200], [204, 200], [204, 198], [204, 112]];
  const sp = Math.min(s.cur, 3.2);
  const al = 1 - cl(openAmt * 3);
  o.push(flow(path, ph, 0.5 + 0.5 * sp, cl(0.45 + 0.2 * sp), al, s.cur > 1.2 ? "#ff9a2a" : "#ffd84a", 18));
  o.push(flow([[204, 108], [204, 64], [232, 64]], ph, 0.5 + 0.5 * sp, cl(0.45 + 0.2 * sp), al, s.cur > 1.2 ? "#ff9a2a" : "#ffd84a", 6));

  // ป้ายชื่อชิ้นส่วน
  if (fo === "mcb") {
    o.push(lbl(42, 88, "ไฟเข้า"), lbl(230, 88, "ไฟออก"));
    o.push(lbl(150, 36, "คันโยก", 6.5, "#27324f", "end"));
    o.push(lbl(98, 100, "ไบเมทัล", 6.5, "#27324f", "end"));
    o.push(lbl(60, 178, "ขดแม่เหล็กไฟฟ้า"));
    o.push(lbl(154, 190, "สลักล็อก"));
    o.push(lbl(230, 104, "หน้าสัมผัส"));
    o.push(lbl(232, 184, "สปริง"));
  }
  if (cue === "heat" || cue === "heat2") {
    o.push(lbl(98, 80, "ขยายมาก", 6, "#b8590f", "end"), lbl(134, 84, "ขยายน้อย", 6, "#2f4a99", "start"));
    o.push(lbl(98, 108, "ไบเมทัล", 6.5, "#27324f", "end"));
    if (cue === "heat2") o.push(lbl(156, 190, "สลักล็อก"), lbl(232, 184, "สปริง"), lbl(230, 104, "หน้าสัมผัส"));
  }
  if (cue === "short") {
    o.push(lbl(58, 178, "ขดแม่เหล็กไฟฟ้า"), lbl(60, 130, "แกนเหล็ก", 6, "#27324f", "middle"));
  }
  if (s.chip) o.push(chip(108, 54, s.chip, cue === "short" ? 100 : 78, "#a31f1f", "#fff"));
  return o.join("");
};

// ====================================================================
// ส่วน B: เครื่องตัดไฟรั่ว (RCD)
// ====================================================================
type BS = { leak: number; tr: number; btn: number; cur: number; ms: number; sig: number };
const bState = (cue: string, p: number): BS => {
  const s: BS = { leak: 0, tr: 0, btn: 0, cur: 1, ms: -1, sig: 0 };
  if (cue === "sense_leak") {
    s.leak = ease(cl((p - 0.1) / 0.25));
    s.tr = ease(cl((p - 0.58) / 0.1));
  } else if (cue === "fact") {
    s.leak = ease(cl((p - 0.1) / 0.05));
    s.ms = Math.round(40 * cl((p - 0.15) / 0.4));
    s.tr = ease(cl((p - 0.58) / 0.07));
  } else if (cue === "test") {
    s.btn = ease(cl((p - 0.15) / 0.1));
    s.tr = ease(cl((p - 0.5) / 0.1));
  }
  return s;
};

const renderB = (cue: string, p: number, ph: number, fo: string) => {
  const s = bState(cue, p);
  const o: string[] = [];
  const tr = s.tr;
  const alive = 1 - tr;
  const leak = s.leak * alive; // กระแสรั่วจริง
  const tst = s.btn * alive; // กระแสจากวงจรทดสอบ
  const imb = Math.max(leak, tst);
  const Y_N = 92, Y_L = 128;
  const CN = "#3d6fd6", CL = "#e0483a";

  // เส้นทางกลับผ่านดิน (ไม่ผ่านวงแหวน) + ต้นทาง
  const earth: Pt[] = [[214, 128], [214, 158], [214, 200], [214, 214], [22, 214], [22, 138]];
  o.push(`<path d="M214 158 V214 H22 V138" fill="none" stroke="#2b3350" stroke-width="3.6" stroke-linejoin="round" opacity=".9"/><path d="M214 158 V214 H22 V138" fill="none" stroke="#6bbf8a" stroke-width="2" stroke-dasharray="4 3" stroke-linejoin="round"/>`);
  // สัญลักษณ์ดิน
  o.push(`<g stroke="#2b3350" stroke-width="1.6" stroke-linecap="round"><path d="M205 176 H223"/><path d="M208 181 H220"/><path d="M211 186 H217"/></g>`);
  o.push(lbl(122, 208, "ทางกลับผ่านดิน (ไม่ผ่านวงแหวน)", 6, "#2a6b44"));
  // แหล่งไฟ
  o.push(`<rect x="6" y="84" width="32" height="54" rx="5" fill="#fffdf5" stroke="#6e7a93" stroke-width="1.1"/>`);
  o.push(`<text x="22" y="97" font-size="6.5" ${F} font-weight="800" text-anchor="middle" fill="#27324f">แหล่งไฟ</text><text x="22" y="126" font-size="17" ${F} font-weight="900" text-anchor="middle" fill="#d6232a">~</text>`);

  // ตัวเรือน RCD
  o.push(`<g filter="url(#sh)"><rect x="46" y="28" width="140" height="168" rx="12" fill="url(#shellb)" stroke="#8e99b0" stroke-width="1.3"/></g>`);
  o.push(`<rect x="52" y="34" width="128" height="156" rx="8" fill="#e9eef7" stroke="#aab5ca" stroke-width=".8"/>`);

  // สายไฟ: N บน, L ล่าง (ต่อจากแหล่งไฟ → หน้าสัมผัส → วงแหวน → เครื่องใช้ไฟฟ้า)
  const wire = (y: number, c: string) =>
    `<path d="M38 ${y} H54 M86 ${y} H206" fill="none" stroke="#252d46" stroke-width="5.4" stroke-linecap="round"/><path d="M38 ${y} H54 M86 ${y} H206" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>`;
  // วงแหวน (ครึ่งซ้ายอยู่หลังสาย ครึ่งขวาทับสาย → สายลอดผ่านรู)
  const ring = `<path fill-rule="evenodd" d="M104 110 a24 46 0 1 0 48 0 a24 46 0 1 0 -48 0 Z M118 110 a10 30 0 1 0 20 0 a10 30 0 1 0 -20 0 Z" fill="url(#coreb)" stroke="#161c30" stroke-width="1.1"/>`;
  o.push(ring);
  // วงจรทดสอบ (สายสีเทา) — แตะจาก L ก่อนวงแหวน ไปต่อ N หลังวงแหวน (ข้ามสาย L ด้วยโค้ง)
  const tpath = `M90 ${Y_L} V180 H166 V134 A6 6 0 0 0 166 122 V${Y_N}`;
  o.push(`<path d="${tpath}" fill="none" stroke="#2b3350" stroke-width="3" stroke-linejoin="round"/><path d="${tpath}" fill="none" stroke="#9aa6bd" stroke-width="1.6" stroke-linejoin="round"/>`);
  o.push(wire(Y_N, CN), wire(Y_L, CL));
  o.push(`<g clip-path="url(#rhalf)">${ring}</g>`);
  // ตัวต้านทานในวงจรทดสอบ + สวิตช์
  o.push(`<rect x="100" y="175" width="22" height="10" rx="2" fill="#e8c26a" stroke="#8a6d10" stroke-width=".9"/><path d="M103 180 l3 -3 l3 6 l3 -6 l3 6 l3 -3" fill="none" stroke="#8a6d10" stroke-width="1"/>`);
  const bladeA = lerp(-26, 0, s.btn) * (Math.PI / 180);
  const bp = rot(152, 180, 132, 180, bladeA);
  o.push(`<line x1="132" y1="180" x2="${f2(bp[0])}" y2="${f2(bp[1])}" stroke="#2b3350" stroke-width="3.2" stroke-linecap="round"/><line x1="132" y1="180" x2="${f2(bp[0])}" y2="${f2(bp[1])}" stroke="#cdd6e6" stroke-width="1.6" stroke-linecap="round"/><circle cx="132" cy="180" r="2.4" fill="#e8c26a" stroke="#8a6d10" stroke-width=".6"/><circle cx="152" cy="180" r="2.4" fill="#e8c26a" stroke="#8a6d10" stroke-width=".6"/>`);
  // ปุ่มทดสอบ
  const by = 190 - 3 * s.btn;
  o.push(`<rect x="136" y="${f2(by - 5)}" width="12" height="9" rx="2.5" fill="#e0483a" stroke="#7a1f1a" stroke-width=".9"/><rect x="132" y="194" width="20" height="3.5" rx="1.5" fill="#aab5ca"/>`);

  // สนามแม่เหล็กในวงแหวน
  const iL = alive;
  const iN = alive * (1 - 0.4 * (leak > 0 ? s.leak : 0));
  if (alive > 0.05) {
    o.push(`<ellipse cx="128" cy="110" rx="15.5" ry="36" fill="none" stroke="#ff6a5a" stroke-width="2" stroke-dasharray="5 4" stroke-dashoffset="${f2(-ph * 26)}" opacity="${f2(0.8 * iL)}"/>`);
    o.push(`<ellipse cx="128" cy="110" rx="19" ry="40" fill="none" stroke="#5a8cf0" stroke-width="2" stroke-dasharray="5 4" stroke-dashoffset="${f2(ph * 26)}" opacity="${f2(0.8 * Math.max(iN, iL * (1 - 0.4 * imb)))}"/>`);
  }
  if (imb > 0.02) {
    o.push(`<ellipse cx="128" cy="110" rx="17.5" ry="38" fill="none" stroke="#7dffb0" stroke-width="7" opacity="${f2(imb * 0.55)}" filter="url(#bl)"/>`);
    o.push(`<ellipse cx="128" cy="110" rx="17.5" ry="38" fill="none" stroke="#c8ffd8" stroke-width="2.2" stroke-dasharray="3 4" stroke-dashoffset="${f2(-ph * 30)}" opacity="${f2(Math.min(1, imb * 1.2))}"/>`);
  }
  // ขดลวดตรวจจับบนวงแหวน
  for (let i = 0; i < 5; i++) {
    const x = 119 + i * 4.5;
    o.push(`<path d="M${f2(x - 2)} 61 L${f2(x + 2)} 82" stroke="#2b3350" stroke-width="3" stroke-linecap="round"/><path d="M${f2(x - 2)} 61 L${f2(x + 2)} 82" stroke="#c77b2e" stroke-width="1.8" stroke-linecap="round"/>`);
  }
  o.push(`<path d="M128 61 V58" stroke="#c77b2e" stroke-width="1.8"/>`);

  // รีเลย์ปลดวงจร
  const fire = tr > 0 || (cue === "fact" && s.tr > 0) ? 1 : 0;
  const sigOn = imb > 0.55 ? 1 : 0;
  o.push(`<rect x="96" y="34" width="76" height="24" rx="5" fill="url(#dark)" stroke="#10182a" stroke-width=".9"/>`);
  for (let i = 0; i < 9; i++) o.push(`<path d="M${104 + i * 4.4} 38 L${106 + i * 4.4} 54" stroke="#c77b2e" stroke-width="1.5" opacity=".85"/>`);
  if (sigOn) o.push(`<rect x="90" y="30" width="88" height="32" rx="9" fill="url(#glowy)" opacity="${f2(0.5 + 0.3 * Math.sin(ph * 14))}"/>`);
  // ก้านปลดสลักจากรีเลย์ไปยังคานเชื่อมหน้าสัมผัส
  const rodE: Pt = [96 - 5 * tr, 46];
  const barUp = 6.2 * tr;
  o.push(`<path d="M${f2(rodE[0])} 46 L${f2(66)} ${f2(86 - barUp)}" stroke="#2b3350" stroke-width="2.6"/><path d="M${f2(rodE[0])} 46 L${f2(66)} ${f2(86 - barUp)}" stroke="#c9d0dd" stroke-width="1.2"/>`);

  // หน้าสัมผัส (บานพับที่ x=54, ปลายอยู่ที่ x=80) — เปิดโดยยกขึ้นพร้อมกันทั้งสองขั้ว
  const bAng = -0.5 * ease(tr);
  for (const y of [Y_N, Y_L]) {
    const tipb = rot(80, y, 54, y, bAng);
    o.push(`<circle cx="54" cy="${y}" r="3" fill="#aab5ca" stroke="#2b3350" stroke-width=".8"/>`);
    o.push(`<line x1="54" y1="${y}" x2="${f2(tipb[0])}" y2="${f2(tipb[1])}" stroke="#2b3350" stroke-width="4.4" stroke-linecap="round"/><line x1="54" y1="${y}" x2="${f2(tipb[0])}" y2="${f2(tipb[1])}" stroke="#e8edf5" stroke-width="2.4" stroke-linecap="round"/>`);
    o.push(`<rect x="80" y="${y - 2}" width="6" height="5" rx="1.2" fill="#e8c26a" stroke="#8a6d10" stroke-width=".7"/>`);
  }
  o.push(`<rect x="${f2(64.5)}" y="${f2(Y_N - 4 - barUp)}" width="5" height="${f2(Y_L - Y_N + 8)}" rx="2" fill="#5a6890" stroke="#2b3350" stroke-width=".8"/>`);
  if (tr > 0.02 && tr < 0.6) { // ประกายตอนเปิด
    for (const y of [Y_N, Y_L]) o.push(`<circle cx="83" cy="${y - 4 * tr}" r="${f2(6 - 5 * tr)}" fill="url(#glowy)"/>`);
  }

  // เครื่องใช้ไฟฟ้า
  o.push(`<g filter="url(#sh2)"><rect x="198" y="66" width="64" height="92" rx="8" fill="url(#metal)" stroke="#4b5878" stroke-width="1.1"/></g>`);
  o.push(`<rect x="204" y="72" width="52" height="80" rx="5" fill="#2b3350" opacity=".18"/>`);
  o.push(`<text x="230" y="80.5" font-size="6.2" ${F} font-weight="800" text-anchor="middle" fill="#27324f">เครื่องใช้ไฟฟ้า</text>`);
  // ตัวต้านทานภายใน (โหลด)
  o.push(tube([[214, Y_N], [214, 100]], 2.6, "#d9a85a", "#ffe0a8", 1), tube([[214, 120], [214, Y_L]], 2.6, "#d9a85a", "#ffe0a8", 1));
  o.push(`<path d="M214 100 l-6 3 l12 5 l-12 5 l12 5 l-6 2" fill="none" stroke="#e0813a" stroke-width="2.4" stroke-linejoin="round"/>`);
  // จุดฉนวนชำรุด + ประกาย
  if (cue === "sense_leak" || cue === "fact") {
    const sp = s.leak * alive;
    o.push(`<rect x="244" y="148" width="12" height="3" fill="#c33" opacity="${f2(0.0)}"/>`);
    if (sp > 0.05 && Math.sin(ph * 25) > -0.4) o.push(`<path d="M214 130 l-4 6 l6 0 l-3 7 l7 -9 l-5 0 l3 -4 z" fill="#ffe14a" stroke="#d6232a" stroke-width=".6" opacity="${f2(Math.min(1, sp * 2))}"/>`);
    o.push(lbl(228, 152, "ฉนวนชำรุด", 5.8, "#a31f1f"));
  }
  o.push(`<path d="M214 ${Y_L} V158" stroke="#2b3350" stroke-width="0" />`);

  // กระแสไหล (จุดสีเหลือง)
  const dN1: Pt[] = [[206, Y_N], [166, Y_N]], dN2: Pt[] = [[166, Y_N], [42, Y_N]];
  const dL1: Pt[] = [[42, Y_L], [90, Y_L]], dL2: Pt[] = [[90, Y_L], [206, Y_L]];
  const base = 0.62, sd = 1;
  const nL1 = base + 0.2 * tst * 1, nL2 = base * 1, nN1 = base, nN2 = base + 0.2 * tst;
  // L: จากแหล่งไฟ → เครื่องใช้ไฟฟ้า (ทิศ +) ; N: กลับ (ทิศ -)  [แสดงทิศขณะใดขณะหนึ่ง]
  o.push(flow(dL1, ph, sd, nL1, alive, "#ffd84a", 6), flow(dL2, ph, sd, nL2, alive, "#ffd84a", 9));
  // N ผ่านวงแหวนถูกลดตามกระแสรั่ว
  const nLeakFactor = 1 - 0.4 * s.leak;
  o.push(flow(dN1, ph, -sd, base, alive, "#ffd84a", 4), flow(dN2, ph, -sd, (nN2) * nLeakFactor, alive, "#ffd84a", 9));
  // วงจรทดสอบ
  if (tst > 0.05) o.push(flow([[90, Y_L], [90, 180], [166, 180], [166, Y_N]], ph, sd * 1.2, 0.5 * tst, 1, "#fff56a", 8));
  // ทางรั่ว
  if (leak > 0.05) {
    o.push(flow(earth, ph, sd * 1.1, 0.4 * leak, 1, "#7dffb0", 12));
  }

  // เส้นสัญญาณจากวงแหวน → รีเลย์
  if (sigOn) o.push(`<circle cx="128" cy="${f2(59 - 0)}" r="3.4" fill="#fff56a" opacity="${f2(0.7 + 0.3 * Math.sin(ph * 20))}"/>`);

  // ป้ายชื่อ + ข้อความอธิบาย
  if (fo === "rcd") {
    o.push(lbl(128, 168, "วงแหวนแม่เหล็ก"));
    o.push(`<text x="134" y="49.8" font-size="6" ${F} font-weight="700" text-anchor="middle" fill="#fff">รีเลย์ปลดวงจร</text>`);
    o.push(lbl(66, 146, "หน้าสัมผัส"));
    o.push(lbl(172, 194, "ปุ่ม Test", 6.2, "#27324f", "start"));
    o.push(lbl(22, 78, "ไฟเข้า", 6.2));
    o.push(lbl(150, 86, "N", 7.5, CN), lbl(150, 138, "L", 7.5, CL));
  }
  if (cue === "sense_ok") {
    o.push(chip(128, 167, "ไหลไป = ไหลกลับ → สนามหักล้างกัน", 124, "#2a6b44", "#fff", 6.8));
    o.push(lbl(80, 86, "สายนิวทรัล N", 6, CN, "middle"), lbl(80, 142, "สายเฟส L", 6, CL, "middle"));
  }
  if (cue === "sense_leak") {
    if (tr > 0.5) o.push(chip(128, 167, "รีเลย์สั่งตัด → ไฟดับ", 100, "#27324f", "#ffe14a", 7));
    else if (s.leak > 0.3) o.push(chip(128, 167, "ไหลกลับน้อยกว่า → เหลือสนามแม่เหล็ก", 126, "#a31f1f", "#fff", 6.6));
    else o.push(chip(128, 167, "เริ่มมีไฟรั่วลงดิน", 90, "#a36a0b", "#fff", 7));
  }
  if (cue === "test") {
    o.push(chip(128, 167, tr > 0.5 ? "ตัดไฟ = เครื่องยังทำงานปกติ" : "ปุ่มจำลองกระแสไม่สมดุล", 112, tr > 0.5 ? "#27324f" : "#a36a0b", tr > 0.5 ? "#ffe14a" : "#fff", 7));
    o.push(lbl(172, 194, "ปุ่ม Test", 6.2, "#27324f", "start"));
  }
  if (cue === "fact") {
    // นาฬิกาจับเวลา
    o.push(`<g filter="url(#sh2)"><circle cx="226" cy="44" r="17" fill="#fffdf5" stroke="#27324f" stroke-width="2"/><rect x="222" y="25" width="8" height="4" rx="1.5" fill="#27324f"/></g>`);
    const ms = Math.max(0, s.ms);
    o.push(`<text x="226" y="45" font-size="12" ${F} font-weight="900" text-anchor="middle" fill="${tr > 0.5 ? "#d6232a" : "#27324f"}">${ms}</text><text x="226" y="53" font-size="5.2" ${F} font-weight="700" text-anchor="middle" fill="#27324f">มิลลิวินาที</text>`);
    o.push(chip(128, 167, "ภาพช้าลงมาก", 70, "#27324f", "#ffe14a", 7));
  }
  return o.join("");
};

// ====================================================================
export const SCENE_BREAKER: SceneDef = {
  focus: {
    all: { cx: 135, cy: 240, z: 1.0 },
    mcb: { cx: 136, cy: 175, z: 1.08, box: [22, 52, 228, 176], label: "เบรกเกอร์" },
    heat: { cx: 112, cy: 130, z: 2.0, box: [92, 72, 30, 64], label: "ไบเมทัลงอเพราะความร้อน" },
    heat2: { cx: 158, cy: 150, z: 1.75, box: [122, 108, 126, 108], label: "ปลดสลัก สปริงดีดหน้าสัมผัส" },
    short: { cx: 96, cy: 148, z: 1.85, box: [48, 146, 74, 28], label: "ขดแม่เหล็กไฟฟ้าดึงแกนเหล็ก" },
    rcd: { cx: 135, cy: 372, z: 1.08, box: [46, 268, 140, 168], label: "เครื่องตัดไฟรั่ว" },
    sense_ok: { cx: 128, cy: 350, z: 1.75, box: [102, 304, 52, 92], label: "วงแหวนแม่เหล็ก" },
    sense_leak: { cx: 142, cy: 372, z: 1.15, box: [102, 304, 52, 92], label: "ผลต่างกระแส" },
    fact: { cx: 140, cy: 345, z: 1.3, box: [200, 262, 52, 40], label: "ภายในสี่สิบมิลลิวินาที" },
    limit: { cx: 135, cy: 240, z: 1.0 },
    test: { cx: 124, cy: 345, z: 1.5, box: [128, 418, 28, 22], label: "ปุ่ม Test" },
    end: { cx: 135, cy: 240, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const o: string[] = [DEFS, EXTRA];
    o.push(`<rect x="-140" y="-140" width="550" height="800" fill="url(#wall)"/>`);
    // แผงป้ายหัวมุม
    const limit = cue === "limit";
    o.push(`<g transform="translate(0 12)">${renderA(cue, p, ph, cue === "mcb" ? "mcb" : "")}</g>`);
    o.push(`<g transform="translate(0 240)">${renderB(cue, p, ph, cue === "rcd" ? "rcd" : "")}</g>`);
    o.push(`<g ${F} font-weight="900" text-anchor="middle"><rect x="26" y="3" width="218" height="21" rx="10.5" fill="#27324f" opacity=".92"/><text x="135" y="17.5" font-size="11" fill="#ffe14a">${limit ? "เบรกเกอร์ จับ: ไฟเกิน / ลัดวงจร" : "เบรกเกอร์ (ตัดเมื่อกระแสเกิน)"}</text>`);
    o.push(`<rect x="26" y="238" width="218" height="21" rx="10.5" fill="#27324f" opacity=".92"/><text x="135" y="252.5" font-size="11" fill="#ffe14a">${limit ? "ตัดไฟรั่ว จับ: ไฟรั่วลงดิน" : "เครื่องตัดไฟรั่ว (RCD)"}</text></g>`);
    if (limit) {
      o.push(`<circle cx="135" cy="231" r="11" fill="#e0483a" stroke="#fff" stroke-width="2"/><text x="135" y="236.5" font-size="15" ${F} font-weight="900" text-anchor="middle" fill="#fff">+</text>`);
      o.push(chip(135, 470, "ใช้คู่กัน หรือแบบรวมสองหน้าที่ในตัวเดียว", 214, "#27324f", "#ffe14a", 7.5));
    }
    o.push(box(SCENE_BREAKER.focus[cue]?.box, ph));
    return o.join("");
  },
};
void lerp;
