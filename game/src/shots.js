import { GROUND } from './config.js';
import { obstacleBox } from './obstacles.js';

export const SHOT_NAMES = ['cover', 'chef', 'zones', 'end', 'title'];
export function shotFromQuery(search) {
  const query = new URLSearchParams(search);
  const name = query.get('shot');
  return SHOT_NAMES.includes(name) ? name : null;
}

// This driver only presses the controls available to a human. It never edits the
// course, player, clock, health, weather, upgrades, or random stream.
export function autopilot(run) {
  const p = run.turkey;
  let jump = false;
  let slide = false;
  let nearestGround = Infinity;
  for (const item of run.obstacles) {
    if (item.hit || item.dead) continue;
    const box = obstacleBox(item);
    if (item.attack === 'dog' || item.attack === 'grab') {
      const closing = item.vx - run.speed;
      const arrival = (p.x - 27 - box.x - box.w) / closing;
      if (item.attack === 'grab' && box.x < p.x + 45 && box.x + box.w > p.x - 150) slide = true;
      if (item.attack === 'dog' && arrival > -0.22 && arrival < 0.24) jump = true;
      continue;
    }
    const closing = run.speed + (item.attack === 'knife' ? -item.vx : item.def?.behavior === 'roll' ? 18 : 0);
    const ahead = box.x - (p.x + 24);
    const arrival = ahead / closing;
    if (box.x + box.w < p.x - 30) continue;
    const overhead = item.attack === 'knife' || item.def?.overhead;
    if (overhead) {
      if (arrival < 0.52 && box.x + box.w > p.x - 50) slide = true;
    } else if (arrival > -0.12 && arrival < nearestGround) nearestGround = arrival;
  }
  if (nearestGround < 0.235 && p.y >= GROUND - 1) jump = true;
  // A dive also cancels a jump when an overhead hazard has right of way.
  if (slide) jump = false;
  return { jump, slide, slidePressed: slide && !p.slide, steer: 0 };
}

const visible = (item, width = item.w || 24) => item.x > 20 && item.x + width < 1250;
export function shotReached(name, run) {
  if (name === 'title') return run.mode === 'title';
  if (name === 'end') return run.mode === 'escaped' || run.mode === 'caught';
  if (run.mode !== 'playing') return false;
  const p = run.turkey;
  const corn = run.collectibles.some(item => item.type === 'corn' && visible(item));
  const pumpkin = run.obstacles.some(item => item.def?.art === 'pumpkin' && visible(item));
  const leapFence = run.obstacles.some(item => item.def?.fence && item.x < p.x + 28 && item.x + item.w > p.x + 5);
  if (name === 'cover') {
    return run.zoneIndex === 1 && run.previousBoss?.id === 'jed' && run.boss.id === 'brutus'
      && p.y < GROUND - 105 && leapFence && pumpkin && corn;
  }
  if (name === 'chef') {
    const knife = run.obstacles.some(item => item.attack === 'knife' && item.x > p.x - 50 && item.x < p.x + 205);
    const gravy = run.collectibles.some(item => item.type === 'gravy' && visible(item));
    return run.zoneIndex === 4 && p.slide && knife && gravy && run.boss.attackTime > 0;
  }
  if (name === 'zones') {
    return run.zoneIndex === 3 && run.weather.storm && run.weather.lightning > 0.15
      && p.y < GROUND - 50 && leapFence && pumpkin && corn;
  }
  return false;
}

export function advanceShot(name, run, step, budget = 480) {
  // The title screen is a static menu, not a run: freeze it at once, no autopilot.
  if (name === 'title') { run.mode = 'title'; return { ready: true, failed: false }; }
  for (let n = 0; n < budget; n++) {
    if (shotReached(name, run)) return { ready: true, failed: false };
    if (run.mode !== 'playing' || run.tick > 60000) return { ready: false, failed: true };
    step(run, autopilot(run));
  }
  return { ready: shotReached(name, run), failed: false };
}
