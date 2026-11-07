// 自分の分だけ上書きの回の台本。秒で書く。中身は short_movie/storyboards/workflow-local.md が正
export const meta = { id: "workflow-local", durationInSeconds: 30 } as const;
// captionSize は字幕の字の大きさ。1行に収まる中で、いちばん大きくする
export const script = {
  id: "workflow-local",
  title: "自分の分だけ、上書き",
  // 締めは「チームの設定と、自分の都合の両立」。16字を1行にすると画面に収まらないので2行に分ける
  end: ["チームの設定と、", "自分の都合の両立"],
  scenes: [
    { id: "title", from: 0, to: 3, caption: null, captionSize: 0 },
    { id: "rewrite", from: 3, to: 7, caption: "自分の都合で、共有の WORKFLOW.md を書き換えると", captionSize: 40 },
    { id: "shared", from: 7, to: 11, caption: "共有の WORKFLOW.md は、みんなの設定", captionSize: 56 },
    { id: "reset", from: 11, to: 13.5, caption: "元に戻して、仕切り直し", captionSize: 64 },
    { id: "local", from: 13.5, to: 21, caption: "WORKFLOW.local.md に書いた行は、自分だけに適用される", captionSize: 34 },
    { id: "keep", from: 21, to: 27, caption: "チームの設定は、そのまま", captionSize: 64 },
    { id: "end", from: 27, to: 30, caption: null, captionSize: 0 },
  ],
} as const;
