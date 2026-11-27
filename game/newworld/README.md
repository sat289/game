# Sheru Bhai City 3D (v46 — Complete Updated Edition)

Upload the entire **`follower-town/`** folder into `sat289/game/game/newworld/` (and optionally upload your **`villa-song.mp3`** into the same folder for automatic Villa proximity music).

## Complete Feature List Included in v46 (All 25 Files)
1. **🦁 Giant Towering Sheru Bhai Statue (Higher Than Metro):**
   - Monumental ~27.5-unit animated 3D Sheru Bhai Statue (`sheru-bhai-animated.glb` playing `BossSalute`) towering cleanly above both the `13.6` Blue Line and `19.6` Ameerpet Stacked Red Line Metro decks, plus live animated Sheru Bhai across all 6 city spots (Statue, Royal Island Mansion, Airport VIP Red Carpet, Diamond Car, Diamond Helicopter, Beach Lounge).
2. **🎬 Pro Reel Studio (`admin.html` → `🎬 9:16 Reel`):**
   - Instant Ultra-HD Boost on Reel Mode open (`boostReelUltraQuality(true)`: Ultra HD + Soft Sun Shadows + Neon Bloom + 2.5x DPR + 1.24 exposure).
   - 4 Cinematic Reel Camera Modes: **🦁 Statue Rise**, **🚇 Metro Chase**, **🌉 Bridge Flyby**, and **👑 Villa 360°**.
   - 4 Live Studio Editor Tools: **🎨 Color LUT Filters**, **🔭 Camera Lens FOV** (48° / 32° / 68°), **🐢 Cinematic Slow-Mo** (0.45x), and **🎬 Letterbox Bars**.
3. **🚇 Hyderabad Metro & Ameerpet 3-Level Stacked Interchange (10 Stations):**
   - Double-track viaducts centered on widened boulevards (`ROAD_WIDTH = 10.2`, `RING_ROAD_WIDTH = 13.0`) with **Ameerpet 3-Level Stacked Track-over-Track Interchange** (`Y = 13.6` Blue Line + `Y = 19.6` Red Line), 12 curved interchange ramps connecting all directions into the Outer Ring, covered blue dropping steps, combined 4-coach articulated trains, and automatic expansion as new houses are built.
4. **🦁🚗 Playable Sheru Bhai (`🦁 Play Sheru` — Car Drive + Free Roam + Metro Ride):**
   - True 1-finger **360° Orbit Rotate** + **2-finger Pinch Zoom (7.5–68)** while driving the VIP Car or walking on foot.
   - Solid building & ocean collision with smooth wall-sliding, smaller road-friendly building nameplates (`52%`), and full arched **RGB Sea Bridge** & **VIP Island Mansion** crossing.
5. **🚶‍♂️🛺🚗 Street Life Module (`world-streetlife-v43.js`):**
   - Metro station parking bays (autos & sedans), walking commuters around station entries, and mixed road traffic.
6. **👑 8-Plot Ultra-Premium Billionaire Villa (`world-villa-v40.js`) & All v37 Follower Landmarks:**
   - 3-story black-gold marble palace with live glass elevator, rooftop helipad, infinity pool, spinning supercar garage, balcony waterfall, fire-pit, RGB dance floor, orbiting drones, and automatic `./villa-song.mp3` playback on both camera drag and player entry.
   - Includes Swamy E.M. High School, Grand Function Hall, Mega D-Mart, Inorbit Mall, Stark Tower, LC Mart, Ayyappa Swamy Temple, Yamaha Showroom, Free Fire 3-Floor Office, Coastal Light House, Royal Bar & Beauty Parlour.
7. **⚡ 60fps Performance Engine (`mesh-batcher.js` + `wasm-perf.js`):**
   - Automatic static mesh batching (75%–85% draw-call reduction), incremental Firebase diff rendering, chunked initial load, WASM distance culling, and zero-disturbance clear-space landmark & inbox auto-build placement.
