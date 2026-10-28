// ฉากอธิบาย: เครื่องปิ้งขนมปัง (pop-up toaster) แบบตัดครึ่ง — SVG พิกัด 270x480
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, plen, along, box, DEFS, room } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
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

const EXTRA = `<defs>
<linearGradient id="tcav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4363"/><stop offset="1" stop-color="#232a44"/></linearGradient>
<linearGradient id="tmica" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9c9a3"/><stop offset=".5" stop-color="#f0e4c6"/><stop offset="1" stop-color="#cdbb92"/></linearGradient>
<linearGradient id="tcu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a4a1c"/><stop offset=".5" stop-color="#f0a35c"/><stop offset="1" stop-color="#8a4a1c"/></linearGradient>
<linearGradient id="tchrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7b879f"/><stop offset=".18" stop-color="#e4e9f2"/><stop offset=".5" stop-color="#b5bfd2"/><stop offset=".82" stop-color="#eef2f8"/><stop offset="1" stop-color="#7b879f"/></linearGradient>
<linearGradient id="tiron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9ced9"/><stop offset="1" stop-color="#6d7690"/></linearGradient>
</defs>`;

type S = { pop: number; glow: number; brown: number; mag: number; tp: number; pw: number };
const Z: S = { pop: 1, glow: 0, brown: 0, mag: 0, tp: 0, pw: 0 };
const ST: Record<string, [S, S]> = {
  all: [Z, Z],
  lever: [Z, { ...Z, pop: 0 }],
  wires: [{ pop: 0, glow: 0, brown: 0, mag: 1, tp: 0, pw: 1 }, { pop: 0, glow: 1, brown: 0.08, mag: 1, tp: 0.05, pw: 1 }],
  toast: [{ pop: 0, glow: 1, brown: 0.08, mag: 1, tp: 0.05, pw: 1 }, { pop: 0, glow: 1, brown: 0.8, mag: 1, tp: 0.35, pw: 1 }],
  magnet: [{ pop: 0, glow: 1, brown: 0.8, mag: 1, tp: 0.35, pw: 1 }, { pop: 0, glow: 1, brown: 0.86, mag: 1, tp: 0.5, pw: 1 }],
  timer: [{ pop: 0, glow: 1, brown: 0.86, mag: 1, tp: 0.5, pw: 1 }, { pop: 0, glow: 1, brown: 0.95, mag: 1, tp: 1, pw: 1 }],
  pop: [{ pop: 0, glow: 1, brown: 0.95, mag: 1, tp: 1, pw: 1 }, { pop: 1, glow: 0, brown: 0.95, mag: 0, tp: 1, pw: 0 }],
  fact: [{ ...Z, brown: 0 }, { ...Z, brown: 0 }],
  old: [{ pop: 0, glow: 1, brown: 0.9, mag: 0, tp: 0, pw: 1 }, { pop: 1, glow: 0.3, brown: 0.9, mag: 0, tp: 0, pw: 0 }],
  stuck: [{ pop: 0.4, glow: 0, brown: 0.5, mag: 0, tp: 0, pw: 0 }, { pop: 0.4, glow: 0, brown: 0.5, mag: 0, tp: 0, pw: 0 }],
  crumb: [{ ...Z, brown: 0.95 }, { ...Z, brown: 0.95 }],
  end: [{ ...Z, brown: 0.95 }, { ...Z, brown: 0.95 }],
};

// ตัวเรือน: x 28..244, โพรงใน x 38..234, y 185..374
const TRAY0 = 270; // ก้นขนมปังเมื่ออยู่ล่าง
const RISE = 55;
const ROD_X = 206;
const SPR_X = 222;
// เส้นทางไฟ: ปลั๊ก → หน้าสัมผัส → ลวดความร้อน (ซิกแซก) → กลับปลั๊ก
const ROWS = 11;
const SERP: Pt[] = [];
for (let r = 0; r < ROWS; r++) {
  const y = 200 + r * 8;
  if (r % 2 === 0) { SERP.push([182, y], [88, y]); } else { SERP.push([88, y], [182, y]); }
}
const CIRCUIT: Pt[] = [[30, 318], [150, 318], [188, 314], [190, 300], [192, 290], [194, 290], [194, 200], ...SERP, [52, 280], [52, 306], [30, 306]];
const CIRC_L = plen(CIRCUIT);
const MAGW: Pt[] = [[112, 342], [186, 342], [190, 336]];
const MAGW_L = plen(MAGW);

const bread = (x: number, yb: number, b: number, tilt = 0) => {
  const c = mixc("#f7e8c4", "#c98a3a", b * 0.95);
  const c2 = mixc("#f2dca8", "#a86a22", b);
  const crust = mixc("#c9954f", "#7a4513", b);
  const d = `M${x} ${yb + 76} V${yb + 22} Q${x - 4} ${yb + 22} ${x - 4} ${yb + 12} Q${x - 4} ${yb} ${x + 12} ${yb} H${x + 58} Q${x + 74} ${yb} ${x + 74} ${yb + 12} Q${x + 74} ${yb + 22} ${x + 70} ${yb + 22} V${yb + 76} Z`;
  let o = `<g transform="rotate(${tilt} ${x + 35} ${yb + 76})"><path d="${d}" fill="${crust}"/>`;
  o += `<path d="${d}" fill="${c}" transform="translate(${x + 35} ${yb + 40}) scale(.88 .9) translate(${-(x + 35)} ${-(yb + 40)})"/>`;
  o += `<path d="${d}" fill="${c2}" opacity=".5" transform="translate(${x + 35} ${yb + 40}) scale(.7 .76) translate(${-(x + 35)} ${-(yb + 40)})"/>`;
  for (let i = 0; i < 26; i++) o += `<circle cx="${f2(x + 8 + rnd(i) * 58)}" cy="${f2(yb + 8 + rnd(i + 40) * 62)}" r="${f2(0.5 + rnd(i + 7) * 0.9)}" fill="${mixc("#d9c08c", "#7a4513", b)}" opacity=".5"/>`;
  return o + `</g>`;
};

const spring = (x: number, y0: number, y1: number, w = 5) => {
  const n = 12;
  const p: Pt[] = [];
  for (let i = 0; i <= n; i++) p.push([x + (i % 2 ? w : -w), lerp(y0, y1, i / n)]);
  return `<polyline points="${pts(p)}" fill="none" stroke="#2b3350" stroke-width="2.6" stroke-linejoin="round"/><polyline points="${pts(p)}" fill="none" stroke="#c9d1e0" stroke-width="1.3" stroke-linejoin="round"/>`;
};

const plug = (x: number, y: number, gap: number) =>
  // เต้ารับ + ปลั๊ก (gap = ระยะที่ถอดออก)
  `<rect x="${x}" y="${y}" width="26" height="30" rx="4" fill="#e9edf4" stroke="#5a6684" stroke-width="1"/><rect x="${x + 5}" y="${y + 8}" width="3" height="10" rx="1" fill="#2b3350"/><rect x="${x + 5}" y="${y + 20}" width="3" height="7" rx="1" fill="#2b3350"/>` +
  `<g transform="translate(${f2(gap)} 0)"><rect x="${x + 26}" y="${y + 3}" width="8" height="24" fill="#d94b4b" opacity="0"/><rect x="${x + 12}" y="${y + 9}" width="9" height="2.6" fill="#9aa4ba"/><rect x="${x + 12}" y="${y + 19}" width="9" height="2.6" fill="#9aa4ba"/><rect x="${x + 21}" y="${y + 3}" width="26" height="24" rx="5" fill="#3b4566" stroke="#1d2338" stroke-width="1"/><path d="M${x + 47} ${y + 15} q12 0 14 14" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round"/></g>`;

export const SCENE_TOASTER: SceneDef = {
  focus: {
    all: { cx: 135, cy: 232, z: 1.0 },
    lever: { cx: 200, cy: 262, z: 1.8, box: [186, 188, 76, 150], label: "กดคันโยกลง" },
    wires: { cx: 118, cy: 242, z: 1.75, box: [82, 194, 108, 98], label: "ลวดนิกเกิลโครเมียม" },
    toast: { cx: 126, cy: 195, z: 1.12, box: [8, 22, 120, 98], label: "รังสีอินฟราเรด" },
    magnet: { cx: 205, cy: 318, z: 3.2, box: [186, 316, 40, 40], label: "แม่เหล็กไฟฟ้า" },
    timer: { cx: 62, cy: 336, z: 2.3, box: [8, 318, 108, 42], label: "วงจรตั้งเวลา" },
    pop: { cx: 160, cy: 250, z: 1.5, box: [90, 120, 140, 160], label: "สปริงดีดขึ้น" },
    fact: { cx: 140, cy: 235, z: 1.05, box: [8, 22, 120, 98], label: "ถอดปลั๊ก = ไม่ล็อก" },
    old: { cx: 70, cy: 70, z: 2.2, box: [8, 22, 120, 98], label: "รุ่นเก่า: แผ่นโลหะสองชั้น" },
    stuck: { cx: 140, cy: 235, z: 1.05, box: [8, 22, 120, 98], label: "ขนมปังติด" },
    crumb: { cx: 80, cy: 335, z: 1.6, box: [-48, 358, 280, 16], label: "ถาดเศษขนมปัง" },
    end: { cx: 135, cy: 232, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = ST[cue] || ST.all;
    const e = ease(p);
    const g = (k: keyof S) => lerp(A[k], B[k], e);
    let pop = g("pop"), glow = g("glow"), brown = g("brown"), mag = g("mag"), tp = g("tp"), pw = g("pw");
    let pushing = 0, jam = 0, fork = 0, trayOut = 0, popT = 0, bend = 0;
    if (cue === "lever") { pop = 1 - ease(cl(p / 0.85)); mag = p > 0.88 ? 1 : 0; pw = p > 0.88 ? 1 : 0; pushing = p < 0.85 ? 1 : 0; }
    if (cue === "pop") {
      const q = cl((p - 0.3) / 0.4);
      pop = 1 - Math.pow(1 - q, 3);
      const off = p > 0.14;
      mag = off ? 0 : 1; pw = off ? 0 : 1;
      glow = off ? Math.max(0, 1 - (p - 0.14) * 2.2) : 1;
      popT = p;
    }
    if (cue === "fact") {
      const q = p < 0.12 ? 0 : p < 0.42 ? ease((p - 0.12) / 0.3) : p < 0.58 ? 1 : 1 - Math.pow(cl((p - 0.58) / 0.12), 0.6) * 1;
      pop = 1 - q; pushing = p > 0.1 && p < 0.44 ? 1 : 0;
    }
    if (cue === "old") {
      bend = ease(cl(p / 0.78));
      const q = cl((p - 0.84) / 0.14);
      pop = ease(q);
      glow = p > 0.84 ? 1 - 0.7 * q : 1;
      pw = p > 0.84 ? 0 : 1;
    }
    if (cue === "stuck") { jam = 1; fork = 1; }
    if (cue === "crumb") { trayOut = ease(cl((p - 0.35) / 0.4)); }
    if (cue === "timer") tp = lerp(0.5, 1, p);
    const hot = pw > 0.5;

    const trayY = TRAY0 - RISE * pop;
    const collarY = trayY + 10;
    const o: string[] = [DEFS, EXTRA, room(430)];
    // เคาน์เตอร์
    o.push(`<rect x="-140" y="398" width="550" height="12" fill="url(#top)"/><rect x="-140" y="410" width="550" height="60" fill="url(#cab)"/>`);
    o.push(`<defs><linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d4b8"/><stop offset="1" stop-color="#b9a47f"/></linearGradient><linearGradient id="cab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c7650"/><stop offset="1" stop-color="#6d4d30"/></linearGradient></defs>`);
    o.push(`<ellipse cx="136" cy="399" rx="118" ry="5" fill="#1b1008" opacity=".4" filter="url(#bl)"/>`);

    // ตัวเรือนโครเมียม + โพรงที่ตัดครึ่ง
    o.push(`<g filter="url(#sh)"><path d="M40 175 H232 Q246 175 246 190 V384 Q246 398 232 398 H40 Q26 398 26 384 V190 Q26 175 40 175Z" fill="url(#tchrome)" stroke="#6e7a93" stroke-width="1.2"/></g>`);
    o.push(`<rect x="38" y="185" width="196" height="189" rx="3" fill="url(#tcav)" stroke="#1d2338" stroke-width="1.4"/>`);
    o.push(`<rect x="38" y="374" width="196" height="24" fill="#2b3350" opacity=".25"/>`);
    // ช่องกัน (ฐาน)
    o.push(`<rect x="34" y="388" width="22" height="10" rx="3" fill="#2b3350"/><rect x="216" y="388" width="22" height="10" rx="3" fill="#2b3350"/>`);

    // แสงจากลวดความร้อน
    if (glow > 0.02) o.push(`<rect x="70" y="190" width="130" height="104" rx="10" fill="#ff7a2a" opacity="${f2(0.28 * glow)}" filter="url(#bl)"/>`);
    // แผ่นไมกา + ลวดนิกเกิลโครเมียม (แผงด้านหลัง)
    o.push(`<rect x="82" y="192" width="106" height="96" rx="2" fill="url(#tmica)" stroke="#a89466" stroke-width="1"/>`);
    for (let r = 0; r < ROWS; r++) { const y = 200 + r * 8; o.push(`<rect x="82" y="${y - 1.6}" width="3.4" height="3.2" fill="#8d7a50"/><rect x="184.6" y="${y - 1.6}" width="3.4" height="3.2" fill="#8d7a50"/>`); }
    const wc = glow < 0.5 ? mixc("#5f5a66", "#ff4a14", glow / 0.5) : mixc("#ff4a14", "#ffb866", (glow - 0.5) / 0.5);
    const wpath = "M" + SERP.map((q) => `${q[0]} ${q[1]}`).join(" L");
    if (glow > 0.05) o.push(`<path d="${wpath}" fill="none" stroke="#ff6a1a" stroke-width="5" stroke-linejoin="round" opacity="${f2(0.5 * glow)}" filter="url(#bl)"/>`);
    o.push(`<path d="${wpath}" fill="none" stroke="${wc}" stroke-width="1.7" stroke-linejoin="round"/>`);
    // กริลกันขนมปังชนลวด
    o.push(`<rect x="93" y="190" width="1.4" height="98" fill="#9aa4ba"/><rect x="176" y="190" width="1.4" height="98" fill="#9aa4ba"/>`);

    // สปริงดึงถาดขึ้น (ยืดเมื่อกดลง)
    o.push(`<rect x="${SPR_X - 8}" y="188" width="16" height="6" rx="2" fill="#6e7a93"/>`);
    o.push(spring(SPR_X, 194, collarY, 5));
    // ถาด + ก้านนำ + แผ่นโลหะ
    const plateY = trayY + 50;
    o.push(`<rect x="${ROD_X - 2}" y="${f2(trayY - 30)}" width="4" height="${f2(plateY - trayY + 30)}" fill="#aeb7ca" stroke="#5a6684" stroke-width=".7"/>`);
    // ตัวผลักหน้าสัมผัส (ลิ่ม)
    o.push(`<path d="M${ROD_X - 2} ${f2(trayY + 22)} L${ROD_X - 10} ${f2(trayY + 28)} L${ROD_X - 2} ${f2(trayY + 36)}Z" fill="#3b4566"/>`);
    // หน้าสัมผัส (ใบสัมผัสสองแผ่น)
    const closed = pop < 0.12;
    o.push(`<rect x="186" y="288" width="2.6" height="28" rx="1" fill="#c9a24a" stroke="#6b5420" stroke-width=".5"/>`);
    const ax = closed ? 189 : 194;
    o.push(`<path d="M${ax + 1.3} 288 L${ax + 1.3} 316" stroke="#c9a24a" stroke-width="2.6" stroke-linecap="round"/><circle cx="188.2" cy="302" r="1.8" fill="#f0d27a"/>`);
    if (closed && hot) o.push(`<circle cx="189" cy="302" r="6" fill="#ffe14a" opacity="${f2(0.35 + 0.2 * Math.sin(ph * 14))}" filter="url(#bl)"/>`);
    // ถาดรองขนมปัง
    o.push(`<rect x="92" y="${f2(trayY)}" width="${ROD_X - 90}" height="4" rx="1.5" fill="#aeb7ca" stroke="#5a6684" stroke-width=".7"/>`);
    o.push(`<rect x="94" y="${f2(trayY - 6)}" width="2" height="6" fill="#aeb7ca"/><rect x="172" y="${f2(trayY - 6)}" width="2" height="6" fill="#aeb7ca"/>`);
    // แขนยึดคันโยก
    o.push(`<rect x="${ROD_X - 6}" y="${f2(collarY - 4)}" width="16" height="8" rx="2" fill="#3b4566"/>`);
    // แผ่นโลหะ (เหล็ก) ใต้ก้าน
    o.push(`<rect x="${ROD_X - 15}" y="${f2(plateY)}" width="30" height="6" rx="1.5" fill="url(#tiron)" stroke="#3b4566" stroke-width=".7"/>`);

    // แม่เหล็กไฟฟ้า
    const mcol = mag > 0.5 ? "#ffd75a" : "#6e7a93";
    o.push(`<path d="M190 328 H222 V352 H190 Z" fill="#8c96ac" stroke="#3b4566" stroke-width="1"/>`);
    o.push(`<rect x="196" y="332" width="20" height="16" rx="2" fill="url(#tcu)" stroke="#5d2e0e" stroke-width=".7"/>`);
    for (let i = 0; i < 6; i++) o.push(`<path d="M196 ${334 + i * 2.7} H216" stroke="#5d2e0e" stroke-width=".5" opacity=".7"/>`);
    if (mag > 0.5) {
      o.push(`<rect x="188" y="326" width="36" height="8" rx="3" fill="#ffd75a" opacity="${f2(0.4 + 0.2 * Math.sin(ph * 8))}" filter="url(#bl)"/>`);
      const gapTop = plateY + 6;
      if (gapTop < 330) {
        for (let i = 0; i < 4; i++) { const xx = 194 + i * 8; o.push(`<path d="M${xx} ${f2(gapTop)} V328" stroke="${mcol}" stroke-width="1.2" stroke-dasharray="2 1.5" opacity=".9"/>`); }
      }
    }
    if (cue === "magnet") {
      for (let i = 0; i < 3; i++) { const r = 14 + ((ph * 14 + i * 8) % 24); o.push(`<ellipse cx="206" cy="330" rx="${f2(r)}" ry="${f2(r * 0.55)}" fill="none" stroke="#ffd75a" stroke-width="1" opacity="${f2(0.7 * (1 - (r - 14) / 24))}"/>`); }
    }

    // วงจรตั้งเวลา (PCB) + ปุ่มปรับความเข้ม
    o.push(`<rect x="52" y="326" width="60" height="28" rx="2.5" fill="#2f7a55" stroke="#174a32" stroke-width="1"/>`);
    o.push(`<path d="M56 348 H70 L74 344 H100 M60 332 H78 M84 350 H108" stroke="#a6e0bf" stroke-width=".7" fill="none" opacity=".7"/>`);
    o.push(`<rect x="76" y="331" width="20" height="13" rx="1.5" fill="#1b2238"/>`);
    for (let i = 0; i < 5; i++) o.push(`<rect x="${77.4 + i * 3.8}" y="329.5" width="1.6" height="2" fill="#c9d1e0"/><rect x="${77.4 + i * 3.8}" y="343.5" width="1.6" height="2" fill="#c9d1e0"/>`);
    o.push(`<circle cx="86" cy="337.5" r="3.4" fill="none" stroke="#7fe3ff" stroke-width="1" opacity=".8"/>`);
    o.push(`<rect x="58" y="336" width="5" height="9" rx="1.4" fill="#4a72d9"/><rect x="102" y="333" width="5" height="3.6" fill="#caa86a"/>`);
    // แถบนับเวลา
    o.push(`<rect x="56" y="350" width="52" height="2.4" rx="1.2" fill="#174a32"/><rect x="56" y="350" width="${f2(52 * cl(tp))}" height="2.4" rx="1.2" fill="#7fe3ff"/>`);
    if (cue === "timer") {
      const a = tp * Math.PI * 2 - Math.PI / 2;
      o.push(`<path d="M86 ${337.5 - 7.5} A7.5 7.5 0 ${tp > 0.5 ? 1 : 0} 1 ${f2(86 + 7.5 * Math.cos(a))} ${f2(337.5 + 7.5 * Math.sin(a))}" fill="none" stroke="#7fe3ff" stroke-width="1.6" stroke-linecap="round"/>`);
      o.push(`<rect x="48" y="322" width="68" height="36" rx="4" fill="#7fe3ff" opacity="${f2(0.12 + 0.08 * Math.sin(ph * 6))}" filter="url(#bl)"/>`);
    }
    // ปุ่มปรับความเข้ม (ยื่นออกซ้าย)
    o.push(`<rect x="28" y="336" width="26" height="3" fill="#6e7a93"/><circle cx="20" cy="338" r="9" fill="#2b3350" stroke="#9aa4ba" stroke-width="1"/><path d="M20 338 L26 332" stroke="#ffe14a" stroke-width="1.8" stroke-linecap="round"/>`);
    o.push(txt(20, 353, "ความเข้ม", 5, "#46526b"));
    // สายไฟจากปลั๊ก (เข้าที่ด้านซ้าย)
    o.push(`<path d="M26 318 H4 Q-8 318 -8 330" fill="none" stroke="#222" stroke-width="3.4" stroke-linecap="round"/>`);
    // สายไฟภายใน
    const wire = (a: Pt[], c = "#7c86a0") => `<polyline points="${pts(a)}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/>`;
    o.push(wire(CIRCUIT.slice(0, 7), "#d25a4a") + wire(CIRCUIT.slice(CIRCUIT.length - 4), "#5b8be0"));
    o.push(`<polyline points="${pts([[112, 342], [186, 342], [190, 336]])}" fill="none" stroke="#9aa4ba" stroke-width="1.3" stroke-linejoin="round"/>`);
    o.push(`<polyline points="${pts([[96, 337], [112, 342]])}" fill="none" stroke="#9aa4ba" stroke-width="1.3"/>`);
    // อนุภาคกระแสไฟ
    if (hot) {
      for (let i = 0; i < 18; i++) {
        const d = ((ph * 55 + (i * CIRC_L) / 18) % CIRC_L);
        const pt = along(CIRCUIT, d);
        o.push(`<circle cx="${f2(pt[0])}" cy="${f2(pt[1])}" r="1.7" fill="#ffe14a" stroke="#b58a00" stroke-width=".4"/>`);
      }
    }
    if (mag > 0.5) {
      for (let i = 0; i < 6; i++) {
        const d = ((ph * 40 + (i * MAGW_L) / 6) % MAGW_L);
        const pt = along(MAGW, d);
        o.push(`<circle cx="${f2(pt[0])}" cy="${f2(pt[1])}" r="1.5" fill="#7fe3ff" stroke="#1d6a86" stroke-width=".4"/>`);
      }
    }

    // เศษขนมปังที่ตกลงมา + ถาดรองเศษ
    const trayShift = -trayOut * 70;
    o.push(`<g transform="translate(${f2(trayShift)} 0)"><rect x="40" y="362" width="192" height="8" rx="2" fill="#b9c2d4" stroke="#5a6684" stroke-width=".9"/><rect x="26" y="361" width="16" height="10" rx="3" fill="#2b3350"/>`);
    const nPile = cue === "crumb" ? 40 : 12;
    for (let i = 0; i < nPile; i++) o.push(`<circle cx="${f2(60 + rnd(i + 70) * 150)}" cy="${f2(361 - rnd(i + 3) * (cue === "crumb" ? 3.4 : 1.6))}" r="${f2(0.9 + rnd(i + 9) * 0.9)}" fill="#c98a3a"/>`);
    o.push(`</g>`);
    if (cue === "crumb") {
      for (let i = 0; i < 9; i++) {
        const u = (ph * 0.7 + i / 9) % 1;
        if (trayOut > 0.1) break;
        o.push(`<circle cx="${f2(112 + rnd(i) * 68)}" cy="${f2(292 + u * 68)}" r="1.4" fill="#c98a3a" opacity="${f2(Math.sin(Math.PI * u))}"/>`);
      }
    }

    // ขนมปัง
    const breadY = trayY - 76;
    o.push(cue === "wires" ? `<g opacity=".22">${bread(100, breadY, brown, 0)}</g>` : bread(100, breadY, brown, jam ? 5 : 0));
    // ไอน้ำเล็กน้อยตอนปิ้ง
    if (glow > 0.5 && cue !== "pop") for (let i = 0; i < 3; i++) { const u = (ph * 0.5 + i / 3) % 1; o.push(`<circle cx="${f2(120 + i * 20 + Math.sin(u * 6 + i) * 3)}" cy="${f2(breadY - u * 22)}" r="${f2(2 + u * 3)}" fill="#fff" opacity="${f2(Math.sin(Math.PI * u) * 0.28)}" filter="url(#bl)"/>`); }
    // ขอบฝาด้านบน (ช่องใส่ขนมปัง)
    o.push(`<path d="M40 175 H92 V185 H38 Q26 185 26 192 V190 Q26 175 40 175Z" fill="url(#tchrome)"/><path d="M180 175 H232 Q246 175 246 190 V192 Q246 185 234 185 H180 Z" fill="url(#tchrome)"/>`);
    o.push(`<rect x="88" y="175" width="6" height="11" rx="2" fill="#6e7a93"/><rect x="178" y="175" width="6" height="11" rx="2" fill="#6e7a93"/>`);

    // ผนังขวา + คันโยก
    o.push(`<rect x="236" y="196" width="6" height="104" rx="3" fill="#1d2338" opacity=".85"/>`);
    o.push(`<rect x="232" y="${f2(collarY - 3)}" width="16" height="6" fill="#3b4566"/>`);
    o.push(`<g filter="url(#sh2)"><rect x="244" y="${f2(collarY - 7)}" width="22" height="14" rx="5" fill="#2b3350" stroke="#9aa4ba" stroke-width="1"/><rect x="247" y="${f2(collarY - 4.5)}" width="14" height="3" rx="1.5" fill="#6e7a93"/></g>`);
    if (pushing) o.push(`<g opacity="${f2(0.6 + 0.4 * Math.sin(ph * 10))}"><path d="M255 ${f2(collarY - 26)} V${f2(collarY - 12)}" stroke="#ff5a3a" stroke-width="2.4"/><path d="M250 ${f2(collarY - 13)} L255 ${f2(collarY - 6)} L260 ${f2(collarY - 13)}Z" fill="#ff5a3a"/></g>`);

    // ป้ายชื่อชิ้นส่วนตามคิว
    if (cue === "lever") {
      o.push(pill(262, 204, "คันโยก", "end") + leader(236, 205, 254, collarY));
      o.push(pill(206, 222, "สปริงยืด", "end") + leader(207, 219, SPR_X - 5, 240));
      o.push(pill(184, 330, "หน้าสัมผัสไฟ", "end") + leader(168, 328, 189, 306));
    }
    if (cue === "wires") {
      o.push(pill(44, 214, "ลวดนิกเกิลโครเมียม", "start") + leader(110, 211, 120, 208));
      o.push(pill(44, 262, "แผ่นไมกา", "start", "#e9dcb8") + leader(78, 260, 90, 262));
    }
    if (cue === "magnet") { o.push(pill(244, 284, "แผ่นโลหะบนถาด", "end") + leader(228, 287, 214, plateY + 3)); }
    if (cue === "timer") { o.push(pill(20, 312, "ชิปนับเวลา", "start") + leader(60, 314, 80, 331)); }
    

    // กล่องภาพขยาย/ไอคอนเสริมทางซ้ายบน
    const showIR = cue === "wires" || cue === "toast";
    if (showIR || cue === "old" || cue === "fact" || cue === "stuck") {
      o.push(`<rect x="8" y="22" width="120" height="98" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.4" opacity=".97"/>`);
    }
    if (showIR) {
      o.push(txt(68, 34, "มองตัดขวางจากปลายช่อง", 6.4, "#2b3350"));
      // ผนังไมกา + ลวด
      const wc2 = wc;
      o.push(`<rect x="24" y="42" width="5" height="62" fill="url(#tmica)" stroke="#a89466" stroke-width=".6"/><rect x="107" y="42" width="5" height="62" fill="url(#tmica)" stroke="#a89466" stroke-width=".6"/>`);
      for (let i = 0; i < 7; i++) {
        const yy = 47 + i * 9;
        if (glow > 0.05) o.push(`<circle cx="31.5" cy="${yy}" r="4.2" fill="#ff6a1a" opacity="${f2(0.5 * glow)}" filter="url(#bl)"/><circle cx="104.5" cy="${yy}" r="4.2" fill="#ff6a1a" opacity="${f2(0.5 * glow)}" filter="url(#bl)"/>`);
        o.push(`<circle cx="31.5" cy="${yy}" r="2.1" fill="${wc2}"/><circle cx="104.5" cy="${yy}" r="2.1" fill="${wc2}"/>`);
      }
      // ขนมปังมองจากปลาย (บาง)
      const bc = mixc("#f2dca8", "#c98a3a", brown);
      o.push(`<rect x="62" y="44" width="12" height="58" rx="3" fill="#d6a867"/><rect x="62.5" y="44" width="3" height="58" rx="1.5" fill="${bc}" opacity="${f2(0.2 + brown)}"/><rect x="70.5" y="44" width="3" height="58" rx="1.5" fill="${bc}" opacity="${f2(0.2 + brown)}"/>`);
      o.push(`<rect x="65.5" y="44" width="5" height="58" fill="#f7e8c4"/>`);
      // ลูกศรอินฟราเรด
      if (glow > 0.1) for (let r = 0; r < 4; r++) {
        const u = (ph * 0.9 + r * 0.25) % 1;
        const y = 52 + r * 15;
        o.push(H.warrow(35 + u * 12, y, "#ff5a2a", glow * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.05)), 1));
        o.push(H.warrow(101 - u * 12, y, "#ff5a2a", glow * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.05)), -1));
      }
      o.push(txt(68, 113, "ขนมปัง", 6, "#7a4513"));
      o.push(txt(28, 113, "ลวด", 6, "#b53a10"));
      o.push(txt(108, 113, "ลวด", 6, "#b53a10"));
    }
    if (cue === "old") {
      o.push(txt(68, 33, "รุ่นเก่า: ใช้ความร้อนโก่งแผ่นโลหะ", 5.8, "#2b3350"));
      // แผ่นโลหะสองชั้น
      const x0 = 18, yb0 = 94, L = 54;
      const tipY = yb0 - 33 * bend;
      const strip = (off: number, c: string) => `<path d="M${x0} ${yb0 + off} Q${x0 + L * 0.6} ${f2(yb0 + off - 4 * bend)} ${x0 + L} ${f2(tipY + off)}" fill="none" stroke="${c}" stroke-width="3.2"/>`;
      o.push(strip(-1.6, "#e08a3a") + strip(1.6, "#8f9bb3"));
      o.push(`<rect x="12" y="86" width="9" height="16" rx="2" fill="#5a6684"/>`);
      for (let i = 0; i < 3; i++) o.push(`<path d="M${30 + i * 14} 106 q3 -4 0 -8 t0 -8" fill="none" stroke="#ff5a2a" stroke-width="1.4" opacity="${f2(0.5 + 0.4 * Math.sin(ph * 6 + i))}"/>`);
      o.push(txt(46, 118, "ความร้อน", 5.4, "#b53a10"));
      o.push(txt(34, 70, "แผ่นโลหะสองชั้น", 5.2, "#46526b"));
      // หน้าสัมผัส
      o.push(`<rect x="62" y="52" width="14" height="3.6" rx="1" fill="#c9a24a"/><rect x="${x0 + L - 3}" y="${f2(tipY - 5.5)}" width="6" height="3" fill="#f0d27a"/>`);
      const touch = bend > 0.95;
      // โซลีนอยด์ + สลัก
      const rel = pop > 0.02 || touch ? 1 : 0;
      o.push(`<rect x="78" y="62" width="22" height="16" rx="2" fill="url(#tcu)" stroke="#5d2e0e" stroke-width=".8"/>`);
      if (touch) o.push(`<rect x="76" y="60" width="26" height="20" rx="4" fill="#ffd75a" opacity=".5" filter="url(#bl)"/>`);
      o.push(`<polyline points="${pts([[74, 55], [88, 55], [88, 62]])}" fill="none" stroke="${touch ? "#ffd75a" : "#7c86a0"}" stroke-width="1.2"/>`);
      const lx = 100 + (rel ? -0 : 0) + (touch ? 7 : 0);
      o.push(`<path d="M${f2(lx)} 72 H112" stroke="#5a6684" stroke-width="2.4" stroke-linecap="round"/>`);
      o.push(`<path d="M${f2(lx - 8)} 72 H${f2(lx)}" stroke="#5a6684" stroke-width="2.4" stroke-linecap="round"/>`);
      // แกนถาดพร้อมปุ่มล็อก
      const cy2 = 100 - pop * 14;
      o.push(`<rect x="113" y="${f2(cy2 - 70)}" width="5" height="70" fill="#aeb7ca" stroke="#5a6684" stroke-width=".6"/>`);
      o.push(`<rect x="108" y="${f2(cy2 - 32)}" width="6" height="4" rx="1" fill="#3b4566"/>`);
      o.push(txt(98, 104, "สลักล็อก", 5.2, "#46526b"));
      o.push(txt(89, 90, "ตัวปล่อยสลัก", 5.2, "#7a4a1c", "middle", 600));
    }
    if (cue === "fact") {
      o.push(plug(24, 42, -2 + 20 * Math.min(1, p * 3)));
      o.push(txt(68, 34, "ถอดปลั๊กอยู่", 6.6, "#2b3350"));
      o.push(`<g opacity="${f2(0.7 + 0.3 * Math.sin(ph * 6))}"><circle cx="100" cy="64" r="11" fill="none" stroke="#d94b4b" stroke-width="2.4"/><path d="M92 56 L108 72" stroke="#d94b4b" stroke-width="2.4"/></g>`);
      o.push(txt(68, 92, "ไม่มีไฟ", 7, "#d94b4b"));
      o.push(txt(68, 104, "แม่เหล็กไฟฟ้าไม่ดูด", 6, "#46526b"));
      o.push(txt(68, 114, "สปริงดันถาดกลับขึ้น", 6, "#46526b"));
    }
    if (cue === "stuck") {
      o.push(plug(18, 42, 10));
      o.push(txt(68, 34, "ถอดปลั๊ก รอให้เย็นก่อน", 6.2, "#2b3350"));
      o.push(`<g transform="translate(106 60) rotate(18)"><rect x="-1.4" y="2" width="2.8" height="30" rx="1.4" fill="#aeb7ca" stroke="#5a6684" stroke-width=".6"/><path d="M-5 -10 v10 q5 5 10 0 v-10 M-1.6 -10 v7 M1.6 -10 v7" fill="none" stroke="#aeb7ca" stroke-width="1.8" stroke-linecap="round"/></g>`);
      o.push(`<g opacity="${f2(0.75 + 0.25 * Math.sin(ph * 6))}"><circle cx="106" cy="68" r="15" fill="none" stroke="#d94b4b" stroke-width="2.6"/><path d="M94 56 L118 80" stroke="#d94b4b" stroke-width="2.6"/></g>`);
      o.push(txt(68, 108, "ห้ามใช้ส้อม/มีดงัด", 6.2, "#d94b4b"));
    }
    if (cue === "stuck") {
      o.push(pill(98, 166, "ขนมปังติด", "end", "#ffe14a"));
    }
    if (cue === "crumb") {
      o.push(pill(130, 392, "ดึงออกมาเทเศษทิ้ง", "middle"));
    }
    // เส้นวัดความร้อน: แสดงสถานะ
    if (hot && cue !== "lever") o.push(`<circle cx="236" cy="204" r="4" fill="#ff5a3a"/><circle cx="236" cy="204" r="9" fill="#ff5a3a" opacity="${f2(0.3 + 0.15 * Math.sin(ph * 5))}" filter="url(#bl)"/>`);

    o.push(box(SCENE_TOASTER.focus[cue]?.box, ph));
    return o.join("");
  },
};
