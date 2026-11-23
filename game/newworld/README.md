# Follower Nagaram 3D (v14 — Boot & Mobile Loading Fix)

Upload the `follower-town/` folder into your `sat289/game/` GitHub repository.

## What Was Fixed in v14
1. **Removed `GLTFLoader` Static Import:** Eliminated the extra external Three.js loader dependency that could block `world-engine.js` from booting on mobile networks. The sculpted **White Marble Lion Sheru Bhai Statue** is now 100% self-contained and loads instantly.
2. **Switched CDN to `jsDelivr`:** Replaced `unpkg.com` with `cdn.jsdelivr.net` for much faster, more reliable Three.js loading in India.
3. **Cache-Busting (`?v=14`):** Added `?v=14` to all CSS and JS imports so mobile Chrome never mixes old cached files with new ones.
4. **Safe Viewport Init + Error Banner:** Added fallback width/height initialization (`window.innerWidth/innerHeight`) so the 3D canvas never initializes at `0x0`, plus a built-in error banner if anything ever fails.
