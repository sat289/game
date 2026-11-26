/* =========================================================
   Tournament Controller, Asset Preloader & Screen Navigation
   ========================================================= */

(function () {
  const SAVE_KEY = 'cwc_batting_tournament_v1';

  const dom = {
    loader: document.getElementById('loader-overlay'),
    loaderBar: document.getElementById('loader-bar-fill'),
    loaderText: document.getElementById('loader-text'),

    screens: {
      title: document.getElementById('screen-title'),
      team: document.getElementById('screen-team'),
      overs: document.getElementById('screen-overs'),
      matchup: document.getElementById('screen-matchup'),
      briefing: document.getElementById('screen-briefing'),
      game: document.getElementById('screen-game'),
      trophy: document.getElementById('screen-trophy')
    },

    btnHome: document.getElementById('btn-home'),
    btnPause: document.getElementById('btn-pause'),
    btnSound: document.getElementById('btn-sound'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    btnFullscreen: document.getElementById('btn-fullscreen'),

    btnTitlePlay: document.getElementById('btn-title-play'),
    btnTitleReset: document.getElementById('btn-title-reset'),

    teamGrid: document.getElementById('team-grid'),
    oversTeamGrid: document.getElementById('overs-team-grid'),
    previewImg: document.getElementById('preview-captain-img'),
    previewName: document.getElementById('preview-team-name'),
    btnTeamNext: document.getElementById('btn-team-next'),

    oversCards: document.querySelectorAll('.overs-card'),
    btnOversBack: document.getElementById('btn-overs-back'),
    btnOversStart: document.getElementById('btn-overs-start'),

    matchupHeadline: document.getElementById('matchup-headline'),
    matchupSubline: document.getElementById('matchup-subline'),
    matchupPlayerImg: document.getElementById('matchup-player-img'),
    matchupPlayerName: document.getElementById('matchup-player-name'),
    matchupOppImg: document.getElementById('matchup-opp-img'),
    matchupOppName: document.getElementById('matchup-opp-name'),
    btnMatchupPlay: document.getElementById('btn-matchup-play'),

    briefingText: document.getElementById('briefing-text'),
    btnBriefingPlay: document.getElementById('btn-briefing-play'),

    canvas: document.getElementById('game-canvas'),
    hudTarget: document.getElementById('hud-target'),
    hudLastShot: document.getElementById('hud-last-shot'),
    hudBalls: document.getElementById('hud-balls'),
    hudWickets: document.getElementById('hud-wickets'),
    hudDelivery: document.getElementById('hud-delivery-pill'),
    hudTeamA: document.getElementById('hud-team-a'),
    hudTeamB: document.getElementById('hud-team-b'),
    hudTapHint: document.getElementById('hud-tap-hint'),

    modalPause: document.getElementById('modal-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnRestartMatch: document.getElementById('btn-restart-match'),
    btnQuitHome: document.getElementById('btn-quit-home'),

    modalResult: document.getElementById('modal-result'),
    resultTitle: document.getElementById('result-title'),
    resultStats: document.getElementById('result-stats'),
    btnResultNext: document.getElementById('btn-result-next'),

    trophyImg: document.getElementById('trophy-img'),
    trophyTitle: document.getElementById('trophy-title'),
    trophySubtitle: document.getElementById('trophy-subtitle'),
    trophySummary: document.getElementById('trophy-summary'),
    btnTrophyNew: document.getElementById('btn-trophy-new')
  };

  let selectedTeamId = 'india';
  let selectedOvers = 2;
  let tournament = null;
  let currentMatchTarget = 24;
  let currentOpponent = null;
  let hasSwungOnce = false;

  const renderer = new GameRenderer(dom.canvas);
  const engine = new CricketMatchEngine(renderer, {
    onHudUpdate: updateHud,
    onDeliveryChange: updateDeliveryPill,
    onMatchEnd: handleMatchEnd
  });

  // ---------- Asset Preloader ----------
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function preloadAllAssets() {
    const manifest = [
      { key: 'stadium', src: 'images/stadium-bg.png' },
      { key: 'ball', src: 'images/sprites/ball.png' },
      { key: 'stumps', src: 'images/sprites/stumps.png' },
      { key: 'stumpSingle', src: 'images/sprites/stump_single.png' },
      { key: 'bail', src: 'images/sprites/bail.png' },
      { key: 'balloons', src: 'images/sprites/balloons.png' }
    ];

    CWC_CONFIG.TEAMS.forEach((t) => {
      manifest.push({ key: 'batsman_' + t.id, src: 'images/batsmen/' + t.id + '.png', teamId: t.id });
      manifest.push({ key: 'captain_' + t.id, src: 'images/captains/' + t.id + '.png' });
    });

    const assets = { batsmen: {} };
    let loaded = 0;
    const total = manifest.length;

    await Promise.all(
      manifest.map(async (item) => {
        const img = await loadImage(item.src);
        if (item.teamId) {
          assets.batsmen[item.teamId] = img;
        } else {
          assets[item.key] = img;
        }
        loaded++;
        const pct = Math.round((loaded / total) * 100);
        dom.loaderBar.style.width = pct + '%';
        dom.loaderText.textContent = `Loading Stadium Assets... ${pct}%`;
      })
    );

    renderer.setAssets(assets);
    setTimeout(() => dom.loader.classList.remove('active'), 180);
  }

  // ---------- Save / Load Tournament ----------
  function saveTournament() {
    if (tournament) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(tournament));
    } else {
      localStorage.removeItem(SAVE_KEY);
    }
    syncTitleResetButton();
  }

  function loadTournament() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      tournament = raw ? JSON.parse(raw) : null;
    } catch {
      tournament = null;
    }
    syncTitleResetButton();
  }

  function syncTitleResetButton() {
    if (tournament) {
      dom.btnTitleReset.classList.remove('hidden');
    } else {
      dom.btnTitleReset.classList.add('hidden');
    }
  }

  function getTeamById(id) {
    return CWC_CONFIG.TEAMS.find((t) => t.id === id) || CWC_CONFIG.TEAMS[0];
  }

  function createTournament(teamId, overs) {
    // Shuffle the 9 opponent teams for the World Cup league schedule
    const opps = CWC_CONFIG.TEAMS.filter((t) => t.id !== teamId).map((t) => t.id);
    for (let i = opps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opps[i], opps[j]] = [opps[j], opps[i]];
    }
    tournament = {
      teamId,
      overs,
      stage: 'league', // league | semi | final | champion | eliminated
      schedule: opps,
      matchIndex: 0,
      wins: 0,
      losses: 0,
      totalRuns: 0,
      totalSixes: 0,
      totalFours: 0
    };
    saveTournament();
  }

  // ---------- Screen Router ----------
  function showScreen(name) {
    Object.entries(dom.screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });

    // Manage global top-left icon visibility
    const showHome = name === 'matchup' || name === 'team' || name === 'overs' || name === 'briefing';
    const showPause = name === 'game';
    dom.btnHome.classList.toggle('hidden', !showHome);
    dom.btnPause.classList.toggle('hidden', !showPause);

    if (name !== 'game') {
      engine.stop();
      dom.modalPause.classList.add('hidden');
      dom.modalResult.classList.add('hidden');
    }
  }

  // ---------- Build 10-Team Selection Grids ----------
  function buildTeamGrids() {
    dom.teamGrid.innerHTML = '';
    dom.oversTeamGrid.innerHTML = '';

    CWC_CONFIG.TEAMS.forEach((team) => {
      const makeCard = (interactive) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'team-card' + (team.id === selectedTeamId ? ' selected' : '');
        card.dataset.id = team.id;
        card.innerHTML = `
          <img src="images/captains/${team.id}.png" alt="${team.name}" />
          <span class="card-code">${team.short}</span>
        `;
        if (interactive) {
          card.addEventListener('click', () => {
            soundEngine.playClick();
            selectTeam(team.id);
          });
        }
        return card;
      };
      dom.teamGrid.appendChild(makeCard(true));
      dom.oversTeamGrid.appendChild(makeCard(false));
    });
    selectTeam(selectedTeamId);
  }

  function selectTeam(id) {
    selectedTeamId = id;
    const t = getTeamById(id);
    dom.previewImg.src = `images/captains/${t.id}.png`;
    dom.previewName.textContent = t.name;

    document.querySelectorAll('.team-card').forEach((el) => {
      el.classList.toggle('selected', el.dataset.id === id);
    });
  }

  // ---------- Tournament Matchup Screen ----------
  function openMatchupScreen() {
    if (!tournament) {
      showScreen('team');
      return;
    }

    if (tournament.stage === 'champion' || tournament.stage === 'eliminated') {
      openTrophyScreen(tournament.stage === 'champion');
      return;
    }

    const playerTeam = getTeamById(tournament.teamId);
    let oppId;
    if (tournament.stage === 'league') {
      oppId = tournament.schedule[tournament.matchIndex];
      const matchesLeft = CWC_CONFIG.TOURNAMENT.LEAGUE_MATCHES - tournament.matchIndex;
      const winsNeeded = Math.max(1, CWC_CONFIG.TOURNAMENT.WINS_TO_QUALIFY - tournament.wins);
      dom.matchupHeadline.textContent = `Win ${winsNeeded} ${winsNeeded === 1 ? 'match' : 'matches'} out of ${matchesLeft} to reach qualifier`;
      dom.matchupSubline.textContent = `LEAGUE MATCH ${tournament.matchIndex + 1} OF 9 • WON: ${tournament.wins} • ${tournament.overs} OVERS`;
    } else if (tournament.stage === 'semi') {
      oppId = tournament.semiOppId;
      dom.matchupHeadline.textContent = 'SEMI-FINAL — Win to reach the World Cup Final!';
      dom.matchupSubline.textContent = `KNOCKOUT SEMI-FINAL • LEAGUE WINS: ${tournament.wins}/9`;
    } else {
      oppId = tournament.finalOppId;
      dom.matchupHeadline.textContent = 'WORLD CUP FINAL — Win to lift the Trophy!';
      dom.matchupSubline.textContent = 'GRAND CHAMPIONSHIP SHOWDOWN';
    }

    currentOpponent = getTeamById(oppId);
    dom.matchupPlayerImg.src = `images/captains/${playerTeam.id}.png`;
    dom.matchupPlayerName.textContent = playerTeam.name;
    dom.matchupOppImg.src = `images/captains/${currentOpponent.id}.png`;
    dom.matchupOppName.textContent = currentOpponent.name;

    showScreen('matchup');
  }

  // ---------- Pre-Match Target Briefing ----------
  function openBriefingScreen() {
    const mode = CWC_CONFIG.OVERS_MODES[tournament.overs];
    // Generate balanced, exciting target score scaled by stage & opponent strength
    const stageBoost = tournament.stage === 'final' ? 1.12 : tournament.stage === 'semi' ? 1.06 : 1.0;
    const rawMin = mode.baseTargetMin * currentOpponent.strength * stageBoost;
    const rawMax = mode.baseTargetMax * currentOpponent.strength * stageBoost;
    currentMatchTarget = Math.round(rawMin + Math.random() * (rawMax - rawMin));

    const oppProper = currentOpponent.name
      .toLowerCase()
      .replace(/\w/g, (c) => c.toUpperCase());

    dom.briefingText.textContent =
      `You have ${mode.balls} balls and ${mode.wickets} ${mode.wickets === 1 ? 'wicket' : 'wickets'} to chase ${oppProper}'s total of ${currentMatchTarget} score`;

    showScreen('briefing');
  }

  // ---------- Launch Live Match ----------
  function launchMatch() {
    const playerTeam = getTeamById(tournament.teamId);
    dom.hudTeamA.textContent = playerTeam.name;
    dom.hudTeamB.textContent = currentOpponent.name;
    dom.hudTapHint.classList.toggle('hidden', hasSwungOnce);
    dom.modalPause.classList.add('hidden');
    dom.modalResult.classList.add('hidden');

    showScreen('game');
    renderer.resize();
    engine.startMatch(playerTeam, currentOpponent, tournament.overs, currentMatchTarget);
  }

  function updateHud(state, shotBadge) {
    dom.hudTarget.textContent = state.targetRemaining;
    dom.hudBalls.textContent = state.ballsLeft;
    dom.hudWickets.textContent = state.wicketsLeft;

    if (shotBadge !== '') {
      dom.hudLastShot.textContent = shotBadge;
      dom.hudLastShot.className = 'hud-last-shot pop';
      if (shotBadge === '6') dom.hudLastShot.classList.add('six');
      else if (shotBadge === '4') dom.hudLastShot.classList.add('four');
      else if (shotBadge === 'OUT') dom.hudLastShot.classList.add('out');
      void dom.hudLastShot.offsetWidth;
    } else {
      dom.hudLastShot.textContent = '';
      dom.hudLastShot.className = 'hud-last-shot';
    }
  }

  function updateDeliveryPill(delivery) {
    if (!delivery) {
      dom.hudDelivery.classList.add('hidden');
      return;
    }
    dom.hudDelivery.textContent = `${delivery.name} • ${delivery.kmh} KM/H`;
    dom.hudDelivery.classList.remove('hidden');
  }

  // ---------- Match Result & Tournament Progression ----------
  function handleMatchEnd(won, stats) {
    tournament.totalRuns += stats.runsScored;
    tournament.totalSixes += stats.sixes;
    tournament.totalFours += stats.fours;

    if (tournament.stage === 'league') {
      if (won) tournament.wins++;
      else tournament.losses++;
      tournament.matchIndex++;

      const remaining = CWC_CONFIG.TOURNAMENT.LEAGUE_MATCHES - tournament.matchIndex;
      if (tournament.wins >= CWC_CONFIG.TOURNAMENT.WINS_TO_QUALIFY && remaining === 0) {
        advanceToSemi();
      } else if (tournament.wins >= CWC_CONFIG.TOURNAMENT.WINS_TO_QUALIFY) {
        // Qualified early -> still can advance straight to Semi-Final if all 9 done, or keep building wins!
        // Let's advance to Semi-Final right when 5 wins are reached (super rewarding!)
        advanceToSemi();
      } else if (tournament.wins + remaining < CWC_CONFIG.TOURNAMENT.WINS_TO_QUALIFY) {
        tournament.stage = 'eliminated';
      }
    } else if (tournament.stage === 'semi') {
      if (won) {
        const finalists = CWC_CONFIG.TEAMS.filter(
          (t) => t.id !== tournament.teamId && t.id !== tournament.semiOppId
        );
        finalists.sort((a, b) => b.strength - a.strength);
        tournament.finalOppId = finalists[0].id;
        tournament.stage = 'final';
      } else {
        tournament.stage = 'eliminated';
      }
    } else if (tournament.stage === 'final') {
      tournament.stage = won ? 'champion' : 'eliminated';
    }

    saveTournament();

    dom.resultTitle.textContent = won ? 'You won the match!' : 'You lose the match';
    dom.resultTitle.className = 'result-title' + (won ? ' win' : '');
    dom.resultStats.textContent =
      `Scored ${stats.runsScored}/${stats.wicketsLost} (${stats.ballsUsed} balls) • Sixes: ${stats.sixes} • Fours: ${stats.fours}`;
    dom.modalResult.classList.remove('hidden');
  }

  function advanceToSemi() {
    const rivals = CWC_CONFIG.TEAMS.filter((t) => t.id !== tournament.teamId);
    rivals.sort((a, b) => b.strength - a.strength);
    tournament.semiOppId = rivals[1].id;
    tournament.stage = 'semi';
  }

  function openTrophyScreen(isChampion) {
    const team = getTeamById(tournament.teamId);
    dom.trophyImg.classList.toggle('hidden', !isChampion);
    dom.trophyTitle.textContent = isChampion ? 'WORLD CUP CHAMPIONS!' : 'TOURNAMENT OVER';
    dom.trophySubtitle.textContent = isChampion
      ? `${team.name} LIFT THE CRICKET WORLD CUP!`
      : `${team.name} FELL SHORT OF THE QUALIFIER`;
    dom.trophySummary.innerHTML = `
      <strong>League Wins:</strong> ${tournament.wins} &nbsp;|&nbsp;
      <strong>Total Runs:</strong> ${tournament.totalRuns}<br/>
      <strong>Sixes:</strong> ${tournament.totalSixes} &nbsp;|&nbsp;
      <strong>Fours:</strong> ${tournament.totalFours}
    `;
    showScreen('trophy');
  }

  // ---------- Event Bindings ----------
  function bindEvents() {
    // Sound toggle
    dom.btnSound.addEventListener('click', () => {
      const muted = soundEngine.toggleMute();
      dom.iconSoundOn.classList.toggle('hidden', muted);
      dom.iconSoundOff.classList.toggle('hidden', !muted);
      if (!muted) soundEngine.playClick();
    });

    // Fullscreen toggle
    dom.btnFullscreen.addEventListener('click', () => {
      soundEngine.playClick();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // Home button
    dom.btnHome.addEventListener('click', () => {
      soundEngine.playClick();
      showScreen('title');
    });

    // Pause controls
    dom.btnPause.addEventListener('click', () => {
      if (engine.state.matchOver) return;
      soundEngine.playClick();
      engine.setPaused(true);
      dom.modalPause.classList.remove('hidden');
    });
    dom.btnResume.addEventListener('click', () => {
      soundEngine.playClick();
      dom.modalPause.classList.add('hidden');
      engine.setPaused(false);
    });
    dom.btnRestartMatch.addEventListener('click', () => {
      soundEngine.playClick();
      launchMatch();
    });
    dom.btnQuitHome.addEventListener('click', () => {
      soundEngine.playClick();
      showScreen('title');
    });

    // Title buttons
    dom.btnTitlePlay.addEventListener('click', () => {
      soundEngine.init();
      soundEngine.playClick();
      if (tournament && tournament.stage !== 'champion' && tournament.stage !== 'eliminated') {
        openMatchupScreen();
      } else {
        showScreen('team');
      }
    });

    dom.btnTitleReset.addEventListener('click', () => {
      soundEngine.playClick();
      tournament = null;
      saveTournament();
      showScreen('team');
    });

    // Team -> Overs
    dom.btnTeamNext.addEventListener('click', () => {
      soundEngine.playClick();
      showScreen('overs');
    });

    // Overs selection
    dom.oversCards.forEach((card) => {
      card.addEventListener('click', () => {
        soundEngine.playClick();
        selectedOvers = Number(card.dataset.overs);
        dom.oversCards.forEach((c) => c.classList.toggle('active', c === card));
      });
    });

    dom.btnOversBack.addEventListener('click', () => {
      soundEngine.playClick();
      showScreen('team');
    });

    dom.btnOversStart.addEventListener('click', () => {
      soundEngine.playClick();
      createTournament(selectedTeamId, selectedOvers);
      openMatchupScreen();
    });

    // Matchup -> Briefing -> Live Match
    dom.btnMatchupPlay.addEventListener('click', () => {
      soundEngine.playClick();
      openBriefingScreen();
    });

    dom.btnBriefingPlay.addEventListener('click', () => {
      soundEngine.playClick();
      launchMatch();
    });

    // Result Next
    dom.btnResultNext.addEventListener('click', () => {
      soundEngine.playClick();
      openMatchupScreen();
    });

    // New Tournament from Trophy Screen
    dom.btnTrophyNew.addEventListener('click', () => {
      soundEngine.playClick();
      tournament = null;
      saveTournament();
      showScreen('team');
    });

    // Batting Controls: PointerDown (ultra-fast mobile touch + mouse click!) & Keyboard
    const handleBatInput = (e) => {
      if (!dom.screens.game.classList.contains('active')) return;
      if (engine.paused || engine.state.matchOver) return;
      if (e.target.closest('button')) return;
      if (!hasSwungOnce) {
        hasSwungOnce = true;
        dom.hudTapHint.classList.add('hidden');
      }
      engine.triggerSwing();
    };

    dom.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleBatInput(e);
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
        if (dom.screens.game.classList.contains('active') && !engine.paused && !engine.state.matchOver) {
          e.preventDefault();
          handleBatInput(e);
        }
      } else if (e.code === 'Escape' && dom.screens.game.classList.contains('active')) {
        if (!engine.state.matchOver) {
          const nextPause = !engine.paused;
          engine.setPaused(nextPause);
          dom.modalPause.classList.toggle('hidden', !nextPause);
        }
      }
    });
  }

  // ---------- Boot ----------
  loadTournament();
  buildTeamGrids();
  bindEvents();
  preloadAllAssets();
})();
