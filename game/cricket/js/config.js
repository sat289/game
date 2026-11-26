/* =========================================================
   Game Configuration: 10 International Teams, Kits & Physics
   ========================================================= */

window.CWC_CONFIG = {
  VIRTUAL_W: 1280,
  VIRTUAL_H: 720,

  TEAMS: [
    { id: 'india',        name: 'INDIA',        short: 'IND', primary: '#1565D8', secondary: '#FF7A00', helmet: '#0C3F8F', skin: '#C98E64', bowler: 'BUMRAH',     batRate: 95, paceRate: 94, strength: 1.08 },
    { id: 'new_zealand',  name: 'NEW ZEALAND',  short: 'NZ',  primary: '#1E242E', secondary: '#E2E8F0', helmet: '#10141B', skin: '#EBC2A6', bowler: 'BOULT',      batRate: 90, paceRate: 92, strength: 1.02 },
    { id: 'south_africa', name: 'SOUTH AFRICA', short: 'SA',  primary: '#147539', secondary: '#FFD600', helmet: '#0C4F25', skin: '#E5BB9D', bowler: 'RABADA',     batRate: 91, paceRate: 95, strength: 1.05 },
    { id: 'afghanistan',  name: 'AFGHANISTAN',  short: 'AFG', primary: '#1554B0', secondary: '#D32F2F', helmet: '#0C3575', skin: '#D6A07B', bowler: 'RASHID',     batRate: 84, paceRate: 91, strength: 0.95 },
    { id: 'pakistan',     name: 'PAKISTAN',     short: 'PAK', primary: '#116B38', secondary: '#9CCC65', helmet: '#0A4724', skin: '#D59C74', bowler: 'SHAHEEN',    batRate: 89, paceRate: 93, strength: 1.01 },
    { id: 'bangladesh',   name: 'BANGLADESH',   short: 'BAN', primary: '#0D6644', secondary: '#DA212E', helmet: '#07422B', skin: '#C48A62', bowler: 'MUSTAFIZUR', batRate: 83, paceRate: 85, strength: 0.92 },
    { id: 'england',      name: 'ENGLAND',      short: 'ENG', primary: '#1B78D4', secondary: '#D32F2F', helmet: '#0E2E5C', skin: '#F0C8AD', bowler: 'ARCHER',     batRate: 93, paceRate: 93, strength: 1.06 },
    { id: 'australia',    name: 'AUSTRALIA',    short: 'AUS', primary: '#F0BE0C', secondary: '#147539', helmet: '#0E5228', skin: '#EEC2A1', bowler: 'STARC',      batRate: 94, paceRate: 96, strength: 1.09 },
    { id: 'sri_lanka',    name: 'SRI LANKA',    short: 'SL',  primary: '#154496', secondary: '#FBC02D', helmet: '#0B2A61', skin: '#B47850', bowler: 'PATHIRANA',  batRate: 85, paceRate: 88, strength: 0.96 },
    { id: 'west_indies',  name: 'WEST INDIES',  short: 'WI',  primary: '#7A1226', secondary: '#FBC02D', helmet: '#4F0A18', skin: '#6D422B', bowler: 'JOSEPH',     batRate: 90, paceRate: 89, strength: 0.99 }
  ],

  OVERS_MODES: {
    2:  { overs: 2,  balls: 12, wickets: 2, baseTargetMin: 18, baseTargetMax: 28 },
    5:  { overs: 5,  balls: 30, wickets: 4, baseTargetMin: 46, baseTargetMax: 68 },
    10: { overs: 10, balls: 60, wickets: 7, baseTargetMin: 95, baseTargetMax: 135 }
  },

  TOURNAMENT: {
    LEAGUE_MATCHES: 9,
    WINS_TO_QUALIFY: 5
  },

  // Curved Stadium Run Arc geometry (right side of 1280x720 arena)
  ARC: {
    cx: 560,
    cy: 530,
    radius: 565
  },

  ARC_ZONES: [
    { runs: 6, label: '6', startDeg: -60, endDeg: -40, color: '#FFD43B' },
    { runs: 4, label: '4', startDeg: -40, endDeg: -20, color: '#38D9F5' },
    { runs: 3, label: '3', startDeg: -20, endDeg: -2,  color: '#69DB7C' },
    { runs: 2, label: '2', startDeg: -2,  endDeg: 14,  color: '#FFA94D' },
    { runs: 1, label: '1', startDeg: 14,  endDeg: 28,  color: '#E9ECEF' }
  ],

  // Realistic Cricket Deliveries (balanced speed so hitting feels crisp & fair!)
  DELIVERY_TYPES: [
    { name: 'GOOD LENGTH',  kmhMin: 134, kmhMax: 142, speed: 760, bounceX: 505, bounceRest: 0.62, gravity: 1480, labelColor: '#ffd43b' },
    { name: 'EXPRESS PACE', kmhMin: 144, kmhMax: 152, speed: 845, bounceX: 525, bounceRest: 0.60, gravity: 1560, labelColor: '#ff6b6b' },
    { name: 'YORKER',       kmhMin: 138, kmhMax: 147, speed: 790, bounceX: 385, bounceRest: 0.44, gravity: 1620, labelColor: '#ff922b' },
    { name: 'LEG SPIN',     kmhMin: 84,  kmhMax: 94,  speed: 575, bounceX: 480, bounceRest: 0.72, gravity: 1240, labelColor: '#69db7c' },
    { name: 'OFF CUTTER',   kmhMin: 112, kmhMax: 122, speed: 660, bounceX: 470, bounceRest: 0.65, gravity: 1360, labelColor: '#38d9f5' },
    { name: 'SHORT BALL',   kmhMin: 136, kmhMax: 145, speed: 775, bounceX: 590, bounceRest: 0.76, gravity: 1380, labelColor: '#f06595' }
  ]
};
