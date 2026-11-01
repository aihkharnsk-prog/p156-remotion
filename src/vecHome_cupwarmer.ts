// ฉากอธิบาย: ที่อุ่นแก้ว USB — แผ่นให้ความร้อน (ตัวต้านทานแบบฟิล์ม) → นำความร้อนผ่านแผ่นโลหะขึ้นก้นแก้ว → ตัวคุมอุณหภูมิตัดต่อไฟสลับ; กำลัง USB น้อย (รักษาความร้อน ไม่ใช่ต้ม) — SVG พิกัด 270x480
// เน้นแอนิเมชัน: กระแสวิ่งตามรอยฟิล์ม, ความร้อนไหลขึ้นแก้ว, กราฟอุณหภูมิฟันเลื่อยในแถบที่ตั้งไว้, สมดุลความร้อนเข้า-ออก
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, along, plen, room, DEFS: HDEFS } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#2b3350", anchor = "middle", w = 800) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, fill = "#fff6c9") => {
  const w = s.length * 4.4 + 10;
  return `<rect x="${f2(x - w / 2)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".97"/>` + txt(x, y + 0.4, s, 6.4);
};
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));
const heatCol = (T: number) => (T < 0.5 ? mixc("#7d8aa6", "#e0553c", T / 0.5) : T < 0.85 ? mixc("#e0553c", "#ff9a3d", (T - 0.5) / 0.35) : mixc("#ff9a3d", "#fff1b0", (T - 0.85) / 0.15));

const EXTRA = `<defs>
<linearGradient id="cwpl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8794ad"/><stop offset=".3" stop-color="#e6ebf4"/><stop offset=".7" stop-color="#aab4c9"/><stop offset="1" stop-color="#6c7893"/></linearGradient>
<linearGradient id="cwmug" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8e1f6"/><stop offset=".35" stop-color="#ffffff"/><stop offset="1" stop-color="#cfc4e8"/></linearGradient>
<linearGradient id="cwcof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset="1" stop-color="#4f2f18"/></linearGradient>
<linearGradient id="cwcase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4a66"/><stop offset="1" stop-color="#1f2740"/></linearGradient>
<radialGradient id="cwglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd18a" stop-opacity=".9"/><stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></radialGradient>
</defs>`;

// เส้นทางกระแส
const ZIG: Pt[] = [];
for (let i = 0; i <= 24; i++) ZIG.push([208 - i * 6, i % 2 ? 275 : 270.5]);
const CUR: Pt[] = [[262, 284], [216, 284], [212, 284], [212, 272], ...ZIG, [58, 272], [54, 272], [54, 294], [262, 294]];
const CL = plen(CUR);

type S = { Tp: number; relay: number; flow: number; cof: number; flake: number; loss: number; air: number; steam: number };
const D: S = { Tp: 0.55, relay: 1, flow: 1, cof: 0.75, flake: 0, loss: 0, air: 0, steam: 1 };

const mug = (ph: number, S: S, ox = 0, flat = true) => {
  const o: string[] = [];
  o.push(`<g transform="translate(${ox} 0)">`);
  o.push(`<path d="M194 172 q26 -4 26 28 q0 30 -26 30" fill="none" stroke="#cfc4e8" stroke-width="7" stroke-linecap="round"/><path d="M194 172 q26 -4 26 28 q0 30 -26 30" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`);
  o.push(`<path d="M76 150 H194 V246 Q194 262 178 262 H92 Q76 262 76 246 Z" fill="url(#cwmug)" stroke="#6b5f93" stroke-width="1.4"/>`);
  o.push(`<path d="M82 160 H188 V246 Q188 257 177 257 H93 Q82 257 82 246 Z" fill="url(#cwcof)"/>`);
  // สีกาแฟอุ่นขึ้นตามอุณหภูมิ
  o.push(`<path d="M82 160 H188 V246 Q188 257 177 257 H93 Q82 257 82 246 Z" fill="#ff7a3a" opacity="${f2(0.28 * S.cof)}"/>`);
  o.push(`<ellipse cx="135" cy="161" rx="53" ry="3" fill="#a06c40"/>`);
  // การไหลวน (พาความร้อน)
  for (let i = 0; i < 5; i++) {
    const u = (ph * 0.35 + i / 5) % 1, x = 92 + i * 20 + Math.sin(ph * 2 + i) * 3, y = 252 - u * 84;
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.7" fill="#ffcf9a" opacity="${f2(S.cof * 0.7 * Math.sin(Math.PI * u))}"/>`);
  }
  o.push(`<path d="M80 154 V240" stroke="#fff" stroke-width="2" opacity=".5"/>`);
  if (!flat) o.push(`<path d="M92 262 Q135 250 178 262" fill="#cfd6e3" opacity=".0"/>`);
  o.push(`</g>`);
  // ไอระเหย
  for (let i = 0; i < 4; i++) {
    let d = ""; const bx = 100 + i * 22 + ox, ph0 = (ph * 0.5 + i * 0.27) % 1;
    for (let k = 0; k <= 14; k++) { const y = 150 - k * 5 - ph0 * 8; d += `${k ? "L" : "M"}${f2(bx + Math.sin(k * 0.6 + ph * 2 + i) * (3 + k * 0.3))} ${f2(y)} `; }
    o.push(`<path d="${d}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="${f2(0.5 * S.steam * S.cof)}"/>`);
  }
  return o.join("");
};

const base = (ph: number, S: S, c: string) => {
  const o: string[] = [];
  const hc = heatCol(S.Tp);
  o.push(`<ellipse cx="135" cy="304" rx="110" ry="5" fill="#1b1008" opacity=".3" filter="url(#bl)"/>`);
  // ตัวเครื่อง
  o.push(`<path d="M50 266 Q50 262 56 262 H214 Q220 262 220 266 V296 Q220 302 214 302 H56 Q50 302 50 296 Z" fill="url(#cwcase)" stroke="#10162c" stroke-width="1.4"/>`);
  // แผ่นโลหะบน
  o.push(`<rect x="54" y="262" width="162" height="7" rx="2" fill="url(#cwpl)" stroke="#2b3350" stroke-width=".8"/><rect x="54" y="262" width="162" height="7" rx="2" fill="${hc}" opacity="${f2(0.55 * S.Tp + 0.05)}"/>`);
  // ผิวเคลือบ (ลอกตามตัวแปร flake)
  if (S.flake > 0.02) {
    for (let i = 0; i < 12; i++) {
      const x = 62 + rnd(i) * 146, w = 4 + rnd(i + 3) * 8, lift = S.flake * (rnd(i + 5) < S.flake + 0.2 ? 1 : 0);
      o.push(`<path d="M${f2(x)} 262 l${f2(w)} ${f2(-lift * (3 + rnd(i + 7) * 4))} l${f2(w * 0.6)} ${f2(lift * (3 + rnd(i + 7) * 4))} z" fill="#6b7a96" stroke="#2b3350" stroke-width=".4" opacity="${f2(0.4 + 0.6 * lift)}"/>`);
    }
  }
  // ฟิล์มให้ความร้อน (ตัวต้านทาน)
  o.push(`<rect x="56" y="269" width="158" height="9" fill="#2d3552"/>`);
  const trace = ZIG.map((q) => q.join(",")).join(" ");
  o.push(`<polyline points="${trace}" fill="none" stroke="#10162c" stroke-width="3.2" stroke-linejoin="round"/><polyline points="${trace}" fill="none" stroke="${S.flow > 0.5 ? hc : "#8a93a6"}" stroke-width="1.8" stroke-linejoin="round"/>`);
  if (S.flow > 0.5) o.push(`<rect x="56" y="262" width="158" height="22" fill="url(#cwglow)" opacity="${f2(0.5 * S.Tp)}"/>`);
  // ฉนวน
  o.push(`<rect x="56" y="278" width="102" height="16" fill="#f1e3a8" opacity=".9"/>`);
  for (let i = 0; i < 12; i++) o.push(`<path d="M${58 + i * 8.6} 278 l5 16" stroke="#d8c26a" stroke-width=".7"/>`);
  o.push(txt(107, 289, "ฉนวน", 5.4, "#7a6a2a", "middle", 700));
  // แผงวงจร + เซนเซอร์
  o.push(`<rect x="162" y="278" width="52" height="19" rx="2" fill="#1d6b4b" stroke="#0e3d2a" stroke-width=".8"/><rect x="170" y="282" width="20" height="11" rx="1.5" fill="#12172b"/>${txt(180, 290, "ชิปคุม", 4.6, "#9fe4ff", "middle", 700)}`);
  o.push(`<rect x="196" y="282" width="12" height="10" rx="1.5" fill="#cfd6e3" stroke="#2b3350" stroke-width=".6"/><g transform="rotate(${f2(S.relay ? 0 : -28)} 198 287)"><rect x="198" y="286" width="9" height="2" rx="1" fill="${S.relay ? "#6bf29a" : "#ff8a7a"}"/></g>`);
  o.push(`<circle cx="188" cy="273" r="2.6" fill="#4a8fff" stroke="#fff" stroke-width=".8"/><path d="M188 276 V280" stroke="#e2c36a" stroke-width="1"/>`);
  // สาย USB + พอร์ต
  o.push(`<path d="M220 284 H262" stroke="#10162c" stroke-width="5" stroke-linecap="round"/><path d="M220 284 H262" stroke="#2e3a52" stroke-width="3" stroke-linecap="round"/>`);
  o.push(`<rect x="238" y="272" width="32" height="30" rx="4" fill="#cfd6e3" stroke="#2b3350" stroke-width="1"/>${txt(254, 296, "USB", 5.6, "#2b3350", "middle", 800)}`);
  // กระแส
  if (S.flow > 0.1) for (let i = 0; i < 16; i++) {
    const q = along(CUR, ((ph * 0.5 + i / 16) % 1) * CL);
    o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="3" fill="#ffd14a" opacity="${f2(0.28 * S.flow)}"/><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="1.4" fill="#fff8d6" opacity="${f2(S.flow)}"/>`);
  }
  // ความร้อนไหลขึ้น
  if (S.Tp > 0.2) for (let i = 0; i < 9; i++) {
    const u = (ph * 0.7 + i / 9) % 1, x = 64 + i * 17.5;
    o.push(`<path d="M${f2(x)} ${f2(262 - u * 26)} l-2.4 3.4 h4.8 z" fill="#ff9a3d" opacity="${f2(Math.sin(Math.PI * u) * S.Tp * (S.air > 0 ? 0.55 : 1) * (S.flow > 0.5 || c === "keep" ? 1 : 0.3))}"/>`);
  }
  return o.join("");
};

// กราฟอุณหภูมิ
const graph = (ph: number, x: number, y: number, w: number, h: number, lo: number, hi: number, mode: string, p: number) => {
  const o: string[] = [];
  o.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#fff" opacity=".94" stroke="#2b3350" stroke-width=".8"/>`);
  const yy = (v: number) => y + h - 8 - v * (h - 22);
  o.push(`<rect x="${x + 4}" y="${f2(yy(hi))}" width="${w - 8}" height="${f2(yy(lo) - yy(hi))}" fill="#6bf29a" opacity=".28"/>`);
  o.push(txt(x + w / 2, y + 9, "อุณหภูมิแผ่น", 5.6, "#2b3350", "middle", 800));
  let d = "";
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const t = ph - (1 - i / N) * 6;
    const u = (((t / 5) % 1) + 1) % 1;
    const v = u < 0.56 ? lo + (hi - lo) * (u / 0.56) : hi - (hi - lo) * ((u - 0.56) / 0.44);
    d += `${i ? "L" : "M"}${f2(x + 5 + (i / N) * (w - 10))} ${f2(yy(v))} `;
  }
  o.push(`<path d="${d}" fill="none" stroke="#ff5a4a" stroke-width="1.6" stroke-linejoin="round"/>`);
  return o.join("");
};
const cyc = (ph: number, lo: number, hi: number) => {
  const u = (ph / 5) % 1;
  const heating = u < 0.56;
  const v = heating ? lo + (hi - lo) * (u / 0.56) : hi - (hi - lo) * ((u - 0.56) / 0.44);
  return { v, heating };
};

const Z = (x: number, y: number, z: number, box?: [number, number, number, number], label?: string) => ({ cx: x, cy: y + 90 / z, z, box, label });
export const SCENE_CUPWARMER: SceneDef = {
  focus: {
    all: { ...Z(135, 215, 1.12) },
    plate: { ...Z(150, 280, 2.0, [54, 262, 160, 36]) },
    heat: { ...Z(135, 272, 2.4, [56, 268, 158, 10]) },
    cond: { ...Z(135, 235, 1.5) },
    but: { ...Z(135, 255, 1.9) },
    thermo: { ...Z(135, 235, 1.2) },
    level: { ...Z(135, 235, 1.2) },
    watt: { ...Z(135, 215, 1.05) },
    keep: { ...Z(135, 215, 1.05) },
    mug: { ...Z(135, 245, 1.5) },
    auto: { ...Z(135, 235, 1.3) },
    wear: { ...Z(135, 262, 2.6, [54, 258, 162, 18]) },
    chk: { ...Z(135, 215, 1.05) },
    end: { ...Z(135, 215, 1.05) },
  },
  render: ({ frame, cue, p, ef }) => {
    const ph = frame / 30, lt = ef / 30;
    const c = cue;
    const F = SCENE_CUPWARMER.focus[c] || SCENE_CUPWARMER.focus.all;
    const TY = F.cy - 240 / F.z + 12;
    const S: S = { ...D };
    const cy = cyc(ph, 0.45, 0.75);
    S.Tp = cy.v; S.relay = cy.heating ? 1 : 0; S.flow = cy.heating ? 1 : 0.0;
    if (c === "plate") { S.Tp = 0.1; S.flow = 1; S.cof = 0.5; }
    if (c === "heat") { S.Tp = sm(0, 0.7, p) * 0.8 + 0.05; S.flow = 1; }
    if (c === "cond") { S.Tp = 0.7; S.flow = 1; }
    if (c === "but") { S.Tp = 0.55 + 0.45 * sm(0, 0.95, p); S.flow = 1; S.cof = 1; }
    if (c === "level") { const k = Math.floor(sm(0, 1, p) * 3.99); const lo = 0.3 + k * 0.1, hi = lo + 0.2; const q = cyc(ph, lo, hi); S.Tp = q.v; S.relay = q.heating ? 1 : 0; S.flow = q.heating ? 1 : 0; }
    if (c === "watt") { S.Tp = 0.4; S.flow = 1; S.cof = 0.3; }
    if (c === "wear") { S.flake = sm(0.05, 0.9, p); S.Tp = 0.5 + 0.3 * Math.sin(ph * 2); S.flow = 1; }
    if (c === "auto") { S.flow = sm(0.55, 0.62, p) > 0.5 ? 0 : 1; S.relay = S.flow > 0.5 ? 1 : 0; S.Tp = S.flow > 0.5 ? 0.6 : 0.2; }
    const o: string[] = [HDEFS, EXTRA, room(302)];
    o.push(`<rect x="-40" y="302" width="350" height="12" fill="#b78852"/>`);
    if (c !== "mug") o.push(mug(ph, S));
    o.push(base(ph, S, c));
    if (c === "all") o.push(pill(135, TY + 6, "ร้อนพอดี ไม่ถึงกับเดือด"));
    if (c === "plate") {
      o.push(pill(135, TY + 6, "แผ่นให้ความร้อน ต่อ USB 5V"));
      o.push(txt(238, 262, "5V", 9, "#2b3350", "middle", 900));
    }
    if (c === "heat") {
      for (let i = 0; i < 14; i++) { const x = 70 + ((i * 11 + ph * 40) % 140); const y = 273 + Math.sin(ph * 14 + i * 2) * 1.8; o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1" fill="#fff" opacity=".6"/>`); }
      o.push(pill(135, TY + 6, "ตัวต้านทาน: ต้านกระแส → ร้อน", "#ffe9b0"));
    }
    if (c === "cond") {
      o.push(pill(135, TY + 6, "ความร้อนขึ้นแผ่น → ก้นแก้ว → เครื่องดื่ม", "#ffe9b0"));
    }
    if (c === "but") {
      const T = S.Tp;
      o.push(pill(135, TY + 6, T > 0.85 ? "ร้อนเกินจุดปลอดภัย!" : "ถ้าร้อนต่อไปเรื่อยๆ...", T > 0.85 ? "#ffd0c4" : "#fff6c9"));
      o.push(`<rect x="236" y="206" width="10" height="52" rx="5" fill="#fff" stroke="#2b3350" stroke-width="1"/><rect x="238" y="${f2(256 - 48 * T)}" width="6" height="${f2(48 * T)}" rx="3" fill="${T > 0.85 ? "#ff3a2a" : "#ff9a3d"}"/>`);
      if (T > 0.85) o.push(`<g opacity="${f2(0.6 + 0.4 * Math.sin(ph * 10))}"><path d="M120 240 l14 -24 l14 24 z" fill="#ffd14a" stroke="#7a1a28" stroke-width="1.6" stroke-linejoin="round"/>${txt(134, 237, "!", 13, "#7a1a28", "middle", 900)}</g>`);
    }
    if (c === "thermo" || c === "level") {
      const lo = c === "level" ? 0.3 + Math.floor(sm(0, 1, p) * 3.99) * 0.1 : 0.45, hi = lo + (c === "level" ? 0.2 : 0.3);
      o.push(graph(ph, 28, 138, 94, 62, lo, hi, "saw", p));
      if (c === "thermo") {
        o.push(pill(135, TY + 6, S.relay ? "ยังไม่ถึงค่าที่ตั้ง → ต่อไฟ" : "ถึงค่าที่ตั้ง → ตัดไฟ", S.relay ? "#d8ffe3" : "#ffd0c4"));
        o.push(txt(188, 258, S.relay ? "ไฟ ON" : "ไฟ OFF", 7, S.relay ? "#1c7a3a" : "#b8402f", "middle", 900));
      } else {
        const lvl = ["50", "60", "70", "80"];
        const k = Math.floor(sm(0, 1, p) * 3.99);
        o.push(pill(135, TY + 6, "ตั้งระดับ = ตั้งอุณหภูมิที่ตัดไฟ", "#fff6c9"));
        o.push(`<g transform="translate(214 150)"><circle r="17" fill="#fff" stroke="#2b3350" stroke-width="1.2"/><path d="M0 0 L${f2(Math.cos(-2.4 + k * 0.7) * 13)} ${f2(Math.sin(-2.4 + k * 0.7) * 13)}" stroke="#ff5a4a" stroke-width="2.4" stroke-linecap="round"/><circle r="2.4" fill="#2b3350"/>${txt(0, 28, `ระดับ ${k + 1}/4`, 6, "#2b3350", "middle", 800)}</g>`);
        void lvl;
      }
    }
    if (c === "watt") {
      o.push(pill(135, TY + 6, "USB จ่ายกำลังน้อย → อุ่นของเย็นไม่ไหว", "#fff6c9"));
      o.push(`<rect x="12" y="100" width="102" height="50" rx="7" fill="#fff" opacity=".94" stroke="#2b3350" stroke-width=".8"/>${txt(63, 111, "กำลังไฟ", 6.2, "#2b3350", "middle", 800)}`);
      o.push(`<rect x="20" y="116" width="${f2(16)}" height="10" rx="3" fill="#ff9a3d"/>${txt(40, 124, "USB ≈ 5–10 W", 5.8, "#2b3350", "start", 800)}`);
      o.push(`<rect x="20" y="132" width="86" height="10" rx="3" fill="#e4e9f2" stroke="#2b3350" stroke-width=".6" stroke-dasharray="2 2"/>${txt(24, 140, "อุ่นของเย็นต้องมากกว่านี้", 5.4, "#7a1a28", "start", 700)}`);
      o.push(`<rect x="236" y="190" width="10" height="66" rx="5" fill="#fff" stroke="#2b3350" stroke-width="1"/><rect x="238" y="${f2(254 - 14 - 6 * Math.sin(ph))}" width="6" height="${f2(14 + 6 * Math.sin(ph))}" rx="3" fill="#4a8fff"/>${txt(241, 186, "กาแฟเย็น", 5.4, "#2b3350", "middle", 700)}`);
    }
    if (c === "keep") {
      // ลูกศรความร้อนเสียออกรอบแก้ว
      for (let i = 0; i < 6; i++) { const u = (ph * 0.6 + i / 6) % 1; const side = i % 2 ? 1 : -1; o.push(`<path d="M${f2(135 + side * (62 + u * 18))} ${f2(190 + (i >> 1) * 22)} l${side * 8} -2" stroke="#4a8fff" stroke-width="1.8" opacity="${f2(Math.sin(Math.PI * u))}"/>`); }
      o.push(pill(135, TY + 6, "ความร้อนที่เข้า ≈ ความร้อนที่เสีย", "#d8ffe3"));
      // กราฟเปรียบเทียบ
      o.push(`<rect x="170" y="96" width="92" height="64" rx="6" fill="#fff" opacity=".94" stroke="#2b3350" stroke-width=".8"/>`);
      const k = sm(0.1, 0.9, p);
      o.push(`<path d="M176 114 Q210 ${f2(114 + 20 * k)} ${f2(176 + 80 * k)} ${f2(114 + 36 * k)}" fill="none" stroke="#4a8fff" stroke-width="1.6"/>`);
      o.push(`<path d="M176 114 H${f2(176 + 80 * k)}" stroke="#ff7a3a" stroke-width="1.6"/>`);
      o.push(txt(216, 106, "อุณหภูมิเครื่องดื่ม", 5.6, "#2b3350", "middle", 800), txt(172, 154, "ไม่มีที่อุ่น", 5.4, "#4a8fff", "start", 700), txt(256, 154, "มีที่อุ่น", 5.4, "#ff7a3a", "end", 700));
    }
    if (c === "mug") {
      o.push(`<rect x="56" y="150" width="158" height="112" fill="#e9eff8" opacity=".0"/>`);
      for (const [ox, flat] of [[-38, true], [38, false]] as [number, boolean][]) {
        const x0 = 135 + ox;
        o.push(`<path d="M${x0 - 32} 214 H${x0 + 32} V248 Q${x0 + 32} 262 ${x0 + 20} 262 H${x0 - 20} Q${x0 - 32} 262 ${x0 - 32} 248 Z" fill="url(#cwmug)" stroke="#6b5f93" stroke-width="1.2"/>`);
        if (!flat) o.push(`<path d="M${x0 - 22} 262 Q${x0} 252 ${x0 + 22} 262 Z" fill="#cfd6e3" stroke="#6b5f93" stroke-width=".8"/><path d="M${x0 - 22} 262 Q${x0} 252 ${x0 + 22} 262" fill="#8a93a6" opacity=".4"/>`);
        const n = flat ? 6 : 2;
        for (let i = 0; i < n; i++) { const u = (ph * 0.7 + i / n) % 1, xx = flat ? x0 - 24 + i * 9.6 : x0 - 18 + i * 36; o.push(`<path d="M${f2(xx)} ${f2(262 - u * 24)} l-2.2 3 h4.4 z" fill="#ff9a3d" opacity="${f2(Math.sin(Math.PI * u))}"/>`); }
        o.push(pill(x0, 204, flat ? "ก้นเรียบ ✓" : "ก้นเว้า/สองชั้น ✕", flat ? "#d8ffe3" : "#ffd0c4"));
      }
      o.push(pill(135, TY + 6, "ก้นเรียบถ่ายความร้อนดีกว่า", "#fff6c9"));
    }
    if (c === "auto") {
      const hrs = sm(0, 0.6, p) * 8;
      o.push(`<g transform="translate(216 150)"><circle r="19" fill="#fff" stroke="#2b3350" stroke-width="1.4"/><path d="M0 0 V-14" stroke="#2b3350" stroke-width="2" transform="rotate(${f2(hrs * 30)})"/><path d="M0 0 V-10" stroke="#ff5a4a" stroke-width="2.4" transform="rotate(${f2(hrs * 30 * 12 / 8)})"/>${txt(0, 31, `${Math.floor(hrs)} ชม.`, 6.4, "#2b3350", "middle", 800)}</g>`);
      o.push(pill(135, TY + 6, p > 0.6 ? "ตัดไฟอัตโนมัติ" : "เปิดทิ้งไว้นานหลายชั่วโมง...", p > 0.6 ? "#ffd0c4" : "#fff6c9"));
    }
    if (c === "wear") {
      o.push(pill(135, TY + 6, "ความร้อนขึ้นลงทุกวัน → ผิวเคลือบลอก", "#ffe9b0"));
      o.push(txt(135, 254, "ร้อน ↔ เย็น", 6, "#bfe9ff", "middle", 700));
    }
    if (c === "chk") {
      const k = sm(0.05, 0.9, p);
      o.push(`<rect x="22" y="78" width="226" height="86" rx="10" fill="#fff" opacity=".94" stroke="#2b3350" stroke-width=".9"/>`);
      o.push(txt(135, 90, "วางแก้วร้อนทิ้งไว้ 10 นาที", 7, "#2b3350", "middle", 800));
      o.push(`<path d="M34 100 V150 H236" stroke="#7d8aa6" stroke-width=".8" fill="none"/>`);
      o.push(`<path d="M34 102 Q130 ${f2(102 + 6 * k)} ${f2(34 + 190 * k)} ${f2(102 + 14 * k)}" fill="none" stroke="#6bf29a" stroke-width="2"/>`);
      o.push(`<path d="M34 102 Q110 ${f2(102 + 14 * k)} ${f2(34 + 190 * k)} ${f2(102 + 38 * k)}" fill="none" stroke="#ff8a7a" stroke-width="2"/>`);
      o.push(txt(236, 114, "ตอนใหม่", 6, "#1c7a3a", "end", 800), txt(236, 142, "ตอนนี้ ?", 6, "#b8402f", "end", 800));
      o.push(txt(135, 160, "เย็นเร็วกว่าเดิมไหม?", 6.4, "#2b3350", "middle", 800));
    }
    o.push(H.box(F.box, ph));
    return o.join("");
  },
};
