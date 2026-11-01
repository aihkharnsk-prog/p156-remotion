// ฉากอธิบาย: น้ำยาปรับผ้านุ่ม — โมเลกุลหัวประจุบวกเกาะเส้นใยประจุลบ หางยาวเป็นฟิล์มลื่น ลดไฟฟ้าสถิต (SVG พิกัด 270x480)
// เน้นแอนิเมชัน: กล้องซูมจากผ้าทั้งผืนไปถึงระดับโมเลกุลบนผิวเส้นใย, ทุก cue มีลูปเคลื่อนไหวตลอด
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
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));
const bgFill = (ph: number, c0 = "#232c55", c1 = "#0e1328", dot = "#7fe3ff") => {
  let s = `<rect x="-140" y="-140" width="550" height="760" fill="url(#bg)"/>`;
  for (let i = 0; i < 22; i++) {
    const x = rnd(i) * 270, y = 300 - ((ph * (3 + rnd(i + 9) * 5) + rnd(i + 4) * 340) % 340);
    s += `<circle cx="${f2(x + Math.sin(ph + i) * 4)}" cy="${f2(y)}" r="${f2(1 + rnd(i + 2) * 2.2)}" fill="${dot}" opacity="${f2(0.07 + 0.06 * rnd(i + 7))}"/>`;
  }
  return s + `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>`;
};

// ----- ฉากอธิบาย: น้ำยาปรับผ้านุ่ม — โมเลกุลประจุบวกเกาะเส้นใยประจุลบ หางลื่นเป็นฟิล์ม (SVG 270x480) -----
const FOCUS = {
  all: { cx: 135, cy: 175, z: 1.35 },
  fibre: { cx: 135, cy: 160, z: 1.7 },
  quat: { cx: 135, cy: 150, z: 1.8 },
  milk: { cx: 135, cy: 165, z: 1.5 },
  attract: { cx: 135, cy: 165, z: 1.9 },
  film: { cx: 135, cy: 160, z: 1.7 },
  stat: { cx: 135, cy: 165, z: 1.5 },
  towel: { cx: 135, cy: 160, z: 1.8 },
  stay: { cx: 135, cy: 160, z: 1.7 },
  order: { cx: 135, cy: 170, z: 1.35 },
  chk: { cx: 135, cy: 190, z: 1.3 },
  end: { cx: 135, cy: 175, z: 1.15 },
};
const DEFS = `<defs>
<linearGradient id="sfib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4e6c4"/><stop offset=".5" stop-color="#e2cb98"/><stop offset="1" stop-color="#b79a5e"/></linearGradient>
<linearGradient id="sbt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e87ab0"/><stop offset=".4" stop-color="#ffc4de"/><stop offset="1" stop-color="#c9568d"/></linearGradient>
<linearGradient id="swt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0ff" stop-opacity=".25"/><stop offset="1" stop-color="#2f8fe0" stop-opacity=".45"/></linearGradient>
</defs>`;
const PINK = "#ff7ab8", TAIL = "#ffd0e6";
const minus = (x: number, y: number, s = 5) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${s}" fill="#2b4a9a" stroke="#9fc0ff" stroke-width=".7"/><path d="M${f2(x - s * 0.55)} ${f2(y)} h${f2(s * 1.1)}" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`;
const plus = (x: number, y: number, s = 5) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${s}" fill="${PINK}" stroke="#7a1a4a" stroke-width=".7"/><path d="M${f2(x - s * 0.55)} ${f2(y)} h${f2(s * 1.1)} M${f2(x)} ${f2(y - s * 0.55)} v${f2(s * 1.1)}" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`;
// โมเลกุล: หัวประจุบวกที่ (x,y) หางชี้ทิศ dir (เรเดียน) ยาว len
const mol = (x: number, y: number, dir: number, len: number, ph: number, k: number, hs = 4.4) => {
  let d = `M${f2(x)} ${f2(y)}`; const n = 7;
  for (let i = 1; i <= n; i++) {
    const t = (i / n) * len, w = Math.sin(i * 1.7 + ph * 3 + k) * 2.6 * (i / n);
    d += ` L${f2(x + Math.cos(dir) * t - Math.sin(dir) * w)} ${f2(y + Math.sin(dir) * t + Math.cos(dir) * w)}`;
  }
  return `<path d="${d}" stroke="${TAIL}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` + plus(x, y, hs);
};
// เส้นใย: แท่งยาวแนวนอน ผิวบนที่ y0 ครึ่งหนาเท่า h
const fibre = (y0: number, h: number, neg: boolean, ph: number, x0 = 20, x1 = 250) => {
  let s = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${h}" rx="${f2(h / 2)}" fill="url(#sfib)" stroke="#6a5326" stroke-width="1.2"/>`;
  for (let x = x0 + 8; x < x1 - 6; x += 12) s += `<path d="M${x} ${f2(y0 + h * 0.5)} q3 -3 6 0" stroke="#9c7f3e" stroke-width=".8" fill="none" opacity=".6"/>`;
  if (neg) for (let x = x0 + 10; x < x1 - 8; x += 17) s += minus(x, y0 + 0.5, 4.2);
  return s;
};
const fibreRough = (y0: number, ph: number, x0 = 20, x1 = 250, flip = 1) => {
  let d = `M${x0} ${y0 + 26 * flip}`; for (let x = x0; x <= x1; x += 6) d += ` L${x} ${f2(y0 + (rnd(x) - 0.5) * 7 + 0 * ph)}`;
  return `<path d="${d} L${x1} ${y0 + 26 * flip} Z" fill="url(#sfib)" stroke="#6a5326" stroke-width="1.2"/>`;
};
const view = (c: string, ph: number, p: number): string => {
  let s = "";
  if (c === "all" || c === "end") {
    // ขวดเทน้ำยาลงน้ำล้าง + ผ้าถักเป็นตาราง
    const tilt = 20 + 12 * Math.sin(ph * 2);
    s += `<rect x="40" y="170" width="190" height="80" rx="10" fill="url(#swt)" stroke="#9fc0ff" stroke-width="1.4"/>`;
    for (let i = 0; i < 10; i++) { const u = (ph * 0.5 + i / 10) % 1; s += `<circle cx="${f2(70 + rnd(i) * 130)}" cy="${f2(185 + u * 60)}" r="${f2(1.2 + 1.5 * rnd(i + 2))}" fill="#ffc4de" opacity="${f2(0.8 * (1 - u * 0.5))}"/>`; }
    // ผ้า
    for (let i = 0; i < 9; i++) { s += `<path d="M${60 + i * 16} 196 q${f2(Math.sin(ph * 2 + i) * 3)} 14 0 28" stroke="#e2cb98" stroke-width="3" fill="none" stroke-linecap="round"/>`; if (i < 5) s += `<path d="M58 ${200 + i * 6} q${f2(40 + Math.sin(ph * 2 + i) * 3)} 3 ${f2(144)} 0" stroke="#c9ae78" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`; }
    s += `<g transform="translate(168 112) rotate(${-tilt} 20 40)"><rect x="0" y="20" width="40" height="64" rx="8" fill="url(#sbt)" stroke="#7a1a4a" stroke-width="1.6"/><rect x="10" y="4" width="20" height="18" rx="3" fill="#fff" stroke="#7a1a4a" stroke-width="1.2"/><ellipse cx="20" cy="56" rx="12" ry="9" fill="#fff" opacity=".35"/></g>`;
    for (let i = 0; i < 6; i++) { const u = (ph * 0.8 + i / 6) % 1; s += `<circle cx="${f2(178 - 10 * u)}" cy="${f2(120 + u * 56)}" r="2.2" fill="#ffc4de" opacity="${f2(1 - u * 0.4)}"/>`; }
  } else if (c === "fibre") {
    // เส้นใยสองเส้นเสียดสี: ผิวสาก + ประจุลบ
    const sh = Math.sin(ph * 2.4) * 10;
    s += fibreRough(118, ph, 20, 250, -1) + `<g transform="translate(${f2(sh)} 0)">${fibreRough(158, ph, 20, 250, 1)}</g>`;
    for (let x = 36; x < 240; x += 22) s += minus(x, 118 + 0, 4.4) + minus(x + sh, 158, 4.4);
    for (let i = 0; i < 5; i++) { const x = 60 + i * 38; s += `<path d="M${x} 138 l3 -4 l-2 4 l4 -3" stroke="#ff8a7a" stroke-width="1.4" fill="none" opacity="${f2(0.5 + 0.5 * Math.sin(ph * 6 + i))}"/>`; }
    s += pill(135, 96, "ผิวสาก เสียดสีกัน", "#ffe9e4") + pill(135, 206, "ผิวมีประจุลบในน้ำ", "#dfe9ff");
  } else if (c === "quat") {
    const b = Math.sin(ph * 1.6);
    s += mol(92, 150, 0.0, 92, ph, 0, 10);
    s += `<path d="M99 126 L99 150" stroke="#ffe14a" stroke-width="1" /><g>${txt(96, 126, "หัวประจุบวก", 7, "#ffd0e6")}${txt(140, 138, "หางไฮโดรคาร์บอนยาว", 6.4, "#ffe9f3")}</g>`.replace('<path d="M99 126 L99 150" stroke="#ffe14a" stroke-width="1" />', "");
    for (let i = 0; i < 6; i++) { const u = (ph * 0.5 + i / 6) % 1; s += `<circle cx="${f2(150 + (rnd(i) - 0.5) * 120)}" cy="${f2(176 + (rnd(i + 3) - 0.5) * 30 + u * 20)}" r="2" fill="#7fd0ff" opacity=".5"/>`; }
    s += pill(135, 214, b > 0 ? "ควอเทอร์นารีแอมโมเนียม" : "หัว + หาง", "#ffd0e6");
  } else if (c === "milk") {
    s += `<rect x="50" y="100" width="170" height="130" rx="16" fill="#fff0f8" fill-opacity=".14" stroke="#ffc4de" stroke-width="1.6"/>`;
    for (let i = 0; i < 16; i++) {
      const x = 62 + ((rnd(i) * 146 + Math.sin(ph * 0.8 + i) * 6) % 146), y = 114 + ((rnd(i + 5) * 104 + ph * 5 * (0.5 + rnd(i + 2))) % 104), r = 7 + 3 * rnd(i + 8);
      s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#ffd0e6" fill-opacity=".35" stroke="#ff7ab8" stroke-width="1.2"/><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r - 2.6)}" fill="none" stroke="#ffc4de" stroke-width=".8"/>`;
    }
    s += pill(135, 90, "ลอยกระจายเป็นถุงเล็กๆ ในน้ำ", "#ffd0e6");
  } else if (c === "attract" || c === "film" || c === "towel" || c === "stay") {
    const filmP = c === "film" ? 1 : 1, k = c === "attract" ? p : 1;
    const n = 12;
    s += fibre(176, 40, true, ph, 20, 250);
    for (let i = 0; i < n; i++) {
      const hx = 34 + i * 18, hy = 176 - 4.4;
      const a = c === "attract" ? sm(i * 0.05, i * 0.05 + 0.4, p) : 1;
      const sx = hx + (rnd(i) - 0.5) * 60 * (1 - a), sy = hy - 56 * (1 - a) - 4 * Math.sin(ph * 3 + i) * (1 - a);
      s += mol(lerp(sx, hx, 1), lerp(sy, hy, 1), -Math.PI / 2 + (1 - a) * (rnd(i + 3) - 0.5) * 2, 30 * (0.6 + 0.4 * a), ph, i);
      if (c === "attract" && a < 0.95 && a > 0.05) s += `<path d="M${f2(sx)} ${f2(sy + 5)} L${f2(hx)} ${f2(hy - 3)}" stroke="#ffe14a" stroke-width=".8" stroke-dasharray="2 2"/>`;
    }
    if (c === "stay") {
      for (let i = 0; i < 10; i++) { const u = (ph * 0.5 + i / 10) % 1, y = 100 + (i % 5) * 12; s += `<path d="M${f2(20 + u * 240)} ${y} h14" stroke="#9fd8ff" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>`; }
      for (let i = 0; i < 6; i++) { const u = (ph * 0.45 + i / 6) % 1; s += plus(30 + u * 230, 108 + (i % 3) * 14, 3.4).replace("<circle", "<circle opacity='.6'"); }
      s += pill(135, 84, "ตัวที่เกาะแล้วอยู่ ตัวลอยไหลทิ้ง", "#e1f3ff");
    }
    if (c === "attract") s += pill(135, 98, p < 0.5 ? "บวก ดึงดูด ลบ" : "เรียงตัวเกาะเส้นใย", "#ffd0e6");
    if (c === "film") {
      // เส้นใยเส้นที่สองลื่นผ่านผิวฟิล์ม
      const sh = Math.sin(ph * 2.4) * 40;
      s += `<g transform="translate(${f2(sh)} -52)">${fibre(104, 14, false, ph, 40, 200)}<path d="M60 104 l2 -5 M100 104 l-2 -5 M140 104 l2 -5" stroke="#bfe8ff" stroke-width="1" opacity=".0"/></g>`;
      s += `<path d="M${f2(135 + sh - 30)} 142 h-20 m6 -3 l-6 3 l6 3" stroke="#7fe3ff" stroke-width="1.4" fill="none"/>`;
      s += pill(135, 84, "ลื่นผ่านกันได้ง่ายขึ้น", "#e1f3ff");
    }
    if (c === "towel") {
      // หยดน้ำวางบนฟิล์มหาง: ลอยตัว ไม่ซึม
      const u = (ph * 0.4) % 1, y = 90 + 40 * Math.min(1, u * 1.6), sink = u > 0.7 ? 0 : 1;
      s += `<ellipse cx="135" cy="${f2(y + 4)}" rx="${f2(16 + 3 * Math.sin(ph * 5))}" ry="${f2(11 - 2 * sink * 0)}" fill="#7fd0ff" fill-opacity=".7" stroke="#2f8fe0" stroke-width="1.4"/>`;
      s += `<path d="M122 ${f2(y + 6)} q13 -8 26 0" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/>`;
      s += pill(135, 70, "หางไม่ชอบน้ำ ผ้าซับน้ำได้น้อยลง", "#ffe9e4");
    }
  } else if (c === "stat") {
    // ผ้าสองชิ้นเกาะกันด้วยไฟฟ้าสถิต → เคลือบแล้วเป็นกลาง แยกออกง่าย
    const k = sm(0.35, 0.7, p), gap = 6 + 18 * k;
    s += `<g><rect x="70" y="${f2(120 - gap / 2)}" width="130" height="26" rx="8" fill="#9fc0ff" stroke="#2b4a9a" stroke-width="1.4"/><rect x="70" y="${f2(160 + gap / 2 - 2)}" width="130" height="26" rx="8" fill="#ffd9a8" stroke="#a8742a" stroke-width="1.4"/></g>`;
    for (let i = 0; i < 6; i++) {
      const x = 86 + i * 20;
      if (k < 0.5) s += minus(x, 120 - gap / 2 + 26 - 5, 3.6) + plus(x, 160 + gap / 2 + 4, 3.6);
      else s += `<circle cx="${x}" cy="${f2(120 - gap / 2 + 21)}" r="2.2" fill="#ffc4de" opacity=".8"/><circle cx="${x}" cy="${f2(160 + gap / 2 + 4)}" r="2.2" fill="#ffc4de" opacity=".8"/>`;
    }
    if (k < 0.5) for (let i = 0; i < 3; i++) s += `<path d="M${100 + i * 30} 142 v8 m-2 -2 l2 2 l2 -2 m-2 -6 v-8 m-2 2 l2 -2 l2 2" stroke="#ffe14a" stroke-width="1.2" fill="none" opacity="${f2(0.5 + 0.5 * Math.sin(ph * 6 + i))}"/>`;
    s += pill(135, 92, k < 0.5 ? "ประจุตรงข้าม ดูดติดกัน" : "ประจุสมดุล แยกง่าย", k < 0.5 ? "#ffe9e4" : "#e5f8e9");
  } else if (c === "order") {
    // ลำดับ: ซัก (ผงซักฟอกประจุลบ) → ล้างครั้งสุดท้าย (เติมน้ำยาปรับผ้านุ่ม)
    const rin = sm(0.45, 0.6, p);
    s += `<rect x="30" y="92" width="210" height="140" rx="14" fill="url(#swt)" stroke="#9fc0ff" stroke-width="1.4"/>`;
    s += `<rect x="30" y="${f2(70)}" width="105" height="18" rx="9" fill="${rin < 0.5 ? "#ffe14a" : "#3a3560"}" opacity=".9"/><rect x="135" y="70" width="105" height="18" rx="9" fill="${rin >= 0.5 ? "#ffd0e6" : "#3a3560"}"/>`;
    s += txt(82, 83, "ซัก", 8, "#2b3350", "middle", 900) + txt(188, 83, "ล้างรอบสุดท้าย", 8, rin >= 0.5 ? "#7a1a4a" : "#9fb0e8", "middle", 900);
    if (rin < 0.5) {
      for (let i = 0; i < 12; i++) { const x = 50 + rnd(i) * 170 + Math.sin(ph * 1.5 + i) * 5, y = 110 + rnd(i + 3) * 100 + Math.cos(ph * 1.3 + i) * 4; s += minus(x, y, 4); }
      for (let i = 0; i < 5; i++) { const u = (ph * 0.3 + i / 5) % 1; s += plus(50 + rnd(i + 9) * 170, 100 + u * 40, 4) .replace(/<circle/, "<circle opacity='.35'"); }
      s += pill(135, 246, "ผงซักฟอกส่วนใหญ่ประจุลบ จับควอตได้", "#ffe9e4");
    } else {
      for (let i = 0; i < 9; i++) { const x = 50 + rnd(i) * 170 + Math.sin(ph * 1.5 + i) * 5, y = 110 + rnd(i + 3) * 100 + Math.cos(ph * 1.3 + i) * 4; s += plus(x, y, 4); }
      s += pill(135, 246, "น้ำสะอาดแล้ว ควอตไปเกาะผ้าได้เต็มที่", "#e5f8e9");
    }
  } else if (c === "chk") {
    // ขวดพร่องลงทุกครั้งที่ใช้
    const lv = 1 - 0.8 * sm(0, 0.95, p), use = Math.floor(p * 9);
    s += `<g transform="translate(95 70)"><rect x="0" y="0" width="80" height="140" rx="14" fill="#fff" fill-opacity=".08" stroke="#ffc4de" stroke-width="2.4"/><rect x="24" y="-14" width="32" height="16" rx="3" fill="#fff" stroke="#7a1a4a" stroke-width="1.4"/>`;
    s += `<clipPath id="sbc"><rect x="4" y="4" width="72" height="132" rx="10"/></clipPath><g clip-path="url(#sbc)"><rect x="4" y="${f2(136 - 132 * lv)}" width="72" height="${f2(132 * lv)}" fill="url(#sbt)"/><path d="M4 ${f2(136 - 132 * lv)} q9 ${f2(3 * Math.sin(ph * 3))} 18 0 t18 0 t18 0 t18 0" stroke="#fff" stroke-width="1.2" fill="none"/></g></g>`;
    for (let i = 0; i < 9; i++) s += `<rect x="${58 + i * 16}" y="238" width="10" height="10" rx="2.5" fill="${i < use ? "#ffd0e6" : "#3a3560"}"/>`;
    s += txt(135, 262, "ซักไปแล้ว " + use + " ครั้ง", 7, "#cfe0ff");
    s += `<g transform="translate(${f2(215 + 3 * Math.sin(ph * 3))} 140)"><path d="M0 0 v-14 M-6 -9 l6 -5 l6 5" stroke="#ffe14a" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M-9 4 h18" stroke="#ffe14a" stroke-width="2.4" stroke-linecap="round"/></g>`;
  }
  return s;
};
export const SCENE_SOFTENER: SceneDef = {
  focus: FOCUS,
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const c = (FOCUS as any)[cue] ? cue : "all";
    return [DEFS, bgFill(ph, "#3a1f4f", "#150c26", "#ffc4de"), view(c, ph, p)].join("");
  },
};
