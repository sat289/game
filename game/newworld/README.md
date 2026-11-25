# Sheru Bhai City 3D (v33 — Modular Upload-Safe Architecture + 3D Coin Rush + 60fps Mini-Arcade + Python Termux Optimizer)

## Why v33 Fixes the GitHub Mobile Upload Error ("Something went really wrong, and we can't process that file")
- Previously, `world-engine.js` was a single **559 KB** file that timed out on mobile Chrome's GitHub web uploader.
- In **v33**, it is cleanly split into **6 small ES modules** (`world-constants.js` 7 KB, `world-engine.js` 77 KB, `world-cinematics.js` 62 KB, `world-loop.js` 71 KB, `world-buildings.js` 162 KB, `world-zones.js` 170 KB) — **ZERO huge files!**
- **Tip when uploading via Chrome Mobile:** Upload **5–6 files per commit** (e.g., Batch 1: HTML files, Batch 2: `world-*.js`, Batch 3: remaining JS & CSS), OR push ALL 26 files in 3 seconds using **`python3 optimize_city.py --push "v33 update"`** in Termux!

## New in v33
1. **🪙 In-City 3D Coin Rush (`minigames.js`):** Tap **`🪙 Coin Rush`** in `index.html` to drive across city roads, Beach Boulevard, RGB Sea Bridge & Hilltop Temple road collecting 12 spinning gold coins against a 60-second timer.
2. **🕹️ Sheru Bhai Low-RAM 60fps Arcade (`arcade.html` + `arcade-games.js`):** 3 built-in high-quality HTML5 Canvas + CSS3 GPU games (**🏎️ Highway Rush**, **🚀 ISRO Rocket Tap**, **🏏 Super Over Cricket**) using `<15 MB` RAM!
3. **🐍 Python 3 Optimizer & Termux Git Pusher (`optimize_city.py`):** Audits file sizes, creates a minified low-RAM `dist_min/` build, and pushes straight to GitHub from Termux.
