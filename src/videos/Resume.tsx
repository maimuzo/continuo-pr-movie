import React from "react";
import { AbsoluteFill } from "remotion";
import { TitleCard } from "../components/TitleCard";

// 仮の中身。この回を作るときに置き換える
export const Resume: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8" }}>
    <TitleCard text="止めても、消えない" outFrom={9999} />
  </AbsoluteFill>
);
