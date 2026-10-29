// 寝て待つ回の台本。秒で書く。中身は docs/spec/detailed_storyboards/wait_quota.md が正
export const script = {
  id: "wait-quota",
  title: "尽きても、勝手に再開",
  // 締めは「尽きても、止まらない」。10字を1行にすると締めの字の大きさで画面に収まらないので2行に分ける
  end: ["尽きても、", "止まらない"],
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "five", from: 2, to: 4, caption: "5時間のレートリミットが尽きても" },
    { id: "resume", from: 4, to: 7, caption: "放っておけば、勝手に再開" },
    { id: "week", from: 7, to: 10, caption: "1週間のレートリミットが尽きたら" },
    { id: "handover", from: 10, to: 13, caption: "担当を外して、別の人が引き継ぐ" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
