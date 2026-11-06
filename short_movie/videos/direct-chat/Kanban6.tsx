import React from "react";
import { theme } from "../../theme";

// src/components/Kanban.tsx を写し、列に Blocked と Direct Chat を足した6列のカンバン。
// 列の並びは continuo の README の Status の表（Ready / In Progress / In Review / Blocked / Done / Direct Chat）に合わせる。
// 共通の Kanban は4列で固定なので、この回だけの部品として写した
export const COLUMNS = ["Ready", "In Progress", "In Review", "Blocked", "Done", "Direct Chat"] as const;
export const DIRECT_CHAT = 5;
export const IN_PROGRESS = 1;

// 見出しの色。4列ぶんは共通の Kanban と同じ。Blocked は灰、Direct Chat は話す回の主役なので紫にして目立たせる
const HEADER_COLORS = ["#A8D89A", "#F5D66E", "#AFC8EE", "#D5CFC6", "#F4AFAF", "#C9A8EE"] as const;

const COLUMN_WIDTH = 150;
const GAP = 12;
const PAD = 20;
const HEADER = 46;

export const kanbanSize = { width: PAD * 2 + COLUMNS.length * COLUMN_WIDTH + (COLUMNS.length - 1) * GAP, height: 300 };

export const columnOrigin = (index: number) => ({ x: PAD + index * (COLUMN_WIDTH + GAP), y: PAD + HEADER });
export const cardSlot = (index: number) => ({ x: columnOrigin(index).x + 10, y: columnOrigin(index).y + 14 });

export const Kanban6: React.FC<{ x: number; y: number; scale?: number; highlight?: number; glow?: number; children?: React.ReactNode }> = ({
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
              whiteSpace: "nowrap",
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
