// ฉากอธิบาย: โฟมล้างห้องน้ำ (ขวดสเปรย์หัวโฟม) — หัวฉีดดูดอากาศผสมกับน้ำยา + สารลดแรงตึงผิวยกคราบ — SVG พิกัด 270x480
// โลกแนวตั้งหลายโซน: S = ภาพตัดหัวฉีด, F = ฟิล์มฟอง, G = ยกคราบมัน, W = ผนังโถ (กล้องเลื่อนตามโซน)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, box } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#24445a", anchor = "middle", w = 700) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, fill = "#fff6c9") => {
  const w = s.length * 4.5 + 10;
  return `<rect x="${f2(x - w / 2)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#24445a" stroke-width=".8" opacity=".97"/>` + txt(x, y + 0.4, s, 6.4);
};
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));
const OUT = "#456b82";

const DEFS = `<defs>
<linearGradient id="fbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f6f1"/><stop offset="1" stop-color="#d6e8e4"/></linearGradient>
<linearGradient id="fliq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9f0dc"/><stop offset="1" stop-color="#7fd8bc"/></linearGradient>
<linearGradient id="fcer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6edf2"/><stop offset=".5" stop-color="#fbfdff"/><stop offset="1" stop-color="#dfe7ee"/></linearGradient>
<clipPath id="fbot"><rect x="16" y="330" width="78" height="114" rx="10"/></clipPath>
<clipPath id="ffl"><circle cx="190" cy="556" r="52"/></clipPath>
<clipPath id="fwall"><rect x="30" y="872" width="210" height="188" rx="6"/></clipPath>
</defs>`;

// สารลดแรงตึงผิว: หัวชอบน้ำ (วงน้ำเงิน) + หางชอบมัน (เส้นส้ม) ; a = ทิศที่หางชี้ (องศา, 0=ขวา)
const tad = (x: number, y: number, a: number, k = 1, hc = "#2f86d6") => {
  const r = (a * Math.PI) / 180, ex = Math.cos(r) * 4.6 * k, ey = Math.sin(r) * 4.6 * k;
  return `<path d="M${f2(x)} ${f2(y)} q${f2(ex * 0.5 - ey * 0.35)} ${f2(ey * 0.5 + ex * 0.35)} ${f2(ex)} ${f2(ey)}" stroke="#f0a43a" stroke-width="${f2(0.9 * k)}" fill="none" stroke-linecap="round"/><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(1.5 * k)}" fill="${hc}" stroke="#12466f" stroke-width=".3"/>`;
};
const bub = (x: number, y: number, r: number, a = 1) =>
  `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#fff" fill-opacity="${f2(0.55 * a)}" stroke="#86b9d8" stroke-width="${f2(Math.max(0.3, r * 0.1))}" stroke-opacity="${f2(a)}"/><circle cx="${f2(x - r * 0.3)}" cy="${f2(y - r * 0.3)}" r="${f2(r * 0.28)}" fill="#fff" opacity="${f2(0.9 * a)}"/>`;

// ---------- โซน S: หัวฉีด ----------
const NZ_Y = 272, MIX0 = 158, GRATE = 205;
const pumpWave = (ph: number, duty: number) => { const u = (ph / 2.4) % 1; return { sq: u < 0.38 ? sm(0, 0.3, u) * (u < 0.3 ? 1 : 1 - sm(0.3, 0.38, u) * 0 ) : 1 - sm(0.38, 0.6, u), spray: u < duty ? Math.sin((Math.PI * u) / duty) ** 0.6 : 0 }; };
const zoneS = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  const idle = cue === "bottle";
  const duty = cue === "air" || cue === "mesh" ? 0.8 : 0.55;
  const w = idle ? { sq: 0, spray: 0 } : pumpWave(ph, duty);
  const weak = cue === "chk";
  const spray = weak ? w.spray * 0.35 : w.spray;
  const sq = w.sq;
  // ขวด
  o.push(`<rect x="14" y="328" width="82" height="118" rx="12" fill="#f4fbff" fill-opacity=".7" stroke="${OUT}" stroke-width="2"/>`);
  const lvl = cue === "chk" ? lerp(430, 436, p) : 352;
  o.push(`<g clip-path="url(#fbot)"><rect x="14" y="${lvl}" width="82" height="100" fill="url(#fliq)"/>`);
  let wv = `M14 ${lvl}`; for (let x = 14; x <= 96; x += 4) wv += ` L${x} ${f2(lvl + Math.sin(x * 0.3 + ph * 2) * 1.2)}`; o.push(`<path d="${wv}" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/>`);
  for (let i = 0; i < 16; i++) { const x = 22 + rnd(i) * 66 + Math.sin(ph * 0.8 + i) * 3, y = lvl + 8 + rnd(i + 5) * (440 - lvl - 12) + Math.cos(ph * 0.7 + i) * 3; if (y > lvl + 3) o.push(tad(x, y, rnd(i + 9) * 360 + ph * 20, 1.1)); }
  o.push(`</g>`);
  o.push(`<path d="M34 328 V310 H76 V328" fill="#f4fbff" fill-opacity=".8" stroke="${OUT}" stroke-width="2"/>`);
  // ท่อดูด
  o.push(`<rect x="52.5" y="312" width="5" height="${f2(Math.max(8, lvl > 400 ? 438 : 436) - 312)}" rx="2" fill="#dde6ee" stroke="${OUT}" stroke-width="1"/>`);
  // ตัวปั๊ม + ลูกสูบ
  o.push(`<rect x="26" y="262" width="92" height="50" rx="8" fill="#e8eef5" stroke="${OUT}" stroke-width="2"/>`);
  o.push(`<rect x="46" y="278" width="22" height="30" rx="3" fill="#f7fbff" stroke="${OUT}" stroke-width="1"/>`);
  o.push(`<rect x="49" y="${f2(280 + 5 * sq)}" width="16" height="12" rx="2" fill="#b4c5d6" stroke="${OUT}" stroke-width="1"/><rect x="55" y="${f2(268 + 5 * sq)}" width="4" height="14" fill="#b4c5d6" stroke="${OUT}" stroke-width=".8"/>`);
  // ทางน้ำยาไปหัวฉีด
  o.push(`<path d="M57 292 V${NZ_Y + 1} H142" fill="none" stroke="${OUT}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M57 292 V${NZ_Y + 1} H142" fill="none" stroke="#c9e4f4" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`);
  // ไก
  o.push(`<g transform="rotate(${f2(-16 * sq)} 112 296)"><path d="M104 296 Q130 300 140 334 Q142 346 134 346 Q122 344 112 326 Z" fill="#d9e3ee" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/><path d="M118 306 L134 336" stroke="#fff" stroke-width="1.4" opacity=".7"/></g>`);
  o.push(`<circle cx="112" cy="296" r="3" fill="#8aa3b8" stroke="${OUT}" stroke-width="1"/>`);
  // หัวฉีด: ผนังบน-ล่าง มีช่องรับอากาศ
  o.push(`<rect x="118" y="244" width="136" height="56" rx="8" fill="#eef3f8" stroke="${OUT}" stroke-width="2"/>`);
  o.push(`<rect x="130" y="257" width="124" height="30" fill="#fbfeff"/>`);
  o.push(`<circle cx="142" cy="${NZ_Y}" r="11" fill="#d8ecf8" stroke="${OUT}" stroke-width="1.4"/>`);
  o.push(`<path d="M${MIX0 - 4} 262 V257 H${MIX0 + 120} V287 H${MIX0 - 4} V282" fill="none" stroke="${OUT}" stroke-width="1.4"/>`);
  o.push(`<path d="M${f2(147)} ${NZ_Y - 4} L${MIX0 - 3} ${NZ_Y - 1.6} V${NZ_Y + 1.6} L147 ${NZ_Y + 4}" fill="#f8fcff" stroke="${OUT}" stroke-width="1"/>`);
  // ช่องรับอากาศ (ตัดผนัง)
  for (const ax of [170, 190]) { o.push(`<rect x="${ax - 3.5}" y="244" width="7" height="14" fill="#fbfeff"/><rect x="${ax - 3.5}" y="286" width="7" height="15" fill="#fbfeff"/>`); o.push(`<path d="M${ax - 3.5} 244 V257 M${ax + 3.5} 244 V257 M${ax - 3.5} 287 V300 M${ax + 3.5} 287 V300" stroke="${OUT}" stroke-width="1.4"/>`); }
  // ตะแกรง
  for (let i = 0; i < 5; i++) o.push(`<rect x="${GRATE}" y="${f2(258.5 + i * 5.7)}" width="6" height="2.8" rx="1.2" fill="#8fa8bd" stroke="${OUT}" stroke-width=".6"/>`);
  // วงน้ำยาในท่อ
  for (let i = 0; i < 12; i++) {
    const u = ((ph * 0.55 + i / 12) % 1);
    let x: number, y: number;
    if (u < 0.3) { x = 57; y = lerp(436, 296, u / 0.3); } else if (u < 0.5) { x = lerp(57, 142, (u - 0.3) / 0.2); y = NZ_Y + 1; if (u < 0.31) y = 292; } else { const a = ((u - 0.5) / 0.5) * Math.PI * 4; x = 142 + Math.cos(a) * 8 * (1 - (u - 0.5)); y = NZ_Y + Math.sin(a) * 8 * (1 - (u - 0.5)); }
    const on = idle ? 0 : 0.35 + 0.65 * spray;
    if (on > 0.05 && !(u < 0.3 && y > lvl)) o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.5" fill="#2f86d6" opacity="${f2(on)}"/>`);
  }
  // อากาศเข้า
  if (spray > 0.05) for (const ax of [170, 190]) for (let j = 0; j < 2; j++) {
    const u = (ph * 1.1 + (ax === 170 ? 0 : 0.37) + j * 0.5) % 1;
    for (const sd of [-1, 1]) {
      const y = sd < 0 ? lerp(226, 266, u) : lerp(318, 278, u);
      o.push(`<g opacity="${f2(spray * (1 - Math.abs(u - 0.5) * 0.9))}"><path d="M${ax} ${f2(y + sd * 3)} V${f2(y - sd * 2)}" stroke="#56a0c8" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M${ax - 2.2} ${f2(y - sd * 0.6)} L${ax} ${f2(y - sd * 3.2)} L${ax + 2.2} ${f2(y - sd * 0.6)}" stroke="#56a0c8" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>`);
    }
  }
  // ละอองน้ำยา → ฟองใหญ่ → (ผ่านตะแกรง) → ฟองเล็ก
  const NP = 34;
  for (let i = 0; i < NP; i++) {
    const u = (ph * 0.7 + i / NP) % 1, sd = rnd(i + 3) * 2 - 1;
    let x = MIX0 + u * (GRATE - MIX0 - 2);
    const tri = (v: number) => Math.abs(((v % 2) + 2) % 2 - 1) * 2 - 1;
    const y = NZ_Y + tri(u * 2.2 + rnd(i) * 2) * Math.min(12, 2 + u * 22) * (0.6 + 0.4 * Math.abs(sd));
    const mix = sm(0.22, 0.7, u);
    const r = 1.1 + 3.6 * mix * (0.7 + 0.6 * rnd(i + 8));
    if (spray > 0.04) o.push(mix < 0.4 ? `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(1.3)}" fill="#2f86d6" opacity="${f2(spray)}"/>` : bub(x, y, r, spray));
  }
  for (let i = 0; i < 40; i++) {
    const u = (ph * 0.8 + i / 40) % 1, ang = (rnd(i + 20) - 0.5) * 0.9;
    const x = GRATE + 10 + u * 46, y = NZ_Y + Math.sin(ang) * u * 46 + u * u * 8;
    if (spray > 0.04) o.push(bub(x, y, 1.4 + 1.2 * rnd(i + 30) + u * 1.2, spray * (1 - sm(0.6, 1, u))));
  }
  return o.join("");
};

// ---------- โซน F: ฟิล์มฟอง ----------
const zoneF = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  o.push(`<rect x="12" y="478" width="246" height="156" rx="14" fill="#f5fbfa" stroke="#b9d3cf" stroke-width="1.2"/>`);
  // ฟองใหญ่
  for (const [bx, by, br] of [[62, 548, 38], [102, 590, 24], [54, 604, 16]] as number[][]) o.push(`<circle cx="${bx}" cy="${by}" r="${br}" fill="#e6f4ff" fill-opacity=".55" stroke="#86b9d8" stroke-width="1.6"/><circle cx="${bx - br * 0.35}" cy="${by - br * 0.35}" r="${br * 0.2}" fill="#fff" opacity=".9"/>`);
  o.push(`<path d="M${f2(62 + 38 * Math.cos(-0.4))} ${f2(548 + 38 * Math.sin(-0.4))} L${f2(150)} ${f2(520)} M${f2(62 + 38 * Math.cos(0.9))} ${f2(548 + 38 * Math.sin(0.9))} L${f2(150)} ${f2(592)}" stroke="#8a6a3b" stroke-width="1" stroke-dasharray="3 2" opacity=".6"/>`);
  // เลนส์ฟิล์ม
  o.push(`<circle cx="190" cy="556" r="54" fill="#8a6a3b" opacity=".3"/><circle cx="190" cy="556" r="52" fill="#fdfefe" stroke="#6b8c9c" stroke-width="2"/><g clip-path="url(#ffl)">`);
  const th = 20 - 6 * sm(0, 1, cue === "film" ? p : 0);
  o.push(`<rect x="130" y="${f2(556 - th / 2)}" width="120" height="${f2(th)}" fill="#bfe3f7" stroke="#6fb0d8" stroke-width=".6"/>`);
  for (let i = 0; i < 9; i++) {
    const x = 142 + i * 12.5, j = Math.sin(ph * 2 + i) * 0.8;
    o.push(tad(x, 556 - th / 2 + 0.2 + j, -90, 1.75) + tad(x + 6, 556 + th / 2 - 0.2 - j, 90, 1.75));
  }
  for (let i = 0; i < 8; i++) { const u = (ph * 0.15 + i / 8) % 1; o.push(`<circle cx="${f2(140 + ((i * 37 + ph * 4) % 100))}" cy="${f2(556 + Math.sin(i * 2 + ph) * (th / 2 - 4))}" r="1.1" fill="#3b8fd0" opacity=".55"/>`); void u; }
  o.push(`</g>`);
  o.push(txt(190, 520, "อากาศ", 5.6, "#456b82", "middle", 600) + txt(190, 598, "อากาศ", 5.6, "#456b82", "middle", 600) + txt(238, 556, "น้ำ", 5.6, "#1f5f9f", "end", 800));
  // คำอธิบายหัว/หาง
  o.push(tad(30, 506, 0, 2.2) + txt(46, 508, "หัวชอบน้ำ", 5.2, "#1f5f9f", "start", 700) + `<path d="M104 506 h12" stroke="#f0a43a" stroke-width="2" stroke-linecap="round"/>` + txt(120, 508, "หางหนีน้ำ (ชี้ออกอากาศ)", 5.2, "#b86f10", "start", 700));
  return o.join("");
};

// ---------- โซน G: ยกคราบมัน ----------
const zoneG = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  o.push(`<rect x="12" y="662" width="246" height="172" rx="14" fill="#e9f5fb" stroke="#b9d3cf" stroke-width="1.2"/>`);
  const k = cue === "lift" ? p : 0, kk = cue === "lift" ? 1 : 0;
  const bind = sm(0.1, 0.5, k), up = sm(0.55, 0.95, k);
  o.push(`<rect x="12" y="796" width="246" height="38" rx="8" fill="url(#fcer)" stroke="#9fb3c4" stroke-width="1.2"/>`);
  // คราบมัน
  const by = lerp(790, 748, up) + Math.sin(ph * 3) * up * 1.2, bx = 135 + up * Math.sin(ph) * 3;
  o.push(`<path d="M${bx - 30} ${f2(by + 4)} Q${bx - 28} ${f2(by - 18 * (1 - 0.3 * up))} ${f2(bx)} ${f2(by - 17)} Q${bx + 30} ${f2(by - 17)} ${bx + 30} ${f2(by + 4)} Q${bx} ${f2(by + 6 + 4 * (1 - up))} ${bx - 30} ${f2(by + 4)}Z" fill="#b57d36" stroke="#6a431a" stroke-width="1.4"/>`);
  o.push(`<ellipse cx="${f2(bx - 8)}" cy="${f2(by - 8)}" rx="9" ry="3.6" fill="#e0b573" opacity=".6"/>`);
  // สารลดแรงตึงผิว
  const N = 30;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + 0.2, rr = 31 + (i % 2) * 0.5;
    const tx = bx + Math.cos(a) * rr * 1.05, ty = by - 6 + Math.sin(a) * 21;
    if (ty > 794) continue; // ไม่ซ้อนพื้นเซรามิก
    const sx = 20 + rnd(i * 3) * 230 + Math.sin(ph * 0.9 + i) * 5, sy = 672 + rnd(i * 3 + 1) * 110 + Math.cos(ph * 0.8 + i) * 4;
    const e = bind * (kk ? 1 : 0.0) + (kk ? 0 : 0);
    const x = lerp(sx, tx, e), y = lerp(sy, ty, e);
    const dir = (Math.atan2(by - 6 - y, bx - x) * 180) / Math.PI; // หางชี้เข้าหาคราบ
    o.push(tad(x, y, e > 0.5 ? dir : rnd(i) * 360 + ph * 30, 1.5));
  }
  o.push(txt(135, 678, "คราบมันติดผิวเซรามิก", 6.4, "#456b82", "middle", 800));
  if (kk && up > 0.6) o.push(pill(135, 722, "คราบหลุดลอยไปกับน้ำ", "#d9f7de"));
  return o.join("");
};

// ---------- โซน W: ผนังโถ ----------
const clump = (x: number, y: number, s: number, i: number, a = 1) => {
  let o = "";
  for (let j = 0; j < 5; j++) o += bub(x + (rnd(i * 7 + j) - 0.5) * 10 * s, y + (rnd(i * 7 + j + 3) - 0.5) * 8 * s, (2.6 + rnd(i * 7 + j + 6) * 3.2) * s, a);
  return o;
};
const zoneW = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  o.push(`<rect x="12" y="850" width="246" height="220" rx="14" fill="#f2f8f7" stroke="#b9d3cf" stroke-width="1.2"/>`);
  o.push(`<g clip-path="url(#fwall)"><rect x="30" y="872" width="210" height="188" fill="url(#fcer)"/>`);
  for (let i = 1; i < 4; i++) o.push(`<path d="M30 ${872 + i * 47} H240" stroke="#c7d3dd" stroke-width=".8"/>`);
  o.push(`<path d="M135 872 V1060" stroke="#c7d3dd" stroke-width=".8"/>`);
  const showSplit = cue === "cling";
  const front = cue === "rinse" ? 872 + 200 * ease(cl(p / 0.9)) : -1;
  const specAlpha = cue === "wait" ? 1 - sm(0.1, 0.9, p) : cue === "but" || cue === "rinse" ? 0 : 1;
  // หินปูน (ตอน but / rinse)
  const crust = cue === "but" || cue === "rinse";
  if (crust) for (let i = 0; i < 6; i++) { const x = 62 + i * 28 + (rnd(i) - 0.5) * 8, y = 1020 + (rnd(i + 3) - 0.5) * 12; const sh = cue === "but" ? 1 - 0.22 * Math.abs(Math.sin(ph * 5 + i)) * sm(0.3, 0.9, p) : 1; o.push(`<path d="M${f2(x - 11)} ${f2(y + 7)} L${f2(x - 8)} ${f2(y - 5 * sh)} L${f2(x - 2)} ${f2(y - 9 * sh)} L${f2(x + 5)} ${f2(y - 4 * sh)} L${f2(x + 11)} ${f2(y + 7)}Z" fill="#cfc6b3" stroke="#8f8571" stroke-width="1"/>`); }
  // น้ำยาทั่วไปไหลลง (ซ้าย)
  if (showSplit) {
    for (let i = 0; i < 6; i++) {
      const x = 44 + i * 16, sp = 38 + rnd(i) * 30, y = 876 + ((ph * sp + rnd(i + 5) * 180) % 180);
      o.push(`<path d="M${x} ${f2(Math.max(872, y - 40))} V${f2(y)}" stroke="#7fc3e8" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M${x} ${f2(y + 4)} q-3 -5 0 -10 q3 5 0 10z" fill="#3b9bd8"/>`);
    }
    o.push(`<rect x="30" y="872" width="105" height="188" fill="#9fd6f0" opacity=".12"/>`);
  }
  // โฟมเกาะผนัง
  const fx0 = showSplit ? 142 : 36, fx1 = 234;
  const cnt = cue === "chk" ? 0 : 36;
  for (let i = 0; i < cnt; i++) {
    const x = fx0 + rnd(i * 2) * (fx1 - fx0), y0 = 880 + rnd(i * 2 + 1) * 170;
    const creep = cue === "cling" ? (ph * 1.2 + rnd(i) * 3) % 3 : cue === "wait" ? p * 3 : 0;
    const y = y0 + creep;
    if (front > 0 && y < front + 6) continue;
    o.push(clump(x, y, 1.05, i, 0.95));
    if (specAlpha > 0.02 && i % 3 === 0) o.push(`<circle cx="${f2(x + 1)}" cy="${f2(y + 2)}" r="1.5" fill="#7a5320" opacity="${f2(0.85 * specAlpha)}"/>`);
  }
  // น้ำชะ
  if (front > 0) {
    o.push(`<rect x="30" y="872" width="210" height="${f2(Math.max(0, front - 872))}" fill="#bfe6fb" opacity=".35"/>`);
    for (let i = 0; i < 18; i++) { const x = 36 + i * 11.5 + Math.sin(ph * 4 + i) * 2; o.push(`<path d="M${f2(x)} ${f2(front - 18 - rnd(i) * 10)} V${f2(front + 2)}" stroke="#4aa8ea" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`); }
    for (let i = 0; i < 14; i++) o.push(bub(40 + rnd(i + 40) * 190, front + 4 + rnd(i + 50) * 14, 2 + rnd(i) * 2.2, 0.9));
  }
  o.push(`</g>`);
  // แปรง (but)
  if (cue === "but") {
    const bx = 135 + Math.sin(ph * 5) * 50 * sm(0.25, 0.4, p);
    o.push(`<g transform="translate(${f2(bx)} 1000) rotate(-20)"><rect x="-6" y="-14" width="12" height="26" rx="3" fill="#e8943a" stroke="#8a4a10" stroke-width="1"/><rect x="-8" y="12" width="16" height="9" rx="2" fill="#6a8fbf" stroke="#2b3f66" stroke-width="1"/><path d="M-6 21 v4 M-3 21 v5 M0 21 v4 M3 21 v5 M6 21 v4" stroke="#2b3f66" stroke-width="1.2"/></g>`);
  }
  if (cue === "wait") {
    const cx = 215, cy = 892, r = 11;
    o.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fffdf4" stroke="#24445a" stroke-width="1.4"/><path d="M${cx} ${cy} L${f2(cx + Math.sin(p * 6.28) * 8)} ${f2(cy - Math.cos(p * 6.28) * 8)}" stroke="#d94b4b" stroke-width="1.6" stroke-linecap="round"/><path d="M${cx} ${cy - r + 2} v2" stroke="#24445a" stroke-width="1"/>`);
  }
  if (cue === "cling") { o.push(pill(88, 864, "น้ำยาทั่วไป ไหลลงเร็ว", "#e3f1fb")); o.push(pill(188, 864, "โฟม เกาะค้าง", "#fff6c9")); }
  if (cue === "wait") o.push(pill(135, 864, "คราบค่อยๆ หลุด ไม่ต้องขัด"));
  if (cue === "but") o.push(pill(135, 864, p < 0.35 ? "คราบหินปูนแข็ง ยังอยู่" : "ต้องใช้แปรงช่วย", "#ffe1c9"));
  if (cue === "rinse") o.push(pill(135, 864, "น้ำพาโฟมและคราบไปหมด", "#d9f7de"));
  return o.join("");
};

export const SCENE_TOILETFOAM: SceneDef = {
  focus: {
    all: { cx: 135, cy: 345, z: 1.1 },
    bottle: { cx: 58, cy: 375, z: 2.3, box: [12, 326, 86, 122], label: "น้ำยา (ของเหลว)" },
    pump: { cx: 92, cy: 308, z: 2.0, box: [24, 260, 96, 52], label: "ปั๊มดันน้ำยา" },
    air: { cx: 184, cy: 272, z: 3.4, box: [156, 256, 50, 32], label: "ห้องผสมอากาศ" },
    mesh: { cx: 212, cy: 272, z: 3.8, box: [203, 256, 10, 32], label: "ตะแกรง" },
    film: { cx: 172, cy: 556, z: 1.9 },
    cling: { cx: 135, cy: 960, z: 1.5 },
    lift: { cx: 135, cy: 748, z: 2.0 },
    wait: { cx: 135, cy: 960, z: 1.5 },
    but: { cx: 135, cy: 966, z: 1.6 },
    rinse: { cx: 135, cy: 960, z: 1.5 },
    chk: { cx: 75, cy: 365, z: 1.7 },
    end: { cx: 135, cy: 352, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const o: string[] = [DEFS, `<rect x="-300" y="-300" width="900" height="1700" fill="url(#fbg)"/>`];
    // ลำดับโซนตามบท: สลับตำแหน่งเพื่อให้กล้องเลื่อนสั้น (G อยู่ถัดจาก F)
    o.push(zoneS(cue, p, ph), zoneF(cue, p, ph), zoneG(cue, p, ph), zoneW(cue, p, ph));
    const F = SCENE_TOILETFOAM.focus[cue] || SCENE_TOILETFOAM.focus.all;
    const hud = (s: string, fill = "#fff6c9") => { const y = F.cy - 200 / F.z; o.push(`<g transform="translate(${F.cx} ${f2(y)}) scale(${f2(1.6 / F.z)}) translate(${-F.cx} ${f2(-y)})">${pill(F.cx, y, s, fill)}</g>`); };
    if (cue === "all") hud("ขวดสเปรย์หัวโฟม");
    if (cue === "end") hud("ดูข้างในของใช้ ยังไงนะ");
    if (cue === "bottle") hud("ในขวด ยังไม่มีฟองเลย");
    if (cue === "pump") hud("บีบไก → ดันน้ำยาขึ้นท่อ");
    if (cue === "air") hud("ลมถูกดูดเข้าช่องข้าง ผสมกับละออง");
    if (cue === "mesh") hud("ผ่านตะแกรง → ฟองเล็กละเอียด");
    if (cue === "film") hud("ฟิล์มน้ำบางๆ ล้อมฟองอากาศ");
    if (cue === "lift") hud(p > 0.6 ? "หางจับคราบ หัวหันหาน้ำ" : "สารลดแรงตึงผิวเข้าหาคราบมัน");
    if (cue === "chk") hud(p > 0.4 ? "มีแต่ลม ฟองบาง → ใกล้หมด" : "ฟองเริ่มบางลง", p > 0.4 ? "#ffd9d0" : "#fff6c9");
    o.push(box(SCENE_TOILETFOAM.focus[cue]?.box, ph));
    return o.join("");
  },
};
