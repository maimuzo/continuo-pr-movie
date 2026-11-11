import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// 共通の EndCard（src/components/EndCard.tsx）の写し（カンバン1枚の回の写しをもとにした）。締めの「あとは Ready に置くだけ」は1行では1080pxに収まらないので、
// 字は変えずに「あとは」「Ready に置くだけ」の2行に分けて受け取る。長い方の行が、大きい字から縮める頭のコマ（1.12倍）でも収まるよう、字を110pxにした。
// 締め。中央に決めの字幕、下に continuo の名前と URL、跳ねるキャラクター。
// 字幕は最初のフレームから見えるように、透明から出さず、大きい字から縮めて「ドン」と置く
// spriteWidth はキャラクターの幅。横に長いクジラと縦に長いロボットで変えられるようにする
export const EndCard: React.FC<{ lines: readonly string[]; sprite: string; spriteWidth?: number; spriteTop?: number }> = ({ lines, sprite, spriteWidth = 200, spriteTop = 700 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 8, stiffness: 260 } });
  const hop = spring({ frame: frame - 8, fps, config: { damping: 6, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", inset: 0, background: theme.color.endBackground }}>
      <div
        style={{
          position: "absolute",
          top: 160,
          width: "100%",
          textAlign: "center",
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 110,
          lineHeight: "136px",
          whiteSpace: "nowrap",
          color: theme.color.ink,
          transform: `scale(${interpolate(slam, [0, 1], [1.12, 1])})`,
        }}
      >
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 450, width: "100%", textAlign: "center", fontFamily: theme.fontFamily, fontWeight: 800, color: theme.color.ink }}>
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
