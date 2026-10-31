import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";
import { useKanit, KANIT } from "./fonts";
import { pixelFridge, FOCUS, GW, GH } from "./pixelFridge";
import { vecFridge } from "./vecFridge";
import { SCENES as S1 } from "./vecScenes";
import { SCENES2 } from "./vecScenes2";
import { SCENES3 } from "./vecScenes3";
import { SCENE_SMOKE } from "./vecHome_smoke";
import { SCENE_HAIRDRYER } from "./vecHome_hairdryer";
import { SCENE_INDUCTION } from "./vecHome_induction";
import { SCENE_TOASTER } from "./vecHome_toaster";
import { SCENE_AIRFRYER } from "./vecHome_airfryer";
import { SCENE_FAN } from "./vecHome_fan";
import { SCENE_VACUUM } from "./vecHome_vacuum";
import { SCENE_LED } from "./vecHome_led";
import { SCENE_BREAKER } from "./vecHome_breaker";
import { SCENE_PUMP } from "./vecHome_pump";
import { SCENE_FLASK } from "./vecHome_flask";
import { SCENE_IRON } from "./vecHome_iron";
const SCENES: Record<string, any> = { ...S1, ...SCENES2, ...SCENES3, ...{ smoke: SCENE_SMOKE, hairdryer: SCENE_HAIRDRYER, induction: SCENE_INDUCTION, toaster: SCENE_TOASTER, airfryer: SCENE_AIRFRYER, fan: SCENE_FAN, vacuum: SCENE_VACUUM, led: SCENE_LED, breaker: SCENE_BREAKER, pump: SCENE_PUMP, flask: SCENE_FLASK, iron: SCENE_IRON } };

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

// แบ่งซับเป็นวลียาว ~10-16 ตัวอักษร (ไม่ให้เหลือชิ้นสั้นเกิน)
const chunks = (t: string): string[] => {
  const ws = words(t);
  const out: string[] = [];
  let cur = "";
  for (const w of ws) {
    if (cur && (cur + w).length > 16) { out.push(cur); cur = w; } else cur += w;
    if (cur.length >= 11 && /[ ,.!?]$/.test(w)) { out.push(cur); cur = ""; }
  }
  if (cur) { if (out.length && cur.length < 6) out[out.length - 1] += cur; else out.push(cur); }
  return out;
};

export const PixelFridge: React.FC<{
  frame: number;
  dur: number;
  parts: { text: string; cue?: string; duration?: number }[];
  starts: number[];
  vec?: boolean;
  scene?: string;
}> = ({ frame, dur, parts, starts, vec, scene }) => {
  useKanit();
  let k = 0;
  for (let i = 0; i < starts.length; i++) if (frame >= starts[i]) k = i;
  const SC = scene ? SCENES[scene] : null;
  const FC: Record<string, any> = SC ? SC.focus : FOCUS;
  const cue = (i: number) => (FC[parts[i]?.cue || ""] ? parts[i].cue! : "all");
  const cur = FC[cue(k)];
  const prev = FC[k > 0 ? cue(k - 1) : cue(k)];
  const ef = frame - (starts[k] || 0);
  const e = interpolate(ef, [0, 22], [0, 1], { ...C, easing: Easing.inOut(Easing.cubic) });
  const L = (a: number, b: number) => a + (b - a) * e;
  const cx = L(prev.cx, cur.cx), cy = L(prev.cy, cur.cy), z = L(prev.z, cur.z);
  const cold = interpolate(frame, [dur * 0.08, dur * 0.88], [0, 1], { ...C, easing: Easing.inOut(Easing.quad) });
  const temp = Math.round(24 - 20 * cold);
  const rs = vec || SC ? [] : pixelFridge({ frame, cold, focus: cue(k), heat: true, run: true });
  const pk0 = starts[k] || 0, pk1 = k + 1 < starts.length ? starts[k + 1] : dur;
  const vecSvg = SC ? SC.render({ frame, cue: cue(k), p: Math.min(1, Math.max(0, (frame - pk0) / Math.max(1, pk1 - pk0))), ef }) : vec ? vecFridge({ frame, cold, focus: cue(k), heat: true, run: true }) : "";

  // ซับทีละคำ
  const part = parts[k];
  const pStart = starts[k] || 0;
  const pEnd = k + 1 < starts.length ? starts[k + 1] : dur;
  const ws = part ? (SC ? chunks(part.text) : words(part.text)) : [];
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
  const wp = interpolate(wf - wStart, [0, 5], [SC ? 0.92 : 0.7, 1], { ...C, easing: Easing.out(Easing.back(2)) });
  const label = FC[cue(k)]?.label;
  const box = FC[cue(k)]?.box;
  const lp = interpolate(ef, [10, 22], [0, 1], C);

  return (
    <AbsoluteFill style={{ background: "#f1dfb9" }}>
      <svg width={1080} height={1920} viewBox={`0 0 ${GW} ${GH}`} shapeRendering={vec ? "geometricPrecision" : "crispEdges"} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(135 240) scale(${z}) translate(${-cx} ${-cy})`}>
          {vec || SC ? <g dangerouslySetInnerHTML={{ __html: vecSvg }} /> : null}
          {rs.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.c} opacity={r.o} />
          ))}
          {!SC ? <text x={25} y={286} fontSize={9} fontFamily={KANIT} fontWeight={900} textAnchor="middle" fill="#46526b" shapeRendering="auto">
            {temp}°C
          </text> : null}
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
        <div style={{ position: "absolute", left: 60, right: 60, top: SC ? 1150 : 1130, textAlign: "center", lineHeight: 1.15, transform: `scale(${wp})` }}>
          <span
            style={{
              fontFamily: KANIT,
              fontWeight: 900,
              fontSize: SC ? 92 : 128,
              color: "#fff",
              WebkitTextStroke: SC ? "12px #17102b" : "16px #17102b",
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
