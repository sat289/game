# ST GAMES • Car World (16:9 rear-camera prototype)

## Run
This project uses Three.js ES modules and must be served over HTTP (not opened as `file://`).

```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

## Included
- 16:9 landscape-first garage and driving HUD; fullscreen button attempts landscape orientation lock where supported.
- Third-person chase camera behind the vehicle (not cockpit view).
- Keyboard and touch controls: WASD / arrow keys, plus on-screen steering, brake and accelerator.
- 5 selectable environment presets: Mountain Pass, Coastal Highway, Desert Run, Forest Valley, Night City.
- 11 different vehicle entries across cars, bikes, buses and trucks. Each non-Agera entry has a distinct procedural shape and dimensions; they are not duplicate copies.
- User-uploaded Koenigsegg Agera FBX placed at `assets/models/koenigsegg-agera.fbx`, loaded with Three.js FBXLoader.
- Original Phaser curved-terrain source retained in `legacy-phaser/src` for reference.

## Model / asset provenance
- `assets/models/koenigsegg-agera.fbx` came from the user's uploaded `82-koenigsegg-agera.zip`. The upload contained FBX, OBJ and BLEND files; it did **not** contain a GLB.
- Other vehicles in this prototype are individually built procedural meshes, not falsely represented as downloaded branded 3D models. They are distinct placeholders pending licensed production models.
- Possible CC0 model sources for a later asset-import pass: Kenney Car Kit (https://kenney.nl/assets/car-kit), 3D Valley CC0 library (https://3dvalley.com/3d-models), Shuriken Studio vehicle GLBs (https://shuriken.studio/models/vehicles). Check each asset's individual license and preserve its attribution/texture files when importing.

## Important limitations
This is a browser prototype, not a finished realistic open-world racing game. The road and scenery are procedural, vehicle physics are arcade-style, and only the uploaded Agera is a true imported external 3D model. Online CC0 model links are documented above but their files are not bundled in this ZIP. A real production vehicle pack needs individual GLB downloads, license checks, wheel pivots, scale/orientation correction and performance testing.
