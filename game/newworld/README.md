# Sheru Bhai City 3D (v38 — Animated Sheru Bhai 3D GLB Everywhere + Fixed Function Hall + Zero-Disturbance Landmark Placement & Clear-Space Inbox Auto-Build)

Upload the **`follower-town/`** folder (including **`sheru-bhai-animated.glb`**) into `sat289/game/game/newworld/`.

## What's Fixed & Added in v38
1. **🦁 Animated 3D Sheru Bhai (`sheru-bhai-animated.glb`) Live Across ALL Sheru Bhai Locations:**
   - Included directly inside `follower-town/sheru-bhai-animated.glb` (`348 KB` web-optimized with 6 embedded PBR textures & 4 animations) and downloaded **only once** via Promise deduplication + played via `THREE.AnimationMixer` at:
     * **ST Junction Central Statue:** Plays **`BossSalute`**!
     * **Sheru Bhai Royal Island Mansion:** Plays **`Wave`** greeting visitors off the RGB Sea Bridge!
     * **International Airport VIP Red Carpet:** Plays **`Walk`**!
     * **Airport Diamond Car & Diamond Helicopter:** Plays **`Idle`**!
     * **Golden Beach VIP Lounge:** Plays **`Idle`**!
2. **🎉 Fixed Function Hall Crash (`beamSpots.forEach is not a function`):**
   - Fixed the roof disco light coordinates passed to `_attachSkyDiscoLights()` so the 8-Plot Grand Function Hall builds cleanly with DJ stage, giant speakers, 2 orbiting drones, bursting fireworks, sky disco beams & outdoor lunch banquet!
3. **🛡️ Zero-Disturbance Landmark Placement (`admin.html` → `🏗️ Build`):**
   - When building a 2-plot, 4-plot, or 8-plot landmark, if the tapped block already has ANY other house or landmark, **zero existing buildings are moved or overwritten**—only the new landmark smoothly places itself in the **nearest 100% clear empty space** and focuses the camera right on it!
4. **📬 Bulletproof Clear-Space Inbox Auto-Build (`📬 Inbox` → `⚡ Auto-Build`):**
   - Fixed the bug where `occupied_by_landmark` sibling plots were mistakenly treated as empty. Inbox Auto-Build now maps every built 1/2/4/8-plot footprint first and **always builds in 100% clear empty land**, auto-expanding the city grid as needed!
