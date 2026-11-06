import React from "react";
import { Img, staticFile } from "remotion";
import { Battery } from "./Battery";

// チームの部屋の構図（上に共有のカンバン、下にメンバーの机、各机の奥に Claude Code、頭の上にレートリミットの電池）。
// チームで入札の回と、寝て待つ回で使い回す。座標は 1080×1080 の画面の座標。
// 机の数は deskXs(n) で変えられる。n=3 のとき 20・375・730（チームで入札の回の配置）になる

export const KB = { x: 202, y: 36 }; // 共有のカンバン（等倍、676×300）の左上
export const DESK = { w: 330, top: 735 };
export const ROBOT_H = 300;
export const ROBOT_BASE = 862; // 足もとは机の板の後ろに隠れる
export const HEAD_TOP = ROBOT_BASE - ROBOT_H + 8;
export const BAT_TOP = 472; // 電池の上辺。％の数字はその上に出る

// 机 n 個を、画面の左右 20〜1060px に等しい間をあけて並べたときの、各机の左端
export const deskXs = (n: number, w = DESK.w) => {
  const span = 1040;
  const gap = n > 1 ? (span - n * w) / (n - 1) : 0;
  return Array.from({ length: n }, (_, i) => (n > 1 ? 20 + i * (w + gap) : 540 - w / 2));
};
// 机の左のモニターを避けて、Claude Code は机の真ん中より少し右に座る
export const robotCxOf = (deskX: number, w = DESK.w) => deskX + w / 2 + 30;

export const Room: React.FC = () => <Img src={staticFile("ep/team_bid/room.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />;

export const Desk: React.FC<{ x: number; w?: number }> = ({ x, w = DESK.w }) => (
  <Img src={staticFile("ep/team_bid/desk.png")} style={{ position: "absolute", left: x, top: DESK.top, width: w }} />
);

// 各 Claude Code の頭の上に並べる電池。levels の長さが電池の本数になる。
// numbers[i] が null の電池は％を出さない。bumps・wins・scale は Battery の引数をそのまま渡す
export const BatteryRow: React.FC<{
  cxs: number[];
  levels: number[];
  numbers?: (number | null)[];
  bumps?: number[];
  wins?: number[];
  scale?: number;
  top?: number;
}> = ({ cxs, levels, numbers, bumps, wins, scale = 1, top = BAT_TOP }) => (
  <>
    {levels.map((lv, i) => (
      <Battery key={i} cx={cxs[i]} top={top} level={lv} number={numbers ? numbers[i] : lv} bump={bumps?.[i] ?? 0} win={wins?.[i] ?? 0} scale={scale} />
    ))}
  </>
);
