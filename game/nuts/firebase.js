import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyDOFx0_vpPDRDCkUW-deQjMNK5msOsGSnI",
    authDomain: "stgames-289.firebaseapp.com",
    databaseURL: "https://stgames-289-default-rtdb.firebaseio.com",
    projectId: "stgames-289",
    storageBucket: "stgames-289.firebasestorage.app",
    messagingSenderId: "916146081741",
    appId: "1:916146081741:web:eb343c4dc0c6648388fe84",
    measurementId: "G-P8RQ074PWX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Use established player profile or generate local ID
let userId = localStorage.getItem('game_user_id');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('game_user_id', userId);
}

// Sets profile name to global default if unset
let userName = localStorage.getItem('game_user_name') || "Satish Kommana";

window.addEventListener('updateScore', (e) => {
    const newScore = e.detail;
    set(ref(db, 'leaderboard/' + userId), {
        username: userName,
        score: newScore,
        timestamp: Date.now()
    });
});

window.addEventListener('fetchLeaderboard', () => {
    const listEl = document.getElementById('leaderboard-list');
    listEl.innerHTML = '<li>Loading scores...</li>';
    
    get(child(ref(db), `leaderboard`)).then((snapshot) => {
        if (snapshot.exists()) {
            listEl.innerHTML = '';
            const data = snapshot.val();
            const sortedScores = Object.values(data).sort((a, b) => b.score - a.score);
            
            sortedScores.forEach((entry, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>#${index + 1} ${entry.username}</span> <span>${entry.score}</span>`;
                listEl.appendChild(li);
            });
        } else {
            listEl.innerHTML = '<li>No scores available yet.</li>';
        }
    }).catch((error) => {
        console.error("Firebase Error:", error);
        listEl.innerHTML = '<li>Error loading leaderboard.</li>';
    });
});