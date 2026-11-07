// カンバン1枚の回の台本。秒で書く。中身は short_movie/storyboards/one-kanban.md が正
export const meta = { id: "one-kanban", durationInSeconds: 15 } as const;
export const script = {
  id: "one-kanban",
  title: "カンバンは1枚でいい",
  end: "1つのカンバンで全プロジェクトを管理",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "line_up", from: 2, to: 5, caption: "リポジトリが違っても" },
    { id: "dispatch", from: 5, to: 10, caption: "issue ごとに、そのリポジトリで" },
    { id: "parallel", from: 10, to: 13, caption: "同時に進む" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
