import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// 締め。チームで入札の回の EndCardLines を写したもの。決めの字幕を2行に分けて出す。
// 「尽きても、止まらない」は10字あり、共通の EndCard の 150px では画面の幅に収まらないため。
// 出だしの拡大も 1.15 倍までにし、13.0 秒の1コマ目で字が画面の左右から切れないようにする
export const WaitEndCard: React.FC<{ lines: readonly string[]; sprite: string; spriteWidth?: number; spriteTop?: number; fontSize?: number }> = ({
  lines,
  sprite,
  spriteWidth = 200,
  spriteTop = 700,
  fontSize = 110,
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
          lineHeight: 1.15,
          color: theme.color.ink,
          transform: `scale(${interpolate(slam, [0, 1], [1.15, 1])})`,
        }}
      >
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 460, width: "100%", textAlign: "center", fontFamily: theme.fontFamily, fontWeight: 800, color: theme.color.ink }}>
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
