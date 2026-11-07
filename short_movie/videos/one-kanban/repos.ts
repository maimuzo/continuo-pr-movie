// この回に出る架空のリポジトリ3つ。看板には owner と short を2行で書き、カードの帯には short を書く（帯の幅に owner まで入れると字が小さくて読めない）。
// 色は背景の絵（public/ep/one_kanban/workshops.png）の屋根の色を測った値で、
// カードの帯・作業台の札・進み具合の棒をこの色にそろえ、「どのカードがどの工房のものか」を色で結ぶ
export const REPOS = [
  { owner: "maimuzo", name: "maimuzo/project-a", short: "project-a", color: "#E05B45" },
  { owner: "maimuzo", name: "maimuzo/project-b", short: "project-b", color: "#F1AF3C" },
  { owner: "maimuzo", name: "maimuzo/project-c", short: "project-c", color: "#9E68D0" },
] as const;

// 背景の絵の中の、3軒の工房の真ん中の x と、看板の板の真ん中の y（1080×1080 の画面の座標）
export const BOOTH_X = [181, 540, 898] as const;
export const SIGNBOARD_Y = 441;
