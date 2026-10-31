// ฉากอธิบาย: ไฟโซลาร์เซลล์ปักสนาม (solar garden light) แบบตัดครึ่ง — SVG พิกัด 270x480
// แผงโซลาร์ด้านบน → ไดโอด → แบตเตอรี่ชาร์จได้ → วงจรจับความมืด (LDR / แรงดันแผง) → สวิตช์ → LED
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, plen, along, box, DEFS } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#2b3350", anchor = "middle", w = 700) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, anchor: "start" | "end" | "middle" = "middle", fill = "#fff6c9") => {
  const w = s.length * 4.4 + 10;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "start" ? x : x - w;
  return `<rect x="${f2(x0)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".97"/>` +
    txt(x0 + w / 2, y + 0.4, s, 6.4, "#2b3350");
};
const leader = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)}" stroke="#2b3350" stroke-width=".9" stroke-dasharray="2 1.5" fill="none"/><circle cx="${f2(x2)}" cy="${f2(y2)}" r="1.6" fill="#2b3350"/>`;
const pts = (a: Pt[]) => a.map((p) => `${f2(p[0])},${f2(p[1])}`).join(" ");
const xmark = (x: number, y: number, a = 1, s = 4) =>
  `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${s + 1.8}" fill="#fff" stroke="#d94b4b" stroke-width="1"/><path d="M${f2(x - s * 0.7)} ${f2(y - s * 0.7)} L${f2(x + s * 0.7)} ${f2(y + s * 0.7)} M${f2(x + s * 0.7)} ${f2(y - s * 0.7)} L${f2(x - s * 0.7)} ${f2(y + s * 0.7)}" stroke="#d94b4b" stroke-width="1.7" stroke-linecap="round"/></g>`;
const flow = (path: Pt[], ph: number, speed: number, n: number, a: number, c = "#ff9a1a", r = 1.9, rev = false) => {
  if (a < 0.03) return "";
  const L = plen(path);
  let s = "";
  for (let i = 0; i < n; i++) {
    let u = (ph * speed + i / n) % 1;
    if (rev) u = 1 - u;
    const q = along(path, u * L);
    s += `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${r}" fill="${c}" stroke="#fff" stroke-width=".6" opacity="${f2(a)}"/>`;
  }
  return s;
};
const wire = (path: Pt[], on = 0, c = "#2b3350") =>
  `<polyline points="${pts(path)}" fill="none" stroke="#1d2338" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/><polyline points="${pts(path)}" fill="none" stroke="${mixc("#b8c0d6", "#ffc83a", on)}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>`;
const cloudShape = (x: number, y: number, s: number, a: number) =>
  `<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)}) scale(${s})"><ellipse cx="0" cy="6" rx="34" ry="11" fill="#cdd5e2"/><circle cx="-14" cy="-2" r="13" fill="#d9e0ec"/><circle cx="4" cy="-8" r="16" fill="#e4e9f2"/><circle cx="20" cy="0" r="12" fill="#d4dbe8"/></g>`;

// ---- เรขาคณิต ----
const CX = 135;
const PX0 = 66, PX1 = 180, PY0 = 140, PY1 = 154; // แผงโซลาร์
const HX0 = 72, HX1 = 198, HY0 = 154, HY1 = 292; // ตัวเรือนกันน้ำ (ตัดครึ่ง)
const WIN: Pt = [190, 166]; // ตำแหน่ง LDR ใต้หน้าต่างเล็ก
const BAT = { x0: 84, x1: 142, y0: 204, y1: 226 };
const LEDP: Pt = [135, 262];
const GROUND = 402;

const WCH: Pt[] = [[96, 154], [96, 168], [96, 188], [96, 204]]; // แผง → ไดโอด → แบต
const WSN: Pt[] = [[132, 154], [132, 166]]; // สายแรงดันแผงเข้าวงจร
const WLD: Pt[] = [[190, 172], [190, 179], [162, 179]]; // LDR → วงจร
const WBT: Pt[] = [[130, 204], [130, 192]]; // แบต → วงจร
const WOT: Pt[] = [[152, 192], [152, 199], [171, 199], [171, 206]]; // วงจร → สวิตช์
const WLE: Pt[] = [[171, 224], [171, 244], [135, 244], [135, 254]]; // สวิตช์ → LED
const WDIS: Pt[] = [[130, 204], [130, 192], [152, 192], [152, 199], [171, 199], [171, 206], [171, 224], [171, 244], [135, 244], [135, 254]];

const EXTRA = `<defs>
<linearGradient id="sday" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8f8"/><stop offset="1" stop-color="#e3f4ff"/></linearGradient>
<linearGradient id="snight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0f2c"/><stop offset="1" stop-color="#2c3566"/></linearGradient>
<linearGradient id="spanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d5aa8"/><stop offset="1" stop-color="#1f2f66"/></linearGradient>
<linearGradient id="sbat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6fa"/><stop offset="1" stop-color="#aab4c8"/></linearGradient>
<linearGradient id="spole" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d7690"/><stop offset=".4" stop-color="#c9d1e0"/><stop offset="1" stop-color="#5a6684"/></linearGradient>
<radialGradient id="ssun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#ffc83a" stop-opacity=".6"/><stop offset="1" stop-color="#ffc83a" stop-opacity="0"/></radialGradient>
<radialGradient id="sled" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffe98a" stop-opacity=".45"/><stop offset="1" stop-color="#ffe98a" stop-opacity="0"/></radialGradient>
</defs>`;

type S = {
  night: number; sun: number; cloud: number; dirt: number; shade: number; bat: number; led: number;
  chg: number; rev: number; wet: number; yel: number; cell: number; cmp: number; sense: number;
};
const Z: S = { night: 0, sun: 1, cloud: 0, dirt: 0, shade: 0, bat: 0.7, led: 0, chg: 0, rev: 0, wet: 0, yel: 0, cell: 0, cmp: 0, sense: 0 };
const ST: Record<string, [S, S]> = {
  all: [{ ...Z, night: 0, bat: 0.9, chg: 0.6 }, { ...Z, night: 1, sun: 0, bat: 0.9, led: 1 }],
  parts: [Z, Z],
  sun: [{ ...Z, bat: 0.3, chg: 0.6, cell: 1 }, { ...Z, bat: 0.4, chg: 1, cell: 1 }],
  chg: [{ ...Z, bat: 0.2, chg: 1 }, { ...Z, bat: 0.85, chg: 1 }],
  blk: [{ ...Z, night: 0.2, sun: 0.4, bat: 0.85, chg: 0.4 }, { ...Z, night: 1, sun: 0, bat: 0.85, rev: 1 }],
  ldr: [Z, { ...Z, night: 1, sun: 0 }],
  panel: [{ ...Z, sense: 1 }, { ...Z, night: 1, sun: 0, sense: 1 }],
  sw: [{ ...Z, night: 0.6, sun: 0, bat: 0.85 }, { ...Z, night: 1, sun: 0, bat: 0.85, led: 1 }],
  cap: [{ ...Z, night: 1, sun: 0, bat: 1, led: 1 }, { ...Z, night: 1, sun: 0, bat: 0.08, led: 1 }],
  weak: [{ ...Z, bat: 0.45 }, { ...Z, bat: 0.3 }],
  age: [{ ...Z, night: 1, sun: 0, bat: 1, led: 1 }, { ...Z, night: 1, sun: 0, bat: 1, led: 1 }],
  wet: [{ ...Z }, { ...Z }],
  chk: [{ ...Z, night: 1, sun: 0, bat: 0.7, led: 1, cmp: 1 }, { ...Z, night: 1, sun: 0, bat: 0.7, led: 1, cmp: 1 }],
  end: [{ ...Z, night: 0.7, sun: 0.3, bat: 0.9, led: 1 }, { ...Z, night: 0.9, sun: 0.1, bat: 0.9, led: 1 }],
};

export const SCENE_SOLAR: SceneDef = {
  focus: {
    all: { cx: 135, cy: 262, z: 1.0 },
    parts: { cx: 135, cy: 258, z: 1.0 },
    sun: { cx: 135, cy: 188, z: 1.15 },
    chg: { cx: 116, cy: 222, z: 1.85, box: [80, 164, 52, 66] },
    blk: { cx: 116, cy: 222, z: 1.85, box: [80, 164, 52, 66] },
    ldr: { cx: 150, cy: 160, z: 1.8, box: [176, 154, 30, 28], label: "ตัวตรวจแสง" },
    panel: { cx: 135, cy: 156, z: 1.55 },
    sw: { cx: 135, cy: 238, z: 1.65 },
    cap: { cx: 128, cy: 228, z: 1.55 },
    weak: { cx: 135, cy: 206, z: 1.2 },
    age: { cx: 112, cy: 218, z: 2.0 },
    wet: { cx: 135, cy: 214, z: 1.35 },
    chk: { cx: 135, cy: 188, z: 1.15 },
    end: { cx: 135, cy: 262, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = ST[cue] || ST.all;
    const e = ease(p);
    const gv = (k: keyof S) => lerp(A[k], B[k], e);
    let night = gv("night"), sun = gv("sun"), cloud = gv("cloud"), dirt = gv("dirt"), shade = gv("shade");
    let bat = gv("bat"), led = gv("led"), chg = gv("chg"), rev = gv("rev"), wet = gv("wet"), yel = gv("yel");
    const cell = gv("cell"), cmp = gv("cmp"), sense = gv("sense");
    let ldrR = night; // ความต้านทาน LDR (0 = ต่ำ, 1 = สูง)
    let weakStage = 0, wetStage = 0;

    // ---- ปรับตามช่วงของแต่ละ cue ----
    if (cue === "all") { night = ease(cl((p - 0.15) / 0.6)); sun = 1 - night; chg = 0.7 * (1 - night); led = ease(cl((p - 0.6) / 0.15)); ldrR = night; }
    if (cue === "ldr") { night = ease(cl((p - 0.25) / 0.5)); sun = 1 - night; ldrR = night; led = ease(cl((p - 0.78) / 0.12)); }
    if (cue === "panel") { night = ease(cl((p - 0.2) / 0.55)); sun = 1 - night; led = ease(cl((p - 0.75) / 0.12)); }
    if (cue === "sw") { night = ease(cl(p / 0.3)) * 0.4 + 0.6; led = ease(cl((p - 0.3) / 0.15)); }
    if (cue === "blk") { chg = 0.4 * (1 - ease(cl(p / 0.5))); rev = ease(cl((p - 0.55) / 0.15)); }
    if (cue === "cap") { bat = lerp(1, 0.06, p); led = p > 0.93 ? 1 - (p - 0.93) / 0.07 : 1; }
    if (cue === "age") bat = 1;
    if (cue === "weak") {
      weakStage = p < 0.34 ? 1 : p < 0.67 ? 2 : 3;
      cloud = weakStage === 1 ? 1 : 0; dirt = weakStage === 2 ? 1 : 0; shade = weakStage === 3 ? 1 : 0;
      bat = weakStage === 1 ? 0.5 : weakStage === 2 ? 0.38 : 0.3;
      sun = weakStage === 1 ? 0.45 : weakStage === 2 ? 0.55 : 0.5;
      chg = 0.35;
    }
    if (cue === "wet") {
      wetStage = p < 0.4 ? 1 : p < 0.7 ? 2 : 3;
      wet = ease(cl(p / 0.4));
      yel = ease(cl((p - 0.68) / 0.3));
    }
    if (cue === "chg") sun = 1;
    if (cue === "end") { night = 0.7 + 0.2 * Math.sin(ph * 0.8); }
    const nd = cl(night);

    const o: string[] = [DEFS, EXTRA];
    // ---- ฉากหลัง: ท้องฟ้า (เช้า → กลางคืน) ----
    o.push(`<rect x="-140" y="-140" width="550" height="${GROUND + 140}" fill="url(#sday)"/><rect x="-140" y="-140" width="550" height="${GROUND + 140}" fill="url(#snight)" opacity="${f2(nd)}"/>`);
    if (nd > 0.35) for (let i = 0; i < 26; i++) {
      const sx = -30 + rnd(i) * 330, sy = -20 + rnd(i + 40) * 140;
      o.push(`<circle cx="${f2(sx)}" cy="${f2(sy)}" r="${f2(0.5 + rnd(i + 70) * 0.7)}" fill="#fff" opacity="${f2((nd - 0.35) * 1.4 * (0.5 + 0.5 * Math.sin(ph * 2 + i)))}"/>`);
    }
    // พระอาทิตย์ / พระจันทร์
    const sunA = cl(1 - nd * 1.3);
    if (sunA > 0.02) {
      o.push(`<g opacity="${f2(sunA)}"><circle cx="30" cy="44" r="30" fill="url(#ssun)"/><circle cx="30" cy="44" r="11" fill="#ffd23a" stroke="#c98a00" stroke-width=".8"/>`);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + ph * 0.4; o.push(`<path d="M${f2(30 + Math.cos(a) * 15)} ${f2(44 + Math.sin(a) * 15)} L${f2(30 + Math.cos(a) * 20)} ${f2(44 + Math.sin(a) * 20)}" stroke="#ffb200" stroke-width="1.6" stroke-linecap="round"/>`); }
      o.push(`</g>`);
    }
    if (nd > 0.5) o.push(`<g opacity="${f2((nd - 0.5) * 2)}"><circle cx="236" cy="42" r="12" fill="#f4f1d6"/><circle cx="240" cy="39" r="10.5" fill="#1a2048"/></g>`);
    // พื้นสนาม
    const gC = mixc("#7bbf56", "#1f3a2c", nd), gC2 = mixc("#5a9a40", "#142a1f", nd);
    o.push(`<path d="M-140 ${GROUND} Q20 ${GROUND - 14} 135 ${GROUND - 4} T410 ${GROUND - 8} V520 H-140 Z" fill="${gC}"/><rect x="-140" y="${GROUND + 14}" width="550" height="140" fill="${gC2}"/>`);
    for (let i = 0; i < 28; i++) { const gx = -20 + i * 11 + rnd(i) * 4; o.push(`<path d="M${f2(gx)} ${GROUND + 6} l-1.5 -7 M${f2(gx)} ${GROUND + 6} l1.5 -8" stroke="${mixc("#4f8a38", "#2c5a40", nd)}" stroke-width="1.1" stroke-linecap="round"/>`); }

    // ---- แสงอาทิตย์ลงแผง (เคลื่อนไหว) ----
    const rayA = cl(sun) * (1 - cloud * 0.6) * (1 - dirt * 0.3);
    if (rayA > 0.03 && cue !== "cap") {
      for (let k = 0; k < 6; k++) {
        const tx = PX0 + 10 + k * 19;
        const u = (ph * 0.5 + k * 0.17) % 1;
        const sx0 = 36, sy0 = 48;
        const qx = lerp(sx0, tx, u), qy = lerp(sy0, PY0 - 1, u);
        o.push(`<path d="M${f2(sx0)} ${sy0} L${f2(tx)} ${PY0 - 1}" stroke="#ffc83a" stroke-width=".8" stroke-dasharray="3 5" opacity="${f2(0.4 * rayA)}"/>`);
        o.push(`<circle cx="${f2(qx)}" cy="${f2(qy)}" r="1.6" fill="#fff6b0" stroke="#ffb200" stroke-width=".6" opacity="${f2(rayA)}"/>`);
      }
    }

    // ---- ก้านปัก ----
    o.push(`<rect x="131" y="320" width="8" height="${GROUND + 6 - 320}" fill="url(#spole)" stroke="#4a5470" stroke-width=".7"/>`);
    o.push(`<path d="M131 ${GROUND - 2} l4 18 l4 -18z" fill="#6d7690" stroke="#4a5470" stroke-width=".7" opacity=".0"/>`);
    // ---- แสงจาก LED (ด้านหลังโคม) ----
    const ledOn = cl(led);
    if (ledOn > 0.02) {
      const fl = 0.92 + 0.08 * Math.sin(ph * 9);
      o.push(`<ellipse cx="${LEDP[0]}" cy="${LEDP[1] + 46}" rx="${f2(78 * ledOn)}" ry="${f2(70 * ledOn)}" fill="url(#sled)" opacity="${f2(ledOn * fl)}"/>`);
      o.push(`<ellipse cx="${CX}" cy="${GROUND - 2}" rx="${f2(62 * ledOn)}" ry="7" fill="#fff3b0" opacity="${f2(0.45 * ledOn)}" filter="url(#bl)"/>`);
    }

    // ---- ตัวโคมใต้ตัวเรือน (กระจายแสง) ----
    o.push(`<path d="M${HX0 + 12} ${HY1} Q${HX0 + 10} 322 ${CX - 8} 334 H${CX + 8} Q${HX1 - 10} 322 ${HX1 - 12} ${HY1} Z" fill="${mixc("#f2f8ff", "#fff6c0", ledOn)}" stroke="#5a6684" stroke-width="1" opacity=".9"/>`);

    // ---- ตัวเรือนกันน้ำ (ตัดครึ่ง) ----
    o.push(`<g filter="url(#sh)"><rect x="${HX0}" y="${HY0}" width="${HX1 - HX0}" height="${HY1 - HY0}" rx="10" fill="#e8f1f9" stroke="#5a6684" stroke-width="1.4"/></g>`);
    o.push(`<rect x="${HX0 + 6}" y="${HY0 + 4}" width="${HX1 - HX0 - 12}" height="${HY1 - HY0 - 10}" rx="6" fill="#f6fafd"/>`);
    // น้ำที่ซึมเข้ามา
    if (wet > 0.02 && cue === "wet") {
      const wl = HY1 - 6 - 22 * wet;
      o.push(`<clipPath id="shous"><rect x="${HX0 + 6}" y="${HY0 + 4}" width="${HX1 - HX0 - 12}" height="${HY1 - HY0 - 10}" rx="6"/></clipPath><g clip-path="url(#shous)">`);
      o.push(`<rect x="${HX0}" y="${f2(wl)}" width="${HX1 - HX0}" height="60" fill="#58b8f8" opacity=".75"/>${H.wave(HX0, HX1, wl, 0.8, ph * 3, HY1, "#8fd3ff", 0.8)}</g>`);
    }

    // ---- สายไฟ + กระแส ----
    const chgOn = chg;
    o.push(wire(WCH, chgOn), wire(WSN, sense ? 0.0 : 0), wire(WLD, 0), wire(WBT, 0), wire(WOT, 0), wire(WLE, ledOn));
    if (sense > 0.5) o.push(`<polyline points="${pts(WSN)}" fill="none" stroke="#ffe14a" stroke-width="3.4" stroke-linecap="round" opacity="${f2(0.5 + 0.4 * Math.sin(ph * 6))}"/>`);
    // กระแสชาร์จ: แผง → ไดโอด → แบต
    if (cue !== "blk" || rev < 0.5) o.push(flow(WCH, ph, 0.45, 5, chgOn * rayA > 0 ? chgOn * Math.max(rayA, cue === "chg" || cue === "sun" ? 1 : rayA) : 0));
    // กระแสจ่ายไฟกลางคืน: แบต → วงจร → สวิตช์ → LED
    if (ledOn > 0.05) o.push(flow(WDIS, ph, 0.5, 8, ledOn, "#ffb000"));

    // ---- ไดโอด ----
    o.push(`<g><polygon points="90,171 102,171 96,182" fill="#ffd9a0" stroke="#1d2338" stroke-width="1"/><rect x="89" y="182.2" width="14" height="2" fill="#1d2338"/></g>`);
    // ---- วงจร (แผ่น PCB) ----
    {
      const on = cl(night * (cue === "panel" ? 1 : 1));
      o.push(`<rect x="118" y="166" width="44" height="26" rx="3" fill="#2f6b4a" stroke="#143826" stroke-width="1"/>`);
      for (let i = 0; i < 4; i++) o.push(`<rect x="${123 + i * 9.5}" y="164" width="3" height="3" fill="#c9d1e0"/><rect x="${123 + i * 9.5}" y="191" width="3" height="3" fill="#c9d1e0"/>`);
      o.push(`<rect x="126" y="171" width="28" height="12" rx="1.5" fill="#1b2a22"/>` + txt(140, 180.2, "วงจร", 6.4, "#cfe9d8", "middle", 800));
      o.push(`<circle cx="156" cy="170" r="1.6" fill="${mixc("#33563f", "#ffdf4a", on)}"/>`);
    }
    // ---- LDR ----
    {
      const r = 5.6;
      o.push(`<rect x="183" y="${HY0 - 1}" width="14" height="5" rx="2" fill="#dff1ff" stroke="#5a6684" stroke-width=".8"/>`);
      o.push(`<circle cx="${WIN[0]}" cy="${WIN[1]}" r="${r}" fill="#d9a441" stroke="#6b4a10" stroke-width="1"/><path d="M${WIN[0] - 3.6} ${WIN[1] - 2.4} h7.2 M${WIN[0] + 3.6} ${WIN[1] - 0.6} h-7.2 M${WIN[0] - 3.6} ${WIN[1] + 1.2} h7.2 M${WIN[0] + 3.6} ${WIN[1] + 3} h-7.2" stroke="#6b4a10" stroke-width=".9" fill="none"/>`);
      if (cue === "ldr") {
        // ลูกศรแสงเข้าหน้าต่าง LDR
        for (let k = 0; k < 2; k++) {
          const u = (ph * 0.8 + k * 0.5) % 1;
          o.push(H.varrow(WIN[0] - 5 + k * 10, 128 + u * 20, "#ffb200", sun * (1 - u * 0.4), 1));
        }
      }
    }
    // ---- แบตเตอรี่ ----
    {
      const bw = BAT.x1 - BAT.x0;
      const bf = cl(bat);
      o.push(`<g filter="url(#sh2)"><rect x="${BAT.x0}" y="${BAT.y0}" width="${bw}" height="${BAT.y1 - BAT.y0}" rx="4" fill="url(#sbat)" stroke="#2b3350" stroke-width="1.1"/><rect x="${BAT.x0 - 4}" y="${f2((BAT.y0 + BAT.y1) / 2 - 4)}" width="4.5" height="8" rx="1.2" fill="#9aa4ba" stroke="#2b3350" stroke-width=".8"/></g>`);
      const ageK = cue === "age" ? lerp(1, 0.52, ease(p)) : 1; // ความจุจริงของแบตที่เสื่อม
      const fillW = (bw - 8) * bf * ageK;
      const fc = bf > 0.5 ? "#59c36a" : bf > 0.22 ? "#f2c230" : "#e0533d";
      if (cue === "age") o.push(`<rect x="${BAT.x0 + 4}" y="${BAT.y0 + 4}" width="${bw - 8}" height="${BAT.y1 - BAT.y0 - 8}" rx="2" fill="none" stroke="#2b3350" stroke-width=".8" stroke-dasharray="2.5 2"/>`);
      o.push(`<rect x="${BAT.x0 + 4}" y="${BAT.y0 + 4}" width="${f2(Math.max(0, fillW))}" height="${BAT.y1 - BAT.y0 - 8}" rx="2" fill="${fc}"/>`);
      o.push(txt(BAT.x0 + 3.5, BAT.y0 - 2.5, "+", 7, "#d94b4b", "middle", 900));
      // ผงสนิมที่ขั้ว
      if (cue === "wet" && wetStage >= 2) {
        const ca = wetStage === 2 ? ease(cl((p - 0.4) / 0.2)) : 1;
        for (let i = 0; i < 7; i++) o.push(`<circle cx="${f2(BAT.x0 - 2 + rnd(i + 3) * 12)}" cy="${f2(BAT.y0 + 1 + rnd(i + 9) * 20)}" r="${f2(1.2 + rnd(i) * 1.2)}" fill="#3fae8a" stroke="#1d6b55" stroke-width=".4" opacity="${f2(ca)}"/>`);
        o.push(`<circle cx="96" cy="202" r="2.4" fill="#3fae8a" opacity="${f2(ca)}"/><circle cx="130" cy="203" r="2" fill="#3fae8a" opacity="${f2(ca)}"/>`);
      }
    }
    // ---- สวิตช์เปิดปิด ----
    {
      o.push(`<rect x="158" y="206" width="26" height="18" rx="3" fill="#cdd5e4" stroke="#2b3350" stroke-width="1"/><rect x="162" y="211" width="18" height="8" rx="2" fill="#4a5470"/>`);
      o.push(`<rect x="${ledOn > 0.05 || cue === "wet" || cue === "sw" ? 171 : 164}" y="209" width="8" height="12" rx="2" fill="#f4f6fa" stroke="#2b3350" stroke-width=".8"/>`);
    }
    // ---- LED ----
    {
      const [lx, ly] = LEDP;
      o.push(`<path d="M${lx - 7} ${ly - 8} h14 v6 h-14z" fill="#9aa4ba" stroke="#2b3350" stroke-width=".8"/>`);
      o.push(`<path d="M${lx - 7} ${ly - 2} Q${lx - 8} ${ly + 12} ${lx} ${ly + 12} Q${lx + 8} ${ly + 12} ${lx + 7} ${ly - 2} Z" fill="${mixc("#d6e6f5", "#fff3a0", ledOn)}" stroke="#2b3350" stroke-width=".9"/>`);
      o.push(`<path d="M${lx - 2} ${ly - 2} V${ly + 4} M${lx + 2} ${ly - 2} V${ly + 4} M${lx - 3} ${ly + 4} h6" stroke="${mixc("#8a94ac", "#ff9a1a", ledOn)}" stroke-width="1" fill="none"/>`);
      if (ledOn > 0.05) o.push(`<circle cx="${lx}" cy="${ly + 4}" r="${f2(10 + 3 * ledOn)}" fill="#fff3a0" opacity="${f2(0.5 * ledOn)}" filter="url(#bl)"/>`);
    }
    // ---- ปะเก็นกันน้ำ + ฝาครอบแผง ----
    const crack = cue === "wet" && wetStage >= 1;
    o.push(`<rect x="${HX0 - 2}" y="${HY0 - 3}" width="${HX1 - HX0 + 4}" height="6" rx="3" fill="#3a4160" stroke="#1d2338" stroke-width=".8" ${crack ? 'stroke-dasharray="14 3"' : ""}/>`);
    // ---- แผงโซลาร์ ----
    {
      const shine = 0.5 + 0.5 * Math.sin(ph * 2);
      o.push(`<g filter="url(#sh2)"><rect x="${PX0}" y="${PY0}" width="${PX1 - PX0}" height="${PY1 - PY0}" rx="3" fill="url(#spanel)" stroke="#12183a" stroke-width="1.2"/></g>`);
      for (let i = 1; i < 6; i++) o.push(`<rect x="${f2(PX0 + i * (PX1 - PX0) / 6)}" y="${PY0 + 1}" width=".9" height="${PY1 - PY0 - 2}" fill="#aab8e8" opacity=".75"/>`);
      o.push(`<rect x="${PX0 + 3}" y="${PY0 + 1.5}" width="${PX1 - PX0 - 6}" height="2" rx="1" fill="#fff" opacity="${f2(0.2 + 0.2 * shine * (1 - nd))}"/>`);
      // ฝุ่น
      if (dirt > 0.02) for (let i = 0; i < 46; i++) o.push(`<circle cx="${f2(PX0 + 3 + rnd(i) * (PX1 - PX0 - 6))}" cy="${f2(PY0 + 2 + rnd(i + 50) * (PY1 - PY0 - 4))}" r="${f2(0.7 + rnd(i + 90) * 1.5)}" fill="#c9b48a" opacity="${f2(0.8 * dirt)}"/>`);
      // เงาบัง (กิ่งไม้)
      if (shade > 0.02) {
        o.push(`<path d="M${PX0 - 4} ${PY0 - 3} L${PX0 + 70} ${PY0 - 3} Q${PX0 + 50} ${PY0 + 7} ${PX0 + 66} ${PY1 + 1} L${PX0 - 4} ${PY1 + 1} Z" fill="#0b0f2c" opacity="${f2(0.55 * shade)}"/>`);
        o.push(`<path d="M20 70 Q60 80 90 112 T ${PX0 + 52} ${PY0 - 4}" stroke="#4a3320" stroke-width="3" fill="none" opacity="${f2(shade)}"/>`);
        for (let i = 0; i < 5; i++) o.push(`<ellipse cx="${f2(48 + i * 10)}" cy="${f2(88 + i * 7)}" rx="8" ry="4" fill="#3f7d3a" transform="rotate(${f2(30 + i * 8)} ${f2(48 + i * 10)} ${f2(88 + i * 7)})" opacity="${f2(shade)}"/>`);
      }
      // ฝาครอบเหลืองขุ่น
      if (yel > 0.02) {
        o.push(`<rect x="${PX0}" y="${PY0}" width="${PX1 - PX0}" height="${PY1 - PY0}" rx="3" fill="#f2d23a" opacity="${f2(0.7 * yel)}"/>`);
        for (let k = 0; k < 4; k++) { const u = (ph * 0.7 + k * 0.25) % 1; o.push(H.varrow(PX0 + 12 + k * 30, 100 + u * 30, "#b074e8", 0.9 * yel * Math.sin(Math.PI * u), 1)); }
      }
    }
    // เมฆ
    if (cloud > 0.02) o.push(cloudShape(lerp(60, 104, p / 0.34 > 1 ? 1 : p / 0.34) + 14, 92, 1.35, 0.95 * cloud));

    // ================= ภาพประกอบเฉพาะ cue =================
    if (cue === "all") o.push(pill(CX, 104, "ข้างในไฟโซลาร์ปักสนาม", "middle", "#fff6c9"));
    if (cue === "end") o.push(pill(CX, 104, "ดูข้างในของใช้ ยังไงนะ", "middle", "#fff6c9"));

    if (cue === "parts") {
      o.push(pill(60, 130, "แผงโซลาร์", "end", "#fff0c9") + leader(60, 127, 78, 144));
      o.push(pill(66, 202, "แบตชาร์จได้", "end", "#e3f6df") + leader(66, 200, 86, 212));
      o.push(pill(206, 128, "ตัวตรวจแสง", "start", "#fff0c9") + leader(236, 130, 196, 164));
      o.push(pill(206, 188, "วงจร", "start", "#dfe6ff") + leader(206, 186, 164, 182));
      o.push(pill(206, 236, "สวิตช์", "start", "#e9f4ff") + leader(206, 234, 186, 218));
      o.push(pill(206, 268, "LED", "start", "#fff6c9") + leader(206, 266, 146, 264));
      o.push(pill(66, 268, "เรือนกันน้ำ", "end", "#dfe6ff") + leader(66, 266, HX0 + 1, 254));
    }

    if (cue === "sun") {
      // ขยายหน้าตัดเซลล์แสงอาทิตย์
      const cx0 = 52, cx1 = 246, cy0 = 12, cy1 = 124;
      o.push(`<path d="M${PX0} ${PY0} L${cx0} ${cy1} M${PX1} ${PY0} L${cx1} ${cy1}" stroke="#2b3350" stroke-width=".9" stroke-dasharray="3 2" opacity=".7"/>`);
      o.push(`<rect x="${cx0}" y="${cy0}" width="${cx1 - cx0}" height="${cy1 - cy0}" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.4" opacity=".97"/>`);
      o.push(txt(149, 25, "ในเซลล์: ซิลิคอนสองชั้น", 7, "#b53a10", "middle", 900));
      const lx0 = 70, lx1 = 214, ny0 = 50, ny1 = 68, py1 = 98;
      o.push(`<rect x="${lx0}" y="${ny0}" width="${lx1 - lx0}" height="${ny1 - ny0}" fill="#9cc8f4" stroke="#2b3350" stroke-width=".9"/>` + txt(lx0 + 6, 62.2, "ชั้น N", 5.8, "#1d3a66", "start", 800));
      o.push(`<rect x="${lx0}" y="${ny1}" width="${lx1 - lx0}" height="${py1 - ny1}" fill="#f6c58a" stroke="#2b3350" stroke-width=".9"/>` + txt(lx0 + 6, 91, "ชั้น P", 5.8, "#7a4a10", "start", 800));
      o.push(`<rect x="${lx0}" y="${ny1 - 0.6}" width="${lx1 - lx0}" height="1.2" fill="#7a56c8"/>`);
      // โฟตอนตกลงมา
      for (let k = 0; k < 4; k++) {
        const u = (ph * 0.6 + k * 0.25) % 1;
        const qx = 92 + k * 32, qy = 36 + u * 40;
        o.push(`<path d="M${f2(qx - 4)} ${f2(qy - 4)} q2-3 4 0t4 0" fill="none" stroke="#ffb200" stroke-width="1.5" stroke-linecap="round"/><circle cx="${f2(qx + 5)}" cy="${f2(qy - 1)}" r="1.6" fill="#ffb200" opacity="${f2(1 - u * 0.2)}"/>`);
      }
      o.push(txt(86, 47, "แสง", 5.8, "#b57b00", "middle", 800));
      // อิเล็กตรอนถูกสนามไฟฟ้าดันออกไปเป็นกระแส
      const LOOP: Pt[] = [[104, 84], [104, 106], [226, 106], [226, 63], [216, 63]];
      o.push(`<polyline points="${pts(LOOP)}" fill="none" stroke="#1d2338" stroke-width="1.6"/>`);
      o.push(`<circle cx="226" cy="84" r="9" fill="#fff6c9" stroke="#2b3350" stroke-width="1"/>` + txt(226, 86.6, "ไฟ", 6.2, "#b53a10", "middle", 900));
      for (let k = 0; k < 4; k++) {
        const u = (ph * 0.28 + k * 0.25) % 1, q = along(LOOP, u * plen(LOOP));
        o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="2" fill="#2f8fe0" stroke="#fff" stroke-width=".6"/>`);
      }
      for (let k = 0; k < 4; k++) { const u = (ph * 0.7 + k * 0.25) % 1; o.push(`<circle cx="${130 + k * 22}" cy="${f2(96 - 26 * u)}" r="1.8" fill="#2f8fe0" stroke="#fff" stroke-width=".5" opacity="${f2(Math.sin(Math.PI * u))}"/>`); }
      o.push(txt(176, 80, "สนามไฟฟ้า", 5.4, "#5b3aa8", "start", 800));
      o.push(txt(149, 118, "แสงดันอิเล็กตรอนให้วิ่งเป็นกระแส", 6.2, "#2b3350", "middle", 700));
    }

    if (cue === "chg") {
      o.push(pill(80, 182, "ไดโอด", "end", "#ffe1c9") + leader(80, 180, 90, 178));
      o.push(pill(84, 242, "ไฟไหลไปชาร์จแบต", "start", "#e3f6df"));
    }
    if (cue === "blk") {
      // กลางคืน: แบตพยายามไหลย้อนกลับ แต่ไดโอดกั้น
      if (rev > 0.02) {
        o.push(flow(WCH, ph, 0.5, 3, rev * 0.9, "#ff5a2a", 1.9, true));
        o.push(xmark(96, 178, rev));
        o.push(pill(84, 242, "ไหลย้อนไม่ได้", "start", "#ffe1c9"));
      }
      o.push(pill(80, 182, "ไดโอด", "end", "#ffe1c9") + leader(80, 180, 90, 178));
      if (nd > 0.6) o.push(pill(116, 134, "กลางคืน แผงไม่ผลิตไฟ", "middle", "#dfe6ff"));
    }

    if (cue === "ldr") {
      // มิเตอร์ความต้านทาน
      const mx = 98, my = 96, mw = 100;
      o.push(`<rect x="${mx - 6}" y="${my - 14}" width="${mw + 12}" height="30" rx="7" fill="#fffaf0" stroke="#2b3350" stroke-width="1.1" opacity=".96"/>`);
      o.push(txt(mx + mw / 2, my - 5, "ความต้านทาน LDR", 6, "#2b3350", "middle", 800));
      o.push(`<rect x="${mx}" y="${my}" width="${mw}" height="6" rx="3" fill="url(#sday)" stroke="#2b3350" stroke-width=".7"/><rect x="${mx}" y="${my}" width="${mw}" height="6" rx="3" fill="url(#snight)" opacity="${f2(0.9 * ldrR)}"/>`);
      o.push(`<circle cx="${f2(mx + 3 + (mw - 6) * ldrR)}" cy="${my + 3}" r="4.6" fill="#ffd23a" stroke="#2b3350" stroke-width="1"/>`);
      o.push(txt(mx, my + 13, "ต่ำ", 5.6, "#46526b", "start") + txt(mx + mw, my + 13, "สูง", 5.6, "#46526b", "end"));
      o.push(pill(206, 128, ldrR < 0.5 ? "สว่าง: ต้านทานต่ำ" : ldrR < 0.85 ? "มืด: ต้านทานสูง" : "มืด: ต้านทานสูง = เปิดไฟ", "end", ldrR < 0.5 ? "#fff0c9" : ldrR < 0.85 ? "#dfe6ff" : "#fff6c9"));
    }

    if (cue === "panel") {
      // มิเตอร์แรงดันของแผง
      const gx = 135, gy = 100, gr = 26;
      const v = cl(lerp(0.95, 0.04, ease(cl((p - 0.2) / 0.55))));
      o.push(`<rect x="${gx - 38}" y="${gy - 34}" width="76" height="46" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.1" opacity=".96"/>`);
      o.push(`<path d="M${gx - gr} ${gy} A${gr} ${gr} 0 0 1 ${gx + gr} ${gy}" fill="none" stroke="#2b3350" stroke-width="1.4"/>`);
      o.push(`<path d="M${gx - gr} ${gy} A${gr} ${gr} 0 0 1 ${f2(gx - gr * Math.cos(Math.PI * 0.14))} ${f2(gy - gr * Math.sin(Math.PI * 0.14))}" fill="none" stroke="#d94b4b" stroke-width="3"/>`);
      const th = Math.PI * (1 - v);
      o.push(`<path d="M${gx} ${gy} L${f2(gx + Math.cos(th) * (gr - 3))} ${f2(gy - Math.sin(th) * (gr - 3))}" stroke="#1d2338" stroke-width="1.8" stroke-linecap="round"/><circle cx="${gx}" cy="${gy}" r="2.4" fill="#1d2338"/>`);
      o.push(txt(gx, gy + 9, "แรงดันจากแผง", 5.8, "#2b3350", "middle", 800));
      o.push(pill(CX, 128, v > 0.3 ? "แผงมีไฟ = ยังสว่าง" : "แรงดันตก = มืดแล้ว", "middle", v > 0.3 ? "#fff0c9" : "#dfe6ff"));
    }

    if (cue === "sw") {
      o.push(pill(210, 236, "สวิตช์เปิดปิด", "end", "#e9f4ff") + leader(206, 234, 186, 217));
      if (ledOn > 0.1) {
        o.push(pill(CX, 128, "มืด: ต่อแบตเข้า LED", "middle", "#fff6c9"));
      } else o.push(pill(CX, 128, "วงจรจับได้ว่ามืด", "middle", "#dfe6ff"));
    }

    if (cue === "cap") {
      // แถบเวลาที่ไฟติด
      const bx = 78, by = 112, bw = 114;
      o.push(`<rect x="${bx - 8}" y="${by - 16}" width="${bw + 16}" height="38" rx="7" fill="#fffaf0" stroke="#2b3350" stroke-width="1.1" opacity=".96"/>`);
      o.push(txt(bx + bw / 2, by - 5, "ไฟติดไปจนกว่าแบตจะหมด", 6.2, "#2b3350", "middle", 800));
      o.push(`<rect x="${bx}" y="${by}" width="${bw}" height="7" rx="3.5" fill="#dfe6ff" stroke="#2b3350" stroke-width=".7"/><rect x="${bx}" y="${by}" width="${f2(bw * p)}" height="7" rx="3.5" fill="#ffc83a"/>`);
      for (let i = 1; i < 6; i++) o.push(`<rect x="${f2(bx + i * bw / 6)}" y="${by + 8}" width=".8" height="3" fill="#2b3350"/>`);
      o.push(txt(bx, by + 17, "ค่ำ", 5.4, "#46526b", "start") + txt(bx + bw, by + 17, "ไฟดับ", 5.4, "#d94b4b", "end"));
      o.push(pill(106, 240, "เก็บไฟได้จำกัด", "middle", "#e3f6df"));
    }

    if (cue === "weak") {
      const txs = ["ฟ้าครึ้ม แสงอ่อน", "ฝุ่นเกาะแผง", "มีเงาบัง"];
      o.push(pill(CX, 126, txs[weakStage - 1] || "", "middle", "#ffe1c9"));
      o.push(pill(168, 238, "ชาร์จไม่เต็ม ไฟจึงสั้นลง", "end", "#fff0c9"));
    }

    if (cue === "age") {
      // ลูกศรชาร์จ/ใช้ซ้ำ
      const rot = ph * 90;
      o.push(`<g transform="translate(60 114) rotate(${f2(rot)}) scale(.7)"><path d="M-10 0 A10 10 0 0 1 8 -6" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M10 0 A10 10 0 0 1 -8 6" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M9 -10 l1 6 l-6 -1z M-9 10 l-1 -6 l6 1z" fill="#fff"/></g>`);
      o.push(pill(70, 118, "ชาร์จ-ใช้ซ้ำทุกวัน", "start", "#fff6c9"));
      o.push(pill(112, 132, "เส้นประ = ความจุตอนใหม่", "middle", "#e3f6df"));
      o.push(pill(84, 238, "ความจุลดลง", "start", "#ffe1c9") + leader(110, 230, 110, 222));
    }

    if (cue === "wet") {
      // ฝนตก
      for (let i = 0; i < 18; i++) {
        const rx = 40 + rnd(i + 5) * 190, u = (ph * 1.2 + rnd(i) * 3) % 1;
        const ry = 20 + u * 130;
        o.push(`<path d="M${f2(rx)} ${f2(ry)} l-1.5 5" stroke="#58b8f8" stroke-width="1.2" stroke-linecap="round" opacity=".85"/>`);
      }
      if (wetStage === 1) {
        for (let k = 0; k < 3; k++) { const u = (ph * 0.8 + k * 0.33) % 1; o.push(`<circle cx="${f2(84 + k * 2)}" cy="${f2(158 + u * 70)}" r="1.8" fill="#58b8f8" stroke="#fff" stroke-width=".5" opacity="${f2(1 - u)}"/>`); }
        o.push(pill(206, 124, "ซีลเสื่อม น้ำซึมเข้า", "end", "#dfe6ff") + leader(150, 127, 84, 155));
      }
      if (wetStage === 2) o.push(pill(84, 238, "ขั้วแบตเป็นสนิม", "start", "#e3f6df") + leader(96, 230, 90, 218));
      if (wetStage === 3) o.push(pill(206, 126, "แดดแรง: ฝาครอบเหลืองขุ่น", "end", "#fff0a0") + leader(158, 128, 150, 142));
    }

    if (cue === "chk") {
      const cx0 = 30, cx1 = 240, cy0 = 12, cy1 = 124;
      o.push(`<rect x="${cx0}" y="${cy0}" width="${cx1 - cx0}" height="${cy1 - cy0}" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width="1.4" opacity="${f2(0.97 * cmp)}"/>`);
      o.push(txt(135, 27, "เทียบสองคืนที่แดดจัดเต็มวัน", 7, "#b53a10", "middle", 900));
      const rows: [string, number, string][] = [["ตอนติดตั้งใหม่", 0.9, "#59c36a"], ["ตอนนี้", lerp(0.3, 0.52, 0.5 + 0.5 * Math.sin(ph * 1.2)) * 0 + 0.55 * ease(cl(p / 0.6)), "#f2c230"]];
      rows.forEach(([lab, val, col], i) => {
        const y = 44 + i * 36;
        o.push(txt(cx0 + 12, y + 2, lab, 6.4, "#2b3350", "start", 800));
        o.push(`<rect x="${cx0 + 12}" y="${y + 7}" width="186" height="9" rx="4.5" fill="#dfe6ff" stroke="#2b3350" stroke-width=".7"/><rect x="${cx0 + 12}" y="${y + 7}" width="${f2(186 * (i === 0 ? 0.9 * ease(cl(p / 0.35)) : val))}" height="9" rx="4.5" fill="${col}"/>`);
      });
      for (let i = 0; i <= 6; i++) o.push(`<rect x="${f2(cx0 + 12 + i * 31)}" y="${44 + 7 + 38 + 20}" width=".8" height="3" fill="#2b3350" opacity="0"/>`);
      o.push(txt(cx0 + 12, 116, "ค่ำ", 5.4, "#46526b", "start") + txt(cx1 - 12, 116, "ดึก", 5.4, "#46526b", "end"));
      if (p > 0.6) o.push(txt(cx0 + 12 + 186 * 0.58 + 8, 88, "?", 11, "#d94b4b", "middle", 900));
    }

    o.push(box(SCENE_SOLAR.focus[cue]?.box, ph));
    return o.join("");
  },
};
