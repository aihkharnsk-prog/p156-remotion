// ฉากเครื่องดูดฝุ่น (ตัดครึ่งแบบกระป๋อง: หัวดูด → ท่อ → ถุง/ไซโคลน → ไส้กรอง → ใบพัด+มอเตอร์ → ช่องลมออก) — คืนสตริง SVG ภายในพิกัด 270x480
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, box, DEFS, room, plen, along, rpath, tube } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const F = `font-family="Kanit, sans-serif"`;
const lbl = (x: number, y: number, t: string, size = 7, c = "#27324f", anchor = "middle") =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" ${F} font-weight="700" text-anchor="${anchor}" fill="${c}" stroke="#fff" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">${t}</text>`;

const EXTRA = `<defs>
<linearGradient id="vbody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3f8fb8"/><stop offset=".45" stop-color="#6fc0e6"/><stop offset="1" stop-color="#2d6f94"/></linearGradient>
<linearGradient id="vbag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8d3a6"/><stop offset=".5" stop-color="#f6e8c6"/><stop offset="1" stop-color="#d9bf86"/></linearGradient>
<linearGradient id="vcoil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9772e"/><stop offset=".5" stop-color="#f0a85a"/><stop offset="1" stop-color="#a85f1c"/></linearGradient>
<linearGradient id="vsepia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1e2c0"/><stop offset="1" stop-color="#d8bf8e"/></linearGradient>
</defs>`;

const AIRC = "#7fd0ff", AIRS = "#2f8fe0", DUST = "#8a6a4a";

// ---------------- เส้นทาง ----------------
const HP: Pt[] = [[44, 404], [44, 340], [68, 300], [104, 300]]; // หัวดูด → ท่อ → ปากทางเข้า
const HP_L = plen(HP);
// อากาศ (โหมดถุง): หัวดูด → ท่อ → ถุง → ไส้กรอง → ตาพัดลม → แยกขึ้น/ลง → ช่องลมออก
const A_BAG: Pt[] = [...HP, [130, 300], [172, 304], [188, 312], [200, 320], [209, 320]];
const A_UP: Pt[] = [[209, 320], [209, 276], [216, 256], [216, 212]];
const A_DN: Pt[] = [[209, 320], [209, 364], [216, 382], [250, 382], [252, 340], [252, 212]];
// อากาศ (โหมดไซโคลน): ท่อ → ไซโคลน → ท่อกลางด้านบน → ไส้กรอง → ตาพัดลม
const A_CY: Pt[] = [...HP, [126, 300], [142, 296], [142, 244], [186, 244], [194, 254], [194, 314], [200, 320], [209, 320]];

const full = (pre: Pt[], br: Pt[]): Pt[] => [...pre.slice(0, -1), ...br];

// ---------------- สถานะ ----------------
type St = { run: number; mol: number; air: number; dust: number; cy: number; pile: number; clog: number; fact: number; fine: number };
const Z0: St = { run: 1, mol: 0, air: 1, dust: 1, cy: 0, pile: 0.25, clog: 0, fact: 0, fine: 0 };
const S = (o: Partial<St>): St => ({ ...Z0, ...o });
const IDLE = S({ run: 0, air: 0, dust: 0, pile: 0 });
const STATE: Record<string, [St, St]> = {
  all: [IDLE, IDLE],
  motor: [S({ run: 0, air: 0, dust: 0, pile: 0 }), S({ run: 1, air: 0.7, dust: 0, pile: 0 })],
  pressure: [S({ mol: 0, dust: 0, pile: 0 }), S({ mol: 1, dust: 0, pile: 0 })],
  nozzle: [S({ mol: 0.6, pile: 0.1 }), S({ mol: 0, pile: 0.15 })],
  bag: [S({ pile: 0.15 }), S({ pile: 0.6 })],
  filter: [S({ pile: 0.6, fine: 1 }), S({ pile: 0.6, fine: 1, clog: 0.25 })],
  exhaust: [S({ pile: 0.6, clog: 0.25 }), S({ pile: 0.6, clog: 0.25 })],
  cyclone: [S({ pile: 0.6, clog: 0.25 }), S({ cy: 1, pile: 0.2, clog: 0.1 })],
  fact: [S({ cy: 1, pile: 0.2 }), S({ cy: 1, pile: 0.2, fact: 1 })],
  tip: [S({ pile: 0.55, clog: 0, fact: 0 }), S({ pile: 1, clog: 1 })],
  end: [IDLE, IDLE],
};

// ---------------- ชิ้นส่วนนิ่ง ----------------
const bodyBack = () => {
  const o: string[] = [];
  // ล้อ
  for (const x of [122, 236]) o.push(`<circle cx="${x}" cy="403" r="9" fill="#2b3350" stroke="#10182a"/><circle cx="${x}" cy="403" r="3.4" fill="#9aa6bd"/>`);
  // หูหิ้ว
  o.push(`<path d="M150 228 Q150 208 170 208 H190 Q210 208 210 228" fill="none" stroke="#2d6f94" stroke-width="5" stroke-linecap="round"/>`);
  // ตัวถัง
  o.push(`<g filter="url(#sh)"><rect x="96" y="226" width="164" height="174" rx="18" fill="url(#vbody)" stroke="#1d4f6e" stroke-width="1.4"/></g>`);
  // แผงด้านในที่ตัดเปิด
  o.push(`<rect x="103" y="233" width="150" height="160" rx="12" fill="#f3f6fb" stroke="#1d4f6e" stroke-width="1"/>`);
  // ห้องพัดลม
  o.push(`<rect x="194" y="236" width="59" height="156" rx="8" fill="#dde5f0" stroke="#8e99b0" stroke-width=".9"/>`);
  return o.join("");
};

const motorFan = (ph: number, run: number, clog: number) => {
  const o: string[] = [];
  // มอเตอร์ (ลวดทองแดงขด)
  o.push(`<rect x="224" y="298" width="22" height="44" rx="4" fill="#7a86a2" stroke="#10182a" stroke-width=".8"/>`);
  for (let k = 0; k < 6; k++) o.push(`<rect x="226" y="${301 + k * 6.4}" width="18" height="4.4" rx="2" fill="url(#vcoil)" stroke="#8a4d12" stroke-width=".4"/>`);
  // เพลา
  o.push(`<rect x="216" y="318" width="9" height="4" fill="#cfd6e4" stroke="#6e7a93" stroke-width=".5"/>`);
  // ใบพัด (มองด้านข้าง): แผ่นหลัง + ฝาครอบมีรูตรงกลาง + ใบพัดวิ่ง
  o.push(`<rect x="214" y="278" width="3" height="84" rx="1.5" fill="#6e7a93" stroke="#10182a" stroke-width=".5"/>`);
  o.push(`<rect x="201" y="278" width="3" height="32" rx="1.5" fill="#9aa6bd" stroke="#10182a" stroke-width=".5"/><rect x="201" y="330" width="3" height="32" rx="1.5" fill="#9aa6bd" stroke="#10182a" stroke-width=".5"/>`);
  o.push(`<rect x="204" y="278" width="10" height="84" fill="#eef3fa" opacity=".9"/>`);
  const nb = 6, span = 84;
  for (let k = 0; k < nb; k++) {
    const y = 278 + (((k * span) / nb + ph * 70 * (run > 0.02 ? 1 : 0)) % span);
    const w = 0.4 + 0.6 * Math.sin(((y - 278) / span) * Math.PI); // ใบพัดหมุนหน้าไปหลัง
    o.push(`<path d="M204 ${f2(y)} Q209 ${f2(y - 1.5)} 214 ${f2(y + 3)}" fill="none" stroke="#4b5878" stroke-width="${f2(1.6 + w * 1.6)}" stroke-linecap="round" opacity="${f2(0.45 + 0.55 * w)}"/>`);
  }
  if (run > 0.05) o.push(`<rect x="204" y="278" width="10" height="84" fill="#7fd0ff" opacity="${f2(0.1 * run)}"/>`);
  void clog;
  return o.join("");
};

const filterShape = (clog: number, fine: number, ph: number) => {
  const o: string[] = [];
  // ไส้กรองจีบ (มองด้านข้าง)
  let d = `M186 240`;
  for (let y = 240; y < 392; y += 6) d += ` L${y % 12 === 0 ? 182 : 190} ${y + 3}`;
  o.push(`<rect x="181" y="238" width="10" height="154" fill="#fffaf0" stroke="#b9a77a" stroke-width=".8"/>`);
  o.push(`<path d="${d}" fill="none" stroke="#c9b27a" stroke-width="1.1"/>`);
  // ฝุ่นเกาะผิวกรอง
  const dens = 0.18 + 0.7 * clog + 0.4 * fine * 0.25;
  o.push(`<rect x="179.5" y="238" width="3.2" height="154" fill="#6b5238" opacity="${f2(Math.min(0.9, dens))}"/>`);
  if (clog > 0.3) o.push(`<rect x="181" y="238" width="10" height="154" fill="#6b5238" opacity="${f2(0.45 * clog)}"/>`);
  void ph;
  return o.join("");
};

// ---------------- ถุง / ไซโคลน ----------------
const bagShape = (pile: number, clog: number, ph: number) => {
  const o: string[] = [];
  o.push(`<path d="M112 258 H172 Q176 258 176 262 V380 Q176 386 170 386 H114 Q108 386 108 380 V262 Q108 258 112 258 Z" fill="url(#vbag)" stroke="#a5894f" stroke-width="1.1"/>`);
  // เนื้อผ้า/กระดาษเป็นรูพรุน (จุดจาง)
  for (let k = 0; k < 40; k++) o.push(`<circle cx="${f2(112 + rnd(k + 5) * 60)}" cy="${f2(262 + rnd(k + 9) * 120)}" r=".5" fill="#a5894f" opacity=".5"/>`);
  // ปลอกปากถุง
  o.push(`<rect x="100" y="290" width="12" height="20" rx="2" fill="#9aa6bd" stroke="#10182a" stroke-width=".8"/>`);
  // กองฝุ่นในถุง
  const h = 6 + pile * 56;
  let d = `M110 386 L110 ${f2(386 - h * 0.9)}`;
  for (let x = 110; x <= 174; x += 4) d += ` L${x} ${f2(386 - h * (0.93 + 0.07 * Math.sin(x * 0.3 + 1)))}`;
  d += ` L174 386 Z`;
  o.push(`<path d="${d}" fill="${clog > 0.5 ? "#6b5238" : "#9a7a58"}" opacity=".95"/>`);
  // จุดฝุ่นในกอง
  for (let k = 0; k < 20; k++) o.push(`<circle cx="${f2(114 + rnd(k + 21) * 56)}" cy="${f2(384 - rnd(k + 33) * h * 0.7)}" r="1" fill="#5d4630" opacity=".6"/>`);
  void ph;
  return o.join("");
};

const CYX = 142;
const cycRadius = (y: number) => (y <= 330 ? 32 : y >= 372 ? 5 : lerp(32, 5, (y - 330) / 42));
const cycShape = (pile: number, ph: number) => {
  const o: string[] = [];
  o.push(`<path d="M110 270 H174 V330 L148 372 H136 L110 330 Z" fill="#e6f1fb" stroke="#4b6a8a" stroke-width="1.3" opacity=".95"/>`);
  o.push(`<path d="M110 270 H174 V330 L148 372 H136 L110 330 Z" fill="url(#glassd)"/>`);
  // ถังเก็บฝุ่น
  o.push(`<rect x="122" y="372" width="40" height="20" rx="3" fill="#e6f1fb" stroke="#4b6a8a" stroke-width="1.1"/>`);
  const h = 2 + pile * 18;
  o.push(`<rect x="123" y="${f2(391 - h)}" width="38" height="${f2(h)}" fill="#9a7a58"/>`);
  for (let k = 0; k < 10; k++) o.push(`<circle cx="${f2(126 + rnd(k + 41) * 30)}" cy="${f2(389 - rnd(k + 47) * h)}" r="1" fill="#5d4630" opacity=".6"/>`);
  // ท่ออากาศสะอาดตรงกลาง (ขึ้นด้านบน)
  o.push(`<rect x="138" y="244" width="8" height="52" fill="#cfd6e4" stroke="#6e7a93" stroke-width=".8"/>`);
  o.push(`<path d="M134 296 H150 L146 304 H138 Z" fill="#9aa6bd" stroke="#6e7a93" stroke-width=".6"/>`);
  o.push(`<path d="M138 244 H186 V250 H146 Z" fill="#cfd6e4" stroke="#6e7a93" stroke-width=".8"/>`);
  void ph;
  return o.join("");
};

// ---------------- ท่อ + หัวดูด ----------------
const nozzleHose = () => {
  const o: string[] = [];
  o.push(tube(HP, 11, "#4b5878", "#a9b6d4", 12));
  // หัวดูด
  o.push(`<path d="M12 412 Q12 397 28 397 H62 Q78 397 78 412 Z" fill="#2b3350" stroke="#10182a" stroke-width="1"/>`);
  o.push(`<rect x="36" y="397" width="16" height="15" fill="#d9ecfa" opacity=".9"/>`);
  o.push(`<rect x="30" y="409" width="28" height="3" fill="#10182a"/>`);
  o.push(`<rect x="38.5" y="392" width="11" height="8" rx="2" fill="#4b5878" stroke="#10182a" stroke-width=".8"/>`);
  return o.join("");
};

// ---------------- อนุภาคอากาศ ----------------
const streaks = (path: Pt[], n: number, ph: number, speed: number, a: number, off: number, c = AIRC) => {
  const L = plen(path);
  const o: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = (((ph * speed + (i / n) * L + off) % L) + L) % L;
    const p = along(path, d), q = along(path, Math.max(0, d - 6));
    const fade = cl(Math.min(d / 8, (L - d) / 10)) * a;
    if (fade < 0.03) continue;
    o.push(`<line x1="${f2(q[0])}" y1="${f2(q[1])}" x2="${f2(p[0])}" y2="${f2(p[1])}" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity="${f2(fade)}"/><circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="1.5" fill="#fff" stroke="${AIRS}" stroke-width=".5" opacity="${f2(fade)}"/>`);
  }
  return o.join("");
};

const dustParts = (st: St, ph: number) => {
  const o: string[] = [];
  const N = 16;
  const amt = st.dust;
  if (amt < 0.02) return "";
  for (let i = 0; i < N; i++) {
    if (rnd(i + 3) > amt) continue;
    const sx = 14 + rnd(i + 60) * 62;
    const pre: Pt[] = [[sx, 409.5], [44, 406], ...HP.slice(1)];
    const L1 = plen(pre);
    const s = (ph * 0.3 + i / N) % 1;
    let x: number, y: number, a = 1;
    if (s < 0.58) {
      const q = ease(s / 0.58);
      [x, y] = along(pre, q * L1);
    } else {
      const c = (s - 0.58) / 0.42;
      if (st.cy < 0.5) {
        // ลงถุง
        const tx = 118 + rnd(i + 80) * 48;
        const ty = 380 - st.pile * 40 * rnd(i + 90);
        const e = ease(c);
        x = lerp(104, tx, Math.min(1, e * 1.6)); y = lerp(300, ty, e * e);
        a = cl((1 - c) * 6);
      } else {
        // ไซโคลน: วนเป็นเกลียวลงตามผนัง
        const e = c;
        y = 300 + (372 - 300) * ease(e) * 1.0;
        const th = Math.PI + e * 3 * Math.PI * 2;
        x = CYX + cycRadius(y) * 0.86 * Math.cos(th);
        if (y > 372 - 2) { x = CYX + (rnd(i + 12) - 0.5) * 16; y = 372 + (e - 0.9) * 10 * 12; }
        a = cl((1 - e) * 8);
      }
    }
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(1.5 + rnd(i + 70) * 1.1)}" fill="${DUST}" stroke="#4a3822" stroke-width=".5" opacity="${f2(a)}"/>`);
  }
  return o.join("");
};

// อากาศวนในไซโคลน (เส้นเกลียวจาง) + อากาศสะอาดขึ้นกลางท่อ
const cycAir = (ph: number, a: number) => {
  const o: string[] = [];
  for (let k = 0; k < 4; k++) {
    const u = (ph * 0.6 + k / 4) % 1;
    const y = 288 + u * 76;
    const th = u * 9;
    const r = cycRadius(y) * 0.7;
    o.push(`<ellipse cx="${CYX}" cy="${f2(y)}" rx="${f2(r)}" ry="3.2" fill="none" stroke="${AIRC}" stroke-width="1.2" opacity="${f2(a * 0.55 * (1 - u * 0.4))}" stroke-dasharray="6 5" stroke-dashoffset="${f2(-th * 6)}"/>`);
  }
  return o.join("");
};

// ---------------- โมเลกุลอากาศ (อธิบายความดัน) ----------------
const molecules = (ph: number, mol: number) => {
  if (mol < 0.02) return "";
  const o: string[] = [];
  // ในห้อง: หนาแน่น
  const nOut = 70;
  for (let i = 0; i < nOut; i++) {
    const x = 4 + rnd(i + 200) * 86, y = 232 + rnd(i + 210) * 176;
    if (x > 34 && x < 54 && y > 336) continue; // เลี่ยงท่อ
    if (Math.abs(x - 44) < 8 && y > 296) continue;
    if (y > 296 && y < 306 && x > 40) continue;
    const jx = Math.sin(ph * 3.1 + i) * 2.2, jy = Math.cos(ph * 2.7 + i * 1.3) * 2.2;
    o.push(`<circle cx="${f2(x + jx)}" cy="${f2(y + jy)}" r="1.6" fill="#ff9a3a" stroke="#a85a10" stroke-width=".4" opacity="${f2(0.9 * mol)}"/>`);
  }
  // ในเครื่อง: เบาบาง
  const nIn = 8;
  for (let i = 0; i < nIn; i++) {
    const x = 114 + rnd(i + 300) * 130, y = 262 + rnd(i + 310) * 118;
    if (x > 178 && x < 194) continue;
    const jx = Math.sin(ph * 1.7 + i) * 3, jy = Math.cos(ph * 1.5 + i * 1.3) * 3;
    o.push(`<circle cx="${f2(x + jx)}" cy="${f2(y + jy)}" r="1.6" fill="#ff9a3a" stroke="#a85a10" stroke-width=".4" opacity="${f2(0.9 * mol)}"/>`);
  }
  return o.join("");
};

const arr = (x1: number, y1: number, x2: number, y2: number, c: string, a: number) => {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hx = (r: number) => f2(x2 - Math.cos(ang + r) * 6), hy = (r: number) => f2(y2 - Math.sin(ang + r) * 6);
  return `<g opacity="${f2(a)}"><line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2 - Math.cos(ang) * 3)}" y2="${f2(y2 - Math.sin(ang) * 3)}" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><path d="M${f2(x2)} ${f2(y2)} L${hx(0.5)} ${hy(0.5)} L${hx(-0.5)} ${hy(-0.5)} Z" fill="${c}"/></g>`;
};

// ---------------- ภาพประวัติศาสตร์ (บูธ ค.ศ. 1901) ----------------
const factCard = (a: number, ph: number) => {
  const o: string[] = [];
  const bob = Math.sin(ph * 5) * 0.6;
  o.push(`<g opacity="${f2(a)}">`);
  o.push(`<rect x="-140" y="-140" width="550" height="760" fill="#fdf3de" opacity=".93"/>`);
  o.push(`<rect x="8" y="130" width="254" height="230" rx="10" fill="url(#vsepia)" stroke="#8a6d3a" stroke-width="2" filter="url(#sh)"/>`);
  // อาคาร
  o.push(`<rect x="156" y="170" width="94" height="150" fill="#b9825a" stroke="#6a4326" stroke-width="1.2"/>`);
  for (const [wx, wy] of [[168, 184], [208, 184], [168, 236], [208, 236]]) o.push(`<rect x="${wx}" y="${wy}" width="26" height="34" fill="#f4e9c8" stroke="#6a4326"/><line x1="${wx + 13}" y1="${wy}" x2="${wx + 13}" y2="${wy + 34}" stroke="#6a4326" stroke-width=".8"/>`);
  o.push(`<rect x="190" y="276" width="26" height="44" fill="#6a4326"/>`);
  // พื้นถนน
  o.push(`<rect x="8" y="320" width="254" height="40" fill="#a9916a"/><rect x="8" y="320" width="254" height="3" fill="#6a4326"/>`);
  // รถม้า (ตู้ทึบ)
  o.push(`<g transform="translate(0 ${f2(bob)})">`);
  o.push(`<rect x="52" y="262" width="70" height="46" rx="3" fill="#c44a3a" stroke="#6b1f16" stroke-width="1.2"/><rect x="58" y="268" width="26" height="14" fill="#ffd9a8" opacity=".85"/>`);
  o.push(`<circle cx="70" cy="312" r="10" fill="#4b3a26" stroke="#1d150c" stroke-width="1.2"/><circle cx="70" cy="312" r="3" fill="#cfd6e4"/><circle cx="108" cy="312" r="10" fill="#4b3a26" stroke="#1d150c" stroke-width="1.2"/><circle cx="108" cy="312" r="3" fill="#cfd6e4"/>`);
  // ม้า
  o.push(`<g fill="#7a4a26" stroke="#3b2210" stroke-width="1">`);
  o.push(`<ellipse cx="26" cy="288" rx="15" ry="9"/><path d="M34 282 L40 262 L50 258 L52 266 L44 270 L40 286 Z"/><rect x="12" y="294" width="4" height="20" rx="1.5"/><rect x="20" y="296" width="4" height="18" rx="1.5"/><rect x="30" y="296" width="4" height="18" rx="1.5"/><rect x="36" y="294" width="4" height="20" rx="1.5"/>`);
  o.push(`</g><line x1="40" y1="288" x2="52" y2="288" stroke="#3b2210" stroke-width="1.2"/>`);
  o.push(`</g>`);
  // ท่อยาวเข้าอาคาร
  const hose: Pt[] = [[122, 280], [140, 280], [140, 300], [178, 300], [178, 262], [190, 262]];
  o.push(`<path d="${rpath(hose, 6)}" fill="none" stroke="#2b3350" stroke-width="5" stroke-linecap="round"/><path d="${rpath(hose, 6)}" fill="none" stroke="#7a86a2" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 3" stroke-dashoffset="${f2(-ph * 20)}"/>`);
  o.push(lbl(135, 154, "ค.ศ. 1901 · ฮิวเบิร์ต เซซิล บูธ", 8.5, "#6a4326"));
  o.push(lbl(135, 346, "เครื่องใหญ่จนต้องใช้ม้าลาก · ต่อท่อยาวเข้าอาคาร", 7, "#6a4326"));
  o.push(`</g>`);
  return o.join("");
};

// ====================================================================
export const SCENE_VACUUM: SceneDef = {
  focus: {
    all: { cx: 135, cy: 312, z: 1.06 },
    motor: { cx: 226, cy: 320, z: 2.5, box: [196, 236, 60, 156], label: "มอเตอร์ + ใบพัด" },
    pressure: { cx: 135, cy: 318, z: 1.12, label: "ความดันต่ำกว่าในห้อง" },
    nozzle: { cx: 62, cy: 356, z: 2.2, box: [12, 392, 68, 22], label: "หัวดูด" },
    bag: { cx: 140, cy: 320, z: 2.3, box: [108, 258, 70, 130], label: "ถุงเก็บฝุ่น" },
    filter: { cx: 168, cy: 316, z: 2.5, box: [181, 238, 10, 154], label: "ไส้กรอง" },
    exhaust: { cx: 222, cy: 280, z: 2.1, box: [196, 208, 62, 70], label: "ช่องลมออก" },
    cyclone: { cx: 144, cy: 318, z: 2.3, box: [108, 244, 80, 148], label: "ไซโคลน" },
    fact: { cx: 135, cy: 246, z: 1.05 },
    tip: { cx: 135, cy: 326, z: 1.22, label: "เช็กสามจุด" },
    end: { cx: 135, cy: 312, z: 1.06 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = STATE[cue] || STATE.all;
    const e = ease(cl(p));
    const g = (k: keyof St) => lerp(A[k], B[k], e);
    const st: St = { run: g("run"), mol: g("mol"), air: g("air"), dust: g("dust"), cy: g("cy") > 0.5 ? 1 : 0, pile: g("pile"), clog: g("clog"), fact: g("fact"), fine: g("fine") };
    const o: string[] = [DEFS, EXTRA];
    o.push(room(412));
    o.push(`<ellipse cx="140" cy="413" rx="130" ry="5" fill="#2a1d10" opacity=".25"/>`);
    o.push(bodyBack());
    // ความดันต่ำ: ย้อมสีฟ้าอ่อนในเครื่อง
    if (st.mol > 0.02) o.push(`<rect x="103" y="233" width="150" height="160" rx="12" fill="#8fd0ff" opacity="${f2(0.22 * st.mol)}"/>`);
    // ถุง หรือ ไซโคลน
    o.push(st.cy ? cycShape(st.pile, ph) : bagShape(st.pile, st.clog, ph));
    o.push(filterShape(st.clog, st.fine, ph));
    o.push(motorFan(ph, st.run, st.clog));
    // ช่องลมออกด้านบน
    for (let k = 0; k < 7; k++) o.push(`<rect x="${201 + k * 8}" y="223" width="5" height="5" rx="1.5" fill="#10182a" opacity=".8"/>`);
    // ฝุ่นละเอียดในโหมดถุง (ผ่านเนื้อถุง ไปติดไส้กรอง)
    if (st.fine > 0.02 && !st.cy) {
      for (let j = 0; j < 8; j++) {
        const s = (ph * 0.5 + j / 8) % 1;
        const x = lerp(150, 180, ease(Math.min(1, s * 1.15)));
        const y = 262 + rnd(j + 120) * 100;
        o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1" fill="#6b5238" opacity="${f2(cl((1 - s) * 5) * st.fine)}"/>`);
      }
      // จุดติดบนไส้กรอง
      for (let j = 0; j < 16; j++) o.push(`<circle cx="180.6" cy="${f2(246 + rnd(j + 130) * 140)}" r=".9" fill="#4a3822" opacity="${f2(0.8 * st.fine)}"/>`);
    }
    // ท่อ + หัวดูด (ทับขอบตัวถัง)
    o.push(nozzleHose());
    // อากาศ
    const k = (1 - 0.8 * st.clog) * st.air * (st.run > 0.5 ? 1 : st.run * 2);
    if (k > 0.03) {
      const base = st.cy ? A_CY : A_BAG;
      const nMain = 10, nBr = 5;
      o.push(streaks(base, nMain, ph, 38, k, 0));
      o.push(streaks(A_UP, nBr, ph, 38, k, 0));
      o.push(streaks(A_DN, nBr, ph, 38, k, 12));
      // อากาศผ่านเนื้อถุงเป็นรัศมี (โหมดถุง)
      if (!st.cy) for (let j = 0; j < 7; j++) {
        const u = (ph * 0.8 + j / 7) % 1;
        const y = 272 + j * 16;
        o.push(`<line x1="${f2(150 + u * 24)}" y1="${y}" x2="${f2(156 + u * 24)}" y2="${y}" stroke="${AIRC}" stroke-width="1.4" stroke-linecap="round" opacity="${f2(k * 0.8 * (1 - u))}"/>`);
      }
      if (st.cy) o.push(cycAir(ph, k));
      // ออกจากเครื่อง
      for (const x of [216, 252]) for (let j = 0; j < 2; j++) {
        const u = (ph * 0.9 + j / 2 + (x === 252 ? 0.3 : 0)) % 1;
        o.push(`<path d="M${x - 3} ${f2(214 - u * 16)} q3 -3 6 0" fill="none" stroke="${AIRC}" stroke-width="1.5" stroke-linecap="round" opacity="${f2(k * (1 - u))}"/>`);
      }
    }
    // เศษฝุ่นบนพื้น + ฝุ่นที่ถูกดูด
    const floorDust = cl(1 - st.dust * 0.1);
    for (let i = 0; i < 16; i++) {
      const sx = 14 + rnd(i + 60) * 62;
      o.push(`<circle cx="${f2(sx)}" cy="410.4" r="${f2(1.2 + rnd(i + 70))}" fill="${DUST}" opacity="${f2(0.55 * floorDust)}"/>`);
    }
    o.push(dustParts(st, ph));
    // ก้อนอุดตันในท่อ (เคส tip)
    if (cue === "tip") {
      const a = cl((p - 0.3) * 3);
      o.push(`<g opacity="${f2(a)}"><ellipse cx="44" cy="360" rx="6" ry="9" fill="#5d4630" stroke="#2b1f10" stroke-width=".8"/><path d="M40 354 q4 3 0 6 q-4 3 0 6" fill="none" stroke="#9a7a58" stroke-width="1"/></g>`);
    }
    // โมเลกุล
    if (st.mol > 0.02) {
      o.push(molecules(ph, st.mol));
      o.push(arr(18, 384, 38, 402, "#2fb36a", st.mol));
      o.push(arr(70, 376, 52, 398, "#2fb36a", st.mol));
    }
    // ป้ายชื่อ
    const L: string[] = [];
    if (cue === "all") { L.push(lbl(46, 430, "หัวดูด", 7)); L.push(lbl(178, 430, "ตัวเครื่อง", 7)); }
    if (cue === "motor") { L.push(lbl(231, 290, "มอเตอร์", 7)); L.push(lbl(208, 272, "ใบพัด", 7)); }
    if (cue === "pressure") {
      L.push(lbl(48, 250, "ในห้อง: ความดันสูง", 7, "#a85a10"));
      L.push(lbl(150, 246, "ในเครื่อง: ความดันต่ำ", 7, "#1f6fb0"));
    }
    if (cue === "nozzle") { L.push(lbl(60, 428, "ลมพาฝุ่นเข้า", 6.5)); }
    if (cue === "bag") { L.push(lbl(142, 252, "ถุงเก็บฝุ่น", 7)); L.push(lbl(142, 400, "ฝุ่นติดอยู่ในถุง", 6.5)); }
    if (cue === "filter") { L.push(lbl(186, 232, "ไส้กรอง", 7)); L.push(lbl(150, 400, "ดักฝุ่นละเอียด", 6.5)); }
    if (cue === "exhaust") { L.push(lbl(232, 200, "ลมสะอาดขึ้น ออกทางนี้", 6.5)); }
    if (cue === "cyclone") { L.push(lbl(143, 238, "ไซโคลน (แรงเหวี่ยง)", 7)); L.push(lbl(143, 404, "ถังเก็บฝุ่น", 6.5)); }
    if (cue === "tip") {
      L.push(lbl(142, 252, "1 ถุง/ถังเต็ม", 6.5, "#a31f1f"));
      L.push(lbl(186, 232, "2 ไส้กรองตัน", 6.5, "#a31f1f"));
      L.push(lbl(40, 330, "3 ท่ออุดตัน", 6.5, "#a31f1f", "end"));
      L.push(lbl(140, 440, "ลมผ่านน้อย = ดูดไม่แรง", 7.5, "#27324f"));
    }
    o.push(L.join(""));
    // ประวัติศาสตร์
    if (st.fact > 0.01) o.push(factCard(cl(st.fact * 1.6), ph));
    o.push(box(SCENE_VACUUM.focus[cue]?.box, ph));
    return o.join("");
  },
};
void full; void DUST;
