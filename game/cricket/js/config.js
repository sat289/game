/* =========================================================
   Game Configuration: Teams, Overs Modes, Deliveries & Arc Zones
   ========================================================= */

window.CWC_CONFIG = {
  VIRTUAL_W: 1280,
  VIRTUAL_H: 720,

  TEAMS: [
    { id: 'india',        name: 'INDIA',        short: 'IND', primary: '#1565D8', secondary: '#FF7A00', strength: 1.08 },
    { id: 'new_zealand',  name: 'NEW ZEALAND',  short: 'NZ',  primary: '#1E2228', secondary: '#00B8D4', strength: 1.02 },
    { id: 'south_africa', name: 'SOUTH AFRICA', short: 'SA',  primary: '#1B7A3E', secondary: '#FFD600', strength: 1.04 },
    { id: 'afghanistan',  name: 'AFGHANISTAN',  short: 'AFG', primary: '#1557B0', secondary: '#D32F2F', strength: 0.94 },
    { id: 'pakistan',     name: 'PAKISTAN',     short: 'PAK', primary: '#146B3A', secondary: '#9CCC65', strength: 1.01 },
    { id: 'bangladesh',   name: 'BANGLADESH',   short: 'BAN', primary: '#0E6B47', secondary: '#D92332', strength: 0.92 },
    { id: 'england',      name: 'ENGLAND',      short: 'ENG', primary: '#1E88E5', secondary: '#D32F2F', strength: 1.05 },
    { id: 'australia',    name: 'AUSTRALIA',    short: 'AUS', primary: '#F4C414', secondary: '#1B7A3E', strength: 1.09 },
    { id: 'sri_lanka',    name: 'SRI LANKA',    short: 'SL',  primary: '#16499A', secondary: '#FBC02D', strength: 0.95 },
    { id: 'west_indies',  name: 'WEST INDIES',  short: 'WI',  primary: '#7B1528', secondary: '#FBC02D', strength: 0.98 }
  ],

  OVERS_MODES: {
    2:  { overs: 2,  balls: 12, wickets: 2, baseTargetMin: 18, baseTargetMax: 29 },
    5:  { overs: 5,  balls: 30, wickets: 4, baseTargetMin: 46, baseTargetMax: 70 },
    10: { overs: 10, balls: 60, wickets: 7, baseTargetMin: 95, baseTargetMax: 138 }
  },

  TOURNAMENT: {
    LEAGUE_MATCHES: 9,
    WINS_TO_QUALIFY: 5
  },

  // Right-side curved run arc zones from bottom (1) to top (6)
  // Angles in degrees relative to arc center (left of screen edge)
  ARC_ZONES: [
    { runs: 6, label: '6', startDeg: -62, endDeg: -42, color: '#FFD43B' },
    { runs: 4, label: '4', startDeg: -42, endDeg: -22, color: '#38D9F5' },
    { runs: 3, label: '3', startDeg: -22, endDeg: -4,  color: '#69DB7C' },
    { runs: 2, label: '2', startDeg: -4,  endDeg: 14,  color: '#FFA94D' },
    { runs: 1, label: '1', startDeg: 14,  endDeg: 34,  color: '#E9ECEF' }
  ],

  DELIVERY_TYPES: [
    { name: 'FAST BALL',   kmhMin: 140, kmhMax: 152, speed: 980,  bounceX: 540, bounceHeight: 0.62, gravity: 1750 },
    { name: 'MEDIUM PACE', kmhMin: 126, kmhMax: 137, speed: 830,  bounceX: 500, bounceHeight: 0.66, gravity: 1620 },
    { name: 'YORKER',      kmhMin: 138, kmhMax: 149, speed: 940,  bounceX: 335, bounceHeight: 0.42, gravity: 1820 },
    { name: 'SLOWER SPIN', kmhMin: 86,  kmhMax: 98,  speed: 650,  bounceX: 470, bounceHeight: 0.78, gravity: 1380 },
    { name: 'BOUNCER',     kmhMin: 136, kmhMax: 146, speed: 900,  bounceX: 615, bounceHeight: 0.84, gravity: 1520 },
    { name: 'INSWINGER',   kmhMin: 132, kmhMax: 143, speed: 880,  bounceX: 445, bounceHeight: 0.58, gravity: 1680 }
  ]
};

