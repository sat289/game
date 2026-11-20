window.DEFAULT_MAPS = [
  { id: 'sunset', name: 'Sunset Highway', icon: '🌅', sky: '#7c2d12', skyBottom: '#ea580c', ground: '#3f6212', road: '#2d3138', price: 0, unlocked: true, desc: 'Golden sunset 4-lane highway with weathered asphalt & guardrails' },
  { id: 'countryside', name: 'Countryside Autobahn', icon: '🌳', sky: '#0284c7', skyBottom: '#bae6fd', ground: '#15803d', road: '#2d3138', price: 0, unlocked: true, desc: 'Lush green valley 4-lane expressway' },
  { id: 'desert', name: 'Desert Route 66', icon: '🏜️', sky: '#d97706', skyBottom: '#fde68a', ground: '#b45309', road: '#334155', price: 2500, unlocked: false, desc: 'Red canyon sandstone highway & desert scenery' },
  { id: 'snow', name: 'Alpine Snow Pass', icon: '❄️', sky: '#3b82f6', skyBottom: '#e0f2fe', ground: '#e2e8f0', road: '#334155', price: 5000, unlocked: false, desc: 'Snowy mountain highway & pine woods' },
  { id: 'volcano', name: 'Volcano Coastway', icon: '🌋', sky: '#1e1b4b', skyBottom: '#991b1b', ground: '#27272a', road: '#18181b', price: 7500, unlocked: false, desc: 'Glowing magma cliffs & dark basalt road' },
  { id: 'nightcity', name: 'Night City Metro', icon: '🌃', sky: '#020617', skyBottom: '#1e293b', ground: '#0f172a', road: '#1e293b', price: 10000, unlocked: false, desc: 'Illuminated city highway & neon streetlights' },
  { id: 'beach', name: 'Ocean Breeze Drive', icon: '🏖️', sky: '#0891b2', skyBottom: '#a5f3fc', ground: '#eab308', road: '#2d3138', price: 15000, unlocked: false, desc: 'Tropical palm highway along the coast' },
  { id: 'moon', name: 'Cyber Spaceway', icon: '🌑', sky: '#030712', skyBottom: '#111827', ground: '#374151', road: '#1f2937', price: 18000, unlocked: false, desc: 'High-speed futuristic night expressway' }
];
window.MAPS = JSON.parse(JSON.stringify(window.DEFAULT_MAPS));

