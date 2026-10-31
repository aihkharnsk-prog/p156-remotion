import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  Easing,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useKanit, FRIEND } from "./fonts";
import { Slide, slideFrames, COVER_FRAMES, DYN_FPS } from "./DynamicStory";
import { Thumb, ThumbProps } from "./Thumb";
import { CoinScene, EvolveScene, VersionsScene, SpriteScene } from "./Scenes";
import { PixelFridge } from "./Pixel";

// =====================================================================
// CardShow — รูปแบบคลิปใหม่ (แอนิเมชันเต็มรูปแบบ)
// แต่ละสไลด์คือ "บีต" ที่มีแม่แบบแอนิเมชันของตัวเอง + ทรานซิชันระหว่างบีต
// ธีมสี/อนุภาคเปลี่ยนตามธาตุของการ์ด เพื่อให้แต่ละคลิปไม่ซ้ำกัน
// =====================================================================

export type Beat =
  | "hook"
  | "reveal"
  | "card"
  | "name"
  | "stats"
  | "bignum"
  | "quiz"
  | "zoom"
  | "timeline"
  | "art"
  | "still"
  | "coin"
  | "evolve"
  | "versions"
  | "sprite"
  | "full"
  | "rank"
  | "pixel"
  | "vec"
  | "v_toilet"
  | "v_ac"
  | "v_wash"
  | "v_micro"
  | "v_rice"
  | "v_kettle"
  | "v_shower"
  | "v_smoke"
  | "v_hairdryer"
  | "v_induction"
  | "v_toaster"
  | "v_airfryer"
  | "v_fan"
  | "v_vacuum"
  | "v_led"
  | "v_breaker"
  | "v_pump"
  | "v_flask"
  | "v_mic"
  | "v_chopper"
  | "v_solar"
  | "v_tapfilter"
  | "v_iron";

export type Transition = "wipe" | "zoom" | "flash" | "slide" | "shutter" | "none";

export type ShowSlide = Slide & {
  beat?: Beat;
  title?: string; // ข้อความหลักของบีต (ใช้ \n ขึ้นบรรทัด, *คำ* = เน้นสี)
  subtitle?: string;
  chapter?: string; // ป้ายหัวข้อเล็กๆ ด้านบน
  chips?: { big: string; small?: string }[]; // บีต name: แยกชื่อเป็นส่วนๆ
  stats?: { label: string; value: number; max?: number; suffix?: string }[]; // บีต stats
  value?: number; // บีต bignum
  from?: number; // บีต bignum: เริ่มนับจาก
  choices?: string[]; // บีต quiz
  answer?: number; // บีต quiz: index ของคำตอบที่ถูก
  points?: { year: string; label: string }[]; // บีต timeline
  transition?: Transition;
  price?: string; // บีต full: ป้ายราคาแปะบนการ์ด เช่น "$16.49M"
  price_label?: string; // ข้อความเล็กเหนือราคา เช่น "ขายได้"
  rank?: string; // บีต rank: เลขอันดับใหญ่มุมซ้ายบน
  video_url?: string; // บีต full: วิดีโอพื้นหลัง (Pexels)
  pos?: string; // บีต rank: objectPosition เมื่อครอปภาพให้เต็มกรอบ
  fit?: "cover" | "contain"; // บีต full: ภาพเต็มจอ (cover) หรือพอดีภาพ (contain) บนพื้นเบลอ
};

export type ShowTheme = "fire" | "grass" | "water" | "electric" | "psychic" | "fighting" | "normal";

export type ShowProps = {
  slides: ShowSlide[];
  audio_url?: string;
  audio_rate?: number;
  fit_audio?: boolean;
  width?: number;
  height?: number;
  cover?: ThumbProps;
  theme?: ShowTheme;
  badge?: string; // เช่น "#16"
  series?: string; // เช่น "การ์ดชุดแรก 1996"
  // (รับไว้เพื่อให้ใช้สคริปต์ร่วมกับ DynamicStory ได้)
  caption_style?: string;
  caption_position?: string;
  caption_scale?: number;
  caption_bottom?: number;
  motion?: number;
  accent_color?: string;
};

type Pal = { a: string; b: string; bg1: string; bg2: string; ink: string; particle: "ember" | "leaf" | "bubble" | "spark" | "sparkle" };
const THEMES: Record<ShowTheme, Pal> = {
  fire: { a: "#ff7a45", b: "#ffe29a", bg1: "#e8643a", bg2: "#8f2d4f", ink: "#5a1d2e", particle: "ember" },
  grass: { a: "#34c47c", b: "#f4ffb0", bg1: "#3aa97a", bg2: "#1d5c78", ink: "#0f3d4a", particle: "leaf" },
  water: { a: "#4aa8ff", b: "#c9f4ff", bg1: "#4a8de0", bg2: "#3b4aa8", ink: "#1c2b6b", particle: "bubble" },
  electric: { a: "#ffb300", b: "#fff2b3", bg1: "#ff9f43", bg2: "#d9577a", ink: "#6b2a3d", particle: "spark" },
  psychic: { a: "#ff6fb1", b: "#e8d4ff", bg1: "#b565e0", bg2: "#5b3fb0", ink: "#3a1f7a", particle: "sparkle" },
  fighting: { a: "#ff8a4c", b: "#ffe9c4", bg1: "#e87a52", bg2: "#8a3d5e", ink: "#5a2236", particle: "ember" },
  normal: { a: "#ffa94d", b: "#fff1d6", bg1: "#7b6fd6", bg2: "#40308f", ink: "#2b2066", particle: "sparkle" },
};

const C = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ez = (f: number, a: number, b: number, from = 0, to = 1, e: (t: number) => number = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], { ...C, easing: e });
const back = (s = 1.7) => Easing.out(Easing.back(s));

const W = 1080;
const H = 1920;

const stroke = (px: number, _c = "#000") =>
  `0 ${Math.max(2, Math.round(px * 0.6))}px ${Math.round(px * 2.2 + 4)}px rgba(20,12,40,.55), 0 1px 2px rgba(20,12,40,.5)`;

// หัวข้อสไตล์สติกเกอร์: ตัวกลมหนา เติมสีเหลือง ขอบน้ำตาลเข้มหนา + เงาล่างให้ลอยขึ้น (ตามตัวอย่างที่ AK ชอบ)
const HEAD = (w = 14, c = "#4a2208"): React.CSSProperties =>
  ({
    WebkitTextStroke: `${w}px ${c}`,
    paintOrder: "stroke fill",
    strokeLinejoin: "round",
    textShadow: `0 ${Math.round(w * 0.6)}px 0 ${c}, 0 ${w}px ${w * 2}px rgba(40,18,0,.35)`,
  } as React.CSSProperties);

const partStarts = (s: ShowSlide, fps: number) => {
  let acc = 0;
  return (s.parts || []).map((p) => {
    const st = acc;
    acc += Math.max(1, Math.round(Number(p.duration) * fps));
    return st;
  });
};

// ข้อความที่มี *คำเน้น* → span สีธีม
const Rich: React.FC<{ text: string; color: string; scale?: number }> = ({ text, color, scale = 1 }) => (
  <>
    {String(text)
      .split(/(\*[^*]+\*)/g)
      .filter(Boolean)
      .map((part, k) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <span key={k} style={{ color, fontSize: `${scale}em` }}>
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={k}>{part}</span>
        )
      )}
  </>
);

// ---------------------------------------------------------------------
// ฉากพื้นหลังที่ขยับตลอดเวลา (ไล่สี + แถบเฉียงวิ่ง + วงแสงหมุน + อนุภาคตามธาตุ)
// ---------------------------------------------------------------------
const Stage: React.FC<{ pal: Pal }> = ({ pal }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${pal.bg1} 0%, ${pal.bg2} 100%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -300, top: 200 + Math.sin(f / 90) * 60, width: 1200, height: 1200, borderRadius: "50%", background: `radial-gradient(circle, ${pal.b}55 0%, ${pal.b}00 65%)` }} />
      <div style={{ position: "absolute", right: -400, bottom: -100 + Math.cos(f / 110) * 70, width: 1300, height: 1300, borderRadius: "50%", background: `radial-gradient(circle, ${pal.a}66 0%, ${pal.a}00 65%)` }} />
      {Array.from({ length: 14 }).map((_, k) => {
        const r = (t: string) => random(`bk-${t}-${k}`);
        const sz = 60 + r("s") * 160;
        const y = H + 200 - ((f * (0.5 + r("v") * 0.9) + r("p") * 2400) % (H + 400));
        const x = r("x") * W + Math.sin((f + r("p") * 400) / 70) * 30;
        return <div key={k} style={{ position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: "50%", background: "rgba(255,255,255,.10)" }} />;
      })}
    </AbsoluteFill>
  );
};

const Particles: React.FC<{ pal: Pal; f: number; n?: number; seed?: string }> = ({ pal, f, n = 26, seed = "p" }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: n }).map((_, k) => {
      const r = (s: string) => random(`${seed}-${s}-${k}`);
      const sp = 0.6 + r("sp") * 1.6;
      const ph = r("ph") * 3000;
      const x0 = r("x") * W;
      const sz = 8 + r("sz") * 22;
      if (pal.particle === "leaf") {
        const y = ((f * sp * 1.6 + ph) % (H + 200)) - 100;
        const x = x0 + Math.sin((f + ph) / 30) * 60;
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y, width: sz * 1.6, height: sz, borderRadius: "0 100% 0 100%", background: k % 2 ? pal.a : pal.b, opacity: 0.55, transform: `rotate(${(f * 3 + ph) % 360}deg)` }} />
        );
      }
      const y = H + 100 - ((f * sp * 2.2 + ph) % (H + 200));
      const x = x0 + Math.sin((f + ph) / 40) * 30;
      if (pal.particle === "bubble") {
        return <div key={k} style={{ position: "absolute", left: x, top: y, width: sz * 1.5, height: sz * 1.5, borderRadius: "50%", border: `3px solid ${pal.b}aa`, background: `radial-gradient(circle at 30% 30%, #ffffff66, transparent 60%)` }} />;
      }
      if (pal.particle === "spark") {
        const on = (Math.floor((f + ph) / 4) % 3) !== 0;
        return (
          <svg key={k} width={sz * 2} height={sz * 3} style={{ position: "absolute", left: x, top: y, opacity: on ? 0.9 : 0.15 }}>
            <polyline points={`${sz},0 ${sz * 0.4},${sz * 1.4} ${sz * 1.4},${sz * 1.5} ${sz * 0.7},${sz * 3}`} fill="none" stroke={pal.b} strokeWidth={4} strokeLinejoin="round" />
          </svg>
        );
      }
      if (pal.particle === "sparkle") {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin((f + ph) / 12));
        return (
          <svg key={k} width={sz * 2} height={sz * 2} style={{ position: "absolute", left: x, top: y, opacity: tw, transform: `scale(${tw})` }}>
            <path d={`M${sz} 0 Q${sz * 1.15} ${sz * 0.85} ${sz * 2} ${sz} Q${sz * 1.15} ${sz * 1.15} ${sz} ${sz * 2} Q${sz * 0.85} ${sz * 1.15} 0 ${sz} Q${sz * 0.85} ${sz * 0.85} ${sz} 0Z`} fill={pal.b} />
          </svg>
        );
      }
      // ember
      return <div key={k} style={{ position: "absolute", left: x, top: y, width: sz * 0.5, height: sz * 0.5, borderRadius: "50%", background: pal.b, boxShadow: `0 0 ${sz}px ${pal.a}, 0 0 ${sz * 2}px ${pal.a}`, opacity: 0.4 + 0.5 * Math.abs(Math.sin((f + ph) / 9)) }} />;
    })}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------
// ภาพการ์ดพร้อมแสงโฮโลวิ่งผ่าน
// ---------------------------------------------------------------------
const CardImg: React.FC<{ src?: string; w: number; f: number; glow?: string; radius?: number }> = ({ src, w, f, glow, radius = 22 }) =>
  src ? (
    <div style={{ position: "relative", width: w, height: w * 1.395, borderRadius: radius, overflow: "hidden", boxShadow: `0 40px 90px rgba(0,0,0,.7)${glow ? `, 0 0 70px ${glow}` : ""}` }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <div
        style={{
          position: "absolute", inset: -40,
          background: "linear-gradient(110deg, rgba(255,255,255,0) 38%, rgba(255,255,255,.45) 48%, rgba(180,230,255,.25) 52%, rgba(255,255,255,0) 62%)",
          transform: `translateX(${interpolate(f % 90, [0, 90], [-120, 120])}%)`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  ) : null;

// ---------------------------------------------------------------------
// บีตต่างๆ (ทุกตัวรับ f = เฟรมในบีต, d = ความยาวบีต)
// ---------------------------------------------------------------------
type BP = { s: ShowSlide; f: number; d: number; pal: Pal; starts: number[]; idx: number };

const HookBeat: React.FC<BP> = ({ s, f, d, pal }) => {
  const lines = String(s.title || "").split("\n");
  const slamAt = (i: number) => 3 + i * 7;
  const lastSlam = slamAt(lines.length - 1);
  const shake = lines.some((_, i) => f >= slamAt(i) && f < slamAt(i) + 6)
    ? { x: (random(`hx${f}`) - 0.5) * 8, y: (random(`hy${f}`) - 0.5) * 8 }
    : { x: 0, y: 0 };
  return (
    <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
      {s.image_url ? (
        <Img src={s.image_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(26px) brightness(.45) saturate(1.4)", transform: `scale(${1.2 + f * 0.004})` }} />
      ) : null}
      {/* เส้นความเร็ว */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.55 }}>
        <g transform={`translate(540 980) rotate(${f * 1.5})`}>
          {Array.from({ length: 40 }).map((_, i) => {
            const a = (i / 40) * Math.PI * 2;
            const r0 = 360 + random(`sl${i}`) * 220 + ((f * 18 + i * 37) % 200);
            return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * (r0 + 500)} y2={Math.sin(a) * (r0 + 500)} stroke={i % 3 ? "#ffffff" : pal.b} strokeWidth={4 + (i % 4) * 2} opacity={0.5} />;
          })}
        </g>
      </svg>
      {/* การ์ดเอียงลอยด้านล่าง */}
      <div style={{ position: "absolute", left: 540 - 240, top: 790 + Math.sin(f / 10) * 10, transform: `rotate(${-3 + Math.sin(f / 16) * 2}deg) scale(${ez(f, lastSlam, lastSlam + 14, 0.4, 1, back(1.5))})`, opacity: ez(f, lastSlam, lastSlam + 6) }}>
        <CardImg src={s.image_url} w={480} f={f} glow={pal.a} />
      </div>
      {/* ข้อความกระแทกทีละบรรทัด */}
      <div style={{ position: "absolute", left: 40, right: 40, top: 250, textAlign: "center", fontFamily: FRIEND, fontWeight: 900, lineHeight: 1.08 }}>
        {lines.map((ln, i) => {
          const t = f - slamAt(i);
          const sc = ez(t, 0, 7, 2.8, 1, back(2.2));
          const op = ez(t, 0, 3);
          const len = Array.from(ln.replace(/\*/g, "")).length || 1;
          const fs = Math.min(150, 940 / (len * 0.58));
          return (
            <div key={i} style={{ fontSize: fs, color: "#ffe14d", transform: `scale(${sc}) rotate(${i % 2 ? 2 : -2}deg)`, opacity: op, ...HEAD(16) }}>
              <Rich text={ln} color="#ffffff" />
            </div>
          );
        })}
      </div>
      {/* แฟลชตอนกระแทก */}
      <AbsoluteFill style={{ background: "#fff", opacity: lines.reduce((m, _, i) => Math.max(m, ez(f - slamAt(i), 0, 5, 0.12, 0)), 0) * (f >= 3 ? 1 : 0) }} />
    </AbsoluteFill>
  );
};

const RevealBeat: React.FC<BP> = ({ s, f, pal }) => {
  const p = ez(f, 0, 24, 0, 1, Easing.out(Easing.cubic));
  const landed = f >= 24;
  const ring = ez(f, 22, 44);
  const float = landed ? Math.sin((f - 24) / 14) * 12 : 0;
  const plate = ez(f, 16, 30, 0, 1, back(1.4));
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: ez(f, 18, 30) * 0.6 }}>
        <g transform={`translate(540 780) rotate(${f * 0.5})`}>
          {Array.from({ length: 16 }).map((_, i) => {
            const a0 = ((i * 22.5 - 5) * Math.PI) / 180, a1 = ((i * 22.5 + 5) * Math.PI) / 180;
            return <polygon key={i} points={`0,0 ${1500 * Math.cos(a0)},${1500 * Math.sin(a0)} ${1500 * Math.cos(a1)},${1500 * Math.sin(a1)}`} fill={`${pal.b}22`} />;
          })}
        </g>
      </svg>
      {landed ? (
        <div style={{ position: "absolute", left: 540 - 700 * ring, top: 780 - 700 * ring, width: 1400 * ring, height: 1400 * ring, borderRadius: "50%", border: `14px solid ${pal.b}`, opacity: 1 - ring }} />
      ) : null}
      <AbsoluteFill style={{ perspective: 1600 }}>
        <div
          style={{
            position: "absolute", left: 540 - 345, top: 300,
            transform: `translateY(${(1 - p) * 1100 + float}px) rotateY(${(1 - p) * 540 + Math.sin(f / 30) * 6}deg) rotateZ(${(1 - p) * -25}deg) scale(${0.55 + 0.45 * p})`,
          }}
        >
          <CardImg src={s.image_url} w={690} f={f} glow={landed ? pal.a : undefined} />
        </div>
      </AbsoluteFill>
      {Array.from({ length: 14 }).map((_, i) => {
        const a = random(`rv${i}`) * Math.PI * 2;
        const rr = 420 + random(`rr${i}`) * 140;
        const tw = Math.abs(Math.sin((f + i * 9) / 8));
        return landed ? <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * rr, top: 780 + Math.sin(a) * rr * 1.2, width: 20, height: 20, transform: `rotate(45deg) scale(${tw})`, background: "#fff", boxShadow: `0 0 20px ${pal.b}` }} /> : null;
      })}
      {s.title ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1290, textAlign: "center", transform: `translateX(${(1 - plate) * -900}px) skewX(-8deg)` }}>
          <div style={{ display: "inline-block", padding: "6px 48px", background: pal.a, boxShadow: `0 10px 28px rgba(30,16,60,.30)`, fontFamily: FRIEND, fontWeight: 900, fontSize: 104, color: "#fff", textShadow: stroke(4, pal.ink) }}>{s.title}</div>
          {s.subtitle ? (
            <div style={{ marginTop: 22, transform: `translateX(${(1 - ez(f, 24, 36, 0, 1, back(1.4))) * 900}px)` }}>
              <span style={{ display: "inline-block", padding: "6px 30px", background: "#fff", color: pal.ink, fontFamily: FRIEND, fontWeight: 800, fontSize: 46, borderRadius: 8 }}>{s.subtitle}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const CardBeat: React.FC<BP> = ({ s, f, d, pal, idx }) => {
  const dir = idx % 2 ? 1 : -1;
  const push = interpolate(f, [0, d], [1, 1.12], C);
  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      <div style={{ position: "absolute", left: 540 - 360, top: 250, transform: `scale(${push}) rotateY(${dir * (12 - (f / d) * 24)}deg) rotateX(${Math.sin(f / 20) * 4}deg) translateY(${Math.sin(f / 16) * 12}px)` }}>
        <CardImg src={s.image_url} w={720} f={f} glow={pal.a} />
      </div>
      <Particles pal={pal} f={f} n={14} seed={`cb${idx}`} />
    </AbsoluteFill>
  );
};

const NameBeat: React.FC<BP> = ({ s, f, d, pal }) => {
  const chips = s.chips || [];
  const gap = Math.min(16, Math.max(8, (d * 0.45) / Math.max(1, chips.length)));
  const at = (i: number) => 6 + i * gap;
  const eqAt = at(chips.length) + 4;
  // ชิปต้องอยู่แถวเดียวเสมอ: ลดขนาดตัวอักษรตามจำนวนตัวอักษรรวม (กันตัดบรรทัดแล้วป้ายเล็กไปทับ "=" / ชื่อ)
  const baseBig = chips.length >= 3 ? 92 : 120;
  const totalChars = Math.max(1, chips.reduce((n, c) => n + String(c.big || "").length, 0));
  const room = 1000 - chips.length * 64 - Math.max(0, chips.length - 1) * (100 + 36);
  const fsBig = Math.max(56, Math.min(baseBig, Math.floor(room / (totalChars * 0.68))));
  return (
    <AbsoluteFill>
      {s.image_url ? (
        <Img src={s.image_url} style={{ position: "absolute", right: -180, bottom: 120, width: 900, opacity: 0.22, transform: `translateX(${-f * 0.6}px) rotate(-6deg)`, filter: `drop-shadow(0 0 30px ${pal.a})` }} />
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 18, flexWrap: "nowrap", padding: "0 40px" }}>
        {chips.map((c, i) => {
          const t = ez(f, at(i), at(i) + 10, 0, 1, back(2));
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <div style={{ fontFamily: FRIEND, fontWeight: 900, fontSize: 100, color: "#fff", opacity: ez(f, at(i) - 2, at(i) + 4), marginTop: 20 }}>+</div>
              ) : null}
              <div style={{ textAlign: "center", transform: `scale(${t}) rotate(${(i % 2 ? 4 : -4) * (1 - t * 0.5)}deg)`, opacity: Math.min(1, t * 2) }}>
                <div style={{ padding: "4px 30px", background: i % 2 ? pal.b : pal.a, color: i % 2 ? pal.ink : "#fff", borderRadius: 18, fontFamily: FRIEND, fontWeight: 900, fontSize: fsBig, boxShadow: `0 10px 28px rgba(30,16,60,.30)`, textShadow: i % 2 ? "none" : stroke(3, pal.ink) }}>{c.big}</div>
                {c.small ? <div style={{ marginTop: 18, fontFamily: FRIEND, fontWeight: 700, fontSize: 48, color: "#fff", textShadow: stroke(3, "#000") }}>{c.small}</div> : null}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {s.title ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 930, textAlign: "center" }}>
          <div style={{ fontFamily: FRIEND, fontWeight: 900, fontSize: 110, color: "#fff", opacity: ez(f, eqAt, eqAt + 4), transform: `scale(${ez(f, eqAt, eqAt + 8, 2, 1, back(1.6))})` }}>=</div>
          <div style={{ display: "inline-block", position: "relative", fontFamily: FRIEND, fontWeight: 900, fontSize: 130, color: "#fff", textShadow: `${stroke(6, pal.ink)}, 0 0 50px ${pal.a}`, transform: `scale(${ez(f, eqAt + 6, eqAt + 16, 0.3, 1, back(1.8))})`, opacity: ez(f, eqAt + 6, eqAt + 10) }}>
            <Rich text={s.title} color={pal.b} />
            <div style={{ position: "absolute", left: 0, bottom: 10, height: 18, width: `${ez(f, eqAt + 14, eqAt + 26) * 100}%`, background: pal.a, zIndex: -1, borderRadius: 9 }} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const StatsBeat: React.FC<BP> = ({ s, f, pal }) => {
  const rows = s.stats || [];
  const enter = ez(f, 0, 16, 0, 1, back(1.3));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - 250, top: 190, transform: `rotate(${-4 + Math.sin(f / 18) * 2}deg) translateY(${(1 - enter) * -500}px)` }}>
        <CardImg src={s.image_url} w={500} f={f} glow={pal.a} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 920, padding: "34px 44px", borderRadius: 34, background: "rgba(8,8,20,.72)", border: `4px solid ${pal.a}`, boxShadow: `0 0 50px ${pal.a}55`, transform: `translateY(${(1 - enter) * 700}px)` }}>
        {s.title ? <div style={{ fontFamily: FRIEND, fontWeight: 900, fontSize: 64, color: pal.b, marginBottom: 14 }}>{s.title}</div> : null}
        {rows.map((r, i) => {
          const st = 10 + i * 9;
          const fill = ez(f, st, st + 22, 0, 1, Easing.out(Easing.quad));
          const max = r.max && r.max > 0 ? r.max : Math.max(r.value, 1);
          const val = Math.round(r.value * fill);
          return (
            <div key={i} style={{ marginTop: 18, opacity: ez(f, st - 4, st + 2) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: FRIEND, color: "#fff" }}>
                <span style={{ fontWeight: 700, fontSize: 48 }}>{r.label}</span>
                <span style={{ fontWeight: 900, fontSize: 70, color: pal.b, textShadow: `0 0 20px ${pal.a}` }}>
                  {val}
                  {r.suffix || ""}
                </span>
              </div>
              <div style={{ height: 30, borderRadius: 15, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 6 }}>
                <div style={{ width: `${(r.value / max) * 100 * fill}%`, height: "100%", borderRadius: 15, background: `linear-gradient(90deg, ${pal.a}, ${pal.b})`, boxShadow: `0 0 18px ${pal.a}` }} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const BigNumBeat: React.FC<BP> = ({ s, f, d, pal }) => {
  const v = Number(s.value) || 0;
  const from = s.from !== undefined ? Number(s.from) : 0;
  const t = ez(f, 4, Math.max(10, Math.min(d * 0.45, 40)), 0, 1, Easing.out(Easing.exp));
  const done = t >= 0.99;
  const shown = done ? Math.round(v) : Math.round(from + (v - from) * t);
  const pop = done ? 1 + 0.08 * Math.exp(-(f - Math.min(d * 0.45, 40)) / 5) : 1;
  return (
    <AbsoluteFill>
      {s.image_url ? <Img src={s.image_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18, filter: "blur(18px)" }} /> : null}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540 860) rotate(${f * 1.2})`}>
          <circle r={400} fill="none" stroke={pal.a} strokeWidth={10} strokeDasharray="40 30" opacity={0.6} />
        </g>
        <g transform={`translate(540 860) rotate(${-f * 0.8})`}>
          <circle r={460} fill="none" stroke={pal.b} strokeWidth={4} strokeDasharray="6 22" opacity={0.6} />
        </g>
      </svg>
      {s.title ? (
        <div style={{ position: "absolute", left: 40, right: 40, top: 330, textAlign: "center", fontFamily: FRIEND, fontWeight: 800, fontSize: 72, color: "#ffe14d", ...HEAD(16), opacity: ez(f, 0, 8), transform: `translateY(${ez(f, 0, 12, -60, 0)}px)` }}>
          <Rich text={s.title} color="#ffffff" />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: 860 - 170, height: 340, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FRIEND, fontWeight: 900, fontSize: Math.min(300, 1000 / (Math.max(1, v.toLocaleString("en-US", { useGrouping: v >= 10000 }).length) * 0.6)), lineHeight: 1.1, whiteSpace: "nowrap", color: "#ffe14d", transform: `scale(${pop})`, ...HEAD(22) }}>
        {shown.toLocaleString("en-US", { useGrouping: v >= 10000 })}
      </div>
      {s.subtitle ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1180, textAlign: "center", opacity: ez(f, 14, 22), transform: `scale(${ez(f, 14, 24, 0.6, 1, back(1.6))})` }}>
          <span style={{ display: "inline-block", padding: "10px 40px", borderRadius: 50, background: pal.a, color: "#fff", fontFamily: FRIEND, fontWeight: 800, fontSize: 54, boxShadow: `0 10px 28px rgba(30,16,60,.30)` }}>{s.subtitle}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const FullBeat: React.FC<BP> = ({ s, f, d, pal }) => {
  const zoom = 1 + 0.07 * (f / Math.max(1, d));
  const contain = s.fit === "contain";
  const pt = ez(f, 6, 18, 0, 1, back(2.2));
  const tLines = Math.max(1, String(s.title || "").split("\n").length);
  const tSize = tLines >= 3 ? 78 : 92;
  const pulse = 1 + 0.05 * Math.sin(f / 5);
  return (
    <AbsoluteFill style={{ background: pal.bg2 }}>
      {s.video_url ? (
        <OffthreadVideo src={s.video_url} muted loop style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
      ) : null}
      {s.image_url && !s.video_url ? (
        contain ? (
          <>
            <Img src={s.image_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(30px) brightness(.6)", transform: "scale(1.2)" }} />
            <Img src={s.image_url} style={{ position: "absolute", left: 0, right: 0, top: 260, width: "100%", height: 1300, objectFit: "contain", transform: `scale(${zoom})` }} />
          </>
        ) : (
          <Img src={s.image_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
        )
      ) : null}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(0,0,0,.72) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,.7) 100%)" }} />
      {s.title ? (
        <div style={{ position: "absolute", left: 40, right: 40, top: 150, textAlign: "center", fontFamily: FRIEND, fontWeight: 900, fontSize: tSize, lineHeight: 1.1, color: "#ffe14d", whiteSpace: "pre-line", ...HEAD(16), opacity: ez(f, 0, 8), transform: `translateY(${ez(f, 0, 12, -50, 0)}px)` }}>
          <Rich text={s.title} color="#ffffff" />
        </div>
      ) : null}
      {s.subtitle ? (
        <div style={{ position: "absolute", left: 40, right: 40, top: 150 + Math.round(tLines * tSize * 1.1) + 24, textAlign: "center", fontFamily: FRIEND, fontWeight: 700, fontSize: 46, color: "#fff", textShadow: stroke(4, "#000"), opacity: ez(f, 8, 16) }}>{s.subtitle}</div>
      ) : null}
      {s.price ? (
        <div style={{ position: "absolute", right: 50, top: 760, transform: `rotate(-9deg) scale(${pt * pulse})`, transformOrigin: "center", textAlign: "center" }}>
          <div style={{ padding: "14px 46px 20px", borderRadius: 28, background: pal.b, color: pal.ink, fontFamily: FRIEND, fontWeight: 900, boxShadow: `0 10px 28px rgba(30,16,60,.30), 0 0 50px ${pal.a}` }}>
            {s.price_label ? <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>{s.price_label}</div> : null}
            <div style={{ fontSize: 120, lineHeight: 1.05, whiteSpace: "nowrap" }}>{s.price}</div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const RankBeat: React.FC<BP> = ({ s, f, d, pal, starts }) => {
  const contain = s.fit === "contain";
  const enter = ez(f, 0, 14, 0, 1, back(1.5));
  const priceAt = starts.length > 1 ? starts[1] : Math.round(d * 0.4);
  const pp = ez(f, priceAt, priceAt + 12, 0, 1, back(2.4));
  const pulse = 1 + 0.04 * Math.sin(f / 5);
  const num = ez(f, 0, 10, 2.2, 1, back(2));
  return (
    <AbsoluteFill style={{ background: pal.bg2 }}>
      {s.image_url ? (
        <Img src={s.image_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(34px) brightness(.55) saturate(1.3)", transform: "scale(1.25)" }} />
      ) : null}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(20,10,40,.45) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 70%, rgba(20,10,40,.5) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", transform: `scale(${0.5 + 0.5 * enter}) translateY(${(1 - enter) * 120 + Math.sin(f / 18) * 8}px)`, opacity: Math.min(1, enter * 1.6) }}>
        {s.image_url ? (
          contain ? (
            <div style={{ width: 800, height: 1040, borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,.55)", background: "rgba(255,255,255,.08)" }}>
              <Img src={s.image_url} style={{ width: "100%", height: "100%", objectFit: s.pos ? "cover" : "contain", objectPosition: s.pos || "50% 50%" }} />
            </div>
          ) : (
            <CardImg src={s.image_url} w={740} f={f} radius={30} />
          )
        ) : null}
      </div>
      {s.rank ? (
        <div style={{ position: "absolute", left: 46, top: 175, fontFamily: FRIEND, fontWeight: 700, fontSize: 250, lineHeight: 1, color: "#ffe14d", transform: `scale(${num}) rotate(${-4 * (1 - enter)}deg)`, transformOrigin: "0 50%", ...HEAD(22) }}>{s.rank}</div>
      ) : null}
      {s.price ? (
        <div style={{ position: "absolute", right: 40, top: 190, textAlign: "right", transform: `scale(${pp * pulse})`, transformOrigin: "100% 0", opacity: Math.min(1, pp * 2) }}>
          {s.price_label ? <div style={{ fontFamily: FRIEND, fontWeight: 600, fontSize: 44, color: "#fff", textShadow: stroke(4) }}>{s.price_label}</div> : null}
          <div style={{ fontFamily: FRIEND, fontWeight: 700, fontSize: 138, lineHeight: 1.05, color: "#4dff7a", whiteSpace: "nowrap", ...HEAD(18, "#0b3d1c") }}>{s.price}</div>
          {s.subtitle ? <div style={{ fontFamily: FRIEND, fontWeight: 700, fontSize: 56, color: "#fff", textShadow: stroke(5) }}>{s.subtitle}</div> : null}
        </div>
      ) : null}
      {s.title ? (
        <div style={{ position: "absolute", left: 40, right: 40, top: 1405, textAlign: "center", fontFamily: FRIEND, fontWeight: 700, fontSize: 60, lineHeight: 1.15, color: "#fff", whiteSpace: "pre-line", textShadow: stroke(6), opacity: ez(f, 6, 14) }}>
          <Rich text={s.title} color={pal.b} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const QuizBeat: React.FC<BP> = ({ s, f, d, pal, starts }) => {
  const choices = s.choices || [];
  const ans = Math.max(0, Math.min(choices.length - 1, Number(s.answer) || 0));
  const revealAt = starts.length > 1 ? starts[starts.length - 1] : Math.round(d * 0.6);
  const revealed = f >= revealAt;
  const rv = f - revealAt;
  const timer = interpolate(f, [8, revealAt], [1, 0], C);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", transform: `rotate(${-6 + Math.sin(f / 6) * 2}deg) scale(${ez(f, 0, 10, 2.4, 1, back(2))})`, opacity: ez(f, 0, 4) }}>
        <span style={{ display: "inline-block", padding: "4px 46px", background: pal.b, color: pal.ink, fontFamily: FRIEND, fontWeight: 900, fontSize: 84, borderRadius: 16, boxShadow: `0 10px 28px rgba(30,16,60,.30)` }}>ทายสิ!</span>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 420, textAlign: "center", fontFamily: FRIEND, fontWeight: 800, fontSize: 66, lineHeight: 1.25, color: "#ffe14d", ...HEAD(16), opacity: ez(f, 4, 12), whiteSpace: "pre-line" }}>
        <Rich text={String(s.title || "")} color="#ffffff" />
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 690, height: 18, borderRadius: 9, background: "rgba(255,255,255,.15)", overflow: "hidden" }}>
        <div style={{ width: `${timer * 100}%`, height: "100%", background: timer < 0.3 ? "#ff3b3b" : pal.a }} />
      </div>
      {choices.map((c, i) => {
        const t = ez(f, 10 + i * 5, 22 + i * 5, 0, 1, back(1.3));
        const correct = i === ans;
        const bg = revealed ? (correct ? "#22c55e" : "rgba(40,40,60,.85)") : "rgba(255,255,255,.95)";
        const fg = revealed ? (correct ? "#fff" : "rgba(255,255,255,.45)") : "#141420";
        const pulse = revealed && correct ? 1 + 0.06 * Math.sin(rv / 3) * Math.exp(-rv / 18) + 0.04 * ez(rv, 0, 6) : 1;
        return (
          <div key={i} style={{ position: "absolute", left: 80, right: 80, top: 770 + i * 175, height: 145, borderRadius: 30, background: bg, display: "flex", alignItems: "center", padding: "0 30px", transform: `translateX(${(1 - t) * 1100}px) scale(${pulse})`, boxShadow: revealed && correct ? "0 0 60px #22c55e" : "0 12px 30px rgba(0,0,0,.4)" }}>
            <div style={{ width: 92, height: 92, borderRadius: "50%", background: revealed ? (correct ? "#fff" : "rgba(255,255,255,.15)") : pal.a, color: revealed && correct ? "#16a34a" : "#fff", fontFamily: FRIEND, fontWeight: 900, fontSize: 56, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {revealed ? (correct ? "✓" : "✕") : "ABC"[i] || "?"}
            </div>
            <div style={{ marginLeft: 28, fontFamily: FRIEND, fontWeight: 800, fontSize: 56, color: fg }}>{c}</div>
          </div>
        );
      })}
      {revealed
        ? Array.from({ length: 46 }).map((_, i) => {
            const a = -Math.PI / 2 + (random(`cfa${i}`) - 0.5) * 2.4;
            const v0 = 26 + random(`cfv${i}`) * 26;
            const x = 540 + Math.cos(a) * v0 * rv;
            const y = 950 + 175 * ans + Math.sin(a) * v0 * rv + 0.9 * rv * rv;
            const cols = [pal.a, pal.b, "#22c55e", "#ffffff", "#ff4fa3"];
            return rv < 50 ? <div key={i} style={{ position: "absolute", left: x, top: y, width: 18, height: 28, background: cols[i % cols.length], transform: `rotate(${rv * (8 + i)}deg)`, opacity: 1 - rv / 50 }} /> : null;
          })
        : null}
    </AbsoluteFill>
  );
};

const ZoomBeat: React.FC<BP> = ({ s, f, d, pal }) => {
  const cw = 860;
  const ch = cw * 1.395;
  const left = 540 - cw / 2;
  const top = 240;
  const fx = (Number(s.focus_x ?? 50) / 100) * cw + left;
  const fy = (Number(s.focus_y ?? 50) / 100) * ch + top;
  const p = ez(f, 6, Math.min(32, d * 0.4), 0, 1, Easing.inOut(Easing.cubic));
  const cx = 540 + (fx - 540) * p;
  const cy = top + ch / 2 + (fy - (top + ch / 2)) * p;
  const R = 230 * ez(f, 0, 10, 0.2, 1, back(1.6));
  const Z = Number(s.focus_zoom) > 1 ? Number(s.focus_zoom) : 2.4;
  const u = (cx - left) / cw;
  const v = (cy - top) / ch;
  const labelBelow = cy < top + ch * 0.5;
  const ly = labelBelow ? cy + R + 70 : cy - R - 200;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left, top, filter: `brightness(${1 - 0.45 * p})` }}>
        <CardImg src={s.image_url} w={cw} f={f} radius={26} />
      </div>
      <div style={{ position: "absolute", left: cx - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: "50%", overflow: "hidden", border: `12px solid ${pal.b}`, boxShadow: `0 0 0 6px ${pal.ink}, 0 0 60px ${pal.a}, 0 30px 60px rgba(0,0,0,.6)` }}>
        {s.image_url ? (
          <Img src={s.image_url} style={{ position: "absolute", left: R - 12 - u * cw * Z, top: R - 12 - v * ch * Z, width: cw * Z, height: ch * Z, objectFit: "cover", maxWidth: "none" }} />
        ) : null}
      </div>
      {s.title ? (
        <div style={{ position: "absolute", left: 60, right: 60, top: ly, textAlign: "center", opacity: ez(f, Math.min(32, d * 0.4), Math.min(32, d * 0.4) + 8), transform: `scale(${ez(f, Math.min(32, d * 0.4), Math.min(32, d * 0.4) + 12, 0.5, 1, back(1.8))})` }}>
          <span style={{ display: "inline-block", padding: "10px 36px", borderRadius: 20, background: pal.b, color: pal.ink, fontFamily: FRIEND, fontWeight: 900, fontSize: 62, boxShadow: `0 10px 28px rgba(30,16,60,.30)` }}>{s.title}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const TimelineBeat: React.FC<BP> = ({ s, f, d, pal, starts }) => {
  const pts = s.points || [];
  const n = Math.max(1, pts.length);
  const step = 460;
  const times = pts.map((_, i) => (starts.length === n ? starts[i] : Math.round((i * d) / n)));
  let cam = 0;
  for (let i = 1; i < n; i++) cam += ez(f, times[i] - 4, times[i] + 12, 0, step, Easing.inOut(Easing.cubic));
  const y = 900;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `translateX(${540 - cam}px)` }}>
        <div style={{ position: "absolute", left: -2000, top: y - 6, width: 4000 + n * step, height: 12, background: "rgba(255,255,255,.18)", borderRadius: 6 }} />
        <div style={{ position: "absolute", left: 0, top: y - 6, width: Math.max(0, cam + ez(f, 0, 12) * 40), height: 12, background: `linear-gradient(90deg, ${pal.a}, ${pal.b})`, borderRadius: 6, boxShadow: `0 0 20px ${pal.a}` }} />
        {pts.map((pt, i) => {
          const t = ez(f, times[i], times[i] + 12, 0, 1, back(2));
          const active = f >= times[i] && (i === n - 1 || f < times[i + 1]);
          return (
            <div key={i} style={{ position: "absolute", left: i * step - 200, top: 0, width: 400, height: H }}>
              <div style={{ position: "absolute", left: 200 - 34, top: y - 34, width: 68, height: 68, borderRadius: "50%", background: active ? pal.b : pal.a, border: "8px solid #fff", transform: `scale(${t * (active ? 1.15 : 0.9)})`, boxShadow: active ? `0 0 40px ${pal.b}` : "none" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: H - (y - 62), lineHeight: 1.0, textAlign: "center", fontFamily: FRIEND, fontWeight: 900, fontSize: active ? 112 : 80, color: active ? "#ffe14d" : "#fff6d6", opacity: t, ...HEAD(active ? 16 : 12) }}>{pt.year}</div>
              <div style={{ position: "absolute", left: 0, right: 0, top: y + 70, textAlign: "center", fontFamily: FRIEND, fontWeight: 700, fontSize: active ? 54 : 44, lineHeight: 1.25, color: "#fff", whiteSpace: "pre-line", opacity: t * (active ? 1 : 0.55), textShadow: stroke(3, "#000") }}>{pt.label}</div>
            </div>
          );
        })}
      </div>
      {s.title ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: FRIEND, fontWeight: 900, fontSize: 78, color: "#ffe14d", ...HEAD(16), opacity: ez(f, 0, 8) }}>
          <Rich text={s.title} color="#ffffff" />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const ArtBeat: React.FC<BP> = ({ s, f, d, pal, idx }) => {
  const word = String(s.title || "").replace(/\*/g, "").toUpperCase();
  const enter = ez(f, 0, 18, 0, 1, back(1.5));
  return (
    <AbsoluteFill>
      {word
        ? [0, 1, 2, 3].map((row) => (
            <div key={row} style={{ position: "absolute", left: 0, top: 260 + row * 330, whiteSpace: "nowrap", fontFamily: FRIEND, fontWeight: 900, fontSize: 300, lineHeight: 1, color: "transparent", WebkitTextStroke: `4px ${row % 2 ? pal.a : pal.b}`, opacity: 0.22, transform: `translateX(${(row % 2 ? -1 : 1) * ((f * 3) % 1400) - 700}px)` }}>
              {`${word} • ${word} • ${word} • ${word} • `}
            </div>
          ))
        : null}
      <div style={{ position: "absolute", left: 540 - 520, top: 330, width: 1040, height: 1040, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${(0.6 + 0.4 * enter) * interpolate(f, [0, d], [1, 1.06], C)}) translateY(${Math.sin(f / 18) * 16}px) rotate(${(idx % 2 ? 1 : -1) * Math.sin(f / 40) * 2}deg)`, opacity: Math.min(1, enter * 1.5) }}>
        {s.image_url ? <Img src={s.image_url} style={{ maxWidth: "100%", maxHeight: "100%", filter: `drop-shadow(0 0 3px #fff) drop-shadow(0 0 40px ${pal.a}) drop-shadow(0 30px 40px rgba(0,0,0,.6))` }} /> : null}
      </div>
      {s.subtitle ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center", transform: `translateY(${(1 - ez(f, 8, 20)) * 200}px)`, opacity: ez(f, 8, 16) }}>
          <span style={{ display: "inline-block", padding: "8px 34px", background: "#fff", color: pal.ink, fontFamily: FRIEND, fontWeight: 800, fontSize: 50, borderRadius: 12, boxShadow: `0 10px 28px rgba(30,16,60,.30)` }}>{s.subtitle}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const StillBeat: React.FC<BP> = ({ s, f, d }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    {s.image_url ? <Img src={s.image_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", transform: `scale(${interpolate(f, [0, d], [1, 1.03], C)})` }} /> : null}
  </AbsoluteFill>
);

// ---------------------------------------------------------------------
// ทรานซิชันตอนเข้าบีต
// ---------------------------------------------------------------------
const TRANS_CYCLE: Transition[] = ["zoom", "slide"];

const Enter: React.FC<{ type: Transition; f: number; pal: Pal; children: React.ReactNode }> = ({ type, f, pal, children }) => {
  let style: React.CSSProperties = {};
  if (type === "zoom") {
    const t = ez(f, 0, 10);
    style = { transform: `scale(${1.4 - 0.4 * t})`, filter: t < 1 ? `blur(${(1 - t) * 14}px)` : undefined, opacity: Math.min(1, t * 2) };
  } else if (type === "slide") {
    const t = ez(f, 0, 11, 0, 1, Easing.out(Easing.exp));
    style = { transform: `translateX(${(1 - t) * 100}%)` };
  } else if (type === "wipe") {
    const t = ez(f, 0, 12, 0, 1, Easing.inOut(Easing.cubic));
    style = { clipPath: `polygon(0 0, ${t * 140}% 0, ${t * 140 - 40}% 100%, 0 100%)` };
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {type === "wipe" && f < 16 ? (
        <div style={{ position: "absolute", top: -200, height: H + 400, width: 260, left: `${ez(f, 0, 12, -30, 125, Easing.inOut(Easing.cubic))}%`, background: `linear-gradient(90deg, ${pal.a}, ${pal.b})`, transform: "skewX(-12deg)", boxShadow: `0 0 60px ${pal.a}` }} />
      ) : null}
      {type === "shutter" && f < 18
        ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 0, top: (H / 8) * i, width: W, height: H / 8 + 2, background: i % 2 ? pal.a : pal.bg1, transformOrigin: i % 2 ? "left" : "right", transform: `scaleX(${1 - ez(f, i * 1.2, i * 1.2 + 9, 0, 1, Easing.in(Easing.cubic))})` }} />
          ))
        : null}
      {type === "flash" && f < 10 ? <AbsoluteFill style={{ background: "#fff", opacity: ez(f, 0, 9, 1, 0) }} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
// ซับรูปแบบใหม่: กล่องขาวตัวหนังสือดำ + คำเน้นเป็นสติกเกอร์สีธีม
// ---------------------------------------------------------------------
const Caption: React.FC<{ s: ShowSlide; f: number; fps: number; pal: Pal; starts: number[] }> = ({ s, f, fps, pal, starts }) => {
  if (s.no_caption) return null;
  let text = s.text || "";
  let cf = f;
  if (s.parts && s.parts.length) {
    let k = 0;
    for (let i = 0; i < starts.length; i++) if (f >= starts[i]) k = i;
    text = s.parts[k].text;
    cf = f - starts[k];
  }
  if (!text) return null;
  const pop = ez(cf, 0, 8, 0.7, 1, back(2));
  const op = ez(cf, 0, 3);
  const pieces = String(text).split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, bottom: 150, textAlign: "center", transform: `scale(${pop})`, transformOrigin: "50% 100%", opacity: op }}>
      <div style={{ display: "inline-block", padding: "16px 34px", borderRadius: 40, background: "rgba(255,255,255,.97)", boxShadow: `0 10px 30px rgba(30,16,60,.35)`, fontFamily: FRIEND, fontWeight: 500, fontSize: 54, lineHeight: 1.45, color: "#2a2140" }}>
        {pieces.map((p, i) =>
          p.startsWith("*") && p.endsWith("*") ? (
            <span key={i} style={{ display: "inline-block", margin: "0 4px", padding: "0 8px", borderRadius: 10, background: `linear-gradient(transparent 52%, ${pal.b} 52%)`, color: pal.ink, fontWeight: 700, transform: `scale(${ez(cf, 3, 10, 1.2, 1, back(2.2))})` }}>
              {p.slice(1, -1)}
            </span>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
// HUD: ชื่อช่อง + เลขการ์ด + แถบความคืบหน้า + หัวข้อบีต
// ---------------------------------------------------------------------
const Hud: React.FC<{ slides: ShowSlide[]; starts: number[]; total: number; pal: Pal; badge?: string; series?: string }> = ({ slides, starts, total, pal, badge, series }) => {
  const f = useCurrentFrame();
  let k = 0;
  for (let i = 0; i < starts.length; i++) if (f >= starts[i]) k = i;
  const cur = slides[k];
  if (cur && (cur.beat === "still" || cur.no_caption)) return null;
  const chapF = f - starts[k];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 40, right: 40, top: 60, height: 10, display: "flex", gap: 8 }}>
        {slides.map((sl, i) => {
          const a = starts[i];
          const b = i + 1 < starts.length ? starts[i + 1] : total;
          const fill = interpolate(f, [a, b], [0, 1], C);
          return sl.beat === "still" ? null : (
            <div key={i} style={{ flex: b - a, height: "100%", borderRadius: 5, background: "rgba(255,255,255,.22)", overflow: "hidden" }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", background: pal.b }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 40, top: 100, display: "flex", alignItems: "center", gap: 14, fontFamily: FRIEND }}>
        {badge ? <span style={{ padding: "2px 18px", borderRadius: 10, background: pal.a, color: "#fff", fontWeight: 900, fontSize: 40, textShadow: stroke(2, pal.ink) }}>{badge}</span> : null}
        <span style={{ color: "rgba(255,255,255,.9)", fontWeight: 700, fontSize: 34, textShadow: stroke(2, "#000") }}>{series || "CARDZ CENTER"}</span>
      </div>
      {cur?.chapter ? (
        <div style={{ position: "absolute", right: 40, top: 98, transform: `translateX(${(1 - ez(chapF, 0, 10, 0, 1, back(1.5))) * 600}px)` }}>
          <span style={{ display: "inline-block", padding: "4px 22px", borderRadius: 10, background: "rgba(0,0,0,.55)", border: `3px solid ${pal.b}`, color: pal.b, fontFamily: FRIEND, fontWeight: 800, fontSize: 38 }}>{cur.chapter}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
const BeatView: React.FC<{ s: ShowSlide; idx: number; pal: Pal }> = ({ s, idx, pal }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const d = slideFrames(s);
  const starts = partStarts(s, fps);
  const p: BP = { s, f, d, pal, starts, idx };
  const beat: Beat = s.beat || (s.scene as Beat) || (s.image_mode === "still" ? "still" : s.image_mode === "art" ? "art" : "card");
  const tr: Transition = s.transition || (idx === 0 || beat === "still" ? "none" : TRANS_CYCLE[idx % TRANS_CYCLE.length]);
  const sceneProps = { frame: f, dur: d, width, height, image: s.image_url, images: s.images, labels: s.labels, coin: s.coin };
  const body =
    beat === "hook" ? <HookBeat {...p} /> :
    beat === "reveal" ? <RevealBeat {...p} /> :
    beat === "name" ? <NameBeat {...p} /> :
    beat === "stats" ? <StatsBeat {...p} /> :
    beat === "bignum" ? <BigNumBeat {...p} /> :
    beat === "quiz" ? <QuizBeat {...p} /> :
    beat === "zoom" ? <ZoomBeat {...p} /> :
    beat === "timeline" ? <TimelineBeat {...p} /> :
    beat === "art" ? <ArtBeat {...p} /> :
    beat === "still" ? <StillBeat {...p} /> :
    beat === "coin" ? <CoinScene {...sceneProps} /> :
    beat === "evolve" ? <EvolveScene {...sceneProps} /> :
    beat === "versions" ? <VersionsScene {...sceneProps} /> :
    beat === "sprite" ? <SpriteScene {...sceneProps} /> :
    beat === "full" ? <FullBeat {...p} /> :
    beat === "rank" ? <RankBeat {...p} /> :
    beat === "pixel" ? <PixelFridge frame={f} dur={d} parts={s.parts || []} starts={starts} /> :
    beat === "v_toilet" || beat === "v_ac" || beat === "v_wash" || beat === "v_micro" || beat === "v_rice" || beat === "v_kettle" || beat === "v_shower" || beat === "v_smoke" || beat === "v_hairdryer" || beat === "v_induction" || beat === "v_toaster" || beat === "v_airfryer" || beat === "v_fan" || beat === "v_vacuum" || beat === "v_led" || beat === "v_breaker" || beat === "v_pump" || beat === "v_flask" || beat === "v_iron" || beat === "v_mic" || beat === "v_chopper" || beat === "v_solar" || beat === "v_tapfilter" ? <PixelFridge scene={beat.slice(2)} frame={f} dur={d} parts={s.parts || []} starts={starts} /> :
    beat === "vec" ? <PixelFridge vec frame={f} dur={d} parts={s.parts || []} starts={starts} /> :
    <CardBeat {...p} />;
  return (
    <Enter type={tr} f={f} pal={pal}>
      {body}
      {beat === "still" || beat === "pixel" || beat === "vec" || beat.startsWith("v_") ? null : (
        <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 22%)" }} />
      )}
      <Caption s={s} f={f} fps={fps} pal={pal} starts={starts} />
    </Enter>
  );
};

export const CardShow: React.FC<ShowProps> = ({ slides, audio_url, audio_rate, cover, theme, badge, series }) => {
  useKanit();
  const pal = THEMES[theme || "normal"] || THEMES.normal;
  const off = cover ? COVER_FRAMES : 0;
  const starts: number[] = [];
  let acc = 0;
  for (const s of slides) {
    starts.push(acc);
    acc += slideFrames(s);
  }
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {cover ? (
        <Sequence from={0} durationInFrames={COVER_FRAMES}>
          <Thumb {...cover} />
        </Sequence>
      ) : null}
      <Sequence from={off}>
        <Stage pal={pal} />
        {slides.map((s, i) => (
          <Sequence key={i} from={starts[i]} durationInFrames={slideFrames(s)}>
            <BeatView s={s} idx={i} pal={pal} />
            {s.audio_url ? <Audio src={s.audio_url} playbackRate={audio_rate || 1} /> : null}
            {s.parts
              ? (() => {
                  let a = 0;
                  return s.parts.map((pt, k) => {
                    const from = a;
                    a += Math.max(1, Math.round(Number(pt.duration) * DYN_FPS));
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
        <Hud slides={slides} starts={starts} total={acc} pal={pal} badge={badge} series={series} />
        {audio_url ? <Audio src={audio_url} /> : null}
      </Sequence>
    </AbsoluteFill>
  );
};
