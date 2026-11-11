// 詰まったらひとことの回の台本。秒で書く。中身は docs/spec/detailed_storyboards/blocked.md が正
export const script = {
  id: "blocked",
  title: "詰まったら、ひとこと",
  end: "詰まったら、ひとこと",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "stuck", from: 2, to: 5, caption: "行き詰まったら" },
    { id: "move", from: 5, to: 7, caption: "continuo が Blocked に" },
    { id: "comment", from: 7, to: 10, caption: "コメントでひとこと" },
    { id: "resume", from: 10, to: 13, caption: "続きから再開" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
