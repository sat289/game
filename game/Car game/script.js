* {
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #04070d;
  color: #f8fafc;
  font-family: 'Inter', sans-serif;
}

.font-display {
  font-family: 'Orbitron', 'Inter', sans-serif;
}

/* Sideways Landscape Stage (Auto-rotates 90deg in portrait like watching a movie sideways) */
#gameStage {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  transform-origin: top left;
}

#gameStage.rotated-sideways {
  width: 100vh;
  height: 100vw;
  transform: rotate(90deg) translateY(-100%);
}

.splash-backdrop {
  background:
    radial-gradient(circle at 50% 45%, rgba(0, 240, 255, 0.16) 0%, rgba(255, 106, 0, 0.08) 35%, rgba(4, 7, 13, 0.96) 72%),
    repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 2px, transparent 2px, transparent 8px),
    #04070d;
}

.logo-btn {
  position: relative;
  cursor: pointer;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), filter 0.28s ease;
  filter: drop-shadow(0 0 28px rgba(0, 240, 255, 0.45)) drop-shadow(0 0 55px rgba(255, 106, 0, 0.25));
  animation: logoFloat 3.4s ease-in-out infinite;
}

.logo-btn:hover {
  transform: scale(1.06);
  filter: drop-shadow(0 0 42px rgba(0, 240, 255, 0.78)) drop-shadow(0 0 75px rgba(255, 106, 0, 0.45));
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-7px); }
}

.pulse-ring {
  position: absolute;
  inset: -14px;
  border-radius: 9999px;
  border: 2px solid rgba(0, 240, 255, 0.45);
  animation: ringPulse 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
  pointer-events: none;
}

.pulse-ring-2 {
  animation-delay: 1.2s;
  border-color: rgba(255, 106, 0, 0.4);
}

@keyframes ringPulse {
  0% { transform: scale(0.88); opacity: 0.85; }
  100% { transform: scale(1.26); opacity: 0; }
}

.bg-slide {
  position: absolute;
  inset: -6%;
  width: 112%;
  height: 112%;
  object-fit: cover;
  opacity: 0;
  will-change: transform, opacity;
  transition: opacity 1.1s ease-in-out;
}

.bg-slide.active { opacity: 0.82; }
.bg-pan-1 { animation: panZoomLeft 6s ease-in-out infinite alternate; }
.bg-pan-2 { animation: panZoomRight 6s ease-in-out infinite alternate; }

@keyframes panZoomLeft {
  0% { transform: scale(1.04) translate3d(-2%, 1%, 0); }
  100% { transform: scale(1.16) translate3d(2.5%, -1.5%, 0); }
}

@keyframes panZoomRight {
  0% { transform: scale(1.15) translate3d(2%, -1%, 0); }
  100% { transform: scale(1.05) translate3d(-2.5%, 1.5%, 0); }
}

.nitro-fill {
  background: linear-gradient(90deg, #00f0ff 0%, #3b82f6 38%, #ff6a00 78%, #ffd166 100%);
  box-shadow: 0 0 18px rgba(0, 240, 255, 0.7), 0 0 28px rgba(255, 106, 0, 0.5);
  position: relative;
  overflow: hidden;
}

.nitro-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%);
  transform: translateX(-100%);
  animation: shimmer 1.1s linear infinite;
}

@keyframes shimmer { 100% { transform: translateX(100%); } }

.screen {
  position: absolute;
  inset: 0;
  transition: opacity 0.35s ease, visibility 0.35s ease;
}

.screen.hidden-screen {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.screen.visible-screen {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.garage-bg {
  background:
    radial-gradient(ellipse at 45% 48%, rgba(0, 240, 255, 0.14) 0%, rgba(15, 23, 42, 0.65) 45%, #03060c 85%),
    linear-gradient(180deg, #060b14 0%, #09111f 55%, #03050a 100%);
}

.turntable-ring {
  background: radial-gradient(ellipse at center, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.05) 58%, transparent 72%);
  border: 2px solid rgba(0, 240, 255, 0.65);
  box-shadow: 0 0 35px rgba(0, 240, 255, 0.35), inset 0 0 30px rgba(0, 240, 255, 0.2);
  transform: perspective(600px) rotateX(72deg);
}

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
