// ฉากไดร์เป่าผมแบบตัดครึ่ง (ภาพเวกเตอร์ วาดด้วยโค้ด) — พิกัด 270x480
// ข้อเท็จจริงทั้งหมดอ้างอิงใน docs/facts-hairdryer.md
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, dot, box, DEFS, room, along, plen } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));
const KF = "Kanit, sans-serif";
const txt = (x: number, y: number, s: string, size = 6.5, fill = "#fff", anchor = "middle", op = 1, stroke = "#1d2338") =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" font-family="${KF}" font-weight="700" text-anchor="${anchor}" stroke="${stroke}" stroke-width="${f2(size * 0.34)}" paint-order="stroke" stroke-linejoin="round" opacity="${f2(op)}">${s}</text>`;
const pl = (pts: Pt[], stroke: string, w: number, op = 1, extra = "") =>
  `<path d="M${pts.map((q) => q[0] + " " + q[1]).join(" L")}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}" ${extra}/>`;

const EXTRA = `<defs>
<linearGradient id="hdShell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46c1b2"/><stop offset=".5" stop-color="#2a9d8f"/><stop offset="1" stop-color="#1b6f66"/></linearGradient>
<linearGradient id="hdCav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d3e6"/><stop offset=".35" stop-color="#eef2f9"/><stop offset=".7" stop-color="#e3e9f4"/><stop offset="1" stop-color="#bcc7dc"/></linearGradient>
<linearGradient id="hdMotor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7dbe6"/><stop offset=".3" stop-color="#8e98ad"/><stop offset="1" stop-color="#4b5570"/></linearGradient>
<linearGradient id="hdMica" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1e3b4"/><stop offset="1" stop-color="#c9b273"/></linearGradient>
<linearGradient id="hdTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eee3cf"/><stop offset="1" stop-color="#c8b794"/></linearGradient>
<linearGradient id="hdCab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a98562"/><stop offset="1" stop-color="#6d4d30"/></linearGradient>
<radialGradient id="hdLens" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#2a3f78"/><stop offset="1" stop-color="#0b1226"/></radialGradient>
<filter id="hdGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6"/></filter>
</defs>`;

// ---------- สถานะตาม cue ----------
type St = { spd: number; heat: number; sw: number; cool: number; bend: number; open: number; temp: number };
const state = (cue: string, p: number): St => {
  const s: St = { spd: 0.85, heat: 0.85, sw: 2, cool: 0, bend: 0, open: 0, temp: 0.5 };
  if (cue === "element" || cue === "air") { s.heat = 1; s.spd = 1; }
  if (cue === "fan") { s.spd = 1; }
  if (cue === "switch") {
    // 0 ปิด -> 1 ต่ำ -> 2 สูง
    s.sw = p < 0.12 ? 0 : p < 0.3 ? sm(0.12, 0.3, p) : p < 0.55 ? 1 : p < 0.72 ? 1 + sm(0.55, 0.72, p) : 2;
    const lv = s.sw <= 1 ? s.sw * 0.45 : 0.45 + (s.sw - 1) * 0.55;
    s.spd = lv; s.heat = lv;
  }
  if (cue === "cutoff") {
    s.temp = sm(0.1, 0.5, p);
    s.bend = sm(0.42, 0.6, p);
    s.open = s.bend > 0.6 ? 1 : 0;
    s.heat = s.open ? 0.95 * (1 - sm(0.6, 0.85, p)) : 0.9 + 0.1 * s.temp;
    s.spd = 0.9;
  }
  if (cue === "cool") {
    s.cool = sm(0.1, 0.22, p);
    s.heat = 0.95 * (1 - sm(0.12, 0.4, p));
    s.spd = 1;
  }
  return s;
};

// ---------- เส้นทางสายไฟ ----------
const coil: Pt[] = [];
for (let i = 0; i < 9; i++) { const x = 46 + i * 7; coil.push([x, 172], [x + 3.5, 208]); }
coil.push([109, 172]);
const P_HEAT: Pt[] = [[176, 298], [176, 216], [44, 216], [44, 209], ...coil, [109, 165], [101, 164], [72, 164], [68, 164], [68, 155], [152, 155], [152, 222], [163, 230], [163, 298]];
const P_FEED: Pt[] = [[194, 298], [194, 213], [208, 213], [208, 200]];
const P_RET: Pt[] = [[186, 298], [186, 215], [198, 215], [198, 200]];
const L_HEAT = plen(P_HEAT);

const airCol = (x: number, hf: number) => mixc("#7fd0ff", "#ff8a3a", cl((112 - x) / 76) * hf);

export const SCENE_HAIRDRYER: SceneDef = {
  focus: {
    all: { cx: 130, cy: 300, z: 0.98 },
    switch: { cx: 183, cy: 282, z: 2.1, box: [150, 226, 66, 84], label: "สวิตช์ที่ด้ามจับ" },
    fan: { cx: 196, cy: 208, z: 2.4, box: [150, 148, 94, 76] },
    element: { cx: 76, cy: 207, z: 2.6, box: [32, 150, 84, 70], label: "ขดลวดนิกโครม" },
    air: { cx: 126, cy: 228, z: 1.05, box: [6, 144, 238, 84], label: "ลมไหลผ่านขดลวด" },
    cutoff: { cx: 86, cy: 183, z: 3.1, box: [62, 154, 46, 18], label: "ตัวตัดไฟเมื่อร้อนเกิน" },
    cool: { cx: 120, cy: 262, z: 1.3, box: [144, 228, 70, 30], label: "ปุ่มลมเย็น" },
    hair: { cx: 135, cy: 428, z: 2.3 },
    study: { cx: 135, cy: 478, z: 1.0 },
    tip: { cx: 135, cy: 478, z: 1.0 },
    plug: { cx: 236, cy: 326, z: 3.4, box: [216, 298, 40, 40], label: "ปลั๊กตัดไฟรั่ว" },
    end: { cx: 130, cy: 300, z: 0.98 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const S = state(cue, p);
    const o: string[] = [DEFS, EXTRA, room(452)];
    // ===== เคาน์เตอร์ห้องน้ำ =====
    o.push(`<rect x="-140" y="342" width="550" height="12" fill="url(#hdTop)"/><rect x="-140" y="354" width="550" height="100" fill="url(#hdCab)"/><rect x="-140" y="354" width="550" height="2" fill="#4c3320" opacity=".5"/>`);
    o.push(`<rect x="10" y="368" width="116" height="66" rx="3" fill="none" stroke="#573a22" stroke-width="1.2" opacity=".6"/><rect x="144" y="368" width="116" height="66" rx="3" fill="none" stroke="#573a22" stroke-width="1.2" opacity=".6"/>`);
    // ปลั๊กไฟที่ผนัง
    o.push(`<rect x="212" y="288" width="50" height="54" rx="5" fill="#f4f1ea" stroke="#b7ae98" stroke-width="1"/>`);

    // ===== ตัวไดร์ =====
    const outer = "M24 148 H226 Q240 148 240 162 V210 Q240 224 226 224 H200 L210 336 Q210 342 204 342 H164 Q158 342 158 336 L150 224 H24 L10 214 V158 Z";
    const inner = "M25 153 H226 Q235 153 235 162 V210 Q235 219 226 219 H195 L203 337 H165 L156 219 H25 L15 211 V160 Z";
    o.push(`<ellipse cx="124" cy="343" rx="92" ry="4" fill="#1b1008" opacity=".35" filter="url(#bl)"/>`);
    o.push(`<g filter="url(#sh)"><path d="${outer}" fill="url(#hdShell)" stroke="#14584f" stroke-width="1.4" stroke-linejoin="round"/></g>`);
    o.push(`<path d="${inner}" fill="url(#hdCav)" stroke="#0f3f39" stroke-width="1"/>`);
    o.push(`<path d="M30 151 H224" stroke="#fff" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>`);

    // --- ตะแกรงหน้า (ปลายท่อ) ---
    o.push(`<rect x="12" y="162" width="5" height="48" rx="1.5" fill="#7a869c" stroke="#3b455e" stroke-width=".6"/>`);
    for (let i = 0; i < 8; i++) o.push(`<rect x="12.4" y="${164 + i * 5.8}" width="4.2" height="3" fill="#1d2338" opacity=".75"/>`);

    // --- แผ่นไมก้า + ขดลวด ---
    const heatC = mixc("#8b909c", "#ff3b12", cl(S.heat * 1.15));
    o.push(`<rect x="38" y="168" width="74" height="44" rx="3" fill="url(#hdMica)" opacity=".5" stroke="#b49a58" stroke-width="1.2"/>`);
    o.push(`<rect x="38" y="188" width="74" height="4" fill="#b49a58" opacity=".85"/>`);
    for (let i = 0; i < 9; i++) o.push(`<rect x="${f2(48 + i * 7)}" y="168" width="2.2" height="3" fill="#e8eef7"/><rect x="${f2(48 + i * 7)}" y="209" width="2.2" height="3" fill="#e8eef7"/>`);
    if (S.heat > 0.1) o.push(`<rect x="38" y="164" width="76" height="52" rx="10" fill="#ff6a1a" opacity="${f2(0.5 * S.heat)}" filter="url(#hdGlow)"/>`);
    // เส้นลวดหลัง (จาง) + หน้า (สว่าง)
    for (let i = 0; i < 9; i++) {
      const x = 46 + i * 7;
      o.push(`<path d="M${x + 3.5} 208 L${x + 7} 172" stroke="${heatC}" stroke-width="1.4" opacity=".35" fill="none"/>`);
    }
    for (let i = 0; i < 9; i++) {
      const x = 46 + i * 7;
      o.push(`<path d="M${x} 172 L${x + 3.5} 208" stroke="#2a1d10" stroke-width="3" opacity=".25" fill="none" stroke-linecap="round"/><path d="M${x} 172 L${x + 3.5} 208" stroke="${heatC}" stroke-width="2" fill="none" stroke-linecap="round"/>`);
      if (S.heat > 0.55) o.push(`<path d="M${x} 172 L${x + 3.5} 208" stroke="#ffe27a" stroke-width=".8" fill="none" opacity="${f2((S.heat - 0.5) * 1.6)}"/>`);
    }

    // --- สายไฟ ---
    const wireC = "#d94b4b", retC = "#3f72d9";
    o.push(pl(P_HEAT, "#2a2232", 3.2, 0.5));
    o.push(pl(P_HEAT.slice(0, 5), wireC, 1.9, 1));
    o.push(pl(P_HEAT.slice(-9), retC, 1.9, 1));
    o.push(pl([[109, 172], [109, 165], [101, 164]], wireC, 1.9));
    o.push(pl([[72, 164], [68, 164], [68, 155], [152, 155], [152, 222], [163, 230]], retC, 1.9));
    o.push(pl(P_FEED, "#2a2232", 3.2, 0.5) + pl(P_FEED, wireC, 1.9) + pl(P_RET, "#2a2232", 3.2, 0.5) + pl(P_RET, retC, 1.9));
    o.push(pl([[163, 230], [163, 232]], retC, 1.9));

    // --- ตัวตัดไฟ (แผ่นโลหะสองชั้น) ---
    {
      const hot = cl(S.temp);
      o.push(`<rect x="66" y="157" width="38" height="11.5" rx="2" fill="#efe6d2" stroke="#8a7a58" stroke-width=".9"/>`);
      o.push(`<rect x="95" y="160" width="6" height="7" rx="1" fill="#b87333" stroke="#6b3d18" stroke-width=".5"/><rect x="69" y="160" width="6" height="7" rx="1" fill="#b87333" stroke="#6b3d18" stroke-width=".5"/>`);
      const b = S.bend, endY = 164 - 11 * b;
      const sc = mixc("#8fa3c4", "#ff6a3a", hot);
      const d = `M73 164 Q86 ${f2(164 - 1.5 - 8 * b)} 97 ${f2(endY)}`;
      o.push(`<path d="${d}" fill="none" stroke="#3a4560" stroke-width="3.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${sc}" stroke-width="2.3" stroke-linecap="round"/>`);
      o.push(`<path d="M73 163 Q86 ${f2(163 - 1.5 - 8 * b)} 97 ${f2(endY - 1)}" fill="none" stroke="#e6eaf3" stroke-width=".8" stroke-linecap="round" opacity=".85"/>`);
      if (S.open && S.heat > 0.25 && Math.sin(frame * 2.1) > 0) o.push(`<circle cx="98" cy="164" r="2.4" fill="#fff" opacity=".9"/><circle cx="98" cy="164" r="6" fill="#7fb4ff" opacity=".5" filter="url(#bl)"/>`);
    }

    // --- ปุ่มลมเย็น + หน้าสัมผัสในสายกลับ ---
    {
      const c = S.cool;
      o.push(`<rect x="161" y="232" width="4" height="3" fill="#b87333"/><rect x="161" y="245" width="4" height="3" fill="#b87333"/>`);
      o.push(pl([[163, 245], [163, 298]], retC, 1.9));
      // ใบมีดสัมผัส: ปกติแตะทั้งสองปลาย ถูกกดแล้วถูกดันออก
      o.push(`<g transform="translate(${f2(163 + 7 * c)} 246) rotate(${f2(-16 * c)}) translate(-163 -246)"><rect x="161.6" y="233" width="2.8" height="14" rx="1" fill="#e3b04a" stroke="#7a5a1a" stroke-width=".4"/></g>`);
      o.push(`<g transform="translate(${f2(5 * c)} 0)"><rect x="148" y="233" width="9" height="14" rx="2.5" fill="#4aa8ff" stroke="#1e5fa8" stroke-width="1"/><rect x="149.5" y="235" width="2" height="10" rx="1" fill="#fff" opacity=".5"/><rect x="156" y="238" width="4" height="4" fill="#8e98ad"/></g>`);
    }

    // --- สวิตช์ในด้ามจับ ---
    {
      const sw = S.sw;
      o.push(`<rect x="158" y="258" width="46" height="46" rx="4" fill="#2b3350" stroke="#151b30" stroke-width="1"/><rect x="161" y="261" width="40" height="40" rx="3" fill="#39425e"/>`);
      const padY = [266, 278, 290];
      padY.forEach((y, i) => o.push(`<circle cx="172" cy="${y}" r="2.6" fill="${Math.abs(sw - (2 - i)) < 0.5 ? "#7fffd0" : "#8e98ad"}" stroke="#151b30" stroke-width=".5"/>`));
      const ky = lerp(290, 266, cl(sw / 2));
      o.push(pl([[172, 278], [172, 290]], "#39425e", 0));
      o.push(`<path d="M196 ${f2(ky)} L173 ${f2(ky)}" stroke="#e3b04a" stroke-width="2.2" stroke-linecap="round" opacity="${sw < 0.05 ? 0.2 : 1}"/>`);
      // แถบเลื่อนที่ทะลุผนัง
      o.push(`<rect x="203" y="262" width="5" height="34" rx="2" fill="#0f3f39" opacity=".8"/>`);
      o.push(`<g transform="translate(0 ${f2(ky - 4)})"><rect x="203" y="0" width="12" height="9" rx="3" fill="#f4f6fb" stroke="#8e98ad" stroke-width=".8"/><rect x="206" y="1.5" width="1.2" height="6" fill="#aab4c8"/><rect x="209" y="1.5" width="1.2" height="6" fill="#aab4c8"/></g>`);
      if (cue === "switch") {
        const bars: [number, number, string, string, number][] = [[132, 0, "ลม", "#4aa8ff", S.spd], [146, 0, "ร้อน", "#ff6a2a", S.heat]];
        for (const [bx, , lb, bc, v] of bars) {
          o.push(`<rect x="${bx - 5}" y="268" width="10" height="32" rx="3" fill="#1c2540" stroke="#8e98ad" stroke-width=".8"/><rect x="${bx - 3.4}" y="${f2(298.4 - 29 * cl(v))}" width="6.8" height="${f2(29 * cl(v))}" rx="2" fill="${bc}"/>`);
          o.push(txt(bx, 264, lb, 5.4, "#fff"));
        }
        o.push(txt(219, 269, "สูง", 5.6, "#fff", "start", 1) + txt(219, 281, "ต่ำ", 5.6, "#fff", "start", 1) + txt(219, 293, "ปิด", 5.6, "#fff", "start", 1));
      }
    }

    // --- มอเตอร์ + ใบพัด ---
    {
      // ขาจับ
      o.push(`<rect x="206" y="153" width="3" height="19" fill="#8e98ad"/><rect x="206" y="200" width="3" height="19" fill="#8e98ad"/>`);
      o.push(`<rect x="180" y="172" width="42" height="28" rx="5" fill="url(#hdMotor)" stroke="#2b3350" stroke-width="1"/>`);
      o.push(`<rect x="184" y="174" width="30" height="3" rx="1.5" fill="#fff" opacity=".35"/>`);
      for (let i = 0; i < 4; i++) o.push(`<rect x="${f2(190 + i * 7)}" y="180" width="2.4" height="16" rx="1.2" fill="#b87333" opacity=".85"/>`);
      o.push(`<rect x="222" y="178" width="5" height="16" rx="2" fill="#4b5570" stroke="#2b3350" stroke-width=".7"/>`);
      o.push(`<rect x="172" y="184.6" width="9" height="3" fill="#cdd3e0" stroke="#7a869c" stroke-width=".4"/>`);
      // ใบพัด (มองด้านข้าง) ที่หมุน
      const run = S.spd > 0.02 ? 1 : 0;
      const th = ph * 9.5 + 0.7;
      o.push(`<ellipse cx="167" cy="186" rx="3.4" ry="27" fill="#2a9d8f" opacity="${f2(0.2 * S.spd)}"/>`);
      const blades = [0, 1, 2, 3, 4].map((i) => {
        const a = (run ? th : 0.5) + (i * Math.PI * 2) / 5;
        return { y: 186 + 25 * Math.cos(a), d: Math.sin(a) };
      }).sort((a, b) => a.d - b.d);
      for (const bl of blades) {
        const sh = 0.55 + 0.45 * (bl.d + 1) / 2;
        o.push(`<path d="M167 186 L167 ${f2(bl.y)}" stroke="#14584f" stroke-width="1.2" opacity=".6"/><g transform="translate(167 ${f2(bl.y)}) rotate(${f2(-24 + 10 * bl.d)})"><rect x="-7.5" y="-2.6" width="15" height="5.2" rx="2.4" fill="${mixc("#2b7a74", "#6fe0d2", sh)}" stroke="#14584f" stroke-width=".6"/></g>`);
      }
      o.push(`<rect x="163" y="181" width="8" height="10" rx="3" fill="#5b667f" stroke="#2b3350" stroke-width=".8"/>`);
    }

    // --- ตะแกรงด้านหลัง ---
    o.push(`<rect x="230" y="154" width="5" height="64" fill="#7a869c" opacity=".35"/>`);
    for (let i = 0; i < 16; i++) o.push(`<rect x="230" y="${f2(155 + i * 4)}" width="5" height="1.6" fill="#2b3350" opacity=".85"/>`);

    // ===== อากาศไหลผ่าน =====
    const hf = cl(S.heat);
    const NP = 30, flow = S.spd;
    o.push(`<clipPath id="hdBar"><path d="${inner}"/></clipPath>`);
    for (let i = 0; i < NP; i++) {
      if (i / NP > flow) continue;
      const u = (ph * 0.55 + i / NP + rnd(i) * 0.03) % 1;
      const x = 270 - u * 306;
      const lane = 157 + ((i * 7) % 11) * 5.6;
      let y = lane;
      if (x > 168) {
        const wall = lane < 186 ? 160 + (lane - 157) * 0.18 : 212 + (lane - 186) * 0.1;
        y = lerp(lane, wall, sm(168, 200, x));
      }
      if (x < 12) y = lane + (lane - 186) * (12 - x) * 0.12;
      const col = airCol(x, hf);
      const a = x > 240 ? sm(270, 240, x) : x < 4 ? 1 - sm(4, -34, x) : 1;
      const len = 7 + 6 * flow;
      o.push(`<path d="M${f2(x)} ${f2(y)} l${f2(len)} 0" stroke="${col}" stroke-width="1.5" stroke-linecap="round" opacity="${f2(0.85 * a)}"/>`);
      if (i % 3 === 0) o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.5" fill="#fff" opacity="${f2(0.8 * a)}"/>`);
    }
    // ลูกศรลมเย็นเข้า / ลมร้อนออก
    if (cue === "air" || cue === "all" || cue === "cool") {
      const af = cue === "air" ? 1 : 0.7;
      o.push(H.warrow(236 - ((ph * 20) % 8), 138, "#2f8fe0", af, -1));
      o.push(H.warrow(-8 - ((ph * 22) % 10), 164, hf > 0.3 ? "#ff6a2a" : "#2f8fe0", af, -1));
      o.push(H.warrow(-8 - ((ph * 22 + 5) % 10), 208, hf > 0.3 ? "#ff6a2a" : "#2f8fe0", af, -1));
    }
    if (cue === "air") {
      o.push(txt(204, 134, "ลมเย็นเข้า", 8, "#9fdcff", "middle"));
      o.push(txt(42, 138, "ลมร้อนออก", 8, "#ffb27a", "middle"));
      o.push(txt(76, 237, "ผ่านขดลวด = รับความร้อน", 7, "#ffe27a", "middle"));
    }
    if (cue === "fan") {
      o.push(txt(167, 138, "ใบพัด", 6.6, "#fff", "middle"));
      o.push(pl([[167, 140], [167, 160]], "#fff", 0.9));
      o.push(txt(200, 127, "มอเตอร์", 6.6, "#fff", "middle"));
      o.push(pl([[200, 129], [200, 172]], "#fff", 0.9));
      o.push(txt(234, 138, "ตะแกรง", 6.6, "#ffe27a", "middle"));
      o.push(pl([[234, 140], [234, 160]], "#ffe27a", 0.9));
    }
    if (cue === "element") {
      o.push(txt(76, 134, "พันบนแผ่นไมก้า ทนความร้อน", 5.6, "#f1e3b4", "middle"));
      o.push(txt(76, 126, "ลวดต้านไฟฟ้า จึงร้อนจัด", 5.6, "#ffb27a", "middle"));
    }

    // ===== กระแสไฟ (จุดเรืองแสงวิ่งตามสาย) =====
    const flowOn = S.sw > 0.05 && !S.open && S.cool < 0.5;
    if (S.spd > 0.02) {
      for (let k = 0; k < 14; k++) {
        const d = (ph * 38 + (k * L_HEAT) / 14) % L_HEAT;
        if (flowOn) {
          const pt = along(P_HEAT, d);
          o.push(dot(pt, 1.2, "#ffe14a"));
        }
      }
      for (let k = 0; k < 4; k++) {
        const L = plen(P_FEED);
        const d = (ph * 30 + (k * L) / 4) % L;
        o.push(dot(along(P_FEED, d), 1.1, "#ffe14a"));
        o.push(dot(along(P_RET, L - d), 1.1, "#ffe14a"));
      }
    }

    // ===== สายไฟ + ปลั๊ก =====
    {
      const cord: Pt[] = [[183, 337], [183, 346], [200, 348], [226, 348], [238, 344], [238, 336]];
      o.push(pl(cord, "#1d2338", 4.6) + pl(cord, "#4b5878", 3) + pl(cord, "#7e8aa8", 0.8, 0.7));
      o.push(`<rect x="183" y="337" width="0.1" height="0.1"/>`);
      // ปลั๊กตัดไฟรั่ว (สี่เหลี่ยมใหญ่)
      o.push(`<g filter="url(#sh2)"><rect x="223" y="298" width="30" height="40" rx="4" fill="#e9edf5" stroke="#8e98ad" stroke-width="1"/></g>`);
      o.push(`<rect x="228" y="304" width="9" height="7" rx="1.5" fill="#2b3350"/><rect x="240" y="304" width="9" height="7" rx="1.5" fill="#d94b4b"/>`);
      o.push(`<circle cx="238.5" cy="320" r="2" fill="${cue === "plug" ? "#7fffd0" : "#9aa6bd"}"/>`);
      o.push(`<rect x="229" y="326" width="19" height="3" rx="1.5" fill="#aab4c8"/>`);
      if (cue === "plug") {
        const a = 0.55 + 0.45 * Math.sin(ph * 6);
        o.push(`<circle cx="238.5" cy="320" r="5" fill="#7fffd0" opacity="${f2(0.4 * a)}" filter="url(#bl)"/>`);
        // ป้ายห้ามใกล้น้ำ
        const sx = 236, sy = 273;
        o.push(`<circle cx="${sx}" cy="${sy}" r="9" fill="#fff" stroke="#d63a3a" stroke-width="2"/>`);
        o.push(`<path d="M${sx} ${sy - 5} q4 5 4 7.4 a4 4 0 0 1 -8 0 q0 -2.4 4 -7.4z" fill="#3a9bf0" stroke="#1e5fa8" stroke-width=".6"/>`);
        o.push(`<path d="M${sx - 6.4} ${sy - 6.4} L${sx + 6.4} ${sy + 6.4}" stroke="#d63a3a" stroke-width="2" stroke-linecap="round"/>`);
        o.push(txt(236, 262, "อย่าใช้ใกล้น้ำ", 6, "#ffe27a", "middle"));
      }
    }

    // ===== ป้ายสถานะ: ตัดไฟ / ร้อนเกิน / ลมเย็น =====
    if (cue === "cutoff") {
      const a = 0.5 + 0.5 * Math.sin(ph * 9);
      if (p > 0.26 && p < 0.6) o.push(txt(86, 133, "ร้อนเกินไป!", 6.4, "#ff9a7a", "middle", 0.55 + 0.45 * a));
      if (S.open) o.push(txt(86, 133, "แผ่นโก่ง → วงจรเปิด → ตัดไฟ", 5.4, "#9fffd9", "middle", sm(0.6, 0.7, p)));
      o.push(txt(63, 160.5, "แผ่นโลหะ", 4.6, "#fff", "end"));
      o.push(txt(63, 166.5, "สองชั้น", 4.6, "#fff", "end"));
    }
    if (cue === "cool") {
      o.push(txt(76, 232, "ขดลวดถูกตัดไฟ", 8, "#fff", "middle", sm(0.2, 0.4, p)));
      o.push(txt(143, 244, "กดค้าง", 8, "#fff", "end", sm(0.08, 0.2, p)));
      o.push(txt(76, 140, "เหลือแต่ลมเย็น", 8.4, "#9fdcff", "middle", sm(0.3, 0.5, p)));
    }

    // ===== เลนส์ขยาย: เส้นผม =====
    if (cue === "hair") {
      const LX = 135, LY = 395, LR = 50;
      o.push(`<circle cx="${LX}" cy="${LY}" r="${LR + 3}" fill="#ffe14a" opacity=".9"/><circle cx="${LX}" cy="${LY}" r="${LR}" fill="url(#hdLens)"/><clipPath id="hdLc"><circle cx="${LX}" cy="${LY}" r="${LR - 1}"/></clipPath><g clip-path="url(#hdLc)">`);
      const reshape = sm(0.3, 0.7, p);
      const A = lerp(10, 2.2, reshape);
      const bond = cl(1 - sm(0.12, 0.3, p) + sm(0.64, 0.86, p));
      const yoff = (x: number) => A * Math.sin((x - 90) / 12);
      const c1 = (x: number) => LY - 9 + yoff(x), c2 = (x: number) => LY + 9 + yoff(x);
      const chain = (f: (x: number) => number) => {
        let d = `M88 ${f2(f(88))}`;
        for (let x = 90; x <= 182; x += 2) d += ` L${x} ${f2(f(x))}`;
        return d;
      };
      o.push(`<path d="${chain(c1)}" fill="none" stroke="#e8b27a" stroke-width="3" stroke-linecap="round"/><path d="${chain(c2)}" fill="none" stroke="#e8b27a" stroke-width="3" stroke-linecap="round"/>`);
      for (let x = 92; x <= 180; x += 8) {
        o.push(`<circle cx="${x}" cy="${f2(c1(x))}" r="1.5" fill="#fff3d6"/><circle cx="${x}" cy="${f2(c2(x))}" r="1.5" fill="#fff3d6"/>`);
        if (bond > 0.02) o.push(`<line x1="${x + 4}" y1="${f2(c1(x + 4) + 2)}" x2="${x + 4}" y2="${f2(c2(x + 4) - 2)}" stroke="#7fffd0" stroke-width="1.6" stroke-dasharray="1.6 1.4" opacity="${f2(bond)}"/>`);
      }
      // โมเลกุลน้ำ
      const wa = sm(0.1, 0.28, p) * (1 - sm(0.45, 0.72, p));
      if (wa > 0.02) {
        const lift = sm(0.45, 0.72, p);
        for (let i = 0; i < 11; i++) {
          const bx = 94 + rnd(i + 4) * 84, by = LY - 22 + rnd(i + 9) * 44;
          const x = bx + Math.sin(ph * 3 + i) * 1.6, y = by + Math.cos(ph * 2.6 + i * 2) * 1.6 - lift * (30 + rnd(i) * 40);
          o.push(`<g opacity="${f2(wa)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="3.4" fill="#3a9bf0" stroke="#bfe6ff" stroke-width=".5"/><circle cx="${f2(x - 3.6)}" cy="${f2(y + 2.2)}" r="1.9" fill="#e8f6ff"/><circle cx="${f2(x + 3.6)}" cy="${f2(y + 2.2)}" r="1.9" fill="#e8f6ff"/></g>`);
        }
      }
      // ลมร้อน / ลมเย็น
      const hotA = sm(0.3, 0.4, p) * (1 - sm(0.6, 0.66, p));
      const coolA = sm(0.66, 0.74, p);
      for (let i = 0; i < 3; i++) {
        const xx = 80 + ((ph * 40 + i * 30) % 90);
        if (hotA > 0.02) o.push(`<path d="M${f2(xx)} ${LY - 27 + i * 3} l12 0" stroke="#ff8a3a" stroke-width="2" stroke-linecap="round" opacity="${f2(hotA * 0.9)}"/>`);
        if (coolA > 0.02) o.push(`<path d="M${f2(xx)} ${LY - 27 + i * 3} l12 0" stroke="#7fd0ff" stroke-width="2" stroke-linecap="round" opacity="${f2(coolA * 0.9)}"/>`);
      }
      o.push(`</g><path d="M${LX - 34} ${LY - 34} A48 48 0 0 1 ${LX} ${LY - 48}" fill="none" stroke="#fff" stroke-width="2" opacity=".25" stroke-linecap="round"/>`);
      // ข้อความ
      const stage = p < 0.12 ? 0 : p < 0.45 ? 1 : p < 0.66 ? 2 : 3;
      const T: [string, string][] = [["ผมแห้ง: พันธะไฮโดรเจน", "ดึงโปรตีนสองสายไว้ด้วยกัน"], ["น้ำ + ความร้อน", "ทำให้พันธะหลุด จัดทรงได้"], ["ลมร้อนพาน้ำ", "ระเหยออกไป"], ["แห้ง / เย็นลง", "พันธะเกาะกลับ ล็อกทรงใหม่"]];
      o.push(txt(LX, LY + 30, T[stage][0], 5.2, "#fff"));
      o.push(txt(LX, LY + 37, T[stage][1], 5, "#ffe27a"));
      o.push(`<line x1="${LX - 38}" y1="${LY - 36}" x2="${LX - 32}" y2="${LY - 36}" stroke="#7fffd0" stroke-width="1.6" stroke-dasharray="1.6 1.4"/>`);
      o.push(txt(LX - 29, LY - 34, "พันธะไฮโดรเจน", 4.6, "#7fffd0", "start"));
    }

    // ===== แผงงานวิจัย / ระยะห่าง =====
    if (cue === "study" || cue === "tip") {
      const PX = 8, PY = 268, PW = 254, PH = 214;
      o.push(`<g filter="url(#sh)"><rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="9" fill="#1c2540" stroke="#ffe14a" stroke-width="1.6"/></g>`);
      if (cue === "study") o.push(txt(135, PY + 17, "งานวิจัยเกาหลีใต้: สระ+เป่าผมซ้ำ 30 รอบ", 8, "#fff"));
      else o.push(txt(135, PY + 17, "ยิ่งใกล้ ผมยิ่งร้อน ยิ่งเสียหาย", 9, "#ffe27a"));
      const rows = [
        { lab: "แห้งเอง", sub: "ไม่ใช้ไดร์ (อุณหภูมิห้อง)", gap: -1, temp: "20°C", t: 0 },
        { lab: "ไดร์ห่าง 15 ซม.", sub: "ขยับตลอด", gap: 45, temp: "ราว 47°C", t: 0.35 },
        { lab: "ไดร์ห่าง 5 ซม.", sub: "", gap: 15, temp: "ราว 95°C", t: 1 },
      ];
      rows.forEach((r, i) => {
        const y0 = PY + 34 + i * 46;
        const show = cue === "study" ? sm(0.08 + i * 0.16, 0.2 + i * 0.16, p) : 1;
        const dim = cue === "tip" && i === 0 ? 0.35 : 1;
        o.push(`<g opacity="${f2(show * dim)}">`);
        o.push(`<rect x="${PX + 6}" y="${y0 - 4}" width="${PW - 12}" height="38" rx="5" fill="#2a3560" opacity=".9"/>`);
        o.push(txt(PX + 12, y0 + 11, r.lab, 8.2, "#fff", "start", 1, "#0b1226"));
        if (r.sub) o.push(txt(PX + 12, y0 + 23, r.sub, 5.8, "#9fb2e8", "start", 1, "#0b1226"));
        // ไดร์ + ผม
        const hx = 190;
        const dx = r.gap < 0 ? 0 : hx - 12 - r.gap * 0.8 - 26;
        if (r.gap >= 0) {
          const sway = cue === "tip" && i === 1 ? Math.sin(ph * 4) * 5 : cue === "study" && i === 1 ? Math.sin(ph * 4) * 3 : 0;
          o.push(`<g transform="translate(${f2(dx)} ${f2(y0 + 10 + sway)})"><path d="M0 0 H22 Q26 0 26 4 V8 Q26 12 22 12 H12 L14 22 H8 L6 12 H0 Z" fill="#2a9d8f" stroke="#14584f" stroke-width=".8"/><rect x="-2" y="1" width="2.4" height="10" fill="#7a869c"/></g>`);
          for (let k = 0; k < 3; k++) {
            const xx = dx - 3 - ((ph * 30 + k * 9) % (hx - dx - 4));
            const len = hx - dx;
            const px = dx - 4 + ((ph * 34 + k * (len / 3)) % (len - 4));
            o.push(`<path d="M${f2(px - 8 + 0 * xx)} ${f2(y0 + 14 + k * 3 + sway * 0.5)} l-7 0" stroke="${r.t > 0.6 ? "#ff6a2a" : "#ffb27a"}" stroke-width="1.5" stroke-linecap="round" opacity="${f2(0.8)}"/>`);
          }
        }
        // ผม (เส้นผมห้อยลง)
        const hair = mixc("#9a6a3a", "#ff7a3a", r.t * 0.7);
        for (let k = 0; k < 6; k++) o.push(`<path d="M${hx + k * 3.2} ${y0 + 2} q${k % 2 ? 3 : -3} 8 0 16" fill="none" stroke="${hair}" stroke-width="1.4" stroke-linecap="round"/>`);
        if (r.t > 0.6 && (cue === "tip" || p > 0.5)) {
          const a = 0.5 + 0.5 * Math.sin(ph * 8);
          o.push(`<path d="M${hx + 8} ${y0 - 2} l0 0" stroke="none"/><circle cx="${hx + 9}" cy="${y0 + 10}" r="13" fill="#ff5a1a" opacity="${f2(0.25 * a)}" filter="url(#bl)"/>`);
        }
        o.push(txt(PX + PW - 10, y0 + 17, r.temp, 10, r.t > 0.6 ? "#ff9a7a" : r.t > 0.2 ? "#ffd27a" : "#9fdcff", "end", 1, "#0b1226"));
        o.push(`</g>`);
      });
      if (cue === "study") {
        o.push(txt(135, PY + 176, "ห่าง 15 ซม. + ขยับตลอด", 8.6, "#7fffd0", "middle", sm(0.62, 0.78, p), "#0b1226"));
        o.push(txt(135, PY + 189, "ทำลายผมน้อยกว่าปล่อยให้แห้งเอง", 8.6, "#7fffd0", "middle", sm(0.62, 0.78, p), "#0b1226"));
      } else {
        o.push(txt(135, PY + 178, "ถือให้ห่าง และอย่าหยุดนิ่ง", 9.4, "#7fffd0", "middle", 1, "#0b1226"));
        o.push(txt(135, PY + 191, "(ผลจากงานวิจัยหนึ่งงาน)", 6.4, "#9fb2e8", "middle", 1, "#0b1226"));
        const a = 0.5 + 0.5 * Math.sin(ph * 6);
        o.push(`<rect x="${PX + 4}" y="${PY + 34 + 92 - 4}" width="${PW - 8}" height="42" rx="6" fill="none" stroke="#ff6a4a" stroke-width="1.8" opacity="${f2(0.4 + 0.6 * a)}"/>`);
      }
    }

    o.push(box((SCENE_HAIRDRYER.focus[cue] || {}).box, ph));
    return o.join("");
  },
};
