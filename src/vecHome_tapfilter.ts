// ฉากอธิบาย: ที่กรองน้ำหัวก๊อก (faucet-mounted filter) แบบตัดครึ่ง — SVG พิกัด 270x480
// น้ำไหลลงจากหัวก๊อก → ชั้นดักตะกอน (ใยสังเคราะห์/เซรามิก) → ผงถ่านกัมมันต์ → เม็ด KDF → ปลายหัว
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, box, DEFS, room } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#2b3350", anchor = "middle", w = 700) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const vis = (s: string) => [...s].filter((c) => !/[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]/.test(c)).length;
const pill = (x: number, y: number, s: string, anchor: "start" | "end" | "middle" = "middle", fill = "#fff6c9") => {
  const w = vis(s) * 4.5 + 10;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "start" ? x : x - w;
  return `<rect x="${f2(x0)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".96"/>` +
    txt(x0 + w / 2, y + 0.4, s, 6.4, "#2b3350");
};
const leader = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)}" stroke="#2b3350" stroke-width=".9" stroke-dasharray="2 1.5" fill="none"/><circle cx="${f2(x2)}" cy="${f2(y2)}" r="1.6" fill="#2b3350"/>`;

// ---------- รูปทรงตัวกรอง ----------
const CX = 135;
const HX0 = 88, HX1 = 182; // ผนังนอกซ้าย/ขวา
const HT = 70, HB = 210;    // บน/ล่างของตัวกรอง
const WT = 3.5;
const IX0 = HX0 + WT, IX1 = HX1 - WT;
const SA: [number, number] = [86, 118];   // ชั้นดักตะกอน
const SB: [number, number] = [120, 172];  // ผงถ่าน
const SK: [number, number] = [174, 198];  // KDF
const PAD = 206;                          // ตะแกรงรองก้น
const NOZ_Y = HB + 14;                    // ปลายหัวจ่าย
const SINK_Y = 262;
const GRAN: Pt = [150, 140];              // เม็ดถ่านที่ขยายดู
const BUB: Pt = [224, 118];               // วงขยาย
const BR = 30;

const EXTRA = `<defs>
<linearGradient id="tglass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfeaf6" stop-opacity=".45"/><stop offset=".25" stop-color="#ffffff" stop-opacity=".18"/><stop offset=".7" stop-color="#cfe0f2" stop-opacity=".08"/><stop offset="1" stop-color="#9fb5d1" stop-opacity=".5"/></linearGradient>
<linearGradient id="tcap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3e4a72"/><stop offset=".3" stop-color="#7686b2"/><stop offset=".7" stop-color="#4c5a86"/><stop offset="1" stop-color="#2d3657"/></linearGradient>
<linearGradient id="tsink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6deeb"/><stop offset="1" stop-color="#8d9ab3"/></linearGradient>
<linearGradient id="tbrown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a4a22" stop-opacity=".9"/><stop offset="1" stop-color="#8a4a22" stop-opacity="0"/></linearGradient>
<linearGradient id="twater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fcaff"/><stop offset="1" stop-color="#cdeeff"/></linearGradient>
</defs>`;

// ---------- ชั้นกรอง (คำนวณครั้งเดียว) ----------
const fibreA = (() => {
  let s = "";
  for (let i = 0; i < 70; i++) {
    const x = IX0 + 2 + rnd(i) * (IX1 - IX0 - 4), y = SA[0] + 2 + rnd(i + 90) * (SA[1] - SA[0] - 4);
    const a = rnd(i + 40) * Math.PI, l = 5 + rnd(i + 7) * 7;
    s += `<path d="M${f2(x - Math.cos(a) * l / 2)} ${f2(y - Math.sin(a) * l / 2)} Q${f2(x + rnd(i + 3) * 3)} ${f2(y + rnd(i + 4) * 3)} ${f2(x + Math.cos(a) * l / 2)} ${f2(y + Math.sin(a) * l / 2)}" stroke="${i % 3 ? "#cdbf9d" : "#fffaf0"}" stroke-width="1.1" fill="none" opacity=".95"/>`;
  }
  return s;
})();
const granB = (() => {
  let s = "";
  const cols = ["#171a22", "#252a36", "#303646", "#1e222d"];
  for (let i = 0; i < 230; i++) {
    const x = IX0 + 2 + rnd(i + 200) * (IX1 - IX0 - 4), y = SB[0] + 2 + rnd(i + 400) * (SB[1] - SB[0] - 4), r = 2 + rnd(i + 600) * 1.6;
    s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${cols[i % 4]}"/>`;
    if (i % 3 === 0) s += `<circle cx="${f2(x - r * 0.3)}" cy="${f2(y - r * 0.35)}" r="${f2(r * 0.3)}" fill="#8b93a8" opacity=".55"/>`;
  }
  return s;
})();
const granK = (() => {
  let s = "";
  for (let i = 0; i < 120; i++) {
    const x = IX0 + 2 + rnd(i + 1200) * (IX1 - IX0 - 4), y = SK[0] + 2 + rnd(i + 1400) * (SK[1] - SK[0] - 4), r = 1.6 + rnd(i + 1600) * 1.2;
    s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${i % 2 ? "#c9834a" : "#aab4c2"}" stroke="#6b5036" stroke-width=".3"/>`;
  }
  return s;
})();
const mesh = (y: number) => {
  let s = `<rect x="${IX0}" y="${y}" width="${IX1 - IX0}" height="2.2" fill="#8d99b0"/>`;
  for (let x = IX0 + 2; x < IX1; x += 4) s += `<rect x="${x}" y="${y - 0.4}" width="1.3" height="3" fill="#59647e"/>`;
  return s;
};

// ---------- สถานะรายท่อน ----------
const PART_KINDS: Record<string, string[]> = {
  all: ["w", "r", "s", "c"], parts: ["w", "r", "c"], mech: ["r", "s", "w"], pore: ["r", "s", "w"], carbon: ["w", "c", "o"], area: ["w", "c"],
  contact: ["c", "w"], kdf: ["c", "w"], notall: ["w", "r", "c", "d", "m"], sat: ["c", "w"], bact: [], clog: ["r", "s", "w"],
  interval: ["w"], age: ["w", "r"], end: ["w"],
};

export const SCENE_TAPFILTER: SceneDef = {
  focus: {
    all: { cx: 135, cy: 172, z: 1.1 },
    parts: { cx: 135, cy: 172, z: 1.15 },
    mech: { cx: 135, cy: 104, z: 2.6, box: [IX0, SA[0], IX1 - IX0, SA[1] - SA[0]] },
    pore: { cx: 135, cy: 100, z: 3.6 },
    carbon: { cx: 175, cy: 145, z: 1.6, box: [IX0, SB[0], IX1 - IX0, SB[1] - SB[0]], label: "ผงถ่านกัมมันต์" },
    area: { cx: 175, cy: 145, z: 1.6, box: [IX0, SB[0], IX1 - IX0, SB[1] - SB[0]], label: "ผิวภายในเม็ดถ่าน" },
    contact: { cx: 175, cy: 145, z: 1.6, box: [IX0, SB[0], IX1 - IX0, SB[1] - SB[0]] },
    kdf: { cx: 175, cy: 170, z: 1.6, box: [IX0, SK[0], IX1 - IX0, SK[1] - SK[0]], label: "ชั้น KDF" },
    notall: { cx: 135, cy: 172, z: 1.15 },
    sat: { cx: 175, cy: 145, z: 1.6, box: [IX0, SB[0], IX1 - IX0, SB[1] - SB[0]], label: "ถ่านอิ่มตัว" },
    bact: { cx: 175, cy: 145, z: 1.6, box: [IX0, SB[0], IX1 - IX0, SB[1] - SB[0]], label: "ผิวถ่านในตลับ" },
    clog: { cx: 150, cy: 170, z: 1.1 },
    interval: { cx: 135, cy: 175, z: 1.0 },
    age: { cx: 135, cy: 175, z: 1.0 },
    end: { cx: 135, cy: 172, z: 1.1 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const e = ease(p);
    // ---- พารามิเตอร์ตาม cue ----
    let flow = 1, clog = 0.12, sat = 0, bio = 0, stagnant = false;
    if (cue === "mech") clog = lerp(0.1, 0.55, p);
    if (cue === "pore") clog = 0.1;
    if (cue === "notall") clog = 0.35;
    if (cue === "contact") flow = p < 0.5 ? 1.6 : 0.5;
    if (cue === "sat") { sat = e; clog = 0.3; }
    if (cue === "bact") { bio = ease(cl(p / 0.6)); stagnant = p < 0.62; clog = 0.4; sat = 0.7; }
    if (cue === "clog") { clog = lerp(0.1, 1, e); flow = lerp(1, 0.3, e); }
    if (cue === "age") { clog = lerp(0.05, 1, e); flow = lerp(1, 0.6, e); sat = 0.5 * e; }
    if (cue === "interval") clog = 0.2;
    const flowing = !stagnant;

    const o: string[] = [DEFS, EXTRA, room(330)];
    // ---- ซิงก์ ----
    o.push(`<rect x="-20" y="${SINK_Y}" width="310" height="70" fill="url(#tsink)"/><rect x="-20" y="${SINK_Y}" width="310" height="3" fill="#f2f6fb"/><ellipse cx="${CX}" cy="${SINK_Y + 22}" rx="22" ry="4" fill="#59647e"/><ellipse cx="${CX}" cy="${SINK_Y + 22}" rx="14" ry="2.4" fill="#2b3350"/>`);
    // ---- ก๊อกน้ำ ----
    o.push(`<rect x="-30" y="24" width="165" height="18" rx="4" fill="url(#metal)" stroke="#59647e" stroke-width=".9"/>`);
    o.push(`<rect x="-34" y="18" width="14" height="30" rx="3" fill="#8d99b0" stroke="#59647e" stroke-width=".8"/>`);
    o.push(`<path d="M121 24 H149 V54 H121 Z" fill="url(#metal)" stroke="#59647e" stroke-width=".9"/>`);
    // หัวเติมอากาศ (aerator) ที่ปลายก๊อก
    o.push(`<rect x="122" y="52" width="26" height="6" rx="1.5" fill="#aab5ca" stroke="#59647e" stroke-width=".7"/>`);
    for (let i = 0; i < 7; i++) o.push(`<rect x="${124 + i * 3.6}" y="53.4" width="1.4" height="3.2" fill="#59647e"/>`);
    // ตัวต่อเข้าหัวก๊อก
    o.push(`<path d="M114 58 H156 L160 72 H110 Z" fill="url(#tcap)" stroke="#232b4a" stroke-width=".9"/>`);

    // ---- น้ำภายในตัวกรอง ----
    const waterOn = flowing ? 1 : 0.35;
    o.push(`<clipPath id="tin"><rect x="${IX0}" y="${HT + 2}" width="${IX1 - IX0}" height="${HB - HT - 3}" rx="3"/></clipPath><g clip-path="url(#tin)">`);
    o.push(`<rect x="${IX0}" y="${HT + 2}" width="${IX1 - IX0}" height="${HB - HT}" fill="#bfe2fb"/>`);
    o.push(`<rect x="${IX0}" y="${HT + 2}" width="${IX1 - IX0}" height="${SA[0] - HT - 2}" fill="url(#twater)" opacity="${f2(0.9 * waterOn)}"/>`);
    // ชั้นดักตะกอน
    const poreMode = cue === "pore";
    if (!poreMode) {
      o.push(`<rect x="${IX0}" y="${SA[0]}" width="${IX1 - IX0}" height="${SA[1] - SA[0]}" fill="#f2e9d2"/>${fibreA}`);
    } else o.push(`<rect x="${IX0}" y="${SA[0]}" width="${IX1 - IX0}" height="${SA[1] - SA[0]}" fill="#dff1ff"/>`);
    // ตะกอนสะสมที่ชั้นแรก
    if (clog > 0.02) {
      const h = 5 + clog * 18;
      o.push(`<rect x="${IX0}" y="${SA[0]}" width="${IX1 - IX0}" height="${f2(h)}" fill="url(#tbrown)" opacity="${f2(Math.min(1, clog * 1.1))}"/>`);
      const nDeb = Math.floor(clog * 46);
      for (let i = 0; i < nDeb; i++) {
        const x = IX0 + 2 + rnd(i + 700) * (IX1 - IX0 - 4), y = SA[0] - 0.5 - rnd(i + 710) * (1 + clog * 4);
        o.push(`<rect x="${f2(x)}" y="${f2(y)}" width="${f2(1.6 + rnd(i + 720) * 1.6)}" height="${f2(1.4 + rnd(i + 730))}" fill="${i % 3 ? "#8a4524" : "#cfae6a"}" transform="rotate(${f2(rnd(i + 740) * 90)} ${f2(x)} ${f2(y)})"/>`);
      }
    }
    o.push(mesh(SA[1] - 1));
    // ผงถ่าน
    o.push(`<rect x="${IX0}" y="${SB[0]}" width="${IX1 - IX0}" height="${SB[1] - SB[0]}" fill="#1b1e28"/>${granB}`);
    if (sat > 0.02) o.push(`<rect x="${IX0}" y="${SB[0]}" width="${IX1 - IX0}" height="${SB[1] - SB[0]}" fill="#8b7a62" opacity="${f2(0.5 * sat)}"/>`);
    if (bio > 0.02) {
      for (let i = 0; i < Math.floor(bio * 30); i++) {
        o.push(`<ellipse cx="${f2(IX0 + 3 + rnd(i + 2000) * (IX1 - IX0 - 6))}" cy="${f2(SB[0] + 3 + rnd(i + 2100) * (SB[1] - SB[0] - 6))}" rx="2" ry="1.1" fill="#b27ad8" opacity=".85" transform="rotate(${f2(rnd(i + 2200) * 180)} ${f2(IX0 + 3 + rnd(i + 2000) * (IX1 - IX0 - 6))} ${f2(SB[0] + 3 + rnd(i + 2100) * (SB[1] - SB[0] - 6))})"/>`);
      }
    }
    o.push(mesh(SB[1] + 0.2));
    // KDF
    o.push(`<rect x="${IX0}" y="${SK[0]}" width="${IX1 - IX0}" height="${SK[1] - SK[0]}" fill="#5c4a3a"/>${granK}`);
    o.push(mesh(PAD - 2));
    o.push(`</g>`);

    // ---- ตัวถังใส + ฝาบนล่าง ----
    o.push(`<g filter="url(#sh)"><rect x="${HX0}" y="${HT}" width="${HX1 - HX0}" height="${HB - HT}" rx="7" fill="url(#tglass)" stroke="#59647e" stroke-width="1.1"/></g>`);
    o.push(`<rect x="${HX0 + 4}" y="${HT + 6}" width="3" height="${HB - HT - 14}" rx="1.5" fill="#fff" opacity=".6"/>`);
    o.push(`<path d="M${HX0 - 2} ${HT + 3} Q${HX0 - 2} ${HT - 3} ${HX0 + 6} ${HT - 3} H${HX1 - 6} Q${HX1 + 2} ${HT - 3} ${HX1 + 2} ${HT + 3} V${HT + 7} H${HX0 - 2} Z" fill="url(#tcap)" stroke="#232b4a" stroke-width=".9"/>`);
    o.push(`<path d="M${HX0 - 2} ${HB - 6} H${HX1 + 2} V${HB} Q${HX1 + 2} ${HB + 4} ${HX1 - 6} ${HB + 5} L${CX + 10} ${HB + 12} H${CX - 10} L${HX0 + 6} ${HB + 5} Q${HX0 - 2} ${HB + 4} ${HX0 - 2} ${HB} Z" fill="url(#tcap)" stroke="#232b4a" stroke-width=".9"/>`);
    o.push(`<rect x="${CX - 8}" y="${HB + 11}" width="16" height="${NOZ_Y - HB - 9}" rx="2" fill="#6677a3" stroke="#232b4a" stroke-width=".8"/>`);

    // ---- น้ำจากก๊อก + น้ำที่ไหลออก ----
    if (flowing) {
      const w1 = 7;
      o.push(`<rect x="${CX - w1 / 2}" y="58" width="${w1}" height="${HT - 58}" fill="#7fcaff" opacity=".8"/>`);
      const sw = Math.max(1.2, 6 * flow);
      o.push(`<rect x="${f2(CX - sw / 2)}" y="${NOZ_Y}" width="${f2(sw)}" height="${SINK_Y - NOZ_Y}" fill="#bfe6ff" stroke="#6ab8f0" stroke-width=".5" opacity=".92"/>`);
      o.push(`<ellipse cx="${CX}" cy="${SINK_Y + 1}" rx="${f2(6 + 7 * flow)}" ry="1.8" fill="#bfe6ff" opacity=".8"/>`);
      for (let i = 0; i < 4; i++) {
        const u = (ph * (0.9 + 0.6 * flow) + i * 0.25) % 1;
        o.push(`<circle cx="${f2(CX + Math.sin(i * 5 + ph * 6) * 1.2)}" cy="${f2(NOZ_Y + 2 + u * (SINK_Y - NOZ_Y - 4))}" r="${f2(0.9 + 0.5 * flow)}" fill="#fff" opacity=".85"/>`);
      }
    } else {
      o.push(`<rect x="${CX - 1}" y="${NOZ_Y}" width="2" height="5" fill="#bfe6ff" opacity=".6"/>`);
    }

    // ---- อนุภาคที่ไหลผ่านชั้นกรอง ----
    const kinds = PART_KINDS[cue] || ["w"];
    if (flowing && kinds.length) {
      const N = 22;
      const y0 = HT + 8, y1 = PAD - 3;
      for (let i = 0; i < N; i++) {
        const k = kinds[i % kinds.length];
        const lane = IX0 + 6 + ((i * 0.381) % 1) * (IX1 - IX0 - 12);
        const u = (ph * 0.32 * flow + i * 0.137) % 1;
        let y = lerp(y0, y1, u);
        let a = 1;
        const stopA = SA[0] + 3 + rnd(i + 30) * 8;
        const stopB = SB[0] + 6 + rnd(i + 31) * 26;
        if ((k === "r" || k === "s") && y > stopA) { y = stopA; a = cl(1 - (lerp(y0, y1, u) - stopA) / 8); }
        if ((k === "c" || k === "o") && sat < 0.55 && y > stopB) { a = cl(1 - (y - stopB) / 6); y = Math.min(y, stopB + 3); }
        if (a < 0.03) continue;
        if (y < HT + 6) continue;
        const x = lane + Math.sin(ph * 3 + i) * 0.8;
        if (k === "w") o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.3" fill="#3f9fe8" opacity=".85"/>`);
        else if (k === "r") o.push(`<path d="M${f2(x - 2.3)} ${f2(y + 1)} L${f2(x - 0.5)} ${f2(y - 2.2)} L${f2(x + 2.2)} ${f2(y - 0.6)} L${f2(x + 1.2)} ${f2(y + 1.8)} Z" fill="#a24e22" stroke="#5c2a10" stroke-width=".4" opacity="${f2(a)}"/>`);
        else if (k === "s") o.push(`<path d="M${f2(x - 1.6)} ${f2(y + 0.8)} L${f2(x)} ${f2(y - 1.8)} L${f2(x + 1.8)} ${f2(y + 0.6)} Z" fill="#d6b56c" stroke="#8a6c2a" stroke-width=".4" opacity="${f2(a)}"/>`);
        else if (k === "c") o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.9" fill="#4fcf6a" stroke="#1f8a3a" stroke-width=".5" opacity="${f2(a)}"/>`);
        else if (k === "o") o.push(`<path d="M${f2(x)} ${f2(y - 2.2)} L${f2(x + 2.1)} ${f2(y + 1.5)} L${f2(x - 2.1)} ${f2(y + 1.5)} Z" fill="#ff9a2a" stroke="#a85a00" stroke-width=".4" opacity="${f2(a)}"/>`);
        else if (k === "d") o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.1" fill="#fff" stroke="#2f8fe0" stroke-width=".8"/>`);
        else if (k === "m") o.push(`<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="2.4" ry="1.1" fill="#b27ad8" stroke="#6a3a96" stroke-width=".4" transform="rotate(${f2(40 + Math.sin(ph * 4 + i) * 30)} ${f2(x)} ${f2(y)})"/>`);
      }
    }

    // =============== ฉากเฉพาะ cue ===============
    // วงขยายเม็ดถ่าน/เม็ด KDF
    const bubbleCues = ["carbon", "area", "contact", "sat", "bact", "kdf"];
    const isK = cue === "kdf";
    const src: Pt = isK ? [150, 186] : GRAN;
    if (bubbleCues.includes(cue)) {
      const [bx, by] = isK ? [224, 143] : BUB;
      o.push(`<circle cx="${src[0]}" cy="${src[1]}" r="6.5" fill="none" stroke="#ffe14a" stroke-width="1.4"/>`);
      o.push(`<path d="M${src[0] + 6} ${src[1] - 3} L${bx - BR + 2} ${by + 8}" stroke="#ffe14a" stroke-width="1" stroke-dasharray="2 1.5"/>`);
      o.push(`<circle cx="${bx}" cy="${by}" r="${BR + 2}" fill="#fff" stroke="#2b3350" stroke-width="1.6"/>`);
      o.push(`<clipPath id="tbub"><circle cx="${bx}" cy="${by}" r="${BR}"/></clipPath><g clip-path="url(#tbub)"><rect x="${bx - BR}" y="${by - BR}" width="${BR * 2}" height="${BR * 2}" fill="#d6ecfb"/>`);
      const g = (px: number, py: number) => [bx + px, by + py] as Pt;
      // เม็ดถ่าน (ขยาย) — โพรงเป็นช่องมืดจากผิวเข้าไปข้างใน
      const gr = isK ? 15 : 17;
      const chan: { ang: number; len: number }[] = [];
      for (let c = 0; c < 7; c++) chan.push({ ang: (c / 7) * Math.PI * 2 + 0.4, len: 9 + rnd(c + 50) * 5 });
      let body = "";
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2, rr = gr + (rnd(a + 11) - 0.5) * 4;
        body += `${a ? "L" : "M"}${f2(bx + Math.cos(ang) * rr)} ${f2(by + Math.sin(ang) * rr)} `;
      }
      body += "Z";
      const bodyFill = isK ? "#c9834a" : mixc("#2f3544", "#8b7a62", sat);
      o.push(`<path d="${body}" fill="${bodyFill}" stroke="${isK ? "#6b5036" : "#12151c"}" stroke-width="1.4" stroke-linejoin="round"/>`);
      if (isK) {
        for (let i = 0; i < 9; i++) o.push(`<circle cx="${f2(bx + (rnd(i + 300) - 0.5) * 20)}" cy="${f2(by + (rnd(i + 310) - 0.5) * 20)}" r="${f2(2 + rnd(i + 320) * 2)}" fill="${i % 2 ? "#aab4c2" : "#e0a06a"}" stroke="#6b5036" stroke-width=".4"/>`);
      } else {
        for (const c of chan) {
          const x1 = bx + Math.cos(c.ang) * (gr + 1), y1 = by + Math.sin(c.ang) * (gr + 1);
          const x2 = bx + Math.cos(c.ang) * (gr - c.len), y2 = by + Math.sin(c.ang) * (gr - c.len);
          const mx = (x1 + x2) / 2 + Math.sin(c.ang * 3) * 3, my = (y1 + y2) / 2 + Math.cos(c.ang * 3) * 3;
          o.push(`<path d="M${f2(x1)} ${f2(y1)} Q${f2(mx)} ${f2(my)} ${f2(x2)} ${f2(y2)}" stroke="#d6ecfb" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="${f2(x2)}" cy="${f2(y2)}" r="2" fill="#d6ecfb"/>`);
        }
        o.push(`<ellipse cx="${f2(bx - 5)}" cy="${f2(by - 7)}" rx="4" ry="2" fill="#8b93a8" opacity=".4"/>`);
      }

      if (cue === "carbon") {
        // โมเลกุลมาเกาะที่ผิว/ในช่อง
        for (let i = 0; i < 12; i++) {
          const c = chan[i % 7];
          const stopR = gr - 3 - (rnd(i + 60) * (c.len - 3));
          const ex = bx + Math.cos(c.ang) * stopR, ey = by + Math.sin(c.ang) * stopR;
          const sx = bx + Math.cos(c.ang + 0.7) * 34, sy = by + Math.sin(c.ang + 0.7) * 34;
          const ta = 0.03 + rnd(i + 70) * 0.62;
          const t = ease(cl((p - ta) / 0.22));
          const px = lerp(sx, ex, t) + (t < 1 ? Math.sin(ph * 6 + i) * 1.2 : 0), py = lerp(sy, ey, t) + (t < 1 ? Math.cos(ph * 6 + i) * 1.2 : 0);
          if (t <= 0) continue;
          if (i % 2) o.push(`<circle cx="${f2(px)}" cy="${f2(py)}" r="2.1" fill="#4fcf6a" stroke="#1f8a3a" stroke-width=".5"/>`);
          else o.push(`<path d="M${f2(px)} ${f2(py - 2.5)} L${f2(px + 2.4)} ${f2(py + 1.8)} L${f2(px - 2.4)} ${f2(py + 1.8)} Z" fill="#ff9a2a" stroke="#a85a00" stroke-width=".4"/>`);
        }
      }
      if (cue === "area") {
        // เส้นผิวภายในค่อยๆ ถูกลากยาวขึ้น
        let d = "";
        let ax = bx - 20, ay = by - 18;
        d += `M${f2(ax)} ${f2(ay)}`;
        for (let i = 0; i < 40; i++) {
          const dir = i % 2 ? -1 : 1;
          ax += dir * (10 + rnd(i + 90) * 16) * (i % 4 < 2 ? 1 : 0.4); ay += (i % 2 ? 0 : 2.3);
          ax = cl(ax, bx - 22, bx + 22);
          d += ` L${f2(ax)} ${f2(ay)}`;
        }
        o.push(`<path d="${d}" fill="none" stroke="#ff7a3a" stroke-width="1.3" stroke-linejoin="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${f2(100 * (1 - ease(cl(p / 0.8))))}"/>`);
      }
      if (cue === "contact") {
        // ช่องแคบผ่านเม็ดถ่าน: เร็ว = หลุด, ช้า = ติด
        const fast = p < 0.5;
        for (let i = 0; i < 9; i++) {
          const yy = by - 16 + i * 4;
          const sp = fast ? 0.9 : 0.3;
          const u = (ph * sp + i * 0.21) % 1;
          const stick = fast ? i % 5 === 0 : i % 5 !== 0;
          const xs = lerp(bx - BR, bx + BR, u);
          const stopX = bx - 8 + (i % 3) * 7;
          const px = stick ? Math.min(xs, stopX + (i % 2) * 2) : xs;
          o.push(`<circle cx="${f2(px)}" cy="${f2(yy + Math.sin(ph * 5 + i) * 0.6)}" r="1.9" fill="#4fcf6a" stroke="#1f8a3a" stroke-width=".5"/>`);
        }
      }
      if (cue === "sat") {
        // ช่วงแรก: ติดเรื่อยๆ จนเต็ม  ช่วงหลัง: โมเลกุลลอยผ่านไป
        const nStuck = Math.floor(lerp(2, 20, cl(p / 0.6)));
        for (let i = 0; i < nStuck; i++) {
          const c = chan[i % 7];
          const rr = gr - 2 - (i % 3) * 3.2 - rnd(i + 5) * 2;
          const ang = c.ang + ((i % 3) - 1) * 0.16;
          const px = bx + Math.cos(ang) * rr, py = by + Math.sin(ang) * rr;
          if (i % 2) o.push(`<circle cx="${f2(px)}" cy="${f2(py)}" r="1.9" fill="#4fcf6a" stroke="#1f8a3a" stroke-width=".5"/>`);
          else o.push(`<path d="M${f2(px)} ${f2(py - 2.3)} L${f2(px + 2.2)} ${f2(py + 1.7)} L${f2(px - 2.2)} ${f2(py + 1.7)} Z" fill="#ff9a2a" stroke="#a85a00" stroke-width=".4"/>`);
        }
        if (p > 0.55) {
          for (let i = 0; i < 6; i++) {
            const u = (ph * 0.5 + i * 0.17) % 1;
            o.push(`<circle cx="${f2(lerp(bx - BR, bx + BR, u))}" cy="${f2(by - 24 + i * 9)}" r="1.9" fill="#4fcf6a" stroke="#1f8a3a" stroke-width=".5" opacity=".95"/>`);
          }
        }
      }
      if (cue === "bact") {
        const n = Math.floor(lerp(2, 26, bio) * (p > 0.64 ? lerp(1, 0.45, ease(cl((p - 0.64) / 0.3))) : 1));
        for (let i = 0; i < n; i++) {
          const ang = rnd(i + 120) * Math.PI * 2, rr = gr + 1.5 + rnd(i + 130) * 3;
          const px = bx + Math.cos(ang) * rr, py = by + Math.sin(ang) * rr;
          o.push(`<ellipse cx="${f2(px)}" cy="${f2(py)}" rx="2.7" ry="1.3" fill="#b27ad8" stroke="#6a3a96" stroke-width=".5" transform="rotate(${f2(ang * 57.3 + 90)} ${f2(px)} ${f2(py)})"/>`);
        }
      }
      if (cue === "kdf") {
        // Cl → Cl- : รับอิเล็กตรอนจากโลหะ
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + 0.3;
          const sx = bx + Math.cos(ang) * 31, sy = by + Math.sin(ang) * 31;
          const hx = bx + Math.cos(ang) * (gr + 3), hy = by + Math.sin(ang) * (gr + 3);
          const ta = 0.04 + i * 0.1;
          const t = ease(cl((p - ta) / 0.25));
          if (t <= 0) continue;
          if (t < 1) o.push(`<circle cx="${f2(lerp(sx, hx, t))}" cy="${f2(lerp(sy, hy, t))}" r="2.2" fill="#4fcf6a" stroke="#1f8a3a" stroke-width=".5"/>`);
          else {
            const t2 = ease(cl((p - ta - 0.25) / 0.3));
            const ox = hx + Math.cos(ang + 0.5) * 8 * t2, oy = hy + Math.sin(ang + 0.5) * 8 * t2;
            o.push(`<circle cx="${f2(ox)}" cy="${f2(oy)}" r="1.9" fill="#d8f5df" stroke="#4fcf6a" stroke-width=".8"/>` + txt(ox, oy + 0.9, "−", 3, "#1f8a3a", "middle", 900));
            o.push(`<circle cx="${f2(lerp(bx + Math.cos(ang) * gr, ox, 0.5))}" cy="${f2(lerp(by + Math.sin(ang) * gr, oy, 0.5))}" r="1" fill="#ffd23a" opacity="${f2(1 - t2)}"/>`);
          }
        }
      }
      o.push(`</g>`);
      // ป้ายประกอบวง
      if (cue === "carbon") o.push(pill(bx, by + BR + 12, "เกาะติดที่ผิวถ่าน", "middle", "#fff6c9"));
      if (cue === "area") {
        o.push(pill(bx, by + BR + 12, "ถ่าน 1 กรัม", "middle", "#fff6c9"));
        o.push(pill(258, 46, "ผิวรวม หลายร้อย–2,000 ตร.ม.", "end", "#fff6c9") + `<path d="M${bx} ${by - BR - 2} V52" stroke="#2b3350" stroke-width=".9" stroke-dasharray="2 1.5"/>`);
      }
      if (cue === "contact") {
        o.push(pill(bx, by + BR + 12, p < 0.5 ? "ไหลเร็ว: หลุดรอด" : "ไหลช้า: เกาะมากขึ้น", "middle", p < 0.5 ? "#ffe1c9" : "#dff6e3"));
        // ก๊อกเปิดแรง/เบา
        o.push(pill(258, 46, p < 0.5 ? "เปิดก๊อกแรง น้ำผ่านเร็ว" : "เปิดก๊อกเบา น้ำผ่านช้า", "end", p < 0.5 ? "#ffe1c9" : "#dff6e3"));
      }
      if (cue === "sat") {
        const bw = 50;
        o.push(`<rect x="${bx - bw / 2}" y="${by + BR + 5}" width="${bw}" height="7" rx="3.5" fill="#fff" stroke="#2b3350" stroke-width=".9"/><rect x="${bx - bw / 2 + 1}" y="${by + BR + 6}" width="${f2((bw - 2) * cl(p / 0.6))}" height="5" rx="2.5" fill="${p > 0.6 ? "#d94b4b" : "#ff9a2a"}"/>`);
        o.push(txt(bx, by + BR + 22, p > 0.6 ? "เต็มแล้ว ดูดซับเพิ่มไม่ได้" : "รูพรุนค่อยๆ เต็ม", 6, p > 0.6 ? "#b53a10" : "#2b3350", "middle", 800));
      }
      if (cue === "bact") {
        o.push(pill(bx, by + BR + 12, p < 0.62 ? "เชื้อเกาะเพิ่ม" : "จำนวนลดลง", "middle", p < 0.62 ? "#f0e2fb" : "#dff6e3"));
        o.push(pill(258, 46, p < 0.62 ? "ใช้เกินกำหนด / ค้างน้ำนาน" : "ปล่อยน้ำเย็นทิ้งก่อนใช้", "end", p < 0.62 ? "#ffe1c9" : "#dff6e3"));
        if (p >= 0.62) {
          for (let i = 0; i < 3; i++) {
            const u = (ph * 0.8 + i / 3) % 1;
            o.push(H.varrow(CX - 22 + i * 22, 78 + u * 30, "#3f9fe8", 0.9 * Math.sin(Math.PI * u), 1));
          }
        } else {
          o.push(pill(258, 60, "ไม่ได้ใช้นานเกิน 8 ชม.", "end", "#f0e2fb"));
        }
      }
      if (cue === "kdf") {
        o.push(pill(bx, by + BR + 12, "Cl  →  Cl⁻ (คลอไรด์)", "middle", "#fff6c9"));
        o.push(txt(bx, by + BR + 23, "ตามข้อมูลผู้ผลิต", 5.6, "#46526b", "middle", 600));
      }
    }

    if (cue === "all" || cue === "end") {
      o.push(pill(60, 86, "หัวก๊อก", "middle", "#fff6c9") + leader(80, 85, 112, 42));
      o.push(pill(216, 130, "ตลับกรอง", "middle", "#fff6c9") + leader(200, 130, HX1 + 1, 135));
      if (cue === "end") o.push(pill(CX, 12, "ดูข้างในของใช้ ยังไงนะ", "middle", "#fff6c9"));
      else o.push(pill(CX, 12, "ข้างในที่กรองน้ำหัวก๊อก", "middle", "#fff6c9"));
    }
    if (cue === "parts") {
      o.push(pill(60, 70, "น้ำเข้า", "middle", "#dff1ff") + leader(84, 68, 118, 64));
      o.push(pill(52, 112, "1 ดักตะกอน", "middle", "#f2e9d2") + leader(76, 110, IX0 + 3, 104));
      o.push(pill(218, 146, "2 ผงถ่าน", "middle", "#e1e4ee") + leader(194, 146, IX1 - 3, 146));
      o.push(pill(52, 186, "3 KDF (บางรุ่น)", "middle", "#ffe9d2") + leader(84, 184, IX0 + 3, 186));
      o.push(pill(216, 232, "น้ำออก", "middle", "#dff1ff") + leader(196, 230, CX + 9, NOZ_Y - 1));
      for (let i = 0; i < 3; i++) {
        const u = (ph * 0.5 + i / 3) % 1;
        o.push(H.varrow(HX1 + 12, 90 + u * 100, "#3f9fe8", 0.9 * Math.sin(Math.PI * u), 1));
      }
    }
    if (cue === "mech") {
      o.push(pill(CX, 66, "ใหญ่กว่ารู → ติดค้าง", "middle", "#ffe1c9"));
      o.push(pill(CX, 80, "เล็กกว่ารู → ผ่านได้", "middle", "#dff1ff"));
    }
    if (cue === "pore") {
      // ภาพตัดขวางเส้นใย: วงกลมเรียงเป็นแถว ช่องว่างระหว่างเส้นใยคือรู
      const sp = p < 0.4 ? 10 : p > 0.62 ? 7.4 : lerp(10, 7.4, ease((p - 0.4) / 0.22));
      const fr = 2.3; // รัศมีเส้นใย
      const gap = sp - fr * 2;
      const nCol = Math.ceil((IX1 - IX0) / sp) + 1;
      const x0 = CX - ((nCol - 1) * sp) / 2;
      const rows = [92, 92 + sp, 92 + 2 * sp];
      o.push(`<rect x="${IX0}" y="${HT + 2}" width="${IX1 - IX0}" height="${rows[2] + 6 - HT}" fill="#dff1ff" opacity=".6"/>`);
      for (const ry of rows) for (let k = 0; k < nCol; k++) {
        o.push(`<circle cx="${f2(x0 + k * sp)}" cy="${f2(ry)}" r="${fr}" fill="#fffaf0" stroke="#a7916b" stroke-width=".8"/>`);
      }
      // อนุภาค 3 ขนาด
      const sizes = [{ d: 6.8, c: "#a24e22", s: "#5c2a10" }, { d: 4.2, c: "#d6b56c", s: "#8a6c2a" }, { d: 1.6, c: "#fff", s: "#2f8fe0" }];
      for (let i = 0; i < 12; i++) {
        const sz = sizes[i % 3];
        const k = 1 + (i * 2) % (nCol - 2);
        const gx = x0 + (k + 0.5) * sp;
        const u = (ph * 0.42 + i * 0.173) % 1;
        const yTop = HT + 8, yBot = rows[2] + 18;
        let y = lerp(yTop, yBot, u);
        const stuckY = rows[0] - fr - sz.d / 2 - 0.4;
        const fits = sz.d < gap;
        let a = 1;
        if (!fits && y > stuckY) { y = stuckY; a = cl(1 - (lerp(yTop, yBot, u) - stuckY) / 10); }
        if (a < 0.03) continue;
        o.push(`<circle cx="${f2(gx)}" cy="${f2(y)}" r="${f2(sz.d / 2)}" fill="${sz.c}" stroke="${sz.s}" stroke-width=".5" opacity="${f2(a)}"/>`);
      }
      // ป้ายแสดงช่องรู
      const gx = x0 + 3.5 * sp;
      o.push(`<path d="M${f2(gx - sp / 2 + fr)} ${rows[0] - 6} H${f2(gx + sp / 2 - fr)}" stroke="#d94b4b" stroke-width="1" /><path d="M${f2(gx - sp / 2 + fr)} ${rows[0] - 8} v4 M${f2(gx + sp / 2 - fr)} ${rows[0] - 8} v4" stroke="#d94b4b" stroke-width="1"/>`);
      o.push(txt(gx, rows[0] - 10, "รู", 6.5, "#d94b4b", "middle", 900));
      o.push(pill(CX, 46, p < 0.5 ? "รู = ไมครอน" : "รูเล็กลง", "middle", "#fff6c9"));
      if (p < 0.5) o.push(pill(CX, 59, "1 ไมครอน = 1/1000 มม.", "middle", "#fff6c9"));
      else o.push(pill(CX, 59, "ดักละเอียดขึ้น", "middle", "#dff1ff"));
      if (p > 0.75) o.push(pill(CX, 73, "แต่ตันเร็วขึ้น", "middle", "#ffe1c9"));
    }
    if (cue === "notall") {
      const row = (y: number, label: string, fill: string, ok: boolean, icon: string) =>
        pill(21, y, label, "start", fill) + icon + o_check(vis(label) * 4.5 + 33, y, ok);
      o.push(row(98, "สนิม ตะกอน", "#f2e9d2", true, `<path d="M${f2(20)} 0" />`));
      o.push(row(128, "คลอรีน กลิ่นรส", "#dff6e3", true, ""));
      o.push(row(158, "สารละลายในน้ำ", "#dff1ff", false, ""));
      o.push(row(188, "จุลินทรีย์", "#f0e2fb", false, ""));
      o.push(`<g opacity="${f2(0.7 + 0.3 * Math.sin(ph * 4))}">` + pill(CX, 12, "อาจผ่านไปได้ ถ้าไม่ได้ระบุ", "middle", "#ffe1c9") + `</g>`);
      o.push(`<g transform="translate(214 192)"><rect x="-30" y="-14" width="60" height="30" rx="5" fill="#fffaf0" stroke="#2b3350" stroke-width="1"/>` + txt(0, -4, "ฉลากรับรอง", 6.2, "#2b3350", "middle", 800) + txt(0, 6, "ลดได้เฉพาะที่ระบุ", 5.4, "#b53a10", "middle", 700) + `</g>`);
    }
    if (cue === "clog") {
      // เกจแรงดันน้ำที่ปลายหัว
      const gx = 214, gy0 = 96, gy1 = 190;
      o.push(`<rect x="${gx - 5}" y="${gy0}" width="10" height="${gy1 - gy0}" rx="5" fill="#fff" stroke="#2b3350" stroke-width="1"/>`);
      const lv = gy1 - (gy1 - gy0 - 4) * flow;
      o.push(`<rect x="${gx - 3.2}" y="${f2(lv)}" width="6.4" height="${f2(gy1 - lv - 1.5)}" rx="3" fill="${mixc("#3f9fe8", "#d94b4b", 1 - flow)}"/>`);
      o.push(txt(gx, gy0 - 6, "แรงน้ำที่ปลายหัว", 5.8, "#2b3350", "middle", 800));
      o.push(pill(30, 94, "ตะกอนสะสม", "start", "#ffe1c9") + leader(80, 92, IX0 + 4, SA[0] + 1));
      if (p > 0.45) o.push(pill(270, 214, "รูตัน → น้ำผ่านลำบาก", "end", "#fff6c9"));
      if (p > 0.7) o.push(pill(270, 232, "ไหลช้าลง → ตรวจไส้กรอง", "end", "#ffe1c9"));
    }
    if (cue === "interval") {
      o.push(`<rect x="8" y="-52" width="254" height="78" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.4" opacity=".97"/>`);
      o.push(txt(CX, -39, "ช่วงเปลี่ยน ต่างกันตามรุ่น", 7.2, "#b53a10", "middle", 900));
      const bx0 = 22, bx1 = 248;
      o.push(`<rect x="${bx0}" y="-29" width="${bx1 - bx0}" height="9" rx="4.5" fill="#fff" stroke="#2b3350" stroke-width=".9"/>`);
      const fillp = ease(cl(p / 0.55));
      o.push(`<rect x="${bx0 + 1}" y="-28" width="${f2((bx1 - bx0 - 2) * fillp)}" height="7" rx="3.5" fill="#3f9fe8"/>`);
      for (let i = 1; i < 3; i++) o.push(`<path d="M${f2(bx0 + ((bx1 - bx0) * i) / 3)} -29 v9" stroke="#2b3350" stroke-width=".7"/>`);
      o.push(txt(bx0, -13, "ติดตั้ง", 5.6, "#46526b", "start", 600) + txt(bx1, -13, "ราว 3 เดือน หรือ ~100 แกลลอน (≈378 ลิตร)", 5.8, "#2b3350", "end", 800));
      if (p > 0.5) {
        const mk = bx0 + (bx1 - bx0) * 0.55;
        o.push(`<path d="M${f2(mk)} -31 v13" stroke="#d94b4b" stroke-width="1.6"/>`);
        o.push(txt(CX, 8, "น้ำขุ่น ตะกอนมาก → ถึงกำหนดเร็วกว่านี้", 6.4, "#b53a10", "middle", 800));
        o.push(txt(CX, 19, "ยึดคู่มือของรุ่นที่ใช้", 5.8, "#46526b", "middle", 600));
      } else o.push(txt(CX, 8, "ตัวอย่างจากคู่มือรุ่นหนึ่ง", 6.2, "#46526b", "middle", 600));
    }
    if (cue === "age") {
      o.push(`<rect x="8" y="-52" width="254" height="78" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.4" opacity=".97"/>`);
      const day = p < 0.5 ? Math.max(1, Math.round(1 + 89 * (p / 0.5))) : 0;
      const bx0 = 22, bx1 = 248, x90 = bx0 + (bx1 - bx0) * 0.5;
      o.push(`<rect x="${bx0}" y="-24" width="${bx1 - bx0}" height="9" rx="4.5" fill="#fff" stroke="#2b3350" stroke-width=".9"/>`);
      const mx = bx0 + (bx1 - bx0) * cl(p * 0.94) ;
      o.push(`<rect x="${bx0 + 1}" y="-23" width="${f2(Math.min(mx, x90) - bx0 - 1)}" height="7" rx="3.5" fill="#3f9fe8"/>`);
      if (mx > x90) o.push(`<rect x="${f2(x90)}" y="-23" width="${f2(mx - x90)}" height="7" fill="${mixc("#b27ad8", "#8a4524", 0.5)}" opacity=".85"/>`);
      o.push(`<path d="M${f2(x90)} -28 v18" stroke="#d94b4b" stroke-width="1.6"/>`);
      o.push(txt(x90, -31, "ครบกำหนด (ตามคู่มือรุ่นหนึ่ง)", 5.6, "#d94b4b", "middle", 800));
      o.push(`<circle cx="${f2(mx)}" cy="-19.5" r="4.2" fill="#ffe14a" stroke="#2b3350" stroke-width="1"/>`);
      o.push(txt(bx1, -4, "?", 8, "#b53a10", "end", 900));
      o.push(txt(bx0, -4, p < 0.5 ? `วันที่ ${day}` : "วันที่ 90...", 7.4, "#2b3350", "start", 900));
      if (p > 0.55) o.push(txt(CX, 14, "ไม่มีเสียงเตือน น้ำก็ยังไหลเงียบๆ", 6.4, "#46526b", "middle", 700));
      // สติกเกอร์วันที่บนตลับ
      if (p > 0.72) {
        o.push(`<g transform="translate(${CX} 152)"><rect x="-32" y="-9" width="64" height="19" rx="3" fill="#fffdf4" stroke="#2b3350" stroke-width=".9" transform="rotate(-2)"/>` + txt(-21, 1.5, "ติดตั้ง", 6, "#2b3350", "middle", 800) + `<path d="M-8 4.5 H28" stroke="#2b3350" stroke-width=".7" stroke-dasharray="1.5 1.5"/><rect x="${f2(-8 + ((ph * 14) % 32))}" y="-5" width="1" height="9" fill="#d94b4b" opacity="${f2(0.5 + 0.5 * Math.sin(ph * 8))}"/></g>`);
      }
    }
    if (cue === "sat" && p > 0.55) o.push(pill(258, 46, "สารเริ่มผ่านไปได้", "end", "#ffe1c9"));
    o.push(box(SCENE_TAPFILTER.focus[cue]?.box, ph));
    return o.join("");
  },
};

function o_check(x: number, y: number, ok: boolean) {
  return ok
    ? `<circle cx="${x}" cy="${y - 2}" r="4.2" fill="#e5f8e9" stroke="#1f8a3a" stroke-width="1"/><path d="M${x - 2} ${y - 2} l1.6 1.8 l2.8 -3.6" stroke="#1f8a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
    : `<circle cx="${x}" cy="${y - 2}" r="4.2" fill="#fff0d9" stroke="#d98a1a" stroke-width="1"/>` + txt(x, y + 0.2, "?", 6.4, "#b36b00", "middle", 900);
}
