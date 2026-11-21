# ST Virtual World (ST GAMES)

Interactive 3D virtual house world across Andhra Pradesh, deployed at `https://stgames.online/game/stworld/` with a separate admin dashboard at `https://stgames.online/game/stworld/admin/`.

## Highlights
- **Zero Player Login/Signup Screen:** Background Firebase Anonymous Authentication (`signInAnonymously`).
- **Atomic Instagram-Style Username Claims:** Validates syntax, normalizes to lowercase, and reserves `usernames/{normalizedUsername}` + `houses/{uid}` together inside a Firestore transaction.
- **Andhra Pradesh Location Search:** OpenStreetMap Nominatim + normalized local index (`data/andhra.json`) supporting villages, towns, cities, and optional District → Town/City → Village filtering.
- **Interactive 3D Houses:** Real Three.js + `houses.glb` (12 variants `v0`–`v11`) with Meshopt decoding, mobile LOD, and procedural 3D fallback.
- **4 ST GAMES Themes:** Classic Blue, Royal Gold, Deep Black, Neon Cyber (synced via `localStorage`).
- **Admin Dashboard:** Restricted to Firebase Admin UID `8lcgTTcPxrOSAdyv2NTe2FwCUC93` in both UI and `firestore.rules`.

See [SETUP.md](SETUP.md) for Firebase Console steps, GitHub Pages deployment, and the testing checklist.
