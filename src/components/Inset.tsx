import React from "react";
import { theme } from "../theme";

// 右上などに出す小窓。中身は children で渡す
export const Inset: React.FC<{ x: number; y: number; width: number; height: number; background?: string; children: React.ReactNode }> = ({
  x,
  y,
  width,
  height,
  background = "#EADBC4",
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      height,
      overflow: "hidden",
      background,
      border: `8px solid ${theme.color.ink}`,
      borderRadius: 22,
      boxShadow: "0 10px 0 rgba(0,0,0,0.2)",
    }}
  >
    {children}
  </div>
);
