let snakes = {};
let ladders = {};

let gameState = {
    currentUser: null,
    playerName: "",
    mode: "local",
    players: [],
    turnIndex: 0,
    roomCode: null,
    selectedTheme: "classic"
};

// DOM Elements
const screens = document.querySelectorAll('.screen');
const playerNameInput = document.getElementById('player-name');
const userDisplayName = document.getElementById('user-display-name');
const boardEl = document.getElementById('board');
const diceEl = document.getElementById('dice');
const diceStatus = document.getElementById('dice-status');
const turnIndicator = document.getElementById('turn-indicator');
const scoreboardEl = document.getElementById('scoreboard');
const loginStatusBanner = document.getElementById('login-status-banner');
const loginPopup = document.getElementById('login-popup');
const themeSelect = document.getElementById('theme-select');

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

// Randomizer to generate fresh snakes and ladders every match
function generateRandomBoardLayout() {
    snakes = {};
    ladders = {};

    // Generate 5 random ladders (bottom to top, ensuring bottom < top and reasonable gaps)
    const ladderPairs = [[2, 38], [7, 14], [15, 44], [28, 84], [36, 52], [51, 67], [71, 91], [78, 98]];
    // Shuffle and pick 4-5 ladders
    shuffleArray(ladderPairs).slice(0, 5).forEach(([start, end]) => {
        ladders[start] = end;
    });

    // Generate 5 random snakes (head to tail, head > tail)
    const snakePairs = [[99, 10], [95, 75], [87, 24], [64, 36], [56, 19], [47, 26], [32, 5], [16, 6]];
    shuffleArray(snakePairs).slice(0, 5).forEach(([start, end]) => {
        snakes[start] = end;
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('DOMContentLoaded', () => {
    buildBoard();

    // Theme selector listener
    themeSelect.addEventListener('change', (e) => {
        gameState.selectedTheme = e.target.value;
        boardEl.className = `theme-${gameState.selectedTheme}`;
    });

    if (auth) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                gameState.currentUser = user;
                gameState.playerName = user.displayName || user.email.split('@')[0];
                playerNameInput.value = gameState.playerName;
                userDisplayName.innerText = gameState.playerName;
                loginStatusBanner.classList.remove('hidden');
                loginPopup.classList.add('hidden');
            } else {
                const savedName = localStorage.getItem('snake_player_name');
                if (savedName) playerNameInput.value = savedName;
                setTimeout(() => {
                    if (!gameState.currentUser) loginPopup.classList.remove('hidden');
                }, 600);
            }
        });
    } else {
        const savedName = localStorage.getItem('snake_player_name');
        if (savedName) playerNameInput.value = savedName;
        loginPopup.classList.remove('hidden');
    }

    document.getElementById('btn-goto-login-page').addEventListener('click', () => {
        window.location.href = "../login.html"; 
    });

    document.getElementById('btn-dismiss-popup').addEventListener('click', () => {
        playSound(sfxTap);
        loginPopup.classList.add('hidden');
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
        const name = playerNameInput.value.trim() || "Player 1";
        gameState.playerName = name;
        localStorage.setItem('snake_player_name', name);
        saveNameToLocalLeaderboard(name, 0);
        userDisplayName.innerText = name;
        switchScreen('menu-screen');
    });

    document.getElementById('btn-google-login').addEventListener('click', async () => {
        if (!auth) { alert("Firebase Auth unavailable."); return; }
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            gameState.currentUser = user;
            gameState.playerName = user.displayName;
            playerNameInput.value = user.displayName;
            userDisplayName.innerText = user.displayName;
            loginStatusBanner.classList.remove('hidden');
            loginPopup.classList.add('hidden');
            saveNameToLocalLeaderboard(user.displayName, 0);
            switchScreen('menu-screen');
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert("Google Sign-In popup failed or was blocked.");
        }
    });

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
        if (auth && auth.currentUser) await auth.signOut();
        localStorage.removeItem('snake_player_name');
        switchScreen('auth-screen');
        loginPopup.classList.remove('hidden');
    });
    document.getElementById('btn-quit-game').addEventListener('click', () => switchScreen('menu-screen'));

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
            
            // Highlight current dynamic ladders and snakes visually on board
            let cellText = cellNum;
            if (ladders[cellNum]) cellText += ` 🪜→${ladders[cellNum]}`;
            if (snakes[cellNum]) cellText += ` 🐍→${snakes[cellNum]}`;
            cell.innerText = cellText;
            boardEl.appendChild(cell);
        }
    }
}

function startGame(mode) {
    gameState.mode = mode;
    gameState.turnIndex = 0;
    
    // Generate fresh random snake and ladder configuration for this match
    generateRandomBoardLayout();
    buildBoard();

    if (mode === 'bot') {
        gameState.players = [
            { name: gameState.playerName, pos: 0, started: false, colorClass: 'token-0' },
            { name: 'Bot AI', pos: 0, started: false, colorClass: 'token-1' }
        ];
    } else if (mode === 'pass') {
        gameState.players = [
            { name: gameState.playerName, pos: 0, started: false, colorClass: 'token-0' },
            { name: 'Player 2', pos: 0, started: false, colorClass: 'token-1' }
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
    diceStatus.innerText = currentPlayer.started ? "Roll to move!" : "Roll a 1 to start!";
    
    scoreboardEl.innerHTML = gameState.players.map(p => `
        <div style="background:#0f172a; padding:10px; border-radius:8px; margin-bottom:8px;">
            <strong>${p.name}</strong><br>Status: ${p.started ? `Square ${p.pos}` : 'Waiting for 1 🎲'}
        </div>
    `).join('');
}

function rollDice() {
    playSound(sfxDice);
    const roll = Math.floor(Math.random() * 6) + 1;
    diceEl.innerText = ['⚀','⚁','⚂','⚃','⚄','⚅'][roll - 1];

    let player = gameState.players[gameState.turnIndex];

    // RULE IMPLEMENTATION: Must roll a 1 to start moving out of square 0
    if (!player.started) {
        if (roll === 1) {
            player.started = true;
            player.pos = 1;
            alert(`🎉 ${player.name} rolled a 1 and entered the board!`);
        } else {
            alert(`🎲 ${player.name} rolled a ${roll}. You need a 1 to start!`);
        }
    } else {
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

function recordWin(winnerName) {
    saveNameToLocalLeaderboard(winnerName, 10);
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
        { name: gameState.playerName, pos: 0, started: false, colorClass: 'token-0' },
        { name: 'Waiting for friend...', pos: 0, started: false, colorClass: 'token-1' }
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
        { name: 'Host', pos: 0, started: false, colorClass: 'token-0' },
        { name: gameState.playerName, pos: 0, started: false, colorClass: 'token-1' }
    ];
    alert(`Joined room ${code}!`);
    switchScreen('game-screen');
    updateBoardUI();
}
