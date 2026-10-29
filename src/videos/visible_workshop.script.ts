// 見える工房の回の台本。秒で書く。中身は docs/spec/detailed_storyboards/visible_workshop.md が正
// captionSize は字幕の字の大きさ。1行に収まる中で、いちばん大きくする
export const script = {
  id: "visible-workshop",
  title: "見えるから、安心",
  end: ["何してるか、", "いつでも見える"],
  scenes: [
    { id: "title", from: 0, to: 2, caption: null, captionSize: 0 },
    { id: "box", from: 2, to: 5.5, caption: "裏で何してるか、分からない？", captionSize: 64 },
    { id: "glass", from: 5.5, to: 9, caption: "continuo なら作業の内容を直接確認可能", captionSize: 50 },
    { id: "handoff", from: 9, to: 13, caption: "Claude Code がしていることは、そのまま見える", captionSize: 42 },
    { id: "end", from: 13, to: 15, caption: null, captionSize: 0 },
  ],
} as const;
