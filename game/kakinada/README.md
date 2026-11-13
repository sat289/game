# ST Foods – Kakinada Open-World Driving Game (Phase 1)

## Phase 1: Optimized 3D city environment

This build uses the existing ST Foods Kakinada game as its base. Existing driving controls, restaurant pickup/delivery mission flow, Pushpa container scene, route data, landmark models, and supplied map files are retained.

### New in Phase 1

- Instanced rooftop water tanks on a selected subset of mapped buildings.
- Instanced rooftop solar-panel props on a selected subset of buildings.
- Instanced streetlights along primary and secondary mapped road corridors.
- Instanced street trees along selected secondary/local road corridors.
- Mobile-aware renderer pixel-ratio cap to reduce GPU load on phones while retaining higher detail on desktop.
- City dressing counts are printed in the browser developer console under `ST Games Phase 1 city dressing ready`.

### Existing map content retained

- 3,252 road features in the embedded Kakinada map dataset.
- 2,111 building polygons in the embedded game map dataset.
- 75 named landmarks and 6 flyover/bridge model paths.
- SRMT Mall landmark model and existing game mission/vehicle logic.

These are the counts in the embedded `KAKINADA_MAP_DATA` object. They should not be interpreted as a guarantee that every real-world building or road is represented perfectly.

## Files

- `index.html` – playable Three.js game and Phase 1 city dressing.
- `map.html` – existing map inspection page, preserved unchanged.
- `kakinada_map_data.js` – shared Kakinada map data, preserved unchanged.
- `kakinada_real_osm.geojson` – supplied OpenStreetMap-derived source data, preserved unchanged.

## Run

1. Extract the ZIP.
2. Open the folder with a local static web server (recommended) or host the files together on your website.
3. Open `index.html` in a modern browser with WebGL enabled.
4. For mobile, use a recent Android browser with hardware acceleration enabled. For PC, use a current Chrome, Edge, or Firefox browser.

Three.js is loaded from its existing CDN URL, so an internet connection is required unless you separately vendor that library.

## Performance notes

The new street furniture and rooftop props use `THREE.InstancedMesh` to reduce draw calls. Their quantities are intentionally capped. Mobile rendering uses a lower maximum pixel ratio than desktop. Actual frame rate depends on device GPU, browser, screen resolution, and thermal conditions.

## Validation

- All inline JavaScript blocks passed `node --check` syntax validation.
- The embedded map data parsed successfully and reported the counts above.
- A headless Chromium visual run could not be completed in the build environment because WebGL/EGL initialization failed; test on the target Android phone and PC before publishing.

## Accuracy note

The map data is OpenStreetMap-derived, not Google Street View. Road/building footprints and 3D dressing are game representations and are not a photorealistic or survey-grade 1:1 replica of Kakinada.
