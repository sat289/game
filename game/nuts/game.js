let currentDifficulty = 'easy';
let currentLevel = 1;
let score = parseInt(localStorage.getItem('stgames_score') || '0');
let bolts = [];
let selectedBoltIndex = -1;

document.getElementById('menu-total-score').innerText = score;

function startGame(difficulty) {
    currentDifficulty = difficulty;
    currentLevel = 1;
    document.getElementById('difficulty-label').innerText = difficulty.toUpperCase();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    loadLevel();
}

function backToMenu() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('menu-total-score').innerText = score;
    window.dispatchEvent(new CustomEvent('updateScore', { detail: score }));
}

function generateLevelData() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    let numBolts = currentDifficulty === 'easy' ? 3 : currentDifficulty === 'medium' ? 4 : 5;
    let numColors = numBolts - 1;
    
    let allNuts = [];
    for (let i = 0; i < numColors; i++) {
        for (let j = 0; j < 3; j++) {
            allNuts.push(colors[i]);
        }
    }
    allNuts.sort(() => Math.random() - 0.5);
    
    let generatedBolts = [];
    let nutIndex = 0;
    for (let i = 0; i < numBolts; i++) {
        let boltNuts = [];
        if (i < numColors) {
            boltNuts.push(allNuts[nutIndex++]);
            boltNuts.push(allNuts[nutIndex++]);
            boltNuts.push(allNuts[nutIndex++]);
        }
        generatedBolts.push(boltNuts);
    }
    return generatedBolts;
}

function loadLevel() {
    document.getElementById('level-label').innerText = currentLevel;
    bolts = generateLevelData();
    renderBoard();
}

function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    bolts.forEach((boltNuts, index) => {
        const boltEl = document.createElement('div');
        boltEl.className = 'bolt';
        boltEl.onclick = () => handleBoltClick(index);
        
        boltNuts.forEach((nutColor, nutIndex) => {
            const nutEl = document.createElement('div');
            nutEl.className = `nut color-${nutColor}`;
            if (index === selectedBoltIndex && nutIndex === boltNuts.length - 1) {
                nutEl.classList.add('selected');
            }
            boltEl.appendChild(nutEl);
        });
        
        board.appendChild(boltEl);
    });
    
    checkWinCondition();
}

function handleBoltClick(index) {
    if (selectedBoltIndex === -1) {
        if (bolts[index].length > 0) selectedBoltIndex = index;
    } else {
        if (selectedBoltIndex === index) {
            selectedBoltIndex = -1;
        } else {
            let sourceBolt = bolts[selectedBoltIndex];
            let targetBolt = bolts[index];
            let topNut = sourceBolt[sourceBolt.length - 1];
            
            if (targetBolt.length < 3 && (targetBolt.length === 0 || targetBolt[targetBolt.length - 1] === topNut)) {
                targetBolt.push(sourceBolt.pop());
            }
            selectedBoltIndex = -1;
        }
    }
    renderBoard();
}

function checkWinCondition() {
    let isWin = true;
    for (let bolt of bolts) {
        if (bolt.length > 0) {
            if (bolt.length < 3) { isWin = false; break; }
            let firstColor = bolt[0];
            for (let nut of bolt) {
                if (nut !== firstColor) { isWin = false; break; }
            }
        }
    }
    
    if (isWin) {
        setTimeout(() => {
            let pointsEarned = currentDifficulty === 'hard' ? 30 : currentDifficulty === 'medium' ? 20 : 10;
            score += pointsEarned;
            localStorage.setItem('stgames_score', score);
            window.dispatchEvent(new CustomEvent('updateScore', { detail: score }));
            alert(`Level Cleared! +${pointsEarned} pts`);
            currentLevel++;
            loadLevel();
        }, 300);
    }
}

function restartLevel() {
    selectedBoltIndex = -1;
    loadLevel(); 
}

function undo() {
    alert("Undo feature coming soon!");
}

function hint() {
    alert("Match top nuts of the same color!");
}

document.getElementById('add-bolt-btn').addEventListener('click', () => {
    document.getElementById('ad-container').classList.remove('hidden');
    const video = document.getElementById('ad-video');
    video.play().catch(e => {
        setTimeout(showAdCloseButton, 2000); // fallback if no video
    });
    video.onended = showAdCloseButton;
});

function showAdCloseButton() {
    document.getElementById('close-ad').classList.remove('hidden');
}

function closeAd() {
    document.getElementById('ad-container').classList.add('hidden');
    document.getElementById('close-ad').classList.add('hidden');
    bolts.push([]); // Add empty bolt reward
    renderBoard();
}

window.startGame = startGame;
window.backToMenu = backToMenu;
window.restartLevel = restartLevel;
window.closeAd = closeAd;
window.undo = undo;
window.hint = hint;

window.showLeaderboard = () => {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('leaderboard-screen').classList.remove('hidden');
    window.dispatchEvent(new Event('fetchLeaderboard'));
};
window.hideLeaderboard = () => {
    document.getElementById('leaderboard-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
};