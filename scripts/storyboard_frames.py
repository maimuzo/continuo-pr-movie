"""10本の絵コンテ（本編の場面ごとの見本の静止画）を描かせる依頼文をまとめる。

docs/spec/storyboard.md の各回の本編（タイトルと締めを除く行）を、1行につき1枚の絵にする。
`list` で描く絵の一覧（JSON）を、`prompt <絵のid>` で依頼文を、`refs <絵のid>` で添付する設定画を出す。
絵のid は `<回のid>/<秒>`（例: `blocked/2-5`）。描いた絵は out/storyboards/<回のid>/<秒>.png に置く。
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from representative_scenes import CAST, COMMON, REFS  # noqa: E402

# 代表場面で絵柄が細かくなりすぎた回があったので、塗りと背景の簡素さを念押しする
STYLE = (
    "Keep the whole picture flat and simple like the character sheets: flat fills, no soft gradients, no glow, "
    "a plain background with only the few props the scene needs. No words on walls or signs unless the scene gives them. "
)

FRAMES = [
    ("place_on_ready", "置くだけの回", [
        ("2-5", "issue を書いて、Ready へ", ["dev"],
         "The developer at a desk has just tossed a crumpled paper card over his shoulder without looking; the card is flying toward a kanban board on the wall and is about to stick flat in the 'Ready' column."),
        ("5-8", "continuo が拾って", ["whale"],
         "In the corner of the room Konti has just woken up and leaps into the air with a big water spout, grabbing the card in the 'Ready' column of the kanban board with one fin, about to move it to 'In Progress'."),
        ("8-11", "Claude Code が作業開始", ["whale", "cc"],
         "Konti floats beside a small workbench with a signboard reading 'worktree', handing a paper card to the terracotta robot, who clenches its fist with determination and starts working."),
        ("11-13", "あなたは、コーヒーでも", ["whale", "cc", "dev"],
         "The developer leans back in his chair sipping coffee from the yellow mug. A small picture-in-picture window on the side shows the terracotta robot working at the bench and Konti waving a fin beside it."),
    ]),
    ("visible_workshop", "見える工房の回", [
        ("2-5", "裏で何してるか、分からない？", ["dev"],
         "A plain black box rattles and puffs grey smoke. The developer stands in front of it, tilting his head, puzzled."),
        ("5-8", "continuo なら、ガラス張り", ["whale", "cc"],
         "A glass-walled workshop. Inside, the terracotta robot works at a bench with an empty thought bubble above it. Outside the glass, Konti presents the workshop with an open fin, like saying 'please, have a look'."),
        ("8-11", "Claude Code がしていることは、そのまま見える", ["whale", "cc", "codex", "dev"],
         "Inside the glass-walled workshop, the terracotta robot hands a sheet of paper to the periwinkle robot at the next bench, and the two robots high-five. Outside the glass, Konti floats beside the workshop and the developer stands a step away from the glass, watching with a happy curious smile."),
        ("11-13", "別の端末からも", ["cc", "dev"],
         "The developer on a sofa holds a tablet; its screen shows the same glass workshop with the terracotta robot working inside."),
    ]),
    ("one_kanban", "カンバン1枚の回", [
        ("2-5", "リポジトリが違っても", ["dev"],
         "The developer pins cards onto ONE single kanban board. Each card has a thick colored stripe on top (red, yellow or purple) and the three colors are mixed together in the 'Ready' column."),
        ("5-10", "issue ごとに、そのリポジトリで", ["whale", "cc"],
         "Left: one kanban board whose cards have red, yellow and purple stripes. Right, at the back of the room: three separate small workshop houses standing side by side, with a red roof, a yellow roof and a purple roof. Above each door is a signboard reading 'acme/shop-app' (red house), 'acme/api' (yellow house) and 'acme/docs' (purple house). Konti spouts water to fling a red-striped card through the air into the red house, where a terracotta robot reaches out to catch it."),
        ("10-13", "同時に進む", ["whale", "cc"],
         "Three separate small workshop houses side by side with a red roof, a yellow roof and a purple roof, signboards reading 'acme/shop-app', 'acme/api', 'acme/docs'. The front walls are open so we can see inside: in EACH house a terracotta robot works busily at its own bench at the same time, each holding a card with the stripe color of its house. Konti swims slowly above the three roofs, looking down at all of them."),
    ]),
    ("blocked", "詰まったらひとことの回", [
        ("2-5", "行き詰まったら", ["cc"],
         "A miniature construction site that stands for a software project: building-block towers and half-built block houses along a tile road. The terracotta robot runs along the road carrying a block, but the road ends at a brick wall; the road splits left and right in front of the wall and both ways are hidden in thick white fog. The robot has bumped into the wall, a big question mark above its head, raising ONE arm straight up with an open palm, like a student asking for help. Not a peace sign."),
        ("5-7", "continuo が Blocked に", ["whale", "dev"],
         "Konti moves a card into a column labeled 'Blocked' on a kanban board with columns 'Ready', 'In Progress', 'Blocked'. The developer at the edge of the frame notices the card and raises his eyebrows."),
        ("7-10", "コメントでひとこと", ["dev"],
         "The developer types one short line into a comment box on a big screen (draw the text as a simple arrow pointing right, no letters), while his other hand drags the card back to the 'Ready' column on the kanban board."),
        ("10-13", "続きから再開", ["whale", "cc"],
         "The same miniature construction site. Konti has delivered a small note with a right-pointing arrow to the terracotta robot. The fog on the right-hand road clears away, and the robot dashes off to the right with speed lines, carrying its block toward a half-built block house that it starts stacking up."),
    ]),
    ("wait_quota", "寝て待つ回", [
        ("2-5", "作業の途中で", ["cc"],
         "The terracotta robot works furiously at a workbench with sweat drops and motion lines. Above its head floats a battery-shaped gauge, its fill shrinking from half to almost empty. The battery fill is yellow."),
        ("5-8", "枠を使い切っても", ["whale", "cc"],
         "Night. The terracotta robot sits slumped on the floor with an EMPTY battery-shaped gauge above its head. Konti sleeps beside it hugging an alarm clock, a small bubble from its blowhole."),
        ("8-11", "枠が戻るのを待って", ["whale", "cc"],
         "A big wall clock whose hands spin fast with motion blur, the alarm clock in sleeping Konti's fins starts ringing, and the battery gauge above the sitting terracotta robot jumps back to FULL with a yellow fill."),
        ("11-13", "勝手に続きから", ["whale", "cc", "dev"],
         "Konti has jumped awake with a big water spout and nudges the terracotta robot, who gets up and resumes working at the bench. In the background the developer sleeps face-down on his desk."),
    ]),
    ("team_bid", "チームで入札の回", [
        ("2-6", "残りの枠で入札", ["whale", "cc"],
         "A team room with three desks in a row, each desk a different team member's computer, marked by a different mug. A terracotta robot sits at each desk with a battery-shaped gauge above its head showing how much is left: almost full, half, nearly empty. The battery fills are yellow, never green. A big number floats on each battery: 72%, 35%, 10%. In front of a shared kanban board, ONE Konti floats holding a new card and carries it toward the robot whose battery shows 72%."),
        ("6-10", "余裕のある人へ", ["whale", "cc"],
         "The same three desks in fast motion. The first robot's battery has dropped, so now ONE Konti carries the next card to the second robot, whose battery is now the fullest. The third robot's battery is empty and it sits still, waiting patiently. Battery fills are yellow, never green."),
        ("10-13", "チームで手分け", ["whale", "cc"],
         "A shared kanban board whose 'In Review' column is suddenly full of cards. Below it the three terracotta robots at their three desks and ONE Konti cheer together."),
    ]),
    ("stranger_comment", "他人のコメントの回", [
        ("2-6", "コメントは誰でも書ける", [],
         "No characters. A big issue comment column with three comment cards falling into it one after another. Each card has a small round avatar icon: a man with messy black hair and round glasses, a woman with a short red bob, and a faceless figure in a grey hood. The card text is drawn as simple grey lines, no letters."),
        ("6-10", "聞く相手は、指示書で決めてある", ["whale", "cc"],
         "The three comment cards hang in a row; the first has a small tag reading 'OWNER', the second a tag reading 'MEMBER', the third (with the grey hooded avatar) has no tag. Konti hands the terracotta robot a rule sheet. The robot reads the cards and puts the first two into a box marked with a check mark."),
        ("10-13", "指示として聞くのはチームだけ", ["cc"],
         "The terracotta robot drops the third card, the one with the grey hooded avatar and no tag, into a box marked with an eye symbol, and shrugs."),
    ]),
    ("flat_rate", "定額のままの回", [
        ("2-6", "使うたびに課金？", ["cc", "dev"],
         "The terracotta robot works at a bench next to a cash register whose money display spins up, coins popping out of the register by themselves. The developer beside it turns pale with his jaw dropping."),
        ("6-10", "いつもの定額プランのまま", ["whale", "cc", "dev"],
         "Split scene with a vertical line. Left half: the robot works next to a cash register spinning wildly with coins flying out. Right half: the SAME robot works just as hard, with an equally tall pile of finished parts, under Konti's direction. Next to it stands the same kind of cash register, but its display is frozen and a big padlock hangs on it, and nothing comes out. The developer on the right relaxes with his mug, smiling."),
        ("10-13", "定額プランなら、従量課金にならない", ["dev"],
         "The developer pulls the power plug of the cash register on the left with one hand, carrying a cardboard moving box under his other arm, stepping toward a cozy workshop on the right."),
    ]),
    ("resume", "止めても続きからの回", [
        ("2-6", "continuo を止めても", ["whale", "cc", "dev"],
         "The developer at his desk presses a big keyboard key labeled 'Ctrl+C'. His computer monitor shows two windows side by side. In the left window, Konti's lamp goes dark, the window turns dim, and Konti stands still behind a small hanging 'closed' board with a cross mark. In the right window, still brightly lit, the terracotta robot keeps finishing the piece in its hands at a small workbench."),
        ("6-10", "作業台は、そのまま", ["whale", "cc", "dev"],
         "Next morning, sunlight through the window. The computer stayed on all night. On the monitor, the right window is still lit and the terracotta robot sits patiently in front of its workbench with the half-finished build still on it. The developer, with a coffee mug, has just started continuo: the left window lights up again, Konti spouts water happily and passes the next sheet of paper across the border between the two windows to the robot."),
        ("10-13", "次に起動すれば、続きから", ["cc", "dev"],
         "Close-up of the monitor: in the right window the terracotta robot happily resumes the half-finished build. In front of the monitor the developer blinks, deflated, with a single sweat drop, as if saying 'oh, that's it?'."),
    ]),
    ("direct_chat", "Direct Chat の回", [
        ("2-5", "ふだんは continuo が指示", ["whale", "cc"],
         "Konti shouts through a megaphone held in its fins toward the terracotta robot, who works busily at a bench."),
        ("5-8", "Direct Chat に動かすと", ["whale", "dev"],
         "The developer drags a card into a column labeled 'Direct Chat' on a kanban board. Konti puts the megaphone down on the floor, its mouth zipped shut with a zipper, and steps aside."),
        ("8-12", "Claude Code と直接話せる", ["whale", "cc", "dev"],
         "The developer sits on a chair pulled up right next to the terracotta robot; both point at one screen together, chatting with empty speech bubbles. To the side, Konti floats quietly with its mouth zipped shut and the megaphone set down beside it."),
        ("12-13", "戻せば、また continuo が", ["whale", "dev"],
         "The developer drags the card from 'Direct Chat' back to the 'In Progress' column on the kanban board, and Konti picks the megaphone back up with a cheerful look."),
    ]),
]


TAG = {
    "cc": "Above the terracotta robot's head floats a small rounded name tag in the same terracotta color with white text 'Claude Code'. ",
    "codex": "Above the periwinkle robot's head floats a small rounded name tag in the same periwinkle blue with white text 'Codex'. ",
}


def frames():
    for ep, name, rows in FRAMES:
        seen = set()
        for sec, caption, cast, scene in rows:
            both = "cc" in cast and "codex" in cast
            tags = "".join(TAG[r] for r in ("cc", "codex") if r in cast and (both or r not in seen))
            seen.update(cast)
            scene = scene + " " + tags if tags else scene
            yield {"id": f"{ep}/{sec}", "ep": ep, "name": name, "sec": sec.replace("-", "〜"),
                   "caption": caption, "cast": cast, "scene": scene}


def prompt(f):
    if f["cast"]:
        cast = "; ".join(f"sheet {i+1} is {CAST[c]}" for i, c in enumerate(f["cast"]))
        head = COMMON.format(cast=cast)
    else:
        head = COMMON.replace("Use the attached character sheets EXACTLY for the characters' designs: {cast}. ",
                              "The attached image is only an art style reference; do not draw its character. ")
    return head.replace("Scene: ", STYLE + "Scene: ") + f["scene"]


def refs(f):
    return [REFS[c] for c in f["cast"]] or [REFS["cc"]]


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "list":
        first = ("visible_workshop", "one_kanban", "blocked", "team_bid", "flat_rate", "resume")
        fs = sorted(frames(), key=lambda f: f["ep"] not in first)
        print(json.dumps([{k: f[k] for k in ("id", "name", "sec", "caption")} for f in fs], ensure_ascii=False))
    else:
        f = next(x for x in frames() if x["id"] == sys.argv[2])
        print(prompt(f) if cmd == "prompt" else "\n".join(refs(f)))
