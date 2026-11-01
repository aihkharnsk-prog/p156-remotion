// ฉากอธิบาย: น้ำยาล้างเครื่องซักผ้า — คราบและไบโอฟิล์มในช่องถังซัก, ฟองออกซิเจนแซะคราบออกทางท่อน้ำทิ้ง (SVG พิกัด 270x480)
// เน้นแอนิเมชัน: กล้องเลื่อนระหว่างหน้าตัดเครื่องซักผ้ากับภาพขยายผนังถัง, ทุก cue มีลูปเคลื่อนไหวตลอด
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

// ----- ฉากอธิบาย: น้ำยาล้างเครื่องซักผ้า — คราบสะสมระหว่างถังซักกับถังนอก, ฟองออกซิเจนแซะคราบ (SVG 270x480) -----
const CXD = 135, CYD = 150, RT = 86, RD = 66; // ถังนอก / ถังซัก
const FOCUS = {
  all: { cx: 135, cy: 175, z: 1.0 },
  grime: { cx: 135, cy: 150, z: 1.3 },
  film: { cx: 135, cy: 175, z: 1.25 },
  tablet: { cx: 135, cy: 165, z: 1.2 },
  bubble: { cx: 135, cy: 175, z: 1.25 },
  alk: { cx: 135, cy: 175, z: 1.25 },
  flush: { cx: 135, cy: 175, z: 1.2 },
  dry: { cx: 135, cy: 165, z: 1.2 },
  wipe: { cx: 135, cy: 170, z: 1.2 },
  chk: { cx: 135, cy: 195, z: 1.25 },
  end: { cx: 135, cy: 175, z: 1.0 },
};
const DEFS = `<defs>
<radialGradient id="wdr" cx=".5" cy=".5" r=".5"><stop offset=".8" stop-color="#3b4670"/><stop offset="1" stop-color="#8e9bc4"/></radialGradient>
<linearGradient id="wwt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0ff" stop-opacity=".7"/><stop offset="1" stop-color="#2f8fe0" stop-opacity=".85"/></linearGradient>
<clipPath id="wdc"><circle cx="${CXD}" cy="${CYD}" r="${RD - 3}"/></clipPath>
</defs>`;
const GR = ["#8a6a3a", "#6f8a3a", "#b49a5a", "#5a7a4a"];
const tri = (u: number) => Math.abs((((u % 2) + 2) % 2) - 1);
// ---- หน้าตัดเครื่องซักผ้า ----
const drumView = (ph: number, o: { grime: number; rot: number; tab: number; fizz: number; clean: number; door: number; wet: number; flush: number }): string => {
  let s = "";
  s += `<circle cx="${CXD}" cy="${CYD}" r="${RT}" fill="#1a2144" stroke="#aeb9d6" stroke-width="4"/>`;
  // คราบ (ในช่องระหว่างถัง) — จางลงตามค่า clean
  const g = o.grime * (1 - o.clean);
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * 6.2832 + rnd(i) * 0.1, r = RD + 4 + rnd(i + 3) * 8;
    s += `<circle cx="${f2(CXD + Math.cos(a) * r)}" cy="${f2(CYD + Math.sin(a) * r)}" r="${f2((1.2 + rnd(i + 5) * 3) * g)}" fill="${GR[i % 4]}" opacity=".9"/>`;
  }
  // น้ำ
  const wl = CYD + 28 * (o.wet);
  s += `<clipPath id="wtc"><circle cx="${CXD}" cy="${CYD}" r="${RT - 3}"/></clipPath><rect x="${CXD - RT}" y="${f2(wl)}" width="${2 * RT}" height="${RT}" fill="url(#wwt)" clip-path="url(#wtc)" opacity="${f2(o.wet > 0.01 ? 1 : 0)}"/>`;
  // ถังซักหมุน
  const th = ph * 2.2 * o.rot;
  s += `<circle cx="${CXD}" cy="${CYD}" r="${RD}" fill="#0f1530" stroke="url(#wdr)" stroke-width="5"/>`;
  s += `<g transform="rotate(${f2(th * 57.3)} ${CXD} ${CYD})">`;
  for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.2832; s += `<circle cx="${f2(CXD + Math.cos(a) * (RD - 0.5))}" cy="${f2(CYD + Math.sin(a) * (RD - 0.5))}" r="1.7" fill="#05081a"/>`; }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.2832; s += `<path d="M${f2(CXD + Math.cos(a) * (RD - 2))} ${f2(CYD + Math.sin(a) * (RD - 2))} L${f2(CXD + Math.cos(a + 0.08) * (RD - 17))} ${f2(CYD + Math.sin(a + 0.08) * (RD - 17))}" stroke="#aeb9d6" stroke-width="4" stroke-linecap="round"/>`; }
  s += `</g>`;
  s += `<g clip-path="url(#wdc)"><rect x="${CXD - RD}" y="${f2(wl)}" width="${2 * RD}" height="${RD}" fill="url(#wwt)" opacity="${f2(o.wet > 0.01 ? 0.9 : 0)}"/>`;
  // เม็ดล้างเครื่อง ละลายในน้ำ
  if (o.tab > 0.01) {
    const sz = 9 * (1 - 0.7 * cl(o.fizz)), tx = CXD + Math.sin(ph * 2) * 6, ty = wl + 8 - 4 * o.tab;
    s += `<g transform="translate(${f2(tx)} ${f2(Math.min(ty, wl + 10))}) rotate(${f2(ph * 40)})"><ellipse rx="${f2(sz)}" ry="${f2(sz * 0.5)}" fill="#f6f8ff" stroke="#8d98b8" stroke-width=".8"/></g>`;
  }
  if (o.fizz > 0.01) for (let i = 0; i < 22; i++) {
    const u = (ph * 0.7 + rnd(i) * 3) % 1, x = CXD + (rnd(i + 2) - 0.5) * 70 + Math.sin(ph * 3 + i) * 3;
    s += `<circle cx="${f2(x)}" cy="${f2(wl + 40 - u * 52)}" r="${f2(1.2 + rnd(i + 7) * 1.6)}" fill="none" stroke="#fff" stroke-width=".8" opacity="${f2(0.9 * o.fizz * (1 - u))}"/>`;
  }
  s += `</g>`;
  // ท่อน้ำทิ้ง
  s += `<path d="M${CXD} ${CYD + RT} V${CYD + RT + 22} H${CXD + 50}" fill="none" stroke="#59648a" stroke-width="9" stroke-linecap="round"/><path d="M${CXD} ${CYD + RT} V${CYD + RT + 22} H${CXD + 50}" fill="none" stroke="#1a2144" stroke-width="5" stroke-linecap="round"/>`;
  if (o.flush > 0.01) for (let i = 0; i < 12; i++) {
    const u = (ph * 0.6 + i / 12) % 1, L1 = 22, L2 = 50, d = u * (L1 + L2);
    const x = d < L1 ? CXD + (rnd(i) - 0.5) * 3 : CXD + (d - L1), y = d < L1 ? CYD + RT + d : CYD + RT + 22 + (rnd(i + 4) - 0.5) * 3;
    s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(1.6 + rnd(i + 2) * 1.6)}" fill="${GR[i % 4]}" opacity=".95"/>`;
  }
  return s;
};
const wallView = (ph: number, p: number, mode: number): string => {
  // ระยะใกล้: ผนังถังนอกด้านล่างเป็นแผงแนวนอน มีไบโอฟิล์ม; mode 0 = โตขึ้น, 1 = ถูกฟองยกออก
  const X0 = 40, X1 = 230, WY = 216;
  let s = `<rect x="${X0 - 6}" y="84" width="${X1 - X0 + 12}" height="146" rx="12" fill="#10162c" stroke="#3a4a86" stroke-width="1.2"/>`;
  s += `<rect x="${X0}" y="${WY}" width="${X1 - X0}" height="8" fill="#8e9bc4"/>`;
  const grow = mode === 0 ? sm(0.05, 0.9, p) : 1, lift = mode === 1 ? sm(0.2, 0.95, p) : 0;
  // ไบโอฟิล์ม = เมือกเขียว + เซลล์
  const hh = 30 * grow;
  s += `<path d="M${X0} ${WY} V${f2(WY - 4)} ${Array.from({ length: 20 }, (_, i) => `L${f2(X0 + i * 10)} ${f2(WY - 4 - hh * (0.6 + 0.4 * tri(i * 0.7 + 0.3)) * (1 - 0.7 * lift * rnd(i + 1)))}`).join(" ")} L${X1} ${f2(WY - 4)} V${WY} Z" fill="#6f8a3a" opacity=".55"/>`;
  for (let i = 0; i < 46; i++) {
    const x = X0 + 4 + rnd(i) * (X1 - X0 - 8), y = WY - 3 - rnd(i + 9) * hh * grow;
    if (lift > 0.3 && rnd(i + 20) < lift) continue;
    s += `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="3" ry="1.5" fill="#b9d46a" stroke="#4a5a1a" stroke-width=".4" transform="rotate(${f2(rnd(i + 3) * 180)} ${f2(x)} ${f2(y)})"/>`;
  }
  // ฟองก๊าซดันคราบออก + ชิ้นคราบลอยไปกับน้ำ
  if (mode === 1) {
    for (let i = 0; i < 16; i++) {
      const u = (ph * 0.8 + i / 16) % 1, x = X0 + 6 + rnd(i + 30) * (X1 - X0 - 12);
      s += `<circle cx="${f2(x)}" cy="${f2(WY - 2 - u * 70)}" r="${f2(1.6 + 1.5 * rnd(i))}" fill="none" stroke="#fff" stroke-width="1" opacity="${f2(Math.sin(u * 3.14) * 0.9)}"/>`;
    }
    for (let i = 0; i < 14; i++) {
      const u = (ph * 0.35 + i / 14) % 1, x = X0 + 6 + rnd(i + 50) * (X1 - X0 - 12) + u * 60;
      s += `<ellipse cx="${f2(x)}" cy="${f2(WY - 8 - u * 60 * lift)}" rx="${f2(3 + 2 * rnd(i))}" ry="1.8" fill="${GR[i % 4]}" opacity="${f2(lift * (1 - u * 0.6))}"/>`;
    }
    s += `<path d="M60 112 h140" stroke="#7fe3ff" stroke-width="1.4" marker-end="url(#wmar)" opacity=".7"/>`;
  }
  return s;
};
const calendar = (ph: number, p: number): string => {
  let s = `<rect x="40" y="82" width="190" height="140" rx="12" fill="#f4f6ff" stroke="#2b3350" stroke-width="1.4"/><rect x="40" y="82" width="190" height="24" rx="12" fill="#e5586a"/><rect x="40" y="96" width="190" height="10" fill="#e5586a"/>`;
  s += txt(135, 99, "ทุกเดือน", 10, "#fff", "middle", 900);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
    const x = 56 + c * 26, y = 124 + r * 22, d = r * 7 + c + 1;
    s += txt(x, y + 4, String(d), 8, "#5a6584", "middle", 700);
    if (d === 7 || d === 30 - 0 * 1) { /* ไม่ใช้ */ }
  }
  const tick = (x: number, y: number, a: number) => `<g opacity="${f2(a)}"><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#1f8a3a" stroke-width="2"/><path d="M${x - 4} ${y} l3 3.5 l6 -7" stroke="#1f8a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
  s += tick(56 + 2 * 26, 124 + 0 * 22 + 0, sm(0.05, 0.2, p));
  s += tick(56 + 3 * 26, 124 + 2 * 22 - 0, sm(0.4, 0.55, p));
  const blink = 0.5 + 0.5 * Math.sin(ph * 5);
  s += `<g opacity="${f2(sm(0.7, 0.85, p) * (0.4 + 0.6 * blink))}"><circle cx="${56 + 5 * 26}" cy="${124 + 3 * 22}" r="9" fill="none" stroke="#e5586a" stroke-width="2" stroke-dasharray="3 3"/>${txt(56 + 5 * 26, 124 + 3 * 22 + 4, "?", 9, "#e5586a", "middle", 900)}</g>`;
  s += pill(135, 244, "ล้างถังซัก ราวเดือนละครั้ง", "#fff6c9");
  return s;
};
export const SCENE_WASHERCLEANER: SceneDef = {
  focus: FOCUS,
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const c = (FOCUS as any)[cue] ? cue : "all";
    const o: string[] = [DEFS, bgFill(ph, "#1d2b52", "#0d1428"), `<defs><marker id="wmar" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5z" fill="#7fe3ff"/></marker></defs>`];
    const base = { grime: 1, rot: 0, tab: 0, fizz: 0, clean: 0, door: 0, wet: 0, flush: 0 };
    if (c === "all" || c === "end") o.push(drumView(ph, { ...base, rot: 0.5, wet: 1 }));
    else if (c === "grime") {
      o.push(drumView(ph, { ...base, rot: 0.3 }), pill(135, 44, "คราบตกค้างในช่องระหว่างถัง", "#ffe9c9"));
      // ป้ายสารตกค้างหมุนเวียน
      ["ผงซักฟอก", "ปรับผ้านุ่ม", "หินปูน", "เศษใย"].forEach((t, i) => o.push(`<g opacity="${f2(sm(i * 0.2, i * 0.2 + 0.15, p))}">${txt(135 + [-56, 56, -56, 56][i], 250 + (i >> 1) * 12, t, 6.4, ["#d9b46a","#b9d46a","#e8d9a0","#9fd08a"][i], "middle", 800)}</g>`));
    }
    else if (c === "film") o.push(wallView(ph, p, 0), pill(135, 72, p < 0.5 ? "เชื้อเกาะผนังที่ชื้น" : "เมือกหนาขึ้น = ไบโอฟิล์ม", "#e5f8d0"));
    else if (c === "tablet") o.push(drumView(ph, { ...base, rot: 0.6, wet: 1, tab: sm(0, 0.4, p), fizz: sm(0.3, 0.9, p) * 0.4 }), pill(135, 40, "เม็ดใส่ในถังเปล่า ไม่ใส่ที่ใส่ผงซักฟอก", "#fff6c9"));
    else if (c === "bubble") o.push(wallView(ph, p, 1), pill(135, 72, "ฟองออกซิเจนแซะคราบ", "#e1f3ff"));
    else if (c === "alk") o.push(drumView(ph, { ...base, rot: 0.8, wet: 1, tab: 1, fizz: 0.8, clean: 0.3 * p }), pill(135, 40, "น้ำด่างอ่อน ย่อยไขมัน", "#fff6c9"));
    else if (c === "flush") o.push(drumView(ph, { ...base, rot: 1, wet: 1 - 0.7 * sm(0.6, 1, p), tab: 1, fizz: 0.4, clean: sm(0.1, 0.9, p), flush: 1 }), pill(135, 40, "คราบไหลออกทางท่อน้ำทิ้ง", "#e1f3ff"));
    else if (c === "dry") {
      const open = sm(0.45, 0.6, p);
      o.push(drumView(ph, { ...base, grime: 0.7, wet: 0.2 }));
      o.push(`<circle cx="${CXD}" cy="${CYD}" r="${RT - 6}" fill="#bfe8ff" opacity="${f2(0.18 * (1 - open))}"/>`);
      for (let i = 0; i < 18; i++) { const u = (ph * 0.3 + i / 18) % 1, a = rnd(i) * 6.28; o.push(`<circle cx="${f2(CXD + Math.cos(a) * 52 * rnd(i + 2))}" cy="${f2(CYD + Math.sin(a) * 52 * rnd(i + 2) - u * 6)}" r="2" fill="#bfe8ff" opacity="${f2((1 - open) * 0.7)}"/>`); }
      // ประตู: ปิด → เปิด
      o.push(`<g transform="translate(${CXD - RT - 4} ${CYD}) scale(${f2(1 - open * 0.85)} 1)"><rect x="0" y="-${RT}" width="10" height="${2 * RT}" rx="4" fill="#8e9bc4" stroke="#2b3350" stroke-width="1.2" opacity=".85"/></g>`);
      o.push(pill(135, 40, open < 0.5 ? "ปิดสนิททันที ความชื้นขังอยู่" : "เปิดประตูไว้ให้แห้ง", open < 0.5 ? "#ffe9e4" : "#e5f8e9"));
    }
    else if (c === "wipe") {
      o.push(drumView(ph, { ...base, grime: 0.6, rot: 0 }));
      const a = ph * 1.6, cx = CXD + Math.cos(a) * (RT - 10), cy = CYD + Math.sin(a) * (RT - 10);
      o.push(`<g transform="translate(${f2(cx)} ${f2(cy)}) rotate(${f2(a * 57.3 + 90)})"><rect x="-12" y="-6" width="24" height="12" rx="4" fill="#ffe14a" stroke="#2b3350" stroke-width="1"/></g>`, pill(135, 40, "เช็ดขอบยางและถาดผงซักฟอก", "#fff6c9"));
    }
    else if (c === "chk") o.push(calendar(ph, p));
    return o.join("");
  },
};
