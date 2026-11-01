// ฉากอธิบาย: พาวเวอร์แบงก์ชาร์จเร็ว — เซลล์ลิเธียม 3.7V → วงจรบูสต์ (สวิตช์+ขดลวด+ไดโอด+ตัวเก็บประจุ) → ต่อรองโปรโตคอล → ไฟแรง; เสื่อม/ป่อง — SVG พิกัด 270x480
// เน้นแอนิเมชัน: กระแสไหลตามวงจรจริงสองเฟส (สวิตช์ปิด = ขดลวดสะสมพลังงาน, สวิตช์เปิด = ดันผ่านไดโอดออกเอาต์พุต)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, along, plen } = H;
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

const DEFS = `<defs>
<linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16293d"/><stop offset="1" stop-color="#0a141f"/></linearGradient>
<linearGradient id="pshell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8795ab"/><stop offset=".25" stop-color="#e6ecf4"/><stop offset=".7" stop-color="#b9c4d4"/><stop offset="1" stop-color="#76849c"/></linearGradient>
<linearGradient id="pcell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f9bff"/><stop offset=".45" stop-color="#2c5fb8"/><stop offset="1" stop-color="#173670"/></linearGradient>
<linearGradient id="pcap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f4f9"/><stop offset="1" stop-color="#8d98ad"/></linearGradient>
<linearGradient id="pbd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25946a"/><stop offset="1" stop-color="#176346"/></linearGradient>
<radialGradient id="pglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe88a" stop-opacity=".95"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
<radialGradient id="pheat" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff6a4a" stop-opacity=".85"/><stop offset="1" stop-color="#ff6a4a" stop-opacity="0"/></radialGradient>
</defs>`;

// ---- เรขาคณิตวงจร (พิกัดโลก) ----
const P_ON: Pt[] = [[30, 176], [30, 78], [38, 78], [80, 78], [88, 78], [88, 132], [150, 132], [156, 132], [156, 176]];
const P_OFF: Pt[] = [[30, 176], [30, 78], [80, 78], [88, 78], [112, 78], [126, 78], [126, 132], [150, 132], [156, 132], [156, 176]];
const P_OUT: Pt[] = [[126, 78], [164, 78], [172, 78], [186, 78], [190, 120], [196, 192], [227, 192], [227, 170]];
const L_ON = plen(P_ON), L_OFF = plen(P_OFF), L_OUT = plen(P_OUT);
const CABLE = P_OUT.slice(2);
const poly = (a: Pt[]) => a.map((p) => `${p[0]},${p[1]}`).join(" ");

const dots = (path: Pt[], len: number, ph: number, n: number, speed: number, col: string, a: number, r = 1.7, seed = 0) => {
  let s = "";
  for (let i = 0; i < n; i++) {
    const q = along(path, ((ph * speed + i / n) % 1) * len);
    s += `<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${r * 2.4}" fill="${col}" opacity="${f2(0.22 * a)}"/><circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${r}" fill="#fff8d6" opacity="${f2(a)}"/>`;
  }
  return s + (seed ? "" : "");
};

// สถานะสวิตช์ตามคิว: คืน {closed, e(พลังงานสะสมในขดลวด 0..1)}
const swing = (cue: string, p: number, ph: number) => {
  const u = (ph * 1.1) % 1;
  const blink = { closed: u < 0.5, e: u < 0.5 ? u / 0.5 : 1 - (u - 0.5) / 0.5 };
  if (cue === "boost" && p < 0.5) { const w = (ph * 0.8) % 1; return { closed: true, e: 0.25 + 0.75 * w }; }
  if (cue === "pump" && p < 0.4) { const w = (ph * 0.8) % 1; return { closed: false, e: 1 - w }; }
  return blink;
};

// ================= ตัวพาวเวอร์แบงก์ (ผ่าครึ่ง) =================
const bankShell = (ph: number, o: { swell: number; dim: number }) => {
  const sw = o.swell;
  const bx = -sw * 12, bw = 154 + sw * 24;
  const s: string[] = [];
  s.push(`<g opacity="${f2(1 - o.dim)}">`);
  s.push(`<rect x="${f2(18 + bx)}" y="${f2(40 - sw * 6)}" width="${f2(bw)}" height="${f2(222 + sw * 16)}" rx="16" fill="url(#pshell)" stroke="#475671" stroke-width="1.6"/>`);
  s.push(`<rect x="${f2(24 + bx * 0.6)}" y="${f2(46 - sw * 5)}" width="${f2(142 + sw * 10)}" height="${f2(210 + sw * 10)}" rx="11" fill="#0d1a28"/>`);
  if (sw > 0.05) s.push(`<path d="M${f2(30 + bx)} ${f2(40 - sw * 6)} q${f2(60)} ${f2(-sw * 7)} ${f2(bw - 24)} 0" stroke="#ff7a5c" stroke-width="1.6" fill="none" opacity="${f2(sw)}"/>`);
  s.push(`</g>`);
  return s.join("");
};

const pcb = (ph: number, cue: string, p: number, dim: number) => {
  const o: string[] = [];
  const { closed, e } = swing(cue, p, ph);
  const emph = cue === "boost" || cue === "pump" || cue === "loss" || cue === "guard" ? 1 : 0.55;
  o.push(`<g opacity="${f2(1 - dim)}">`);
  o.push(`<rect x="26" y="52" width="138" height="90" rx="5" fill="url(#pbd)" stroke="#0e3d2a" stroke-width="1.2"/>`);
  for (let i = 0; i < 14; i++) o.push(`<circle cx="${f2(32 + rnd(i) * 126)}" cy="${f2(58 + rnd(i + 5) * 78)}" r=".9" fill="#7fe0b4" opacity=".35"/>`);
  // สายไฟ
  const wire = "#e2c36a";
  const W = (a: Pt[]) => `<polyline points="${poly(a)}" fill="none" stroke="#0c2a1d" stroke-width="3.6" stroke-linejoin="round"/><polyline points="${poly(a)}" fill="none" stroke="${wire}" stroke-width="2" stroke-linejoin="round"/>`;
  o.push(W([[30, 176], [30, 78], [38, 78]]), W([[80, 78], [98, 78]]), W([[112, 78], [164, 78]]), W([[88, 78], [88, 100]]), W([[88, 112], [88, 132]]), W([[44, 132], [150, 132], [156, 132], [156, 176]]), W([[126, 78], [126, 102]]), W([[126, 108], [126, 132]]));
  // ขดลวด + สนามแม่เหล็ก
  let coil = "M38 78";
  for (let i = 0; i < 4; i++) coil += ` q5 -13 10.5 0`;
  o.push(`<path d="${coil}" fill="none" stroke="#0c2a1d" stroke-width="4.4" stroke-linecap="round"/><path d="${coil}" fill="none" stroke="#e8924a" stroke-width="2.6" stroke-linecap="round"/>`);
  const fe = e;
  o.push(`<circle cx="59" cy="76" r="${f2(14 + 14 * fe)}" fill="url(#pglow)" opacity="${f2(0.15 + 0.75 * fe)}"/>`);
  for (let k = 0; k < 3; k++) o.push(`<ellipse cx="59" cy="73" rx="${f2((14 + k * 9) * (0.4 + 0.8 * fe))}" ry="${f2((9 + k * 6) * (0.4 + 0.8 * fe))}" fill="none" stroke="#9fe4ff" stroke-width=".9" stroke-dasharray="2.5 2" opacity="${f2((0.7 - k * 0.2) * fe)}"/>`);
  // สวิตช์
  const ang = closed ? 0 : -34;
  o.push(`<circle cx="88" cy="100" r="2.4" fill="#cfd6e3" stroke="#2b3350" stroke-width=".8"/><circle cx="88" cy="112" r="2.4" fill="#cfd6e3" stroke="#2b3350" stroke-width=".8"/>`);
  o.push(`<g transform="rotate(${ang} 88 100)"><rect x="86.6" y="100" width="2.8" height="12" rx="1.2" fill="#f4f6fa" stroke="#2b3350" stroke-width=".7"/></g>`);
  if (closed) o.push(`<circle cx="88" cy="106" r="7" fill="url(#pglow)" opacity=".8"/>`);
  // ไดโอด
  o.push(`<polygon points="98,71 98,85 111,78" fill="${closed ? "#6b7488" : "#ffd14a"}" stroke="#2b3350" stroke-width=".9"/><rect x="111" y="70.5" width="2.6" height="15" fill="#2b3350"/>`);
  // ตัวเก็บประจุ
  const cv = 0.8 + 0.1 * Math.sin(ph * 6);
  o.push(`<rect x="117" y="102" width="18" height="2.6" rx="1" fill="#cfd6e3" stroke="#2b3350" stroke-width=".6"/><rect x="117" y="108" width="18" height="2.6" rx="1" fill="#cfd6e3" stroke="#2b3350" stroke-width=".6"/><rect x="118" y="104.6" width="16" height="3.4" fill="#4aa8ff" opacity="${f2(cv)}"/>`);
  // ชิปควบคุม
  o.push(`<rect x="40" y="98" width="36" height="24" rx="3" fill="#1b2233" stroke="#0a0f1a" stroke-width="1"/>`);
  for (let i = 0; i < 5; i++) o.push(`<rect x="${42 + i * 7}" y="95" width="3" height="3.5" fill="#cfd6e3"/><rect x="${42 + i * 7}" y="121.5" width="3" height="3.5" fill="#cfd6e3"/>`);
  o.push(txt(58, 113, "ชิปคุม", 6, "#9fe4ff", "middle", 700));
  o.push(`<path d="M76 108 H82 V106" fill="none" stroke="${closed ? "#ffe14a" : "#7d8aa6"}" stroke-width="1.2" stroke-dasharray="2 1.5"/>`);
  // พอร์ตเอาต์พุต
  o.push(`<rect x="160" y="70" width="12" height="16" rx="3" fill="#cdd5e2" stroke="#2b3350" stroke-width="1"/><rect x="163" y="74" width="6" height="8" rx="1.5" fill="#0d1a28"/>`);
  // กระแส
  const fl = emph;
  if (closed) o.push(dots(P_ON, L_ON, ph, 11, 0.7, "#ffd14a", fl));
  else o.push(dots(P_OFF, L_OFF, ph, 12, 0.7, "#ffd14a", fl));
  o.push(`</g>`);
  return { svg: o.join(""), closed, e };
};

// ================= โทรศัพท์ + สาย =================
const phone = (ph: number, cue: string, p: number, fast: number, volt: number, pct: number) => {
  const o: string[] = [];
  o.push(`<rect x="198" y="52" width="58" height="118" rx="9" fill="#1a1f2e" stroke="#7d8aa6" stroke-width="1.6"/><rect x="203" y="60" width="48" height="98" rx="4" fill="#26324d"/>`);
  o.push(`<rect x="217" y="55" width="20" height="3" rx="1.5" fill="#0b0f19"/>`);
  o.push(`<rect x="216" y="86" width="22" height="34" rx="3" fill="none" stroke="#bfe9ff" stroke-width="1.2"/><rect x="223" y="83" width="8" height="3" rx="1" fill="#bfe9ff"/>`);
  const fh = 30 * cl(pct);
  o.push(`<rect x="218" y="${f2(118 - fh)}" width="18" height="${f2(fh)}" rx="1.5" fill="${fast > 0.5 ? "#ffd14a" : "#6bf29a"}"/>`);
  o.push(`<path d="M229 92 l-5 10 h4 l-2 8 l6 -11 h-4 z" fill="#fff" opacity="${f2(0.6 + 0.4 * Math.sin(ph * 8))}"/>`);
  o.push(txt(227, 138, `${Math.round(pct * 100)}%`, 7, "#fff", "middle", 800));
  o.push(`<rect x="220" y="168" width="14" height="5" rx="2" fill="#cdd5e2" stroke="#2b3350" stroke-width=".8"/>`);
  // สาย
  o.push(`<polyline points="${poly(CABLE)}" fill="none" stroke="#10151f" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${poly(CABLE)}" fill="none" stroke="${fast > 0.5 ? "#7a5a1c" : "#2e3a52"}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`);
  const Lc = plen(CABLE);
  o.push(dots(CABLE, Lc, ph, fast > 0.5 ? 9 : 5, fast > 0.5 ? 0.9 : 0.5, fast > 0.5 ? "#ffd14a" : "#b9d6ff", 0.9, fast > 0.5 ? 1.9 : 1.4));
  return o.join("");
};

// ================= คิว: ถามตอบ (ต่อรองโปรโตคอล) =================
const talk = (ph: number, cue: string, p: number) => {
  const o: string[] = [];
  const mid = (t: number) => along(CABLE, plen(CABLE) * t);
  // แพ็กเก็ตข้อความวิ่งไปมา
  if (cue === "ask") {
    for (let i = 0; i < 4; i++) {
      const u = (ph * 0.55 + i * 0.25) % 1, dir = i % 2;
      const q = mid(dir ? 1 - u : u);
      o.push(`<rect x="${f2(q[0] - 3)}" y="${f2(q[1] - 2.4)}" width="6" height="4.8" rx="1.2" fill="${dir ? "#6bf29a" : "#ffe14a"}" stroke="#2b3350" stroke-width=".6"/>`);
    }
    o.push(pill(200, 38, "คุยกันก่อนจ่ายไฟ"));
  }
  if (cue === "offer") {
    const items = [["5V", "3A"], ["9V", "3A"], ["20V", "3A"]];
    const n = Math.floor(cl(p * 1.6) * 3 + 0.001);
    items.forEach((it, i) => {
      const y = 24 + i * 18, show = i < n || p > 0.6;
      const pick = i === 1 && p > 0.62;
      o.push(`<g opacity="${show ? 1 : 0.0}"><rect x="94" y="${y}" width="56" height="14" rx="7" fill="${pick ? "#ffe14a" : "#eaf3ff"}" stroke="#2b3350" stroke-width=".9"/>${txt(122, y + 10, `${it[0]} · ${it[1]}`, 7.2, "#2b3350", "middle", 800)}</g>`);
    });
    o.push(pill(122, 18, "พาวเวอร์แบงก์ประกาศ", "#cfeaff"));
    if (p > 0.64) {
      const k = sm(0.64, 0.9, p);
      o.push(`<g opacity="${f2(k)}"><rect x="160" y="42" width="48" height="16" rx="8" fill="#6bf29a" stroke="#2b3350" stroke-width=".9"/>${txt(184, 52.5, "ขอ 9V", 7.2, "#13442a", "middle", 800)}<path d="M158 50 H150" stroke="#6bf29a" stroke-width="2" marker-end="none"/></g>`);
      o.push(pill(184, 30, "มือถือเลือก", "#d8ffe3"));
    }
  }
  if (cue === "deal") {
    const k = sm(0.05, 0.5, p);
    o.push(`<rect x="62" y="62" width="48" height="22" rx="5" fill="#0b0f19" stroke="#ffd14a" stroke-width="1"/>`);
    o.push(txt(86, 77, `${Math.round(lerp(5, 9, k))}V`, 13, "#ffd14a", "middle", 900));
    o.push(pill(122, 18, k < 0.99 ? "ปรับแรงดัน..." : "พร้อมแล้ว!", "#d8ffe3"));
    o.push(pill(130, 262, "ถ้าตกลงไม่ได้ → 5V ปกติ", "#fff6c9"));
  }
  return o.join("");
};

// ================= HUD/แผงข้อมูลประกอบ =================
const cellsBlock = (ph: number, cue: string, p: number, e: number) => {
  const o: string[] = [];
  const cap = cue === "age" ? 1 - 0.28 * sm(0.05, 0.95, p) : 1;
  const soc = cue === "age" ? cap * (0.55 + 0.45 * Math.cos(p * 3 * Math.PI * 2)) : 0.82;
  const sw = cue === "swell" ? sm(0, 0.8, p) : 0;
  for (let c = 0; c < 2; c++) {
    const y0 = c ? 204 : 154, h = 44;
    const bulge = sw * (c ? 3 : 8);
    o.push(`<rect x="156" y="${y0 + 14}" width="6" height="${h - 28}" rx="2" fill="url(#pcap)"/><rect x="28" y="${y0 + 14}" width="6" height="${h - 28}" rx="2" fill="url(#pcap)"/>`);
    o.push(`<rect x="34" y="${f2(y0 - bulge)}" width="122" height="${f2(h + bulge * 2)}" rx="9" fill="url(#pcell)" stroke="#0e2450" stroke-width="1.2"/>`);
    o.push(`<rect x="38" y="${f2(y0 + 4 - bulge)}" width="114" height="5" rx="2.5" fill="#fff" opacity=".2"/>`);
    // ระดับประจุ
    o.push(`<rect x="42" y="${y0 + h - 10}" width="106" height="5" rx="2.5" fill="#0a1830" opacity=".7"/><rect x="42" y="${y0 + h - 10}" width="${f2(106 * soc)}" height="5" rx="2.5" fill="${soc < 0.3 ? "#ff8a7a" : "#6bf29a"}"/>`);
    if (cue === "age") o.push(`<rect x="42" y="${y0 + h - 10}" width="106" height="5" rx="2.5" fill="none" stroke="#ff8a7a" stroke-width=".7" stroke-dasharray="2 2" opacity=".0"/><rect x="${f2(42 + 106 * cap)}" y="${y0 + h - 10}" width="${f2(106 * (1 - cap))}" height="5" rx="2" fill="#ff8a7a" opacity=".45"/>`);
  }
  // หน้าต่างผ่าเซลล์ 1: ขั้วลบ | แผ่นกั้น | ขั้วบวก + ไอออนลิเธียม
  const win = cue === "cell";
  if (win) {
    o.push(`<rect x="56" y="160" width="78" height="30" rx="3" fill="#10192b" stroke="#bfe9ff" stroke-width=".9"/>`);
    o.push(`<rect x="58" y="162" width="28" height="26" fill="#4a5470"/><rect x="86" y="162" width="6" height="26" fill="#f4f6fa"/><rect x="92" y="162" width="40" height="26" fill="#e38b5a"/>`);
    o.push(txt(72, 178.5, "ขั้วลบ", 5.4, "#fff", "middle", 700), txt(112, 178.5, "ขั้วบวก", 5.4, "#4a1d0c", "middle", 700));
    for (let i = 0; i < 9; i++) {
      const u = (ph * 0.45 + i / 9) % 1, y = 166 + (i % 3) * 8 + Math.sin(ph * 3 + i) * 1.2;
      o.push(`<circle cx="${f2(62 + u * 66)}" cy="${f2(y)}" r="2.1" fill="#ffe14a" stroke="#7a5a00" stroke-width=".5" opacity="${f2(Math.sin(Math.PI * u))}"/>`);
    }
    o.push(`<path d="M62 150 H128" stroke="#ffe14a" stroke-width="1.4" marker-end=""/><path d="M122 146 l8 4 l-8 4 z" fill="#ffe14a"/>`);
    o.push(pill(95, 144, "ไอออนลิเธียมวิ่ง → ปล่อยไฟ", "#fff6c9"));
    o.push(`<rect x="76" y="203" width="36" height="12" rx="6" fill="#0b0f19" stroke="#6bf29a" stroke-width="1"/>`);
    o.push(txt(94, 211.5, "≈ 3.7V", 8, "#6bf29a", "middle", 900));
  }
  // ก๊าซตอนป่อง
  if (cue === "swell") for (let i = 0; i < 12; i++) {
    const u = (ph * 0.5 + rnd(i) * 3) % 1, x = 44 + rnd(i + 3) * 100, y = 196 - u * 36 * (0.5 + rnd(i + 1));
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(1.4 + rnd(i + 8) * 2.4)}" fill="#e8f7ff" stroke="#9ec5e0" stroke-width=".5" opacity="${f2(sm(0.05, 0.4, p) * (1 - u) * 0.9)}"/>`);
  }
  if (cue === "swell") o.push(`<g opacity="${f2(sm(0.3, 0.7, p))}"><path d="M132 120 l14 -24 l14 24 z" fill="#ffd14a" stroke="#7a1a28" stroke-width="1.6" stroke-linejoin="round"/>${txt(146, 117, "!", 13, "#7a1a28", "middle", 900)}</g>`);
  return o.join("");
};

// ---- แผงเปรียบเทียบความจุ ----
const capPanel = (ph: number, p: number) => {
  const o: string[] = [];
  const k = sm(0.05, 0.5, p), k2 = sm(0.4, 0.95, p);
  o.push(`<rect x="12" y="34" width="246" height="216" rx="12" fill="#0d1a28" opacity=".94" stroke="#7fe3ff" stroke-width="1"/>`);
  o.push(pill(135, 52, "ก้อนหนึ่งหมื่น mAh"));
  const base = 232, H1 = 140 * k, H2 = 140 * 0.63 * k2;
  o.push(`<rect x="52" y="${f2(base - H1)}" width="56" height="${f2(H1)}" rx="4" fill="url(#pcell)" stroke="#0e2450" stroke-width="1"/>`);
  o.push(txt(80, f2(base - H1 - 6), "10,000", 10, "#fff", "middle", 900), txt(80, base + 9, "ที่ 3.7V ในเซลล์", 6.6, "#bfe9ff", "middle", 700));
  o.push(`<rect x="160" y="${f2(base - H2)}" width="56" height="${f2(H2)}" rx="4" fill="#6bf29a" stroke="#13442a" stroke-width="1"/>`);
  o.push(`<rect x="160" y="${f2(base - 140 * k2)}" width="56" height="${f2(140 * k2 - H2)}" rx="4" fill="#ff8a7a" opacity=".28" stroke="#ff8a7a" stroke-width=".8" stroke-dasharray="3 2"/>`);
  o.push(txt(188, f2(base - H2 - 5), "≈6,000–6,500", 8.6, "#fff", "middle", 900), txt(188, base + 9, "ที่ 5V ใช้จริง", 6.6, "#bfe9ff", "middle", 700));
  if (k2 > 0.5) o.push(txt(188, f2(base - 140 * k2 * 0.9 + 4), "หายไป", 7, "#ffb0a6", "middle", 700));
  o.push(`<path d="M112 ${base - 72} H156" stroke="#ffe14a" stroke-width="1.4" stroke-dasharray="3 2"/><path d="M152 ${base - 76} l7 4 l-7 4 z" fill="#ffe14a"/>`);
  return o.join("");
};

// ---- เซลล์แก่: จำนวนรอบ + จำนวนครั้งที่ชาร์จมือถือ ----
const ageHud = (ph: number, p: number) => {
  const o: string[] = [];
  const cyc = Math.round(500 * sm(0.05, 0.95, p));
  o.push(pill(95, 142, `ชาร์จซ้ำแล้ว ${cyc} รอบ`, "#fff6c9"));
  return o.join("");
};

const chkHud = (ph: number, p: number) => {
  const o: string[] = [];
  const rowY = [86, 156];
  const labels = ["ตอนซื้อใหม่", "ตอนนี้"];
  const n = [3, 2];
  for (let r = 0; r < 2; r++) {
    o.push(`<rect x="22" y="${rowY[r] - 26}" width="226" height="52" rx="10" fill="#0d1a28" opacity=".92" stroke="#7fe3ff" stroke-width=".9"/>`);
    o.push(txt(32, rowY[r] - 9, labels[r], 8, "#bfe9ff", "start", 800));
    for (let i = 0; i < 3; i++) {
      const on = i < n[r], t = sm(0.05 + r * 0.25 + i * 0.08, 0.2 + r * 0.25 + i * 0.08, p);
      o.push(`<g opacity="${f2(on ? t : 0.2)}"><rect x="${40 + i * 56}" y="${rowY[r] - 2}" width="22" height="34" rx="4" fill="none" stroke="${on ? "#6bf29a" : "#7d8aa6"}" stroke-width="1.6"/><rect x="${44 + i * 56}" y="${rowY[r] + 14}" width="14" height="14" rx="2" fill="${on ? "#6bf29a" : "#3a4466"}"/><rect x="${46 + i * 56}" y="${rowY[r] - 5}" width="10" height="3" rx="1" fill="${on ? "#6bf29a" : "#7d8aa6"}"/></g>`);
    }
  }
  o.push(pill(135, 226, "ชาร์จมือถือได้กี่รอบ?"));
  return o.join("");
};

// ================= ตาราง focus (กล้อง) — cy = กลางเนื้อหา + 90/z เพื่อเลี่ยงแถบซับ =================
const Z = (x: number, y: number, z: number, box?: [number, number, number, number], label?: string) => ({ cx: x, cy: y + 90 / z, z, box, label });
export const SCENE_POWERBANK: SceneDef = {
  focus: {
    all: { ...Z(95, 150, 1.12) },
    cell: { ...Z(95, 195, 1.7, [26, 150, 140, 102]) },
    volt: { ...Z(110, 130, 1.25, [160, 68, 20, 22], "ช่องเอาต์พุต 5V") },
    boost: { ...Z(95, 98, 1.8, [26, 52, 138, 90]) },
    pump: { ...Z(100, 98, 1.8, [26, 52, 138, 90]) },
    loss: { ...Z(95, 100, 1.8, [26, 52, 138, 90]) },
    cap: { ...Z(135, 140, 1.0) },
    ask: { ...Z(185, 110, 1.5, [158, 52, 100, 126]) },
    offer: { ...Z(160, 80, 1.5, [94, 18, 60, 60]) },
    deal: { ...Z(150, 100, 1.45, [52, 56, 70, 36]) },
    guard: { ...Z(95, 98, 1.8, [26, 52, 138, 90]) },
    age: { ...Z(95, 195, 1.7, [26, 150, 140, 102]) },
    swell: { ...Z(95, 150, 1.1, [12, 34, 160, 232]) },
    chk: { ...Z(135, 140, 1.0) },
    end: { ...Z(135, 150, 1) },
  },
  render: ({ frame, cue, p, ef }) => {
    const ph = frame / 30;
    const o: string[] = [DEFS];
    o.push(`<rect x="-140" y="-140" width="550" height="760" fill="url(#pbg)"/>`);
    for (let i = 0; i < 18; i++) {
      const x = rnd(i) * 270, y = 330 - ((ph * (3 + rnd(i + 9) * 5) + rnd(i + 4) * 340) % 340);
      o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(0.8 + rnd(i + 2) * 1.8)}" fill="#7fe3ff" opacity="${f2(0.07 + 0.06 * rnd(i + 7))}"/>`);
    }
    const panel = cue === "cap" || cue === "chk";
    const swellK = cue === "swell" ? sm(0, 0.8, p) : 0;
    const dim = panel ? 0.82 : 0;
    o.push(bankShell(ph, { swell: swellK, dim }));
    const pc = pcb(ph, cue, p, dim);
    o.push(pc.svg);
    o.push(`<g opacity="${f2(1 - dim)}">${cellsBlock(ph, cue, p, pc.e)}</g>`);
    // สถานะการชาร์จ
    const fastK = cue === "deal" ? sm(0.45, 0.7, p) : 0;
    const pct = cue === "deal" ? 0.35 + 0.4 * p : cue === "chk" ? 0.5 : 0.5 + 0.3 * ((ph * 0.2) % 1);
    o.push(`<g opacity="${f2(1 - dim * 0.9)}">${phone(ph, cue, p, fastK, 0, pct)}</g>`);
    if (cue === "all") o.push(pill(95, 30, "แบตเตอรี่ → ไฟ 5V"));
    if (cue === "cell") o.push("");
    if (cue === "volt") {
      o.push(pill(48, 36, "เซลล์ ≈ 3.7V", "#ffe3a8"), pill(130, 36, "USB ต้องการ 5V", "#d8ffe3"));
      o.push(`<path d="M60 40 H80 M104 40 H112" stroke="#ff8a7a" stroke-width="1.4"/><text x="92" y="43" font-size="9" fill="#ff8a7a" ${K} font-weight="900" text-anchor="middle">✕</text>`);
    }
    if (cue === "boost" || cue === "pump" || cue === "loss") {
      const closed = pc.closed;
      const msg = cue === "loss" ? "แรงดันขึ้น กระแสลง" : closed ? "สวิตช์ปิด: สะสมพลังงาน" : "สวิตช์เปิด: ดันออกทางไดโอด";
      o.push(pill(95, 40, msg, closed && cue !== "loss" ? "#cfeaff" : "#ffe9b0"));
      o.push(txt(30, 64, "3.7V", 6.6, "#ffe14a", "middle", 900));
      o.push(txt(126, 69, "5V", 7, "#6bf29a", "middle", 900));
    }
    if (cue === "loss") {
      for (let i = 0; i < 6; i++) {
        const u = (ph * 0.8 + i / 6) % 1, x = 52 + (i % 3) * 22 + Math.sin(ph * 4 + i) * 2;
        o.push(`<path d="M${f2(x)} ${f2(70 - u * 20)} q3 -4 0 -8 q-3 -4 0 -8" stroke="#ff8a6a" stroke-width="1.4" fill="none" opacity="${f2(1 - u)}"/>`);
      }
      o.push(`<circle cx="59" cy="76" r="${f2(22 + 3 * Math.sin(ph * 6))}" fill="url(#pheat)" opacity=".55"/><circle cx="88" cy="106" r="16" fill="url(#pheat)" opacity=".45"/>`);
      o.push(pill(95, 166, "ความร้อน ≈ 10–15%", "#ffd0c4"));
      o.push(`<g>${txt(30, 148, "เข้า: กระแสมาก", 5.8, "#ffe14a", "start", 700)}${txt(164, 148, "ออก: กระแสน้อย", 5.8, "#6bf29a", "end", 700)}</g>`);
    }
    if (cue === "cap") o.push(capPanel(ph, p));
    if (cue === "ask" || cue === "offer" || cue === "deal") o.push(talk(ph, cue, p));
    if (cue === "guard") {
      const t = 40 + 38 * (0.5 + 0.5 * Math.sin(ph * 1.6));
      const over = t > 66;
      o.push(`<rect x="146" y="96" width="9" height="36" rx="4.5" fill="#fff" stroke="#2b3350" stroke-width="1"/><rect x="148.5" y="${f2(128 - (t - 30) * 0.55)}" width="4" height="${f2((t - 30) * 0.55 + 2)}" rx="2" fill="${over ? "#ff5a4a" : "#6bf29a"}"/>`);
      o.push(`<g transform="translate(58 90)"><ellipse rx="9" ry="5.5" fill="#fff" stroke="#2b3350" stroke-width=".9"/><circle cx="${f2(Math.sin(ph * 2) * 2.5)}" cy="0" r="2.8" fill="#2b3350"/></g>`);
      o.push(pill(95, 40, over ? "ร้อนเกิน → ลดกำลัง/ตัดไฟ" : "ชิปวัดอุณหภูมิและกระแส", over ? "#ffd0c4" : "#cfeaff"));
      if (over) o.push(`<rect x="38" y="104" width="44" height="16" fill="#ff5a4a" opacity=".0"/><path d="M84 78 l10 -0 M88 100 l0 12" stroke="#ff5a4a" stroke-width="2" opacity=".0"/>`);
    }
    if (cue === "age") o.push(ageHud(ph, p));
    if (cue === "chk") o.push(chkHud(ph, p));
    if (cue === "swell") o.push(pill(95, 24, "แก๊สในเซลล์ → ตัวบวม", "#ffd0c4"));
    o.push(H.box(SCENE_POWERBANK.focus[cue]?.box, ph));
    return o.join("");
  },
};
