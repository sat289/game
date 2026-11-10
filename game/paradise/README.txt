ST GAMES - PARADISE ORIGINS (STARTER PROTOTYPE)

WHAT IS INCLUDED
- Third-person 3D prototype using Three.js
- Touch joystick, camera drag, jump and action controls
- Story objectives and free-roam mode
- Responsive HUD and graphics quality selector
- PWA manifest and service worker for offline caching

INSTALL
1. Upload the complete "paradise" folder to your website:
   /game/paradise/
2. Open https://YOUR-DOMAIN/game/paradise/ while online.
3. Wait for the first load to finish. Reload once to confirm the service worker is active.
4. Test offline by enabling airplane mode and reopening the game.
5. Your main ST GAMES page can link to: game/paradise/index.html

IMPORTANT OFFLINE NOTES
- The first visit requires internet to download/cache the Three.js engine.
- The service worker caches the app shell and the Three.js module when available.
- Clear site data only if you intentionally want to reset the cache.
- HTTPS is required for service workers (localhost is also supported).

CURRENT PROTOTYPE LIMITATIONS
- This is a playable foundation, not a finished realistic commercial game.
- Character, houses, trees and terrain are temporary procedural placeholders.
- Replace these with optimized, licensed GLB/GLTF models and locally stored textures/audio.
- For fully offline use, place every model, texture, animation and audio file inside this folder.
- Actual film character likenesses, actor scans, movie footage, soundtrack and logos are not included.
  Use authorized assets or create original characters with a similar broad cinematic atmosphere.

NEXT DEVELOPMENT MILESTONES
1. Import optimized character GLB with idle/walk/run/jump animations.
2. Replace placeholder world with detailed mission locations.
3. Add dialogue/cutscene system and mission JSON editor.
4. Add collision, slopes, interaction objects and save slots.
5. Add asset download/installation screen and verify complete offline operation.
6. Profile on target Android devices and tune quality settings.


UPDATE V0.2
- Added articulated placeholder character rig with arm/leg swing for walking and running.
- Added simple skippable dialogue beats after mission completion.
- Added Mission Editor: edit mission title, description and target X/Z; save to localStorage; export mission JSON.
- Updated service-worker cache version to v2 and caches the app shell plus Three.js module when available.

EDITOR LIMITATIONS
- The editor changes mission metadata and marker positions only. It does not yet sculpt terrain, place arbitrary 3D objects, or edit animation timelines.
- Dialogue is a basic text scene, not a voiced or camera-directed cinematic yet.
- Character remains a procedural placeholder. Import a properly licensed GLB model with idle/walk/run/jump clips in a future milestone.
- Offline test: deploy over HTTPS, visit online, wait for the first load, reload once, then enable airplane mode and reopen. Browser storage eviction can still remove cached files; no web app can guarantee cache retention if the browser clears site data.
