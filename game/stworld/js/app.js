// ST Virtual World — Player Application
// Frictionless Firebase Anonymous Authentication, Atomic Username Reservation,
// Andhra Pradesh Nominatim + Local Search, Draggable Placement, Real 3D Three.js Houses.

import { firebaseConfig } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs,
  runTransaction, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

import {
  HOUSE_DESIGNS, validateInstagramUsername, isWithinAndhraBounds, clampToAndhraBounds,
  escapeHtml, formatCoord, sanitizePlaceType
} from './validation.js';
import { initThemeSwitcher } from './theme.js';
import { AndhraLocationSearch } from './location-search.js';
import { createThreeHouseLayer } from './three-houses.js';

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

const $ = (s) => document.querySelector(s);
const panel = $('#panel');
const panelContent = $('#panelContent');

let auth = null, db = null, currentUser = null;
let map = null, locationSearch = null;
let allHouses = [];
let myHouse = null;
let houseMarkers = [];
let selectedPlace = null;

// Placement mode state
let placingMode = false;
let placementMarker = null;
let placementDraft = {
  displayUsername: '',
  normalizedUsername: '',
  usernameVerified: false,
  houseDesign: HOUSE_DESIGNS[0].id,
  lat: 16.5062,
  lng: 80.6480,
  placeName: 'Vijayawada',
  district: 'NTR',
  placeType: 'city',
  isSecondHouseAttempt: false
};

let toastTimer = null;
function toast(msg, isError = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('error', isError);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}

function openPanel(html) {
  panelContent.innerHTML = html;
  panel.classList.add('show');
}
function closePanel() {
  panel.classList.remove('show');
}

function setActiveTab(tabName) {
  document.querySelectorAll('.bottom button').forEach((b) => {
    b.classList.toggle('active', b.dataset.open === tabName);
  });
}

function updateSelectedPlaceBanner() {
  const banner = $('#selectedPlaceBanner');
  if (!banner) return;
  if (!selectedPlace) {
    banner.hidden = true;
    return;
  }
  const typeTag = selectedPlace.placeType ? selectedPlace.placeType.toUpperCase() : 'PLACE';
  banner.innerHTML = `
    <div class="place-chip">
      <div>
        <b>${escapeHtml(selectedPlace.name)}</b>
        <small>${escapeHtml(typeTag)} · ${escapeHtml(selectedPlace.district)}, Andhra Pradesh</small>
      </div>
      <button class="primary sm" id="bannerPlaceBtn">${myHouse ? 'Move My House' : 'Place My House'}</button>
    </div>
  `;
  banner.hidden = false;
  $('#bannerPlaceBtn').onclick = () => {
    setActiveTab('build');
    showBuildPanel();
  };
}

function flyToPlace(place, zoomOverride) {
  selectedPlace = {
    name: place.name,
    district: place.district || 'Andhra Pradesh',
    placeType: sanitizePlaceType(place.placeType),
    lat: Number(place.lat),
    lng: Number(place.lng)
  };
  placementDraft.placeName = selectedPlace.name;
  placementDraft.district = selectedPlace.district;
  placementDraft.placeType = selectedPlace.placeType;
  placementDraft.lat = selectedPlace.lat;
  placementDraft.lng = selectedPlace.lng;

  const zoom = zoomOverride ?? (selectedPlace.placeType === 'district' ? 9.2 : selectedPlace.placeType === 'village' ? 14.2 : 13.0);
  if (map) {
    map.flyTo({ center: [selectedPlace.lng, selectedPlace.lat], zoom, pitch: 56, duration: 1500 });
  }
  updateSelectedPlaceBanner();
  toast(`Moved to ${selectedPlace.name}, ${selectedPlace.district}`);
}

function renderHouseMarkers() {
  houseMarkers.forEach((m) => m.remove());
  houseMarkers = [];
  if (!map) return;

  $('#houseCount').textContent = String(allHouses.length);

  for (const h of allHouses) {
    if (!Number.isFinite(h.latitude) || !Number.isFinite(h.longitude)) continue;
    const isMine = currentUser && h.uid === currentUser.uid;
    const el = document.createElement('div');
    el.className = 'house-marker' + (isMine ? ' mine' : '');
    el.title = `@${h.displayUsername || h.normalizedUsername} · ${h.placeName}`;
    el.innerHTML = `<span class="house-tag">@${escapeHtml(h.displayUsername || h.normalizedUsername)}</span>`;

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([h.longitude, h.latitude])
      .addTo(map);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openPanel(`
        <h2>@${escapeHtml(h.displayUsername || h.normalizedUsername)}</h2>
        <p><b>${escapeHtml(h.houseDesign)}</b> in <b>${escapeHtml(h.placeName)}</b>, ${escapeHtml(h.district)}, Andhra Pradesh</p>
        <p class="muted">Coordinates: ${formatCoord(h.latitude)}, ${formatCoord(h.longitude)}</p>
        <div class="actions">
          <button class="secondary" id="flyHouseBtn">Zoom In 3D</button>
          <a class="secondary" href="https://www.instagram.com/${encodeURIComponent(h.normalizedUsername)}/" target="_blank" rel="noopener">Open Instagram</a>
          ${isMine ? '<button class="primary" id="editMineFromPopup">Edit My House</button>' : ''}
        </div>
      `);
      $('#flyHouseBtn').onclick = () => map.flyTo({ center: [h.longitude, h.latitude], zoom: 15.8, pitch: 60, duration: 1200 });
      if (isMine && $('#editMineFromPopup')) {
        $('#editMineFromPopup').onclick = () => { setActiveTab('build'); showBuildPanel(); };
      }
    });
    houseMarkers.push(marker);
  }
  map.triggerRepaint();
}

async function loadHouses() {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'houses'));
    allHouses = [];
    myHouse = null;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const item = { id: docSnap.id, ...data };
      allHouses.push(item);
      if (currentUser && docSnap.id === currentUser.uid) {
        myHouse = item;
      }
    });
    renderHouseMarkers();
    updateSelectedPlaceBanner();
  } catch (err) {
    console.error('Failed to load houses:', err);
    toast('Could not load houses. Check your connection.', true);
  }
}

async function ensureAnonymousAuth() {
  if (!auth) return;
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.error('Anonymous Auth error:', err);
    toast('Anonymous sign-in failed. Enable Anonymous Auth in Firebase Console.', true);
    return null;
  }
}

async function ensurePlayerRecord(user) {
  if (!db || !user) return;
  const ref = doc(db, 'players', user.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        authType: 'anonymous',
        hasHouse: false,
        normalizedUsername: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    console.warn('Player record sync warning:', err?.message || err);
  }
}

// Draggable placement bar & marker
function startPlacementMode() {
  placingMode = true;
  closePanel();
  const center = isWithinAndhraBounds(placementDraft.lat, placementDraft.lng)
    ? [placementDraft.lng, placementDraft.lat]
    : [map.getCenter().lng, map.getCenter().lat];

  placementDraft.lng = center[0];
  placementDraft.lat = center[1];

  if (placementMarker) placementMarker.remove();
  const el = document.createElement('div');
  el.className = 'placement-pin';
  el.innerHTML = '<span>🏠</span>';
  placementMarker = new maplibregl.Marker({ element: el, draggable: true, anchor: 'bottom' })
    .setLngLat(center)
    .addTo(map);

  placementMarker.on('dragend', () => {
    const ll = placementMarker.getLngLat();
    const clamped = clampToAndhraBounds(ll.lat, ll.lng);
    placementDraft.lat = clamped.lat;
    placementDraft.lng = clamped.lng;
    placementMarker.setLngLat([clamped.lng, clamped.lat]);
    updatePlacementHud();
    map.triggerRepaint();
  });

  map.flyTo({ center, zoom: Math.max(map.getZoom(), 14.5), pitch: 58, duration: 1000 });
  updatePlacementHud();
  $('#placementBar').hidden = false;
  map.triggerRepaint();
}

function stopPlacementMode() {
  placingMode = false;
  if (placementMarker) {
    placementMarker.remove();
    placementMarker = null;
  }
  $('#placementBar').hidden = true;
  if (map) map.triggerRepaint();
}

function updatePlacementHud() {
  $('#placementCoords').textContent = `${formatCoord(placementDraft.lat)}, ${formatCoord(placementDraft.lng)}`;
  $('#placementPlaceLabel').textContent = `${placementDraft.placeName}, ${placementDraft.district}`;
}

async function confirmAndSaveHouse() {
  const btn = $('#confirmSaveHouseBtn');
  if (!currentUser) {
    currentUser = await ensureAnonymousAuth();
    if (!currentUser) return;
  }
  if (!isWithinAndhraBounds(placementDraft.lat, placementDraft.lng)) {
    toast('Please place your house inside Andhra Pradesh.', true);
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    // Editing existing house (same UID)
    if (myHouse && !placementDraft.isSecondHouseAttempt) {
      await updateDoc(doc(db, 'houses', currentUser.uid), {
        placeName: placementDraft.placeName,
        district: placementDraft.district,
        placeType: sanitizePlaceType(placementDraft.placeType),
        latitude: Number(placementDraft.lat.toFixed(6)),
        longitude: Number(placementDraft.lng.toFixed(6)),
        houseDesign: placementDraft.houseDesign,
        updatedAt: serverTimestamp()
      });
      stopPlacementMode();
      await loadHouses();
      toast('Your house position & design have been updated!');
      map.flyTo({ center: [placementDraft.lng, placementDraft.lat], zoom: 15.5, pitch: 60, duration: 1000 });
      return;
    }

    // Validate Instagram username before atomic claim
    const v = validateInstagramUsername(placementDraft.displayUsername);
    if (!v.valid) {
      toast(v.error, true);
      stopPlacementMode();
      showBuildPanel();
      return;
    }

    // Atomic transaction: reserve username + create house together
    const houseRef = doc(db, 'houses', currentUser.uid);
    const usernameRef = doc(db, 'usernames', v.normalized);
    const playerRef = doc(db, 'players', currentUser.uid);

    await runTransaction(db, async (tx) => {
      const [existingHouse, existingUsername] = await Promise.all([
        tx.get(houseRef),
        tx.get(usernameRef)
      ]);
      if (existingHouse.exists()) {
        const err = new Error('ALREADY_OWNS_HOUSE');
        err.existingHouse = existingHouse.data();
        throw err;
      }
      if (existingUsername.exists()) {
        throw new Error('USERNAME_TAKEN');
      }
      const now = serverTimestamp();
      tx.set(usernameRef, {
        uid: currentUser.uid,
        normalizedUsername: v.normalized,
        displayUsername: v.display,
        houseId: currentUser.uid,
        createdAt: now,
        updatedAt: now
      });
      tx.set(houseRef, {
        uid: currentUser.uid,
        normalizedUsername: v.normalized,
        displayUsername: v.display,
        placeName: placementDraft.placeName,
        district: placementDraft.district,
        placeType: sanitizePlaceType(placementDraft.placeType),
        latitude: Number(placementDraft.lat.toFixed(6)),
        longitude: Number(placementDraft.lng.toFixed(6)),
        houseDesign: placementDraft.houseDesign,
        createdAt: now,
        updatedAt: now
      });
      tx.set(playerRef, {
        uid: currentUser.uid,
        authType: 'anonymous',
        hasHouse: true,
        normalizedUsername: v.normalized,
        createdAt: now,
        updatedAt: now
      }, { merge: true });
    });

    stopPlacementMode();
    await loadHouses();
    toast(`House built for @${v.display}!`);
    map.flyTo({ center: [placementDraft.lng, placementDraft.lat], zoom: 15.6, pitch: 60, duration: 1200 });
  } catch (err) {
    if (err.message === 'USERNAME_TAKEN') {
      toast('Username already taken in ST Virtual World.', true);
      stopPlacementMode();
      showBuildPanel();
    } else if (err.message === 'ALREADY_OWNS_HOUSE') {
      // Log second-house attempt for admin review without creating a second public house
      try {
        const v = validateInstagramUsername(placementDraft.displayUsername || myHouse?.displayUsername || 'player');
        await addDoc(collection(db, 'houseRequests'), {
          uid: currentUser.uid,
          existingHouseId: currentUser.uid,
          existingUsername: err.existingHouse?.normalizedUsername || myHouse?.normalizedUsername || '',
          requestedNormalizedUsername: v.normalized,
          requestedDisplayUsername: v.display,
          placeName: placementDraft.placeName,
          district: placementDraft.district,
          placeType: sanitizePlaceType(placementDraft.placeType),
          latitude: Number(placementDraft.lat.toFixed(6)),
          longitude: Number(placementDraft.lng.toFixed(6)),
          houseDesign: placementDraft.houseDesign,
          type: 'second-house-attempt',
          status: 'pending',
          reason: 'Player attempted to build a second house with an existing anonymous UID.',
          createdAt: serverTimestamp()
        });
        toast('You already own a house. Your second-house request was sent to admin for review.');
      } catch (reqErr) {
        toast('You already own a house. Edit your existing house instead.', true);
      }
      stopPlacementMode();
    } else {
      console.error('Save house error:', err);
      toast('Could not save house: ' + (err?.message || 'Network error'), true);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm & Save House';
  }
}

// Panels
function showExplorePanel() {
  stopPlacementMode();
  const districts = locationSearch ? locationSearch.getDistricts() : [];
  openPanel(`
    <h2>Explore Andhra Pradesh</h2>
    <p class="muted">Search any village, town, city, or district. District filter is optional.</p>
    <div class="filter-grid">
      <label class="field">
        <span>District (Optional)</span>
        <select id="fDistrict">
          <option value="">All Andhra Pradesh</option>
          ${districts.map((d) => `<option value="${escapeHtml(d.d)}">${escapeHtml(d.d)}</option>`).join('')}
        </select>
      </label>
      <label class="field">
        <span>Town / City (Optional)</span>
        <select id="fTown"><option value="">Select district or town</option></select>
      </label>
      <label class="field" id="fVillageWrap" hidden>
        <span>Village in Selected Town (Optional)</span>
        <select id="fVillage"><option value="">All / optional village</option></select>
      </label>
    </div>
    <div class="actions">
      <button class="primary" id="flyFilteredBtn">Go to Selected Area</button>
      <button class="secondary" id="refreshHousesBtn">Refresh Houses (${allHouses.length})</button>
    </div>
    ${allHouses.length === 0 ? '<p class="empty-note">No houses built yet. Be the first to place your 3D house in Andhra Pradesh!</p>' : ''}
  `);

  const fDistrict = $('#fDistrict');
  const fTown = $('#fTown');
  const fVillageWrap = $('#fVillageWrap');
  const fVillage = $('#fVillage');

  function populateTowns(dist) {
    const towns = locationSearch ? locationSearch.getTownsByDistrict(dist) : [];
    fTown.innerHTML = `<option value="">${dist ? 'All towns in ' + escapeHtml(dist) : 'Select a town/city'}</option>` +
      towns.map((t) => `<option value="${escapeHtml(t.t)}" data-dist="${escapeHtml(t.d)}" data-lat="${t.lat}" data-lng="${t.lng}" data-type="${t.type}">${escapeHtml(t.t)} (${t.type === 'city' ? 'City' : 'Town'})</option>`).join('');
    fVillageWrap.hidden = true;
    fVillage.innerHTML = '<option value="">Optional village</option>';
  }

  populateTowns('');

  fDistrict.onchange = () => populateTowns(fDistrict.value);

  fTown.onchange = () => {
    const opt = fTown.selectedOptions[0];
    const townName = fTown.value;
    const distName = opt?.dataset.dist || fDistrict.value;
    if (!townName) {
      fVillageWrap.hidden = true;
      return;
    }
    const villages = locationSearch.getVillagesByTown(townName, distName);
    if (villages.length > 0) {
      fVillage.innerHTML = `<option value="">Stay in ${escapeHtml(townName)}</option>` +
        villages.map((v) => `<option value="${escapeHtml(v.v)}" data-lat="${v.lat}" data-lng="${v.lng}" data-dist="${escapeHtml(v.d)}">${escapeHtml(v.v)} (Village)</option>`).join('');
      fVillageWrap.hidden = false;
    } else {
      fVillageWrap.hidden = true;
    }
  };

  $('#flyFilteredBtn').onclick = () => {
    if (!fVillageWrap.hidden && fVillage.value) {
      const o = fVillage.selectedOptions[0];
      flyToPlace({ name: o.value, district: o.dataset.dist, placeType: 'village', lat: o.dataset.lat, lng: o.dataset.lng });
      closePanel();
      return;
    }
    if (fTown.value) {
      const o = fTown.selectedOptions[0];
      flyToPlace({ name: o.value, district: o.dataset.dist, placeType: o.dataset.type, lat: o.dataset.lat, lng: o.dataset.lng });
      closePanel();
      return;
    }
    if (fDistrict.value) {
      const d = locationSearch.getDistricts().find((x) => x.d === fDistrict.value);
      if (d) {
        flyToPlace({ name: d.d, district: d.d, placeType: 'district', lat: d.lat, lng: d.lng });
        closePanel();
        return;
      }
    }
    toast('Select a district, town, city, or use the top search bar.');
  };

  $('#refreshHousesBtn').onclick = () => loadHouses().then(() => toast('Houses refreshed.'));
}

function showBuildPanel() {
  stopPlacementMode();
  const isEditing = Boolean(myHouse);

  if (isEditing) {
    placementDraft.displayUsername = myHouse.displayUsername || myHouse.normalizedUsername;
    placementDraft.normalizedUsername = myHouse.normalizedUsername;
    placementDraft.houseDesign = myHouse.houseDesign || HOUSE_DESIGNS[0].id;
    placementDraft.isSecondHouseAttempt = false;
    if (!selectedPlace) {
      placementDraft.lat = myHouse.latitude;
      placementDraft.lng = myHouse.longitude;
      placementDraft.placeName = myHouse.placeName;
      placementDraft.district = myHouse.district;
      placementDraft.placeType = myHouse.placeType || 'town';
    }
  }

  openPanel(`
    <h2>${isEditing ? 'Edit Your Virtual House' : 'Build Your Virtual House'}</h2>
    <p class="privacy-warn">⚠ Privacy: Pick a general or fictional map spot — do not publish your private home address.</p>
    ${isEditing ? `
      <div class="info-box">
        <b>Your House:</b> @${escapeHtml(myHouse.displayUsername || myHouse.normalizedUsername)}<br>
        <small>${escapeHtml(myHouse.placeName)}, ${escapeHtml(myHouse.district)} · ${formatCoord(myHouse.latitude)}, ${formatCoord(myHouse.longitude)}</small>
      </div>
    ` : `
      <label class="field">
        <span>Instagram Username</span>
        <div class="at-input">
          <span class="at-prefix">@</span>
          <input id="igInput" maxlength="30" autocomplete="off" placeholder="your_username" value="${escapeHtml(placementDraft.displayUsername)}">
        </div>
      </label>
      <div class="actions">
        <button class="secondary" id="checkUsernameBtn">Check Availability</button>
      </div>
      <div id="usernameStatus" class="status"></div>
      <p class="muted tiny">Checks availability inside <b>ST Virtual World</b> only. Instagram does not provide a public API to verify live Instagram.com availability.</p>
    `}
    <label class="field">
      <span>3D House Design</span>
      <select id="designSelect">
        ${HOUSE_DESIGNS.map((d) => `<option value="${escapeHtml(d.id)}" ${placementDraft.houseDesign === d.id ? 'selected' : ''}>${escapeHtml(d.id)}</option>`).join('')}
      </select>
    </label>
    <p class="muted">Selected area: <b>${escapeHtml(placementDraft.placeName)}</b>, ${escapeHtml(placementDraft.district)}</p>
    <div class="actions">
      <button class="primary" id="startPlaceBtn">${isEditing ? 'Reposition & Save House' : 'Place My House on Map'}</button>
      ${isEditing ? '<button class="secondary" id="flyToMyHouseBtn">Fly to My House</button>' : ''}
    </div>
    ${isEditing ? `
      <div class="divider"></div>
      <p class="muted tiny">Each browser/device anonymous session can own one house. Need a second house? Submit a request for admin review:</p>
      <button class="secondary sm" id="secondHouseReqBtn">Request Second House (Admin Review)</button>
    ` : ''}
  `);

  $('#designSelect').onchange = (e) => { placementDraft.houseDesign = e.target.value; };

  if (!isEditing) {
    const igInput = $('#igInput');
    const statusEl = $('#usernameStatus');

    const runCheck = async () => {
      const v = validateInstagramUsername(igInput.value);
      placementDraft.displayUsername = v.display;
      placementDraft.normalizedUsername = v.normalized;
      placementDraft.usernameVerified = false;
      if (!v.valid) {
        statusEl.textContent = v.error;
        statusEl.className = 'status err';
        return false;
      }
      statusEl.textContent = 'Checking ST Virtual World...';
      statusEl.className = 'status';
      try {
        const snap = await getDoc(doc(db, 'usernames', v.normalized));
        if (snap.exists()) {
          statusEl.textContent = 'Username already taken';
          statusEl.className = 'status err';
          return false;
        }
        statusEl.textContent = 'Username available';
        statusEl.className = 'status ok';
        placementDraft.usernameVerified = true;
        return true;
      } catch (err) {
        statusEl.textContent = 'Check failed: ' + err.message;
        statusEl.className = 'status err';
        return false;
      }
    };

    $('#checkUsernameBtn').onclick = runCheck;
    $('#startPlaceBtn').onclick = async () => {
      const ok = await runCheck();
      if (ok) startPlacementMode();
    };
  } else {
    $('#startPlaceBtn').onclick = () => {
      placementDraft.isSecondHouseAttempt = false;
      startPlacementMode();
    };
    $('#flyToMyHouseBtn').onclick = () => {
      closePanel();
      map.flyTo({ center: [myHouse.longitude, myHouse.latitude], zoom: 15.8, pitch: 60, duration: 1200 });
    };
    $('#secondHouseReqBtn').onclick = () => {
      placementDraft.isSecondHouseAttempt = true;
      startPlacementMode();
      toast('Position the marker and confirm to send a second-house request to admin.');
    };
  }
}

function showMyHousePanel() {
  stopPlacementMode();
  if (!myHouse) {
    openPanel(`
      <h2>My House</h2>
      <p class="muted">You haven't built a house in this browser session yet.</p>
      <p class="muted tiny">No login or signup is required — ST Virtual World uses automatic Firebase Anonymous Authentication (browser/device scoped).</p>
      <div class="actions">
        <button class="primary" id="goBuildNow">Build My House</button>
      </div>
    `);
    $('#goBuildNow').onclick = () => { setActiveTab('build'); showBuildPanel(); };
    return;
  }
  openPanel(`
    <h2>@${escapeHtml(myHouse.displayUsername || myHouse.normalizedUsername)}</h2>
    <p><b>Design:</b> ${escapeHtml(myHouse.houseDesign)}<br>
       <b>Location:</b> ${escapeHtml(myHouse.placeName)}, ${escapeHtml(myHouse.district)}<br>
       <b>Coordinates:</b> ${formatCoord(myHouse.latitude)}, ${formatCoord(myHouse.longitude)}</p>
    <div class="actions">
      <button class="primary" id="openMyCoords">Fly to My House</button>
      <button class="secondary" id="editMyBtn">Edit Position / Design</button>
    </div>
  `);
  $('#openMyCoords').onclick = () => {
    closePanel();
    map.flyTo({ center: [myHouse.longitude, myHouse.latitude], zoom: 15.8, pitch: 60, duration: 1200 });
  };
  $('#editMyBtn').onclick = () => { setActiveTab('build'); showBuildPanel(); };
}

function showHelpPanel() {
  stopPlacementMode();
  openPanel(`
    <h2>How ST Virtual World Works</h2>
    <p>
      <b>1. No Login Needed:</b> You enter instantly using background Firebase Anonymous Authentication. Note that anonymous IDs are browser/device scoped and do not guarantee one house per human across multiple devices.<br>
      <b>2. Claim Your @Username:</b> Enter your Instagram-style username. Availability is checked against ST Virtual World's Firestore registry using atomic transactions (Instagram does not offer a public availability API).<br>
      <b>3. Search Andhra Pradesh:</b> Search any village, town, city, or district via OpenStreetMap Nominatim + local index.<br>
      <b>4. Place & Save:</b> Drag the house marker or tap the map to place your 3D house. Please use a general or fictional location rather than a private home address.
    </p>
  `);
}

// Top search bar with Nominatim + local dropdown
function bindSearchBar() {
  const input = $('#searchPlace');
  const btn = $('#searchBtn');
  const dropdown = $('#searchResults');

  async function runSearch() {
    const q = input.value.trim();
    if (q.length < 2) {
      dropdown.hidden = true;
      return;
    }
    dropdown.hidden = false;
    dropdown.innerHTML = '<div class="sr-item muted">Searching Andhra Pradesh...</div>';
    const results = await locationSearch.search(q);
    if (!results.length) {
      dropdown.innerHTML = '<div class="sr-item muted">No Andhra Pradesh place found. Try another spelling.</div>';
      return;
    }
    dropdown.innerHTML = results.map((r, idx) => `
      <button type="button" class="sr-item" data-idx="${idx}">
        <b>${escapeHtml(r.name)}</b>
        <small>${escapeHtml(r.placeType.toUpperCase())} · ${escapeHtml(r.district)}, Andhra Pradesh</small>
      </button>
    `).join('');
    dropdown.querySelectorAll('.sr-item[data-idx]').forEach((el) => {
      el.onclick = () => {
        const picked = results[Number(el.dataset.idx)];
        input.value = picked.name;
        dropdown.hidden = true;
        flyToPlace(picked);
      };
    });
  }

  btn.onclick = runSearch;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) dropdown.hidden = true;
  });
}

// Initialize
async function boot() {
  initThemeSwitcher($('#themeSelect'));
  $('#closePanel').onclick = closePanel;
  $('#cancelPlaceBtn').onclick = stopPlacementMode;
  $('#confirmSaveHouseBtn').onclick = confirmAndSaveHouse;

  document.querySelectorAll('.bottom button').forEach((b) => {
    b.onclick = () => {
      setActiveTab(b.dataset.open);
      ({ explore: showExplorePanel, build: showBuildPanel, myhouse: showMyHousePanel, help: showHelpPanel })[b.dataset.open]();
    };
  });

  // Load local Andhra Pradesh supplemental index
  try {
    const resp = await fetch('./data/andhra.json');
    const data = await resp.json();
    locationSearch = new AndhraLocationSearch(data);
    bindSearchBar();
  } catch (err) {
    toast('Failed to load Andhra Pradesh data.', true);
    locationSearch = new AndhraLocationSearch({ districts: [], towns: [], villages: [] });
  }

  // Initialize MapLibre GL + Three.js 3D Houses Layer
  map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [80.648, 16.506],
    zoom: 6.2,
    pitch: 48,
    bearing: -8,
    maxPitch: 65,
    attributionControl: true
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

  map.on('load', () => {
    try {
      const threeLayer = createThreeHouseLayer(
        map,
        () => allHouses,
        () => (placingMode ? placementDraft : null)
      );
      map.addLayer(threeLayer);
    } catch (e) {
      console.warn('3D layer skipped:', e);
    }
    if (db) loadHouses();
  });

  map.on('click', (e) => {
    if (!placingMode) return;
    const clamped = clampToAndhraBounds(e.lngLat.lat, e.lngLat.lng);
    placementDraft.lat = clamped.lat;
    placementDraft.lng = clamped.lng;
    if (placementMarker) placementMarker.setLngLat([clamped.lng, clamped.lat]);
    updatePlacementHud();
    map.triggerRepaint();
  });

  // Initialize Firebase + Background Anonymous Authentication
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, async (u) => {
      if (!u) {
        await ensureAnonymousAuth();
        return;
      }
      currentUser = u;
      await ensurePlayerRecord(u);
      await loadHouses();
    });
  } catch (err) {
    console.error('Firebase init error:', err);
    toast('Firebase connection error.', true);
  }
}

boot();
