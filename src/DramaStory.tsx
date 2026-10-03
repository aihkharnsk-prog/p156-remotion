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
import {
  getAudioDurationInSeconds,
  getVideoMetadata,
} from "@remotion/media-utils";

export const DRAMA_FPS = 30;

export type Shot = {
  video_url?: string; // คลิปจาก Leonardo (ถ้าไม่มีจะใช้ภาพนิ่ง + ซูมแทน)
  image_url?: string;
  audio_url?: string; // เสียงพากย์ของช็อตนี้ (ถ้ามี)
  text?: string; // ซับไตเติล
  duration: number; // วินาที (เซิร์ฟเวอร์ปรับให้ยาวพอกับเสียงแล้ว)
  video_duration?: number; // ความยาวคลิปจริง (วินาที) เซิร์ฟเวอร์ใส่ให้
};

export type DramaProps = {
  shots: Shot[];
  music_url?: string;
  width?: number;
  height?: number;
};

export const shotFrames = (s: Shot) =>
  Math.max(1, Math.round(s.duration * DRAMA_FPS));

export const dramaTotalFrames = (shots: Shot[]) =>
  Math.max(1, shots.reduce((sum, s) => sum + shotFrames(s), 0));

// วัดความยาวเสียง/คลิปจริง แล้วยืดช็อตให้พอดีกับเสียงพากย์
export const prepareDramaProps = async (props: DramaProps): Promise<DramaProps> => {
  const shots = await Promise.all(
    props.shots.map(async (s) => {
      let duration = Number(s.duration) > 0 ? Number(s.duration) : 4;
      let video_duration: number | undefined;
      if (s.audio_url) {
        try {
          const a = await getAudioDurationInSeconds(s.audio_url);
          duration = Math.max(duration, a + 0.4);
        } catch (e) {
          console.warn("audio duration failed", s.audio_url, e);
        }
      }
      if (s.video_url) {
        try {
          const v = await getVideoMetadata(s.video_url);
          video_duration = v.durationInSeconds;
        } catch (e) {
          console.warn("video metadata failed", s.video_url, e);
        }
      }
      return { ...s, duration, video_duration };
    })
  );
  return { ...props, shots };
};

const FONT = "Noto Sans Thai, Noto Sans, sans-serif";

const ShotView: React.FC<{ shot: Shot; index: number }> = ({ shot, index }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const dur = shotFrames(shot);

  const fadeIn = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp" });
  const capOpacity = Math.min(fadeIn, fadeOut);

  // คลิปสั้นกว่าช็อต → เล่นช้าลงให้พอดี (ไม่ค้างภาพสุดท้าย)
  const playbackRate =
    shot.video_duration && shot.video_duration > 0
      ? Math.min(1, shot.video_duration / shot.duration)
      : 1;

  const zoomIn = index % 2 === 0;
  const scale = interpolate(frame, [0, dur], zoomIn ? [1.0, 1.12] : [1.12, 1.0], {
    easing: Easing.inOut(Easing.ease),
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {shot.video_url ? (
        <OffthreadVideo
          src={shot.video_url}
          muted
          playbackRate={playbackRate}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : shot.image_url ? (
        <Img
          src={shot.image_url}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 30%, rgba(0,0,0,0) 50%)",
        }}
      />

      {shot.audio_url ? <Audio src={shot.audio_url} /> : null}

      {shot.text ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: Math.round(height * 0.14),
            padding: `0 ${Math.round(width * 0.07)}px`,
            textAlign: "center",
            opacity: capOpacity,
            fontFamily: FONT,
            fontSize: Math.round(width * 0.062),
            lineHeight: 1.35,
            fontWeight: 800,
            color: "#ffffff",
            textShadow:
              "0 0 6px rgba(0,0,0,.95), 0 3px 12px rgba(0,0,0,.9)",
          }}
        >
          {shot.text}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const DramaStory: React.FC<DramaProps> = ({ shots, music_url }) => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {shots.map((shot, i) => {
        const from = cursor;
        const dur = shotFrames(shot);
        cursor += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <ShotView shot={shot} index={i} />
          </Sequence>
        );
      })}
      {music_url ? <Audio src={music_url} volume={0.12} /> : null}
    </AbsoluteFill>
  );
};
