// ฉากละเอียดสูง: กาต้มน้ำไฟฟ้า + เครื่องทำน้ำอุ่น (พิกัด 270x480)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, plen, along, rpath, tube, dot, wave, box, DEFS, room } = H;
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
type Pt = [number, number];
const T = (x: number, y: number, s: number, fill: string, txt: string, a = "middle", w = 900) =>
  `<text x="${x}" y="${y}" font-size="${s}" fill="${fill}" font-family="Kanit, sans-serif" font-weight="${w}" text-anchor="${a}">${txt}</text>`;
const steam = (x: number, y: number, ph: number, n: number, a: number, spread = 10, rise = 46) => {
  let o = "";
  for (let i = 0; i < n; i++) {
    const u = (ph * 0.5 + i / n) % 1;
    o += `<circle cx="${f2(x + Math.sin(u * 6 + i * 2) * spread * u)}" cy="${f2(y - u * rise)}" r="${f2(3 + u * 7)}" fill="#fff" opacity="${f2(Math.sin(Math.PI * u) * 0.42 * a)}" filter="url(#bl)"/>`;
  }
  return o;
};

// ===================== กาต้มน้ำไฟฟ้า =====================
type KS = { t: number; on: number; b: number; b2: number; w: number; lid: number };
const K_STATE: Record<string, [KS, KS]> = {
  all: [{ t: 22, on: 0, b: 0, b2: 0, w: 1, lid: 0 }, { t: 22, on: 0, b: 0, b2: 0, w: 1, lid: 0 }],
  base: [{ t: 22, on: 0, b: 0, b2: 0, w: 1, lid: 0 }, { t: 24, on: 1, b: 0, b2: 0, w: 1, lid: 0 }],
  element: [{ t: 24, on: 1, b: 0, b2: 0, w: 1, lid: 0 }, { t: 48, on: 1, b: 0, b2: 0, w: 1, lid: 0 }],
  convect: [{ t: 48, on: 1, b: 0, b2: 0, w: 1, lid: 0 }, { t: 92, on: 1, b: 0, b2: 0, w: 1, lid: 0 }],
  boil: [{ t: 92, on: 1, b: 0, b2: 0, w: 1, lid: 0 }, { t: 100, on: 1, b: 0.05, b2: 0, w: 1, lid: 0 }],
  steam: [{ t: 100, on: 1, b: 0.05, b2: 0, w: 1, lid: 0 }, { t: 100, on: 1, b: 0.4, b2: 0, w: 1, lid: 0 }],
  bimetal: [{ t: 100, on: 1, b: 0.4, b2: 0, w: 1, lid: 0 }, { t: 100, on: 1, b: 1, b2: 0, w: 1, lid: 0 }],
  click: [{ t: 100, on: 1, b: 1, b2: 0, w: 1, lid: 0 }, { t: 99, on: 0, b: 1, b2: 0, w: 1, lid: 0 }],
  lid: [{ t: 100, on: 1, b: 0, b2: 0, w: 1, lid: 1 }, { t: 100, on: 1, b: 0, b2: 0, w: 1, lid: 1 }],
  dry: [{ t: 100, on: 1, b: 0, b2: 0, w: 0.05, lid: 0 }, { t: 140, on: 0, b: 0, b2: 1, w: 0.05, lid: 0 }],
  end: [{ t: 99, on: 0, b: 1, b2: 0, w: 1, lid: 0 }, { t: 90, on: 0, b: 1, b2: 0, w: 1, lid: 0 }],
};
export const KETTLE: SceneDef = {
  focus: {
    all: { cx: 135, cy: 258, z: 1.0 },
    base: { cx: 135, cy: 376, z: 2.6, box: [50, 366, 172, 30], label: "ฐานต่อไฟ" },
    element: { cx: 135, cy: 330, z: 2.3, box: [74, 348, 120, 16], label: "แผ่นความร้อน" },
    convect: { cx: 135, cy: 262, z: 1.9, box: [70, 170, 128, 188], label: "น้ำร้อนลอย น้ำเย็นจม" },
    boil: { cx: 135, cy: 230, z: 1.9, box: [70, 170, 128, 188], label: "เดือด 100°C" },
    steam: { cx: 205, cy: 250, z: 2.0, box: [204, 150, 40, 210], label: "ท่อไอน้ำในด้ามจับ" },
    bimetal: { cx: 224, cy: 346, z: 5.0, box: [206, 330, 40, 32], label: "แผ่นโลหะสองชั้น" },
    click: { cx: 200, cy: 352, z: 3.6, box: [190, 332, 56, 40], label: "กริ๊ก!" },
    lid: { cx: 170, cy: 150, z: 2.3, box: [74, 126, 140, 40], label: "ฝาไม่ปิด" },
    dry: { cx: 135, cy: 350, z: 2.8, box: [74, 346, 120, 28], label: "กันน้ำแห้ง" },
    end: { cx: 135, cy: 258, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = K_STATE[cue] || K_STATE.all;
    const e = ease(p);
    const g = (k: keyof KS) => lerp(A[k], B[k], e);
    const t = g("t"), on = g("on"), b = g("b"), b2 = g("b2"), w = g("w"), lid = g("lid");
    const heat = cl(on) * (cue === "base" ? e : 1);
    const o: string[] = [DEFS, room(430)];
    o.push(`<rect x="-140" y="398" width="550" height="12" fill="url(#top)"/><rect x="-140" y="410" width="550" height="60" fill="url(#cab)"/>`);
    o.push(`<ellipse cx="135" cy="399" rx="124" ry="5" fill="#1b1008" opacity=".4" filter="url(#bl)"/>`);
    // ฐาน + สาย
    o.push(`<path d="M52 380 Q10 380 6 398" fill="none" stroke="#222" stroke-width="3.4" stroke-linecap="round"/>`);
    o.push(`<g filter="url(#sh)"><rect x="52" y="374" width="168" height="24" rx="8" fill="url(#dark)" stroke="#1d2338"/></g><ellipse cx="135" cy="375" rx="46" ry="5" fill="url(#metal)" stroke="#6e7a93"/>`);
    for (let i = 0; i < 3; i++) o.push(`<rect x="${123 + i * 12}" y="372" width="3" height="5" rx="1" fill="#d7a53a"/>`);
    // ตัวกา
    const body = "M62 170 L66 360 Q66 372 78 372 H190 Q202 372 202 360 L206 170 Q206 156 192 156 H76 Q62 156 62 170 Z";
    o.push(`<g filter="url(#sh)"><path d="${body}" fill="url(#metal)" stroke="#5e6a82" stroke-width="1.4"/></g>`);
    o.push(`<path d="M72 172 L76 352 H192 L196 172 Z" fill="#eef3fa"/>`);
    o.push(`<path d="M62 162 L34 146 L38 138 L68 152 Z" fill="url(#metal)" stroke="#5e6a82" stroke-width="1"/>`);
    // น้ำ
    const yTop = 352 - (352 - 196) * w;
    const wc = mixc("#7fc8ff", "#9ee0ff", cl((t - 20) / 80));
    o.push(`<clipPath id="kc"><path d="M72 172 L76 352 H192 L196 172 Z"/></clipPath><g clip-path="url(#kc)">`);
    if (w > 0.02) {
      o.push(`<rect x="60" y="${f2(yTop)}" width="150" height="${f2(360 - yTop)}" fill="${wc}" opacity=".82"/>`);
      o.push(`<path d="M60 ${f2(yTop)} q10 -2 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#fff" stroke-width="1.3" opacity=".8" transform="translate(${f2(Math.sin(ph * 4) * 3)} 0)"/>`);
    }
    if (cue === "convect" && w > 0.1) for (let i = 0; i < 4; i++) {
      const x = 92 + i * 32, dir = i % 2 ? -1 : 1, u = (ph * 0.45 + i / 4) % 1;
      o.push(`<path d="M${x} 340 C${x + 14 * dir} 300 ${x + 14 * dir} 260 ${x} 224" fill="none" stroke="${i % 2 ? "#3f8fe0" : "#ff7a3a"}" stroke-width="2" stroke-dasharray="5 4" stroke-dashoffset="${f2(-ph * 22 * (i % 2 ? -1 : 1))}" opacity="${f2(0.7 * Math.sin(Math.PI * u) + 0.2)}"/>`);
    }
    const boiling = t > 94 && w > 0.1 && on > 0.5;
    if (boiling) for (let i = 0; i < 34; i++) { const u = (ph * (1.2 + rnd(i) * 0.9) + rnd(i + 9)) % 1; o.push(`<circle cx="${f2(80 + rnd(i + 33) * 112)}" cy="${f2(348 - u * (348 - yTop))}" r="${f2(1.3 + rnd(i + 5) * 2.6)}" fill="#fff" opacity="${f2(0.8 * (1 - u * 0.4))}" stroke="#bfe3ff" stroke-width=".4"/>`); }
    o.push(`</g>`);
    // แผ่นความร้อน (ใต้น้ำ) + แผ่นโลหะป้องกันน้ำแห้ง
    const hc = mixc("#5a2a22", "#ff5a1a", heat);
    o.push(`<rect x="76" y="350" width="116" height="10" rx="3" fill="#2a2430" stroke="#14101a"/><rect x="80" y="353" width="108" height="4" rx="2" fill="${hc}"/><rect x="80" y="353" width="108" height="4" rx="2" fill="${hc}" opacity=".6" filter="url(#bl)"/>`);
    if (heat > 0.3) o.push(`<rect x="70" y="342" width="128" height="24" fill="#ff7a2a" opacity="${f2(0.2 * heat)}" filter="url(#bl)"/>`);
    // แผ่นโลหะสองชั้นตัวสำรอง (ใต้แผ่นความร้อน)
    const sb = (bx: number, by: number, bend: number, len: number, hot: boolean) =>
      `<path d="M${bx} ${by} Q${f2(bx + len * 0.5)} ${f2(by - bend * 6)} ${f2(bx + len)} ${f2(by - bend * 14)}" fill="none" stroke="#8e99b0" stroke-width="2.6" stroke-linecap="round"/><path d="M${bx} ${f2(by - 2.4)} Q${f2(bx + len * 0.5)} ${f2(by - 2.4 - bend * 6)} ${f2(bx + len)} ${f2(by - 2.4 - bend * 14)}" fill="none" stroke="${hot ? "#ff8a3a" : "#c97a3a"}" stroke-width="2.4" stroke-linecap="round"/>`;
    o.push(sb(112, 366, b2, 30, b2 > 0.5));
    o.push(`<rect x="146" y="364" width="6" height="4" rx="1" fill="${b2 > 0.5 ? "#4a5570" : "#ffb44a"}"/>`);
    // ฝา
    const lf = lid * 12;
    o.push(`<g transform="translate(${f2(lid * 10)} ${f2(-lf)}) rotate(${f2(lid * -8)} 76 150)"><path d="M72 152 Q72 142 84 142 H184 Q196 142 196 152 V158 H72Z" fill="url(#cook)" stroke="#7a869c"/><rect x="120" y="130" width="28" height="14" rx="6" fill="#2b3350"/><rect x="176" y="148" width="10" height="4" rx="2" fill="#5b6a88"/></g>`);
    // ด้ามจับ + ท่อไอน้ำ
    o.push(`<g filter="url(#sh)"><rect x="206" y="150" width="38" height="208" rx="14" fill="url(#dark)" stroke="#1d2338"/></g><rect x="218" y="162" width="10" height="182" rx="5" fill="#0e1328"/>`);
    const STEAM: Pt[] = [[194, 160], [222, 160], [222, 336]];
    const sl = plen(STEAM);
    o.push(`<path d="${rpath(STEAM, 4)}" fill="none" stroke="#31405e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);
    const sflow = boiling && lid < 0.5 ? 1 : 0;
    if (sflow) for (let i = 0; i < 12; i++) { const d = ((i / 12) * sl + ph * 70) % sl; const pt = along(STEAM, d); o.push(`<circle cx="${f2(pt[0])}" cy="${f2(pt[1])}" r="${f2(2 + (d / sl) * 0.6)}" fill="#fff" opacity=".85"/>`); }
    // แผ่นโลหะสองชั้นหลัก + หน้าสัมผัส
    const bend = b;
    o.push(`<rect x="206" y="352" width="36" height="8" rx="2" fill="#2b3350"/>`);
    o.push(`<rect x="212" y="344" width="6" height="8" rx="1" fill="#6e7a93"/>`);
    o.push(`<path d="M214 346 Q${f2(226)} ${f2(346 - bend * 4)} 240 ${f2(346 - bend * 11)}" fill="none" stroke="#8e99b0" stroke-width="3" stroke-linecap="round"/><path d="M214 343 Q${f2(226)} ${f2(343 - bend * 4)} 240 ${f2(343 - bend * 11)}" fill="none" stroke="${mixc("#c97a3a", "#ff8a3a", b)}" stroke-width="2.8" stroke-linecap="round"/>`);
    o.push(`<rect x="234" y="347" width="8" height="5" rx="1" fill="${on > 0.5 ? "#ffb44a" : "#6e7a93"}" stroke="#2b3350" stroke-width=".6"/><rect x="${f2(233 + 0)}" y="${f2(341 - bend * 11 + 4)}" width="8" height="2" rx="1" fill="#e6c27a"/>`);
    if (on > 0.5) o.push(`<circle cx="238" cy="349" r="8" fill="#ffb44a" opacity=".5" filter="url(#bl)"/>`);
    if (cue === "click" && p < 0.45) o.push(`<path d="M230 340 l-6 -8 l7 3 l-3 -9" stroke="#ffe14a" stroke-width="1.6" fill="none" opacity="${f2(1 - p * 2.2)}"/>`);
    // ไอน้ำที่ปาก + ฝา
    if (boiling) o.push(steam(46, 140, ph, 5, 0.9, 10) + (lid > 0.5 ? steam(150, 134, ph + 0.2, 6, 1, 14, 60) : ""));
    // เทอร์โมมิเตอร์
    const tf = cl((t - 20) / 125);
    const tc = mixc("#46b4ff", "#ff4a2a", tf);
    o.push(`<g transform="translate(0 -60)"><rect x="8" y="230" width="12" height="130" rx="6" fill="#eef3fa" stroke="#9fb0c8"/><rect x="12" y="${f2(354 - 118 * tf)}" width="4" height="${f2(118 * tf + 4)}" rx="2" fill="${tc}"/><circle cx="14" cy="368" r="9" fill="${tc}" stroke="#9fb0c8"/>${T(14, 392, 9, "#46526b", Math.round(t) + "°C")}</g>`);
    o.push(box(KETTLE.focus[cue]?.box, ph));
    return o.join("");
  },
};

// ===================== เครื่องทำน้ำอุ่นอาบน้ำ =====================
type SS = { f: number; on: number; T: number; sw: number; cut: number; valve: number };
const S_STATE: Record<string, [SS, SS]> = {
  all: [{ f: 1, on: 1, T: 38, sw: 1, cut: 0, valve: 1 }, { f: 1, on: 1, T: 38, sw: 1, cut: 0, valve: 1 }],
  inlet: [{ f: 0, on: 0, T: 25, sw: 0, cut: 0, valve: 0 }, { f: 1, on: 0, T: 25, sw: 0.2, cut: 0, valve: 1 }],
  flow: [{ f: 1, on: 0, T: 25, sw: 0, cut: 0, valve: 1 }, { f: 1, on: 1, T: 30, sw: 1, cut: 0, valve: 1 }],
  element: [{ f: 1, on: 1, T: 30, sw: 1, cut: 0, valve: 1 }, { f: 1, on: 1, T: 38, sw: 1, cut: 0, valve: 1 }],
  temp: [{ f: 1, on: 1, T: 38, sw: 1, cut: 0, valve: 1 }, { f: 0.55, on: 1, T: 49, sw: 1, cut: 0, valve: 0.45 }],
  dry: [{ f: 0.55, on: 1, T: 49, sw: 1, cut: 0, valve: 0.45 }, { f: 0, on: 0, T: 49, sw: 0, cut: 0, valve: 0 }],
  cutoff: [{ f: 0.1, on: 1, T: 55, sw: 1, cut: 0, valve: 0.1 }, { f: 0.1, on: 0, T: 78, sw: 1, cut: 1, valve: 0.1 }],
  ground: [{ f: 1, on: 1, T: 38, sw: 1, cut: 0, valve: 1 }, { f: 1, on: 1, T: 38, sw: 1, cut: 0, valve: 1 }],
  end: [{ f: 1, on: 1, T: 38, sw: 1, cut: 0, valve: 1 }, { f: 1, on: 1, T: 38, sw: 1, cut: 0, valve: 1 }],
};
export const SHOWER: SceneDef = {
  focus: {
    all: { cx: 135, cy: 240, z: 1.0 },
    inlet: { cx: 100, cy: 350, z: 2.4, box: [84, 270, 30, 160], label: "ท่อน้ำเข้า" },
    flow: { cx: 98, cy: 306, z: 3.8, box: [76, 280, 44, 58], label: "ตัวจับการไหล" },
    element: { cx: 142, cy: 210, z: 2.7, box: [110, 148, 66, 124], label: "ขดลวดความร้อน" },
    temp: { cx: 120, cy: 300, z: 1.7, box: [34, 350, 56, 56], label: "หรี่น้ำ = ร้อนขึ้น" },
    dry: { cx: 100, cy: 312, z: 3.0, box: [76, 280, 44, 58], label: "ไม่มีน้ำ ไม่ให้ความร้อน" },
    cutoff: { cx: 175, cy: 210, z: 3.4, box: [166, 190, 24, 30], label: "ตัวตัดไฟเมื่อร้อนเกิน" },
    ground: { cx: 175, cy: 340, z: 2.2, box: [150, 280, 52, 150], label: "สายดิน" },
    end: { cx: 135, cy: 240, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = S_STATE[cue] || S_STATE.all;
    const e = ease(p);
    const g = (k: keyof SS) => lerp(A[k], B[k], e);
    const f = g("f"), on = g("on"), Tt = g("T"), sw = g("sw"), cut = g("cut"), valve = g("valve");
    const o: string[] = [DEFS];
    // ผนังกระเบื้อง
    o.push(`<rect x="-140" y="-140" width="550" height="760" fill="#e4f1f4"/>`);
    for (let i = -7; i < 14; i++) o.push(`<rect x="${i * 22}" y="-140" width="1" height="760" fill="#b9d4db" opacity=".7"/>`);
    for (let j = -7; j < 30; j++) o.push(`<rect x="-140" y="${j * 22}" width="550" height="1" fill="#b9d4db" opacity=".7"/>`);
    o.push(`<rect x="-140" y="-140" width="550" height="760" fill="url(#light)" opacity=".5"/>`);
    // หัวฝักบัว + สายน้ำ
    const hotc = mixc("#7fc8ff", "#ffb27a", cl((Tt - 25) / 35));
    o.push(`<path d="M142 108 V60 H208" fill="none" stroke="#c9d1df" stroke-width="5" stroke-linecap="round"/><path d="M142 108 V60 H208" fill="none" stroke="#7a869c" stroke-width="1" />`);
    o.push(`<g filter="url(#sh2)"><ellipse cx="220" cy="66" rx="20" ry="6" fill="url(#metal)" stroke="#6e7a93"/><rect x="214" y="58" width="12" height="8" rx="2" fill="#8e99b0"/></g>`);
    if (f > 0.05) {
      for (let i = 0; i < 26; i++) {
        const u = (ph * (1.3 + (i % 4) * 0.1) + i / 26) % 1;
        const sx = 205 + (i % 9) * 3.8, ex = sx + (rnd(i) - 0.3) * 24;
        o.push(`<ellipse cx="${f2(lerp(sx, ex, u))}" cy="${f2(72 + u * 330)}" rx="${f2(0.9 * (0.5 + f * 0.7))}" ry="${f2(2.6 * (0.5 + f * 0.7))}" fill="${hotc}" opacity="${f2(0.9 * f * (1 - u * 0.3))}"/>`);
      }
      if (Tt > 36) for (let i = 0; i < 4; i++) { const u = (ph * 0.4 + i / 4) % 1; o.push(`<circle cx="${f2(232 + Math.sin(u * 5 + i) * 10)}" cy="${f2(300 - u * 80)}" r="${f2(5 + u * 7)}" fill="#fff" opacity="${f2(0.32 * Math.sin(Math.PI * u) * cl((Tt - 30) / 12))}" filter="url(#bl)"/>`); }
    }
    // ตัวเครื่อง
    o.push(`<g filter="url(#sh)"><rect x="66" y="118" width="134" height="226" rx="16" fill="#fafcff" stroke="#9aa9bf" stroke-width="1.4"/></g>`);
    o.push(`<rect x="74" y="148" width="118" height="186" rx="8" fill="#eaf0f6" stroke="#cdd7e4"/>`);
    // จอแสดงอุณหภูมิ
    o.push(`<rect x="86" y="124" width="94" height="20" rx="5" fill="#0a1220"/>` + T(133, 139.5, 12, on > 0.5 || f > 0.05 ? "#7fffd0" : "#3a4a5a", on > 0.5 ? Math.round(Tt) + "°C" : f > 0.05 ? "OFF" : "OFF", "middle", 700));
    // ท่อน้ำเข้า/ออก
    const IN: Pt[] = [[100, 440], [100, 330]];
    const MID: Pt[] = [[100, 300], [100, 282], [128, 270]];
    const OUT: Pt[] = [[142, 150], [142, 108]];
    const wcCold = "#58b8f8";
    o.push(tube([[100, 470], [100, 318]], 7, "#cfd6e3", "#fff", 3));
    o.push(tube(MID, 6, "#cfd6e3", "#fff", 5));
    o.push(tube(OUT, 6, "#cfd6e3", "#fff", 3));
    // ตัวจับการไหล
    o.push(`<rect x="82" y="284" width="36" height="34" rx="6" fill="#d8e1ee" stroke="#8fa1bd"/><rect x="88" y="290" width="24" height="22" rx="4" fill="#0f1b30"/>`);
    const dx = f * 7;
    o.push(`<rect x="${f2(95 + dx * 0.4)}" y="292" width="3" height="18" rx="1.5" fill="#ffe14a"/><path d="M92 292 V310" stroke="#7fd0ff" stroke-width="1" opacity=".5"/>`);
    o.push(`<rect x="76" y="320" width="44" height="14" rx="3" fill="#39425e" stroke="#1d2338"/><path d="M80 328 L${f2(98 + (sw > 0.5 ? 0 : -1))} ${f2(sw > 0.5 ? 326 : 322)} L114 326" stroke="#c8d0de" stroke-width="1.6" fill="none"/><circle cx="116" cy="328" r="2" fill="${sw > 0.5 ? "#ffb44a" : "#6e7a93"}"/>`);
    if (sw > 0.5) o.push(`<circle cx="116" cy="328" r="8" fill="#ffb44a" opacity=".5" filter="url(#bl)"/>`);
    // ถังทำความร้อน
    o.push(`<g filter="url(#sh2)"><rect x="112" y="150" width="62" height="120" rx="12" fill="url(#metal)" stroke="#5e6a82"/></g><rect x="118" y="156" width="50" height="108" rx="8" fill="#0f1b30"/>`);
    const tankW = mixc(wcCold, "#ffb27a", cl((Tt - 25) / 35));
    o.push(`<rect x="118" y="156" width="50" height="108" rx="8" fill="${tankW}" opacity="${f > 0.02 ? 0.55 : 0.12}"/>`);
    const coil: Pt[] = [];
    for (let i = 0; i < 8; i++) coil.push(i % 2 ? [124, 168 + i * 12] : [162, 168 + i * 12], i % 2 ? [162, 168 + i * 12] : [124, 168 + i * 12]);
    const ch = mixc("#5a2a22", "#ff6a1a", cl(on) * (f > 0.02 ? 1 : 0.6));
    const cd = "M" + coil.map((q) => q.join(" ")).join(" L");
    o.push(`<path d="${cd}" fill="none" stroke="#1a0f0f" stroke-width="3.6" stroke-linejoin="round"/><path d="${cd}" fill="none" stroke="${ch}" stroke-width="2.4" stroke-linejoin="round"/>`);
    if (on > 0.5) o.push(`<path d="${cd}" fill="none" stroke="#ff8a3a" stroke-width="5" opacity=".35" filter="url(#bl)"/>`);
    if (f > 0.05) {
      for (let i = 0; i < 10; i++) { const u = (ph * (0.9 + f * 0.7) + i / 10) % 1; o.push(dot([128 + rnd(i + 2) * 34, 264 - u * 108], 1.5, mixc(wcCold, "#ffb27a", u * cl(on)))); }
      const wr: Pt[] = [...MID.slice(1), [128, 270], [142, 262]];
      const L1 = plen(MID);
      for (let i = 0; i < 6; i++) { const d = ((i / 6) * L1 + ph * 40 * f) % L1; o.push(dot(along(MID, d), 1.6, wcCold)); }
      for (let i = 0; i < 5; i++) { const u = (ph * 0.8 * f + i / 5) % 1; o.push(dot([142, 150 - u * 42], 1.6, hotc)); }
      for (let i = 0; i < 8; i++) { const d = ((i / 8) * 190 + ph * 55 * f) % 190; o.push(dot([100, 470 - d * 0.9], 1.7, wcCold)); }
    }
    // ตัวตัดไฟเมื่อร้อนเกิน
    const tripped = cut > 0.5;
    o.push(`<circle cx="178" cy="205" r="9" fill="#39425e" stroke="#1d2338"/><circle cx="178" cy="205" r="6" fill="${tripped ? "#ff4a2a" : "#8e99b0"}"/><path d="M174 207 Q178 ${tripped ? 198 : 203} 182 ${tripped ? 198 : 207}" stroke="#fff" stroke-width="1.6" fill="none"/>`);
    if (tripped) o.push(`<circle cx="178" cy="205" r="14" fill="#ff4a2a" opacity=".4" filter="url(#bl)"/>`);
    // แผงวงจร + สายไฟ + สายดิน
    o.push(`<rect x="150" y="284" width="40" height="40" rx="5" fill="#2b3350" stroke="#1d2338"/>`);
    o.push(`<rect x="154" y="290" width="6" height="22" rx="2" fill="#a35a2a"/><rect x="164" y="290" width="6" height="22" rx="2" fill="#3f72d9"/><rect x="174" y="290" width="6" height="22" rx="2" fill="#7bc043"/><rect x="174" y="290" width="6" height="8" rx="2" fill="#ffe14a"/><rect x="174" y="302" width="6" height="8" rx="2" fill="#ffe14a"/>`);
    o.push(`<path d="M${f2(118)} 328 H140 V300 H154" fill="none" stroke="#e5a05a" stroke-width="1.4"/>`);
    const livep: Pt[] = [[157, 292], [157, 276], [130, 270]];
    o.push(`<path d="${rpath([[157, 290], [157, 278], [140, 268]], 4)}" fill="none" stroke="#a35a2a" stroke-width="2"/>`);
    const GR: Pt[] = [[177, 312], [177, 346], [196, 346], [196, 440]];
    o.push(`<path d="${rpath(GR, 5)}" fill="none" stroke="#7bc043" stroke-width="3"/><path d="${rpath(GR, 5)}" fill="none" stroke="#ffe14a" stroke-width="3" stroke-dasharray="4 4"/>`);
    o.push(`<path d="M176 276 L176 288" stroke="#7bc043" stroke-width="2"/>`);
    o.push(`<path d="M168 212 Q176 214 176 288" fill="none" stroke="#7bc043" stroke-width="1.6" stroke-dasharray="3 2" opacity=".8"/>`);
    if (cue === "ground") {
      for (let i = 0; i < 6; i++) { const d = ((i / 6) * plen(GR) + ph * 50) % plen(GR); o.push(dot(along(GR, d), 1.7, "#9fff6a")); }
    }
    // สายดิน — สัญลักษณ์ที่ปลาย
    o.push(`<g stroke="#2b3350" stroke-width="2" stroke-linecap="round"><path d="M196 440 V452"/><path d="M184 452 H208"/><path d="M188 458 H204"/><path d="M192 464 H200"/></g>`);
    // ก๊อกน้ำ/วาล์ว
    const vrot = valve * 270;
    o.push(`<g filter="url(#sh2)"><rect x="40" y="396" width="64" height="14" rx="4" fill="url(#metal)"/><circle cx="62" cy="388" r="14" fill="#d94b4b" stroke="#8a2020"/><g transform="rotate(${f2(vrot)} 62 388)"><rect x="59" y="372" width="6" height="22" rx="3" fill="#fff" opacity=".9"/><rect x="50" y="385" width="24" height="6" rx="3" fill="#fff" opacity=".9"/></g></g>`);
    o.push(box(SHOWER.focus[cue]?.box, ph));
    return o.join("");
  },
};
export const SCENES3: Record<string, SceneDef> = { kettle: KETTLE, shower: SHOWER };
