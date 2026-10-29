import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

// キャラクターの頭の上に浮かべる名前の札。ロボットと同じ色の丸い札に白い字で名前を書く。
// (cx, tipY) は札の下の三角の先の位置。durationInFrames の最後の6フレームで消える
export const NameTag: React.FC<{ cx: number; tipY: number; name: string; color: string; durationInFrames: number; fontSize?: number }> = ({
  cx,
  tipY,
  name,
  color,
  durationInFrames,
  fontSize = 34,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 10, stiffness: 220 } });
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bob = Math.sin(frame / 6) * 4;
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: tipY + bob,
        transform: `translate(-50%, -100%) scale(${pop})`,
        transformOrigin: "50% 100%",
        opacity: out,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          padding: "6px 22px",
          background: color,
          border: `5px solid ${theme.color.ink}`,
          borderRadius: 999,
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          color: "#FFFFFF",
          WebkitTextStroke: `6px ${theme.color.ink}`,
          paintOrder: "stroke fill",
        }}
      >
        {name}
      </div>
      <svg width={30} height={18} viewBox="0 0 30 18" style={{ marginTop: -5 }}>
        <path d="M2 0 L15 15 L28 0" fill={color} stroke={theme.color.ink} strokeWidth={4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
