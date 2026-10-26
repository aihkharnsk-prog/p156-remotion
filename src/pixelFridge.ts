// ฉากพิกเซลตู้เย็นแบบตัดครึ่ง — วาดด้วยโค้ดทั้งหมด (ไม่ใช้ AI ไม่ใช้คลิปของใคร) ทุกพิกเซลคม
// ไฟล์นี้ไม่ import อะไรเลย เพื่อให้พรีวิวนอก Remotion ได้
export type Rc = { x: number; y: number; w: number; h: number; c: string; o?: number };
export const GW = 270;
export const GH = 480;

type Pt = [number, number];
const R = (a: Rc[], x: number, y: number, w: number, h: number, c: string, o?: number) => a.push({ x, y, w, h, c, o });

const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b), u = Math.max(0, Math.min(1, t));
  const h = (i: number) => Math.round(A[i] + (B[i] - A[i]) * u).toString(16).padStart(2, "0");
  return "#" + h(0) + h(1) + h(2);
};

// ---------- เส้นทางสารทำความเย็น (หน่วย = ช่องพิกเซล) ----------
export type Zone = "comp" | "disch" | "cond" | "cap" | "evap" | "suct";
type Seg = { a: Pt; b: Pt; zone: Zone; u0: number; u1: number; len: number; start: number };

const zig = (x0: number, x1: number, y0: number, step: number, n: number): Pt[] => {
  const p: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const y = y0 + step * k;
    const l2r = k % 2 === 1;
    p.push(l2r ? [x0, y] : [x1, y], l2r ? [x1, y] : [x0, y]);
  }
  return p;
};

const build = (): { pts: { p: Pt; zone: Zone }[] } => {
  const pts: { p: Pt; zone: Zone }[] = [];
  const add = (zone: Zone, ps: Pt[]) => ps.forEach((p) => pts.push({ p, zone }));
  add("comp", [[160, 348], [160, 375], [198, 375]]);
  add("disch", [[198, 375], [252, 375], [252, 98], [246, 98]]);
  add("cond", zig(228, 246, 98, 16, 15).slice(0)); // เริ่ม 246→228 แล้วสลับ
  add("cap", [[228, 322], [228, 334], [210, 334], [210, 80], [202, 80]]);
  add("evap", zig(176, 202, 80, 10, 8));
  add("suct", [[202, 150], [202, 340], [160, 340], [160, 348]]);
  return { pts };
};
export const PATH = build().pts;
const SEGS: Seg[] = [];
let TOTAL = 0;
for (let i = 0; i < PATH.length - 1; i++) {
  const a = PATH[i].p, b = PATH[i + 1].p;
  const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
  if (len === 0) continue;
  SEGS.push({ a, b, zone: PATH[i + 1].zone, u0: 0, u1: 0, len, start: TOTAL });
  TOTAL += len;
}
// ความคืบหน้า u ภายในโซน
const zoneRange: Record<string, [number, number]> = {};
SEGS.forEach((s) => {
  const r = zoneRange[s.zone] || [s.start, s.start + s.len];
  r[0] = Math.min(r[0], s.start);
  r[1] = Math.max(r[1], s.start + s.len);
  zoneRange[s.zone] = r;
});
export const PATH_LEN = TOTAL;

export const at = (d: number): { p: Pt; zone: Zone; u: number } => {
  const dd = ((d % TOTAL) + TOTAL) % TOTAL;
  for (const s of SEGS) {
    if (dd <= s.start + s.len) {
      const t = (dd - s.start) / s.len;
      const [z0, z1] = zoneRange[s.zone];
      return { p: [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t], zone: s.zone, u: (dd - z0) / (z1 - z0) };
    }
  }
  return { p: SEGS[0].a, zone: "comp", u: 0 };
};

export const stateColor = (zone: Zone, u: number): string => {
  switch (zone) {
    case "comp": return mix("#8fe3ff", "#ff5a3c", u);
    case "disch": return "#ff3b30";
    case "cond": return mix("#ff3b30", "#ffb02e", u);
    case "cap": return mix("#ffb02e", "#6fe0ff", Math.min(1, u * 1.4));
    case "evap": return mix("#36c4ff", "#e6f8ff", u);
    default: return "#cfefff";
  }
};

export const FOCUS: Record<string, { cx: number; cy: number; z: number; box?: [number, number, number, number]; label?: string }> = {
  all: { cx: 135, cy: 232, z: 1 },
  fridge: { cx: 135, cy: 235, z: 1.18 },
  food: { cx: 128, cy: 245, z: 2.0 },
  comp: { cx: 178, cy: 366, z: 2.7, box: [146, 344, 56, 60], label: "คอมเพรสเซอร์" },
  cond: { cx: 240, cy: 214, z: 2.0, box: [224, 92, 32, 238], label: "คอยล์ร้อน" },
  cap: { cx: 212, cy: 205, z: 2.2, box: [207, 76, 7, 262], label: "ท่อรูเล็ก" },
  evap: { cx: 192, cy: 118, z: 3.1, box: [172, 76, 36, 80], label: "คอยล์เย็น" },
  back: { cx: 214, cy: 232, z: 1.55 },
};

const tri = (a: Rc[], x: number, y: number, c: string) => {
  // ลูกศรชี้ขวา
  R(a, x, y, 9, 2, c);
  R(a, x + 8, y - 3, 2, 8, c);
  R(a, x + 10, y - 2, 2, 6, c);
  R(a, x + 12, y - 1, 2, 4, c);
};

export type PixOpts = { frame: number; cold: number; focus: string; heat?: boolean; run?: boolean };

export const pixelFridge = ({ frame, cold, focus, heat, run = true }: PixOpts): Rc[] => {
  const a: Rc[] = [];
  const ph = frame / 30;
  // ===== ฉากหลังห้องครัว =====
  R(a, -140, -140, 550, 560, "#f1dfb9");
  for (let x = -126; x < 410; x += 18) R(a, x, -140, 1, 550, "#e4cf9f");
  for (let y = -130; y < 410; y += 18) R(a, -140, y, 550, 1, "#e4cf9f");
  R(a, -140, 404, 550, 8, "#b98b5a");
  R(a, -140, 412, 550, 200, "#8a5a33");
  for (let x = -140; x < 410; x += 24) R(a, x, 412, 1, 200, "#744a28");
  for (let y = 430; y < 560; y += 26) R(a, -140, y, 550, 1, "#744a28");
  R(a, 52, 408, 180, 6, "#000000", 0.28);
  // หน้าต่างพิกเซลเล็กๆ ให้ห้องดูมีชีวิต
  R(a, -20, 80, 40, 64, "#6b4a2b"); R(a, -17, 83, 34, 58, "#9fd8ff");
  R(a, -17, 110, 34, 2, "#6b4a2b"); R(a, 0, 83, 2, 58, "#6b4a2b");
  R(a, -17, 83, 34, 14, "#cdeeff");

  // ===== ตัวตู้ =====
  R(a, 56, 54, 168, 356, "#46526b");
  R(a, 58, 56, 164, 352, "#e9eff6");
  R(a, 58, 56, 164, 3, "#ffffff");
  R(a, 216, 56, 6, 352, "#c4d0de");
  R(a, 58, 56, 8, 352, "#c4d0de");
  R(a, 60, 190, 3, 44, "#7a869c");
  // ช่องภายใน (ตัดครึ่ง)
  R(a, 66, 64, 140, 336, "#d6f0fd");
  R(a, 66, 64, 140, 8, "#eaf8ff");
  // โฟมฉนวนผนังหลัง
  R(a, 206, 64, 10, 336, "#f7e6a8");
  for (let y = 66; y < 400; y += 6) for (let x = 207 + ((y / 6) % 2) * 3; x < 215; x += 6) R(a, x, y, 2, 2, "#e0c46a");
  // ตัดแต่งชั้น
  R(a, 66, 166, 140, 5, "#8fb8d0");
  R(a, 66, 230, 140, 3, "#9fc3d8");
  R(a, 66, 290, 140, 3, "#9fc3d8");
  R(a, 66, 336, 140, 4, "#8fb8d0");
  // ห้องเครื่องด้านล่าง
  R(a, 66, 340, 140, 60, "#3b4663");
  R(a, 66, 340, 140, 3, "#2e374a");
  for (let x = 70; x < 148; x += 6) R(a, x, 352, 2, 40, "#323c56");

  // ===== ของกินในตู้ =====
  // ช่องฟรีซ
  R(a, 74, 138, 26, 28, "#8fd0f5"); R(a, 74, 138, 26, 4, "#d9f3ff"); R(a, 78, 148, 18, 3, "#ffffff"); R(a, 78, 156, 12, 3, "#ffffff");
  R(a, 106, 140, 24, 26, "#58b95a"); R(a, 106, 140, 24, 4, "#3a8a3c"); R(a, 112, 150, 6, 6, "#c7f5a8"); R(a, 120, 154, 6, 6, "#c7f5a8");
  R(a, 136, 144, 26, 22, "#ffb3d1"); R(a, 136, 140, 26, 5, "#ffffff"); R(a, 142, 152, 14, 4, "#ff7eb0");
  R(a, 80, 100, 18, 14, "#bfe6ff"); R(a, 82, 102, 14, 4, "#ffffff"); // ก้อนน้ำแข็ง
  R(a, 104, 104, 18, 14, "#bfe6ff"); R(a, 106, 106, 14, 4, "#ffffff");
  // ชั้นที่ 1
  R(a, 76, 198, 18, 32, "#f4f8ff"); R(a, 76, 198, 18, 9, "#3a7bd5"); R(a, 80, 214, 10, 8, "#3a7bd5"); R(a, 79, 192, 12, 6, "#f4f8ff");
  R(a, 100, 204, 12, 26, "#ff9a2e"); R(a, 102, 198, 8, 7, "#ff9a2e"); R(a, 103, 194, 6, 4, "#3b2a1a"); R(a, 102, 214, 8, 6, "#ffe0b0");
  for (let i = 0; i < 3; i++) { const x = 120 + i * 13; R(a, x + 2, 218, 8, 12, "#f6e6c8"); R(a, x, 220, 12, 8, "#f6e6c8"); R(a, x + 2, 218, 4, 3, "#fff8e8"); }
  R(a, 162, 214, 16, 16, "#e63946"); R(a, 164, 212, 12, 3, "#e63946"); R(a, 169, 207, 3, 6, "#6b3f1d"); R(a, 172, 208, 5, 3, "#4caf50"); R(a, 165, 216, 3, 3, "#ff9aa2");
  R(a, 182, 208, 22, 22, "#4caf50"); R(a, 186, 204, 14, 6, "#7bd36b"); R(a, 190, 212, 6, 14, "#a5e58f");
  // ชั้นที่ 2
  R(a, 76, 262, 30, 28, "#fff2d0"); R(a, 76, 262, 30, 7, "#ff8fab"); R(a, 76, 272, 30, 3, "#e6c27a"); R(a, 84, 256, 4, 6, "#e63946");
  R(a, 114, 268, 32, 22, "#f7f7f7"); R(a, 114, 268, 32, 6, "#4caf50"); R(a, 120, 278, 20, 6, "#ffd24a");
  R(a, 154, 276, 14, 14, "#e63946"); R(a, 158, 272, 6, 4, "#4caf50");
  R(a, 176, 274, 24, 16, "#ffd24a"); R(a, 180, 278, 4, 4, "#e0a800"); R(a, 188, 282, 4, 4, "#e0a800"); R(a, 194, 276, 3, 3, "#e0a800");
  // ลิ้นชักผัก
  R(a, 70, 298, 132, 36, "#a9dcc8"); R(a, 70, 298, 132, 4, "#d2f1e3");
  for (let i = 0; i < 4; i++) { R(a, 82 + i * 20, 308, 6, 22, "#ff8a3d"); R(a, 81 + i * 20, 304, 8, 5, "#4caf50"); }
  R(a, 170, 310, 22, 20, "#8e44ad"); R(a, 172, 306, 18, 5, "#4caf50");

  // ความเย็นในตู้ (เพิ่มตามค่า cold)
  R(a, 66, 64, 140, 276, "#5fb8ff", 0.05 + 0.22 * cold);

  // ===== เทอร์โมมิเตอร์ (ซ้ายนอกตู้) =====
  R(a, 18, 98, 14, 160, "#46526b"); R(a, 20, 100, 10, 156, "#ffffff");
  const level = 0.22 + 0.78 * (1 - cold);
  const mh = Math.round(150 * level);
  R(a, 21, 254 - mh, 8, mh, mix("#ff5a3c", "#46b4ff", cold));
  R(a, 12, 250, 26, 22, "#46526b"); R(a, 14, 252, 22, 18, mix("#ff5a3c", "#46b4ff", cold));

  // ===== ท่อ =====
  const pipe = (x0: number, y0: number, x1: number, y1: number, th: number, c: string) => {
    const x = Math.min(x0, x1), y = Math.min(y0, y1);
    R(a, x - Math.floor(th / 2), y - Math.floor(th / 2), Math.abs(x1 - x0) + th, Math.abs(y1 - y0) + th, c);
  };
  // เงาท่อ (ขอบ) แล้วตามด้วยสีท่อ
  for (let i = 0; i < PATH.length - 1; i++) {
    const p = PATH[i].p, q = PATH[i + 1].p;
    if (p[0] === q[0] && p[1] === q[1]) continue;
    const z = PATH[i + 1].zone;
    const th = z === "cap" ? 2 : z === "cond" || z === "evap" ? 4 : 4;
    pipe(p[0], p[1], q[0], q[1], th + 2, "#2b3350");
  }
  for (let i = 0; i < PATH.length - 1; i++) {
    const p = PATH[i].p, q = PATH[i + 1].p;
    if (p[0] === q[0] && p[1] === q[1]) continue;
    const z = PATH[i + 1].zone;
    const th = z === "cap" ? 2 : 4;
    const base = z === "cond" ? "#b8505a" : z === "disch" ? "#b85a5a" : z === "evap" ? "#4a8fbf" : z === "cap" ? "#c79a4a" : z === "comp" ? "#7d8aa6" : "#6a8fb5";
    pipe(p[0], p[1], q[0], q[1], th, base);
  }
  // ครีบคอยล์ร้อน (เส้นแนวตั้งบางๆ)
  for (let x = 230; x <= 244; x += 4) R(a, x, 96, 1, 230, "#b8505a", 0.35);

  // ===== คอมเพรสเซอร์ =====
  const sh = run ? (frame % 4 < 2 ? 0 : 1) : 0;
  R(a, 148 + sh, 346, 54, 58, "#2e374a");
  R(a, 150 + sh, 348, 50, 54, "#59657f");
  R(a, 156 + sh, 354, 34, 42, "#7d8aa6");
  R(a, 158 + sh, 356, 8, 38, "#a3b0cc");
  for (let y = 358; y < 394; y += 6) R(a, 170 + sh, y, 18, 2, "#59657f");
  const pst = run ? Math.round(3 + 3 * Math.sin(ph * 14)) : 3;
  R(a, 174 + sh, 360 + pst, 12, 6, "#2e374a");
  R(a, 190 + sh, 372, 8, 6, "#ffcf4a");
  // ปลั๊ก/สายไฟ
  R(a, 202, 392, 24, 3, "#2e374a");

  // ===== อนุภาคสารทำความเย็น =====
  const spd = run ? 26 : 0;
  const gap = 15;
  const n = Math.floor(TOTAL / gap);
  for (let i = 0; i < n; i++) {
    const d = i * gap + ph * spd;
    const s = at(d);
    const c = stateColor(s.zone, s.u);
    const big = s.zone === "cond" || s.zone === "cap" ? 3 : 4; // ของเหลวเม็ดเล็กแน่น / แก๊สเม็ดใหญ่
    const x = Math.round(s.p[0]) - Math.floor(big / 2), y = Math.round(s.p[1]) - Math.floor(big / 2);
    R(a, x, y, big, big, c);
    R(a, x, y, 1, 1, "#ffffff", 0.75);
  }

  // ===== ลูกศรความร้อน =====
  if (heat) {
    if (focus === "evap" || focus === "all" || focus === "food") {
      for (let k = 0; k < 5; k++) {
        const u = (ph * 0.55 + k * 0.2) % 1;
        const x = 112 + u * 58, y = 86 + k * 15;
        tri(a, Math.round(x), y, "#ff8a3d");
        if (u > 0.8) R(a, Math.round(x), y - 4, 20, 10, "#ffffff", 0);
      }
    }
    if (focus === "cond" || focus === "all" || focus === "back") {
      for (let k = 0; k < 6; k++) {
        const u = (ph * 0.5 + k * 0.17) % 1;
        const x = 248 + u * 16, y = 112 + k * 38;
        tri(a, Math.round(x), y, "#ff5a36");
      }
    }
  }
  // ประกายความเย็นที่คอยล์เย็น
  if (focus === "evap" || focus === "all") {
    for (let k = 0; k < 6; k++) {
      const blink = Math.sin(ph * 5 + k * 1.7) > 0.2;
      if (!blink) continue;
      const x = 176 + ((k * 13) % 30), y = 80 + ((k * 29) % 72);
      R(a, x, y - 2, 1, 5, "#ffffff"); R(a, x - 2, y, 5, 1, "#ffffff");
    }
  }
  // กรอบไฮไลต์ส่วนที่กำลังพูดถึง
  const fb = FOCUS[focus]?.box;
  if (fb && Math.floor(ph * 3) % 2 === 0) {
    const [x, y, w, h] = fb;
    const c = "#ffe14a";
    R(a, x, y, w, 2, c); R(a, x, y + h - 2, w, 2, c); R(a, x, y, 2, h, c); R(a, x + w - 2, y, 2, h, c);
  }
  return a;
};
