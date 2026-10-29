// 見える工房の回の台本。秒で書く。中身は docs/spec/detailed_storyboards/visible_workshop.md が正
export const script = {
  id: "visible-workshop",
  title: "見えるから、安心",
  end: ["何してるか、", "いつでも見える"],
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "box", from: 2, to: 5, caption: "裏で何してるか、分からない？" },
    { id: "glass", from: 5, to: 8, caption: "continuo なら、ガラス張り" },
    { id: "handoff", from: 8, to: 11, caption: "Claude Code がしていることは、そのまま見える" },
    { id: "remote", from: 11, to: 13, caption: "別の端末からも" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
