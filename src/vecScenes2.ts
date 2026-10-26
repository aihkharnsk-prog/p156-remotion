// ฉากละเอียดสูง: ไมโครเวฟ + หม้อหุงข้าว (คืนสตริง SVG ภายในพิกัด 270x480)
import { H } from "./vecScenes";
import type { SceneDef } from "./vecScenes";
const { f2, cl, lerp, ease, mixc, tube, dot, box, DEFS, room } = H;
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const steam = (x: number, y: number, ph: number, n: number, a: number, spread = 10) => {
  let o = "";
  for (let i = 0; i < n; i++) {
    const u = (ph * 0.45 + i / n) % 1;
    o += `<circle cx="${f2(x + Math.sin(u * 6 + i * 2) * spread * u)}" cy="${f2(y - u * 46)}" r="${f2(3 + u * 7)}" fill="#fff" opacity="${f2(Math.sin(Math.PI * u) * 0.38 * a)}" filter="url(#bl)"/>`;
  }
  return o;
};
const EXTRA = `<defs>
<radialGradient id="lens" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#27407a"/><stop offset="1" stop-color="#0b1226"/></radialGradient>
<linearGradient id="cav" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd6e4"/><stop offset=".5" stop-color="#f1f4fa"/><stop offset="1" stop-color="#c3cbdb"/></linearGradient>
<linearGradient id="cab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c7650"/><stop offset="1" stop-color="#6d4d30"/></linearGradient>
<linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d4b8"/><stop offset="1" stop-color="#b9a47f"/></linearGradient>
<linearGradient id="pot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8c97ad"/><stop offset=".25" stop-color="#e9edf4"/><stop offset=".6" stop-color="#b0b9ca"/><stop offset="1" stop-color="#737f97"/></linearGradient>
<linearGradient id="cook" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e4e8ef"/><stop offset=".3" stop-color="#ffffff"/><stop offset=".8" stop-color="#d9dfe9"/><stop offset="1" stop-color="#b1bacb"/></linearGradient>
<linearGradient id="copper" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a4a1c"/><stop offset=".5" stop-color="#f0a35c"/><stop offset="1" stop-color="#8a4a1c"/></linearGradient>
</defs>`;

// ===================== ไมโครเวฟ =====================
export const MICRO: SceneDef = {
  focus: {
    all: { cx: 135, cy: 245, z: 1.0 },
    magnetron: { cx: 214, cy: 168, z: 3.4, box: [196, 146, 46, 46], label: "แมกนีตรอน" },
    guide: { cx: 150, cy: 164, z: 2.6, box: [102, 152, 104, 24], label: "ท่อนำคลื่น" },
    cavity: { cx: 107, cy: 256, z: 2.0, box: [30, 176, 154, 160], label: "ห้องอบโลหะ" },
    mol: { cx: 135, cy: 404, z: 3.0, box: [93, 362, 84, 84], label: "โมเลกุลน้ำ" },
    turn: { cx: 107, cy: 306, z: 2.6, box: [50, 296, 114, 40], label: "จานหมุน" },
    door: { cx: 135, cy: 404, z: 3.0, box: [93, 362, 84, 84], label: "ตะแกรงที่ประตู" },
    metal: { cx: 107, cy: 296, z: 3.2, box: [78, 262, 60, 60], label: "ประกายไฟ" },
    end: { cx: 135, cy: 245, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const o: string[] = [DEFS, EXTRA, room(450)];
    // เคาน์เตอร์ + ตู้
    o.push(`<rect x="-140" y="352" width="550" height="12" fill="url(#top)"/><rect x="-140" y="364" width="550" height="90" fill="url(#cab)"/><rect x="-140" y="364" width="550" height="2" fill="#4c3320" opacity=".5"/>`);
    o.push(`<rect x="10" y="376" width="116" height="66" rx="3" fill="none" stroke="#573a22" stroke-width="1.2" opacity=".6"/><rect x="144" y="376" width="116" height="66" rx="3" fill="none" stroke="#573a22" stroke-width="1.2" opacity=".6"/>`);
    o.push(`<ellipse cx="135" cy="353" rx="128" ry="5" fill="#1b1008" opacity=".4" filter="url(#bl)"/>`);
    const amp = cue === "magnetron" || cue === "guide" ? 1 : cue === "all" || cue === "end" ? 0.45 : 0.75;
    // ตัวเครื่อง
    o.push(`<g filter="url(#sh)"><rect x="14" y="140" width="242" height="212" rx="12" fill="url(#dark)" stroke="#1d2338" stroke-width="1.2"/></g>`);
    o.push(`<rect x="18" y="144" width="234" height="5" rx="2.5" fill="#fff" opacity=".12"/>`);
    // ห้องอบ
    o.push(`<rect x="30" y="176" width="154" height="160" rx="4" fill="url(#cav)" stroke="#8e99b0" stroke-width="1.6"/>`);
    o.push(`<ellipse cx="60" cy="190" rx="22" ry="8" fill="#fff6c8" opacity=".6" filter="url(#bl)"/>`);
    // เส้นขอบผนังโลหะ
    o.push(`<rect x="30" y="174" width="154" height="4" fill="#9aa6bd"/><rect x="112" y="173" width="26" height="6" fill="#2b3350"/>`);
    // แผงขวา + หม้อแปลง
    o.push(`<rect x="192" y="200" width="56" height="140" rx="6" fill="#222a42" stroke="#394464"/>`);
    o.push(`<rect x="198" y="206" width="44" height="18" rx="3" fill="#07141c"/><text x="220" y="219.5" font-size="11" fill="#7fffd0" font-family="Kanit, sans-serif" font-weight="700" text-anchor="middle">${cue === "all" ? "01:30" : "00:" + String(Math.max(0, 59 - Math.floor(ph * 1))).padStart(2, "0")}</text>`);
    for (let i = 0; i < 4; i++) o.push(`<rect x="${200 + (i % 2) * 22}" y="${232 + Math.floor(i / 2) * 16}" width="18" height="11" rx="3" fill="#4b5878" stroke="#2b3350"/>`);
    o.push(`<circle cx="220" cy="296" r="13" fill="#2b3350"/><circle cx="220" cy="296" r="10" fill="url(#metal)"/><rect x="219" y="287" width="2" height="8" rx="1" fill="#ffe14a" transform="rotate(${f2(40)} 220 296)"/>`);
    // หม้อแปลง + คอยล์ทองแดง (ใต้แมกนีตรอน)
    o.push(`<rect x="196" y="316" width="48" height="20" rx="3" fill="#39425e"/>` + Array.from({ length: 7 }, (_, i) => `<rect x="${199 + i * 6.2}" y="318" width="4.4" height="16" rx="2" fill="url(#copper)"/>`).join(""));
    // ท่อนำคลื่น
    o.push(`<g filter="url(#sh2)"><rect x="100" y="150" width="112" height="26" rx="4" fill="url(#metal)" stroke="#6e7a93"/></g><rect x="104" y="154" width="104" height="18" rx="3" fill="#18203b"/>`);
    // คลื่นในท่อ
    for (let i = 0; i < 7; i++) {
      const x = 204 - ((ph * 46 + i * 15) % 100);
      const a = cl(1 - (204 - x) / 105) * amp;
      o.push(`<path d="M${f2(x - 3)} 155 Q${f2(x + 4)} 163 ${f2(x - 3)} 171" fill="none" stroke="#ffa24a" stroke-width="1.8" stroke-linecap="round" opacity="${f2(a)}"/>`);
    }
    o.push(`<ellipse cx="125" cy="177" rx="14" ry="6" fill="#ffa24a" opacity="${f2(0.35 * amp)}" filter="url(#bl)"/>`);
    // แมกนีตรอน (หน้าตัด)
    o.push(`<g filter="url(#sh2)"><rect x="203" y="143" width="46" height="46" rx="8" fill="#5a6684" stroke="#2b3350"/><rect x="209" y="144" width="34" height="6" rx="2" fill="#d94b4b"/><rect x="209" y="182" width="34" height="6" rx="2" fill="#3f72d9"/></g>`);
    o.push(`<circle cx="226" cy="166" r="17" fill="#232c47" stroke="#8e99b0" stroke-width="2.4"/>`);
    for (let i = 0; i < 10; i++) o.push(`<rect x="225" y="${f2(166 - 14)}" width="2" height="7" rx="1" fill="#e5a05a" transform="rotate(${i * 36} 226 166)"/>`);
    o.push(`<circle cx="226" cy="166" r="4" fill="#ff8a3a"/><circle cx="226" cy="166" r="8" fill="#ff8a3a" opacity=".25"/>`);
    for (let i = 0; i < 6; i++) {
      const a = ph * 7 + i * 1.047;
      o.push(dot([226 + 10.5 * Math.cos(a), 166 + 10.5 * Math.sin(a)], 1.5, "#7fd8ff"));
    }
    o.push(`<rect x="205" y="164" width="8" height="4" rx="2" fill="#ffd89a"/>`);
    // คลื่นในห้อง
    o.push(`<clipPath id="mwc"><rect x="31" y="179" width="152" height="156"/></clipPath><g clip-path="url(#mwc)">`);
    if (cue !== "mol" && cue !== "door") {
      for (const sx of [125, -65, 243]) for (let k = 0; k < 6; k++) {
        const r = (ph * 55 + k * 22) % 132;
        o.push(`<circle cx="${sx}" cy="176" r="${f2(r)}" fill="none" stroke="#ff8a3a" stroke-width="1.4" opacity="${f2((1 - r / 132) * 0.5 * amp)}"/>`);
      }
    }
    if (cue === "cavity" || cue === "turn" || cue === "end") {
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
        const hot = (i + j) % 2 === 0;
        o.push(`<ellipse cx="${f2(52 + i * 28)}" cy="${f2(212 + j * 44)}" rx="12" ry="11" fill="${hot ? "#ff4a1a" : "#4aa8ff"}" opacity="${hot ? 0.34 : 0.22}" filter="url(#bl)"/>`);
      }
    }
    o.push(`</g>`);
    // จานหมุน
    const cx = 107, cy = 324;
    o.push(`<ellipse cx="${cx}" cy="${cy + 8}" rx="34" ry="3.4" fill="#8a94aa"/><rect x="${cx - 4}" y="${cy + 6}" width="8" height="10" fill="#7a869c"/>`);
    o.push(`<ellipse cx="${cx}" cy="${cy + 3}" rx="58" ry="7.4" fill="#9fc6e4" opacity=".75"/><ellipse cx="${cx}" cy="${cy}" rx="58" ry="7.4" fill="#d7ecfb" stroke="#8fb3d0" stroke-width=".8"/>`);
    for (let i = 0; i < 8; i++) { const a = ph * 0.9 + (i * Math.PI) / 4; o.push(`<circle cx="${f2(cx + 50 * Math.cos(a))}" cy="${f2(cy + 5.2 * Math.sin(a))}" r="1.1" fill="#fff" opacity=".8"/>`); }
    const a0 = ph * 0.9;
    const items = [{ a: a0, kind: "bowl" }, { a: a0 + Math.PI, kind: "mug" }].sort((u, v) => Math.sin(u.a) - Math.sin(v.a));
    const heatTint = cue === "turn" || cue === "cavity" ? 1 : 0.5;
    for (const it of items) {
      const x = cx + 32 * Math.cos(it.a), y = cy + 3.4 * Math.sin(it.a), s = 1 + 0.08 * Math.sin(it.a);
      if (it.kind === "bowl")
        o.push(`<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})" opacity="${cue === "metal" ? 0.35 : 1}"><ellipse cx="0" cy="0" rx="15" ry="2.6" fill="#1b1008" opacity=".28"/><path d="M-15 -17 H15 Q15 -3 0 0 Q-15 -3 -15 -17Z" fill="#fbfbff" stroke="#b5bccc" stroke-width=".8"/><ellipse cx="0" cy="-17" rx="15" ry="3.2" fill="#f4f6fb" stroke="#b5bccc" stroke-width=".7"/><ellipse cx="0" cy="-16.6" rx="12.5" ry="2.5" fill="${mixc("#e0793a", "#ff4a2a", heatTint * 0.4)}"/><ellipse cx="-4" cy="-17" rx="4" ry="0.9" fill="#fff" opacity=".6"/></g>`);
      else
        o.push(`<g transform="translate(${f2(x)} ${f2(y)}) scale(${f2(s)})" opacity="${cue === "metal" ? 0.35 : 1}"><ellipse cx="0" cy="0" rx="9" ry="2" fill="#1b1008" opacity=".28"/><rect x="-8" y="-20" width="16" height="20" rx="3" fill="#ffd24a" stroke="#c99a00" stroke-width=".8"/><path d="M8 -15 q8 1 6 8 q-2 4 -6 3" fill="none" stroke="#c99a00" stroke-width="2.2"/><ellipse cx="0" cy="-19" rx="7" ry="1.6" fill="#7fc9ff"/><rect x="-5" y="-17" width="2" height="12" rx="1" fill="#fff" opacity=".45"/></g>`);
    }
    if (cue === "turn" || cue === "cavity" || cue === "mol") for (const it of items) o.push(steam(cx + 32 * Math.cos(it.a), cy - 20, ph + it.a, 3, 0.6, 5));
    // ส้อมโลหะ + ประกายไฟ
    if (cue === "metal") {
      o.push(`<g transform="translate(107 318)"><rect x="-24" y="-3" width="30" height="3.4" rx="1.6" fill="#c8d0de" stroke="#6e7a93" stroke-width=".5" transform="rotate(-18)"/><g transform="translate(5 -9) rotate(-18)">${[0, 1, 2, 3].map((i) => `<rect x="${i * 3.4 - 5}" y="-14" width="1.8" height="14" fill="#dfe5ef" stroke="#6e7a93" stroke-width=".3"/>`).join("")}<rect x="-6" y="-2" width="12" height="3" rx="1.4" fill="#c8d0de"/></g></g>`);
      const fl = Math.sin(ph * 41) > -0.2 ? 1 : 0.15;
      for (let k = 0; k < 4; k++) {
        const bx = 105 + k * 3.6, by = 295;
        let d = `M${f2(bx)} ${by + 4}`;
        for (let s = 1; s <= 6; s++) d += ` L${f2(bx + (rnd(frame * 3 + k * 7 + s) - 0.5) * 8)} ${f2(by + 4 - s * 3.4)}`;
        o.push(`<path d="${d}" fill="none" stroke="#3d7bff" stroke-width="2.2" opacity="${f2(fl * (0.7 + rnd(frame + k) * 0.3))}"/>`);
      }
      o.push(`<circle cx="112" cy="296" r="14" fill="#7fb4ff" opacity="${f2(0.6 * fl)}" filter="url(#bl)"/><circle cx="112" cy="297" r="4" fill="#fff" opacity="${f2(fl)}"/>`);
    }
    // ===== เลนส์ขยาย =====
    if (cue === "mol" || cue === "door") {
      const LX = 135, LY = 404, LR = 42;
      o.push(`<circle cx="${LX}" cy="${LY}" r="${LR + 3}" fill="#ffe14a" opacity=".9"/><circle cx="${LX}" cy="${LY}" r="${LR}" fill="url(#lens)"/><clipPath id="lc"><circle cx="${LX}" cy="${LY}" r="${LR - 1}"/></clipPath><g clip-path="url(#lc)">`);
      if (cue === "mol") {
        const E = Math.sin(ph * 5.5);
        const heat = cl(0.2 + p * 0.8);
        for (let c = 0; c < 4; c++) {
          const x = 104 + c * 21, up = (c % 2 ? -1 : 1) * Math.sign(E || 1);
          o.push(`<g opacity="${f2(Math.abs(E) * 0.7)}" transform="translate(${x} ${LY}) scale(1 ${up})"><path d="M0 22 V-18" stroke="#ffd24a" stroke-width="1.6"/><path d="M-4 -12 L0 -20 L4 -12Z" fill="#ffd24a"/></g>`);
        }
        const mols: [number, number][] = [[118, 394], [150, 388], [132, 424], [160, 420], [108, 420]];
        mols.forEach(([x, y], i) => {
          const rot = 58 * E + (rnd(i + 3) - 0.5) * 14 * heat * Math.sin(ph * 17 + i);
          o.push(`<circle cx="${x}" cy="${y}" r="${f2(10 + heat * 6)}" fill="#ff6a2a" opacity="${f2(0.2 * heat)}" filter="url(#bl)"/>`);
          o.push(`<g transform="translate(${f2(x + Math.sin(ph * 23 + i) * heat * 1.4)} ${f2(y)}) rotate(${f2(rot)})"><line x1="0" y1="0" x2="-5.4" y2="-5.4" stroke="#cfd6e8" stroke-width="2"/><line x1="0" y1="0" x2="5.4" y2="-5.4" stroke="#cfd6e8" stroke-width="2"/><circle cx="0" cy="0" r="6" fill="#ff4d4d"/><circle cx="-2" cy="-2" r="2" fill="#fff" opacity=".6"/><circle cx="-6" cy="-6" r="3.3" fill="#fff" stroke="#9aa6c0" stroke-width=".6"/><circle cx="6" cy="-6" r="3.3" fill="#fff" stroke="#9aa6c0" stroke-width=".6"/><text x="0" y="-10.2" font-size="4.6" fill="#6ab6ff" font-family="Kanit, sans-serif" font-weight="900" text-anchor="middle">+</text><text x="0" y="9.4" font-size="5.6" fill="#ffb0b0" font-family="Kanit, sans-serif" font-weight="900" text-anchor="middle">−</text></g>`);
        });
        for (let i = 0; i < 10; i++) { const u = (ph * 1.3 + i / 10) % 1; o.push(dot([LX + (rnd(i) - 0.5) * 70, LY + 30 - u * 62], 1 + heat, "#ff6a2a").replace(/opacity="\.26"/, `opacity="${f2(0.3 * heat)}"`)); }
      } else {
        o.push(`<rect x="133" y="362" width="4" height="84" fill="#7a869c"/>`);
        for (let i = 0; i < 14; i++) o.push(`<rect x="132.5" y="${f2(366 + i * 5.7)}" width="5" height="2.2" fill="#0b1226"/>`);
        for (let i = 0; i < 5; i++) {
          const x = 95 + ((ph * 26 + i * 8.5) % 38);
          const a = cl((x - 95) / 38);
          o.push(`<path d="M${f2(x - 3)} 366 Q${f2(x + 4)} ${LY} ${f2(x - 3)} 442" fill="none" stroke="#ff8a3a" stroke-width="2" opacity="${f2(0.9 - a * 0.3)}"/>`);
          const xr = 130 - ((ph * 26 + i * 8.5) % 38);
          o.push(`<path d="M${f2(xr - 3)} 366 Q${f2(xr - 9)} ${LY} ${f2(xr - 3)} 442" fill="none" stroke="#ff8a3a" stroke-width="1.2" opacity="${f2(0.35)}"/>`);
        }
        for (let i = 0; i < 12; i++) {
          const gy = 368 + Math.floor(rnd(i + 5) * 14) * 5.7 + 1;
          const x = 96 + ((ph * 50 + i * 7) % 84);
          o.push(dot([x, gy], 1.5, "#ffe96a"));
        }
        o.push(`<text x="112" y="452" font-size="5.5" fill="#ff8a3a" font-family="Kanit, sans-serif" font-weight="900" text-anchor="middle" opacity="0">.</text>`);
      }
      o.push(`</g><path d="M${LX - 28} ${LY - 28} A40 40 0 0 1 ${LX} ${LY - 40}" fill="none" stroke="#fff" stroke-width="2" opacity=".25" stroke-linecap="round"/>`);
      if (cue === "door") o.push(`<text x="112" y="${LY + 36}" font-size="6" fill="#ffb27a" font-family="Kanit, sans-serif" font-weight="900" text-anchor="middle" stroke="#0b1226" stroke-width="2" paint-order="stroke">คลื่น</text><text x="160" y="${LY + 36}" font-size="6" fill="#ffe96a" font-family="Kanit, sans-serif" font-weight="900" text-anchor="middle" stroke="#0b1226" stroke-width="2" paint-order="stroke">แสง</text>`);
    }
    o.push(box(MICRO.focus[cue]?.box, ph));
    return o.join("");
  },
};

// ===================== หม้อหุงข้าว =====================
type RS = { sw: number; w: number; t: number; on: number; mag: number; glow: number };
const R_STATE: Record<string, [RS, RS]> = {
  all: [{ sw: 0, w: 1, t: 28, on: 0, mag: 0, glow: 0 }, { sw: 0, w: 1, t: 28, on: 0, mag: 0, glow: 0 }],
  press: [{ sw: 0, w: 1, t: 28, on: 0, mag: 0, glow: 0 }, { sw: 1, w: 1, t: 28, on: 1, mag: 1, glow: 0.4 }],
  heat: [{ sw: 1, w: 1, t: 28, on: 1, mag: 1, glow: 0.7 }, { sw: 1, w: 1, t: 99, on: 1, mag: 1, glow: 1 }],
  boil: [{ sw: 1, w: 1, t: 100, on: 1, mag: 1, glow: 1 }, { sw: 1, w: 0.8, t: 100, on: 1, mag: 1, glow: 1 }],
  absorb: [{ sw: 1, w: 0.8, t: 100, on: 1, mag: 1, glow: 1 }, { sw: 1, w: 0, t: 100, on: 1, mag: 1, glow: 1 }],
  magnet: [{ sw: 1, w: 0, t: 100, on: 1, mag: 1, glow: 1 }, { sw: 1, w: 0, t: 106, on: 1, mag: 0.85, glow: 1 }],
  click: [{ sw: 1, w: 0, t: 106, on: 1, mag: 0.85, glow: 1 }, { sw: 0, w: 0, t: 100, on: 0, mag: 0, glow: 0.1 }],
  warm: [{ sw: 0, w: 0, t: 100, on: 0, mag: 0, glow: 0.1 }, { sw: 0, w: 0, t: 68, on: 0, mag: 0, glow: 0.3 }],
  end: [{ sw: 0, w: 0, t: 68, on: 0, mag: 0, glow: 0.3 }, { sw: 0, w: 0, t: 68, on: 0, mag: 0, glow: 0.3 }],
};
export const RICE: SceneDef = {
  focus: {
    all: { cx: 135, cy: 255, z: 1.0 },
    press: { cx: 200, cy: 372, z: 3.0, box: [174, 358, 62, 40], label: "คันโยกกดหุง" },
    heat: { cx: 135, cy: 300, z: 2.0, box: [58, 336, 154, 22], label: "แผ่นความร้อน" },
    boil: { cx: 135, cy: 235, z: 1.8, box: [60, 158, 150, 180], label: "น้ำเดือด 100°C" },
    absorb: { cx: 135, cy: 255, z: 1.8, box: [60, 158, 150, 180], label: "ข้าวดูดน้ำ" },
    magnet: { cx: 135, cy: 358, z: 4.2, box: [114, 336, 44, 44], label: "แม่เหล็กเซนเซอร์" },
    click: { cx: 172, cy: 370, z: 3.0, box: [114, 336, 124, 56], label: "กริ๊ก!" },
    warm: { cx: 135, cy: 270, z: 1.5, box: [60, 158, 150, 200], label: "โหมดอุ่น" },
    end: { cx: 135, cy: 255, z: 1.0 },
  },
  render: ({ frame, cue, p }) => {
    const ph = frame / 30;
    const [A, B] = R_STATE[cue] || R_STATE.all;
    const e = ease(p);
    const g = (k: keyof RS) => lerp(A[k], B[k], e);
    const sw = g("sw"), w = g("w"), t = g("t"), on = g("on"), mag = g("mag"), glow = g("glow");
    const o: string[] = [DEFS, EXTRA, room(430)];
    o.push(`<rect x="-140" y="398" width="550" height="12" fill="url(#top)"/><rect x="-140" y="410" width="550" height="60" fill="url(#cab)"/>`);
    o.push(`<ellipse cx="135" cy="399" rx="112" ry="5" fill="#1b1008" opacity=".4" filter="url(#bl)"/>`);
    // ตัวเครื่อง
    o.push(`<g filter="url(#sh)"><path d="M44 150 H226 Q238 150 238 164 V386 Q238 398 226 398 H44 Q32 398 32 386 V164 Q32 150 44 150Z" fill="url(#cook)" stroke="#9aa9bf" stroke-width="1.2"/></g>`);
    o.push(`<rect x="36" y="212" width="198" height="6" fill="#2b3350" opacity=".08"/>`);
    // ฝา
    const lift = cue === "boil" ? 1.2 * Math.abs(Math.sin(ph * 9)) : 0;
    o.push(`<g transform="translate(0 ${f2(-lift)})"><path d="M44 150 Q135 100 226 150 Z" fill="url(#cook)" stroke="#9aa9bf" stroke-width="1.2"/><rect x="124" y="108" width="22" height="10" rx="4" fill="#4b5878"/><rect x="128" y="104" width="14" height="7" rx="3" fill="#8e99b0"/></g>`);
    // หม้อใน
    const pot = "M56 160 H214 V322 Q214 342 194 342 H76 Q56 342 56 322 Z";
    o.push(`<path d="${pot}" fill="#eef2f8" stroke="#6e7a93" stroke-width="2.2"/>`);
    o.push(`<clipPath id="potc"><path d="${pot}"/></clipPath><g clip-path="url(#potc)">`);
    // ข้าว
    const sw2 = cue === "absorb" ? 1 + 0.38 * ease(p) : cue === "all" || cue === "press" || cue === "heat" || cue === "boil" ? 1 : 1.38;
    const hr = 70 * sw2;
    const rTop = 340 - hr;
    const yw = 340 - (hr + 52 * w);
    o.push(`<rect x="56" y="${f2(rTop)}" width="158" height="${f2(hr + 4)}" fill="#efe6cf"/>`);
    for (let i = 0; i < 150; i++) {
      const gx = 60 + rnd(i) * 150, gy = rTop + 3 + rnd(i + 200) * (hr - 6);
      const big = cue === "all" || cue === "press" || cue === "heat" || cue === "boil" ? 1 : sw2;
      o.push(`<ellipse cx="${f2(gx)}" cy="${f2(gy)}" rx="${f2(2.5 * big)}" ry="${f2(1.2 * big)}" fill="${sw2 > 1.2 ? "#fffdf5" : "#f7f1de"}" stroke="#d6caa8" stroke-width=".4" transform="rotate(${f2(rnd(i + 99) * 180)} ${f2(gx)} ${f2(gy)})"/>`);
    }
    // น้ำ
    if (w > 0.02) o.push(`<rect x="56" y="${f2(yw)}" width="158" height="${f2(342 - yw)}" fill="url(#water)" opacity=".55"/><path d="M56 ${f2(yw)} q10 -2 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7" transform="translate(${f2(Math.sin(ph * 4) * 3)} 0)"/>`);
    // การพาความร้อน + ฟองเดือด
    if (cue === "heat" && w > 0.1) for (let i = 0; i < 3; i++) { const u = (ph * 0.5 + i / 3) % 1; const cxk = 88 + i * 46; o.push(`<path d="M${cxk} 332 C${cxk - 14} 300 ${cxk - 14} 260 ${cxk} 236" fill="none" stroke="#ffb27a" stroke-width="1.6" stroke-dasharray="4 4" opacity="${f2(0.5 * Math.sin(Math.PI * u))}" stroke-dashoffset="${f2(-ph * 18)}"/>`); }
    if ((cue === "boil" || cue === "absorb") && w > 0.05) for (let i = 0; i < 26; i++) { const u = (ph * (1.1 + rnd(i) * 0.9) + rnd(i + 9)) % 1; o.push(`<circle cx="${f2(62 + rnd(i + 33) * 146)}" cy="${f2(340 - u * (340 - yw))}" r="${f2(1.4 + rnd(i + 5) * 2.4)}" fill="#fff" opacity="${f2(0.75 * (1 - u * 0.4))}" stroke="#bfe3ff" stroke-width=".4"/>`); }
    o.push(`</g>`);
    // ขอบหม้อ + ไอน้ำ
    o.push(`<rect x="52" y="156" width="166" height="8" rx="4" fill="url(#pot)" stroke="#6e7a93"/>`);
    if (cue === "boil" || cue === "absorb") o.push(steam(135, 112, ph, 6, w > 0.02 ? 1 : 0.5, 14) + steam(75, 160, ph + 0.3, 3, 0.5, 8));
    // แผ่นความร้อน
    const hc = mixc("#6a2a1a", "#ff5a1a", cue === "warm" ? 0.3 + 0.2 * Math.sin(ph * 3) : glow);
    o.push(`<rect x="58" y="340" width="154" height="14" rx="4" fill="#3a2a2a" stroke="#1d1414"/><rect x="62" y="343" width="146" height="5" rx="2.5" fill="${hc}"/><rect x="62" y="343" width="146" height="5" rx="2.5" fill="${hc}" opacity=".6" filter="url(#bl)"/>`);
    if (glow > 0.4 && cue !== "warm") o.push(`<rect x="50" y="340" width="170" height="20" fill="#ff7a2a" opacity="${f2(0.2 * glow)}" filter="url(#bl)"/>`);
    // ห้องกลไกด้านล่าง
    o.push(`<rect x="46" y="356" width="178" height="38" rx="4" fill="#d6dce8" stroke="#9aa9bf"/><rect x="50" y="360" width="170" height="30" rx="3" fill="#1b2238"/>`);
    // เซนเซอร์แม่เหล็ก: เฟอร์ไรต์แตะก้นหม้อ + แม่เหล็กถาวร + สปริง
    const my = lerp(366, 350 + 0, mag > 0.5 ? 1 : 0) ;
    const mpos = mag > 0.5 ? 352 : 366 + (cue === "click" ? Math.min(1, p * 4) * 0 : 0);
    const magY = lerp(368, 354, sw > 0.5 ? 1 : cl(mag));
    const ferrC = mixc("#6c7a96", "#ff6a3a", cl((t - 90) / 20));
    o.push(`<rect x="124" y="346" width="22" height="7" rx="2" fill="${ferrC}" stroke="#2b3350"/>`);
    o.push(`<rect x="132" y="341" width="6" height="6" fill="#8e99b0"/>`);
    const sp: string[] = [];
    for (let i = 0; i <= 8; i++) sp.push(`${i % 2 ? 128 : 142} ${f2(lerp(392, magY + 12, i / 8))}`);
    o.push(`<polyline points="${sp.join(" ")}" fill="none" stroke="#c8ccd8" stroke-width="1.4"/>`);
    o.push(`<g filter="url(#sh2)"><rect x="125" y="${f2(magY)}" width="20" height="12" rx="2" fill="#d94b4b"/><rect x="135" y="${f2(magY)}" width="10" height="12" rx="2" fill="#3f72d9"/><text x="130" y="${f2(magY + 9)}" font-size="6" fill="#fff" font-family="Kanit, sans-serif" font-weight="900" text-anchor="middle">N</text><text x="140" y="${f2(magY + 9)}" font-size="6" fill="#fff" font-family="Kanit, sans-serif" font-weight="900" text-anchor="middle">S</text></g>`);
    if (mag > 0.5 && cue !== "click") for (let i = 0; i < 3; i++) o.push(`<path d="M${128 + i * 8} ${f2(magY - 1)} q0 -5 0 -6" stroke="#ffe14a" stroke-width="1" opacity=".7"/>`);
    // คันโยก + หน้าสัมผัสไฟ
    const lev = lerp(-14, 4, sw);
    o.push(`<rect x="166" y="378" width="42" height="8" rx="2" fill="#39425e"/>`);
    o.push(`<g transform="translate(176 382) rotate(${f2(-lev * 0.9)})"><rect x="-8" y="-3" width="62" height="6" rx="3" fill="url(#metal)" stroke="#6e7a93" stroke-width=".6"/><rect x="48" y="-7" width="14" height="14" rx="3" fill="#f6c84a" stroke="#b58a00"/></g>`);
    o.push(`<path d="M135 ${f2(magY + 12)} L${f2(176 + 8)} 384" stroke="#8e99b0" stroke-width="1.4" stroke-dasharray="2 1.5"/>`);
    o.push(`<rect x="150" y="372" width="5" height="5" rx="1" fill="${on > 0.5 ? "#ffb44a" : "#6e7a93"}"/><rect x="${f2(150 + (on > 0.5 ? 0 : 1.5))}" y="${on > 0.5 ? 377 : 379}" width="5" height="3" rx="1" fill="${on > 0.5 ? "#ffb44a" : "#6e7a93"}"/>`);
    if (on > 0.5) { o.push(`<circle cx="152" cy="377" r="7" fill="#ffb44a" opacity=".45" filter="url(#bl)"/>`); }
    if (cue === "click" && p < 0.4) o.push(`<path d="M150 372 l-4 -5 l5 2 l-2 -6" stroke="#ffe14a" stroke-width="1.4" fill="none" opacity="${f2(1 - p * 2.5)}"/>`);
    // สายไฟ
    o.push(`<path d="M32 372 Q10 372 6 392" fill="none" stroke="#222" stroke-width="3.4" stroke-linecap="round"/>`);
    // ไฟแสดงสถานะ
    o.push(`<circle cx="214" cy="256" r="6" fill="${on > 0.5 ? "#ff5a3a" : cue === "warm" || cue === "end" ? "#ffb02e" : "#4a5570"}"/><circle cx="214" cy="256" r="12" fill="${on > 0.5 ? "#ff5a3a" : "#ffb02e"}" opacity="${on > 0.5 || cue === "warm" || cue === "end" ? 0.28 : 0}" filter="url(#bl)"/>`);
    o.push(`<text x="214" y="274" font-size="5" fill="#46526b" font-family="Kanit, sans-serif" font-weight="700" text-anchor="middle">${on > 0.5 ? "หุง" : cue === "warm" || cue === "end" ? "อุ่น" : ""}</text>`);
    // เทอร์โมมิเตอร์
    const tf = cl((t - 20) / 100);
    const tc = mixc("#46b4ff", "#ff4a2a", tf);
    o.push(`<rect x="8" y="230" width="12" height="130" rx="6" fill="#eef3fa" stroke="#9fb0c8"/><rect x="12" y="${f2(354 - 118 * tf)}" width="4" height="${f2(118 * tf + 4)}" rx="2" fill="${tc}"/><circle cx="14" cy="368" r="9" fill="${tc}" stroke="#9fb0c8"/>`);
    o.push(`<text x="14" y="392" font-size="9" font-family="Kanit, sans-serif" font-weight="900" text-anchor="middle" fill="#46526b">${Math.round(t)}°C</text>`);
    o.push(box(RICE.focus[cue]?.box, ph));
    return o.join("");
  },
};
export const SCENES2: Record<string, SceneDef> = { micro: MICRO, rice: RICE };
