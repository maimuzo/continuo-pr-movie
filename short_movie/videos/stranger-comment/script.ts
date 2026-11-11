// 他人のコメントの回の台本。秒で書く。中身は docs/spec/detailed_storyboards/stranger_comment.md が正
export const script = {
  id: "stranger-comment",
  // タイトルと締めは1行だと画面の幅を超えるので、改行の位置をここで決める
  title: "誰の指示でも\n聞くわけじゃない",
  end: "public な環境での\n安心感",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "comments", from: 2, to: 6, caption: "コメントは誰でも書ける" },
    { id: "rule", from: 6, to: 10, caption: "指示を出せる人は Role で判断する" },
    { id: "report", from: 10, to: 13, caption: "指示を出せるのは信頼できる人だけ" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
