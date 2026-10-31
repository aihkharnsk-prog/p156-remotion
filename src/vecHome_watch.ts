// ฉากอธิบาย: สมาร์ทวอทช์ — วัดชีพจรด้วยแสงเขียว (PPG), นับก้าวด้วยเซนเซอร์ความเร่ง, แบตลิเธียมไอออน, บลูทูธ — SVG พิกัด 270x480
// เน้นแอนิเมชัน: กล้องเลื่อนระหว่างระดับจุลภาค (หน้าตัดผิว) กับนาฬิกาทั้งเรือน, ทุก cue มีลูปเคลื่อนไหวตลอด
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#fff", anchor = "middle", w = 800) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, fill = "#fff6c9") => {
  const w = s.length * 4.4 + 10;
  return `<rect x="${f2(x - w / 2)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".97"/>` + txt(x, y + 0.4, s, 6.4, "#2b3350");
};
const qb = (a: Pt, c: Pt, b: Pt, u: number): Pt => {
  const v = 1 - u;
  return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
};
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));
// รูปคลื่นชีพจร (0..1) ตามเฟสหัวใจเต้น 0..1
const pw = (t: number) => { const u = t - Math.floor(t); return Math.exp(-(((u - 0.16) / 0.075) ** 2)) + 0.32 * Math.exp(-(((u - 0.42) / 0.09) ** 2)); };
const HRT = 1 / 1.2; // 72 ครั้ง/นาที

// ---- พารามิเตอร์ต่อ cue (ค่าที่ขาดใช้ 0) ----
type P = Record<string, number>;
const D: P = { cx: 135, cy: 140, z: 1, sy: 130, hud: 0, amp: 1, noise: 0, gap: 0, tat: 0, cold: 0, flt: 1, trc: 0, bpm: 0, fuzz: 0, flip: 0, swing: 1, lock: 0, ion: 0, dir: 0, soc: 1, fade: 0, link: 0, away: 0, plug: 0, cyc: 0, led: 1, dive: 0 };
const mk = (o: P): P => ({ ...D, ...o });
const LAYER: Record<string, string> = { all: "F", led: "HR", abs: "HR", beat: "HR", sig: "HR", move: "HR", skin: "HR", med: "HR", step: "S", lim: "S", batt: "B", chg: "B", age: "B", ble: "C", chk: "T", end: "F" };
const ORDER = ["all", "led", "abs", "beat", "sig", "move", "skin", "med", "step", "lim", "batt", "chg", "age", "ble", "chk", "end"];
const ST: Record<string, [P, P]> = {
  all: [mk({ cx: 135, cy: 130, z: 1, sy: 130 }), mk({ cx: 135, cy: 130, z: 1.25, sy: 130, flip: 1 })],
  led: [mk({ cx: 135, cy: 112, z: 1.2, sy: 120, led: 0 }), mk({ cx: 135, cy: 118, z: 3, sy: 130, led: 1 })],
  abs: [mk({ cx: 135, cy: 118, z: 3, sy: 130 }), mk({ cx: 135, cy: 128, z: 3.8, sy: 130 })],
  beat: [mk({ cx: 135, cy: 128, z: 3.8, sy: 120, hud: 0 }), mk({ cx: 135, cy: 128, z: 3.2, sy: 100, hud: 1, trc: 0.5 })],
  sig: [mk({ cx: 135, cy: 128, z: 3.2, sy: 100, hud: 1, trc: 1, flt: 0 }), mk({ cx: 135, cy: 118, z: 2.2, sy: 100, hud: 1, trc: 1, flt: 1, bpm: 1 })],
  move: [mk({ cx: 135, cy: 118, z: 2.2, sy: 100, hud: 1, trc: 1, bpm: 1 }), mk({ cx: 135, cy: 112, z: 2, sy: 96, hud: 1, trc: 1, bpm: 1, noise: 1, gap: 1 })],
  skin: [mk({ cx: 135, cy: 124, z: 2.4, sy: 100, hud: 1, trc: 1, bpm: 1, noise: 0, gap: 0, tat: 1 }), mk({ cx: 135, cy: 132, z: 2.2, sy: 100, hud: 1, trc: 1, bpm: 1, tat: 0, cold: 1 })],
  med: [mk({ cx: 135, cy: 132, z: 2.2, sy: 100, hud: 1, trc: 1, bpm: 1, cold: 0.5, fuzz: 1 }), mk({ cx: 135, cy: 150, z: 1.1, sy: 120, hud: 1, trc: 1, bpm: 1, fuzz: 1 })],
  step: [mk({ cx: 135, cy: 133, z: 0.8, sy: 100, hud: 1 }), mk({ cx: 150, cy: 112, z: 1.45, sy: 104, hud: 1 })],
  lim: [mk({ cx: 150, cy: 112, z: 1.45, sy: 104, hud: 1, lock: 0 }), mk({ cx: 150, cy: 135, z: 0.9, sy: 100, hud: 1, lock: 1 })],
  batt: [mk({ cx: 135, cy: 100, z: 1.1, sy: 120, dir: 0 }), mk({ cx: 135, cy: 98, z: 3.1, sy: 130, dir: 0, ion: 1 })],
  chg: [mk({ cx: 135, cy: 98, z: 3.1, sy: 130, ion: 1, dir: 1, plug: 0.2 }), mk({ cx: 135, cy: 120, z: 1.1, sy: 125, ion: 0.5, dir: 1, plug: 1 })],
  age: [mk({ cx: 135, cy: 120, z: 1.1, sy: 125, dir: 1, plug: 1, soc: 1 }), mk({ cx: 135, cy: 76, z: 1.8, sy: 125, dir: 1, plug: 1, fade: 1, cyc: 1 })],
  ble: [mk({ cx: 135, cy: 140, z: 1, sy: 135, link: 1 }), mk({ cx: 135, cy: 140, z: 1.05, sy: 135, link: 1, away: 1 })],
  chk: [mk({ cx: 135, cy: 140, z: 1, sy: 135 }), mk({ cx: 135, cy: 140, z: 1.1, sy: 135 })],
  end: [mk({ cx: 135, cy: 130, z: 1.25, sy: 130, flip: 1 }), mk({ cx: 135, cy: 130, z: 1, sy: 130, flip: 0 })],
};
const mixP = (a: P, b: P, t: number): P => { const o: P = {}; for (const k in D) o[k] = lerp(a[k], b[k], t); return o; };
const bg = (ph: number, w: number) => {
  let s = `<rect x="-140" y="-140" width="550" height="760" fill="url(#wbg)"/>`;
  for (let i = 0; i < 22; i++) {
    const x = rnd(i) * 270, y = 300 - ((ph * (3 + rnd(i + 9) * 5) + rnd(i + 4) * 340) % 340);
    s += `<circle cx="${f2(x + Math.sin(ph + i) * 4)}" cy="${f2(y)}" r="${f2(1 + rnd(i + 2) * 2.2)}" fill="#7fe3ff" opacity="${f2(0.08 + 0.07 * rnd(i + 7))}"/>`;
  }
  return s;
};
const DEFS = `<defs>
<linearGradient id="wbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232c55"/><stop offset="1" stop-color="#0e1328"/></linearGradient>
<radialGradient id="wgrn" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d8ffd0" stop-opacity=".95"/><stop offset=".4" stop-color="#4dff7a" stop-opacity=".55"/><stop offset="1" stop-color="#2cff6a" stop-opacity="0"/></radialGradient>
<linearGradient id="wcone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4dff7a" stop-opacity=".5"/><stop offset="1" stop-color="#4dff7a" stop-opacity="0"/></linearGradient>
<linearGradient id="wskin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d3b4"/><stop offset=".12" stop-color="#f0b79a"/><stop offset=".55" stop-color="#e79b88"/><stop offset="1" stop-color="#f1cf92"/></linearGradient>
<linearGradient id="wcase" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6c7794"/><stop offset=".35" stop-color="#c3cbe0"/><stop offset="1" stop-color="#5a6584"/></linearGradient>
<linearGradient id="wbat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8dff9a"/><stop offset="1" stop-color="#1fb85a"/></linearGradient>
<clipPath id="wcw"><path d="M20 140 Q20 114 60 114 H210 Q250 114 250 140 V240 Q250 330 135 330 Q20 330 20 240 Z"/></clipPath>
</defs>`;

// ================= ชั้น HR: หน้าตัดข้อมือ + ตัวนาฬิกาด้านหลัง =================
const VY = 146; // แนวหลอดเลือด
const LX = [98, 172], PDX = 135, SY = 114;
const hrWorld = (P: P, ph: number, z: number): string => {
  const o: string[] = [];
  const amp = P.amp * (1 - 0.55 * P.cold) * (1 - 0.8 * P.tat);
  const shk = P.noise;
  const wx = Math.sin(ph * 17) * 2.6 * shk, wy = -P.gap * 7 + Math.sin(ph * 23) * 1.8 * shk;
  // เนื้อเยื่อ
  o.push(`<g clip-path="url(#wcw)"><rect x="0" y="100" width="270" height="240" fill="url(#wskin)"/>`);
  o.push(`<rect x="0" y="${SY}" width="270" height="5" fill="#f9dfc6"/><rect x="0" y="176" width="270" height="1" fill="#d98a7a" opacity=".6"/>`);
  o.push(`<ellipse cx="135" cy="262" rx="46" ry="30" fill="#f4eedb" stroke="#cbbd9a" stroke-width="1"/>`);
  for (let i = 0; i < 9; i++) o.push(`<path d="M${40 + i * 25} 184 q8 -6 16 0" stroke="#d99b6e" stroke-width=".8" fill="none" opacity=".5"/>`);
  // หลอดเลือด: ความกว้างเปลี่ยนตามคลื่นชีพจรที่วิ่งไปตามหลอด
  const hw = (x: number) => (5 + 5.2 * pw(ph * 1.2 - x / 300) * amp) * (1 - 0.35 * P.cold);
  let top = "", bot = "";
  for (let x = -20; x <= 290; x += 6) { top += ` ${x},${f2(VY - hw(x))}`; bot = ` ${x},${f2(VY + hw(x))}` + bot; }
  const poly = `M${top.trim().replace(/ /g, " L")} L${bot.trim().replace(/ /g, " L")} Z`;
  o.push(`<path d="${poly}" fill="${mixc("#d23a48", "#8e1424", cl(pw(ph * 1.2 - 0.45) * amp))}" stroke="#7a1a28" stroke-width="1.2"/>`);
  for (const cx of [118, 154]) o.push(`<path d="M${cx} ${VY - 5} q-5 -12 0 -20" stroke="#c8323f" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`);
  // เม็ดเลือดแดง
  const lod = cl((z - 1.5) / 0.8);
  if (lod > 0.02) for (let i = 0; i < 70; i++) {
    const sp = 14 + 22 * pw(ph * 1.2 - 0.3) * amp;
    const x = ((rnd(i) * 330 + ph * sp + 40) % 330) - 30;
    const lp = pw(ph * 1.2 - x / 300);
    if (rnd(i + 99) > 0.5 + 0.5 * lp * amp) continue;
    const y = VY + (rnd(i + 31) - 0.5) * 2 * hw(x) * 0.7;
    o.push(`<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rnd(i + 5) * 40 - 20)})" opacity="${f2(lod)}"><ellipse rx="3" ry="1.9" fill="#a8182b"/><ellipse rx="1.2" ry=".7" fill="#e0606b" opacity=".7"/></g>`);
  }
  // รอยสัก
  if (P.tat > 0.02) {
    let d = "M70 120"; for (let x = 70; x <= 200; x += 10) d += ` L${x} ${f2(119 + rnd(x) * 3)}`; for (let x = 200; x >= 70; x -= 10) d += ` L${x} ${f2(129 + rnd(x + 3) * 4)}`;
    o.push(`<path d="${d} Z" fill="#241a3a" opacity="${f2(P.tat)}"/>`);
  }
  if (P.cold > 0.02) o.push(`<rect x="0" y="100" width="270" height="240" fill="#6fa8ff" opacity="${f2(0.2 * P.cold)}"/>`);
  o.push(`</g>`);
  // ตัวนาฬิกา (ขยับตามการสั่น/หลวม)
  o.push(`<g transform="translate(${f2(wx)} ${f2(wy)})">`);
  o.push(`<rect x="62" y="48" width="146" height="60" rx="9" fill="url(#wcase)" stroke="#2b3350" stroke-width="1.2"/><rect x="68" y="52" width="134" height="6" rx="3" fill="#0e1328"/><rect x="68" y="60" width="134" height="40" rx="3" fill="#1c2340"/>`);
  o.push(`<rect x="208" y="70" width="5" height="12" rx="2" fill="#8c97b4"/>`);
  o.push(`<rect x="76" y="64" width="22" height="10" rx="2" fill="#2f3a63"/><rect x="170" y="70" width="26" height="16" rx="2" fill="#2f3a63"/>`);
  o.push(`<rect x="82" y="96" width="106" height="12" fill="#3a4466"/>`);
  for (const bx of [111, 159]) o.push(`<rect x="${bx - 1.5}" y="96" width="3" height="19" fill="#12172b"/>`);
  o.push(`<rect x="86" y="108" width="98" height="4" rx="1.5" fill="#bfe9ff" opacity=".55"/>`);
  // LED + แสงเรือง
  const lg = 0.7 + 0.3 * Math.sin(ph * 9);
  for (const x of LX) o.push(`<rect x="${x - 6}" y="100" width="12" height="9" rx="2" fill="#173d2a"/><circle cx="${x}" cy="110" r="${f2(8 * P.led * lg)}" fill="url(#wgrn)"/><circle cx="${x}" cy="108.5" r="2.4" fill="#aaffbd"/>`);
  if (P.led > 0.05) for (const x of LX) o.push(`<path d="M${x - 5} 113 L${x - 22} 150 L${x + 22} 150 L${x + 5} 113 Z" fill="url(#wcone)" opacity="${f2(0.45 * P.led)}"/>`);
  const reflE = 1 - pw(ph * 1.2 - PDX / 300) * amp * 0.8;
  o.push(`<rect x="${PDX - 9}" y="100" width="18" height="9" rx="2" fill="#2a2f4a"/><circle cx="${PDX}" cy="110" r="${f2(6 + 7 * reflE * P.led)}" fill="url(#wgrn)" opacity="${f2(0.35 + 0.6 * reflE * P.led)}"/><rect x="${PDX - 5}" y="106" width="10" height="3" rx="1" fill="#e9fff0"/>`);
  o.push(`</g>`);
  // สายรัด
  o.push(`<path d="M64 100 Q16 106 14 160 V240 Q16 340 135 336 Q254 340 256 240 V160 Q254 106 206 100" fill="none" stroke="#10162c" stroke-width="7" opacity="${f2(1 - 0.5 * P.gap)}" transform="translate(0 ${f2(-P.gap * 4)})"/>`);
  // โฟตอน
  const N = 34, CY = 1.5;
  for (let i = 0; i < N; i++) {
    const t = ph / CY + i / N, cyc = Math.floor(t), u = t - cyc;
    const s = i * 7 + cyc * 13, side = i % 2, x0 = LX[side] + (rnd(s) - 0.5) * 6;
    const tEm = cyc * CY + (i / N) * -CY + CY * (i / N); // เวลาปล่อยโดยประมาณ
    const lp = pw(tEm * 1.2 - (x0 + PDX) / 600);
    const pAbs = (0.3 + 0.45 * lp * amp) ;
    const leak = rnd(s + 3) < P.gap * 0.65, ink = rnd(s + 5) < P.tat * 0.85, dead = rnd(s + 1) < pAbs;
    const y0 = SY - P.gap * 4 + wy * 0 ;
    let q: Pt, a = 1, kind = 0;
    if (leak) { q = [x0 + (side ? 1 : -1) * u * 70, y0 - 2 + Math.sin(u * 6) * 2]; a = 1 - u; kind = 1; }
    else if (ink) { q = qb([x0, y0], [x0 + (135 - x0) * 0.15, 130], [x0 + (135 - x0) * 0.3, 122], u); a = u > 0.92 ? 0 : 1; kind = 2; }
    else if (dead) { const xv = lerp(x0, PDX, 0.3 + 0.5 * rnd(s + 2)); q = qb([x0, y0], [(x0 + xv) / 2, VY + 12], [xv, VY - 2], u); a = u > 0.95 ? 0 : 1; kind = 2; }
    else { const dep = 122 + rnd(s + 4) * 14; q = qb([x0, y0], [(x0 + PDX) / 2, y0 + 2 * (dep - y0)], [PDX + (rnd(s + 6) - 0.5) * 8, y0], u); kind = 0; }
    if (u > 0.9 && kind === 2) { const k = (u - 0.9) / 0.1; o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(1 + k * 5)}" fill="none" stroke="#ffb0a0" stroke-width=".7" opacity="${f2(1 - k)}"/>`); }
    const sz = Math.max(0.5, 0.9 / Math.max(1, z * 0.45));
    if (a > 0.02) o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(sz * 3)}" fill="#4dff7a" opacity="${f2(0.28 * a * P.led)}"/><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${f2(sz)}" fill="#e6ffe9" opacity="${f2(a * P.led)}"/>`);
  }
  // แสงรอบข้างรั่วเข้า (สายหลวม)
  if (P.gap > 0.05) for (let i = 0; i < 12; i++) {
    const u = (ph * 0.7 + i / 12) % 1, side = i % 2 ? 1 : -1;
    o.push(`<circle cx="${f2(135 + side * (80 - 75 * u))}" cy="${f2(SY - 5 - P.gap * 2 + Math.sin(i + ph * 4) * 1.5)}" r="1.1" fill="#ffe27a" opacity="${f2(P.gap * Math.min(1, u * 4))}"/>`);
  }
  if (P.cold > 0.05) for (let i = 0; i < 8; i++) o.push(`<text x="${f2(30 + i * 30 + Math.sin(ph + i) * 6)}" y="${f2(60 + ((ph * 14 + i * 40) % 80))}" font-size="9" fill="#d8ecff" opacity="${f2(P.cold * 0.8)}">*</text>`);
  return o.join("");
};

// ================= แผงกราฟสัญญาณ (พิกัดหน้าจอ) =================
const heart = (x: number, y: number, s: number, c: string) =>
  `<path transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})" d="M0 4 C-9 -3 -5 -9 0 -4 C5 -9 9 -3 0 4Z" fill="${c}"/>`;
const hudHR = (P: P, ph: number): string => {
  if (P.hud < 0.02) return "";
  const amp = P.amp * (1 - 0.55 * P.cold) * (1 - 0.8 * P.tat);
  const X0 = 20, X1 = 196, Y0 = 214, Y1 = 266, W = 3.4;
  const sig = (t: number) => {
    let v = pw(t * 1.2) * amp;
    v += P.noise * (0.55 * Math.sin(t * 31) + 0.45 * Math.sin(t * 13 + 1) + 0.4 * Math.sin(t * 7.7)) * 1.1;
    v += (1 - P.flt) * (0.22 * Math.sin(t * 47) + 0.15 * Math.sin(t * 61 + 2) + 0.5 * Math.sin(t * 0.9));
    return v;
  };
  const o: string[] = [`<g opacity="${f2(P.hud)}"><rect x="12" y="206" width="246" height="66" rx="9" fill="#0b1022" stroke="#3a4a86" stroke-width="1.2" opacity=".92"/>`];
  const N = 90, n = Math.floor(N * cl(P.trc));
  let d = "", last: Pt = [X0, Y1];
  for (let i = 0; i <= n; i++) {
    const t = ph - (1 - i / N) * W, v = sig(t);
    const x = X0 + (X1 - X0) * (i / N), y = Y1 - 6 - (Y1 - Y0 - 12) * cl(v / 1.6 + 0.04, -0.1, 1.15);
    d += (i ? " L" : "M") + f2(x) + " " + f2(y); last = [x, y];
  }
  if (d) o.push(`<path d="${d}" fill="none" stroke="#5dff8a" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`);
  if (d) o.push(`<circle cx="${f2(last[0])}" cy="${f2(last[1])}" r="5" fill="url(#wgrn)"/><circle cx="${f2(last[0])}" cy="${f2(last[1])}" r="1.8" fill="#fff"/>`);
  // ยอดคลื่น + ตัวนับ
  const showPk = P.flt > 0.4 && P.noise < 0.5 && P.tat < 0.5;
  if (showPk) for (let b = Math.floor((ph - W) * 1.2); b <= Math.ceil(ph * 1.2); b++) {
    const t = (b + 0.16) / 1.2, i = N * (1 - (ph - t) / W);
    if (i < 0 || i > n) continue;
    const x = X0 + (X1 - X0) * (i / N), y = Y1 - 6 - (Y1 - Y0 - 12) * cl(sig(t) / 1.6 + 0.04, -0.1, 1.15);
    o.push(`<path d="M${f2(x)} ${f2(y - 4)} l-3 -5 h6z" fill="#ffe14a"/><line x1="${f2(x)}" y1="${f2(y - 10)}" x2="${f2(x)}" y2="${Y1}" stroke="#ffe14a" stroke-width=".5" stroke-dasharray="2 2" opacity=".5"/>`);
  }
  // หัวใจเต้น + ตัวเลข BPM
  const hp = pw(ph * 1.2), sc = 1 + 0.35 * hp;
  o.push(heart(222, 222, 1.4 * sc, "#ff4f6a"));
  const noisy = P.noise > 0.3, tatd = P.tat > 0.5;
  let val = Math.round(72 * cl(P.bpm));
  if (P.bpm > 0.95) val = 72 + Math.round(26 * P.noise * Math.sin(ph * 6.3) + 14 * P.tat * Math.sin(ph * 5) + 6 * P.fuzz * Math.sin(ph * 2.1));
  const col = noisy || tatd ? "#ff8a7a" : "#ffffff";
  if (P.bpm > 0.02) o.push(txt(232, 252, (P.fuzz > 0.3 ? "≈" : "") + String(val), 21, col, "middle", 900) + txt(232, 264, "BPM", 6.5, "#9fb0e8", "middle", 700));
  if (P.fuzz > 0.05) o.push(`<rect x="${f2(210 - 6 * Math.sin(ph * 2))}" y="236" width="${f2(44 + 12 * Math.sin(ph * 2))}" height="2.4" rx="1.2" fill="#ffe14a" opacity="${f2(0.7 * P.fuzz)}"/>`);
  o.push(`</g>`);
  return o.join("");
};

// ================= ชั้น F: นาฬิกาทั้งเรือน (ด้านหน้า ↔ ด้านหลัง พลิก) =================
const watchFace = (cx: number, cy: number, s: number, ph: number, flipv: number, big = true): string => {
  const ang = Math.PI * ease(cl(flipv)), c = Math.cos(ang), a = Math.abs(c);
  const o: string[] = [`<g transform="translate(${cx} ${cy}) scale(${f2(Math.max(0.02, a) * s)} ${s})">`];
  o.push(`<rect x="-9" y="-80" width="18" height="160" fill="#10162c"/><rect x="-5" y="-80" width="10" height="160" fill="#1a2140"/>`);
  for (let i = 0; i < 4; i++) o.push(`<circle cx="0" cy="${-74 + i * 6}" r="1" fill="#3a4466"/><circle cx="0" cy="${50 + i * 6}" r="1" fill="#3a4466"/>`);
  if (c >= 0) {
    const hp = pw(ph * 1.2);
    o.push(`<rect x="-32" y="-38" width="64" height="76" rx="15" fill="url(#wcase)" stroke="#2b3350" stroke-width="1.5"/><rect x="-27" y="-33" width="54" height="66" rx="11" fill="#070a16"/>`);
    o.push(`<rect x="32" y="-10" width="4" height="12" rx="2" fill="#8c97b4"/>`);
    o.push(heart(0, -13, 2.6 + 0.9 * hp, "#ff4f6a").replace("<path", `<path style="filter:drop-shadow(0 0 3px #ff4f6a)"`));
    o.push(txt(0, 19, "72", 17, "#fff", "middle", 900));
    o.push(`<rect x="-14" y="25" width="28" height="2" rx="1" fill="#5dff8a" opacity=".7"/>`);
    o.push(`<path d="M-31 -34 L-10 -38 L-20 -26 Z" fill="#fff" opacity=".12"/>`);
  } else {
    o.push(`<rect x="-32" y="-38" width="64" height="76" rx="15" fill="#2f3855" stroke="#2b3350" stroke-width="1.5"/><circle cx="0" cy="0" r="25" fill="#10162c" stroke="#aeb9d6" stroke-width="1.4"/>`);
    for (const [x, y] of [[-12, -10], [12, -10], [0, 14]] as Pt[]) o.push(`<circle cx="${x}" cy="${y}" r="${f2(10 + 3 * Math.sin(ph * 9))}" fill="url(#wgrn)"/><circle cx="${x}" cy="${y}" r="3.4" fill="#b8ffc6"/>`);
    o.push(`<circle cx="0" cy="-1" r="5" fill="#e9fff0" stroke="#7a8bb8" stroke-width="1"/>`);
  }
  o.push(`</g>`);
  return o.join("");
};
const layerF = (P: P, ph: number): string => {
  const o: string[] = [];
  o.push(`<rect x="100" y="-400" width="70" height="1100" rx="30" fill="#e9b392"/><rect x="100" y="-400" width="22" height="1100" rx="20" fill="#f6cdb0" opacity=".6"/>`);
  for (let i = 0; i < 6; i++) { const r = ((ph * 0.7 + i / 6) % 1); o.push(`<circle cx="135" cy="130" r="${f2(30 + r * 62)}" fill="none" stroke="#7fe3ff" stroke-width="1.2" opacity="${f2(0.5 * (1 - r) * (P.flip < 0.5 ? 1 : 0.3))}"/>`); }
  o.push(watchFace(135, 130, 1, ph, P.flip));
  return o.join("");
};

// ================= ชั้น S: เดิน แกว่งแขน นับก้าว =================
const sActive = (P: P, ph: number) => (P.lock > 0.5 ? 0.1 : 1);
const layerS = (P: P, ph: number): string => {
  const o: string[] = [];
  const sw = 0.62 * Math.sin(ph * 2 * Math.PI * 0.95) * (1 - P.lock) - 0.35 * P.lock;
  const lg = 0.5 * Math.sin(ph * 2 * Math.PI * 0.95);
  const SX = 135, SYY = 62, HIP: Pt = [135, 150];
  const gy = 247;
  // พื้นเลื่อน
  for (let i = 0; i < 14; i++) o.push(`<rect x="${f2(((i * 24 - ph * 70) % 336 + 336) % 336 - 30)}" y="${gy + 3}" width="12" height="2" rx="1" fill="#3a4a86" opacity=".7"/>`);
  o.push(`<rect x="-40" y="${gy}" width="350" height="3" fill="#2f3a63"/>`);
  // ขา
  for (const k of [1, -1]) {
    const a = lg * k, kx = HIP[0] + Math.sin(a) * 88, ky = HIP[1] + Math.cos(a) * 88;
    o.push(`<path d="M${HIP[0]} ${HIP[1]} L${f2(kx)} ${f2(Math.min(ky, gy - 2))}" stroke="${k > 0 ? "#2b3a78" : "#1f2b5e"}" stroke-width="12" stroke-linecap="round"/><ellipse cx="${f2(kx + 6)}" cy="${f2(Math.min(ky, gy - 2) + 1)}" rx="9" ry="4" fill="#e8ecff"/>`);
    const strike = Math.abs(Math.sin(a * 1)) > 0.45 && ky > gy - 6;
    if (strike) o.push(`<circle cx="${f2(kx + 4)}" cy="${gy}" r="${f2(6 + 5 * Math.abs(Math.sin(a)))}" fill="none" stroke="#ffe14a" stroke-width="1.2" opacity=".7"/>`);
  }
  // ลำตัว หัว
  o.push(`<rect x="114" y="52" width="42" height="104" rx="18" fill="#3f9d8f"/><circle cx="135" cy="30" r="14" fill="#e9b392"/><path d="M121 28 Q135 12 149 28" fill="#241a3a"/>`);
  // แขน (ไหล่ → ข้อมือ) + เงานาฬิกาตกค้าง
  const L = 86, wr = (t: number): Pt => { const s2 = 0.62 * Math.sin((ph - t) * 2 * Math.PI * 0.95) * (1 - P.lock) - 0.35 * P.lock; return [SX + Math.sin(s2) * L, SYY + Math.cos(s2) * L]; };
  const W = wr(0);
  o.push(`<path d="M${SX} ${SYY} L${f2(SX + Math.sin(sw) * 46)} ${f2(SYY + Math.cos(sw) * 46)}" stroke="#3f9d8f" stroke-width="13" stroke-linecap="round"/><path d="M${f2(SX + Math.sin(sw) * 46)} ${f2(SYY + Math.cos(sw) * 46)} L${f2(W[0])} ${f2(W[1])}" stroke="#e9b392" stroke-width="10" stroke-linecap="round"/>`);
  for (let k = 7; k >= 1; k--) { const g = wr(k * 0.035); o.push(`<rect x="${f2(g[0] - 7)}" y="${f2(g[1] - 4)}" width="14" height="8" rx="3" fill="#7fe3ff" opacity="${f2(0.28 - k * 0.035)}"/>`); }
  o.push(`<g transform="translate(${f2(W[0])} ${f2(W[1])}) rotate(${f2((-sw * 180) / Math.PI)})"><rect x="-9" y="-6" width="18" height="12" rx="4" fill="url(#wcase)" stroke="#2b3350" stroke-width="1"/><rect x="-6" y="-3.5" width="12" height="7" rx="2" fill="#0b1022"/>${heart(0, 0, 0.55, "#ff4f6a")}</g>`);
  o.push(`<circle cx="${f2(W[0] + Math.sin(sw) * 8)}" cy="${f2(W[1] + Math.cos(sw) * 9)}" r="5.5" fill="#e9b392"/>`);
  // รถเข็น
  if (P.lock > 0.02) {
    const a = P.lock, hx = W[0] + 10, hy = W[1] + 4;
    o.push(`<g opacity="${f2(a)}"><path d="M${f2(hx)} ${f2(hy)} L${f2(hx + 34)} ${f2(hy + 36)} L${f2(hx + 34)} 214 M${f2(hx + 34)} ${f2(hy + 36)} L${f2(hx + 74)} ${f2(hy + 36)}" stroke="#ffb14a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="${f2(hx + 34)}" y="${f2(hy + 8)}" width="42" height="30" rx="10" fill="#ff9a4a"/>`);
    for (const wx of [hx + 40, hx + 72]) o.push(`<g transform="translate(${f2(wx)} 232) rotate(${f2(ph * 420)})"><circle r="11" fill="#1a2140" stroke="#9fb0e8" stroke-width="2"/><path d="M-11 0H11M0 -11V11" stroke="#9fb0e8" stroke-width="1.4"/></g>`);
    o.push(`</g>`);
  }
  if (P.lock > 0.3) o.push(pill(W[0] + 40, W[1] - 14, "แขนไม่แกว่ง", "#ffd9c9"));
  return o.join("");
};
const hudS = (P: P, ph: number, lt: number, cue: string): string => {
  if (P.hud < 0.02) return "";
  const X0 = 20, X1 = 196, Y0 = 214, Y1 = 266, W = 3.0, o: string[] = [`<g opacity="${f2(P.hud)}"><rect x="12" y="206" width="246" height="66" rx="9" fill="#0b1022" stroke="#3a4a86" stroke-width="1.2" opacity=".92"/>`];
  const act = 1 - 0.93 * P.lock;
  const sig = (t: number) => (Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * 0.95 * 2 * t), 2.2) * act + 0.04 * Math.sin(t * 40) * (1 - act) + 0.05);
  const N = 90; let d = "", last: Pt = [X0, Y1];
  for (let i = 0; i <= N; i++) { const t = ph - (1 - i / N) * W; const x = X0 + (X1 - X0) * i / N, y = Y1 - 6 - (Y1 - Y0 - 12) * cl(sig(t)); d += (i ? " L" : "M") + f2(x) + " " + f2(y); last = [x, y]; }
  o.push(`<path d="${d}" fill="none" stroke="#7fe3ff" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${f2(last[0])}" cy="${f2(last[1])}" r="5" fill="#7fe3ff" opacity=".4"/><circle cx="${f2(last[0])}" cy="${f2(last[1])}" r="1.8" fill="#fff"/>`);
  const thr = Y1 - 6 - (Y1 - Y0 - 12) * 0.55;
  o.push(`<line x1="${X0}" y1="${f2(thr)}" x2="${X1}" y2="${f2(thr)}" stroke="#ffe14a" stroke-width=".6" stroke-dasharray="3 3" opacity=".7"/>`);
  if (act > 0.5) for (let b = Math.floor((ph - W) * 1.9) - 1; b <= Math.ceil(ph * 1.9); b++) {
    const t = b / 1.9, i = N * (1 - (ph - t) / W); if (i < 0 || i > N) continue;
    const x = X0 + (X1 - X0) * i / N; o.push(`<circle cx="${f2(x)}" cy="${f2(Y1 - 6 - (Y1 - Y0 - 12) * cl(sig(t)))}" r="2.6" fill="#ffe14a"/>`);
  }
  const n = cue === "lim" ? 14 : Math.floor(lt * 1.9);
  o.push(`<path transform="translate(222 222)" d="M-4 -4 q3 -2 4 2 t0 6 M2 0 q3 -2 4 2 t-1 6" stroke="${P.lock > 0.5 ? "#8a93b8" : "#7fe3ff"}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
  o.push(txt(232, 252, String(n), 21, P.lock > 0.5 ? "#ff8a7a" : "#fff", "middle", 900) + txt(232, 264, "ก้าว", 6.5, "#9fb0e8", "middle", 700));
  o.push(`</g>`);
  return o.join("");
};

// ================= ชั้น B: แบตเตอรี่ลิเธียมไอออน =================
const BX0 = 96, BX1 = 174, BY0 = 74, BY1 = 126;
const layerB = (P: P, ph: number, cue: string, p: number): string => {
  const o: string[] = [];
  const chg = P.dir > 0.5;
  let soc = cue === "batt" ? lerp(0.9, 0.45, p) : cue === "chg" ? lerp(0.25, 1, p) : 1;
  let cap = 1;
  if (cue === "age") { const k = p * 3; cap = 1 - 0.2 * sm(0.05, 0.95, p); soc = cap * (0.55 + 0.45 * Math.cos(2 * Math.PI * k)); }
  const flow = cue === "age" ? 1 : 0;
  // ตัวเรือน
  o.push(`<rect x="78" y="40" width="114" height="130" rx="16" fill="#1c2340" stroke="#8c97b4" stroke-width="2"/><rect x="84" y="46" width="102" height="118" rx="11" fill="#10162c"/>`);
  // ชิปที่ถูกเลี้ยงไฟ
  const chipOn = !chg ? 1 : 0.25;
  o.push(`<rect x="112" y="54" width="46" height="12" rx="2" fill="${mixc("#2f3a63", "#ffe14a", 0.7 * chipOn * (0.6 + 0.4 * Math.sin(ph * 8)))}" stroke="#aeb9d6" stroke-width=".8"/>`);
  o.push(`<path d="M100 74 V60 H112 M158 60 H172 V74" fill="none" stroke="#7a86ad" stroke-width="1.6"/>`);
  for (let i = 0; i < 5; i++) {
    const u = (ph * 0.8 + i / 5) % 1, d = chg || flow ? 1 - u : u;
    const pos: Pt = d < 0.15 ? [100 + 0, 74 - (d / 0.15) * 14] : d < 0.85 ? [100 + 12 + ((d - 0.15) / 0.7 - 0) * 0, 60] : [172, 60 + ((d - 0.85) / 0.15) * 14];
    const x = d < 0.15 ? 100 : d > 0.85 ? 172 : lerp(100, 172, (d - 0.15) / 0.7);
    o.push(`<circle cx="${f2(x)}" cy="${f2(d < 0.15 ? 74 - (d / 0.15) * 14 : d > 0.85 ? 60 + ((d - 0.85) / 0.15) * 14 : 60)}" r="2" fill="#7fe3ff" opacity=".9"/>`);
  }
  // ขั้วลบ (แกรไฟต์) / ตัวแยก / ขั้วบวก
  const lith = chg || flow ? soc : 1 - soc * 0 ;
  const anodeFill = mixc("#4a5470", "#ffb14a", cl(soc * 0.9));
  o.push(`<rect x="${BX0}" y="${BY0}" width="${BX1 - BX0}" height="${BY1 - BY0}" rx="5" fill="#0b1022" stroke="#aeb9d6" stroke-width="1.2"/>`);
  o.push(`<rect x="${BX0 + 3}" y="${BY0 + 3}" width="28" height="${BY1 - BY0 - 6}" rx="3" fill="${anodeFill}"/>`);
  for (let i = 0; i < 6; i++) o.push(`<line x1="${BX0 + 3}" y1="${BY0 + 9 + i * 7}" x2="${BX0 + 31}" y2="${BY0 + 9 + i * 7}" stroke="#1c2340" stroke-width="1.2" opacity=".6"/>`);
  o.push(`<rect x="${BX0 + 31}" y="${BY0 + 3}" width="14" height="${BY1 - BY0 - 6}" fill="#e8ecff" opacity=".18"/><line x1="${BX0 + 38}" y1="${BY0 + 3}" x2="${BX0 + 38}" y2="${BY1 - 3}" stroke="#aeb9d6" stroke-width=".8" stroke-dasharray="2 2"/>`);
  o.push(`<rect x="${BX1 - 31}" y="${BY0 + 3}" width="28" height="${BY1 - BY0 - 6}" rx="3" fill="${mixc("#5a7bd6", "#34408a", cl(soc * 0.9))}"/>`);
  txtSigns(o);
  // ไอออนลิเธียม
  const ionA = 0.4 + 0.6 * cl(P.ion + 0.3);
  for (let i = 0; i < 26; i++) {
    const u = (ph * (flow ? 1.6 : 0.55) + rnd(i) * 3.1) % 1, dirv = flow ? (Math.floor(ph * 1.6 / 1 + i) % 2 ? 1 : -1) : chg ? -1 : 1;
    const x0 = dirv > 0 ? BX0 + 14 : BX1 - 14, x1 = dirv > 0 ? BX1 - 14 : BX0 + 14;
    const x = lerp(x0, x1, ease(u)), y = BY0 + 6 + rnd(i + 20) * (BY1 - BY0 - 12) + Math.sin(ph * 3 + i) * 1.5;
    const a = Math.sin(u * Math.PI);
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(3.4)}" fill="#ffd36a" opacity="${f2(0.35 * a * ionA)}"/><circle cx="${f2(x)}" cy="${f2(y)}" r="1.5" fill="#fff3c0" opacity="${f2(a * ionA)}"/>`);
  }
  // ไอคอนแบต (ระดับประจุ) + ขีดรอบชาร์จ
  const lv = cl(soc);
  o.push(`<rect x="106" y="14" width="58" height="18" rx="5" fill="none" stroke="#e8ecff" stroke-width="1.6"/><rect x="164" y="19" width="3" height="8" rx="1.2" fill="#e8ecff"/>`);
  if (cue === "age") o.push(`<rect x="108" y="16" width="${f2(54 * cap)}" height="14" rx="3.5" fill="none" stroke="#ff8a7a" stroke-width=".9" stroke-dasharray="2 2"/><rect x="${f2(108 + 54 * cap)}" y="16" width="${f2(54 * (1 - cap))}" height="14" rx="3" fill="#ff8a7a" opacity=".25"/>`);
  o.push(`<rect x="108" y="16" width="${f2(Math.max(0, 54 * lv - 0.01))}" height="14" rx="3.5" fill="${lv < 0.25 ? "#ff6a5a" : "url(#wbat)"}"/>`);
  o.push(`<text x="135" y="28.5" font-size="8.5" fill="#fff" stroke="#10162c" stroke-width="1.6" paint-order="stroke" ${K} font-weight="900" text-anchor="middle">${Math.round(lv * 100)}</text>`);
  if (cue === "age") for (let i = 0; i < Math.floor(p * 14); i++) o.push(`<rect x="${f2(108 + i * 4)}" y="36" width="2" height="4" rx="1" fill="#9fb0e8"/>`);
  // ที่ชาร์จ
  const pg = cl(P.plug);
  if (pg > 0.02) {
    o.push(`<g opacity="${f2(pg)}"><path d="M30 190 H100" stroke="#8c97b4" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="100" y="172" width="70" height="12" rx="6" fill="#aeb9d6" stroke="#2b3350" stroke-width="1"/>`);
    for (let i = 0; i < 6; i++) { const u = (ph * 0.9 + i / 6) % 1; o.push(`<circle cx="${f2(34 + 66 * u)}" cy="190" r="2" fill="#ffe14a"/>`); }
    for (let i = 0; i < 9; i++) { const u = (ph * 0.8 + i / 9) % 1; o.push(`<path d="M${f2(104 + i * 7)} ${f2(170 - 22 * u)} l2 -3 l2 3z" fill="#ffe14a" opacity="${f2(Math.sin(u * Math.PI))}"/>`); }
    o.push(`</g>`);
  }
  // ใช้งาน: พลังงานออกไปเลี้ยงเซนเซอร์/หน้าจอ
  if (!chg && !flow) for (let i = 0; i < 6; i++) { const u = (ph * 0.9 + i / 6) % 1; o.push(`<circle cx="${f2(135 + (rnd(i) - 0.5) * 70)}" cy="${f2(BY1 + 6 + 28 * u)}" r="1.6" fill="#ffe14a" opacity="${f2(1 - u)}"/>`); }
  return o.join("");
};
function txtSigns(o: string[]) {
  o.push(txt(BX0 + 17, BY1 + 11, "−", 9, "#9fb0e8", "middle", 900), txt(BX1 - 17, BY1 + 11, "+", 9, "#9fb0e8", "middle", 900));
}

// ================= ชั้น C: บลูทูธกระโดดช่องความถี่ไปมือถือ =================
const layerC = (P: P, ph: number, p: number): string => {
  const o: string[] = [];
  const away = sm(0.45, 0.6, p) * (1 - sm(0.78, 0.92, p));
  const px = 206 + 40 * away, WX = 56, LY = (i: number) => 96 + i * 16, X0 = 88, X1 = 176 + 40 * away;
  for (let i = 0; i < 6; i++) o.push(`<line x1="${X0}" y1="${LY(i)}" x2="${f2(X1)}" y2="${LY(i)}" stroke="#7fe3ff" stroke-width=".6" stroke-dasharray="1 3" opacity="${f2(0.4 * (1 - away))}"/>`);
  // คลื่นวิทยุ
  for (let i = 0; i < 4; i++) { const u = (ph * 0.8 + i / 4) % 1; o.push(`<path d="M${f2(WX + 20 + u * 26)} ${f2(136 - 10 - u * 22)} Q${f2(WX + 30 + u * 40)} 136 ${f2(WX + 20 + u * 26)} ${f2(136 + 10 + u * 22)}" fill="none" stroke="#7fe3ff" stroke-width="1.4" opacity="${f2((1 - u) * 0.6 * (1 - away))}"/>`); }
  // แพ็กเก็ตกระโดดช่อง
  const NP = 8;
  for (let i = 0; i < NP; i++) {
    const t = ph * 0.55 + i / NP, cyc = Math.floor(t), u = t - cyc;
    if (away > 0.5) continue;
    const hops = 6, k = u * hops, hi = Math.floor(k), fr = k - hi;
    const lane = (j: number) => Math.floor(rnd(cyc * 7 + i + j * 3) * 6);
    const y = lerp(LY(lane(hi)), LY(lane(Math.min(hops, hi + 1))), ease(cl(fr * 2.2))) - Math.sin(Math.PI * cl(fr * 2.2)) * 8;
    const x = lerp(X0, X1, u), kind = i % 2;
    o.push(`<rect x="${f2(x - 4)}" y="${f2(y - 3)}" width="8" height="6" rx="1.8" fill="${kind ? "#ff4f6a" : "#7fe3ff"}" stroke="#fff" stroke-width=".6" opacity="${f2(1 - away * 2)}"/>`);
    if (kind) o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.1" fill="#fff"/>`);
    if (i === 3 && u > 0.9) o.push(`<circle cx="${px - 20}" cy="136" r="${f2((u - 0.9) * 60)}" fill="none" stroke="#fff" stroke-width="1" opacity="${f2(1 - (u - 0.9) * 10)}"/>`);
  }
  // แจ้งเตือนย้อนกลับ
  for (let i = 0; i < 2; i++) { const u = (ph * 0.4 + i * 0.5) % 1; if (away < 0.5) o.push(`<g transform="translate(${f2(lerp(X1, X0, u))} ${f2(LY(2 + i * 2) + Math.sin(u * 20) * 2)})"><circle r="3.6" fill="#ffe14a" stroke="#2b3350" stroke-width=".7"/><path d="M-1.6 1.2h3.2M0 -2v2" stroke="#2b3350" stroke-width=".8"/></g>`); }
  // บัฟเฟอร์สะสมที่นาฬิกาตอนห่าง
  if (away > 0.05) for (let i = 0; i < 6; i++) { const q = cl(away * 2 - i * 0.12); o.push(`<rect x="${f2(WX + 24)}" y="${f2(182 - i * 7)}" width="8" height="5" rx="1.5" fill="#ff4f6a" opacity="${f2(q)}"/>`); }
  if (away > 0.2) o.push(`<path d="M${X0} 136 H${f2(X1)}" stroke="#ff8a7a" stroke-width="1.4" stroke-dasharray="3 4" opacity="${f2(away)}"/>`);
  // นาฬิกา + มือถือ
  o.push(watchFace(WX, 136, 0.62, ph, 0));
  const bump = 1 + 0.06 * pw(ph * 1.2 - 0.3);
  o.push(`<g transform="translate(${f2(px)} 136) scale(${f2(bump)})"><rect x="-26" y="-50" width="52" height="100" rx="9" fill="#10162c" stroke="#aeb9d6" stroke-width="2"/><rect x="-22" y="-44" width="44" height="86" rx="5" fill="#1c2750"/><rect x="-7" y="-47" width="14" height="2.4" rx="1.2" fill="#3a4a86"/>${heart(-8, -22, 1.5 + 0.4 * pw(ph * 1.2), "#ff4f6a")}<rect x="2" y="-26" width="16" height="3" rx="1.5" fill="#9fb0e8"/><rect x="2" y="-20" width="11" height="3" rx="1.5" fill="#5a6a9e"/>`);
  for (let i = 0; i < 4; i++) o.push(`<rect x="${-18 + i * 9}" y="${f2(30 - 14 * (0.4 + 0.6 * Math.abs(Math.sin(ph * 1.5 + i))))}" width="6" height="${f2(14 * (0.4 + 0.6 * Math.abs(Math.sin(ph * 1.5 + i))))}" rx="2" fill="#7fe3ff" opacity=".8"/>`);
  o.push(`</g>`);
  return o.join("");
};

// ================= ชั้น T: ช่วงห่างระหว่างครั้งที่เสียบสายชาร์จ =================
const layerT = (P: P, ph: number, p: number): string => {
  const o: string[] = [];
  const X0 = 22, Y0 = 70, Y1 = 190;
  o.push(`<rect x="14" y="56" width="242" height="150" rx="12" fill="#10162c" stroke="#3a4a86" stroke-width="1.2" opacity=".9"/>`);
  // จุดชาร์จ + ฟันเลื่อย: ช่วงห่างหดลงตามเวลา
  const marks: number[] = []; let x = X0 + 6, g = 46;
  while (x < 252) { marks.push(x); x += g; g = Math.max(14, g * 0.78); }
  const reveal = X0 + 6 + (250 - X0) * ease(cl(p / 0.85));
  let d = `M${marks[0]} ${Y1}`;
  marks.forEach((m, i) => {
    const nx = i + 1 < marks.length ? marks[i + 1] : 254;
    d += ` L${m} ${Y0} L${nx - 1} ${Y1}`;
  });
  o.push(`<clipPath id="wtc"><rect x="14" y="56" width="${f2(Math.max(0, reveal - 14))}" height="150"/></clipPath><path d="${d}" fill="none" stroke="#5dff8a" stroke-width="2" stroke-linejoin="round" clip-path="url(#wtc)"/>`);
  marks.forEach((m, i) => {
    if (m > reveal) return;
    const k = 1 + 0.25 * Math.max(0, Math.sin(ph * 6 - i));
    o.push(`<g transform="translate(${f2(m)} ${Y0 - 9}) scale(${f2(k)})"><circle r="5.5" fill="#ffe14a" stroke="#2b3350" stroke-width=".8"/><path d="M1 -3.5 L-2 .5 H0.5 L-1 3.5 L2.5 -.8 H0Z" fill="#2b3350"/></g>`);
  });
  o.push(`<line x1="${X0}" y1="${Y1 + 6}" x2="252" y2="${Y1 + 6}" stroke="#aeb9d6" stroke-width="1"/><circle cx="${f2(reveal)}" cy="${Y1 + 6}" r="3" fill="#7fe3ff"/>`);
  // วงเล็บช่วงห่าง: แรก vs ล่าสุด
  const a = 0.5 + 0.5 * Math.sin(ph * 4);
  const b1 = [marks[0], marks[1]], n = marks.length, b2 = [marks[n - 2], marks[n - 1]];
  o.push(`<path d="M${f2(b1[0])} ${Y1 + 15} H${f2(b1[1])} M${f2(b1[0])} ${Y1 + 11} v8 M${f2(b1[1])} ${Y1 + 11} v8" stroke="#ffe14a" stroke-width="1.6" opacity="${f2(0.5 + 0.5 * a)}"/>`);
  if (reveal > b2[1]) o.push(`<path d="M${f2(b2[0])} ${Y1 + 15} H${f2(b2[1])} M${f2(b2[0])} ${Y1 + 11} v8 M${f2(b2[1])} ${Y1 + 11} v8" stroke="#ff8a7a" stroke-width="1.6" opacity="${f2(0.5 + 0.5 * (1 - a))}"/>`);
  o.push(pill(135, 46, "ห่างกี่วัน?"));
  return o.join("");
};

// ================= ประกอบฉาก =================
const layerOf = (L: string, P: P, ph: number, cue: string, p: number, lt: number) => {
  const wz = (w: string) => w;
  if (L === "HR") return { w: wz(hrWorld(P, ph, P.z)), h: hudHR(P, ph) };
  if (L === "F") return { w: layerF(P, ph), h: "" };
  if (L === "S") return { w: layerS(P, ph), h: hudS(P, ph, lt, cue) };
  if (L === "B") return { w: layerB(P, ph, cue, p), h: "" };
  if (L === "C") return { w: layerC(P, ph, p), h: "" };
  return { w: layerT(P, ph, p), h: "" };
};
const place = (L: string, P: P, ph: number, cue: string, p: number, lt: number, w: number, k: number) => {
  if (w < 0.01) return "";
  const r = layerOf(L, P, ph, cue, p, lt);
  return `<g opacity="${f2(w)}"><g transform="translate(135 150) scale(${f2(k)}) translate(-135 -150)"><g transform="translate(135 ${f2(P.sy)}) scale(${f2(P.z)}) translate(${f2(-P.cx)} ${f2(-P.cy)})">${r.w}</g>${r.h}</g></g>`;
};

export const SCENE_WATCH: SceneDef = {
  focus: Object.fromEntries(ORDER.map((c) => [c, { cx: 135, cy: 240, z: 1 }])),
  render: ({ frame, cue, p, ef }) => {
    const ph = frame / 30;
    const c = ORDER.includes(cue) ? cue : "all";
    const idx = ORDER.indexOf(c), prev = idx > 0 ? ORDER[idx - 1] : null;
    const [A, B] = ST[c];
    const Pc = mixP(A, B, ease(p));
    const e2 = sm(0, 26, ef);
    const lt = ef / 30;
    const o: string[] = [DEFS, bg(ph, 1)];
    const Lc = LAYER[c];
    if (!prev || e2 >= 1) o.push(place(Lc, Pc, ph, c, p, lt, 1, 1));
    else if (LAYER[prev] === Lc) o.push(place(Lc, mixP(ST[prev][1], Pc, e2), ph, c, p, lt, 1, 1));
    else {
      o.push(place(LAYER[prev], ST[prev][1], ph, prev, 1, 99, 1 - e2, 1 + 0.45 * e2));
      o.push(place(Lc, Pc, ph, c, p, lt, e2, 0.7 + 0.3 * e2));
    }
    return o.join("");
  },
};
