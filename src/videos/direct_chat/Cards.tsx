import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// タイトルと締め。共通の TitleCard（104px）と EndCard（150px）は、この回の10文字の決めの字だと画面の幅を超えて切れる。
// そこで写して字の大きさだけを変え、締めは「話したいときは、」と「直接」の2行に割る。動きは共通の部品と同じ

export const TitleCardDC: React.FC<{ text: string; outFrom: number }> = ({ text, outFrom }) => {
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

export const EndCardDC: React.FC<{ lines: readonly string[]; sprite: string; spriteWidth?: number; spriteTop?: number }> = ({
  lines,
  sprite,
  spriteWidth = 300,
  spriteTop = 720,
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
          top: 150,
          width: "100%",
          textAlign: "center",
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          color: theme.color.ink,
          lineHeight: 1.1,
          // 1行目が横に長いので、共通の 1.5倍から始めると端で切れる。1.15倍から縮める
          transform: `scale(${interpolate(slam, [0, 1], [1.15, 1])})`,
        }}
      >
        <div style={{ fontSize: 112 }}>{lines[0]}</div>
        <div style={{ fontSize: 150 }}>{lines[1]}</div>
      </div>
      <div style={{ position: "absolute", top: 480, width: "100%", textAlign: "center", fontFamily: theme.fontFamily, fontWeight: 800, color: theme.color.ink }}>
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
