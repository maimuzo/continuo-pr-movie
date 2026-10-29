import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// 冒頭のタイトル（定額のままの回の写し。11字が1行に収まるよう字を 92 にし、折り返さない）。弾んで出て、outFrom から縮んで消える
export const TitleCard: React.FC<{ text: string; outFrom: number }> = ({ text, outFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inPop = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const out = interpolate(frame, [outFrom, outFrom + 9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 92,
          whiteSpace: "nowrap",
          color: theme.color.caption,
          WebkitTextStroke: `20px ${theme.color.captionStroke}`,
          paintOrder: "stroke fill",
          transform: `scale(${inPop * out}) rotate(${interpolate(inPop, [0, 1], [-8, -3])}deg)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
