import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../_shared/theme";

// 冒頭のタイトルを2行で出す。他人のコメントの回の TitleCard2 を写したもの（回をまたいで import できないため）。
// 「いつでも、自分の分は残ってる」は14字あり、土台の TitleCard（104px・1行）では画面の幅に収まらないので、lines の行ごとに折る
export const TitleCard2: React.FC<{ lines: readonly string[]; outFrom: number }> = ({ lines, outFrom }) => {
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
          fontSize: 104,
          lineHeight: 1.25,
          whiteSpace: "pre",
          textAlign: "center",
          color: theme.color.caption,
          WebkitTextStroke: `20px ${theme.color.captionStroke}`,
          paintOrder: "stroke fill",
          transform: `scale(${inPop * out}) rotate(${interpolate(inPop, [0, 1], [-8, -3])}deg)`,
        }}
      >
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
};
