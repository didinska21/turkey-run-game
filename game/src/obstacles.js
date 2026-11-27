import { GROUND, METRE, OBSTACLES, ZONES, ZONE_METRES } from './config.js';
import { clamp, noise } from './random.js';

const byZone = ZONES.map(zone => OBSTACLES.filter(item => item.zone === zone.id));
export const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export function turkeyBox(turkey) {
  const h = turkey.slide ? 29 : 69;
  return { x: turkey.x - 23, y: turkey.y - h, w: 48, h: h - 5 };
}
export function obstacleBox(item) {
  if (item.attack) return { x: item.x + 8, y: item.y, w: item.w - 16, h: item.h };
  const def = item.def;
  if (def.overhead) return { x: item.x + def.inset, y: item.y - def.h, w: def.w - def.inset * 2, h: def.h - 43 };
  const height = def.behavior === 'snap' ? def.h + item.snap * 14 : def.h;
  return { x: item.x + def.inset, y: item.y - height + 4, w: def.w - def.inset * 2, h: height - 5 };
}
function makeObstacle(run, def, x) {
  return { id: run.nextEntity++, def, x, y: GROUND, baseY: GROUND, w: def.w, h: def.h,
    age: 0, phase: run.rng() * Math.PI * 2, angle: 0, snap: 0, hit: false, passed: false };
}
function collectible(run, type, x, y) {
  run.collectibles.push({ id: run.nextEntity++, type, x, y, homeY: y, phase: run.rng() * 6.28, collected: false });
}
export function spawnCourse(run) {
  for (;;) {
    const { zone, row } = run.course;
    const position = zone * ZONE_METRES * METRE + 620 + row * 475 + (row ? (noise(zone * 17 + row, run.seed) - 0.5) * 32 : 0);
    if (position > run.world + 1150) break;
    const zoneIndex = zone % ZONES.length;
    const def = byZone[zoneIndex][row];
    const x = 440 + position - run.world;
    run.obstacles.push(makeObstacle(run, def, x));
    run.seenObstacles.add(def.id);
    if (row === 0) {
      const pumpkin = byZone[zoneIndex].find(item => item.art === 'pumpkin');
      run.obstacles.push(makeObstacle(run, pumpkin, x + 90));
    }
    const overhead = def.overhead;
    for (let i = 0; i < 7; i++) {
      const y = overhead ? GROUND - 28 : GROUND - 75 - Math.sin(i / 6 * Math.PI) * 100;
      collectible(run, 'corn', x - 30 + i * 35, y);
    }
    for (let i = 0; i < 3; i++) collectible(run, 'corn', x + 285 + i * 32, GROUND - 40);
    if (row === 2 || row === 6) collectible(run, 'feather', x + 170, GROUND - 98);
    if (row === 4 || row === 7 || zoneIndex === 4) collectible(run, 'gravy', x + 288, GROUND - 42);
    run.course.row++;
    if (run.course.row === 9) { run.course.row = 0; run.course.zone++; }
  }
}
export function launchAttack(run, kind, x, vx, source) {
  const shape = kind === 'knife' ? { w: 94, h: 18, y: GROUND - 73 }
    : kind === 'dog' ? { w: 101, h: 48, y: GROUND - 53 }
    : { w: 105, h: 31, y: GROUND - 83 };
  run.obstacles.push({ ...shape, id: run.nextEntity++, x, baseY: shape.y, vx, age: 0,
    attack: kind, source, angle: 0, hit: false, passed: false, phase: 0 });
}
export function updateObstacles(run, dt, onHit) {
  const player = turkeyBox(run.turkey);
  for (const item of run.obstacles) {
    item.age += dt;
    item.x -= run.speed * dt;
    if (item.attack) {
      item.x += item.vx * dt;
      if (item.attack === 'dog') item.y = item.baseY - Math.sin(clamp(item.age / 0.76, 0, 1) * Math.PI) * 27;
      if (item.age > (item.attack === 'grab' ? 1.1 : item.attack === 'dog' ? 0.82 : 2.3)) item.dead = true;
    } else {
      const def = item.def;
      const wave = Math.sin(item.age * 4 + item.phase);
      if (def.behavior === 'roll') { item.x -= (18 + run.lap * 8) * dt; item.angle += dt * 6; }
      if (def.behavior === 'drift') item.x -= (18 + Math.sin(item.age * 2) * 15) * dt;
      if (def.behavior === 'wobble') item.angle = wave * 0.065;
      if (def.behavior === 'swing' || def.behavior === 'sway') { item.y = GROUND + wave * 5; item.angle = wave * 0.08; }
      if (def.behavior === 'pulse') item.y = GROUND - Math.max(0, wave) * 5;
      if (def.behavior === 'snap') item.snap = Math.max(0, wave);
      if (def.behavior === 'fall') {
        const proximity = clamp(1 - (item.x - run.turkey.x) / 380, 0, 1);
        item.y = GROUND - 150 * (1 - proximity * proximity);
      }
    }
    if (!item.hit && !item.dead && intersects(player, obstacleBox(item))) {
      item.hit = true;
      if (!item.attack && item.def.fence && run.fenceBreaks > 0) {
        run.fenceBreaks--; item.dead = true;
        run.events.push({ kind: 'text', text: 'BEAK IT TILL YOU MAKE IT!', x: item.x, y: GROUND - 120, color: '#ffe19a' });
        run.events.push({ kind: 'sound', name: 'thud' });
        run.stats.fencesBroken++;
      } else onHit(item.attack ? item.source : item.def.name, item.def?.behavior === 'slow');
    }
    if (!item.passed && item.x + item.w < run.turkey.x - 35) {
      item.passed = true;
      if (!item.hit) { run.stats.dodged++; run.score += 12 * run.effects.scoreScale; }
    }
  }
  run.obstacles = run.obstacles.filter(item => !item.dead && item.x > -220);
  for (const item of run.collectibles) {
    item.x -= run.speed * dt;
    item.y = item.homeY + Math.sin(run.time * 4 + item.phase) * 5;
    const dx = run.turkey.x - item.x;
    const dy = run.turkey.y - (run.turkey.slide ? 20 : 44) - item.y;
    const distance = Math.hypot(dx, dy);
    if (item.type === 'corn' && run.effects.magnet > 40 && distance < run.effects.magnet) {
      item.x += dx * Math.min(1, dt * 10);
      item.homeY += dy * Math.min(1, dt * 10);
    }
    if (distance < (item.type === 'corn' ? 43 : 50)) {
      item.collected = true;
      if (item.type === 'corn') {
        run.corn++; run.score += 35 * run.effects.scoreScale;
        run.events.push({ kind: 'sound', name: 'pop' });
        if (run.corn % 5 === 0) run.events.push({ kind: 'text', text: '+5 CORN', x: item.x, y: item.y - 20, color: '#ffe083' });
      } else if (item.type === 'feather') {
        run.turkey.shield = 1; run.stats.feathers++;
        run.events.push({ kind: 'text', text: 'FEATHER SHIELD!', x: item.x, y: item.y - 40, color: '#c9ebda' });
        run.events.push({ kind: 'sound', name: 'shield' });
      } else {
        run.gravy = Math.max(run.gravy, 3.5); run.stats.gravy++;
        run.events.push({ kind: 'text', text: 'GRAVY TRAIN!  3.5s', x: item.x, y: item.y - 55, color: '#ffcb75' });
        run.events.push({ kind: 'sound', name: 'shield' });
      }
    }
  }
  run.collectibles = run.collectibles.filter(item => !item.collected && item.x > -80);
}
