import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";

// 透明 PNG のキャラクター1枚。足もとの中心（cx, baseY）を基準に置く。
// 出た直後の数フレームだけ伸び縮みさせ、コマ送りの切り替えを弾ませる
export const Sprite: React.FC<{
  src: string;
  cx: number;
  baseY: number;
  height: number;
  flip?: boolean;
  rotate?: number;
  squash?: boolean;
}> = ({ src, cx, baseY, height, flip = false, rotate = 0, squash = true }) => {
  const frame = useCurrentFrame();
  const s = squash ? interpolate(frame, [0, 3, 6], [1.08, 0.96, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <div style={{ position: "absolute", left: cx, top: baseY, transform: "translate(-50%, -100%)" }}>
      <Img
        src={staticFile(src)}
        style={{
          display: "block",
          height,
          transformOrigin: "50% 100%",
          transform: `scaleX(${flip ? -1 : 1}) scale(${s}) rotate(${rotate}deg)`,
        }}
      />
    </div>
  );
};
