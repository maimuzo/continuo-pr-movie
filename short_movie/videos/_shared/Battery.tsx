import React from "react";
import { theme } from "../../theme";

// Claude Code の頭の上に浮かべる、レートリミットの余裕値を示す電池。中身は黄色で塗る（緑は使わない）。
// (cx, top) は電池の上辺の真ん中。level は 0〜100。number が null のあいだは数字を出さない。
// bump（0〜1）で数字を弾ませ、win（0〜1）で選ばれた机の数字を光らせる
export const BATTERY = { w: 150, h: 62 };
const FILL = "#F2C14E";

export const Battery: React.FC<{ cx: number; top: number; level: number; number: number | null; bump?: number; win?: number; opacity?: number; scale?: number }> = ({
  cx,
  top,
  level,
  number,
  bump = 0,
  win = 0,
  opacity = 1,
  scale = 1,
}) => {
  const inner = BATTERY.w - 34;
  const fillW = Math.max(0, Math.min(1, level / 100)) * inner;
  return (
    <div style={{ position: "absolute", left: cx, top, opacity, transform: `translateX(-50%) scale(${scale})`, transformOrigin: "50% 100%", width: BATTERY.w, height: BATTERY.h }}>
      {number !== null ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: BATTERY.h + 4,
            transform: `translateX(-50%) scale(${1 + bump * 0.45 + win * 0.25})`,
            transformOrigin: "50% 100%",
            fontFamily: theme.fontFamily,
            fontWeight: 800,
            fontSize: 58,
            lineHeight: 1,
            whiteSpace: "nowrap",
            color: win > 0.05 ? `color-mix(in srgb, ${FILL} ${Math.round(win * 100)}%, #FFFFFF)` : "#FFFFFF",
            WebkitTextStroke: `12px ${theme.color.ink}`,
            paintOrder: "stroke fill",
          }}
        >
          {Math.round(number)}%
        </div>
      ) : null}
      <svg width={BATTERY.w + 20} height={BATTERY.h + 20} style={{ position: "absolute", left: -10, top: -10, overflow: "visible" }}>
        {win > 0 ? (
          <rect x={2} y={2} width={BATTERY.w - 2} height={BATTERY.h + 16} rx={20} fill="none" stroke={FILL} strokeWidth={10} opacity={win} />
        ) : null}
        <rect x={10} y={10} width={BATTERY.w - 18} height={BATTERY.h} rx={14} fill="#FFFDF7" stroke={theme.color.ink} strokeWidth={6} />
        <rect x={BATTERY.w - 8} y={10 + BATTERY.h / 2 - 13} width={12} height={26} rx={4} fill={theme.color.ink} />
        <rect x={19} y={19} width={fillW} height={BATTERY.h - 18} rx={7} fill={FILL} stroke={theme.color.ink} strokeWidth={fillW > 6 ? 3 : 0} />
      </svg>
    </div>
  );
};
