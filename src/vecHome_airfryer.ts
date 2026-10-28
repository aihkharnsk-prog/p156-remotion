// ฉากหม้อทอดไร้น้ำมัน (air fryer) แบบตัดครึ่ง — คืนสตริง SVG ภายในพิกัด 270x480
// ส่วนประกอบที่วาด (อ้างอิง docs/facts-airfryer.md): ขดลวดความร้อนด้านบน, พัดลมเหนือขดลวด, ตะแกรงรูพรุน, ลมร้อนไหลวน,
// ปุ่มตั้งเวลา/อุณหภูมิ — ไม่ได้อ้างกลไกเทอร์โมสตัท เพราะไม่มีแหล่งอ้างอิงยืนยัน
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, plen, along, DEFS, room, box, warrow } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const KA = `font-family="Kanit, sans-serif"`;

const EXTRA = `<defs>
<linearGradient id="afBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a3148"/><stop offset=".18" stop-color="#58627f"/><stop offset=".35" stop-color="#363e58"/><stop offset="1" stop-color="#20263a"/></linearGradient>
<linearGradient id="afCav" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c3cbdb"/><stop offset=".5" stop-color="#eef1f7"/><stop offset="1" stop-color="#bcc5d6"/></linearGradient>
<linearGradient id="afTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d4b8"/><stop offset="1" stop-color="#b9a47f"/></linearGradient>
<linearGradient id="afCab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c7650"/><stop offset="1" stop-color="#6d4d30"/></linearGradient>
<linearGradient id="afBask" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5b6580"/><stop offset=".4" stop-color="#9aa4bb"/><stop offset="1" stop-color="#4a546e"/></linearGradient>
<radialGradient id="afHeat" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".9"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>
</defs>`;

type S = { g: number; fn: number; air: number; br: number; cr: number };
const OFF: S = { g: 0, fn: 0, air: 0, br: 0.06, cr: 0 };
const ON: S = { g: 1, fn: 1, air: 1, br: 0.06, cr: 0 };
const ST: Record<string, [S, S]> = {
  all: [OFF, OFF],
  inside: [OFF, OFF],
  set: [OFF, { ...OFF, g: 0.35, fn: 0.4, air: 0.3 }],
  element: [{ ...OFF, g: 0.35, fn: 0.4, air: 0.3 }, { ...ON, fn: 0.4, air: 0.3 }],
  fan: [{ ...ON, fn: 0.4, air: 0.3 }, ON],
  basket: [ON, ON],
  dry: [{ ...ON, br: 0.12 }, { ...ON, br: 0.4 }],
  maillard: [{ ...ON, br: 0.4 }, { ...ON, br: 0.78 }],
  oil: [{ ...ON, br: 0.78 }, { ...ON, br: 0.78 }],
  fact: [{ ...ON, br: 0.78 }, { ...ON, br: 0.78 }],
  tip: [{ ...ON, br: 0.78, cr: 1 }, { ...ON, br: 0.78, cr: 1 }],
  end: [{ ...ON, br: 0.78 }, { ...ON, br: 0.78 }],
};

// เส้นทางลมร้อน: พัดลม → ผ่านขดลวด → ลงข้างตะแกรง → ใต้ตะแกรง → ขึ้นผ่านรูพรุนและอาหาร → กลับเข้าพัดลม
const LOOP_L: Pt[] = [[128, 134], [98, 148], [66, 168], [66, 318], [94, 330], [120, 318], [120, 172], [128, 150], [128, 134]];
const LOOP_R: Pt[] = LOOP_L.map(([x, y]) => [270 - x, y] as Pt);
const LL = plen(LOOP_L);
// ลวดไฟฟ้า
const WIRE: Pt[] = [[42, 358], [42, 152], [60, 152], [210, 152], [228, 152], [228, 358]];
const WL = plen(WIRE);

// เฟรนช์ฟรายส์ในตะแกรง
type Fry = { x: number; y: number; len: number; ang: number; s: number };
const mkFries = (n: number, y0: number, seed: number): Fry[] =>
  Array.from({ length: n }, (_, i) => ({
    x: 102 + rnd(i + seed) * 66,
    y: y0 + rnd(i + seed + 50) * (300 - y0),
    len: 22 + rnd(i + seed + 90) * 8,
    ang: (rnd(i + seed + 130) - 0.5) * 150,
    s: rnd(i + seed + 170),
  })).sort((a, b) => a.y - b.y);
const FRIES = mkFries(36, 236, 3);
const FRIES_CROWD = mkFries(70, 204, 11);
const fryCol = (br: number, s: number) => {
  const b = cl(br * 1.12 + (s - 0.5) * 0.16);
  return b < 0.55 ? mixc("#f4e293", "#e3a63f", b / 0.55) : mixc("#e3a63f", "#c9822c", (b - 0.55) / 0.45);
};
const fryEl = (f: Fry, br: number, halo = 0) =>
  `<g transform="translate(${f2(f.x)} ${f2(f.y)}) rotate(${f2(f.ang)})"><rect x="${f2(-f.len / 2)}" y="-3.3" width="${f2(f.len)}" height="6.6" rx="2.2" fill="${fryCol(br, f.s)}" stroke="${halo > 0.02 ? "#5db4ff" : "#8a5a1c"}" stroke-width="${halo > 0.02 ? f2(0.5 + 2.4 * halo) : 0.5}" stroke-opacity="${halo > 0.02 ? f2(0.35 + 0.65 * halo) : 0.6}"/><rect x="${f2(-f.len / 2 + 2)}" y="-2.5" width="${f2(f.len - 5)}" height="1.4" rx=".7" fill="#fff" opacity="${f2(0.28 - br * 0.12)}"/></g>`;

const txt = (x: number, y: number, s: string, size: number, fill = "#46526b", w = 800, anchor = "middle") =>
  `<text x="${x}" y="${y}" font-size="${size}" ${KA} font-weight="${w}" text-anchor="${anchor}" fill="${fill}">${s}</text>`;

// ---------- แว่นขยายผิวอาหาร ----------
const mag = (cue: string, p: number, ph: number, br: number): string => {
  const o: string[] = [];
  const cx = 135, cy = 206, R = 48;
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R + 3}" fill="#17102b" opacity=".35" filter="url(#bl)"/>`);
  o.push(`<clipPath id="afmag"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>`);
  o.push(`<g clip-path="url(#afmag)"><rect x="${cx - R}" y="${cy - R}" width="${R * 2}" height="${R * 2}" fill="#fdf6e3"/><g transform="translate(${cx} ${cy})">`);
  const slab = fryCol(Math.min(1, br + 0.05), 0.5);
  o.push(`<path d="M-50 14 Q-30 10 -10 13 T30 13 T50 12 V50 H-50Z" fill="${slab}" stroke="#8a5a1c" stroke-width=".8"/>`);
  for (let i = 0; i < 18; i++) o.push(`<circle cx="${f2(-44 + rnd(i) * 88)}" cy="${f2(20 + rnd(i + 9) * 24)}" r="${f2(0.8 + rnd(i + 3) * 1.2)}" fill="#fff" opacity=".22"/>`);
  if (cue === "dry") {
    const s = ease(cl((p - 0.12) / 0.62)); // 0 = ไอน้ำเคลือบ, 1 = ถูกพัดออก
    for (let i = 0; i < 18; i++) {
      const th = 0.06 + 0.8 * rnd(i + 40);
      const u = Math.max(0, s - th) * 1.7;
      const bx = -41 + i * 4.8 + (rnd(i + 5) - 0.5) * 2, by = 8 + rnd(i + 8) * 3 + Math.sin(ph * 3 + i) * 0.5;
      const x = bx + u * 80, y = by - u * 26 - (u > 0 ? Math.sin(u * 5) * 2 : 0), a = u > 0 ? Math.max(0, 1 - u * 0.9) : 1;
      o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="2.3" fill="#7cc4ff" stroke="#fff" stroke-width=".6" opacity="${f2(a)}"/>`);
    }
    // ลมกวาดผิว
    for (let k = 0; k < 3; k++) {
      const x = ((ph * 34 + k * 40) % 140) - 70;
      o.push(warrow(x, -4 - k * 11, "#ff8a3a", 0.85));
    }
    o.push(txt(0, -30, s < 0.5 ? "ไอน้ำเคลือบผิวอาหาร" : "ลมแรงพัดไอน้ำออก", 7.2, s < 0.5 ? "#2f7fc8" : "#c4521c", 900));
    o.push(txt(0, -22, s < 0.5 ? "ผิวแห้งช้า" : "ผิวแห้งและร้อนเร็วขึ้น", 6, "#46526b", 700));
  } else {
    // เมลลาร์ด: น้ำตาล + กรดอะมิโน → สีน้ำตาล + กลิ่น
    const t = ease(cl((p - 0.1) / 0.6));
    for (let k = 0; k < 6; k++) {
      const gx = -34 + k * 13.5, gy = 8;
      const sx0 = gx - 10 + (rnd(k + 60) - 0.5) * 20, sy0 = -12 - rnd(k + 70) * 10;
      const ax0 = gx + 10 + (rnd(k + 80) - 0.5) * 20, ay0 = -12 - rnd(k + 90) * 10;
      const tt = cl(t * 1.3 - rnd(k + 5) * 0.3);
      if (tt < 0.98) {
        const sx = lerp(sx0, gx - 2.5, tt) + Math.sin(ph * 4 + k) * 1.2, sy = lerp(sy0, gy, tt);
        const ax = lerp(ax0, gx + 2.5, tt) + Math.cos(ph * 4 + k) * 1.2, ay = lerp(ay0, gy, tt);
        o.push(`<path d="M${f2(sx + 3.6)} ${f2(sy)} l-1.8 3.1 h-3.6 l-1.8 -3.1 l1.8 -3.1 h3.6z" fill="#ffc2d6" stroke="#d6577f" stroke-width=".6"/>`);
        o.push(`<circle cx="${f2(ax)}" cy="${f2(ay)}" r="2.8" fill="#79aaff" stroke="#2f5fc8" stroke-width=".6"/>`);
      } else {
        const gr = 1 + 0.25 * Math.sin(ph * 6 + k);
        o.push(`<ellipse cx="${gx}" cy="${gy + 1}" rx="${f2(5.4 * gr)}" ry="${f2(3 * gr)}" fill="#8a4a16" opacity=".92"/><circle cx="${gx}" cy="${gy}" r="9" fill="#ffd27a" opacity="${f2(0.5 * Math.max(0, 1 - (tt - 0.98) * 14))}" filter="url(#bl)"/>`);
        // กลิ่นหอมลอยขึ้น
        const u = (ph * 0.5 + rnd(k + 20)) % 1;
        o.push(`<path d="M${f2(gx + Math.sin(u * 8) * 3)} ${f2(2 - u * 30)} q2 -3 0 -6 t0 -6" fill="none" stroke="#c4742c" stroke-width="1.2" stroke-linecap="round" opacity="${f2(Math.sin(Math.PI * u) * 0.7)}"/>`);
      }
    }
    // ลมร้อน
    for (let k = 0; k < 2; k++) o.push(warrow(((ph * 30 + k * 60) % 140) - 70, -14 + k * 8, "#ff8a3a", 0.45));
    o.push(`<path d="M-21 -29 l3.6 0 l1.8 3.1 l-1.8 3.1 h-3.6 l-1.8 -3.1z" fill="#ffc2d6" stroke="#d6577f" stroke-width=".6"/>`);
    o.push(txt(-15, -24, "น้ำตาล", 6, "#b53a66", 800, "start"));
    o.push(`<circle cx="11" cy="-26" r="2.8" fill="#79aaff" stroke="#2f5fc8" stroke-width=".6"/>`);
    o.push(txt(16, -24, "โปรตีน", 6, "#2f5fc8", 800, "start"));
    o.push(txt(0, 6 - 0, t > 0.85 ? "สีน้ำตาลทอง + กลิ่นหอม" : "", 6.6, "#6a3410", 900));
  }
  o.push(`</g></g>`);
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ffe14a" stroke-width="2.4"/><path d="M${cx + 33} ${cy + 35} l14 14" stroke="#ffe14a" stroke-width="4.5" stroke-linecap="round"/>`);
  return o.join("");
};

// ---------- การ์ดบนหัวภาพ ----------
const topCard = (cue: string, ph: number): string => {
  const o: string[] = [];
  if (cue === "all" || cue === "inside") {
    o.push(txt(135, 44, "หม้อทอดไร้น้ำมัน", 21, "#3a2a1a", 900));
    o.push(txt(135, 66, cue === "all" ? "ทำงานยังไงนะ?" : "จริงๆ คือเตาอบพัดลมลูกเล็ก", 11, "#8a4a1c", 800));
    if (cue === "all") for (let i = 0; i < 3; i++) o.push(txt(48 + i * 87, 28 + Math.sin(ph * 3 + i * 2) * 3, "?", 18, "#e0793a", 900));
  } else if (cue === "oil") {
    o.push(`<rect x="12" y="6" width="246" height="82" rx="10" fill="#fffaf0" stroke="#d6b97a" stroke-width="1.2"/><line x1="135" y1="12" x2="135" y2="80" stroke="#d6b97a" stroke-width="1" stroke-dasharray="3 3"/>`);
    // หม้อทอดน้ำมันท่วม
    o.push(`<path d="M34 32 H108 V70 Q108 74 104 74 H38 Q34 74 34 70Z" fill="#8e99b0" stroke="#46526b" stroke-width="1"/><path d="M36 37 H106 V70 Q106 72 104 72 H38 Q36 72 36 70Z" fill="#f2b630" opacity=".9"/>`);
    for (let i = 0; i < 5; i++) o.push(`<rect x="${f2(46 + i * 11)}" y="${f2(46 + Math.sin(ph * 3 + i) * 2)}" width="5" height="16" rx="2" fill="#e3a63f" stroke="#8a5a1c" stroke-width=".5" transform="rotate(${(i - 2) * 9} ${46 + i * 11} 54)"/>`);
    for (let i = 0; i < 6; i++) { const u = (ph * 0.8 + i / 6) % 1; o.push(`<circle cx="${f2(42 + i * 12)}" cy="${f2(70 - u * 30)}" r="1.4" fill="#fff" opacity="${f2(0.7 * (1 - u))}"/>`); }
    o.push(txt(71, 24, "ทอดแบบจุ่ม", 8.5, "#46526b", 900));
    o.push(txt(71, 84, "น้ำมันท่วมอาหาร", 7, "#b8741c", 800));
    // หม้อทอดไร้น้ำมัน: ทาบางๆ
    o.push(`<path d="M164 38 H234 V68 Q234 74 228 74 H170 Q164 74 164 68Z" fill="none" stroke="#46526b" stroke-width="1.4" stroke-dasharray="5 2.5"/>`);
    for (let i = 0; i < 5; i++) o.push(`<rect x="${f2(174 + i * 12)}" y="46" width="5" height="16" rx="2" fill="#e8b24a" stroke="#8a5a1c" stroke-width=".5" transform="rotate(${(i - 2) * 9} ${176 + i * 12} 54)"/><rect x="${f2(175 + i * 12)}" y="47" width="1.6" height="12" rx=".8" fill="#fff" opacity=".7" transform="rotate(${(i - 2) * 9} ${176 + i * 12} 54)"/>`);
    for (let i = 0; i < 3; i++) { const u = (ph * 0.6 + i / 3) % 1; o.push(`<path d="M${200 + i * 12} ${f2(30 + u * 18)} q-2.4 3.6 0 5 q2.4 -1.4 0 -5z" fill="#f2b630" stroke="#b8741c" stroke-width=".5" opacity="${f2(Math.sin(Math.PI * u))}"/>`); }
    o.push(txt(199, 24, "หม้อทอดไร้น้ำมัน", 8.5, "#46526b", 900));
    o.push(txt(199, 84, "ทาน้ำมันแค่บางๆ", 7, "#2e8b57", 800));
  } else if (cue === "fact") {
    o.push(`<rect x="12" y="8" width="246" height="78" rx="10" fill="#fffaf0" stroke="#d6b97a" stroke-width="1.2"/>`);
    o.push(txt(62, 52, "2010", 27, "#c4521c", 900));
    o.push(txt(62, 66, "เปิดตัวต้นแบบ", 7.5, "#46526b", 800));
    o.push(`<line x1="112" y1="16" x2="112" y2="78" stroke="#d6b97a" stroke-width="1"/>`);
    o.push(txt(120, 30, "งานแสดงสินค้า IFA", 9, "#3a2a1a", 900, "start"));
    o.push(txt(120, 44, "กรุงเบอร์ลิน เยอรมนี", 8, "#46526b", 700, "start"));
    o.push(txt(120, 62, "นักประดิษฐ์ชาวดัตช์", 8, "#46526b", 700, "start"));
    o.push(txt(120, 74, "Fred van der Weij", 8.5, "#8a4a1c", 900, "start"));
  } else if (cue === "end") {
    o.push(txt(135, 44, "ยังไงนะ", 26, "#3a2a1a", 900));
    o.push(txt(135, 66, "ติดตามไว้ ดูข้างในของใช้อีกหลายอย่าง", 9, "#8a4a1c", 800));
  } else if (cue === "tip") {
    o.push(`<rect x="22" y="14" width="226" height="66" rx="10" fill="#fffaf0" stroke="#d6b97a" stroke-width="1.2"/>`);
    o.push(txt(135, 36, "อย่าใส่อาหารแน่นตะแกรง", 12, "#c4521c", 900));
    o.push(txt(135, 54, "ใส่แน่น = บังทางลม", 9, "#46526b", 800));
    o.push(txt(135, 68, "สุกไม่เท่ากัน และไม่กรอบ", 9, "#46526b", 800));
  }
  return o.join("");
};

export const SCENE_AIRFRYER: SceneDef = {
  focus: {
    all: { cx: 135, cy: 240, z: 1.0 },
    inside: { cx: 135, cy: 245, z: 1.0, box: [34, 92, 202, 306], label: "เตาอบพัดลมขนาดเล็ก" },
    set: { cx: 135, cy: 340, z: 1.4, box: [46, 344, 178, 48], label: "ตั้งเวลา/อุณหภูมิ" },
    element: { cx: 135, cy: 215, z: 2.0, box: [56, 142, 158, 20], label: "ขดลวดความร้อนด้านบน" },
    fan: { cx: 135, cy: 175, z: 2.4, box: [100, 104, 70, 34], label: "พัดลมแรงสูง" },
    basket: { cx: 135, cy: 255, z: 1.7, box: [78, 186, 114, 140], label: "ตะแกรงรูพรุน ลมผ่านรอบด้าน" },
    dry: { cx: 135, cy: 235, z: 2.2 },
    maillard: { cx: 135, cy: 235, z: 2.2 },
    oil: { cx: 135, cy: 240, z: 1.0 },
    fact: { cx: 135, cy: 240, z: 1.0 },
    tip: { cx: 135, cy: 240, z: 1.0, box: [78, 186, 114, 140], label: "ใส่แน่น ลมผ่านไม่สะดวก" },
    end: { cx: 135, cy: 240, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = ST[cue] || ST.all;
    const e = ease(p);
    const g = (k: keyof S) => lerp(A[k], B[k], e);
    const glow = g("g"), fn = g("fn"), air = g("air"), br = g("br"), cr = g("cr");
    const o: string[] = [DEFS, EXTRA, room(430)];
    // เคาน์เตอร์
    o.push(`<rect x="-140" y="398" width="550" height="12" fill="url(#afTop)"/><rect x="-140" y="410" width="550" height="60" fill="url(#afCab)"/>`);
    o.push(`<ellipse cx="135" cy="399" rx="112" ry="5" fill="#1b1008" opacity=".4" filter="url(#bl)"/>`);
    o.push(topCard(cue, ph));

    // ตัวเครื่องภายนอก (หน้าตัด)
    o.push(`<g filter="url(#sh)"><path d="M34 120 Q34 92 62 92 H208 Q236 92 236 120 V386 Q236 398 224 398 H46 Q34 398 34 386Z" fill="url(#afBody)" stroke="#161b2c" stroke-width="1.4"/></g>`);
    o.push(`<path d="M40 122 Q40 98 62 98 H90" fill="none" stroke="#fff" stroke-width="1.6" opacity=".18" stroke-linecap="round"/>`);
    // ห้องทำอาหาร (ผนังด้านในโลหะ)
    o.push(`<rect x="50" y="104" width="170" height="232" rx="9" fill="url(#afCav)" stroke="#161b2c" stroke-width="1.6"/>`);
    // รัศมีความร้อน
    if (glow > 0.02) o.push(`<ellipse cx="135" cy="168" rx="92" ry="44" fill="url(#afHeat)" opacity="${f2(glow * 0.42)}"/>`);

    // ลวดไฟฟ้า (ในผนังตัวเครื่อง)
    o.push(`<path d="M${WIRE.map((q) => q.join(" ")).join(" L")}" fill="none" stroke="#2a3148" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M${WIRE.map((q) => q.join(" ")).join(" L")}" fill="none" stroke="#b8c0d4" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`);
    if (glow > 0.05) for (let i = 0; i < 16; i++) {
      const q = along(WIRE, (((ph * 40 * (0.4 + glow) + (i * WL) / 16) % WL) + WL) % WL);
      o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="1.5" fill="#ffe14a" opacity="${f2(Math.min(1, glow * 1.6))}"/><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="3.4" fill="#ffe14a" opacity="${f2(0.25 * glow)}"/>`);
    }

    // มอเตอร์ + พัดลม
    o.push(`<rect x="116" y="104" width="38" height="12" rx="3" fill="#6e7a93" stroke="#2b3350" stroke-width="1"/><rect x="121" y="107" width="28" height="2.4" rx="1.2" fill="#aab4c9"/>`);
    o.push(`<rect x="133" y="116" width="4" height="8" fill="#46526b"/>`);
    const spin = ph * (2 + 20 * fn);
    if (fn > 0.5) o.push(`<ellipse cx="135" cy="125" rx="30" ry="3.6" fill="#8e99b0" opacity="${f2(0.28 * fn)}"/>`);
    for (let k = 0; k < 3; k++) {
      const a = spin + (k * Math.PI * 2) / 3;
      const bx = Math.cos(a) * 28, d = Math.sin(a);
      o.push(`<g opacity="${f2(fn > 0.5 ? 0.78 : 1)}"><path d="M135 125 L${f2(135 + bx)} ${f2(125 + d * 1.4)}" stroke="#3a4560" stroke-width="4.4" stroke-linecap="round"/><path d="M135 124.2 L${f2(135 + bx)} ${f2(124.2 + d * 1.4)}" stroke="#aab4c9" stroke-width="1.2" stroke-linecap="round"/></g>`);
    }
    o.push(`<ellipse cx="135" cy="125" rx="4.4" ry="3.6" fill="#2b3350" stroke="#8e99b0" stroke-width=".8"/>`);

    // ขดลวดความร้อน
    let cd = "M60 152";
    for (let x = 62; x <= 210; x += 2) cd += ` L${x} ${f2(152 + 2.6 * Math.sin((x - 60) * 0.5))}`;
    const hc = mixc("#4a3a3a", "#ff4a14", glow);
    if (glow > 0.05) o.push(`<path d="${cd}" fill="none" stroke="#ff7a2a" stroke-width="9" opacity="${f2(0.42 * glow)}" filter="url(#bl)"/>`);
    o.push(`<path d="${cd}" fill="none" stroke="#2b1c1c" stroke-width="5.4" stroke-linecap="round"/><path d="${cd}" fill="none" stroke="${hc}" stroke-width="3.4" stroke-linecap="round"/>`);
    if (glow > 0.3) o.push(`<path d="${cd}" fill="none" stroke="#ffd27a" stroke-width="1" opacity="${f2(0.8 * (glow - 0.2) * (0.85 + 0.15 * Math.sin(ph * 10)))}"/>`);
    // ความร้อนแผ่รังสีลงมา
    if (glow > 0.5 && (cue === "element" || cue === "set")) for (let i = 0; i < 8; i++) {
      const u = (ph * 0.7 + i / 8) % 1, x = 76 + i * 17;
      o.push(`<path d="M${x} ${f2(160 + u * 40)} q3 -3 0 -6 t0 -6" fill="none" stroke="#ff8a3a" stroke-width="1.5" stroke-linecap="round" opacity="${f2(Math.sin(Math.PI * u) * 0.7 * glow)}"/>`);
    }

    // ตะแกรง (ลิ้นชัก) + ด้ามจับ
    o.push(`<rect x="188" y="196" width="50" height="5" fill="#2a3148" stroke="#161b2c" stroke-width=".6"/><rect x="236" y="190" width="20" height="18" rx="5" fill="#252d46" stroke="#0e1220" stroke-width="1"/><rect x="239" y="193" width="3" height="12" rx="1.5" fill="#fff" opacity=".2"/>`);
    // ขาตั้งตะแกรง
    o.push(`<rect x="90" y="312" width="5" height="12" fill="#6e7a93"/><rect x="175" y="312" width="5" height="12" fill="#6e7a93"/>`);
    // อาหาร
    const fr = cr > 0.5 ? FRIES_CROWD : FRIES;
    o.push(`<clipPath id="afbk"><rect x="86" y="${cr > 0.5 ? 196 : 200}" width="98" height="112"/></clipPath><g clip-path="url(#afbk)">`);
    const halo = cue === "dry" ? 1 - ease(cl((p - 0.12) / 0.62)) : 0;
    for (const f of fr) o.push(fryEl(f, br, halo));
    o.push(`</g>`);
    // ฟิล์มน้ำมันเงา
    if (cue === "basket") for (let i = 0; i < 14; i++) { const f = FRIES[i * 2]; const tw = 0.5 + 0.5 * Math.sin(ph * 4 + i); o.push(`<circle cx="${f2(f.x - 3)}" cy="${f2(f.y - 2)}" r="1.5" fill="#fff" opacity="${f2(0.8 * tw)}"/>`); }
    // ตัวตะแกรง: ผนังมีรู + ก้นมีรู
    o.push(`<path d="M83.5 188 V310" stroke="#252d46" stroke-width="3.4"/><path d="M186.5 188 V310" stroke="#252d46" stroke-width="3.4"/>`);
    o.push(`<path d="M83.5 188 V310" stroke="url(#afBask)" stroke-width="2.4" stroke-dasharray="6 3"/><path d="M186.5 188 V310" stroke="url(#afBask)" stroke-width="2.4" stroke-dasharray="6 3"/>`);
    o.push(`<rect x="81" y="308" width="108" height="5" fill="url(#afBask)" stroke="#252d46" stroke-width=".6"/>`);for (let i = 0; i < 16; i++) o.push(`<rect x="${f2(85 + i * 6.4)}" y="309" width="3" height="3" fill="#161b2c"/>`);
    o.push(`<rect x="79" y="186" width="112" height="3.4" rx="1.6" fill="#8e99b0" stroke="#252d46" stroke-width=".6"/>`);

    // ลมร้อนไหลวน
    if (air > 0.02) {
      const sp = 22 + 40 * fn;
      for (const [LP, off] of [[LOOP_L, 0], [LOOP_R, 0.5]] as [Pt[], number][]) {
        for (let i = 0; i < 26; i++) {
          const d = (((ph * sp + (i + off) * (LL / 26)) % LL) + LL) % LL;
          const q = along(LP, d), q2 = along(LP, Math.max(0, d - 7));
          const inFood = q[1] > 190 && q[1] < 312 && q[0] > 100 && q[0] < 170;
          let a = air * (cr > 0.5 && inFood ? 0.1 : 0.95);
          const hot = cl((d / LL) * 2.4);
          const col = mixc("#ff9a4a", "#ff3a10", cl(hot < 0.2 ? hot * 5 * 0.5 + 0.2 : 0.8));
          o.push(`<path d="M${f2(q2[0])} ${f2(q2[1])} L${f2(q[0])} ${f2(q[1])}" stroke="${col}" stroke-width="3.4" stroke-linecap="round" opacity="${f2(a * 0.55)}"/><g transform="translate(${f2(q[0])} ${f2(q[1])}) rotate(${f2((Math.atan2(q[1] - q2[1], q[0] - q2[0]) * 180) / Math.PI)})" opacity="${f2(a)}"><path d="M4.4 0 L-2.6 -3.6 L-1 0 L-2.6 3.6Z" fill="${col}" stroke="#fff" stroke-width=".7" stroke-linejoin="round"/></g>`);
        }
      }
      if (cr > 0.5) { o.push(`<g transform="translate(135 330)"><circle r="7" fill="#e0412a" stroke="#fff" stroke-width="1"/><path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>`); }
    }

    // แผงควบคุม
    o.push(`<rect x="44" y="344" width="182" height="48" rx="6" fill="#171c2e" stroke="#0e1220" stroke-width="1"/>`);
    const dial = (x: number, a: number) => `<circle cx="${x}" cy="364" r="12.5" fill="#2e3650" stroke="#8e99b0" stroke-width="1"/><circle cx="${x}" cy="364" r="9.5" fill="#46526b"/><g transform="translate(${x} 364) rotate(${f2(a)})"><rect x="-1.2" y="-9.5" width="2.4" height="7" rx="1.2" fill="#ffe14a"/></g>`;
    const da = cue === "set" ? lerp(-100, 40, e) : A.g > 0 || cue === "all" || cue === "inside" ? (cue === "all" || cue === "inside" ? -100 : 40) : 40;
    o.push(dial(68, da * 0.8) + dial(202, da));
    o.push(txt(68, 386, "เวลา", 6.4, "#cfd6e4", 700) + txt(202, 386, "อุณหภูมิ", 6.4, "#cfd6e4", 700));
    o.push(`<rect x="94" y="351" width="82" height="34" rx="4" fill="#0b1510" stroke="#2e3650"/>`);
    const lit = cue === "all" || cue === "inside" ? 0.18 : 1;
    o.push(`<g opacity="${lit}">${txt(135, 369, "200°C", 15, "#7dffb0", 900)}${txt(135, 381, (Math.floor(ph * 2) % 2 ? "12 00" : "12:00"), 8, "#7dffb0", 800)}</g>`);

    o.push(box(SCENE_AIRFRYER.focus[cue]?.box, ph));
    // แว่นขยาย
    if (cue === "dry" || cue === "maillard") o.push(mag(cue, p, ph, br));
    return o.join("");
  },
};
