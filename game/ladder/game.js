const BOARD_CONFIGS = {
    "board1": {
        img: "board1.jpg"
    },
    "board2": {
        img: "board2.jpg"
    },
    "board3": {
        img: "board3.jpg"
    },
    "board4": {
        img: "board4.jpg"
    },
    "board5": {
        img: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800"
    },
    "board6": {
        img: "board6.jpg"
    }
};

let snakes = {};
let ladders = {};
let isRolling = false;

let gameState = {
    currentUser: null,
    playerName: "",
    mode: "local",
    players: [],
    turnIndex: 0,
    roomCode: null,
    selectedTheme: "board5"
};

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
const boardPreviewImg = document.getElementById('board-preview-img');
const rollBtn = document.getElementById('btn-roll');

const sfxTap = document.getElementById('sfx-tap');
const sfxDice = document.getElementById('sfx-dice');
const sfxLadder = document.getElementById('sfx-ladder');
const sfxSnake = document.getElementById('sfx-snake');
const bgm = document.getElementById('bgm');

function playSound(audioEl) {
    try {
        if (!audioEl) return;
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
    } catch (e) {}
}

function switchScreen(screenId) {
    playSound(sfxTap);
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if (screenId !== 'auth-screen' && bgm) {
        bgm.volume = 0.2;
        bgm.play().catch(() => {});
    }
}

// Generate randomized unique snakes and ladders layout for every match
function generateRandomBoardLayout() {
    snakes = {};
    ladders = {};

    // Generate random ladders (ensuring start < end)
    const possibleLadders = [
        {start: 2, end: 38}, {start: 4, end: 14}, {start: 9, end: 31},
        {start: 21, end: 42}, {start: 28, end: 84}, {start: 36, end: 44},
        {start: 51, end: 67}, {start: 71, end: 91}, {start: 80, end: 99}
    ];
    
    // Generate random snakes (ensuring start > end)
    const possibleSnakes = [
        {start: 16, end: 6}, {start: 47, end: 26}, {start: 49, end: 11},
        {start: 56, end: 53}, {start: 62, end: 19}, {start: 64, end: 60},
        {start: 87, end: 24}, {start: 93, end: 73}, {start: 98, end: 78}
    ];

    // Shuffle and select 4 to 5 unique items
    const shuffledLadders = [...possibleLadders].sort(() => 0.5 - Math.random()).slice(0, 5);
    shuffledLadders.forEach(l => { ladders[l.start] = l.end; });

    const shuffledSnakes = [...possibleSnakes].sort(() => 0.5 - Math.random()).slice(0, 5);
    shuffledSnakes.forEach(s => { snakes[s.start] = s.end; });
}

function applySelectedBoard(boardId) {
    const config = BOARD_CONFIGS[boardId] || BOARD_CONFIGS["board5"];
    boardEl.className = `board-${boardId}`;
    if (boardPreviewImg) {
        boardPreviewImg.src = config.img;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    buildBoard();
    applySelectedBoard(gameState.selectedTheme);

    const savedName = localStorage.getItem('snake_player_name');
    if (savedName) {
        playerNameInput.value = savedName;
    }

    themeSelect.addEventListener('change', (e) => {
        gameState.selectedTheme = e.target.value;
        applySelectedBoard(gameState.selectedTheme);
    });

    if (typeof auth !== "undefined" && auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                gameState.currentUser = user;
                const autoName = user.displayName || (user.email ? user.email.split('@')[0] : "Player 1");
                gameState.playerName = autoName;
                playerNameInput.value = autoName;
                userDisplayName.innerText = autoName;
                localStorage.setItem('snake_player_name', autoName);

                loginStatusBanner.classList.remove('hidden');
                loginPopup.classList.add('hidden');
            } else {
                gameState.currentUser = null;
                loginStatusBanner.classList.add('hidden');
                setTimeout(() => {
                    if (!gameState.currentUser) {
                        loginPopup.classList.remove('hidden');
                    }
                }, 600);
            }
        });
    } else {
        loginPopup.classList.remove('hidden');
    }

    document.getElementById('btn-goto-login-page').addEventListener('click', () => {
        playSound(sfxTap);
        window.location.href = "../login.html";
    });

    document.getElementById('btn-dismiss-popup').addEventListener('click', () => {
        playSound(sfxTap);
        loginPopup.classList.add('hidden');
        playerNameInput.focus();
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
        if (typeof auth === "undefined" || !auth) {
            alert("Firebase Auth unavailable. Please continue with a username.");
            return;
        }
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            const autoName = user.displayName || (user.email ? user.email.split('@')[0] : "Player 1");
            gameState.currentUser = user;
            gameState.playerName = autoName;
            playerNameInput.value = autoName;
            userDisplayName.innerText = autoName;
            localStorage.setItem('snake_player_name', autoName);

            loginStatusBanner.classList.remove('hidden');
            loginPopup.classList.add('hidden');
            saveNameToLocalLeaderboard(autoName, 0);
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
        if (typeof auth !== "undefined" && auth && auth.currentUser) {
            await auth.signOut();
        }
        gameState.currentUser = null;
        localStorage.removeItem('snake_player_name');
        playerNameInput.value = "";
        loginStatusBanner.classList.add('hidden');
        switchScreen('auth-screen');
        loginPopup.classList.remove('hidden');
    });
    document.getElementById('btn-quit-game').addEventListener('click', () => switchScreen('menu-screen'));

    rollBtn.addEventListener('click', rollDice);
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
    isRolling = false;
    rollBtn.disabled = false;

    // Generate randomized snake/ladder positions for this specific match
    generateRandomBoardLayout();
    applySelectedBoard(gameState.selectedTheme);
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
                const offset = (idx === 0) ? -5 : 5;
                token.style.transform = `translate(${offset}px, ${offset}px)`;
                cell.appendChild(token);
            }
        }
    });

    const currentPlayer = gameState.players[gameState.turnIndex];
    turnIndicator.innerText = `Turn: ${currentPlayer.name}`;
    diceStatus.innerText = currentPlayer.started ? "Roll to move!" : "Roll a 1 to start!";

    scoreboardEl.innerHTML = gameState.players.map((p, i) => `
        <div style="background:#0f172a; padding:10px; border-radius:8px; margin-bottom:8px; border-left: 4px solid ${i === 0 ? '#ef4444' : '#2563eb'};">
            <strong>${p.name}</strong><br>Status: ${p.started ? `Square ${p.pos}` : 'Waiting for 1 🎲'}
        </div>
    `).join('');
}

function rollDice() {
    if (isRolling) return;
    isRolling = true;
    rollBtn.disabled = true;

    playSound(sfxDice);
    const roll = Math.floor(Math.random() * 6) + 1;
    diceEl.innerText = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][roll - 1];

    let player = gameState.players[gameState.turnIndex];

    // REQUIREMENT: User must roll a 1 to start moving from square 0
    if (!player.started) {
        if (roll === 1) {
            player.started = true;
            player.pos = 1;
            diceStatus.innerText = `🎉 ${player.name} rolled a 1 and started!`;
        } else {
            diceStatus.innerText = `🎲 Rolled ${roll}. Need a 1 to start!`;
        }
        updateBoardUI();
        finishTurn();
        return;
    }

    let nextPos = player.pos + roll;
    if (nextPos > 100) {
        diceStatus.innerText = `🎲 Rolled ${roll}. Need exact roll for 100!`;
        finishTurn();
        return;
    }

    player.pos = nextPos;
    diceStatus.innerText = `${player.name} moved to ${nextPos}`;
    updateBoardUI();

    if (ladders[nextPos]) {
        setTimeout(() => {
            playSound(sfxLadder);
            const dest = ladders[nextPos];
            player.pos = dest;
            diceStatus.innerText = `🪜 Ladder! Climbed ${nextPos} → ${dest}!`;
            updateBoardUI();
            finishTurn();
        }, 550);
    } else if (snakes[nextPos]) {
        setTimeout(() => {
            playSound(sfxSnake);
            const dest = snakes[nextPos];
            player.pos = dest;
            diceStatus.innerText = `🐍 Snake! Slid ${nextPos} → ${dest}!`;
            updateBoardUI();
            finishTurn();
        }, 550);
    } else {
        finishTurn();
    }
}

function finishTurn() {
    let player = gameState.players[gameState.turnIndex];

    if (player.pos === 100) {
        setTimeout(() => {
            alert(`🎉 ${player.name} Wins the Game!`);
            recordWin(player.name);
            isRolling = false;
            rollBtn.disabled = false;
            switchScreen('menu-screen');
        }, 300);
        return;
    }

    gameState.turnIndex = (gameState.turnIndex + 1) % gameState.players.length;
    setTimeout(() => {
        updateBoardUI();
        if (gameState.mode === 'bot' && gameState.turnIndex === 1) {
            setTimeout(() => {
                isRolling = false;
                rollDice();
            }, 900);
        } else {
            isRolling = false;
            rollBtn.disabled = false;
        }
    }, 600);
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
    generateRandomBoardLayout();
    applySelectedBoard(gameState.selectedTheme);
    buildBoard();
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
    generateRandomBoardLayout();
    applySelectedBoard(gameState.selectedTheme);
    buildBoard();
    gameState.players = [
        { name: 'Host', pos: 0, started: false, colorClass: 'token-0' },
        { name: gameState.playerName, pos: 0, started: false, colorClass: 'token-1' }
    ];
    alert(`Joined room ${code}!`);
    switchScreen('game-screen');
    updateBoardUI();
}
