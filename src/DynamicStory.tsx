import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

export const DYN_FPS = 30;

export type Slide = {
  image_url: string;
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
  const { width, height } = useVideoConfig();
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

  return (
    <AbsoluteFill style={{ backgroundColor: "#050a12", overflow: "hidden" }}>
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
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,.1) 34%, rgba(0,0,0,0) 55%)",
        }}
      />
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
