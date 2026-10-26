import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";
import { useKanit, KANIT } from "./fonts";
import { pixelFridge, FOCUS, GW, GH } from "./pixelFridge";
import { vecFridge } from "./vecFridge";

// บีต "pixel": ฉากพิกเซลตู้เย็นตัดครึ่งที่วาดด้วยโค้ด + ซับทีละคำกลางจอ
// ภาพเดียวต่อเนื่องทั้งสไลด์ กล้องซูมไปตาม cue ของแต่ละท่อน (parts[k].cue)

const C = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const words = (t: string): string[] => {
  const clean = String(t).replace(/\*/g, "");
  try {
    const seg = new (Intl as any).Segmenter("th", { granularity: "word" });
    const out: string[] = [];
    for (const x of seg.segment(clean) as any) if (x.isWordLike || /\S/.test(x.segment)) out.push(x.segment);
    // รวมคำสั้นมากเข้ากับคำถัดไปให้อ่านทัน
    const merged: string[] = [];
    for (const w of out) {
      const last = merged[merged.length - 1];
      if (last !== undefined && last.length < 2) merged[merged.length - 1] = last + w;
      else merged.push(w);
    }
    return merged.filter((w) => w.trim());
  } catch {
    return clean.match(/.{1,4}/g) || [];
  }
};

export const PixelFridge: React.FC<{
  frame: number;
  dur: number;
  parts: { text: string; cue?: string; duration?: number }[];
  starts: number[];
  vec?: boolean;
}> = ({ frame, dur, parts, starts, vec }) => {
  useKanit();
  let k = 0;
  for (let i = 0; i < starts.length; i++) if (frame >= starts[i]) k = i;
  const cue = (i: number) => (FOCUS[parts[i]?.cue || ""] ? parts[i].cue! : "all");
  const cur = FOCUS[cue(k)];
  const prev = FOCUS[k > 0 ? cue(k - 1) : cue(k)];
  const ef = frame - (starts[k] || 0);
  const e = interpolate(ef, [0, 22], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const L = (a: number, b: number) => a + (b - a) * e;
  const cx = L(prev.cx, cur.cx), cy = L(prev.cy, cur.cy), z = L(prev.z, cur.z);
  const cold = interpolate(frame, [dur * 0.08, dur * 0.88], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const temp = Math.round(24 - 20 * cold);
  const rs = vec ? [] : pixelFridge({ frame, cold, focus: cue(k), heat: true, run: true });
  const vecSvg = vec ? vecFridge({ frame, cold, focus: cue(k), heat: true, run: true }) : "";

  // ซับทีละคำ
  const part = parts[k];
  const pStart = starts[k] || 0;
  const pEnd = k + 1 < starts.length ? starts[k + 1] : dur;
  const ws = part ? words(part.text) : [];
  const tot = ws.reduce((a, w) => a + w.length + 1, 0) || 1;
  const span = Math.max(1, pEnd - pStart - 6);
  let acc = 0, wi = 0;
  const wf = Math.max(0, frame - pStart);
  for (let i = 0; i < ws.length; i++) {
    if (wf >= (acc / tot) * span) wi = i;
    acc += ws[i].length + 1;
  }
  let wStart = 0;
  acc = 0;
  for (let i = 0; i < wi; i++) acc += ws[i].length + 1;
  wStart = (acc / tot) * span;
  const wp = interpolate(wf - wStart, [0, 5], [0.7, 1], { ...C, easing: Easing.out(Easing.back(2)) });
  const label = FOCUS[cue(k)]?.label;
  const box = FOCUS[cue(k)]?.box;
  const lp = interpolate(ef, [10, 22], [0, 1], C);

  return (
    <AbsoluteFill style={{ background: "#f1dfb9" }}>
      <svg width={1080} height={1920} viewBox={`0 0 ${GW} ${GH}`} shapeRendering={vec ? "geometricPrecision" : "crispEdges"} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(135 240) scale(${z}) translate(${-cx} ${-cy})`}>
          {vec ? <g dangerouslySetInnerHTML={{ __html: vecSvg }} /> : null}
          {rs.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.c} opacity={r.o} />
          ))}
          <text x={25} y={286} fontSize={9} fontFamily={KANIT} fontWeight={900} textAnchor="middle" fill="#46526b" shapeRendering="auto">
            {temp}°C
          </text>
          {label && box ? (
            <text
              x={box[0] + box[2] / 2}
              y={box[1] - 5}
              fontSize={9}
              fontFamily={KANIT}
              fontWeight={900}
              textAnchor="middle"
              fill="#ffe14a"
              stroke="#4a2208"
              strokeWidth={3}
              paintOrder="stroke"
              strokeLinejoin="round"
              opacity={lp}
              shapeRendering="auto"
            >
              {label}
            </text>
          ) : null}
        </g>
      </svg>
      {ws.length ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1130, textAlign: "center", transform: `scale(${wp})` }}>
          <span
            style={{
              fontFamily: KANIT,
              fontWeight: 900,
              fontSize: 128,
              color: "#fff",
              WebkitTextStroke: "16px #17102b",
              paintOrder: "stroke fill",
              strokeLinejoin: "round",
              textShadow: "0 8px 0 #17102b",
              letterSpacing: 2,
            }}
          >
            {ws[wi]}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
