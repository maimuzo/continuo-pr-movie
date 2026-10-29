import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

// 画面の下に出す1行の焼き込み字幕。出た瞬間に少し弾む
export const Caption: React.FC<{ text: string; size?: number }> = ({ text, size = 64 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 70,
        textAlign: "center",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: size,
        color: theme.color.caption,
        WebkitTextStroke: `14px ${theme.color.captionStroke}`,
        paintOrder: "stroke fill",
        transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])})`,
        opacity: pop,
      }}
    >
      {text}
    </div>
  );
};
