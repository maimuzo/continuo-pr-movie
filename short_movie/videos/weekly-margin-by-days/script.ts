// どの日も自分の分が残る回の台本。秒で書く。中身は short_movie/storyboards/weekly-margin-by-days.md が正
export const meta = { id: "weekly-margin-by-days", durationInSeconds: 15 } as const;
export const script = {
  id: "weekly-margin-by-days",
  title: "いつでも、自分の分は残ってる",
  // タイトルは14字あり、1行ではタイトルの字の大きさで画面に収まらないので、読点のあとで2行に分ける
  titleLines: ["いつでも、", "自分の分は残ってる"],
  // 締めは「毎日使えて、余らせない」。1行では締めの字の大きさで画面に収まらないので2行に分ける
  end: ["毎日使えて、", "余らせない"],
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "drain", from: 2, to: 5, caption: "週の途中で使い切ると、残りの日に AI が使えない" },
    { id: "margin", from: 5, to: 10, caption: "残り日数ごとに、自分の分を残せる" },
    { id: "lastday", from: 10, to: 13, caption: "リセット直前は、余りを使い切る" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
