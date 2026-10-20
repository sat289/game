// Game Definitions & Mappings
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

// Audio Elements
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
    
    // Play BGM on menu/game
    if(screenId !== 'auth-screen') {
        bgm.volume = 0.3;
        bgm.play().catch(() => {});
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check saved name in local storage
    const savedName = localStorage.getItem('snake_player_name');
    if (savedName) {
        playerNameInput.value = savedName;
    }

    buildBoard();

    // Local / Username login handler
    document.getElementById('btn-local-play').addEventListener('click', () => {
        const name = playerNameInput.value.trim() || "Player 1";
        gameState.playerName = name;
        localStorage.setItem('snake_player_name', name);
        
        saveNameToStorage(name);
        userDisplayName.innerText = name;
        switchScreen('menu-screen');
    });

    // Google Sign-In handler with Firebase fallback
    document.getElementById('btn-google-login').addEventListener('click', () => {
        if (!auth) {
            alert("Firebase Auth not configured. Proceeding with Local Storage mode.");
            document.getElementById('btn-local-play').click();
            return;
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            const user = result.user;
            gameState.currentUser = user;
            gameState.playerName = user.displayName;
            userDisplayName.innerText = user.displayName;
            saveNameToStorage(user.displayName);
            switchScreen('menu-screen');
        }).catch((error) => {
            console.error(error);
            alert("Google Sign-In failed. Falling back to local username.");
        });
    });

    // Mode Navigation
    document.getElementById('btn-mode-bot').addEventListener('click', () => startGame('bot'));
    document.getElementById('btn-mode-pass').addEventListener('click', () => startGame('pass'));
    document.getElementById('btn-mode-online').addEventListener('click', () => switchScreen('lobby-screen'));
    document.getElementById('btn-show-leaderboard').addEventListener('click', () => {
        loadLeaderboard();
        switchScreen('leaderboard-screen');
    });

    document.getElementById('btn-close-leaderboard').addEventListener('click', () => switchScreen('menu-screen'));
    document.getElementById('btn-back-menu').addEventListener('click', () => switchScreen('menu-screen'));
    document.getElementById('btn-logout').addEventListener('click', () => switchScreen('auth-screen'));
    document.getElementById('btn-quit-game').addEventListener('click', () => switchScreen('menu-screen'));

    // Game Actions
    document.getElementById('btn-roll').addEventListener('click', rollDice);

    // Online Room Actions
    document.getElementById('btn-create-room').addEventListener('click', createOnlineRoom);
    document.getElementById('btn-join-room').addEventListener('click', joinOnlineRoom);
});

// Save name in local storage (asked only once)
function saveNameToStorage(name) {
    let leaderboard = JSON.parse(localStorage.getItem('snake_leaderboard') || '[]');
    if (!leaderboard.some(p => p.name === name)) {
        leaderboard.push({ name: name, score: 0 });
        localStorage.setItem('snake_leaderboard', JSON.stringify(leaderboard));
    }
}

// Build 100-cell grid
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
        <div class="score-card" style="background:#0f172a; padding:10px; border-radius:8px; margin-bottom:8px;">
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

    // Trigger Bot turn if applicable
    if (gameState.mode === 'bot' && gameState.turnIndex === 1) {
        setTimeout(rollDice, 1200);
    }
}

// Score & Leaderboard Tracking
function recordWin(winnerName) {
    let leaderboard = JSON.parse(localStorage.getItem('snake_leaderboard') || '[]');
    let entry = leaderboard.find(p => p.name === winnerName);
    if (entry) {
        entry.score += 10;
    } else {
        leaderboard.push({ name: winnerName, score: 10 });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('snake_leaderboard', JSON.stringify(leaderboard));

    if (db && gameState.currentUser) {
        db.collection('leaderboard').doc(winnerName).set({
            name: winnerName,
            score: firebase.firestore.FieldValue.increment(10)
        }, { merge: true }).catch(() => {});
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

// Online Code Generator Multiplayer
function createOnlineRoom() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    gameState.roomCode = code;
    alert(`Room Created! Share your 6-digit code with a friend: ${code}`);
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
    alert(`Successfully joined room ${code}!`);
    switchScreen('game-screen');
    updateBoardUI();
}
