// ฉากอธิบาย: กระติกน้ำสุญญากาศ (vacuum flask) แบบตัดครึ่ง — SVG พิกัด 270x480
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, plen, along, box, DEFS, room } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#2b3350", anchor = "middle", w = 700) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, anchor: "start" | "end" | "middle" = "middle", fill = "#fff6c9") => {
  const w = s.length * 4.6 + 10;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "start" ? x : x - w;
  return `<rect x="${f2(x0)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".96"/>` +
    txt(x0 + w / 2, y + 0.4, s, 6.4, "#2b3350");
};
const leader = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)}" stroke="#2b3350" stroke-width=".9" stroke-dasharray="2 1.5" fill="none"/><circle cx="${f2(x2)}" cy="${f2(y2)}" r="1.6" fill="#2b3350"/>`;
const pts = (a: Pt[]) => a.map((p) => `${f2(p[0])},${f2(p[1])}`).join(" ");
const xmark = (x: number, y: number, a = 1, s = 4) =>
  `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${s + 1.8}" fill="#fff" stroke="#d94b4b" stroke-width="1"/><path d="M${f2(x - s * 0.7)} ${f2(y - s * 0.7)} L${f2(x + s * 0.7)} ${f2(y + s * 0.7)} M${f2(x + s * 0.7)} ${f2(y - s * 0.7)} L${f2(x - s * 0.7)} ${f2(y + s * 0.7)}" stroke="#d94b4b" stroke-width="1.7" stroke-linecap="round"/></g>`;

// รูปทรงกระติก (ค่ากลางแกน x = CX)
const CX = 135;
const HB = 56; // ครึ่งความกว้างตัว
const HN = 30; // ครึ่งความกว้างคอ
const TOP = 126; // ปากคอ
const BOT = 392; // ก้น
const WT = 3.5; // ความหนาผนัง
const GAPW = 9; // ช่องสุญญากาศ
const LEVEL = 200; // ระดับเครื่องดื่ม

const outline = (d: number, top = TOP) => {
  const hb = HB - d, hn = HN - d, b = BOT - d, r = Math.max(5, 18 - d);
  return `M${CX - hn} ${f2(top)} H${CX + hn} V150 C${CX + hn} 164 ${CX + hb} 160 ${CX + hb} 180 V${f2(b - r)} Q${CX + hb} ${f2(b)} ${f2(CX + hb - r)} ${f2(b)} H${f2(CX - hb + r)} Q${CX - hb} ${f2(b)} ${CX - hb} ${f2(b - r)} V180 C${CX - hb} 160 ${CX - hn} 164 ${CX - hn} 150 Z`;
};

const EXTRA = `<defs>
<linearGradient id="fsteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7b879f"/><stop offset=".2" stop-color="#e4e9f2"/><stop offset=".5" stop-color="#b5bfd2"/><stop offset=".8" stop-color="#eef2f8"/><stop offset="1" stop-color="#7b879f"/></linearGradient>
<linearGradient id="fgap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#232b52"/><stop offset=".5" stop-color="#3a4577"/><stop offset="1" stop-color="#232b52"/></linearGradient>
<linearGradient id="flid" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a3150"/><stop offset=".3" stop-color="#5a6690"/><stop offset=".7" stop-color="#3b4566"/><stop offset="1" stop-color="#232a44"/></linearGradient>
<linearGradient id="ftab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d4b8"/><stop offset="1" stop-color="#b9a47f"/></linearGradient>
<linearGradient id="fcab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c7650"/><stop offset="1" stop-color="#6d4d30"/></linearGradient>
<radialGradient id="fsun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#ffc83a" stop-opacity=".6"/><stop offset="1" stop-color="#ffc83a" stop-opacity="0"/></radialGradient>
</defs>`;

type S = { g: number; air: number; tmp: number; cd: number; sil: number; leak: number; out: number };
const Z: S = { g: 1, air: 0, tmp: 0.92, cd: 0, sil: 0, leak: 0, out: 0 };
const ST: Record<string, [S, S]> = {
  all: [Z, Z],
  plain: [{ ...Z, g: 0, tmp: 0.95, out: 1 }, { ...Z, g: 0, tmp: 0.4, out: 1 }],
  walls: [{ ...Z, g: 0, air: 1, tmp: 0.4, out: 0.3 }, { ...Z, g: 1, air: 1, tmp: 0.4, out: 0.3 }],
  vacuum: [{ ...Z, air: 1 }, { ...Z, air: 0 }],
  shine: [{ ...Z, sil: 0 }, { ...Z, sil: 1 }],
  lid: [{ ...Z, sil: 0.4, leak: 0 }, { ...Z, sil: 0.4, leak: 1 }],
  cold: [{ ...Z, cd: 0, tmp: 0.2, sil: 0.4 }, { ...Z, cd: 1, tmp: 0.2, sil: 0.4 }],
  fact: [Z, Z],
  tip: [Z, Z],
  end: [Z, Z],
};

// เส้นทางความร้อนรั่วทางคอ: ผนังใน → ขอบคอที่ผนังมาต่อกัน → ผนังนอก (ด้านขวา)
const LEAK: Pt[] = [[CX + 41.75, 330], [CX + 41.75, 188], [CX + 33, 168], [CX + 15.75, 154], [CX + 15.75, 128], [CX + 28.25, 128], [CX + 28.25, 152], [CX + 44, 164], [CX + 54.25, 182], [CX + 54.25, 250]];
const LEAK_L = plen(LEAK);
const LEAKL: Pt[] = LEAK.map((q) => [2 * CX - q[0], q[1]] as Pt);

export const SCENE_FLASK: SceneDef = {
  focus: {
    all: { cx: 135, cy: 285, z: 1.0 },
    plain: { cx: 135, cy: 285, z: 1.12, label: "" },
    walls: { cx: 95, cy: 300, z: 2.0, box: [77, 232, 18, 100], label: "ผนังสองชั้น" },
    vacuum: { cx: 95, cy: 300, z: 2.0, box: [82, 232, 10, 100], label: "สุญญากาศ" },
    shine: { cx: 165, cy: 300, z: 2.0, box: [174, 232, 20, 100], label: "ผิวเงาสะท้อนรังสี" },
    lid: { cx: 135, cy: 182, z: 2.0, box: [93, 98, 84, 64], label: "ฝา + คอขวด" },
    cold: { cx: 135, cy: 285, z: 1.0 },
    fact: { cx: 135, cy: 252, z: 1.0 },
    tip: { cx: 135, cy: 252, z: 1.0 },
    end: { cx: 135, cy: 285, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = ST[cue] || ST.all;
    const e = ease(p);
    const gv = (k: keyof S) => lerp(A[k], B[k], e);
    let g = gv("g"), air = gv("air"), tmp = gv("tmp"), cd = gv("cd"), sil = gv("sil"), leak = gv("leak"), out = gv("out");
    if (cue === "walls") g = ease(cl(p / 0.45));
    if (cue === "vacuum") air = 1 - ease(cl((p - 0.12) / 0.5));
    if (cue === "cold") cd = ease(cl(p / 0.22));
    if (cue === "plain") tmp = lerp(0.95, 0.4, ease(p));
    if (cue === "cold") tmp = lerp(0.12, 0.2, p);
    // ขั้นตอนทิปอุ่นกระติก: เทน้ำร้อน → รอ → เทออก → ใส่เครื่องดื่ม
    let tipStage = 0, lvl = LEVEL, warmWater = 0;
    if (cue === "tip") {
      if (p < 0.12) { lvl = lerp(392, LEVEL, ease(p / 0.12)); warmWater = 1; tipStage = 1; }
      else if (p < 0.5) { warmWater = 1; tipStage = 2; }
      else if (p < 0.64) { lvl = lerp(LEVEL, 392, ease((p - 0.5) / 0.14)); warmWater = 1; tipStage = 3; }
      else if (p < 0.76) { lvl = 392; tipStage = 3; }
      else { lvl = lerp(392, LEVEL, ease((p - 0.76) / 0.16)); tipStage = 4; }
    }
    const gw = GAPW * g, iw = WT * g;
    const ci = WT + gw + iw; // ระยะผนังรวมถึงโพรงด้านใน
    const cavHB = HB - ci, cavHN = HN - ci;
    const gcl = CX - HB + WT + gw / 2, gcr = CX + HB - WT - gw / 2; // กึ่งกลางช่องสุญญากาศ
    const o: string[] = [DEFS, EXTRA, room(430)];
    // โต๊ะ
    o.push(`<rect x="-140" y="398" width="550" height="12" fill="url(#ftab)"/><rect x="-140" y="410" width="550" height="60" fill="url(#fcab)"/>`);
    o.push(`<ellipse cx="${CX}" cy="399" rx="76" ry="5" fill="#1b1008" opacity=".4" filter="url(#bl)"/>`);

    // ความร้อนรอบตัว (อากาศอุ่น) / แดดข้างนอก
    if (out > 0.02) o.push(`<ellipse cx="${CX}" cy="290" rx="98" ry="168" fill="#ff7a2a" opacity="${f2(0.2 * out)}" filter="url(#bl)"/>`);
    if (cue === "cold") {
      o.push(`<rect x="-20" y="60" width="290" height="340" rx="40" fill="#ffb347" opacity=".13" filter="url(#bl)"/>`);
    }

    // ตัวกระติก
    o.push(`<g filter="url(#sh)"><path d="${outline(0)}" fill="url(#fsteel)" stroke="#5a6684" stroke-width="1"/></g>`);
    const cavPath = outline(ci);
    if (g > 0.02) {
      o.push(`<path d="${outline(WT, TOP + WT)}" fill="url(#fgap)"/>`);
      o.push(`<path d="${outline(WT + gw)}" fill="url(#fsteel)" stroke="#5a6684" stroke-width=".6"/>`);
    }
    o.push(`<path d="${cavPath}" fill="#f3f8fc"/>`);

    // ผิวเงาที่หันเข้าช่องสุญญากาศ
    if (g > 0.6) {
      const sh = 0.55 + 0.45 * sil;
      o.push(`<path d="${outline(WT, TOP + WT)}" fill="none" stroke="#ffffff" stroke-width="${f2(0.9 + 0.9 * sil)}" opacity="${f2(sh)}"/>`);
      o.push(`<path d="${outline(WT + gw)}" fill="none" stroke="#ffffff" stroke-width="${f2(0.9 + 0.9 * sil)}" opacity="${f2(sh)}"/>`);
      if (sil > 0.05) {
        const gl = 0.5 + 0.5 * Math.sin(ph * 5);
        o.push(`<path d="M${f2(CX + HB - WT)} 190 V370 M${f2(CX - HB + WT)} 190 V370" stroke="#bfe9ff" stroke-width="3" opacity="${f2(0.5 * sil * gl)}" filter="url(#bl)"/>`);
      }
    }

    // เครื่องดื่ม
    const hotC = warmWater ? "#e9b38a" : "#b8702c";
    const liqC = mixc(hotC, "#7cc4f5", cd);
    o.push(`<clipPath id="fcav"><path d="${cavPath}"/></clipPath><g clip-path="url(#fcav)">`);
    o.push(`<rect x="0" y="${f2(lvl)}" width="270" height="260" fill="${liqC}"/>`);
    o.push(H.wave(CX - 70, CX + 70, lvl, 0.9, ph * 3, 400, mixc(liqC, "#ffffff", 0.18), 0.9));
    o.push(`<rect x="${CX - 60}" y="${f2(lvl + 4)}" width="14" height="150" fill="#fff" opacity=".12"/>`);
    // อนุภาคพลังงานความร้อนในเครื่องดื่ม (ร้อน = ขยับเร็ว/แดง, เย็น = ช้า/ฟ้า)
    const nP = 22;
    const hotP = mixc("#ff4a2a", "#4aa8ff", cd);
    const sp = lerp(5.5, 1.6, cd) * lerp(1, 0.5, 1 - cl(tmp * 1.1));
    for (let i = 0; i < nP; i++) {
      const bx = CX - 34 + rnd(i) * 68, by = 215 + rnd(i + 30) * 150;
      const px = bx + Math.sin(ph * sp * (1 + rnd(i + 5)) + i * 2.1) * 4;
      const py = by + Math.cos(ph * sp * (1 + rnd(i + 9)) + i * 1.3) * 4;
      if (py > lvl + 3 && Math.abs(px - CX) < cavHB - 3) o.push(`<circle cx="${f2(px)}" cy="${f2(py)}" r="1.5" fill="${hotP}" opacity=".85"/>`);
    }
    // ก้อนน้ำแข็งสำหรับเครื่องดื่มเย็น
    if (cd > 0.3) {
      for (let i = 0; i < 4; i++) {
        const ix = CX - 28 + (i % 2) * 28 + rnd(i + 80) * 6, iy = lvl + 12 + Math.floor(i / 2) * 22 + Math.sin(ph * 1.6 + i) * 1.4;
        o.push(`<rect x="${f2(ix)}" y="${f2(iy)}" width="17" height="17" rx="3" fill="#e9f7ff" stroke="#8fcbf0" stroke-width=".8" opacity="${f2(0.85 * cd)}" transform="rotate(${f2(rnd(i + 90) * 30 - 15)} ${f2(ix + 8)} ${f2(iy + 8)})"/>`);
      }
    }
    o.push(`</g>`);

    // อากาศในช่องว่าง (convection) — ถูกดูดออกเมื่อเป็นสุญญากาศ
    if (g > 0.6 && air > 0.02) {
      const N = 30;
      for (let i = 0; i < N; i++) {
        const side = i % 2 ? 1 : -1;
        const cx0 = side < 0 ? gcl : gcr;
        const u = (ph * 0.16 + i * 0.137) % 1;
        const yy = side < 0 ? 378 - u * 190 : 188 + u * 190;
        const drift = cue === "vacuum" ? (1 - air) * 18 : 0;
        const a = air * (cue === "vacuum" ? 1 : 0.9);
        if (a > 0.03) o.push(`<circle cx="${f2(cx0 + Math.sin(i * 3.1 + ph * 4) * 2.4)}" cy="${f2(yy + drift)}" r="1.1" fill="#cfe0ff" opacity="${f2(a)}"/>`);
      }
      if (cue === "walls" || cue === "vacuum") {
        // ลูกศรลมวน
        o.push(H.varrow(gcl - 3, 300 - ((ph * 20) % 60), "#cfe0ff", 0.8 * air, -1));
        o.push(H.varrow(gcr + 3, 250 + ((ph * 20) % 60), "#cfe0ff", 0.8 * air, 1));
      }
    }
    // ก้นกระติก: จุดดูดอากาศออกแล้วปิดผนึก
    {
      const sealed = cue === "vacuum" ? p > 0.62 : true;
      o.push(`<path d="M${CX - 4} ${BOT - 1} h8 v7 q-4 3 -8 0z" fill="${sealed ? "#7b879f" : "#c9d1e0"}" stroke="#4a5470" stroke-width=".7"/>`);
      if (cue === "vacuum" && p > 0.1 && p < 0.62) {
        for (let i = 0; i < 3; i++) { const u = (ph * 1.3 + i / 3) % 1; o.push(H.varrow(CX - 4.5 + (i - 1) * 1.5, BOT + 9 + u * 10, "#cfe0ff", 1 - u, 1)); }
      }
    }

    // ฝา + จุกกันความร้อน
    o.push(`<rect x="${CX - 13}" y="${TOP}" width="26" height="26" rx="3" fill="#9aa4ba" stroke="#4a5470" stroke-width=".8"/>`);
    for (let i = 0; i < 4; i++) o.push(`<rect x="${CX - 13}" y="${TOP + 6 + i * 5}" width="26" height="1" fill="#6e7a93"/>`);
    o.push(`<g filter="url(#sh2)"><rect x="${CX - 40}" y="102" width="80" height="24" rx="7" fill="url(#flid)" stroke="#1d2338" stroke-width="1"/><rect x="${CX - 36}" y="105" width="72" height="3" rx="1.5" fill="#fff" opacity=".18"/>`);
    for (let i = 0; i < 6; i++) o.push(`<rect x="${CX - 30 + i * 12}" y="111" width="2.5" height="11" rx="1" fill="#1d2338" opacity=".5"/>`);
    o.push(`</g>`);

    // ผนังด้านนอก (ปลาย)  — ไม่มี
    const xFace = (d: number) => (d < 0 ? CX - HB : CX + HB); // ผิวนอกสุด

    // ---- แอนิเมชันเฉพาะ cue ----
    if (cue === "plain") {
      // ความร้อนทะลุผนังชั้นเดียวออกไปอย่างรวดเร็ว (conduction) + อากาศอุ่นลอยพา (convection)
      for (let k = 0; k < 6; k++) {
        const d = k % 2 ? 1 : -1, y = 230 + Math.floor(k / 2) * 48;
        const u = (ph * 0.6 + k * 0.17) % 1;
        const org = CX + d * (6 + u * 52); // ต้นทางลูกศร
        const a = Math.sin(Math.PI * Math.min(1, u * 1.05));
        o.push(H.warrow(org, y, "#ff5a2a", a, d));
      }
      for (let k = 0; k < 8; k++) {
        const d = k % 2 ? 1 : -1;
        const u = (ph * 0.28 + k * 0.125) % 1;
        o.push(H.varrow(CX + d * (HB + 14 + (k % 3) * 6), 380 - u * 190, "#ff8a3a", 0.9 * Math.sin(Math.PI * u), -1));
      }
      o.push(pill(34, 186, "ผนังชั้นเดียว", "start", "#ffe1c9") + leader(74, 189, CX - HB + 1.5, 214));
      o.push(pill(252, 258, "ความร้อนผ่านผนัง", "end") + leader(206, 258, CX + HB - 2, 272));
      o.push(pill(252, 312, "อากาศอุ่นลอยพาความร้อน", "end") + leader(238, 309, CX + HB + 24, 300));
    }
    if (cue === "walls") {
      o.push(pill(72, 262, "ชั้นนอก", "end") + leader(72, 260, CX - HB + WT / 2, 276));
      o.push(pill(106, 262, "ชั้นใน", "start") + leader(106, 260, CX - HB + WT + gw + WT / 2 + 0.5, 290));
      if (g > 0.8) o.push(pill(72, 312, "ช่องว่าง", "end", "#dfe6ff") + leader(72, 310, gcl, 320));
    }
    if (cue === "vacuum") {
      // ความร้อนมาถึงผนังใน แต่ข้ามช่องไม่ได้
      for (let k = 0; k < 3; k++) {
        const y = 262 + k * 30;
        const u = (ph * 0.7 + k * 0.33) % 1;
        const org = 142 - u * 22;
        const a = air < 0.5 ? Math.sin(Math.PI * Math.min(1, u * 1.05)) : 0.3;
        o.push(H.warrow(org, y, "#ff5a2a", a, -1));
        if (air < 0.3) o.push(xmark(gcl, y, 0.85 + 0.15 * Math.sin(ph * 6 + k)));
      }
      if (air < 0.5) {
        o.push(pill(72, 252, "ว่างเปล่า", "end", "#dfe6ff") + leader(72, 250, gcl, 268));
        o.push(pill(101, 246, "ไม่มีอากาศ", "start", "#ffe1c9"));
        o.push(pill(101, 312, "ข้ามไม่ได้", "start", "#ffe1c9"));
      } else o.push(pill(101, 246, "ดูดอากาศ", "start", "#dfe6ff"));
    }
    if (cue === "shine") {
      // รังสีอินฟราเรดข้ามสุญญากาศได้ → ผิวเงาสะท้อนกลับ
      for (let k = 0; k < 3; k++) {
        const y = 262 + k * 28;
        const u = (ph * 0.55 + k * 0.31) % 1;
        const hitX = CX + HB - WT - 1; // ผิวเงาผนังนอก (ด้านใน)
        const startX = CX + HB - WT - gw - WT - 3;
        const going = u < 0.5;
        const q = going ? u / 0.5 : (u - 0.5) / 0.5;
        const tipx = going ? lerp(startX, hitX, q) : lerp(hitX, startX, q);
        const a = going ? 0.95 : 0.95 * (1 - q * 0.2);
        o.push(H.warrow(going ? tipx - 14 : tipx + 14, y, going ? "#ff5a2a" : "#ffb24a", a, going ? 1 : -1));
      }
      o.push(pill(168, 246, "รังสีความร้อน", "end", "#ffe1c9"));
      o.push(pill(168, 312, "สะท้อนกลับเข้าไป", "end") + leader(168, 309, CX + HB - WT - 2, 296));
      o.push(pill(198, 262, "ผิวเงา", "start", "#e9f4ff") + leader(198, 259, CX + HB - WT - 1, 270));
    }
    if (cue === "lid") {
      // ความร้อนที่ยังรั่วได้: ไต่ตามผนังไปที่ขอบคอ แล้วออกทางฝา
      o.push(`<polyline points="${pts(LEAK)}" fill="none" stroke="#ff7a3a" stroke-width="2.6" stroke-linejoin="round" opacity="${f2(0.35 * leak)}" filter="url(#bl)"/><polyline points="${pts(LEAKL)}" fill="none" stroke="#ff7a3a" stroke-width="2.6" stroke-linejoin="round" opacity="${f2(0.35 * leak)}" filter="url(#bl)"/>`);
      for (let i = 0; i < 12; i++) {
        const dd = (ph * 42 + (i * LEAK_L) / 12) % LEAK_L;
        const pt = along(LEAK, dd), pl = along(LEAKL, dd);
        const a = leak;
        o.push(`<circle cx="${f2(pt[0])}" cy="${f2(pt[1])}" r="2.4" fill="#ff4a1a" stroke="#fff" stroke-width=".7" opacity="${f2(a)}"/><circle cx="${f2(pl[0])}" cy="${f2(pl[1])}" r="2.4" fill="#ff4a1a" stroke="#fff" stroke-width=".7" opacity="${f2(a)}"/>`);
      }
      for (let k = 0; k < 3; k++) {
        const u = (ph * 0.6 + k * 0.33) % 1;
        o.push(H.varrow(CX - 12 + k * 12, 98 - u * 18, "#ff5a2a", leak * 0.9 * Math.sin(Math.PI * u), -1));
      }
      o.push(pill(96, 150, "ฝา", "end", "#ffe1c9"));
      o.push(pill(167, 150, "คอแคบ", "start", "#e9f4ff"));
      o.push(pill(72, 204, "ผนังมาต่อกัน", "start", "#ffe1c9") + leader(120, 200, CX - 16, 140));
      // ย้ำ: ถ้าฝาหลวม ลมพาความร้อนออกได้
      o.push(`<rect x="${CX - 42}" y="100" width="84" height="30" rx="8" fill="none" stroke="#ff5a2a" stroke-width="1.2" stroke-dasharray="3 2" opacity="${f2(leak * (0.5 + 0.4 * Math.sin(ph * 5)))}"/>`);
    }
    if (cue === "cold") {
      // ความร้อนจากข้างนอกพยายามเข้า แต่ถูกกั้น
      o.push(`<circle cx="30" cy="124" r="22" fill="url(#fsun)"/><circle cx="30" cy="124" r="9" fill="#ffd23a" stroke="#c98a00" stroke-width=".8"/>`);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + ph * 0.4; o.push(`<path d="M${f2(30 + Math.cos(a) * 12)} ${f2(124 + Math.sin(a) * 12)} L${f2(30 + Math.cos(a) * 17)} ${f2(124 + Math.sin(a) * 17)}" stroke="#ffb200" stroke-width="1.6" stroke-linecap="round"/>`); }
      for (let k = 0; k < 6; k++) {
        const d = k % 2 ? 1 : -1, y = 236 + Math.floor(k / 2) * 46;
        const u = (ph * 0.55 + k * 0.19) % 1;
        const face = xFace(d) - d * 1; // ผิวนอกกระติก
        const org = d < 0 ? lerp(face - 50, face - 24, u) : lerp(face + 50, face + 24, u);
        const a = Math.sin(Math.PI * Math.min(1, u * 1.05));
        o.push(H.warrow(org, y, "#ff9a2a", a, -d));
        if (u > 0.55) o.push(xmark(face + d * 3, y, 0.9));
      }
      o.push(pill(14, 160, "ความร้อนข้างนอก", "start", "#fff0c9"));
      o.push(pill(262, 316, "เข้าไม่ได้", "end", "#ffe1c9"));
      o.push(pill(CX, 190, "ข้างในยังเย็น", "middle", "#dff1ff"));
    }

    // ---- อุณหภูมิ (เทอร์โมมิเตอร์) ----
    if (cue === "plain" || cue === "cold") {
      const tx = cue === "plain" ? 28 : 14, ty0 = 214, ty1 = 372;
      o.push(`<rect x="${tx - 3.5}" y="${ty0}" width="7" height="${ty1 - ty0}" rx="3.5" fill="#fff" stroke="#2b3350" stroke-width="1"/>`);
      const lv = ty1 - (ty1 - ty0 - 6) * cl(tmp);
      o.push(`<rect x="${tx - 2}" y="${f2(lv)}" width="4" height="${f2(ty1 - lv + 4)}" rx="2" fill="${mixc("#d94b4b", "#2f8fe0", cd)}"/>`);
      o.push(`<circle cx="${tx}" cy="${ty1 + 6}" r="7" fill="${mixc("#d94b4b", "#2f8fe0", cd)}" stroke="#2b3350" stroke-width="1"/>`);
      o.push(txt(tx - 8, ty0 - 7, cue === "plain" ? "อุณหภูมิลดเร็ว" : "อุณหภูมิ", 5.4, "#46526b", "start"));
    }

    // ---- กล่องข้อมูลเสริม ----
    if (cue === "fact") {
      o.push(`<rect x="8" y="14" width="254" height="78" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.4" opacity=".97"/>`);
      // ขวดแก้วในห้องแล็บ
      o.push(`<g transform="translate(36 58)"><circle cx="0" cy="8" r="18" fill="#dff1ff" stroke="#2b3350" stroke-width="1.2"/><circle cx="0" cy="8" r="13" fill="#f3f8fc" stroke="#9aa4ba" stroke-width="1"/><circle cx="0" cy="8" r="13" fill="none" stroke="#ffffff" stroke-width="1.2" opacity=".9"/><rect x="-5" y="-20" width="10" height="12" fill="#dff1ff" stroke="#2b3350" stroke-width="1.2"/><rect x="-6.5" y="-23" width="13" height="4" rx="1.5" fill="#9aa4ba" stroke="#2b3350" stroke-width=".8"/><path d="M-9 4 q-1 6 4 9" stroke="#bfe9ff" stroke-width="2" fill="none"/></g>`);
      o.push(txt(160, 34, "ปี 1892", 11, "#b53a10", "middle", 900));
      o.push(txt(160, 50, "เจมส์ ดิวอร์ นักวิทยาศาสตร์ชาวสกอต", 6.2, "#2b3350"));
      o.push(txt(160, 63, "คิดขวดสุญญากาศไว้เก็บก๊าซเหลว", 6.2, "#2b3350"));
      o.push(txt(160, 77, "แต่เขาไม่ได้จดสิทธิบัตรไว้", 6.2, "#d94b4b"));
    }
    if (cue === "tip") {
      o.push(`<rect x="8" y="14" width="254" height="78" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.4" opacity=".97"/>`);
      const st2 = tipStage === 4;
      o.push(txt(135, 31, "อุ่นกระติกก่อนใส่เครื่องดื่ม", 7.4, "#b53a10", "middle", 900));
      o.push(`<rect x="16" y="40" width="112" height="40" rx="6" fill="${tipStage <= 3 ? "#ffe9cf" : "#f1f1f1"}" stroke="#2b3350" stroke-width=".9"/>`);
      o.push(`<rect x="142" y="40" width="112" height="40" rx="6" fill="${st2 ? "#ffe9cf" : "#f1f1f1"}" stroke="#2b3350" stroke-width=".9"/>`);
      o.push(txt(72, 56, "1 เทน้ำร้อนใส่", 6.6, "#2b3350") + txt(72, 70, "ทิ้งไว้สักพัก แล้วเทออก", 5.8, "#46526b"));
      o.push(txt(198, 56, "2 ใส่เครื่องดื่มร้อน", 6.6, "#2b3350") + txt(198, 70, "แล้วปิดฝาให้สนิท", 5.8, "#46526b"));
    }
    if (cue === "tip" && tipStage === 2) o.push(pill(CX, 190, "ผนังด้านในอุ่นขึ้น", "middle", "#ffe1c9"));
    if (cue === "tip" && tipStage === 4) o.push(pill(CX, 190, "ไม่เสียความร้อนให้ผนัง", "middle", "#fff6c9"));

    if (cue === "all" || cue === "end") o.push(pill(CX, 88, cue === "end" ? "ดูข้างในของใช้ ยังไงนะ" : "ข้างในกระติกน้ำสุญญากาศ", "middle", "#fff6c9"));
    o.push(box(SCENE_FLASK.focus[cue]?.box, ph));
    return o.join("");
  },
};
