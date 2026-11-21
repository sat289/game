// ST Virtual World — Admin Studio
// Restricted to ADMIN_UID (8lcgTTcPxrOSAdyv2NTe2FwCUC93).
// Features: Live 3D Map Preview, Username Search & Full Address/Design Editor,
// Admin-only Popular Places (Temples, Lighthouses, Malls, etc.), Manual Add, CSV Export.

import { firebaseConfig, ADMIN_UID } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

import {
  HOUSE_DESIGNS, LANDMARK_MODELS, getLandmarkMeta,
  validateInstagramUsername, isWithinAndhraBounds, clampToAndhraBounds,
  escapeHtml, formatCoord, formatTimestamp, sanitizePlaceType
} from '../js/validation.js';
import { initThemeSwitcher } from '../js/theme.js';
import { createThreeHouseLayer } from '../js/three-houses.js';

const $ = (s) => document.querySelector(s);
let auth = null, db = null, adminUser = null;
let housesCache = [], landmarksCache = [], requestsCache = [];
let editingHouseId = null;
let activeTab = 'houses';

// Live 3D Map Preview state
let adminMap = null;
let previewMarker = null;
let previewState = null; // { lat, lng, isLandmark, houseDesign, modelType }

initThemeSwitcher($('#adminThemeSelect'));

// Populate model selects
const houseDesignOpts = HOUSE_DESIGNS.map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.id)}</option>`).join('');
$('#mDesign').innerHTML = houseDesignOpts;
$('#eDesign').innerHTML = houseDesignOpts;
$('#lmModel').innerHTML = LANDMARK_MODELS.map((m) => `<option value="${escapeHtml(m.id)}">${m.icon} ${escapeHtml(m.id)}</option>`).join('');

fetch('../data/andhra.json')
  .then((r) => r.json())
  .then((d) => {
    const distOpts = d.districts.map((x) => `<option value="${escapeHtml(x.d)}">${escapeHtml(x.d)}</option>`).join('');
    $('#mDistrict').innerHTML = distOpts;
    $('#eDistrict').innerHTML = distOpts;
    $('#lmDistrict').innerHTML = distOpts;
  })
  .catch(() => {});

// Tab switching
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.onclick = () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-pane').forEach((p) => { p.hidden = p.id !== `tab-${activeTab}`; });
  };
});

function initAdminMap() {
  if (adminMap) {
    adminMap.resize();
    return;
  }
  adminMap = new maplibregl.Map({
    container: 'adminMap',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [80.648, 16.506],
    zoom: 7.0,
    pitch: 55,
    bearing: -10,
    maxPitch: 65
  });
  adminMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

  adminMap.on('load', () => {
    adminMap.resize();
    try {
      const layer = createThreeHouseLayer(
        adminMap,
        () => housesCache,
        () => previewState,
        () => landmarksCache,
        '../houses.glb'
      );
      adminMap.addLayer(layer);
    } catch (e) {
      console.warn('Admin 3D layer warning:', e);
    }
  });

  adminMap.on('click', (e) => {
    const c = clampToAndhraBounds(e.lngLat.lat, e.lngLat.lng);
    applyPickedCoordsToActiveForm(c.lat, c.lng);
  });
}

function setPreviewOnMap({ lat, lng, isLandmark = false, houseDesign = HOUSE_DESIGNS[0].id, modelType = LANDMARK_MODELS[0].id, fly = true }) {
  if (!adminMap) initAdminMap();
  const c = clampToAndhraBounds(lat, lng);
  previewState = { lat: c.lat, lng: c.lng, isLandmark, houseDesign, modelType };

  if (previewMarker) previewMarker.remove();
  const el = document.createElement('div');
  el.className = 'placement-pin';
  el.innerHTML = isLandmark ? `<span>${getLandmarkMeta(modelType).icon}</span>` : '<span>🏠</span>';
  previewMarker = new maplibregl.Marker({ element: el, draggable: true, anchor: 'bottom' })
    .setLngLat([c.lng, c.lat])
    .addTo(adminMap);

  previewMarker.on('dragend', () => {
    const ll = previewMarker.getLngLat();
    const clamped = clampToAndhraBounds(ll.lat, ll.lng);
    applyPickedCoordsToActiveForm(clamped.lat, clamped.lng, false);
  });

  $('#previewHud').textContent = `Preview (${isLandmark ? modelType : houseDesign}): ${formatCoord(c.lat)}, ${formatCoord(c.lng)}`;
  if (fly) {
    adminMap.flyTo({ center: [c.lng, c.lat], zoom: 15.8, pitch: 60, duration: 1000 });
  }
  adminMap.triggerRepaint();
}

function applyPickedCoordsToActiveForm(lat, lng, fly = false) {
  const fLat = Number(lat).toFixed(5);
  const fLng = Number(lng).toFixed(5);
  if (activeTab === 'houses' && !$('#houseEditorBox').hidden) {
    $('#eLat').value = fLat;
    $('#eLng').value = fLng;
    setPreviewOnMap({ lat, lng, isLandmark: false, houseDesign: $('#eDesign').value, fly });
  } else if (activeTab === 'landmarks') {
    $('#lmLat').value = fLat;
    $('#lmLng').value = fLng;
    setPreviewOnMap({ lat, lng, isLandmark: true, modelType: $('#lmModel').value, fly });
  } else if (activeTab === 'manual') {
    $('#mLat').value = fLat;
    $('#mLng').value = fLng;
    setPreviewOnMap({ lat, lng, isLandmark: false, houseDesign: $('#mDesign').value, fly });
  } else {
    setPreviewOnMap({ lat, lng, isLandmark: false, houseDesign: HOUSE_DESIGNS[0].id, fly });
  }
}

$('#clearPreviewBtn').onclick = () => {
  previewState = null;
  if (previewMarker) { previewMarker.remove(); previewMarker = null; }
  $('#previewHud').textContent = 'Preview Pin: Tap map to pick coordinates';
  if (adminMap) adminMap.triggerRepaint();
};

// Firebase Init
const app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getFirestore(app);

onAuthStateChanged(auth, (u) => {
  if (u && u.uid === ADMIN_UID) {
    adminUser = u;
    $('#loginBox').hidden = true;
    $('#dashboard').hidden = false;
    $('#loginStatus').textContent = '';
    setTimeout(initAdminMap, 100);
    loadAllData();
  } else {
    if (u && u.uid !== ADMIN_UID) {
      $('#loginStatus').textContent = 'Access denied: this account is not the authorized Admin UID.';
      $('#loginStatus').className = 'status err';
      signOut(auth);
    }
    adminUser = null;
    $('#loginBox').hidden = false;
    $('#dashboard').hidden = true;
  }
});

$('#loginBtn').onclick = async () => {
  $('#loginStatus').textContent = 'Signing in...';
  $('#loginStatus').className = 'status';
  try {
    await signInWithEmailAndPassword(auth, $('#email').value.trim(), $('#password').value);
  } catch (err) {
    $('#loginStatus').textContent = err.message;
    $('#loginStatus').className = 'status err';
  }
};

$('#logoutBtn').onclick = () => signOut(auth);
$('#refreshAllBtn').onclick = loadAllData;
$('#houseSearchInput').addEventListener('input', renderHouses);

async function loadAllData() {
  if (!adminUser || adminUser.uid !== ADMIN_UID) return;
  try {
    const [housesSnap, landmarksSnap, usernamesSnap, playersSnap, requestsSnap] = await Promise.all([
      getDocs(collection(db, 'houses')),
      getDocs(collection(db, 'landmarks')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'usernames')),
      getDocs(collection(db, 'players')),
      getDocs(collection(db, 'houseRequests'))
    ]);

    housesCache = housesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    landmarksCache = landmarksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    requestsCache = requestsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    $('#statHouses').textContent = String(housesCache.length);
    $('#statLandmarks').textContent = String(landmarksCache.length);
    $('#statUsernames').textContent = String(usernamesSnap.size);
    $('#statPlayers').textContent = String(playersSnap.size);
    $('#statRequests').textContent = String(requestsCache.filter((r) => r.status === 'pending').length);

    renderHouses();
    renderLandmarks();
    renderRequests();
    if (adminMap) adminMap.triggerRepaint();
  } catch (err) {
    alert('Failed to load admin data: ' + err.message);
  }
}

// TAB 1: Houses Search & Inline Editor
function renderHouses() {
  const q = $('#houseSearchInput').value.trim().replace(/^@+/, '').toLowerCase();
  const list = $('#housesList');
  const filtered = housesCache.filter((h) => {
    if (!q) return true;
    return [h.normalizedUsername, h.displayUsername, h.placeName, h.district, h.houseDesign]
      .some((v) => String(v || '').toLowerCase().includes(q));
  });

  if (!filtered.length) {
    list.innerHTML = '<p class="muted">No matching player houses found.</p>';
    return;
  }

  list.innerHTML = filtered.map((h) => `
    <article class="item-card">
      <h3>@${escapeHtml(h.displayUsername || h.normalizedUsername)} <span class="badge">${escapeHtml(h.houseDesign)}</span></h3>
      <p><b>${escapeHtml(h.placeName)}</b> (${escapeHtml(h.placeType || 'town')}), ${escapeHtml(h.district)} · ${formatCoord(h.latitude)}, ${formatCoord(h.longitude)}</p>
      <p>Created: ${escapeHtml(formatTimestamp(h.createdAt))} · UID: <code>${escapeHtml(h.uid || h.id)}</code></p>
      <div class="actions">
        <button class="primary sm" data-edit-house="${escapeHtml(h.id)}" type="button">Edit Address &amp; 3D Model</button>
        <button class="secondary sm" data-view-house="${escapeHtml(h.id)}" type="button">Preview on Map</button>
        <button class="danger-btn sm" data-del-house="${escapeHtml(h.id)}" data-del-user="${escapeHtml(h.normalizedUsername)}" type="button">Delete</button>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-edit-house]').forEach((btn) => {
    btn.onclick = () => openHouseEditor(btn.dataset.editHouse);
  });
  list.querySelectorAll('[data-view-house]').forEach((btn) => {
    btn.onclick = () => {
      const h = housesCache.find((x) => x.id === btn.dataset.viewHouse);
      if (h) setPreviewOnMap({ lat: h.latitude, lng: h.longitude, isLandmark: false, houseDesign: h.houseDesign, fly: true });
    };
  });
  list.querySelectorAll('[data-del-house]').forEach((btn) => {
    btn.onclick = () => deleteHouseAtomic(btn.dataset.delHouse, btn.dataset.delUser);
  });
}

function openHouseEditor(houseId) {
  const h = housesCache.find((x) => x.id === houseId);
  if (!h) return;
  editingHouseId = houseId;
  $('#editTargetUser').textContent = '@' + (h.displayUsername || h.normalizedUsername);
  $('#ePlace').value = h.placeName || '';
  $('#eDistrict').value = h.district || '';
  $('#ePlaceType').value = h.placeType || 'town';
  $('#eDesign').value = h.houseDesign || HOUSE_DESIGNS[0].id;
  $('#eLat').value = Number(h.latitude).toFixed(5);
  $('#eLng').value = Number(h.longitude).toFixed(5);
  $('#editHouseStatus').textContent = '';
  $('#houseEditorBox').hidden = false;
  setPreviewOnMap({ lat: h.latitude, lng: h.longitude, isLandmark: false, houseDesign: h.houseDesign, fly: true });
}

$('#cancelEditHouseBtn').onclick = () => {
  editingHouseId = null;
  $('#houseEditorBox').hidden = true;
};

$('#previewEditBtn').onclick = () => {
  setPreviewOnMap({
    lat: Number($('#eLat').value),
    lng: Number($('#eLng').value),
    isLandmark: false,
    houseDesign: $('#eDesign').value,
    fly: true
  });
};

$('#saveEditHouseBtn').onclick = async () => {
  if (!editingHouseId) return;
  const statusEl = $('#editHouseStatus');
  const placeName = $('#ePlace').value.trim();
  const district = $('#eDistrict').value;
  const placeType = sanitizePlaceType($('#ePlaceType').value);
  const houseDesign = $('#eDesign').value;
  const lat = Number($('#eLat').value);
  const lng = Number($('#eLng').value);

  if (!placeName || !isWithinAndhraBounds(lat, lng)) {
    statusEl.textContent = 'Enter a valid place name and Andhra Pradesh coordinates.';
    statusEl.className = 'status err';
    return;
  }
  statusEl.textContent = 'Saving...';
  statusEl.className = 'status';
  try {
    await updateDoc(doc(db, 'houses', editingHouseId), {
      placeName,
      district,
      placeType,
      houseDesign,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      updatedAt: serverTimestamp()
    });
    statusEl.textContent = 'Player house updated!';
    statusEl.className = 'status ok';
    await loadAllData();
  } catch (err) {
    statusEl.textContent = 'Update failed: ' + err.message;
    statusEl.className = 'status err';
  }
};

async function deleteHouseAtomic(houseId, normalizedUsername) {
  if (!confirm(`Delete house @${normalizedUsername} and release its username claim?`)) return;
  try {
    await runTransaction(db, async (tx) => {
      const hRef = doc(db, 'houses', houseId);
      const uRef = doc(db, 'usernames', normalizedUsername);
      const pRef = doc(db, 'players', houseId);
      const [hSnap, uSnap, pSnap] = await Promise.all([tx.get(hRef), tx.get(uRef), tx.get(pRef)]);
      if (hSnap.exists()) tx.delete(hRef);
      if (uSnap.exists() && uSnap.data().houseId === houseId) tx.delete(uRef);
      if (pSnap.exists()) tx.update(pRef, { hasHouse: false, normalizedUsername: '', updatedAt: serverTimestamp() });
    });
    if (editingHouseId === houseId) {
      editingHouseId = null;
      $('#houseEditorBox').hidden = true;
    }
    loadAllData();
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
}

// TAB 2: Popular Places / Landmarks (Admin Only)
$('#previewLandmarkBtn').onclick = () => {
  setPreviewOnMap({
    lat: Number($('#lmLat').value),
    lng: Number($('#lmLng').value),
    isLandmark: true,
    modelType: $('#lmModel').value,
    fly: true
  });
};

$('#addLandmarkBtn').onclick = async () => {
  const statusEl = $('#landmarkStatus');
  const name = $('#lmName').value.trim();
  const modelType = $('#lmModel').value;
  const district = $('#lmDistrict').value;
  const description = $('#lmDesc').value.trim();
  const lat = Number($('#lmLat').value);
  const lng = Number($('#lmLng').value);

  if (!name || !isWithinAndhraBounds(lat, lng)) {
    statusEl.textContent = 'Enter a landmark name and valid Andhra Pradesh coordinates.';
    statusEl.className = 'status err';
    return;
  }
  statusEl.textContent = 'Adding popular landmark...';
  statusEl.className = 'status';
  try {
    await addDoc(collection(db, 'landmarks'), {
      name,
      modelType,
      category: getLandmarkMeta(modelType).category,
      district,
      description,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      createdBy: adminUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    statusEl.textContent = `Added "${name}" (${modelType}) to the 3D map!`;
    statusEl.className = 'status ok';
    $('#lmName').value = '';
    $('#lmDesc').value = '';
    loadAllData();
  } catch (err) {
    statusEl.textContent = 'Failed: ' + err.message;
    statusEl.className = 'status err';
  }
};

function renderLandmarks() {
  const list = $('#landmarksList');
  if (!landmarksCache.length) {
    list.innerHTML = '<p class="muted">No popular places added yet. Add Temples, Lighthouses, or Malls above.</p>';
    return;
  }
  list.innerHTML = landmarksCache.map((lm) => {
    const meta = getLandmarkMeta(lm.modelType);
    return `
      <article class="item-card">
        <h3>${meta.icon} ${escapeHtml(lm.name)} <span class="badge">${escapeHtml(lm.modelType)}</span></h3>
        <p>${escapeHtml(lm.district || 'Andhra Pradesh')} · ${formatCoord(lm.latitude)}, ${formatCoord(lm.longitude)}</p>
        ${lm.description ? `<p>${escapeHtml(lm.description)}</p>` : ''}
        <div class="actions">
          <button class="secondary sm" data-view-lm="${escapeHtml(lm.id)}" type="button">Preview on 3D Map</button>
          <button class="danger-btn sm" data-del-lm="${escapeHtml(lm.id)}" type="button">Delete Landmark</button>
        </div>
      </article>
    `;
  }).join('');

  list.querySelectorAll('[data-view-lm]').forEach((btn) => {
    btn.onclick = () => {
      const lm = landmarksCache.find((x) => x.id === btn.dataset.viewLm);
      if (lm) setPreviewOnMap({ lat: lm.latitude, lng: lm.longitude, isLandmark: true, modelType: lm.modelType, fly: true });
    };
  });
  list.querySelectorAll('[data-del-lm]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Delete this popular place from the map?')) return;
      try {
        await deleteDoc(doc(db, 'landmarks', btn.dataset.delLm));
        loadAllData();
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    };
  });
}

// TAB 3: Add Manual House
$('#previewManualBtn').onclick = () => {
  setPreviewOnMap({
    lat: Number($('#mLat').value),
    lng: Number($('#mLng').value),
    isLandmark: false,
    houseDesign: $('#mDesign').value,
    fly: true
  });
};

$('#addManualBtn').onclick = async () => {
  const statusEl = $('#manualStatus');
  const v = validateInstagramUsername($('#mUser').value);
  const district = $('#mDistrict').value;
  const placeName = $('#mPlace').value.trim();
  const placeType = sanitizePlaceType($('#mPlaceType').value);
  const lat = Number($('#mLat').value);
  const lng = Number($('#mLng').value);
  const houseDesign = $('#mDesign').value;

  if (!v.valid) { statusEl.textContent = v.error; statusEl.className = 'status err'; return; }
  if (!placeName || !isWithinAndhraBounds(lat, lng)) {
    statusEl.textContent = 'Enter a valid place name and Andhra Pradesh coordinates.';
    statusEl.className = 'status err';
    return;
  }

  statusEl.textContent = 'Creating house...';
  statusEl.className = 'status';
  try {
    const houseId = 'manual_' + v.normalized.replace(/[^a-z0-9_-]/g, '_');
    await runTransaction(db, async (tx) => {
      const uRef = doc(db, 'usernames', v.normalized);
      const hRef = doc(db, 'houses', houseId);
      const [uSnap, hSnap] = await Promise.all([tx.get(uRef), tx.get(hRef)]);
      if (uSnap.exists()) throw new Error('Username already taken in ST Virtual World.');
      if (hSnap.exists()) throw new Error('A manual house with this ID already exists.');
      const now = serverTimestamp();
      tx.set(uRef, { uid: houseId, normalizedUsername: v.normalized, displayUsername: v.display, houseId, createdAt: now, updatedAt: now });
      tx.set(hRef, {
        uid: houseId, normalizedUsername: v.normalized, displayUsername: v.display,
        placeName, district, placeType, latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)),
        houseDesign, createdAt: now, updatedAt: now
      });
    });
    statusEl.textContent = `House @${v.display} added!`;
    statusEl.className = 'status ok';
    $('#mUser').value = '';
    $('#mPlace').value = '';
    loadAllData();
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = 'status err';
  }
};

// TAB 4: Second-House Requests
function renderRequests() {
  const list = $('#requestsList');
  const pending = requestsCache.filter((r) => r.status === 'pending');
  if (!pending.length) {
    list.innerHTML = '<p class="muted">No pending second-house requests.</p>';
    return;
  }
  list.innerHTML = pending.map((r) => `
    <article class="item-card">
      <h3>@${escapeHtml(r.requestedDisplayUsername || r.requestedNormalizedUsername)} <span class="badge">${escapeHtml(r.type || 'second-house-attempt')}</span></h3>
      <p>Existing house: @${escapeHtml(r.existingUsername || 'unknown')} (UID: <code>${escapeHtml(r.uid)}</code>)</p>
      <p>Requested: ${escapeHtml(r.houseDesign)} in ${escapeHtml(r.placeName)}, ${escapeHtml(r.district)} (${formatCoord(r.latitude)}, ${formatCoord(r.longitude)})</p>
      <div class="actions">
        <button class="primary sm" data-resolve-req="${escapeHtml(r.id)}" data-status="resolved" type="button">Mark Resolved</button>
        <button class="danger-btn sm" data-resolve-req="${escapeHtml(r.id)}" data-status="rejected" type="button">Reject</button>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-resolve-req]').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm(`Mark this request as ${btn.dataset.status}?`)) return;
      try {
        await updateDoc(doc(db, 'houseRequests', btn.dataset.resolveReq), {
          status: btn.dataset.status,
          reviewedBy: adminUser.uid,
          reviewedAt: serverTimestamp()
        });
        loadAllData();
      } catch (err) {
        alert('Action failed: ' + err.message);
      }
    };
  });
}

// CSV Export
$('#exportCsvBtn').onclick = () => {
  if (!housesCache.length) { alert('No houses to export.'); return; }
  const headers = ['id', 'uid', 'displayUsername', 'normalizedUsername', 'placeName', 'placeType', 'district', 'latitude', 'longitude', 'houseDesign', 'createdAt'];
  const escCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = [headers.join(',')];
  for (const h of housesCache) {
    rows.push([
      h.id, h.uid, h.displayUsername, h.normalizedUsername, h.placeName, h.placeType,
      h.district, h.latitude, h.longitude, h.houseDesign, formatTimestamp(h.createdAt)
    ].map(escCsv).join(','));
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `st-virtual-world-houses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};
