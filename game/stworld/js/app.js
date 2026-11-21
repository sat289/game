// ST Virtual World — Player Application
// Flow: Background Anonymous Auth -> Enter @Username -> Select District / Town / Village (or Search)
//       -> Map Zooms to Place -> Drag Marker / Tap Map -> Confirm & Save House Atomically.

import { firebaseConfig } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs,
  runTransaction, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

import {
  ADMIN_CONTACT, HOUSE_DESIGNS, getLandmarkMeta, validateInstagramUsername, isWithinAndhraBounds, clampToAndhraBounds,
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

let auth = null;
let db = null;
let currentUser = null;
let map = null;
let locationSearch = null;
let allHouses = [];
let allLandmarks = [];
let myHouse = null;
let houseMarkers = [];
let landmarkMarkers = [];
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
  if (!el) return;
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
  if (!selectedPlace || placingMode) {
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
      ${myHouse
        ? '<button class="secondary sm" id="bannerPlaceBtn" type="button">My House</button>'
        : '<button class="primary sm" id="bannerPlaceBtn" type="button">Place My House</button>'}
    </div>
  `;
  banner.hidden = false;
  $('#bannerPlaceBtn').onclick = () => {
    if (myHouse) {
      map.flyTo({ center: [myHouse.longitude, myHouse.latitude], zoom: 16.0, pitch: 60, duration: 1200 });
      toast('Your house location is locked permanently.');
    } else {
      setActiveTab('build');
      showBuildPanel();
    }
  };
}

function flyToPlace(place, zoomOverride, silent = false) {
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

  const zoom = zoomOverride ?? (
    selectedPlace.placeType === 'district' ? 9.4 :
    selectedPlace.placeType === 'village' ? 14.5 : 13.2
  );
  if (map) {
    map.flyTo({ center: [selectedPlace.lng, selectedPlace.lat], zoom, pitch: 56, duration: 1400 });
  }
  updateSelectedPlaceBanner();
  if (!silent) {
    toast(`Zoomed to ${selectedPlace.name}, ${selectedPlace.district}`);
  }
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

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -54] })
      .setLngLat([h.longitude, h.latitude])
      .addTo(map);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openPanel(`
        <h2>@${escapeHtml(h.displayUsername || h.normalizedUsername)}</h2>
        <p><b>${escapeHtml(h.houseDesign)}</b> in <b>${escapeHtml(h.placeName)}</b>, ${escapeHtml(h.district)}, Andhra Pradesh</p>
        <p class="muted">Coordinates: ${formatCoord(h.latitude)}, ${formatCoord(h.longitude)}</p>
        <div class="actions">
          <button class="secondary" id="flyHouseBtn" type="button">Zoom In 3D</button>
          <a class="secondary" href="https://www.instagram.com/${encodeURIComponent(h.normalizedUsername)}/" target="_blank" rel="noopener">Open Instagram</a>
          ${isMine ? '<button class="primary" id="editMineFromPopup" type="button">Change 3D Design</button>' : ''}
        </div>
      `);
      $('#flyHouseBtn').onclick = () => map.flyTo({ center: [h.longitude, h.latitude], zoom: 15.8, pitch: 60, duration: 1200 });
      if (isMine && $('#editMineFromPopup')) {
        $('#editMineFromPopup').onclick = () => { setActiveTab('build'); showBuildPanel(); };
      }
    });
    houseMarkers.push(marker);
  }
  updateMarkerVisibility();
  map.triggerRepaint();
}


function renderAdminContactCard(username = '') {
  const waText = encodeURIComponent(`Hi Admin, I want to edit my ST Virtual World house (@${username || 'my_house'}).`);
  const mailSub = encodeURIComponent(`ST Virtual World House Edit Request (@${username || 'my_house'})`);
  return `
    <div class="contact-card">
      <div class="contact-title">📞 Contact Admin to Edit Location</div>
      <p class="muted tiny">House location is permanently locked after placement. Tap any contact below to call or message Admin directly:</p>
      <div class="contact-links">
        <a class="contact-btn" href="${ADMIN_CONTACT.phoneHref}">📞 Call: ${ADMIN_CONTACT.phoneDisplay}</a>
        <a class="contact-btn" href="https://wa.me/91${ADMIN_CONTACT.phoneDisplay}?text=${waText}" target="_blank" rel="noopener">💬 WhatsApp: ${ADMIN_CONTACT.phoneDisplay}</a>
        <a class="contact-btn" href="mailto:${ADMIN_CONTACT.email}?subject=${mailSub}">✉️ Email: ${ADMIN_CONTACT.email}</a>
        <a class="contact-btn" href="${ADMIN_CONTACT.instagramHref}" target="_blank" rel="noopener">📸 Instagram: @${ADMIN_CONTACT.instagram}</a>
      </div>
    </div>
  `;
}

function renderLandmarkMarkers() {
  landmarkMarkers.forEach((m) => m.remove());
  landmarkMarkers = [];
  if (!map) return;

  for (const lm of allLandmarks) {
    if (!Number.isFinite(lm.latitude) || !Number.isFinite(lm.longitude)) continue;
    const meta = getLandmarkMeta(lm.modelType);
    const el = document.createElement('div');
    el.className = 'house-marker landmark-marker';
    el.innerHTML = `<span class="house-tag landmark-tag">${meta.icon} ${escapeHtml(lm.name)}</span>`;

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -60] })
      .setLngLat([lm.longitude, lm.latitude])
      .addTo(map);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openPanel(`
        <h2>${meta.icon} ${escapeHtml(lm.name)}</h2>
        <p><b>${escapeHtml(lm.modelType)}</b> · ${escapeHtml(lm.district || 'Andhra Pradesh')}</p>
        ${lm.description ? `<p>${escapeHtml(lm.description)}</p>` : ''}
        <p class="muted">Popular Landmark · ${formatCoord(lm.latitude)}, ${formatCoord(lm.longitude)}</p>
        <div class="actions">
          <button class="primary" id="flyLmBtn" type="button">Zoom In 3D</button>
        </div>
      `);
      $('#flyLmBtn').onclick = () => map.flyTo({ center: [lm.longitude, lm.latitude], zoom: 16.2, pitch: 62, duration: 1200 });
    });
    landmarkMarkers.push(marker);
  }
  updateMarkerVisibility();
  map.triggerRepaint();
}

async function loadLandmarks() {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'landmarks'));
    allLandmarks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderLandmarkMarkers();
  } catch (err) {
    console.warn('Could not load landmarks:', err?.message || err);
  }
}

const MIN_MARKER_ZOOM = 11.5;

function updateMarkerVisibility() {
  if (!map) return;
  const visible = map.getZoom() >= MIN_MARKER_ZOOM;
  for (const m of [...houseMarkers, ...landmarkMarkers]) {
    const el = m.getElement();
    if (el) {
      el.classList.toggle('hidden-zoom', !visible);
    }
  }
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
    toast('Could not load houses. Check Firestore rules & connection.', true);
  }
}

async function ensureAnonymousAuth() {
  if (!auth) return null;
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
  updateSelectedPlaceBanner();

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

  const targetZoom = placementDraft.placeType === 'district' ? 12.2 : Math.max(map.getZoom(), 14.8);
  map.flyTo({ center, zoom: targetZoom, pitch: 58, duration: 1100 });
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
  updateSelectedPlaceBanner();
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
    // Existing house location is permanently locked
    if (myHouse && !placementDraft.isSecondHouseAttempt) {
      stopPlacementMode();
      toast('House location is permanent and cannot be moved.', true);
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
    await Promise.all([loadHouses(), loadLandmarks()]);
    toast(`House built for @${v.display}!`);
    map.flyTo({ center: [placementDraft.lng, placementDraft.lat], zoom: 15.6, pitch: 60, duration: 1200 });
  } catch (err) {
    if (err.message === 'USERNAME_TAKEN') {
      toast('Username already taken in ST Virtual World.', true);
      stopPlacementMode();
      showBuildPanel();
    } else if (err.message === 'ALREADY_OWNS_HOUSE') {
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
      } catch {
        toast('You already own a house. Edit your existing house instead.', true);
      }
      stopPlacementMode();
    } else {
      console.error('Save house error:', err);
      toast('Could not save house: ' + (err?.message || 'Check Firebase Anonymous Auth & Rules'), true);
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
    <p class="muted">Pick a District, Town/City, or Village to zoom there immediately. District is optional.</p>
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
        <select id="fVillage"><option value="">Stay in town</option></select>
      </label>
    </div>
    <div class="actions">
      <button class="primary" id="flyFilteredBtn" type="button">Zoom to Area</button>
      <button class="secondary" id="refreshHousesBtn" type="button">Refresh Houses (${allHouses.length})</button>
    </div>
    ${allHouses.length === 0 ? '<p class="empty-note">No houses built yet. Be the first to build your 3D house in Andhra Pradesh!</p>' : ''}
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
    if (!townName) { fVillageWrap.hidden = true; return; }
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
    openPanel(`
      <h2>Your Virtual House</h2>
      <div class="info-box">
        <b>@${escapeHtml(myHouse.displayUsername || myHouse.normalizedUsername)}</b><br>
        <small>📍 ${escapeHtml(myHouse.placeName)}, ${escapeHtml(myHouse.district)} (${formatCoord(myHouse.latitude)}, ${formatCoord(myHouse.longitude)})</small>
      </div>
      <p class="privacy-warn">🔒 <b>Location Locked:</b> Once a house is set in a place, it cannot be moved to another location.</p>

      <label class="field">
        <span>Change 3D House Design (Same Location)</span>
        <select id="designSelect">
          ${HOUSE_DESIGNS.map((d) => `<option value="${escapeHtml(d.id)}" ${myHouse.houseDesign === d.id ? 'selected' : ''}>${escapeHtml(d.id)}</option>`).join('')}
        </select>
      </label>

      <div class="actions">
        <button class="primary" id="saveDesignOnlyBtn" type="button">Save 3D Design</button>
        <button class="secondary" id="flyToMyHouseBtn" type="button">Fly to My House</button>
      </div>
      <div id="designStatus" class="status"></div>
      ${renderAdminContactCard(myHouse.displayUsername || myHouse.normalizedUsername)}
    `);

    $('#flyToMyHouseBtn').onclick = () => {
      closePanel();
      map.flyTo({ center: [myHouse.longitude, myHouse.latitude], zoom: 16.0, pitch: 60, duration: 1200 });
    };

    $('#saveDesignOnlyBtn').onclick = async () => {
      const btn = $('#saveDesignOnlyBtn');
      const statusEl = $('#designStatus');
      const newDesign = $('#designSelect').value;
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        await updateDoc(doc(db, 'houses', currentUser.uid), {
          houseDesign: newDesign,
          updatedAt: serverTimestamp()
        });
        await Promise.all([loadHouses(), loadLandmarks()]);
        statusEl.textContent = '3D house design updated!';
        statusEl.className = 'status ok';
        toast('3D house design updated!');
      } catch (err) {
        statusEl.textContent = 'Update failed: ' + err.message;
        statusEl.className = 'status err';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save 3D Design';
      }
    };
    return;
  }

  const districts = locationSearch ? locationSearch.getDistricts() : [];

  openPanel(`
    <h2>Build Your Virtual House</h2>
    <p class="privacy-warn">⚠ <b>Note:</b> Pick a general or fictional map spot (not your private home address). <b>Once saved, your house location is permanent and cannot be moved.</b></p>

    <div class="step-tag">STEP 1 · USERNAME</div>
    <label class="field">
      <span>Instagram Username</span>
      <div class="at-input">
        <span class="at-prefix">@</span>
        <input id="igInput" maxlength="30" autocomplete="off" placeholder="your_username" value="${escapeHtml(placementDraft.displayUsername)}">
      </div>
    </label>
    <div class="actions" style="margin-top:6px">
      <button class="secondary sm" id="checkUsernameBtn" type="button">Check Availability</button>
    </div>
    <div id="usernameStatus" class="status"></div>
    <p class="muted tiny">Checks availability inside <b>ST Virtual World</b> only (Instagram has no public availability API).</p>

    <div class="step-tag">STEP 2 · SELECT DISTRICT &amp; ZOOM TO YOUR PLACE</div>
    <label class="field">
      <span>District (Optional)</span>
      <select id="bDistrict">
        <option value="">All Andhra Pradesh</option>
        ${districts.map((d) => `<option value="${escapeHtml(d.d)}" ${placementDraft.district === d.d ? 'selected' : ''}>${escapeHtml(d.d)}</option>`).join('')}
      </select>
    </label>

    <label class="field">
      <span>Town / City in District</span>
      <select id="bTown"><option value="">Select town / city</option></select>
    </label>

    <label class="field" id="bVillageWrap" hidden>
      <span>Village in Selected Town (Optional)</span>
      <select id="bVillage"><option value="">Stay in town</option></select>
    </label>

    <label class="field">
      <span>Or Search Any AP Village / Town / City</span>
      <div class="inline-search">
        <input id="bSearchInput" placeholder="Type any village, town or city name..." autocomplete="off">
        <button class="secondary sm" id="bSearchBtn" type="button">Find</button>
      </div>
    </label>
    <div id="bSearchResults" class="inline-results" hidden></div>

    <div class="info-box" id="bSelectedSummary">
      <b>Selected Place:</b> <span id="bSelectedText">${escapeHtml(placementDraft.placeName)}, ${escapeHtml(placementDraft.district)}</span>
    </div>

    <div class="step-tag">STEP 3 · 3D HOUSE DESIGN &amp; SET ON MAP</div>
    <label class="field">
      <span>3D House Model</span>
      <select id="designSelect">
        ${HOUSE_DESIGNS.map((d) => `<option value="${escapeHtml(d.id)}" ${placementDraft.houseDesign === d.id ? 'selected' : ''}>${escapeHtml(d.id)}</option>`).join('')}
      </select>
    </label>

    <div class="actions">
      <button class="primary" id="startPlaceBtn" type="button">Zoom &amp; Place My House</button>
    </div>
  `);

  const bDistrict = $('#bDistrict');
  const bTown = $('#bTown');
  const bVillageWrap = $('#bVillageWrap');
  const bVillage = $('#bVillage');
  const bSelectedText = $('#bSelectedText');
  const bSearchInput = $('#bSearchInput');
  const bSearchBtn = $('#bSearchBtn');
  const bSearchResults = $('#bSearchResults');

  function syncSelectedText() {
    bSelectedText.textContent = `${placementDraft.placeName}, ${placementDraft.district}`;
  }

  function fillBuildTowns(dist, autoSelectTown = '') {
    const towns = locationSearch ? locationSearch.getTownsByDistrict(dist) : [];
    bTown.innerHTML = `<option value="">${dist ? 'Select town/city in ' + escapeHtml(dist) : 'Select any AP town/city'}</option>` +
      towns.map((t) => `<option value="${escapeHtml(t.t)}" data-dist="${escapeHtml(t.d)}" data-lat="${t.lat}" data-lng="${t.lng}" data-type="${t.type}" ${autoSelectTown === t.t ? 'selected' : ''}>${escapeHtml(t.t)} (${t.type === 'city' ? 'City' : 'Town'})</option>`).join('');
    bVillageWrap.hidden = true;
    bVillage.innerHTML = '<option value="">Stay in town</option>';
  }

  fillBuildTowns(bDistrict.value, placementDraft.placeName);

  bDistrict.onchange = () => {
    const distName = bDistrict.value;
    fillBuildTowns(distName);
    if (distName) {
      const dObj = locationSearch.getDistricts().find((x) => x.d === distName);
      if (dObj) {
        flyToPlace({ name: dObj.d, district: dObj.d, placeType: 'district', lat: dObj.lat, lng: dObj.lng }, 9.5, true);
        syncSelectedText();
      }
    }
  };

  bTown.onchange = () => {
    const opt = bTown.selectedOptions[0];
    const townName = bTown.value;
    if (!townName || !opt) {
      bVillageWrap.hidden = true;
      return;
    }
    const distName = opt.dataset.dist || bDistrict.value || 'Andhra Pradesh';
    if (!bDistrict.value && distName) bDistrict.value = distName;

    flyToPlace({
      name: townName,
      district: distName,
      placeType: opt.dataset.type || 'town',
      lat: Number(opt.dataset.lat),
      lng: Number(opt.dataset.lng)
    }, 13.5, true);
    syncSelectedText();

    const villages = locationSearch.getVillagesByTown(townName, distName);
    if (villages.length > 0) {
      bVillage.innerHTML = `<option value="">Stay in ${escapeHtml(townName)}</option>` +
        villages.map((v) => `<option value="${escapeHtml(v.v)}" data-lat="${v.lat}" data-lng="${v.lng}" data-dist="${escapeHtml(v.d)}">${escapeHtml(v.v)} (Village)</option>`).join('');
      bVillageWrap.hidden = false;
    } else {
      bVillageWrap.hidden = true;
    }
  };

  bVillage.onchange = () => {
    const opt = bVillage.selectedOptions[0];
    if (!bVillage.value || !opt) return;
    flyToPlace({
      name: opt.value,
      district: opt.dataset.dist || bDistrict.value,
      placeType: 'village',
      lat: Number(opt.dataset.lat),
      lng: Number(opt.dataset.lng)
    }, 14.8, true);
    syncSelectedText();
  };

  async function runBuildSearch() {
    const q = bSearchInput.value.trim();
    if (q.length < 2) {
      bSearchResults.hidden = true;
      return;
    }
    bSearchResults.hidden = false;
    bSearchResults.innerHTML = '<div class="sr-item muted">Searching Andhra Pradesh...</div>';
    const results = await locationSearch.search(q, { district: bDistrict.value });
    if (!results.length) {
      bSearchResults.innerHTML = '<div class="sr-item muted">No place found. Try another spelling or clear district filter.</div>';
      return;
    }
    bSearchResults.innerHTML = results.map((r, idx) => `
      <button type="button" class="sr-item" data-bidx="${idx}">
        <b>${escapeHtml(r.name)}</b>
        <small>${escapeHtml(r.placeType.toUpperCase())} · ${escapeHtml(r.district)}, Andhra Pradesh</small>
      </button>
    `).join('');
    bSearchResults.querySelectorAll('[data-bidx]').forEach((btn) => {
      btn.onclick = () => {
        const picked = results[Number(btn.dataset.bidx)];
        bSearchInput.value = picked.name;
        bSearchResults.hidden = true;
        if (picked.district) bDistrict.value = picked.district;
        flyToPlace(picked, picked.placeType === 'village' ? 14.8 : 13.6, true);
        syncSelectedText();
        toast(`Selected ${picked.name}, ${picked.district}`);
      };
    });
  }
  bSearchBtn.onclick = runBuildSearch;
  bSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runBuildSearch(); });

  $('#designSelect').onchange = (e) => { placementDraft.houseDesign = e.target.value; };

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
}

function showMyHousePanel() {
  stopPlacementMode();
  if (!myHouse) {
    openPanel(`
      <h2>My House</h2>
      <p class="muted">You haven't built a house in this browser session yet.</p>
      <p class="muted tiny">No login or signup is required — ST Virtual World uses automatic Firebase Anonymous Authentication (browser/device scoped).</p>
      <div class="actions">
        <button class="primary" id="goBuildNow" type="button">Build My House</button>
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
      <button class="primary" id="openMyCoords" type="button">Fly to My House</button>
      <button class="secondary" id="editMyBtn" type="button">Change 3D Design</button>
    </div>
    ${renderAdminContactCard(myHouse.displayUsername || myHouse.normalizedUsername)}
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
      <b>1. No Login Needed:</b> Enter instantly via background Firebase Anonymous Authentication (browser/device scoped; does not guarantee one house per real human across multiple devices).<br>
      <b>2. Claim Your @Username:</b> Enter your Instagram-style username. Availability is checked against ST Virtual World's Firestore registry using atomic transactions (Instagram has no public availability API).<br>
      <b>3. Select District &amp; Place:</b> Pick your District, Town/City, or Village — or search any Andhra Pradesh village via OpenStreetMap Nominatim — and the map zooms right there.<br>
      <b>4. Drag &amp; Save:</b> Drag the house pin or tap the map to pick your spot, then tap <b>Confirm &amp; Save House</b>. Please use a general or fictional spot rather than your private home address.
    </p>
  `);
}

function bindSearchBar() {
  const input = $('#searchPlace');
  const btn = $('#searchBtn');
  const dropdown = $('#searchResults');

  function runUsernameSearch(showEmptyMessage = false) {
    const raw = input.value.trim().replace(/^@+/, '').toLowerCase();
    if (!raw) {
      if (showEmptyMessage) {
        dropdown.hidden = false;
        if (!allHouses.length) {
          dropdown.innerHTML = '<div class="sr-item muted">No player houses built yet.</div>';
        } else {
          renderUsernameResults(allHouses.slice(0, 12));
        }
      } else {
        dropdown.hidden = true;
      }
      return;
    }

    const matches = allHouses.filter((h) => {
      const norm = String(h.normalizedUsername || '').toLowerCase();
      const disp = String(h.displayUsername || '').toLowerCase();
      return norm.includes(raw) || disp.includes(raw);
    }).slice(0, 12);

    dropdown.hidden = false;
    if (!matches.length) {
      dropdown.innerHTML = `<div class="sr-item muted">No player found matching "@${escapeHtml(raw)}".</div>`;
      return;
    }
    renderUsernameResults(matches);
  }

  function renderUsernameResults(matches) {
    dropdown.innerHTML = matches.map((h, idx) => `
      <button type="button" class="sr-item" data-uidx="${idx}">
        <b>@${escapeHtml(h.displayUsername || h.normalizedUsername)}</b>
        <small>🏠 ${escapeHtml(h.houseDesign)} · ${escapeHtml(h.placeName)}, ${escapeHtml(h.district)}</small>
      </button>
    `).join('');

    dropdown.querySelectorAll('.sr-item[data-uidx]').forEach((el) => {
      el.onclick = () => {
        const house = matches[Number(el.dataset.uidx)];
        input.value = '@' + (house.displayUsername || house.normalizedUsername);
        dropdown.hidden = true;
        closePanel();
        stopPlacementMode();
        if (map && Number.isFinite(house.latitude) && Number.isFinite(house.longitude)) {
          map.flyTo({
            center: [house.longitude, house.latitude],
            zoom: 16.0,
            pitch: 60,
            duration: 1400
          });
          toast(`Visiting @${house.displayUsername || house.normalizedUsername}'s ${house.houseDesign}`);
        }
      };
    });
  }

  btn.onclick = () => runUsernameSearch(true);
  input.addEventListener('input', () => runUsernameSearch(false));
  input.addEventListener('focus', () => {
    if (input.value.trim().length > 0) runUsernameSearch(false);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runUsernameSearch(true);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) dropdown.hidden = true;
  });
}

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

  try {
    const resp = await fetch('./data/andhra.json');
    const data = await resp.json();
    locationSearch = new AndhraLocationSearch(data);
    bindSearchBar();
  } catch {
    toast('Failed to load Andhra Pradesh data.', true);
    locationSearch = new AndhraLocationSearch({ districts: [], towns: [], villages: [] });
  }

  map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [80.648, 16.506],
    zoom: 6.4,
    pitch: 48,
    bearing: -8,
    maxPitch: 65,
    attributionControl: true
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

  window.addEventListener('resize', () => map && map.resize());
  window.addEventListener('orientationchange', () => setTimeout(() => map && map.resize(), 250));

  map.on('load', () => {
    map.resize();
    setTimeout(() => map.resize(), 300);
    try {
      const threeLayer = createThreeHouseLayer(
        map,
        () => allHouses,
        () => (placingMode ? placementDraft : null),
        () => allLandmarks,
        './houses.glb'
      );
      map.addLayer(threeLayer);
    } catch (e) {
      console.warn('3D layer skipped:', e);
    }
    if (db) { loadHouses(); loadLandmarks(); }
  });

  map.on('zoom', updateMarkerVisibility);
  map.on('zoomend', updateMarkerVisibility);

  map.on('click', (e) => {
    if (!placingMode) return;
    const clamped = clampToAndhraBounds(e.lngLat.lat, e.lngLat.lng);
    placementDraft.lat = clamped.lat;
    placementDraft.lng = clamped.lng;
    if (placementMarker) placementMarker.setLngLat([clamped.lng, clamped.lat]);
    updatePlacementHud();
    map.triggerRepaint();
  });

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
      await Promise.all([loadHouses(), loadLandmarks()]);
    });
  } catch (err) {
    console.error('Firebase init error:', err);
    toast('Firebase connection error.', true);
  }
}

boot();
