import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// src/components/EndCard.tsx の写し。締めの字「何してるか、いつでも見える」は1行の 150px では画面からはみ出すので、
// 行を分けて渡せるようにし、字の大きさも変えられるようにした。縮める前の大きさも、2行が画面に収まるよう 1.3倍にした。ほかの作りは元と同じ
export const EndCard: React.FC<{ lines: string[]; fontSize?: number; sprite: string; spriteWidth?: number; spriteTop?: number }> = ({
  lines,
  fontSize = 128,
  sprite,
  spriteWidth = 200,
  spriteTop = 700,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 8, stiffness: 260 } });
  const hop = spring({ frame: frame - 8, fps, config: { damping: 6, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", inset: 0, background: theme.color.endBackground }}>
      <div
        style={{
          position: "absolute",
          top: 140,
          width: "100%",
          textAlign: "center",
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.25,
          color: theme.color.ink,
          transform: `scale(${interpolate(slam, [0, 1], [1.3, 1])})`,
        }}
      >
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 485, width: "100%", textAlign: "center", fontFamily: theme.fontFamily, fontWeight: 800, color: theme.color.ink }}>
        <div style={{ fontSize: 76, color: theme.color.accent }}>continuo</div>
        <div style={{ fontSize: 34, marginTop: 4 }}>github.com/maimuzo/continuo</div>
      </div>
      <Img
        src={staticFile(sprite)}
        style={{
          position: "absolute",
          left: 540 - spriteWidth / 2,
          top: spriteTop,
          width: spriteWidth,
          transform: `translateY(${interpolate(hop, [0, 0.5, 1], [0, -60, 0])}px)`,
        }}
      />
    </div>
  );
};
