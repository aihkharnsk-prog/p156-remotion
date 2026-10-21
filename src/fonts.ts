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
    // ฟอนต์กลมเป็นมิตร Mitr (ดาวน์โหลดตอน build ใน Dockerfile; ถ้าไม่มีไฟล์ก็ใช้ Noto Sans Thai แทน)
    const friend = [
      ["fonts/Mitr-Regular.ttf", "400"],
      ["fonts/Mitr-Medium.ttf", "500"],
      ["fonts/Mitr-SemiBold.ttf", "600"],
      ["fonts/Mitr-Bold.ttf", "700"],
    ].map(([f, w]) => {
      const ff = new FontFace("Mitr", `url(${staticFile(f)})`, { weight: w });
      return ff.load().then((x) => (document as any).fonts.add(x)).catch(() => null);
    });
    loaded = Promise.all([...faces, ...friend]).catch(() => null);
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

export const FRIEND = "Mitr, Noto Sans Thai, sans-serif";
