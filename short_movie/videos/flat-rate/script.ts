// 定額のままの回の台本。秒で書く。中身は docs/spec/detailed_storyboards/flat_rate.md が正
export const script = {
  id: "flat-rate",
  title: "定額で使える",
  end: "メーター、回りません",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "metered", from: 2, to: 6, caption: "使うたびに課金？" },
    { id: "flat", from: 6, to: 10, caption: "continuo ならいつもの定額プランで使える！" },
    { id: "move", from: 10, to: 13, caption: "定額プランなら、従量課金にならない" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
