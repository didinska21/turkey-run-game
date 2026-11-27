import { BOSSES, GROUND, TUNING, ZONES } from './config.js';
import { clamp } from './random.js';
import { launchAttack } from './obstacles.js';

export function createBoss(id, run) {
  return { id, name: BOSSES[id].name, clock: id === 'chef' ? 1.6 : 3.7,
    phase: 'chase', windup: 0, attackTime: 0, attacks: 0,
    x: run.turkey.x - 160 - run.gap * 1.1, y: GROUND, cornered: 0 };
}
export function switchBoss(run) {
  const id = ZONES[run.zoneIndex].boss;
  if (id === run.boss.id) return;
  run.previousBoss = { ...run.boss, until: run.distance + 112 };
  run.boss = createBoss(id, run);
  run.events.push({ kind: 'text', text: `${BOSSES[id].name.toUpperCase()} SPOTTED YOU!`, x: 710, y: 212, color: '#ffd297' });
  run.events.push({ kind: 'sound', name: 'sting' });
}
export function stumble(run, severity = 1) {
  run.stumbleStreak = run.time - run.lastStumble < 4.8 ? run.stumbleStreak + 1 : 1;
  run.lastStumble = run.time;
  run.gap = Math.max(0, run.gap - 23 * severity);
  run.slow = Math.max(run.slow, severity > 0.5 ? 0.65 : 0.35);
  if (run.stumbleStreak >= 2) {
    run.boss.cornered = 4;
    run.events.push({ kind: 'text', text: 'CORNERED!  THE CHASE GETS PERSONAL.', x: 660, y: 250, color: '#ff9a72' });
  }
}
export function updateBoss(run, dt) {
  const boss = run.boss;
  boss.cornered = Math.max(0, boss.cornered - dt);
  const cornering = boss.cornered > 0;
  run.gap = clamp(run.gap + dt * (run.slow > 0 ? -5 : cornering ? -3.5 : TUNING.cleanRecovery), 0, 100);
  if (run.time - run.lastStumble > 5) run.stumbleStreak = 0;
  boss.x = run.turkey.x - 160 - run.gap * 1.1 + (cornering ? 35 : 0);
  if (boss.id === 'chef') boss.x = run.turkey.x - 225 - run.gap * 0.55;
  if (run.previousBoss) {
    run.previousBoss.x = boss.x - 125;
    if (run.distance > run.previousBoss.until) run.previousBoss = null;
  }
  boss.attackTime = Math.max(0, boss.attackTime - dt);
  if (boss.phase === 'windup') {
    boss.windup -= dt;
    if (boss.windup <= 0) {
      // Leave a readable answer to every attack: a lunge must not coincide with
      // ducking a branch, and a knife must not pin a bird onto a ground hurdle.
      const arrival = boss.id === 'chef' ? (1235 - run.turkey.x) / (run.speed + 240) : 0.3;
      const conflict = run.obstacles.some(item => {
        if (!item.def || item.hit) return false;
        const projected = item.x - run.speed * arrival;
        const nearby = projected < run.turkey.x + 125 && projected + item.w > run.turkey.x - 100;
        return nearby && (boss.id === 'brutus' ? item.def.overhead : !item.def.overhead);
      });
      if (conflict) { boss.windup = 0.2; return; }
      boss.phase = 'attack'; boss.attackTime = boss.id === 'chef' ? 1.6 : 0.85;
      boss.attacks++; run.stats.bossAttacks++;
      if (boss.id === 'jed') launchAttack(run, 'grab', boss.x + 100, run.speed + 325, boss.name);
      else if (boss.id === 'brutus') launchAttack(run, 'dog', boss.x + 45, run.speed + 430, boss.name);
      else launchAttack(run, 'knife', 1235, -240 - run.lap * 20, boss.name);
      const delay = boss.id === 'brutus' ? run.effects.dogDelay : 1;
      boss.clock = BOSSES[boss.id].interval * delay * (cornering ? 0.62 : 1) / (1 + run.lap * 0.08);
    }
  } else if (boss.attackTime === 0) {
    boss.phase = 'chase'; boss.clock -= dt * (cornering ? 1.35 : 1);
    if (boss.clock <= 0) {
      boss.phase = 'windup'; boss.windup = boss.id === 'chef' ? 0.9 : 0.78;
      run.events.push({ kind: 'sound', name: 'sting' });
    }
  }
  if (run.gap < 25 && run.stingCooldown <= 0) {
    run.events.push({ kind: 'sound', name: 'sting' }); run.stingCooldown = 3;
  }
}
