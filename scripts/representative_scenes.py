"""各回の代表場面を1枚ずつ描かせる依頼文をまとめる。

docs/spec/storyboard.md の各回から、機能がいちばん伝わる本編の場面を1つ選び、1枚の絵にする。
`prompt <回のid>` で依頼文を、`refs <回のid>` で添付する設定画を、`list` で回と字幕の一覧を出す。
"""
import json
import sys

COMMON = (
    "Generate an image. ONE single illustration (not a grid, not a comic strip) of a scene from a short comic video. "
    "Use the attached character sheets EXACTLY for the characters' designs: {cast}. "
    "Match their art style: bold clean outlines, ONE hard-edged shadow tone cel shading, very simple shapes, cute and comical. "
    "Draw ONLY the characters described in the scene. Setting: a cozy room with a warm wooden floor. "
    "If a kanban board appears, it has four columns labeled 'Ready', 'In Progress', 'In Review', 'Done' unless the scene says otherwise. "
    "Do not write captions or speech text. Do not draw any real logo or mascot. Landscape 16:9 canvas.\n"
    "Scene: "
)
CAST = {
    "whale": "Konti, a small floating indigo whale with a cream belly who uses its front fins like hands",
    "cc": "a round white robot with TERRACOTTA ear discs, feet, hands and antenna ball",
    "codex": "the same round white robot with PERIWINKLE BLUE ear discs, feet, hands and antenna ball",
    "dev": "a lazy but cute developer with a friendly round face and big sparkly eyes behind round glasses, messy black hair, navy hoodie and a yellow mug; never draw his face squashed or distorted",
}
REFS = {"whale": "assets/ref/continuo.png", "cc": "assets/ref/claude_code.png", "codex": "assets/ref/codex.png", "dev": "assets/ref/developer.png"}
EP = [
    ("place_on_ready", "置くだけの回", "8〜11", "Claude Code が作業開始", ["whale", "cc", "dev"],
     "A kanban board on the wall shows one card in 'In Progress'. In front of it, Konti floats beside a small workbench with a signboard reading 'worktree', handing a paper card to the terracotta robot, who clenches its fist with determination. In the background the developer leans back at a desk sipping coffee."),
    ("visible_workshop", "見える工房の回", "8〜11", "Claude Code がしていることは、そのまま見える", ["whale", "cc", "codex", "dev"],
     "A glass-walled workshop. Inside, the terracotta robot hands a sheet of paper to the periwinkle robot at the next bench, and the two robots high-five. Outside the glass, Konti floats presenting the workshop with an open fin, and the developer presses his face to the glass, watching with interest."),
    ("one_kanban", "カンバン1枚の回", "5〜10", "issue ごとに、そのリポジトリで", ["whale", "cc"],
     "One kanban board with cards in three colors (red, yellow, purple). Below it, three small shelves in the same three colors, each with its own small workbench. Konti spouts water to fling a red card toward the red workbench, while terracotta robots work at the other benches."),
    ("blocked", "詰まったらひとことの回", "2〜5", "行き詰まったら", ["whale", "cc"],
     "The terracotta robot has just crashed into a wall, smoke rising from its head, raising one hand. Next to it, Konti moves a card into a column labeled 'Blocked' on a kanban board with columns 'Ready', 'In Progress', 'Blocked'."),
    ("wait_quota", "寝て待つ回", "8〜11", "枠が戻るのを待って", ["whale", "cc"],
     "Night. The terracotta robot sits on the floor with an empty battery-shaped gauge floating above its head. Konti sleeps hugging an alarm clock, a bubble from its blowhole. A wall clock shows its hand reaching the reset time and the alarm is just starting to ring."),
    ("team_bid", "チームで入札の回", "2〜6", "残りの枠で入札", ["whale", "cc"],
     "Three desks in a row. Above each desk floats a whale like Konti, the three in indigo, plum and mustard. A small terracotta robot sits at each desk with a battery gauge above it showing different levels. A new card floats in the middle and the three whales raise signs with their fins showing 72%, 35%, 10%; the indigo whale with 72% reaches for the card."),
    ("stranger_comment", "他人のコメントの回", "10〜13", "指示として聞くのはチームだけ", ["cc"],
     "The terracotta robot stands between two boxes. It has put two paper comment cards with official-looking tags into a box marked with a check mark, and now drops a third card, written by a faceless hooded figure in a grey hoodie shown as a small icon on the card, into a box marked with an eye symbol, shrugging."),
    ("flat_rate", "定額のままの回", "6〜10", "いつもの定額プランのまま", ["whale", "cc", "dev"],
     "Split scene. Left: the terracotta robot works next to a cash register whose money display spins with coins flying, and the developer turns pale. Right: the same robot works happily under Konti's direction with no register at all, only one small plain tag hanging on the wall."),
    ("resume", "止めても続きからの回", "6〜10", "作業台は、そのまま", ["whale", "cc", "dev"],
     "Morning sunlight. The terracotta robot sits waiting in front of a workbench with a half-finished build still on it. The lamp above Konti has just switched on, and Konti spouts water happily and hands the robot the next sheet of paper. The developer stands by a computer, having just started it."),
    ("direct_chat", "Direct Chat の回", "8〜12", "Claude Code と直接話せる", ["whale", "cc", "dev"],
     "The developer sits on a chair pulled up right next to the terracotta robot; both point at one screen together, chatting with empty speech bubbles. To the side, Konti floats quietly with its mouth zipped shut and a megaphone set down beside it."),
]


def prompt(e):
    cast = "; ".join(f"sheet {i+1} is {CAST[c]}" for i, c in enumerate(e[4]))
    return COMMON.format(cast=cast) + e[5]


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "list":
        print(json.dumps([{"id": e[0], "name": e[1], "sec": e[2], "caption": e[3]} for e in EP], ensure_ascii=False))
    else:
        e = next(x for x in EP if x[0] == sys.argv[2])
        print(prompt(e) if cmd == "prompt" else "\n".join(REFS[c] for c in e[4]))
