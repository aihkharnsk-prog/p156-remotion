import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, interpolate, interpolateColors, Easing, random, useCurrentFrame } from "remotion";
import { useKanit, KANIT } from "./fonts";
import { H_KEYS, V_KEYS, CAM, EVENTS, SKY, SFX, Ev, Pose, Key } from "./fightScript";

// =====================================================================
// FightShort — หนังสั้นแอ็กชัน 2 นาที (ตัวละครต้นฉบับ: รินกับเวล)
// ตัวละครเป็นโครงกระดูกเวกเตอร์ (SVG) ขยับตามคีย์เฟรมท่าทาง + กล้อง + เอฟเฟกต์ + เสียงสังเคราะห์
// =====================================================================

export const FIGHT_FPS = 30;
export const FIGHT_SECONDS = 120;
export const FIGHT_FRAMES = FIGHT_FPS * FIGHT_SECONDS;
const GY = 840; // เส้นพื้น
const D = Math.PI / 180;
const W = 1920;
const HGT = 1080;

const ease = {
  s: Easing.inOut(Easing.cubic),
  f: Easing.out(Easing.poly(4)),
  i: Easing.in(Easing.poly(3)),
  l: (x: number) => x,
};
const PK = ["lean", "head", "a1", "e1", "a2", "e2", "t1", "k1", "t2", "k2", "wa", "spin", "x", "air", "glow", "grip", "dir"] as const;

function sampler(keys: Key[]) {
  return (t: number): Pose => {
    if (t <= keys[0].t) return keys[0].p;
    const last = keys[keys.length - 1];
    if (t >= last.t) return last.p;
    let i = 0;
    while (i < keys.length - 2 && keys[i + 1].t <= t) i++;
    const a = keys[i], b = keys[i + 1];
    const u = (ease[b.e || "s"] as any)((t - a.t) / Math.max(0.001, b.t - a.t));
    const out: any = {};
    for (const k of PK) out[k] = (a.p as any)[k] + ((b.p as any)[k] - (a.p as any)[k]) * u;
    out.dir = b.p.dir !== a.p.dir ? (u < 0.5 ? a.p.dir : b.p.dir) : a.p.dir;
    return out as Pose;
  };
}
const hAt = sampler(H_KEYS);
const vAt = sampler(V_KEYS);

function midAt(t: number) {
  let sum = 0;
  const n = 7;
  for (let i = 0; i < n; i++) {
    const tt = t - 0.3 + (i * 0.6) / (n - 1);
    sum += (hAt(tt).x + vAt(tt).x) / 2;
  }
  return sum / n;
}
function camAt(t: number) {
  const ks = CAM;
  const center = (k: (typeof CAM)[number]): [number, number] => (k.a ? [k.x ?? 960, k.y ?? 560] : [midAt(t) + (k.dx ?? 0), k.dy ?? 590]);
  if (t <= ks[0].t) { const c = center(ks[0]); return { x: c[0], y: c[1], z: ks[0].z, r: ks[0].r ?? 0 }; }
  const last = ks[ks.length - 1];
  if (t >= last.t) { const c = center(last); return { x: c[0], y: c[1], z: last.z, r: last.r ?? 0 }; }
  let i = 0;
  while (i < ks.length - 2 && ks[i + 1].t <= t) i++;
  const a = ks[i], b = ks[i + 1];
  const u = ease.s((t - a.t) / Math.max(0.001, b.t - a.t));
  const ca = center(a), cb = center(b);
  return { x: ca[0] + (cb[0] - ca[0]) * u, y: ca[1] + (cb[1] - ca[1]) * u, z: a.z + (b.z - a.z) * u, r: (a.r ?? 0) + ((b.r ?? 0) - (a.r ?? 0)) * u };
}

const lerpN = (a: number, b: number, u: number) => a + (b - a) * u;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const pt = (a: number, l: number): [number, number] => [Math.sin(a * D) * l, Math.cos(a * D) * l];

// IK สองท่อน: หาข้อศอกให้มือไปถึงจุด g
function ik(s: [number, number], g: [number, number], l1: number, l2: number, bend: number): [number, number] {
  let dx = g[0] - s[0], dy = g[1] - s[1];
  let d = Math.hypot(dx, dy);
  d = Math.min(d, l1 + l2 - 0.01);
  const a = Math.atan2(dy, dx);
  const c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const ang = a + Math.acos(c) * bend;
  return [s[0] + Math.cos(ang) * l1, s[1] + Math.sin(ang) * l1];
}

// ---------------------------------------------------------------------
// ตัวละคร
// ---------------------------------------------------------------------
type Who = "H" | "V";
const LIM = {
  H: { th: 82, sh: 84, ua: 60, fa: 58, torso: 104, w: { leg: 24, arm: 17, torso: 40 }, blade: 200, head: 25 },
  V: { th: 94, sh: 96, ua: 70, fa: 68, torso: 122, w: { leg: 31, arm: 22, torso: 54 }, blade: 285, head: 28 },
};

type Rigged = {
  hip: [number, number];
  neck: [number, number];
  head: [number, number];
  e1: [number, number]; h1: [number, number];
  e2: [number, number]; h2: [number, number];
  k1: [number, number]; f1: [number, number];
  k2: [number, number]; f2: [number, number];
  bd: [number, number];
  grip: [number, number];
};
function rig(p: Pose, L: typeof LIM.H): Rigged {
  const k1 = pt(p.t1, L.th), f1: [number, number] = [k1[0] + pt(p.t1 - p.k1, L.sh)[0], k1[1] + pt(p.t1 - p.k1, L.sh)[1]];
  const k2 = pt(p.t2, L.th), f2: [number, number] = [k2[0] + pt(p.t2 - p.k2, L.sh)[0], k2[1] + pt(p.t2 - p.k2, L.sh)[1]];
  const low = Math.max(f1[1], f2[1]);
  const hip: [number, number] = [p.x, GY - low - p.air];
  const neck: [number, number] = [hip[0] + Math.sin(p.lean * D) * L.torso, hip[1] - Math.cos(p.lean * D) * L.torso];
  const hd: [number, number] = [neck[0] + Math.sin((p.lean + p.head) * D) * (L.head + 8), neck[1] - Math.cos((p.lean + p.head) * D) * (L.head + 8)];
  const add = (a: [number, number], b: [number, number]): [number, number] => [a[0] + b[0], a[1] + b[1]];
  const e1 = add(neck, pt(p.a1, L.ua));
  const h1 = add(e1, pt(p.a1 + p.e1, L.fa));
  let e2 = add(neck, pt(p.a2, L.ua));
  let h2 = add(e2, pt(p.a2 + p.e2, L.fa));
  const bd: [number, number] = [Math.sin(p.wa * D), Math.cos(p.wa * D)];
  const grip: [number, number] = [h1[0] - bd[0] * 30, h1[1] - bd[1] * 30];
  if (p.grip > 0.01) {
    const eg = ik(neck, grip, L.ua, L.fa, p.dir === 1 ? -1 : 1);
    // หมุนข้อศอกให้พับลง (ไม่ให้ศอกชี้ขึ้น)
    e2 = [lerpN(e2[0], eg[0], p.grip), lerpN(e2[1], eg[1], p.grip)];
    h2 = [lerpN(h2[0], grip[0], p.grip), lerpN(h2[1], grip[1], p.grip)];
  }
  return {
    hip,
    neck,
    head: hd,
    e1, h1, e2, h2,
    k1: add(hip, k1), f1: add(hip, f1),
    k2: add(hip, k2), f2: add(hip, f2),
    bd, grip,
  };
}

const Limb: React.FC<{ pts: [number, number][]; w: number; c: string; o?: string; hi?: string }> = ({ pts, w, c, o = "#07070d", hi }) => {
  const d = "M" + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("L");
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={o} strokeWidth={w + 8} />
      <path d={d} stroke={c} strokeWidth={w} />
      {hi ? <path d={d} stroke={hi} strokeWidth={Math.max(2, w * 0.22)} opacity={0.65} transform="translate(-2,-3)" /> : null}
    </g>
  );
};

const boltPath = (seed: string, a: [number, number], b: [number, number], segs: number, jit: number) => {
  const pts: string[] = [`M${a[0].toFixed(0)} ${a[1].toFixed(0)}`];
  const dx = (b[0] - a[0]) / segs, dy = (b[1] - a[1]) / segs;
  for (let i = 1; i < segs; i++) {
    pts.push(`L${(a[0] + dx * i + (random(seed + "x" + i) - 0.5) * jit).toFixed(0)} ${(a[1] + dy * i + (random(seed + "y" + i) - 0.5) * jit).toFixed(0)}`);
  }
  pts.push(`L${b[0].toFixed(0)} ${b[1].toFixed(0)}`);
  return pts.join("");
};

const Fighter: React.FC<{ who: Who; t: number; frame: number; ghost?: number; tint?: string }> = ({ who, t, frame, ghost, tint }) => {
  const L = LIM[who];
  const p0 = who === "H" ? hAt(t) : vAt(t);
  const breath = Math.sin(t * 2.2 + (who === "H" ? 0 : 1.7)) * 1.6;
  const p: Pose = { ...p0, lean: p0.lean + breath * 0.8 };
  const r = rig(p, L);
  const dir = p.dir;
  const pal =
    who === "H"
      ? { body: "#1c2b52", trim: "#e9f3ff", skin: "#efbf9f", hair: "#111118", acc: "#e2263d", leg: "#16213f", blade: "#e6f7ff" }
      : { body: "#2a1f3d", trim: "#8a4bff", skin: "#8b7a8c", hair: "#0c0912", acc: "#ff6a2a", leg: "#1b1429", blade: "#2a1840" };
  const speed = Math.abs((who === "H" ? hAt(t).x - hAt(t - 0.06).x : vAt(t).x - vAt(t - 0.06).x)) / 0.06;
  const stream = clamp(speed / 1100);
  // ผ้าพันคอ (H) / ผ้าคลุม (V) ปลิวตามลม+ความเร็ว
  const trail: [number, number][] = [];
  const N = 7;
  for (let i = 0; i <= N; i++) {
    const wob = Math.sin(t * 9 - i * 0.95) * (5 + i * 2.6);
    trail.push([r.neck[0] - dir * (i * (who === "H" ? 26 : 30) * (1 + stream * 0.9)), r.neck[1] + 6 + wob + i * i * (2.4 - stream * 1.8) - p.air * 0.0]);
  }
  const bladeLen = L.blade;
  const tip: [number, number] = [r.h1[0] + r.bd[0] * bladeLen, r.h1[1] + r.bd[1] * bladeLen];
  const base: [number, number] = [r.h1[0] - r.bd[0] * 26, r.h1[1] - r.bd[1] * 26];
  const cx = (r.hip[0] + r.neck[0]) / 2, cy = (r.hip[1] + r.neck[1]) / 2;
  const glow = clamp(p.glow);
  const bn: [number, number] = [-r.bd[1], r.bd[0]];

  const body = (
    <g>
      {/* ผ้าคลุม/ผ้าพันคอ ด้านหลังตัว */}
      {who === "H" ? (
        <Limb pts={trail} w={15} c={pal.acc} hi="#ff8a97" />
      ) : (
        <path
          d={
            `M${r.neck[0]} ${r.neck[1] - 4}` +
            trail.map((q, i) => `L${q[0].toFixed(0)} ${(q[1] + i * 14).toFixed(0)}`).join("") +
            `L${trail[N][0].toFixed(0)} ${(trail[N][1] + 230).toFixed(0)}L${(r.hip[0] - dir * 30).toFixed(0)} ${(r.hip[1] + 20).toFixed(0)}Z`
          }
          fill="#3b1d5a"
          stroke="#07070d"
          strokeWidth={5}
          strokeLinejoin="round"
          opacity={0.97}
        />
      )}
      {/* แขนหลัง */}
      <Limb pts={[r.neck, r.e2, r.h2]} w={L.w.arm} c={pal.body} hi={pal.trim} />
      <circle cx={r.h2[0]} cy={r.h2[1]} r={L.w.arm * 0.62} fill={pal.skin} stroke="#07070d" strokeWidth={3} />
      {/* ขาหลัง */}
      <Limb pts={[r.hip, r.k2, r.f2]} w={L.w.leg} c={pal.leg} hi={pal.trim} />
      <ellipse cx={r.f2[0] + dir * 10} cy={r.f2[1] + 2} rx={L.w.leg * 0.9} ry={L.w.leg * 0.45} fill="#07070d" />
      {/* ลำตัว */}
      <Limb pts={[r.hip, r.neck]} w={L.w.torso} c={pal.body} hi={pal.trim} />
      {who === "H" ? (
        <g>
          <path d={`M${r.hip[0] - 22} ${r.hip[1] - 6} L${r.hip[0] + 22} ${r.hip[1] - 6}`} stroke={pal.acc} strokeWidth={9} strokeLinecap="round" />
          <path d={`M${(r.hip[0] + r.neck[0]) / 2 - 20} ${(r.hip[1] + r.neck[1]) / 2}L${(r.hip[0] + r.neck[0]) / 2 + 20} ${(r.hip[1] + r.neck[1]) / 2 - 10}`} stroke={pal.trim} strokeWidth={4} opacity={0.8} />
        </g>
      ) : (
        <g>
          <path d={`M${r.neck[0] - 34} ${r.neck[1] + 6} L${r.neck[0] + 34} ${r.neck[1] + 6} L${r.neck[0] + 22} ${r.neck[1] + 54} L${r.neck[0] - 22} ${r.neck[1] + 54}Z`} fill={pal.trim} opacity={0.35 + glow * 0.5} />
          <circle cx={(r.hip[0] + r.neck[0]) / 2} cy={(r.hip[1] + r.neck[1]) / 2 + 6} r={11} fill={pal.acc} opacity={0.55 + glow * 0.45} />
        </g>
      )}
      {/* ขาหน้า */}
      <Limb pts={[r.hip, r.k1, r.f1]} w={L.w.leg} c={pal.leg} hi={pal.trim} />
      <ellipse cx={r.f1[0] + dir * 10} cy={r.f1[1] + 2} rx={L.w.leg * 0.9} ry={L.w.leg * 0.45} fill="#07070d" />
      {/* หัว */}
      <circle cx={r.head[0]} cy={r.head[1]} r={L.head} fill={pal.skin} stroke="#07070d" strokeWidth={4} />
      {who === "H" ? (
        <g>
          <path d={`M${r.head[0] - 27} ${r.head[1] - 4} Q${r.head[0]} ${r.head[1] - 44} ${r.head[0] + 27} ${r.head[1] - 6} Q${r.head[0] + 10} ${r.head[1] - 22} ${r.head[0] - 27} ${r.head[1] - 4}Z`} fill={pal.hair} />
          <path d={`M${r.head[0] - 26} ${r.head[1] - 10}L${r.head[0] + 26} ${r.head[1] - 14}`} stroke={pal.acc} strokeWidth={8} strokeLinecap="round" />
          <Limb
            pts={[
              [r.head[0] - dir * 22, r.head[1] - 6],
              ...([1, 2, 3, 4, 5] as number[]).map((i): [number, number] => [r.head[0] - dir * (22 + i * 16 * (1 + stream)), r.head[1] - 4 + Math.sin(t * 8 - i) * 6 + i * i * 2.6]),
            ]}
            w={13}
            c={pal.hair}
          />
          <circle cx={r.head[0] + dir * 11} cy={r.head[1] + 2} r={3.4} fill={glow > 0.4 ? "#7fe9ff" : "#14141c"} />
        </g>
      ) : (
        <g>
          <path d={`M${r.head[0] - 30} ${r.head[1] + 4} Q${r.head[0] - 32} ${r.head[1] - 36} ${r.head[0]} ${r.head[1] - 36} Q${r.head[0] + 32} ${r.head[1] - 36} ${r.head[0] + 30} ${r.head[1] + 4}Z`} fill="#17111f" stroke="#07070d" strokeWidth={4} />
          <path d={`M${r.head[0] - 22} ${r.head[1] - 28} Q${r.head[0] - 48} ${r.head[1] - 64} ${r.head[0] - 40} ${r.head[1] - 84}`} stroke="#07070d" strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d={`M${r.head[0] + 22} ${r.head[1] - 28} Q${r.head[0] + 48} ${r.head[1] - 64} ${r.head[0] + 40} ${r.head[1] - 84}`} stroke="#07070d" strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d={`M${r.head[0] + dir * 2} ${r.head[1] - 6}L${r.head[0] + dir * 26} ${r.head[1] - 8}`} stroke={pal.acc} strokeWidth={6} strokeLinecap="round" opacity={0.8 + glow * 0.2} />
        </g>
      )}
      {/* อาวุธ */}
      {glow > 0.05 ? (
        <path d={`M${base[0]} ${base[1]}L${tip[0]} ${tip[1]}`} stroke={who === "H" ? "#4fd7ff" : "#a64bff"} strokeWidth={18 + glow * 14} strokeLinecap="round" opacity={0.28 + glow * 0.4} filter="url(#glow)" />
      ) : null}
      <path
        d={`M${base[0]} ${base[1]}L${r.h1[0] + r.bd[0] * 10 + bn[0] * (who === "H" ? 5 : 12)} ${r.h1[1] + r.bd[1] * 10 + bn[1] * (who === "H" ? 5 : 12)}L${tip[0]} ${tip[1]}L${r.h1[0] + r.bd[0] * 10 - bn[0] * (who === "H" ? 5 : 12)} ${r.h1[1] + r.bd[1] * 10 - bn[1] * (who === "H" ? 5 : 12)}Z`}
        fill={glow > 0.3 && who === "H" ? "#f2fdff" : pal.blade}
        stroke={who === "H" ? "#07070d" : glow > 0.2 ? "#c58bff" : "#5b3a86"}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d={`M${r.h1[0] - bn[0] * 14} ${r.h1[1] - bn[1] * 14}L${r.h1[0] + bn[0] * 14} ${r.h1[1] + bn[1] * 14}`} stroke="#c9a24b" strokeWidth={8} strokeLinecap="round" />
      {/* แขนหน้า */}
      <Limb pts={[r.neck, r.e1, r.h1]} w={L.w.arm} c={pal.body} hi={pal.trim} />
      <circle cx={r.h1[0]} cy={r.h1[1]} r={L.w.arm * 0.66} fill={pal.skin} stroke="#07070d" strokeWidth={3} />
      {who === "H" && glow > 0.25 ? (
        <g filter="url(#glow)" stroke="#bff3ff" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.95}>
          {[0, 1, 2].map((i) => {
            const sd = `b${who}${Math.floor(frame / 2)}${i}`;
            const u = random(sd + "u");
            const px = lerpN(base[0], tip[0], u), py = lerpN(base[1], tip[1], u);
            return <path key={i} d={boltPath(sd, [px, py], [px + (random(sd + "a") - 0.5) * 220, py + (random(sd + "b") - 0.5) * 220], 5, 46)} />;
          })}
        </g>
      ) : null}
    </g>
  );
  return (
    <g opacity={ghost ?? 1} style={tint ? { filter: tint } : undefined}>
      <ellipse cx={r.hip[0] + (r.f1[0] - r.hip[0]) * 0.2} cy={GY + 10} rx={110 - Math.min(p.air, 300) * 0.2} ry={16} fill="#000" opacity={0.28 * (1 - Math.min(p.air, 300) / 400)} />
      <g transform={dir === -1 ? `translate(${(2 * r.hip[0]).toFixed(1)} 0) scale(-1 1)` : undefined}>
        <g transform={`rotate(${p.spin.toFixed(1)} ${cx.toFixed(0)} ${cy.toFixed(0)})`}>{body}</g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------
// ฉากหลัง
// ---------------------------------------------------------------------
const Sky: React.FC<{ t: number; cam: { x: number; y: number; z: number } }> = ({ t, cam }) => {
  const times = SKY.map((k) => k.t);
  const c = (i: number) => interpolateColors(t, times, SKY.map((k) => k.c[i]));
  const sun = interpolateColors(t, times, SKY.map((k) => k.sun));
  const sunY = interpolate(t, times, SKY.map((k) => k.sy));
  const par = (f: number) => {
    const z = 1 + (cam.z - 1) * f;
    return `translate(${W / 2} ${HGT / 2}) scale(${z}) translate(${-(W / 2 + (cam.x - W / 2) * f)} ${-(HGT / 2 + (cam.y - HGT / 2) * f)})`;
  };
  const mountain = (seed: number, base: number, amp: number, col: string, step = 120) => {
    let d = `M-600 ${HGT + 400}`;
    for (let x = -600; x <= W + 600; x += step) d += `L${x} ${base - random("m" + seed + x) * amp - Math.sin(x * 0.004 + seed) * amp * 0.6}`;
    return <path d={d + `L${W + 600} ${HGT + 400}Z`} fill={col} />;
  };
  return (
    <g>
      <rect x={-1200} y={-800} width={W + 2400} height={HGT + 1600} fill="url(#skyg)" />
      <defs>
        <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c(0)} />
          <stop offset="0.45" stopColor={c(1)} />
          <stop offset="0.75" stopColor={c(2)} />
          <stop offset="1" stopColor={c(3)} />
        </linearGradient>
      </defs>
      <g transform={par(0.04)}>
        <circle cx={1000} cy={sunY} r={330} fill={sun} opacity={0.14} />
        <circle cx={1000} cy={sunY} r={235} fill={sun} opacity={0.3} />
        <circle cx={1000} cy={sunY} r={170} fill={sun} />
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse key={i} cx={((i * 520 + t * (8 + i * 3)) % 3000) - 500} cy={170 + i * 70} rx={380 + i * 30} ry={26 + i * 4} fill={c(2)} opacity={0.5} />
        ))}
      </g>
      <g transform={par(0.18)}>{mountain(1, 700, 220, c(3), 140)}</g>
      <g transform={par(0.35)}>{mountain(7, 790, 160, "#150d22", 100)}</g>
      <g transform={par(0.62)}>
        {/* ประตูโทริอิยักษ์ */}
        <g fill="#1a0f1c" stroke="#07070d" strokeWidth={4}>
          <rect x={650} y={330} width={46} height={520} />
          <rect x={1224} y={330} width={46} height={520} />
          <path d="M560 330 Q960 280 1360 330 L1340 372 Q960 322 580 372Z" />
          <rect x={620} y={410} width={680} height={30} />
        </g>
      </g>
    </g>
  );
};

const Ground: React.FC = () => (
  <g>
    <rect x={-1500} y={GY} width={W + 3000} height={600} fill="url(#grdg)" />
    <defs>
      <linearGradient id="grdg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a1c2e" />
        <stop offset="1" stopColor="#0d0813" />
      </linearGradient>
    </defs>
    {Array.from({ length: 24 }).map((_, i) => (
      <line key={"v" + i} x1={-1500 + i * 190} y1={GY} x2={-2400 + i * 330} y2={GY + 420} stroke="#07070d" strokeWidth={3} opacity={0.5} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <line key={"h" + i} x1={-1500} y1={GY + 20 + i * i * 22} x2={W + 1500} y2={GY + 20 + i * i * 22} stroke="#07070d" strokeWidth={3} opacity={0.5} />
    ))}
    <line x1={-1500} y1={GY} x2={W + 1500} y2={GY} stroke="#4a3052" strokeWidth={6} />
  </g>
);

// ---------------------------------------------------------------------
// เอฟเฟกต์
// ---------------------------------------------------------------------
const Star: React.FC<{ r: number; n?: number; seed: string }> = ({ r, n = 12, seed }) => {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r * (0.8 + random(seed + i) * 0.55) : r * 0.32;
    d += `${i ? "L" : "M"}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`;
  }
  return <path d={d + "Z"} />;
};

const Fx: React.FC<{ ev: Ev; t: number; frame: number }> = ({ ev, t, frame }) => {
  const dt = t - ev.t;
  const x = ev.x ?? 0, y = ev.y ?? 0;
  const seed = "fx" + ev.t;
  if (ev.k === "hit") {
    const dur = ev.big ? 0.9 : 0.55;
    if (dt < 0 || dt > dur) return null;
    const u = dt / dur;
    const R = ev.big ? 1.6 : 1;
    const dirv = ev.dir ?? 1;
    return (
      <g transform={`translate(${x} ${y})`}>
        <g opacity={Math.pow(1 - u, 1.5)} fill="#fff">
          <circle r={(40 + 260 * (1 - Math.pow(1 - u, 3))) * R} opacity={0.9 * (1 - u)} />
        </g>
        <g fill={ev.col || "#ffe9a8"} opacity={clamp(1.2 - u * 1.6)} transform={`rotate(${random(seed) * 90})`}>
          <g transform={`scale(${(0.5 + u * 1.4) * R})`}>
            <Star r={170} seed={seed} />
          </g>
        </g>
        <circle r={(30 + 470 * (1 - Math.pow(1 - u, 3))) * R} fill="none" stroke={ev.col || "#fff"} strokeWidth={Math.max(1, 18 * (1 - u) * R)} opacity={1 - u} />
        {Array.from({ length: ev.big ? 26 : 14 }).map((_, i) => {
          const a = (random(seed + "a" + i) - 0.5) * 3.2 + (dirv > 0 ? -Math.PI / 2 + 0.2 : -Math.PI / 2 - 0.2);
          const sp = 380 + random(seed + "s" + i) * 760;
          const px = Math.cos(a) * sp * dt * 1.1;
          const py = Math.sin(a) * sp * dt + 900 * dt * dt;
          return <rect key={i} x={px} y={py} width={5 + random(seed + "w" + i) * 12} height={3 + random(seed + "h" + i) * 5} fill={i % 3 ? "#ffd27a" : "#fff"} opacity={1 - u} transform={`rotate(${random(seed + "r" + i) * 360 + dt * 500} ${px} ${py})`} />;
        })}
      </g>
    );
  }
  if (ev.k === "slash") {
    const dur = ev.dur ?? 0.38;
    if (dt < 0 || dt > dur) return null;
    const u = dt / dur;
    const r = ev.r ?? 300;
    const sweep = ev.sweep ?? 140;
    const a0 = -sweep / 2 * D, a1 = sweep / 2 * D;
    const o = (rr: number, a: number): [number, number] => [Math.cos(a) * rr, Math.sin(a) * rr];
    const p0 = o(r, a0), p1 = o(r, a1), q0 = o(r * 0.78, a0 * 0.8), q1 = o(r * 0.78, a1 * 0.8);
    const reveal = clamp(u * 3.5);
    const fade = clamp(1.4 - u * 1.4);
    const col = ev.col || "#ffffff";
    return (
      <g transform={`translate(${x} ${y}) rotate(${ev.rot ?? 0}) scale(${ev.flip ? -1 : 1} 1)`} opacity={fade} filter="url(#glow)">
        <path d={`M${p0[0]} ${p0[1]}A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}A${r * 0.78} ${r * 0.78} 0 0 0 ${q0[0]} ${q0[1]}Z`} fill={col} opacity={0.5} style={{ clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)` }} />
        <path d={`M${p0[0]} ${p0[1]}A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`} fill="none" stroke={col} strokeWidth={9 * (1 - u * 0.6)} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - reveal * 100} />
      </g>
    );
  }
  if (ev.k === "wave") {
    const t0 = ev.t, t1 = ev.t1 ?? ev.t + 1;
    if (t < t0 || t > t1 + 0.35) return null;
    const u = clamp((t - t0) / (t1 - t0));
    const px = lerpN(ev.x ?? 0, ev.x1 ?? 0, u);
    const fl = ev.flip ? -1 : 1;
    const fade = t > t1 ? 1 - (t - t1) / 0.35 : 1;
    return (
      <g transform={`translate(${px} ${y}) scale(${fl} 1)`} opacity={fade} filter="url(#glow)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse key={i} cx={-i * 55 - 20} cy={((random("wv" + i) - 0.5) * 70) + Math.sin(t * 20 + i) * 8} rx={80 - i * 8} ry={26} fill="#7b2dff" opacity={0.5 - i * 0.07} />
        ))}
        <path d="M-40 -190 Q150 -120 160 0 Q150 120 -40 190 Q60 80 60 0 Q60 -80 -40 -190Z" fill="#2a0a55" stroke="#d9b3ff" strokeWidth={9} />
      </g>
    );
  }
  if (ev.k === "bolt") {
    const t0 = ev.t, t1 = ev.t1 ?? ev.t + 0.4;
    if (t < t0 || t > t1) return null;
    const sd = "bo" + Math.floor(frame / 2) + ev.t;
    return (
      <g filter="url(#glow)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[0, 1, 2].map((i) => {
          const a: [number, number] = [x + (random(sd + "p" + i) - 0.5) * (ev.spread ?? 160), y - (ev.h ?? 900)];
          const b: [number, number] = [x + (random(sd + "q" + i) - 0.5) * 70, y];
          const d = boltPath(sd + i, a, b, 12, 120);
          return (
            <g key={i}>
              <path d={d} stroke="#4fd7ff" strokeWidth={22} opacity={0.35} />
              <path d={d} stroke="#ffffff" strokeWidth={6} />
            </g>
          );
        })}
      </g>
    );
  }
  if (ev.k === "ring") {
    if (dt < 0 || dt > (ev.dur ?? 1.2)) return null;
    const u = dt / (ev.dur ?? 1.2);
    return (
      <g transform={`translate(${x} ${y})`}>
        <ellipse rx={(ev.r ?? 900) * (1 - Math.pow(1 - u, 3))} ry={(ev.r ?? 900) * (1 - Math.pow(1 - u, 3)) * 0.22} fill="none" stroke={ev.col || "#fff"} strokeWidth={26 * (1 - u)} opacity={1 - u} />
      </g>
    );
  }
  if (ev.k === "crack") {
    if (dt < 0) return null;
    const u = clamp(dt / 0.35);
    const fade = clamp(1 - (dt - 6) / 3);
    return (
      <g stroke="#07070d" strokeWidth={7} fill="none" strokeLinecap="round" opacity={fade}>
        {Array.from({ length: 9 }).map((_, i) => {
          const dx = (random("ck" + ev.t + i) - 0.5) * 900;
          const dy = 20 + random("cy" + ev.t + i) * 150;
          const mx = dx * 0.5 + (random("cm" + i) - 0.5) * 60;
          return <path key={i} d={`M${x} ${GY + 8}L${x + mx * u} ${GY + 8 + dy * 0.5 * u}L${x + dx * u} ${GY + 8 + dy * u}`} />;
        })}
      </g>
    );
  }
  if (ev.k === "dust") {
    if (dt < 0 || dt > 1.1) return null;
    const u = dt / 1.1;
    return (
      <g transform={`translate(${x} ${GY})`} fill="#b9a2a2">
        {Array.from({ length: 9 }).map((_, i) => {
          const dxx = (random("du" + ev.t + i) - 0.5) * 360 * (0.4 + u);
          return <circle key={i} cx={dxx} cy={-20 - u * 70 * random("dy" + i)} r={20 + u * 50} opacity={0.4 * (1 - u)} />;
        })}
      </g>
    );
  }
  if (ev.k === "aura") {
    const t0 = ev.t, t1 = ev.t1 ?? ev.t + 3;
    if (t < t0 || t > t1) return null;
    const fade = Math.min(clamp((t - t0) / 0.8), clamp((t1 - t) / 0.8));
    return (
      <g opacity={fade} filter="url(#glow)">
        <ellipse cx={x} cy={GY + 4} rx={220 + Math.sin(t * 6) * 18} ry={34} fill="#7b2dff" opacity={0.5} />
        {Array.from({ length: 16 }).map((_, i) => {
          const ph = (t * (0.7 + random("a" + i) * 0.5) + random("ap" + i)) % 1;
          const bx = x + (random("ax" + i) - 0.5) * 240;
          const by = GY - ph * (480 + random("ah" + i) * 220);
          const rr = (32 + random("ar" + i) * 38) * (1 - ph * 0.8);
          return <path key={i} d={`M${bx - rr} ${by + rr} Q${bx - rr * 0.6} ${by - rr * 1.6} ${bx} ${by - rr * 2.6} Q${bx + rr * 0.6} ${by - rr * 1.2} ${bx + rr} ${by + rr}Z`} fill={i % 3 ? "#7b2dff" : "#ff6a2a"} opacity={0.65 * (1 - ph)} />;
        })}
      </g>
    );
  }
  if (ev.k === "text") {
    const dur = ev.dur ?? 0.8;
    if (dt < 0 || dt > dur) return null;
    const u = dt / dur;
    const pop = u < 0.18 ? lerpN(0.4, 1.25, u / 0.18) : lerpN(1.25, 1, clamp((u - 0.18) / 0.2));
    return (
      <g transform={`translate(${x} ${y}) rotate(${ev.rot ?? -8}) scale(${pop})`} opacity={clamp(1.5 - u * 1.5)}>
        <text textAnchor="middle" fontFamily={KANIT} fontWeight={900} fontSize={ev.size ?? 150} fill={ev.col || "#fff"} stroke="#07070d" strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">
          {ev.str}
        </text>
      </g>
    );
  }
  return null;
};

const Eyes: React.FC<{ who: Who; u: number; t: number }> = ({ who, u, t }) => {
  const col = who === "H" ? "#4fd7ff" : "#ff6a2a";
  const bg = who === "H" ? ["#0a1424", "#1b3a6a"] : ["#160a1c", "#52161b"];
  const sc = 1 + u * 0.18;
  const blink = Math.abs(((t * 0.45) % 1) - 0.5) < 0.012 ? 0.1 : 1;
  const pr = who === "H" ? 62 - u * 12 : 54 + Math.sin(t * 5) * 3;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${bg[0]}, ${bg[1]})` }}>
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`}>
        <g transform={`translate(960 540) scale(${sc})`}>
          {Array.from({ length: 22 }).map((_, i) => (
            <line key={i} x1={-1200} x2={1200} y1={-500 + i * 46} y2={-500 + i * 46 + 20} stroke="#fff" strokeWidth={2} opacity={0.05 + 0.07 * random("el" + i)} transform={`translate(${((t * 600 * (0.4 + random("es" + i))) % 2400) - 1200} 0)`} />
          ))}
          <g transform={`scale(1 ${blink})`}>
            <path d="M-520 20 Q-250 -210 40 -150 Q420 -100 560 -10 Q250 130 -30 120 Q-340 120 -520 20Z" fill="#f4eee9" stroke="#07070d" strokeWidth={14} />
            <circle cx={30} cy={-8} r={118} fill={col} stroke="#07070d" strokeWidth={10} />
            <circle cx={30} cy={-8} r={118} fill="none" stroke="#fff" strokeWidth={4} opacity={0.35} />
            <circle cx={30} cy={-8} r={pr} fill="#07070d" />
            <circle cx={-12} cy={-52} r={26} fill="#fff" />
            <circle cx={78} cy={26} r={11} fill="#fff" opacity={0.9} />
            <path d="M-560 -30 Q-250 -270 60 -200 Q450 -150 640 -40" fill="none" stroke="#07070d" strokeWidth={26} strokeLinecap="round" />
            {who === "V" ? <path d="M-130 -290 L-60 150" stroke="#07070d" strokeWidth={12} opacity={0.7} /> : null}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
// ตัวประกอบหลัก
// ---------------------------------------------------------------------
export const FightShort: React.FC = () => {
  useKanit();
  const frame = useCurrentFrame();
  const t = frame / FIGHT_FPS;
  const cam = camAt(t);

  // สั่นจอ
  let shx = 0, shy = 0;
  for (const e of EVENTS) {
    if (e.k === "hit" || e.k === "shake") {
      const dt = t - e.t;
      if (dt >= 0 && dt < 1) {
        const amp = (e.k === "shake" ? e.amp ?? 30 : e.big ? 34 : 14) * Math.exp(-dt * 8);
        shx += Math.sin(dt * 90) * amp;
        shy += Math.cos(dt * 77) * amp * 0.7;
      }
    }
  }
  const camT = `translate(${W / 2 + shx} ${HGT / 2 + shy}) rotate(${cam.r}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`;

  // ฉากตาใกล้ๆ
  const eyeEv = EVENTS.find((e) => e.k === "eyes" && t >= e.t && t < (e.t1 as number));
  // แฟลช/หรี่จอ
  let flash = 0, flashCol = "#fff", dim = 0, dimCol = "#000";
  for (const e of EVENTS) {
    if (e.k === "flash") {
      const dt = t - e.t;
      if (dt >= 0 && dt < (e.dur ?? 0.4)) {
        const v = e.hold ? (dt < e.hold ? 1 : 1 - (dt - e.hold) / ((e.dur ?? 0.4) - e.hold)) : 1 - dt / (e.dur ?? 0.4);
        if (v > flash) { flash = v; flashCol = e.col || "#fff"; }
      }
    }
    if (e.k === "dim") {
      const a = e.t, b = e.t1 as number;
      if (t >= a && t <= b) {
        const v = Math.min(clamp((t - a) / 0.6), clamp((b - t) / 0.6)) * (e.amp ?? 0.5);
        if (v > dim) { dim = v; dimCol = e.col || "#000"; }
      }
    }
  }
  // เส้นความเร็ว
  const speedEv = EVENTS.filter((e) => e.k === "speed" && t >= e.t && t <= (e.t1 as number));
  // ภาพตามหลังตอนพุ่ง
  const dashing = EVENTS.filter((e) => e.k === "dash" && t >= e.t && t <= (e.t1 as number) + 0.25);

  const sceneProps = { t, frame };
  const van = EVENTS.find((e) => e.k === "vanish");
  const vOp = van ? 1 - clamp((t - van.t) / ((van.t1 as number) - van.t)) : 1;

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {/* เสียง */}
      {SFX.map((s, i) => (
        <Sequence key={i} from={Math.round(s.t * FIGHT_FPS)} durationInFrames={Math.round((s.len ?? 3) * FIGHT_FPS)}>
          <Audio src={staticFile(`sfx/${s.n}.wav`)} volume={s.v ?? 0.8} />
        </Sequence>
      ))}

      {eyeEv ? (
        <Eyes who={(eyeEv.who as Who) || "H"} u={(t - eyeEv.t) / ((eyeEv.t1 as number) - eyeEv.t)} t={t} />
      ) : (
        <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="9" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="vig" cx="50%" cy="50%" r="72%">
              <stop offset="0.55" stopColor="#000" stopOpacity={0} />
              <stop offset="1" stopColor="#000" stopOpacity={0.62} />
            </radialGradient>
          </defs>
          <Sky t={t} cam={cam} />
          <g transform={camT}>
            <Ground />
            {/* เสาหินพัง */}
            {[-380, 260, 1700, 2300].map((px, i) => (
              <g key={i} fill="#1c1322" stroke="#07070d" strokeWidth={4}>
                <rect x={px} y={GY - 360 + (i % 2) * 90} width={90} height={360 - (i % 2) * 90} />
                <rect x={px - 14} y={GY - 380 + (i % 2) * 90} width={118} height={26} />
              </g>
            ))}
            {EVENTS.filter((e) => ["crack", "dust", "ring"].includes(e.k)).map((e, i) => (
              <Fx key={"g" + i} ev={e} t={t} frame={frame} />
            ))}
            {dashing.map((e) =>
              [0.05, 0.1, 0.15].map((d, j) => <Fighter key={e.t + "g" + j} who={(e.who as Who) || "H"} t={t - d} frame={frame} ghost={0.38 - j * 0.1} tint={(e.who as Who) === "V" ? "hue-rotate(40deg) brightness(1.4)" : "hue-rotate(-20deg) brightness(1.8)"} />)
            )}
            <Fighter who="V" {...sceneProps} ghost={vOp} />
            <Fighter who="H" {...sceneProps} />
            {EVENTS.filter((e) => !["crack", "dust", "ring"].includes(e.k)).map((e, i) => (
              <Fx key={"f" + i} ev={e} t={t} frame={frame} />
            ))}
          </g>
          {/* ผงฝุ่น/กลีบซากุระ/ถ่านไฟ */}
          {Array.from({ length: 46 }).map((_, i) => {
            const sp = 60 + random("ps" + i) * 160;
            const px = (((random("px" + i) * 2600 - t * sp * 1.2) % 2400) + 2400) % 2400 - 240;
            const py = ((random("py" + i) * 1500 + t * (30 + random("pv" + i) * 70)) % 1250) - 100;
            const emb = t > 28 && t < 105;
            return <ellipse key={i} cx={px} cy={py + Math.sin(t * 2 + i) * 20} rx={emb ? 4 : 9} ry={emb ? 4 : 5} fill={emb ? (i % 2 ? "#ff8a3a" : "#c58bff") : "#ffb8cf"} opacity={emb ? 0.7 : 0.8} transform={`rotate(${t * 80 + i * 40} ${px} ${py})`} />;
          })}
          {/* เส้นความเร็ว */}
          {speedEv.map((e, k) => {
            const u = (t - e.t) / ((e.t1 as number) - e.t);
            const a = Math.min(clamp(u * 6), clamp((1 - u) * 6));
            const fx0 = e.fx ?? 960, fy0 = e.fy ?? 540;
            return (
              <g key={k} stroke="#fff" strokeLinecap="round" opacity={a * (e.amp ?? 0.7)}>
                {Array.from({ length: 56 }).map((_, i) => {
                  const ang = random("sl" + i + Math.floor(frame / 2)) * Math.PI * 2;
                  const r0 = 330 + random("sr" + i + Math.floor(frame / 3)) * 330;
                  const r1 = r0 + 420 + random("sq" + i + Math.floor(frame / 2)) * 600;
                  return <line key={i} x1={fx0 + Math.cos(ang) * r0} y1={fy0 + Math.sin(ang) * r0} x2={fx0 + Math.cos(ang) * r1} y2={fy0 + Math.sin(ang) * r1} strokeWidth={2 + random("sw" + i) * 7} />;
                })}
              </g>
            );
          })}
          <rect width={W} height={HGT} fill="url(#vig)" />
        </svg>
      )}

      {dim > 0 ? <AbsoluteFill style={{ background: dimCol, opacity: dim }} /> : null}
      {flash > 0 ? <AbsoluteFill style={{ background: flashCol, opacity: flash }} /> : null}

      {/* แถบจอหนัง */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 78, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 78, background: "#000" }} />

      {/* ชื่อเรื่อง / เครดิต */}
      {EVENTS.filter((e) => e.k === "title").map((e, i) => {
        if (t < e.t || t > (e.t1 as number)) return null;
        const u = (t - e.t) / ((e.t1 as number) - e.t);
        const a = Math.min(clamp(u * 5), clamp((1 - u) * 5));
        return (
          <AbsoluteFill key={i} style={{ alignItems: "center", justifyContent: "center", opacity: a }}>
            <div style={{ textAlign: "center", transform: `scale(${1 + u * 0.05})`, textShadow: "0 6px 30px #000" }}>
              <div style={{ fontFamily: KANIT, fontWeight: 900, fontSize: e.size ?? 150, color: "#fff", letterSpacing: 6 }}>{e.str}</div>
              {e.sub ? <div style={{ fontFamily: KANIT, fontWeight: 600, fontSize: 40, color: "#ffd9a8", marginTop: 12, whiteSpace: "pre-line", lineHeight: 1.5 }}>{e.sub}</div> : null}
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
