# Sheru Bhai City 3D (v29 — Fixed v28 Startup Crash + Monsoon Rain + Night Fireworks + Temple Orbit + Biryani, Box Cricket & GT650 Showroom)

Upload the `follower-town/` folder into your `sat289/game/` GitHub repository.

## Bugs Fixed from v28
1. **Fixed Startup Crash (`Cannot read properties of undefined (reading 'filter')`):** Removed the misplaced `this.landmarkActors.filter(...)` line from `constructor()` and placed it safely inside `_rebuildRoadsAndRingRoad()`.
2. **Fixed Vehicle Soft Shadows:** Updated `setShadowsEnabled()` to target `this.trafficGroup` (instead of undefined `this.vehiclesGroup`).
3. **Fixed Hilltop Temple Approach Road Length:** Trimmed cleanly from 56 to 32 units so it joins the North Outer Ring Road flush without cutting into northern city blocks.
4. **Fixed Custom Beach/Airport Landmark Signs & `HILL_TEMPLE` Shot-List handling.**

## New Features Added in v29
1. **🎆 Night Sky Fireworks (`🎆 Fireworks` in Reel Studio & World Settings):** Launches glowing neon fireworks over the Sheru Bhai Statue, Sacred Hilltop Temple, and Golden Beach (looks epic with Night Bloom!).
2. **🌧️ Monsoon Rain Weather (`🌧️ Rain` in Reel Studio & World Settings):** Ultra-lightweight 1-draw-call camera-following rain streaks for moody Araku Valley & Train Tunnel Reels.
3. **✨ Sacred Hilltop Temple Cinema Orbit (`✨ Temple Orbit` in Reel Studio):** Dedicated 7.5-second smooth orbit filming the glowing Golden Vimana, 48 climbing pilgrimage steps, waterfall & Ghat Road vehicles.
4. **3 New Follower-Favorite Buildings (47 Total Buildable Types):**
   - **🍲 Hyderabadi Dum Biryani Point (`biryani_point` — 1 Plot)**
   - **🏏 Floodlit Box Cricket Turf Arena (`box_cricket` — 4 Plots)**
   - **🏍️ GT650 & Superbike Showroom (`bike_showroom` — 4 Plots)**
