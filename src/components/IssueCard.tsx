import React from "react";
import { theme } from "../theme";

export const CARD_SIZE = { w: 130, h: 78 };

// issue のカード。crumpled なら丸めた紙の玉、そうでなければカンバンに貼る平らなカード。
// written（0〜1）は書きかけの度合いで、行が左から伸びる。squash は貼り付いた瞬間の横に潰れた形（1 で潰れ、0 で元の形）。
// pin を付けると、カンバンに留める丸い押しピンを上に描く
export const IssueCard: React.FC<{
  x: number;
  y: number;
  crumpled?: boolean;
  rotate?: number;
  scale?: number;
  squash?: number;
  written?: number;
  pin?: boolean;
}> = ({ x, y, crumpled = false, rotate = 0, scale = 1, squash = 0, written = 1, pin = false }) => {
  const sx = 1 + squash * 0.35;
  const sy = 1 - squash * 0.35;
  const common: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    transform: `rotate(${rotate}deg) scale(${scale * sx}, ${scale * sy})`,
  };
  if (crumpled) {
    return (
      <svg width={80} height={80} viewBox="0 0 70 70" style={common}>
        <path
          d="M35 4 L52 10 L64 26 L62 46 L50 62 L30 66 L12 56 L5 38 L10 18 L22 8 Z"
          fill={theme.color.card}
          stroke={theme.color.ink}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path d="M20 22 L34 34 L28 50 M40 18 L44 36 L56 44" fill="none" stroke={theme.color.ink} strokeWidth={3} strokeLinecap="round" />
      </svg>
    );
  }
  const line = (w: number, start: number) => Math.max(0, Math.min(1, (written - start) / 0.34)) * w;
  return (
    <div
      style={{
        ...common,
        width: CARD_SIZE.w,
        height: CARD_SIZE.h,
        background: theme.color.card,
        border: `4px solid ${theme.color.ink}`,
        borderRadius: 10,
        padding: "8px 10px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: line(34, 0), height: 10, background: theme.color.cardTag, borderRadius: 5 }} />
      <div style={{ width: line(96, 0.33), height: 8, background: "#C9C2B6", borderRadius: 4, marginTop: 10 }} />
      <div style={{ width: line(70, 0.66), height: 8, background: "#C9C2B6", borderRadius: 4, marginTop: 8 }} />
      {pin ? (
        <div
          style={{
            position: "absolute",
            left: CARD_SIZE.w / 2 - 15,
            top: -16,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: "#E0554A",
            border: `4px solid ${theme.color.ink}`,
          }}
        />
      ) : null}
    </div>
  );
};
