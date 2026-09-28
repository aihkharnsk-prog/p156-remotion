import React from "react";
import { Composition, staticFile } from "remotion";
import { CardStory, TOTAL_FRAMES, FPS } from "./CardStory";
import {
  DynamicStory,
  DynamicProps,
  DYN_FPS,
  totalFrames,
} from "./DynamicStory";

const defaultDynamicProps: DynamicProps = {
  slides: [
    { image_url: staticFile("card.png"), text: "ตัวอย่างสไลด์ที่ 1", duration: 3 },
    { image_url: staticFile("card.png"), text: "ตัวอย่างสไลด์ที่ 2", duration: 3 },
  ],
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
    </>
  );
};
