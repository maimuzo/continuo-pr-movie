# 効果音

動画で鳴らす効果音は、素材を持ってこずに数式で合成し、このフォルダへ 44.1kHz・16bit・モノラルの wav で書き出す。
書き出しのとき、short-movie の `render.sh` がこのフォルダの `*.wav` を作業場所の `public/sfx/` へ写し、回の部品は `staticFile("sfx/<名前>.wav")` で鳴らす。

## 版と呼び方

何年後でも同じ音を作り直せるように、Python と numpy の版を決めて流す。リポジトリの根で叩く。

- Python 3.12
- numpy 2.5.4

```bash
uv run --no-project --python 3.12 --with numpy==2.5.4 python -I short_movie/materials/sfx/make_sfx.py
uv run --no-project --python 3.12 --with numpy==2.5.4 python -I short_movie/materials/sfx/sfx_<回のid>.py
```

**いまある wav は、版を決めずに作ったもの。**スキル化の前に `uv run --with numpy python …` で作った（そのときの numpy の版は記録していない）。上の版で作り直すと、音がわずかに変わることがある。作り直したら、その回を書き出して聞き直す。

## 共通の音（make_sfx.py）

`make_sfx.py` は short-movie の `scripts/make_sfx.py` と同じ式で、全部の回で使う8つを作る: `enter`・`pop`・`sparkle`・`splat`・`spout`・`swish`・`typing`・`whoosh`。
回ごとの音のコードは、自分のフォルダを `sys.path` に足してから `make_sfx` を import する。`make_sfx.py` は書き換えない。

## 回だけの音

回の id を接頭にした `<回のid>_<名前>.wav` を書き出す。新しく足すときは、ここへ1行足す。

- `sfx_blocked.py`: `blocked_block`・`blocked_bonk`・`blocked_huh`
- `sfx_direct-chat.py`: `direct-chat_blare`・`direct-chat_zip`
- `sfx_flat-rate.py`: `flat-rate_coin`・`flat-rate_crt_off`・`flat-rate_lock`・`flat-rate_unplug`
- `sfx_resume.py`: `resume_click`・`resume_off`・`resume_on`・`resume_steps`
- `sfx_stranger-comment.py`: `stranger-comment_drop`・`stranger-comment_relief`
- `sfx_team-bid.py`: `team-bid_bid`・`team-bid_win`
- `sfx_visible-workshop.py`: `visible-workshop_clap`・`visible-workshop_rattle`
- `sfx_wait-quota.py`: `wait-quota_bell`・`wait-quota_charge`・`wait-quota_empty`・`wait-quota_fall`・`wait-quota_flip`・`wait-quota_tick`
