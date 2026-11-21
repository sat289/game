// ST Virtual World — Real Interactive Three.js 3D Layer
// Renders:
//  1) Player Houses (12 GLB variants v0..v11 + 4 trending procedural 3D house models)
//  2) Admin-placed Popular Landmarks (Temples, Lighthouses, Shopping Malls, Towers, Stadiums, Monuments)
// Preserves MapLibre's native WebGL viewport on high-DPI Android devices.

import { getDesignMeta, getLandmarkMeta } from './validation.js';

export function createThreeHouseLayer(map, getHousesFn, getPreviewFn, getLandmarksFn = () => [], glbUrl = './houses.glb') {
  let THREE = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  const prototypes = new Map();
  const houseMeshes = new Map();
  const landmarkMeshes = new Map();
  let previewMesh = null;
  let glbReady = false;
  let initStarted = false;

  async function initAssets(gl) {
    if (initStarted) return;
    initStarted = true;
    try {
      THREE = await import('../lib/three-bundle.js');
      camera = new THREE.Camera();
      scene = new THREE.Scene();

      scene.add(new THREE.HemisphereLight(0xffffff, 0x475569, 1.65));
      const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.75);
      keyLight.position.set(70, 150, 90);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xcceeff, 0.75);
      fillLight.position.set(-80, 90, -60);
      scene.add(fillLight);

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      renderer.autoClear = false;

      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
        pmrem.dispose();
      } catch {}

      try {
        const loader = new THREE.GLTFLoader();
        if (THREE.MeshoptDecoder) loader.setMeshoptDecoder(THREE.MeshoptDecoder);
        const gltf = await loader.loadAsync(glbUrl);
        gltf.scene.children.forEach((child) => {
          if (child.name) prototypes.set(child.name, child);
        });
        glbReady = prototypes.size > 0;
      } catch (glbErr) {
        console.warn('houses.glb load failed; using procedural 3D fallback:', glbErr);
        glbReady = false;
      }
      map.triggerRepaint();
    } catch (err) {
      console.warn('Three.js 3D layer failed to initialize:', err);
    }
  }

  function mat(color, roughness = 0.45, metalness = 0.12) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  function box(w, h, d, color, x, y, z, r = 0.45, m = 0.12) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, r, m));
    mesh.position.set(x, y, z);
    return mesh;
  }

  function cyl(rt, rb, h, seg, color, x, y, z, r = 0.4, m = 0.15) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color, r, m));
    mesh.position.set(x, y, z);
    return mesh;
  }

  function createProceduralModel(variant, accentHex) {
    const g = new THREE.Scene();

    if (variant === 'lm_temple') {
      // South Indian Gopuram Temple (tiered pyramid + golden kalasam)
      g.add(box(12, 2.2, 10, 0xfef3c7, 0, 1.1, 0));
      g.add(box(9.5, 2.6, 7.5, 0xf59e0b, 0, 3.5, 0));
      g.add(box(7.2, 2.4, 5.6, 0xd97706, 0, 6.0, 0));
      g.add(box(5.0, 2.2, 4.0, 0xf59e0b, 0, 8.3, 0));
      g.add(box(3.2, 1.8, 2.6, 0xfbbf24, 0, 10.3, 0));
      g.add(cyl(0.25, 0.9, 2.0, 8, 0xffd700, 0, 12.1, 0, 0.25, 0.6));
      return g;
    }

    if (variant === 'lm_lighthouse') {
      // Coastal Lighthouse (red/white striped tower + glowing lantern room)
      g.add(cyl(3.2, 4.0, 2.0, 12, 0x334155, 0, 1.0, 0));
      g.add(cyl(2.2, 2.8, 3.2, 12, 0xf8fafc, 0, 3.6, 0));
      g.add(cyl(1.8, 2.2, 3.2, 12, 0xef4444, 0, 6.8, 0));
      g.add(cyl(1.5, 1.8, 3.2, 12, 0xf8fafc, 0, 10.0, 0));
      g.add(cyl(1.3, 1.5, 2.4, 12, 0xef4444, 0, 12.8, 0));
      g.add(cyl(1.6, 1.6, 1.6, 12, 0xfef08a, 0, 14.8, 0, 0.1, 0.1));
      g.add(cyl(0.2, 1.9, 1.8, 12, 0x1e293b, 0, 16.5, 0));
      return g;
    }

    if (variant === 'lm_mall') {
      // Grand Shopping Mall (wide modern atrium + blue glass facade + roof crown)
      g.add(box(14, 5.5, 9, 0xe2e8f0, 0, 2.75, 0));
      g.add(box(12.8, 3.6, 9.3, 0x38bdf8, 0, 3.0, 0, 0.15, 0.5));
      g.add(box(9, 2.6, 6.5, 0x1e293b, 0, 6.8, 0));
      g.add(box(6.5, 1.2, 1.0, 0x00f5ff, 0, 8.6, 3.3, 0.2, 0.3));
      return g;
    }

    if (variant === 'lm_techpark' || variant === 'proc_tower') {
      // Luxury Glass Skyscraper / Tech Park
      g.add(box(8, 3.0, 8, 0x1e293b, 0, 1.5, 0));
      g.add(box(6.6, 11.0, 6.6, 0x0ea5e9, 0, 8.5, 0, 0.15, 0.6));
      g.add(box(5.0, 4.0, 5.0, 0x38bdf8, 0, 16.0, 0, 0.15, 0.6));
      g.add(cyl(0.15, 0.3, 3.2, 8, 0xe2e8f0, 0, 19.6, 0));
      return g;
    }

    if (variant === 'lm_stadium') {
      // Cricket Stadium (circular bowl + green pitch + floodlight towers)
      g.add(cyl(8.5, 7.2, 3.5, 20, 0xe2e8f0, 0, 1.75, 0));
      g.add(cyl(6.2, 6.2, 0.4, 20, 0x22c55e, 0, 3.55, 0));
      for (const [x, z] of [[6.5, 6.5], [-6.5, 6.5], [6.5, -6.5], [-6.5, -6.5]]) {
        g.add(cyl(0.25, 0.35, 8.5, 8, 0x94a3b8, x, 4.25, z));
        g.add(box(1.4, 0.8, 0.6, 0xfef08a, x, 8.7, z));
      }
      return g;
    }

    if (variant === 'lm_monument' || variant === 'proc_palace') {
      // Heritage Monument / Golden Palace (columns + central dome)
      g.add(box(11, 1.6, 11, 0xfef3c7, 0, 0.8, 0));
      g.add(box(8.5, 4.5, 8.5, 0xfde68a, 0, 3.85, 0));
      g.add(cyl(3.6, 4.0, 1.4, 16, 0xf59e0b, 0, 6.8, 0));
      const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(3.5, 2), mat(0xffd700, 0.25, 0.55));
      dome.position.set(0, 7.6, 0);
      g.add(dome);
      return g;
    }

    if (variant === 'lm_clocktower') {
      g.add(box(4.8, 2.5, 4.8, 0xd6d3d1, 0, 1.25, 0));
      g.add(box(3.6, 9.5, 3.6, 0xf5f5f4, 0, 7.25, 0));
      g.add(box(4.0, 2.2, 4.0, 0xfbbf24, 0, 12.6, 0));
      g.add(cyl(0.2, 2.6, 3.4, 4, 0x991b1b, 0, 15.4, 0));
      return g;
    }

    if (variant === 'lm_arch') {
      g.add(box(2.6, 8.5, 3.0, 0xfef3c7, -3.5, 4.25, 0));
      g.add(box(2.6, 8.5, 3.0, 0xfef3c7, 3.5, 4.25, 0));
      g.add(box(10.5, 2.6, 3.4, 0xf43f5e, 0, 9.4, 0));
      g.add(box(11.4, 0.9, 3.8, 0xfbbf24, 0, 11.1, 0));
      return g;
    }

    if (variant === 'proc_cyber') {
      g.add(box(9.0, 4.2, 8.0, 0x1e1b4b, 0, 2.1, 0));
      g.add(box(9.3, 0.4, 8.3, 0x00f5ff, 0, 4.3, 0, 0.1, 0.4));
      g.add(box(6.4, 3.4, 5.8, 0x312e81, 0, 6.2, 0));
      g.add(box(6.7, 0.4, 6.1, 0xc04dff, 0, 8.0, 0, 0.1, 0.4));
      return g;
    }

    if (variant === 'proc_resort') {
      g.add(box(10.5, 1.2, 8.5, 0xfef9c3, 0, 0.6, 0));
      g.add(box(7.0, 4.0, 5.5, 0xffffff, -1.2, 3.2, -0.8));
      g.add(box(3.4, 0.3, 4.5, 0x38bdf8, 3.2, 1.3, 1.2, 0.1, 0.3)); // pool
      const roof = cyl(0.5, 5.4, 2.6, 4, 0x0d9488, -1.2, 6.5, -0.8);
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      return g;
    }

    // Default procedural house fallback
    g.add(box(7, 5, 7, 0xf8fafc, 0, 2.5, 0));
    const roof = cyl(0.4, 5.8, 3.5, 4, accentHex || '#38d9ff', 0, 6.7, 0);
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    return g;
  }

  function cloneHouseVariant(designName) {
    const meta = getDesignMeta(designName);
    if (meta.kind === 'glb' && glbReady && prototypes.has(meta.variant)) {
      return prototypes.get(meta.variant).clone(true);
    }
    return createProceduralModel(meta.variant, meta.accent);
  }

  function cloneLandmarkVariant(modelName) {
    const meta = getLandmarkMeta(modelName);
    return createProceduralModel(meta.variant, meta.accent);
  }

  function computeScaleMeters(zoom) {
    if (zoom >= 16.5) return 7.5;
    if (zoom >= 15.0) return 10.5;
    if (zoom >= 13.5) return 15.0;
    if (zoom >= 11.5) return 24.0;
    return 36.0;
  }

  function buildTransformMatrix(lng, lat, scaleMeters) {
    const mc = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0);
    const s = mc.meterInMercatorCoordinateUnits() * scaleMeters;
    const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    return new THREE.Matrix4()
      .makeTranslation(mc.x, mc.y, mc.z)
      .scale(new THREE.Vector3(s, -s, s))
      .multiply(rotX);
  }

  return {
    id: 'st-3d-houses',
    type: 'custom',
    renderingMode: '3d',
    onAdd(_map, gl) { initAssets(gl); },
    render(_gl, matrix) {
      if (!THREE || !renderer || !scene) return;
      const zoom = map.getZoom();
      if (zoom < 9.0) return;

      const bounds = map.getBounds();
      const proj = new THREE.Matrix4().fromArray(matrix);
      const scaleMeters = computeScaleMeters(zoom);

      // 1. Render Player Houses
      const houses = getHousesFn() || [];
      const visibleHouseIds = new Set();
      for (const h of houses) {
        if (!Number.isFinite(h.latitude) || !Number.isFinite(h.longitude)) continue;
        if (!bounds.contains([h.longitude, h.latitude])) continue;
        visibleHouseIds.add(h.id);
        let mesh = houseMeshes.get(h.id);
        if (!mesh || mesh.userData.design !== h.houseDesign) {
          if (mesh) scene.remove(mesh);
          mesh = cloneHouseVariant(h.houseDesign);
          mesh.userData = { design: h.houseDesign };
          mesh.matrixAutoUpdate = false;
          scene.add(mesh);
          houseMeshes.set(h.id, mesh);
        }
        mesh.matrix.copy(buildTransformMatrix(h.longitude, h.latitude, scaleMeters));
      }
      for (const [id, mesh] of houseMeshes.entries()) {
        if (!visibleHouseIds.has(id)) {
          scene.remove(mesh);
          houseMeshes.delete(id);
        }
      }

      // 2. Render Admin Popular Places / Landmarks
      const landmarks = getLandmarksFn ? (getLandmarksFn() || []) : [];
      const visibleLandmarkIds = new Set();
      for (const lm of landmarks) {
        if (!Number.isFinite(lm.latitude) || !Number.isFinite(lm.longitude)) continue;
        if (!bounds.contains([lm.longitude, lm.latitude])) continue;
        visibleLandmarkIds.add(lm.id);
        let mesh = landmarkMeshes.get(lm.id);
        if (!mesh || mesh.userData.model !== lm.modelType) {
          if (mesh) scene.remove(mesh);
          mesh = cloneLandmarkVariant(lm.modelType);
          mesh.userData = { model: lm.modelType };
          mesh.matrixAutoUpdate = false;
          scene.add(mesh);
          landmarkMeshes.set(lm.id, mesh);
        }
        mesh.matrix.copy(buildTransformMatrix(lm.longitude, lm.latitude, scaleMeters * 1.25));
      }
      for (const [id, mesh] of landmarkMeshes.entries()) {
        if (!visibleLandmarkIds.has(id)) {
          scene.remove(mesh);
          landmarkMeshes.delete(id);
        }
      }

      // 3. Render Live Placement Preview (House or Landmark)
      const preview = getPreviewFn ? getPreviewFn() : null;
      if (preview && Number.isFinite(preview.lat) && Number.isFinite(preview.lng)) {
        const previewKey = preview.isLandmark ? `lm:${preview.modelType}` : `h:${preview.houseDesign}`;
        if (!previewMesh || previewMesh.userData.key !== previewKey) {
          if (previewMesh) scene.remove(previewMesh);
          previewMesh = preview.isLandmark
            ? cloneLandmarkVariant(preview.modelType)
            : cloneHouseVariant(preview.houseDesign);
          previewMesh.userData = { key: previewKey };
          previewMesh.matrixAutoUpdate = false;
          scene.add(previewMesh);
        }
        previewMesh.matrix.copy(buildTransformMatrix(preview.lng, preview.lat, scaleMeters * 1.2));
      } else if (previewMesh) {
        scene.remove(previewMesh);
        previewMesh = null;
      }

      camera.projectionMatrix = proj;
      renderer.resetState();
      renderer.render(scene, camera);
    }
  };
}
