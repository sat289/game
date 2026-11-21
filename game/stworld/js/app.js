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

    const marker = new maplibregl.Marker({ element: el, anchor: 'center', offset: [0, 0] })
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

    const marker = new maplibregl.Marker({ element: el, anchor: 'center', offset: [0, 0] })
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

const BUILTIN_LANDMARKS = [{"id":"builtin_001","name":"Araku Tribal Museum","modelType":"Heritage Monument","category":"Monument","district":"Alluri Sitharama Raju","description":"Famous tribal heritage museum in Araku Valley","latitude":18.3274,"longitude":82.8775,"builtin":true},{"id":"builtin_002","name":"Borra Caves","modelType":"Heritage Monument","category":"Monument","district":"Alluri Sitharama Raju","description":"Iconic limestone caves in Ananthagiri hills","latitude":18.2806,"longitude":83.0389,"builtin":true},{"id":"builtin_003","name":"Paderu Modakondamma Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Alluri Sitharama Raju","description":"Revered hill shrine in Paderu","latitude":18.0815,"longitude":82.6625,"builtin":true},{"id":"builtin_004","name":"Lambasingi Viewpoint Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Alluri Sitharama Raju","description":"Kashmir of Andhra Pradesh scenic gateway","latitude":17.8194,"longitude":82.4936,"builtin":true},{"id":"builtin_005","name":"Rampachodavaram Shiva Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Alluri Sitharama Raju","description":"Popular forest temple in Rampachodavaram","latitude":17.4417,"longitude":81.7764,"builtin":true},{"id":"builtin_006","name":"Bojjannakonda Buddhist Heritage","modelType":"Heritage Monument","category":"Monument","district":"Anakapalli","description":"Ancient rock-cut Buddhist stupas near Anakapalli","latitude":17.7115,"longitude":83.0156,"builtin":true},{"id":"builtin_007","name":"Nookambika Ammavari Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Anakapalli","description":"Historic Shakti temple in Anakapalli","latitude":17.6852,"longitude":83.0014,"builtin":true},{"id":"builtin_008","name":"Pudimadaka Coastal Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Anakapalli","description":"Scenic coastal lighthouse at Pudimadaka","latitude":17.493,"longitude":83.004,"builtin":true},{"id":"builtin_009","name":"Anakapalli Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Anakapalli","description":"Central town landmark in Anakapalli","latitude":17.6913,"longitude":83.0039,"builtin":true},{"id":"builtin_010","name":"Narsipatnam Shopping Plaza","modelType":"Grand Shopping Mall","category":"Mall","district":"Anakapalli","description":"Major commercial hub in Narsipatnam","latitude":17.6665,"longitude":82.6129,"builtin":true},{"id":"builtin_011","name":"Anantapur Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Ananthapuramu","description":"Iconic historic clock tower in Anantapur city","latitude":14.6819,"longitude":77.6006,"builtin":true},{"id":"builtin_012","name":"Gooty Fort Monument","modelType":"Heritage Monument","category":"Monument","district":"Ananthapuramu","description":"Ancient hill fort in Gooty","latitude":15.1194,"longitude":77.6383,"builtin":true},{"id":"builtin_013","name":"Tadipatri Bugga Ramalingeswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Ananthapuramu","description":"Vijayanagara-era temple on Penna river","latitude":14.9135,"longitude":78.0092,"builtin":true},{"id":"builtin_014","name":"Anantapur Cricket Stadium (RDT)","modelType":"Cricket Stadium","category":"Stadium","district":"Ananthapuramu","description":"Rural Development Trust Cricket Stadium","latitude":14.6645,"longitude":77.596,"builtin":true},{"id":"builtin_015","name":"Anantapur Central Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Ananthapuramu","description":"Popular shopping destination in Anantapur","latitude":14.6789,"longitude":77.6066,"builtin":true},{"id":"builtin_016","name":"Horsley Hills Gateway Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Annamayya","description":"Scenic hill station entrance near Madanapalle","latitude":13.6587,"longitude":78.4008,"builtin":true},{"id":"builtin_017","name":"Tallapaka Annamacharya Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Annamayya","description":"Birthplace & temple of Saint Annamacharya","latitude":14.2345,"longitude":79.1462,"builtin":true},{"id":"builtin_018","name":"Rayachoti Veerabhadra Swamy Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Annamayya","description":"Famous ancient temple in Rayachoti","latitude":14.0552,"longitude":78.7499,"builtin":true},{"id":"builtin_019","name":"Madanapalle Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Annamayya","description":"Historic town center landmark in Madanapalle","latitude":13.5516,"longitude":78.5023,"builtin":true},{"id":"builtin_020","name":"Gurramkonda Fort","modelType":"Heritage Monument","category":"Monument","district":"Annamayya","description":"Historic hilltop fort in Annamayya district","latitude":13.7817,"longitude":78.5836,"builtin":true},{"id":"builtin_021","name":"Bhavanarayana Swamy Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Bapatla","description":"Ancient Chola-era temple in Bapatla","latitude":15.9044,"longitude":80.4675,"builtin":true},{"id":"builtin_022","name":"Suryalanka Beach Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Bapatla","description":"Popular coastal beach landmark near Bapatla","latitude":15.839,"longitude":80.506,"builtin":true},{"id":"builtin_023","name":"Vodarevu Coastal Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Bapatla","description":"Scenic lighthouse at Vodarevu Beach, Chirala","latitude":15.795,"longitude":80.415,"builtin":true},{"id":"builtin_024","name":"Chirala Textile Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Bapatla","description":"Famous handloom & shopping center in Chirala","latitude":15.8247,"longitude":80.3506,"builtin":true},{"id":"builtin_025","name":"Bapatla Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Bapatla","description":"Central landmark of Bapatla town","latitude":15.902,"longitude":80.4652,"builtin":true},{"id":"builtin_026","name":"Kanipakam Vinayaka Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Chittoor","description":"World-famous Swayambhu Vinayaka temple","latitude":13.2797,"longitude":79.0365,"builtin":true},{"id":"builtin_027","name":"Chittoor Gandhi Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Chittoor","description":"Historic clock tower in Chittoor city","latitude":13.2172,"longitude":79.1003,"builtin":true},{"id":"builtin_028","name":"Kuppam Heritage Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Chittoor","description":"Grand entrance landmark of Kuppam","latitude":12.7493,"longitude":78.3419,"builtin":true},{"id":"builtin_029","name":"Nagari Bugga Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Chittoor","description":"Popular temple near Nagari hills","latitude":13.3206,"longitude":79.5848,"builtin":true},{"id":"builtin_030","name":"Chittoor City Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Chittoor","description":"Major shopping plaza in Chittoor","latitude":13.2106,"longitude":79.0959,"builtin":true},{"id":"builtin_031","name":"Antarvedi Lakshmi Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Dr. B.R. Ambedkar Konaseema","description":"Sacred coastal temple at Godavari-sea confluence","latitude":16.332,"longitude":81.732,"builtin":true},{"id":"builtin_032","name":"Antarvedi Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Dr. B.R. Ambedkar Konaseema","description":"Iconic coastal lighthouse at Antarvedi","latitude":16.327,"longitude":81.726,"builtin":true},{"id":"builtin_033","name":"Ainavilli Siddhi Vinayaka Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Dr. B.R. Ambedkar Konaseema","description":"Famous ancient Ganesha temple in Konaseema","latitude":16.6317,"longitude":82.062,"builtin":true},{"id":"builtin_034","name":"Amalapuram Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Dr. B.R. Ambedkar Konaseema","description":"Central town landmark in Amalapuram","latitude":16.582,"longitude":82.0081,"builtin":true},{"id":"builtin_035","name":"Draksharamam Bhimeswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Dr. B.R. Ambedkar Konaseema","description":"One of the Pancharama Kshetras","latitude":16.7916,"longitude":82.0642,"builtin":true},{"id":"builtin_036","name":"Rajahmundry Godavari Arch","modelType":"Royal Arch Gate","category":"Monument","district":"East Godavari","description":"Iconic gateway overlooking the Godavari bridges","latitude":17.0005,"longitude":81.77,"builtin":true},{"id":"builtin_037","name":"ISKCON Rajahmundry Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"East Godavari","description":"Grand riverfront temple in Rajahmundry","latitude":17.022,"longitude":81.769,"builtin":true},{"id":"builtin_038","name":"Dowleswaram Barrage Monument","modelType":"Heritage Monument","category":"Monument","district":"East Godavari","description":"Sir Arthur Cotton historic barrage memorial","latitude":16.9389,"longitude":81.7806,"builtin":true},{"id":"builtin_039","name":"Rajahmundry Central Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"East Godavari","description":"Premier shopping mall in Rajahmundry","latitude":17.0052,"longitude":81.7876,"builtin":true},{"id":"builtin_040","name":"Rajahmundry Arts College Heritage","modelType":"Heritage Monument","category":"Monument","district":"East Godavari","description":"Historic 19th-century educational landmark","latitude":16.9961,"longitude":81.8073,"builtin":true},{"id":"builtin_041","name":"Dwaraka Tirumala Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Eluru","description":"Chinna Tirupati — famous Venkateswara shrine","latitude":16.9517,"longitude":81.2583,"builtin":true},{"id":"builtin_042","name":"Guntupalli Buddhist Caves","modelType":"Heritage Monument","category":"Monument","district":"Eluru","description":"Ancient rock-cut Buddhist heritage site","latitude":17.0242,"longitude":81.1325,"builtin":true},{"id":"builtin_043","name":"Eluru Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Eluru","description":"Historic landmark in Eluru city center","latitude":16.7107,"longitude":81.0952,"builtin":true},{"id":"builtin_044","name":"Kolleru Bird Sanctuary Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Eluru","description":"Gateway to India's largest freshwater lake","latitude":16.65,"longitude":81.2,"builtin":true},{"id":"builtin_045","name":"Eluru City Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Eluru","description":"Popular shopping hub in Eluru","latitude":16.7146,"longitude":81.1003,"builtin":true},{"id":"builtin_046","name":"Amaravati Amareswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Guntur","description":"Ancient Pancharama Shiva temple in Amaravati","latitude":16.5745,"longitude":80.3578,"builtin":true},{"id":"builtin_047","name":"Amaravati Dhyana Buddha Monument","modelType":"Heritage Monument","category":"Monument","district":"Guntur","description":"Iconic 125-foot Buddha heritage monument","latitude":16.573,"longitude":80.354,"builtin":true},{"id":"builtin_048","name":"Mangalagiri Panakala Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Guntur","description":"Famous hill temple in Mangalagiri","latitude":16.4307,"longitude":80.5681,"builtin":true},{"id":"builtin_049","name":"Guntur Phoenix Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Guntur","description":"Major shopping & entertainment hub in Guntur","latitude":16.3067,"longitude":80.4365,"builtin":true},{"id":"builtin_050","name":"Guntur Jinnah Tower","modelType":"Clock Tower","category":"Tower","district":"Guntur","description":"Famous historic tower landmark in Guntur","latitude":16.2995,"longitude":80.4573,"builtin":true},{"id":"builtin_051","name":"Annavaram Satyanarayana Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Kakinada","description":"Famous hilltop shrine on Ratnagiri","latitude":17.281,"longitude":82.402,"builtin":true},{"id":"builtin_052","name":"Kakinada Hope Island Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Kakinada","description":"Scenic coastal lighthouse near Kakinada Bay","latitude":16.976,"longitude":82.345,"builtin":true},{"id":"builtin_053","name":"SRMT Shopping Mall Kakinada","modelType":"Grand Shopping Mall","category":"Mall","district":"Kakinada","description":"Largest shopping & cinema mall in Kakinada","latitude":16.9891,"longitude":82.2475,"builtin":true},{"id":"builtin_054","name":"Coringa Wildlife Sanctuary Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Kakinada","description":"Gateway to India's second-largest mangrove forest","latitude":16.8167,"longitude":82.2333,"builtin":true},{"id":"builtin_055","name":"Pithapuram Kukkuteswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Kakinada","description":"Sacred Shakti Peetha & Datta Peetham","latitude":17.117,"longitude":82.2521,"builtin":true},{"id":"builtin_056","name":"Machilipatnam Manginapudi Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Krishna","description":"Historic coastal lighthouse near Machilipatnam","latitude":16.238,"longitude":81.242,"builtin":true},{"id":"builtin_057","name":"Machilipatnam Bandar Fort","modelType":"Heritage Monument","category":"Monument","district":"Krishna","description":"Historic port heritage landmark","latitude":16.1866,"longitude":81.1397,"builtin":true},{"id":"builtin_058","name":"Movva Venugopala Swamy Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Krishna","description":"Historic temple of Kshetrayya","latitude":16.256,"longitude":80.935,"builtin":true},{"id":"builtin_059","name":"Kuchipudi Natya Heritage","modelType":"Heritage Monument","category":"Monument","district":"Krishna","description":"Birthplace of classical Kuchipudi dance","latitude":16.245,"longitude":80.985,"builtin":true},{"id":"builtin_060","name":"Gudivada Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Krishna","description":"Central town landmark in Gudivada","latitude":16.4355,"longitude":80.9956,"builtin":true},{"id":"builtin_061","name":"Konda Reddy Fort","modelType":"Heritage Monument","category":"Monument","district":"Kurnool","description":"Iconic 16th-century fort in Kurnool city","latitude":15.8336,"longitude":78.051,"builtin":true},{"id":"builtin_062","name":"Mantralayam Raghavendra Swamy Matha","modelType":"Golden Gopuram Temple","category":"Temple","district":"Kurnool","description":"World-renowned pilgrimage shrine on Tungabhadra","latitude":15.943,"longitude":77.427,"builtin":true},{"id":"builtin_063","name":"Orvakal Rock Garden Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Kurnool","description":"Famous natural quartz rock formations gateway","latitude":15.6917,"longitude":78.1833,"builtin":true},{"id":"builtin_064","name":"Kurnool Outdoor Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"Kurnool","description":"Major sports & cricket stadium in Kurnool","latitude":15.825,"longitude":78.037,"builtin":true},{"id":"builtin_065","name":"Kurnool City Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Kurnool","description":"Popular shopping destination in Kurnool","latitude":15.8312,"longitude":78.0405,"builtin":true},{"id":"builtin_066","name":"Markapur Chennakesava Swamy Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Markapuram","description":"Historic Vijayanagara-era temple in Markapur","latitude":15.735,"longitude":79.27,"builtin":true},{"id":"builtin_067","name":"Tripurantakam Shiva Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Markapuram","description":"Ancient eastern gateway temple to Srisailam","latitude":16.0005,"longitude":79.45,"builtin":true},{"id":"builtin_068","name":"Cumbum Lake Heritage Monument","modelType":"Heritage Monument","category":"Monument","district":"Markapuram","description":"One of Asia's oldest man-made lakes","latitude":15.583,"longitude":79.105,"builtin":true},{"id":"builtin_069","name":"Giddalur Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Markapuram","description":"Central landmark of Giddalur","latitude":15.3775,"longitude":78.9267,"builtin":true},{"id":"builtin_070","name":"Kanigiri Fort Hill","modelType":"Heritage Monument","category":"Monument","district":"Markapuram","description":"Historic hill fort in Kanigiri","latitude":15.405,"longitude":79.5125,"builtin":true},{"id":"builtin_071","name":"Srisailam Mallikarjuna Jyotirlinga","modelType":"Golden Gopuram Temple","category":"Temple","district":"Nandyal","description":"Sacred Jyotirlinga & Shakti Peetha in Nallamala","latitude":16.0738,"longitude":78.8685,"builtin":true},{"id":"builtin_072","name":"Mahanandi Shiva Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Nandyal","description":"Famous perennial-spring Shiva shrine","latitude":15.4714,"longitude":78.6258,"builtin":true},{"id":"builtin_073","name":"Ahobilam Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Nandyal","description":"Sacred Nava Narasimha pilgrimage center","latitude":15.134,"longitude":78.712,"builtin":true},{"id":"builtin_074","name":"Belum Caves Heritage","modelType":"Heritage Monument","category":"Monument","district":"Nandyal","description":"Second-largest natural caves in India","latitude":15.1025,"longitude":78.1114,"builtin":true},{"id":"builtin_075","name":"Nandyal Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Nandyal","description":"Central city landmark in Nandyal","latitude":15.478,"longitude":78.4835,"builtin":true},{"id":"builtin_076","name":"Kanaka Durga Temple Vijayawada","modelType":"Golden Gopuram Temple","category":"Temple","district":"NTR","description":"Iconic Indrakeeladri hill temple in Vijayawada","latitude":16.5156,"longitude":80.6059,"builtin":true},{"id":"builtin_077","name":"PVP Square Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"NTR","description":"Premier shopping & cinema mall in Vijayawada","latitude":16.5034,"longitude":80.6406,"builtin":true},{"id":"builtin_078","name":"Prakasam Barrage Heritage Arch","modelType":"Royal Arch Gate","category":"Monument","district":"NTR","description":"Famous Krishna river barrage in Vijayawada","latitude":16.506,"longitude":80.605,"builtin":true},{"id":"builtin_079","name":"Indira Gandhi Cricket Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"NTR","description":"Historic sports & cricket stadium in Vijayawada","latitude":16.5025,"longitude":80.6435,"builtin":true},{"id":"builtin_080","name":"Kondapalli Fort","modelType":"Heritage Monument","category":"Monument","district":"NTR","description":"14th-century hill fort near Vijayawada","latitude":16.6197,"longitude":80.5414,"builtin":true},{"id":"builtin_081","name":"Kotappakonda Trikoteswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Palnadu","description":"Famous three-peaked hill temple near Narasaraopet","latitude":16.1436,"longitude":80.0414,"builtin":true},{"id":"builtin_082","name":"Nagarjuna Sagar Dam Monument","modelType":"Heritage Monument","category":"Monument","district":"Palnadu","description":"Iconic masonry dam on Krishna river","latitude":16.576,"longitude":79.3125,"builtin":true},{"id":"builtin_083","name":"Ethipothala Waterfalls Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Palnadu","description":"Scenic waterfall viewpoint near Macherla","latitude":16.544,"longitude":79.399,"builtin":true},{"id":"builtin_084","name":"Narasaraopet Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Palnadu","description":"Central landmark of Narasaraopet","latitude":16.2342,"longitude":80.0509,"builtin":true},{"id":"builtin_085","name":"Chilakaluripet Shopping Plaza","modelType":"Grand Shopping Mall","category":"Mall","district":"Palnadu","description":"Popular commercial hub in Chilakaluripet","latitude":16.0896,"longitude":80.1669,"builtin":true},{"id":"builtin_086","name":"Thotapalli Barrage Monument","modelType":"Heritage Monument","category":"Monument","district":"Parvathipuram Manyam","description":"Scenic reservoir & irrigation landmark","latitude":18.789,"longitude":83.489,"builtin":true},{"id":"builtin_087","name":"Parvathipuram Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Parvathipuram Manyam","description":"Central town landmark in Parvathipuram","latitude":18.7833,"longitude":83.4256,"builtin":true},{"id":"builtin_088","name":"Salur Shyamalamba Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Parvathipuram Manyam","description":"Revered local temple in Salur","latitude":18.5167,"longitude":83.2,"builtin":true},{"id":"builtin_089","name":"Palakonda Anjaneya Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Parvathipuram Manyam","description":"Popular temple in Palakonda","latitude":18.6,"longitude":83.75,"builtin":true},{"id":"builtin_090","name":"Kurupam Heritage Palace","modelType":"Heritage Monument","category":"Monument","district":"Parvathipuram Manyam","description":"Historic royal heritage landmark","latitude":18.867,"longitude":83.55,"builtin":true},{"id":"builtin_091","name":"Polavaram Project Dam Monument","modelType":"Heritage Monument","category":"Monument","district":"Polavaram","description":"Major multipurpose Godavari river project","latitude":17.2483,"longitude":81.6431,"builtin":true},{"id":"builtin_092","name":"Pattiseema Veerabhadra Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Polavaram","description":"Famous island temple in the Godavari river","latitude":17.194,"longitude":81.653,"builtin":true},{"id":"builtin_093","name":"Papikondalu Scenic Gateway","modelType":"Royal Arch Gate","category":"Monument","district":"Polavaram","description":"Iconic Godavari gorge hills entrance","latitude":17.43,"longitude":81.53,"builtin":true},{"id":"builtin_094","name":"Jangareddygudem Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Polavaram","description":"Central landmark of Jangareddygudem","latitude":17.1206,"longitude":81.2928,"builtin":true},{"id":"builtin_095","name":"Gubbala Mangamma Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Polavaram","description":"Famous forest cave shrine near Koyyalagudem","latitude":17.265,"longitude":81.39,"builtin":true},{"id":"builtin_096","name":"Ongole Chennakesava Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Prakasam","description":"Historic temple in Ongole city","latitude":15.5057,"longitude":80.0499,"builtin":true},{"id":"builtin_097","name":"Kothapatnam Beach Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Prakasam","description":"Popular coastal beach landmark near Ongole","latitude":15.442,"longitude":80.178,"builtin":true},{"id":"builtin_098","name":"Singarayakonda Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Prakasam","description":"Ancient hilltop Narasimha shrine","latitude":15.249,"longitude":80.032,"builtin":true},{"id":"builtin_099","name":"Ongole City Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Prakasam","description":"Major shopping hub in Ongole","latitude":15.5013,"longitude":80.0434,"builtin":true},{"id":"builtin_100","name":"Ongole Sports Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"Prakasam","description":"Mini cricket & sports stadium in Ongole","latitude":15.512,"longitude":80.052,"builtin":true},{"id":"builtin_101","name":"Ranganatha Swamy Temple Nellore","modelType":"Golden Gopuram Temple","category":"Temple","district":"Sri Potti Sriramulu Nellore","description":"Historic 12th-century temple on Penna river","latitude":14.4565,"longitude":79.983,"builtin":true},{"id":"builtin_102","name":"Mypadu Beach Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Sri Potti Sriramulu Nellore","description":"Popular coastal beach landmark near Nellore","latitude":14.506,"longitude":80.178,"builtin":true},{"id":"builtin_103","name":"MGB Felicity Mall Nellore","modelType":"Grand Shopping Mall","category":"Mall","district":"Sri Potti Sriramulu Nellore","description":"Premier shopping & cinema mall in Nellore","latitude":14.4325,"longitude":79.9975,"builtin":true},{"id":"builtin_104","name":"Narasimha Konda Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Sri Potti Sriramulu Nellore","description":"Famous hilltop Narasimha temple near Nellore","latitude":14.492,"longitude":79.874,"builtin":true},{"id":"builtin_105","name":"AC Subba Reddy Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"Sri Potti Sriramulu Nellore","description":"Major cricket & sports stadium in Nellore","latitude":14.4426,"longitude":79.9865,"builtin":true},{"id":"builtin_106","name":"Puttaparthi Prasanthi Nilayam","modelType":"Heritage Monument","category":"Monument","district":"Sri Sathya Sai","description":"World-renowned spiritual ashram in Puttaparthi","latitude":14.1652,"longitude":77.8117,"builtin":true},{"id":"builtin_107","name":"Lepakshi Veerabhadra Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Sri Sathya Sai","description":"Famous Vijayanagara temple & hanging pillar","latitude":13.8042,"longitude":77.6094,"builtin":true},{"id":"builtin_108","name":"Penukonda Fort Monument","modelType":"Heritage Monument","category":"Monument","district":"Sri Sathya Sai","description":"Historic Vijayanagara capital fort","latitude":14.082,"longitude":77.593,"builtin":true},{"id":"builtin_109","name":"Dharmavaram Silk Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Sri Sathya Sai","description":"Famous silk saree & shopping center","latitude":14.4155,"longitude":77.7188,"builtin":true},{"id":"builtin_110","name":"Hindupur Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Sri Sathya Sai","description":"Central landmark of Hindupur town","latitude":13.8281,"longitude":77.4914,"builtin":true},{"id":"builtin_111","name":"Arasavalli Sun Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Srikakulam","description":"Ancient 7th-century Surya Narayana temple","latitude":18.2844,"longitude":83.9136,"builtin":true},{"id":"builtin_112","name":"Srikurmam Kurmanatha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Srikakulam","description":"Unique temple dedicated to Kurma avatar","latitude":18.2667,"longitude":84.0167,"builtin":true},{"id":"builtin_113","name":"Kalingapatnam Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Srikakulam","description":"Historic coastal lighthouse at Vamsadhara mouth","latitude":18.338,"longitude":84.132,"builtin":true},{"id":"builtin_114","name":"Salihundam Buddhist Heritage","modelType":"Heritage Monument","category":"Monument","district":"Srikakulam","description":"Ancient Buddhist stupas on Vamsadhara hill","latitude":18.333,"longitude":84.051,"builtin":true},{"id":"builtin_115","name":"Srikakulam Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Srikakulam","description":"Central city landmark in Srikakulam","latitude":18.2933,"longitude":83.8992,"builtin":true},{"id":"builtin_116","name":"Tirumala Sri Venkateswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Tirupati","description":"World-famous sacred hill shrine of Lord Venkateswara","latitude":13.6833,"longitude":79.3472,"builtin":true},{"id":"builtin_117","name":"Srikalahasti Shiva Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Tirupati","description":"Famous Vayu Linga Panchabhoota temple","latitude":13.7498,"longitude":79.6984,"builtin":true},{"id":"builtin_118","name":"Chandragiri Fort","modelType":"Heritage Monument","category":"Monument","district":"Tirupati","description":"Historic 11th-century Vijayanagara fort","latitude":13.5833,"longitude":79.3167,"builtin":true},{"id":"builtin_119","name":"Sriharikota Space Gateway","modelType":"Tech Park Skyscraper","category":"Tower","district":"Tirupati","description":"Satish Dhawan Space Centre landmark","latitude":13.72,"longitude":80.226,"builtin":true},{"id":"builtin_120","name":"Tirupati South India Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Tirupati","description":"Major shopping center in Tirupati city","latitude":13.6288,"longitude":79.4192,"builtin":true},{"id":"builtin_121","name":"ACA-VDCA Cricket Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"Visakhapatnam","description":"International cricket stadium in Visakhapatnam","latitude":17.7975,"longitude":83.3522,"builtin":true},{"id":"builtin_122","name":"Simhachalam Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Visakhapatnam","description":"Famous 11th-century hill temple in Vizag","latitude":17.7664,"longitude":83.2504,"builtin":true},{"id":"builtin_123","name":"Dolphin's Nose Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Visakhapatnam","description":"Iconic coastal lighthouse overlooking Vizag Port","latitude":17.6766,"longitude":83.2938,"builtin":true},{"id":"builtin_124","name":"CMR Central Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Visakhapatnam","description":"Premier shopping & entertainment mall in Vizag","latitude":17.7346,"longitude":83.3186,"builtin":true},{"id":"builtin_125","name":"Rushikonda IT Tech Park","modelType":"Tech Park Skyscraper","category":"Tower","district":"Visakhapatnam","description":"Modern IT & tech hub on Vizag coast","latitude":17.798,"longitude":83.382,"builtin":true},{"id":"builtin_126","name":"Vizianagaram Fort","modelType":"Heritage Monument","category":"Monument","district":"Vizianagaram","description":"Historic 18th-century royal fort","latitude":18.1124,"longitude":83.4095,"builtin":true},{"id":"builtin_127","name":"Pydithalli Ammavari Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Vizianagaram","description":"Famous Sirimanotsavam temple in Vizianagaram","latitude":18.1145,"longitude":83.406,"builtin":true},{"id":"builtin_128","name":"Ramatheertham Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Vizianagaram","description":"Ancient hilltop Rama & Buddhist heritage site","latitude":18.165,"longitude":83.489,"builtin":true},{"id":"builtin_129","name":"Vizianagaram Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Vizianagaram","description":"Historic town center clock tower","latitude":18.1165,"longitude":83.405,"builtin":true},{"id":"builtin_130","name":"Bobbili Fort Monument","modelType":"Heritage Monument","category":"Monument","district":"Vizianagaram","description":"Historic royal fort in Bobbili","latitude":18.5738,"longitude":83.3518,"builtin":true},{"id":"builtin_131","name":"Bhimavaram Somarama Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"West Godavari","description":"Sacred Pancharama Shiva shrine in Bhimavaram","latitude":16.5449,"longitude":81.5212,"builtin":true},{"id":"builtin_132","name":"Palakollu Ksheerarama Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"West Godavari","description":"Famous Pancharama temple with tallest gopuram","latitude":16.5178,"longitude":81.7299,"builtin":true},{"id":"builtin_133","name":"Bhimavaram Central Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"West Godavari","description":"Popular shopping hub in Bhimavaram","latitude":16.54,"longitude":81.523,"builtin":true},{"id":"builtin_134","name":"Narasapuram Godavari Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"West Godavari","description":"Scenic river-mouth landmark in Narasapuram","latitude":16.4344,"longitude":81.6977,"builtin":true},{"id":"builtin_135","name":"Tanuku Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"West Godavari","description":"Central landmark of Tanuku town","latitude":16.7544,"longitude":81.6814,"builtin":true},{"id":"builtin_136","name":"Gandikota Grand Canyon Fort","modelType":"Heritage Monument","category":"Monument","district":"YSR Kadapa","description":"Grand Canyon of India & historic fort","latitude":14.815,"longitude":78.2869,"builtin":true},{"id":"builtin_137","name":"Vontimitta Kodandarama Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"YSR Kadapa","description":"Iconic Chola-Vijayanagara Rama temple","latitude":14.3939,"longitude":79.0267,"builtin":true},{"id":"builtin_138","name":"Ameen Peer Dargah Heritage","modelType":"Heritage Monument","category":"Monument","district":"YSR Kadapa","description":"Famous 300-year-old Sufi shrine in Kadapa","latitude":14.4749,"longitude":78.8254,"builtin":true},{"id":"builtin_139","name":"YSR Cricket Stadium Kadapa","modelType":"Cricket Stadium","category":"Stadium","district":"YSR Kadapa","description":"Major cricket stadium in Kadapa","latitude":14.455,"longitude":78.815,"builtin":true},{"id":"builtin_140","name":"Proddatur Gold & Shopping Plaza","modelType":"Grand Shopping Mall","category":"Mall","district":"YSR Kadapa","description":"Famous gold & shopping hub in Proddatur","latitude":14.7502,"longitude":78.5492,"builtin":true}];

async function loadLandmarks() {
  const builtins = BUILTIN_LANDMARKS;
  let custom = [];
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'landmarks'));
      custom = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn('Could not load custom Firestore landmarks:', err?.message || err);
    }
  }
  allLandmarks = [...custom, ...builtins];
  renderLandmarkMarkers();
}

const MIN_HOUSE_MARKER_ZOOM = 11.5;
const MIN_LANDMARK_MARKER_ZOOM = 9.0;

function updateMarkerVisibility() {
  if (!map) return;
  const z = map.getZoom();
  const showHouses = z >= MIN_HOUSE_MARKER_ZOOM;
  const showLandmarks = z >= MIN_LANDMARK_MARKER_ZOOM;
  for (const m of houseMarkers) {
    const el = m.getElement();
    if (el) el.classList.toggle('hidden-zoom', !showHouses);
  }
  for (const m of landmarkMarkers) {
    const el = m.getElement();
    if (el) el.classList.toggle('hidden-zoom', !showLandmarks);
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

  function runTopSearch(showEmptyMessage = false) {
    const raw = input.value.trim().replace(/^@+/, '').toLowerCase();
    if (!raw) {
      if (showEmptyMessage) {
        dropdown.hidden = false;
        const combined = [
          ...allLandmarks.slice(0, 6).map((lm) => ({ kind: 'landmark', data: lm })),
          ...allHouses.slice(0, 8).map((h) => ({ kind: 'house', data: h }))
        ];
        if (!combined.length) {
          dropdown.innerHTML = '<div class="sr-item muted">No player houses or popular places yet.</div>';
        } else {
          renderSearchResults(combined);
        }
      } else {
        dropdown.hidden = true;
      }
      return;
    }

    const landmarkMatches = allLandmarks.filter((lm) => {
      return [lm.name, lm.modelType, lm.category, lm.district, lm.description]
        .some((v) => String(v || '').toLowerCase().includes(raw));
    }).slice(0, 6).map((lm) => ({ kind: 'landmark', data: lm }));

    const houseMatches = allHouses.filter((h) => {
      const norm = String(h.normalizedUsername || '').toLowerCase();
      const disp = String(h.displayUsername || '').toLowerCase();
      return norm.includes(raw) || disp.includes(raw);
    }).slice(0, 10).map((h) => ({ kind: 'house', data: h }));

    const combined = [...landmarkMatches, ...houseMatches];
    dropdown.hidden = false;
    if (!combined.length) {
      dropdown.innerHTML = `<div class="sr-item muted">No username or popular place found for "${escapeHtml(raw)}".</div>`;
      return;
    }
    renderSearchResults(combined);
  }

  function renderSearchResults(items) {
    dropdown.innerHTML = items.map((item, idx) => {
      if (item.kind === 'landmark') {
        const lm = item.data;
        const meta = getLandmarkMeta(lm.modelType);
        return `
          <button type="button" class="sr-item" data-sidx="${idx}">
            <b>${meta.icon} ${escapeHtml(lm.name)}</b>
            <small>POPULAR PLACE · ${escapeHtml(lm.modelType)} · ${escapeHtml(lm.district || 'Andhra Pradesh')}</small>
          </button>
        `;
      }
      const h = item.data;
      return `
        <button type="button" class="sr-item" data-sidx="${idx}">
          <b>@${escapeHtml(h.displayUsername || h.normalizedUsername)}</b>
          <small>🏠 ${escapeHtml(h.houseDesign)} · ${escapeHtml(h.placeName)}, ${escapeHtml(h.district)}</small>
        </button>
      `;
    }).join('');

    dropdown.querySelectorAll('.sr-item[data-sidx]').forEach((el) => {
      el.onclick = () => {
        const picked = items[Number(el.dataset.sidx)];
        dropdown.hidden = true;
        closePanel();
        stopPlacementMode();
        if (picked.kind === 'landmark') {
          const lm = picked.data;
          input.value = lm.name;
          if (map && Number.isFinite(lm.latitude) && Number.isFinite(lm.longitude)) {
            map.flyTo({ center: [lm.longitude, lm.latitude], zoom: 16.0, pitch: 60, duration: 1400 });
            toast(`Visiting ${lm.name}`);
          }
        } else {
          const house = picked.data;
          input.value = '@' + (house.displayUsername || house.normalizedUsername);
          if (map && Number.isFinite(house.latitude) && Number.isFinite(house.longitude)) {
            map.flyTo({ center: [house.longitude, house.latitude], zoom: 16.0, pitch: 60, duration: 1400 });
            toast(`Visiting @${house.displayUsername || house.normalizedUsername}'s ${house.houseDesign}`);
          }
        }
      };
    });
  }

  btn.onclick = () => runTopSearch(true);
  input.addEventListener('input', () => runTopSearch(false));
  input.addEventListener('focus', () => {
    if (input.value.trim().length > 0) runTopSearch(false);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runTopSearch(true);
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
    loadLandmarks();
    if (db) loadHouses();
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
