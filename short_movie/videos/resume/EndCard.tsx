import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// 締め（src/components/EndCard.tsx の写し）。この回の締めの字は9文字で、150px では1行に収まらないので fontSize を渡せるようにし、出だしの拡大も 1.5倍から 1.15倍に下げて画面の外へはみ出さないようにした。
// 締め。中央に決めの字幕、下に continuo の名前と URL、跳ねるキャラクター。
// 字幕は最初のフレームから見えるように、透明から出さず、大きい字から縮めて「ドン」と置く
// spriteWidth はキャラクターの幅。横に長いクジラと縦に長いロボットで変えられるようにする
export const EndCard: React.FC<{ text: string; sprite: string; spriteWidth?: number; spriteTop?: number; fontSize?: number }> = ({ text, sprite, spriteWidth = 200, spriteTop = 700, fontSize = 150 }) => {
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
          fontSize,
          whiteSpace: "nowrap",
          color: theme.color.ink,
          transform: `scale(${interpolate(slam, [0, 1], [1.15, 1])})`,
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
