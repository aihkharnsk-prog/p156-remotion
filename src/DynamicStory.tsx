import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Loop,
  OffthreadVideo,
  random,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

export const DYN_FPS = 30;

export type SlidePart = {
  text: string; // ซับของท่อนนี้ (ใส่ *คำสำคัญ* ได้)
  audio_url?: string; // เสียงของท่อนนี้
  duration: number; // วินาที (ระบบคำนวณจากความยาวเสียง)
};

export type Slide = {
  // ต้องมีอย่างน้อยหนึ่งอย่าง: image_url หรือ video_url
  image_url?: string; // ภาพนิ่ง (ซูม/แพนอัตโนมัติ) — ถ้ามี video_url ด้วยจะเป็นภาพรองพื้นหลังคลิป
  video_url?: string; // คลิปที่จะแทรก (ต้องเป็นคลิปที่มีสิทธิ์ใช้งานเท่านั้น)
  video_start?: number; // เริ่มเล่นคลิปที่วินาทีที่เท่าไร (ค่าเริ่มต้น 0)
  video_end?: number; // เล่นถึงวินาทีที่เท่าไร (ไม่ใส่ = เล่นตามความยาวสไลด์)
  video_volume?: number; // เสียงของคลิปต้นฉบับ 0-1 (ค่าเริ่มต้น 0 = ปิดเสียง)
  video_loop?: boolean; // true = ถ้าช่วงคลิป (video_start→video_end) สั้นกว่าสไลด์ ให้เล่นวนจนจบสไลด์
  image_mode?: "fill" | "card" | "art" | "detail" | "still"; // art = ภาพสี่เหลี่ยมจัตุรัส/อาร์ตโปร่งใส ลอยกลางจอบนพื้นหลังเบลอ
  // (เดิม) // fill = เต็มจอ (ค่าเริ่มต้น) · card = โชว์ภาพการ์ดลอย/เอียงเบาๆ บนพื้นหลังเบลอ + แสงวิ่งผ่าน
  // โหมด detail: ซูม/เลื่อนกล้องไปตามจุดต่างๆ ของภาพ (หน่วย % ของภาพ, zoom 1 = ภาพกว้างเท่าจอ)
  focus_x?: number; focus_y?: number; focus_zoom?: number;
  focus_to_x?: number; focus_to_y?: number; focus_to_zoom?: number;
  image_aspect?: number; // สูง/กว้างของภาพ (ค่าเริ่มต้น 1.25 = การ์ด)
  scene?: "sprout" | "coin" | "evolve" | "versions" | "sprite"; // ฉากแอนิเมชันที่สร้างเอง
  images?: string[]; // ภาพชุดสำหรับฉาก evolve / versions / sprite
  labels?: string[]; // ป้ายใต้ภาพ (versions) หรือข้อความกล่องบทพูด (sprite)
  coin?: "heads" | "tails"; // ผลโยนเหรียญของฉาก coin
  no_caption?: boolean; // ไม่ต้องแสดงซับในสไลด์นี้ (เช่น ภาพปิดท้ายที่มีข้อความในภาพแล้ว)
  credit?: string; // เครดิตที่มุมซ้ายบน เช่น "Video: Pexels / ชื่อผู้ถ่าย"
  text?: string;
  parts?: SlidePart[]; // แบ่งสไลด์เป็นหลายท่อน: ซับ+เสียงต่อท่อน ภาพเคลื่อนไหวต่อเนื่องตลอดสไลด์
  audio_url?: string; // เสียงพากย์ของสไลด์นี้ — ถ้ามี ความยาวสไลด์ = ความยาวเสียง (ภาพ ซับ เสียงตรงกันแน่นอน)
  duration: number; // seconds
};

export type DynamicProps = {
  slides: Slide[];
  audio_url?: string;
  width?: number; // default 1920 (YouTube แนวนอน) — ส่ง 1080 + height 1920 ถ้าทำ Shorts
  height?: number; // default 1080
  caption_style?: "classic" | "reel"; // reel = ซับกลางจอสีนีออน คำสำคัญใหญ่ (ใส่ *คำสำคัญ* ในข้อความ)
  audio_rate?: number; // เร่ง/ผ่อนเสียงพากย์ตอนประกอบวิดีโอ (1 = ปกติ, 1.15 = เร็วขึ้น 15%) ความยาวสไลด์ปรับตามเอง
  caption_position?: "center" | "bottom"; // ตำแหน่งซับแบบ reel (ค่าเริ่มต้น center)
  motion?: number; // ความแรงของการซูม/เอียง/ลอยของภาพ (1 = เดิม, 0.25 = นิ่งมาก, 0 = นิ่งสนิท)
  caption_scale?: number; // ขนาดซับแบบ reel (1 = เดิม, 0.6 = เล็กลง)
  caption_bottom?: number; // ระยะซับจากขอบล่าง เป็นสัดส่วนความสูง (ค่าเริ่มต้น 0.14, ยิ่งน้อยยิ่งต่ำ)
  accent_color?: string; // สีซับแบบ reel (ค่าเริ่มต้น #39ff6a)
  fit_audio?: boolean; // true (ค่าเริ่มต้น) = ถ้ามี audio_url จะยืด/หดความยาวสไลด์ทุกอันตามสัดส่วนให้พอดีกับความยาวเสียง
};

export const slideFrames = (s: Slide) =>
  Math.max(1, Math.round(s.duration * DYN_FPS));

export const totalFrames = (slides: Slide[]) =>
  Math.max(
    1,
    slides.reduce((sum, s) => sum + slideFrames(s), 0)
  );

import { CoinScene, EvolveScene, VersionsScene, SpriteScene } from "./Scenes";

const FONT = "Noto Sans Thai, Noto Sans CJK JP, Noto Sans, sans-serif";


// ฉากการ์ตูนต้นฉบับ: เมล็ดงอกเป็นต้นกล้า (วาดด้วย SVG ในโค้ด ไม่ใช้ตัวละครหรือคลิปของใคร)
const SproutScene: React.FC<{ frame: number; dur: number; width: number; height: number }> = ({ frame, dur, width, height }) => {
  const p = Math.min(1, Math.max(0, frame / Math.max(1, dur - 6)));
  const ease = (a: number, b: number) =>
    interpolate(p, [a, b], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stemGrow = ease(0.12, 0.62);
  const leafGrow = interpolate(p, [0.45, 0.7], [0, 1], { easing: Easing.out(Easing.back(2)), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const budGrow = interpolate(p, [0.68, 0.88], [0, 1], { easing: Easing.out(Easing.back(2.2)), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sway = Math.sin(frame / 22) * 5 * stemGrow;
  const baseX = 540;
  const baseY = 1380;
  const topY = baseY - 560 * stemGrow;
  const topX = baseX + sway * 2;
  const ink = "#2f3b1f";
  const seedWobble = p < 0.14 ? Math.sin(frame * 1.2) * 4 * (1 - p / 0.14) : 0;
  const cloud = (cx: number, cy: number, s: number, speed: number) => {
    const x = ((cx + frame * speed) % 1500) - 200;
    return (
      <g transform={`translate(${x} ${cy}) scale(${s})`} fill="#ffffff" stroke={ink} strokeWidth={6 / s}>
        <ellipse cx={0} cy={0} rx={90} ry={44} />
        <ellipse cx={-50} cy={-26} rx={52} ry={40} />
        <ellipse cx={30} cy={-38} rx={58} ry={46} />
      </g>
    );
  };
  const rays = Array.from({ length: 10 }).map((_, k) => {
    const a = (k / 10) * Math.PI * 2 + frame / 90;
    return (
      <line key={k} x1={Math.cos(a) * 118} y1={Math.sin(a) * 118} x2={Math.cos(a) * 160} y2={Math.sin(a) * 160} stroke="#ffb703" strokeWidth={14} strokeLinecap="round" />
    );
  });
  const sparkles = Array.from({ length: 8 }).map((_, k) => {
    const a = (k / 8) * Math.PI * 2;
    const r = 70 + budGrow * 90;
    const o = interpolate(budGrow, [0, 0.5, 1], [0, 1, 0.6]);
    return (
      <circle key={k} cx={topX + Math.cos(a) * r} cy={topY - 40 + Math.sin(a) * r} r={9 * budGrow} fill="#fff6a8" opacity={o} />
    );
  });
  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fd3ff" />
            <stop offset="0.65" stopColor="#dff6ff" />
            <stop offset="1" stopColor="#f3fbd6" />
          </linearGradient>
        </defs>
        <rect width="1080" height="1920" fill="url(#sk)" />
        <g transform="translate(860 330)">{rays}<circle r="95" fill="#ffd23f" stroke={ink} strokeWidth={8} /></g>
        {cloud(120, 520, 1.1, 0.35)}
        {cloud(700, 760, 0.8, 0.22)}
        <ellipse cx="200" cy="1560" rx="620" ry="260" fill="#8fd96a" stroke={ink} strokeWidth={8} />
        <ellipse cx="900" cy="1600" rx="640" ry="280" fill="#74c957" stroke={ink} strokeWidth={8} />
        <ellipse cx="540" cy="1470" rx="330" ry="110" fill="#8a5a36" stroke={ink} strokeWidth={8} />
        <ellipse cx="540" cy="1448" rx="290" ry="78" fill="#a06b42" />
        <g transform={`translate(${baseX + seedWobble} ${baseY + 40})`} opacity={interpolate(p, [0.1, 0.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          <ellipse rx="42" ry="30" fill="#c58a4a" stroke={ink} strokeWidth={8} />
          <path d="M-14 -4 Q0 -16 14 -4" stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
        <path d={`M ${baseX} ${baseY + 30} Q ${baseX + sway * 3} ${(baseY + topY) / 2} ${topX} ${topY}`} stroke={ink} strokeWidth={34} fill="none" strokeLinecap="round" />
        <path d={`M ${baseX} ${baseY + 30} Q ${baseX + sway * 3} ${(baseY + topY) / 2} ${topX} ${topY}`} stroke="#5fc24a" strokeWidth={20} fill="none" strokeLinecap="round" />
        <g transform={`translate(${baseX + sway * 1.5} ${baseY - 250 * stemGrow}) scale(${leafGrow})`}>
          <path d="M0 0 C-60 -70 -190 -60 -230 -10 C-170 40 -60 40 0 0 Z" fill="#7be05a" stroke={ink} strokeWidth={9} strokeLinejoin="round" />
          <path d="M-14 0 C-80 -12 -150 -12 -200 -10" stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
        <g transform={`translate(${baseX + sway * 2} ${baseY - 380 * stemGrow}) scale(${leafGrow})`}>
          <path d="M0 0 C60 -70 190 -60 230 -10 C170 40 60 40 0 0 Z" fill="#7be05a" stroke={ink} strokeWidth={9} strokeLinejoin="round" />
          <path d="M14 0 C80 -12 150 -12 200 -10" stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
        <g transform={`translate(${topX} ${topY - 10}) scale(${budGrow})`}>
          <path d="M0 0 C-90 -40 -80 -170 0 -230 C80 -170 90 -40 0 0 Z" fill="#ff8fb1" stroke={ink} strokeWidth={9} strokeLinejoin="round" />
          <path d="M0 0 C-30 -60 -26 -150 0 -200" stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M0 0 C30 -60 26 -150 0 -200" stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
        {sparkles}
      </svg>
    </AbsoluteFill>
  );
};

const SlideView: React.FC<{
  slide: Slide;
  index: number;
  captionStyle?: "classic" | "reel";
  captionPosition?: "center" | "bottom";
  accent?: string;
  capScale?: number;
  capBottom?: number;
  motion?: number;
}> = ({ slide, index, captionStyle, captionPosition, accent, capScale, capBottom, motion }) => {
  const mo = motion !== undefined && motion >= 0 ? motion : 1;
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dur = slideFrames(slide);

  // สลับทิศทางซูมเข้า/ออกทุกสไลด์ เพื่อให้ภาพมีชีวิต
  const zoomIn = index % 2 === 0;
  const scale = interpolate(
    frame,
    [0, dur],
    zoomIn ? [1.0, 1.14] : [1.14, 1.0],
    { easing: Easing.inOut(Easing.ease), extrapolateRight: "clamp" }
  );
  const panX = interpolate(
    frame,
    [0, dur],
    index % 3 === 0 ? [0, -2.5] : index % 3 === 1 ? [-2.5, 0] : [1.5, -1.5],
    { extrapolateRight: "clamp" }
  );

  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [dur - 8, dur], [1, 0], {
    extrapolateLeft: "clamp",
  });
  const capOpacity = Math.min(fadeIn, fadeOut);

  // ซับแบบแบ่งท่อน: เลือกท่อนที่กำลังพูดตามเฟรม (เวลาของท่อน = ความยาวเสียงของท่อน)
  let capText: string | undefined = slide.text;
  let capFrame = frame;
  if (slide.parts && slide.parts.length) {
    let acc = 0;
    let idx = 0;
    let startAt = 0;
    for (let k = 0; k < slide.parts.length; k++) {
      if (frame >= acc) {
        idx = k;
        startAt = acc;
      }
      acc += Math.max(1, Math.round(Number(slide.parts[k].duration) * fps));
    }
    capText = slide.parts[idx].text;
    capFrame = frame - startAt;
  }

  // ----- ส่วนของคลิป (ถ้ามี) -----
  const startSec = Math.max(0, Number(slide.video_start) || 0);
  const endSec =
    slide.video_end !== undefined && Number(slide.video_end) > startSec
      ? Number(slide.video_end)
      : undefined;
  const startFrames = Math.round(startSec * fps);
  // ช่วงที่ตัดมาสั้นกว่าสไลด์ → ตัดคลิปตามช่วงนั้น แล้วเห็นภาพรองพื้น (image_url) หรือฉากดำต่อจนจบสไลด์
  const videoFrames = endSec
    ? Math.min(dur, Math.max(1, Math.round((endSec - startSec) * fps)))
    : dur;
  const videoVolume = Math.min(1, Math.max(0, Number(slide.video_volume) || 0));

  return (
    <AbsoluteFill style={{ backgroundColor: "#050a12", overflow: "hidden" }}>
      {slide.image_url && slide.image_mode === "detail" ? (() => {
        const asp = slide.image_aspect && slide.image_aspect > 0 ? slide.image_aspect : 1.25;
        const t = interpolate(frame, [0, dur], [0, 1], { easing: Easing.inOut(Easing.ease), extrapolateRight: "clamp" });
        const mix = (a: number | undefined, b: number | undefined, d: number) => {
          const A = a ?? d;
          const B = b ?? A;
          return A + (B - A) * t;
        };
        const fx = mix(slide.focus_x, slide.focus_to_x, 50);
        const fy = mix(slide.focus_y, slide.focus_to_y, 50);
        const fz = Math.max(1, mix(slide.focus_zoom, slide.focus_to_zoom, 1.2));
        const W = width * fz;
        const H = W * asp;
        const left = Math.min(0, Math.max(width - W, width / 2 - (fx / 100) * W));
        const top = Math.min(0, Math.max(height - H, height / 2 - (fy / 100) * H));
        return (
          <Img
            src={slide.image_url}
            style={{ position: "absolute", left, top, width: W, height: H }}
          />
        );
      })() : slide.image_url && (slide.image_mode === "card" || slide.image_mode === "art") ? (
        <>
          {/* พื้นหลังเบลอจากภาพเดียวกัน ซูมช้าๆ */}
          <Img
            src={slide.image_url}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(38px) brightness(.55) saturate(1.2)",
              transform: `scale(${1.25 + (scale - 1) * 0.8 * mo})`,
            }}
          />
          {/* การ์ดลอยขึ้นลง เอียงเบาๆ แบบ 3D */}
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 1400 }}>
            <div
              style={{
                position: "relative",
                ...(slide.image_mode === "art" ? { width: "88%" } : { height: "78%" }),
                aspectRatio: "auto",
                transform: `translateY(${Math.sin(frame / 38) * 14 * mo}px) rotateY(${Math.sin(frame / 55) * 9 * mo}deg) rotateX(${Math.cos(frame / 61) * 4 * mo}deg) scale(${1 + (scale - 1) * mo})`,
                boxShadow: slide.image_mode === "art" ? "none" : "0 30px 80px rgba(0,0,0,.65)",
                borderRadius: slide.image_mode === "art" ? 0 : 18,
                overflow: "hidden",
              }}
            >
              <Img src={slide.image_url} style={slide.image_mode === "art" ? { width: "100%", height: "auto", display: "block" } : { height: "100%", width: "auto", display: "block" }} />
              {/* แสงวิ่งผ่านการ์ด */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(105deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.35) 50%, rgba(255,255,255,0) 65%)",
                  transform: `translateX(${interpolate(
                    frame % 150,
                    [0, 150],
                    [-130, 130]
                  )}%)`,
                  mixBlendMode: "screen",
                }}
              />
            </div>
          </AbsoluteFill>
        </>
      ) : slide.image_url && slide.image_mode === "still" ? (
        <Img
          src={slide.image_url}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `scale(${interpolate(frame, [0, dur], [1, 1.03], { extrapolateRight: "clamp" })})`,
          }}
        />
      ) : slide.image_url ? (
        <Img
          src={slide.image_url}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translateX(${panX}%)`,
          }}
        />
      ) : null}

      {slide.scene === "sprout" ? <SproutScene frame={frame} dur={dur} width={width} height={height} /> : null}
      {slide.scene === "coin" ? <CoinScene frame={frame} dur={dur} width={width} height={height} image={slide.image_url} coin={slide.coin} /> : null}
      {slide.scene === "evolve" ? <EvolveScene frame={frame} dur={dur} width={width} height={height} images={slide.images} /> : null}
      {slide.scene === "versions" ? <VersionsScene frame={frame} dur={dur} width={width} height={height} images={slide.images} labels={slide.labels} /> : null}
      {slide.scene === "sprite" ? <SpriteScene frame={frame} dur={dur} width={width} height={height} images={slide.images} labels={slide.labels} /> : null}

      {slide.video_url ? (
        <Sequence from={0} durationInFrames={slide.video_loop && endSec ? dur : videoFrames}>
          <AbsoluteFill>
            {slide.video_loop && endSec ? (
              <Loop durationInFrames={Math.max(1, Math.round((endSec - startSec) * fps))}>
                <OffthreadVideo
                  src={slide.video_url}
                  muted={videoVolume <= 0}
                  volume={videoVolume}
                  trimBefore={startFrames > 0 ? startFrames : undefined}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Loop>
            ) : (
              <OffthreadVideo
                src={slide.video_url}
                muted={videoVolume <= 0}
                volume={videoVolume}
                trimBefore={startFrames > 0 ? startFrames : undefined}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </AbsoluteFill>
        </Sequence>
      ) : null}

      {/* อนุภาคแสงลอยเบาๆ ทุกสไลด์ ไม่ให้ภาพรู้สึกนิ่ง */}
      <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
        {Array.from({ length: 18 }).map((_, k) => {
          const sx = random(`px-${index}-${k}`) * 100;
          const sp = 0.25 + random(`ps-${index}-${k}`) * 0.5;
          const sz = 3 + random(`pz-${index}-${k}`) * 6;
          const ph = random(`pp-${index}-${k}`) * 1000;
          const y = 105 - (((frame * sp + ph) % 130) / 130) * 120;
          const x = sx + Math.sin((frame + ph) / 45) * 2;
          const o = 0.12 + random(`po-${index}-${k}`) * 0.28;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: sz,
                height: sz,
                borderRadius: "50%",
                background: "#cfe8ff",
                opacity: o,
                filter: "blur(1px)",
              }}
            />
          );
        })}
      </AbsoluteFill>

      {slide.no_caption ? null : (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,.1) 34%, rgba(0,0,0,0) 55%)",
          }}
        />
      )}

      {slide.credit ? (
        <div
          style={{
            position: "absolute",
            top: Math.round(height * 0.035),
            left: Math.round(width * 0.04),
            right: Math.round(width * 0.04),
            opacity: capOpacity,
            fontFamily: FONT,
            fontSize: Math.round(Math.min(width, height) * 0.026),
            fontWeight: 600,
            color: "rgba(255,255,255,.88)",
            textShadow: "0 1px 8px rgba(0,0,0,.95)",
          }}
        >
          {slide.credit}
        </div>
      ) : null}

      {slide.no_caption ? null : capText && captionStyle === "reel" ? (() => {
        const color = accent || "#39ff6a";
        const pop = interpolate(capFrame, [0, 7], [0.82, 1], {
          easing: Easing.out(Easing.back(1.8)),
          extrapolateRight: "clamp",
        });
        const popOpacity = interpolate(capFrame, [0, 4], [0, 1], { extrapolateRight: "clamp" });
        const base = Math.round(Math.min(width, height) * (captionPosition === "bottom" ? 0.066 : 0.075) * (capScale && capScale > 0 ? capScale : 1));
        const parts = String(capText).split(/(\*[^*]+\*)/g).filter(Boolean);
        return (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              ...(captionPosition === "bottom"
                ? { bottom: Math.round(height * (capBottom !== undefined && capBottom >= 0 ? capBottom : 0.14)) }
                : { top: "50%" }),
              padding: `0 ${Math.round(width * 0.07)}px`,
              textAlign: "center",
              transform: `${captionPosition === "bottom" ? "" : "translateY(-50%) "}scale(${pop})`,
              transformOrigin: captionPosition === "bottom" ? "50% 100%" : "50% 50%",
              opacity: popOpacity,
              fontFamily: FONT,
              fontSize: base,
              lineHeight: 1.25,
              fontWeight: 700,
              color: "#c8ffd8",
              textShadow: `0 0 18px ${color}99, 0 3px 14px rgba(0,0,0,.95)`,
            }}
          >
            {parts.map((part, k) =>
              part.startsWith("*") && part.endsWith("*") ? (
                <span
                  key={k}
                  style={{
                    display: "inline-block",
                    fontSize: Math.round(base * (capScale && capScale < 1 ? 1.3 : 1.45)),
                    fontWeight: 900,
                    color,
                    textShadow: `0 0 28px ${color}, 0 0 8px ${color}aa, 0 4px 16px rgba(0,0,0,.95)`,
                  }}
                >
                  {part.slice(1, -1)}
                </span>
              ) : (
                <span key={k}>{part}</span>
              )
            )}
          </div>
        );
      })() : slide.text ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: Math.round(height * 0.07),
            padding: `0 ${Math.round(width * 0.06)}px`,
            opacity: capOpacity,
            fontFamily: FONT,
            fontSize: Math.round(Math.min(width, height) * 0.045),
            lineHeight: 1.4,
            fontWeight: 700,
            color: "#f4f8fc",
            textShadow: "0 2px 14px rgba(0,0,0,.9)",
          }}
        >
          {String(slide.text).replace(/\*/g, "")}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const DynamicStory: React.FC<DynamicProps> = ({
  slides,
  audio_url,
  caption_style,
  caption_position,
  caption_scale,
  caption_bottom,
  motion,
  audio_rate,
  accent_color,
}) => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {slides.map((slide, i) => {
        const from = cursor;
        const dur = slideFrames(slide);
        cursor += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <SlideView slide={slide} index={i} captionStyle={caption_style} captionPosition={caption_position} accent={accent_color} capScale={caption_scale} capBottom={caption_bottom} motion={motion} />
            {slide.audio_url ? <Audio src={slide.audio_url} playbackRate={audio_rate || 1} /> : null}
            {slide.parts
              ? (() => {
                  let acc = 0;
                  return slide.parts.map((p, k) => {
                    const from = acc;
                    acc += Math.max(1, Math.round(Number(p.duration) * DYN_FPS));
                    return p.audio_url ? (
                      <Sequence key={k} from={from}>
                        <Audio src={p.audio_url} playbackRate={audio_rate || 1} />
                      </Sequence>
                    ) : null;
                  });
                })()
              : null}
          </Sequence>
        );
      })}
      {audio_url ? <Audio src={audio_url} /> : null}
    </AbsoluteFill>
  );
};
