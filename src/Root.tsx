import React from "react";
import { Composition, staticFile } from "remotion";
import { CardStory, TOTAL_FRAMES, FPS } from "./CardStory";
import {
  DynamicStory,
  DynamicProps,
  DYN_FPS,
  totalFrames,
} from "./DynamicStory";
import { Thumb, defaultThumbProps } from "./Thumb";
import { Outro, defaultOutroProps } from "./Outro";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import {
  DramaStory,
  DramaProps,
  DRAMA_FPS,
  dramaTotalFrames,
  prepareDramaProps,
} from "./DramaStory";

const defaultDynamicProps: DynamicProps = {
  slides: [
    { image_url: staticFile("card.png"), text: "ตัวอย่างสไลด์ที่ 1", duration: 3 },
    { image_url: staticFile("card.png"), text: "ตัวอย่างสไลด์ที่ 2", duration: 3 },
  ],
};

const defaultDramaProps: DramaProps = {
  shots: [
    { image_url: staticFile("card.png"), text: "ตัวอย่างช็อตที่ 1", duration: 3 },
    { image_url: staticFile("card.png"), text: "ตัวอย่างช็อตที่ 2", duration: 3 },
  ],
  width: 1080,
  height: 1920,
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="CardStory"
        component={CardStory}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="DynamicStory"
        component={DynamicStory}
        durationInFrames={90}
        fps={DYN_FPS}
        width={1920}
        height={1080}
        defaultProps={defaultDynamicProps}
        calculateMetadata={async ({ props }) => {
          let slides = props.slides;
          const rate = props.audio_rate && props.audio_rate > 0 ? props.audio_rate : 1;
          // ถ้ามีเสียงพากย์ → ปรับความยาวสไลด์ให้พอดีกับเสียง (เว้นท้าย 0.8 วินาที)
          // ถ้าสไลด์มีเสียงของตัวเอง → ความยาวสไลด์ = ความยาวเสียงช่วงนั้น + เว้นจังหวะ (ตรงกันเป๊ะ ไม่ต้องเดาสัดส่วน)
          if (slides.some((s) => s.audio_url || s.parts?.some((p) => p.audio_url))) {
            slides = await Promise.all(
              slides.map(async (s, i) => {
                const lastSlide = i === slides.length - 1;
                if (s.parts && s.parts.length) {
                  const parts = await Promise.all(
                    s.parts.map(async (p, k) => {
                      if (!p.audio_url) return p;
                      try {
                        const sec = (await getAudioDurationInSeconds(p.audio_url)) / rate;
                        const lastPart = k === s.parts!.length - 1;
                        const pad = lastPart ? (lastSlide ? 0.8 : 0.3) : 0.1;
                        const frames = Math.max(1, Math.round((sec + pad) * DYN_FPS));
                        return { ...p, duration: frames / DYN_FPS };
                      } catch (e) {
                        console.warn("part audio duration failed", p.audio_url, e);
                        return p;
                      }
                    })
                  );
                  const total = parts.reduce((a, p) => a + Math.max(1, Math.round(Number(p.duration) * DYN_FPS)), 0);
                  return { ...s, parts, duration: total / DYN_FPS };
                }
                if (!s.audio_url) return s;
                try {
                  const sec = (await getAudioDurationInSeconds(s.audio_url)) / rate;
                  const pad = lastSlide ? 0.8 : 0.3;
                  return { ...s, duration: sec + pad };
                } catch (e) {
                  console.warn("slide audio duration failed", s.audio_url, e);
                  return s;
                }
              })
            );
          } else if (props.audio_url && props.fit_audio !== false) {
            try {
              const audioSec = await getAudioDurationInSeconds(props.audio_url);
              const slideSec = slides.reduce((a, s) => a + Number(s.duration), 0);
              const target = audioSec + 0.8;
              const ratio = target / slideSec;
              if (slideSec > 0 && Math.abs(ratio - 1) > 0.02) {
                slides = slides.map((s) => ({ ...s, duration: Number(s.duration) * ratio }));
              }
            } catch (e) {
              console.warn("audio duration failed", props.audio_url, e);
            }
          }
          return {
            props: { ...props, slides },
            durationInFrames: totalFrames(slides),
            width: props.width ?? 1920,
            height: props.height ?? 1080,
          };
        }}
      />
      <Composition
        id="Outro"
        component={Outro}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultOutroProps}
      />
      <Composition
        id="Thumb"
        component={Thumb}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultThumbProps}
        calculateMetadata={({ props }) => ({
          width: props.width ?? 1080,
          height: props.height ?? 1920,
        })}
      />
      <Composition
        id="DramaStory"
        component={DramaStory}
        durationInFrames={90}
        fps={DRAMA_FPS}
        width={1080}
        height={1920}
        defaultProps={defaultDramaProps}
        calculateMetadata={async ({ props }) => {
          const prepared = await prepareDramaProps(props);
          return {
            props: prepared,
            durationInFrames: dramaTotalFrames(prepared.shots),
            width: prepared.width ?? 1080,
            height: prepared.height ?? 1920,
          };
        }}
      />
    </>
  );
};
