"""人間が Nano Banana で描いて assets/inbox/ に保存した画像に、依頼書の順で名前を付ける。

使い方: python3 -I scripts/ingest.py assets/prompts/<依頼書>.md [--dry-run]

依頼書の「## 1. craftsman/box_goggles　…」のような見出しの順と、inbox の画像を保存した時刻の順を
突き合わせ、assets/raw/<id>.png へ移す。枚数が合わなければ、何も動かさずに止まる。
"""
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INBOX = os.path.join(ROOT, "assets", "inbox")
EXTS = (".png", ".jpg", ".jpeg", ".webp")


def main() -> int:
    prompt_file, dry = sys.argv[1], "--dry-run" in sys.argv
    ids = re.findall(r"^## \d+\. (\S+)", open(prompt_file, encoding="utf-8").read(), flags=re.M)
    files = sorted(
        (os.path.join(INBOX, f) for f in os.listdir(INBOX) if f.lower().endswith(EXTS)),
        key=os.path.getmtime,
    )
    if len(files) != len(ids):
        print(f"枚数が合わない: 依頼書 {len(ids)} 枚 / inbox {len(files)} 枚。何も動かしていない")
        for f in files:
            print("  inbox:", os.path.basename(f))
        return 1
    for id_, src in zip(ids, files):
        ext = os.path.splitext(src)[1].lower()
        dst = os.path.join(ROOT, "assets", "raw", id_ + (".png" if ext == ".png" else ext))
        print(f"{os.path.basename(src)} -> {os.path.relpath(dst, ROOT)}")
        if not dry:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.move(src, dst)
    return 0


if __name__ == "__main__":
    sys.exit(main())
