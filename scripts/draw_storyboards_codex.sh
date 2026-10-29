#!/bin/bash
# 絵コンテ（scripts/storyboard_frames.py の絵）を Codex に1枚ずつ描かせ、1枚ごとに利用枠の使用率を記録する。
# 5時間枠が尽きたら、リセットの時刻の1分後まで眠って続ける。週の枠が WEEK_STOP（既定 80）% に達したら止まる。
# 描けた絵は飛ばすので、止めても同じコマンドで続きから描ける。
# 記録: out/review/codex_usage.tsv（時刻・絵・5時間枠の前と後・週の枠の前と後・かかった秒）
set -u
cd "$(dirname "$0")/.."
U="$HOME/.claude/plugins/cache/maimuzo-marketplace/maimuzo-dev-core/0.24.0/skills/detect-chatgpt-usage-from-webapi/scripts/get-chatgpt-usage-from-webapi.sh"
LOG=out/review/codex_usage.tsv
WEEK_STOP=${WEEK_STOP:-80}
mkdir -p out/review
[ -s "$LOG" ] || printf '時刻\t絵\t5時間枠_前\t5時間枠_後\t週の枠_前\t週の枠_後\t秒\n' > "$LOG"

# 5時間枠と週の枠の使用率と、使えるかどうか・尽きた枠のリセット時刻を読む
read_quota() {
  bash "$U" | jq -r '.rate_limit as $r
    | [$r.primary_window,$r.secondary_window] | map(select(.!=null)) as $w
    | [ ($w|map(select(.limit_window_seconds==18000))|.[0].used_percent // 0),
        ($w|map(select(.limit_window_seconds==604800))|.[0].used_percent // 0),
        $r.allowed,
        ($w|map(select(.used_percent>=100))|map(.reset_at)|max // 0) ] | @tsv'
}

for id in $(python3 -I scripts/storyboard_frames.py list | jq -r ".[].id"); do
  out="out/storyboards/$id.png"
  [ -s "$out" ] && continue
  mkdir -p "$(dirname "$out")"
  for try in 1 2; do
    read -r h0 w0 ok reset < <(read_quota)
    if [ "$w0" -ge "$WEEK_STOP" ]; then echo "週の枠が ${w0}% になったので止める"; exit 3; fi
    if [ "$ok" != "true" ]; then
      wait=$(( reset + 60 - $(date +%s) ))
      echo "$(date '+%H:%M') 5時間枠が尽きた。$(date -r "$reset" '+%H:%M') のリセットまで ${wait}秒眠る"
      [ "$wait" -gt 0 ] && sleep "$wait"
      read -r h0 w0 ok reset < <(read_quota)
      [ "$ok" = "true" ] || { echo "リセットの時刻を過ぎても使えない"; exit 2; }
    fi
    t0=$(date +%s)
    refs=($(python3 -I scripts/storyboard_frames.py refs "$id"))
    printf '%s\n' "Use your built-in image generation tool to create ONE image, then save the PNG to $out. Do not write any other files. Image prompt: $(python3 -I scripts/storyboard_frames.py prompt "$id")" \
      | codex exec -s workspace-write -C "$PWD" --image "${refs[@]}" - > "out/review/codex_last.log" 2>&1
    read -r h1 w1 _ _ < <(read_quota)
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$(date '+%m-%d %H:%M')" "$id" "$h0" "$h1" "$w0" "$w1" "$(( $(date +%s) - t0 ))" >> "$LOG"
    if [ -s "$out" ]; then echo "$(date '+%H:%M') 描けた: $id（5時間枠 ${h0}→${h1}%、週の枠 ${w0}→${w1}%）"; break; fi
    echo "$(date '+%H:%M') $id が保存されなかった（${try}回目）"
  done
done
echo "$(date '+%H:%M') 全部描けた"
