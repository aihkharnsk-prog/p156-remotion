import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

export const FPS = 30;

// เนื้อหาบรรยาย — แก้ตัวเลขให้ตรงกับภาพจริง (15 ตัว ไม่ใช่ 17)
const lines: { meta: string; text: string; durInFrames: number }[] = [
  { meta: "0:00", text: "การ์ดใบนี้พิมพ์ออกมาไม่กี่สิบใบ...และผมมีมันอยู่ในมือ", durInFrames: 126 },
  { meta: "0:04", text: "นี่คือ 未来への可能性!! หรือ “Future Potential!!” การ์ดโปรโมเลข P-156 จาก Digimon Card Game", durInFrames: 168 },
  { meta: "0:10", text: "สังเกตดีๆ — การ์ดใบนี้ไม่ได้เล่าเรื่องตัวละครตัวเดียวจากตอนไหนตอนหนึ่ง", durInFrames: 138 },
  { meta: "0:14", text: "แต่รวมภาพพาร์ทเนอร์ดิจิมอน 15 ตัว ไว้ในใบเดียว วาดขึ้นใหม่ทั้งหมดเป็นสไตล์พิกเซล", durInFrames: 180 },
  { meta: "0:20", text: "เพราะการ์ดนี้ออกมาโปรโมต “Digimon UP” เกมมือถือใหม่จาก Bandai Namco ที่เปิดตัว 15 ก.ค. 2026", durInFrames: 186 },
  { meta: "0:27", text: "คอนเซปต์เกมคือ “ได้กลับมาแข็งแกร่งไปกับดิจิมอนอีกครั้ง” — ภาพทุกตัวถูกวาดใหม่เฉพาะสำหรับเกมนี้", durInFrames: 192 },
  { meta: "0:33", text: "มุมขวาการ์ดพิมพ์ชัดว่า NOT FOR SALE — นี่คือของแจกจากแคมเปญ ไม่ใช่การ์ดวางขายทั่วไป", durInFrames: 162 },
  { meta: "0:39", text: "เอฟเฟกต์ในเกม: เรียกทามเมอร์ 1 ตัว แล้วนำดิจิมอนคอสต์ 3 หรือต่ำกว่าสีเดียวกันลงสนามได้ฟรี", durInFrames: 204 },
  { meta: "0:46", text: "การ์ดหายากที่มีเรื่องราวจริง...ตามดูใบต่อไปได้ในคลิปหน้าครับ", durInFrames: 150 },
];

export const TOTAL_FRAMES = lines.reduce((sum, l) => sum + l.durInFrames, 0);

const KenBurnsImage: React.FC<{ localFrame: number; segDur: number }> = ({
  localFrame,
  segDur,
}) => {
  const scale = interpolate(localFrame, [0, segDur], [1.0, 1.12], {
    easing: Easing.inOut(Easing.ease),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(localFrame, [0, segDur], [0, -2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile("card.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 22%",
          transform: `scale(${scale}) translate(${translateX}%, -2%)`,
        }}
      />
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.15) 34%, rgba(0,0,0,0) 55%), linear-gradient(to bottom, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 22%)",
        }}
      />
    </AbsoluteFill>
  );
};

const CaptionLine: React.FC<{ meta: string; text: string; localFrame: number; segDur: number }> = ({
  meta,
  text,
  localFrame,
  segDur,
}) => {
  const fadeIn = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(localFrame, [segDur - 12, segDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 90,
        padding: "0 44px",
        opacity,
      }}
    >
      <div
        style={{
          fontSize: 15,
          color: "#3fa9dc",
          letterSpacing: 0.3,
          marginBottom: 10,
          fontFamily: "Noto Sans Thai, Noto Sans, system-ui, sans-serif",
        }}
      >
        {meta}
      </div>
      <div
        style={{
          fontSize: 40,
          lineHeight: 1.42,
          fontWeight: 600,
          color: "#eef3f8",
          textShadow: "0 2px 14px rgba(0,0,0,.85)",
          fontFamily: "Noto Sans Thai, Noto Sans, system-ui, sans-serif",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const CardStory: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050a12" }}>
      {lines.map((line, i) => {
        const from = cursor;
        cursor += line.durInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={line.durInFrames}>
            <SegmentInner line={line} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const SegmentInner: React.FC<{
  line: { meta: string; text: string; durInFrames: number };
}> = ({ line }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <KenBurnsImage localFrame={frame} segDur={line.durInFrames} />
      <CaptionLine
        meta={line.meta}
        text={line.text}
        localFrame={frame}
        segDur={line.durInFrames}
      />
    </AbsoluteFill>
  );
};
