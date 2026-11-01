// ฉากอธิบาย: เครื่องซีลถุงมินิ — กดปุ่ม กระแสไหลผ่านลวดความร้อน → ลวดร้อน → พลาสติกชั้นในของถุงละลาย → สายโมเลกุลปนกัน → เย็นแล้วแข็งติดกัน; ลวดเสื่อมจากร้อน-เย็นซ้ำ — SVG พิกัด 270x480
// สองมุมมอง: ด้านหน้า (วงจร+ลวดทั้งแนว) และหน้าตัดขยาย (ลวดกลม + ฟิล์มสองชั้น + สายโมเลกุล)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, along, plen, room, DEFS: HDEFS } = H;
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
const wireCol = (T: number) => (T < 0.5 ? mixc("#8a93a6", "#c0392b", T / 0.5) : T < 0.85 ? mixc("#c0392b", "#ff9a3d", (T - 0.5) / 0.35) : mixc("#ff9a3d", "#fff1b0", (T - 0.85) / 0.15));

const EXTRA = `<defs>
<linearGradient id="bsh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8604f"/><stop offset=".3" stop-color="#ff9a8a"/><stop offset=".75" stop-color="#e2705e"/><stop offset="1" stop-color="#a8402f"/></linearGradient>
<linearGradient id="bsin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3350"/><stop offset="1" stop-color="#1a2038"/></linearGradient>
<linearGradient id="bsbag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfeaff" stop-opacity=".9"/><stop offset=".5" stop-color="#f4fbff" stop-opacity=".85"/><stop offset="1" stop-color="#b8dcf6" stop-opacity=".9"/></linearGradient>
<radialGradient id="bsheat" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff1b0" stop-opacity=".95"/><stop offset=".4" stop-color="#ff9a3d" stop-opacity=".6"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>
</defs>`;

// ================= มุมมองด้านหน้า =================
const LOOP: Pt[] = [[120, 82], [134, 82], [148, 82], [210, 82], [210, 104], [62, 104], [62, 82], [76, 82]];
const LL = plen(LOOP);
type FP = { press: number; T: number; seal: number; thin: number; snap: number; flow: number; hot?: number };
const front = (ph: number, P: FP) => {
  const o: string[] = [];
  const wc = wireCol(P.T);
  // ถุง (ส่วนตัวถุงห้อยลงมา)
  o.push(`<path d="M38 112 H232 V252 Q232 266 218 266 H52 Q38 266 38 252 Z" fill="url(#bsbag)" stroke="#7fb4e8" stroke-width="1.2"/>`);
  for (let i = 0; i < 7; i++) o.push(`<circle cx="${f2(62 + (i % 4) * 44 + rnd(i) * 6)}" cy="${f2(190 + Math.floor(i / 4) * 40 + rnd(i + 3) * 8)}" r="${f2(10 + rnd(i + 9) * 4)}" fill="#ffcf5a" stroke="#c4902a" stroke-width="1" opacity=".9"/>`);
  o.push(`<path d="M44 124 H226" stroke="#fff" stroke-width="1" opacity=".5"/>`);
  // ขากรรไกรล่าง
  o.push(`<rect x="46" y="116" width="178" height="12" rx="4" fill="#3a4466" stroke="#10162c" stroke-width="1"/>`);
  // แนวซีลบนปากถุง
  const sealW = 148 * P.seal;
  if (P.seal > 0.01) o.push(`<rect x="62" y="108" width="${f2(sealW)}" height="7" fill="#fff" opacity=".95" stroke="#9ec5e0" stroke-width=".6"/>` + Array.from({ length: Math.floor(sealW / 6) }, (_, i) => `<path d="M${64 + i * 6} 108 l3 7" stroke="#9ec5e0" stroke-width=".6"/>`).join(""));
  if (P.snap > 0.5) o.push(`<rect x="132" y="106" width="16" height="11" fill="#cfeaff" opacity=".98"/><path d="M132 106 v11 M148 106 v11" stroke="#ff5a4a" stroke-width=".9" stroke-dasharray="2 1.5"/>`);
  // ตัวเครื่อง (ขากรรไกรบน) + แบตเตอรี่ + ปุ่ม
  const pr = P.press * 3;
  o.push(`<g transform="translate(0 ${f2(pr)})">`);
  o.push(`<rect x="46" y="50" width="178" height="56" rx="12" fill="url(#bsh)" stroke="#6e2a20" stroke-width="1.6"/><rect x="52" y="58" width="166" height="42" rx="7" fill="url(#bsin)"/>`);
  o.push(`<rect x="76" y="66" width="44" height="32" rx="4" fill="#26324d" stroke="#6bf29a" stroke-width="1"/><rect x="80" y="70" width="${f2(36 * (0.85 - 0.0))}" height="24" rx="2" fill="#2fbf6a"/>${txt(98, 84, "แบต", 6, "#0d3a20", "middle", 800)}`);
  o.push(`<rect x="120" y="77" width="3" height="10" fill="#cfd6e3"/><rect x="73" y="77" width="3" height="10" fill="#cfd6e3"/>`);
  // ปุ่ม
  o.push(`<rect x="134" y="${f2(40 + P.press * 3)}" width="14" height="10" rx="3" fill="#ffe14a" stroke="#7a5a00" stroke-width="1"/><path d="M141 52 V${f2(72 + P.press * 6)}" stroke="#9aa6bd" stroke-width="2"/>`);
  o.push(`<circle cx="134" cy="82" r="2.2" fill="#cfd6e3"/><circle cx="148" cy="82" r="2.2" fill="#cfd6e3"/>`);
  o.push(`<g transform="rotate(${f2(lerp(-32, 0, P.press))} 134 82)"><rect x="133" y="80.8" width="15" height="2.4" rx="1" fill="#f4f6fa" stroke="#2b3350" stroke-width=".6"/></g>`);
  // สายไฟในเครื่อง
  const W = (a: Pt[]) => `<polyline points="${a.map((q) => q.join(",")).join(" ")}" fill="none" stroke="#e2c36a" stroke-width="1.8" stroke-linejoin="round"/>`;
  o.push(W([[120, 82], [134, 82]]), W([[148, 82], [210, 82], [210, 104]]), W([[62, 104], [62, 82], [76, 82]]));
  // ลวดความร้อน
  const hot = P.hot ?? 1;
  if (P.T > 0.1) o.push(`<rect x="58" y="94" width="156" height="22" rx="10" fill="url(#bsheat)" opacity="${f2(P.T * 0.8)}"/>`);
  let wd = "";
  const segs: [number, number][] = P.snap > 0.5 ? [[62, 132], [148, 210]] : [[62, 210]];
  for (const [a, b] of segs) {
    let d = `M${a} 104`;
    for (let x = a; x <= b; x += 4) {
      const th = P.thin * Math.exp(-(((x - 135) / 14) ** 2));
      d += ` L${x} ${f2(104 + (rnd(x) - 0.5) * 0.6 * (1 + th))}`;
    }
    wd += `<path d="${d}" fill="none" stroke="${P.thin > 0.02 ? mixc(wc, "#3a2a1a", P.thin * 0.4) : wc}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  o.push(wd);
  if (P.thin > 0.02) {
    // คราบพลาสติกเกาะ + จุดบางลง
    for (let i = 0; i < 6; i++) o.push(`<circle cx="${f2(80 + rnd(i) * 120)}" cy="105.5" r="${f2(0.8 + P.thin * 1.4 * rnd(i + 2))}" fill="#5a3a1c" opacity="${f2(P.thin)}"/>`);
    o.push(`<ellipse cx="135" cy="104" rx="14" ry="${f2(1.2 + 3 * P.thin * (0.5 + 0.5 * Math.sin(ph * 5)) * P.T)}" fill="#ffd14a" opacity="${f2(0.2 + 0.7 * P.thin * P.T)}"/>`);
  }
  if (P.snap > 0.5) for (let i = 0; i < 5; i++) { const u = (ph * 4 + i * 0.2) % 1, a = rnd(i + Math.floor(ph * 4)) * 6.28; o.push(`<path d="M139 104 l${f2(Math.cos(a) * 7 * u)} ${f2(Math.sin(a) * 7 * u)}" stroke="#ffe14a" stroke-width="1.2" opacity="${f2(1 - u)}"/>`); }
  o.push(`</g>`);
  // กระแสไฟ
  if (P.flow > 0.01 && P.snap < 0.5) for (let i = 0; i < 12; i++) {
    const q = along(LOOP, ((ph * 0.6 + i / 12) % 1) * LL);
    o.push(`<g transform="translate(0 ${f2(pr)})"><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="3.4" fill="#ffd14a" opacity="${f2(0.3 * P.flow)}"/><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="1.6" fill="#fff8d6" opacity="${f2(P.flow)}"/></g>`);
  }
  if (P.snap > 0.5) for (let i = 0; i < 5; i++) { const q = along([[120, 82], [134, 82], [148, 82], [210, 82], [210, 104], [148, 104]], ((ph * 0.6 + i / 5) % 1) * 160); o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1] + pr)}" r="1.6" fill="#fff8d6"/>`); }
  return o.join("");
};

// ================= มุมมองหน้าตัด =================
const SY = 128; // กลางลวด
const sectionBase = (ph: number, S: { press: number; T: number; melt: number; cool: number; sag?: number; gap?: number; lab?: boolean }) => {
  const o: string[] = [];
  const pr = S.press * 5;
  const wcol = wireCol(S.T);
  // ขากรรไกรล่าง (ยางรอง)
  o.push(`<rect x="40" y="152" width="190" height="26" rx="5" fill="#3a4466" stroke="#10162c" stroke-width="1.2"/>${S.lab === false ? "" : txt(135, 170, "ยางรอง", 6, "#9fb0e8", "middle", 700)}`);
  // ฟิล์ม 2 ชั้น (วาดเกินจริง)
  const g = S.gap || 0, sag = S.sag || 0;
  const heatL = 108, heatR = 162;
  const layer = (y: number, h: number, col: string, flip: number) => {
    let d = `M30 ${y}`;
    for (let x = 30; x <= 240; x += 3) { const e = Math.exp(-(((x - 135) / 34) ** 2)); d += ` L${x} ${f2(y + sag * e * 6 + flip * g * 1.6 * Math.sin(x * 0.12 + ph * 3))}`; }
    for (let x = 240; x >= 30; x -= 3) { const e = Math.exp(-(((x - 135) / 34) ** 2)); d += ` L${x} ${f2(y + h + sag * e * 6 + flip * g * 1.6 * Math.sin(x * 0.12 + ph * 3))}`; }
    return `<path d="${d} Z" fill="${col}" stroke="#2b3350" stroke-width=".6"/>`;
  };
  const yo1 = 136, yi1 = 139, yi2 = 143, yo2 = 147;
  o.push(layer(yo1 + (g > 0 ? -g * 2 : 0), 3, "#8fa6e8", -1));
  o.push(layer(yi1 + (g > 0 ? -g * 1 : 0), 4, "#eaf6ff", -1));
  o.push(layer(yi2 + (g > 0 ? g * 1 : 0), 4, "#dff3ea", 1));
  o.push(layer(yo2 + (g > 0 ? g * 2 : 0), 3, "#8fa6e8", 1));
  o.push(txt(246, 138, "ฟิล์มนอก", 5.2, "#2b3350", "end", 700), txt(246, 146, "", 5, "#2b3350"));
  // โซนหลอม
  if (S.melt > 0.02) {
    const hcol = mixc("#ffb76a", "#cfe8ff", S.cool);
    let d = `M${heatL} ${yi1 + 0.5}`;
    for (let x = heatL; x <= heatR; x += 2) d += ` L${x} ${f2(yi1 + 0.5 - S.melt * (1.2 + 0.8 * Math.sin(x * 0.3 + ph * 4) * (1 - S.cool)))}`;
    for (let x = heatR; x >= heatL; x -= 2) d += ` L${x} ${f2(yi2 + 3.5 + S.melt * (1.2 + 0.8 * Math.sin(x * 0.3 + ph * 4 + 2) * (1 - S.cool)))}`;
    o.push(`<path d="${d} Z" fill="${hcol}" opacity="${f2(Math.min(1, S.melt * 1.2))}" stroke="${hcol}" stroke-width=".4"/>`);
  }
  // ขากรรไกรบน + ลวด (หน้าตัด)
  o.push(`<g transform="translate(0 ${f2(pr * 0.5)})">`);
  o.push(`<rect x="40" y="98" width="190" height="26" rx="5" fill="url(#bsh)" stroke="#6e2a20" stroke-width="1.2"/>${S.lab === false ? "" : txt(135, 114, "ขากรรไกรบน", 6, "#fff", "middle", 700)}`);
  o.push(`<rect x="112" y="124" width="46" height="4" fill="#3a4466"/>`);
  o.push(`<circle cx="135" cy="${SY + 1}" r="${f2(9 + 9 * S.T)}" fill="url(#bsheat)" opacity="${f2(S.T)}"/>`);
  o.push(`<circle cx="135" cy="${SY + 1}" r="5.4" fill="${wcol}" stroke="#2b3350" stroke-width="1"/>`);
  o.push(`</g>`);
  // ลูกศรความร้อนลงไปในฟิล์ม
  if (S.T > 0.5) for (let i = 0; i < 4; i++) { const u = (ph * 0.9 + i / 4) % 1; o.push(`<path d="M${f2(124 + i * 7)} ${f2(134 + u * 7)} v4" stroke="#ff9a3d" stroke-width="1.2" opacity="${f2(Math.sin(Math.PI * u) * S.T)}"/>`); }
  return o.join("");
};

// สายโมเลกุล
const chains = (ph: number, mix: number, frozen: number) => {
  const o: string[] = [];
  o.push(`<rect x="108" y="130" width="54" height="24" rx="3" fill="#10192b" opacity=".92"/>`);
  o.push(`<path d="M108 141.5 H162" stroke="#ffe14a" stroke-width=".6" stroke-dasharray="2 2" opacity="${f2(1 - mix)}"/>`);
  for (let c = 0; c < 12; c++) {
    const top = c % 2 === 0, d = top ? 1 : -1, x0 = 112 + (c >> 1) * 8.5 + rnd(c) * 3;
    const y0 = top ? 133 : 151;
    let path = `M${f2(x0)} ${f2(y0)}`;
    let x = x0, y = y0;
    for (let k = 1; k <= 7; k++) {
      const jit = (1 - frozen) * 0.9 * Math.sin(ph * 3 + c * 1.7 + k);
      x += (rnd(c * 9 + k) - 0.5) * 6 + jit;
      y += d * (1.35 + 1.9 * mix) + (rnd(c * 5 + k + 1) - 0.5) * 1.2 + jit * 0.5;
      path += ` L${f2(x)} ${f2(y)}`;
    }
    o.push(`<path d="${path}" fill="none" stroke="${top ? "#5fa8ff" : "#6bf29a"}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`);
  }
  return o.join("");
};

const stackFilm = (x: number, y: number, kind: "pe" | "paper", melt: number, ph: number) => {
  const o: string[] = [];
  const col1 = kind === "pe" ? "#8fa6e8" : "#b98a55", col2 = kind === "pe" ? "#eaf6ff" : "#c79a64";
  o.push(`<rect x="${x}" y="${y}" width="76" height="5" fill="${col1}" stroke="#2b3350" stroke-width=".6"/>`);
  o.push(`<rect x="${x}" y="${y + 5}" width="76" height="6" fill="${kind === "pe" ? mixc(col2, "#ffb76a", melt) : col2}" stroke="#2b3350" stroke-width=".6"/>`);
  o.push(`<rect x="${x}" y="${y + 11}" width="76" height="6" fill="${kind === "pe" ? mixc("#dff3ea", "#ffb76a", melt) : col2}" stroke="#2b3350" stroke-width=".6"/>`);
  o.push(`<rect x="${x}" y="${y + 17}" width="76" height="5" fill="${col1}" stroke="#2b3350" stroke-width=".6"/>`);
  if (kind === "pe" && melt > 0.6) o.push(`<rect x="${x + 1}" y="${y + 6}" width="74" height="10" fill="#ffb76a" opacity="${f2((melt - 0.6) * 1.8)}"/>`);
  return o.join("");
};

const Z = (x: number, y: number, z: number, box?: [number, number, number, number], label?: string) => ({ cx: x, cy: y + 90 / z, z, box, label });
export const SCENE_BAGSEALER: SceneDef = {
  focus: {
    all: { ...Z(135, 165, 1.2) },
    plastic: { ...Z(135, 142, 1.5) },
    but: { ...Z(135, 142, 1.8) },
    wire: { ...Z(135, 100, 1.6, [58, 98, 156, 12]) },
    heat: { ...Z(135, 100, 1.45) },
    melt: { ...Z(135, 138, 3.2) },
    fuse: { ...Z(135, 141, 4.8, [108, 130, 54, 24]) },
    time: { ...Z(135, 140, 1.0) },
    cool: { ...Z(135, 138, 2.4) },
    limit: { ...Z(135, 140, 1.0) },
    wear: { ...Z(135, 100, 1.6) },
    snap: { ...Z(135, 150, 1.5) },
    chk: { ...Z(135, 105, 1.7) },
    end: { ...Z(135, 165, 1.2) },
  },
  render: ({ frame, cue, p, ef }) => {
    const ph = frame / 30, lt = ef / 30;
    const o: string[] = [HDEFS, EXTRA, room(302)];
    const F = SCENE_BAGSEALER.focus[cue] || SCENE_BAGSEALER.focus.all;
    const TY = F.cy - 240 / F.z + 12;
    const secCues = ["plastic", "but", "melt", "fuse", "time", "cool", "limit"];
    if (secCues.includes(cue)) {
      o.push(`<rect x="14" y="${cue === "time" || cue === "limit" ? 40 : 60}" width="242" height="${cue === "time" || cue === "limit" ? 190 : 140}" rx="12" fill="#0f1730" opacity="1"/>`);
      if (cue === "plastic") {
        const T = 0.5 + 0.5 * Math.sin(lt * 1.9 - 1.2);
        const col = mixc("#7fb4ff", "#ff9a5a", T);
        let d = `M50 150`; for (let x = 50; x <= 220; x += 4) d += ` L${x} ${f2(150 + T * 16 * Math.sin(((x - 50) / 170) * Math.PI))}`;
        o.push(`<path d="${d}" fill="none" stroke="#2b3350" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="6.4" stroke-linecap="round"/>`);
        o.push(`<rect x="44" y="140" width="6" height="30" fill="#6b7a96"/><rect x="220" y="140" width="6" height="30" fill="#6b7a96"/>`);
        o.push(`<rect x="232" y="${f2(176 - 60 * T)}" width="8" height="${f2(60 * T)}" rx="3" fill="${col}" stroke="#2b3350" stroke-width=".8"/>`);
        o.push(pill(135, TY + 4, T > 0.5 ? "ร้อน → อ่อนตัว" : "เย็น → แข็งกลับ", T > 0.5 ? "#ffd9c0" : "#d3e4ff"));
      }
      if (cue === "but") {
        o.push(sectionBase(ph, { press: 0, T: 0, melt: 0, cool: 0, gap: 1 }));
        for (let i = 0; i < 3; i++) o.push(txt(100 + i * 36, 128 - Math.abs(Math.sin(ph * 3 + i)) * 4, "?", 13, "#ff5a4a", "middle", 900));
        o.push(pill(135, TY + 4, "แนบกันเฉยๆ ไม่ติด", "#ffe0d8"));
      }
      if (cue === "melt") {
        const T = sm(0, 0.3, p), melt = sm(0.25, 0.95, p);
        o.push(sectionBase(ph, { press: 1, T, melt, cool: 0, lab: false }));
        o.push(pill(135, TY + 4, melt < 0.4 ? "ความร้อนซึมผ่านฟิล์มนอก" : "ชั้นในอ่อนตัวและละลาย", "#ffe9b0"));
      }
      if (cue === "fuse") {
        const mix = sm(0.05, 0.9, p), fr = sm(0.6, 0.95, p);
        o.push(sectionBase(ph, { press: 1, T: 0.6 * (1 - fr), melt: 1, cool: fr, lab: false }));
        o.push(chains(ph, mix, fr));
        o.push(pill(135, TY + 4, fr > 0.5 ? "เย็นแล้วแข็ง เป็นเนื้อเดียว" : "สายโมเลกุลปนกัน", "#d8ffe3"));
      }
      if (cue === "time") {
        const sc = sm(0, 1, p);
        const items: [string, string, number, string][] = [["ร้อนสั้นไป", "ไม่แน่น", 0, "#ffe0d8"], ["พอดี", "ติดแน่น", 1, "#d8ffe3"], ["ร้อนนานไป", "ทะลุเป็นรู", 2, "#ffd0c4"]];
        items.forEach(([t, r, k], i) => {
          const x = 24 + i * 78, y = 100;
          o.push(`<rect x="${x}" y="${y - 18}" width="72" height="104" rx="8" fill="#fff" opacity=".92" stroke="#2b3350" stroke-width=".8"/>`);
          o.push(txt(x + 36, y - 6, t, 6.6, "#2b3350", "middle", 800));
          o.push(`<rect x="${x + 6}" y="${y + 52}" width="60" height="12" rx="3" fill="#e4e9f2" stroke="#2b3350" stroke-width=".6"/><rect x="${x + 6}" y="${y + 52}" width="${f2(60 * [0.25, 0.55, 1][i] * sc)}" height="12" rx="3" fill="#ff9a3d"/>`);
          const mel = k === 0 ? 0.2 : 1;
          o.push(stackFilm(x - 2 + 0, y + 6, "pe", mel * sc, ph).replace(/width="76"/g, 'width="72"'));
          if (k === 2 && sc > 0.5) o.push(`<ellipse cx="${x + 36}" cy="${y + 17}" rx="${f2(8 * (sc - 0.4))}" ry="${f2(6 * (sc - 0.4))}" fill="#0f1730" stroke="#2b3350" stroke-width=".8"/>`);
          if (k === 0) o.push(`<path d="M${x + 4} ${y + 17} h64" stroke="#ff5a4a" stroke-width=".9" stroke-dasharray="2 2"/>`);
          o.push(pill(x + 36, y + 80, r, items[i][3]));
        });
        o.push(pill(135, TY + 16, "เวลาที่ไฟผ่านลวด สำคัญ", "#fff6c9"));
      }
      if (cue === "cool") {
        const cool = sm(0.05, 0.85, p);
        o.push(sectionBase(ph, { press: 1 - 0.0, T: 0.55 * (1 - cool), melt: 1, cool, lab: false }));
        o.push(pill(135, TY + 4, cool < 0.8 ? "หยุดจ่ายไฟ → รอให้เย็น" : "เย็นแล้ว ค่อยดึง", cool < 0.8 ? "#d3e4ff" : "#d8ffe3"));
        if (cool < 0.5) o.push(`<path d="M${f2(60)} 160 V138 M55 146 l5 -8 l5 8" stroke="#ff5a4a" stroke-width="1.8" fill="none" opacity=".0"/>`);
        o.push(`<g transform="translate(222 76)"><circle r="9" fill="#fff" stroke="#2b3350" stroke-width="1"/><path d="M0 0 V-6.5 M0 0 L${f2(Math.sin(cool * 6.28) * 5.5)} ${f2(-Math.cos(cool * 6.28) * 5.5)}" stroke="#ff5a4a" stroke-width="1.3"/></g>`);
      }
      if (cue === "limit") {
        const melt = sm(0.1, 0.8, p);
        o.push(txt(70, 62, "ถุงผิวในเป็น PE", 7.2, "#fff", "middle", 800), txt(200, 62, "ถุงกระดาษธรรมดา", 7.2, "#fff", "middle", 800));
        o.push(stackFilm(32, 100, "pe", melt, ph), stackFilm(162, 100, "paper", melt, ph));
        for (const x of [70, 200]) o.push(`<circle cx="${x}" cy="94" r="${f2(9 + 6 * melt)}" fill="url(#bsheat)" opacity="${f2(melt)}"/>`);
        o.push(pill(70, 150, "ละลายแล้วติดกัน ✓", "#d8ffe3"), pill(200, 150, "ไม่ละลาย ไม่ติด ✕", "#ffd0c4"));
        o.push(pill(135, TY + 16, "ต้องเป็นพลาสติกที่ละลายได้", "#fff6c9"));
      }
    } else {
      // ----- มุมมองด้านหน้า -----
      let P: FP = { press: 0, T: 0, seal: 0, thin: 0, snap: 0, flow: 0 };
      if (cue === "all" || cue === "end") {
        const tt = (ph % 4.2);
        const on = tt > 0.7 && tt < 2.4;
        P = { press: on ? 1 : 0, T: on ? cl((tt - 0.7) / 0.7) : cl(1 - (tt - 2.4) / 1.2) * (tt > 2.4 ? 0.7 : 0), seal: cl((tt - 1.0) / 1.4), thin: 0, snap: 0, flow: on ? 1 : 0 };
        if (tt < 0.7) P.seal = 0;
      } else if (cue === "wire") { P = { press: 0, T: 0, seal: 0, thin: 0, snap: 0, flow: 0 }; }
      else if (cue === "heat") { const T = sm(0.05, 0.6, p); P = { press: 1, T, seal: 0, thin: 0, snap: 0, flow: 1 }; }
      else if (cue === "wear") { const th = sm(0.05, 0.95, p) * 0.9, tt = (ph * 0.8) % 1; P = { press: tt < 0.55 ? 1 : 0, T: tt < 0.55 ? 0.9 : 0.25, seal: 0, thin: th, snap: 0, flow: tt < 0.55 ? 1 : 0 }; }
      else if (cue === "snap") { const tt = (ph * 0.5) % 1; P = { press: 1, T: 0.8, seal: 0.0, thin: 0.9, snap: 1, flow: 1 }; P.seal = 1; void tt; }
      else if (cue === "chk") { P = { press: 0, T: 0, seal: 0, thin: 0.7, snap: 0, flow: 0 }; }
      o.push(front(ph, P));
      if (cue === "all" || cue === "end") o.push(pill(135, TY + 6, "กดปุ่ม → ลวดร้อน → ถุงติดกัน"));
      if (cue === "wire") {
        o.push(pill(135, TY + 6, "ลวดความร้อนเส้นบางๆ", "#fff6c9"));
        o.push(pill(135, 150, "มักเป็นโลหะผสม นิกเกิลโครเมียม", "#ffeec2"));
      }
      if (cue === "heat") o.push(pill(135, TY + 6, "ลวดต้านกระแส → ไฟกลายเป็นความร้อน", "#ffe9b0"));
      if (cue === "wear") {
        o.push(pill(135, TY + 6, "ร้อน-เย็นสลับซ้ำทุกครั้งที่กด", "#fff6c9"));
        o.push(pill(135, 150, `กดไปแล้ว ${Math.round(sm(0.05, 0.95, p) * 800)} ครั้ง`, "#ffeec2"));
      }
      if (cue === "snap") {
        o.push(pill(135, TY + 6, "ลวดขาด ความร้อนไม่ทั่วแนว", "#ffd0c4"));
        o.push(`<path d="M140 126 V134 M135 130 l5 7 l5 -7" stroke="#ff5a4a" stroke-width="1.6" fill="none"/>`);
        o.push(pill(140, 150, "ช่วงนี้ไม่ติด", "#ffd0c4"));
      }
      if (cue === "chk") {
        const mx = 60 + ((ph * 0.28) % 1) * 150;
        o.push(`<circle cx="${f2(mx)}" cy="104" r="14" fill="none" stroke="#ffe14a" stroke-width="2"/><path d="M${f2(mx + 10)} 114 l9 9" stroke="#ffe14a" stroke-width="3" stroke-linecap="round"/>`);
        o.push(pill(135, TY + 6, "ลวดบางหรือขาดตรงไหนไหม?"));
      }
    }
    o.push(H.box(F.box, ph));
    return o.join("");
  },
};
