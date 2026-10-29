import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// src/components/TitleCard.tsx と EndCard.tsx の写し。この回のタイトルと締めの字は1行だと
// 1080 の幅を超えるので、改行を入れて2行で出せるようにした。締めは字が長く、元の 1.5倍から縮めると
// 13.0秒の1コマ目で字が画面の端で切れるので、1.1倍から縮める（ほかの動きと色は元のまま）

export const TitleCard2: React.FC<{ text: string; outFrom: number }> = ({ text, outFrom }) => {
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
        {text}
      </div>
    </div>
  );
};

export const EndCard2: React.FC<{ text: string; sprite: string; spriteWidth?: number; spriteTop?: number }> = ({ text, sprite, spriteWidth = 200, spriteTop = 700 }) => {
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
          whiteSpace: "pre",
          lineHeight: 1.2,
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 120,
          color: theme.color.ink,
          transform: `scale(${interpolate(slam, [0, 1], [1.1, 1])})`,
        }}
      >
        {text}
      </div>
      <div style={{ position: "absolute", top: 470, width: "100%", textAlign: "center", fontFamily: theme.fontFamily, fontWeight: 800, color: theme.color.ink }}>
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
