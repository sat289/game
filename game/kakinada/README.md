# ST Foods Kakinada Driving Game — Road & Map System Upgrade

This build upgrades the road network in the existing Three.js driving game while keeping the supplied Kakinada OSM map data and the current gameplay systems.

## What changed

- **Connected junction surfaces:** added shared ground-level junction pads where multiple mapped road ends meet. Bridge-tagged geometry is excluded from these ground pads so the junction fill does not cover elevated bridge decks.
- **Flyover approach alignment:** each flyover endpoint is checked against the nearest mapped primary ground-road segment. Small gaps (1.5–30 metres) are closed by extending the flyover path to the projected road centreline. The existing ramp/elevation system then builds the approach continuously.
- **Road markings:** main roads now use broken yellow centre markings and thin white edge guides instead of one uninterrupted centre stripe.
- **Existing road classes retained:** primary, secondary, tertiary and local-road width/material classes remain in place, along with the supplied road polylines.
- **Existing flyovers retained:** Atchampeta ADB Road, Panaspadu, Sarpavaram–JNTUK, Bhanugudi ROB, Mootha Gopala Krishna Varadhi and Kalpana Bridge remain in the map data.

## Preserved

The update only changes the road-building section in `index.html`. Existing mission/order code, restaurant locations, Pushpa container delivery hubs, vehicle controls, UI controls, map landmarks, building data, and the separate `map.html` view are retained. The supplied `kakinada_map_data.js` and `kakinada_real_osm.geojson` are included unchanged.

## Files

- `index.html` — updated 3D driving game
- `map.html` — existing 2D map view, unchanged
- `kakinada_map_data.js` — supplied map data, unchanged
- `kakinada_real_osm.geojson` — supplied OSM export, unchanged
- `README.md` — this file

## Validation performed

- JavaScript syntax check passed for all inline scripts in `index.html` using Node.js.
- Confirmed the map data still contains 3,252 road features and six flyover paths.
- Confirmed key existing mission/order and control identifiers remain present in the updated game.
- ZIP archive listing and file sizes checked after packaging.

## Important testing note

A browser/WebGL visual test was not available in the earlier validation environment. Please test the ZIP locally on Android and PC, especially driving from ground road onto/off each flyover and turning through Atchampeta, Panaspadu, Sarpavaram, Nagamalli Thota, Bhanugudi and Beach Road junctions. The road geometry is based on the project’s supplied OpenStreetMap export and game-coordinate bridge paths; this is not a surveyed, centimetre-accurate road reconstruction.
