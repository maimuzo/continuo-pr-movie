import React from "react";
import { theme } from "../../theme";

export const COLUMNS = ["Ready", "In Progress", "Blocked", "In Review", "Done"] as const;

// 見出しの色。src/components/Kanban.tsx を写し、Blocked の列を足した。Blocked は目立つ赤、Done は赤と紛れないように薄紫にする
const HEADER_COLORS = ["#A8D89A", "#F5D66E", "#F08A7E", "#AFC8EE", "#CDB8EE"] as const;

const COLUMN_WIDTH = 150;
const GAP = 12;
const PAD = 20;
const HEADER = 46;

export const kanbanSize = { width: PAD * 2 + COLUMNS.length * COLUMN_WIDTH + (COLUMNS.length - 1) * GAP, height: 300 };

// 列の左上の、カンバンの中での座標（見出しの下）。カードを列へ置くときに使う
export const columnOrigin = (index: number) => ({ x: PAD + index * (COLUMN_WIDTH + GAP), y: PAD + HEADER });

// 列の中にカードを置くときの左上。カード（130×78）を列の中央に寄せる
export const cardSlot = (index: number) => ({ x: columnOrigin(index).x + 10, y: columnOrigin(index).y + 14 });

// 壁に掛けた GitHub 風のカンバン。ロゴは入れない。木の枠に太い線、影は付けない（設定画の平らな塗りにそろえる）。
// (x, y) は左上、scale で全体を拡大する。children はカンバンの中の座標で置く。
// highlight の列は、glow（0〜1）に合わせて見出しを光らせる
export const Kanban: React.FC<{ x: number; y: number; scale?: number; highlight?: number; glow?: number; children?: React.ReactNode }> = ({
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
      width: kanbanSize.width,
      height: kanbanSize.height,
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
            height: kanbanSize.height - PAD * 2,
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
              fontSize: 24,
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
    {/* 子要素の座標を、枠線の内側ではなくカンバンの左上からにそろえる */}
    <div style={{ position: "absolute", left: -12, top: -12 }}>{children}</div>
  </div>
);
