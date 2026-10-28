// ฉากเตาแม่เหล็กไฟฟ้า (induction cooker) — ตัดครึ่งด้านข้าง พิกัด 270x480
// ที่มาของข้อเท็จจริงดู docs/facts-induction.md
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, tube, dot, box, DEFS, room, plen, along, rpath } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const TAU = Math.PI * 2;
const FONT = "Kanit, sans-serif";

const T = (x: number, y: number, s: string, size = 6.5, fill = "#fff", anchor = "middle", stroke = "#0b1226") =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" font-family="${FONT}" font-weight="700" text-anchor="${anchor}" stroke="${stroke}" stroke-width="${f2(size * 0.3)}" paint-order="stroke" stroke-linejoin="round">${s}</text>`;

const EXTRA = `<defs>
<radialGradient id="in_lens" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#27407a"/><stop offset="1" stop-color="#0b1226"/></radialGradient>
<linearGradient id="in_top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d4b8"/><stop offset="1" stop-color="#b9a47f"/></linearGradient>
<linearGradient id="in_cab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c7650"/><stop offset="1" stop-color="#6d4d30"/></linearGradient>
<linearGradient id="in_pot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8c97ad"/><stop offset=".25" stop-color="#e9edf4"/><stop offset=".6" stop-color="#b0b9ca"/><stop offset="1" stop-color="#737f97"/></linearGradient>
<linearGradient id="in_cu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc58a"/><stop offset=".5" stop-color="#e08a3c"/><stop offset="1" stop-color="#8a4a1c"/></linearGradient>
<linearGradient id="in_fe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a8294"/><stop offset="1" stop-color="#4a5163"/></linearGradient>
<linearGradient id="in_wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6684"/><stop offset="1" stop-color="#394464"/></linearGradient>
<radialGradient id="in_disk" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#eef2f8"/><stop offset="1" stop-color="#8c97ad"/></radialGradient>
</defs>`;

// สถานะความร้อนของก้นหม้อ (h) และความแรงของสนามแม่เหล็ก (f) ต่อ cue: [เริ่ม, จบ]
const ST: Record<string, { h: [number, number]; f: [number, number]; cur: number }> = {
  all: { h: [0, 0], f: [0, 0], cur: 0 },
  coil: { h: [0, 0], f: [0, 0], cur: 1 },
  field: { h: [0, 0], f: [0, 1], cur: 1 },
  eddy: { h: [0, 0.7], f: [1, 1], cur: 1 },
  hyst: { h: [0.7, 0.8], f: [1, 1], cur: 1 },
  magnet: { h: [0.8, 0.8], f: [1, 1], cur: 1 },
  glass: { h: [0.9, 0.9], f: [1, 1], cur: 1 },
  fan: { h: [0.9, 0.9], f: [0.3, 0.3], cur: 1 },
  nopan: { h: [0, 0], f: [0, 0], cur: 0 },
  freq: { h: [0.5, 0.5], f: [0.7, 0.7], cur: 1 },
  eff: { h: [0.6, 0.6], f: [0.7, 0.7], cur: 1 },
  tip: { h: [0.8, 0.8], f: [1, 1], cur: 1 },
  end: { h: [0.4, 0.4], f: [0.5, 0.5], cur: 0.6 },
};

// ----- ตำแหน่งชิ้นส่วน -----
const GY = 250; // ผิวกระจก
const CX = 135;
const COIL_Y = 264;
const WIN_L = Array.from({ length: 6 }, (_, i) => 66 + i * 6.6);
const WIN_R = WIN_L.map((x) => 2 * CX - x);
// วงสนามแม่เหล็ก: [xi (ออฟเซ็ตในรูกลางขดลวด), xo (ออฟเซ็ตนอกขดลวด), yTop (ในก้นหม้อ), yBot (ผ่านเฟอร์ไรต์)]
const LOOPS: [number, number, number, number][] = [
  [30, 76, 248.4, 276.5],
  [22, 86, 247, 278],
  [12, 94, 245.6, 279.5],
];
const loopPts = (s: number, L: [number, number, number, number]): Pt[] => {
  const [xi, xo, yt, yb] = L;
  const mid = (yt + yb) / 2;
  return [[CX + s * xi, mid], [CX + s * xi, yt], [CX + s * xo, yt], [CX + s * xo, yb], [CX + s * xi, yb], [CX + s * xi, mid]];
};
const AIR: Pt[] = [[52, 302], [110, 306], [150, 306], [190, 300], [250, 290]];
const AIR_L = plen(AIR);
const LOOP_WIRE: Pt[] = [[204, 264], [212, 268], [212, 328], [58, 328], [58, 268], [66, 264]];
const WIRE_L = plen(LOOP_WIRE);

const symb = (x: number, y: number, out: boolean, r: number, fill: string, ink = "#fff") =>
  `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="${fill}" stroke="#2a1608" stroke-width=".5"/>` +
  (out
    ? `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r * 0.34)}" fill="${ink}"/>`
    : `<path d="M${f2(x - r * 0.5)} ${f2(y - r * 0.5)} L${f2(x + r * 0.5)} ${f2(y + r * 0.5)} M${f2(x + r * 0.5)} ${f2(y - r * 0.5)} L${f2(x - r * 0.5)} ${f2(y + r * 0.5)}" stroke="${ink}" stroke-width="${f2(r * 0.3)}" stroke-linecap="round"/>`);

const arrowHead = (pts: Pt[], d: number, sgn: number, c: string, s: number, a: number) => {
  const p0 = along(pts, d - 0.8), p1 = along(pts, d + 0.8), q = along(pts, d);
  let ang = (Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180) / Math.PI;
  if (sgn < 0) ang += 180;
  return `<path d="M${s} 0 L${f2(-s * 0.6)} ${f2(-s * 0.62)} L${f2(-s * 0.6)} ${f2(s * 0.62)}Z" fill="${c}" opacity="${f2(a)}" transform="translate(${f2(q[0])} ${f2(q[1])}) rotate(${f2(ang)})"/>`;
};

const lens = (LX: number, LY: number, LR: number, inner: string) =>
  `<circle cx="${LX}" cy="${LY}" r="${LR + 3}" fill="#ffe14a" opacity=".9"/><circle cx="${LX}" cy="${LY}" r="${LR}" fill="url(#in_lens)"/><clipPath id="in_lc"><circle cx="${LX}" cy="${LY}" r="${LR - 1}"/></clipPath><g clip-path="url(#in_lc)">${inner}</g><path d="M${LX - LR * 0.68} ${LY - LR * 0.68} A${LR * 0.95} ${LR * 0.95} 0 0 1 ${LX} ${LY - LR * 0.95}" fill="none" stroke="#fff" stroke-width="2" opacity=".25" stroke-linecap="round"/>`;

const steam = (x: number, y: number, ph: number, n: number, a: number, spread = 10) => {
  let o = "";
  for (let i = 0; i < n; i++) {
    const u = (ph * 0.45 + i / n) % 1;
    o += `<circle cx="${f2(x + Math.sin(u * 6 + i * 2) * spread * u)}" cy="${f2(y - u * 40)}" r="${f2(3 + u * 6)}" fill="#fff" opacity="${f2(Math.sin(Math.PI * u) * 0.4 * a)}" filter="url(#bl)"/>`;
  }
  return o;
};

export const SCENE_INDUCTION: SceneDef = {
  focus: {
    all: { cx: 135, cy: 255, z: 1.0 },
    coil: { cx: 135, cy: 262, z: 1.8, box: [60, 256, 150, 18], label: "ขดลวด" },
    field: { cx: 135, cy: 245, z: 1.7, box: [40, 240, 190, 42], label: "สนามแม่เหล็กสลับทิศ" },
    eddy: { cx: 135, cy: 165, z: 1.6, box: [40, 242, 190, 10], label: "กระแสไหลวน" },
    hyst: { cx: 135, cy: 165, z: 1.6, box: [40, 242, 190, 10], label: "แม่เหล็กจิ๋วในเนื้อโลหะ" },
    magnet: { cx: 135, cy: 120, z: 1.25, box: [36, 14, 198, 142], label: "ทดสอบด้วยแม่เหล็ก" },
    glass: { cx: 135, cy: 240, z: 2.0, box: [14, 248, 242, 8], label: "กระจกหน้าเตา" },
    fan: { cx: 70, cy: 300, z: 2.3, box: [20, 282, 34, 34], label: "พัดลมระบายความร้อน" },
    nopan: { cx: 135, cy: 235, z: 1.55, box: [90, 238, 90, 14], label: "ไม่มีหม้อ ไม่ทำงาน" },
    freq: { cx: 135, cy: 140, z: 1.3, box: [36, 14, 198, 142], label: "ไฟบ้านเทียบกับในเตา" },
    eff: { cx: 135, cy: 140, z: 1.3, box: [36, 14, 198, 142], label: "พลังงานที่ถึงหม้อ" },
    tip: { cx: 135, cy: 225, z: 1.4, box: [40, 244, 190, 8], label: "วางตรงกลางวง" },
    end: { cx: 135, cy: 255, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const st = ST[cue] || ST.all;
    const e = ease(p);
    const heat = lerp(st.h[0], st.h[1], e);
    const fld = lerp(st.f[0], st.f[1], e);
    const cur = st.cur;
    const E = Math.sin(ph * 6); // กระแสสลับ (ภาพช้ากว่าจริงมากเพื่อให้มองทัน)
    const Ei = -Math.cos(ph * 6); // อินทิกรัลของ E: ตำแหน่งอนุภาคที่แกว่งไปมา
    const sgn = E >= 0 ? 1 : -1;
    const noPan = cue === "nopan";
    const o: string[] = [DEFS, EXTRA, room(452)];

    // ---------- เคาน์เตอร์ + ตู้ ----------
    o.push(`<rect x="-140" y="336" width="550" height="12" fill="url(#in_top)"/><rect x="-140" y="348" width="550" height="110" fill="url(#in_cab)"/><rect x="-140" y="348" width="550" height="2" fill="#4c3320" opacity=".5"/>`);
    o.push(`<rect x="10" y="362" width="116" height="76" rx="3" fill="none" stroke="#573a22" stroke-width="1.2" opacity=".6"/><rect x="144" y="362" width="116" height="76" rx="3" fill="none" stroke="#573a22" stroke-width="1.2" opacity=".6"/>`);
    o.push(`<ellipse cx="135" cy="337" rx="128" ry="4.5" fill="#1b1008" opacity=".4" filter="url(#bl)"/>`);
    // สายไฟเข้าเครื่อง
    o.push(tube([[256, 312], [264, 312], [268, 330], [300, 333]], 3, "#3a3f52", "#8e99b0", 3));

    // ---------- ตัวเครื่อง (ตัดครึ่ง) ----------
    o.push(`<g filter="url(#sh)"><rect x="14" y="250" width="242" height="86" rx="8" fill="url(#in_wall)" stroke="#1d2338" stroke-width="1.2"/></g>`);
    o.push(`<rect x="20" y="254" width="230" height="76" rx="3" fill="#1b2138"/>`);
    // ช่องระบายอากาศ ซ้าย/ขวา
    for (let i = 0; i < 4; i++) o.push(`<rect x="14" y="${291 + i * 6}" width="6" height="3" rx="1" fill="#0b1226"/>`);
    for (let i = 0; i < 4; i++) o.push(`<rect x="250" y="${277 + i * 6}" width="6" height="3" rx="1" fill="#0b1226"/>`);

    // เฟอร์ไรต์ใต้ขดลวด + แผ่นรองขดลวด
    o.push(`<rect x="60" y="270" width="150" height="3" rx="1.5" fill="#d8d3c0"/>`);
    for (const x of [66, 84, 102, 120, 138, 156, 174, 192]) o.push(`<rect x="${x}" y="275" width="12" height="6" rx="1.5" fill="url(#in_fe)" stroke="#2b3350" stroke-width=".5"/>`);

    // แผงวงจร
    o.push(`<rect x="62" y="322" width="142" height="5" rx="1.5" fill="#1f6b4f" stroke="#0e3a2a" stroke-width=".6"/>`);
    o.push(`<rect x="70" y="306" width="9" height="16" rx="2" fill="#2f6fd0" stroke="#173e7a" stroke-width=".5"/><rect x="70" y="306" width="9" height="3" rx="1.5" fill="#cfd6e4"/>`);
    o.push(`<rect x="82" y="308" width="9" height="14" rx="2" fill="#2f6fd0" stroke="#173e7a" stroke-width=".5"/><rect x="82" y="308" width="9" height="3" rx="1.5" fill="#cfd6e4"/>`);
    o.push(`<rect x="94" y="311" width="11" height="11" rx="2" fill="#d9a441" stroke="#8a6414" stroke-width=".5"/>`);
    o.push(`<ellipse cx="121" cy="315" rx="9" ry="7" fill="#39425e" stroke="#1d2338" stroke-width=".5"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M${112 + i * 3.6} 309 q2 6 0 12" stroke="#e08a3c" stroke-width="1.5" fill="none"/>`).join(""));
    o.push(`<rect x="130" y="302" width="17" height="20" rx="2" fill="#222a42" stroke="#0b1226" stroke-width=".6"/><rect x="132" y="304" width="13" height="3" fill="#8e99b0" opacity=".5"/>`);
    // ฮีตซิงก์
    o.push(`<rect x="150" y="318" width="38" height="4" fill="#9aa6bd"/>`);
    for (let i = 0; i < 7; i++) o.push(`<rect x="${152 + i * 5.2}" y="294" width="2.2" height="25" rx="1" fill="${mixc("#c8d0de", "#ff9a5a", heat * 0.45)}"/>`);
    o.push(`<rect x="190" y="310" width="8" height="12" rx="2" fill="#3a3f52"/>`);

    // สายจากแผงวงจรไปขดลวด
    o.push(tube(LOOP_WIRE.slice(0, 4), 2.2, "#c7773a", "#ffd2a0", 3).replace(/opacity="\.92"/, 'opacity=".7"'));
    o.push(tube(LOOP_WIRE.slice(3), 2.2, "#c7773a", "#ffd2a0", 3).replace(/opacity="\.92"/, 'opacity=".7"'));
    if (cur > 0) {
      for (let i = 0; i < 9; i++) {
        const u = (((i + 0.5) / 9 + 0.07 * Ei) % 1 + 1) % 1;
        o.push(dot(along(LOOP_WIRE, u * WIRE_L), 1.5, "#ffe14a").replace(/opacity="\.26"/, `opacity="${f2(0.3 * cur)}"`));
      }
    }

    // ขดลวด (หน้าตัด)
    const glowC = cur * (0.25 + 0.75 * Math.abs(E));
    for (let i = 0; i < 6; i++) {
      for (const [x, left] of [[WIN_L[i], true], [WIN_R[i], false]] as [number, boolean][]) {
        const out = left ? E >= 0 : E < 0;
        o.push(`<circle cx="${f2(x)}" cy="${COIL_Y}" r="6" fill="#ffd24a" opacity="${f2(0.28 * glowC)}" filter="url(#bl)"/>`);
        if (cur > 0.05) o.push(symb(x, COIL_Y, out, 3.1, "url(#in_cu)"));
        else o.push(`<circle cx="${f2(x)}" cy="${COIL_Y}" r="3.1" fill="url(#in_cu)" stroke="#2a1608" stroke-width=".5"/>`);
      }
    }

    // ---------- กระจกหน้าเตา ----------
    const glassHeat = noPan ? 0 : heat * (cue === "glass" ? 1 : 0.7);
    o.push(`<rect x="14" y="${GY}" width="242" height="4.5" rx="2" fill="#6d84a0" stroke="#cfe3f5" stroke-width=".5"/>`);
    if (glassHeat > 0.02) o.push(`<rect x="40" y="${GY}" width="190" height="4.5" fill="#ff8a3a" opacity="${f2(0.5 * glassHeat)}"/>`);
    o.push(`<rect x="16" y="${GY + 0.4}" width="238" height="1" rx=".5" fill="#fff" opacity=".35"/>`);
    // วงบอกตำแหน่งบนผิวกระจก
    o.push(`<ellipse cx="${CX}" cy="${GY - 0.6}" rx="75" ry="2.2" fill="none" stroke="#fff" stroke-width=".8" opacity=".55"/>`);

    // ---------- หม้อ ----------
    const dx = cue === "tip" ? lerp(36, 0, e) : 0;
    if (!noPan) {
      const wy = 208 + Math.sin(ph * 3) * 0.6;
      const base = mixc("#8c97ad", "#ff5a1a", heat);
      o.push(`<g transform="translate(${f2(dx)} 0)">`);
      o.push(`<rect x="44" y="182" width="182" height="62" fill="#dfe6f1"/><rect x="44" y="182" width="182" height="9" fill="#c4cde0" opacity=".8"/>`);
      o.push(`<rect x="44" y="${f2(wy)}" width="182" height="${f2(244 - wy)}" fill="${mixc("#58b8f8", "#8ec8ff", heat * 0.5)}" opacity=".9"/>`);
      let wd = `M44 ${f2(wy)}`;
      for (let x = 44; x <= 226; x += 3) wd += ` L${x} ${f2(wy + 1.1 * Math.sin(x * 0.3 + ph * 4))}`;
      o.push(`<path d="${wd}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".75"/>`);
      // ฟองและการไหลวนของน้ำ
      if (heat > 0.45) {
        for (let i = 0; i < 12; i++) {
          const u = (ph * (0.6 + rnd(i) * 0.7) + rnd(i + 9)) % 1;
          o.push(`<circle cx="${f2(52 + rnd(i + 33) * 166)}" cy="${f2(242 - u * (242 - wy))}" r="${f2(1 + rnd(i + 5) * 1.6)}" fill="#fff" opacity="${f2(0.7 * (1 - u * 0.5) * cl(heat * 1.4 - 0.3))}" stroke="#bfe3ff" stroke-width=".3"/>`);
        }
      }
      if (heat > 0.65) o.push(steam(135, 176, ph, 5, cl(heat * 1.3 - 0.5), 14));
      // ผนังหม้อ + ก้นหม้อ
      o.push(`<rect x="40" y="180" width="5" height="70" fill="url(#in_pot)" stroke="#6e7a93" stroke-width=".7"/><rect x="225" y="180" width="5" height="70" fill="url(#in_pot)" stroke="#6e7a93" stroke-width=".7"/>`);
      o.push(`<rect x="37" y="178" width="11" height="3.4" rx="1.7" fill="#c8d0de" stroke="#6e7a93" stroke-width=".5"/><rect x="222" y="178" width="11" height="3.4" rx="1.7" fill="#c8d0de" stroke="#6e7a93" stroke-width=".5"/>`);
      o.push(`<rect x="40" y="244" width="190" height="6" rx="1.2" fill="${base}" stroke="#4b5878" stroke-width=".7"/>`);
      if (heat > 0.05) o.push(`<rect x="46" y="243" width="178" height="8" fill="#ff7a2a" opacity="${f2(0.5 * heat)}" filter="url(#bl)"/>`);
      // ด้ามจับ
      o.push(`<path d="M230 188 L264 184" stroke="#26180f" stroke-width="5.6" stroke-linecap="round"/><path d="M230 187.5 L264 183.6" stroke="#6b4a33" stroke-width="2.2" stroke-linecap="round"/><rect x="228" y="183" width="5" height="12" rx="1.5" fill="#8e99b0" stroke="#6e7a93" stroke-width=".5"/>`);
      o.push(`</g>`);
    } else {
      // ช้อนวางบนกระจก (ไม่ใช่หม้อ)
      o.push(`<g transform="translate(135 ${GY - 3.4}) scale(1.4)"><ellipse cx="-12" cy="0" rx="7" ry="2.2" fill="#c8d0de" stroke="#6e7a93" stroke-width=".6"/><rect x="-6" y="-1" width="30" height="2" rx="1" fill="#c8d0de" stroke="#6e7a93" stroke-width=".5"/></g>`);
    }

    // ---------- สนามแม่เหล็ก ----------
    const fa = fld * (0.3 + 0.7 * Math.abs(E));
    if (fld > 0.02 && !noPan) {
      for (const s of [1, -1]) {
        LOOPS.forEach((L, k) => {
          const pts = loopPts(s, L);
          const len = plen(pts);
          const d = rpath(pts, 5);
          o.push(`<path d="${d}" fill="none" stroke="#46c8ff" stroke-width="3.4" opacity="${f2(0.16 * fa)}" filter="url(#bl)"/><path d="${d}" fill="none" stroke="#7fe0ff" stroke-width="1.1" opacity="${f2(0.9 * fld * (0.45 + 0.55 * Math.abs(E)))}"/>`);
          const n = 6;
          for (let i = 0; i < n; i++) {
            const u = ((i / n + 0.045 * Ei * (1 + k * 0.1)) % 1 + 1) % 1;
            o.push(dot(along(pts, u * len), 1.2, "#bff0ff").replace(/opacity="\.26"/, `opacity="${f2(0.3 * fld)}"`));
          }
          // หัวลูกศรกลับทิศตามกระแส: ขึ้นกลางขดลวดเมื่อ E>0
          const h1 = (pts[0][1] - pts[1][1]) * 0.5; // ครึ่งช่วงแนวตั้งฝั่งใน
          o.push(arrowHead(pts, h1, sgn, "#e6fbff", 3.4, fld * (0.5 + 0.5 * Math.abs(E))));
          const topMid = (pts[0][1] - pts[1][1]) + Math.abs(pts[2][0] - pts[1][0]) * 0.5;
          o.push(arrowHead(pts, topMid, sgn, "#e6fbff", 3.4, fld * (0.5 + 0.5 * Math.abs(E))));
        });
      }
      // สนามรั่วเมื่อหม้อเยื้องศูนย์
      if (cue === "tip" && dx > 0.5) {
        const a = cl(dx / 36) * 0.85;
        for (let k = 0; k < 3; k++) {
          const x0 = 104 - k * 14, x1 = x0 - 46, ya = GY - 40 - k * 10;
          const d = `M${x0} ${GY - 1} Q${f2((x0 + x1) / 2)} ${ya - 20} ${x1} ${GY - 1}`;
          o.push(`<path d="${d}" fill="none" stroke="#ff6a6a" stroke-width="1.7" stroke-dasharray="4 3" stroke-dashoffset="${f2(-ph * 14)}" opacity="${f2(a * (0.5 + 0.5 * Math.abs(E)))}"/>`);
        }
        o.push(T(78, 196, "สนามรั่วออกมา", 6.5, "#ff9a9a"));
      }
    }

    // ---------- สัญลักษณ์กระแสไหลวนในก้นหม้อ (หน้าตัด) ----------
    if (!noPan && fld > 0.5 && heat > 0.02 && cue !== "tip") {
      for (const r of [22, 52, 82]) {
        o.push(symb(CX + dx + r, 247, E < 0, 2.4, "#ff6a2a"));
        o.push(symb(CX + dx - r, 247, E >= 0, 2.4, "#ff6a2a"));
      }
    }

    // ---------- พัดลม ----------
    const FX = 36, FY = 299;
    const fanSpin = ph * 10;
    o.push(`<circle cx="${FX}" cy="${FY}" r="16.5" fill="#39425e" stroke="#0b1226" stroke-width=".8"/><circle cx="${FX}" cy="${FY}" r="14.5" fill="#222a42"/>`);
    for (let i = 0; i < 7; i++) o.push(`<ellipse cx="${FX + 8}" cy="${FY}" rx="7.5" ry="3" fill="#aab5ca" stroke="#6e7a93" stroke-width=".4" transform="rotate(${f2((fanSpin * 180) / Math.PI + i * (360 / 7))} ${FX} ${FY}) rotate(18 ${FX + 8} ${FY})"/>`);
    o.push(`<circle cx="${FX}" cy="${FY}" r="4" fill="#4b5878" stroke="#0b1226" stroke-width=".6"/><circle cx="${FX}" cy="${FY}" r="1.4" fill="#cfd6e4"/>`);
    // ลมระบายความร้อน
    const airOn = cue === "fan" ? 1 : cue === "all" || cue === "coil" || cue === "nopan" ? 0.25 : 0.5;
    for (let i = 0; i < 14; i++) {
      const u = ((ph * 0.4 + i / 14) % 1);
      const q = along(AIR, u * AIR_L);
      const ac = mixc("#7fd8ff", "#ff9a5a", cl((u - 0.35) * 2.2));
      o.push(`<g opacity="${f2(airOn)}"><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="3.4" fill="${ac}" opacity=".25"/><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="1.5" fill="${ac}"/></g>`);
    }
    if (cue === "fan") {
      o.push(`<path d="${rpath(AIR, 6)}" fill="none" stroke="#7fd8ff" stroke-width="2.6" stroke-dasharray="6 5" stroke-dashoffset="${f2(-ph * 30)}" opacity=".45"/>`);
      o.push(`<path d="M8 299 H24" stroke="#7fd8ff" stroke-width="1.6" stroke-dasharray="4 3" stroke-dashoffset="${f2(-ph * 24)}"/><path d="M26 296 l-4 3 l4 3" fill="none" stroke="#7fd8ff" stroke-width="1.4"/>`);
      o.push(T(36, 337.5, "ลมเย็นเข้า", 5.6, "#9fe3ff"));
      o.push(T(222, 272, "ลมอุ่นออก", 5.6, "#ffc08a"));
      o.push(T(168, 290, "แผงวงจร", 5.6, "#cfd6e4"));
    }

    // ---------- วงกลมขยาย / แผงอธิบายของแต่ละ cue ----------
    const LX = 135, LY = 92, LR = 44;
    if (cue === "eddy") {
      let inn = `<circle cx="${LX}" cy="${LY}" r="40" fill="${mixc("#c4cddd", "#ff7a3a", heat * 0.75)}" stroke="#4b5878" stroke-width="1.4"/><circle cx="${LX}" cy="${LY}" r="40" fill="url(#in_disk)" opacity=".35"/>`;
      inn += `<circle cx="${LX}" cy="${LY}" r="4" fill="#4b5878" opacity=".25"/>`;
      [10, 19, 28, 36].forEach((r, j) => {
        const ca = 0.4 + 0.6 * Math.abs(E);
        inn += `<circle cx="${LX}" cy="${LY}" r="${r}" fill="none" stroke="#ff4a1a" stroke-width="4" opacity="${f2(0.18 * ca)}" filter="url(#bl)"/><circle cx="${LX}" cy="${LY}" r="${r}" fill="none" stroke="#c4300a" stroke-width="1.7" opacity="${f2(0.9 * ca)}"/>`;
        const n = 3 + j * 2;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + Ei * 1.1 * (1 - j * 0.1);
          inn += dot([LX + r * Math.cos(a), LY + r * Math.sin(a)], 1.7, "#ffe14a");
        }
        for (let i = 0; i < 2; i++) {
          const a = i * Math.PI + 0.7 + j * 0.5;
          const tx = -Math.sin(a) * sgn, ty = Math.cos(a) * sgn;
          const ang = (Math.atan2(ty, tx) * 180) / Math.PI;
          inn += `<path d="M3.6 0 L-2.2 -2.4 L-2.2 2.4Z" fill="#fff" stroke="#c4300a" stroke-width=".5" transform="translate(${f2(LX + r * Math.cos(a))} ${f2(LY + r * Math.sin(a))}) rotate(${f2(ang)})"/>`;
        }
      });
      o.push(lens(LX, LY, LR, inn));
      o.push(T(LX, LY + LR + 12, "มองก้นหม้อจากด้านบน", 6.4, "#ffe14a"));
      o.push(`<path d="M${LX - 30} ${LY + LR + 3} Q 70 190 64 243" fill="none" stroke="#ffe14a" stroke-width="1.2" stroke-dasharray="3 3" opacity=".8"/><circle cx="64" cy="244" r="2.2" fill="#ffe14a"/>`);
    }
    if (cue === "hyst") {
      let inn = "";
      const flip = Math.tanh(3 * E); // -1..1 หน่วงการกลับทิศ
      const gl = 1 - Math.abs(flip);
      for (let gx = -2; gx <= 2; gx++) for (let gy = -2; gy <= 2; gy++) {
        const x = LX + gx * 15, y = LY + gy * 13 - 4;
        if (Math.hypot(x - LX, y - LY) > 38) continue;
        const k = gx * 7 + gy * 3;
        const ang = 90 - 90 * flip + (rnd(k + 20) - 0.5) * 24 * gl + Math.sin(ph * 30 + k) * 5 * heat;
        inn += `<circle cx="${x}" cy="${y}" r="9" fill="#ff6a2a" opacity="${f2(0.4 * gl * heat + 0.07)}" filter="url(#bl)"/>`;
        inn += `<g transform="translate(${x} ${y}) rotate(${f2(-ang + 90)})"><rect x="-5" y="-1.9" width="5" height="3.8" rx="1" fill="#4a8cff"/><rect x="0" y="-1.9" width="5" height="3.8" rx="1" fill="#ff4d4d"/></g>`;
      }
      inn += `<g opacity="${f2(0.5 + 0.5 * Math.abs(flip))}" transform="translate(${LX} ${LY + 32}) scale(${f2(flip >= 0 ? 1 : -1)} 1)"><path d="M-24 0 H18" stroke="#7fe0ff" stroke-width="2"/><path d="M24 0 L16 -4 V4Z" fill="#7fe0ff"/></g>`;
      o.push(lens(LX, LY, LR, inn));
      o.push(T(LX, LY + LR + 12, "สนามสลับ ทำให้แม่เหล็กจิ๋วกลับขั้วไปมา", 5.6, "#ffe14a"));
      o.push(`<path d="M${LX - 30} ${LY + LR + 3} Q 70 190 64 243" fill="none" stroke="#ffe14a" stroke-width="1.2" stroke-dasharray="3 3" opacity=".8"/><circle cx="64" cy="244" r="2.2" fill="#ffe14a"/>`);
    }

    // ---------- ทดสอบด้วยแม่เหล็ก ----------
    if (cue === "magnet") {
      o.push(`<rect x="36" y="14" width="198" height="142" rx="9" fill="#0b1226" opacity=".92" stroke="#ffe14a" stroke-width="1.8"/>`);
      const inv = (x: number, y: number, c: string) => `<path d="M${x - 30} ${y} H${x + 30} V${y + 28} H${x + 25} V${y + 6} H${x - 25} V${y + 28} H${x - 30}Z" fill="${c}" stroke="#4b5878" stroke-width=".8"/><rect x="${x - 30}" y="${y}" width="60" height="2" fill="#fff" opacity=".4"/>`;
      const mag = (x: number, y: number, rot: number) => `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)})"><rect x="-10" y="-4" width="10" height="8" rx="1.5" fill="#4a8cff"/><rect x="0" y="-4" width="10" height="8" rx="1.5" fill="#ff4d4d"/><rect x="-10" y="-4" width="20" height="2" fill="#fff" opacity=".35"/></g>`;
      // ซ้าย: ดูดติด
      o.push(inv(86, 66, "#9aa6bd") + mag(86, 62, 0));
      o.push(`<ellipse cx="86" cy="68" rx="32" ry="4" fill="#ff7a2a" opacity="${f2(0.15 + 0.1 * Math.sin(ph * 5))}" filter="url(#bl)"/>`);
      o.push(`<path d="M72 112 l7 7 l14 -16" fill="none" stroke="#5aff9a" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`);
      o.push(T(86, 130, "เหล็ก / สแตนเลสชนิดแม่เหล็ก", 5.4, "#fff"));
      o.push(T(86, 142, "ดูดติด ใช้ได้", 6.4, "#5aff9a"));
      // ขวา: ไม่ติด
      const fu = (ph * 0.8) % 1.4;
      const fy = 62 + Math.min(fu, 1) * 52, fr = Math.min(fu, 1) * 80;
      o.push(inv(184, 66, "#d8dde8"));
      o.push(`<g opacity="${f2(fu > 1 ? cl(1 - (fu - 1) * 3) : 1)}">${mag(190 + Math.min(fu, 1) * 26, fy, fr)}</g>`);
      o.push(`<path d="M160 103 l18 17 M178 103 l-18 17" fill="none" stroke="#ff5a5a" stroke-width="3.4" stroke-linecap="round"/>`);
      o.push(T(184, 130, "อะลูมิเนียม / ทองแดง", 5.4, "#fff"));
      o.push(T(184, 142, "ไม่ติด ส่วนใหญ่ใช้ไม่ได้", 5.8, "#ff9a9a"));
      o.push(T(135, 30, "เอาแม่เหล็กแตะก้นหม้อ", 7.4, "#ffe14a"));
    }

    // ---------- เทียบความถี่ ----------
    if (cue === "freq") {
      o.push(`<rect x="36" y="14" width="198" height="142" rx="9" fill="#0b1226" opacity=".92" stroke="#ffe14a" stroke-width="1.8"/>`);
      o.push(T(135, 30, "ไฟสลับทิศเร็วแค่ไหน", 7.4, "#ffe14a"));
      let d1 = "", d2 = "";
      for (let x = 0; x <= 174; x += 2) {
        const u = x / 174;
        d1 += `${x ? "L" : "M"}${48 + x} ${f2(62 + 12 * Math.sin(TAU * 1.5 * u - ph * 5))} `;
      }
      for (let x = 0; x <= 174; x += 1) {
        const u = x / 174;
        d2 += `${x ? "L" : "M"}${48 + x} ${f2(112 + 12 * Math.sin(TAU * 26 * u - ph * 40))} `;
      }
      o.push(`<path d="${d1}" fill="none" stroke="#7fe0ff" stroke-width="2" stroke-linejoin="round"/>`);
      o.push(T(135, 84, "ไฟบ้าน: 50 รอบต่อวินาที", 6.6, "#7fe0ff"));
      o.push(`<path d="${d2}" fill="none" stroke="#ffb86a" stroke-width="1.5" stroke-linejoin="round"/>`);
      o.push(T(135, 134, "ในเตา: หลายหมื่นรอบต่อวินาที", 6.6, "#ffb86a"));
      o.push(T(135, 148, "(ภาพเปรียบเทียบ ไม่ใช่จำนวนรอบจริง)", 5, "#8e99b0"));
    }

    // ---------- เทียบประสิทธิภาพ ----------
    if (cue === "eff") {
      o.push(`<rect x="36" y="14" width="198" height="142" rx="9" fill="#0b1226" opacity=".92" stroke="#ffe14a" stroke-width="1.8"/>`);
      o.push(T(135, 30, "พลังงานที่ไปถึงหม้อ (ผลทดสอบส่วนใหญ่)", 6.6, "#ffe14a"));
      const k = 1.6, X0 = 48;
      const g = ease(cl(p * 1.6));
      o.push(T(X0, 50, "เตาแก๊ส", 6.6, "#fff", "start"));
      o.push(`<rect x="${X0}" y="54" width="160" height="16" rx="3" fill="#1b2644"/><rect x="${X0}" y="54" width="${f2(30 * k * g)}" height="16" rx="3" fill="#ff7a5a"/><rect x="${f2(X0 + 30 * k * g)}" y="54" width="${f2(14 * k * g)}" height="16" fill="#ff7a5a" opacity=".4"/>`);
      o.push(T(X0 + 44 * k + 6, 66, "ราว 30–44%", 6.4, "#ffb09a", "start"));
      o.push(T(X0, 92, "เตาแม่เหล็กไฟฟ้า", 6.6, "#fff", "start"));
      o.push(`<rect x="${X0}" y="96" width="160" height="16" rx="3" fill="#1b2644"/><rect x="${X0}" y="96" width="${f2(70 * k * g)}" height="16" rx="3" fill="#46d6a0"/><rect x="${f2(X0 + 70 * k * g)}" y="96" width="${f2(15 * k * g)}" height="16" fill="#46d6a0" opacity=".4"/>`);
      o.push(T(X0 + 85 * k + 6, 108, "ราว 70–85%", 6.4, "#9affd6", "start"));
      o.push(T(135, 134, "ตัวเลขต่างกันตามรุ่น วิธีวัด และขนาดหม้อ", 5.4, "#8e99b0"));
      o.push(T(135, 146, "แต่ผลทดสอบส่วนใหญ่ เตาแก๊สอยู่ต่ำกว่าครึ่ง", 5.4, "#8e99b0"));
    }

    // ---------- ข้อความประกอบ ----------
    if (cue === "glass") {
      // ความร้อนจากก้นหม้อขึ้นสู่น้ำ
      for (const x of [86, 135, 184]) {
        const o2 = 0.55 + 0.45 * Math.sin(ph * 4 + x);
        o.push(H.varrow(x, 240, "#ffb27a", 0.9 * o2, -1));
      }
      o.push(T(135, 160, "ความร้อนเกิดที่ก้นหม้อโดยตรง", 6.8, "#ffd2a0"));
      o.push(T(135, 349, "กระจกอุ่น เพราะรับความร้อนจากก้นหม้อ", 6.4, "#fff"));
    }
    if (cue === "coil") {
      o.push(T(135, 238, "ไฟสลับ หลายหมื่นรอบต่อวินาที", 6.8, "#ffe14a"));
      o.push(T(135, 349, "ไฟไหลไปมาในขดลวดใต้กระจก", 6.4, "#fff"));
    }
    if (cue === "field") {
      o.push(T(135, 232, "สนามแม่เหล็กทะลุกระจกขึ้นไป", 6.8, "#7fe0ff"));
    }
    if (noPan) {
      o.push(T(135, 200, "ไม่มีหม้อ = ไม่ให้ความร้อน", 7.4, "#ffe14a"));
      o.push(T(135, 213, "ช้อนเล็ก ๆ ก็ไม่ถูกมองเป็นหม้อ", 6.4, "#fff"));
      o.push(T(135, 226, "แต่อย่าวางโลหะทิ้งไว้บนเตา", 6.4, "#ff9a9a"));
    }
    if (cue === "tip") {
      o.push(T(135, 168, "ก้นเรียบ ขนาดพอดีวง วางตรงกลาง", 7, "#ffe14a"));
      if (dx < 1) o.push(T(135, 181, "ใช้งานได้ดี และสนามรั่วน้อยลง", 6.2, "#9affd6"));
    }

    o.push(box(SCENE_INDUCTION.focus[cue]?.box, ph));
    return o.join("");
  },
};
