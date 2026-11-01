// ฉากอธิบาย: เครื่องพ่นไอน้ำอัลตราโซนิก — แผ่นเซรามิกเพียโซสั่นใต้น้ำ → ผิวน้ำเป็นริ้ว ยอดหลุดเป็นละอองเย็น → พัดลมพาออก; แร่ในน้ำ → ผงขาว/คราบหินปูนบนแผ่น — SVG พิกัด 270x480
// เน้นแอนิเมชัน: ริ้วคลื่นผิวน้ำขยายตามแอมพลิจูด, หยดหลุดจากยอดคลื่น, ละอองลอยตามปล่องแล้วระเหย, คราบหินปูนโตบนแผ่นแล้วถูกล้าง
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, room, DEFS: HDEFS } = H;
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const K = `font-family="Kanit, sans-serif"`;
const txt = (x: number, y: number, s: string, size = 6, fill = "#2b3350", anchor = "middle", w = 800) =>
  `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" fill="${fill}" ${K} font-weight="${w}" text-anchor="${anchor}">${s}</text>`;
const pill = (x: number, y: number, s: string, fill = "#fff6c9") => {
  const w = s.length * 4.4 + 10;
  return `<rect x="${f2(x - w / 2)}" y="${f2(y - 8)}" width="${f2(w)}" height="11.5" rx="5.5" fill="${fill}" stroke="#2b3350" stroke-width=".8" opacity=".97"/>` + txt(x, y + 0.4, s, 6.4);
};
const sm = (a: number, b: number, x: number) => ease(cl((x - a) / (b - a)));

const EXTRA = `<defs>
<linearGradient id="hmbody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a9b7cf"/><stop offset=".3" stop-color="#f2f6fb"/><stop offset=".75" stop-color="#cbd6e6"/><stop offset="1" stop-color="#93a2bc"/></linearGradient>
<linearGradient id="hmw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdcff"/><stop offset="1" stop-color="#3e9be6"/></linearGradient>
<linearGradient id="hmin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4363"/><stop offset="1" stop-color="#232a44"/></linearGradient>
<linearGradient id="hmcer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7edd6"/><stop offset="1" stop-color="#d9c8a4"/></linearGradient>
<radialGradient id="hmmist" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset="1" stop-color="#dff3ff" stop-opacity="0"/></radialGradient>
<clipPath id="hmbasin"><rect x="64" y="176" width="142" height="54" rx="6"/></clipPath>
</defs>`;

const YW = 200, DX = 135, DY = 228; // ระดับผิวน้ำ, กลางแผ่น, หน้าแผ่น
type St = { amp: number; vib: number; mist: number; scale: number; vinegar: number; fan: number; dust: number; hum: number; spd: number };
const D: St = { amp: 1, vib: 14, mist: 1, scale: 0, vinegar: 0, fan: 1, dust: 0, hum: 0, spd: 1 };

const surf = (amp: number, ph: number, vib: number) => {
  const A = 9 * amp, lam = 9, w = vib * 0.5;
  let d = `M60 ${YW + 3} L60 ${YW}`;
  for (let x = 60; x <= 210; x += 1.5) {
    const e = Math.exp(-(((x - DX) / 22) ** 2));
    const s0 = (1 + Math.sin(((x - DX) * 2 * Math.PI) / lam - ph * w)) / 2;
    const y = YW - A * e * s0 * s0 * s0 + 0.5 * Math.sin(x * 0.2 + ph * 2) * (1 - e);
    d += ` L${f2(x)} ${f2(y)}`;
  }
  return d;
};
const crestY = (x: number, amp: number, ph: number, vib: number) => {
  const A = 9 * amp, lam = 9, w = vib * 0.5;
  const e = Math.exp(-(((x - DX) / 22) ** 2));
  const s0 = (1 + Math.sin(((x - DX) * 2 * Math.PI) / lam - ph * w)) / 2;
  return YW - A * e * s0 * s0 * s0;
};

const rbc = (x: number, y: number, r: number) => `<g transform="translate(${f2(x)} ${f2(y)})"><ellipse rx="${r}" ry="${f2(r * 0.62)}" fill="#c4283c" stroke="#7a1428" stroke-width=".8"/><ellipse rx="${f2(r * 0.4)}" ry="${f2(r * 0.22)}" fill="#e66a78" opacity=".7"/></g>`;

const body = (ph: number, c: string, S: St, p: number) => {
  const o: string[] = [];
  // โต๊ะ
  o.push(`<rect x="-40" y="302" width="350" height="12" fill="#b78852"/><rect x="-40" y="314" width="350" height="140" fill="#8f6538"/>`);
  o.push(`<ellipse cx="135" cy="304" rx="104" ry="5" fill="#1b1008" opacity=".28" filter="url(#bl)"/>`);
  // ฐาน
  o.push(`<path d="M40 192 Q40 176 56 176 H214 Q230 176 230 192 V290 Q230 302 218 302 H52 Q40 302 40 290 Z" fill="url(#hmbody)" stroke="#6b7a96" stroke-width="1.4"/>`);
  o.push(`<rect x="48" y="184" width="174" height="110" rx="8" fill="url(#hmin)"/>`);
  // แผงวงจร + ชิป
  o.push(`<rect x="108" y="248" width="108" height="40" rx="3" fill="#1d6b4b" stroke="#0e3d2a" stroke-width="1"/>`);
  o.push(`<rect x="122" y="256" width="30" height="20" rx="2" fill="#12172b"/>${txt(137, 269, "วงจรขับ", 5.4, "#9fe4ff", "middle", 700)}`);
  for (let i = 0; i < 4; i++) o.push(`<rect x="${166 + i * 12}" y="258" width="7" height="14" rx="1.5" fill="#e8924a"/>`);
  o.push(`<path d="M137 248 V236" stroke="#e2c36a" stroke-width="1.6"/><path d="M128 248 V240 H118 V236" stroke="#e2c36a" stroke-width="1.2" fill="none"/>`);
  // พัดลม
  o.push(`<circle cx="72" cy="266" r="20" fill="#26324d" stroke="#9fb0e8" stroke-width="1"/>`);
  const fa = ph * 9 * S.fan;
  for (let i = 0; i < 4; i++) { const a = fa + (i * Math.PI) / 2; o.push(`<path d="M72 266 q${f2(Math.cos(a) * 10)} ${f2(Math.sin(a) * 10 - 4)} ${f2(Math.cos(a + 0.5) * 17)} ${f2(Math.sin(a + 0.5) * 17)}" stroke="#bfe9ff" stroke-width="3.6" stroke-linecap="round" fill="none"/>`); }
  o.push(`<circle cx="72" cy="266" r="3.4" fill="#cfd6e3"/>${txt(72, 296, "พัดลม", 5.4, "#bfe9ff", "middle", 700)}`);
  // ท่อลม
  o.push(`<path d="M72 246 V196 H98" stroke="#1a2038" stroke-width="9" fill="none" opacity=".55"/><path d="M72 246 V196 H98" stroke="#7d8aa6" stroke-width="1" fill="none" stroke-dasharray="2 2"/>`);
  // อ่างน้ำ (หน้าตัด)
  o.push(`<rect x="62" y="176" width="146" height="58" rx="7" fill="#2c3760"/>`);
  o.push(`<g clip-path="url(#hmbasin)"><path d="${surf(S.amp, ph, S.vib)} L210 232 L60 232 Z" fill="url(#hmw)" opacity=".92"/>`);
  for (let i = 0; i < 7; i++) o.push(`<circle cx="${f2(70 + rnd(i) * 130)}" cy="${f2(206 + ((rnd(i + 4) * 24 + ph * 6) % 22))}" r="${f2(0.8 + rnd(i + 9) * 1.1)}" fill="#fff" opacity=".3"/>`);
  // ไอออนแร่ (คิว min)
  if (c === "min") for (let i = 0; i < 22; i++) {
    const x = 70 + rnd(i) * 130 + Math.sin(ph * 1.5 + i) * 3, y = 206 + rnd(i + 2) * 20 + Math.cos(ph * 1.7 + i) * 2;
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="2" fill="${i % 2 ? "#fff4b0" : "#ffe0e0"}" stroke="#7a6a2a" stroke-width=".5"/>`);
  }
  o.push(`</g>`);
  // ที่นั่งแผ่น + แผ่นเซรามิก
  o.push(`<rect x="104" y="232" width="62" height="8" rx="2" fill="#6b7a96"/>`);
  const bob = Math.sin(ph * S.vib * 0.9) * (c === "piezo" ? 2.4 : 0.7) * S.amp;
  const th = 8 + (c === "piezo" ? 6 : 0) + bob;
  const yTop = 232 - th;
  o.push(`<rect x="110" y="${f2(yTop)}" width="50" height="${f2(th)}" rx="1.5" fill="url(#hmcer)" stroke="#8a7a55" stroke-width="1"/>`);
  o.push(`<rect x="110" y="${f2(yTop)}" width="50" height="1.6" fill="#cfd6e3"/><rect x="110" y="${f2(yTop + th - 1.6)}" width="50" height="1.6" fill="#cfd6e3"/>`);
  // คราบหินปูน
  if (S.scale > 0.01) {
    let sd = `M110 ${f2(yTop)}`;
    for (let x = 110; x <= 160; x += 2.5) sd += ` L${x} ${f2(yTop - S.scale * (2.2 + 2.6 * rnd(Math.floor(x / 2.5) + 7)))}`;
    sd += ` L160 ${f2(yTop)} Z`;
    o.push(`<path d="${sd}" fill="#f4f1e8" stroke="#b9b29a" stroke-width=".6"/>`);
  }
  // ขั้วไฟ +/-
  if (c === "piezo" || c === "disc") {
    const pos = Math.sin(ph * 5) > 0;
    o.push(txt(100, yTop + 4, pos ? "+" : "−", 9, pos ? "#ff5a4a" : "#4a8fff", "middle", 900), txt(170, yTop + 4, pos ? "−" : "+", 9, pos ? "#4a8fff" : "#ff5a4a", "middle", 900));
  }
  // ถังน้ำ + ปล่อง
  o.push(`<path d="M56 100 Q56 84 72 84 H198 Q214 84 214 100 V160 Q214 176 198 176 H72 Q56 176 56 160 Z" fill="#cfeaff" opacity=".35" stroke="#7fb4e8" stroke-width="1.4"/>`);
  o.push(`<path d="M58 112 H212 V160 Q212 174 198 174 H72 Q58 174 58 160 Z" fill="url(#hmw)" opacity=".75"/>`);
  for (let i = 0; i < 5; i++) { const u = (ph * 0.4 + i / 5) % 1; o.push(`<circle cx="${f2(72 + i * 28)}" cy="${f2(170 - u * 50)}" r="2" fill="#fff" opacity="${f2(0.5 * (1 - u))}"/>`); }
  o.push(`<rect x="124" y="46" width="22" height="156" rx="4" fill="#e9eff8" stroke="#6b7a96" stroke-width="1.2"/><rect x="127" y="50" width="16" height="150" fill="#1b2340"/>`);
  o.push(`<path d="M124 52 Q124 38 138 38 H170 Q176 38 176 44 V54 H150 V50 H146" fill="#e9eff8" stroke="#6b7a96" stroke-width="1.2"/><path d="M127 52 Q127 42 138 42 H172 V50 H143 V52 Z" fill="#1b2340"/>`);
  return o.join("");
};

// ละออง: ลอยขึ้นตามปล่องแล้วออกทางปากพ่น
const mistLayer = (ph: number, c: string, S: St) => {
  const o: string[] = [];
  const N = 46;
  for (let i = 0; i < N; i++) {
    if (rnd(i + 50) > S.mist) continue;
    const T = 2.1 + rnd(i + 3) * 0.8;
    const u = (ph / T + rnd(i + 11)) % 1;
    let x: number, y: number, a = 1;
    if (u < 0.78) { const v = u / 0.78; y = 196 - v * 150; x = DX + Math.sin(v * 9 + i) * 4.5; a = sm(0, 0.08, v); }
    else { const v = (u - 0.78) / 0.22; x = DX + 6 + v * 55; y = 44 - v * 20 + Math.sin(v * 5 + i) * 4; a = 1 - v; }
    const r = 1.2 + rnd(i + 21) * 1.8;
    o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r * 2.6)}" fill="url(#hmmist)" opacity="${f2(0.7 * a)}"/><circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(r)}" fill="#fff" stroke="#9ed2f4" stroke-width=".4" opacity="${f2(a)}"/>`);
  }
  // หยดหลุดจากยอดคลื่นเหนือน้ำ
  const nd = c === "wave" || c === "mist" || c === "all" || c === "but" ? 14 : 8;
  for (let i = 0; i < nd; i++) {
    if (rnd(i + 80) > S.mist * S.amp + 0.05 && c !== "wave") continue;
    const T = 0.9 + rnd(i + 5) * 0.5, u = (ph / T + rnd(i + 31)) % 1;
    const x0 = DX + (rnd(i + 7) - 0.5) * 30, y0 = crestY(x0, S.amp, ph, S.vib);
    o.push(`<circle cx="${f2(x0 + (rnd(i + 2) - 0.5) * 10 * u)}" cy="${f2(y0 - u * (10 + rnd(i) * 10))}" r="${f2(1 + rnd(i + 6) * 0.9)}" fill="#fff" stroke="#9ed2f4" stroke-width=".4" opacity="${f2(S.amp * (1 - u))}"/>`);
  }
  return o.join("");
};

const states = (c: string, p: number): St => {
  const s = { ...D };
  switch (c) {
    case "disc": s.amp = 0; s.mist = 0; s.vib = 2; break;
    case "piezo": s.amp = 0; s.mist = 0; s.vib = 6; break;
    case "freq": s.amp = 0.3; s.mist = 0; s.vib = 26; break;
    case "but": s.amp = 0; s.mist = 0; s.vib = 20; break;
    case "wave": s.amp = sm(0, 0.8, p); s.mist = sm(0.45, 0.95, p); s.vib = 14; break;
    case "mist": break;
    case "cool": break;
    case "fan": s.hum = sm(0.1, 0.95, p); break;
    case "min": s.dust = 1; break;
    case "scale": s.scale = sm(0.05, 0.95, p); s.amp = 1 - 0.65 * s.scale; s.mist = 1 - 0.7 * s.scale; break;
    case "clean": s.scale = 1 - sm(0.3, 0.72, p); s.amp = 0.35 + 0.65 * (1 - s.scale); s.mist = 0; s.vinegar = p < 0.78 ? 1 : 0; break;
    case "chk": s.scale = 0.6; s.amp = 0.5; s.mist = 0.35; break;
    default: break;
  }
  return s;
};

const Z = (x: number, y: number, z: number, box?: [number, number, number, number], label?: string) => ({ cx: x, cy: y + 90 / z, z, box, label });
export const SCENE_HUMIDIFIER: SceneDef = {
  focus: {
    all: { ...Z(135, 172, 1.02) },
    disc: { ...Z(135, 230, 3.0, [108, 220, 54, 18]) },
    piezo: { ...Z(135, 228, 2.2) },
    freq: { ...Z(135, 150, 1.0) },
    but: { ...Z(135, 215, 2.2) },
    wave: { ...Z(135, 206, 3.0) },
    mist: { ...Z(135, 150, 1.4) },
    cool: { ...Z(135, 150, 1.2) },
    fan: { ...Z(135, 170, 1.0) },
    min: { ...Z(150, 150, 1.15) },
    scale: { ...Z(135, 226, 3.2) },
    clean: { ...Z(135, 215, 2.4) },
    chk: { ...Z(135, 222, 2.6) },
    end: { ...Z(135, 172, 1.02) },
  },
  render: ({ frame, cue, p, ef }) => {
    const ph = frame / 30;
    const c = cue;
    const S = states(c, p);
    const o: string[] = [HDEFS, EXTRA, room(302)];
    o.push(body(ph, c, S, p));
    o.push(mistLayer(ph, c, S));
    const F = SCENE_HUMIDIFIER.focus[c] || SCENE_HUMIDIFIER.focus.all;
    const TY = F.cy - 240 / F.z + 12;
    if (c === "all") o.push(pill(80, 62, "ไม่ต้มน้ำ ก็เกิดหมอก"));
    if (c === "disc") { o.push(pill(135, TY + 6, "แผ่นเซรามิกเพียโซ"), pill(135, 262, "ต่อกับวงจรขับด้านล่าง", "#cfeaff")); }
    if (c === "piezo") {
      const t = Math.sin(ph * 5);
      o.push(pill(135, TY + 6, t > 0 ? "ไฟ + → แผ่นยืด" : "ไฟ − → แผ่นหด", t > 0 ? "#ffd9d0" : "#d3e4ff"));
      // คลื่นไฟสลับ
      let d = ""; for (let i = 0; i <= 40; i++) { const x = 190 + i * 1.4, y = 196 - Math.sin(((i / 40) * 2 - ph * 0.8) * Math.PI * 2) * 8; d += `${i ? "L" : "M"}${f2(x)} ${f2(y)} `; }
      o.push(`<g transform="translate(62 102) scale(.55)"><rect x="184" y="180" width="62" height="32" rx="5" fill="#0d1a28" opacity=".9"/><path d="${d}" stroke="#ffd14a" stroke-width="1.6" fill="none"/>${txt(215, 224, "ไฟสลับ", 6.4, "#ffd14a", "middle", 700)}</g>`);
    }
    if (c === "freq") {
      // แกนความถี่แบบลอการิทึม: หูได้ยิน vs แผ่น
      const x = (hz: number) => 24 + ((Math.log10(hz) - 1) / 6.5) * 222;
      o.push(`<rect x="14" y="76" width="242" height="86" rx="10" fill="#0d1a28" opacity=".93" stroke="#7fe3ff" stroke-width=".9"/>`);
      o.push(`<rect x="${f2(x(20))}" y="104" width="${f2(x(20000) - x(20))}" height="14" rx="3" fill="#6bf29a"/>`);
      o.push(txt((x(20) + x(20000)) / 2, 114.5, "หูมนุษย์ได้ยิน", 6.6, "#0d3a20", "middle", 800));
      o.push(`<line x1="24" y1="126" x2="246" y2="126" stroke="#7d8aa6" stroke-width="1"/>`);
      for (const [hz, l] of [[100, "100"], [10000, "10k"], [1000000, "1M"]] as [number, string][]) o.push(`<line x1="${f2(x(hz))}" y1="123" x2="${f2(x(hz))}" y2="129" stroke="#7d8aa6"/>${txt(x(hz), 138, l + " Hz", 5.4, "#9fb0e8", "middle", 700)}`);
      const k = sm(0, 0.35, p);
      const xm = x(1700000);
      o.push(`<g opacity="${f2(k)}"><path d="M${f2(xm)} 126 V96" stroke="#ff5a4a" stroke-width="1.6"/><circle cx="${f2(xm)}" cy="96" r="4" fill="#ff5a4a" opacity="${f2(0.6 + 0.4 * Math.sin(ph * 18))}"/>${txt(xm - 4, 90, "แผ่นสั่น ≈ 1.7 ล้านครั้ง/วิ", 6.4, "#ffb0a6", "end", 800)}</g>`);
      o.push(pill(135, 152, "เกินหูได้ยิน → เงียบ", "#fff6c9"));
    }
    if (c === "but") {
      for (let i = 0; i < 3; i++) o.push(txt(112 + i * 22, 196 - Math.abs(Math.sin(ph * 3 + i)) * 4, "?", 14, "#ff5a4a", "middle", 900));
      o.push(pill(135, TY + 8, "สั่นเฉยๆ แล้วหมอกมาจากไหน?"));
    }
    if (c === "wave") {
      o.push(pill(135, TY + 6, p < 0.5 ? "ผิวน้ำเป็นริ้วเล็กๆ" : "ยอดคลื่นหลุดเป็นหยดน้ำ", "#cfeaff"));
      o.push(`<path d="M${DX - 20} 230 V${f2(214 - 0)}" stroke="#ff5a4a" stroke-width="1" stroke-dasharray="2 1.5" opacity=".0"/>`);
    }
    if (c === "mist") {
      // แว่นขยาย: หยดเทียบเม็ดเลือดแดง
      o.push(`<circle cx="92" cy="116" r="44" fill="#0d1a28" opacity=".92" stroke="#ffe14a" stroke-width="1.6"/>`);
      o.push(rbc(78, 112, 15));
      for (let i = 0; i < 9; i++) { const u = (ph * 0.3 + rnd(i)) % 1; o.push(`<circle cx="${f2(64 + rnd(i + 2) * 56 + Math.sin(ph + i) * 2)}" cy="${f2(140 - u * 52)}" r="${f2(2 + rnd(i + 5) * 6)}" fill="#fff" stroke="#9ed2f4" stroke-width=".6" opacity=".85"/>`); }
      o.push(txt(78, 132, "เม็ดเลือดแดง", 5.2, "#ffb0a6", "middle", 700), txt(92, 164, "หยดน้ำ 1–5 ไมครอน", 6, "#bfe9ff", "middle", 800));
      o.push(pill(135, TY + 6, "เล็กกว่าเม็ดเลือดแดง", "#fff6c9"));
    }
    if (c === "cool") {
      o.push(`<g transform="translate(54 228)"><path d="M0 28 q-6 -10 0 -18 q4 6 6 0 q6 8 0 18 z" fill="#ff8a3d" opacity=".55"/><path d="M-14 -2 L26 36 M26 -2 L-14 36" stroke="#ff5a4a" stroke-width="3.6" stroke-linecap="round"/></g>`);
      o.push(pill(54, 270, "ไม่มีฮีตเตอร์", "#ffd9d0"));
      o.push(`<rect x="214" y="96" width="9" height="46" rx="4.5" fill="#fff" stroke="#2b3350" stroke-width="1"/><rect x="216" y="124" width="5" height="18" rx="2.5" fill="#4a8fff"/><circle cx="218.5" cy="144" r="6" fill="#4a8fff" stroke="#2b3350" stroke-width="1"/>${txt(220, 90, "หมอกเย็น", 6.2, "#2b3350", "middle", 800)}`);
      o.push(pill(135, TY + 6, "หมอก = หยดน้ำ ไม่ใช่ไอน้ำ"));
    }
    if (c === "fan") {
      for (let i = 0; i < 6; i++) { const u = (ph * 0.9 + i / 6) % 1; const q: [number, number] = u < 0.55 ? [72, 246 - (u / 0.55) * 50] : [72 + ((u - 0.55) / 0.45) * 28, 196]; o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="2" fill="#bfe9ff" opacity=".9"/>`); }
      // ระเหยเป็นไอ
      for (let i = 0; i < 12; i++) { const u = (ph * 0.35 + i / 12) % 1; o.push(`<circle cx="${f2(176 + u * 60 + Math.sin(i) * 8)}" cy="${f2(40 - u * 20 + Math.sin(ph + i) * 6)}" r="${f2(1.2 + u * 3)}" fill="none" stroke="#bfe9ff" stroke-width=".6" stroke-dasharray="1 1.4" opacity="${f2(0.9 - u * 0.5)}"/>`); }
      // ความชื้น
      o.push(`<circle cx="238" cy="110" r="18" fill="#fff" stroke="#2b3350" stroke-width="1.2"/>`);
      const ang = lerp(-2.2, -0.2, S.hum);
      o.push(`<path d="M238 110 L${f2(238 + Math.cos(ang) * 13)} ${f2(110 + Math.sin(ang) * 13)}" stroke="#ff5a4a" stroke-width="2" stroke-linecap="round"/><circle cx="238" cy="110" r="2" fill="#2b3350"/>${txt(238, 126, `${Math.round(lerp(40, 62, S.hum))}%`, 7, "#2b3350", "middle", 900)}${txt(238, 90, "ความชื้น", 5.4, "#2b3350", "middle", 700)}`);
      o.push(pill(135, TY + 6, "ละอองระเหย → ความชื้นห้องขึ้น", "#cfeaff"));
    }
    if (c === "min") {
      for (let i = 0; i < 16; i++) { const u = (ph * 0.28 + rnd(i) + i / 16) % 1; const x = 176 + u * 78 + rnd(i + 3) * 8, y = 50 + u * 246; o.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="1.5" fill="#fff" stroke="#b9b29a" stroke-width=".5" opacity="${f2(Math.sin(Math.PI * Math.min(1, u * 1.1)))}"/>`); }
      for (let i = 0; i < 24; i++) o.push(`<circle cx="${f2(200 + rnd(i) * 56)}" cy="${f2(300 - rnd(i + 4) * 2)}" r="${f2(1 + rnd(i + 2))}" fill="#fff" opacity=".95"/>`);
      o.push(pill(135, TY + 6, "แร่ธาตุไม่ระเหย → ผงขาว", "#fff6c9"));
      o.push(pill(72, 232, "Ca  Mg ในน้ำประปา", "#ffeec2"));
    }
    if (c === "scale") {
      o.push(pill(135, TY + 6, S.scale < 0.5 ? "แร่ค้างบนแผ่น" : "สั่นไม่เต็มที่ หมอกน้อยลง", S.scale < 0.5 ? "#fff6c9" : "#ffd9d0"));
      o.push(`<path d="M104 252 H166" stroke="#ff5a4a" stroke-width="0"/>`);
    }
    if (c === "clean") {
      if (S.vinegar) {
        o.push(`<rect x="62" y="${YW + 1}" width="146" height="31" fill="#f4e08a" opacity=".42"/>`);
        for (let i = 0; i < 12; i++) { const u = (ph * 0.6 + rnd(i)) % 1; o.push(`<circle cx="${f2(112 + rnd(i + 2) * 46)}" cy="${f2(228 - u * 24)}" r="${f2(0.8 + rnd(i + 4) * 1.2)}" fill="#fff" opacity="${f2(0.8 * (1 - u))}"/>`); }
        const ang = sm(0, 0.78, p) * Math.PI * 2;
        o.push(`<g transform="translate(224 128)"><circle r="10" fill="#fff" stroke="#2b3350" stroke-width="1"/><path d="M0 0 V-8 M0 0 L${f2(Math.sin(ang) * 7)} ${f2(-Math.cos(ang) * 7)}" stroke="#ff5a4a" stroke-width="1.4"/></g>`);
        o.push(txt(224, 148, "~30 นาที", 6, "#2b3350", "middle", 800));
        o.push(pill(135, TY + 6, "แช่น้ำส้มสายชู", "#fff1b0"));
      } else {
        const sw = Math.sin(ph * 6) * 20;
        o.push(`<g transform="translate(${f2(DX + sw)} 214)"><rect x="-6" y="-2" width="12" height="9" rx="2" fill="#e8c36a" stroke="#7a5a1c" stroke-width=".8"/><rect x="-3" y="-20" width="6" height="19" rx="2" fill="#8a5a33"/><path d="M-5 7 v3 M-2 7 v3 M1 7 v3 M4 7 v3" stroke="#fff" stroke-width="1"/></g>`);
        o.push(pill(135, TY + 6, "ปัดเบาๆ ด้วยแปรงอ่อน", "#d8ffe3"));
      }
    }
    if (c === "chk") {
      const mx = DX + Math.sin(ph * 0.8) * 22;
      o.push(`<circle cx="${f2(mx)}" cy="226" r="16" fill="none" stroke="#ffe14a" stroke-width="2"/><path d="M${f2(mx + 12)} 238 l10 10" stroke="#ffe14a" stroke-width="3" stroke-linecap="round"/>`);
      o.push(pill(135, TY + 6, "มีคราบขาวเกาะไหม?"));
    }
    o.push(H.box(F.box, ph));
    return o.join("");
  },
};
