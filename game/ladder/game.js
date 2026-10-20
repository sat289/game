import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc, updateDoc, increment } from "./firebase.js";

// Game Maps
const snakes = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const ladders = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

let gameState = {
    currentUser: null,
    playerName: "",
    mode: "local",
    players: [],
    turnIndex: 0,
    roomCode: null
};

// UI Elements
const screens = document.querySelectorAll('.screen');
const playerNameInput = document.getElementById('player-name');
const userDisplayName = document.getElementById('user-display-name');
const boardEl = document.getElementById('board');
const diceEl = document.getElementById('dice');
const turnIndicator = document.getElementById('turn-indicator');
const scoreboardEl = document.getElementById('scoreboard');

// Audio elements
const sfxTap = document.getElementById('sfx-tap');
const sfxDice = document.getElementById('sfx-dice');
const sfxLadder = document.getElementById('sfx-ladder');
const sfxSnake = document.getElementById('sfx-snake');
const bgm = document.getElementById('bgm');

function playSound(audioEl) {
    try {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
    } catch(e) {}
}

function switchScreen(screenId) {
    playSound(sfxTap);
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if(screenId !== 'auth-screen') {
        bgm.volume = 0.2;
        bgm.play().catch(() => {});
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check local storage fallback name
    const savedName = localStorage.getItem('snake_player_name');
    if (savedName) {
        playerNameInput.value = savedName;
    }

    buildBoard();

    // Listen to Firebase Auth state changes automatically across pages/reloads
    onAuthStateChanged(auth, (user) => {
        if (user) {
            gameState.currentUser = user;
            gameState.playerName = user.displayName || "Google User";
            playerNameInput.value = gameState.playerName;
            userDisplayName.innerText = gameState.playerName;
            
            // Auto-advance if signed in from main page check
            localStorage.setItem('snake_player_name', gameState.playerName);
        }
    });

    // Local / Username Play Button
    document.getElementById('btn-local-play').addEventListener('click', () => {
        const name = playerNameInput.value.trim() || "Player 1";
        gameState.playerName = name;
        localStorage.setItem('snake_player_name', name);
        saveNameToLocalLeaderboard(name, 0);
        userDisplayName.innerText = name;
        switchScreen('menu-screen');
    });

    // Google Sign-In Button Click Handler
    document.getElementById('btn-google-login').addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            gameState.currentUser = user;
            gameState.playerName = user.displayName;
            playerNameInput.value = user.displayName;
            userDisplayName.innerText = user.displayName;
            
            saveNameToLocalLeaderboard(user.displayName, 0);
            switchScreen('menu-screen');
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert("Google Sign-In failed. Please ensure your domain is added to Firebase Auth Authorized Domains.");
        }
    });

    // Mode Selection & Navigation
    document.getElementById('btn-mode-bot').addEventListener('click', () => startGame('bot'));
    document.getElementById('btn-mode-pass').addEventListener('click', () => startGame('pass'));
    document.getElementById('btn-mode-online').addEventListener('click', () => switchScreen('lobby-screen'));
    document.getElementById('btn-show-leaderboard').addEventListener('click', () => {
        loadLeaderboard();
        switchScreen('leaderboard-screen');
    });

    document.getElementById('btn-close-leaderboard').addEventListener('click', () => switchScreen('menu-screen'));
    document.getElementById('btn-back-menu').addEventListener('click', () => switchScreen('menu-screen'));
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if (auth.currentUser) await signOut(auth);
        switchScreen('auth-screen');
    });
    document.getElementById('btn-quit-game').addEventListener('click', () => switchScreen('menu-screen'));

    // Game Controls
    document.getElementById('btn-roll').addEventListener('click', rollDice);
    document.getElementById('btn-create-room').addEventListener('click', createOnlineRoom);
    document.getElementById('btn-join-room').addEventListener('click', joinOnlineRoom);
});

function saveNameToLocalLeaderboard(name, scoreInc) {
    let leaderboard = JSON.parse(localStorage.getItem('snake_leaderboard') || '[]');
    let entry = leaderboard.find(p => p.name === name);
    if (entry) {
        entry.score += scoreInc;
    } else {
        leaderboard.push({ name: name, score: scoreInc });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('snake_leaderboard', JSON.stringify(leaderboard));
}

function buildBoard() {
    boardEl.innerHTML = '';
    for (let r = 9; r >= 0; r--) {
        for (let c = 0; c < 10; c++) {
            let cellNum = (r % 2 === 1) ? r * 10 + (10 - c) : r * 10 + c + 1;
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.num = cellNum;
            cell.innerText = cellNum;
            boardEl.appendChild(cell);
        }
    }
}

function startGame(mode) {
    gameState.mode = mode;
    gameState.turnIndex = 0;
    
    if (mode === 'bot') {
        gameState.players = [
            { name: gameState.playerName, pos: 0, colorClass: 'token-0' },
            { name: 'Bot AI', pos: 0, colorClass: 'token-1' }
        ];
    } else if (mode === 'pass') {
        gameState.players = [
            { name: gameState.playerName, pos: 0, colorClass: 'token-0' },
            { name: 'Player 2', pos: 0, colorClass: 'token-1' }
        ];
    }

    switchScreen('game-screen');
    updateBoardUI();
}

function updateBoardUI() {
    document.querySelectorAll('.token').forEach(t => t.remove());

    gameState.players.forEach((player, idx) => {
        if (player.pos > 0) {
            const cell = boardEl.querySelector(`[data-num='${player.pos}']`);
            if (cell) {
                const token = document.createElement('div');
                token.classList.add('token', player.colorClass);
                token.style.transform = `translate(${(idx % 2) * 8}px, ${Math.floor(idx / 2) * 8}px)`;
                cell.appendChild(token);
            }
        }
    });

    const currentPlayer = gameState.players[gameState.turnIndex];
    turnIndicator.innerText = `Turn: ${currentPlayer.name}`;
    
    scoreboardEl.innerHTML = gameState.players.map(p => `
        <div style="background:#0f172a; padding:10px; border-radius:8px; margin-bottom:8px;">
            <strong>${p.name}</strong><br>Square: ${p.pos}
        </div>
    `).join('');
}

function rollDice() {
    playSound(sfxDice);
    const roll = Math.floor(Math.random() * 6) + 1;
    diceEl.innerText = ['⚀','⚁','⚂','⚃','⚄','⚅'][roll - 1];

    let player = gameState.players[gameState.turnIndex];
    let newPos = player.pos + roll;

    if (newPos <= 100) {
        player.pos = newPos;
        if (ladders[player.pos]) {
            playSound(sfxLadder);
            player.pos = ladders[player.pos];
        } else if (snakes[player.pos]) {
            playSound(sfxSnake);
            player.pos = snakes[player.pos];
        }
    }

    updateBoardUI();

    if (player.pos === 100) {
        alert(`🎉 ${player.name} Wins the Game!`);
        recordWin(player.name);
        switchScreen('menu-screen');
        return;
    }

    gameState.turnIndex = (gameState.turnIndex + 1) % gameState.players.length;

    if (gameState.mode === 'bot' && gameState.turnIndex === 1) {
        setTimeout(rollDice, 1200);
    }
}

async function recordWin(winnerName) {
    saveNameToLocalLeaderboard(winnerName, 10);

    if (db && gameState.currentUser) {
        try {
            const userRef = doc(db, "leaderboard", gameState.currentUser.uid);
            await setDoc(userRef, {
                name: winnerName,
                score: increment(10)
            }, { merge: true });
        } catch (e) {
            console.error("Firestore score update failed:", e);
        }
    }
}

function loadLeaderboard() {
    const listEl = document.getElementById('leaderboard-list');
    let leaderboard = JSON.parse(localStorage.getItem('snake_leaderboard') || '[]');
    leaderboard.sort((a, b) => b.score - a.score);

    listEl.innerHTML = leaderboard.slice(0, 10).map((p, idx) => `
        <li>${idx + 1}. <strong>${p.name}</strong> — ${p.score} pts</li>
    `).join('') || '<li>No scores recorded yet.</li>';
}

function createOnlineRoom() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    gameState.roomCode = code;
    alert(`Room Created! Code: ${code}`);
    gameState.mode = 'online';
    gameState.players = [
        { name: gameState.playerName, pos: 0, colorClass: 'token-0' },
        { name: 'Waiting for friend...', pos: 0, colorClass: 'token-1' }
    ];
    switchScreen('game-screen');
    updateBoardUI();
}

function joinOnlineRoom() {
    const code = document.getElementById('room-code-input').value.trim();
    if (code.length !== 6) {
        alert("Please enter a valid 6-digit room code.");
        return;
    }
    gameState.roomCode = code;
    gameState.mode = 'online';
    gameState.players = [
        { name: 'Host', pos: 0, colorClass: 'token-0' },
        { name: gameState.playerName, pos: 0, colorClass: 'token-1' }
    ];
    alert(`Joined room ${code}!`);
    switchScreen('game-screen');
    updateBoardUI();
}
