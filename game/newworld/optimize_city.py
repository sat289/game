#!/usr/bin/env python3
"""
🐍 Sheru Bhai City — Python 3 Optimizer & Termux GitHub Pusher (v33)
Run in Android Termux (or PC):
  1) Health & size audit + minified low-RAM build:
       python3 optimize_city.py
  2) Auto-push all updated files directly to GitHub (NO Chrome mobile upload errors!):
       python3 optimize_city.py --push "v33 update"
"""
import os
import re
import shutil
import subprocess
import sys

MAX_MOBILE_KB = 220.0  # Safe limit for GitHub mobile Chrome web uploader


def minify_css(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s*([{}:;,])\s*", r"\1", text)
    return text.strip()


def safe_trim_js(text: str) -> str:
    """Safely strips full-line // comments & extra blank lines without breaking URLs or GLSL."""
    out = []
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("//"):
            continue
        out.append(line.rstrip())
    return "\n".join(out) + "\n"


def audit_and_optimize(root_dir: str) -> None:
    dist_dir = os.path.join(root_dir, "dist_min")
    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir, exist_ok=True)

    total_orig = 0
    total_min = 0
    oversized = []

    print("\n=== 🦁 SHERU BHAI CITY — PYTHON LOW-RAM OPTIMIZER ===")
    for fn in sorted(os.listdir(root_dir)):
        src_path = os.path.join(root_dir, fn)
        if not os.path.isfile(src_path) or fn.startswith(".") or fn == "optimize_city.py":
            continue
        raw_bytes = os.path.getsize(src_path)
        total_orig += raw_bytes
        kb = raw_bytes / 1024.0
        flag = " ⚠️ LARGE" if kb > MAX_MOBILE_KB else " ✅"
        if kb > MAX_MOBILE_KB:
            oversized.append((fn, kb))

        dst_path = os.path.join(dist_dir, fn)
        if fn.endswith(".css"):
            data = minify_css(open(src_path, encoding="utf-8").read())
            open(dst_path, "w", encoding="utf-8").write(data)
        elif fn.endswith(".js") and fn != "shaders-glsl.js":
            data = safe_trim_js(open(src_path, encoding="utf-8").read())
            open(dst_path, "w", encoding="utf-8").write(data)
        else:
            shutil.copy2(src_path, dst_path)

        min_bytes = os.path.getsize(dst_path)
        total_min += min_bytes
        print(f"  {fn:24s} {kb:6.1f} KB -> {min_bytes/1024:6.1f} KB{flag}")

    saved_pct = (1 - total_min / max(1, total_orig)) * 100
    print(f"\nTotal: {total_orig/1024:.1f} KB -> {total_min/1024:.1f} KB (saved {saved_pct:.1f}%)")
    print(f"Minified low-RAM bundle written to: {dist_dir}/")
    if oversized:
        print("WARNING: Oversized files for mobile Chrome uploader:", oversized)
    else:
        print("All files are safely under 220 KB for fast GitHub upload! 🚀")


def git_push(msg: str) -> None:
    print(f"\n🚀 Pushing directly to GitHub via Git ({msg})...")
    for cmd in [["git", "add", "."], ["git", "commit", "-m", msg], ["git", "push", "origin", "main"]]:
        print("  $", " ".join(cmd))
        res = subprocess.run(cmd)
        if res.returncode != 0 and cmd[1] != "commit":
            print("Git command stopped. Check git remote / token in Termux.")
            sys.exit(res.returncode)
    print("✅ Pushed live to GitHub Pages!")


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    audit_and_optimize(here)
    if "--push" in sys.argv:
        idx = sys.argv.index("--push")
        commit_msg = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else "Sheru Bhai City v33 Update"
        git_push(commit_msg)
