const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });

const urlParams = new URLSearchParams(window.location.search);
let currentLevel = parseInt(urlParams.get('level') || localStorage.getItem('toiletRushLevel') || '1', 10);
if (isNaN(currentLevel) || currentLevel < 1 || currentLevel > TOTAL_LEVELS) currentLevel = 1;

let timeLeft = 30;
let timerId = null;
let state = 'DRAW'; // DRAW, WALK, WIN, FAIL
let hintActive = false;

let doors = [];
let chars = [];
let walls = [];
let drawingChar = null;
let canvasRect = null;

// ==========================================
// PRE-RENDERED HIGH-DETAIL AVATARS (ZERO LAG)
// ==========================================
const sprites = {};

function createSprite(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const sctx = c.getContext('2d');
  sctx.translate(w / 2, h / 2);
  drawFn(sctx);
  return c;
}

function drawSpeechBubble(g, type) {
  g.save();
  g.translate(-26, -34);
  // Bubble body
  g.fillStyle = '#ffffff';
  g.strokeStyle = '#222222';
  g.lineWidth = 1.8;
  g.beginPath();
  g.arc(0, 0, 12, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  // Bubble pointer tail
  g.beginPath();
  g.moveTo(6, 9);
  g.lineTo(12, 14);
  g.lineTo(10, 6);
  g.closePath();
  g.fill();
  g.stroke();

  // Emoji face inside bubble
  g.fillStyle = '#ffcc22';
  g.beginPath();
  g.arc(0, 0, 8.5, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#d48800';
  g.lineWidth = 1;
  g.stroke();

  g.strokeStyle = '#222';
  g.lineWidth = 1.4;
  g.lineCap = 'round';
  if (type === 'urgent') {
    // > < eyes
    g.beginPath();
    g.moveTo(-4.5, -3); g.lineTo(-2, -1.5); g.lineTo(-4.5, 0);
    g.moveTo(4.5, -3);  g.lineTo(2, -1.5);  g.lineTo(4.5, 0);
    g.stroke();
    // Wavy distressed mouth
    g.beginPath();
    g.arc(0, 4.5, 3, Math.PI, 0);
    g.stroke();
    // Sweat drop
    g.fillStyle = '#29b6f6';
    g.beginPath();
    g.arc(6.5, -4, 2, 0, Math.PI * 2);
    g.fill();
  } else {
    // Relieved happy face
    g.beginPath();
    g.arc(-3, -1.5, 1.8, Math.PI, 0);
    g.stroke();
    g.beginPath();
    g.arc(3, -1.5, 1.8, Math.PI, 0);
    g.stroke();
    g.beginPath();
    g.arc(0, 1.5, 3.5, 0, Math.PI);
    g.stroke();
  }
  g.restore();
}

function drawBoyGraphic(g, pose) {
  g.lineJoin = 'round';
  g.lineCap = 'round';

  // Ground shadow
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.beginPath();
  g.ellipse(0, 31, 16, 5, 0, 0, Math.PI * 2);
  g.fill();

  // Shiver lines around body when waiting
  if (pose === 'idle') {
    g.strokeStyle = '#555';
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(-20, 4, 5, -0.6, 0.6);
    g.stroke();
    g.beginPath();
    g.arc(20, 4, 5, Math.PI - 0.6, Math.PI + 0.6);
    g.stroke();
  }

  // Legs & Shoes (crossed when holding pee!)
  g.strokeStyle = '#222';
  g.lineWidth = 2;
  // Left leg
  g.fillStyle = '#ffe0bd';
  g.beginPath();
  g.roundRect(-7, 16, 6, 11, 3);
  g.fill(); g.stroke();
  // Right leg (slightly crossed inward)
  g.beginPath();
  g.roundRect(0, 16, 6, 11, 3);
  g.fill(); g.stroke();

  // Blue & White Sneakers
  g.fillStyle = '#1e5be0';
  g.beginPath();
  g.ellipse(-5, 28, 6, 3.5, 0, 0, Math.PI * 2);
  g.fill(); g.stroke();
  g.beginPath();
  g.ellipse(4, 28, 6, 3.5, 0, 0, Math.PI * 2);
  g.fill(); g.stroke();

  // Torso: Yellow Shirt
  g.fillStyle = '#ffde22';
  g.beginPath();
  g.roundRect(-11, -3, 22, 16, 5);
  g.fill(); g.stroke();

  // Blue Shorts / Overalls bottom
  g.fillStyle = '#1e5be0';
  g.beginPath();
  g.roundRect(-10, 9, 20, 10, 4);
  g.fill(); g.stroke();

  // Overall straps
  g.fillRect(-7, -2, 3.5, 12);
  g.fillRect(3.5, -2, 3.5, 12);

  // Arms bent inward (holding tummy/crotch)
  g.fillStyle = '#ffe0bd';
  g.beginPath();
  g.moveTo(-11, 1);
  g.quadraticCurveTo(-16, 10, -4, 14);
  g.quadraticCurveTo(-2, 10, -9, 3);
  g.fill(); g.stroke();

  g.beginPath();
  g.moveTo(11, 1);
  g.quadraticCurveTo(16, 10, 4, 14);
  g.quadraticCurveTo(2, 10, 9, 3);
  g.fill(); g.stroke();

  // Head ( tilted slightly like in video )
  g.save();
  g.rotate(-0.08);

  // Ears
  g.fillStyle = '#ffe0bd';
  g.beginPath();
  g.arc(-15, -15, 4, 0, Math.PI * 2);
  g.arc(15, -15, 4, 0, Math.PI * 2);
  g.fill(); g.stroke();

  // Face
  g.fillStyle = '#ffe0bd';
  g.beginPath();
  g.arc(0, -16, 15, 0, Math.PI * 2);
  g.fill(); g.stroke();

  // Rosy Cheeks
  g.fillStyle = 'rgba(255, 105, 97, 0.55)';
  g.beginPath();
  g.arc(-8, -12, 3.2, 0, Math.PI * 2);
  g.arc(8, -12, 3.2, 0, Math.PI * 2);
  g.fill();

  // Brown Hair + Backwards Blue Cap (Exact video style)
  g.fillStyle = '#6b3e26';
  g.beginPath();
  g.arc(0, -19, 15, Math.PI * 0.95, Math.PI * 0.05);
  g.fill(); g.stroke();

  // Blue Cap Crown & Visor sticking out to the right/back
  g.fillStyle = '#1e5be0';
  g.beginPath();
  g.arc(0, -21, 14.5, Math.PI * 1.05, Math.PI * 1.95);
  g.fill(); g.stroke();
  // Cap Visor
  g.beginPath();
  g.roundRect(6, -25, 15, 5.5, 2.5);
  g.fill(); g.stroke();

  // Facial Expression
  g.strokeStyle = '#222';
  g.lineWidth = 1.8;
  if (pose === 'done') {
    // Happy relieved eyes
    g.beginPath();
    g.arc(-5, -15, 3, Math.PI, 0);
    g.stroke();
    g.beginPath();
    g.arc(5, -15, 3, Math.PI, 0);
    g.stroke();
    // Big smile
    g.beginPath();
    g.arc(0, -11, 4, 0, Math.PI);
    g.stroke();
  } else {
    // Urgent squeezed > < eyes
    g.beginPath
