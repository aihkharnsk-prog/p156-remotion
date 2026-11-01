// ฉากอธิบาย: ไม้ม็อบถังปั่น — น้ำพุ่งตรงออกจากเส้นใยเมื่อตะกร้าหมุน (แรงเหวี่ยง) ผ่านรูตะกร้า (SVG พิกัด 270x480)
// เน้นแอนิเมชัน: กล้องเลื่อนระหว่างถังตัดครึ่ง/มุมมองบน/กราฟ, ทุก cue มีลูปเคลื่อนไหวตลอด
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

// ----- ฉากอธิบาย: ไม้ม็อบถังปั่น — แรงเหวี่ยงไล่น้ำออกจากเส้นใย (SVG 270x480) -----
const FOCUS = {
  all: { cx: 135, cy: 200, z: 1.0 },
  soak: { cx: 135, cy: 190, z: 1.25 },
  cap: { cx: 135, cy: 170, z: 1.2 },
  basket: { cx: 135, cy: 180, z: 1.45 },
  press: { cx: 150, cy: 215, z: 1.35 },
  straight: { cx: 135, cy: 170, z: 1.8 },
  holes: { cx: 135, cy: 200, z: 1.35 },
  speed: { cx: 135, cy: 205, z: 1.15 },
  wear: { cx: 135, cy: 215, z: 1.2 },
  chk: { cx: 135, cy: 205, z: 1.35 },
  end: { cx: 135, cy: 200, z: 1.0 },
};
const DEFS = `<defs>
<linearGradient id="mbk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4b8fd8"/><stop offset=".4" stop-color="#8cc3f4"/><stop offset="1" stop-color="#3a72b5"/></linearGradient>
<linearGradient id="mba" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d98b8"/><stop offset=".4" stop-color="#d8def0"/><stop offset="1" stop-color="#6c7799"/></linearGradient>
<linearGradient id="mwt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0ff" stop-opacity=".75"/><stop offset="1" stop-color="#2f8fe0" stop-opacity=".85"/></linearGradient>
</defs>`;
const WET = "#5fa8e8", DRY = "#e9d9a8";
// ---- หัวม็อบด้านข้าง: เส้นใยห้อยลง ----
const strands = (cx: number, cy: number, wet: number, ph: number, spin: number, n = 34, len = 34, fluff = 1) => {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1) - 0.5) * 2, dx = a * 24 * fluff + Math.sin(ph * 3 * spin + i) * 1.2 * spin;
    const sag = len * (0.8 + 0.4 * rnd(i)) * (0.6 + 0.4 * wet);
    s += `<path d="M${f2(cx + a * 12)} ${cy} q${f2(dx * 0.5)} ${f2(sag * 0.3)} ${f2(dx)} ${f2(sag)}" stroke="${mixc(DRY, WET, wet * 0.9)}" stroke-width="${f2(1.5 - 0.2 * rnd(i + 3))}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
};
const drip = (x: number, y: number, ph: number, k: number, a = 1) => {
  const u = (ph * 0.9 + rnd(k)) % 1;
  return `<path d="M${f2(x)} ${f2(y + u * 30 - 3)} q-2 3 0 4.6 q2 -1.6 0 -4.6z" fill="#8fd4ff" opacity="${f2((1 - u) * a)}"/>`;
};
// ---- ถังตัดครึ่ง: ถังนอก + ตะกร้ารูพรุน + เพลาไปแป้นเหยียบ ----
const bucket = (ph: number, rot: number, water: number, handleY: number, head: string, pedal: number): string => {
  let o = "";
  o += `<path d="M44 150 L52 292 Q52 300 62 300 H208 Q218 300 218 292 L226 150 Z" fill="url(#mbk)" stroke="#1d3a66" stroke-width="2"/>`;
  o += `<path d="M52 158 L58 288 H212 L218 158 Z" fill="#1a2a52"/>`;
  // ช่องน้ำที่ก้นถัง
  o += `<rect x="58" y="${f2(288 - 30 * water)}" width="154" height="${f2(30 * water)}" fill="url(#mwt)"/>`;
  // ตะกร้า
  o += `<rect x="82" y="162" width="106" height="82" rx="6" fill="#c3cbe3" fill-opacity=".28" stroke="url(#mba)" stroke-width="3.5"/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) {
    const x = 90 + c * 11.6, y = 172 + r * 17;
    o += `<ellipse cx="${f2(x)}" cy="${y}" rx="2.4" ry="3.4" fill="#0b1226" stroke="#aeb9d6" stroke-width=".6"/>`;
  }
  // เส้นแสดงการหมุนของตะกร้า (ลูกศรโค้ง)
  if (rot > 0.05) for (let i = 0; i < 4; i++) {
    const y = 172 + i * 17 + ((ph * 40 * rot) % 17);
    o += `<path d="M84 ${f2(y)} h102" stroke="#fff" stroke-width=".6" opacity="${f2(0.25 * rot)}" stroke-dasharray="6 10"/>`;
  }
  o += `<rect x="130" y="244" width="10" height="38" fill="#8d98b8" stroke="#2b3350" stroke-width="1"/>`;
  o += head;
  // ด้าม
  o += `<rect x="132.5" y="${handleY}" width="5" height="${f2(206 - handleY)}" rx="2" fill="#e8ecff" stroke="#2b3350" stroke-width="1"/>`;
  // เฟือง + แป้นเหยียบ
  o += `<g transform="translate(135 284) rotate(${f2(ph * 360 * rot * 1.5)})"><circle r="9" fill="#ffe14a" stroke="#2b3350" stroke-width="1.2"/>`;
  for (let i = 0; i < 8; i++) o += `<rect x="-1.8" y="-12" width="3.6" height="4.6" fill="#ffe14a" stroke="#2b3350" stroke-width=".6" transform="rotate(${i * 45})"/>`;
  o += `<circle r="2.4" fill="#2b3350"/></g>`;
  const pa = pedal * 14;
  o += `<g transform="rotate(${f2(-8 + pa)} 224 300)"><rect x="150" y="296" width="80" height="9" rx="3" fill="#e5586a" stroke="#6a1020" stroke-width="1.2"/><circle cx="224" cy="300" r="3" fill="#2b3350"/></g>`;
  return o;
};
const topView = (ph: number, p: number, mode: number): string => {
  // มุมมองบน: ตะกร้าหมุน เส้นใยหมุนตาม น้ำหลุดพุ่งตรงตามแนวสัมผัส
  const cx = 135, cy = 150, R = 52, RO = 74, w = 2.6;
  const th = ph * w;
  let o = `<circle cx="${cx}" cy="${cy}" r="${RO}" fill="#1a2a52" stroke="url(#mbk)" stroke-width="7"/>`;
  o += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#10162c" stroke="url(#mba)" stroke-width="3.4"/>`;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.2832 + th; o += `<circle cx="${f2(cx + Math.cos(a) * R)}" cy="${f2(cy + Math.sin(a) * R)}" r="2" fill="#0b1226" stroke="#aeb9d6" stroke-width=".6"/>`; }
  // เส้นใยหมุน
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * 6.2832 + th, r1 = 8, r2 = R - 6 - 6 * rnd(i);
    o += `<path d="M${f2(cx + Math.cos(a) * r1)} ${f2(cy + Math.sin(a) * r1)} Q${f2(cx + Math.cos(a - 0.25) * r2 * 0.6)} ${f2(cy + Math.sin(a - 0.25) * r2 * 0.6)} ${f2(cx + Math.cos(a - 0.12) * r2)} ${f2(cy + Math.sin(a - 0.12) * r2)}" stroke="${WET}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>`;
  }
  // หยดน้ำ: ติดกับเส้นใยแล้วหลุดพุ่งตรง
  const N = 22;
  for (let i = 0; i < N; i++) {
    const L = 1.5, t = ph / L + i / N, cyc = Math.floor(t), u = t - cyc, s = i * 5 + cyc * 11;
    const a0 = rnd(s) * 6.2832, r0 = 14 + rnd(s + 1) * (R - 24);
    const tR = 0.35; // ช่วงที่ยังหมุนไปกับเส้นใย
    let x: number, y: number;
    const aa = a0 + th * 0 + (Math.min(u, tR) / L) * L * w;
    const px = cx + Math.cos(aa) * r0, py = cy + Math.sin(aa) * r0;
    if (u < tR) { x = px; y = py; }
    else {
      const v = r0 * w, tx = -Math.sin(aa), ty = Math.cos(aa), k = (u - tR) * L;
      x = px + tx * v * k * 1.4; y = py + ty * v * k * 1.4;
    }
    const dd = Math.hypot(x - cx, y - cy); if (dd > RO - 3) continue;
    o += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${u < tR ? 1.7 : 2.3}" fill="#bfe8ff" stroke="#2f8fe0" stroke-width=".6"/>`;
    if (mode && i === 3 && u > tR) o += `<path d="M${f2(px)} ${f2(py)} L${f2(x)} ${f2(y)}" stroke="#ffe14a" stroke-width=".9" stroke-dasharray="2 2"/>`;
  }
  // จุดเด่น: หยดตัวอย่าง + ลูกศรแนวสัมผัส
  const aa = th * 0.9 + 1, r = R - 10, bx = cx + Math.cos(aa) * r, by = cy + Math.sin(aa) * r;
  o += `<circle cx="${f2(bx)}" cy="${f2(by)}" r="3" fill="#ffe14a" stroke="#2b3350" stroke-width=".8"/>`;
  if (mode) o += `<path d="M${f2(bx)} ${f2(by)} l${f2(-Math.sin(aa) * 26)} ${f2(Math.cos(aa) * 26)}" stroke="#ffe14a" stroke-width="1.6" marker-end="url(#mar)"/>`;
  o += `<path d="M${cx + 20} ${cy - 5} a20 20 0 1 1 -8 -17" stroke="#fff" stroke-width="1.2" fill="none" opacity=".5"/>`;
  return o;
};
const capView = (ph: number, p: number): string => {
  let o = `<rect x="50" y="84" width="170" height="130" rx="12" fill="#10162c" stroke="#3a4a86" stroke-width="1.2"/>`;
  const lvl = 214 - 126 * sm(0.05, 0.85, p);
  o += `<clipPath id="mcl"><rect x="52" y="${f2(lvl)}" width="166" height="${f2(214 - lvl)}"/></clipPath><rect x="52" y="86" width="166" height="126" fill="url(#mwt)" clip-path="url(#mcl)"/>`;
  const cols = 7, rows = 5;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = 72 + c * 22 + (r % 2) * 11 + (rnd(r * 7 + c) - 0.5) * 3, y = 104 + r * 24;
    o += `<circle cx="${f2(x)}" cy="${f2(y)}" r="7.5" fill="#e9d9a8" stroke="#8a6f2a" stroke-width="1"/><circle cx="${f2(x - 2)}" cy="${f2(y - 2)}" r="2.2" fill="#fff6d0" opacity=".7"/>`;
  }
  for (let i = 0; i < 12; i++) { const u = (ph * 0.5 + i / 12) % 1; o += `<circle cx="${f2(60 + rnd(i) * 150)}" cy="${f2(214 - u * 120 * (lvl < 160 ? 1 : 0.3))}" r="1.5" fill="#fff" opacity="${f2(0.5 * Math.sin(u * 3.14))}"/>`; }
  o += pill(135, 76, "ช่องระหว่างเส้นใยดูดน้ำไว้", "#e1f3ff");
  return o;
};
const speedView = (ph: number, p: number): string => {
  const X0 = 52, X1 = 222, Y0 = 92, Y1 = 214;
  let o = `<rect x="38" y="70" width="194" height="170" rx="12" fill="#10162c" stroke="#3a4a86" stroke-width="1.2"/>`;
  o += `<path d="M${X0} ${Y0 - 6} V${Y1} H${X1}" stroke="#aeb9d6" stroke-width="1.2" fill="none"/>`;
  const fn = (u: number) => 0.28 + 0.72 * Math.exp(-4 * u);
  let d = ""; for (let i = 0; i <= 40; i++) { const u = i / 40; d += (i ? " L" : "M") + f2(X0 + (X1 - X0 - 8) * u) + " " + f2(Y1 - 6 - (Y1 - Y0 - 14) * (1 - fn(u))* 0 - (Y1 - Y0 - 14) * (fn(u) - 0.0) * 0 ) ; }
  d = ""; for (let i = 0; i <= 40; i++) { const u = i / 40; d += (i ? " L" : "M") + f2(X0 + (X1 - X0 - 8) * u) + " " + f2(Y0 + 4 + (Y1 - Y0 - 14) * (1 - (1 - fn(u)) / 1)); }
  // y: ความเปียก (บน = เปียก)
  d = ""; for (let i = 0; i <= 40; i++) { const u = i / 40; d += (i ? " L" : "M") + f2(X0 + (X1 - X0 - 8) * u) + " " + f2(Y1 - 8 - (Y1 - Y0 - 14) * fn(u)); }
  const e = ease(cl(p / 0.9));
  o += `<clipPath id="msc"><rect x="${X0}" y="${Y0 - 6}" width="${f2((X1 - X0) * e)}" height="130"/></clipPath><path d="${d}" stroke="#5fc8ff" stroke-width="2.6" fill="none" clip-path="url(#msc)"/>`;
  o += `<line x1="${X0}" y1="${f2(Y1 - 8 - (Y1 - Y0 - 14) * 0.28)}" x2="${X1}" y2="${f2(Y1 - 8 - (Y1 - Y0 - 14) * 0.28)}" stroke="#ff8a7a" stroke-width="1.2" stroke-dasharray="4 3"/>`;
  o += txt(X1 - 2, Y1 - 8 - (Y1 - Y0 - 14) * 0.28 - 4, "ยังชื้นอยู่", 6.4, "#ff8a7a", "end");
  o += txt(X0 + 4, Y0 + 2, "เปียก", 6.6, "#cfe0ff", "start") + txt(X0 + 4, Y1 - 3, "หมาด", 6.6, "#cfe0ff", "start") + txt((X0 + X1) / 2, Y1 + 18, "จำนวนรอบที่ปั่น →", 6.8, "#cfe0ff");
  const mu = e, mx = X0 + (X1 - X0 - 8) * mu, my = Y1 - 8 - (Y1 - Y0 - 14) * fn(mu);
  o += `<circle cx="${f2(mx)}" cy="${f2(my)}" r="4" fill="#ffe14a" stroke="#2b3350" stroke-width="1"/>`;
  // ผ้าชุ่มน้ำค่อยๆหมาด: หยดร่วงจากตัวอย่างเล็ก
  o += `<g transform="translate(190 112)">${strands(0, 0, fn(mu), ph, 0, 12, 22, 0.5)}</g>`;
  return o;
};
const wearView = (ph: number, p: number): string => {
  let o = "";
  o += `<rect x="30" y="170" width="210" height="8" rx="3" fill="#5a6584"/>`;
  // ตัวอย่างสองหัว: ใหม่ (ซ้าย) / เก่า (ขวา)
  const heads: [number, boolean][] = [[85, true], [185, false]];
  for (const [x, nw] of heads) {
    const sw = Math.sin(ph * 2.4 + (nw ? 0 : 1)) * 8;
    o += `<g transform="translate(${f2(sw)} 0)"><rect x="${x - 22}" y="104" width="44" height="9" rx="4" fill="#e5586a" stroke="#6a1020" stroke-width="1"/><rect x="${x - 2.5}" y="50" width="5" height="56" rx="2" fill="#e8ecff" stroke="#2b3350" stroke-width=".8"/>`;
    const n = nw ? 26 : 12;
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1) - 0.5) * 2, len = nw ? 54 + 6 * rnd(i) : 34 + 16 * rnd(i), dx = a * (nw ? 22 : 12) + (nw ? 0 : (rnd(i + 2) - 0.5) * 14);
      o += `<path d="M${f2(x + a * 17)} 113 q${f2(dx * 0.6)} ${f2(len * 0.45)} ${f2(dx + (nw ? 0 : a * 10))} ${f2(len * (nw ? 1 : 0.9))}" stroke="${nw ? "#7fd0ff" : "#a8a089"}" stroke-width="${nw ? 1.5 : 2}" fill="none" stroke-linecap="round" ${nw ? "" : 'stroke-dasharray="6 3"'}/>`;
    }
    o += `</g>`;
  }
  // เศษสกปรกบนพื้น: หัวใหม่เก็บได้ หัวเก่าทิ้งไว้
  for (let i = 0; i < 9; i++) {
    const u = (ph * 0.3 + i / 9) % 1, gx = 40 + u * 190;
    const keep = gx < 135 ? Math.abs(gx - (85 + Math.sin(ph * 2.4) * 8)) < 26 : false;
    o += `<circle cx="${f2(gx)}" cy="${f2(166 - (keep ? 12 : 0))}" r="2.2" fill="${keep ? "#7a5a2a" : "#8a6a3a"}"/>`;
  }
  o += pill(85, 222, "ใหม่: ฟูและเก็บฝุ่น", "#e5f8e9") + pill(185, 222, "สึก: เส้นใยแบนบาง", "#ffe9e4");
  return o;
};
export const SCENE_SPINMOP: SceneDef = {
  focus: FOCUS,
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const c = (FOCUS as any)[cue] ? cue : "all";
    const o: string[] = [DEFS, bgFill(ph, "#1d3560", "#0d1630"), `<defs><marker id="mar" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5z" fill="#ffe14a"/></marker></defs>`];
    const side = (rot: number, wet: number, pedal: number, hy: number, drips = false) => {
      const head = `<rect x="108" y="224" width="54" height="9" rx="4" fill="#e5586a" stroke="#6a1020" stroke-width="1"/>` + strands(135, 224, wet, ph, rot, 36, 34, 1.15);
      let s = bucket(ph, rot, c === "holes" || c === "press" ? 0.5 + 0.3 * rot : 0.5, hy, head, pedal);
      if (drips) for (let i = 0; i < 6; i++) s += drip(96 + i * 16, 190, ph, i);
      return s;
    };
    if (c === "all" || c === "end") o.push(side(0.4 + 0.2 * Math.sin(ph), 0.7, 0.5 + 0.5 * Math.sin(ph * 4), 60));
    else if (c === "soak") {
      const dip = sm(0, 0.5, p);
      o.push(`<g transform="translate(0 ${f2(60 * (1 - dip) - 24)})"><rect x="62" y="150" width="146" height="120" rx="10" fill="#1a2a52" stroke="url(#mbk)" stroke-width="5"/><rect x="66" y="${f2(170)}" width="138" height="96" fill="url(#mwt)"/><rect x="132.5" y="30" width="5" height="${f2(150 - 30 + 40 * dip)}" rx="2" fill="#e8ecff" stroke="#2b3350" stroke-width="1"/><rect x="108" y="${f2(190 * 0 + 200 - 40 * (1 - dip) * 0)}" width="54" height="9" rx="4" fill="#e5586a" stroke="#6a1020" stroke-width="1"/>${strands(135, 209, 0.15 + 0.85 * dip, ph, 0.3, 36, 38, 1.15)}</g>`);
    }
    else if (c === "cap") o.push(capView(ph, p));
    else if (c === "basket") o.push(side(0, 0.9, 0, 60 + 0 * p));
    else if (c === "press") { const k = (ph * 0.8) % 1, pd = k < 0.5 ? ease(k * 2) : 1 - ease((k - 0.5) * 2); o.push(side(pd > 0.1 ? Math.max(0, 1 - pd * 0.2) * (k < 0.5 ? 1 : 0.0) : 0, 0.9, pd, 60 + 40 * pd), pill(135, 78, k < 0.5 ? "กดลง → หมุน" : "ปล่อยคืน ไม่หมุนกลับ", "#fff6c9")); }
    else if (c === "straight") o.push(topView(ph, p, 1), pill(135, 54, "น้ำพุ่งตรง ตามแนวสัมผัส", "#fff6c9"));
    else if (c === "holes") {
      o.push(side(1, 0.55, 0.3, 60, false));
      for (let i = 0; i < 16; i++) {
        const t = (ph * 0.8 + i / 16) % 1, sd = i % 2 ? 1 : -1, y0 = 172 + (i % 4) * 17, x0 = 135 + sd * 53, x1 = 135 + sd * 78;
        const x = lerp(x0, x1, Math.min(1, t * 2)), y = y0 + (t > 0.5 ? (t - 0.5) * 2 * (284 - y0) * 0.9 : 0) + 6 * Math.min(1, t * 2) ** 2;
        o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="2.3" fill="#bfe8ff" stroke="#2f8fe0" stroke-width=".6" opacity="${f2(1 - Math.max(0, t - 0.9) * 10)}"/>`);
      }
      o.push(pill(135, 82, "น้ำลอดรู ชนผนังถัง ไหลลง", "#e1f3ff"));
    }
    else if (c === "speed") o.push(speedView(ph, p));
    else if (c === "wear") o.push(wearView(ph, p));
    else if (c === "chk") o.push(wearView(ph, 0.5), pill(135, 40, "วางเทียบกัน", "#fff6c9"));
    return o.join("");
  },
};
