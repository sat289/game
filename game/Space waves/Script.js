const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const levelIndicator = document.getElementById('level-indicator');
const pauseBtn = document.getElementById('pause-btn');

let width, height;
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// గేమ్ వేరియబుల్స్
let currentLevel = 1;
const maxLevels = 50;
let isHolding = false;
let isPaused = false;
let cameraX = 0;
let levelLength = 3000;
let obstacles = [];
let particles = [];

const player = {
    x: 150,
    y: 300,
    size: 12,
    speedX: 6,
    speedY: 6,
    trail: []
};

// ఇన్‌పుట్ కంట్రోల్స్ (మౌస్, టచ్, స్పేస్‌బార్)
window.addEventListener('mousedown', () => isHolding = true);
window.addEventListener('mouseup', () => isHolding = false);
window.addEventListener('touchstart', (e) => { e.preventDefault(); isHolding = true; }, {passive: false});
window.addEventListener('touchend', () => isHolding = false);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') isHolding = true;
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') isHolding = false;
});

pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? '▶' : 'II';
});

// 50 లెవెల్స్ ఆటోమేటిక్ జనరేటర్ (లెవెల్ పెరిగేకొద్దీ వేగం మరియు అడ్డంకులు పెరుగుతాయి)
function loadLevel(lvl) {
    cameraX = 0;
    player.y = height / 2;
    player.trail = [{ x: player.x, y: player.y }];
    obstacles = [];

    player.speedX = 5.5 + (lvl * 0.12);
    player.speedY = player.speedX;
    levelLength = 2500 + (lvl * 300);

    levelIndicator.innerText = `Level: ${lvl} / ${maxLevels}`;

    let gapSize = Math.max(130, 260 - (lvl * 2.2));
    let spacing = Math.max(240, 420 - (lvl * 3));

    for (let x = 600; x < levelLength - 400; x += spacing) {
        let randomFactor = Math.sin(x * 0.01 + lvl) * 0.5 + 0.5;
        let minTop = 60;
        let maxTop = height - gapSize - 60;
        let topHeight = minTop + randomFactor * (maxTop - minTop);
        let bottomY = topHeight + gapSize;

        // పై బ్లాక్ & స్పైక్స్
        obstacles.push({
            x: x,
            y: 40,
            w: 110,
            h: topHeight - 40,
            spikesBottom: true
        });

        // కింది బ్లాక్ & స్పైక్స్
        obstacles.push({
            x: x,
            y: bottomY,
            w: 110,
            h: height - 40 - bottomY,
            spikesTop: true
        });
    }
}

function drawSpikes(x, y, width, dir) {
    const spikeWidth = 22;
    const spikeHeight = 22;
    const count = Math.floor(width / spikeWidth);

    ctx.fillStyle = '#5e0a45';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    for (let i = 0; i < count; i++) {
        let sx = x + i * spikeWidth;
        ctx.beginPath();
        if (dir === 'up') {
            ctx.moveTo(sx, y);
            ctx.lineTo(sx + spikeWidth / 2, y - spikeHeight);
            ctx.lineTo(sx + spikeWidth, y);
        } else {
            ctx.moveTo(sx, y);
            ctx.lineTo(sx + spikeWidth / 2, y + spikeHeight);
            ctx.lineTo(sx + spikeWidth, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function update() {
    if (isPaused) return;

    cameraX += player.speedX;
    if (isHolding) {
        player.y -= player.speedY;
    } else {
        player.y += player.speedY;
    }

    player.trail.push({ x: cameraX + player.x, y: player.y });
    if (player.trail.length > 200) player.trail.shift();

    // ప్రోగ్రెస్ బార్ అప్‌డేట్
    let progress = Math.min(100, Math.floor((cameraX / levelLength) * 100));
    progressBar.style.width = progress + '%';
    progressText.innerText = progress + '%';

    // పైన లేదా కింద గోడలకు తగిలితే రీస్టార్ట్
    if (player.y - player.size < 40 || player.y + player.size > height - 40) {
        loadLevel(currentLevel);
        return;
    }

    // అడ్డంకులతో కొలిజన్ చెక్
    let px = cameraX + player.x;
    let py = player.y;

    for (let obs of obstacles) {
        let hitTop = obs.spikesTop ? obs.y - 18 : obs.y;
        let hitBottom = obs.spikesBottom ? obs.y + obs.h + 18 : obs.y + obs.h;

        if (px + player.size > obs.x && px - player.size < obs.x + obs.w &&
            py + player.size > hitTop && py - player.size < hitBottom) {
            loadLevel(currentLevel); // ఓడిపోతే అదే లెవెల్ మళ్ళీ మొదలవుతుంది
            return;
        }
    }

    // లెవెల్ పూర్తయితే నెక్స్ట్ లెవెల్
    if (cameraX >= levelLength) {
        if (currentLevel < maxLevels) {
            currentLevel++;
            loadLevel(currentLevel);
        } else {
            alert("అభినందనలు! మీరు మొత్తం 50 లెవెల్స్ పూర్తి చేశారు!");
            currentLevel = 1;
            loadLevel(currentLevel);
        }
    }
}

function draw() {
    // పింక్/మెజెంటా బ్యాక్‌గ్రౌండ్
    ctx.fillStyle = '#b8008a';
    ctx.fillRect(0, 0, width, height);

    // పైన మరియు కింద బార్డర్స్
    ctx.fillStyle = '#5e0a45';
    ctx.fillRect(0, 0, width, 40);
    ctx.fillRect(0, height - 40, width, 40);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 40); ctx.lineTo(width, 40);
    ctx.moveTo(0, height - 40); ctx.lineTo(width, height - 40);
    ctx.stroke();

    // అడ్డంకులు గీయడం
    for (let obs of obstacles) {
        let screenX = obs.x - cameraX;
        if (screenX + obs.w < 0 || screenX > width) continue;

        ctx.fillStyle = '#5e0a45';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.fillRect(screenX, obs.y, obs.w, obs.h);
        ctx.strokeRect(screenX, obs.y, obs.w, obs.h);

        if (obs.spikesTop) drawSpikes(screenX, obs.y, obs.w, 'up');
        if (obs.spikesBottom) drawSpikes(screenX, obs.y + obs.h, obs.w, 'down');
    }

    // తెల్లటి వేవ్ ట్రయల్ గీత
    if (player.trail.length > 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        for (let i = 0; i < player.trail.length; i++) {
            let pt = player.trail[i];
            let sx = pt.x - cameraX;
            if (i === 0) ctx.moveTo(sx, pt.y);
            else ctx.lineTo(sx, pt.y);
        }
        ctx.stroke();
    }

    // ప్లేయర్ (బాణం గుర్తు)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(isHolding ? -Math.PI / 4 : Math.PI / 4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

loadLevel(currentLevel);
gameLoop();

