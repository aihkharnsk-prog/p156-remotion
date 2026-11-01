// ฉากอธิบาย: ทิชชู่ซอฟต์แพ็ค — แผ่นพับสอดกันทำไมดึงแล้วแผ่นต่อไปโผล่ + เส้นใยเซลลูโลสดูดน้ำ — SVG พิกัด 270x480
// โซนบน = ซองตัดครึ่ง (แผ่นพับสอดกัน), โซนล่าง = เลนส์ซูมเข้าเส้นใยกระดาษ, กล้องเลื่อนไปมาระหว่างสองโซน
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, box } = H;
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

const CX = 135;
const LH = 12; // ระยะห่างชั้นกระดาษ
const Y0 = 99; // ชั้นบนสุด
const SLIT_Y = 80;
const NSH = 7; // จำนวนแผ่นที่วาด
const TINT = ["#ffffff", "#ffdcc4"];

const DEFS = `<defs>
<linearGradient id="tbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f1e4"/><stop offset="1" stop-color="#e6dcc8"/></linearGradient>
<linearGradient id="tpk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8e4ff" stop-opacity=".16"/><stop offset="1" stop-color="#9cc8f0" stop-opacity=".12"/></linearGradient>
<radialGradient id="tlens" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#f1e6cf"/></radialGradient>
<clipPath id="tlc"><circle cx="135" cy="352" r="80"/></clipPath>
<clipPath id="tpc"><path d="M-200 -200 H500 V84 H208 V192 Q208 202 198 202 H72 Q62 202 62 192 V84 H-200 Z"/></clipPath>
</defs>`;

// เส้นทางแผ่นพับรูปตัวยู: fold อยู่ที่ xf, ปลายอิสระที่ xt
const sheetD = (xf: number, xt: number, yU: number, yL: number, tipU?: Pt) => {
  const d = Math.sign(xt - xf), r = Math.min(6, (yL - yU) / 2);
  const up = tipU ? `L${f2(xf + d * 40)} ${f2(yU)} Q${f2(tipU[0])} ${f2(yU)} ${f2(tipU[0])} ${f2(tipU[1])}` : `L${f2(xt)} ${f2(yU)}`;
  const s = tipU ? `M${f2(tipU[0])} ${f2(tipU[1])} Q${f2(tipU[0])} ${f2(yU)} ${f2(xf + d * 40)} ${f2(yU)} L${f2(xf + d * r)} ${f2(yU)}` : `M${f2(xt)} ${f2(yU)} L${f2(xf + d * r)} ${f2(yU)}`;
  void up;
  return `${s} Q${f2(xf)} ${f2(yU)} ${f2(xf)} ${f2(yU + r)} L${f2(xf)} ${f2(yL - r)} Q${f2(xf)} ${f2(yL)} ${f2(xf + d * r)} ${f2(yL)} L${f2(xt)} ${f2(yL)}`;
};
const sheetSvg = (k: number, layer: number, sp: number, tip?: Pt, op = 1) => {
  const even = k % 2 === 0, xf = even ? 76 : 194, xt = even ? 184 : 86;
  const yU = Y0 + layer * LH * sp, yL = Y0 + (layer + 2) * LH * sp;
  const d = sheetD(xf, xt, yU, yL, tip);
  return `<g opacity="${f2(op)}"><path d="${d}" fill="none" stroke="#5d7399" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${TINT[k % 2]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`;
};
const hand = (x: number, y: number, a: number) =>
  `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(a)})"><rect x="-4.5" y="-24" width="9" height="20" rx="4" fill="#f1b894" stroke="#a8643f" stroke-width=".8"/><circle cx="-3.2" cy="-2.2" r="3.2" fill="#f1b894" stroke="#a8643f" stroke-width=".8"/><circle cx="3.2" cy="-2.2" r="3.2" fill="#e9a782" stroke="#a8643f" stroke-width=".8"/></g>`;

// วาดกองกระดาษ: t = แผ่นบนสุด, s = ความคืบหน้าการดึง 0..1, r0 = แผ่น t เคยโผล่ค้างมาก่อน, dbl = แผ่นถัดไปติดมา 2 แผ่น
const stack = (t: number, s: number, sp: number, r0: number, dbl: number, ph: number, shakeAmt = 0, nsh = NSH) => {
  const o: string[] = [];
  const even = t % 2 === 0, dd = even ? 1 : -1;
  const xf0 = even ? 76 : 194;
  const w = ease(s);
  const lv = sm(0.62, 1, s);
  const wdx = dd * 59 * w, wdy = -72 * w - 120 * lv;
  const stopW = 0.62; // จุดที่ปลายแผ่นถัดไปโผล่พ้นช่อง
  const tipW = Math.min(w, stopW);
  // แผ่นด้านล่างสุดก่อน (วาดจากท้ายขึ้นบน)
  const shift = s > 0.7 ? sm(0.78, 1, s) : 0;
  for (let k = t + nsh - 1; k >= t + 1; k--) {
    const layer = (k - t) - shift;
    let tip: Pt | undefined;
    const follow = k === t + 1 || (dbl > 0 && k === t + 2);
    if (follow && s > 0.02) {
      const kd = k - t;
      const evenK = k % 2 === 0, xtRest = evenK ? 184 : 86;
      const yRest = Y0 + layer * LH * sp;
      const tx0 = xf0 + dd * 12 + (kd === 2 ? dd * 6 : 0);
      const tx = tx0 + dd * 59 * tipW, ty = Math.max(yRest - 72 * tipW - 8 * (kd - 1), 62 + 3 * (kd - 1));
      const arrived = tipW >= stopW - 0.001;
      const tipX = arrived ? lerp(tx, CX + dd * 5 + (kd === 2 ? -dd * 11 : 0), sm(0.6, 0.85, s)) : tx;
      if (Math.abs(tipX - xtRest) > 0.01 || ty < yRest) tip = [tipX, ty];
    }
    o.push(sheetSvg(k, layer, sp, tip, 1 - 0.0 * k));
  }
  // แผ่นที่กำลังถูกดึง
  const yU = Y0 + 0 * LH * sp, yL = Y0 + 2 * LH * sp;
  const xt = even ? 184 : 86;
  const popTip: Pt | undefined = r0 > 0 ? [CX - dd * 5, 62] : undefined;
  const rot = -dd * 22 * w * (1 - lv);
  const body = `<path d="${sheetD(xf0, xt, yU, yL, popTip)}" fill="none" stroke="#5d7399" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${sheetD(xf0, xt, yU, yL, popTip)}" fill="none" stroke="${TINT[t % 2]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const sh = shakeAmt ? Math.sin(ph * 40) * shakeAmt : 0;
  if (s < 0.999) o.push(`<g opacity="${f2(1 - sm(0.82, 1, s))}" transform="translate(${f2(wdx + sh)} ${f2(wdy)}) rotate(${f2(rot)} ${xf0} ${f2((yU + yL) / 2)})">${body}${s > 0.02 && s < 0.9 ? hand(xf0 + dd * 52, yU - 3, 0) : ""}</g>`);
  return o.join("");
};

const packFrame = (sp: number) => {
  const o: string[] = [];
  o.push(`<rect x="46" y="58" width="178" height="158" rx="14" fill="#fffdf6" stroke="#cdbf9f" stroke-width="1.2"/>`);
  o.push(`<rect x="62" y="84" width="146" height="118" rx="10" fill="#f4f9ff" opacity=".9"/>`);
  return o.join("") + `<g clip-path="url(#tpc)">`;
};
const packFront = () => {
  const o: string[] = [];
  o.push(`</g>`);
  // ซองพลาสติกอ่อน (โปร่ง) + ปากช่อง
  o.push(`<rect x="62" y="84" width="146" height="118" rx="10" fill="url(#tpk)" stroke="#5b7fb0" stroke-width="1.6"/>`);
  o.push(`<path d="M72 92 Q72 88 78 88" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>`);
  o.push(`<path d="M62 ${SLIT_Y + 4} H117 M153 ${SLIT_Y + 4} H208" stroke="#5b7fb0" stroke-width="1.6"/>`);
  o.push(`<rect x="62" y="${SLIT_Y - 2}" width="55" height="9" rx="2" fill="#a9c6e8" stroke="#5b7fb0" stroke-width="1.2" opacity=".95"/><rect x="153" y="${SLIT_Y - 2}" width="55" height="9" rx="2" fill="#a9c6e8" stroke="#5b7fb0" stroke-width="1.2" opacity=".95"/>`);
  return o.join("");
};

// ---------- เลนส์เส้นใย ----------
const LX = 135, LY = 352, LR = 80;
type Fib = { a: Pt; c: Pt; b: Pt };
const FIBS: Fib[] = Array.from({ length: 34 }, (_, i) => {
  const ang = rnd(i * 3 + 1) * Math.PI, len = 90 + rnd(i * 3 + 2) * 90;
  const cx = LX + (rnd(i * 5 + 3) - 0.5) * 170, cy = LY + (rnd(i * 7 + 4) - 0.5) * 170;
  const a: Pt = [cx - Math.cos(ang) * len / 2, cy - Math.sin(ang) * len / 2], b: Pt = [cx + Math.cos(ang) * len / 2, cy + Math.sin(ang) * len / 2];
  const bend = (rnd(i * 11 + 5) - 0.5) * 36;
  return { a, b, c: [cx - Math.sin(ang) * bend, cy + Math.cos(ang) * bend] };
});
const qpt = (f: Fib, u: number): Pt => { const v = 1 - u; return [v * v * f.a[0] + 2 * v * u * f.c[0] + u * u * f.b[0], v * v * f.a[1] + 2 * v * u * f.c[1] + u * u * f.b[1]]; };
const qd = (f: Fib, u: number): Pt => { const v = 1 - u; const dx = 2 * v * (f.c[0] - f.a[0]) + 2 * u * (f.b[0] - f.c[0]), dy = 2 * v * (f.c[1] - f.a[1]) + 2 * u * (f.b[1] - f.c[1]); const l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
const fibD = (f: Fib, j: number, amt: number) => `M${f2(f.a[0] + Math.sin(j) * amt)} ${f2(f.a[1] + Math.cos(j * 1.7) * amt)} Q${f2(f.c[0])} ${f2(f.c[1])} ${f2(f.b[0] + Math.cos(j) * amt)} ${f2(f.b[1] + Math.sin(j * 1.3) * amt)}`;
const water = (x: number, y: number, a: number, op = 1, s = 1) =>
  `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(a)}) scale(${s})" opacity="${f2(op)}"><circle cx="-2.6" cy="1.8" r="1.5" fill="#fff" stroke="#3b7fc4" stroke-width=".4"/><circle cx="2.6" cy="1.8" r="1.5" fill="#fff" stroke="#3b7fc4" stroke-width=".4"/><circle cx="0" cy="0" r="2.7" fill="#e5484d" stroke="#8c1d22" stroke-width=".4"/></g>`;

const lens = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  const wetting = cue === "cap" || cue === "wet";
  const R = cue === "cap" ? lerp(8, 118, ease(cl((p - 0.12) / 0.8))) : cue === "wet" ? 130 : 0;
  const fz = cue === "wet" ? 1 : 0;
  const swell = cue === "wet" ? sm(0.05, 0.4, p) : 0;
  const loose = cue === "wet" ? sm(0.35, 0.95, p) : 0;
  o.push(`<circle cx="${LX}" cy="${LY}" r="${LR + 5}" fill="#8a6a3b" opacity=".35"/><circle cx="${LX}" cy="${LY}" r="${LR}" fill="url(#tlens)" stroke="#6b4f2a" stroke-width="2.4"/>`);
  o.push(`<g clip-path="url(#tlc)">`);
  // ร่างแห
  FIBS.forEach((f, i) => {
    const d = fibD(f, i * 2.3 + ph * 0.9, loose * 2.5 * (0.4 + rnd(i)));
    o.push(`<path d="${d}" fill="none" stroke="#8c6a3e" stroke-width="${f2(3.9 + swell * 1.3)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#e8cfa4" stroke-width="${f2(2.7 + swell * 1.0)}" stroke-linecap="round"/>`);
  });
  if (wetting) {
    o.push(`<clipPath id="twc"><circle cx="${LX}" cy="${LY - 52}" r="${f2(R)}"/></clipPath><g clip-path="url(#twc)" opacity="${cue === "wet" ? 0.72 : 1}">`);
    FIBS.forEach((f, i) => {
      const d = fibD(f, i * 2.3 + ph * 0.9, loose * 2.5 * (0.4 + rnd(i)));
      o.push(`<path d="${d}" fill="none" stroke="#2a6fb8" stroke-width="${f2(4.1 + swell * 1.3)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#6cc0ff" stroke-width="${f2(2.9 + swell * 1.0)}" stroke-linecap="round"/>`);
    });
    o.push(`</g>`);
    o.push(`<circle cx="${LX}" cy="${LY - 52}" r="${f2(R)}" fill="none" stroke="#9fd8ff" stroke-width="1.2" stroke-dasharray="3 2" opacity=".8"/>`);
  }
  // จุดที่เส้นใยยึดกัน (พันธะระหว่างเส้นใย) — หายไปเมื่อน้ำแทรก
  if (cue === "wet" || cue === "fibre") {
    for (let i = 0; i < 14; i++) {
      const bx = LX + (rnd(i * 4 + 50) - 0.5) * 140, by = LY + (rnd(i * 4 + 51) - 0.5) * 140;
      const gone = cue === "wet" ? sm(0.15 + rnd(i) * 0.5, 0.35 + rnd(i) * 0.55, p) : 0;
      if (gone < 0.99) o.push(`<g opacity="${f2(1 - gone)}"><circle cx="${f2(bx)}" cy="${f2(by)}" r="3.2" fill="#ffe14a" stroke="#8a5a00" stroke-width=".7"/></g>`);
      if (gone > 0.05 && gone < 0.99) o.push(water(bx + (rnd(i) - 0.5) * 6, by, ph * 60 + i * 30, gone, 0.9));
    }
  }
  // หมู่ -OH + โมเลกุลน้ำ
  if (cue === "oh") {
    FIBS.forEach((f, i) => {
      if (i > 18) return;
      for (let u = 0.2; u < 0.9; u += 0.22) {
        const [x, y] = qpt(f, u), [tx, ty] = qd(f, u);
        const nx = -ty, ny = tx, side = i % 2 ? 1 : -1;
        const ox = x + nx * 4.2 * side, oy = y + ny * 4.2 * side;
        o.push(`<path d="M${f2(x + nx * 1.5 * side)} ${f2(y + ny * 1.5 * side)} L${f2(ox)} ${f2(oy)}" stroke="#d9772b" stroke-width=".9"/><circle cx="${f2(ox)}" cy="${f2(oy)}" r="1.9" fill="#ffb066" stroke="#a85312" stroke-width=".5"/>`);
        if (i < 6 && u < 0.5) o.push(txt(ox + nx * 3.5 * side, oy + ny * 3.5 * side + 1, "OH", 3.3, "#a85312", "middle", 800));
      }
    });
    for (let i = 0; i < 16; i++) {
      const f = FIBS[i], u = 0.25 + ((i * 0.31) % 0.6), [x, y] = qpt(f, u), [tx, ty] = qd(f, u);
      const nx = -ty, ny = tx, side = i % 2 ? 1 : -1;
      const tx2 = x + nx * 9 * side, ty2 = y + ny * 9 * side;
      const t = ((ph * 0.45 + rnd(i + 70)) % 1);
      const k = ease(cl(t / 0.65));
      const sx = tx2 + nx * side * 38 + Math.sin(i) * 14, sy = ty2 + ny * side * 38 + Math.cos(i) * 12;
      const px = lerp(sx, tx2, k) + (t > 0.65 ? Math.sin(ph * 14 + i) * 0.6 : 0), py = lerp(sy, ty2, k);
      o.push(water(px, py, i * 40 + ph * 20, 1, 1.05));
      if (t > 0.65) o.push(`<path d="M${f2(px)} ${f2(py)} L${f2(x + nx * 5 * side)} ${f2(y + ny * 5 * side)}" stroke="#2a6fb8" stroke-width=".8" stroke-dasharray="1.2 1"/>`);
    }
  }
  // ละอองน้ำหยดตอน cap
  if (cue === "cap" && p < 0.2) o.push(`<ellipse cx="${LX}" cy="${f2(lerp(LY - 100, LY - 52, ease(p / 0.2)))}" rx="4" ry="5.4" fill="#59b4ff" stroke="#1f5f9f" stroke-width=".8"/>`);
  void fz;
  o.push(`</g>`);
  o.push(`<path d="M${LX - 62} ${LY - 50} A70 70 0 0 1 ${LX - 20} ${LY - 74}" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>`);
  return o.join("");
};

export const SCENE_TISSUE: SceneDef = {
  focus: {
    all: { cx: 135, cy: 190, z: 1.25 },
    pack: { cx: 135, cy: 140, z: 1.6, box: [60, 82, 150, 122], label: "ซองซอฟต์แพ็ค" },
    fold: { cx: 135, cy: 148, z: 1.9 },
    pull: { cx: 135, cy: 112, z: 1.85 },
    pop: { cx: 138, cy: 88, z: 2.9, box: [112, 56, 46, 32], label: "ช่องเปิดของซอง" },
    chain: { cx: 135, cy: 118, z: 1.8 },
    but: { cx: 135, cy: 112, z: 1.9 },
    fibre: { cx: 135, cy: 352, z: 1.7, box: [53, 272, 164, 160], label: "เส้นใยเซลลูโลส" },
    oh: { cx: 118, cy: 345, z: 3.0, label: "" },
    cap: { cx: 135, cy: 335, z: 1.8 },
    wet: { cx: 135, cy: 352, z: 2.2 },
    chk: { cx: 135, cy: 140, z: 1.6 },
    end: { cx: 135, cy: 235, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const o: string[] = [DEFS, `<rect x="-140" y="-140" width="550" height="760" fill="url(#tbg)"/>`];
    for (let i = 0; i < 14; i++) o.push(`<circle cx="${f2(rnd(i) * 270)}" cy="${f2(((rnd(i + 3) * 480 + ph * 6 * (0.4 + rnd(i + 8))) % 480))}" r="${f2(1 + rnd(i + 9) * 2)}" fill="#fff" opacity=".35"/>`);
    // เส้นโยงจากซองไปเลนส์
    o.push(`<path d="M96 216 L74 300 M174 216 L196 300" stroke="#8a6a3b" stroke-width="1" stroke-dasharray="3 2.5" opacity=".6"/>`);
    // ----- ซอง -----
    let t = 0, s = 0, sp = 1, r0 = 0, dbl = 0, shake = 0, nsh = NSH;
    if (cue === "all" || cue === "end") { const u = ph / 4.6; t = Math.floor(u) % 6; const x = u - Math.floor(u); s = sm(0.12, 0.8, x); r0 = Math.floor(u) % 6 > 0 ? 1 : 0; }
    else if (cue === "fold") { sp = 1 + 0.45 * Math.sin(Math.PI * cl(p * 1.05)); nsh = 5; }
    else if (cue === "pull") { s = sm(0.05, 0.95, p); }
    else if (cue === "pop") { s = 1; }
    else if (cue === "chain") { const u = p * 3; t = Math.min(2, Math.floor(u)); s = sm(0.05, 0.95, u - t); r0 = t > 0 ? 1 : 0; }
    else if (cue === "but") { dbl = 1; s = Math.min(0.62, sm(0.1, 0.55, p) * 0.62); shake = p > 0.1 && p < 0.7 ? 1.6 : 0; }
    else if (cue === "chk") { const u = p * 4; t = Math.min(3, Math.floor(u)); s = sm(0.08, 0.9, u - t); r0 = t > 0 ? 1 : 0; nsh = Math.max(3, 6 - t); }
    // วาด
    o.push(packFrame(sp));
    o.push(stack(t, s, sp, r0, dbl, ph, shake, nsh));
    o.push(packFront());
    const F = SCENE_TISSUE.focus[cue] || SCENE_TISSUE.focus.all;
    const hud = (str: string, fill = "#fff6c9") => { const y = F.cy - 200 / F.z; o.push(`<g transform="translate(${F.cx} ${f2(y)}) scale(${f2(1.6 / F.z)}) translate(${-F.cx} ${f2(-y)})">${pill(F.cx, y, str, fill)}</g>`); };
    if (cue === "all") hud("ทิชชู่ซอฟต์แพ็ค");
    if (cue === "end") hud("ดูข้างในของใช้ ยังไงนะ");
    if (cue === "pack") hud("พับครึ่ง สอดสลับกันทั้งซอง");
    if (cue === "fold") {
      const a = 0.5 + 0.5 * Math.sin(ph * 5);
      o.push(`<circle cx="92" cy="${Y0 + 2 * LH * sp + 3}" r="12" fill="none" stroke="#e8433f" stroke-width="1.6" stroke-dasharray="3 2" opacity="${f2(0.5 + 0.5 * a)}"/><circle cx="178" cy="${Y0 + 3 * LH * sp + 3}" r="12" fill="none" stroke="#e8433f" stroke-width="1.6" stroke-dasharray="3 2" opacity="${f2(0.5 + 0.5 * (1 - a))}"/>`);
      hud("ปลายสอดอยู่ในรอยพับ");
    }
    if (cue === "pull") hud(s < 0.45 ? "ดึงแผ่นบนขึ้น" : "รอยพับเกี่ยวปลายแผ่นถัดไปตามมา", s < 0.45 ? "#fff6c9" : "#ffe1c9");
    if (cue === "pop") {
      const a = 0.6 + 0.4 * Math.sin(ph * 6);
      o.push(`<g opacity="${f2(a)}"><path d="M104 ${SLIT_Y + 2} h9 m-4 -3 l4 3 l-4 3" stroke="#e8433f" stroke-width="1.5" fill="none"/><path d="M166 ${SLIT_Y + 2} h-9 m4 -3 l-4 3 l4 3" stroke="#e8433f" stroke-width="1.5" fill="none"/></g>`);
      hud("ขอบช่องหนีบปลายไว้ จึงค้างอยู่");
    }
    if (cue === "chain") hud(`แผ่นที่ ${Math.min(4, Math.floor(p * 3) + 2)} โผล่ตามมา`);
    if (cue === "but") { hud("กระชากแรง → ติดมาสองแผ่น", "#ffd9d0"); }
    if (cue === "chk") { const left = Math.max(1, 6 - Math.min(3, Math.floor(p * 4))); hud(left > 3 ? "ซองนี้เหลือกี่แผ่น?" : "ใกล้หมดแล้ว", left > 3 ? "#fff6c9" : "#ffd9d0"); }
    // ----- เลนส์ -----
    o.push(lens(cue, p, ph));
    if (["fibre", "oh", "cap", "wet"].includes(cue)) hud(cue === "oh" ? "หมู่ OH ดึงดูดโมเลกุลน้ำ" : cue === "cap" ? "น้ำคืบไปตามช่องเล็กๆ" : cue === "wet" ? "น้ำแทรก พันธะระหว่างเส้นใยคลาย" : "ซูมเข้าไปในเนื้อกระดาษ");
    o.push(box(SCENE_TISSUE.focus[cue]?.box, ph));
    return o.join("");
  },
};
