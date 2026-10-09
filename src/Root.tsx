import React from "react";
import { Composition, staticFile } from "remotion";
import { CardStory, TOTAL_FRAMES, FPS } from "./CardStory";
import {
  DynamicStory,
  DynamicProps,
  DYN_FPS,
  totalFrames,
} from "./DynamicStory";
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
          // ถ้ามีเสียงพากย์ → ปรับความยาวสไลด์ให้พอดีกับเสียง (เว้นท้าย 0.8 วินาที)
          if (props.audio_url && props.fit_audio !== false) {
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
