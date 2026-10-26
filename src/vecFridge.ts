// ฉากตู้เย็นตัดครึ่งแบบภาพเวกเตอร์ละเอียด (แสงเงา โลหะ แก้ว) — คืนค่าเป็นสตริง SVG ภายใน <g>
// พิกัดเป็นหน่วยเดียวกับ pixelFridge (270x480) เพื่อใช้กล้อง/โฟกัสชุดเดียวกัน
import { PATH, at, stateColor, mix, PATH_LEN, FOCUS } from "./pixelFridge";

const f2 = (n: number) => Math.round(n * 100) / 100;

const rounded = (pts: [number, number][], r: number): string => {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1], c = pts[i], n = pts[i + 1];
    const l1 = Math.hypot(c[0] - p[0], c[1] - p[1]), l2 = Math.hypot(n[0] - c[0], n[1] - c[1]);
    const rr = Math.min(r, l1 / 2 - 0.01, l2 / 2 - 0.01);
    if (rr <= 0.2) { d += ` L${c[0]} ${c[1]}`; continue; }
    const a = [c[0] + ((p[0] - c[0]) / l1) * rr, c[1] + ((p[1] - c[1]) / l1) * rr];
    const b = [c[0] + ((n[0] - c[0]) / l2) * rr, c[1] + ((n[1] - c[1]) / l2) * rr];
    d += ` L${f2(a[0])} ${f2(a[1])} Q${c[0]} ${c[1]} ${f2(b[0])} ${f2(b[1])}`;
  }
  const last = pts[pts.length - 1];
  return d + ` L${last[0]} ${last[1]}`;
};

const zonePts = (z: string): [number, number][] => {
  const out: [number, number][] = [];
  PATH.forEach((q, i) => {
    if (q.zone === z) {
      const prev = out[out.length - 1];
      if (!prev || prev[0] !== q.p[0] || prev[1] !== q.p[1]) out.push(q.p);
    }
  });
  return out;
};

export type VecOpts = { frame: number; cold: number; focus: string; heat?: boolean; run?: boolean };

export const vecFridge = ({ frame, cold, focus, heat = true, run = true }: VecOpts): string => {
  const ph = frame / 30;
  const o: string[] = [];
  const P = (s: string) => o.push(s);

  P(`<defs>
<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf3de"/><stop offset="1" stop-color="#ecd6ae"/></linearGradient>
<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9824f"/><stop offset="1" stop-color="#6f4527"/></linearGradient>
<linearGradient id="body" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cbd6e4"/><stop offset=".25" stop-color="#f7fafd"/><stop offset=".8" stop-color="#e3eaf3"/><stop offset="1" stop-color="#b6c3d4"/></linearGradient>
<linearGradient id="inner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3fcff"/><stop offset=".6" stop-color="#d4effc"/><stop offset="1" stop-color="#b6defa"/></linearGradient>
<linearGradient id="bay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b5878"/><stop offset="1" stop-color="#2b3350"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa6bd"/><stop offset=".3" stop-color="#e8edf5"/><stop offset=".55" stop-color="#aab5ca"/><stop offset="1" stop-color="#6e7a93"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".85"/><stop offset="1" stop-color="#bfe6ff" stop-opacity=".35"/></linearGradient>
<linearGradient id="foam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#f0cf72"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".4" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="light" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.2" flood-color="#2a1d10" flood-opacity=".35"/></filter>
<filter id="sh2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#10182a" flood-opacity=".4"/></filter>
<filter id="bl"><feGaussianBlur stdDeviation="1.6"/></filter>
</defs>`);

  // ===== ห้อง =====
  P(`<rect x="-140" y="-140" width="550" height="552" fill="url(#wall)"/>`);
  P(`<rect x="-140" y="-140" width="550" height="552" fill="url(#light)" transform="translate(40 -40) scale(.6 .8)"/>`);
  for (let x = -126; x < 410; x += 36) P(`<rect x="${x}" y="-140" width=".6" height="552" fill="#d9bf8a" opacity=".5"/>`);
  P(`<rect x="-140" y="404" width="550" height="9" fill="#a37646"/><rect x="-140" y="404" width="550" height="2" fill="#d9ac78"/>`);
  P(`<rect x="-140" y="413" width="550" height="200" fill="url(#floor)"/>`);
  for (let y = 430; y < 560; y += 22) P(`<rect x="-140" y="${y}" width="550" height="1" fill="#5d3a20" opacity=".55"/>`);
  for (let x = -140; x < 410; x += 40) P(`<rect x="${x + ((x / 40) % 2) * 20}" y="413" width="1" height="200" fill="#5d3a20" opacity=".35"/>`);
  P(`<ellipse cx="139" cy="412" rx="100" ry="8" fill="#1b1008" opacity=".38" filter="url(#bl)"/>`);
  // หน้าต่างแสงเข้า
  P(`<rect x="-26" y="70" width="50" height="78" rx="3" fill="#8a5a33"/><rect x="-22" y="74" width="42" height="70" rx="2" fill="#bfe6ff"/><rect x="-22" y="74" width="42" height="26" rx="2" fill="#e9f8ff"/><rect x="-2" y="74" width="2" height="70" fill="#8a5a33"/>`);

  // ===== ตู้ =====
  P(`<g filter="url(#sh)"><rect x="55" y="53" width="170" height="358" rx="9" fill="#5b6a85"/></g>`);
  P(`<rect x="57" y="55" width="166" height="354" rx="8" fill="url(#body)"/>`);
  P(`<rect x="60" y="188" width="3.4" height="50" rx="1.6" fill="url(#metal)"/>`);
  // ช่องภายใน
  P(`<rect x="66" y="64" width="141" height="337" rx="4" fill="url(#inner)"/>`);
  P(`<rect x="66" y="64" width="141" height="337" rx="4" fill="#5fb8ff" opacity="${f2(0.04 + 0.2 * cold)}"/>`);
  // ฉนวนโฟม
  P(`<rect x="207" y="64" width="10" height="337" fill="url(#foam)"/>`);
  for (let y = 67; y < 400; y += 6) for (let x = 209 + ((y / 6) % 2) * 3; x < 216; x += 6) P(`<circle cx="${x}" cy="${y}" r="1" fill="#d8b44f" opacity=".7"/>`);
  // ชั้นแก้ว
  const shelf = (y: number) => P(`<rect x="66" y="${y}" width="141" height="4" rx="1" fill="url(#glass)" stroke="#8fc3e3" stroke-width=".6"/><rect x="66" y="${y + 4}" width="141" height="3" fill="#6aa8cf" opacity=".18"/>`);
  shelf(165); shelf(230); shelf(290);
  P(`<rect x="66" y="336" width="141" height="5" rx="1" fill="#8fb8d0"/>`);
  P(`<rect x="66" y="341" width="141" height="60" rx="3" fill="url(#bay)"/>`);
  for (let x = 72; x < 146; x += 6) P(`<rect x="${x}" y="352" width="2.4" height="40" rx="1" fill="#1f2640" opacity=".8"/>`);

  // ===== ของกิน (มีไฮไลต์) =====
  const gl = (x: number, y: number, w: number, h: number) => P(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${f2(w / 4)}" fill="#fff" opacity=".35"/>`);
  P(`<g filter="url(#sh2)">`);
  // ฟรีซ
  P(`<rect x="74" y="136" width="27" height="29" rx="3" fill="#7cc8f4"/><rect x="74" y="136" width="27" height="6" rx="3" fill="#d9f3ff"/>`); gl(77, 146, 4, 16);
  P(`<rect x="106" y="139" width="25" height="26" rx="5" fill="#4fb353"/><circle cx="114" cy="150" r="2.6" fill="#bff29a"/><circle cx="122" cy="154" r="2.6" fill="#bff29a"/><circle cx="118" cy="159" r="2.6" fill="#bff29a"/>`);
  P(`<rect x="136" y="142" width="27" height="23" rx="3" fill="#ff9fc6"/><rect x="135" y="139" width="29" height="6" rx="3" fill="#fff"/>`);
  P(`<rect x="80" y="98" width="19" height="15" rx="4" fill="#d3efff" stroke="#fff" stroke-width=".8"/><rect x="105" y="102" width="19" height="15" rx="4" fill="#d3efff" stroke="#fff" stroke-width=".8"/>`);
  // ชั้น 1
  P(`<rect x="76" y="196" width="19" height="34" rx="2" fill="#f8fbff"/><path d="M76 196h19v10H76z" fill="#3a7bd5"/><path d="M78 190l15 6H78z" fill="#f8fbff"/><rect x="79" y="212" width="13" height="9" rx="2" fill="#3a7bd5"/>`); gl(78, 207, 2, 21);
  P(`<rect x="100" y="203" width="13" height="27" rx="4" fill="#ff9a2e"/><rect x="102" y="195" width="9" height="10" rx="2" fill="#ffb256"/><rect x="103" y="191" width="7" height="5" rx="1.5" fill="#3b2a1a"/>`); gl(102, 207, 2, 20);
  for (let i = 0; i < 3; i++) { const x = 122 + i * 13; P(`<ellipse cx="${x + 6}" cy="223" rx="6" ry="7.5" fill="#f4e2c4"/><ellipse cx="${x + 4}" cy="220" rx="1.8" ry="2.6" fill="#fff" opacity=".7"/>`); }
  P(`<circle cx="170" cy="222" r="8.5" fill="#e63946"/><circle cx="167" cy="219" r="2.4" fill="#ff9aa2" opacity=".8"/><rect x="169" y="210" width="2" height="5" fill="#6b3f1d"/><path d="M171 211q5-3 7 0q-4 3-7 0z" fill="#4caf50"/>`);
  P(`<path d="M184 230c-4-10-1-20 8-22c9 2 12 12 8 22z" fill="#58b853"/><path d="M192 228c-2-7 0-13 2-18" stroke="#b6ec9c" stroke-width="1.4" fill="none"/>`);
  // ชั้น 2
  P(`<rect x="76" y="262" width="30" height="28" rx="3" fill="#fff4d6"/><rect x="76" y="262" width="30" height="8" rx="3" fill="#ff8fab"/><circle cx="86" cy="258" r="3.4" fill="#e63946"/>`);
  P(`<rect x="114" y="268" width="32" height="22" rx="3" fill="#f6f7f9"/><rect x="114" y="267" width="32" height="7" rx="3" fill="#4caf50"/><rect x="121" y="278" width="19" height="6" rx="2" fill="#ffd24a"/>`);
  P(`<circle cx="161" cy="283" r="7.5" fill="#e63946"/><circle cx="158.6" cy="280.5" r="2" fill="#ff9aa2" opacity=".8"/><path d="M161 275q4-3 6 0q-3 3-6 0z" fill="#4caf50"/>`);
  P(`<path d="M177 290v-14l23 4v10z" fill="#ffd24a"/><circle cx="184" cy="284" r="1.8" fill="#e0a800"/><circle cx="192" cy="286" r="1.8" fill="#e0a800"/>`);
  // ลิ้นชักผัก
  P(`<rect x="70" y="297" width="134" height="38" rx="4" fill="#bfe8d6" stroke="#8fcfb5" stroke-width=".8"/>`);
  for (let i = 0; i < 4; i++) P(`<path d="M${85 + i * 20} 304l3 22l3-22z" fill="#ff8a3d"/><path d="M${84 + i * 20} 304q4-5 8 0z" fill="#4caf50"/>`);
  P(`<ellipse cx="181" cy="321" rx="10" ry="9" fill="#8e44ad"/><ellipse cx="178" cy="318" rx="2.4" ry="3" fill="#c791df" opacity=".8"/>`);
  P(`</g>`);
  // ประกายกระจกตู้
  P(`<path d="M66 64h30l-34 337H66z" fill="#fff" opacity=".12"/>`);

  // ===== เทอร์โมมิเตอร์ =====
  const level = 0.2 + 0.8 * (1 - cold);
  const mh = 150 * level;
  const tc = mix("#ff5a3c", "#46b4ff", cold);
  P(`<g filter="url(#sh2)"><rect x="17" y="96" width="16" height="164" rx="8" fill="#eef3fa" stroke="#9fb0c8" stroke-width="1"/></g>`);
  P(`<rect x="22" y="${f2(254 - mh)}" width="6" height="${f2(mh)}" rx="3" fill="${tc}"/>`);
  P(`<circle cx="25" cy="262" r="11" fill="#eef3fa" stroke="#9fb0c8" stroke-width="1"/><circle cx="25" cy="262" r="8" fill="${tc}"/><circle cx="22.5" cy="259.5" r="2.4" fill="#fff" opacity=".7"/>`);

  // ===== ท่อ =====
  const seg = (z: string, w: number, base: string, hi: string) => {
    const pts = zonePts(z);
    const d = rounded(pts, z === "cond" ? 6.5 : z === "evap" ? 4.2 : 3);
    P(`<path d="${d}" fill="none" stroke="#252d46" stroke-width="${w + 2.2}" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>`);
    P(`<path d="${d}" fill="none" stroke="${base}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
    P(`<path d="${d}" fill="none" stroke="${hi}" stroke-width="${f2(w * 0.28)}" stroke-linecap="round" stroke-linejoin="round" opacity=".75" transform="translate(-.5 -.7)"/>`);
  };
  // ครีบคอยล์ร้อน
  for (let y = 100; y <= 322; y += 8) P(`<rect x="228" y="${y}" width="18" height=".9" fill="#ffb4a8" opacity=".35"/>`);
  seg("disch", 3.6, "#d8645e", "#ffd0c8");
  seg("cond", 3.6, "#d8645e", "#ffd0c8");
  seg("cap", 1.8, "#d9a15a", "#fff0c2");
  seg("evap", 3.6, mix("#6fb6e0", "#e6f6ff", cold * 0.85), "#ffffff");
  seg("suct", 3.4, "#7fb4d8", "#e5f5ff");
  // น้ำแข็งเกาะคอยล์เย็นเมื่อเย็น
  if (cold > 0.5) P(`<path d="${rounded(zonePts("evap"), 4.2)}" fill="none" stroke="#fff" stroke-width="${f2(1.2 + cold)}" opacity="${f2((cold - 0.5) * 0.9)}" stroke-linecap="round" stroke-linejoin="round"/>`);

  // ===== คอมเพรสเซอร์ =====
  const vib = run ? Math.sin(ph * 70) * 0.35 : 0;
  P(`<g transform="translate(${f2(vib)} 0)" filter="url(#sh2)">`);
  P(`<rect x="148" y="346" width="54" height="58" rx="8" fill="#2b3350"/>`);
  P(`<rect x="150.5" y="348.5" width="49" height="53" rx="7" fill="url(#metal)"/>`);
  P(`<ellipse cx="173" cy="358" rx="19" ry="5" fill="#dfe6f2"/><rect x="154" y="358" width="38" height="36" fill="url(#metal)"/><ellipse cx="173" cy="394" rx="19" ry="5" fill="#76829b"/>`);
  for (let y = 364; y < 392; y += 7) P(`<rect x="156" y="${y}" width="34" height="1.4" fill="#5d6a85" opacity=".6"/>`);
  const pst = run ? 3 * Math.sin(ph * 14) : 0;
  P(`<rect x="165" y="${f2(366 + pst)}" width="16" height="9" rx="2" fill="#2b3350"/><rect x="171" y="${f2(360 + pst)}" width="4" height="8" fill="#555f7a"/>`);
  P(`<circle cx="196" cy="375" r="3.4" fill="#ffcf4a"/>`);
  P(`</g>`);
  P(`<rect x="202" y="391" width="26" height="3" rx="1.5" fill="#252d46"/>`);

  // ===== อนุภาค =====
  const gap = 12;
  const n = Math.floor(PATH_LEN / gap);
  for (let i = 0; i < n; i++) {
    const d = i * gap + ph * (run ? 26 : 0);
    const s = at(d);
    const c = stateColor(s.zone, s.u);
    const r = s.zone === "cond" || s.zone === "cap" ? 1.35 : 1.7;
    P(`<circle cx="${f2(s.p[0])}" cy="${f2(s.p[1])}" r="${f2(r * 2.7)}" fill="${c}" opacity=".28"/>`);
    P(`<circle cx="${f2(s.p[0])}" cy="${f2(s.p[1])}" r="${r}" fill="${c}"/>`);
    P(`<circle cx="${f2(s.p[0] - 0.4)}" cy="${f2(s.p[1] - 0.4)}" r="${f2(r * 0.4)}" fill="#fff" opacity=".9"/>`);
  }

  // ===== ลูกศรความร้อน (เส้นหยักเรืองแสง) =====
  const arrow = (x: number, y: number, c: string, a: number) =>
    P(`<g opacity="${f2(a)}" transform="translate(${f2(x)} ${f2(y)})"><path d="M0 0q3-3 6 0t6 0t6 0" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><path d="M19-3.4l5 3.4l-5 3.4z" fill="${c}"/><path d="M0 0q3-3 6 0t6 0t6 0" fill="none" stroke="#fff" stroke-width=".5" opacity=".6"/></g>`);
  if (heat) {
    if (focus === "evap" || focus === "all" || focus === "food" || focus === "fridge") {
      for (let k = 0; k < 5; k++) {
        const u = (ph * 0.5 + k * 0.2) % 1;
        arrow(108 + u * 50, 86 + k * 15, "#ff8a3d", Math.sin(Math.PI * u));
      }
    }
    if (focus === "cond" || focus === "all" || focus === "back" || focus === "fridge") {
      for (let k = 0; k < 6; k++) {
        const u = (ph * 0.45 + k * 0.17) % 1;
        arrow(247 + u * 16, 112 + k * 38, "#ff5a36", Math.sin(Math.PI * u));
      }
    }
  }
  // ประกายเย็น
  if (focus === "evap" || focus === "all" || focus === "food") {
    for (let k = 0; k < 7; k++) {
      const a = 0.5 + 0.5 * Math.sin(ph * 4 + k * 1.9);
      const x = 172 + ((k * 13) % 34), y = 80 + ((k * 29) % 72);
      P(`<g opacity="${f2(a)}"><path d="M${x} ${y - 3}v6M${x - 3} ${y}h6" stroke="#fff" stroke-width=".9" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="2.6" fill="url(#glow)"/></g>`);
    }
  }
  // ไฮไลต์ส่วนที่พูดถึง
  const fb = FOCUS[focus]?.box;
  if (fb) {
    const [x, y, w, h] = fb;
    const pulse = 0.55 + 0.45 * Math.sin(ph * 6);
    P(`<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="6" fill="none" stroke="#ffe14a" stroke-width="1.8" opacity="${f2(pulse)}"/><rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="6" fill="#ffe14a" opacity="${f2(0.06 * pulse)}"/>`);
  }
  return o.join("");
};
