import React from "react";
import { AbsoluteFill } from "remotion";
import { TitleCard } from "../components/TitleCard";

// 仮の中身。この回を作るときに置き換える
export const TeamBid: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8" }}>
    <TitleCard text="空いてる人へ、どんどん" outFrom={9999} />
  </AbsoluteFill>
);
