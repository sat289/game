OPEN WORLD CAR GAME — STARTER PROJECT

Files:
- index.html: screens and interface
- css/style.css: responsive mobile UI
- js/main.js: menus, controls, game flow, save integration
- js/world.js: Three.js 3D starter world and driving prototype
- js/storage.js: localStorage save/load

RUN:
1. Extract the ZIP.
2. Open the folder in VS Code.
3. Use the Live Server extension, or any local static web server.
4. Internet is required because Three.js is loaded from jsDelivr CDN.
5. For GitHub Pages, upload the extracted files while preserving folder names.

IMPORTANT LIMITATIONS:
- This is a playable starter prototype, not a finished AAA open-world game.
- The car is a procedural placeholder mesh, not a real licensed car model.
- The environment is a compact prototype scene, not a huge detailed map.
- Production realism requires optimized GLB/GLTF car, building, road, tree, sound and animation assets.
- Do not put several GB of assets into localStorage. localStorage is for small save data only (coins, gems, level, dam
                                                                                               age). Use asset files for models/textures/audio.
- For good performance, use compressed textures/models, LOD, instancing, texture atlases and device-aware graphics settings.
- The starter stores coins, gems, level, XP and car health locally in the browser.
