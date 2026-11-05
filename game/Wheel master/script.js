const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let currentLevel = 1;
const maxLevels = 50;
let score = 0;
let gameState = "START"; // START, PLAYING, PAUSED, GAMEOVER

// సౌండ్ ఎఫెక్ట్స్ కోసం వెబ్ ఆడియో API (AudioContext)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'move') {
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(500, audioCtx.currentTime + 0.15);
        osc.frequency.setValueAtTime(700, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'jump') {
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}

// ప్లేయర్ (యూనిసైకిల్ బైక్ రైడర్) ఆబ్జెక్ట్
let player = {
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 20,
    isGrounded: false
};

// లెవెల్ డిజైన్ (50 లెవెల్స్ కోసం డైనమిక్ అడ్డంకులు)
let platforms = [];
let finishLine = { x: 2500, y: 250, width: 30, height: 150 };

function initLevel(level) {
    player.x = 100;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    
    platforms = [
        { x: 0, y: 380, width: 800, height: 70 }, // Start ground
        { x: 900, y: 330, width: 300, height: 20 },
        { x: 1300, y: 280, width: 250, height: 20 },
        { x: 1700, y: 350, width: 400, height: 20 },
        { x: 2200, y: 300, width: 400, height: 20 }
    ];

    // లెవెల్ పెరిగేకొద్దీ కష్టతరం చేయడం (50 లెవెల్స్ స్కేలింగ్)
    let extraPlatformCount = Math.min(level, 30);
    for (let i = 0; i < extraPlatformCount; i++) {
        platforms.push({
            x: 2700 + (i * 200),
            y: 200 + (Math.sin(i) * 80),
            width: 150,
            height: 20
        });
    }

    finishLine.x = 2800 + (extraPlatformCount * 200);
}

// కీబోర్డ్ కంట్రోల్స్
let keys = { left: false, right: false, jump: false };

window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
    if (e.key === "ArrowUp" || e.key === " " || e.key === "w") {
        if (player.isGrounded) {
            player.vy = -10;
            player.isGrounded = false;
            playSound('jump');
        }
    }
});

window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// ఆన్-స్క్రీన్ బటన్ కంట్రోల్స్
document.getElementById("left-btn").addEventListener("mousedown", () => keys.left = true);
document.getElementById("left-btn").addEventListener("mouseup", () => keys.left = false);
document.getElementById("right-btn").addEventListener("mousedown", () => keys.right = true);
document.getElementById("right-btn").addEventListener("mouseup", () => keys.right = false);
document.getElementById("jump-btn").addEventListener("click", () => {
    if (player.isGrounded) {
        player.vy = -10;
        player.isGrounded = false;
        playSound('jump');
    }
});

// గేమ్ లూప్
function update() {
    if (gameState !== "PLAYING") return;

    // మూవ్‌మెంట్ ఫిజిక్స్
    if (keys.right) {
        player.vx = 4;
        playSound('move');
    } else if (keys.left) {
        player.vx = -4;
        playSound('move');
    } else {
        player.vx *= 0.8; // ఘర్షణ (Friction)
    }

    player.vy += 0.5; // గురుత్వాకర్షణ (Gravity)

    player.x += player.vx;
    player.y += player.vy;

    player.isGrounded = false;

    // ప్లాట్‌ఫారమ్ కొలిషన్ డిటెక్షన్
    platforms.forEach(p => {
        if (player.x > p.x && player.x < p.x + p.width &&
            player.y + player.radius >= p.y && player.y + player.radius <= p.y + 15 && player.vy >= 0) {
            player.y = p.y - player.radius;
            player.vy = 0;
            player.isGrounded = true;
        }
    });

    // కింద పడిపోతే రీస్టార్ట్
    if (player.y > canvas.height) {
        initLevel(currentLevel);
    }

    // ఫినిష్ లైన్ రీచ్ కావడం
    if (player.x >= finishLine.x) {
        playSound('win');
        gameState = "GAMEOVER";
        score += 100 * currentLevel;
        document.getElementById("score").innerText = score;
        
        if (currentLevel < maxLevels) {
            document.getElementById("end-title").innerText = `లెవెల్ ${currentLevel} పూర్తయింది!`;
            document.getElementById("next-btn").innerText = "తదుపరి లెవెల్";
        } else {
            document.getElementById("end-title").innerText = "అభినందనలు! అన్ని 50 లెవెల్స్ గెలిచారు!";
            document.getElementById("next-btn").style.display = "none";
        }
        document.getElementById("gameover-screen").classList.remove("hidden");
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // కెమెరా స్క్రోలింగ్ (ప్లేయర్‌ని ఫాలో అవ్వడం)
    let cameraX = player.x - 200;

    ctx.save();
    ctx.translate(-cameraX, 0);

    // బ్యాక్‌గ్రౌండ్ భవనాలు (City Skyline)
    ctx.fillStyle = "#a2d2df";
    for (let i = -2; i < 20; i++) {
        ctx.fillRect(i * 300, 150, 180, 250);
    }

    // ప్లాట్‌ఫారమ్‌లు డ్రా చేయడం
    platforms.forEach(p => {
        ctx.fillStyle = "#3a86ff";
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    // ఫినిష్ లైన్ చెకర్ బోర్డ్
    ctx.fillStyle = "#000";
    ctx.fillRect(finishLine.x, finishLine.y, finishLine.width, finishLine.height);
    ctx.fillStyle = "#ff007f";
    ctx.fillRect(finishLine.x + 15, finishLine.y, 15, finishLine.height);

    // ప్లేయర్ (3D స్టైల్ క్యారెక్టర్ & వీల్) డ్రా చేయడం
    // బాడీ
    ctx.fillStyle = "#ff5964";
    ctx.beginPath();
    ctx.arc(player.x, player.y - 10, 15, 0, Math.PI * 2);
    ctx.fill();

    // హెడ్
    ctx.fillStyle = "#f3c68f";
    ctx.beginPath();
    ctx.arc(player.x, player.y - 32, 10, 0, Math.PI * 2);
    ctx.fill();

    // యూనిసైకిల్ వీల్
    ctx.strokeStyle = "#212529";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y + 10, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// బటన్ ఈవెంట్స్
document.getElementById("start-btn").addEventListener("click", () => {
    document.getElementById("start-screen").classList.add("hidden");
    gameState = "PLAYING";
    initLevel(currentLevel);
});

document.getElementById("pause-btn").addEventListener("click", () => {
    if (gameState === "PLAYING") {
        gameState = "PAUSED";
        document.getElementById("pause-screen").classList.remove("hidden");
    }
});

document.getElementById("resume-btn").addEventListener("click", () => {
    document.getElementById("pause-screen").classList.add("hidden");
    gameState = "PLAYING";
}
);

document.getElementById("next-btn").addEventListener("click", () => {
    if (currentLevel < maxLevels) {
        currentLevel++;
        document.getElementById("current-level").innerText = currentLevel;
        document.getElementById("gameover-screen").classList.add("hidden");
        initLevel(currentLevel);
        gameState = "PLAYING";
    }
});

// ప్రారంభంలో గేమ్ లూప్ రన్ చేయడం
gameLoop();
