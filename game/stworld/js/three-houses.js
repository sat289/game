// ST Virtual World — Real Interactive Three.js + houses.glb 3D Map Layer
import { getDesignMeta } from './validation.js';

export function createThreeHouseLayer(map, getHousesFn, getPreviewFn) {
  let THREE = null;
  let renderer = null, scene = null, camera = null;
  const prototypes = new Map();
  const houseMeshes = new Map();
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

      scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.35));
      const dir = new THREE.DirectionalLight(0xffffff, 1.5);
      dir.position.set(60, 130, 80);
      scene.add(dir);

      renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
        pmrem.dispose();
      } catch {}

      try {
        const loader = new THREE.GLTFLoader();
        if (THREE.MeshoptDecoder) loader.setMeshoptDecoder(THREE.MeshoptDecoder);
        const gltf = await loader.loadAsync('./houses.glb');
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

  function createFallbackHouse(accentHex) {
    const group = new THREE.Scene();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(7, 5, 7),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55, metalness: 0.1 })
    );
    base.position.y = 2.5;
    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 5.6, 3.2, 4),
      new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.4, metalness: 0.15 })
    );
    roof.position.y = 6.5;
    roof.rotation.y = Math.PI / 4;
    group.add(base, roof);
    return group;
  }

  function cloneVariant(designName) {
    const meta = getDesignMeta(designName);
    if (glbReady && prototypes.has(meta.variant)) return prototypes.get(meta.variant).clone(true);
    return createFallbackHouse(meta.accent);
  }

  function buildTransformMatrix(lng, lat, scaleMeters = 5.0) {
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
      if (zoom < 9.5) return;

      const bounds = map.getBounds();
      const proj = new THREE.Matrix4().fromArray(matrix);
      const houses = getHousesFn() || [];
      const visibleIds = new Set();
      const scaleMeters = zoom > 14 ? 4.2 : 6.2;

      for (const h of houses) {
        if (!Number.isFinite(h.latitude) || !Number.isFinite(h.longitude)) continue;
        if (!bounds.contains([h.longitude, h.latitude])) continue;
        visibleIds.add(h.id);
        let mesh = houseMeshes.get(h.id);
        if (!mesh || mesh.userData.design !== h.houseDesign) {
          if (mesh) scene.remove(mesh);
          mesh = cloneVariant(h.houseDesign);
          mesh.userData = { design: h.houseDesign };
          mesh.matrixAutoUpdate = false;
          scene.add(mesh);
          houseMeshes.set(h.id, mesh);
        }
        mesh.matrix.copy(buildTransformMatrix(h.longitude, h.latitude, scaleMeters));
      }

      for (const [id, mesh] of houseMeshes.entries()) {
        if (!visibleIds.has(id)) {
          scene.remove(mesh);
          houseMeshes.delete(id);
        }
      }

      const preview = getPreviewFn ? getPreviewFn() : null;
      if (preview && Number.isFinite(preview.lat) && Number.isFinite(preview.lng)) {
        if (!previewMesh || previewMesh.userData.design !== preview.houseDesign) {
          if (previewMesh) scene.remove(previewMesh);
          previewMesh = cloneVariant(preview.houseDesign);
          previewMesh.userData = { design: preview.houseDesign };
          previewMesh.matrixAutoUpdate = false;
          scene.add(previewMesh);
        }
        previewMesh.matrix.copy(buildTransformMatrix(preview.lng, preview.lat, scaleMeters * 1.15));
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
