import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// 共通の EndCard（src/components/EndCard.tsx）の写し。締めの字が7字あり、150px では大きい字から縮める頭のコマで左右が切れるので、字を124px・縮め始めを1.2倍にした。
// 締め。中央に決めの字幕、下に continuo の名前と URL、跳ねるキャラクター。
// 字幕は最初のフレームから見えるように、透明から出さず、大きい字から縮めて「ドン」と置く
// spriteWidth はキャラクターの幅。横に長いクジラと縦に長いロボットで変えられるようにする
export const EndCard: React.FC<{ text: string; sprite: string; spriteWidth?: number; spriteTop?: number }> = ({ text, sprite, spriteWidth = 200, spriteTop = 700 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 8, stiffness: 260 } });
  const hop = spring({ frame: frame - 8, fps, config: { damping: 6, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", inset: 0, background: theme.color.endBackground }}>
      <div
        style={{
          position: "absolute",
          top: 230,
          width: "100%",
          textAlign: "center",
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 124,
          color: theme.color.ink,
          transform: `scale(${interpolate(slam, [0, 1], [1.2, 1])})`,
        }}
      >
        {text}
      </div>
      <div style={{ position: "absolute", top: 440, width: "100%", textAlign: "center", fontFamily: theme.fontFamily, fontWeight: 800, color: theme.color.ink }}>
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
