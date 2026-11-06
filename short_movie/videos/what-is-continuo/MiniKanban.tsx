import React from "react";
import { theme } from "../../theme";

// 右上に浮かべる、カンバンの小窓（GitHub Projects 風。ロゴは入れない）。
// src/components/Kanban.tsx の5列版（src/videos/blocked/Kanban.tsx）にならい、小さくても見出しが読めるように列を詰め、字を太く大きめにした。
// 見出しの色は Kanban.tsx と同じ並びに Blocked の赤を足したもの

export const MINI_COLUMNS = [
  ["Ready"],
  ["In", "Progress"],
  ["Blocked"],
  ["In", "Review"],
  ["Done"],
] as const;
const HEADER_COLORS = ["#A8D89A", "#F5D66E", "#F08A7E", "#AFC8EE", "#CDB8EE"] as const;

export const MINI = { x: 548, y: 22, w: 506, h: 200 };
const BAR = 30; // 窓の題の帯
const PAD = 8;
const GAP = 6;
const HEAD = 46;
export const COL_W = (MINI.w - PAD * 2 - GAP * 4) / 5;
export const MINI_CARD = { w: COL_W - 12, h: 44 };

// 列 col の row 段目のカードの左上（小窓の中の座標）
export const miniSlot = (col: number, row: number) => ({
  x: PAD + col * (COL_W + GAP) + 6,
  y: BAR + PAD + HEAD + 6 + row * (MINI_CARD.h + 6),
});

export type MiniCardState = { label: string; tag: string; x: number; y: number; squash?: number; lift?: number };

export const MiniKanban: React.FC<{ glow: number[]; cards: MiniCardState[]; children?: React.ReactNode; opacity?: number; offsetX?: number }> = ({
  glow,
  cards,
  children,
  opacity = 1,
  offsetX = 0,
}) => (
  <div
    style={{
      position: "absolute",
      left: MINI.x + offsetX,
      top: MINI.y,
      width: MINI.w,
      height: MINI.h,
      opacity,
      background: "#FBF6EC",
      border: `5px solid ${theme.color.ink}`,
      borderRadius: 14,
      boxSizing: "border-box",
      overflow: "visible",
    }}
  >
    {/* 窓の題の帯 */}
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: MINI.w - 10,
        height: BAR - 4,
        background: "#E4DACB",
        borderBottom: `4px solid ${theme.color.ink}`,
        borderRadius: "9px 9px 0 0",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: 18,
        lineHeight: `${BAR - 4}px`,
        color: theme.color.ink,
        paddingLeft: 70,
        boxSizing: "border-box",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 10 + i * 18, top: 7, width: 12, height: 12, borderRadius: 6, background: "#B9AE9E", border: `2px solid ${theme.color.ink}`, boxSizing: "border-box" }} />
      ))}
      Projects
    </div>
    {MINI_COLUMNS.map((lines, i) => {
      const lit = glow[i] ?? 0;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: PAD + i * (COL_W + GAP) - 5,
            top: BAR + PAD - 5,
            width: COL_W,
            height: MINI.h - BAR - PAD * 2,
            border: `3px solid ${theme.color.ink}`,
            borderRadius: 7,
            background: "#FFFDF7",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              height: HEAD - 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: theme.fontFamily,
              fontWeight: 800,
              fontSize: lines.length === 1 ? 19 : 16,
              lineHeight: 1.05,
              color: theme.color.ink,
              background: lit > 0 ? `color-mix(in srgb, ${theme.color.highlight} ${Math.round(lit * 100)}%, ${HEADER_COLORS[i]})` : HEADER_COLORS[i],
              borderBottom: `3px solid ${theme.color.ink}`,
              borderRadius: "4px 4px 0 0",
              transform: `scale(${1 + lit * 0.14})`,
              boxShadow: lit > 0 ? `0 0 ${Math.round(lit * 22)}px ${theme.color.highlight}` : undefined,
            }}
          >
            {lines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </div>
      );
    })}
    {/* 子要素とカードの座標は、枠線の内側ではなく小窓の左上から */}
    <div style={{ position: "absolute", left: -5, top: -5 }}>
      {cards.map((c) => (
        <MiniCard key={c.label} {...c} />
      ))}
      {children}
    </div>
  </div>
);

// 小窓の中のカード。左上に issue の色の札、真ん中に番号
const MiniCard: React.FC<MiniCardState> = ({ label, tag, x, y, squash = 0, lift = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y - lift,
      width: MINI_CARD.w,
      height: MINI_CARD.h,
      background: theme.color.card,
      border: `4px solid ${theme.color.ink}`,
      borderRadius: 8,
      boxSizing: "border-box",
      transform: `scale(${1 + squash * 0.3 + lift * 0.004}, ${1 - squash * 0.3 + lift * 0.004})`,
      boxShadow: lift > 0 ? `0 ${Math.round(lift / 2)}px 0 rgba(42,36,32,0.25)` : undefined,
      fontFamily: theme.fontFamily,
      fontWeight: 800,
      fontSize: 20,
      color: theme.color.ink,
      textAlign: "center",
      paddingTop: 7,
      lineHeight: "26px",
    }}
  >
    <div style={{ position: "absolute", left: 5, top: 4, width: 20, height: 6, background: tag, borderRadius: 4 }} />
    {label}
  </div>
);
