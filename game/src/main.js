import { BOSSES, COUNTS, GROUND, METRE, STEP, TUNING, ZONES, ZONE_METRES } from './config.js';
import { clamp, mulberry32, noise, seedFrom } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { weatherAt, zoneAt } from './zones.js';
import { spawnCourse, updateObstacles } from './obstacles.js';
import { createBoss, stumble, switchBoss, updateBoss } from './bosses.js';
import { buyUpgrade, effectsFor, freshProfile, loadProfile, saveProfile } from './upgrades.js';
import { advanceShot, shotFromQuery } from './shots.js';
import { render } from './render.js';

export function createRun(seed = 7, profile = freshProfile()) {
  const effects = effectsFor(profile);
  const run = {
    seed: seed >>> 0, rng: mulberry32(seed), tick: 0, time: 0, mode: 'playing',
    world: 0, distance: 0, score: 0, corn: 0, lives: 3, gap: TUNING.startingGap,
    zoneIndex: 0, lap: 0, milestone: 2000, speed: TUNING.speed, effects,
    gravy: 0, slideBurst: 0, slideCooldown: 0, slow: 0, shake: 0, flash: 0,
    fenceBreaks: effects.fenceBreaks, revives: effects.revives,
    lastStumble: -10, stumbleStreak: 0, stingCooldown: 0,
    turkey: { x: 440, y: GROUND, vy: 0, jumps: 0, slide: false, hurt: 0, shield: effects.startingShield, jumpBuffer: 0 },
    boss: null, previousBoss: null, weather: weatherAt(0, 0, seed),
    obstacles: [], collectibles: [], course: { zone: 0, row: 0 }, nextEntity: 1,
    events: [], sounds: [], texts: [], particles: [], seenObstacles: new Set(),
    stats: { hits: 0, dodged: 0, feathers: 0, gravy: 0, clears: 0, bossAttacks: 0, fencesBroken: 0, revives: 0 },
    banner: { title: '01 / FARMYARD', subtitle: 'You have been invited to dinner. As dinner.', time: 3.2 },
    result: null, recorded: false, bankedCorn: 0,
  };
  run.boss = createBoss('jed', run);
  spawnCourse(run);
  return run;
}

function particles(run, x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const a = noise(run.tick * 83 + i, run.seed) * Math.PI * 2;
    const velocity = 70 + noise(run.tick + i * 31, run.seed) * 170;
    run.particles.push({ x, y, vx: Math.cos(a) * velocity, vy: Math.sin(a) * velocity - 100,
      age: 0, life: 0.5 + noise(i * 13 + run.tick) * 0.4, color });
  }
}
function finishRun(run, escaped, reason) {
  run.mode = escaped ? 'escaped' : 'caught';
  run.result = { who: reason, escaped, distance: Math.floor(run.distance), score: Math.floor(run.score), tick: run.tick };
  run.recorded = false;
  run.events.push({ kind: 'sound', name: escaped ? 'fanfare' : 'sting' });
  if (escaped) particles(run, 640, 270, 60, '#efb955');
}
function rescueOrFinish(run, reason) {
  if (run.revives > 0) {
    run.revives--; run.stats.revives++; run.lives = Math.max(1, run.lives); run.gap = 58;
    run.turkey.hurt = 2; run.slow = 0; run.boss.cornered = 0;
    run.events.push({ kind: 'text', text: 'LUCKY FEATHER!  STILL NOT A SIDE DISH.', x: 650, y: 300, color: '#ffe4a6' });
    run.events.push({ kind: 'sound', name: 'shield' });
  } else finishRun(run, false, reason);
}
export function hitRun(run, reason, slippery = false) {
  const p = run.turkey;
  if (p.hurt > 0 || run.gravy > 0 || run.slideBurst > 0 || run.mode !== 'playing') return;
  if (p.shield > 0) {
    p.shield = 0; p.hurt = 0.65;
    particles(run, p.x, p.y - 60, 18, '#c4efdf');
    run.events.push({ kind: 'text', text: 'SHIELD SAVED YOUR BACON. TURKEY.', x: p.x + 100, y: p.y - 160, color: '#c4efdf' });
    run.events.push({ kind: 'sound', name: 'shield' });
    return;
  }
  stumble(run, slippery ? 0.5 : 1);
  run.shake = slippery ? 5 : 14; run.flash = slippery ? 0.07 : 0.18;
  p.hurt = slippery ? 0.55 : TUNING.hurtTime;
  if (!slippery) { run.lives--; run.stats.hits++; }
  run.events.push({ kind: 'text', text: slippery ? 'OH, CRUMBS. SLIPPERY!' : `HIT! ${reason.toUpperCase()}`, x: p.x + 100, y: p.y - 155, color: '#ffd0a5' });
  run.events.push({ kind: 'sound', name: 'thud' });
  particles(run, p.x, p.y - 30, 16, '#eeaa68');
  if (run.lives <= 0 || run.gap <= 0) rescueOrFinish(run, BOSSES[run.boss.id].name);
}

function flushEvents(run) {
  for (const event of run.events) {
    if (event.kind === 'sound') run.sounds.push(event.name);
    else if (event.kind === 'text') run.texts.push({ ...event, age: 0, life: 1.55 });
  }
  run.events.length = 0;
  if (run.sounds.length > 48) run.sounds.splice(0, run.sounds.length - 48);
}
export function stepRun(run, controls = {}, dt = STEP) {
  if (run.mode !== 'playing') return;
  run.tick++; run.time = run.tick * STEP;
  const p = run.turkey;
  for (const key of ['gravy', 'slideBurst', 'slideCooldown', 'slow', 'stingCooldown']) run[key] = Math.max(0, run[key] - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  run.shake = Math.max(0, run.shake - dt * 36);
  run.flash = Math.max(0, run.flash - dt);
  run.banner.time = Math.max(0, run.banner.time - dt);
  const wasLightning = run.weather.lightning;
  run.weather = weatherAt(run.distance, run.tick, run.seed);
  if (run.weather.lightning > 0.8 && wasLightning < 0.2) run.events.push({ kind: 'sound', name: 'thunder' });
  const stormDrag = run.weather.storm && !run.effects.stormResistance ? 0.86 + run.weather.wind * 0.035 : 1;
  const boost = run.gravy > 0 || run.slideBurst > 0 ? 1.21 : 1;
  run.speed = Math.min(TUNING.maxSpeed + run.lap * 30, TUNING.speed + run.distance * TUNING.acceleration + run.lap * 30)
    * run.effects.speedScale * stormDrag * boost * (run.slow > 0 ? 0.67 : 1);
  const travelled = run.speed * dt;
  run.world += travelled;
  run.distance = run.world / METRE;
  run.score += travelled / METRE * 4 * run.effects.scoreScale;
  p.x = clamp(p.x + (controls.steer || 0) * TUNING.steer * dt
    + (run.weather.storm && !run.effects.stormResistance ? run.weather.wind * dt * 24 : 0), TUNING.minX, TUNING.maxX);
  if (!controls.steer) p.x += clamp(440 - p.x, -32 * dt, 32 * dt);
  const wasSliding = p.slide;
  p.slide = Boolean(controls.slide) && p.y >= GROUND - 4;
  if (p.slide && !wasSliding && run.effects.slideBurst && run.slideCooldown <= 0) {
    run.slideBurst = run.effects.slideBurst; run.slideCooldown = 8;
    particles(run, p.x - 25, GROUND - 10, 10, '#e7b372');
  }
  if (controls.jump) p.jumpBuffer = 0.12;
  else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
  if (p.jumpBuffer > 0 && p.jumps < run.effects.maxJumps && !p.slide) {
    p.vy = -TUNING.jump * (p.jumps ? 0.91 : 1);
    p.jumps++; p.jumpBuffer = 0;
    run.events.push({ kind: 'sound', name: 'gobble' });
    particles(run, p.x - 15, p.y - 6, 7, '#dfb87a');
  }
  if (controls.slide && p.y < GROUND - 4) p.vy += dt * 1800;
  p.vy += TUNING.gravity * dt;
  p.y += p.vy * dt;
  if (p.y >= GROUND) {
    if (p.vy > 950 && !run.effects.softLanding) {
      stumble(run, 0.35);
      run.events.push({ kind: 'text', text: 'HARD LANDING!', x: p.x, y: GROUND - 120, color: '#ffd3a4' });
    }
    if (p.jumps && p.vy > 120) particles(run, p.x, GROUND, 6, '#bfa074');
    p.y = GROUND; p.vy = 0; p.jumps = 0;
    p.slide = Boolean(controls.slide);
  }
  const zone = zoneAt(run.distance);
  if (run.distance >= run.milestone) {
    run.stats.clears++; run.score += 1500 * run.effects.scoreScale;
    finishRun(run, true, 'Chef Marcel');
  } else if (zone.index !== run.zoneIndex) {
    run.stats.clears++; run.score += 500 * run.effects.scoreScale;
    run.gap = Math.min(100, run.gap + 12);
    run.zoneIndex = zone.index;
    switchBoss(run);
    run.banner = { title: `${ZONES[zone.index].icon} / ${ZONES[zone.index].name.toUpperCase()}`,
      subtitle: `ESCAPED THE LAST ZONE!  +${500 * run.effects.scoreScale}`, time: 3 };
    run.events.push({ kind: 'sound', name: 'fanfare' });
  }
  if (run.mode === 'playing') {
    updateBoss(run, dt);
    spawnCourse(run);
    updateObstacles(run, dt, (reason, slippery) => hitRun(run, reason, slippery));
    if (run.gap <= 0 && run.mode === 'playing') rescueOrFinish(run, run.boss.name);
  }
  for (const text of run.texts) { text.age += dt; text.y -= dt * 18; }
  run.texts = run.texts.filter(text => text.age < text.life);
  for (const particle of run.particles) {
    particle.age += dt; particle.vy += 350 * dt;
    particle.x += (particle.vx - run.speed * 0.3) * dt; particle.y += particle.vy * dt;
  }
  run.particles = run.particles.filter(particle => particle.age < particle.life);
  flushEvents(run);
}
export function continueRun(run) {
  if (run.mode !== 'escaped') return;
  run.mode = 'playing'; run.lap++; run.zoneIndex = 0; run.milestone += ZONE_METRES * ZONES.length;
  run.lives = Math.min(3, run.lives + 1); run.gap = Math.min(100, run.gap + 25);
  run.result = null; run.recorded = false;
  switchBoss(run);
  run.banner = { title: `LAP ${run.lap + 1} / BACK FOR SECONDS`, subtitle: 'Faster feet. Hungrier company. One heart restored.', time: 3.5 };
}
export function stateOf(run, shot = null, shotReady = false) {
  return {
    seed: run.seed, tick: run.tick, distance: Number(run.distance.toFixed(3)),
    zone: ZONES[run.zoneIndex].name, zoneIndex: run.zoneIndex, boss: run.boss.name,
    counts: COUNTS, mode: run.mode, lap: run.lap + 1, score: Math.floor(run.score), corn: run.corn,
    lives: run.lives, gap: Number(run.gap.toFixed(2)), player: { ...run.turkey },
    weather: { ...run.weather }, bossPhase: run.boss.phase, bossAttackTime: run.boss.attackTime,
    previousBoss: run.previousBoss?.name || null, stats: { ...run.stats },
    seenObstacles: run.seenObstacles.size, shot, shotReady,
    obstacles: run.obstacles.map(item => ({ name: item.def?.name || item.attack, art: item.def?.art || item.attack, x: +item.x.toFixed(2), y: +item.y.toFixed(2) })),
    collectibles: run.collectibles.map(item => ({ type: item.type, x: +item.x.toFixed(2), y: +item.y.toFixed(2) })),
    result: run.result,
  };
}

function startBrowser() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const params = new URLSearchParams(location.search);
  const shot = shotFromQuery(location.search);
  const seed = seedFrom(params.get('seed') ?? 7);
  const profile = shot ? freshProfile() : loadProfile();
  const audio = createAudio(profile.muted);
  const input = createInput(canvas, () => audio.unlock());
  const ui = { profile, shop: false, message: '', pointer: input.pointer, muted: profile.muted, shot };
  let run = createRun(seed, profile);
  if (!shot) run.mode = 'title';
  let buttons = [];
  let accumulator = 0;
  let pendingJump = false;
  let previous = 0;
  let shotReady = false;
  let shotError = null;
  const root = document.documentElement;
  root.dataset.ready = 'false';
  window.turkeyrun = Object.freeze({
    getState: () => ({ ...stateOf(run, shot, shotReady), error: shotError, bank: profile.bank, upgrades: [...profile.owned] }),
  });
  const announce = text => { document.getElementById('status').textContent = text; };
  function reset() {
    run = createRun(seed, profile); ui.shop = false; ui.message = ''; accumulator = 0; pendingJump = false;
    input.clear(); announce('Running. Space to jump, Down to slide, P to pause.');
  }
  function settle() {
    if (run.recorded || !['caught', 'escaped'].includes(run.mode)) return;
    profile.bank += run.corn - run.bankedCorn; run.bankedCorn = run.corn;
    profile.best = Math.max(profile.best, Math.floor(run.distance));
    profile.highScore = Math.max(profile.highScore, Math.floor(run.score));
    if (run.mode === 'escaped') profile.escaped++;
    if (!shot) saveProfile(profile); run.recorded = true;
    announce(`${run.mode.toUpperCase()}. ${Math.floor(run.distance)} metres. ${Math.floor(run.score)} points. Press R to restart.`);
  }
  function action(name) {
    if (name === 'start' || name === 'restart') reset();
    else if (name === 'shop') { ui.shop = true; ui.message = ''; }
    else if (name === 'back') { ui.shop = false; ui.message = ''; }
    else if (name === 'pause') {
      if (ui.shop) { ui.shop = false; return; }
      if (run.mode === 'playing') { run.mode = 'pause'; announce('Paused. Escape kit is available to view.'); }
      else if (run.mode === 'pause') run.mode = 'playing';
    } else if (name === 'resume') { ui.shop = false; run.mode = 'playing'; }
    else if (name === 'mute') {
      ui.muted = audio.toggle(); profile.muted = ui.muted; saveProfile(profile);
    } else if (name === 'continue') { continueRun(run); ui.shop = false; }
    else if (name.startsWith('buy:')) {
      const result = buyUpgrade(profile, name.slice(4), run.mode !== 'pause' && run.mode !== 'playing');
      ui.message = result.message;
      if (result.ok) audio.play('pop');
    }
  }
  addEventListener('blur', () => { if (!shot && run.mode === 'playing') action('pause'); });
  document.addEventListener('visibilitychange', () => {
    if (!shot && document.hidden && run.mode === 'playing') action('pause');
    accumulator = 0; previous = 0;
  });
  function frame(now) {
    const elapsed = previous ? Math.min(0.12, (now - previous) / 1000) : STEP;
    previous = now;
    if (shot) {
      if (!shotReady && !shotError) {
        const result = advanceShot(shot, run, stepRun);
        shotReady = result.ready;
        if (result.failed) {
          shotError = `Scene ${shot} did not reach its action predicate (tick ${run.tick}, ${run.mode}).`;
          root.dataset.shotError = shotError; console.error(shotError);
        }
      }
      run.sounds.length = 0;
      settle();
    } else {
      const controls = input.read();
      if (controls.mute) action('mute');
      if (controls.restart) action('restart');
      if (controls.pause) action('pause');
      if (controls.jump && ['title', 'caught', 'escaped'].includes(run.mode) && !ui.shop) { action('start'); controls.jump = false; }
      for (const tap of controls.taps) {
        const button = [...buttons].reverse().find(b => tap.x >= b.x && tap.x <= b.x + b.w && tap.y >= b.y && tap.y <= b.y + b.h);
        if (button) action(button.action);
        else if (run.mode === 'playing') controls.jump = true;
        else if (['title', 'caught', 'escaped'].includes(run.mode) && !ui.shop) action('start');
      }
      if (run.mode === 'playing') {
        pendingJump ||= controls.jump;
        accumulator += elapsed;
        let first = true;
        while (accumulator >= STEP && run.mode === 'playing') {
          stepRun(run, { ...controls, jump: first && pendingJump, slidePressed: first && controls.slidePressed });
          if (first) pendingJump = false;
          first = false; accumulator -= STEP;
        }
      } else { accumulator = 0; pendingJump = false; }
      settle();
      const sounds = run.sounds.splice(0);
      for (const sound of sounds) audio.play(sound);
      audio.weather(run.mode === 'playing' && run.weather.storm, run.weather.wind);
    }
    buttons = render(ctx, run, ui);
    document.getElementById('touch').dataset.playing = String(run.mode === 'playing' && !shot);
    if (!shot || shotReady) {
      root.dataset.ready = 'true';
      if (shotReady) { root.dataset.shotReady = shot; canvas.dataset.shotReady = shot; }
    }
    if (!shot || !shotReady && !shotError) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') startBrowser();
