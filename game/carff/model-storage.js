// Shared 3D Model Storage Helper (LocalStorage + IndexedDB)
window.ModelStorage = (() => {
  const DB_NAME = 'STGames3DModelsDB';
  const STORE_NAME = 'models';

  function openDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }

  async function saveModelData(id, format, base64OrText) {
    try {
      if (base64OrText && base64OrText.length < 1800000) {
        localStorage.setItem('sthw_model_blob_' + id, JSON.stringify({ format, data: base64OrText }));
      }
    } catch (e) {}

    try {
      const db = await openDB();
      if (!db) return true;
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({ id, format, data: base64OrText, updatedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {}
    return true;
  }

  async function getModelData(id) {
    try {
      const raw = localStorage.getItem('sthw_model_blob_' + id);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    try {
      const db = await openDB();
      if (!db) return null;
      return await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  async function deleteModelData(id) {
    try { localStorage.removeItem('sthw_model_blob_' + id); } catch (e) {}
    try {
      const db = await openDB();
      if (!db) return;
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {}
  }

  return { saveModelData, getModelData, deleteModelData };
})();
