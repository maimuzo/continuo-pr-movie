import React from "react";
import { theme } from "../theme";

// 作業台の看板。カードと同じ色の札を下げ、どの issue の作業台かを示す
export const WorktreeSign: React.FC<{ x: number; y: number; tagColor?: string }> = ({ x, y, tagColor = theme.color.cardTag }) => (
  <div style={{ position: "absolute", left: x, top: y }}>
    <div
      style={{
        padding: "6px 18px",
        background: "#F7E2B8",
        border: `5px solid ${theme.color.ink}`,
        borderRadius: 10,
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: 30,
        color: theme.color.ink,
      }}
    >
      worktree
    </div>
    <div style={{ marginLeft: 82, width: 5, height: 16, background: theme.color.ink }} />
    <div style={{ marginLeft: 52, width: 64, height: 40, background: tagColor, border: `5px solid ${theme.color.ink}`, borderRadius: 8, boxSizing: "border-box", padding: "6px 8px" }}>
      <div style={{ height: 6, background: "#FFFFFF", borderRadius: 3 }} />
      <div style={{ height: 6, width: 30, background: "#FFFFFF", borderRadius: 3, marginTop: 6 }} />
    </div>
  </div>
);
