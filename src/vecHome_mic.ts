// ฉากอธิบาย: ไมค์ไร้สายหนีบเสื้อ (2.4 GHz + ตัวรับเสียบมือถือ) — SVG พิกัด 270x480 (โลกยาวลงล่าง กล้องเลื่อนตาม cue)
// ส่วนต่างๆ ของโลก: P คนพูด 0-236 · T ตัวส่งแบบตัดครึ่ง 240-532 · R มือถือ+ตัวรับ 560-700 · L จับคู่/ดีเลย์ 720-860 · H ช่องความถี่ 880-1020 · C เคสชาร์จ 1050-1230 · N ทบทวน 1260-1480
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, box, DEFS } = H;
type Pt = [number, number];
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#2b3350", anchor = "middle", w = 700) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, anchor: "start" | "end" | "middle" = "middle", fill = "#fff6c9") => {
  const w = s.length * 4.4 + 10;
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "start" ? x : x - w;
  return `<rect x="${f2(x0)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".97"/>` +
    txt(x0 + w / 2, y + 0.4, s, 6.2, "#2b3350");
};
const leader = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${f2(x1)} ${f2(y1)} L${f2(x2)} ${f2(y2)}" stroke="#2b3350" stroke-width=".9" stroke-dasharray="2 1.5" fill="none"/><circle cx="${f2(x2)}" cy="${f2(y2)}" r="1.6" fill="#2b3350"/>`;
const xmark = (x: number, y: number, a = 1, s = 4) =>
  `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${s + 1.8}" fill="#fff" stroke="#d94b4b" stroke-width="1"/><path d="M${f2(x - s * 0.7)} ${f2(y - s * 0.7)} L${f2(x + s * 0.7)} ${f2(y + s * 0.7)} M${f2(x + s * 0.7)} ${f2(y - s * 0.7)} L${f2(x - s * 0.7)} ${f2(y + s * 0.7)}" stroke="#d94b4b" stroke-width="1.7" stroke-linecap="round"/></g>`;
const tick = (x: number, y: number, a = 1, s = 4) =>
  `<g opacity="${f2(a)}"><circle cx="${f2(x)}" cy="${f2(y)}" r="${s + 1.8}" fill="#fff" stroke="#2e9e5b" stroke-width="1"/><path d="M${f2(x - s * 0.6)} ${f2(y)} L${f2(x - s * 0.1)} ${f2(y + s * 0.55)} L${f2(x + s * 0.75)} ${f2(y - s * 0.6)}" fill="none" stroke="#2e9e5b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) =>
  `M${f2(cx + r * Math.cos(a0))} ${f2(cy + r * Math.sin(a0))} A${f2(r)} ${f2(r)} 0 0 1 ${f2(cx + r * Math.cos(a1))} ${f2(cy + r * Math.sin(a1))}`;
// รูปคลื่นเสียงพูดจำลอง
const vw = (u: number) => 0.65 * Math.sin(u) + 0.35 * Math.sin(2.3 * u + 1.2);
const wpath = (x0: number, x1: number, yc: number, fn: (x: number) => number, st = 2) => {
  let d = "";
  for (let x = x0; x <= x1 + 0.01; x += st) d += (d ? " L" : "M") + f2(x) + " " + f2(yc - fn(x));
  return d;
};
const bitsStr = (n: number, seed: number) => Array.from({ length: n }, (_, i) => (rnd(i + seed) > 0.5 ? "1" : "0")).join("");

// ---------- ค่าคงที่ตำแหน่ง ----------
const PORTX = 97; // กึ่งกลางรูรับเสียง
const MOUTH: Pt = [98, 114];
const CLIP: Pt = [109, 182];
const BODY = { x: 48, y: 276, w: 178, h: 240 };
const YD = 314; // ไดอะแฟรม (ตอนนิ่ง)
const YB = 330; // แผ่นหลัง
const ROW = { adc: 364, dsp: 402, rad: 440, bat: 480 };
const ANT: Pt = [214, 453]; // ปลายเสาอากาศ (จุดกำเนิดคลื่นวิทยุ)
const RXP: Pt = [229, 604]; // ตัวรับบนมือถือ
const CHN = 16, CX0 = 26, CW = 13.6, HB = 990; // ช่องความถี่

const EXTRA = `<defs>
<linearGradient id="mskin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d3ae"/><stop offset="1" stop-color="#e8b88a"/></linearGradient>
<linearGradient id="mscreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb8ee"/><stop offset="1" stop-color="#c9e7fb"/></linearGradient>
<linearGradient id="mcase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f8"/><stop offset="1" stop-color="#c3cde3"/></linearGradient>
<linearGradient id="mwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf3de"/><stop offset=".5" stop-color="#f3e6cb"/><stop offset="1" stop-color="#e7d6b4"/></linearGradient>
<radialGradient id="mglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#b58cff" stop-opacity=".7"/><stop offset="1" stop-color="#b58cff" stop-opacity="0"/></radialGradient>
</defs>`;

type S = { cov: number; bat: number; cap: number; dirt: number; amp: number; rf: number };
const Z: S = { cov: 0, bat: 0.8, cap: 1, dirt: 0, amp: 0.45, rf: 0.4 };
const ZF: S = { ...Z, cov: 1 };
const ST: Record<string, [S, S]> = {
  all: [Z, Z],
  sound: [{ ...Z, amp: 0.8 }, { ...Z, amp: 0.9 }],
  diaphragm: [{ ...Z, amp: 1 }, { ...Z, amp: 1 }],
  signal: [{ ...Z, amp: 1 }, { ...Z, amp: 1 }],
  adc: [{ ...Z, amp: 0.9 }, { ...Z, amp: 0.9 }],
  dsp: [{ ...Z, amp: 0.9 }, { ...Z, amp: 0.9 }],
  wind: [{ ...Z, amp: 1 }, { ...ZF, amp: 0.6 }],
  radio: [{ ...ZF, amp: 0.8, rf: 1 }, { ...ZF, amp: 0.8, rf: 1 }],
  pair: [{ ...ZF, rf: 0.6 }, { ...ZF, rf: 0.6 }],
  hop: [{ ...ZF, rf: 0.6 }, { ...ZF, rf: 0.6 }],
  batt: [{ ...ZF, bat: 1 }, { ...ZF, bat: 0.12 }],
  case: [ZF, ZF],
  wear: [{ ...ZF, dirt: 0, cap: 1, bat: 0.8 }, { ...ZF, dirt: 1, cap: 0.68, bat: 0.54 }],
  nudge: [ZF, ZF],
  end: [ZF, ZF],
};

export const SCENE_MIC: SceneDef = {
  focus: {
    all: { cx: 135, cy: 290, z: 1.0 },
    sound: { cx: 104, cy: 190, z: 1.5, box: [86, 108, 46, 92] },
    diaphragm: { cx: 128, cy: 338, z: 1.8, box: [64, 300, 66, 54], label: "ไดอะแฟรม" },
    signal: { cx: 139, cy: 352, z: 1.7, box: [64, 300, 150, 54] },
    adc: { cx: 138, cy: 402, z: 1.7, box: [62, 362, 152, 34], label: "แปลงเป็นตัวเลข" },
    dsp: { cx: 138, cy: 440, z: 1.7, box: [62, 400, 152, 34], label: "ชิปตัดเสียงรบกวน" },
    wind: { cx: 100, cy: 318, z: 1.7, box: [58, 252, 78, 100] },
    radio: { cx: 135, cy: 620, z: 0.8 },
    pair: { cx: 135, cy: 838, z: 1.1 },
    hop: { cx: 135, cy: 995, z: 1.1 },
    batt: { cx: 131, cy: 520, z: 1.8, box: [60, 478, 144, 30] },
    case: { cx: 135, cy: 1200, z: 1.1 },
    wear: { cx: 135, cy: 470, z: 0.95 },
    nudge: { cx: 135, cy: 1450, z: 1.1 },
    end: { cx: 135, cy: 290, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = ST[cue] || ST.all;
    const e = ease(p);
    const gv = (k: keyof S) => lerp(A[k], B[k], e);
    let cov = gv("cov"), bat = gv("bat"), cap = gv("cap"), dirt = gv("dirt"), amp = gv("amp"), rf = gv("rf");
    if (cue === "wind") cov = ease(cl((p - 0.4) / 0.18));
    if (cue === "batt") bat = lerp(1, 0.12, p);
    if (cue === "wear") { dirt = ease(cl(p / 0.35)); cap = lerp(1, 0.68, ease(cl((p - 0.35) / 0.35))); bat = lerp(0.8, 0.5, ease(cl((p - 0.35) / 0.35))); }
    if (cue === "all") amp = 0.55;
    const gust = cue === "wind" ? 1 : 0; // ลมพัด
    const ampEff = cue === "wind" ? lerp(2.4, 0.6, cov) : amp;
    const talk = 0.35 + 0.65 * Math.abs(vw(ph * 9)); // ปากขยับ
    const o: string[] = [DEFS, EXTRA];
    const opf = (c: string) => (cue === c ? 0.28 + 0.72 * ease(cl(p / 0.1)) : 0.28);

    // ---------- พื้นหลัง ----------
    o.push(`<rect x="-140" y="-200" width="550" height="1800" fill="url(#mwall)"/>`);
    for (let i = 0; i < 16; i++) o.push(`<rect x="${-126 + i * 36}" y="-200" width=".6" height="1800" fill="#d9bf8a" opacity=".4"/>`);

    // ==================================================================
    // P: คนพูด + คลื่นเสียง
    // ==================================================================
    o.push(`<path d="M6 250 C6 200 30 168 62 160 L84 160 C116 164 138 190 142 250 Z" fill="#4a78c8" stroke="#2b3350" stroke-width="1.2"/>`);
    o.push(`<rect x="62" y="116" width="22" height="46" fill="url(#mskin)" stroke="#2b3350" stroke-width="1"/>`);
    o.push(`<path d="M58 158 L72 184 L62 192 L44 168 Z M88 158 L100 182 L114 176 L98 152 Z" fill="#fff" stroke="#2b3350" stroke-width="1"/>`);
    o.push(`<circle cx="72" cy="92" r="32" fill="url(#mskin)" stroke="#2b3350" stroke-width="1.2"/>`);
    o.push(`<path d="M40 94 C34 52 70 48 92 64 C100 70 103 80 103 88 C90 76 62 74 46 102 Z" fill="#2b2230" stroke="#2b3350" stroke-width="1"/>`);
    o.push(`<circle cx="58" cy="98" r="5" fill="#e8b88a" stroke="#2b3350" stroke-width=".9"/>`);
    o.push(`<circle cx="87" cy="90" r="2.4" fill="#2b3350"/><path d="M103 96 L111 104 L103 106" fill="#f0c49c" stroke="#2b3350" stroke-width="1"/>`);
    o.push(`<ellipse cx="${MOUTH[0] - 2}" cy="${MOUTH[1]}" rx="3.6" ry="${f2(1 + talk * 2.6)}" fill="#8a2f3a" stroke="#2b3350" stroke-width=".9"/>`);
    // คลื่นเสียงจากปากไปที่ไมค์
    const dir = Math.atan2(CLIP[1] - MOUTH[1], CLIP[0] - MOUTH[0]);
    const sa = cue === "sound" ? 1 : 0.55;
    for (let k = 0; k < 5; k++) {
      const r = 10 + ((ph * 26 + k * 15) % 75);
      const a = (1 - r / 86) * sa;
      o.push(`<path d="${arc(MOUTH[0], MOUTH[1], r, dir - 0.62, dir + 0.62)}" fill="none" stroke="#fff" stroke-width="3.4" opacity="${f2(a * 0.9)}" stroke-linecap="round"/><path d="${arc(MOUTH[0], MOUTH[1], r, dir - 0.62, dir + 0.62)}" fill="none" stroke="#2f8fe0" stroke-width="1.6" opacity="${f2(a)}" stroke-linecap="round"/>`);
    }
    // อนุภาคอากาศตามแนวปาก → ไมค์ (อัดตัว/คลายตัวสลับกัน)
    {
      const L = Math.hypot(CLIP[0] - MOUTH[0], CLIP[1] - MOUTH[1]);
      const ux = Math.cos(dir), uy = Math.sin(dir), nx = -uy, ny = ux;
      for (let row = -1; row <= 1; row++) {
        for (let i = 0; i < 18; i++) {
          const t0 = 12 + (i / 17) * (L - 20);
          const t = t0 + 4.4 * Math.sin(t0 * 0.34 - ph * 7.5);
          const qx = MOUTH[0] + ux * t + nx * row * 5, qy = MOUTH[1] + uy * t + ny * row * 5;
          o.push(`<circle cx="${f2(qx)}" cy="${f2(qy)}" r="1.3" fill="#1f6fc9" opacity="${f2(0.35 + 0.65 * sa)}"/>`);
        }
      }
    }
    // ตัวส่งหนีบที่ปก
    o.push(`<rect x="102" y="190" width="14" height="10" rx="2" fill="#aab5ca" stroke="#2b3350" stroke-width=".9"/>`);
    o.push(`<g filter="url(#sh2)"><rect x="100" y="170" width="18" height="24" rx="4.5" fill="url(#metal)" stroke="#2b3350" stroke-width="1"/><circle cx="109" cy="175" r="1.8" fill="#232b4a"/></g>`);
    if (cue === "sound" || cue === "all") o.push(`<circle cx="109" cy="175" r="${f2(5 + 2 * Math.sin(ph * 6))}" fill="none" stroke="#ffe14a" stroke-width="1.4" opacity=".9"/>`);
    // เส้นขยายภาพ
    o.push(`<path d="M100 196 L26 242 M118 196 L242 242" stroke="#2b3350" stroke-width="1" stroke-dasharray="3 2.5" fill="none" opacity=".7"/>`);
    if (cue === "sound") {
      o.push(pill(192, 128, "อากาศอัดแล้วคลาย", "end", "#e3f0ff") + leader(150, 130, 126, 150));
      o.push(pill(126, 204, "ไมค์หนีบปก", "start", "#fff6c9") + leader(126, 202, 118, 186));
    }
    if (cue === "all") o.push(pill(250, 80, "ไมค์ไร้สาย ข้างในมีอะไร", "end", "#fff6c9"));

    // ==================================================================
    // T: ตัวส่งแบบตัดครึ่ง
    // ==================================================================
    o.push(`<rect x="18" y="240" width="234" height="292" rx="14" fill="#e8f0fc" stroke="#2b3350" stroke-width="1.4"/>`);
    o.push(`<g filter="url(#sh)"><rect x="${BODY.x}" y="${BODY.y}" width="${BODY.w}" height="${BODY.h}" rx="16" fill="url(#metal)" stroke="#4a5470" stroke-width="1.2"/></g>`);
    o.push(`<rect x="54" y="282" width="166" height="228" rx="11" fill="#232b4a"/>`);
    for (let i = 0; i < 9; i++) o.push(`<path d="M${58 + i * 18} 286 V506" stroke="#2c3659" stroke-width=".6"/>`);
    // เส้นไฟเลี้ยง (rail ซ้าย) จากแบตขึ้นไปทุกบล็อก
    const pw = cue === "batt" ? 1 : 0.45;
    o.push(`<path d="M58 492 V304" stroke="#ffd23a" stroke-width=".9" stroke-dasharray="1.5 2" opacity="${f2(pw)}" fill="none"/>`);
    for (const yy of [452, 428, 390, 340]) o.push(`<path d="M58 ${yy} H64" stroke="#ffd23a" stroke-width=".9" opacity="${f2(pw)}"/>`);
    if (pw > 0.4) for (let i = 0; i < 5; i++) { const u = (ph * (cue === "batt" ? 0.9 : 0.4) + i / 5) % 1; o.push(`<circle cx="58" cy="${f2(492 - u * 188)}" r="1.4" fill="#ffd23a" opacity="${f2(pw)}"/>`); }

    // ---- รูรับเสียง + ท่อ ----
    o.push(`<rect x="91" y="274" width="12" height="10" fill="#232b4a"/>`);
    o.push(`<rect x="${PORTX - 6}" y="282" width="12" height="20" fill="#34406e"/>`);
    // คลื่นอากาศเข้ารู
    {
      const sp = cue === "wind" ? 0 : 1;
      for (let k = 0; k < 3; k++) {
        const u = (ph * 1.3 + k / 3) % 1;
        const yy = 262 + u * 44;
        const aa = Math.sin(Math.PI * u) * (0.35 + 0.65 * ampEff) * sp;
        o.push(`<path d="M${PORTX - 5} ${f2(yy)} q5 4 10 0" fill="none" stroke="#7fd0ff" stroke-width="1.5" opacity="${f2(clAbs(aa))}" stroke-linecap="round"/>`);
      }
    }
    // ---- แคปซูลไมค์ ----
    o.push(`<rect x="64" y="300" width="66" height="54" rx="6" fill="#2e3760" stroke="#8fa2d6" stroke-width="1"/>`);
    // ไดอะแฟรมขยับตามเสียง
    const dy = cl(4.4 * ampEff * vw(ph * 8), -8.5, 8.5);
    const ydc = YD + dy; // กลางแผ่น
    o.push(`<path d="M70 ${YD} Q${PORTX} ${f2(YD + 2 * dy)} 124 ${YD}" fill="none" stroke="#ffd23a" stroke-width="2" stroke-linecap="round"/>`);
    o.push(`<rect x="70" y="${YB}" width="54" height="4" rx="1" fill="#c9d4ee" stroke="#8fa2d6" stroke-width=".6"/>`);
    for (let i = 0; i < 6; i++) o.push(`<rect x="${74 + i * 8.6}" y="${YB + 1}" width="2" height="2" fill="#2e3760"/>`);
    // เส้นสนามไฟฟ้าระหว่างแผ่น (ถี่เมื่อใกล้กัน)
    const showField = cue === "diaphragm" || cue === "signal" ? 1 : 0.35;
    for (let i = 0; i < 6; i++) {
      const xx = 76 + i * 9.4;
      const t = (xx - 70) / 54;
      const yTop = YD + 2 * dy * 2 * t * (1 - t);
      o.push(`<path d="M${f2(xx)} ${f2(yTop + 1.5)} V${YB - 0.5}" stroke="#7fd0ff" stroke-width=".8" stroke-dasharray="1.2 1.4" opacity="${f2(showField)}"/>`);
    }
    if (showField > 0.8) {
      o.push(txt(76, YD + 14, "−", 6.5, "#ffd23a", "middle", 900) + txt(116, YD + 14, "−", 6.5, "#ffd23a", "middle", 900));
      o.push(txt(76, YB + 11, "+", 6.5, "#7fd0ff", "middle", 900) + txt(116, YB + 11, "+", 6.5, "#7fd0ff", "middle", 900));
      // วงเล็บบอกระยะห่าง
      const gtop = YD + dy * 0.9, gx = 127;
      o.push(`<path d="M${gx} ${f2(gtop)} V${YB}" stroke="#ff7a3a" stroke-width="1" fill="none"/><path d="M${gx - 2} ${f2(gtop)} H${gx + 2} M${gx - 2} ${YB} H${gx + 2}" stroke="#ff7a3a" stroke-width="1"/>`);
    }
    // ชิปขยายสัญญาณเล็ก + สายออก
    o.push(`<path d="M86 340 V350 L104 345 Z" fill="#46526b" stroke="#8fa2d6" stroke-width=".7"/>`);
    o.push(`<path d="M97 354 V364" stroke="#7fd0ff" stroke-width="1.6"/>`);
    if (cue === "diaphragm") {
      o.push(pill(132, 316, "แผ่นบางสั่น", "start", "#fff0b0") + leader(132, 314, 118, YD + 1));
      o.push(pill(132, 346, "แผ่นหลังนิ่ง", "start", "#e3f0ff") + leader(132, 344, 122, YB + 4));
      o.push(pill(132, 290, "รูรับเสียง", "start", "#e3f0ff") + leader(132, 288, PORTX + 5, 291));
    }
    if (cue === "signal") o.push(pill(142, 298, "ระยะห่างเปลี่ยน", "start", "#ffe1c9"));

    // ---- สโคปต่างๆ ----
    const scope = (x: number, y: number, w: number, h: number, hot: boolean) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#10162e" stroke="${hot ? "#ffe14a" : "#4a5a96"}" stroke-width="${hot ? 1.2 : 0.8}"/><path d="M${x + 2} ${y + h / 2} H${x + w - 2}" stroke="#2e3a6c" stroke-width=".6"/>`;
    const sigA = (x: number) => vw(ph * 8 - (212 - x) * 0.27);
    // A: สัญญาณอนาล็อกหลังแคปซูล
    if (cue !== "diaphragm" && cue !== "wind") {
      o.push(scope(142, 304, 70, 46, cue === "signal"));
      o.push(`<path d="${wpath(144, 210, 327, (x) => 15 * cl(ampEff, 0, 1.4) * sigA(x))}" fill="none" stroke="#5cc8ff" stroke-width="1.5" stroke-linejoin="round"/>`);
      if (cue !== "signal") o.push(txt(177, 301, "ไฟฟ้าขึ้นลง", 4.6, "#b9c6ef"));
      o.push(`<path d="M132 327 H141" stroke="#5cc8ff" stroke-width="1.2"/>`);
    }
    // ADC
    const adcHot = cue === "adc";
    o.push(`<rect x="62" y="${ROW.adc}" width="70" height="26" rx="4" fill="#3a4a8a" stroke="${adcHot ? "#ffe14a" : "#8fa2d6"}" stroke-width="${adcHot ? 1.4 : 0.9}"/>`);
    o.push(txt(97, ROW.adc + 11, "ตัวแปลงเป็นเลข", 5.4, "#fff") + txt(97, ROW.adc + 20, "ADC", 4.6, "#c9d4ee", "middle", 600));
    o.push(`<path d="M97 390 V402" stroke="#ff9a3a" stroke-width="1.6"/>`);
    o.push(scope(142, 360, 70, 34, adcHot));
    {
      // เส้นฟ้า = อนาล็อก, แท่งส้ม = ค่าที่วัด (สุ่มทุกช่วงเวลาสั้นๆ)
      const yc = 377;
      o.push(`<path d="${wpath(144, 210, yc, (x) => 10 * cl(ampEff, 0, 1.4) * sigA(x))}" fill="none" stroke="#5cc8ff" stroke-width=".9" opacity=".7"/>`);
      const sc = (ph * 8 * 0.27);
      for (let i = 0; i < 9; i++) {
        const x = 146 + ((i * 7.6 + (ph * 27) % 7.6) % 66);
        const v = 10 * cl(ampEff, 0, 1.4) * sigA(x);
        const q = Math.round(v / 2.5) * 2.5; // วัดแล้วปัดเป็นขั้น
        o.push(`<path d="M${f2(x)} ${yc} V${f2(yc - q)}" stroke="#ff9a3a" stroke-width="1.1"/><circle cx="${f2(x)}" cy="${f2(yc - q)}" r="1.5" fill="#ff9a3a"/>`);
      }
      void sc;
      if (!adcHot && cue !== "signal") o.push(txt(177, 357, "วัดค่าเป็นขั้นๆ", 4.6, "#b9c6ef"));
    }
    if (adcHot) {
      // ตัวเลขไหลออกจากตัวแปลง
      for (let k = 0; k < 4; k++) {
        const u = (ph * 0.8 + k / 4) % 1;
        o.push(txt(97 + (k % 2 ? 9 : -9), 392 + u * 10, bitsStr(4, k + Math.floor(ph * 4)), 4.6, "#ff9a3a", "middle", 900));
      }
    }
    // DSP
    const dspHot = cue === "dsp";
    o.push(`<rect x="62" y="${ROW.dsp}" width="70" height="26" rx="4" fill="#3b7a6d" stroke="${dspHot ? "#ffe14a" : "#8fd6c4"}" stroke-width="${dspHot ? 1.4 : 0.9}"/>`);
    o.push(txt(97, ROW.dsp + 11, "ตัดเสียงรบกวน", 5.4, "#fff") + txt(97, ROW.dsp + 20, "DSP", 4.6, "#cdeee6", "middle", 600));
    o.push(`<path d="M97 428 V440" stroke="#ff9a3a" stroke-width="1.6"/>`);
    o.push(scope(142, 398, 70, 36, dspHot));
    {
      const yc = 416;
      const clean = dspHot ? ease(cl((p - 0.22) / 0.4)) : 0.75;
      const nz = (x: number) => (rnd(Math.floor(x * 0.8) + Math.floor(ph * 12) * 31) - 0.5) * 2;
      const speech = (x: number) => 9 * vw(ph * 8 - (212 - x) * 0.27);
      o.push(`<path d="${wpath(144, 210, yc, (x) => speech(x) + 9 * nz(x) * (1 - clean))}" fill="none" stroke="${mixc("#ff7a6a", "#58e0a0", clean)}" stroke-width="1.1" stroke-linejoin="round"/>`);
      if (dspHot) {
        o.push(txt(177, 405, clean < 0.5 ? "เสียงพูด + เสียงรบกวน" : "เหลือแต่เสียงพูด", 4.4, "#b9c6ef"));
        // เส้นแยกสีส้ม/เขียว
        o.push(`<path d="M${f2(lerp(144, 210, clean))} 400 V432" stroke="#ffe14a" stroke-width=".7" stroke-dasharray="1.4 1.4" opacity=".8"/>`);
      } else o.push(txt(177, 395, "ลดเสียงรบกวน", 4.6, "#b9c6ef"));
    }
    // วิทยุ + เสาอากาศ
    const radHot = cue === "radio";
    o.push(`<rect x="62" y="${ROW.rad}" width="70" height="26" rx="4" fill="#6a4aa8" stroke="${radHot ? "#ffe14a" : "#c1a6ee"}" stroke-width="${radHot ? 1.4 : 0.9}"/>`);
    o.push(txt(97, ROW.rad + 11, "ส่งวิทยุ", 5.4, "#fff") + txt(97, ROW.rad + 20, "2.4 GHz", 4.6, "#e5d9fb", "middle", 600));
    o.push(`<path d="M132 453 H142" stroke="#b58cff" stroke-width="1.6"/>`);
    {
      // เส้นเสาอากาศซิกแซก + แพ็กเก็ตข้อมูลวิ่งไปปลายเสา
      let d = "M142 453";
      for (let i = 0; i < 7; i++) d += ` L${f2(146 + i * 10)} ${i % 2 ? 446 : 460}`;
      d += ` L${ANT[0]} ${ANT[1]}`;
      o.push(`<path d="${d}" fill="none" stroke="#b58cff" stroke-width="1.6" stroke-linejoin="round"/>`);
      o.push(`<circle cx="${ANT[0]}" cy="${ANT[1]}" r="3" fill="#b58cff" stroke="#fff" stroke-width=".8"/>`);
      for (let i = 0; i < 3; i++) {
        const u = (ph * 0.8 + i / 3) % 1;
        o.push(txt(lerp(100, 204, u), 436, bitsStr(3, i + 70), 4.4, "#d3b8ff", "middle", 900));
      }
    }
    // แบตเตอรี่
    {
      const bx = 62, by = ROW.bat, bw = 134, bh = 24;
      const capW = (bw - 4) * cap;
      const lv = cl(bat, 0, cap);
      const col = lv > 0.5 ? "#38c172" : lv > 0.25 ? "#f0a23a" : "#d94b4b";
      o.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="5" fill="#10162e" stroke="#c9d4ee" stroke-width="1.2"/><rect x="${bx + bw}" y="${by + 7}" width="4.5" height="10" rx="1.5" fill="#c9d4ee"/>`);
      if (cap < 0.99) {
        o.push(`<rect x="${bx + 2 + capW}" y="${by + 2}" width="${f2(bw - 4 - capW)}" height="${bh - 4}" rx="3" fill="none" stroke="#9aa8d0" stroke-width=".8" stroke-dasharray="2 2"/>`);
        for (let i = 0; i < 9; i++) o.push(`<path d="M${f2(bx + 4 + capW + i * 6)} ${by + bh - 3} l5 -${bh - 6}" stroke="#4a5a96" stroke-width=".7" opacity="${f2(1 - cap)}"/>`);
      }
      o.push(`<rect x="${bx + 2}" y="${by + 2}" width="${f2((bw - 4) * lv)}" height="${bh - 4}" rx="3" fill="${col}"/>`);
      for (let i = 1; i < 5; i++) o.push(`<path d="M${f2(bx + 2 + ((bw - 4) * i) / 5)} ${by + 2} v${bh - 4}" stroke="#10162e" stroke-width="1" opacity=".55"/>`);
      o.push(txt(bx + bw / 2, by + 15.5, Math.round(lv * 100) + "%", 7.5, "#fff", "middle", 900));
      if (cue === "batt" || cue === "wear") {
        // ลิเธียมไอออนวิ่งไปมาในเซลล์
        for (let i = 0; i < 6; i++) {
          const u = (ph * 0.5 + i / 6) % 1;
          const xx = bx + 6 + u * (bw - 12) * 0.9, yy = by + 6 + (i % 3) * 5;
          if (xx < bx + 2 + (bw - 4) * lv - 2) o.push(`<circle cx="${f2(xx)}" cy="${f2(yy)}" r="1.1" fill="#fff" opacity=".7"/>`);
        }
      }
      if (cue === "batt") {
        const ca = (ph * 0.6) % 1;
        o.push(`<g transform="translate(74 ${by - 10})"><circle r="6" fill="#fff" stroke="#2b3350" stroke-width=".9"/><path d="M0 -3.6 V0 L${f2(3 * Math.cos(ca * 6.28 - 1.57))} ${f2(3 * Math.sin(ca * 6.28 - 1.57))}" stroke="#2b3350" stroke-width="1" stroke-linecap="round" fill="none"/></g>`);
        o.push(pill(84, by - 8, "ใช้ได้ราว 5–10 ชม. ต่อรอบ", "start", "#e7ffe9"));
        o.push(pill(62, by + 40, "แบตลิเธียมไอออน ชาร์จซ้ำได้", "start", "#fff6c9"));
      }
      if (cue === "wear" && cap < 0.995) o.push(pill(bx + bw + 6, by + 40, "ความจุเต็มลดลง", "end", "#ffe1c9"));
    }
    // หน้าสัมผัสชาร์จที่ก้นตัวส่ง
    o.push(`<rect x="108" y="508" width="5" height="6" rx="1" fill="${mixc("#e5b73b", "#8d7a4a", dirt)}"/><rect x="120" y="508" width="5" height="6" rx="1" fill="${mixc("#e5b73b", "#8d7a4a", dirt)}"/>`);

    // ---- ฟองน้ำกันลม ----
    if (cov > 0.01) {
      const oy = -60 * (1 - cov);
      const fa = cov;
      o.push(`<g transform="translate(0 ${f2(oy)})" opacity="${f2(Math.min(1, fa * 1.5))}">`);
      o.push(`<path d="M${PORTX - 24} 280 C${PORTX - 26} 252 ${PORTX + 26} 252 ${PORTX + 24} 280 Z" fill="${mixc("#585260", "#8b7d68", dirt)}" stroke="#2b2230" stroke-width="1"/>`);
      for (let i = 0; i < 16; i++) {
        const gx = PORTX - 20 + rnd(i) * 40, gy = 258 + rnd(i + 9) * 20;
        const bad = dirt > 0.2 && rnd(i + 40) < dirt * 0.8;
        o.push(`<path d="M${f2(gx)} ${f2(gy)} l${f2((rnd(i + 3) - 0.5) * 5)} -3" stroke="${bad ? "#b9a98a" : "#7b7584"}" stroke-width="1.1" stroke-linecap="round"/>`);
      }
      // รอยสึก (ผิวฟองน้ำโปร่งเป็นหย่อม)
      if (dirt > 0.3) {
        o.push(`<ellipse cx="${PORTX + 8}" cy="268" rx="${f2(6 * dirt)}" ry="${f2(4 * dirt)}" fill="#d9c9a4" opacity=".7"/>`);
        o.push(`<ellipse cx="${PORTX - 12}" cy="272" rx="${f2(4 * dirt)}" ry="${f2(3 * dirt)}" fill="#d9c9a4" opacity=".6"/>`);
      }
      o.push(`</g>`);
    }
    // ---- ฉากลม ----
    if (cue === "wind") {
      const gustA = 1;
      for (let k = 0; k < 4; k++) {
        const u = (ph * 0.9 + k * 0.27) % 1;
        const y = 258 + (k % 2) * 8 - (k > 1 ? 4 : 0);
        const x = lerp(10, PORTX - 28, u);
        const hit = cov < 0.5;
        // ลมตรงๆ ชนรู / ผ่านฟองน้ำแล้วกระจายเป็นลูกศรเล็กๆ
        o.push(H.warrow(x, y + 14 - k * 2, "#4aa8ff", gustA * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (hit ? 1 : 0.9), 1));
        if (!hit && u > 0.65) for (let j = 0; j < 3; j++) o.push(`<path d="M${PORTX - 24 + j * 3} ${252 - j * 3} l${-6 + j * 6} -8" stroke="#4aa8ff" stroke-width="1" stroke-linecap="round" opacity=".6"/>`);
      }
      if (cov < 0.5) {
        for (let k = 0; k < 3; k++) {
          const u = (ph * 1.6 + k / 3) % 1;
          o.push(`<path d="M${PORTX - 5} ${f2(264 + u * 36)} q5 4 10 0" fill="none" stroke="#4aa8ff" stroke-width="2.2" opacity="${f2(Math.sin(Math.PI * u))}" stroke-linecap="round"/>`);
        }
        o.push(pill(22, 246, "ลมพัดตรงเข้ารู", "start", "#e3f0ff"));
        o.push(pill(178, 318, "โดนลมดัน", "end", "#ffe1c9") + leader(150, 316, 124, YD + 3));
        if (Math.abs(dy) > 6) o.push(xmark(PORTX, YB - 8, 0.9));
      } else {
        o.push(pill(22, 246, "ฟองน้ำกระจายลม", "start", "#e7ffe9"));
        o.push(pill(178, 318, "สั่นเบาลง", "end", "#e7ffe9") + leader(150, 316, 124, YD + 3));
      }
    }
    // ---- เหงื่อ/ฝุ่นตอน wear ----
    if (cue === "wear") {
      for (let k = 0; k < 5; k++) {
        const u = (ph * 0.6 + k * 0.21) % 1;
        const dx = 48 + k * 10, dyy = 226 + u * 52;
        o.push(`<path d="M${dx} ${f2(dyy)} q-2.6 3.6 0 5 q2.6 -1.4 0 -5z" fill="#7fd0ff" stroke="#2f8fe0" stroke-width=".6" opacity="${f2(dirt * (1 - u * 0.4))}"/>`);
      }
      for (let k = 0; k < 8; k++) {
        const u = (ph * 0.3 + k * 0.13) % 1;
        o.push(`<circle cx="${f2(130 + rnd(k) * 40 - u * 10)}" cy="${f2(236 + u * 40)}" r="1" fill="#a3916c" opacity="${f2(dirt * 0.8)}"/>`);
      }
      if (dirt > 0.4) o.push(pill(8, 236, "เหงื่อ ฝุ่น", "start", "#ffe1c9") + pill(142, 262, "ฟองน้ำเก่า", "start", "#ffe1c9") + leader(160, 264, PORTX + 14, 270));
      if (p > 0.72) o.push(pill(8, 500, "หน้าสัมผัสชาร์จ", "start", "#ffe1c9") + leader(50, 498, 108, 511));
    }

    // ---- ป้ายกำกับประจำส่วนของตัวส่ง ----
    if (cue === "signal") {
      o.push(pill(212, 359, "เหมือนรูปคลื่นเสียง", "end", "#e3f0ff"));
    }
    // ==================================================================
    // R: คลื่นวิทยุ + มือถือ + ตัวรับ
    // ==================================================================
    // คลื่นวิทยุจากปลายเสาไปตัวรับ
    {
      const d2 = Math.atan2(RXP[1] - ANT[1], RXP[0] - ANT[0]);
      const rfv = cue === "radio" ? 1 : cue === "pair" || cue === "hop" ? 0.45 : 0.3;
      const maxR = Math.hypot(RXP[0] - ANT[0], RXP[1] - ANT[1]) + 4;
      for (let k = 0; k < 6; k++) {
        const r = 14 + ((ph * 38 + k * (maxR / 6)) % maxR);
        const a = (1 - r / (maxR + 6)) * rfv;
        o.push(`<path d="${arc(ANT[0], ANT[1], r, d2 - 0.55, d2 + 0.55)}" fill="none" stroke="#8a5cf6" stroke-width="2.2" opacity="${f2(Math.min(1, a * 1.5))}" stroke-linecap="round"/>`);
      }
      if (cue === "radio") {
        // แพ็กเก็ตข้อมูลบินไปตัวรับ
        for (let k = 0; k < 3; k++) {
          const u = (ph * 0.5 + k / 3) % 1;
          const qx = lerp(ANT[0], RXP[0], u), qy = lerp(ANT[1], RXP[1], u);
          o.push(`<g transform="translate(${f2(qx)} ${f2(qy)})"><rect x="-8" y="-4.5" width="16" height="9" rx="2" fill="#fff" stroke="#6a4aa8" stroke-width=".9"/>${txt(0, 2, bitsStr(4, k + 3), 4.8, "#6a4aa8", "middle", 900)}</g>`);
        }
      }
    }
    // มือถือแนวนอน
    o.push(`<g filter="url(#sh)"><rect x="28" y="588" width="178" height="110" rx="12" fill="#1c2238" stroke="#0e1224" stroke-width="1.2"/></g>`);
    o.push(`<rect x="34" y="594" width="166" height="98" rx="7" fill="url(#mscreen)"/>`);
    // ภาพในจอ: คนพูด
    o.push(`<circle cx="76" cy="632" r="13" fill="url(#mskin)" stroke="#2b3350" stroke-width=".8"/><path d="M52 692 C52 660 66 650 76 650 C88 650 100 660 100 692 Z" fill="#4a78c8" stroke="#2b3350" stroke-width=".8"/>`);
    o.push(`<circle cx="42" cy="602" r="3" fill="#e0322f" opacity="${f2(0.5 + 0.5 * Math.sin(ph * 5))}"/>`);
    o.push(txt(49, 604.5, "REC", 5.6, "#fff", "start", 800));
    // แถบระดับเสียงที่เข้ามาในมือถือ
    for (let i = 0; i < 9; i++) {
      const h = 6 + 24 * cl(0.3 + 0.7 * Math.abs(vw(ph * 8 + i * 0.7)), 0, 1) * (0.6 + 0.4 * ampEff);
      o.push(`<rect x="${128 + i * 7}" y="${f2(684 - h)}" width="4.6" height="${f2(h)}" rx="2" fill="${i > 6 ? "#f0a23a" : "#38c172"}"/>`);
    }
    // ตัวรับเสียบข้างมือถือ
    o.push(`<rect x="205" y="626" width="8" height="24" rx="2" fill="#aab5ca" stroke="#4a5470" stroke-width=".8"/>`);
    o.push(`<g filter="url(#sh2)"><rect x="213" y="598" width="34" height="84" rx="7" fill="url(#mcase)" stroke="#2b3350" stroke-width="1.1"/></g>`);
    {
      let d = "M219 606";
      for (let i = 0; i < 5; i++) d += ` L${i % 2 ? 219 : 241} ${f2(606 + (i + 1) * 4.5)}`;
      o.push(`<path d="${d}" fill="none" stroke="#8a5cf6" stroke-width="1.2" stroke-linejoin="round"/>`);
      const ping = 0.5 + 0.5 * Math.sin(ph * 6);
      o.push(`<circle cx="${RXP[0]}" cy="${RXP[1] - 3}" r="${f2(3 + 3 * ping * rf)}" fill="url(#mglow)"/>`);
      o.push(`<rect x="219" y="636" width="22" height="16" rx="3" fill="#6a4aa8" stroke="#2b3350" stroke-width=".7"/>` + txt(230, 646.6, "แปลงกลับ", 4.4, "#fff"));
      o.push(txt(230, 669, "ตัวรับ", 5.2, "#2b3350"));
      o.push(`<circle cx="230" cy="676" r="1.8" fill="#38c172"/>`);
    }
    if (cue === "radio") {
      o.push(pill(150, 548, "ไกลได้หลายสิบเมตร ในที่โล่ง", "end", "#ece3ff"));
      o.push(pill(8, 520, "ตัวส่ง", "start", "#fff6c9"));
      o.push(pill(8, 704, "ตัวรับเสียบช่องชาร์จ", "start", "#e3f0ff") + leader(88, 702, 210, 640));
      o.push(pill(8, 574, "ตัวเลข → คลื่นวิทยุ", "start", "#ece3ff"));
    }

    // ==================================================================
    // L: จับคู่ + ดีเลย์
    // ==================================================================
    o.push(`<g opacity="${f2(opf("pair"))}">`);
    {
      const lx0 = 40, lx1 = 230;
      const active = cue === "pair";
      const t = active ? p : 1;
      const on = t > 0.28 ? 1 : 0;
      const hs = cl((t - 0.3) / 0.22);
      o.push(`<rect x="12" y="716" width="246" height="150" rx="12" fill="#fff" opacity=".55" stroke="#2b3350" stroke-width="1"/>`);
      // ตัวส่ง
      o.push(`<rect x="24" y="738" width="30" height="40" rx="7" fill="url(#metal)" stroke="#2b3350" stroke-width="1"/><circle cx="39" cy="746" r="2.4" fill="${on ? "#38c172" : "#9aa4ba"}"/>`);
      o.push(txt(39, 790, "ตัวส่ง", 5.4));
      // ตัวรับ
      o.push(`<rect x="218" y="738" width="28" height="40" rx="7" fill="url(#mcase)" stroke="#2b3350" stroke-width="1"/><circle cx="232" cy="746" r="2.4" fill="${on ? "#38c172" : "#9aa4ba"}"/>`);
      o.push(txt(232, 790, "ตัวรับ", 5.4));
      // รหัสคู่
      const idc = hs > 0.5 ? "#6a4aa8" : "#9aa4ba";
      o.push(`<rect x="20" y="722" width="38" height="11" rx="5" fill="#fff" stroke="${idc}" stroke-width="1"/>` + txt(39, 730.2, "รหัส A7F2", 5.4, idc));
      o.push(`<rect x="213" y="722" width="38" height="11" rx="5" fill="#fff" stroke="${idc}" stroke-width="1"/>` + txt(232, 730.2, "รหัส A7F2", 5.4, idc));
      // ค้นหากัน → เชื่อม
      if (on) {
        const sx = lerp(58, 116, hs), ex = lerp(214, 156, hs);
        o.push(`<path d="M58 758 H${f2(sx)} M214 758 H${f2(ex)}" stroke="#8a5cf6" stroke-width="1.6" stroke-dasharray="3 2.5"/>`);
        for (let k = 0; k < 2; k++) {
          const u = (ph * 1.4 + k / 2) % 1;
          o.push(`<path d="${arc(58, 758, 6 + u * 22, -0.9, 0.9)}" fill="none" stroke="#8a5cf6" stroke-width="1.3" opacity="${f2((1 - u) * (1 - hs))}"/><path d="${arc(214, 758, 6 + u * 22, Math.PI - 0.9, Math.PI + 0.9)}" fill="none" stroke="#8a5cf6" stroke-width="1.3" opacity="${f2((1 - u) * (1 - hs))}"/>`);
        }
        if (hs >= 1) {
          o.push(`<path d="M58 758 H214" stroke="#8a5cf6" stroke-width="1.8"/>`);
          o.push(tick(136, 758, 1));
          o.push(txt(136, 777, "เปิดเครื่อง = ต่อกันเอง", 5.6, "#2e9e5b", "middle", 800));
        } else o.push(txt(136, 777, "เปิดเครื่อง แล้วหากัน...", 5.6, "#6a4aa8", "middle", 800));
      } else o.push(txt(136, 777, "ปิดอยู่", 5.6, "#7b879f", "middle", 800));
      // ดีเลย์: 2.4G เร็ว vs บลูทูธช้ากว่า (สัดส่วนสมมุติ 1 : 5)
      const showLane = t > 0.62 ? 1 : 0;
      o.push(txt(24, 806, "2.4 GHz ของไมค์: ไม่กี่ ms", 5.4, "#6a4aa8", "start", 800));
      o.push(txt(24, 830, "บลูทูธทั่วไป: ราว 15–40 ms", 5.4, "#46526b", "start", 800));
      for (const [yy, dur, col] of [[815, 0.34, "#8a5cf6"], [839, 1.7, "#7b879f"]] as [number, number, string][]) {
        o.push(`<path d="M${lx0} ${yy} H${lx1}" stroke="#c4cbdc" stroke-width="3" stroke-linecap="round"/>`);
        if (showLane) {
          const u = Math.min(1, ((ph % 2.1) / dur));
          const xx = lerp(lx0, lx1, u);
          o.push(`<path d="M${lx0} ${yy} H${f2(xx)}" stroke="${col}" stroke-width="3" stroke-linecap="round" opacity=".5"/><circle cx="${f2(xx)}" cy="${yy}" r="4" fill="${col}" stroke="#fff" stroke-width="1"/>`);
          if (u >= 1) o.push(tick(lx1 + 8, yy, 1, 2.8));
        }
      }
      o.push(txt(135, 858, "(สัดส่วนเปรียบเทียบเท่านั้น)", 4.4, "#7b879f", "middle", 600));
    }
    o.push(`</g>`);

    // ==================================================================
    // H: ช่องความถี่ + กระโดดหลบ
    // ==================================================================
    o.push(`<g opacity="${f2(opf("hop"))}">`);
    {
      const active = cue === "hop";
      const t = active ? p : 0.5;
      o.push(`<rect x="12" y="886" width="246" height="150" rx="12" fill="#fff" opacity=".55" stroke="#2b3350" stroke-width="1"/>`);
      o.push(txt(135, 901, "ย่านความถี่ 2.4 GHz ใช้ร่วมกันหลายอุปกรณ์", 6, "#2b3350", "middle", 800));
      const colX = (c: number) => CX0 + c * CW;
      // ไวไฟ (ช่อง 1-4), ไมโครเวฟ (ช่อง 8-13)
      const mw = 0.6 + 0.4 * Math.abs(Math.sin(ph * 8));
      o.push(`<rect x="${colX(1)}" y="${HB - 48}" width="${f2(CW * 4)}" height="48" rx="3" fill="#4aa8ff" opacity=".75"/>`);
      o.push(`<rect x="${colX(8)}" y="${f2(HB - 56 * mw)}" width="${f2(CW * 6)}" height="${f2(56 * mw)}" rx="3" fill="#ff9a3a" opacity=".75"/>`);
      for (let i = 0; i < 6; i++) {
        const c = 4 + Math.floor(rnd(i + Math.floor(ph * 6) * 7) * 12);
        o.push(`<rect x="${f2(colX(c) + 2)}" y="${HB - 22}" width="${f2(CW - 4)}" height="22" rx="2" fill="#38c172" opacity=".8"/>`);
      }
      o.push(`<path d="M${CX0 - 4} ${HB + 1} H${f2(CX0 + CHN * CW + 4)}" stroke="#2b3350" stroke-width="1.2"/>`);
      for (let c = 0; c <= CHN; c += 2) o.push(`<path d="M${f2(colX(c))} ${HB + 1} v3" stroke="#2b3350" stroke-width=".8"/>`);
      o.push(txt(colX(2.5), HB + 12, "ไวไฟ", 5.2, "#2f8fe0", "middle", 800) + txt(colX(11), HB + 12, "ไมโครเวฟ", 5.2, "#c46a12", "middle", 800) + txt(colX(6.4), HB + 12, "บลูทูธ", 5.2, "#2e9e5b", "middle", 800));
      // ช่องที่ไมค์ใช้ (กระโดดไปเรื่อยๆ)
      const seq = [2, 6, 15, 0, 7, 15];
      const stepT = active ? 0.16 : 0.2;
      const idx = Math.min(seq.length - 1, Math.floor(active ? t / stepT : (ph * 2.2) % seq.length));
      const ch = seq[idx % seq.length];
      const collide = (ch >= 1 && ch <= 4) || (ch >= 8 && ch <= 13);
      const mx = colX(ch);
      o.push(`<rect x="${f2(mx + 1)}" y="${HB - 62}" width="${f2(CW - 2)}" height="62" rx="3" fill="#8a5cf6" stroke="#fff" stroke-width="1"/>`);
      o.push(txt(mx + CW / 2, HB - 67, "ไมค์", 5.4, "#6a4aa8", mx > 200 ? "end" : mx < 50 ? "start" : "middle", 800));
      if (collide) o.push(xmark(mx + CW / 2, HB - 34, 0.95 * (0.7 + 0.3 * Math.sin(ph * 14))));
      else if (idx > 0) o.push(tick(mx + CW / 2, HB - 34, 0.95, 3.4));
      // เส้นโค้งกระโดดจากช่องเก่าไปช่องใหม่
      if (idx > 0) {
        const pm = colX(seq[idx - 1]) + CW / 2, nm = mx + CW / 2;
        o.push(`<path d="M${f2(pm)} ${HB - 74} Q${f2((pm + nm) / 2)} ${HB - 100} ${f2(nm)} ${HB - 74}" fill="none" stroke="#8a5cf6" stroke-width="1.1" stroke-dasharray="2 2" opacity=".7"/>`);
      }
      o.push(pill(135, 1028, collide ? "ชนกับสัญญาณอื่น" : "ช่องว่าง = ส่งต่อได้", "middle", collide ? "#ffe1c9" : "#e7ffe9"));
    }
    o.push(`</g>`);

    // ==================================================================
    // C: เคสชาร์จ
    // ==================================================================
    o.push(`<g opacity="${f2(opf("case"))}">`);
    {
      const act = cue === "case" ? ease(p) : 0.5;
      const caseLv = lerp(1, 0.58, act), devLv = lerp(0.18, 1, act);
      o.push(`<rect x="-140" y="1218" width="550" height="34" fill="#c79d68"/><rect x="-140" y="1218" width="550" height="6" fill="#a37646"/>`);
      o.push(`<ellipse cx="135" cy="1214" rx="112" ry="6" fill="#1b1008" opacity=".35" filter="url(#bl)"/>`);
      // ฝาเปิด
      o.push(`<path d="M44 1116 L54 1060 H216 L226 1116 Z" fill="url(#mcase)" stroke="#2b3350" stroke-width="1.2"/>`);
      o.push(`<path d="M60 1066 H210" stroke="#fff" stroke-width="2" opacity=".6"/>`);
      // แถบแบตของเคส (บนฝา)
      o.push(`<rect x="62" y="1078" width="146" height="16" rx="5" fill="#10162e" stroke="#2b3350" stroke-width="1"/>`);
      o.push(`<rect x="64" y="1080" width="${f2(142 * caseLv)}" height="12" rx="3.5" fill="${caseLv > 0.5 ? "#38c172" : "#f0a23a"}"/>`);
      o.push(txt(135, 1090.5, "แบตของเคส " + Math.round(caseLv * 100) + "%", 6.2, "#fff", "middle", 900));
      // ตัวเคส
      o.push(`<g filter="url(#sh)"><rect x="34" y="1116" width="202" height="92" rx="14" fill="url(#mcase)" stroke="#2b3350" stroke-width="1.3"/></g>`);
      const pockets: [number, string][] = [[50, "tx"], [100, "tx"], [150, "rx"]];
      for (const [px, kind] of pockets) {
        o.push(`<rect x="${px}" y="1132" width="40" height="64" rx="9" fill="#9fb0d4" stroke="#6b7da8" stroke-width="1"/>`);
        const col = devLv > 0.85 ? "#38c172" : "#f0a23a";
        o.push(`<rect x="${px + 6}" y="1138" width="28" height="52" rx="7" fill="${kind === "tx" ? "url(#metal)" : "url(#mcase)"}" stroke="#2b3350" stroke-width=".9"/>`);
        o.push(`<rect x="${px + 8}" y="1119" width="24" height="9" rx="3" fill="#10162e" stroke="#2b3350" stroke-width=".7"/><rect x="${px + 9.5}" y="1120.5" width="${f2(21 * devLv)}" height="6" rx="2" fill="${col}"/>`);
        o.push(txt(px + 20, 1170, kind === "tx" ? "ตัวส่ง" : "ตัวรับ", 5.2, "#2b3350"));
        o.push(`<circle cx="${px + 20}" cy="1182" r="1.8" fill="${col}"/>`);
        // ไฟไหลจากเคสไปอุปกรณ์
        if (cue === "case") for (let i = 0; i < 3; i++) { const u = (ph * 0.9 + i / 3) % 1; o.push(`<circle cx="${px + 20}" cy="${f2(1100 + u * 34)}" r="1.5" fill="#ffd23a" opacity="${f2(Math.sin(Math.PI * u))}"/>`); }
      }
      // พอร์ต + สาย USB-C
      o.push(`<rect x="204" y="1150" width="24" height="12" rx="3" fill="#2b3350"/>`);
      o.push(`<path d="M228 1156 H252 C262 1156 262 1180 246 1196 L220 1226" fill="none" stroke="#2b3350" stroke-width="4" stroke-linecap="round"/>`);
      o.push(`<path d="M228 1156 H252 C262 1156 262 1180 246 1196 L220 1226" fill="none" stroke="#5a6684" stroke-width="2" stroke-linecap="round"/>`);
      if (cue === "case") for (let i = 0; i < 3; i++) { const u = (ph * 0.7 + i / 3) % 1; o.push(`<path d="M${f2(lerp(252, 230, u))} 1156" stroke="#ffd23a"/><circle cx="${f2(lerp(250, 230, u))}" cy="${f2(1157 + 0)}" r="1.7" fill="#ffd23a" opacity="${f2(Math.sin(Math.PI * u))}"/>`); }
      o.push(`<path d="M244 1177 l-5 8 h5 l-3 8 l8 -10 h-5 l3 -6z" fill="#ffd23a" stroke="#c98a00" stroke-width=".6" opacity="${f2(0.6 + 0.4 * Math.sin(ph * 6))}"/>`);
      if (cue === "case") {
        o.push(pill(8, 1052, "เคสมีแบตของตัวเอง", "start", "#fff6c9"));
        o.push(pill(135, 1228, "เติมให้ตัวส่งได้อีกหลายรอบ", "middle", "#e7ffe9"));
      }
    }
    o.push(`</g>`);

    // ==================================================================
    // N: ทบทวนด้วยตัวเอง (วันแรก vs ตอนนี้)
    // ==================================================================
    o.push(`<g opacity="${f2(opf("nudge"))}">`);
    {
      const act = cue === "nudge" ? ease(cl(p / 0.8)) : 0.5;
      o.push(`<rect x="12" y="1262" width="246" height="230" rx="12" fill="#fff" opacity=".6" stroke="#2b3350" stroke-width="1"/>`);
      o.push(txt(135, 1280, "ลองเทียบดู", 7.4, "#b53a10", "middle", 900));
      const panel = (y: number, title: string, endLv: number, unknown: boolean) => {
        let s = `<rect x="22" y="${y}" width="226" height="56" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width=".9"/>`;
        s += txt(30, y + 12, title, 6.6, "#2b3350", "start", 800);
        // เส้นเวลาของการถ่ายทำ
        s += `<path d="M30 ${y + 40} H190" stroke="#c4cbdc" stroke-width="4" stroke-linecap="round"/>`;
        const wlv = lerp(1, endLv, act);
        s += `<path d="M30 ${y + 40} H${f2(30 + 160 * act)}" stroke="${unknown ? "#9aa8d0" : "#38c172"}" stroke-width="4" stroke-linecap="round"/>`;
        s += txt(30, y + 52, "เริ่มถ่าย", 4.8, "#7b879f", "start") + txt(190, y + 52, "จบงาน", 4.8, "#7b879f", "end");
        s += `<circle cx="${f2(30 + 160 * act)}" cy="${y + 40}" r="3.4" fill="#fff" stroke="#2b3350" stroke-width="1"/>`;
        // แบตเตอรี่ปลายทาง
        const bx = 202, by = y + 14;
        s += `<rect x="${bx}" y="${by}" width="36" height="20" rx="4" fill="#10162e" stroke="#2b3350" stroke-width="1"/><rect x="${bx + 36}" y="${by + 6}" width="3" height="8" rx="1" fill="#2b3350"/>`;
        if (unknown) {
          s += `<rect x="${bx + 2}" y="${by + 2}" width="${f2(32 * (1 - 0.6 * act))}" height="16" rx="2.5" fill="#9aa8d0" opacity=".8"/>`;
          s += txt(bx + 18, by + 15, "?", 11, "#fff", "middle", 900);
        } else {
          s += `<rect x="${bx + 2}" y="${by + 2}" width="${f2(32 * wlv)}" height="16" rx="2.5" fill="#38c172"/>`;
          s += txt(bx + 18, by + 14, Math.round(wlv * 100) + "%", 6.4, "#fff", "middle", 900);
        }
        return s;
      };
      o.push(panel(1292, "ตอนเริ่มใช้ใหม่ๆ", 0.45, false));
      o.push(panel(1356, "ตอนนี้ ลองดูตอนจบงาน", 0.2, true));
      // เสียงนิ่งไหม
      o.push(`<rect x="22" y="1420" width="226" height="58" rx="8" fill="#fffaf0" stroke="#2b3350" stroke-width=".9"/>`);
      o.push(txt(30, 1432, "ขยับตัว แล้วเสียงยังนิ่งไหม?", 6.6, "#2b3350", "start", 800));
      {
        const crack = 0.5 + 0.5 * Math.sin(ph * 2);
        o.push(`<path d="${wpath(30, 238, 1457, (x) => 10 * vw(x * 0.22 - ph * 6) * (0.55 + 0.45 * crack) + (x > 150 ? (rnd(Math.floor(x * 0.7) + Math.floor(ph * 10) * 13) - 0.5) * 9 * act : 0), 1.6)}" fill="none" stroke="#6a4aa8" stroke-width="1.2" stroke-linejoin="round"/>`);
        o.push(txt(30, 1473, "ตอนแรก", 4.8, "#7b879f", "start") + txt(238, 1473, "ตอนนี้ ?", 4.8, "#7b879f", "end"));
      }
    }

    o.push(`</g>`);
    o.push(box(SCENE_MIC.focus[cue]?.box, ph));
    return o.join("");
  },
};

function clAbs(v: number) { return Math.max(0, Math.min(1, Math.abs(v))); }
