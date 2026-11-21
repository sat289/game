// ST Virtual World — Admin Dashboard
// Strictly restricted to ADMIN_UID (8lcgTTcPxrOSAdyv2NTe2FwCUC93).

import { firebaseConfig, ADMIN_UID } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, collection, getDocs, doc, updateDoc, runTransaction, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

import {
  HOUSE_DESIGNS, validateInstagramUsername, isWithinAndhraBounds,
  escapeHtml, formatCoord, formatTimestamp, sanitizePlaceType
} from '../js/validation.js';
import { initThemeSwitcher } from '../js/theme.js';

const $ = (s) => document.querySelector(s);
let auth = null, db = null, adminUser = null;
let housesCache = [], requestsCache = [];

initThemeSwitcher($('#adminThemeSelect'));

// Populate design dropdown & districts
$('#mDesign').innerHTML = HOUSE_DESIGNS.map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.id)}</option>`).join('');
fetch('../data/andhra.json')
  .then((r) => r.json())
  .then((d) => {
    $('#mDistrict').innerHTML = d.districts.map((x) => `<option value="${escapeHtml(x.d)}">${escapeHtml(x.d)}</option>`).join('');
  })
  .catch(() => {});

const app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getFirestore(app);

onAuthStateChanged(auth, (u) => {
  if (u && u.uid === ADMIN_UID) {
    adminUser = u;
    $('#loginBox').hidden = true;
    $('#dashboard').hidden = false;
    $('#loginStatus').textContent = '';
    loadAllData();
  } else {
    if (u && u.uid !== ADMIN_UID) {
      $('#loginStatus').textContent = 'Access denied: this account is not the authorized ST Virtual World Admin UID.';
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
    const [housesSnap, usernamesSnap, playersSnap, requestsSnap] = await Promise.all([
      getDocs(collection(db, 'houses')),
      getDocs(collection(db, 'usernames')),
      getDocs(collection(db, 'players')),
      getDocs(collection(db, 'houseRequests'))
    ]);

    housesCache = housesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    requestsCache = requestsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    $('#statHouses').textContent = String(housesCache.length);
    $('#statUsernames').textContent = String(usernamesSnap.size);
    $('#statPlayers').textContent = String(playersSnap.size);
    $('#statRequests').textContent = String(requestsCache.filter((r) => r.status === 'pending').length);

    renderHouses();
    renderRequests();
  } catch (err) {
    alert('Failed to load admin data: ' + err.message);
  }
}

function renderHouses() {
  const q = $('#houseSearchInput').value.trim().toLowerCase();
  const list = $('#housesList');
  const filtered = housesCache.filter((h) => {
    if (!q) return true;
    return [h.normalizedUsername, h.displayUsername, h.placeName, h.district, h.houseDesign]
      .some((v) => String(v || '').toLowerCase().includes(q));
  });

  if (!filtered.length) {
    list.innerHTML = '<p class="muted">No houses found.</p>';
    return;
  }

  list.innerHTML = filtered.map((h) => `
    <article class="item-card">
      <h3>@${escapeHtml(h.displayUsername || h.normalizedUsername)} <span class="badge">${escapeHtml(h.houseDesign)}</span></h3>
      <p><b>${escapeHtml(h.placeName)}</b> (${escapeHtml(h.placeType || 'town')}), ${escapeHtml(h.district)} · Coords: ${formatCoord(h.latitude)}, ${formatCoord(h.longitude)}</p>
      <p>Created: ${escapeHtml(formatTimestamp(h.createdAt))} · UID: <code>${escapeHtml(h.uid || h.id)}</code></p>
      <div class="actions">
        <button class="secondary sm" data-edit-house="${escapeHtml(h.id)}">Edit Position / Design</button>
        <button class="danger-btn sm" data-del-house="${escapeHtml(h.id)}" data-del-user="${escapeHtml(h.normalizedUsername)}">Delete House</button>
      </div>
    </article>
  `).join('');

  list.querySelectorAll('[data-edit-house]').forEach((btn) => {
    btn.onclick = () => editHousePrompt(btn.dataset.editHouse);
  });
  list.querySelectorAll('[data-del-house]').forEach((btn) => {
    btn.onclick = () => deleteHouseAtomic(btn.dataset.delHouse, btn.dataset.delUser);
  });
}

async function editHousePrompt(houseId) {
  const h = housesCache.find((x) => x.id === houseId);
  if (!h) return;
  const newLat = prompt('Enter new Latitude (12.5 to 19.5):', String(h.latitude));
  if (newLat === null) return;
  const newLng = prompt('Enter new Longitude (76.5 to 85.0):', String(h.longitude));
  if (newLng === null) return;
  const newDesign = prompt(`Enter House Design (${HOUSE_DESIGNS.map((d) => d.id).join(', ')}):`, h.houseDesign);
  if (newDesign === null) return;

  if (!isWithinAndhraBounds(Number(newLat), Number(newLng))) {
    alert('Coordinates must be within Andhra Pradesh bounds.');
    return;
  }
  try {
    await updateDoc(doc(db, 'houses', houseId), {
      latitude: Number(Number(newLat).toFixed(6)),
      longitude: Number(Number(newLng).toFixed(6)),
      houseDesign: newDesign.trim() || h.houseDesign,
      updatedAt: serverTimestamp()
    });
    alert('House updated.');
    loadAllData();
  } catch (err) {
    alert('Update failed: ' + err.message);
  }
}

async function deleteHouseAtomic(houseId, normalizedUsername) {
  if (!confirm(`Delete house @${normalizedUsername} and release its username claim? This cannot be undone.`)) return;
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
    alert('House deleted and username claim released.');
    loadAllData();
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
}

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
      <p>Submitted: ${escapeHtml(formatTimestamp(r.createdAt))}</p>
      <div class="actions">
        <button class="primary sm" data-resolve-req="${escapeHtml(r.id)}" data-status="resolved">Mark Resolved</button>
        <button class="danger-btn sm" data-resolve-req="${escapeHtml(r.id)}" data-status="rejected">Reject</button>
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
