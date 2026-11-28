const LEVELS = [
  {
    id: '1-1',
    name: 'Earth Orbit',
    isBoss: false,
    rewardCoins: 150,
    tasks: [
      { label: 'Destroy 50% of enemy forces!', pct: 0.5 },
      { label: 'Destroy 80% of enemy forces!', pct: 0.8 },
      { label: 'Destroy 90% of enemy forces!', pct: 0.9 }
    ],
    waves: [
      { type: 'wasp', formation: 'v_shape', count: 9 },
      { type: 'beetle', formation: 'grid', count: 10 },
      { type: 'wasp', formation: 'circle', count: 12 },
      { type: 'cyberfly', formation: 'v_shape', count: 9 },
      { type: 'beetle', formation: 'grid', count: 12 }
    ]
  },
  {
    id: '1-2',
    name: 'Lunar Belt',
    isBoss: false,
    rewardCoins: 220,
    tasks: [
      { label: 'Destroy 50% of enemy forces!', pct: 0.5 },
      { label: 'Destroy 80% of enemy forces!', pct: 0.8 },
      { label: 'Destroy 90% of enemy forces!', pct: 0.9 }
    ],
    waves: [
      { type: 'wasp', formation: 'grid', count: 12 },
      { type: 'cyberfly', formation: 'circle', count: 10 },
      { type: 'beetle', formation: 'v_shape', count: 11 },
      { type: 'wasp', formation: 'grid', count: 15 },
      { type: 'cyberfly', formation: 'circle', count: 14 }
    ]
  },
  {
    id: '1-3',
    name: 'Meteor Field',
    isBoss: false,
    rewardCoins: 300,
    tasks: [
      { label: 'Destroy 50% of enemy forces!', pct: 0.5 },
      { label: 'Destroy 80% of enemy forces!', pct: 0.8 },
      { label: 'Destroy 90% of enemy forces!', pct: 0.9 }
    ],
    waves: [
      { type: 'beetle', formation: 'circle', count: 12 },
      { type: 'cyberfly', formation: 'grid', count: 15 },
      { type: 'wasp', formation: 'v_shape', count: 15 },
      { type: 'beetle', formation: 'grid', count: 15 },
      { type: 'cyberfly', formation: 'circle', count: 16 }
    ]
  },
  {
    id: '1-4',
    name: 'Red Nebula',
    isBoss: false,
    rewardCoins: 400,
    tasks: [
      { label: 'Destroy 50% of enemy forces!', pct: 0.5 },
      { label: 'Destroy 80% of enemy forces!', pct: 0.8 },
      { label: 'Destroy 90% of enemy forces!', pct: 0.9 }
    ],
    waves: [
      { type: 'cyberfly', formation: 'v_shape', count: 13 },
      { type: 'beetle', formation: 'circle', count: 14 },
      { type: 'wasp', formation: 'grid', count: 18 },
      { type: 'cyberfly', formation: 'grid', count: 16 },
      { type: 'beetle', formation: 'v_shape', count: 15 }
    ]
  },
  {
    id: '1-5',
    name: 'Overlord Dreadnought',
    isBoss: true,
    rewardCoins: 650,
    tasks: [
      { label: 'Destroy 50% of enemy forces!', pct: 0.5 },
      { label: 'Destroy 80% of enemy forces!', pct: 0.8 },
      { label: 'Defeat the Sector Boss!', pct: 0.95 }
    ],
    waves: [
      { type: 'wasp', formation: 'circle', count: 12 },
      { type: 'beetle', formation: 'grid', count: 12 },
      { type: 'cyberfly', formation: 'v_shape', count: 11 },
      { type: 'boss', formation: 'boss', count: 1 }
    ]
  }
];
