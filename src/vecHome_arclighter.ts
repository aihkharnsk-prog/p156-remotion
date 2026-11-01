// ฉากอธิบาย: ไฟแช็กอาร์คไฟฟ้า USB — แบต → วงจรสั่น → หม้อแปลงเพิ่มแรงดัน → อากาศแตกตัวเป็นประกายพลาสมา (SVG พิกัด 270x480)
// เน้นแอนิเมชัน: กล้องเลื่อนไล่ตามลำดับชิ้นส่วนจากแบตไปถึงขั้วอาร์ค, ทุก cue มีลูปเคลื่อนไหวตลอด
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

// ----- ฉากอธิบาย: ไฟแช็กอาร์คไฟฟ้า USB — แบต → วงจรสั่น → หม้อแปลงเพิ่มแรงดัน → อากาศแตกตัวเป็นประกายพลาสมา (SVG 270x480) -----
const FOCUS = {
  all: { cx: 135, cy: 172, z: 1.2 },
  batt: { cx: 135, cy: 62, z: 2.2 },
  osc: { cx: 135, cy: 100, z: 2.2 },
  xfmr: { cx: 135, cy: 170, z: 1.9 },
  field: { cx: 135, cy: 262, z: 2.6 },
  arc: { cx: 135, cy: 262, z: 3.2 },
  heat: { cx: 135, cy: 262, z: 2.4 },
  wind: { cx: 135, cy: 255, z: 1.9 },
  safe: { cx: 135, cy: 255, z: 1.6 },
  lock: { cx: 135, cy: 200, z: 1.5 },
  chk: { cx: 135, cy: 175, z: 1.4 },
  end: { cx: 135, cy: 172, z: 1.2 },
};
const DEFS = `<defs>
<radialGradient id="aglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f3e6ff" stop-opacity=".95"/><stop offset=".4" stop-color="#b58cff" stop-opacity=".6"/><stop offset="1" stop-color="#7a4cff" stop-opacity="0"/></radialGradient>
<linearGradient id="acore" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a6584"/><stop offset=".5" stop-color="#aeb9d6"/><stop offset="1" stop-color="#5a6584"/></linearGradient>
</defs>`;
const GX0 = 119, GX1 = 151, GY = 270; // ปลายขั้วสองข้าง
const tri = (u: number) => Math.abs((((u % 2) + 2) % 2) - 1);
const arcPath = (ph: number, seed: number, amp = 1) => {
  let d = `M${GX0} ${GY}`; const n = 9;
  for (let i = 1; i < n; i++) { const t = i / n; d += ` L${f2(lerp(GX0, GX1, t))} ${f2(GY + (rnd(seed + i * 3) - 0.5) * 11 * amp * Math.sin(Math.PI * t))}`; }
  return d + ` L${GX1} ${GY}`;
};
const chain = (ph: number, hl: number, vlev: number, flow: number): string => {
  let s = "";
  const lit = (k: number) => (hl === 0 || hl === k ? 1 : 0.32);
  // สายไฟ
  const wire = (d: string, k: number) => `<path d="${d}" stroke="#8c97b4" stroke-width="2.4" fill="none" opacity="${lit(k)}"/>`;
  s += wire("M135 70 V92", 2) + wire("M135 128 V150", 3);
  s += wire("M175 182 H192 V250 H" + (GX1 + 10), 4) + wire("M95 182 H78 V250 H" + (GX0 - 10), 4);
  // 1) แบตเตอรี่ + USB
  s += `<g opacity="${lit(1)}"><rect x="100" y="30" width="70" height="40" rx="8" fill="#10162c" stroke="#aeb9d6" stroke-width="2"/><rect x="170" y="43" width="5" height="14" rx="2" fill="#aeb9d6"/><rect x="105" y="35" width="${f2(60 * (0.45 + 0.1 * Math.sin(ph * 2)))}" height="30" rx="5" fill="#5dff8a" opacity=".85"/>`;
  s += txt(135, 56, "3.7 V", 11, "#10162c", "middle", 900) + `<rect x="64" y="42" width="22" height="16" rx="3" fill="#59648a" stroke="#aeb9d6" stroke-width="1"/><path d="M86 50 h14" stroke="#8c97b4" stroke-width="2.4"/>${txt(75, 70, "USB", 5.6, "#cfe0ff")}</g>`;
  // 2) วงจรสวิตช์/ออสซิลเลเตอร์ + คลื่นสี่เหลี่ยม
  s += `<g opacity="${lit(2)}"><rect x="102" y="92" width="66" height="36" rx="5" fill="#1c2340" stroke="#aeb9d6" stroke-width="1.6"/>`;
  let d = ""; const W = 52, x0 = 109;
  for (let i = 0; i <= 52; i++) { const u = i / 52, ph2 = u * 6 - ph * 3, y = (ph2 - Math.floor(ph2)) < 0.5 ? 100 : 118; d += (i ? " L" : "M") + f2(x0 + u * W) + " " + y; }
  s += `<path d="${d}" stroke="#ffe14a" stroke-width="1.6" fill="none" stroke-linejoin="round"/></g>`;
  // 3) หม้อแปลง
  s += `<g opacity="${lit(3)}"><rect x="108" y="148" width="54" height="70" rx="4" fill="none" stroke="url(#acore)" stroke-width="9"/>`;
  for (let i = 0; i < 4; i++) s += `<path d="M97 ${166 + i * 6.5} q11 3 22 0" stroke="#ff9a5a" stroke-width="2" fill="none"/>`;
  for (let i = 0; i < 16; i++) s += `<path d="M151 ${160 + i * 3.2} q11 1.6 22 0" stroke="#7fe3ff" stroke-width="1.3" fill="none"/>`;
  s += txt(88, 156, "ขดเข้า 4 รอบ", 5.4, "#ffb07a", "end") + txt(182, 156, "ขดออก 16 รอบ", 5.4, "#9fe8ff", "start") + `</g>`;
  // กระแสไหล (จุดวิ่ง)
  for (let i = 0; i < 6 && flow > 0; i++) { const u = (ph * 0.7 + i / 6) % 1; s += `<circle cx="135" cy="${f2(70 + u * 22)}" r="1.8" fill="#ffe14a" opacity="${flow}"/><circle cx="135" cy="${f2(128 + u * 22)}" r="1.8" fill="#ffe14a" opacity="${flow}"/>`; }
  // 4) ขั้วอาร์ค
  s += `<g opacity="${lit(4)}"><path d="M${GX0 - 10} 250 L${GX0 - 10} 270 L${GX0} 270" fill="none" stroke="#c3cbe0" stroke-width="3" stroke-linecap="round"/><path d="M${GX1 + 10} 250 L${GX1 + 10} 270 L${GX1} 270" fill="none" stroke="#c3cbe0" stroke-width="3" stroke-linecap="round"/><circle cx="${GX0}" cy="${GY}" r="2.2" fill="#e8ecff"/><circle cx="${GX1}" cy="${GY}" r="2.2" fill="#e8ecff"/></g>`;
  s += txt(56, 188, "3.7V → ?", 0.1, "#fff") ;
  return s;
};
const arc = (ph: number, k: number): string => {
  if (k < 0.02) return "";
  const fl = 0.5 + 0.5 * Math.sin(ph * 40), n = Math.floor(ph * 26);
  let s = `<circle cx="135" cy="${GY}" r="${f2(26 * k)}" fill="url(#aglow)" opacity="${f2(0.6 + 0.3 * fl)}"/>`;
  for (let j = 0; j < 3; j++) s += `<path d="${arcPath(ph, n * 7 + j * 31, 1)}" stroke="${j ? "#c9a8ff" : "#fff"}" stroke-width="${j ? 1.4 : 2}" fill="none" stroke-linejoin="round" opacity="${f2(k * (j ? 0.7 : 1))}"/>`;
  return s;
};
const fieldView = (ph: number, p: number): string => {
  let s = "";
  // เส้นสนามไฟฟ้า + โมเลกุลอากาศ; electron ถูกดึงหลุด
  for (let i = 0; i < 5; i++) { const y = GY - 16 + i * 8; s += `<path d="M${GX0 + 3} ${y} Q135 ${y + (i - 2) * 2.4} ${GX1 - 3} ${y}" stroke="#ffe14a" stroke-width=".8" stroke-dasharray="2 2" fill="none" opacity="${f2(0.4 + 0.5 * sm(0, 0.4, p))}"/>`; }
  for (let i = 0; i < 14; i++) {
    const x = GX0 + 5 + rnd(i) * (GX1 - GX0 - 10) + Math.sin(ph * 3 + i) * 1.2, y = GY - 17 + rnd(i + 4) * 34;
    s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="2.6" fill="#8fd4ff" opacity=".85"/>`;
    if (p > 0.45 && rnd(i + 9) < 0.6) {
      const u = (ph * 1.2 + rnd(i + 6)) % 1;
      s += `<circle cx="${f2(Math.min(GX1 - 4, x + u * 22))}" cy="${f2(y + Math.sin(u * 8) * 1.4)}" r="1.1" fill="#ffe14a"/>`;
    }
  }
  s += txt(135, GY + 30, p < 0.45 ? "อากาศเป็นฉนวน" : "สนามแรง ดึงอิเล็กตรอนหลุด", 5.2, p < 0.45 ? "#9fe8ff" : "#ffe14a");
  s += txt(GX0 - 4, GY + 14, "−", 8, "#9fb0e8", "end", 900) + txt(GX1 + 4, GY + 14, "+", 8, "#9fb0e8", "start", 900);
  return s;
};
const plasmaView = (ph: number, p: number): string => {
  // ภาพขยาย: อิเล็กตรอนชนโมเลกุล → ไอออน → ช่องนำไฟ
  let s = "";
  const k = sm(0, 0.7, p);
  for (let i = 0; i < 18; i++) {
    const x = GX0 + 5 + rnd(i) * (GX1 - GX0 - 10), y = GY - 10 + (rnd(i + 3) - 0.5) * 18 * (1 - 0.6 * k);
    const ion = rnd(i + 8) < k;
    s += `<circle cx="${f2(x)}" cy="${f2(y)}" r="2.2" fill="${ion ? "#d6b3ff" : "#8fd4ff"}" opacity=".9"/>`;
    if (ion) s += `<text x="${f2(x)}" y="${f2(y + 1.2)}" font-size="3.4" fill="#2b1a55" text-anchor="middle" ${K} font-weight="900">+</text>`;
  }
  s += arc(ph, k);
  return s;
};
export const SCENE_ARCLIGHTER: SceneDef = {
  focus: FOCUS,
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const c = (FOCUS as any)[cue] ? cue : "all";
    const o: string[] = [DEFS, bgFill(ph, "#241a4a", "#0e0b24", "#c9a8ff")];
    const hl = ({ batt: 1, osc: 2, xfmr: 3, field: 4, arc: 4 } as any)[c] || 0;
    const flow = c === "all" || c === "end" ? 1 : c === "osc" || c === "xfmr" || c === "batt" ? 1 : 0.3;
    if (c === "chk") {
      // แบตค่อยๆ เสื่อม: แถบความจุลด ตามรอบชาร์จ
      const cyc = Math.floor(p * 12), cap = 1 - 0.35 * sm(0, 1, p), pulse = 0.5 + 0.5 * Math.sin(ph * 3);
      o.push(`<rect x="80" y="90" width="110" height="60" rx="12" fill="#10162c" stroke="#aeb9d6" stroke-width="3"/><rect x="190" y="108" width="8" height="24" rx="3" fill="#aeb9d6"/><rect x="86" y="96" width="${f2(98 * cap)}" height="48" rx="8" fill="${cap < 0.7 ? "#ffb14a" : "#5dff8a"}"/><rect x="${f2(86 + 98 * cap)}" y="96" width="${f2(98 * (1 - cap))}" height="48" rx="8" fill="none" stroke="#ff8a7a" stroke-width="1.2" stroke-dasharray="3 3"/>`);
      o.push(txt(135, 128, `ชาร์จ ${cyc * 40} รอบ`, 10, "#10162c", "middle", 900));
      for (let i = 0; i < 6; i++) o.push(`<rect x="${86 + i * 18}" y="168" width="12" height="${f2(24 * (i < Math.round(6 * cap) ? 1 : 0.15))}" rx="3" fill="${i < Math.round(6 * cap) ? "#c9a8ff" : "#3a3560"}" transform="translate(0 ${f2(24 * (1 - (i < Math.round(6 * cap) ? 1 : 0.15)))})"/>`);
      o.push(txt(135, 212, "ประกายต่อการชาร์จหนึ่งครั้ง", 6.4, "#cfe0ff"), `<g opacity="${f2(0.4 + 0.6 * pulse)}">${arc(ph, 0.5 * cap).replace(/GY/g, "GY")}</g>`.replace(/<g opacity="[^"]*">.*<\/g>/, ""));
      return o.join("");
    }
    if (c !== "lock") o.push(chain(ph, hl, 1, flow));
    if (c === "field" || c === "arc") o.push(pill(135, 238, "หลายพันโวลต์", "#e8d9ff"));
    if (c === "field") o.push(fieldView(ph, p));
    if (c === "arc") o.push(plasmaView(ph, p));
    if (c === "all" || c === "end") o.push(arc(ph, 0.55 + 0.45 * Math.sin(ph * 2) ** 2));
    if (c === "heat") {
      const k = sm(0.2, 0.6, p), fl = sm(0.6, 0.9, p);
      o.push(arc(ph, 1));
      o.push(`<g transform="translate(135 ${GY + 8})"><rect x="-3" y="0" width="6" height="22" rx="2" fill="#e8ecff" stroke="#8d98b8" stroke-width=".8"/><path d="M0 0 V-4" stroke="#2b3350" stroke-width="1.4"/><circle cx="0" cy="-4" r="${f2(1.6 + 2 * k)}" fill="${mixc("#8a6a3a", "#ff9a3a", k)}"/>${fl > 0.01 ? `<path d="M0 -4 q-4 -6 0 -14 q4 8 0 14z" fill="#ffd36a" stroke="#ff7a2a" stroke-width=".8" opacity="${f2(fl)}"/>` : ""}</g>`);
      o.push(pill(135, 224, "ความร้อนกระจุกที่จุดเดียว", "#fff6c9"));
    }
    if (c === "wind") {
      for (let i = 0; i < 8; i++) { const u = (ph * 0.8 + i / 8) % 1; o.push(`<path d="M${f2(60 + u * 150)} ${f2(236 + i * 9)} h${f2(22)}" stroke="#cfe0ff" stroke-width="1.4" stroke-linecap="round" opacity="${f2(0.7 * Math.sin(u * 3.14))}"/>`); }
      o.push(arc(ph, 1), pill(135, 224, "ลมไม่ได้เป่าดับเหมือนเปลวไฟ", "#e1f3ff"));
    }
    if (c === "safe") {
      o.push(arc(ph, 0.9));
      const sc = 0.5 + 0.5 * Math.sin(ph * 3);
      // นิ้วมือห้ามแตะปลายขั้ว + ไอแก๊สรั่ว
      o.push(`<g transform="translate(88 ${f2(300 + 3 * sc)})"><path d="M-8 0 q0 -22 6 -26 q5 -2 6 6 v-14 q1 -6 5 -2 v14 q2 -6 5 -1 v10 q2 -4 5 0 v18 z" fill="#f1c9a8" stroke="#8a5a3a" stroke-width="1"/></g>`);
      o.push(`<circle cx="88" cy="262" r="12" fill="none" stroke="#ff5a5a" stroke-width="2.4"/><path d="M80 254 L96 270" stroke="#ff5a5a" stroke-width="2.4"/>`);
      for (let i = 0; i < 6; i++) { const u = (ph * 0.5 + i / 6) % 1; o.push(`<circle cx="${f2(190 + Math.sin(u * 9 + i) * 6)}" cy="${f2(300 - u * 56)}" r="${f2(2 + u * 3)}" fill="#ffd36a" opacity="${f2(0.5 * (1 - u))}"/>`); }
      o.push(`<circle cx="190" cy="262" r="12" fill="none" stroke="#ff5a5a" stroke-width="2.4"/><path d="M182 254 L198 270" stroke="#ff5a5a" stroke-width="2.4"/>`, txt(190, 322, "ใกล้ก๊าซรั่ว", 6, "#ffb0a0"), txt(88, 322, "แตะปลายขั้ว", 6, "#ffb0a0"));
    }
    if (c === "lock") {
      const on = sm(0.3, 0.6, p);
      o.push(`<rect x="95" y="90" width="80" height="150" rx="16" fill="#2f3a63" stroke="#aeb9d6" stroke-width="2.4"/><rect x="109" y="104" width="52" height="22" rx="6" fill="#10162c"/><circle cx="135" cy="160" r="12" fill="#e5586a" stroke="#6a1020" stroke-width="1.6"/>`);
      o.push(`<rect x="118" y="196" width="34" height="14" rx="7" fill="#10162c" stroke="#aeb9d6" stroke-width="1.2"/><circle cx="${f2(lerp(125, 145, on))}" cy="203" r="5" fill="${on > 0.5 ? "#5dff8a" : "#ff8a7a"}"/>`);
      o.push(txt(135, 226, on > 0.5 ? "ล็อก" : "ปลดล็อก", 7, on > 0.5 ? "#5dff8a" : "#ff8a7a", "middle", 900));
      o.push(`<g transform="translate(135 82)"><rect x="-8" y="-4" width="16" height="12" rx="3" fill="${on > 0.5 ? "#5dff8a" : "#ffe14a"}" stroke="#2b3350" stroke-width="1"/><path d="M-5 -4 v-5 a5 5 0 0 1 10 0 v${on > 0.5 ? 5 : 1}" fill="none" stroke="#2b3350" stroke-width="1.6"/></g>`);
    }
    return o.join("");
  },
};
