// ฉากหลอดไฟ LED ผ่าครึ่ง (ไดรเวอร์ AC→DC, ชิป p-n junction, สารเรืองแสง, ฮีตซิงก์) — คืนสตริง SVG ภายในพิกัด 270x480
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, along, plen, tube, box } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const F = `font-family="Kanit, sans-serif"`;
const lbl = (x: number, y: number, t: string, size = 7, c = "#27324f", anchor = "middle") =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" ${F} font-weight="700" text-anchor="${anchor}" fill="${c}" stroke="#fff" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">${t}</text>`;
const txt = (x: number, y: number, t: string, size = 8, c = "#fff", anchor = "middle", w = 700) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" ${F} font-weight="${w}" text-anchor="${anchor}" fill="${c}">${t}</text>`;

const EXTRA = `<defs>
<linearGradient id="lgBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2342"/><stop offset="1" stop-color="#2d3a62"/></linearGradient>
<linearGradient id="lgHs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8793ab"/><stop offset=".3" stop-color="#e4e9f2"/><stop offset=".6" stop-color="#a7b2c7"/><stop offset="1" stop-color="#65718a"/></linearGradient>
<linearGradient id="lgDome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".62"/><stop offset=".5" stop-color="#fff6d6" stop-opacity=".22"/><stop offset="1" stop-color="#ffffff" stop-opacity=".42"/></linearGradient>
<radialGradient id="lgInner" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fffef2" stop-opacity=".97"/><stop offset=".6" stop-color="#fff0b8" stop-opacity=".8"/><stop offset="1" stop-color="#ffd878" stop-opacity=".5"/></radialGradient>
<radialGradient id="lgGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7cc" stop-opacity=".8"/><stop offset=".45" stop-color="#ffe9a0" stop-opacity=".3"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>
<linearGradient id="lgHeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a1a" stop-opacity=".7"/><stop offset="1" stop-color="#ff9a3a" stop-opacity=".05"/></linearGradient>
<radialGradient id="lgHot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff5a1a" stop-opacity=".85"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient>
<clipPath id="lgHsClip"><path d="M96 154 L174 154 L162 250 L108 250 Z"/></clipPath>
<clipPath id="lgMixB"><circle cx="128" cy="192" r="12"/></clipPath>
</defs>`;

// ---------- รูปทรง ----------
const xL = (y: number) => lerp(96, 108, (y - 154) / 96);
const xR = (y: number) => lerp(174, 162, (y - 154) / 96);
const BLUE = "#4aa8ff", YEL = "#ffd23a", HOT = "#ff6a2a";
const eDot = (p: Pt, r = 1.8, a = 1) => `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(r * 2.2)}" fill="${BLUE}" opacity="${f2(0.25 * a)}"/><circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${r}" fill="${BLUE}" stroke="#1f3f8e" stroke-width=".5" opacity="${f2(a)}"/>`;
const photon = (x: number, y: number, c: string, a = 1, s = 1) =>
  `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y - 2)}" r="${f2(5 * s)}" fill="${c}" opacity=".28"/><path d="M${f2(x)} ${f2(y + 6 * s)} q${f2(2.6 * s)} ${f2(-2.2 * s)} 0 ${f2(-4.4 * s)} t0 ${f2(-4.4 * s)}" fill="none" stroke="${c}" stroke-width="${f2(1.7 * s)}" stroke-linecap="round"/><circle cx="${f2(x)}" cy="${f2(y - 3.2 * s)}" r="${f2(1.5 * s)}" fill="#fff"/></g>`;

// เส้นลวดในหลอด
const WA: Pt[] = [[119, 288], [119, 266], [124, 266], [124, 238]]; // ไฟบ้านเส้น A
const WB: Pt[] = [[135, 309], [135, 262], [146, 262], [146, 238]]; // ไฟบ้านเส้น B (ปลายฐาน)
const WC: Pt[] = [[122, 178], [122, 150]]; // ออกจากไดรเวอร์ไปชิป (ไฟตรง)
const WD: Pt[] = [[148, 150], [148, 178]]; // วนกลับไดรเวอร์
const PKG = [117, 135, 153];

const driverBoard = () => {
  const o: string[] = [];
  o.push(`<rect x="118" y="178" width="34" height="58" rx="2" fill="#2f7d57" stroke="#1b4d36" stroke-width=".8"/>`);
  o.push(`<path d="M122 232 V218 H132 M148 232 V222 M126 182 H140 M130 204 H146" stroke="#9fe3b8" stroke-width=".6" fill="none" opacity=".75"/>`);
  // ตัวเก็บประจุ
  o.push(`<rect x="121" y="183" width="10" height="21" rx="2" fill="#2a5db0" stroke="#173a77" stroke-width=".6"/><rect x="121" y="183" width="10" height="3" rx="1.5" fill="#c9d3e6"/><rect x="122.5" y="187" width="2" height="15" fill="#fff" opacity=".55"/>`);
  // ไอซี
  o.push(`<rect x="134" y="184" width="15" height="9" rx="1" fill="#1b2238" stroke="#0b1226" stroke-width=".5"/>` + Array.from({ length: 4 }, (_, k) => `<rect x="${135 + k * 3.5}" y="182.2" width="1.4" height="2" fill="#c8ccd8"/><rect x="${135 + k * 3.5}" y="192.8" width="1.4" height="2" fill="#c8ccd8"/>`).join(""));
  // ตัวเหนี่ยวนำ (ขดลวดบนแกนเฟอร์ไรต์)
  o.push(`<circle cx="142" cy="210" r="7.5" fill="#7a5238" stroke="#4a2f1e" stroke-width=".7"/>` + Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return `<line x1="${f2(142 + Math.cos(a) * 4)}" y1="${f2(210 + Math.sin(a) * 4)}" x2="${f2(142 + Math.cos(a) * 7.5)}" y2="${f2(210 + Math.sin(a) * 7.5)}" stroke="#e0a85a" stroke-width="1.1"/>`; }).join("") + `<circle cx="142" cy="210" r="2.6" fill="#2f7d57"/>`);
  // ตัวต้านทาน / ตัวเก็บประจุเล็ก
  o.push(`<rect x="122" y="209" width="6" height="12" rx="1.5" fill="#222a40"/><rect x="122" y="212" width="6" height="2" fill="#d8b24a"/>`);
  o.push(`<rect x="123" y="224" width="9" height="3.6" rx="1.5" fill="#e6d6a8" stroke="#8a7a4a" stroke-width=".4"/><rect x="136" y="224" width="9" height="3.6" rx="1.5" fill="#e6d6a8" stroke="#8a7a4a" stroke-width=".4"/><rect x="146" y="226" width="4" height="7" rx="1" fill="#1b2238"/>`);
  return o.join("");
};

type Opt = { ph: number; cue: string; p: number };
const bulb = ({ ph, cue, p }: Opt) => {
  const o: string[] = [];
  const heatOn = cue === "heat" ? 1 : cue === "tip" ? 1 : 0;
  const pulse = 0.85 + 0.15 * Math.sin(ph * 5);
  // แสงเรือง
  o.push(`<circle cx="135" cy="85" r="128" fill="url(#lgGlow)" opacity="${f2(0.75 * pulse)}"/>`);
  // ---------- ฮีตซิงก์ ----------
  o.push(`<path d="M96 154 L174 154 L162 250 L108 250 Z" fill="url(#lgHs)" stroke="#2b3350" stroke-width="1.2"/>`);
  for (let k = 0; k < 8; k++) {
    const y = 166 + k * 11;
    o.push(`<rect x="${f2(xL(y) - 7)}" y="${y}" width="8" height="4.2" rx="1.6" fill="url(#lgHs)" stroke="#2b3350" stroke-width=".7"/><rect x="${f2(xR(y) - 1)}" y="${y}" width="8" height="4.2" rx="1.6" fill="url(#lgHs)" stroke="#2b3350" stroke-width=".7"/>`);
  }
  // โพรงด้านใน (ผ่าครึ่ง)
  o.push(`<path d="M105 160 L165 160 L153 246 L117 246 Z" fill="#1b2238" stroke="#0b1226" stroke-width=".8"/>`);
  o.push(driverBoard());
  // ความร้อนไล่สีบนฮีตซิงก์
  if (heatOn) o.push(`<g clip-path="url(#lgHsClip)"><rect x="80" y="154" width="110" height="96" fill="url(#lgHeat)" opacity="${f2(0.9 * (cue === "heat" ? ease(cl(p * 3)) : 1))}"/></g>`);
  // ---------- ฐานเกลียว ----------
  o.push(`<rect x="108" y="250" width="54" height="8" rx="2" fill="#eef2f8" stroke="#8e99b0" stroke-width=".9"/>`);
  o.push(`<path d="M112 258 H158 V300 H112 Z" fill="url(#lgHs)" stroke="#2b3350" stroke-width="1"/>`);
  o.push(`<rect x="119" y="259" width="32" height="40" fill="#1b2238"/>`);
  for (let k = 0; k < 5; k++) {
    const y = 262 + k * 8;
    o.push(`<path d="M112 ${y + 4} L119 ${y}" stroke="#2b3350" stroke-width="1.3"/><path d="M151 ${y} L158 ${y + 4}" stroke="#2b3350" stroke-width="1.3"/>`);
  }
  o.push(`<path d="M121 300 L149 300 L144 307 L126 307 Z" fill="#2b3350"/><ellipse cx="135" cy="309" rx="8" ry="3.6" fill="url(#lgHs)" stroke="#2b3350" stroke-width=".9"/>`);
  // ---------- เส้นลวด + อิเล็กตรอน ----------
  for (const w of [WA, WB]) o.push(tube(w, 1.8, "#e0a24a", "#ffe9b8", 2));
  for (const w of [WC, WD]) o.push(tube(w, 1.8, "#4fbf7a", "#c9ffd9", 1));
  // ไฟสลับ: อิเล็กตรอนแกว่งไปมา
  const swing = Math.sin(ph * Math.PI * 2 * 0.9) * 7;
  for (const w of [WA, WB]) {
    const L = plen(w);
    const sgn = w === WA ? 1 : -1;
    for (let k = 0; k < 4; k++) o.push(eDot(along(w, cl(L * (0.12 + k * 0.22) + swing * sgn, 1, L - 1)), 1.7));
  }
  // ไฟตรง: อิเล็กตรอนไหลทางเดียว (ออกจากขั้วลบของไดรเวอร์ → ชิป → กลับขั้วบวก)
  const Lc = plen(WC);
  for (let k = 0; k < 4; k++) {
    o.push(eDot(along(WC, ((ph * 16 + k * (Lc / 4)) % Lc)), 1.7));
    o.push(eDot(along(WD, ((ph * 16 + k * (Lc / 4)) % Lc)), 1.7));
  }
  // ---------- แผงชิป + แพ็กเกจ LED ----------
  o.push(`<rect x="104" y="147" width="62" height="7" rx="1.5" fill="#eef2f8" stroke="#8e99b0" stroke-width=".8"/>`);
  const hotA = heatOn ? (cue === "heat" ? ease(cl(p * 2.5)) : 1) : 0;
  if (hotA > 0.01) o.push(`<ellipse cx="135" cy="148" rx="46" ry="14" fill="url(#lgHot)" opacity="${f2(hotA * (0.75 + 0.25 * Math.sin(ph * 6)))}"/>`);
  o.push(`<path d="M98 154 C66 134 62 104 68 76 C74 38 106 18 135 18 C164 18 196 38 202 76 C208 104 204 134 172 154 Z" fill="url(#lgInner)" opacity="${f2(0.9 * pulse)}"/>`);
  for (const x of PKG) {
    o.push(`<rect x="${x - 7}" y="141.5" width="14" height="5.5" rx="1.2" fill="#f1efe6" stroke="#8a8272" stroke-width=".5"/>`);
    o.push(`<rect x="${x - 3.2}" y="142.6" width="6.4" height="3" rx=".6" fill="#2f6bff" stroke="#1432a8" stroke-width=".4"/>`);
    o.push(`<path d="M${x - 6.6} 142.4 Q${x - 6} 134.6 ${x} 134.4 Q${x + 6} 134.6 ${x + 6.6} 142.4 Z" fill="${YEL}" opacity=".82" stroke="#d9a400" stroke-width=".5"/>`);
  }
  // ---------- โดมแก้ว/พลาสติกกระจายแสง ----------
  const dome = `M98 154 C66 134 62 104 68 76 C74 38 106 18 135 18 C164 18 196 38 202 76 C208 104 204 134 172 154 Z`;
  o.push(`<path d="${dome}" fill="url(#lgDome)" stroke="#9fb4d0" stroke-width="1.6"/>`);
  o.push(`<path d="M82 100 C80 70 94 44 120 32" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`);
  // แสงออกจากโดม
  for (let k = 0; k < 9; k++) {
    const a = (-Math.PI * 0.95) + (k / 8) * Math.PI * 0.9;
    const u = (ph * 0.8 + k * 0.37) % 1;
    const r0 = 66, r1 = 100;
    const rr = lerp(r0, r1, u);
    o.push(`<circle cx="${f2(135 + Math.cos(a) * rr)}" cy="${f2(85 + Math.sin(a) * rr * 1.05)}" r="1.6" fill="#fff6c4" opacity="${f2(0.9 * (1 - u))}"/>`);
  }
  return o.join("");
};

// ---------- ป้ายหมายเลขส่วนประกอบ ----------
const tag = (n: number, x: number, y: number, tx: number, ty: number, t: string, anchor: string) =>
  `<line x1="${tx}" y1="${ty}" x2="${x}" y2="${y}" stroke="#ffe14a" stroke-width="1" stroke-dasharray="2 1.6"/><circle cx="${x}" cy="${y}" r="2.2" fill="#ffe14a"/>` +
  `<circle cx="${anchor === "end" ? tx - 4 : tx + 4}" cy="${ty - 2.3}" r="5" fill="#27324f" stroke="#ffe14a" stroke-width="1"/>${txt(anchor === "end" ? tx - 4 : tx + 4, ty, String(n), 7, "#ffe14a")}` +
  lbl(anchor === "end" ? tx - 11 : tx + 11, ty, t, 7.5, "#27324f", anchor);

// ---------- แผงขยายเต็มจอ ----------
const cardWrap = (a: number, title: string, inner: string) =>
  `<g opacity="${f2(a)}"><rect x="6" y="130" width="258" height="290" rx="12" fill="#141b30" stroke="#ffe14a" stroke-width="1.5"/>${txt(135, 150, title, 9.5, "#ffe14a")}${inner}</g>`;

const electron = (x: number, y: number, a = 1) => `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="3.4" fill="${BLUE}" stroke="#1f3f8e" stroke-width=".7"/><rect x="${f2(x - 1.7)}" y="${f2(y - 0.35)}" width="3.4" height=".8" fill="#fff"/></g>`;
const hole = (x: number, y: number, a = 1) => `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="3.4" fill="#141b30" stroke="#ff8a5a" stroke-width="1.3"/><rect x="${f2(x - 1.7)}" y="${f2(y - 0.35)}" width="3.4" height=".8" fill="#ff8a5a"/><rect x="${f2(x - 0.4)}" y="${f2(y - 1.7)}" width=".8" height="3.4" fill="#ff8a5a"/></g>`;

const cardJunction = (ph: number, cue: string, p: number) => {
  const v = cue === "photon" ? cl(p * 5) : 0;
  const o: string[] = [];
  // บล็อก n / p
  o.push(`<rect x="22" y="240" width="113" height="90" fill="#3f72d9" opacity=".3" stroke="#6fa0ff" stroke-width="1"/>`);
  o.push(`<rect x="135" y="240" width="113" height="90" fill="#e24b4b" opacity=".28" stroke="#ff8a8a" stroke-width="1"/>`);
  o.push(`<rect x="129" y="240" width="12" height="90" fill="#fff" opacity=".1"/><line x1="135" y1="240" x2="135" y2="330" stroke="#fff" stroke-width=".8" stroke-dasharray="3 2.5" opacity=".7"/>`);
  o.push(txt(36, 262, "n", 18, "#9fc2ff", "middle", 800) + txt(234, 262, "p", 18, "#ffb0b0", "middle", 800));
  o.push(`<rect x="17" y="258" width="5" height="64" rx="1.5" fill="#aab5ca"/><rect x="248" y="258" width="5" height="64" rx="1.5" fill="#aab5ca"/>`);
  // พาหะสำรอง (เคลื่อนที่ไปมาแบบสุ่ม)
  for (let i = 0; i < 12; i++) {
    const x = 30 + rnd(i + 1) * 92 + Math.sin(ph * 2.1 + i * 1.7) * 2.4, y = 246 + rnd(i + 30) * 78 + Math.cos(ph * 1.7 + i * 2.3) * 2.4;
    o.push(electron(x, y, 0.5));
    const x2 = 148 + rnd(i + 60) * 92 + Math.sin(ph * 2.3 + i * 1.3) * 2.4, y2 = 246 + rnd(i + 90) * 78 + Math.cos(ph * 1.9 + i * 2.9) * 2.4;
    o.push(hole(x2, y2, 0.5));
  }
  // คู่ที่ถูกดันเข้าหากัน แล้วรวมกัน ปล่อยโฟตอน
  const N = 6;
  if (v > 0.01) for (let i = 0; i < N; i++) {
    const ye = 256 + rnd(i + 5) * 62, xe0 = 30 + rnd(i + 11) * 62, xh0 = 178 + rnd(i + 17) * 62;
    const u = (ph * 0.5 + i / N) % 1;
    if (u < 0.6) {
      const s = ease(u / 0.6), fi = cl(u * 8);
      o.push(electron(lerp(xe0, 131.5, s), ye, fi * v));
      o.push(hole(lerp(xh0, 138.5, s), ye, fi * v));
    } else {
      const t = (u - 0.6) / 0.4;
      if (t < 0.22) { const r = 3 + t * 60; o.push(`<circle cx="135" cy="${f2(ye)}" r="${f2(r)}" fill="#cfe8ff" opacity="${f2((1 - t / 0.22) * 0.6 * v)}"/>`); }
      const y = lerp(ye, 172, ease(t));
      o.push(photon(135 + Math.sin(i * 2 + t * 3) * 3, y, BLUE, cl((1 - t) * 3) * v, 1.1));
    }
  }
  // วงจรภายนอก
  const nP: Pt[] = [[100, 377], [12, 377], [12, 290], [17, 290]];
  const pP: Pt[] = [[253, 290], [258, 290], [258, 377], [170, 377]];
  o.push(`<path d="${H.rpath(nP, 4)}" fill="none" stroke="#8a93ad" stroke-width="2"/><path d="${H.rpath(pP, 4)}" fill="none" stroke="#8a93ad" stroke-width="2"/>`);
  o.push(`<rect x="100" y="366" width="70" height="22" rx="5" fill="#27324f" stroke="#4fbf7a" stroke-width="1.2"/>${txt(135, 380.5, "ไฟตรง (DC)", 8.5, "#9dffc0")}`);
  o.push(txt(93, 380, "−", 11, BLUE, "end", 900) + txt(177, 380, "+", 11, "#ff8a5a", "start", 900));
  if (v > 0.01) for (const [pp, dn] of [[nP, 0], [pP, 1]] as [Pt[], number][]) {
    const L = plen(pp);
    for (let k = 0; k < 6; k++) o.push(eDot(along(pp, (ph * 22 + k * (L / 6)) % L), 2, v));
    void dn;
  }
  // ป้ายชื่อ
  o.push(txt(78, 344, "ด้าน n (มีอิเล็กตรอนมาก)", 7.5, "#9fc2ff") + txt(192, 344, "ด้าน p (มีที่ว่าง เรียกว่าโฮล)", 7.5, "#ffb0b0"));
  o.push(txt(135, 160, "ชิป LED = สารกึ่งตัวนำสองชนิดต่อกัน", 7.5, "#cfd8ee", "middle", 500));
  if (cue === "photon") o.push(txt(196, 196, "โฟตอน = อนุภาคแสง", 7.5, "#9fd2ff") + `<path d="M180 199 L146 214" stroke="#9fd2ff" stroke-width=".9" stroke-dasharray="2 2"/>`);
  // คำอธิบายสัญลักษณ์
  o.push(electron(60, 406) + txt(67, 408.5, "อิเล็กตรอน (−)", 7.5, "#cfd8ee", "start", 500) + hole(160, 406) + txt(167, 408.5, "โฮล (+)", 7.5, "#cfd8ee", "start", 500));
  return o.join("");
};

const cardPhosphor = (ph: number) => {
  const o: string[] = [];
  const LY0 = 250, LY1 = 318;
  // โครงแพ็กเกจ
  o.push(`<rect x="30" y="${LY0}" width="8" height="98" rx="2" fill="#aab5ca"/><rect x="232" y="${LY0}" width="8" height="98" rx="2" fill="#aab5ca"/><rect x="30" y="338" width="210" height="14" rx="3" fill="#e8e6dc" stroke="#8a8272" stroke-width=".8"/>`);
  // ชั้นสารเรืองแสง
  o.push(`<rect x="38" y="${LY0}" width="194" height="${LY1 - LY0}" fill="#ffd23a" opacity=".16" stroke="#ffd23a" stroke-width="1" stroke-dasharray="4 2.5"/>`);
  for (let i = 0; i < 30; i++) o.push(`<circle cx="${f2(44 + rnd(i + 200) * 182)}" cy="${f2(LY0 + 4 + rnd(i + 230) * (LY1 - LY0 - 8))}" r="1.7" fill="#ffd23a" stroke="#b58a00" stroke-width=".5"/>`);
  // ชิปน้ำเงิน
  o.push(`<rect x="86" y="${LY1}" width="98" height="20" rx="2" fill="#2f6bff" stroke="#1432a8" stroke-width="1"/>${txt(135, 332, "ชิปสีน้ำเงิน", 8.5, "#fff")}`);
  // โฟตอน
  const N = 22;
  for (let i = 0; i < N; i++) {
    const x0 = 92 + rnd(i + 3) * 86;
    const spd = 0.34 + rnd(i + 40) * 0.1;
    const u = (ph * spd + rnd(i + 7)) % 1;
    const yTop = 214, yBot = LY1 - 1;
    const y = lerp(yBot, yTop, u);
    const conv = rnd(i + 20) < 0.55;
    const yc = 262 + rnd(i + 21) * 40;
    const dx = (rnd(i + 22) - 0.5) * 70;
    let x = x0, c = BLUE;
    if (conv && y < yc) { x = x0 + dx * ((yc - y) / (yc - yTop)); c = YEL; }
    else if (!conv && y < LY1) x = x0 + Math.sin(i * 3 + u * 6) * 2;
    const a = cl((y - yTop) / 14);
    o.push(photon(x, y, c, cl(Math.min(a, 1)), 1));
    if (conv && Math.abs(y - yc) < 5) o.push(`<circle cx="${f2(x0)}" cy="${f2(yc)}" r="${f2(5 - Math.abs(y - yc))}" fill="#fff" opacity=".8"/>`);
  }
  o.push(`<text x="135" y="262" font-size="8" ${F} font-weight="700" text-anchor="middle" fill="#ffe27a" stroke="#141b30" stroke-width="2.4" paint-order="stroke">สารเรืองแสงสีเหลือง</text>`);
  // ผสมเป็นสีขาว
  o.push(`<circle cx="128" cy="192" r="12" fill="${BLUE}" opacity=".9"/><circle cx="142" cy="192" r="12" fill="${YEL}" opacity=".9"/><circle cx="142" cy="192" r="12" fill="#fff" clip-path="url(#lgMixB)"/>`);
  o.push(`<circle cx="135" cy="192" r="30" fill="url(#lgGlow)" opacity="${f2(0.7 + 0.2 * Math.sin(ph * 4))}"/>`);
  o.push(txt(135, 172, "น้ำเงิน + เหลือง = ตาเห็นเป็นสีขาว", 8, "#fff"));
  o.push(txt(135, 372, "แสงน้ำเงินบางส่วนถูกดูดแล้วปล่อยเป็นสีเหลือง", 7.5, "#cfd8ee", "middle", 500));
  o.push(txt(135, 384, "ส่วนที่เหลือทะลุผ่านออกมาเป็นสีน้ำเงิน", 7.5, "#cfd8ee", "middle", 500));
  return o.join("");
};

const cardFact = (ph: number, p: number) => {
  const o: string[] = [];
  const t1 = ease(cl(p / 0.55)); // แถบ 30 ปีเต็ม
  const t2 = ease(cl((p - 0.55) / 0.2)); // เปิดไฟขาว
  const cx = [58, 135, 212];
  const cols = ["#ff4a4a", "#3fd16a", "#3f8cff"];
  const names = ["แดง", "เขียว", "น้ำเงิน"];
  cx.forEach((x, i) => {
    const on = i < 2 ? 1 : cl(0.25 + t2 * 0.75);
    o.push(`<circle cx="${x}" cy="196" r="${i === 2 ? 30 + 4 * t2 : 24}" fill="${cols[i]}" opacity="${f2(0.16 * on + 0.1)}"/>`);
    o.push(`<circle cx="${x}" cy="196" r="20" fill="${cols[i]}" opacity="${f2(i < 2 ? 1 : 0.28 + 0.72 * t2)}" stroke="#fff" stroke-width="1.2"/>`);
    o.push(txt(x, 232, names[i], 9, "#fff"));
  });
  o.push(txt(58, 246, "มีมานานแล้ว", 7.5, "#cfd8ee", "middle", 500) + txt(135, 246, "มีมานานแล้ว", 7.5, "#cfd8ee", "middle", 500));
  o.push(txt(212, 246, "ท้าทายราว 30 ปี", 7.5, "#9fc2ff", "middle", 600));
  // แถบเวลา
  o.push(`<rect x="22" y="262" width="226" height="9" rx="4.5" fill="#27324f" stroke="#4b5878" stroke-width=".8"/><rect x="23" y="263" width="${f2(224 * t1)}" height="7" rx="3.5" fill="#3f8cff"/>`);
  o.push(txt(135, 284, "นักวิจัยพยายามทำ LED สีน้ำเงินอยู่ราวสามทศวรรษ", 7.5, "#cfd8ee", "middle", 500));
  // ขาวไม่ได้ / ได้
  const noA = 1 - t2;
  o.push(`<g opacity="${f2(noA)}"><circle cx="135" cy="320" r="13" fill="#27324f" stroke="#7d8394" stroke-width="1"/><path d="M127 312 L143 328 M143 312 L127 328" stroke="#ff6a6a" stroke-width="2.2" stroke-linecap="round"/>${txt(135, 348, "ไม่มีน้ำเงิน → ทำหลอดสีขาวไม่ได้", 8.5, "#ffb0b0")}</g>`);
  o.push(`<g opacity="${f2(t2)}"><circle cx="135" cy="320" r="${f2(13 + 4 * Math.sin(ph * 5))}" fill="#fff" opacity=".35"/><circle cx="135" cy="320" r="12" fill="#fff"/>${txt(135, 348, "มีน้ำเงิน → ทำหลอดสีขาวได้", 8.5, "#fffbe0")}</g>`);
  // เหรียญโนเบล
  const ba = cl((p - 0.7) / 0.2);
  o.push(`<g opacity="${f2(ba)}"><rect x="28" y="360" width="214" height="50" rx="8" fill="#27324f" stroke="#ffd23a" stroke-width="1.2"/><circle cx="52" cy="385" r="12" fill="#ffd23a" stroke="#b58a00" stroke-width="1.2"/><circle cx="52" cy="385" r="7.5" fill="none" stroke="#b58a00" stroke-width=".9"/>${txt(70, 380, "รางวัลโนเบลสาขาฟิสิกส์ ค.ศ. 2014", 8, "#ffe27a", "start")}${txt(70, 392, "Akasaki · Amano · Nakamura", 7.5, "#cfd8ee", "start", 500)}${txt(70, 403, "จาก LED สีน้ำเงินที่สว่างและประหยัดไฟ", 6.8, "#cfd8ee", "start", 500)}</g>`);
  return o.join("");
};

const scopeBox = (x: number, y: number, w: number, h: number, title: string, c: string, kind: "ac" | "dc", ph: number) => {
  const o: string[] = [];
  o.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3.5" fill="#101830" stroke="#4b5878" stroke-width="1"/>`);
  o.push(`<line x1="${x + 2}" y1="${y + h / 2}" x2="${x + w - 2}" y2="${y + h / 2}" stroke="#4b5878" stroke-width=".5" stroke-dasharray="2 2"/>`);
  let d = "";
  const A = h * 0.36;
  for (let i = 0; i <= 40; i++) {
    const xx = x + 3 + (i / 40) * (w - 6);
    const t = (i / 40) * 2.0 - ph * 0.9; // สองคาบบนจอ
    const s = Math.sin(t * Math.PI * 2);
    const yy = kind === "ac" ? y + h / 2 - s * A : y + h / 2 - A * 0.78 + Math.sin(t * Math.PI * 8) * 0.25;
    d += `${i ? "L" : "M"}${f2(xx)} ${f2(yy)} `;
  }
  o.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/>`);
  o.push(lbl(x + w / 2, y - 3.5, title, 7, "#27324f"));
  return o.join("");
};

const heatBar = (p: number) => {
  const a = ease(cl(p * 3));
  const x = 40, w = 190, y = 338;
  const wl = w * 0.25 * a, wh = w * 0.75 * a;
  return `<g opacity="${f2(cl(p * 6))}"><rect x="${x - 3}" y="${y - 22}" width="${w + 6}" height="52" rx="7" fill="#141b30" opacity=".92" stroke="#ffe14a" stroke-width="1"/>${txt(135, y - 9, "ไฟฟ้าที่หลอด LED ใช้ไป ไปเป็นอะไร?", 7.8, "#fff")}` +
    `<rect x="${x}" y="${y}" width="${f2(wl)}" height="14" fill="${YEL}"/><rect x="${f2(x + wl)}" y="${y}" width="${f2(wh)}" height="14" fill="${HOT}"/><rect x="${x}" y="${y}" width="${w}" height="14" fill="none" stroke="#fff" stroke-width=".8" rx="2"/>` +
    `${txt(x + w * 0.125, y + 10.5, "แสง", 7.5, "#27324f")}${txt(x + w * 0.625, y + 10.5, "ความร้อน", 7.5, "#fff")}${txt(135, y + 25, "ราวหนึ่งในสี่ เป็นแสง · ราวสามในสี่ เป็นความร้อน", 6.8, "#cfd8ee", "middle", 500)}</g>`;
};

export const SCENE_LED: SceneDef = {
  focus: {
    all: { cx: 135, cy: 165, z: 1.45 },
    parts: { cx: 135, cy: 165, z: 1.45 },
    driver: { cx: 135, cy: 212, z: 1.35, box: [110, 160, 56, 90], label: "ไดรเวอร์แปลงไฟ" },
    junction: { cx: 135, cy: 275, z: 1.0 },
    photon: { cx: 135, cy: 275, z: 1.0 },
    phosphor: { cx: 135, cy: 275, z: 1.0 },
    heat: { cx: 135, cy: 205, z: 1.3, box: [86, 154, 98, 98], label: "ฮีตซิงก์ระบายความร้อน" },
    fact: { cx: 135, cy: 275, z: 1.0 },
    tip: { cx: 135, cy: 185, z: 1.15 },
    end: { cx: 135, cy: 180, z: 1.3 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const o: string[] = [H.DEFS, EXTRA];
    o.push(`<rect x="-140" y="-140" width="550" height="800" fill="url(#lgBg)"/>`);
    for (let i = 0; i < 40; i++) o.push(`<circle cx="${f2(-100 + rnd(i) * 470)}" cy="${f2(-100 + rnd(i + 99) * 640)}" r="${f2(0.5 + rnd(i + 5) * 0.9)}" fill="#fff" opacity="${f2(0.08 + rnd(i + 8) * 0.12)}"/>`);
    const isCard = cue === "junction" || cue === "photon" || cue === "phosphor" || cue === "fact";
    const ca = isCard ? cl(p * 10) : 0;
    o.push(`<g opacity="${f2(1 - 0.9 * ca)}">${bulb({ ph, cue, p })}`);
    // ป้ายหมายเลข
    if (cue === "parts") {
      o.push(tag(1, 119, 226, 48, 284, "ไดรเวอร์", "start"));
      o.push(tag(2, 143, 144, 182, 166, "ชิป LED", "start"));
      o.push(tag(3, 128, 137, 85, 108, "สารเรืองแสง", "start"));
      o.push(tag(4, 172, 215, 182, 232, "ฮีตซิงก์", "start"));
    }
    if (cue === "driver") {
      o.push(scopeBox(44, 266, 60, 34, "ไฟบ้าน (ไฟสลับ AC)", "#ffb04a", "ac", ph));
      o.push(`<path d="M104 283 L119 285" stroke="#ffb04a" stroke-width=".9" stroke-dasharray="2 1.6"/>`);
      o.push(scopeBox(181, 176, 52, 34, "ไฟตรง (DC)", "#6dffa0", "dc", ph));
      o.push(`<path d="M181 192 L150 168" stroke="#6dffa0" stroke-width=".9" stroke-dasharray="2 1.6"/>`);
    }
    if (cue === "heat") {
      // จุดความร้อนไหลลงตามผนัง แล้วออกทางครีบ
      for (let side = 0; side < 2; side++) {
        const pts: Pt[] = side === 0 ? [[xL(156) + 3, 156], [xL(246) + 3, 246]] : [[xR(156) - 3, 156], [xR(246) - 3, 246]];
        const L = plen(pts);
        for (let k = 0; k < 6; k++) {
          const u = ((ph * 0.35 + k / 6) % 1);
          const [x, y] = along(pts, u * L);
          o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="4" fill="#ff7a2a" opacity=".3"/><circle cx="${f2(x)}" cy="${f2(y)}" r="1.9" fill="#ffb060"/>`);
        }
      }
      for (let k = 0; k < 8; k++) {
        const y = 168 + k * 11;
        const u = (ph * 0.9 + k * 0.17) % 1;
        o.push(`<g opacity="${f2(0.95 * (1 - u))}" transform="translate(${f2(xL(y) - 10 - u * 14)} ${y}) scale(-1 1)"><path d="M0 0q2-2.4 4 0t4 0" fill="none" stroke="#ff6a2a" stroke-width="1.5" stroke-linecap="round"/><path d="M12-2.4l3.4 2.4l-3.4 2.4z" fill="#ff6a2a"/></g>`);
        o.push(`<g opacity="${f2(0.95 * (1 - u))}" transform="translate(${f2(xR(y) + 9 + u * 14)} ${y})"><path d="M0 0q2-2.4 4 0t4 0" fill="none" stroke="#ff6a2a" stroke-width="1.5" stroke-linecap="round"/><path d="M12-2.4l3.4 2.4l-3.4 2.4z" fill="#ff6a2a"/></g>`);
      }
      o.push(lbl(135, 112, "ความร้อนเกิดที่ชิป", 8, "#a8321a") + `<path d="M135 117 v14" stroke="#ff6a2a" stroke-width="2" stroke-dasharray="3 2"/><path d="M130 130 l5 6 l5 -6z" fill="#ff6a2a"/>`);
      o.push(heatBar(p));
    }
    if (cue === "tip") {
      // โคมปิดมิด
      o.push(`<path d="M66 252 C26 210 26 -4 135 -6 C244 -4 244 210 204 252 Z" fill="#fff" fill-opacity=".1" stroke="#a9bddb" stroke-width="3.2"/><path d="M52 190 C46 120 56 40 90 14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`);
      o.push(`<rect x="60" y="250" width="150" height="9" rx="3" fill="#7d8aa6" stroke="#2b3350" stroke-width="1"/>`);
      // ความร้อนวนอยู่ภายใน
      for (let k = 0; k < 10; k++) {
        const th = ph * 0.8 + (k / 10) * Math.PI * 2;
        const x = 135 + Math.cos(th) * 88, y = 118 - Math.sin(th) * 118;
        o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="5" fill="#ff5a1a" opacity=".22"/><circle cx="${f2(x)}" cy="${f2(y)}" r="2.3" fill="#ff9a4a" opacity=".95"/>`);
      }
      o.push(`<rect x="104" y="170" width="62" height="74" rx="4" fill="#ff5a1a" opacity="${f2(0.2 + 0.1 * Math.sin(ph * 6))}"/>`);
      o.push(lbl(135, -13, "โคมปิดมิด: ความร้อนสะสม", 8, "#a8321a"));
      // เทอร์โมมิเตอร์
      const th = 0.55 + 0.4 * ease(cl(p * 1.4));
      o.push(`<rect x="232" y="40" width="9" height="130" rx="4.5" fill="#fff" stroke="#8e99b0" stroke-width="1.2"/><rect x="233.6" y="${f2(168 - 126 * th)}" width="5.8" height="${f2(126 * th)}" rx="2.9" fill="#ff4a2a"/><circle cx="236.5" cy="178" r="9" fill="#ff4a2a" stroke="#8e99b0" stroke-width="1.2"/>`);
      o.push(lbl(236, 202, "ร้อน", 7.5, "#a8321a"));
      // ป้ายบนกล่อง
      o.push(`<g transform="translate(34 292)"><rect width="202" height="52" rx="8" fill="#fffdf5" stroke="#8a8272" stroke-width="1.2" filter="url(#sh2)"/>${txt(101, 15, "ดูข้างกล่องก่อนซื้อ", 8, "#27324f", "middle", 800)}<circle cx="22" cy="35" r="9" fill="#3fbf6a"/><path d="M17.5 35 L21 38.6 L27.5 31.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>${txt(38, 38, "ใช้กับโคมปิดได้", 9, "#1f7a46", "start", 800)}</g>`);
    }
    if (cue === "end") {
      o.push(lbl(135, 346, "ยังไงนะ", 16, "#27324f"));
    }
    o.push(`</g>`);
    if (cue === "junction" || cue === "photon") o.push(cardWrap(ca, "ขยายดูข้างในชิป LED", cardJunction(ph, cue, p)));
    if (cue === "phosphor") o.push(cardWrap(ca, "ทำไมได้แสงสีขาว?", cardPhosphor(ph)));
    if (cue === "fact") o.push(cardWrap(ca, "ปมสำคัญ: สีน้ำเงิน", cardFact(ph, p)));
    o.push(box(SCENE_LED.focus[cue]?.box, ph));
    return o.join("");
  },
};
