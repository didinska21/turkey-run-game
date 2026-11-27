import { ZONES, ZONE_METRES } from './config.js';
import { clamp, noise } from './random.js';

export const PALETTES = Object.freeze({
  farm: { sky: ['#426a7a', '#f0a66e', '#ffdab0'], sun: '#ffe4a4', far: '#7b8c76', mid: '#546e64', near: '#314f4c', ground: '#bd7d47', soil: '#80583e', grass: '#e3b65e', cloud: '#f5c09a' },
  corn: { sky: ['#3b4a69', '#c77868', '#f9bf75'], sun: '#ffe2a2', far: '#777a69', mid: '#676b4e', near: '#3f5647', ground: '#b97b3c', soil: '#79523b', grass: '#e9b747', cloud: '#d59b91' },
  forest: { sky: ['#26364e', '#5b6378', '#bf8c84'], sun: '#ead8b2', far: '#4e6272', mid: '#344f59', near: '#203d43', ground: '#67715a', soil: '#3f554b', grass: '#91a783', cloud: '#535d72' },
  town: { sky: ['#152941', '#354664', '#657088'], sun: '#eee7bb', far: '#3d5364', mid: '#294652', near: '#193640', ground: '#6e7272', soil: '#414f53', grass: '#a9b3a5', cloud: '#46546b' },
  kitchen: { sky: ['#26383b', '#4b5551', '#927057'], sun: '#ffcc76', far: '#68716a', mid: '#455952', near: '#263e3d', ground: '#ac9a77', soil: '#626457', grass: '#d6bd90', cloud: '#859087' },
});
export function zoneAt(distance) {
  const absolute = Math.floor(distance / ZONE_METRES);
  return { index: absolute % ZONES.length, lap: Math.floor(absolute / ZONES.length), local: distance % ZONE_METRES };
}
export function weatherAt(distance, tick, seed) {
  const zone = zoneAt(distance);
  const storm = (zone.index === 2 && zone.local > 22) || (zone.index === 3 && zone.local < 355);
  const cycle = (tick + (seed % 59)) % 211;
  const thunderFront = Math.max(0, 1 - Math.abs(zone.local - 51) / 10);
  const lightning = storm ? Math.max(thunderFront, cycle < 8 ? 1 - cycle / 8 : cycle > 15 && cycle < 19 ? 0.44 : 0) : 0;
  const wind = storm ? Math.sin(tick * 0.017) * 0.7 + Math.sin(tick * 0.043) * 0.3 : Math.sin(tick * 0.009) * 0.15;
  return { storm, lightning, wind, rain: storm ? 1 : 0, night: zone.index === 2 || zone.index === 3 };
}
export function sceneryAt(run) {
  const zone = ZONES[run.zoneIndex];
  const palette = PALETTES[zone.id];
  const layers = [];
  for (let layer = 0; layer < 3; layer++) {
    const spacing = [250, 210, 290][layer];
    const parallax = [0.12, 0.27, 0.51][layer];
    const drift = run.world * parallax;
    const first = Math.floor(drift / spacing) - 1;
    for (let i = first; i < first + 9; i++) {
      layers.push({ layer, x: i * spacing - drift, height: 90 + noise(i + layer * 79, run.seed) * 140, variant: Math.floor(noise(i * 3 + layer, run.seed) * 4), index: i });
    }
  }
  return { zone, palette, layers, nightBoost: clamp(run.effects.nightLight, 0, 0.3) };
}
