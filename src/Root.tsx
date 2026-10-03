import React from "react";
import { Composition, staticFile } from "remotion";
import { CardStory, TOTAL_FRAMES, FPS } from "./CardStory";
import {
  DynamicStory,
  DynamicProps,
  DYN_FPS,
  totalFrames,
} from "./DynamicStory";
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
        calculateMetadata={({ props }) => ({
          durationInFrames: totalFrames(props.slides),
          width: props.width ?? 1920,
          height: props.height ?? 1080,
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
