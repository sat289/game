const sampleQuotes = [
  "Speed and precision make a true racing champion on every track.",
  "The quick brown fox jumps over the lazy dog and races to the finish line.",
  "Never give up because great things take time, focus, and persistent effort.",
  "Coding great games requires creativity, logical thinking, and constant passion."
];

let targetText = sampleQuotes[0];
let typedText = '';
let startTime = null;
let wpm = 0;
let accuracy = 100;
let isFinished = false;

let bot1Progress = 0;
let bot2Progress = 0;
let bot3Progress = 0;
let botInterval = null;

// Audio State
let soundEnabled = true;
let musicPlaying = false;
const bgMusic = document.getElementById("bgMusic");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const soundToggleBtn = document.getElementById("soundToggleBtn");

// DOM Elements
const playerWpmLabel = document.getElementById("playerWpmLabel");
const playerCar = document.getElementById("playerCar");
const bot1Car = document.getElementById("bot1Car");
const bot2Car = document.getElementById("bot2Car");
const bot3Car = document.getElementById("bot3Car");

const typedTextSpan = document.getElementById("typedTextSpan");
const remainingTextSpan = document.getElementById("remainingTextSpan");
const typeInput = document.getElementById("typeInput");
const accuracyDisplay = document.getElementById("accuracyDisplay");

const activeControls = document.getElementById("activeControls");
const finishedBanner = document.getElementById("finishedBanner");
const finalWpm = document.getElementById("finalWpm");
const changeQuoteBtn = document.getElementById("changeQuoteBtn");
const nextRaceBtn = document.getElementById("nextRaceBtn");
const statusMessage = document.getElementById("statusMessage");

/* ==================== SOUND & MUSIC ==================== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = "sine", duration = 0.08, gainVal = 0.1) {
  if (!soundEnabled) return;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

soundToggleBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = soundEnabled ? "🔊" : "🔇";
});

musicToggleBtn.addEventListener("click", () => {
  if (!bgMusic) return;
  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying = false;
    musicToggleBtn.textContent = "🎵 OFF";
    musicToggleBtn.className = "bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-full text-[10px] font-bold transition";
  } else {
    bgMusic.volume = 0.35;
    bgMusic.play().then(() => {
      musicPlaying = true;
      musicToggleBtn.textContent = "🎵 ON";
      musicToggleBtn.className = "bg-[#00f0ff]/20 border border-[#00f0ff] text-[#00f0ff] px-2 py-1 rounded-full text-[10px] font-bold transition";
    }).catch(() => {
      alert("Place song.mp3 inside creazy/song.mp3 or typerace/song.mp3!");
    });
  }
});

/* ==================== BOT SIMULATION ==================== */
function startBotSimulation() {
  if (botInterval) clearInterval(botInterval);
  botInterval = setInterval(() => {
    if (!startTime || isFinished) return;

    bot1Progress = Math.min(100, bot1Progress + Math.random() * 3.5 + 1.2);
    bot2Progress = Math.min(100, bot2Progress + Math.random() * 4.0 + 1.0);
    bot3Progress = Math.min(100, bot3Progress + Math.random() * 3.0 + 1.5);

    updateTracksUI();
  }, 400);
}

function updateTracksUI() {
  const playerProgress = targetText.length > 0 ? (typedText.length / targetText.length) * 100 : 0;
  playerCar.style.left = `calc(${playerProgress}% - 22px)`;
  bot1Car.style.left = `calc(${bot1Progress}% - 22px)`;
  bot2Car.style.left = `calc(${bot2Progress}% - 22px)`;
  bot3Car.style.left = `calc(${bot3Progress}% - 22px)`;
  playerWpmLabel.textContent = `YOU (${wpm} WPM)`;
}

function updateTextUI() {
  typedTextSpan.textContent = typedText;
  remainingTextSpan.textContent = targetText.slice(typedText.length);
}

function startNewRace() {
  targetText = sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)];
  typedText = '';
  startTime = null;
  wpm = 0;
  accuracy = 100;
  isFinished = false;
  bot1Progress = 0;
  bot2Progress = 0;
  bot3Progress = 0;

  if (botInterval) clearInterval(botInterval);

  typeInput.value = '';
  typeInput.disabled = false;
  typeInput.focus();

  finishedBanner.classList.add('hidden');
  activeControls.classList.remove('hidden');
  statusMessage.textContent = "Type to start race...";

  accuracyDisplay.textContent = "100%";
  updateTextUI();
  updateTracksUI();
}

typeInput.addEventListener('input', (e) => {
  const val = e.target.value;

  if (!startTime && val.length > 0) {
    startTime = Date.now();
    startBotSimulation();
    playTone(800, "sine", 0.08);
  }

  // Strict prefix validation
  if (targetText.startsWith(val)) {
    typedText = val;
    playTone(450, "triangle", 0.04, 0.05);

    if (startTime) {
      const elapsedMin = (Date.now() - startTime) / 60000;
      const words = val.length / 5;
      wpm = Math.round(words / Math.max(0.01, elapsedMin));
    }

    updateTextUI();
    updateTracksUI();

    if (val === targetText) {
      isFinished = true;
      typeInput.disabled = true;
      if (botInterval) clearInterval(botInterval);

      finalWpm.textContent = `${wpm} WPM`;
      activeControls.classList.add('hidden');
      finishedBanner.classList.remove('hidden');

      if (typeof window.submitScore === "function") {
        window.submitScore(wpm);
      }

      if (typeof confetti === "function") confetti();
      playTone(1046.5, "sine", 0.3, 0.2);
    }
  } else {
    // Wrong key typed -> slightly drop accuracy
    accuracy = Math.max(50, accuracy - 2);
    accuracyDisplay.textContent = `${accuracy}%`;
    playTone(180, "sawtooth", 0.1, 0.1);
    e.target.value = typedText; // Prevent incorrect text entry
  }
});

changeQuoteBtn.addEventListener('click', startNewRace);
nextRaceBtn.addEventListener('click', startNewRace);

// Initialize First Race
updateTextUI();
updateTracksUI();
typeInput.focus();
