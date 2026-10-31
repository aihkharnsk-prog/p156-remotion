// ฉากอธิบาย: เตารีดไอน้ำ (steam iron) แบบตัดครึ่งด้านข้าง — SVG พิกัด 270x480
// หัวเตารีดชี้ไปทางซ้าย ด้ามจับอยู่ขวา: แผ่นฐาน(ขดลวด+ห้องไอน้ำ) / เทอร์โมสตัทแผ่นโลหะสองชั้น / ถังน้ำ+วาล์วหยดน้ำ
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, plen, along, box, DEFS, room } = H;
type Pt = [number, number];
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#2b3350", anchor = "middle", w = 700) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, anchor: "start" | "end" | "middle" = "middle", fill = "#fff6c9") => {
  const w = s.length * 4.5 + 10;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "start" ? x : x - w;
  return `<rect x="${f2(x0)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".96"/>` +
    txt(x0 + w / 2, y + 0.4, s, 6.4, "#2b3350");
};
const leader = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)}" stroke="#2b3350" stroke-width=".9" stroke-dasharray="2 1.5" fill="none"/><circle cx="${f2(x2)}" cy="${f2(y2)}" r="1.6" fill="#2b3350"/>`;
const pts = (a: Pt[]) => a.map((p) => `${f2(p[0])},${f2(p[1])}`).join(" ");
const drop = (x: number, y: number, r = 1.8, c = "#58b8f8") =>
  `<path d="M${f2(x)} ${f2(y - 2 * r)} C${f2(x + r)} ${f2(y - r)} ${f2(x + r)} ${f2(y + r)} ${f2(x)} ${f2(y + r)} C${f2(x - r)} ${f2(y + r)} ${f2(x - r)} ${f2(y - r)} ${f2(x)} ${f2(y - 2 * r)}Z" fill="${c}" stroke="#1d6aa8" stroke-width=".5"/>`;
const puff = (x: number, y: number, r: number, a: number, blur = true) =>
  a > 0.02 ? `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#fff" stroke="#aebdd4" stroke-width=".5" stroke-opacity="${f2(a * 0.7)}" opacity="${f2(a)}"${blur ? ` filter="url(#bl)"` : ""}/>` : "";

const EXTRA = `<defs>
<linearGradient id="icav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46527c"/><stop offset="1" stop-color="#2b3350"/></linearGradient>
<linearGradient id="isole" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7dde9"/><stop offset=".5" stop-color="#a9b3c8"/><stop offset="1" stop-color="#7c879f"/></linearGradient>
<linearGradient id="iboard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8aa0c8"/><stop offset="1" stop-color="#5f7199"/></linearGradient>
<linearGradient id="iwater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8bd6ff"/><stop offset="1" stop-color="#3d97e6"/></linearGradient>
<clipPath id="itank"><path d="M158 208 L224 195 L224 260 L158 260 Z"/></clipPath>
</defs>`;

// ---- เรขาคณิต ----
const SP_T = 274, SP_B = 300, TIPX = 22, HEEL = 246;
const HX = [34, 52, 70, 88, 106, 124, 142, 160, 178, 202, 218]; // รูไอน้ำ
const SLOT_X = 190; // ช่องจากห้องไอน้ำลงท่อไอ
const ELEM: Pt[] = [];
for (let x = 40; x <= 236; x += 4) ELEM.push([x, 288 + ((x - 40) / 4) % 2 * 4.4 - 2.2]);
const CK_X = 126; // แกนหน้าสัมผัส
const fyOf = (d: number) => 244 + 6 * d; // ตำแหน่งหน้าสัมผัสตัวนิ่ง (ปุ่มปรับขยับ)
const CIRC: Pt[] = [[272, 266], [246, 266], [234, 266], [132, 266], [132, 248], [CK_X, 250], [100, 254], [68, 255], [62, 258], [44, 262], [44, 276], [40, 284], ...ELEM, [240, 288], [246, 288], [272, 288]];
const CIRC_L = plen(CIRC);

type S = { tmp: number; closed: boolean; td: number; d: number; lvl: number; drip: number; steam: number; pour: number; dx: number; leak: number; spark: number };
const BASE: S = { tmp: 0.5, closed: true, td: 0.6, d: 0.5, lvl: 0.62, drip: 0, steam: 0, pour: 0, dx: 0, leak: 0, spark: 0 };

function stateOf(cue: string, p: number): S {
  const e = ease(p);
  switch (cue) {
    case "parts":
    case "all":
      return { ...BASE, tmp: 0.55, drip: 0.7, steam: 0.7 };
    case "heat":
      return { ...BASE, tmp: lerp(0.08, 0.8, e), td: 0.4 + p };
    case "bimetal": {
      // ร้อนขึ้น -> แผ่นโก่ง -> หน้าสัมผัสแยก (ช่วงท้ายของท่อน)
      const open = p >= 0.8;
      const td = p < 0.8 ? 0.4 + 2.2 * (p / 0.8) : lerp(2.6, 7.6, ease(cl((p - 0.8) / 0.08)));
      return { ...BASE, d: 0.55, tmp: lerp(0.6, 1, ease(cl(p / 0.8))), closed: !open, td, spark: p > 0.78 && p < 0.86 ? 1 : 0 };
    }
    case "cool": {
      // ไฟตัดแล้วเย็นลง -> แผ่นตรงกลับ -> หน้าสัมผัสแตะอีก
      const closeAt = 0.64;
      const closed = p >= closeAt;
      const td = p < closeAt ? lerp(7.6, 2.4, ease(cl(p / closeAt))) : lerp(2.4, 2.9, cl((p - closeAt) / 0.36));
      const tmp = p < closeAt ? lerp(1, 0.84, ease(p / closeAt)) : lerp(0.84, 0.9, cl((p - closeAt) / 0.36));
      return { ...BASE, d: 0.55, tmp, closed, td };
    }
    case "dial":
      return { ...BASE, d: lerp(0.2, 0.88, ease(cl(p / 0.7))), tmp: 0.5, td: 1.2 };
    case "tank":
      return { ...BASE, lvl: lerp(0.14, 0.82, ease(cl(p / 0.8))), pour: p < 0.82 ? 1 : 0, tmp: 0.5 };
    case "valve":
      return { ...BASE, lvl: 0.7, tmp: 0.85, drip: 1 };
    case "steam":
      return { ...BASE, lvl: 0.66, tmp: 0.85, drip: 1, steam: 1 };
    case "fabric":
      return { ...BASE, lvl: 0.6, tmp: 0.85, drip: 0.6, steam: 1, dx: lerp(26, 6, e) };
    case "fact":
      return { ...BASE, tmp: 0.3 };
    case "tip": {
      const open = p >= 0.8;
      return { ...BASE, d: 0.7, closed: !open, tmp: p < 0.8 ? lerp(0.12, 0.85, ease(p / 0.8)) : 0.85 - 0.02 * (p - 0.8) * 5, td: open ? 5 : 0.6 + 1.5 * p };
    }
    case "label": {
      const low = p >= 0.5;
      return low
        ? { ...BASE, d: lerp(0.7, 0.12, ease(cl((p - 0.5) / 0.15))), tmp: lerp(0.8, 0.15, cl((p - 0.5) / 0.3)), leak: 1, drip: 1, closed: false, td: 6 }
        : { ...BASE, d: 0.7, tmp: 0.8, drip: 1, steam: 1 };
    }
    default:
      return { ...BASE };
  }
}

export const SCENE_IRON: SceneDef = {
  focus: {
    all: { cx: 135, cy: 272, z: 1.0 },
    parts: { cx: 135, cy: 272, z: 1.0 },
    heat: { cx: 135, cy: 296, z: 1.5, box: [34, 281, 206, 15] },
    bimetal: { cx: 108, cy: 258, z: 2.3, box: [118, 238, 18, 34] },
    cool: { cx: 108, cy: 258, z: 2.3, box: [118, 238, 18, 34] },
    dial: { cx: 112, cy: 245, z: 2.2, box: [112, 197, 28, 16] },
    tank: { cx: 182, cy: 247, z: 2.1, box: [158, 196, 68, 66] },
    valve: { cx: 170, cy: 280, z: 2.2, box: [168, 258, 44, 28] },
    steam: { cx: 130, cy: 296, z: 1.5, box: [30, 272, 194, 30] },
    fabric: { cx: 135, cy: 274, z: 0.75 },
    fact: { cx: 135, cy: 262, z: 0.95 },
    tip: { cx: 135, cy: 262, z: 0.95 },
    label: { cx: 135, cy: 262, z: 0.95 },
    end: { cx: 135, cy: 272, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const s = stateOf(cue, p);
    const fd = cue === "fabric" ? s.dx : 0;
    const o: string[] = [DEFS, EXTRA, room(400)];

    const FY = fyOf(s.d);
    const ty = FY + 7.2 + s.td;
    const glow = s.closed ? 0.3 + 0.7 * s.tmp : 0.4 * s.tmp;
    const hotPlate = s.tmp;

    // ---- โต๊ะรีดผ้า + ผ้า ----
    o.push(`<rect x="-140" y="303" width="550" height="12" rx="3" fill="url(#iboard)" stroke="#44557a" stroke-width="1"/><rect x="-140" y="315" width="550" height="4" fill="#3b4a6b" opacity=".6"/>`);
    o.push(`<path d="M-20 319 L-60 400 M300 319 L340 400 M20 319 L-10 400 M260 319 L290 400" stroke="#4a5470" stroke-width="4" stroke-linecap="round"/>`);
    // ผ้า: ด้านหน้าหัวเตารีดยับ ด้านหลังเรียบ
    {
      const tipX = TIPX + fd, heelX = HEEL + fd;
      let top = "";
      for (let x = -40; x <= 310; x += 2) {
        const amp = cl((tipX - x) / 16) * (x < tipX ? 1 : 0);
        const w = 1.6 + 1.5 * Math.sin(x * 0.42) + 1.1 * Math.sin(x * 0.93 + 1.3);
        const y = 300 - amp * Math.max(0, w * 1.5 + 0.8);
        top += (top ? " L" : "M") + `${x} ${f2(y)}`;
      }
      o.push(`<path d="${top} L310 304 L-40 304 Z" fill="#f4e6c6" stroke="#b79b62" stroke-width=".8"/>`);
      o.push(`<path d="M-40 302.4 H310" stroke="#b79b62" stroke-width=".5" stroke-dasharray="3 2.5" opacity=".7"/>`);
      void heelX;
    }

    // ---- ตัวเตารีดทั้งก้อน (ขยับตาม dx ตอนรีดผ้า) ----
    o.push(`<g transform="translate(${f2(fd)} 0)">`);
    o.push(`<ellipse cx="136" cy="301" rx="118" ry="2.6" fill="#1b1008" opacity=".28"/>`);

    // โพรงภายใน
    const SHELL = "M24 274 C24 250 40 230 78 222 L206 196 C232 190 246 204 246 226 L246 274";
    o.push(`<path d="${SHELL} Z" fill="url(#icav)"/>`);
    // แสงจากแผ่นฐานขึ้นมาในโพรง
    if (glow > 0.05) o.push(`<rect x="40" y="258" width="196" height="20" rx="8" fill="#ff7a2a" opacity="${f2(0.22 * glow)}" filter="url(#bl)"/>`);

    // ถังน้ำ
    o.push(`<path d="M158 208 L224 195 L224 260 L158 260 Z" fill="#cfe9ff" fill-opacity=".14" stroke="#9fd0f5" stroke-width="1.2"/>`);
    {
      const wy = 260 - 56 * s.lvl;
      let wv = `M150 262 L150 ${f2(wy)}`;
      for (let x = 150; x <= 232; x += 3) wv += ` L${x} ${f2(wy + 1.1 * Math.sin(x * 0.4 + ph * 3))}`;
      wv += " L232 262 Z";
      o.push(`<g clip-path="url(#itank)"><path d="${wv}" fill="url(#iwater)" opacity=".92"/></g>`);
    }
    // ฝาเติมน้ำ (เปิดตอนเติม)
    {
      const open = s.pour > 0.5;
      o.push(open
        ? `<path d="M166 203 L158 196 L162 192 L170 199Z" fill="#2fb3c4" stroke="#1d6f7c" stroke-width=".8"/>`
        : `<path d="M164 205 L178 202" stroke="#1d6f7c" stroke-width="3" stroke-linecap="round"/>`);
    }
    // ก้านวาล์ว (เข็ม) ในถัง: ยกขึ้นเมื่อปล่อยน้ำ
    const needle = 261 - 5 * (s.drip > 0 ? 0.6 + 0.4 * Math.sin(ph * 5) * 0.5 : 0);
    o.push(`<rect x="189" y="236" width="2" height="${f2(needle - 236)}" fill="#c9d1e0" stroke="#5a6684" stroke-width=".5"/><path d="M187.6 ${f2(needle - 2)} L192.4 ${f2(needle - 2)} L190 ${f2(needle + 5)}Z" fill="#c9d1e0" stroke="#5a6684" stroke-width=".5"/>`);
    // ตัววาล์ว + ท่อปล่อยน้ำ
    o.push(`<path d="M183 260 H197 L195 268 H185 Z" fill="#8c96ac" stroke="#3b4566" stroke-width="1"/><rect x="189" y="266" width="2" height="3" fill="#2b3350"/>`);

    // ---- แผ่นฐาน ----
    const PLATE = `M${TIPX} ${SP_B} H${HEEL} V${SP_T} H64 Q26 ${SP_T + 2} ${TIPX} ${SP_B} Z`;
    o.push(`<path d="${PLATE}" fill="url(#isole)" stroke="#4a5470" stroke-width="1.2"/>`);
    if (hotPlate > 0.05) o.push(`<path d="${PLATE}" fill="#ff7a2a" opacity="${f2(0.5 * Math.min(1, hotPlate * glow * 1.6))}"/>`);
    // ห้องไอน้ำ (ร่องบนผิวแผ่นฐาน) + ท่อไอ + รู
    o.push(`<rect x="170" y="${SP_T}" width="40" height="10" rx="1.5" fill="#2a3350" stroke="#1d2338" stroke-width=".8"/>`);
    o.push(`<rect x="${SLOT_X - 1.5}" y="284" width="3" height="9.5" fill="#2a3350"/>`);
    o.push(`<rect x="30" y="292.5" width="192" height="3.6" rx="1.4" fill="#2a3350"/>`);
    for (const hx of HX) o.push(`<rect x="${hx - 1.5}" y="296" width="3" height="4.2" fill="#2a3350"/>`);
    // ไอน้ำในท่อ
    if (s.steam > 0.05) {
      o.push(`<rect x="172" y="276" width="36" height="8" rx="2" fill="#fff" opacity="${f2(0.32 * s.steam)}"/><rect x="${SLOT_X - 1}" y="284" width="2" height="9" fill="#fff" opacity="${f2(0.7 * s.steam)}"/><rect x="31" y="293.2" width="190" height="2.2" rx="1" fill="#fff" opacity="${f2(0.65 * s.steam)}"/>`);
      for (const hx of HX) o.push(`<rect x="${hx - 1}" y="296" width="2" height="4" fill="#fff" opacity="${f2(0.8 * s.steam)}"/>`);
    }
    // ขดลวดความร้อน (ฝังในแผ่นฐาน)
    const wc = glow < 0.5 ? mixc("#5f5a66", "#ff4a14", glow / 0.5) : mixc("#ff4a14", "#ffc26b", (glow - 0.5) / 0.5);
    const epath = "M" + ELEM.map((q) => `${f2(q[0])} ${f2(q[1])}`).join(" L");
    if (glow > 0.12) o.push(`<path d="${epath}" fill="none" stroke="#ff6a1a" stroke-width="5" stroke-linejoin="round" opacity="${f2(0.5 * glow)}" filter="url(#bl)"/>`);
    o.push(`<path d="${epath}" fill="none" stroke="${wc}" stroke-width="2" stroke-linejoin="round"/>`);

    // ---- เทอร์โมสตัท: ก้านปรับ + หน้าสัมผัส + แผ่นโลหะสองชั้น ----
    // ขาเกาะแผ่นฐาน (ถ่ายเทความร้อนขึ้นมา)
    o.push(`<rect x="56" y="250" width="13" height="25" rx="2" fill="${mixc("#8c96ac", "#e9684a", s.tmp * 0.55)}" stroke="#3b4566" stroke-width="1"/>`);
    if (s.tmp > 0.3) for (let i = 0; i < 2; i++) {
      const u = (ph * 0.8 + i * 0.5) % 1;
      o.push(H.varrow(60 + i * 5, 273 - u * 12, "#ff5a2a", s.tmp * Math.sin(Math.PI * u), -1));
    }
    // ก้านเกลียว + ปุ่มหมุน
    o.push(`<rect x="${CK_X - 1.6}" y="210" width="3.2" height="${f2(FY - 2 - 210)}" fill="#c9d1e0" stroke="#5a6684" stroke-width=".6"/>`);
    for (let y = 214; y < FY - 3; y += 3) o.push(`<path d="M${CK_X - 1.6} ${y} H${CK_X + 1.6}" stroke="#5a6684" stroke-width=".5"/>`);
    o.push(`<circle cx="${CK_X}" cy="${f2(FY)}" r="2.2" fill="#f0d27a" stroke="#6b5420" stroke-width=".6"/>`);
    // ตัวนำสายหน้าสัมผัสนิ่ง
    o.push(`<polyline points="${pts([[CK_X + 1, FY - 2], [132, 248], [132, 266]])}" fill="none" stroke="#d25a4a" stroke-width="1.3" stroke-linejoin="round"/>`);
    // แผ่นโลหะสองชั้น
    {
      const ax = 68, ay = 255;
      const q = `${ax + 30} ${f2(ay + (ty - ay) * 0.22)}`;
      const hot = mixc("#8f9bb3", "#e9684a", s.tmp * 0.5);
      const one = (off: number, c: string) => `<path d="M${ax} ${ay + off} Q${q} ${CK_X} ${f2(ty + off)}" fill="none" stroke="${c}" stroke-width="2.6"/>`;
      o.push(one(-1.3, "#e08a3a") + one(1.3, hot));
      o.push(`<circle cx="${CK_X}" cy="${f2(ty - 3)}" r="2.2" fill="#f0d27a" stroke="#6b5420" stroke-width=".6"/>`);
      if (s.closed) o.push(`<circle cx="${CK_X}" cy="${f2(ty - 3)}" r="5" fill="#ffe14a" opacity="${f2(0.3 + 0.2 * Math.sin(ph * 14))}" filter="url(#bl)"/>`);
      if (s.spark > 0) o.push(`<path d="M${CK_X - 5} ${f2(ty - 6)} l3 -3 l2 3 l3 -4 l2 4" fill="none" stroke="#ffe14a" stroke-width="1.2" opacity="${f2(0.5 + 0.5 * Math.sin(ph * 40))}"/>`);
    }
    // สายจากแผ่นโลหะไปขดลวด
    o.push(`<polyline points="${pts([[68, 255], [62, 258], [44, 262], [44, 276]])}" fill="none" stroke="#5b8be0" stroke-width="1.3" stroke-linejoin="round"/>`);
    // สายหลักจากสายไฟ ไปหน้าสัมผัส (เส้นสีแดงผ่านใต้ถังน้ำ)
    o.push(`<polyline points="${pts([[246, 266], [234, 266], [132, 266]])}" fill="none" stroke="#d25a4a" stroke-width="1.3"/>`);
    o.push(`<polyline points="${pts([[236, 288], [246, 288]])}" fill="none" stroke="#5b8be0" stroke-width="1.3"/>`);

    // ปุ่มปรับอุณหภูมิ (บนตัวเรือน)
    const kx = CK_X + (s.d - 0.5) * 6;
    o.push(`<g filter="url(#sh2)"><rect x="114" y="199" width="24" height="12.5" rx="4" fill="#f0f3f8" stroke="#5a6684" stroke-width="1"/></g>`);
    o.push(`<path d="M${f2(kx - 7)} 205 H${f2(kx + 7)}" stroke="#c9d1e0" stroke-width="1"/><rect x="${f2(kx - 1.4)}" y="200" width="2.8" height="5.5" rx="1" fill="#ff5a3a"/>`);
    // ---- อนุภาคกระแสไฟ ----
    if (s.closed) {
      for (let i = 0; i < 22; i++) {
        const dd = (ph * 55 + (i * CIRC_L) / 22) % CIRC_L;
        const q = along(CIRC, dd);
        o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="1.6" fill="#ffe14a" stroke="#b58a00" stroke-width=".4"/>`);
      }
    }

    // ---- หยดน้ำ + ไอน้ำ ----
    if (s.drip > 0.05) {
      for (let k = 0; k < 3; k++) {
        const u = (ph * 1.3 + k / 3) % 1;
        const y = 270 + u * u * 12;
        o.push(drop(SLOT_X, y, 1.7));
        if (u > 0.9 && s.steam > 0.2) o.push(puff(SLOT_X + (k - 1) * 4, 276, 3, 0.7 * s.steam));
      }
    }
    if (s.steam > 0.05) {
      // ไอน้ำในห้อง
      for (let k = 0; k < 4; k++) {
        const u = (ph * 0.9 + k / 4) % 1;
        o.push(puff(176 + k * 9 + Math.sin(u * 6 + k) * 2, 282 - u * 7, 2.2 + u * 1.6, 0.8 * s.steam * Math.sin(Math.PI * u)));
      }
    }
    // ไอน้ำพ่นออกจากรูใต้เตารีด
    if (s.steam > 0.05) {
      for (let h = 0; h < HX.length; h++) {
        for (let k = 0; k < 2; k++) {
          const u = (ph * 1.1 + h * 0.17 + k * 0.5) % 1;
          const dxs = (HX[h] - 130) * 0.08 * u;
          o.push(puff(HX[h] + dxs * 3 + Math.sin(u * 5 + h) * 1.2, 303 + u * 3, 2.2 + u * 3.6, 0.95 * s.steam * Math.sin(Math.PI * u), false));
        }
      }
      // ไอน้ำที่ลอยออกด้านข้างหัว/ท้ายเตารีด
      for (let k = 0; k < 5; k++) {
        const u = (ph * 0.6 + k / 5) % 1;
        o.push(puff(TIPX - 6 - u * 10 + Math.sin(u * 7 + k) * 2, 298 - u * 34, 3 + u * 5, 0.75 * s.steam * Math.sin(Math.PI * u)));
        o.push(puff(HEEL + 8 + u * 8 + Math.sin(u * 7 + k) * 2, 298 - u * 30, 3 + u * 5, 0.6 * s.steam * Math.sin(Math.PI * u)));
      }
    }
    // น้ำหยดจากรู (ตั้งอุณหภูมิต่ำเกินไป)
    if (s.leak > 0.05) {
      for (let h = 0; h < HX.length; h += 2) {
        const u = (ph * 0.9 + h * 0.13) % 1;
        o.push(drop(HX[h], 301 + u * 3, 1.4));
      }
      o.push(`<path d="M20 304 H120 M150 304 H240" stroke="#58b8f8" stroke-width="1.6" stroke-linecap="round" opacity=".65"/>`);
    }

    // ขอบเปลือกเตารีด (พลาสติก) + ด้ามจับ
    o.push(`<path d="${SHELL}" fill="none" stroke="#1d6f7c" stroke-width="6.6" stroke-linejoin="round" stroke-linecap="round"/><path d="${SHELL}" fill="none" stroke="#2fb3c4" stroke-width="4.6" stroke-linejoin="round" stroke-linecap="round"/>`);
    o.push(`<path d="${SHELL}" fill="none" stroke="#a6edf6" stroke-width="1" stroke-linejoin="round" opacity=".6" transform="translate(0 -1.4)"/>`);
    // ไฟสัญญาณ
    const lampOn = s.closed && cue !== "all";
    o.push(`<circle cx="92" cy="217.6" r="2.8" fill="${lampOn || (cue === "all") ? "#ff4a3a" : "#6a3a3a"}" stroke="#2b3350" stroke-width=".8"/>`);
    if (lampOn || cue === "all") o.push(`<circle cx="92" cy="217.6" r="6" fill="#ff4a3a" opacity="${f2(0.35 + 0.15 * Math.sin(ph * 6))}" filter="url(#bl)"/>`);

    const HANDLE = "M150 208 C142 160 152 146 182 142 L228 138 C246 136 250 160 246 200";
    o.push(`<path d="${HANDLE}" fill="none" stroke="#1d6f7c" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="${HANDLE}" fill="none" stroke="#2fb3c4" stroke-width="12.5" stroke-linecap="round" stroke-linejoin="round"/><path d="${HANDLE}" fill="none" stroke="#a6edf6" stroke-width="1.6" stroke-linecap="round" opacity=".55" transform="translate(-1.4 -2)"/>`);
    // สายไฟ
    o.push(`<path d="M246 266 Q266 266 268 286 T290 340" fill="none" stroke="#222" stroke-width="4.2" stroke-linecap="round"/><path d="M246 288 Q256 288 266 285" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round"/>`);

    // ---- เติมน้ำ ----
    if (s.pour > 0.5) {
      o.push(`<g opacity="${f2(0.65 + 0.35 * Math.sin(ph * 9))}"><path d="M172 150 V170" stroke="#58b8f8" stroke-width="2.4" stroke-linecap="round"/><path d="M166 168 L172 177 L178 168Z" fill="#58b8f8"/></g>`);
      for (let k = 0; k < 5; k++) {
        const u = (ph * 1.8 + k / 5) % 1;
        o.push(drop(172 + Math.sin(k * 3) * 2, 182 + u * 18, 1.5));
      }
    }
    o.push(`</g>`);

    // ---- ป้ายชื่อชิ้นส่วนตามคิว ----
    const wob = fd;
    if (cue === "parts") {
      o.push(pill(190, 176, "ถังน้ำ", "middle") + leader(190, 180, 190, 226));
      o.push(pill(30, 194, "ตัวคุมอุณหภูมิ", "start") + leader(70, 197, 92, 253));
      o.push(pill(120, 312, "ขดลวดความร้อน", "middle") + leader(110, 304, 110, 289));
    }
    if (cue === "heat") {
      o.push(pill(110, 316, "ขดลวดความร้อน", "middle") + leader(110, 309, 110, 290));
      o.push(pill(196, 316, "แผ่นฐานโลหะ", "middle", "#e9dcb8") + leader(196, 309, 200, 298));
    }
    if (cue === "bimetal" || cue === "cool") {
      o.push(pill(52, 236, "แผ่นโลหะสองชั้น", "start") + leader(88, 238, 92, 254));
      o.push(pill(134, 234, s.closed ? "ไฟไหล" : "ไฟตัด", "start", s.closed ? "#ffe14a" : "#ffd0c8") + leader(134, 232, CK_X + 2, ty - 5));
      if (!s.closed) {
        o.push(`<g opacity="${f2(0.7 + 0.3 * Math.sin(ph * 8))}"><path d="M${CK_X + 9} ${f2(FY + 3)} V${f2(ty - 3)}" stroke="#d94b4b" stroke-width="1" stroke-dasharray="1.5 1.2"/></g>`);
      }
    }
    if (cue === "dial") {
      o.push(pill(96, 184, "ปุ่มปรับอุณหภูมิ", "middle") + leader(112, 187, 118, 200));
      o.push(pill(54, 238, "หน้าสัมผัสขยับ", "start", "#e9dcb8") + leader(112, 239, CK_X - 3, FY + 2));
      o.push(txt(106, 196, "ต่ำ", 5.4, "#46526b") + txt(146, 196, "สูง", 5.4, "#b53a10"));
    }
    if (cue === "tank") {
      o.push(pill(232, 168, "ถังน้ำ", "end") + leader(214, 171, 214, 222));
      if (s.pour > 0.5) o.push(pill(166, 160, "เติมน้ำ", "end") + leader(166, 160, 171, 168));
    }
    if (cue === "valve") {
      o.push(pill(224, 246, "วาล์วหยดน้ำ", "end") + leader(196, 248, 192, 263));
      o.push(pill(162, 281, "ห้องไอน้ำ", "end", "#e9dcb8") + leader(162, 279, 172, 280));
    }
    if (cue === "steam") {
      o.push(pill(190, 316, "ห้องทำไอน้ำ", "middle") + leader(190, 309, 190, 284));
      o.push(pill(88, 316, "รูไอน้ำ", "middle", "#e9dcb8") + leader(88, 309, 88, 300));
    }

    // ---- กล่องภาพขยาย (ซ้ายบน) ----
    const needInset = cue === "fabric" || cue === "fact" || cue === "tip" || cue === "label";
    const FI = SCENE_IRON.focus[cue] || SCENE_IRON.focus.all;
    if (needInset) o.push(`<g transform="translate(${f2(FI.cx + (8 - 135) / FI.z)} ${f2(FI.cy + (14 - 240) / FI.z)}) scale(${f2(1.15 / FI.z)}) translate(-8 -22)">`);
    if (needInset) o.push(`<rect x="8" y="22" width="120" height="98" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.4" opacity=".97"/>`);
    if (cue === "fabric") {
      const fi = ease(cl((p - 0.2) / 0.5));
      o.push(txt(68, 34, "ซูมเส้นใยผ้า", 6.6, "#2b3350"));
      const A = (1 - fi) * 4.6;
      for (let r = 0; r < 5; r++) {
        let d = "";
        for (let x = 16; x <= 120; x += 4) {
          const y = 66 + r * 8 + A * Math.sin(x * 0.55 + r * 1.9) + (1 - fi) * 1.4 * Math.sin(x * 1.3 + r);
          d += (d ? " L" : "M") + `${x} ${f2(y)}`;
        }
        o.push(`<path d="${d}" fill="none" stroke="#9c7b45" stroke-width="3.4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f1dba5" stroke-width="1.8" stroke-linecap="round"/>`);
      }
      // ความร้อน + ไอน้ำ ลงมาที่เส้นใย
      if (p > 0.08 && p < 0.85) for (let i = 0; i < 4; i++) {
        const u = (ph * 0.9 + i * 0.25) % 1;
        o.push(H.varrow(32 + i * 26, 42 + u * 8, "#ff5a2a", 0.9 * Math.sin(Math.PI * u), 1));
        o.push(puff(40 + i * 26, 56 - u * 8, 3 + u * 2, 0.5 * Math.sin(Math.PI * u), false));
      }
      o.push(txt(68, 112, fi < 0.5 ? "เส้นใยงอ ผ้ายับ" : "เส้นใยคลายตัว กดให้เรียบ", 6, fi < 0.5 ? "#7a4513" : "#1d6a86"));
    }
    if (cue === "fact") {
      o.push(txt(68, 34, "ประวัติเตารีดไฟฟ้า", 6.6, "#2b3350"));
      o.push(`<path d="M22 72 H114" stroke="#2b3350" stroke-width="1.6" stroke-linecap="round"/>`);
      const a1 = ease(cl((p - 0.04) / 0.2)), a2 = ease(cl((p - 0.5) / 0.2));
      o.push(`<g opacity="${f2(a1)}"><circle cx="30" cy="72" r="4.5" fill="#ffe14a" stroke="#2b3350" stroke-width="1"/>${txt(30, 56, "ค.ศ. 1882", 6.4, "#2b3350")}${txt(30, 91, "สิทธิบัตรเตารีด", 5.2, "#46526b")}${txt(30, 98, "ไฟฟ้ารุ่นแรก", 5.2, "#46526b")}</g>`);
      o.push(`<g opacity="${f2(a2)}"><circle cx="104" cy="72" r="4.5" fill="#7fe3ff" stroke="#2b3350" stroke-width="1"/>${txt(104, 56, "ราว ค.ศ. 1920", 6.4, "#2b3350")}${txt(104, 91, "เตารีดที่คุม", 5.2, "#46526b")}${txt(104, 98, "อุณหภูมิเองได้", 5.2, "#46526b")}</g>`);
    }
    if (cue === "tip") {
      o.push(txt(68, 34, "รอให้ร้อนถึงระดับที่ตั้ง", 6.2, "#2b3350"));
      o.push(`<rect x="18" y="52" width="100" height="9" rx="4.5" fill="#e6dcc3" stroke="#2b3350" stroke-width=".8"/><rect x="18" y="52" width="${f2(100 * cl(s.tmp / 0.9))}" height="9" rx="4.5" fill="${mixc("#7fe3ff", "#ff7a2a", s.tmp)}"/>`);
      o.push(`<path d="M${f2(18 + (100 * 0.85) / 0.9)} 48 V65" stroke="#d94b4b" stroke-width="1.2" stroke-dasharray="2 1.4"/>`);
      o.push(txt(94, 72, "ระดับที่ตั้งไว้", 5.2, "#d94b4b"));
      const on = s.closed;
      o.push(`<circle cx="34" cy="92" r="6" fill="${on ? "#ff4a3a" : "#6a3a3a"}" stroke="#2b3350" stroke-width="1"/>`);
      if (on) o.push(`<circle cx="34" cy="92" r="11" fill="#ff4a3a" opacity="${f2(0.3 + 0.15 * Math.sin(ph * 6))}" filter="url(#bl)"/>`);
      o.push(txt(86, 94, on ? "ไฟติด = ยังร้อนไม่ถึง" : "ไฟดับ = พร้อมรีด", 6, on ? "#b53a10" : "#1b7a3a"));
      o.push(txt(68, 112, "แล้วค่อยเริ่มรีด", 5.6, "#46526b"));
    }
    if (cue === "label") {
      const low = p >= 0.5;
      o.push(txt(68, 34, low ? "ตั้งต่ำเกินไป" : "ดูป้ายบนผ้าก่อนตั้ง", 6.6, low ? "#d94b4b" : "#2b3350"));
      if (!low) {
        o.push(`<rect x="22" y="44" width="48" height="58" rx="5" fill="#fff" stroke="#46526b" stroke-width="1.2"/><circle cx="46" cy="49" r="1.6" fill="#46526b"/>`);
        // สัญลักษณ์เตารีด + จุด
        o.push(`<path d="M30 70 H60 Q64 70 64 74 V76 H30 Z" fill="none" stroke="#2b3350" stroke-width="1.6" stroke-linejoin="round"/><path d="M38 70 Q38 63 45 63 H52" fill="none" stroke="#2b3350" stroke-width="1.4"/>`);
        o.push(`<circle cx="42" cy="71" r="1.3" fill="#2b3350"/><circle cx="48" cy="71" r="1.3" fill="#2b3350"/>`);
        o.push(txt(46, 90, "ป้ายผ้า", 5.6, "#46526b"));
        o.push(`<path d="M74 72 H104" stroke="#d94b4b" stroke-width="1.6" stroke-dasharray="3 2"/><path d="M102 67 L110 72 L102 77Z" fill="#d94b4b"/>`);
        o.push(txt(92, 90, "ปุ่มปรับ", 5.6, "#46526b"));
      } else {
        o.push(drop(46, 62 + 4 * Math.sin(ph * 6), 4));
        o.push(drop(68, 72 + 4 * Math.sin(ph * 6 + 1), 4));
        o.push(drop(90, 60 + 4 * Math.sin(ph * 6 + 2), 4));
        o.push(txt(68, 96, "น้ำหยดลงผ้า ไม่เป็นไอ", 6.2, "#1d6a86"));
        o.push(txt(68, 108, "เพราะแผ่นฐานไม่ร้อนพอ", 5.6, "#46526b"));
      }
    }
    if (needInset) o.push(`</g>`);
    void wob;

    o.push(box(SCENE_IRON.focus[cue]?.box, ph));
    return o.join("");
  },
};
