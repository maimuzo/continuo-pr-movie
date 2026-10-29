// カンバン1枚の回の台本。秒で書く。中身は docs/spec/detailed_storyboards/one_kanban.md が正
export const script = {
  id: "one-kanban",
  title: "カンバンは1枚でいい",
  end: "1枚で全部回す",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "line_up", from: 2, to: 5, caption: "リポジトリが違っても" },
    { id: "dispatch", from: 5, to: 10, caption: "issue ごとに、そのリポジトリで" },
    { id: "parallel", from: 10, to: 13, caption: "同時に進む" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
