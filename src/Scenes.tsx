import React from "react";
import { AbsoluteFill, Img, interpolate, Easing, random } from "remotion";
import { useKanit, KANIT } from "./fonts";

// ฉากแทรกแบบแอนิเมชันที่สร้างเอง (ไม่ใช้คลิปของใคร) — ใช้ร่วมกับภาพการ์ด/อาร์ตของตัวละครนั้นๆ
type SceneProps = { frame: number; dur: number; width: number; height: number; image?: string; images?: string[]; labels?: string[]; coin?: "heads" | "tails" };

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const Backdrop: React.FC<{ image?: string; frame: number; tint?: string }> = ({ image, frame, tint }) => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #1d2a6b 0%, #0b1030 55%, #04060f 100%)" }}>
    {image ? (
      <Img
        src={image}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(.45) saturate(1.3)", transform: `scale(${1.3 + frame * 0.0006})` }}
      />
    ) : null}
    {tint ? <AbsoluteFill style={{ background: tint }} /> : null}
  </AbsoluteFill>
);

const Rays: React.FC<{ frame: number; color: string; cx: number; cy: number; opacity?: number }> = ({ frame, color, cx, cy, opacity = 1 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
    <g transform={`translate(${cx} ${cy}) rotate(${frame * 0.4})`}>
      {Array.from({ length: 18 }).map((_, i) => {
        const a0 = ((i * 20 - 4) * Math.PI) / 180, a1 = ((i * 20 + 4) * Math.PI) / 180;
        return <polygon key={i} points={`0,0 ${1600 * Math.cos(a0)},${1600 * Math.sin(a0)} ${1600 * Math.cos(a1)},${1600 * Math.sin(a1)}`} fill={color} />;
      })}
    </g>
  </svg>
);

// ---------- 1) โยนเหรียญ (ท่าโจมตีที่ต้องโยนเหรียญ) ----------
export const CoinScene: React.FC<SceneProps> = ({ frame, dur, image, coin }) => {
  useKanit();
  const land = Math.min(dur - 10, 48);
  const t = interpolate(frame, [0, land], [0, 1], clamp);
  const y = 1150 - Math.sin(Math.PI * t) * 520 - (t >= 1 ? 0 : 0); // พุ่งขึ้นแล้วตกลง
  const flips = 5 + (coin === "tails" ? 0.5 : 0);
  const rot = interpolate(t, [0, 1], [0, flips * 360], { easing: Easing.out(Easing.cubic) });
  const settled = frame >= land;
  const bounce = settled ? Math.abs(Math.sin((frame - land) / 4)) * 18 * Math.exp(-(frame - land) / 8) : 0;
  const burst = interpolate(frame, [land, land + 18], [0, 1], clamp);
  const face = (label: string, back: boolean) => (
    <div
      style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: back ? "radial-gradient(circle at 35% 30%, #fff2c4, #d9a520 55%, #8a5a00)" : "radial-gradient(circle at 35% 30%, #fff6d0, #ffc93c 55%, #b07a00)",
        border: "14px solid #f7d35c", boxShadow: "inset 0 0 0 10px rgba(120,70,0,.45), 0 0 60px rgba(255,200,60,.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backfaceVisibility: "hidden", transform: back ? "rotateX(180deg)" : undefined,
        fontFamily: KANIT, fontWeight: 900, fontSize: 120, color: "#6b3f00", textShadow: "0 3px 0 rgba(255,255,255,.5)",
      }}
    >
      {label}
    </div>
  );
  return (
    <AbsoluteFill>
      <Backdrop image={image} frame={frame} />
      <Rays frame={frame} color="rgba(255,210,90,.10)" cx={540} cy={900} opacity={burst} />
      <div style={{ position: "absolute", left: 540 - 180 * (1 - Math.sin(Math.PI * t) * 0.4), top: 1330, width: 360 * (1 - Math.sin(Math.PI * t) * 0.4), height: 50, borderRadius: "50%", background: "rgba(0,0,0,.55)", filter: "blur(10px)" }} />
      <div style={{ position: "absolute", left: 540 - 170, top: (settled ? 1150 : y) - 170 - bounce, width: 340, height: 340, perspective: 1200 }}>
        <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `rotateX(${rot}deg)` }}>
          {face("หัว", false)}
          {face("ก้อย", true)}
        </div>
      </div>
      {settled ? (
        <div style={{ position: "absolute", left: 540 - 260 * burst, top: 1150 - 260 * burst, width: 520 * burst, height: 520 * burst, borderRadius: "50%", border: "8px solid rgba(255,220,120,.8)", opacity: 1 - burst }} />
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- 2) วิวัฒนาการ (แสงขาว เงาร่าง แล้วเปลี่ยนร่าง) ----------
export const EvolveScene: React.FC<SceneProps> = ({ frame, dur, images = [] }) => {
  const imgs = images.length ? images : [];
  const n = Math.max(1, imgs.length);
  const seg = dur / n;
  const k = Math.min(n - 1, Math.floor(frame / seg));
  const f = frame - k * seg;
  const flash = k > 0 ? interpolate(f, [0, 6, 22], [1, 0.9, 0], clamp) : 0;
  const silhouette = k > 0 ? interpolate(f, [0, 16, 26], [1, 1, 0], clamp) : interpolate(frame, [0, 10], [1, 0], clamp);
  const grow = interpolate(f, [0, 20], [0.82, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const pulse = 1 + Math.sin(frame / 6) * 0.015;
  return (
    <AbsoluteFill>
      <Backdrop frame={frame} tint="radial-gradient(circle at 50% 45%, rgba(120,190,255,.25), rgba(0,0,0,0) 60%)" />
      <Rays frame={frame} color="rgba(170,215,255,.09)" cx={540} cy={900} />
      {[0, 1, 2].map((r) => {
        const rr = ((f + r * 14) % 42) / 42;
        return <div key={r} style={{ position: "absolute", left: 540 - 520 * rr, top: 900 - 520 * rr, width: 1040 * rr, height: 1040 * rr, borderRadius: "50%", border: "6px solid rgba(190,230,255,.6)", opacity: (1 - rr) * 0.8 }} />;
      })}
      {imgs[k] ? (
        <div style={{ position: "absolute", left: 90, top: 420, width: 900, height: 900, transform: `scale(${grow * pulse})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Img src={imgs[k]} style={{ maxWidth: "100%", maxHeight: "100%", filter: `drop-shadow(0 0 40px rgba(170,220,255,.7)) brightness(${1 + silhouette * 9}) saturate(${1 - silhouette})` }} />
        </div>
      ) : null}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      {Array.from({ length: 22 }).map((_, i) => {
        const a = random(`ev${i}`) * Math.PI * 2;
        const sp = 4 + random(`evs${i}`) * 8;
        const r = ((f * sp + random(`evp${i}`) * 400) % 700);
        return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * r, top: 900 + Math.sin(a) * r, width: 10, height: 10, borderRadius: "50%", background: "#e6f4ff", opacity: 1 - r / 700, boxShadow: "0 0 12px #bfe3ff" }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------- 3) เทียบการ์ดหลายฉบับ (ญี่ปุ่น / อังกฤษ / พิมพ์ใหม่) ----------
export const VersionsScene: React.FC<SceneProps> = ({ frame, images = [], labels = [] }) => {
  useKanit();
  const n = images.length;
  const w = n >= 3 ? 330 : n === 2 ? 440 : 600;
  const gap = n >= 3 ? 30 : 50;
  const total = n * w + (n - 1) * gap;
  return (
    <AbsoluteFill>
      <Backdrop image={images[0]} frame={frame} />
      {images.map((src, i) => {
        const t = interpolate(frame, [i * 10, i * 10 + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
        const x = 540 - total / 2 + i * (w + gap);
        const fl = Math.sin((frame + i * 25) / 30) * 10;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 960 - (w * 1.396) / 2 + fl + (1 - t) * 300, width: w, opacity: t }}>
            <Img src={src} style={{ width: "100%", borderRadius: 14, boxShadow: "0 30px 60px rgba(0,0,0,.6), 0 0 0 4px rgba(255,255,255,.85)" }} />
            {labels[i] ? (
              <div style={{ marginTop: 26, textAlign: "center" }}>
                <span style={{ display: "inline-block", padding: "8px 24px", borderRadius: 40, background: "rgba(255,204,92,.95)", color: "#1a1430", fontFamily: KANIT, fontWeight: 800, fontSize: n >= 3 ? 34 : 40 }}>{labels[i]}</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- 4) ฉากเกมยุคแรก (สไปรต์พิกเซลในจอสีเขียวแบบเครื่องเกมพกพายุค 90) ----------
export const SpriteScene: React.FC<SceneProps> = ({ frame, images = [], labels = [] }) => {
  useKanit();
  const src = images[0];
  const text: string = String(labels[0] ?? "");
  const shown = Math.floor(interpolate(frame, [12, 12 + text.length * 1.6], [0, text.length], clamp));
  const enter = interpolate(frame, [0, 16], [-500, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const blink = Math.floor(frame / 10) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #2b2f3a, #101217 70%)" }}>
      {/* ตัวเครื่อง (ออกแบบเอง) */}
      <div style={{ position: "absolute", left: 90, top: 250, width: 900, height: 1180, borderRadius: "40px 40px 140px 40px", background: "linear-gradient(160deg, #d8d5cc, #b9b5aa)", boxShadow: "0 40px 90px rgba(0,0,0,.6), inset 0 4px 0 rgba(255,255,255,.6)" }}>
        <div style={{ position: "absolute", left: 60, top: 60, right: 60, height: 760, borderRadius: "22px 22px 80px 22px", background: "#5e6170", padding: 50 }}>
          <div style={{ position: "relative", width: "100%", height: "100%", background: "#9bbc0f", overflow: "hidden", boxShadow: "inset 0 0 40px rgba(15,56,15,.6)" }}>
            {/* เส้นสแกนจอ */}
            <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(15,56,15,.10) 0 3px, transparent 3px 6px)" }} />
            {src ? (
              <div style={{ position: "absolute", right: 40 - enter, top: 40, width: 360, height: 360, mixBlendMode: "multiply" }}>
                <Img src={src} style={{ width: "100%", height: "100%", imageRendering: "pixelated", filter: "grayscale(1) contrast(1.3)" }} />
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 20, height: 210, background: "#e0f8d0", border: "8px solid #0f380f", borderRadius: 10, padding: "18px 26px", fontFamily: KANIT, fontWeight: 700, fontSize: 46, lineHeight: 1.3, color: "#0f380f" }}>
              {text.slice(0, shown)}
              {shown >= text.length && blink ? " ▼" : ""}
            </div>
          </div>
        </div>
        {/* ปุ่ม */}
        <div style={{ position: "absolute", left: 120, top: 920, width: 190, height: 60, background: "#2d2d33", borderRadius: 10 }} />
        <div style={{ position: "absolute", left: 185, top: 855, width: 60, height: 190, background: "#2d2d33", borderRadius: 10 }} />
        <div style={{ position: "absolute", left: 610, top: 930, width: 100, height: 100, borderRadius: "50%", background: "#9c2b55" }} />
        <div style={{ position: "absolute", left: 740, top: 870, width: 100, height: 100, borderRadius: "50%", background: "#9c2b55" }} />
      </div>
    </AbsoluteFill>
  );
};
