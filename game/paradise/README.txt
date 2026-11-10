ST GAMES — PARADISE: ORIGINS v0.3 (Top-Down)

UPLOAD
Upload the entire paradise folder to: https://stgames.online/game/paradise/
Open: https://stgames.online/game/paradise/

CONTROLS
- Use the left virtual joystick to move.
- Tap TALK near a character or green mission marker.
- Pause button opens pause menu.
- Mission Editor lets you edit objective names and coordinates.

CHARACTERS
The game includes original procedural placeholder characters so it runs immediately.
To replace them with downloaded 3D models, put GLB files here:
assets/characters/hero.glb
assets/characters/npc-1.glb
assets/characters/npc-2.glb
assets/characters/npc-3.glb
assets/characters/npc-4.glb
The GLB loader uses the first animation clip as idle if no clip named Idle exists. Keep models optimized and test on the target Android phone.

FREE MODEL SOURCES
- Poly Pizza CC0 people/characters: https://poly.pizza/explore/People-and-Characters?lic=1
- Gobkit free CC0 GLB character library: https://gobkit.com/freebies
Check each model's own license before using. Prefer CC0 or another license that explicitly allows your intended use. Do not use actor likenesses, movie character models, logos or film assets without permission. A downloaded model must be copied into the local assets/characters folder; do not rely on hotlinking a website model if you want offline play.

OFFLINE
The service worker caches the game shell and Three.js modules after the first successful online visit. GLB models are cached after they are fetched successfully. Open the game online once, wait for it to load, then reload once before testing airplane mode. Browser storage can be cleared/evicted; offline operation is not guaranteed until tested on your device. This project still needs internet on first install.

LIMITATIONS
This is a playable top-down prototype, not a finished photorealistic commercial game. The built-in characters are simple placeholders; quality depends on the GLB models you add. No movie footage, original movie dialogue, actor likeness, music or sound effects are included. Add audio files only if you own them or have permission.
