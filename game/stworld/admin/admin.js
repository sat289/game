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
    const builtinLm = [{"id":"builtin_001","name":"Araku Tribal Museum","modelType":"Heritage Monument","category":"Monument","district":"Alluri Sitharama Raju","description":"Famous tribal heritage museum in Araku Valley","latitude":18.3274,"longitude":82.8775,"builtin":true},{"id":"builtin_002","name":"Borra Caves","modelType":"Heritage Monument","category":"Monument","district":"Alluri Sitharama Raju","description":"Iconic limestone caves in Ananthagiri hills","latitude":18.2806,"longitude":83.0389,"builtin":true},{"id":"builtin_003","name":"Paderu Modakondamma Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Alluri Sitharama Raju","description":"Revered hill shrine in Paderu","latitude":18.0815,"longitude":82.6625,"builtin":true},{"id":"builtin_004","name":"Lambasingi Viewpoint Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Alluri Sitharama Raju","description":"Kashmir of Andhra Pradesh scenic gateway","latitude":17.8194,"longitude":82.4936,"builtin":true},{"id":"builtin_005","name":"Rampachodavaram Shiva Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Alluri Sitharama Raju","description":"Popular forest temple in Rampachodavaram","latitude":17.4417,"longitude":81.7764,"builtin":true},{"id":"builtin_006","name":"Bojjannakonda Buddhist Heritage","modelType":"Heritage Monument","category":"Monument","district":"Anakapalli","description":"Ancient rock-cut Buddhist stupas near Anakapalli","latitude":17.7115,"longitude":83.0156,"builtin":true},{"id":"builtin_007","name":"Nookambika Ammavari Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Anakapalli","description":"Historic Shakti temple in Anakapalli","latitude":17.6852,"longitude":83.0014,"builtin":true},{"id":"builtin_008","name":"Pudimadaka Coastal Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Anakapalli","description":"Scenic coastal lighthouse at Pudimadaka","latitude":17.493,"longitude":83.004,"builtin":true},{"id":"builtin_009","name":"Anakapalli Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Anakapalli","description":"Central town landmark in Anakapalli","latitude":17.6913,"longitude":83.0039,"builtin":true},{"id":"builtin_010","name":"Narsipatnam Shopping Plaza","modelType":"Grand Shopping Mall","category":"Mall","district":"Anakapalli","description":"Major commercial hub in Narsipatnam","latitude":17.6665,"longitude":82.6129,"builtin":true},{"id":"builtin_011","name":"Anantapur Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Ananthapuramu","description":"Iconic historic clock tower in Anantapur city","latitude":14.6819,"longitude":77.6006,"builtin":true},{"id":"builtin_012","name":"Gooty Fort Monument","modelType":"Heritage Monument","category":"Monument","district":"Ananthapuramu","description":"Ancient hill fort in Gooty","latitude":15.1194,"longitude":77.6383,"builtin":true},{"id":"builtin_013","name":"Tadipatri Bugga Ramalingeswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Ananthapuramu","description":"Vijayanagara-era temple on Penna river","latitude":14.9135,"longitude":78.0092,"builtin":true},{"id":"builtin_014","name":"Anantapur Cricket Stadium (RDT)","modelType":"Cricket Stadium","category":"Stadium","district":"Ananthapuramu","description":"Rural Development Trust Cricket Stadium","latitude":14.6645,"longitude":77.596,"builtin":true},{"id":"builtin_015","name":"Anantapur Central Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Ananthapuramu","description":"Popular shopping destination in Anantapur","latitude":14.6789,"longitude":77.6066,"builtin":true},{"id":"builtin_016","name":"Horsley Hills Gateway Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Annamayya","description":"Scenic hill station entrance near Madanapalle","latitude":13.6587,"longitude":78.4008,"builtin":true},{"id":"builtin_017","name":"Tallapaka Annamacharya Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Annamayya","description":"Birthplace & temple of Saint Annamacharya","latitude":14.2345,"longitude":79.1462,"builtin":true},{"id":"builtin_018","name":"Rayachoti Veerabhadra Swamy Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Annamayya","description":"Famous ancient temple in Rayachoti","latitude":14.0552,"longitude":78.7499,"builtin":true},{"id":"builtin_019","name":"Madanapalle Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Annamayya","description":"Historic town center landmark in Madanapalle","latitude":13.5516,"longitude":78.5023,"builtin":true},{"id":"builtin_020","name":"Gurramkonda Fort","modelType":"Heritage Monument","category":"Monument","district":"Annamayya","description":"Historic hilltop fort in Annamayya district","latitude":13.7817,"longitude":78.5836,"builtin":true},{"id":"builtin_021","name":"Bhavanarayana Swamy Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Bapatla","description":"Ancient Chola-era temple in Bapatla","latitude":15.9044,"longitude":80.4675,"builtin":true},{"id":"builtin_022","name":"Suryalanka Beach Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Bapatla","description":"Popular coastal beach landmark near Bapatla","latitude":15.839,"longitude":80.506,"builtin":true},{"id":"builtin_023","name":"Vodarevu Coastal Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Bapatla","description":"Scenic lighthouse at Vodarevu Beach, Chirala","latitude":15.795,"longitude":80.415,"builtin":true},{"id":"builtin_024","name":"Chirala Textile Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Bapatla","description":"Famous handloom & shopping center in Chirala","latitude":15.8247,"longitude":80.3506,"builtin":true},{"id":"builtin_025","name":"Bapatla Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Bapatla","description":"Central landmark of Bapatla town","latitude":15.902,"longitude":80.4652,"builtin":true},{"id":"builtin_026","name":"Kanipakam Vinayaka Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Chittoor","description":"World-famous Swayambhu Vinayaka temple","latitude":13.2797,"longitude":79.0365,"builtin":true},{"id":"builtin_027","name":"Chittoor Gandhi Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Chittoor","description":"Historic clock tower in Chittoor city","latitude":13.2172,"longitude":79.1003,"builtin":true},{"id":"builtin_028","name":"Kuppam Heritage Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Chittoor","description":"Grand entrance landmark of Kuppam","latitude":12.7493,"longitude":78.3419,"builtin":true},{"id":"builtin_029","name":"Nagari Bugga Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Chittoor","description":"Popular temple near Nagari hills","latitude":13.3206,"longitude":79.5848,"builtin":true},{"id":"builtin_030","name":"Chittoor City Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Chittoor","description":"Major shopping plaza in Chittoor","latitude":13.2106,"longitude":79.0959,"builtin":true},{"id":"builtin_031","name":"Antarvedi Lakshmi Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Dr. B.R. Ambedkar Konaseema","description":"Sacred coastal temple at Godavari-sea confluence","latitude":16.332,"longitude":81.732,"builtin":true},{"id":"builtin_032","name":"Antarvedi Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Dr. B.R. Ambedkar Konaseema","description":"Iconic coastal lighthouse at Antarvedi","latitude":16.327,"longitude":81.726,"builtin":true},{"id":"builtin_033","name":"Ainavilli Siddhi Vinayaka Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Dr. B.R. Ambedkar Konaseema","description":"Famous ancient Ganesha temple in Konaseema","latitude":16.6317,"longitude":82.062,"builtin":true},{"id":"builtin_034","name":"Amalapuram Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Dr. B.R. Ambedkar Konaseema","description":"Central town landmark in Amalapuram","latitude":16.582,"longitude":82.0081,"builtin":true},{"id":"builtin_035","name":"Draksharamam Bhimeswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Dr. B.R. Ambedkar Konaseema","description":"One of the Pancharama Kshetras","latitude":16.7916,"longitude":82.0642,"builtin":true},{"id":"builtin_036","name":"Rajahmundry Godavari Arch","modelType":"Royal Arch Gate","category":"Monument","district":"East Godavari","description":"Iconic gateway overlooking the Godavari bridges","latitude":17.0005,"longitude":81.77,"builtin":true},{"id":"builtin_037","name":"ISKCON Rajahmundry Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"East Godavari","description":"Grand riverfront temple in Rajahmundry","latitude":17.022,"longitude":81.769,"builtin":true},{"id":"builtin_038","name":"Dowleswaram Barrage Monument","modelType":"Heritage Monument","category":"Monument","district":"East Godavari","description":"Sir Arthur Cotton historic barrage memorial","latitude":16.9389,"longitude":81.7806,"builtin":true},{"id":"builtin_039","name":"Rajahmundry Central Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"East Godavari","description":"Premier shopping mall in Rajahmundry","latitude":17.0052,"longitude":81.7876,"builtin":true},{"id":"builtin_040","name":"Rajahmundry Arts College Heritage","modelType":"Heritage Monument","category":"Monument","district":"East Godavari","description":"Historic 19th-century educational landmark","latitude":16.9961,"longitude":81.8073,"builtin":true},{"id":"builtin_041","name":"Dwaraka Tirumala Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Eluru","description":"Chinna Tirupati — famous Venkateswara shrine","latitude":16.9517,"longitude":81.2583,"builtin":true},{"id":"builtin_042","name":"Guntupalli Buddhist Caves","modelType":"Heritage Monument","category":"Monument","district":"Eluru","description":"Ancient rock-cut Buddhist heritage site","latitude":17.0242,"longitude":81.1325,"builtin":true},{"id":"builtin_043","name":"Eluru Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Eluru","description":"Historic landmark in Eluru city center","latitude":16.7107,"longitude":81.0952,"builtin":true},{"id":"builtin_044","name":"Kolleru Bird Sanctuary Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Eluru","description":"Gateway to India's largest freshwater lake","latitude":16.65,"longitude":81.2,"builtin":true},{"id":"builtin_045","name":"Eluru City Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Eluru","description":"Popular shopping hub in Eluru","latitude":16.7146,"longitude":81.1003,"builtin":true},{"id":"builtin_046","name":"Amaravati Amareswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Guntur","description":"Ancient Pancharama Shiva temple in Amaravati","latitude":16.5745,"longitude":80.3578,"builtin":true},{"id":"builtin_047","name":"Amaravati Dhyana Buddha Monument","modelType":"Heritage Monument","category":"Monument","district":"Guntur","description":"Iconic 125-foot Buddha heritage monument","latitude":16.573,"longitude":80.354,"builtin":true},{"id":"builtin_048","name":"Mangalagiri Panakala Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Guntur","description":"Famous hill temple in Mangalagiri","latitude":16.4307,"longitude":80.5681,"builtin":true},{"id":"builtin_049","name":"Guntur Phoenix Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Guntur","description":"Major shopping & entertainment hub in Guntur","latitude":16.3067,"longitude":80.4365,"builtin":true},{"id":"builtin_050","name":"Guntur Jinnah Tower","modelType":"Clock Tower","category":"Tower","district":"Guntur","description":"Famous historic tower landmark in Guntur","latitude":16.2995,"longitude":80.4573,"builtin":true},{"id":"builtin_051","name":"Annavaram Satyanarayana Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Kakinada","description":"Famous hilltop shrine on Ratnagiri","latitude":17.281,"longitude":82.402,"builtin":true},{"id":"builtin_052","name":"Kakinada Hope Island Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Kakinada","description":"Scenic coastal lighthouse near Kakinada Bay","latitude":16.976,"longitude":82.345,"builtin":true},{"id":"builtin_053","name":"SRMT Shopping Mall Kakinada","modelType":"Grand Shopping Mall","category":"Mall","district":"Kakinada","description":"Largest shopping & cinema mall in Kakinada","latitude":16.9891,"longitude":82.2475,"builtin":true},{"id":"builtin_054","name":"Coringa Wildlife Sanctuary Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Kakinada","description":"Gateway to India's second-largest mangrove forest","latitude":16.8167,"longitude":82.2333,"builtin":true},{"id":"builtin_055","name":"Pithapuram Kukkuteswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Kakinada","description":"Sacred Shakti Peetha & Datta Peetham","latitude":17.117,"longitude":82.2521,"builtin":true},{"id":"builtin_056","name":"Machilipatnam Manginapudi Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Krishna","description":"Historic coastal lighthouse near Machilipatnam","latitude":16.238,"longitude":81.242,"builtin":true},{"id":"builtin_057","name":"Machilipatnam Bandar Fort","modelType":"Heritage Monument","category":"Monument","district":"Krishna","description":"Historic port heritage landmark","latitude":16.1866,"longitude":81.1397,"builtin":true},{"id":"builtin_058","name":"Movva Venugopala Swamy Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Krishna","description":"Historic temple of Kshetrayya","latitude":16.256,"longitude":80.935,"builtin":true},{"id":"builtin_059","name":"Kuchipudi Natya Heritage","modelType":"Heritage Monument","category":"Monument","district":"Krishna","description":"Birthplace of classical Kuchipudi dance","latitude":16.245,"longitude":80.985,"builtin":true},{"id":"builtin_060","name":"Gudivada Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Krishna","description":"Central town landmark in Gudivada","latitude":16.4355,"longitude":80.9956,"builtin":true},{"id":"builtin_061","name":"Konda Reddy Fort","modelType":"Heritage Monument","category":"Monument","district":"Kurnool","description":"Iconic 16th-century fort in Kurnool city","latitude":15.8336,"longitude":78.051,"builtin":true},{"id":"builtin_062","name":"Mantralayam Raghavendra Swamy Matha","modelType":"Golden Gopuram Temple","category":"Temple","district":"Kurnool","description":"World-renowned pilgrimage shrine on Tungabhadra","latitude":15.943,"longitude":77.427,"builtin":true},{"id":"builtin_063","name":"Orvakal Rock Garden Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Kurnool","description":"Famous natural quartz rock formations gateway","latitude":15.6917,"longitude":78.1833,"builtin":true},{"id":"builtin_064","name":"Kurnool Outdoor Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"Kurnool","description":"Major sports & cricket stadium in Kurnool","latitude":15.825,"longitude":78.037,"builtin":true},{"id":"builtin_065","name":"Kurnool City Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Kurnool","description":"Popular shopping destination in Kurnool","latitude":15.8312,"longitude":78.0405,"builtin":true},{"id":"builtin_066","name":"Markapur Chennakesava Swamy Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Markapuram","description":"Historic Vijayanagara-era temple in Markapur","latitude":15.735,"longitude":79.27,"builtin":true},{"id":"builtin_067","name":"Tripurantakam Shiva Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Markapuram","description":"Ancient eastern gateway temple to Srisailam","latitude":16.0005,"longitude":79.45,"builtin":true},{"id":"builtin_068","name":"Cumbum Lake Heritage Monument","modelType":"Heritage Monument","category":"Monument","district":"Markapuram","description":"One of Asia's oldest man-made lakes","latitude":15.583,"longitude":79.105,"builtin":true},{"id":"builtin_069","name":"Giddalur Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Markapuram","description":"Central landmark of Giddalur","latitude":15.3775,"longitude":78.9267,"builtin":true},{"id":"builtin_070","name":"Kanigiri Fort Hill","modelType":"Heritage Monument","category":"Monument","district":"Markapuram","description":"Historic hill fort in Kanigiri","latitude":15.405,"longitude":79.5125,"builtin":true},{"id":"builtin_071","name":"Srisailam Mallikarjuna Jyotirlinga","modelType":"Golden Gopuram Temple","category":"Temple","district":"Nandyal","description":"Sacred Jyotirlinga & Shakti Peetha in Nallamala","latitude":16.0738,"longitude":78.8685,"builtin":true},{"id":"builtin_072","name":"Mahanandi Shiva Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Nandyal","description":"Famous perennial-spring Shiva shrine","latitude":15.4714,"longitude":78.6258,"builtin":true},{"id":"builtin_073","name":"Ahobilam Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Nandyal","description":"Sacred Nava Narasimha pilgrimage center","latitude":15.134,"longitude":78.712,"builtin":true},{"id":"builtin_074","name":"Belum Caves Heritage","modelType":"Heritage Monument","category":"Monument","district":"Nandyal","description":"Second-largest natural caves in India","latitude":15.1025,"longitude":78.1114,"builtin":true},{"id":"builtin_075","name":"Nandyal Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Nandyal","description":"Central city landmark in Nandyal","latitude":15.478,"longitude":78.4835,"builtin":true},{"id":"builtin_076","name":"Kanaka Durga Temple Vijayawada","modelType":"Golden Gopuram Temple","category":"Temple","district":"NTR","description":"Iconic Indrakeeladri hill temple in Vijayawada","latitude":16.5156,"longitude":80.6059,"builtin":true},{"id":"builtin_077","name":"PVP Square Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"NTR","description":"Premier shopping & cinema mall in Vijayawada","latitude":16.5034,"longitude":80.6406,"builtin":true},{"id":"builtin_078","name":"Prakasam Barrage Heritage Arch","modelType":"Royal Arch Gate","category":"Monument","district":"NTR","description":"Famous Krishna river barrage in Vijayawada","latitude":16.506,"longitude":80.605,"builtin":true},{"id":"builtin_079","name":"Indira Gandhi Cricket Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"NTR","description":"Historic sports & cricket stadium in Vijayawada","latitude":16.5025,"longitude":80.6435,"builtin":true},{"id":"builtin_080","name":"Kondapalli Fort","modelType":"Heritage Monument","category":"Monument","district":"NTR","description":"14th-century hill fort near Vijayawada","latitude":16.6197,"longitude":80.5414,"builtin":true},{"id":"builtin_081","name":"Kotappakonda Trikoteswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Palnadu","description":"Famous three-peaked hill temple near Narasaraopet","latitude":16.1436,"longitude":80.0414,"builtin":true},{"id":"builtin_082","name":"Nagarjuna Sagar Dam Monument","modelType":"Heritage Monument","category":"Monument","district":"Palnadu","description":"Iconic masonry dam on Krishna river","latitude":16.576,"longitude":79.3125,"builtin":true},{"id":"builtin_083","name":"Ethipothala Waterfalls Arch","modelType":"Royal Arch Gate","category":"Monument","district":"Palnadu","description":"Scenic waterfall viewpoint near Macherla","latitude":16.544,"longitude":79.399,"builtin":true},{"id":"builtin_084","name":"Narasaraopet Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Palnadu","description":"Central landmark of Narasaraopet","latitude":16.2342,"longitude":80.0509,"builtin":true},{"id":"builtin_085","name":"Chilakaluripet Shopping Plaza","modelType":"Grand Shopping Mall","category":"Mall","district":"Palnadu","description":"Popular commercial hub in Chilakaluripet","latitude":16.0896,"longitude":80.1669,"builtin":true},{"id":"builtin_086","name":"Thotapalli Barrage Monument","modelType":"Heritage Monument","category":"Monument","district":"Parvathipuram Manyam","description":"Scenic reservoir & irrigation landmark","latitude":18.789,"longitude":83.489,"builtin":true},{"id":"builtin_087","name":"Parvathipuram Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Parvathipuram Manyam","description":"Central town landmark in Parvathipuram","latitude":18.7833,"longitude":83.4256,"builtin":true},{"id":"builtin_088","name":"Salur Shyamalamba Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Parvathipuram Manyam","description":"Revered local temple in Salur","latitude":18.5167,"longitude":83.2,"builtin":true},{"id":"builtin_089","name":"Palakonda Anjaneya Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Parvathipuram Manyam","description":"Popular temple in Palakonda","latitude":18.6,"longitude":83.75,"builtin":true},{"id":"builtin_090","name":"Kurupam Heritage Palace","modelType":"Heritage Monument","category":"Monument","district":"Parvathipuram Manyam","description":"Historic royal heritage landmark","latitude":18.867,"longitude":83.55,"builtin":true},{"id":"builtin_091","name":"Polavaram Project Dam Monument","modelType":"Heritage Monument","category":"Monument","district":"Polavaram","description":"Major multipurpose Godavari river project","latitude":17.2483,"longitude":81.6431,"builtin":true},{"id":"builtin_092","name":"Pattiseema Veerabhadra Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Polavaram","description":"Famous island temple in the Godavari river","latitude":17.194,"longitude":81.653,"builtin":true},{"id":"builtin_093","name":"Papikondalu Scenic Gateway","modelType":"Royal Arch Gate","category":"Monument","district":"Polavaram","description":"Iconic Godavari gorge hills entrance","latitude":17.43,"longitude":81.53,"builtin":true},{"id":"builtin_094","name":"Jangareddygudem Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Polavaram","description":"Central landmark of Jangareddygudem","latitude":17.1206,"longitude":81.2928,"builtin":true},{"id":"builtin_095","name":"Gubbala Mangamma Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Polavaram","description":"Famous forest cave shrine near Koyyalagudem","latitude":17.265,"longitude":81.39,"builtin":true},{"id":"builtin_096","name":"Ongole Chennakesava Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Prakasam","description":"Historic temple in Ongole city","latitude":15.5057,"longitude":80.0499,"builtin":true},{"id":"builtin_097","name":"Kothapatnam Beach Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Prakasam","description":"Popular coastal beach landmark near Ongole","latitude":15.442,"longitude":80.178,"builtin":true},{"id":"builtin_098","name":"Singarayakonda Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Prakasam","description":"Ancient hilltop Narasimha shrine","latitude":15.249,"longitude":80.032,"builtin":true},{"id":"builtin_099","name":"Ongole City Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Prakasam","description":"Major shopping hub in Ongole","latitude":15.5013,"longitude":80.0434,"builtin":true},{"id":"builtin_100","name":"Ongole Sports Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"Prakasam","description":"Mini cricket & sports stadium in Ongole","latitude":15.512,"longitude":80.052,"builtin":true},{"id":"builtin_101","name":"Ranganatha Swamy Temple Nellore","modelType":"Golden Gopuram Temple","category":"Temple","district":"Sri Potti Sriramulu Nellore","description":"Historic 12th-century temple on Penna river","latitude":14.4565,"longitude":79.983,"builtin":true},{"id":"builtin_102","name":"Mypadu Beach Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Sri Potti Sriramulu Nellore","description":"Popular coastal beach landmark near Nellore","latitude":14.506,"longitude":80.178,"builtin":true},{"id":"builtin_103","name":"MGB Felicity Mall Nellore","modelType":"Grand Shopping Mall","category":"Mall","district":"Sri Potti Sriramulu Nellore","description":"Premier shopping & cinema mall in Nellore","latitude":14.4325,"longitude":79.9975,"builtin":true},{"id":"builtin_104","name":"Narasimha Konda Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Sri Potti Sriramulu Nellore","description":"Famous hilltop Narasimha temple near Nellore","latitude":14.492,"longitude":79.874,"builtin":true},{"id":"builtin_105","name":"AC Subba Reddy Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"Sri Potti Sriramulu Nellore","description":"Major cricket & sports stadium in Nellore","latitude":14.4426,"longitude":79.9865,"builtin":true},{"id":"builtin_106","name":"Puttaparthi Prasanthi Nilayam","modelType":"Heritage Monument","category":"Monument","district":"Sri Sathya Sai","description":"World-renowned spiritual ashram in Puttaparthi","latitude":14.1652,"longitude":77.8117,"builtin":true},{"id":"builtin_107","name":"Lepakshi Veerabhadra Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Sri Sathya Sai","description":"Famous Vijayanagara temple & hanging pillar","latitude":13.8042,"longitude":77.6094,"builtin":true},{"id":"builtin_108","name":"Penukonda Fort Monument","modelType":"Heritage Monument","category":"Monument","district":"Sri Sathya Sai","description":"Historic Vijayanagara capital fort","latitude":14.082,"longitude":77.593,"builtin":true},{"id":"builtin_109","name":"Dharmavaram Silk Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Sri Sathya Sai","description":"Famous silk saree & shopping center","latitude":14.4155,"longitude":77.7188,"builtin":true},{"id":"builtin_110","name":"Hindupur Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Sri Sathya Sai","description":"Central landmark of Hindupur town","latitude":13.8281,"longitude":77.4914,"builtin":true},{"id":"builtin_111","name":"Arasavalli Sun Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Srikakulam","description":"Ancient 7th-century Surya Narayana temple","latitude":18.2844,"longitude":83.9136,"builtin":true},{"id":"builtin_112","name":"Srikurmam Kurmanatha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Srikakulam","description":"Unique temple dedicated to Kurma avatar","latitude":18.2667,"longitude":84.0167,"builtin":true},{"id":"builtin_113","name":"Kalingapatnam Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Srikakulam","description":"Historic coastal lighthouse at Vamsadhara mouth","latitude":18.338,"longitude":84.132,"builtin":true},{"id":"builtin_114","name":"Salihundam Buddhist Heritage","modelType":"Heritage Monument","category":"Monument","district":"Srikakulam","description":"Ancient Buddhist stupas on Vamsadhara hill","latitude":18.333,"longitude":84.051,"builtin":true},{"id":"builtin_115","name":"Srikakulam Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Srikakulam","description":"Central city landmark in Srikakulam","latitude":18.2933,"longitude":83.8992,"builtin":true},{"id":"builtin_116","name":"Tirumala Sri Venkateswara Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Tirupati","description":"World-famous sacred hill shrine of Lord Venkateswara","latitude":13.6833,"longitude":79.3472,"builtin":true},{"id":"builtin_117","name":"Srikalahasti Shiva Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Tirupati","description":"Famous Vayu Linga Panchabhoota temple","latitude":13.7498,"longitude":79.6984,"builtin":true},{"id":"builtin_118","name":"Chandragiri Fort","modelType":"Heritage Monument","category":"Monument","district":"Tirupati","description":"Historic 11th-century Vijayanagara fort","latitude":13.5833,"longitude":79.3167,"builtin":true},{"id":"builtin_119","name":"Sriharikota Space Gateway","modelType":"Tech Park Skyscraper","category":"Tower","district":"Tirupati","description":"Satish Dhawan Space Centre landmark","latitude":13.72,"longitude":80.226,"builtin":true},{"id":"builtin_120","name":"Tirupati South India Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Tirupati","description":"Major shopping center in Tirupati city","latitude":13.6288,"longitude":79.4192,"builtin":true},{"id":"builtin_121","name":"ACA-VDCA Cricket Stadium","modelType":"Cricket Stadium","category":"Stadium","district":"Visakhapatnam","description":"International cricket stadium in Visakhapatnam","latitude":17.7975,"longitude":83.3522,"builtin":true},{"id":"builtin_122","name":"Simhachalam Narasimha Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Visakhapatnam","description":"Famous 11th-century hill temple in Vizag","latitude":17.7664,"longitude":83.2504,"builtin":true},{"id":"builtin_123","name":"Dolphin's Nose Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"Visakhapatnam","description":"Iconic coastal lighthouse overlooking Vizag Port","latitude":17.6766,"longitude":83.2938,"builtin":true},{"id":"builtin_124","name":"CMR Central Shopping Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"Visakhapatnam","description":"Premier shopping & entertainment mall in Vizag","latitude":17.7346,"longitude":83.3186,"builtin":true},{"id":"builtin_125","name":"Rushikonda IT Tech Park","modelType":"Tech Park Skyscraper","category":"Tower","district":"Visakhapatnam","description":"Modern IT & tech hub on Vizag coast","latitude":17.798,"longitude":83.382,"builtin":true},{"id":"builtin_126","name":"Vizianagaram Fort","modelType":"Heritage Monument","category":"Monument","district":"Vizianagaram","description":"Historic 18th-century royal fort","latitude":18.1124,"longitude":83.4095,"builtin":true},{"id":"builtin_127","name":"Pydithalli Ammavari Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Vizianagaram","description":"Famous Sirimanotsavam temple in Vizianagaram","latitude":18.1145,"longitude":83.406,"builtin":true},{"id":"builtin_128","name":"Ramatheertham Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"Vizianagaram","description":"Ancient hilltop Rama & Buddhist heritage site","latitude":18.165,"longitude":83.489,"builtin":true},{"id":"builtin_129","name":"Vizianagaram Clock Tower","modelType":"Clock Tower","category":"Tower","district":"Vizianagaram","description":"Historic town center clock tower","latitude":18.1165,"longitude":83.405,"builtin":true},{"id":"builtin_130","name":"Bobbili Fort Monument","modelType":"Heritage Monument","category":"Monument","district":"Vizianagaram","description":"Historic royal fort in Bobbili","latitude":18.5738,"longitude":83.3518,"builtin":true},{"id":"builtin_131","name":"Bhimavaram Somarama Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"West Godavari","description":"Sacred Pancharama Shiva shrine in Bhimavaram","latitude":16.5449,"longitude":81.5212,"builtin":true},{"id":"builtin_132","name":"Palakollu Ksheerarama Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"West Godavari","description":"Famous Pancharama temple with tallest gopuram","latitude":16.5178,"longitude":81.7299,"builtin":true},{"id":"builtin_133","name":"Bhimavaram Central Mall","modelType":"Grand Shopping Mall","category":"Mall","district":"West Godavari","description":"Popular shopping hub in Bhimavaram","latitude":16.54,"longitude":81.523,"builtin":true},{"id":"builtin_134","name":"Narasapuram Godavari Lighthouse","modelType":"Coastal Lighthouse","category":"Lighthouse","district":"West Godavari","description":"Scenic river-mouth landmark in Narasapuram","latitude":16.4344,"longitude":81.6977,"builtin":true},{"id":"builtin_135","name":"Tanuku Town Clock Tower","modelType":"Clock Tower","category":"Tower","district":"West Godavari","description":"Central landmark of Tanuku town","latitude":16.7544,"longitude":81.6814,"builtin":true},{"id":"builtin_136","name":"Gandikota Grand Canyon Fort","modelType":"Heritage Monument","category":"Monument","district":"YSR Kadapa","description":"Grand Canyon of India & historic fort","latitude":14.815,"longitude":78.2869,"builtin":true},{"id":"builtin_137","name":"Vontimitta Kodandarama Temple","modelType":"Golden Gopuram Temple","category":"Temple","district":"YSR Kadapa","description":"Iconic Chola-Vijayanagara Rama temple","latitude":14.3939,"longitude":79.0267,"builtin":true},{"id":"builtin_138","name":"Ameen Peer Dargah Heritage","modelType":"Heritage Monument","category":"Monument","district":"YSR Kadapa","description":"Famous 300-year-old Sufi shrine in Kadapa","latitude":14.4749,"longitude":78.8254,"builtin":true},{"id":"builtin_139","name":"YSR Cricket Stadium Kadapa","modelType":"Cricket Stadium","category":"Stadium","district":"YSR Kadapa","description":"Major cricket stadium in Kadapa","latitude":14.455,"longitude":78.815,"builtin":true},{"id":"builtin_140","name":"Proddatur Gold & Shopping Plaza","modelType":"Grand Shopping Mall","category":"Mall","district":"YSR Kadapa","description":"Famous gold & shopping hub in Proddatur","latitude":14.7502,"longitude":78.5492,"builtin":true}];
    const customLm = landmarksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    landmarksCache = [...customLm, ...builtinLm];
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
          ${lm.builtin
            ? '<span class="badge">Built-in AP Landmark</span>'
            : `<button class="danger-btn sm" data-del-lm="${escapeHtml(lm.id)}" type="button">Delete Landmark</button>`}
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
