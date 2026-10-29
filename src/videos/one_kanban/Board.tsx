import React from "react";
import { theme } from "../../theme";

// 共通の Kanban（src/components/Kanban.tsx）を写して、列を広く・高くしたもの。
// この回では1列に3枚のカードを縦に並べ、カードの帯にリポジトリの名前を書くので、共通の大きさでは収まらない
export const COLUMNS = ["Ready", "In Progress", "In Review", "Done"] as const;
const HEADER_COLORS = ["#A8D89A", "#F5D66E", "#AFC8EE", "#F4AFAF"] as const;

const COLUMN_WIDTH = 176;
const GAP = 12;
const PAD = 20;
const HEADER = 46;

export const REPO_CARD = { w: 150, h: 86 };
const CARD_GAP = 10;

export const boardSize = { width: PAD * 2 + COLUMNS.length * COLUMN_WIDTH + (COLUMNS.length - 1) * GAP, height: 400 };

const columnOrigin = (index: number) => ({ x: PAD + index * (COLUMN_WIDTH + GAP), y: PAD + HEADER });

// 列 col の上から row 番目のカードの左上（カンバンの中の座標）
export const slot = (col: number, row: number) => ({
  x: columnOrigin(col).x + (COLUMN_WIDTH - REPO_CARD.w) / 2,
  y: columnOrigin(col).y + 12 + row * (REPO_CARD.h + CARD_GAP),
});

export const Board: React.FC<{ x: number; y: number; scale?: number; highlight?: number; glow?: number; children?: React.ReactNode }> = ({
  x,
  y,
  scale = 1,
  highlight,
  glow = 0,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: boardSize.width,
      height: boardSize.height,
      transform: `scale(${scale})`,
      transformOrigin: "0 0",
      background: "#FBF6EC",
      border: `12px solid #B98552`,
      outline: `5px solid ${theme.color.ink}`,
      borderRadius: 14,
      boxSizing: "border-box",
    }}
  >
    {COLUMNS.map((name, i) => {
      const o = columnOrigin(i);
      const lit = highlight === i ? glow : 0;
      return (
        <div
          key={name}
          style={{
            position: "absolute",
            left: o.x - 12,
            top: PAD - 12,
            width: COLUMN_WIDTH,
            height: boardSize.height - PAD * 2,
            border: `3px solid ${theme.color.ink}`,
            borderRadius: 8,
            background: "#FFFDF7",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: HEADER - 6,
              lineHeight: `${HEADER - 6}px`,
              textAlign: "center",
              fontFamily: theme.fontFamily,
              fontWeight: 800,
              fontSize: 26,
              color: theme.color.ink,
              background: lit > 0 ? `color-mix(in srgb, ${theme.color.highlight} ${Math.round(lit * 100)}%, ${HEADER_COLORS[i]})` : HEADER_COLORS[i],
              borderBottom: `3px solid ${theme.color.ink}`,
              transform: `scale(${1 + lit * 0.08})`,
            }}
          >
            {name}
          </div>
        </div>
      );
    })}
    <div style={{ position: "absolute", left: -12, top: -12 }}>{children}</div>
  </div>
);

// リポジトリの色の帯を付けたカード。帯にリポジトリの短い名前を白い字で書く。
// squash は貼り付いた瞬間の潰れ（1 で潰れ、0 で元の形）
export const RepoCard: React.FC<{ x: number; y: number; color: string; label: string; scale?: number; squash?: number; pin?: boolean; rotate?: number }> = ({
  x,
  y,
  color,
  label,
  scale = 1,
  squash = 0,
  pin = false,
  rotate = 0,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: REPO_CARD.w,
      height: REPO_CARD.h,
      transform: `rotate(${rotate}deg) scale(${scale * (1 + squash * 0.35)}, ${scale * (1 - squash * 0.35)})`,
      transformOrigin: "50% 50%",
      background: theme.color.card,
      border: `4px solid ${theme.color.ink}`,
      borderRadius: 10,
      boxSizing: "border-box",
      overflow: "visible",
    }}
  >
    <div
      style={{
        height: 30,
        background: color,
        borderBottom: `3px solid ${theme.color.ink}`,
        borderRadius: "6px 6px 0 0",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: 20,
        lineHeight: "28px",
        textAlign: "center",
        color: "#FFFFFF",
        WebkitTextStroke: `5px ${theme.color.ink}`,
        paintOrder: "stroke fill",
      }}
    >
      {label}
    </div>
    <div style={{ width: 96, height: 8, background: "#C9C2B6", borderRadius: 4, margin: "12px 0 0 12px" }} />
    <div style={{ width: 70, height: 8, background: "#C9C2B6", borderRadius: 4, margin: "8px 0 0 12px" }} />
    {pin ? (
      <div
        style={{
          position: "absolute",
          left: REPO_CARD.w / 2 - 15,
          top: -16,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: "#5B5248",
          border: `4px solid ${theme.color.ink}`,
        }}
      />
    ) : null}
  </div>
);
