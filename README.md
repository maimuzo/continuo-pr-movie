# continuo-pr-movie

[continuo](https://github.com/maimuzo/continuo) の機能紹介動画を、Remotion で作るリポジトリ。
X に投稿するための 1080×1080 の動画が12本ある（2本は30秒、ほかは15秒）。

## 動画

### continuo とは（30秒）

https://github.com/user-attachments/assets/095d04b4-bfcf-4ac1-b57d-473b866b2d9c

### セットアップ（30秒）

https://github.com/user-attachments/assets/220bab27-9f60-4cb6-8854-bd202b2e71d5

### 置くだけで、始まる

https://github.com/user-attachments/assets/0b1c39d4-9a0b-4be3-8d31-35a5f98d3005

### 見えるから、安心

https://github.com/user-attachments/assets/c984b525-bc41-4424-ab07-4d8d2b909872

### カンバンは1枚でいい

https://github.com/user-attachments/assets/ef9133bc-d6a5-4339-8239-cabe4e243d47

### 詰まったら、ひとこと

https://github.com/user-attachments/assets/49a1253d-550f-4255-947b-03ad82bf8c63

### チームで、入札

https://github.com/user-attachments/assets/1ac9c200-8b4d-43ec-86b0-a34da0771635

### 尽きても、勝手に再開

https://github.com/user-attachments/assets/6fe03706-81eb-4511-ac7b-4a41c1f7d8d5

### 誰の指示でも聞くわけじゃない

https://github.com/user-attachments/assets/d31128fa-7511-4aea-a885-d0f051a77bfb

### 定額で使える

https://github.com/user-attachments/assets/7e5805f6-0bfa-46e6-91ff-76bd8fb87527

### 止めても、消えない

https://github.com/user-attachments/assets/caba4d50-7035-4285-be8e-8974b3b457ad

### 話したいときは、直接

https://github.com/user-attachments/assets/3a3db808-2bd1-47e5-8ddd-a5f10dd02429

## 作り方

動画の資料は全部 [short_movie/](short_movie/) にあり、Claude Code のプラグイン short-movie（下の「別の製品の動画を同じ流れで作る」）で作っています。Remotion の土台はプラグインの中にあるので、このリポジトリに `package.json` はありません。

- 方針：[short_movie/brief.md](short_movie/brief.md)
- 何を映すか（回の一覧と回の id）：[short_movie/concept.md](short_movie/concept.md)
- 回ごとの絵コンテ：[short_movie/storyboards/](short_movie/storyboards/)
- キャラクター：[short_movie/characters.md](short_movie/characters.md)
- 制作の設計：[short_movie/docs/plans/production_design.md](short_movie/docs/plans/production_design.md)

short-movie を入れたあと、リポジトリの根で次を叩きます（`<plugin>` は short-movie のプラグインの置き場）。

```bash
bash <plugin>/scripts/studio.sh short_movie place-on-ready   # 確かめながら作る
bash <plugin>/scripts/render.sh short_movie place-on-ready   # 1本書き出す（short_movie/out/place-on-ready.mp4）
```

### 別の製品の動画を同じ流れで作る

この動画を作った流れは、Claude Code のプラグイン [short-movie](https://github.com/maimuzo/maimuzo-claude-plugins-public/tree/main/plugins/short-movie) にしてあります。
スキルを起動して紹介したいものを渡すと、コンテ → キャラクター → 絵コンテ → 動画の順に、人間の確認を挟みながら進みます。

```
/plugin marketplace add maimuzo/maimuzo-claude-plugins-public
/plugin install short-movie@maimuzo-public
/short-movie:start <紹介したいもののリポジトリの URL かパス>
```
