# Sheru Bhai City 3D (v26 — Cinema Shadows + Neon Bloom + Procedural Textures + Hero .glb Loader + Mobile Shops)

Upload the `follower-town/` folder into your `sat289/game/` GitHub repository.

## What's New in v26
1. **☀️ Real Soft Sun Shadows (Admin Reel Mode Only):**
   - Automatically turns ON (`PCFSoftShadowMap`, 2048px) when you enter **`🎬 9:16 Reel`** in `admin.html` (with a 1-tap **`☀️ Shadows`** toggle pill) and dynamically follows the camera target so buildings, trees, trains, and Sheru Bhai Statue cast crisp ground shadows everywhere — while keeping public `index.html` 100% lag-free!
2. **✨ Neon Bloom / Cinema Glow (Admin Reel Mode Only):**
   - Lazy-loads Three.js `EffectComposer` + `UnrealBloomPass` + `OutputPass` strictly in Admin Reel Mode (with a 1-tap **`✨ Bloom`** toggle pill). Automatically intensifies in **🌙 Night Mode** so Disco Statue beams, Movie Theater / IMAX Sky Lights, Train Headlights, Audi Showroom LEDs, Runway Lights, and Mobile Shops glow like a movie trailer!
3. **🧱 Zero-MB Procedural Road, Grass & Shiny Glass Textures:**
   - Generates shared canvas textures in memory (< 200 KB total, 0 KB download): fine asphalt road grain, dappled lush meadow grass blades, and gleaming sky-reflective architectural glass windows!
4. **🚗 Hero `.glb` 3D Models Support (`GLTFLoader`):**
   - Open `admin.html` → **🌤️ World** → **🚗 Hero .glb 3D Models** to paste any lightweight `.glb` path or URL for the **Sheru Bhai Statue**, **Audi Hero Car**, or **Diamond Helicopter** (e.g. `./models/audi.glb`). Auto-scales, auto-centers, and falls back smoothly to the upgraded built-in 3D models if left blank!
5. **📱 NEW Follower Mobile Shops (`mobile_shop` 1-Plot & `mobile_showroom` 2-Plot):**
   - **1-Plot Mobile Shop (`mobile_shop`):** Giant 3D rooftop smartphone sculpture with glowing app screen & triple-lens camera, sky-reflective glass front with demo phones, and personalized `@username MOBILES • 5G PHONES • REPAIR` signboard.
   - **2-Plot Mega Mobile Showroom (`mobile_showroom`):** Rotating 3D titanium smartphone hologram + 5G rooftop mast, dual demo phone tables, accessories wall, `iPHONE • SAMSUNG • REDMI • 5G` neon board, `0% EMI` standee, and animated shoppers!
