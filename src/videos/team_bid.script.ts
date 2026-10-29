// チームで入札の回の台本。秒で書く。中身は docs/spec/detailed_storyboards/team_bid.md が正
export const script = {
  id: "team-bid",
  title: "チームで、入札",
  end: ["空いてる人へ、", "どんどん"],
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "bid", from: 2, to: 6, caption: "残りの枠で入札" },
    { id: "ff", from: 6, to: 10, caption: "余裕のある人へ" },
    { id: "share", from: 10, to: 13, caption: "チームで手分け" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
