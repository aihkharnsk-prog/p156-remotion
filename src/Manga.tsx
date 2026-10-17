import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, Easing, random, useCurrentFrame, useVideoConfig } from "remotion";
import { useKanit, KANIT } from "./fonts";
import { Slide, slideFrames, COVER_FRAMES, DYN_FPS } from "./DynamicStory";

// =====================================================================
// MangaShow — รูปแบบคลิปใหม่ (16 ต.ค. 2026, AK: "รื้อระบบ ห้ามทำแบบเดิม")
// หน้ากระดาษมังงะ: ช่องภาพขอบหมึกดำเปิดทีละช่องตามเสียงพากย์, ช่องที่เล่าไปแล้วกลายเป็นขาวดำ,
// ใบประกาศจับ WANTED, หน้าใหญ่ (splash) เส้นความเร็ว, เปรียบเทียบสองการ์ด, ส่องข้อความบนการ์ด,
// เปลี่ยนหน้าแบบพลิกหน้าหนังสือ, ซับเล็กในกล่องบรรยายด้านล่าง
// =====================================================================

export type Panel = {
  img?: number; // 0 = image_url, 1.. = images[n-1]
  x?: number; // จุดกึ่งกลางที่จะโชว์ (% ของภาพ)
  y?: number;
  zoom?: number; // 1 = กว้างเท่าช่อง
  sfx?: string; // คำเสียงประกอบตัวใหญ่ เช่น "ตูม!"
  bw?: boolean; // ขาวดำตั้งแต่แรก
};
export type MangaPart = { text: string; audio_url?: string; duration: number; panel?: Panel };
export type Layout = "wanted" | "panels" | "splash" | "versus" | "effect" | "still";
export type MangaSlide = Slide & {
  layout?: Layout;
  title?: string;
  subtitle?: string;
  name?: string;
  bounty?: string;
  labels?: string[];
  parts?: MangaPart[];
};
export type MangaProps = {
  slides: MangaSlide[];
  audio_url?: string;
  audio_rate?: number;
  cover?: { image_url?: string; hook?: string; badge?: string; sub?: string };
  badge?: string;
  series?: string;
  accent_color?: string;
  width?: number;
  height?: number;
};

const W = 1080;
const H = 1920;
const INK = "#111014";
const PAPER = "#f4ecdb";
const C = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ez = (f: number, a: number, b: number, from = 0, to = 1, e: (t: number) => number = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], { ...C, easing: e });
const back = (s = 1.7) => Easing.out(Easing.back(s));
const CARD_AR = 1.397; // สูง/กว้างของการ์ดวันพีซ

const stroke = (px: number, c = INK) =>
  [`${-px}px ${-px}px 0 ${c}`, `${px}px ${-px}px 0 ${c}`, `${-px}px ${px}px 0 ${c}`, `${px}px ${px}px 0 ${c}`, `0 ${-px}px 0 ${c}`, `0 ${px}px 0 ${c}`, `${-px}px 0 0 ${c}`, `${px}px 0 0 ${c}`].join(", ");

const Rich: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <>
    {String(text)
      .split(/(\*[^*]+\*)/g)
      .filter(Boolean)
      .map((p, k) => (p.startsWith("*") && p.endsWith("*") ? <span key={k} style={{ color }}>{p.slice(1, -1)}</span> : <span key={k}>{p}</span>))}
  </>
);

const partStarts = (s: MangaSlide, fps: number) => {
  let acc = 0;
  return (s.parts || []).map((p) => {
    const st = acc;
    acc += Math.max(1, Math.round(Number(p.duration) * fps));
    return st;
  });
};
const activePart = (starts: number[], f: number) => {
  let k = 0;
  for (let i = 0; i < starts.length; i++) if (f >= starts[i]) k = i;
  return k;
};
const pickImg = (s: MangaSlide, i?: number) => (!i ? s.image_url : (s.images || [])[i - 1] || s.image_url);

// ---------------------------------------------------------------------
// กระดาษ: สีครีม + จุดสกรีนโทน + เส้นขอบหน้า
// ---------------------------------------------------------------------
const Paper: React.FC<{ tone?: string }> = ({ tone = "#d9cdb3" }) => (
  <AbsoluteFill style={{ background: PAPER }}>
    <AbsoluteFill style={{ backgroundImage: `radial-gradient(${tone} 2.2px, transparent 2.6px)`, backgroundSize: "18px 18px", opacity: 0.55 }} />
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(255,255,255,.0) 55%, rgba(80,60,30,.22) 100%)" }} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------
// ภาพในช่อง: ครอปจุดที่ต้องการ + กล้องค่อยๆ เลื่อน (ไม่มีขอบว่าง)
// ---------------------------------------------------------------------
const Crop: React.FC<{ src?: string; w: number; h: number; x?: number; y?: number; zoom?: number; f: number; d: number; bw?: number; ar?: number }> = ({ src, w, h, x = 50, y = 40, zoom = 1.6, f, d, bw = 0, ar = CARD_AR }) => {
  if (!src) return null;
  const minZ = Math.max(1, h / (w * ar));
  const z = Math.max(minZ, zoom) * interpolate(f, [0, Math.max(1, d)], [1, 1.09], C);
  const IW = w * z;
  const IH = IW * ar;
  const drift = interpolate(f, [0, Math.max(1, d)], [-1.5, 1.5], C);
  let left = w / 2 - ((x + drift) / 100) * IW;
  let top = h / 2 - (y / 100) * IH;
  left = Math.min(0, Math.max(w - IW, left));
  top = Math.min(0, Math.max(h - IH, top));
  return (
    <Img
      src={src}
      style={{ position: "absolute", left, top, width: IW, height: IH, maxWidth: "none", filter: bw > 0 ? `grayscale(${bw}) contrast(${1 + 0.25 * bw}) brightness(${1 + 0.05 * bw})` : undefined }}
    />
  );
};

// เส้นความเร็วแบบมังงะ (สีดำบนขอบ พุ่งเข้าหาจุดกลาง)
const SpeedLines: React.FC<{ w: number; h: number; cx: number; cy: number; f: number; n?: number; op?: number; color?: string }> = ({ w, h, cx, cy, f, n = 70, op = 1, color = INK }) => (
  <svg width={w} height={h} style={{ position: "absolute", inset: 0, opacity: op }}>
    {Array.from({ length: n }).map((_, i) => {
      const a = (i / n) * Math.PI * 2 + random(`sla${i}`) * 0.05;
      const jit = random(`slj${i}-${Math.floor(f / 2)}`);
      const r0 = Math.max(w, h) * (0.32 + 0.12 * jit);
      const r1 = Math.max(w, h) * 1.2;
      const wd = 0.012 + random(`slw${i}`) * 0.02;
      const p = (aa: number, r: number) => `${cx + Math.cos(aa) * r},${cy + Math.sin(aa) * r}`;
      return <polygon key={i} points={`${p(a, r0)} ${p(a - wd, r1)} ${p(a + wd, r1)}`} fill={color} />;
    })}
  </svg>
);

// คำเสียงประกอบตัวใหญ่ (ตัวหนา ขอบหนา เอียง เด้ง)
const Sfx: React.FC<{ text: string; f: number; x: number; y: number; size?: number; rot?: number; color?: string }> = ({ text, f, x, y, size = 150, rot = -10, color = "#fff" }) => {
  const s = ez(f, 0, 8, 2.2, 1, back(2.4));
  const shake = f < 10 ? (random(`sfx${f}`) - 0.5) * 14 : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s}) translateX(${shake}px)`, opacity: ez(f, 0, 3), fontFamily: KANIT, fontWeight: 900, fontSize: size, color, whiteSpace: "nowrap", textShadow: `${stroke(9)}, 14px 14px 0 ${INK}`, letterSpacing: 2 }}>
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------
// เลย์เอาต์: ช่องภาพเรียงลงทีละช่องตามท่อนเสียง
// ---------------------------------------------------------------------
type LP = { s: MangaSlide; f: number; d: number; starts: number[]; acc: string; idx: number };

const panelRects = (n: number, idx: number) => {
  // พื้นที่ 70..1590 แบ่งเป็นช่องเอียงสลับซ้ายขวา
  const top = 70;
  const bot = 1600;
  const gap = 26;
  const hh = (bot - top - gap * (n - 1)) / n;
  return Array.from({ length: n }).map((_, i) => {
    const y = top + i * (hh + gap);
    const slant = n > 1 ? ((i + idx) % 2 ? 40 : -40) : 0;
    return { x: 40, y, w: W - 80, h: hh, slant };
  });
};

const PanelsLayout: React.FC<LP> = ({ s, f, starts, acc, idx }) => {
  const parts = s.parts || [];
  const n = Math.max(1, Math.min(3, parts.length));
  const rects = panelRects(n, idx);
  const k = activePart(starts, f);
  return (
    <AbsoluteFill>
      {parts.slice(0, 3).map((pt, i) => {
        const r = rects[i];
        const st = starts[i] ?? 0;
        const lf = f - st;
        if (lf < -2) return null;
        const nextSt = starts[i + 1] ?? 1e9;
        const pdur = Math.max(1, (starts[i + 1] ?? starts[i] + 120) - st);
        const fromLeft = (i + idx) % 2 === 0;
        const t = ez(lf, 0, 10, 0, 1, Easing.out(Easing.exp));
        const pv = pt.panel || {};
        const past = Math.max(i < k ? ez(f, nextSt, nextSt + 10) : 0, pv.bw ? 1 : 0);
        const clip =
          r.slant === 0
            ? "polygon(0 0,100% 0,100% 100%,0 100%)"
            : r.slant > 0
            ? `polygon(0 0,100% 0,100% calc(100% - ${r.slant}px),0 100%)`
            : `polygon(0 0,100% 0,100% 100%,0 calc(100% - ${-r.slant}px))`;
        return (
          <div key={i} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, transform: `translateX(${(1 - t) * (fromLeft ? -1150 : 1150)}px) rotate(${(fromLeft ? -1 : 1) * 0.6}deg)` }}>
            <div style={{ position: "absolute", inset: 0, clipPath: clip, background: INK }}>
              <div style={{ position: "absolute", inset: 9, clipPath: clip, overflow: "hidden", background: "#fff" }}>
                <Crop src={pickImg(s, pv.img)} w={r.w - 18} h={r.h - 18} x={pv.x} y={pv.y} zoom={pv.zoom} f={lf} d={pdur + 60} bw={past} />
                {lf >= 0 && lf < 14 ? <SpeedLines w={r.w} h={r.h} cx={r.w / 2} cy={r.h / 2} f={lf} n={46} op={ez(lf, 0, 14, 0.9, 0)} color="#fff" /> : null}
              </div>
            </div>
            {pv.sfx && lf >= 4 ? <Sfx text={pv.sfx} f={lf - 4} x={fromLeft ? r.w - 230 : 230} y={r.h * 0.3} size={Math.min(170, r.h * 0.34)} rot={fromLeft ? 8 : -8} color={i === k ? acc : "#fff"} /> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// หน้าใหญ่: ภาพเต็มจอ + เส้นความเร็ว + ชื่อเรื่องตัวยักษ์
const SplashLayout: React.FC<LP> = ({ s, f, d, starts, acc }) => {
  const k = activePart(starts, f);
  const pv = (s.parts || [])[k]?.panel || (s.parts || [])[0]?.panel || {};
  const lines = String(s.title || "").split("\n");
  const kick = ez(f, 0, 14, 1.25, 1, Easing.out(Easing.exp));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", transform: `scale(${kick})` }}>
        <Crop src={pickImg(s, pv.img)} w={W} h={H} x={pv.x ?? 50} y={pv.y ?? 35} zoom={pv.zoom ?? 1.5} f={f} d={d} />
      </div>
      <SpeedLines w={W} h={H} cx={540} cy={760} f={f} n={90} op={0.85} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(244,236,219,0) 45%, rgba(244,236,219,.0) 60%, rgba(17,16,20,.55) 100%)" }} />
      <div style={{ position: "absolute", left: 50, right: 50, top: 1130, fontFamily: KANIT, fontWeight: 900, lineHeight: 1.02 }}>
        {lines.map((ln, i) => {
          const t = ez(f, 4 + i * 6, 14 + i * 6, 0, 1, back(2));
          const len = Array.from(ln.replace(/\*/g, "")).length || 1;
          return (
            <div key={i} style={{ fontSize: Math.min(150, 1700 / len), color: "#fff", textShadow: `${stroke(10)}, 16px 16px 0 ${INK}`, transform: `translateX(${(1 - t) * (i % 2 ? 900 : -900)}px) rotate(-4deg)`, textAlign: i % 2 ? "right" : "left" }}>
              <Rich text={ln} color={acc} />
            </div>
          );
        })}
      </div>
      {s.subtitle ? (
        <div style={{ position: "absolute", left: 60, top: 90, transform: `rotate(-3deg) scale(${ez(f, 10, 20, 0, 1, back(2))})` }}>
          <span style={{ display: "inline-block", padding: "8px 28px", background: INK, color: "#fff", fontFamily: KANIT, fontWeight: 800, fontSize: 46 }}>{s.subtitle}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ใบประกาศจับ
const WantedLayout: React.FC<LP> = ({ s, f, d, starts, acc }) => {
  const k = activePart(starts, f);
  const pv = (s.parts || [])[0]?.panel || {};
  const drop = ez(f, 0, 14, -1400, 0, back(1.2));
  const sway = Math.sin(f / 22) * 1.2;
  const num = String(s.bounty || "").replace(/[^0-9]/g, "");
  const target = Number(num) || 0;
  const cnt = ez(f, 12, Math.min(d * 0.6, 50), 0, 1, Easing.out(Easing.exp));
  const shown = target ? Math.round(target * cnt).toLocaleString("en-US") : s.bounty || "";
  const stampAt = starts.length > 1 ? starts[starts.length - 1] : Math.round(d * 0.55);
  const st = f - stampAt;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 90, top: 150, width: 900, height: 1360, transform: `translateY(${drop}px) rotate(${-2 + sway}deg)`, background: "#e9d4a6", boxShadow: "0 40px 80px rgba(0,0,0,.45)", border: `6px solid #8a6a3a` }}>
        <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,.25), transparent 40%), radial-gradient(circle at 80% 90%, rgba(120,80,30,.35), transparent 50%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 30, textAlign: "center", fontFamily: KANIT, fontWeight: 900, fontSize: 170, letterSpacing: 18, color: "#3b2a14", lineHeight: 1 }}>WANTED</div>
        <div style={{ position: "absolute", left: 70, right: 70, top: 230, height: 760, border: `8px solid #3b2a14`, overflow: "hidden", background: "#fff" }}>
          <Crop src={pickImg(s, pv.img)} w={744} h={744} x={pv.x ?? 50} y={pv.y ?? 33} zoom={pv.zoom ?? 1.7} f={f} d={d} bw={0.15} />
          <AbsoluteFill style={{ background: "rgba(150,100,40,.18)", mixBlendMode: "multiply" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1000, textAlign: "center", fontFamily: KANIT, fontWeight: 800, fontSize: 52, letterSpacing: 10, color: "#3b2a14" }}>DEAD OR ALIVE</div>
        <div style={{ position: "absolute", left: 20, right: 20, top: 1060, textAlign: "center", fontFamily: KANIT, fontWeight: 900, fontSize: Math.min(110, 1500 / Math.max(6, Array.from(s.name || "").length)), color: "#3b2a14", lineHeight: 1.1 }}>{s.name || ""}</div>
        {s.bounty ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 1195, textAlign: "center", fontFamily: KANIT, fontWeight: 900, fontSize: 92, color: "#3b2a14" }}>
            <span style={{ fontSize: 80, marginRight: 14 }}>฿</span>
            {shown}
            <span style={{ fontSize: 50, marginLeft: 10 }}>-</span>
          </div>
        ) : null}
      </div>
      {s.subtitle && st >= 0 ? (
        <div style={{ position: "absolute", left: 540, top: 820, transform: `translate(-50%,-50%) rotate(-14deg) scale(${ez(st, 0, 7, 3, 1, Easing.out(Easing.exp))})`, opacity: ez(st, 0, 4) }}>
          <div style={{ padding: "10px 40px", border: `12px solid ${acc}`, color: acc, fontFamily: KANIT, fontWeight: 900, fontSize: 110, background: "rgba(255,255,255,.55)", borderRadius: 18, whiteSpace: "nowrap" }}>{s.subtitle}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// เปรียบเทียบสองภาพ แบ่งจอเฉียง
const VersusLayout: React.FC<LP> = ({ s, f, d, starts, acc }) => {
  const a = s.image_url;
  const b = (s.images || [])[0] || s.image_url;
  const ta = ez(f, 0, 12, 0, 1, Easing.out(Easing.exp));
  const tb = ez(f, starts[1] ?? 10, (starts[1] ?? 10) + 12, 0, 1, Easing.out(Easing.exp));
  const labels = s.labels || [];
  const card = (src: string | undefined, w: number) => (src ? <Img src={src} style={{ width: w, height: w * CARD_AR, display: "block", border: `8px solid ${INK}`, boxShadow: `14px 14px 0 ${INK}` }} /> : null);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, background: INK, clipPath: "polygon(0 0,100% 0,100% 44%,0 56%)", opacity: 0.08 }} />
      <div style={{ position: "absolute", left: 70, top: 130, transform: `translateX(${(1 - ta) * -900}px) rotate(-5deg)` }}>
        {card(a, 470)}
        {labels[0] ? <div style={{ marginTop: 36, fontFamily: KANIT, fontWeight: 900, fontSize: 58, color: INK }}>{labels[0]}</div> : null}
      </div>
      <div style={{ position: "absolute", right: 70, top: 640, transform: `translateX(${(1 - tb) * 900}px) rotate(5deg)`, textAlign: "right" }}>
        {card(b, 470)}
        {labels[1] ? <div style={{ marginTop: 36, fontFamily: KANIT, fontWeight: 900, fontSize: 58, color: acc }}>{labels[1]}</div> : null}
      </div>
      {f >= (starts[1] ?? 10) + 8 ? <Sfx text="VS" f={f - (starts[1] ?? 10) - 8} x={540} y={760} size={220} rot={-12} color={acc} /> : null}
    </AbsoluteFill>
  );
};

// ส่องข้อความบนการ์ด: การ์ดเต็ม + ช่องขยายลอยพร้อมลูกศรหมึก
const EffectLayout: React.FC<LP> = ({ s, f, d, starts, acc }) => {
  const k = activePart(starts, f);
  const pv = (s.parts || [])[k]?.panel || {};
  const cw = 760;
  const ch = cw * CARD_AR;
  const left = 160;
  const top = 80;
  const fx = left + ((pv.x ?? 50) / 100) * cw;
  const fy = top + ((pv.y ?? 70) / 100) * ch;
  const lf = f - (starts[k] ?? 0);
  const t = ez(lf, 0, 12, 0, 1, back(1.4));
  const bw = 940;
  const bh = 420;
  const by = fy > top + ch * 0.55 ? 120 : 1150;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left, top, transform: `rotate(-2deg)` }}>
        {s.image_url ? <Img src={s.image_url} style={{ width: cw, height: ch, display: "block", border: `8px solid ${INK}`, filter: `grayscale(${0.6 * t})` }} /> : null}
      </div>
      <div style={{ position: "absolute", left: fx - 150, top: fy - 70, width: 300, height: 140, border: `10px solid ${acc}`, borderRadius: 18, opacity: t, transform: `scale(${0.6 + 0.4 * t})` }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: t }}>
        <line x1={fx} y1={by > fy ? fy + 70 : fy - 70} x2={540} y2={by > fy ? by : by + bh} stroke={INK} strokeWidth={10} />
      </svg>
      <div style={{ position: "absolute", left: 70, top: by, width: bw, height: bh, background: INK, transform: `scale(${t})`, opacity: t }}>
        <div style={{ position: "absolute", inset: 10, overflow: "hidden", background: "#fff" }}>
          <Crop src={pickImg(s, pv.img)} w={bw - 20} h={bh - 20} x={pv.x ?? 50} y={pv.y ?? 70} zoom={pv.zoom ?? 2.4} f={lf} d={90} />
        </div>
      </div>
      {s.title ? (
        <div style={{ position: "absolute", left: 60, right: 60, top: by === 120 ? 570 : 1590, textAlign: "center", transform: `rotate(-2deg) scale(${ez(f, 8, 18, 0, 1, back(2))})` }}>
          <span style={{ display: "inline-block", padding: "6px 30px", background: acc, color: "#fff", fontFamily: KANIT, fontWeight: 900, fontSize: 60, border: `6px solid ${INK}`, textShadow: stroke(3) }}>{s.title}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const StillLayout: React.FC<LP> = ({ s, f, d }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    {s.image_url ? <Img src={s.image_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", transform: `scale(${interpolate(f, [0, d], [1, 1.03], C)})` }} /> : null}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------
// ซับเล็กด้านล่างแบบกล่องบรรยายมังงะ
// ---------------------------------------------------------------------
const Narration: React.FC<{ s: MangaSlide; f: number; starts: number[]; acc: string }> = ({ s, f, starts, acc }) => {
  if (s.no_caption) return null;
  const k = activePart(starts, f);
  const text = s.parts && s.parts.length ? s.parts[k].text : s.text || "";
  if (!text) return null;
  const lf = f - (starts[k] ?? 0);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, bottom: 120, display: "flex", justifyContent: "center", opacity: ez(lf, 0, 4), transform: `translateY(${ez(lf, 0, 8, 30, 0)}px)` }}>
      <div style={{ padding: "12px 28px", background: "#fff", border: `5px solid ${INK}`, boxShadow: `8px 8px 0 ${INK}`, fontFamily: KANIT, fontWeight: 700, fontSize: 44, lineHeight: 1.35, color: INK, textAlign: "center", transform: "rotate(-0.8deg)" }}>
        <Rich text={text} color={acc} />
      </div>
    </div>
  );
};

// ป้ายเลขการ์ดมุมบน (เล็ก ไม่มีแถบความคืบหน้า)
const Tag: React.FC<{ badge?: string; series?: string; page: number; pages: number }> = ({ badge, series, page, pages }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", right: 0, top: 1640, display: "flex", alignItems: "center", gap: 0, fontFamily: KANIT }}>
      {series ? <span style={{ padding: "4px 18px", background: PAPER, color: INK, fontWeight: 800, fontSize: 30, border: `4px solid ${INK}`, borderRight: "none" }}>{series}</span> : null}
      {badge ? <span style={{ padding: "4px 20px", background: INK, color: "#fff", fontWeight: 900, fontSize: 34, border: `4px solid ${INK}` }}>{badge}</span> : null}
    </div>
    <div style={{ position: "absolute", left: 40, top: 1650, fontFamily: KANIT, fontWeight: 800, fontSize: 30, color: INK, opacity: 0.6 }}>{`${page} / ${pages}`}</div>
  </AbsoluteFill>
);

// เปลี่ยนหน้า: หน้าใหม่พลิกเข้ามาจากขวา (เงาตามขอบ)
const PageTurn: React.FC<{ f: number; first: boolean; children: React.ReactNode }> = ({ f, first, children }) => {
  if (first) return <AbsoluteFill>{children}</AbsoluteFill>;
  const t = ez(f, 0, 13, 0, 1, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{ perspective: 2400 }}>
      <AbsoluteFill style={{ transformOrigin: "0% 50%", transform: `rotateY(${(1 - t) * -95}deg)`, boxShadow: t < 1 ? `-40px 0 80px rgba(0,0,0,${0.5 * (1 - t)})` : undefined }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const PageView: React.FC<{ s: MangaSlide; idx: number; acc: string; pages: number; badge?: string; series?: string }> = ({ s, idx, acc, pages, badge, series }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = slideFrames(s);
  const starts = partStarts(s, fps);
  const layout: Layout = s.layout || (s.image_mode === "still" ? "still" : "panels");
  const p: LP = { s, f, d, starts, acc, idx };
  const body =
    layout === "wanted" ? <WantedLayout {...p} /> :
    layout === "splash" ? <SplashLayout {...p} /> :
    layout === "versus" ? <VersusLayout {...p} /> :
    layout === "effect" ? <EffectLayout {...p} /> :
    layout === "still" ? <StillLayout {...p} /> :
    <PanelsLayout {...p} />;
  return (
    <PageTurn f={f} first={idx === 0}>
      {layout === "still" ? null : <Paper />}
      {body}
      {layout === "still" ? null : <Tag badge={badge} series={series} page={idx + 1} pages={pages} />}
      <Narration s={s} f={f} starts={starts} acc={acc} />
    </PageTurn>
  );
};

// ปก (0.5 วินาทีแรก = ภาพปก Shorts): หน้าใหญ่ + คำโปรยตัวยักษ์
const MangaCover: React.FC<{ image_url?: string; hook?: string; badge?: string; acc: string }> = ({ image_url, hook, badge, acc }) => {
  const f = useCurrentFrame();
  const lines = String(hook || "").split("\n");
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Crop src={image_url} w={W} h={H} x={50} y={34} zoom={1.55} f={f} d={30} />
      </div>
      <SpeedLines w={W} h={H} cx={540} cy={700} f={0} n={90} op={0.8} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 1120, fontFamily: KANIT, fontWeight: 900, lineHeight: 1.0 }}>
        {lines.map((ln, i) => {
          const len = Array.from(ln).length || 1;
          return (
            <div key={i} style={{ fontSize: Math.min(190, 1800 / len), color: i % 2 ? acc : "#fff", textShadow: `${stroke(11)}, 18px 18px 0 ${INK}`, transform: "rotate(-4deg)", textAlign: i % 2 ? "right" : "left" }}>
              {ln}
            </div>
          );
        })}
      </div>
      {badge ? (
        <div style={{ position: "absolute", left: 50, top: 90, transform: "rotate(-3deg)" }}>
          <span style={{ display: "inline-block", padding: "6px 26px", background: INK, color: "#fff", fontFamily: KANIT, fontWeight: 900, fontSize: 56 }}>{badge}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const MangaShow: React.FC<MangaProps> = ({ slides, audio_url, audio_rate, cover, badge, series, accent_color }) => {
  useKanit();
  const acc = accent_color || "#e2231a";
  const off = cover ? COVER_FRAMES : 0;
  const starts: number[] = [];
  let a = 0;
  for (const s of slides) {
    starts.push(a);
    a += slideFrames(s);
  }
  const pages = slides.filter((s) => (s.layout || "") !== "still" && s.image_mode !== "still").length;
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      {cover ? (
        <Sequence from={0} durationInFrames={COVER_FRAMES}>
          <MangaCover image_url={cover.image_url} hook={cover.hook} badge={cover.badge} acc={acc} />
        </Sequence>
      ) : null}
      <Sequence from={off}>
        {slides.map((s, i) => (
          <Sequence key={i} from={starts[i]} durationInFrames={slideFrames(s)}>
            <PageView s={s} idx={i} acc={acc} pages={pages} badge={badge} series={series} />
            {s.audio_url ? <Audio src={s.audio_url} playbackRate={audio_rate || 1} /> : null}
            {s.parts
              ? (() => {
                  let t = 0;
                  return s.parts.map((pt, k) => {
                    const from = t;
                    t += Math.max(1, Math.round(Number(pt.duration) * DYN_FPS));
                    return pt.audio_url ? (
                      <Sequence key={k} from={from}>
                        <Audio src={pt.audio_url} playbackRate={audio_rate || 1} />
                      </Sequence>
                    ) : null;
                  });
                })()
              : null}
          </Sequence>
        ))}
        {audio_url ? <Audio src={audio_url} /> : null}
      </Sequence>
    </AbsoluteFill>
  );
};
