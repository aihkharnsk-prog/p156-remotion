import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

export const DYN_FPS = 30;

export type Slide = {
  // ต้องมีอย่างน้อยหนึ่งอย่าง: image_url หรือ video_url
  image_url?: string; // ภาพนิ่ง (ซูม/แพนอัตโนมัติ) — ถ้ามี video_url ด้วยจะเป็นภาพรองพื้นหลังคลิป
  video_url?: string; // คลิปที่จะแทรก (ต้องเป็นคลิปที่มีสิทธิ์ใช้งานเท่านั้น)
  video_start?: number; // เริ่มเล่นคลิปที่วินาทีที่เท่าไร (ค่าเริ่มต้น 0)
  video_end?: number; // เล่นถึงวินาทีที่เท่าไร (ไม่ใส่ = เล่นตามความยาวสไลด์)
  video_volume?: number; // เสียงของคลิปต้นฉบับ 0-1 (ค่าเริ่มต้น 0 = ปิดเสียง)
  credit?: string; // เครดิตที่มุมซ้ายบน เช่น "Video: Pexels / ชื่อผู้ถ่าย"
  text?: string;
  duration: number; // seconds
};

export type DynamicProps = {
  slides: Slide[];
  audio_url?: string;
  width?: number; // default 1920 (YouTube แนวนอน) — ส่ง 1080 + height 1920 ถ้าทำ Shorts
  height?: number; // default 1080
};

export const slideFrames = (s: Slide) =>
  Math.max(1, Math.round(s.duration * DYN_FPS));

export const totalFrames = (slides: Slide[]) =>
  Math.max(
    1,
    slides.reduce((sum, s) => sum + slideFrames(s), 0)
  );

const FONT = "Noto Sans Thai, Noto Sans CJK JP, Noto Sans, sans-serif";

const SlideView: React.FC<{ slide: Slide; index: number }> = ({
  slide,
  index,
}) => {
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
      {slide.image_url ? (
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

      {slide.video_url ? (
        <Sequence from={0} durationInFrames={videoFrames}>
          <AbsoluteFill>
            <OffthreadVideo
              src={slide.video_url}
              muted={videoVolume <= 0}
              volume={videoVolume}
              trimBefore={startFrames > 0 ? startFrames : undefined}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        </Sequence>
      ) : null}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,.1) 34%, rgba(0,0,0,0) 55%)",
        }}
      />

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

      {slide.text ? (
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
          {slide.text}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const DynamicStory: React.FC<DynamicProps> = ({ slides, audio_url }) => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {slides.map((slide, i) => {
        const from = cursor;
        const dur = slideFrames(slide);
        cursor += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <SlideView slide={slide} index={i} />
          </Sequence>
        );
      })}
      {audio_url ? <Audio src={audio_url} /> : null}
    </AbsoluteFill>
  );
};
