import React from "react";
import { staticFile, delayRender, continueRender } from "remotion";

// โหลดฟอนต์ Kanit จาก public/fonts ครั้งเดียว (ใช้กับรูปปกและฉากแอนิเมชัน)
let loaded: Promise<unknown> | null = null;
export const loadKanit = () => {
  if (!loaded) {
    const faces = [
      ["fonts/Kanit-SemiBold.ttf", "600"],
      ["fonts/Kanit-Bold.ttf", "700"],
      ["fonts/Kanit-ExtraBold.ttf", "800"],
      ["fonts/Kanit-Black.ttf", "900"],
    ].map(([f, w]) => {
      const ff = new FontFace("Kanit", `url(${staticFile(f)})`, { weight: w });
      return ff.load().then((x) => (document as any).fonts.add(x));
    });
    loaded = Promise.all(faces).catch(() => null);
  }
  return loaded;
};

export const useKanit = () => {
  const [h] = React.useState(() => delayRender("kanit"));
  React.useEffect(() => {
    loadKanit().then(() => continueRender(h));
  }, [h]);
};

export const KANIT = "Kanit, Noto Sans Thai, sans-serif";
