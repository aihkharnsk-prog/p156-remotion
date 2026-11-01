// ฉากอธิบาย: แก๊สกระป๋องพกพา — วาล์วสปริงที่ปากกระป๋อง, บิวเทนเหลวเดือดเป็นไอ, อุปกรณ์ตัดแรงดัน (SVG พิกัด 270x480)
// เน้นแอนิเมชัน: กล้องเลื่อนระหว่างตัวกระป๋อง/วาล์ว/เตา, ทุก cue มีลูปเคลื่อนไหวตลอด
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

// ----- ฉากอธิบาย: แก๊สกระป๋องพกพา (บิวเทน) — วาล์วสปริง, ของเหลวเดือด, อุปกรณ์ตัดแรงดัน — SVG 270x480 -----
const CX = 135, CL = 105, CR = 165, CT = 172, CB = 300; // ตัวกระป๋อง
const DEFS = `<defs>
<linearGradient id="bcan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d8aa8"/><stop offset=".3" stop-color="#d7deef"/><stop offset="1" stop-color="#5d6a8c"/></linearGradient>
<linearGradient id="bliq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#e8902c"/></linearGradient>
<linearGradient id="bstove" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#454f70"/><stop offset=".4" stop-color="#8a95b6"/><stop offset="1" stop-color="#3d4766"/></linearGradient>
<radialGradient id="bfl" cx=".5" cy=".75" r=".6"><stop offset="0" stop-color="#d8f4ff"/><stop offset=".5" stop-color="#4aa8ff"/><stop offset="1" stop-color="#2a6cff" stop-opacity="0"/></radialGradient>
<clipPath id="bcc"><rect x="${CL + 3}" y="${CT + 3}" width="${CR - CL - 6}" height="${CB - CT - 6}" rx="6"/></clipPath>
</defs>`;
type P = { mu: number; pr: number; fl: number; heat: number; ly: number; frost: number; cut: number; pan: number; vent: number; mark: number };
const D: P = { mu: 1, pr: 0.35, fl: 1, heat: 0, ly: 0.55, frost: 0, cut: 0, pan: 0, vent: 0, mark: 0 };
const FOCUS = {
  all: { cx: 135, cy: 190, z: 1.1 },
  liquid: { cx: 135, cy: 262, z: 1.9 },
  valve: { cx: 135, cy: 204, z: 3.3 },
  mount: { cx: 135, cy: 196, z: 3.0 },
  flow: { cx: 135, cy: 180, z: 1.35 },
  cool: { cx: 135, cy: 262, z: 1.9 },
  heat: { cx: 135, cy: 185, z: 1.3 },
  cut: { cx: 135, cy: 196, z: 2.0 },
  vent: { cx: 135, cy: 250, z: 1.9 },
  last: { cx: 135, cy: 175, z: 1.15 },
  chk: { cx: 135, cy: 230, z: 1.5 },
  end: { cx: 135, cy: 190, z: 1.1 },
};
const params = (cue: string, p: number): P => {
  const o = { ...D };
  if (cue === "liquid") { o.mu = 0; o.fl = 0; }
  if (cue === "valve") { o.mu = 0; o.fl = 0; }
  if (cue === "mount") { o.mu = p; o.fl = 0; o.mark = 1; }
  if (cue === "flow") { o.ly = lerp(0.55, 0.5, p); }
  if (cue === "cool") { o.frost = sm(0, 0.8, p); o.pr = lerp(0.35, 0.2, p); o.ly = 0.48; }
  if (cue === "heat") { o.heat = sm(0.05, 0.9, p); o.pr = lerp(0.35, 0.8, o.heat); o.pan = 1; }
  if (cue === "cut") {
    o.pan = 1; const a = sm(0, 0.35, p), b = sm(0.4, 0.75, p);
    o.heat = 1 - 0.7 * b; o.pr = lerp(0.8, 0.98, a) * (1 - 0.55 * b); o.mu = 1 - b; o.cut = a; o.fl = 1 - b;
  }
  if (cue === "vent") { o.mu = 0; o.fl = 0; o.heat = 1; o.pr = lerp(0.85, 1.05, sm(0, 0.5, p)) - 0.5 * sm(0.55, 0.95, p); o.vent = sm(0.45, 0.6, p) * (1 - sm(0.9, 1, p)); }
  if (cue === "last") { o.pan = 1; o.pr = 0.5; o.heat = 0.5; }
  if (cue === "chk") { o.mu = 0; o.fl = 0; }
  return o;
};
const sp2 = (x: number, y: number, t: string, k: number, f = "#fff6c9") => `<g transform="translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})">${pill(x, y, t, f)}</g>`;
const valve = (P: P, ph: number, c: string): string => {
  const o: string[] = [];
  const open = sm(0.6, 1, P.mu);
  const blockB = lerp(124, 148, sm(0, 0.6, P.mu)) + 8 * open; // ก้นบล็อกของเตา = ปลายก้านวาล์ว
  const stemTop = P.mu > 0.01 ? Math.max(blockB, 148 + 0) : 148;
  const seal = 164 + 8 * open; // แผ่นยาง
  // ตัวบล็อกเตา + ท่อไปหัวเตา
  const sx = P.mu > 0.01 ? blockB : 124;
  o.push(`<rect x="130" y="100" width="10" height="${f2(sx - 26 - 100)}" fill="#59648a"/>`);
  o.push(`<rect x="112" y="${f2(sx - 26)}" width="46" height="26" rx="5" fill="url(#bstove)" stroke="#232b45" stroke-width="1.2"/><rect x="127" y="${f2(sx - 4)}" width="16" height="4" rx="1.5" fill="#232b45"/>`);
  // บ่าและปากกระป๋อง
  o.push(`<path d="M${CL} ${CT + 6} Q${CL} ${CT - 2} 118 ${CT - 4} L122 160 H148 L152 ${CT - 4} Q${CR} ${CT - 2} ${CR} ${CT + 6}" fill="url(#bcan)" stroke="#232b45" stroke-width="1.4"/>`);
  o.push(`<rect x="124" y="160" width="22" height="13" fill="#1c2340" stroke="#aeb9d6" stroke-width=".8"/>`);
  // ก้านวาล์ว
  o.push(`<rect x="133.2" y="${f2(Math.min(stemTop, seal - 6))}" width="3.6" height="${f2(seal - Math.min(stemTop, seal - 6))}" fill="#d7deef" stroke="#232b45" stroke-width=".5"/>`);
  // สปริง
  let d = `M${CX} ${f2(seal + 2)}`; const n = 7;
  for (let i = 1; i <= n; i++) d += ` L${CX + (i % 2 ? 6 : -6)} ${f2(seal + 2 + (172 - seal - 1) * i / n)}`;
  o.push(`<path d="${d}" fill="none" stroke="#ffe14a" stroke-width="1.4"/>`);
  // แผ่นยาง + ที่นั่ง
  o.push(`<rect x="126" y="${f2(seal - 1.4)}" width="18" height="3.4" rx="1.2" fill="#e5586a" stroke="#6a1020" stroke-width=".6"/>`);
  o.push(`<rect x="124" y="162.5" width="5" height="2.4" fill="#aeb9d6"/><rect x="141" y="162.5" width="5" height="2.4" fill="#aeb9d6"/>`);
  // ไอแก๊สดันใต้แผ่นยาง / ไหลผ่านช่อง
  const nA = 5;
  for (let i = 0; i < nA; i++) {
    const u = (ph * 0.9 + i / nA) % 1;
    if (open < 0.3) o.push(`<path d="M${f2(118 + i * 8.5)} ${f2(180 - 4 * Math.sin(ph * 6 + i))} v-7 l-2 2.6 m2 -2.6 l2 2.6" stroke="#ffb14a" stroke-width="1" fill="none" opacity=".9"/>`);
    else {
      const px = i % 2 ? 128 : 142, y = 178 - u * 70;
      o.push(`<circle cx="${f2(px + (i % 2 ? 1 : -1) * (1 - u) * 4 * 0 + (i % 2 ? u * 7 : -u * 7) * 0)}" cy="${f2(y)}" r="1.9" fill="#ffb14a" opacity="${f2(Math.sin(u * Math.PI) * open)}"/>`);
    }
  }
  
  
  return o.join("");
};
const canister = (P: P, ph: number): string => {
  const o: string[] = [];
  const ly = CT + 8 + (CB - CT - 16) * (1 - P.ly);
  const hot = P.heat, cold = P.frost;
  const body = mixc(mixc("#c9d3ea", "#ff9a7a", hot * 0.7), "#bfe6ff", cold * 0.6);
  o.push(`<rect x="${CL}" y="${CT}" width="${CR - CL}" height="${CB - CT}" rx="8" fill="url(#bcan)" stroke="#232b45" stroke-width="1.4"/>`);
  o.push(`<rect x="${CL}" y="${CT}" width="${CR - CL}" height="${CB - CT}" rx="8" fill="${body}" opacity="${f2(0.35 * Math.max(hot, cold))}"/>`);
  o.push(`<rect x="${CL + 3}" y="${CT + 3}" width="${CR - CL - 6}" height="${CB - CT - 6}" rx="6" fill="#141a33"/>`);
  o.push(`<g clip-path="url(#bcc)">`);
  o.push(`<rect x="${CL}" y="${f2(ly)}" width="${CR - CL}" height="${CB - ly}" fill="url(#bliq)" opacity=".92"/>`);
  o.push(`<path d="M${CL} ${f2(ly)} q7 ${f2(-2 * Math.sin(ph * 3))} 14 0 t14 0 t14 0 t14 0" stroke="#fff3c8" stroke-width="1" fill="none"/>`);
  // โมเลกุลของเหลว (แน่น ขยับช้า)
  for (let i = 0; i < 26; i++) {
    const x = CL + 7 + rnd(i) * (CR - CL - 14) + Math.sin(ph * 3 + i) * 1.4, y = ly + 6 + rnd(i + 30) * (CB - ly - 12) + Math.cos(ph * 2.6 + i) * 1.4;
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="2.1" fill="#fff0c0" opacity=".75"/>`);
  }
  // ฟองเดือดขึ้นเมื่อมีการใช้แก๊ส
  if (P.fl > 0.05) for (let i = 0; i < 6; i++) {
    const u = (ph * 0.7 + i / 6) % 1, x = CL + 9 + rnd(i + 4) * (CR - CL - 18);
    o.push(`<circle cx="${f2(x)}" cy="${f2(CB - 8 - u * (CB - 8 - ly))}" r="${f2(1.2 + u * 1.5)}" fill="none" stroke="#fff" stroke-width=".8" opacity="${f2(0.9 * P.fl * (1 - u * 0.4))}"/>`);
  }
  // ไอแก๊ส (เบาบาง เร็ว) — เร็วขึ้นตามอุณหภูมิ
  const sp = 1 + 2.4 * hot - 0.5 * cold;
  const tri = (u: number) => Math.abs((((u % 2) + 2) % 2) - 1);
  for (let i = 0; i < 18; i++) {
    const t = ph * sp * (0.8 + rnd(i) * 0.9) + rnd(i + 8) * 9;
    const x = CL + 8 + tri(t * 0.9 + rnd(i + 3) * 2) * (CR - CL - 16), y = CT + 8 + tri(t * 0.7 + rnd(i + 5) * 2) * Math.max(4, ly - CT - 16);
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.8" fill="${mixc("#8fd4ff", "#ff7a5a", hot)}" opacity=".95"/>`);
  }
  o.push(`</g>`);
  if (cold > 0.05) for (let i = 0; i < 12; i++) o.push(`<circle cx="${f2(CL + 4 + rnd(i) * (CR - CL - 8))}" cy="${f2(CB - 3 - rnd(i + 5) * 40 * cold)}" r="${f2(1 + rnd(i + 9) * 1.6)}" fill="#fff" opacity="${f2(0.7 * cold)}"/>`);
  o.push(`<text x="${CX}" y="${CB - 26}" font-size="7" fill="#232b45" ${K} font-weight="900" text-anchor="middle" opacity=".0">LPG</text>`);
  return o.join("");
};
const gauge = (P: P, ph: number): string => {
  const x = 188, y0 = CT, y1 = CB;
  const lv = cl(P.pr / 1.1), fy = y1 - (y1 - y0) * lv;
  const o: string[] = [];
  o.push(`<rect x="${x}" y="${y0}" width="10" height="${y1 - y0}" rx="4" fill="#10162c" stroke="#aeb9d6" stroke-width="1"/>`);
  o.push(`<rect x="${x}" y="${f2(y0)}" width="10" height="${f2((y1 - y0) * 0.18)}" rx="4" fill="#ff5a5a" opacity=".35"/>`);
  o.push(`<rect x="${x + 1.5}" y="${f2(fy)}" width="7" height="${f2(y1 - fy - 1.5)}" rx="3" fill="${lv > 0.82 ? "#ff5a5a" : lv > 0.6 ? "#ffb14a" : "#5dff8a"}"/>`);
  o.push(txt(x + 5, y0 - 5, "แรงดัน", 5.6, "#cfe0ff", "middle", 700));
  const th = x + 18;
  o.push(`<circle cx="${th}" cy="${y1 + 4}" r="0.1" fill="none"/>`);
  return o.join("");
};
const burner = (P: P, ph: number): string => {
  const o: string[] = [];
  o.push(`<rect x="108" y="96" width="54" height="7" rx="3" fill="#59648a" stroke="#232b45" stroke-width="1"/><rect x="116" y="92" width="38" height="5" rx="2" fill="#2f3a63"/>`);
  // กระทะ
  const w = lerp(34, 82, P.pan);
  o.push(`<rect x="${f2(135 - w)}" y="62" width="${f2(2 * w)}" height="5" rx="2.5" fill="#8a95b6" stroke="#232b45" stroke-width="1"/>`);
  if (P.pan > 0.5) o.push(`<path d="M${f2(135 - w)} 62 q-8 -2 -10 -6 M${f2(135 + w)} 62 q8 -2 10 -6" stroke="#8a95b6" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  const fl = P.fl * (1 - 0.2 * P.frost);
  if (fl > 0.03) {
    const hgt = (24 + 3 * Math.sin(ph * 14)) * fl;
    for (let i = -3; i <= 3; i++) o.push(`<ellipse cx="${135 + i * 6.5}" cy="${f2(92 - hgt * 0.4)}" rx="3.2" ry="${f2(hgt * 0.5 + Math.sin(ph * 17 + i) * 1.2)}" fill="url(#bfl)" opacity=".95"/>`);
    // ความร้อนสะท้อนจากกระทะใหญ่กลับลงมาทางกระป๋อง
    if (P.pan > 0.5 && P.heat > 0.05) for (let i = 0; i < 4; i++) {
      const u = (ph * 0.6 + i / 4) % 1, sd = i % 2 ? 1 : -1, x0 = 135 + sd * (36 + (i >> 1) * 22);
      o.push(`<path d="M${f2(x0)} ${f2(70 + u * 20)} q${sd * -6} 8 ${sd * -2} 14 t${sd * -3} 14" stroke="#ff7a4a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="${f2(Math.sin(u * Math.PI) * P.heat)}"/>`);
    }
  }
  return o.join("");
};
const vent = (P: P, ph: number): string => {
  if (P.vent < 0.02) return "";
  let s = "";
  for (let i = 0; i < 8; i++) { const u = (ph * 1.8 + i / 8) % 1, sd = i % 2 ? 1 : -1; s += `<circle cx="${f2(CX + sd * (4 + u * 28) + (rnd(i) - 0.5) * 6)}" cy="${f2(CB + 6 + u * 22)}" r="${f2(2 + u * 4)}" fill="#ffffff" opacity="${f2(0.95 * (1 - u) * P.vent)}"/>`; }
  return s + `<ellipse cx="${CX}" cy="${CB}" rx="10" ry="2.4" fill="#ffe14a" stroke="#232b45" stroke-width=".8"/>` + txt(CX, CB + 40, "ปล่อยแก๊สออก", 6.4, "#ffe14a");
};
const bottomView = (ph: number, p: number): string => {
  const o: string[] = [];
  const cy = 235, R = 46;
  o.push(`<ellipse cx="135" cy="${cy}" rx="${R}" ry="${R}" fill="url(#bcan)" stroke="#232b45" stroke-width="2"/><ellipse cx="135" cy="${cy}" rx="${R - 9}" ry="${R - 9}" fill="none" stroke="#6d7897" stroke-width="1.2"/>`);
  o.push(`<rect x="113" y="${cy - 8}" width="44" height="14" rx="2" fill="#aeb9d6" stroke="#6d7897" stroke-width=".8"/>`);
  o.push(txt(135, cy + 2.6, "วัน/เดือน/ปีผลิต", 5.2, "#232b45", "middle", 800));
  // สนิม + รอยบุบ
  for (let i = 0; i < 9; i++) o.push(`<circle cx="${f2(165 + rnd(i) * 7 - 4)}" cy="${f2(cy + 14 + rnd(i + 4) * 14)}" r="${f2(1 + rnd(i + 8) * 2)}" fill="#b4562a" opacity=".85"/>`);
  o.push(`<path d="M104 ${cy - 22} q8 -6 14 0" stroke="#6d7897" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  // แว่นขยายเลื่อนตรวจ: วันที่ → สนิม → รอยบุบ
  const sq = [[135, cy - 1], [168, cy + 22], [108, cy - 20]];
  const k = p * 2.999, i = Math.floor(k), f = ease(cl((k - i) * 1.6)), a = sq[i], b = sq[Math.min(2, i + 1)];
  const mx = lerp(a[0], b[0], i < 2 ? f : 0) , my = lerp(a[1], b[1], i < 2 ? f : 0);
  o.push(`<circle cx="${f2(mx)}" cy="${f2(my)}" r="17" fill="#ffffff" opacity=".12" stroke="#ffe14a" stroke-width="2.4"/><path d="M${f2(mx + 12)} ${f2(my + 12)} l12 12" stroke="#ffe14a" stroke-width="3.6" stroke-linecap="round"/>`);
  o.push(pill(135, 168, ["ดูวันผลิต", "ดูสนิม", "ดูรอยบุบ"][i]));
  return o.join("");
};
const lastCheck = (ph: number, p: number): string => {
  let s = "";
  const rows: [string, boolean][] = [["กระทะใหญ่เกินเตา", false], ["ที่อับอากาศ", false], ["กระป๋องตรงรุ่น", true]];
  rows.forEach(([t, ok], i) => {
    const a = sm(i * 0.22, i * 0.22 + 0.2, p), y = 204 + i * 24;
    s += `<g opacity="${f2(a)}"><rect x="52" y="${y - 10}" width="166" height="19" rx="9.5" fill="${ok ? "#e5f8e9" : "#ffe9e4"}" stroke="${ok ? "#1f8a3a" : "#c2402a"}" stroke-width="1"/>`;
    s += ok ? `<path d="M62 ${y - 1} l4 4 l8 -9" stroke="#1f8a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : `<path d="M62 ${y - 5} l9 9 M71 ${y - 5} l-9 9" stroke="#c2402a" stroke-width="2.4" stroke-linecap="round"/>`;
    s += txt(84, y + 3, t, 8, "#2b3350", "start", 800) + `</g>`;
  });
  return s;
};
export const SCENE_BUTANECAN: SceneDef = {
  focus: FOCUS,
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const c = (FOCUS as any)[cue] ? cue : "all";
    const P = params(c, p);
    const o: string[] = [DEFS, bgFill(ph)];
    if (c === "chk") { o.push(bottomView(ph, p)); return o.join(""); }
    const dim = c === "last" ? 0.3 : 1;
    o.push(`<g opacity="${dim}">`, burner(P, ph), valve(P, ph, c), canister(P, ph), gauge(P, ph), vent(P, ph), `</g>`);
    if (c === "cut") {
      const a = sm(0.15, 0.4, p), b = sm(0.4, 0.75, p);
      o.push(`<g opacity="${f2(a)}"><circle cx="196" cy="140" r="9" fill="#ffe14a" stroke="#2b3350" stroke-width="1"/><path d="M196 134 v7 M196 145 v.5" stroke="#2b3350" stroke-width="1.8" stroke-linecap="round"/></g>`);
      if (b > 0.3) o.push(pill(135, 40, "ไฟดับ กระป๋องหลุด", "#ffe1c9"));
      else if (a > 0.3) o.push(pill(135, 40, "แรงดันสูงผิดปกติ", "#ffe1c9"));
    }
    if (c === "heat") o.push(pill(135, 40, P.heat > 0.5 ? "ร้อนขึ้น แรงดันขึ้น" : "ความร้อนสะท้อนลงมา", "#ffe1c9"));
    if (c === "cool") o.push(pill(135, 40, "เดือดดึงความร้อน เย็นลง", "#cfeaff"));
    if (c === "liquid") o.push(pill(168, 150, "ไอแก๊ส", "#e1f3ff"), pill(168, 262, "บิวเทนเหลว", "#fff0c9"));
    if (c === "mount") o.push(sp2(135, 215, "หมุดเตากดก้านวาล์ว", 0.42, "#e1f3ff"));
    if (c === "valve") o.push(sp2(135, 215, "สปริงดันแผ่นยางปิดรู", 0.42));
    if (c === "last") o.push(lastCheck(ph, p));
    return o.join("");
  },
};
