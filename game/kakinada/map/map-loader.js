
/* ==========================================
   ST FOODS - KAKINADA MAP DATA LOADER
   Loads 17 Overpass JSON data files
   Does not replace missions or vehicle controls
========================================== */

window.KAKINADA_MAP_DATA = {};

const KAKINADA_MAP_FILES = {
    roads: "road.js",
    buildings: "buildings.js",
    bridges: "bridges.js",
    tunnels: "tunnels.js",
    junctions: "junctions.js",
    restaurants: "restaurants.js",
    shops: "shops.js",
    water: "water.js",
    parks: "parks.js",
    trees: "trees.js",
    parking: "parking.js",
    schools: "schools.js",
    hospitals: "hospitals.js",
    transport: "transport.js",
    religious: "religious.js",
    government: "government.js",
    coastline: "coastline.js"
};

const KAKINADA_MAP_BASE =
    "./game/kakinada/map/";

async function loadKakinadaFile(name, filename) {

    const url = KAKINADA_MAP_BASE + filename;

    try {
        const response = await fetch(url, {
            cache: "default"
        });

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${filename}`
            );
        }

        const text = await response.text();

        // These files must contain raw Overpass JSON.
        const data = JSON.parse(text);

        if (!data || !Array.isArray(data.elements)) {
            throw new Error(
                "Invalid Overpass elements array"
            );
        }

        window.KAKINADA_MAP_DATA[name] = data;

        console.log(
            `Loaded ${name}: ${data.elements.length} elements`
        );

        return {
            name,
            success: true,
            count: data.elements.length
        };

    } catch (error) {

        console.error(
            `Failed to load ${filename}:`,
            error
        );

        return {
            name,
            success: false,
            count: 0,
            error: error.message
        };
    }
}

async function loadKakinadaMap() {

    console.log("Loading Kakinada map data...");

    const entries = Object.entries(KAKINADA_MAP_FILES);

    const results = await Promise.all(
        entries.map(([name, filename]) =>
            loadKakinadaFile(name, filename)
        )
    );

    const successful = results.filter(
        item => item.success
    );

    const failed = results.filter(
        item => !item.success
    );

    window.KAKINADA_MAP_READY = true;

    window.dispatchEvent(
        new CustomEvent("kakinada-map-loaded", {
            detail: {
                data: window.KAKINADA_MAP_DATA,
                results,
                successful,
                failed
            }
        })
    );

    console.log(
        `Kakinada map loaded: ${successful.length}/${entries.length} files`
    );

    if (failed.length) {
        console.warn(
            "Files that could not load:",
            failed.map(item => item.name)
        );
    }

    return window.KAKINADA_MAP_DATA;
}

// Start loading
loadKakinadaMap();
