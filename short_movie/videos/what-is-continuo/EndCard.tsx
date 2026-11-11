import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// 締め。src/components/EndCard.tsx を写し、15文字の締め「見るのはエージェントでなく、仕事」を2行に割った。
// 1行に入れると、150px の字では画面から大きくはみ出す。文言は変えず、「、」の後ろで割って「仕事」を大きく置く
export const EndCard: React.FC<{ lines: [string, string]; sprite: string; spriteWidth?: number; spriteTop?: number }> = ({ lines, sprite, spriteWidth = 300, spriteTop = 720 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 8, stiffness: 260 } });
  const hop = spring({ frame: frame - 8, fps, config: { damping: 6, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", inset: 0, background: theme.color.endBackground }}>
      <div
        style={{
          position: "absolute",
          top: 110,
          width: "100%",
          textAlign: "center",
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          color: theme.color.ink,
          lineHeight: 1.1,
          transform: `scale(${interpolate(slam, [0, 1], [1.1, 1])})`,
        }}
      >
        <div style={{ fontSize: 60 }}>{lines[0]}</div>
        <div style={{ fontSize: 170 }}>{lines[1]}</div>
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
