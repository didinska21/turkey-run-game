import { UPGRADES } from './config.js';

const SAVE_KEY = 'turkeyrun.free-range.v1';
export function freshProfile() {
  return { bank: 0, best: 0, highScore: 0, escaped: 0, owned: [], muted: false };
}
export function loadProfile() {
  const profile = freshProfile();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || typeof saved !== 'object') return profile;
    for (const key of ['bank', 'best', 'highScore', 'escaped']) {
      if (Number.isFinite(saved[key])) profile[key] = Math.max(0, Math.floor(saved[key]));
    }
    profile.owned = UPGRADES.filter(upgrade => Array.isArray(saved.owned) && saved.owned.includes(upgrade.id)).map(upgrade => upgrade.id);
    profile.muted = saved.muted === true;
  } catch { /* Private browsing and disabled storage still get a complete session. */ }
  return profile;
}
export function saveProfile(profile) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); return true; }
  catch { return false; }
}
export function effectsFor(profile) {
  const effects = {
    maxJumps: 1, startingShield: 0, slideBurst: 0, magnet: 34, speedScale: 1,
    fenceBreaks: 0, nightLight: 0, stormResistance: 0, revives: 0,
    scoreScale: 1, softLanding: false, dogDelay: 1,
  };
  for (const upgrade of UPGRADES) {
    if (profile.owned.includes(upgrade.id)) effects[upgrade.effect] = upgrade.value;
  }
  return effects;
}
export function buyUpgrade(profile, id, betweenRuns) {
  const upgrade = UPGRADES.find(item => item.id === id);
  if (!betweenRuns) return { ok: false, message: 'Window shopping only. Buy between runs!' };
  if (!upgrade || profile.owned.includes(id)) return { ok: false, message: 'Already in your escape kit.' };
  if (profile.bank < upgrade.cost) return { ok: false, message: `Need ${upgrade.cost - profile.bank} more corn. Keep gobbling.` };
  profile.bank -= upgrade.cost;
  profile.owned.push(id);
  saveProfile(profile);
  return { ok: true, message: `${upgrade.name} packed. Ready for the next escape!` };
}
