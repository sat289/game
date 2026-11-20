# ST GAMES — 3D Highway Racer (v5.0)

## What's New in v5.0
1. **Vehicles Grounded Directly on the Ramp**: Exact `THREE.Box3` grounding + calibrated camera pitch + soft contact shadow so every 3D car & bike sits flush on the glowing blue circular ramp in `homepage-bg.png`.
2. **Upload Removed from Game (Admin-Only)**: 3D vehicle uploads (`.glb`, `.gltf`, `.obj`) are strictly inside `admin.html`. Uploaded models are stored in `localStorage` + `IndexedDB` (via `model-storage.js`) and synced with Firebase so they appear immediately in the game garage & on the highway.
3. **Larger Gameplay Vehicles**: Cars and bikes are scaled up significantly in 3D highway gameplay with a closer backside chase camera.
4. **No Road Coins/Diamonds — Pure Distance + Near-Miss Scoring**: Removed road coin/diamond pickups. Score continuously rises with distance (`KM`) and awards combo bonuses (`+50` / `+100` × combo) whenever you pass closely alongside traffic vehicles.
5. **Professional Login Page**: Fullscreen Sign In / Create Account screen connected to your Firebase Realtime Database (`friendsgame-872f5`) with a **Continue as Guest** option.
