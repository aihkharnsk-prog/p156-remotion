// ฉากอธิบาย: เครื่องบดสับไฟฟ้าขนาดเล็ก (electric food chopper) แบบตัดครึ่ง — SVG พิกัด 270x480
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, box, DEFS, room } = H;
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
const xmark = (x: number, y: number, a = 1, s = 4) =>
  `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${s + 1.8}" fill="#fff" stroke="#d94b4b" stroke-width="1"/><path d="M${f2(x - s * 0.7)} ${f2(y - s * 0.7)} L${f2(x + s * 0.7)} ${f2(y + s * 0.7)} M${f2(x + s * 0.7)} ${f2(y - s * 0.7)} L${f2(x - s * 0.7)} ${f2(y + s * 0.7)}" stroke="#d94b4b" stroke-width="1.7" stroke-linecap="round"/></g>`;
const tick = (x: number, y: number, a = 1, s = 4) =>
  `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${s + 1.8}" fill="#fff" stroke="#2f9e57" stroke-width="1"/><path d="M${f2(x - s * 0.7)} ${f2(y)} L${f2(x - s * 0.15)} ${f2(y + s * 0.6)} L${f2(x + s * 0.8)} ${f2(y - s * 0.6)}" fill="none" stroke="#2f9e57" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>`;

// ---------- ขนาดเครื่อง (ค่ากลางแกน x = CX) ----------
const CX = 135;
const BOWL_TOP = 100, BOWL_BOT = 212; // โถ
const BASE_TOP = 212, TABLE = 276;
const L = 60; // ครึ่งความยาวใบมีด
const BLADE_Y = [200, 171, 142]; // ล่าง กลาง บน (ใบมีดคนละระดับ)
const NP = 24; // จำนวนชิ้นอาหารสูงสุด

const EXTRA = `<defs>
<linearGradient id="ctab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d4b8"/><stop offset="1" stop-color="#b9a47f"/></linearGradient>
<linearGradient id="ccab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c7650"/><stop offset="1" stop-color="#6d4d30"/></linearGradient>
<linearGradient id="cbase" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9d1e0"/><stop offset=".25" stop-color="#f1f4fa"/><stop offset=".7" stop-color="#dfe5ee"/><stop offset="1" stop-color="#aab4c8"/></linearGradient>
<linearGradient id="cblade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fb"/><stop offset="1" stop-color="#8e9ab2"/></linearGradient>
<linearGradient id="clid" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a4577"/><stop offset=".35" stop-color="#6a77aa"/><stop offset="1" stop-color="#2a3150"/></linearGradient>
<clipPath id="cbowl"><path d="M66 ${BOWL_TOP} H204 L198 207 Q198 211 194 211 H76 Q72 211 72 207 Z"/></clipPath>
</defs>`;

type V = { sp: number; cut: number; lid: number; btn: number; heat: number; food: number };

// รูปทรงตัวเครื่อง + ชิ้นอาหาร + ใบมีด
const machine = (ph: number, ang: number, v: V, o: { hi?: number; carrot?: number; paste?: number; loop?: boolean; stall?: number } = {}) => {
  const s: string[] = [];
  const sp = v.sp;
  const shake = o.stall ? Math.sin(ph * 40) * 0.8 * o.stall : 0;
  // เงา + โต๊ะ
  s.push(`<rect x="-140" y="${TABLE}" width="550" height="10" fill="url(#ctab)"/><rect x="-140" y="${TABLE + 10}" width="550" height="200" fill="url(#ccab)"/>`);
  s.push(`<ellipse cx="${CX}" cy="${TABLE + 1}" rx="92" ry="4.5" fill="#1b1008" opacity=".4" filter="url(#bl)"/>`);

  // ฐาน (ตัดครึ่ง เห็นมอเตอร์)
  s.push(`<g filter="url(#sh)"><path d="M55 ${TABLE} V228 Q55 ${BASE_TOP} 71 ${BASE_TOP} H199 Q215 ${BASE_TOP} 215 228 V${TABLE} Z" fill="url(#cbase)" stroke="#2b3350" stroke-width="1.1"/></g>`);
  s.push(`<rect x="64" y="222" width="142" height="46" rx="6" fill="#2f3858" stroke="#1d2338" stroke-width=".8"/>`);
  // มอเตอร์: ขดลวดทองแดง 2 ข้าง + โรเตอร์ที่หมุน
  const glow = v.heat > 0.05 ? `<rect x="96" y="226" width="78" height="38" rx="8" fill="#ff4a1a" opacity="${f2(0.5 * v.heat)}" filter="url(#bl)"/>` : "";
  s.push(glow);
  s.push(`<rect x="98" y="230" width="74" height="30" rx="4" fill="${mixc("#8a93a8", "#d9603a", v.heat * 0.8)}" stroke="#1d2338" stroke-width=".8"/>`);
  for (const bx of [102, 154]) {
    s.push(`<rect x="${bx}" y="233" width="14" height="24" rx="2" fill="${mixc("#c97a3a", "#ff7a3a", v.heat)}" stroke="#7a4a1c" stroke-width=".6"/>`);
    for (let i = 0; i < 5; i++) s.push(`<rect x="${bx}" y="${236 + i * 4.6}" width="14" height="1" fill="#7a4a1c" opacity=".7"/>`);
  }
  s.push(`<rect x="119" y="233" width="32" height="24" rx="3" fill="#b5bfd2" stroke="#4a5470" stroke-width=".7"/>`);
  for (let i = 0; i < 5; i++) {
    const xx = 135 + 14 * Math.cos(ang + i * 1.257);
    if (Math.sin(ang + i * 1.257) > -0.2) s.push(`<rect x="${f2(xx - 0.7)}" y="233" width="1.4" height="24" fill="#4a5470" opacity=".8"/>`);
  }
  // แกน + ข้อต่อ
  s.push(`<rect x="132.5" y="${BLADE_Y[2] - 10}" width="5" height="${257 - BLADE_Y[2] + 10}" fill="#9aa4ba" stroke="#4a5470" stroke-width=".6"/>`);
  s.push(`<path d="M124 ${BASE_TOP} H146 L141 ${BASE_TOP + 9} H129 Z" fill="#6e7a93" stroke="#2b3350" stroke-width=".7"/>`);
  // ปุ่มกด (พัลส์) ด้านขวาของฐาน
  const by = 247 + (v.btn ? 1.6 : 0);
  s.push(`<ellipse cx="193" cy="${f2(by + 4)}" rx="9" ry="4" fill="#9a2a2a"/><rect x="184" y="${f2(by - 3)}" width="18" height="${v.btn ? 5 : 7}" rx="3" fill="${v.btn ? "#ff6a5a" : "#e94b4b"}" stroke="#7a1d1d" stroke-width=".8"/><rect x="186" y="${f2(by - 2)}" width="14" height="1.6" rx=".8" fill="#fff" opacity=".4"/>`);

  // โถ (หลังอาหาร)
  s.push(`<path d="M66 ${BOWL_TOP} H204 L198 207 Q198 211 194 211 H76 Q72 211 72 207 Z" fill="#eaf4fb" opacity=".55"/>`);
  s.push(`<g clip-path="url(#cbowl)">`);
  // ชั้นอาหารบดเละที่ก้นโถ
  if (o.paste) s.push(`<rect x="60" y="${f2(211 - o.paste)}" width="150" height="${f2(o.paste + 2)}" fill="#e3d79b" opacity=".95"/><path d="M60 ${f2(211 - o.paste)} q10 -3 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#c9bb74" stroke-width="1"/>`);
  // ชิ้นอาหาร
  const nvis = Math.round(lerp(7, NP, v.cut));
  const sz = lerp(8.5, 2.6, v.cut) * v.food;
  for (let i = 0; i < nvis; i++) {
    let hx = 82 + rnd(i + 3) * 106, hy = 178 + rnd(i + 40) * 28;
    if (o.loop) { const a = ph * 1.6 + i * 0.52; hx = CX + Math.cos(a) * 50; hy = 168 + Math.sin(a) * 34; }
    else if (v.food > 0.01) { hy -= (1 - v.cut) * rnd(i + 70) * 18; }
    const wx = Math.sin(ph * 6 * sp + i * 2.3) * 5 * sp, wy = Math.cos(ph * 5 * sp + i * 1.7) * 4 * sp;
    const x = hx + wx, y = hy + wy, r = sz * (0.8 + 0.4 * rnd(i + 9));
    const hl = o.hi != null && Math.abs(y - BLADE_Y[o.hi]) < 15;
    if (o.paste && y > 211 - o.paste - 2) continue;
    s.push(`<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(r)}" ry="${f2(r * 0.85)}" fill="${hl ? "#ffe9a0" : "#f6efd6"}" stroke="${hl ? "#d9a300" : "#bba878"}" stroke-width=".8" transform="rotate(${f2(rnd(i + 20) * 90)} ${f2(x)} ${f2(y)})"/>`);
  }
  // แครอทชิ้นใหญ่ (ตอนมอเตอร์ฝืน)
  if (o.carrot) s.push(`<g transform="translate(${f2(shake)} 0)"><rect x="104" y="184" width="62" height="22" rx="9" fill="#f08a2a" stroke="#a24f0a" stroke-width="1"/><rect x="108" y="187" width="40" height="4" rx="2" fill="#fff" opacity=".3"/></g>`);
  s.push(`</g>`);

  // ใบมีด 3 ใบ คนละระดับ (มองด้านข้าง: ขอบหมุนเป็นเส้นแคบ-กว้าง)
  for (let i = 0; i < 3; i++) {
    const a = ang + i * 1.15;
    const lc = Math.cos(a) * L, ts = Math.sin(a) * 3.2, y = BLADE_Y[i];
    if (sp > 0.5) s.push(`<ellipse cx="${CX}" cy="${y}" rx="${L}" ry="3.4" fill="#c9d6ee" opacity="${f2(0.28 * sp)}"/>`);
    const hot = o.hi === i;
    if (hot) s.push(`<rect x="${CX - L - 6}" y="${y - 8}" width="${2 * L + 12}" height="16" rx="5" fill="#ffe14a" opacity=".28"/>`);
    s.push(`<path d="M${f2(CX - lc)} ${f2(y - ts + 1.8)} L${CX} ${y - 2.2} L${f2(CX + lc)} ${f2(y + ts + 1.8)} L${f2(CX + lc)} ${f2(y + ts - 0.6)} L${CX} ${y - 4} L${f2(CX - lc)} ${f2(y - ts - 0.6)} Z" fill="url(#cblade)" stroke="#4a5470" stroke-width=".7" stroke-linejoin="round"/>`);
    s.push(`<rect x="130" y="${y - 3}" width="10" height="6" rx="2" fill="#6e7a93" stroke="#2b3350" stroke-width=".6"/>`);
  }
  // กรอบโถด้านหน้า + เงาแก้ว
  s.push(`<path d="M66 ${BOWL_TOP} H204 L198 207 Q198 211 194 211 H76 Q72 211 72 207 Z" fill="none" stroke="#5a6684" stroke-width="1.6" stroke-linejoin="round"/>`);
  s.push(`<rect x="72" y="106" width="5" height="96" rx="2.5" fill="#fff" opacity=".45"/>`);
  s.push(`<rect x="62" y="${BASE_TOP - 4}" width="146" height="6" rx="2" fill="#aab4c8" stroke="#2b3350" stroke-width=".8"/>`);

  // ฝา (ยกขึ้นได้) + แขนล็อกด้านขวา + แม่เหล็ก
  const ly = -v.lid * 18;
  s.push(`<g transform="translate(0 ${f2(ly)})"><g filter="url(#sh2)"><rect x="60" y="82" width="150" height="20" rx="7" fill="url(#clid)" stroke="#1d2338" stroke-width="1"/><rect x="64" y="85" width="142" height="3" rx="1.5" fill="#fff" opacity=".2"/><rect x="123" y="73" width="24" height="10" rx="4" fill="#4b5784" stroke="#1d2338" stroke-width=".8"/></g>`);
  s.push(`<rect x="205" y="98" width="6" height="${BASE_TOP - 98 - 2}" rx="2" fill="#c7cee0" stroke="#4a5470" stroke-width=".7"/><rect x="204" y="${BASE_TOP - 14}" width="8" height="10" rx="1.5" fill="#d94b4b" stroke="#7a1d1d" stroke-width=".7"/></g>`);
  return s.join("");
};

const SPEED = 15;
const mk = (o: Partial<V> = {}): V => ({ sp: 1, cut: 0, lid: 0, btn: 0, heat: 0, food: 1, ...o });

export const SCENE_CHOPPER: SceneDef = {
  focus: {
    all: { cx: 135, cy: 240, z: 1.0 },
    motor: { cx: 135, cy: 232, z: 1.35, box: [56, 212, 160, 64] },
    tip: { cx: 135, cy: 240, z: 1.0 },
    torque: { cx: 135, cy: 240, z: 1.0 },
    levels: { cx: 135, cy: 176, z: 1.3, label: "" },
    angle: { cx: 135, cy: 214, z: 1.0 },
    pulse: { cx: 135, cy: 240, z: 1.0 },
    hold: { cx: 135, cy: 240, z: 1.0 },
    lock: { cx: 135, cy: 232, z: 1.0 },
    dull: { cx: 135, cy: 240, z: 1.0 },
    smash: { cx: 135, cy: 240, z: 1.0 },
    bowl: { cx: 135, cy: 240, z: 1.0 },
    check: { cx: 135, cy: 240, z: 1.0 },
    end: { cx: 135, cy: 240, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const e = ease(p);
    const o: string[] = [DEFS, EXTRA, room(TABLE + 6)];
    const ang0 = ph * SPEED;

    if (cue === "tip") {
      // มุมมองจากด้านบน: ปลายใบมีดวิ่งเป็นวงกลม
      const R = 66, cy = 112, cx = CX;
      o.push(`<circle cx="${cx}" cy="${cy}" r="${R + 8}" fill="#eaf4fb" stroke="#5a6684" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="#f6efd6" opacity=".55" stroke="#9aa4ba" stroke-width="1" stroke-dasharray="3 2"/>`);
      const a = ang0 * 0.55;
      for (let k = 0; k < 2; k++) {
        const aa = a + k * Math.PI;
        o.push(`<path d="M${f2(cx)} ${f2(cy)} L${f2(cx + Math.cos(aa) * R)} ${f2(cy + Math.sin(aa) * R)}" stroke="url(#cblade)" stroke-width="7" stroke-linecap="round"/><path d="M${f2(cx)} ${f2(cy)} L${f2(cx + Math.cos(aa) * R)} ${f2(cy + Math.sin(aa) * R)}" stroke="#4a5470" stroke-width=".8" fill="none"/>`);
      }
      // รอยทางของปลายใบ (ลูกศรโค้ง)
      for (let k = 1; k <= 5; k++) {
        const aa = a - k * 0.16;
        o.push(`<circle cx="${f2(cx + Math.cos(aa) * R)}" cy="${f2(cy + Math.sin(aa) * R)}" r="${f2(3.6 - k * 0.5)}" fill="#ff5a2a" opacity="${f2(0.7 - k * 0.12)}"/>`);
      }
      o.push(`<circle cx="${f2(cx + Math.cos(a) * R)}" cy="${f2(cy + Math.sin(a) * R)}" r="4.2" fill="#ff3a1a" stroke="#fff" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="5" fill="#6e7a93" stroke="#2b3350" stroke-width="1"/>`);
      // รัศมี
      o.push(`<path d="M${cx} ${cy + 22} L${cx + 40} ${cy + 22}" stroke="#2b3350" stroke-width="1" marker-end="none"/><path d="M${cx} ${cy + 18} v8 M${cx + 40} ${cy + 18} v8" stroke="#2b3350" stroke-width="1"/>`);
      o.push(txt(cx + 20, cy + 35, "รัศมี ~4 ซม.", 6.2, "#2b3350"));
      o.push(pill(CX, 20, "ตัวอย่างคำนวณ: 10,000 รอบ/นาที", "middle", "#dfe6ff"));
      const q = ease(cl((p - 0.15) / 0.3));
      o.push(`<g opacity="${f2(q)}">` + pill(CX, 222, "ปลายใบมีด ≈ 42 เมตร/วินาที", "middle", "#ffe1c9") + `</g>`);
      const q2 = ease(cl((p - 0.45) / 0.3));
      o.push(`<g opacity="${f2(q2)}">` + pill(CX, 242, "≈ 150 กม./ชม. ในโถเล็กๆ", "middle", "#fff6c9") + `</g>`);
      o.push(box(undefined, ph));
      return o.join("");
    }

    let v = mk({ sp: 1, cut: 0.35 });
    let ang = ang0;
    let opt: Parameters<typeof machine>[3] = {};
    const ov: string[] = [];

    if (cue === "all" || cue === "end") {
      v = mk({ cut: ease(cl(p * 1.2)) });
    }
    if (cue === "motor") {
      v = mk({ cut: 0.4 });
      // ป้ายอธิบาย
      ov.push(pill(CX, 118, "หมุนหลักพัน–หมื่นรอบ/นาที", "middle", "#ffe1c9"));
      ov.push(pill(CX, 134, "โถไม่มีไฟฟ้า แค่ต่อแกน", "middle", "#dfe6ff"));
      ov.push(pill(CX, 160, "ขดลวด + โรเตอร์", "middle", "#fff6c9") + leader(CX, 164, CX - 12, 240));
      // แบตเตอรี่ (รุ่นชาร์จ USB)
      const bq = ease(cl((p - 0.35) / 0.3));
      ov.push(`<g opacity="${f2(bq)}"><rect x="69" y="238" width="24" height="16" rx="3" fill="#2f9e57" stroke="#1d5c34" stroke-width=".8"/><rect x="66" y="243" width="3" height="6" rx="1" fill="#1d5c34"/><path d="M80 242 l-3 6 h5 l-2 6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></g>`);
      ov.push(`<g opacity="${f2(bq)}">` + pill(CX, 178, "รุ่น USB: ใช้แบตเตอรี่แทนปลั๊ก", "middle", "#dff5e6") + leader(100, 182, 82, 240) + `</g>`);
    }
    if (cue === "torque") {
      const stall = ease(cl(p / 0.5));
      v = mk({ sp: lerp(1, 0.18, stall), cut: 0.05, food: 0.01 });
      ang = ph * SPEED * v.sp;
      opt = { carrot: 1, stall };
      // แผนภูมิแท่ง: กำลังเท่าเดิม หมุนเร็ว = แรงบิดน้อย
      ov.push(`<rect x="22" y="14" width="226" height="60" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.2" opacity=".97"/>`);
      ov.push(txt(CX, 27, "กำลังมอเตอร์เท่าเดิม", 6.6, "#b53a10", "middle", 900));
      ov.push(`<rect x="48" y="36" width="62" height="12" rx="3" fill="#ff8a3a" stroke="#2b3350" stroke-width=".8"/>` + txt(116, 45.5, "ความเร็ว สูง", 6, "#2b3350", "start"));
      ov.push(`<rect x="48" y="53" width="${f2(lerp(62, 22, 1))}" height="12" rx="3" fill="#4aa8ff" stroke="#2b3350" stroke-width=".8"/>` + txt(116, 62.5, "แรงบิด น้อย", 6, "#2b3350", "start"));
      ov.push(pill(CX, 126, "ชิ้นใหญ่ แข็ง = มอเตอร์ฝืน", "middle", "#ffe1c9"));
      if (stall > 0.5) ov.push(xmark(CX + 56, 196, 0.9));
    }
    if (cue === "levels") {
      v = mk({ cut: 0.55 });
      // แถบสีบอกชั้นที่ใบแต่ละใบกวาด
      const cols = ["#4aa8ff", "#2f9e57", "#ff8a3a"];
      const names = ["ใบล่าง", "ใบกลาง", "ใบบน"];
      const hi = Math.min(2, Math.floor(p * 3));
      opt = { hi };
      for (let i = 0; i < 3; i++) ov.push(`<rect x="66" y="${BLADE_Y[i] - 12}" width="138" height="24" fill="${cols[i]}" opacity="${f2(i === hi ? 0.28 : 0.1)}"/>`);
      for (let i = 0; i < 3; i++) ov.push(pill(50, BLADE_Y[i] + 3, names[i], "middle", i === hi ? "#fff6c9" : "#f1f1f1") + `<path d="M${66} ${BLADE_Y[i]} H${CX - L + 4}" stroke="#2b3350" stroke-width=".8" stroke-dasharray="2 1.5"/>`);
      ov.push(pill(CX, 128, "แต่ละใบกวาดคนละชั้นอาหาร", "middle", "#dfe6ff"));
    }
    if (cue === "angle") {
      v = mk({ cut: 0.5 });
      opt = { loop: true };
      // แผนภาพขยายหน้าตัดใบมีด: ใบบนดันลง ใบล่างดันขึ้น
      ov.push(`<rect x="12" y="12" width="246" height="62" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.2" opacity=".97"/>`);
      const wob = Math.sin(ph * 3) * 1.5;
      // ใบบน (ลาดด้านล่างของขอบหน้า)
      ov.push(`<path d="M44 26 H92 L100 34 H44 Z" fill="url(#cblade)" stroke="#4a5470" stroke-width=".9"/>`);
      ov.push(H.varrow(106, 34 + wob, "#ff5a2a", 1, 1));
      ov.push(txt(70, 48, "ใบบน ดันอาหารลง", 6, "#2b3350"));
      // ใบล่าง (ลาดด้านบนของขอบหน้า)
      ov.push(`<path d="M168 66 H216 L224 58 H168 Z" fill="url(#cblade)" stroke="#4a5470" stroke-width=".9"/>`);
      ov.push(H.varrow(240, 58 - wob, "#2f8fe0", 1, -1));
      ov.push(txt(196, 52, "ใบล่าง ดันขึ้น", 6, "#2b3350"));
      ov.push(pill(CX, 128, "อาหารวนผ่านใบมีดซ้ำๆ", "middle", "#dfe6ff"));
      // ลูกศรวนในโถ
      for (let k = 0; k < 4; k++) {
        const a = ph * 1.6 + k * 1.571;
        const ax = CX + Math.cos(a) * 50, ay = 168 + Math.sin(a) * 34;
        ov.push(`<circle cx="${f2(ax)}" cy="${f2(ay)}" r="2.2" fill="#ff5a2a" opacity=".85"/>`);
      }
    }
    if (cue === "pulse") {
      // กดสั้นๆ ทีละครั้ง: ปุ่มกด-ปล่อย สลับกัน อาหารตกลงมาระหว่างจังหวะ
      const N = 5;
      const u = (p * N) % 1;
      const on = u < 0.4;
      v = mk({ sp: on ? 1 : 0, cut: ease(p) * 0.9 + 0.05, btn: on ? 1 : 0 });
      ang = ph * SPEED * 0.9 + Math.floor(p * N) * 1.7;
      ov.push(`<rect x="12" y="12" width="246" height="58" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.2" opacity=".97"/>`);
      ov.push(txt(CX, 25, "กดสั้นๆ ทีละประมาณ 1 วินาที", 6.6, "#b53a10", "middle", 900));
      // คลื่นสี่เหลี่ยม
      let d = `M26 58`;
      for (let k = 0; k < N; k++) {
        const x0 = 26 + k * 44;
        d += ` H${x0 + 4} V38 H${f2(x0 + 4 + 44 * 0.4)} V58`;
      }
      d += ` H244`;
      ov.push(`<path d="${d}" fill="none" stroke="#2b3350" stroke-width="1.4"/>`);
      const cxm = 26 + p * 218;
      ov.push(`<path d="M${f2(cxm)} 33 V62" stroke="${on ? "#d94b4b" : "#9aa4ba"}" stroke-width="1.6"/><circle cx="${f2(cxm)}" cy="${on ? 38 : 58}" r="2.6" fill="${on ? "#d94b4b" : "#9aa4ba"}"/>`);
      ov.push(pill(CX, 128, on ? "กด: ใบมีดหมุนเต็มสปีด" : "ปล่อย: อาหารตกลงมา", "middle", on ? "#ffe1c9" : "#dfe6ff"));
    }
    if (cue === "hold") {
      // กดค้าง: ก้นโถเละ ข้างบนยังเป็นชิ้น มอเตอร์ร้อนจนตัดไฟ
      const cutoff = p > 0.66;
      const heat = cutoff ? lerp(1, 0.55, ease(cl((p - 0.66) / 0.3))) : ease(p / 0.66);
      v = mk({ sp: cutoff ? 0 : 1, cut: 0.2, btn: cutoff ? 0 : 1, heat, food: 1.2 });
      opt = { paste: lerp(2, 30, ease(cl(p / 0.55))) };
      ang = ph * SPEED;
      // เทอร์โมมิเตอร์ข้างฐาน
      const tx = 240, ty0 = 120, ty1 = 262;
      ov.push(`<rect x="${tx - 3.5}" y="${ty0}" width="7" height="${ty1 - ty0}" rx="3.5" fill="#fff" stroke="#2b3350" stroke-width="1"/>`);
      const lv = ty1 - (ty1 - ty0 - 6) * cl(heat);
      ov.push(`<rect x="${tx - 2}" y="${f2(lv)}" width="4" height="${f2(ty1 - lv + 4)}" rx="2" fill="#d94b4b"/><circle cx="${tx}" cy="${ty1 + 6}" r="7" fill="#d94b4b" stroke="#2b3350" stroke-width="1"/>`);
      ov.push(txt(tx, ty0 - 6, "มอเตอร์", 5.6, "#46526b"));
      ov.push(pill(CX, 42, cutoff ? "ตัวป้องกันความร้อนตัดไฟ" : "กดค้าง: ล่างเละ บนยังเป็นชิ้น", "middle", cutoff ? "#ffe1c9" : "#fff6c9"));
      if (cutoff) ov.push(pill(CX, 58, "รอเย็น ~15–30 นาที (ตามคู่มือ)", "middle", "#dfe6ff") + xmark(CX + 82, 240, 0.95));
    }
    if (cue === "lock") {
      // ฝาไม่เข้าที่ = วงจรขาด; ฝาล็อก = วงจรต่อ
      const lift = p < 0.32 ? 1 : p < 0.55 ? 1 - ease((p - 0.32) / 0.23) : 0;
      const closed = lift < 0.02;
      v = mk({ sp: closed && p > 0.62 ? 1 : 0, lid: lift, cut: 0.4 });
      ang = ph * SPEED;
      // แผนภาพวงจร: ปลั๊ก — สวิตช์ — มอเตอร์
      ov.push(`<rect x="12" y="8" width="246" height="46" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.2" opacity=".97"/>`);
      ov.push(`<path d="M30 34 H78 M110 34 H160 M182 34 H236" stroke="#2b3350" stroke-width="1.6" fill="none"/>`);
      ov.push(`<circle cx="30" cy="34" r="3" fill="#2b3350"/><circle cx="236" cy="34" r="3" fill="#2b3350"/>`);
      // สวิตช์ (เปิด/ปิดตามฝา)
      ov.push(`<circle cx="94" cy="34" r="2.4" fill="#2b3350"/><path d="M94 34 L${closed ? 112 : 108} ${closed ? 34 : 24}" stroke="${closed ? "#2f9e57" : "#d94b4b"}" stroke-width="2" stroke-linecap="round"/><circle cx="112" cy="34" r="2.4" fill="#2b3350"/>`);
      ov.push(`<circle cx="171" cy="34" r="10" fill="#fff" stroke="#2b3350" stroke-width="1.4"/>` + txt(171, 37.2, "M", 9, "#2b3350", "middle", 900));
      ov.push(txt(94, 49, "สวิตช์ในฐาน", 5.4, "#46526b") + txt(171, 49, "มอเตอร์", 5.4, "#46526b"));
      if (closed) for (let k = 0; k < 6; k++) { const u = (ph * 0.8 + k / 6) % 1; ov.push(`<circle cx="${f2(30 + u * 206)}" cy="34" r="2" fill="#ffc83a" stroke="#b58900" stroke-width=".5"/>`); }
      // ป้ายสถานะ
      const lyy = -lift * 18;
      ov.push(closed ? pill(CX, 122, "ฝาล็อกเข้าที่ = วงจรต่อ", "middle", "#dff5e6") : pill(CX, 122, "ฝาไม่เข้าที่ = วงจรขาด", "middle", "#ffe1c9"));
      ov.push(closed ? tick(CX + 84, 119, 1) : xmark(CX + 84, 119, 1));
      // ตัวกดที่แขนฝา ชี้จุดสัมผัส
      ov.push(pill(236, 190, "แขนล็อกฝา", "end", "#fff6c9") + leader(214, 187, 208, 207));
    }
    if (cue === "dull") {
      // ภาพขยายหน้าตัดขอบใบมีด: คม → มน
      v = mk({ sp: 0, cut: 0.3 });
      const r = lerp(0.6, 7.5, e);
      ov.push(`<rect x="0" y="0" width="270" height="${TABLE + 4}" fill="#fff6e4" opacity=".98"/>`);
      const ty = 120;
      // ลำตัวใบมีด (ลิ่ม) ปลายขวา
      const tipx = 222;
      ov.push(`<path d="M30 ${ty - 26} L${tipx - r - 6} ${ty - r * 0.9} Q${tipx + r} ${ty} ${tipx - r - 6} ${ty + r * 0.9} L30 ${ty + 26} Z" fill="url(#cblade)" stroke="#4a5470" stroke-width="1.4" stroke-linejoin="round"/>`);
      ov.push(`<path d="M${tipx - 26} ${ty - 6} L${tipx - 8} ${ty - 1.2}" stroke="#fff" stroke-width="1.2" opacity=".6" fill="none"/>`);
      ov.push(txt(CX, 30, e < 0.5 ? "ขอบใบมีด (ขยาย): คม" : "ขอบใบมีด (ขยาย): มน", 7, e < 0.5 ? "#2f9e57" : "#d94b4b", "middle", 900));
      // สิ่งที่ทำให้สึก
      const hits = ["แข็ง", "เกลือ", "กรด"];
      for (let k = 0; k < 3; k++) {
        const u = (ph * 0.7 + k / 3) % 1;
        const hx = 250 - u * 28, hy = ty - 40 + k * 40 + Math.sin(ph * 5 + k) * 2;
        ov.push(`<g opacity="${f2(Math.sin(Math.PI * u))}">` + pill(hx - 4, hy + 2, hits[k], "middle", k === 2 ? "#ffe1c9" : "#fff6c9") + `</g>`);
      }
      ov.push(pill(CX, 196, "ใช้ไปนานๆ ขอบสึก/บิ่น", "middle", "#dfe6ff"));
      ov.push(pill(CX, 214, "ตัดของแข็งสึกเร็วกว่า", "middle", "#fff6c9"));
      o.push(ov.join(""));
      return o.join("");
    }
    if (cue === "smash") {
      // ซ้าย: ใบคม ตัดผ่านเรียบ — ขวา: ใบทื่อ ทุบเซลล์ให้แตก
      o.push(`<rect x="0" y="0" width="270" height="${TABLE + 4}" fill="#fff6e4" opacity=".98"/>`);
      o.push(`<path d="M135 20 V250" stroke="#9aa4ba" stroke-width="1" stroke-dasharray="3 2"/>`);
      const t = ease(cl(p / 0.75));
      for (let side = 0; side < 2; side++) {
        const cx0 = side === 0 ? 68 : 202; // กึ่งกลางแต่ละฝั่ง
        const dull = side === 1;
        const by = lerp(70, 196, t);
        // เซลล์ 3 แถว x 3 คอลัมน์
        for (let rr = 0; rr < 3; rr++) {
          for (let cc = 0; cc < 3; cc++) {
            const x = cx0 - 36 + cc * 24, y = 150 + rr * 22;
            const near = Math.abs(cc - 1) <= 1 && by + 10 > y;
            const crush = dull && by + 6 > y;
            const kk = crush ? 1 : 0;
            const w = crush ? 22 - 5 * (1 - cc % 2) : 20;
            const sep = !dull && by + 10 > y ? (cc - 1) * 3 : 0;
            ov.push(`<rect x="${f2(x - w / 2 + sep)}" y="${f2(y - (crush ? 6 : 9) )}" width="${f2(w)}" height="${crush ? 12 : 18}" rx="${crush ? 3 : 7}" fill="${crush ? "#f3dca0" : "#f6efd6"}" stroke="${crush ? "#c98a2a" : "#bba878"}" stroke-width=".9" ${crush ? `transform="rotate(${f2((cc - 1) * 6 + rr * 3)} ${f2(x)} ${f2(y)})"` : ""}/>`);
            if (crush && near && t > 0.7) ov.push(`<circle cx="${f2(x + Math.sin(ph * 4 + cc + rr) * 5)}" cy="${f2(y + 11 + ((ph * 12 + cc * 5) % 10))}" r="1.6" fill="#7cc4f5" opacity=".9"/>`);
          }
        }
        // ใบมีด (ลิ่มชี้ลง)
        const r = dull ? 6 : 0.7;
        ov.push(`<path d="M${cx0 - 24} ${f2(by - 56)} L${f2(cx0 - r)} ${f2(by - r * 0.9)} Q${cx0} ${f2(by + r)} ${f2(cx0 + r)} ${f2(by - r * 0.9)} L${cx0 + 24} ${f2(by - 56)} Z" fill="url(#cblade)" stroke="#4a5470" stroke-width="1.2" stroke-linejoin="round"/>`);
        ov.push(pill(cx0, 26, dull ? "ใบมีดทื่อ" : "ใบมีดคม", "middle", dull ? "#ffe1c9" : "#dff5e6"));
      }
      ov.push(pill(68, 232, "ตัดผ่านเรียบ", "middle", "#dff5e6"));
      ov.push(pill(202, 232, "ทุบ เซลล์แตก ช้ำ", "middle", "#ffe1c9"));
      ov.push(pill(CX, 252, "ทื่อ = ทุบ ใช้เวลานานขึ้น", "middle", "#fff6c9"));
      o.push(ov.join(""));
      return o.join("");
    }
    if (cue === "bowl") {
      v = mk({ sp: 0, cut: 0.5 });
      const sc = ease(p);
      // รอยขีดข่วนในโถ
      for (let i = 0; i < 16; i++) {
        if (i / 16 > sc) break;
        const x = 78 + rnd(i + 5) * 110, y = 112 + rnd(i + 25) * 88, l = 8 + rnd(i + 50) * 14, a = rnd(i + 70) * 3.14;
        ov.push(`<path d="M${f2(x)} ${f2(y)} l${f2(Math.cos(a) * l)} ${f2(Math.sin(a) * l)}" stroke="#7a8499" stroke-width=".9" opacity=".8"/>`);
      }
      ov.push(`<path d="M66 ${BOWL_TOP} H204 L198 207 Q198 211 194 211 H76 Q72 211 72 207 Z" fill="#c9d1de" opacity="${f2(0.4 * sc)}"/>`);
      ov.push(pill(CX, 128, "ขีดข่วนสะสม → โถขุ่น", "middle", "#fff6c9") + leader(104, 134, 92, 160));
      // ซีลยางที่ข้อต่อแกน
      const sq = ease(cl((p - 0.45) / 0.35));
      ov.push(`<ellipse cx="${CX}" cy="${BASE_TOP + 2}" rx="${f2(lerp(10, 11, sq))}" ry="2.6" fill="${mixc("#1d2338", "#6b5a3a", sq)}" stroke="#000" stroke-width=".6"/>`);
      if (sq > 0.4) {
        ov.push(`<path d="M127 ${BASE_TOP + 1} l3 2 l2 -2 l3 3" fill="none" stroke="#fff" stroke-width=".8"/>`);
        for (let k = 0; k < 3; k++) { const u = (ph * 0.9 + k / 3) % 1; ov.push(`<circle cx="${f2(CX - 6 + k * 6)}" cy="${f2(BASE_TOP + 4 + u * 12)}" r="1.4" fill="#7cc4f5" opacity="${f2(sq * (1 - u))}"/>`); }
      }
      ov.push(pill(228, 192, "ยางซีลแห้ง แตก รั่ว", "end", "#ffe1c9") + leader(172, 192, CX + 8, BASE_TOP + 3));
    }
    if (cue === "check") {
      o.push(`<rect x="0" y="0" width="270" height="${TABLE + 4}" fill="#fff6e4" opacity=".98"/>`);
      ov.push(pill(CX, 26, "ลองดูตอนบดกระเทียม", "middle", "#fff6c9"));
      // จานซ้าย: สับสะอาด / จานขวา: เละมีน้ำ
      for (let side = 0; side < 2; side++) {
        const cx0 = side === 0 ? 68 : 202;
        ov.push(`<ellipse cx="${cx0}" cy="150" rx="56" ry="38" fill="#fff" stroke="#2b3350" stroke-width="1.4"/><ellipse cx="${cx0}" cy="150" rx="46" ry="30" fill="#f5f1ea" stroke="#d3cbb8" stroke-width=".8"/>`);
        if (side === 0) {
          for (let i = 0; i < 40; i++) {
            const a = rnd(i + 1) * 6.28, rr = Math.sqrt(rnd(i + 11)) * 36;
            ov.push(`<rect x="${f2(cx0 + Math.cos(a) * rr)}" y="${f2(150 + Math.sin(a) * rr * 0.62)}" width="${f2(2.2 + rnd(i + 3))}" height="${f2(2.2 + rnd(i + 5))}" rx=".6" fill="#f6efd6" stroke="#bba878" stroke-width=".5"/>`);
          }
        } else {
          ov.push(`<path d="M${cx0 - 38} 152 Q${cx0 - 34} 130 ${cx0 - 6} 128 Q${cx0 + 30} 124 ${cx0 + 38} 150 Q${cx0 + 30} 172 ${cx0 - 4} 172 Q${cx0 - 34} 172 ${cx0 - 38} 152 Z" fill="#e3d79b" stroke="#c9bb74" stroke-width="1"/>`);
          ov.push(`<ellipse cx="${cx0 + 4}" cy="168" rx="26" ry="3.5" fill="#bfe3f7" opacity=".85"/>`);
          for (let i = 0; i < 6; i++) ov.push(`<circle cx="${f2(cx0 - 20 + i * 8)}" cy="${f2(146 + rnd(i + 4) * 12)}" r="1.2" fill="#c9bb74"/>`);
        }
      }
      ov.push(pill(68, 206, "ร่วนเป็นเม็ดเล็ก", "middle", "#dff5e6") + tick(68, 188, 1));
      ov.push(pill(202, 206, "เละ มีน้ำออก", "middle", "#ffe1c9") + xmark(202, 188, 1));
      ov.push(pill(CX, 232, "ต้องกดหลายรอบ = ใบมีดเริ่มทื่อ", "middle", "#dfe6ff"));
      o.push(ov.join(""));
      return o.join("");
    }

    o.push(machine(ph, ang, v, opt));
    o.push(ov.join(""));
    if (cue === "all" || cue === "end") o.push(pill(CX, 56, cue === "end" ? "ดูข้างในของใช้ ยังไงนะ" : "ข้างในเครื่องบดสับไฟฟ้า", "middle", "#fff6c9"));
    o.push(box(SCENE_CHOPPER.focus[cue]?.box, ph));
    return o.join("");
  },
};
