// ฉากอธิบาย: ถุงดูดความชื้น (แคลเซียมคลอไรด์) — เม็ดเกลือดึงไอน้ำจากอากาศ ละลายเป็นน้ำเกลือ หยดลงช่องเก็บ — SVG พิกัด 270x480
// โลกแนวตั้งเป็นการ์ดโซนละ 360 หน่วย: 0 ตู้เสื้อผ้า, 1 ภาพตัดถุง, 2 เม็ดเกลือซูมระดับโมเลกุล, 3 เปรียบเทียบที่ปิด/ห้องกว้าง/อากาศแห้ง, 4 ความปลอดภัย, 5 เปลี่ยนถุง
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, box } = H;
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#2b3350", anchor = "middle", w = 700) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, fill = "#fff6c9") => {
  const w = s.length * 4.5 + 10;
  return `<rect x="${f2(x - w / 2)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".97"/>` + txt(x, y + 0.4, s, 6.4);
};
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));
const OUT = "#3f5b73";
const ZS = 360;
const zc = (k: number, ly = 135) => k * ZS + ly;

const DEFS = `<defs>
<linearGradient id="dbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6f3f6"/><stop offset="1" stop-color="#d2e6ec"/></linearGradient>
<linearGradient id="dliq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6ecfb"/><stop offset="1" stop-color="#86cdee"/></linearGradient>
<linearGradient id="dwood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c79a63"/><stop offset=".5" stop-color="#d9b07a"/><stop offset="1" stop-color="#b98a54"/></linearGradient>
<clipPath id="dbag"><path d="M78 56 H192 Q202 56 202 66 V236 Q202 248 190 248 H80 Q68 248 68 236 V66 Q68 56 78 56Z"/></clipPath>
<clipPath id="dgran"><circle cx="135" cy="128" r="56"/></clipPath>
</defs>`;
const card = (fill = "#f7fcfd") => `<rect x="8" y="8" width="254" height="254" rx="14" fill="${fill}" stroke="#a9c7d1" stroke-width="1.3"/>`;
const Oat = (x: number, y: number, r = 2.8) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="#ee5555" stroke="#8c1d22" stroke-width=".4"/>`;
const Hat = (x: number, y: number, r = 1.6) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="#fff" stroke="#5a6a8a" stroke-width=".4"/>`;
const h2o = (x: number, y: number, rot = 0, s = 1, a = 1) => `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${s})" opacity="${f2(a)}">${Oat(0, 0)}${Hat(-3.6, 2.5)}${Hat(3.6, 2.5)}</g>`;
const ion = (x: number, y: number, kind: "Ca" | "Cl", r = 3.6, a = 1) =>
  `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="${kind === "Ca" ? "#5b9cf0" : "#5fcf7c"}" stroke="#2b3350" stroke-width=".5"/>${txt(x, y + r * 0.36, kind === "Ca" ? "2+" : "−", r * 0.95, "#fff", "middle", 900)}</g>`;
const gran = (x: number, y: number, r: number, wet = 0) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="${wet > 0.5 ? "#e4f3fb" : "#fbfbf6"}" stroke="${wet > 0.5 ? "#7fb6d8" : "#b9b9a8"}" stroke-width=".9"/><circle cx="${f2(x - r * 0.3)}" cy="${f2(y - r * 0.3)}" r="${f2(r * 0.28)}" fill="#fff" opacity=".9"/>`;

// ---------- Z0: ตู้เสื้อผ้า ----------
const zone0 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  o.push(`<rect x="24" y="30" width="222" height="220" rx="6" fill="#f6efe0" stroke="url(#dwood)" stroke-width="8"/>`);
  o.push(`<path d="M30 66 H240" stroke="#7a7a8a" stroke-width="3"/>`);
  const cols = ["#6f8fe0", "#e0866f", "#7fc08a", "#c49ae0"];
  const moldK = cue === "vapor" ? sm(0.2, 0.9, p) : 0.15;
  for (let i = 0; i < 4; i++) {
    const x = 50 + i * 38, sw = Math.sin(ph * 0.7 + i) * 1.5;
    o.push(`<g transform="translate(${f2(x + sw)} 66)"><path d="M0 0 v6 M-14 22 L0 6 L14 22 L10 24 V82 H-10 V24Z" fill="${cols[i]}" stroke="#2b3350" stroke-width="1.2"/>`);
    for (let j = 0; j < 4; j++) o.push(`<circle cx="${f2(-6 + rnd(i * 4 + j) * 12)}" cy="${f2(40 + rnd(i * 4 + j + 9) * 36)}" r="${f2(0.8 + 2.2 * moldK * rnd(i + j))}" fill="#4a6b3a" opacity="${f2(0.6 * moldK)}"/>`);
    o.push(`</g>`);
  }
  // ถุงดูดความชื้น
  const u = (ph / 10) % 1;
  const lvl = cue === "all" || cue === "end" ? 0.15 + 0.7 * u : 0.4;
  const bx = 212, by = 90;
  o.push(`<path d="M${bx} 66 V${by}" stroke="#7a7a8a" stroke-width="1.6"/><rect x="${bx - 17}" y="${by}" width="34" height="62" rx="6" fill="#f4fbff" stroke="${OUT}" stroke-width="1.6"/><rect x="${bx - 16}" y="${f2(by + 60 - 24 * lvl)}" width="32" height="${f2(24 * lvl)}" rx="4" fill="url(#dliq)"/>`);
  for (let i = 0; i < 7; i++) o.push(gran(bx - 10 + (i % 4) * 7, by + 8 + Math.floor(i / 4) * 7, 3 * (1 - 0.4 * (1 - lvl)), 0));
  o.push(`<path d="M${bx - 16} ${by + 34} H${bx + 16}" stroke="${OUT}" stroke-width=".8" stroke-dasharray="1.5 1.2"/>`);
  // ไอน้ำ
  const bigV = cue === "vapor";
  const nV = bigV ? 20 : 26;
  for (let i = 0; i < nV; i++) {
    const t = (ph * 0.12 + rnd(i)) % 1;
    const x0 = 40 + rnd(i * 2) * 170, y0 = 80 + rnd(i * 2 + 1) * 160;
    let x = x0 + Math.sin(ph * 0.9 + i * 1.7) * 14, y = y0 + Math.cos(ph * 0.8 + i * 1.3) * 12;
    let a = 1;
    if (!bigV && i % 3 === 0) { const k = (ph / 6 + rnd(i + 5)) % 1; x = lerp(x0, bx, ease(k)); y = lerp(y0, by + 16, ease(k)); a = 1 - sm(0.85, 1, k); }
    void t;
    o.push(h2o(x, y, ph * 20 + i * 40, bigV ? 1.35 : 1.0, a));
  }
  return o.join("");
};

// ---------- Z1: ภาพตัดถุง ----------
const bagCut = (cue: string, p: number, ph: number) => {
  const o: string[] = [];
  const lvl = cue === "drip" ? lerp(0.1, 0.5, sm(0.05, 0.95, p)) : cue === "full" ? lerp(0.5, 0.95, sm(0.05, 0.95, p)) : cue === "inside" ? 0.12 : 0.4;
  const shrink = cue === "drip" ? lerp(1, 0.75, p) : cue === "full" ? lerp(0.75, 0.2, p) : 1;
  o.push(`<path d="M135 28 V56" stroke="#7a7a8a" stroke-width="3"/><circle cx="135" cy="26" r="7" fill="none" stroke="#7a7a8a" stroke-width="3"/>`);
  o.push(`<path d="M78 56 H192 Q202 56 202 66 V236 Q202 248 190 248 H80 Q68 248 68 236 V66 Q68 56 78 56Z" fill="#f4fbff" stroke="${OUT}" stroke-width="2.4"/>`);
  o.push(`<g clip-path="url(#dbag)">`);
  // ช่องเก็บน้ำ
  const ly = 248 - 96 * lvl;
  o.push(`<rect x="68" y="${f2(ly)}" width="140" height="${f2(248 - ly + 2)}" fill="url(#dliq)"/>`);
  o.push(`<path d="M68 ${f2(ly)} Q135 ${f2(ly + 2 * Math.sin(ph * 2))} 202 ${f2(ly)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>`);
  // เม็ดเกลือบนเมมเบรน
  const mem = 150;
  const nG = 40;
  for (let i = 0; i < nG; i++) {
    const col = i % 10, row = Math.floor(i / 10), x = 84 + col * 11.5 + (row % 2) * 5, y = mem - 5 - row * 10.5;
    const live = rnd(i + 3) < shrink;
    if (live) o.push(gran(x, y, 4.6 * (0.45 + 0.55 * shrink), 0));
  }
  o.push(`<path d="M68 ${mem} H202" stroke="${OUT}" stroke-width="1.6" stroke-dasharray="2.4 1.8"/><path d="M68 ${mem + 3} H202" stroke="#9fb6c6" stroke-width=".8" stroke-dasharray="1 2"/>`);
  o.push(`</g>`);
  // ช่องระบายอากาศด้านข้าง
  for (let i = 0; i < 5; i++) { const y = 74 + i * 16; o.push(`<path d="M68 ${y} h-5 M202 ${y} h5" stroke="${OUT}" stroke-width="2"/>`); }
  // ไอน้ำเข้า
  for (let i = 0; i < 14; i++) {
    const k = (ph * 0.35 + rnd(i)) % 1, side = i % 2 ? 1 : -1, yy = 74 + (i % 5) * 16 + Math.sin(i) * 2;
    const x = side < 0 ? lerp(34, 88, ease(k)) : lerp(236, 182, ease(k));
    o.push(h2o(x, yy + (k > 0.6 ? (k - 0.6) * 22 : 0), ph * 30 + i * 20, 1, 1 - sm(0.85, 1, k)));
  }
  // หยดน้ำเกลือ
  const drip = cue === "drip" || cue === "full" ? 1 : 0.35;
  for (let i = 0; i < 5; i++) {
    const k = (ph * 0.5 + i / 5) % 1, x = 92 + (i * 29) % 100, y = mem + 4 + k * (ly - mem - 6);
    if (y < ly) o.push(`<path d="M${f2(x)} ${f2(y)} q-3 -5 0 -10 q3 5 0 10z" fill="#6fc3ee" stroke="#2f86b6" stroke-width=".5" opacity="${f2(drip)}"/>`);
  }
  return o.join("");
};
const zone1 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card(), bagCut(cue, p, ph)];
  if (cue === "inside") {
    o.push(`<path d="M68 100 L40 100" stroke="#2b3350" stroke-width=".8"/>` + pill(52, 94, "เม็ดแคลเซียมคลอไรด์", "#fffbe0").replace("<rect", "<rect"));
    o.push(pill(206, 150, "เมมเบรนให้ไอน้ำผ่าน", "#e6f7d9") + pill(206, 214, "ช่องเก็บของเหลว", "#e3f1fb"));
  }
  if (cue === "full" && p > 0.8) o.push(pill(135, 130, "น้ำเต็มแล้ว เม็ดเกลือเกือบหมด", "#ffe1c9"));
  return o.join("");
};

// ---------- Z2: เม็ดเกลือระดับโมเลกุล ----------
const zone2 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card("#f2f9fb")];
  const att = cue === "attract" ? sm(0.05, 0.9, p) : 1;
  const dis = cue === "dissolve" ? sm(0.1, 0.95, p) : 0;
  const R = 56 - 14 * dis;
  o.push(`<circle cx="135" cy="128" r="${f2(R + 8 * (att > 0.4 ? 1 : 0) * (1 + dis))}" fill="#bfe6f8" opacity="${f2(0.2 + 0.6 * sm(0.3, 1, att) * (cue === "dissolve" ? 1 : 0.55))}"/>`);
  o.push(`<g clip-path="url(#dgran)"><circle cx="135" cy="128" r="${f2(R)}" fill="#fbfbf6"/>`);
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
    const x = 135 + i * 15, y = 128 + j * 15;
    const d = Math.hypot(i * 15, j * 15);
    if (d > R - 3) continue;
    const away = dis * sm(R - 24, R, d + 12 * dis) * 12;
    const a = Math.atan2(j, i);
    const ox = Math.cos(a) * away + Math.sin(ph * 2 + i * 3 + j) * 0.5 * dis, oy = Math.sin(a) * away + Math.cos(ph * 2 + i + j * 2) * 0.5 * dis;
    o.push((i + j) % 2 === 0 ? ion(x + ox, y + oy, "Ca", 3.9) : ion(x + ox, y + oy, "Cl", 3.4));
  }
  o.push(`</g><circle cx="135" cy="128" r="${f2(R)}" fill="none" stroke="#8a8a78" stroke-width="1.6"/>`);
  // โมเลกุลน้ำเข้ามาเกาะผิว
  const nW = 18;
  for (let i = 0; i < nW; i++) {
    const a = (i / nW) * 6.283 + 0.3, k = ((ph * 0.35 + rnd(i)) % 1);
    const stick = cue === "attract" ? sm(0.4, 0.9, p) * (rnd(i + 6) < 0.8 ? 1 : 0) : 1;
    const rr = lerp(R + 62, R + 4.5, ease(Math.min(1, k * 1.5)));
    const mode = k < 0.66 && stick < 0.99 ? 0 : 1;
    const r2 = mode ? R + 5 + Math.sin(ph * 5 + i) * 0.8 + dis * 4 * rnd(i) : rr;
    o.push(h2o(135 + Math.cos(a) * r2, 128 + Math.sin(a) * r2, a * 57 + 90, 1.45, 1));
  }
  if (cue === "dissolve") for (let i = 0; i < 10; i++) { const a = rnd(i) * 6.28, r = R + 10 + rnd(i + 3) * 16 * dis + Math.sin(ph + i) * 3; o.push((i % 2 ? ion(135 + Math.cos(a) * r, 128 + Math.sin(a) * r, "Ca", 3.1, dis) : ion(135 + Math.cos(a) * r, 128 + Math.sin(a) * r, "Cl", 2.8, dis))); }
  o.push(txt(135, 30, cue === "attract" ? "โมเลกุลน้ำเกาะผิวเม็ดเกลือ" : "เม็ดเกลือเปียก แล้วละลายเป็นน้ำเกลือ", 7.6, "#2b3350", "middle", 900));
  o.push(ion(40, 242, "Ca", 3.6) + txt(48, 244, "แคลเซียม", 5.6, "#2f5fb0", "start", 800) + ion(104, 242, "Cl", 3.2) + txt(111, 244, "คลอไรด์", 5.6, "#2a7a3a", "start", 800) + h2o(168, 241, 0, 1.2) + txt(176, 244, "น้ำจากอากาศ", 5.6, "#b02a2a", "start", 800));
  return o.join("");
};

// ---------- Z3: เปรียบเทียบที่ปิด / ห้องกว้าง / อากาศแห้ง ----------
const miniBag = (x: number, y: number, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -12 V0" stroke="#7a7a8a" stroke-width="1.4"/><rect x="-10" y="0" width="20" height="34" rx="4" fill="#f4fbff" stroke="${OUT}" stroke-width="1.4"/><rect x="-9" y="22" width="18" height="11" rx="3" fill="url(#dliq)"/></g>`;
const zone3 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  o.push(`<path d="M135 18 V176" stroke="#a9c7d1" stroke-width="1" stroke-dasharray="4 3"/>`);
  // ซ้าย: ตู้ปิด
  const hot = cue === "where" ? 1 : 0.5;
  o.push(`<rect x="22" y="40" width="100" height="130" rx="6" fill="#f6efe0" stroke="url(#dwood)" stroke-width="6"/><path d="M72 46 V164" stroke="#b98a54" stroke-width="1.2"/>`);
  o.push(miniBag(96, 56, 1.1));
  for (let i = 0; i < 8; i++) { const k = (ph * 0.3 + rnd(i)) % 1; o.push(h2o(34 + rnd(i * 2) * 78 + Math.sin(ph + i) * 6, 60 + rnd(i * 2 + 1) * 96 + Math.cos(ph * 0.8 + i) * 5, ph * 25 + i * 30, 0.9, hot * (1 - 0.3 * k))); }
  o.push(txt(72, 30, "ที่ปิดเล็กๆ", 7.4, "#1f7a3a", "middle", 900) + txt(72, 186, "ไอน้ำไม่มีเพิ่ม", 6, "#1f7a3a", "middle", 800));
  // ขวา: ห้องกว้าง เปิดโล่ง
  o.push(`<rect x="146" y="40" width="108" height="130" rx="6" fill="#f7fafc" stroke="#9fb3c4" stroke-width="2.4"/><rect x="146" y="70" width="10" height="56" fill="#dff1ff" stroke="#6aa0d8" stroke-width="1.2"/>`);
  o.push(miniBag(232, 56, 0.8));
  const but = cue === "but" ? 1 : 0.5;
  for (let i = 0; i < 22; i++) { const k = (ph * 0.4 + i / 22) % 1; const x = lerp(120, 240, k), y = 96 + Math.sin(i * 2.3 + ph * 2) * 10 + (rnd(i) - 0.5) * 70; o.push(h2o(x, y, ph * 30 + i * 20, 0.9, but * (1 - 0.3 * k))); }
  for (let i = 0; i < 4; i++) { const k = (ph * 0.5 + i / 4) % 1; o.push(`<path d="M${f2(112 + k * 36)} ${f2(88 + i * 10)} h10 m-3 -3 l3 3 l-3 3" stroke="#e8433f" stroke-width="1.4" fill="none" opacity="${f2(0.9 - 0.5 * k)}"/>`); }
  o.push(txt(200, 30, "ห้องกว้าง / เปิดโล่ง", 7.4, "#b02a2a", "middle", 900) + txt(200, 186, "ไอน้ำใหม่เข้าตลอด", 6, "#b02a2a", "middle", 800));
  // ล่าง: อากาศแห้ง
  const dry = cue === "dry" ? sm(0.1, 0.8, p) : 0.4;
  o.push(`<rect x="14" y="198" width="242" height="56" rx="10" fill="#fff7ec"/>`);
  o.push(`<g transform="translate(60 240)"><path d="M-30 0 A30 30 0 0 1 30 0" fill="none" stroke="#d0d9e6" stroke-width="7"/><path d="M-30 0 A30 30 0 0 1 -8 -28" fill="none" stroke="#e5973a" stroke-width="7"/><path d="M0 0 L${f2(Math.cos(Math.PI - 0.32 * Math.PI * 0.99) * 24)} ${f2(-Math.sin(Math.PI - 0.32 * Math.PI * 0.99) * 24)}" stroke="#2b3350" stroke-width="2" stroke-linecap="round"/><circle r="3" fill="#2b3350"/></g>`);
  o.push(txt(60, 212, "ความชื้นอากาศต่ำ", 6.4, "#b36b00", "middle", 800));
  for (let i = 0; i < 6; i++) o.push(`<path d="M${f2(132 + i * 12)} 242 l3 -9 l3 9z" fill="#f5f5ee" stroke="#a8a898" stroke-width=".8" opacity="${f2(dry)}"/>`);
  o.push(txt(172, 222, "ดูดช้าลง อาจเป็นผลึกแห้ง", 6.4, "#b36b00", "middle", 800));
  o.push(gran(132, 232, 6, 0) + gran(146, 232, 6, 0));
  return o.join("");
};

// ---------- Z4: ความปลอดภัย ----------
const zone4 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  const tile = (x: number, y: number, label: string, inner: string, on: number) => `<rect x="${x}" y="${y}" width="116" height="104" rx="10" fill="${on ? "#fffbe6" : "#fff"}" stroke="${on ? "#e8a400" : "#a9c7d1"}" stroke-width="${on ? 2 : 1.2}"/><g transform="translate(${x + 58} ${y + 46})">${inner}</g>${txt(x + 58, y + 94, label, 6.2, "#2b3350", "middle", 800)}`;
  const sel = cue === "safe" ? Math.min(3, Math.floor(p * 4)) : -1;
  const drop = (x: number, y: number) => `<path d="M${f2(x)} ${f2(y)} q-3 -5 0 -10 q3 5 0 10z" fill="#6fc3ee" stroke="#2f86b6" stroke-width=".5"/>`;
  const no = `<circle r="22" fill="none" stroke="#e53935" stroke-width="3"/><path d="M-15 -15 L15 15" stroke="#e53935" stroke-width="3"/>`;
  o.push(tile(16, 18, "ห้ามกิน ห้ามเข้าปาก", `<ellipse cx="0" cy="2" rx="14" ry="8" fill="#e57373" stroke="#8c1d22" stroke-width="1.2"/><path d="M-10 2 h20" stroke="#8c1d22" stroke-width="1.2"/>${no}`, sel === 0 ? 1 : 0));
  o.push(tile(138, 18, "พ้นมือเด็กและสัตว์เลี้ยง", `<circle cx="-8" cy="-6" r="7" fill="#f1b894" stroke="#a8643f"/><rect x="-14" y="2" width="12" height="14" rx="3" fill="#e57373"/><ellipse cx="12" cy="10" rx="9" ry="6" fill="#c9a37a" stroke="#7a5a3a"/><circle cx="19" cy="4" r="4.4" fill="#c9a37a" stroke="#7a5a3a"/>${no}`, sel === 1 ? 1 : 0));
  o.push(tile(16, 134, "อย่าให้รั่วเลอะโลหะ", `<rect x="-22" y="6" width="44" height="12" rx="3" fill="#b7c2d0" stroke="#6b7c93"/>${[0, 1, 2].map((i) => `<circle cx="${-12 + i * 12}" cy="12" r="${f2(1 + sel === 2 ? 2 : 1)}" fill="#a85b2a" opacity=".7"/>`).join("")}${drop(0, -6 + ((ph * 14) % 14))}`, sel === 2 ? 1 : 0));
  o.push(tile(138, 134, "อย่าให้เลอะผ้า", `<path d="M-22 -12 H22 V22 H-22Z" fill="#9fb8f0" stroke="#2f4f9a"/><ellipse cx="4" cy="6" rx="${f2(8 + 3 * Math.sin(ph * 2))}" ry="6" fill="#6b8bd8" opacity=".8"/>${drop(4, -16 + ((ph * 16) % 16))}`, sel === 3 ? 1 : 0));
  return o.join("");
};

// ---------- Z5: เปลี่ยนถุง ----------
const zone5 = (cue: string, p: number, ph: number) => {
  const o: string[] = [card()];
  const k = cue === "chk" ? sm(0.2, 0.75, p) : 0;
  const oldX = lerp(78, -40, k), newX = lerp(330, 192, k);
  const bagFull = (x: number, lvl: number, n: number) => {
    let s = `<g transform="translate(${f2(x)} 40)"><path d="M0 -14 V6" stroke="#7a7a8a" stroke-width="2"/><rect x="-30" y="6" width="60" height="150" rx="9" fill="#f4fbff" stroke="${OUT}" stroke-width="2.2"/><path d="M-30 70 H30" stroke="${OUT}" stroke-width="1.4" stroke-dasharray="2 1.6"/><rect x="-28" y="${f2(154 - 80 * lvl)}" width="56" height="${f2(80 * lvl)}" rx="6" fill="url(#dliq)"/>`;
    for (let i = 0; i < n; i++) s += gran(-22 + (i % 5) * 11, 62 - Math.floor(i / 5) * 10, 4.4, 0);
    return s + `</g>`;
  };
  o.push(bagFull(oldX, 0.97, 2));
  o.push(bagFull(newX, 0.05, 15));
  o.push(`<path d="M${f2(oldX)} 214 v0" stroke="none"/>` + txt(oldX, 220, "ถุงเดิม น้ำเต็ม", 6.4, "#b02a2a", "middle", 800));
  o.push(txt(newX, 220, "ถุงใหม่", 6.4, "#1f7a3a", "middle", 800));
  if (k > 0.6) o.push(`<g opacity="${f2(sm(0.6, 0.9, k))}"><circle cx="192" cy="236" r="9" fill="#2e9e55"/><path d="M187.5 236 l3.2 3.4 l6 -7" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  if (k < 0.5) o.push(`<g opacity="${f2(0.6 + 0.4 * Math.sin(ph * 5))}"><path d="M120 120 l12 0 m-4 -4 l4 4 l-4 4" stroke="#e8a400" stroke-width="2" fill="none"/></g>`);
  return o.join("");
};

export const SCENE_DEHUMID: SceneDef = {
  focus: {
    all: { cx: 135, cy: zc(0), z: 1.0 },
    inside: { cx: 135, cy: zc(1), z: 1.02 },
    vapor: { cx: 135, cy: zc(0), z: 1.0 },
    attract: { cx: 135, cy: zc(2), z: 1.02 },
    dissolve: { cx: 135, cy: zc(2), z: 1.02 },
    drip: { cx: 135, cy: zc(1), z: 1.02 },
    where: { cx: 72, cy: zc(3, 100), z: 1.9 },
    but: { cx: 198, cy: zc(3, 100), z: 1.9 },
    dry: { cx: 135, cy: zc(3, 226), z: 1.6 },
    safe: { cx: 135, cy: zc(4), z: 1.02 },
    full: { cx: 135, cy: zc(1), z: 1.02 },
    chk: { cx: 135, cy: zc(5), z: 1.02 },
    end: { cx: 135, cy: zc(0), z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const o: string[] = [DEFS, `<rect x="-300" y="-300" width="900" height="2800" fill="url(#dbg)"/>`];
    const wrap = (k: number, z: string) => `<g transform="translate(0 ${k * ZS})">${z}</g>`;
    o.push(wrap(0, zone0(cue, p, ph)), wrap(1, zone1(cue, p, ph)), wrap(2, zone2(cue, p, ph)), wrap(3, zone3(cue, p, ph)), wrap(4, zone4(cue, p, ph)), wrap(5, zone5(cue, p, ph)));
    const F = SCENE_DEHUMID.focus[cue] || SCENE_DEHUMID.focus.all;
    const hud = (s: string, fill = "#fff6c9") => { const y = F.cy - 200 / F.z; o.push(`<g transform="translate(${F.cx} ${f2(y)}) scale(${f2(1.6 / F.z)}) translate(${-F.cx} ${f2(-y)})">${pill(F.cx, y, s, fill)}</g>`); };
    const HUD: Record<string, string> = { all: "ถุงดูดความชื้น แขวนในตู้", end: "ดูข้างในของใช้ ยังไงนะ", inside: "ภาพตัดถุงดูดความชื้น", vapor: "ไอน้ำล่องลอยในอากาศ", attract: "เกลือดึงดูดโมเลกุลน้ำ", dissolve: "ยิ่งดูดน้ำ ยิ่งละลาย", drip: "น้ำเกลือหยดลงช่องล่าง", where: "ที่ปิดเล็กๆ ได้ผลดี", but: "ห้องกว้าง สู้ไม่ไหว", dry: "อากาศแห้ง ดูดช้าลง", safe: "ใช้อย่างปลอดภัย", full: "น้ำเพิ่ม เม็ดเกลือลด", chk: "น้ำเต็ม ถึงเวลาเปลี่ยนถุง" };
    if (HUD[cue]) hud(HUD[cue], cue === "but" ? "#ffd9d0" : cue === "chk" ? "#ffe1c9" : "#fff6c9");
    o.push(box(SCENE_DEHUMID.focus[cue]?.box, ph));
    return o.join("");
  },
};
