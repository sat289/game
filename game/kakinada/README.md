# Kakinada Drive – 3D car game

Run: just open `index.html` in Chrome/Edge/Firefox (needs internet once for Three.js r128 from cdnjs).

Controls: W/Up gas, S/Down brake+reverse, A D / Left Right steer, Space handbrake, Shift boost, R reset to road.
Phone: on-screen buttons.

## Files
- index.html            – complete game, map data embedded (ready to run/host)
- source/game-template.html – game code (Three.js) with a /*DATA*/ placeholder
- source/data.json      – compact map data converted from your OSM files
- source/prep.py        – converts your map/*.js (Overpass JSON) into data.json
                          (run from inside your `map/` folder: python3 prep.py, then move data.json to source/)
- source/build.py       – embeds data.json into the template -> index.html

## Rebuild
1. (optional) python3 prep.py   (inside the map folder; writes ../data.json)
2. cd source && python3 build.py

