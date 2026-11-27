export const WIDTH = 1280;
export const HEIGHT = 720;
export const GROUND = 570;
export const STEP = 1 / 60;
export const METRE = 12;
export const ZONE_METRES = 400;
export const TUNING = Object.freeze({
  speed: 326, acceleration: 0.072, maxSpeed: 540, gravity: 2140,
  jump: 930, steer: 220, minX: 350, maxX: 620,
  hurtTime: 1.65, startingGap: 76, cleanRecovery: 2.9,
});

export const ZONES = Object.freeze([
  { id: 'farm', name: 'Farmyard', subtitle: 'A very inconvenient breakfast', light: 'dawn', boss: 'jed', icon: '01' },
  { id: 'corn', name: 'Cornfield', subtitle: 'Children of the corn… bread', light: 'sunset', boss: 'brutus', icon: '02' },
  { id: 'forest', name: 'Forest', subtitle: 'The woods have dinner plans', light: 'dusk', boss: 'brutus', icon: '03' },
  { id: 'town', name: 'Town', subtitle: 'Wanted: alive, preferably seasoned', light: 'night', boss: 'jed', icon: '04' },
  { id: 'kitchen', name: 'Kitchen', subtitle: 'Out of the frying pan. Keep going.', light: 'firelight', boss: 'chef', icon: '05' },
]);

export const BOSSES = Object.freeze({
  jed: { name: 'Farmer Jed', label: 'THE LONG ARM OF THE FARM', interval: 5.8, warning: 'JED IS REACHING!  ↓ DUCK', color: '#ecb65e' },
  brutus: { name: 'Brutus the Dog', label: 'CERTIFIED POULTRY ENTHUSIAST', interval: 5.4, warning: 'BRUTUS IS LUNGING!  ↑ JUMP', color: '#f07c50' },
  chef: { name: 'Chef Marcel', label: 'NO RESERVATION. NO MERCY.', interval: 4.4, warning: 'KNIFE SERVICE!  ↓ SLIDE', color: '#f3d5b0' },
});

export const UPGRADES = Object.freeze([
  { id: 'doubleJump', name: 'Double Jump', cost: 30, icon: '↑↑', description: 'One more jump while airborne.', effect: 'maxJumps', value: 2 },
  { id: 'featherShield', name: 'Feather Shield', cost: 25, icon: '◇', description: 'Start each run with a feather shield.', effect: 'startingShield', value: 1 },
  { id: 'gravySlide', name: 'Gravy Slide', cost: 40, icon: '≈', description: 'Slide: 1.1s invincible boost. 8s recharge.', effect: 'slideBurst', value: 1.1 },
  { id: 'cornMagnet', name: 'Corn Magnet', cost: 35, icon: '∩', description: 'Pull in corn from 175 pixels away.', effect: 'magnet', value: 175 },
  { id: 'sprintBoots', name: 'Sprint Boots', cost: 45, icon: '»', description: 'Run 12% faster. Escape sooner.', effect: 'speedScale', value: 1.12 },
  { id: 'sturdyBeak', name: 'Sturdy Beak', cost: 30, icon: '▶', description: 'Smash one fence each run, unharmed.', effect: 'fenceBreaks', value: 1 },
  { id: 'nightVision', name: 'Night Vision', cost: 25, icon: '☾', description: 'Brighten dusk and night scenery.', effect: 'nightLight', value: 0.2 },
  { id: 'stormCloak', name: 'Storm Cloak', cost: 35, icon: '☂', description: 'Ignore storm drag and wind drift.', effect: 'stormResistance', value: 1 },
  { id: 'luckyFeather', name: 'Lucky Feather', cost: 65, icon: '♡', description: 'One last heart when you would be caught.', effect: 'revives', value: 1 },
  { id: 'bigGobble', name: 'Big Gobble', cost: 60, icon: '×2', description: 'Double distance, corn and escape score.', effect: 'scoreScale', value: 2 },
  { id: 'softLanding', name: 'Soft Landing', cost: 30, icon: '⌄', description: 'Hard landings never cost chase gap.', effect: 'softLanding', value: true },
  { id: 'dogWhistle', name: 'Dog Whistle', cost: 40, icon: '♪', description: 'Brutus waits 65% longer between lunges.', effect: 'dogDelay', value: 1.65 },
]);

// Every entry supplies its own silhouette, dimensions, contact inset, and motion.
// Related materials share drawing tools, but not a single catch-all rectangle.
const obstacle = (id, name, zone, art, w, h, behavior, color, detail, inset = 7) =>
  Object.freeze({ id, name, zone, art, w, h, behavior, color, detail, inset,
    overhead: ['overhead', 'swing', 'sway'].includes(behavior),
    fence: art === 'fence' || art === 'hedge' });
export const OBSTACLES = Object.freeze([
  obstacle('splitRail', 'Split-rail fence', 'farm', 'fence', 102, 79, 'solid', '#bf824a', 2, 9),
  obstacle('roundBale', 'Round hay bale', 'farm', 'bale', 87, 83, 'solid', '#e8b44c', 0),
  obstacle('ciderPumpkin', 'Cider rolling pumpkin', 'farm', 'pumpkin', 60, 59, 'roll', '#ef7c29', 0, 8),
  obstacle('bootMud', 'Boot-stealing mud', 'farm', 'mud', 112, 17, 'slow', '#705240', 0, 5),
  obstacle('flapScarecrow', 'Flapping scarecrow', 'farm', 'scarecrow', 85, 114, 'sway', '#cf8c50', 0, 11),
  obstacle('milkCart', 'Runaway milk cart', 'farm', 'cart', 116, 83, 'drift', '#bcd2cc', 0, 10),
  obstacle('feedCrate', 'Chicken-feed crate', 'farm', 'crate', 68, 67, 'solid', '#bf8550', 0),
  obstacle('farmLine', 'Long-john clothesline', 'farm', 'line', 131, 111, 'overhead', '#e9d9b5', 0, 10),
  obstacle('appleBarrel', 'Apple cider barrel', 'farm', 'barrel', 65, 85, 'wobble', '#ae6847', 0, 8),
  obstacle('cornFence', 'Corn-stalk hurdle', 'corn', 'fence', 96, 77, 'solid', '#d3a13b', 3, 9),
  obstacle('squareBale', 'Double-twine bale', 'corn', 'bale', 105, 72, 'solid', '#d6a440', 1, 8),
  obstacle('stripePumpkin', 'Tiger-stripe pumpkin', 'corn', 'pumpkin', 66, 63, 'roll', '#dba83a', 1, 9),
  obstacle('irrigation', 'Irrigation puddle', 'corn', 'puddle', 125, 18, 'slow', '#588b92', 0, 4),
  obstacle('crowKing', 'King of the crows', 'corn', 'scarecrow', 100, 121, 'sway', '#a3553f', 1, 13),
  obstacle('cornWagon', 'Overloaded corn wagon', 'corn', 'cart', 124, 90, 'drift', '#dbac49', 1, 9),
  obstacle('seedSacks', 'Toppling seed sacks', 'corn', 'sacks', 74, 91, 'wobble', '#ded19b', 0),
  obstacle('birdNet', 'Low bird net', 'corn', 'net', 142, 106, 'overhead', '#c5ae78', 0, 10),
  obstacle('rakeTrap', 'Surprise rake', 'corn', 'trap', 86, 33, 'snap', '#798c7d', 0, 5),
  obstacle('forestFence', 'Mossy forest fence', 'forest', 'fence', 105, 82, 'solid', '#6b9781', 4, 9),
  obstacle('fallenOak', 'Fallen oak log', 'forest', 'log', 119, 69, 'solid', '#9d7255', 0),
  obstacle('ghostPumpkin', 'Ghost rolling pumpkin', 'forest', 'pumpkin', 62, 58, 'roll', '#c4c9b2', 2, 8),
  obstacle('bogPool', 'Bubbling bog', 'forest', 'mud', 140, 20, 'slow', '#4b6961', 1, 4),
  obstacle('swingBranch', 'Swinging dead branch', 'forest', 'branch', 123, 114, 'swing', '#7a8162', 0, 12),
  obstacle('mushroomRing', 'Too-large mushrooms', 'forest', 'mushroom', 91, 74, 'pulse', '#cb765c', 0, 8),
  obstacle('foxCrate', 'Suspicious fox crate', 'forest', 'crate', 77, 76, 'wobble', '#748d74', 1),
  obstacle('thornHedge', 'Thorny hedge', 'forest', 'hedge', 104, 86, 'solid', '#557b66', 0, 9),
  obstacle('snare', 'Woodland snare', 'forest', 'trap', 77, 36, 'snap', '#a3a89b', 1, 6),
  obstacle('gardenGate', 'White garden gate', 'town', 'fence', 104, 81, 'solid', '#c7d6c4', 1, 9),
  obstacle('mailHeap', 'Overdue mail pile', 'town', 'sacks', 81, 80, 'solid', '#c1aa91', 1),
  obstacle('festivalPumpkin', 'Festival runaway pumpkin', 'town', 'pumpkin', 71, 65, 'roll', '#e39336', 3, 9),
  obstacle('streetPuddle', 'Lamp-lit street puddle', 'town', 'puddle', 117, 16, 'slow', '#678ca7', 1, 5),
  obstacle('awning', 'Market-stall awning', 'town', 'awning', 145, 115, 'overhead', '#c77b68', 0, 12),
  obstacle('breadCart', 'Midnight bread cart', 'town', 'cart', 111, 87, 'drift', '#ad7b53', 2, 10),
  obstacle('fishBox', 'Fishmonger box', 'town', 'crate', 86, 74, 'solid', '#789b9a', 2),
  obstacle('townLaundry', 'The mayor’s laundry', 'town', 'line', 128, 116, 'sway', '#bdb5c5', 1, 11),
  obstacle('trashCan', 'Rattling trash can', 'town', 'bin', 65, 94, 'wobble', '#8faaa6', 0, 8),
  obstacle('ovenDoor', 'Glowing oven door', 'kitchen', 'oven', 114, 78, 'pulse', '#e47d43', 0, 9),
  obstacle('flourSacks', 'Bursting flour sacks', 'kitchen', 'sacks', 92, 83, 'wobble', '#e4d8ba', 2, 8),
  obstacle('soupPumpkin', 'Soup-bound rolling pumpkin', 'kitchen', 'pumpkin', 65, 61, 'roll', '#df924c', 4, 8),
  obstacle('gravySpill', 'Catastrophic gravy spill', 'kitchen', 'mud', 134, 18, 'slow', '#ae7148', 2, 5),
  obstacle('hangingKnife', 'Swinging carving knife', 'kitchen', 'knife', 109, 107, 'swing', '#d1e0d7', 0, 8),
  obstacle('fallingKnife', 'Falling carving knife', 'kitchen', 'knife', 71, 95, 'fall', '#aebfc4', 1, 10),
  obstacle('plateStack', 'Precarious plate stack', 'kitchen', 'plates', 72, 92, 'wobble', '#c4d6cf', 0),
  obstacle('potRack', 'Low copper pot rack', 'kitchen', 'pots', 138, 112, 'overhead', '#c78f62', 0, 11),
  obstacle('snapBoard', 'Spring-loaded chopping board', 'kitchen', 'trap', 99, 39, 'snap', '#c69a65', 2, 7),
]);

export const COUNTS = Object.freeze({ zones: ZONES.length, bosses: Object.keys(BOSSES).length, upgrades: UPGRADES.length, obstacles: OBSTACLES.length });
