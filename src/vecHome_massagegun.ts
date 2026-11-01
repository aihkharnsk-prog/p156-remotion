// ฉากอธิบาย: ปืนนวด — มอเตอร์หมุนวงกลม → แขนเยื้องศูนย์(แคร้งก์) → ก้านเชื่อม → แกนหัวนวดขึ้นลง (slider-crank จริง) — SVG พิกัด 270x480
// เน้นแอนิเมชัน: จลนศาสตร์คำนวณจริงทุกเฟรม, กราฟความสูงหัวตามมุมหมุน, รอยบุ๋มบนกล้ามเนื้อ, แบตเตอรี่เสื่อม
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, room, DEFS: HDEFS } = H;
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

const EXTRA = `<defs>
<linearGradient id="mghs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a3a8f"/><stop offset=".3" stop-color="#8b78ec"/><stop offset=".75" stop-color="#5d49c2"/><stop offset="1" stop-color="#34286c"/></linearGradient>
<linearGradient id="mgin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3350"/><stop offset="1" stop-color="#1a2038"/></linearGradient>
<linearGradient id="mgmu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b3a0"/><stop offset="1" stop-color="#d9826f"/></linearGradient>
<linearGradient id="mgmt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8794ad"/><stop offset=".35" stop-color="#e6ebf4"/><stop offset=".7" stop-color="#aab4c9"/><stop offset="1" stop-color="#6c7893"/></linearGradient>
<linearGradient id="mgbt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6bf29a"/><stop offset="1" stop-color="#1fb85a"/></linearGradient>
</defs>`;

// ---- จลนศาสตร์ slider-crank ----
const CX = 120, CY = 118, LROD = 44, HOFF = 62, MUSC = 244;
const kin = (th: number, r: number) => {
  const px = CX + r * Math.cos(th), py = CY + r * Math.sin(th);
  const ys = CY + r * Math.sin(th) + Math.sqrt(LROD * LROD - (r * Math.cos(th)) ** 2);
  return { px, py, ys, yh: ys + HOFF };
};

type St = { spd: number; r: number; press: number; head: number; soc: number; cap: number; dim: number; hl: string };
const defSt: St = { spd: 0.9, r: 12, press: 0, head: 0, soc: 0.8, cap: 1, dim: 0, hl: "" };

const headShape = (type: number, y: number) => {
  if (type === 1) return `<rect x="${CX - 17}" y="${f2(y - 5)}" width="34" height="10" rx="3" fill="#cfd6e3" stroke="#2b3350" stroke-width="1"/>`; // แบน
  if (type === 2) return `<path d="M${CX - 6} ${f2(y - 9)} H${CX + 6} L${CX + 1.5} ${f2(y + 10)} H${CX - 1.5} Z" fill="#cfd6e3" stroke="#2b3350" stroke-width="1"/>`; // แหลม
  return `<circle cx="${CX}" cy="${f2(y)}" r="13" fill="#e9edf5" stroke="#2b3350" stroke-width="1"/><circle cx="${CX - 4}" cy="${f2(y - 4)}" r="4" fill="#fff" opacity=".7"/>`; // กลม
};
const headBottom = (type: number) => (type === 1 ? 5 : type === 2 ? 10 : 13);

const gun = (th: number, st: St, ph: number, cue: string, p: number): string => {
  const o: string[] = [];
  const k = kin(th, st.r);
  const oy = st.press * 4;
  const hb = headBottom(st.head);
  const dent = Math.max(0, k.yh + oy + hb - MUSC) * (st.head === 2 ? 1.4 : 1) + st.press * 5;
  const yh = k.yh + oy;
  // กล้ามเนื้อ
  const d = dent;
  o.push(`<path d="M52 262 Q52 ${MUSC} 70 ${MUSC} H${CX - 30} Q${CX} ${f2(MUSC + 2 * d)} ${CX + 30} ${MUSC} H190 Q208 ${MUSC} 208 262 V296 Q208 314 190 314 H70 Q52 314 52 296 Z" fill="url(#mgmu)" stroke="#a3584a" stroke-width="1.2"/>`);
  for (let i = 0; i < 6; i++) o.push(`<path d="M${60 + i * 24} 256 q8 24 0 50" stroke="#c46f5f" stroke-width=".9" fill="none" opacity=".55"/>`);
  o.push(`<rect x="86" y="300" width="98" height="8" rx="4" fill="#f5efe0" stroke="#cbbd9a" stroke-width=".8"/>`);
  // วงคลื่นกระทบกล้ามเนื้อ
  const rev = th / (Math.PI * 2);
  const u = rev - Math.floor(rev);
  if (dent > 0.5) for (let j = 0; j < 2; j++) {
    const uu = (u + j * 0.5) % 1;
    o.push(`<ellipse cx="${CX}" cy="${f2(MUSC + dent)}" rx="${f2(8 + uu * 40)}" ry="${f2(4 + uu * 24)}" fill="none" stroke="#fff" stroke-width="1.4" opacity="${f2((1 - uu) * 0.7 * cl(dent / 8))}"/>`);
  }
  o.push(`<g transform="translate(0 ${f2(oy * 0.5)})">`);
  // ตัวเรือน
  o.push(`<path d="M30 70 Q30 54 46 54 H190 Q206 54 206 70 V190 Q206 206 190 206 H${CX + 18} V218 H${CX - 18} V206 H46 Q30 206 30 190 Z" fill="url(#mghs)" stroke="#2a1f5c" stroke-width="1.6"/>`);
  o.push(`<path d="M38 70 Q38 62 46 62 H190 Q198 62 198 70 V190 Q198 198 190 198 H${CX + 12} V206 H${CX - 12} V198 H46 Q38 198 38 190 Z" fill="url(#mgin)"/>`);
  // มอเตอร์
  const mot = cue === "motor" || cue === "but" ? 1 : 0;
  o.push(`<rect x="44" y="98" width="52" height="40" rx="6" fill="#4a5470" stroke="#10162c" stroke-width="1.2"/>`);
  for (let i = 0; i < 4; i++) o.push(`<rect x="${50 + i * 11}" y="102" width="5" height="32" rx="2" fill="#2f3a63"/>`);
  const ro = th * 1.0;
  o.push(`<circle cx="70" cy="118" r="13" fill="#2b3350" stroke="#9fb0e8" stroke-width=".9"/>`);
  for (let i = 0; i < 3; i++) { const a = ro + (i * Math.PI * 2) / 3; o.push(`<path d="M70 118 L${f2(70 + Math.cos(a) * 12)} ${f2(118 + Math.sin(a) * 12)}" stroke="#ffd14a" stroke-width="2.4" stroke-linecap="round"/>`); }
  o.push(txt(70, 144, "มอเตอร์", 5.6, "#bfe9ff", "middle", 700));
  // เพลา → จานแคร้งก์
  o.push(`<rect x="96" y="114" width="${CX - 96}" height="8" fill="#9aa6bd" stroke="#2b3350" stroke-width=".8"/>`);
  o.push(`<circle cx="${CX}" cy="${CY}" r="${f2(st.r + 9)}" fill="url(#mgmt)" stroke="#2b3350" stroke-width="1.2"/>`);
  // รอยทางของจุดยึด
  o.push(`<circle cx="${CX}" cy="${CY}" r="${f2(st.r)}" fill="none" stroke="#ff8a3d" stroke-width=".9" stroke-dasharray="2.5 2" opacity="${cue === "crank" || cue === "motor" || cue === "amp" || cue === "but" ? 1 : 0.4}"/>`);
  o.push(`<circle cx="${CX}" cy="${CY}" r="3.2" fill="#2b3350"/>`);
  // รางนำ
  o.push(`<rect x="${CX - 8}" y="146" width="16" height="62" rx="3" fill="#2a3050" stroke="#9fb0e8" stroke-width=".8" opacity=".9"/><rect x="${CX - 5}" y="148" width="10" height="58" fill="#12182e"/>`);
  // ก้านเชื่อม
  const rodCol = cue === "rod" ? "#ffd14a" : "#e4e9f2";
  o.push(`<path d="M${f2(k.px)} ${f2(k.py)} L${CX} ${f2(k.ys)}" stroke="#2b3350" stroke-width="7" stroke-linecap="round"/><path d="M${f2(k.px)} ${f2(k.py)} L${CX} ${f2(k.ys)}" stroke="${rodCol}" stroke-width="4.6" stroke-linecap="round"/>`);
  o.push(`<circle cx="${f2(k.px)}" cy="${f2(k.py)}" r="4.4" fill="#ff5a4a" stroke="#fff" stroke-width="1.2"/><circle cx="${CX}" cy="${f2(k.ys)}" r="3.4" fill="#cfd6e3" stroke="#2b3350" stroke-width="1"/>`);
  // แกนหัวนวด (สไลเดอร์)
  o.push(`<rect x="${CX - 4}" y="${f2(k.ys)}" width="8" height="${f2(yh - k.ys)}" fill="url(#mgmt)" stroke="#2b3350" stroke-width=".8"/>`);
  o.push(`<rect x="${CX - 7}" y="${f2(k.ys - 3)}" width="14" height="7" rx="2" fill="#e6ebf4" stroke="#2b3350" stroke-width=".9"/>`);
  o.push(`</g>`);
  // ปากกล้องบังแกน + หัว
  o.push(headShape(st.head, yh));
  // แบตเตอรี่
  const bt = cue === "batt" || cue === "age";
  o.push(`<g transform="translate(0 ${f2(oy * 0.5)})"><rect x="150" y="70" width="42" height="116" rx="6" fill="#26324d" stroke="#6bf29a" stroke-width="1.2"/>`);
  o.push(`<rect x="156" y="78" width="30" height="100" rx="3" fill="#0f1730"/>`);
  const fh = 96 * st.soc;
  o.push(`<rect x="158" y="${f2(176 - fh)}" width="26" height="${f2(fh)}" rx="2" fill="url(#mgbt)"/>`);
  if (st.cap < 0.999) o.push(`<rect x="158" y="${f2(80)}" width="26" height="${f2(96 * (1 - st.cap))}" rx="2" fill="#ff8a7a" opacity=".4"/><rect x="158" y="80" width="26" height="96" rx="2" fill="none" stroke="#ff8a7a" stroke-width=".8" stroke-dasharray="2 2"/>`);
  o.push(`<rect x="164" y="64" width="14" height="6" rx="2" fill="#cfd6e3"/>`);
  o.push(txt(171, 196, "แบตเตอรี่", 5.6, "#bfe9ff", "middle", 700));
  // สายไฟจากแบต → มอเตอร์
  o.push(`<path d="M150 90 H84 V98" stroke="#e2c36a" stroke-width="2" fill="none"/>`);
  const nrg = 5;
  for (let i = 0; i < nrg; i++) { const uu = (ph * (0.5 + 0.5 * st.spd) + i / nrg) % 1; const q = uu < 0.8 ? [150 - (uu / 0.8) * 66, 90] : [84, 90 + ((uu - 0.8) / 0.2) * 8]; o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="1.7" fill="#fff8d6"/><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="3.6" fill="#ffd14a" opacity=".3"/>`); }
  o.push(`</g>`);
  return o.join("");
};

// ---- กราฟความสูงหัวตามเวลา ----
const plot = (th: number, st: St, spd: number, ph: number) => {
  const o: string[] = [];
  const x0 = 212, w = 48, y0 = 76, h = 72;
  o.push(`<rect x="${x0 - 4}" y="${y0 - 14}" width="${w + 8}" height="${h + 26}" rx="6" fill="#fff" opacity=".9" stroke="#2b3350" stroke-width=".8"/>`);
  o.push(txt(x0 + w / 2, y0 - 4, "ตำแหน่งหัว", 5.4, "#2b3350", "middle", 700));
  let d = "";
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N, tt = ph - (1 - t) * 1.2;
    const k = kin(Math.PI * 2 * spd * tt + (th - Math.PI * 2 * spd * ph), st.r);
    const yy = y0 + 6 + ((k.ys - 140) / 50) * (h - 12);
    d += `${i ? "L" : "M"}${f2(x0 + t * w)} ${f2(yy)}`;
  }
  o.push(`<path d="${d}" fill="none" stroke="#ff5a4a" stroke-width="1.6" stroke-linejoin="round"/>`);
  const kk = kin(th, st.r);
  o.push(`<circle cx="${x0 + w}" cy="${f2(y0 + 6 + ((kk.ys - 140) / 50) * (h - 12))}" r="2.6" fill="#ff5a4a" stroke="#fff" stroke-width=".8"/>`);
  o.push(`<path d="M${x0} ${y0 + h + 3} H${x0 + w}" stroke="#7d8aa6" stroke-width=".6"/>${txt(x0 + w / 2, y0 + h + 9, "เวลา →", 5, "#46526b", "middle", 700)}`);
  return o.join("");
};

const battChk = (ph: number, p: number) => {
  const o: string[] = [];
  const rows: [string, number, string][] = [["ตอนซื้อใหม่", 1, "#6bf29a"], ["ตอนนี้", 0.7, "#ffb347"]];
  rows.forEach((r, i) => {
    const y = 90 + i * 64;
    o.push(`<rect x="24" y="${y - 22}" width="222" height="52" rx="10" fill="#fff" opacity=".93" stroke="#2b3350" stroke-width=".9"/>`);
    o.push(txt(34, y - 8, r[0], 8, "#2b3350", "start", 800));
    const cyc = (ph * 0.35) % 1;
    const left = 1 - cl(cyc / r[1]);
    o.push(`<rect x="34" y="${y}" width="190" height="16" rx="5" fill="#e4e9f2" stroke="#2b3350" stroke-width=".9"/><rect x="36" y="${y + 2}" width="${f2(186 * left)}" height="12" rx="3.5" fill="${r[2]}"/><rect x="224" y="${y + 4}" width="5" height="8" rx="2" fill="#2b3350"/>`);
    if (left <= 0.001) o.push(txt(130, y + 12, "หมด", 7, "#7a1a28", "middle", 900));
  });
  o.push(pill(135, 236, "ใช้ได้นานเท่าเดิมไหม?"));
  return o.join("");
};

// ---- กำหนดสถานะต่อคิว ----
const stateOf = (cue: string, p: number, lt: number): St => {
  const s = { ...defSt };
  switch (cue) {
    case "motor": s.spd = 0.9; break;
    case "but": s.spd = 0.9; break;
    case "crank": s.spd = 0.45; break;
    case "rod": s.spd = 0.45; break;
    case "stroke": s.spd = 0.55; break;
    case "amp": s.spd = 0.55; s.r = lerp(6, 15, sm(0.05, 0.95, p)); break;
    case "rpm": s.spd = 0.6 + 2.2 * sm(0, 0.9, p); break;
    case "load": s.press = sm(0.05, 0.6, p); break;
    case "heads": s.head = Math.floor(lt / 1.7) % 3; break;
    case "batt": s.soc = lerp(0.9, 0.5, p); break;
    case "age": s.cap = 1 - 0.3 * sm(0.05, 0.95, p); s.soc = s.cap * (0.55 + 0.45 * Math.cos(p * 3 * Math.PI * 2)); s.spd = 0.8; break;
    default: break;
  }
  return s;
};

const Z = (x: number, y: number, z: number, box?: [number, number, number, number], label?: string) => ({ cx: x, cy: y + 90 / z, z, box, label });
export const SCENE_MASSAGEGUN: SceneDef = {
  focus: {
    all: { ...Z(125, 170, 1.1) },
    motor: { ...Z(95, 120, 1.7, [44, 98, 52, 40]) },
    but: { ...Z(125, 165, 1.05) },
    crank: { ...Z(120, 125, 2.5, [CX - 22, CY - 22, 44, 44]) },
    rod: { ...Z(120, 165, 2.0, [CX - 10, 112, 20, 100]) },
    stroke: { ...Z(152, 165, 1.2) },
    amp: { ...Z(130, 165, 1.45) },
    rpm: { ...Z(150, 160, 1.3) },
    load: { ...Z(125, 215, 1.35) },
    heads: { ...Z(125, 225, 1.5) },
    batt: { ...Z(150, 120, 1.9, [150, 64, 42, 122]) },
    age: { ...Z(150, 120, 1.9, [150, 64, 42, 122]) },
    chk: { ...Z(135, 150, 1.0) },
    end: { ...Z(125, 170, 1.0) },
  },
  render: ({ frame, cue, p, ef }) => {
    const ph = frame / 30;
    const lt = ef / 30;
    const st = stateOf(cue, p, lt);
    const th = Math.PI * 2 * (cue === "rpm" ? (0.6 * ph + 1.1 * (p * p) * (frame / 30 > 0 ? 3 : 0)) : st.spd * ph);
    const o: string[] = [HDEFS, EXTRA, room(412)];
    o.push(`<ellipse cx="130" cy="322" rx="92" ry="7" fill="#1b1008" opacity=".3" filter="url(#bl)"/>`);
    if (cue === "chk") { o.push(`<g opacity=".28">${gun(th, st, ph, cue, p)}</g>`); o.push(battChk(ph, p)); return o.join(""); }
    o.push(gun(th, st, ph, cue, p));
    const k = kin(th, st.r);
    const F = SCENE_MASSAGEGUN.focus[cue]; const TY = F.cy - 240 / F.z + 12;
    // คำอธิบายต่อคิว
    if (cue === "all") o.push(pill(125, TY, "หัวเคาะเข้าออกเป็นจังหวะ"));
    if (cue === "motor") {
      o.push(pill(110, 80, "มอเตอร์ = หมุนวนอย่างเดียว"));
      o.push(`<path d="M${CX - 28} ${CY - 20} A28 28 0 0 1 ${CX + 22} ${CY - 22}" stroke="#ff8a3d" stroke-width="2" fill="none"/><path d="M${CX + 24} ${CY - 28} l2 8 l-8 -2 z" fill="#ff8a3d"/>`);
    }
    if (cue === "but") {
      o.push(pill(125, TY, "หมุนวง → เคาะเส้นตรง?"));
      o.push(`<path d="M${CX + 34} 214 V246 M${CX + 30} 219 l4 -7 l4 7 M${CX + 30} 241 l4 7 l4 -7" stroke="#2b3350" stroke-width="1.6" fill="none"/>`);
      o.push(txt(CX + 52, 238, "?", 22, "#ff5a4a", "middle", 900));
      o.push(`<path d="M${CX - 24} ${CY - 18} A26 26 0 0 1 ${CX + 20} ${CY - 20}" stroke="#ff8a3d" stroke-width="2" fill="none"/>`);
    }
    if (cue === "crank") {
      o.push(`<path d="M${CX} ${CY} L${f2(k.px)} ${f2(k.py)}" stroke="#ff5a4a" stroke-width="1.6" stroke-dasharray="2 1.5"/>`);
      o.push(pill(CX, CY - 32, "จุดยึดไม่อยู่กลางวง"));
      o.push(txt(CX + (k.px - CX) * 0.5 + 6, CY + (k.py - CY) * 0.5 - 2, "r", 7, "#ff5a4a", "middle", 900));
    }
    if (cue === "rod") {
      o.push(pill(CX, 104, "รางบังคับ: ขึ้นลงอย่างเดียว"));
      for (const sx of [-22, 22]) o.push(`<path d="M${CX + sx - 4} 172 l8 8 M${CX + sx + 4} 172 l-8 8" stroke="#ff5a4a" stroke-width="2" stroke-linecap="round"/>`);
    }
    if (cue === "stroke") {
      const yt = kin(-Math.PI / 2, st.r).yh, yb = kin(Math.PI / 2, st.r).yh;
      o.push(`<path d="M${CX - 22} ${f2(yt - 14)} H${CX + 22} M${CX - 22} ${f2(yb + 14)} H${CX + 22}" stroke="#2b3350" stroke-width="1" stroke-dasharray="3 2"/>`);
      o.push(txt(CX + 26, f2(yt - 12), "ดึงเข้า", 5.8, "#2b3350", "start", 800), txt(CX + 26, f2(yb + 17), "ดันออก", 5.8, "#2b3350", "start", 800));
      const turn = Math.floor(th / (Math.PI * 2));
      o.push(pill(120, TY, `หมุน 1 รอบ = เคาะ 1 ครั้ง`));
      o.push(txt(214, 36, `ครั้งที่ ${(turn % 99) + 1}`, 7, "#2b3350", "middle", 900));
      o.push(plot(th, st, st.spd, ph));
    }
    if (cue === "amp") {
      const yt = kin(-Math.PI / 2, st.r).yh, yb = kin(Math.PI / 2, st.r).yh;
      o.push(`<path d="M${CX + 24} ${f2(yt)} V${f2(yb)} M${CX + 20} ${f2(yt)} h8 M${CX + 20} ${f2(yb)} h8" stroke="#ff5a4a" stroke-width="1.6"/>`);
      o.push(txt(CX + 33, f2((yt + yb) / 2 + 2), "2r", 8, "#ff5a4a", "start", 900));
      o.push(`<path d="M${CX} ${CY} L${f2(k.px)} ${f2(k.py)}" stroke="#ff5a4a" stroke-width="1.6" stroke-dasharray="2 1.5"/>`);
      const mm = Math.round(lerp(8, 16, sm(0.05, 0.95, p)));
      o.push(pill(130, TY, `ระยะเคาะ ${mm} มม. (ตัวอย่าง)`));
    }
    if (cue === "rpm") {
      const s = 0.6 + 2.2 * sm(0, 0.9, p);
      o.push(pill(140, TY, "ยิ่งหมุนเร็ว ยิ่งเคาะถี่"));
      o.push(`<rect x="212" y="70" width="12" height="90" rx="6" fill="#fff" stroke="#2b3350" stroke-width=".9"/><rect x="214" y="${f2(158 - 86 * cl(s / 2.8))}" width="8" height="${f2(86 * cl(s / 2.8))}" rx="4" fill="#ff8a3d"/>`);
      o.push(txt(218, 66, "รอบ", 5.6, "#2b3350", "middle", 700));
      for (let i = 0; i < 4; i++) { const uu = (ph * s * 1.4 + i * 0.25) % 1; o.push(`<ellipse cx="${CX}" cy="${MUSC + 2}" rx="${f2(6 + uu * 30)}" ry="${f2(2 + uu * 10)}" fill="none" stroke="#fff" stroke-width="1" opacity="${f2((1 - uu) * 0.6)}"/>`); }
    }
    if (cue === "load") {
      const a = sm(0.05, 0.6, p);
      o.push(`<path d="M${CX + 46} 60 V${f2(110 + 18 * a)} M${CX + 41} ${f2(104 + 18 * a)} l5 8 l5 -8" stroke="#ff5a4a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
      o.push(pill(CX + 14, TY + 24, "กดแรงขึ้น", "#ffd9d0"));
      o.push(`<rect x="214" y="70" width="12" height="90" rx="6" fill="#fff" stroke="#2b3350" stroke-width=".9"/><rect x="216" y="${f2(158 - 86 * (0.35 + 0.6 * a))}" width="8" height="${f2(86 * (0.35 + 0.6 * a))}" rx="4" fill="#ff5a4a"/>`);
      o.push(txt(220, 66, "กระแส", 5.6, "#2b3350", "middle", 700));
      o.push(pill(125, TY, "แรงต้านขึ้น → มอเตอร์กินไฟมากขึ้น"));
    }
    if (cue === "heads") {
      const names = ["หัวกลม", "หัวแบน", "หัวแหลม"];
      o.push(pill(CX + 56, 226, names[st.head], "#d9e6ff"));
      o.push(pill(CX, TY, "กลม = วงกว้าง · แหลม = เป็นจุด"));
      if (st.head === 2) o.push(`<path d="M${CX - 8} 296 L${CX + 8} 296" stroke="#ff5a4a" stroke-width="1.4"/>`);
      o.push(pill(CX, 330, "ไม่กดตรงกระดูก/ข้อต่อ", "#ffe0d8"));
    }
    if (cue === "batt") {
      // ไอออนในเซลล์: ลอยจากซ้ายไปขวา
      for (let i = 0; i < 8; i++) { const u = (ph * 0.5 + i / 8) % 1; o.push(`<circle cx="${f2(160 + (i % 2) * 14 + 4)}" cy="${f2(176 - u * 90)}" r="2" fill="#ffe14a" stroke="#7a5a00" stroke-width=".5" opacity="${f2(Math.sin(Math.PI * u))}"/>`); }
      o.push(pill(171, 56, "ลิเธียมไอออน ชาร์จซ้ำได้", "#d8ffe3"));
    }
    if (cue === "age") {
      const cyc = Math.round(500 * sm(0.05, 0.95, p));
      o.push(pill(171, 56, `ชาร์จซ้ำ ${cyc} รอบ`, "#fff6c9"));
      o.push(pill(171, 212, "ความจุลดลง", "#ffd0c4"));
    }
    o.push(H.box(SCENE_MASSAGEGUN.focus[cue]?.box, ph));
    return o.join("");
  },
};
