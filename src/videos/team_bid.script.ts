// チームで入札の回の台本。秒で書く。中身は docs/spec/detailed_storyboards/team_bid.md が正
export const script = {
  id: "team-bid",
  title: "チームで、入札",
  // 締めは「チームの余力を戦力へ」。10字を1行にすると締めの字の大きさで画面に収まらないので2行に分ける
  end: ["チームの余力を", "戦力へ"],
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "bid", from: 2, to: 6, caption: "レートリミットの余裕値で入札" },
    { id: "ff", from: 6, to: 10, caption: "一番余裕のある人が担当" },
    { id: "share", from: 10, to: 13, caption: "チームで作業分担" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
