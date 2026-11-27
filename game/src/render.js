import { BOSSES, COUNTS, GROUND, HEIGHT, UPGRADES, WIDTH, ZONES, ZONE_METRES } from './config.js';
import { clamp, noise } from './random.js';
import { sceneryAt } from './zones.js';

const INK = '#24383c';
const PAPER = '#fff0cf';
const GOLD = '#f1bb51';
const TEAL = '#85c8b9';
const FONTS = '"Trebuchet MS", "Arial Rounded MT Bold", Arial, sans-serif';
let g;
let buttons;
let pointer;

function box(x, y, w, h, fill, stroke = INK, radius = 8, weight = 3) {
  g.beginPath(); g.roundRect(x, y, w, h, radius);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = weight; g.stroke(); }
}
function oval(x, y, rx, ry, fill, stroke = INK, weight = 3, angle = 0) {
  g.beginPath(); g.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = weight; g.stroke(); }
}
function path(points, fill, stroke = INK, weight = 3, close = true) {
  g.beginPath();
  points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  if (close) g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = weight; g.stroke(); }
}
function line(x1, y1, x2, y2, color = INK, weight = 3) {
  path([[x1, y1], [x2, y2]], null, color, weight, false);
}
function text(value, x, y, size = 20, color = PAPER, align = 'left', weight = 700, outline = false) {
  g.font = `${weight} ${size}px ${FONTS}`; g.textAlign = align;
  g.textBaseline = 'alphabetic';
  if (outline) { g.strokeStyle = INK; g.lineWidth = size > 50 ? 9 : 5; g.strokeText(String(value), x, y); }
  g.fillStyle = color; g.fillText(String(value), x, y);
}
function label(value, x, y, color = INK, align = 'left') { text(value, x, y, 12, color, align, 800); }
function wrapped(value, x, y, width, size = 15, color = INK, height = 21) {
  g.font = `500 ${size}px ${FONTS}`;
  const words = value.split(' ');
  let current = '';
  let row = 0;
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (g.measureText(next).width > width && current) { text(current, x, y + row++ * height, size, color, 'left', 500); current = word; }
    else current = next;
  }
  if (current) text(current, x, y + row * height, size, color, 'left', 500);
}
function button(action, value, x, y, w, h, primary = false, small = false) {
  const hover = pointer && pointer.x >= x && pointer.x <= x + w && pointer.y >= y && pointer.y <= y + h;
  box(x, y + 5, w, h, '#182e35', null, 10);
  box(x, y, w, h, hover ? '#ffd783' : primary ? GOLD : PAPER, INK, 10, 3);
  text(value, x + w / 2, y + h / 2 + (small ? 5 : 7), small ? 14 : 19, INK, 'center', 900);
  buttons.push({ action, x, y, w, h });
}
function shadow(x, y, width = 65, alpha = 0.19) {
  g.save(); g.globalAlpha = alpha; oval(x, y + 4, width, 10, '#102c32', null); g.restore();
}
function heart(x, y, full = true, scale = 1) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  g.beginPath(); g.moveTo(0, 10); g.bezierCurveTo(-25, -5, -16, -23, 0, -11);
  g.bezierCurveTo(16, -23, 25, -5, 0, 10); g.closePath();
  g.fillStyle = full ? '#ce624c' : '#dacdb0'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  if (full) line(-9, -10, -5, -12, '#ffbea1', 2);
  g.restore();
}
function corn(x, y, scale = 1, rotate = 0) {
  g.save(); g.translate(x, y); g.rotate(rotate); g.scale(scale, scale);
  path([[-7, 10], [-17, -1], [-13, 16], [0, 22], [12, 12], [16, 0], [6, 9]], '#6b9571', INK, 2);
  oval(0, -2, 9, 18, GOLD, INK, 2, 0.13);
  for (let j = -10; j < 12; j += 7) { line(-5, j, 5, j + 1, '#c58a2d', 1.3); }
  line(0, -16, 0, 13, '#ffe89e', 2); g.restore();
}
function feather(x, y, scale = 1) {
  g.save(); g.translate(x, y); g.rotate(0.42); g.scale(scale, scale);
  oval(0, -3, 10, 24, '#d1e8d3', INK, 2, 0.15);
  line(0, 26, 0, -22, '#567d74', 2);
  for (let j = -14; j < 18; j += 7) { line(0, j, 7, j - 5, '#6f9a88', 1); line(0, j, -6, j - 4, '#6f9a88', 1); }
  g.restore();
}
function gravyBoat(x, y, scale = 1) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  oval(18, -4, 12, 9, null, PAPER, 7);
  path([[-26, -12], [15, -9], [19, 0], [12, 10], [-13, 10], [-21, 1], [-33, -17]], PAPER, INK, 2);
  oval(-3, -9, 16, 4, '#9c603a', INK, 1.5);
  box(-13, 11, 26, 4, '#efcc91', INK, 2, 2);
  path([[-14, -26], [-17, -33], [-12, -41]], null, '#ffe9b580', 2, false);
  path([[3, -26], [0, -34], [5, -40]], null, '#ffe9b580', 2, false);
  g.restore();
}

function cloud(x, y, scale, color) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  path([[-110, 16], [-98, 3], [-78, 1], [-69, -16], [-44, -21], [-26, -9], [-8, -25], [18, -28], [36, -9], [60, -11], [79, 2], [99, 9], [109, 17]], color, null);
  g.restore();
}
function pine(x, base, h, color, detail = false) {
  line(x, base - h * 0.4, x, base, color, h * 0.08);
  for (let i = 0; i < 3; i++) {
    const top = base - h + i * h * 0.22;
    const half = h * (0.22 + i * 0.07);
    path([[x, top], [x + half, top + h * 0.53], [x + half * 0.28, top + h * 0.47], [x + half * 1.05, top + h * 0.62], [x - half, top + h * 0.62], [x - half * 0.35, top + h * 0.48], [x - half * 0.8, top + h * 0.5]], color, null);
  }
  if (detail) line(x, base - h * 0.7, x, base - 15, '#9cb3a422', 2);
}
function oak(x, base, h, color, wind = 0) {
  path([[x - 10, base], [x - 8 + wind * 7, base - h * 0.7], [x + 7, base - h * 0.76], [x + 16, base]], color, null);
  const canopy = [[-45, -0.63], [-63, -0.78], [-35, -0.9], [0, -0.97], [36, -0.84], [57, -0.65]];
  for (const [dx, dy] of canopy) oval(x + dx * h / 160 + wind * 8, base + dy * h, h * 0.24, h * 0.2, color, null);
}
function barn(x, base, size, palette) {
  g.save(); g.translate(x, base); g.scale(size, size);
  box(-85, -123, 170, 123, '#995c4a', palette.near, 2, 3);
  path([[-101, -115], [-55, -173], [33, -173], [99, -115]], '#465455', palette.near, 4);
  for (let j = -72; j < 80; j += 18) line(j, -111, j, -4, '#ba7d5e', 2);
  box(-33, -81, 66, 81, '#684e42', '#d6b688', 2, 4);
  line(-31, -77, 31, -3, '#d6b688', 3); line(31, -77, -31, -3, '#d6b688', 3);
  box(-18, -146, 36, 23, '#efd398', palette.near, 2, 3);
  g.restore();
}
function windmill(x, y, scale, time, color) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  path([[-25, 160], [-10, 0], [10, 0], [27, 160]], null, color, 5);
  line(-18, 105, 19, 105, color, 4); line(-14, 55, 15, 55, color, 4);
  g.rotate(time * 0.16);
  for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); path([[8, -3], [24, -12], [73, -5], [73, 12], [25, 14]], color, null); }
  oval(0, 0, 9, 9, '#e0b779', color, 3); g.restore();
}
function lamp(x, base, size = 1) {
  g.save(); g.translate(x, base); g.scale(size, size);
  const glow = g.createRadialGradient(0, -200, 3, 0, -200, 83);
  glow.addColorStop(0, '#ffd68c60'); glow.addColorStop(1, '#ffd68c00');
  oval(0, -200, 83, 83, glow, null);
  line(0, 0, 0, -178, '#203d45', 7);
  box(-17, -223, 34, 42, '#f7d18b', '#233c42', 3, 5);
  path([[-25, -224], [0, -243], [25, -224]], '#29454c', '#233c42', 3);
  line(0, -222, 0, -184, '#8e7953', 2);
  box(-12, -8, 24, 8, '#29454c', null, 3);
  g.restore();
}
function house(x, base, width, height, variant, palette) {
  const colors = ['#607976', '#726975', '#8a7467', '#576d7a'];
  box(x - width / 2, base - height, width, height, colors[variant], palette.near, 1, 3);
  path([[x - width * 0.6, base - height], [x, base - height - 58], [x + width * 0.6, base - height]], palette.near, null);
  box(x + width * 0.2, base - height - 57, 16, 40, palette.near, null, 1);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const wx = x - width * 0.36 + col * width * 0.26;
      const wy = base - height + 24 + row * 52;
      box(wx, wy, 22, 31, '#efcb85', palette.near, 2, 3);
      line(wx + 11, wy, wx + 11, wy + 31, '#8b865e', 2);
    }
  }
  box(x - 16, base - 54, 32, 54, palette.near, '#b2aa8b', 2, 2);
  if (variant === 0) { box(x - width * 0.4, base - 30, width * 0.8, 19, '#ce9b6c', palette.near, 2, 2); label('PIE & ALIBIS', x, base - 17, palette.near, 'center'); }
}
function kitchenBackground(run, palette) {
  g.fillStyle = '#7a8c7b'; g.fillRect(0, 263, WIDTH, 310);
  for (let y = 267; y < 557; y += 47) {
    for (let x = -50; x < WIDTH + 60; x += 96) box(x + (y % 2 ? 0 : 48), y, 91, 42, (x + y) % 3 ? '#8c9c88' : '#98a58e', '#526b61', 2, 1);
  }
  const offset = run.world * 0.35 % 430;
  for (let x = -offset - 90; x < 1450; x += 430) {
    box(x, 326, 273, 208, '#334d4b', '#243d3c', 7, 5);
    box(x + 10, 336, 253, 24, '#b3bba5', '#243d3c', 3, 3);
    for (let n = 0; n < 5; n++) oval(x + 35 + n * 48, 348, 5, 5, '#3b5550', null);
    for (let door = 0; door < 2; door++) {
      const dx = x + 14 + door * 128;
      box(dx, 375, 117, 143, '#6c7567', '#243d3c', 5, 3);
      box(dx + 10, 401, 97, 84, '#b15a33', '#283e3b', 4, 4);
      const heat = g.createLinearGradient(0, 404, 0, 483);
      heat.addColorStop(0, '#d97835'); heat.addColorStop(1, '#ffd074');
      box(dx + 16, 408, 85, 70, heat, null, 2);
      for (let flame = 0; flame < 4; flame++) {
        const fx = dx + 26 + flame * 19;
        path([[fx - 7, 474], [fx - 4, 458], [fx + Math.sin(run.time * 5 + flame) * 4, 435], [fx + 7, 459], [fx + 8, 474]], '#ffe1a3', null);
      }
      line(dx + 26, 390, dx + 92, 390, '#d6c99f', 5);
    }
    path([[x - 13, 304], [x + 53, 242], [x + 219, 242], [x + 282, 304]], '#556d62', '#2d4944', 4);
    line(x + 62, 272, x + 211, 272, '#8b9a86', 3);
  }
  const rack = run.world * 0.2 % 300;
  line(0, 242, WIDTH, 242, '#263f3f', 7);
  for (let x = 40 - rack; x < 1400; x += 150) {
    line(x, 242, x, 272, '#d7d0ae', 3);
    oval(x, 300, 25, 29, '#b07b53', '#2a4341', 4);
    oval(x - 3, 297, 17, 20, '#cf9c69', '#926540', 2);
    line(x + 5, 275, x + 10, 254, '#c3b58e', 4);
  }
  box(949, 146, 252, 64, '#304b48', '#d0bb85', 4, 3);
  text('TODAY’S SPECIAL', 1075, 169, 13, '#d7ccaa', 'center');
  text('ONE THAT GOT AWAY', 1075, 193, 17, '#f4d28c', 'center');
  void palette;
}
function background(run) {
  const { zone, palette, layers, nightBoost } = sceneryAt(run);
  const sky = g.createLinearGradient(0, 0, 0, GROUND);
  palette.sky.forEach((color, index) => sky.addColorStop(index / 2, color));
  g.fillStyle = sky; g.fillRect(0, 0, WIDTH, HEIGHT);
  if (run.weather.night) {
    for (let i = 0; i < 43; i++) {
      const x = noise(i * 19, run.seed) * WIDTH;
      const y = 110 + noise(i * 71, run.seed) * 225;
      oval(x, y, i % 5 ? 1 : 2, i % 5 ? 1 : 2, '#ece0bd', null);
    }
  }
  if (zone.id !== 'kitchen') {
    const sunX = zone.id === 'farm' ? 1010 : zone.id === 'corn' ? 1040 : 1090;
    const sunY = zone.id === 'corn' ? 285 : 224;
    const halo = g.createRadialGradient(sunX, sunY, 25, sunX, sunY, 160);
    halo.addColorStop(0, `${palette.sun}30`); halo.addColorStop(1, `${palette.sun}00`);
    oval(sunX, sunY, 160, 160, halo, null);
    oval(sunX, sunY, zone.id === 'town' ? 42 : 65, zone.id === 'town' ? 42 : 65, palette.sun, null);
    if (zone.id === 'town') oval(sunX - 15, sunY - 12, 39, 39, palette.sky[1], null);
    for (let i = 0; i < 7; i++) {
      const drift = run.world * 0.035;
      const x = ((i * 251 - drift) % 1650 + 1650) % 1650 - 150;
      cloud(x, 165 + noise(i, run.seed) * 140, 0.5 + noise(i * 3, run.seed) * 0.6, palette.cloud);
    }
    for (let layer = 0; layer < 3; layer++) {
      const base = 430 + layer * 44;
      const points = [[0, GROUND]];
      for (let x = -60; x <= WIDTH + 60; x += 60) {
        points.push([x, base + Math.sin(x * 0.004 + run.world * (0.0004 + layer * 0.0002)) * (28 - layer * 7) + Math.sin(x * 0.009 + layer) * 9]);
      }
      points.push([WIDTH, GROUND]);
      path(points, [palette.far, palette.mid, palette.near][layer], null);
    }
    for (const element of layers) {
      const { layer, x, height, variant } = element;
      const color = [palette.far, palette.mid, palette.near][layer];
      const base = 428 + layer * 57;
      if (zone.id === 'forest') {
        if (variant % 2) pine(x, base, height * (0.9 + layer * 0.24), color, layer === 2);
        else oak(x, base, height * 1.25, color, run.weather.wind);
      } else if (zone.id === 'town') {
        if (layer < 2) house(x, base, 135 + variant * 17, 113 + height * 0.4, variant, palette);
        else if (element.index % 2 === 0) lamp(x, GROUND, 1.04);
      } else if (zone.id === 'farm') {
        if (layer === 1 && variant < 2) barn(x, base, 0.7 + variant * 0.12, palette);
        else if (layer === 0 && variant === 3) windmill(x, base - 120, 0.7, run.time, color);
        else if (layer !== 2) oak(x, base, height * 0.62, color);
      }
    }
    if (zone.id === 'corn' || zone.id === 'farm') {
      const drift = run.world * 0.6 % 42;
      for (let x = -drift - 20; x < WIDTH + 50; x += 42) {
        const h = zone.id === 'corn' ? 95 + noise(Math.floor((x + run.world * 0.6) / 42), run.seed) * 50 : 42;
        const bend = run.weather.wind * 15;
        line(x, 555, x + bend, 555 - h, zone.id === 'corn' ? '#c9a04d' : '#9d9b62', 3);
        for (let i = 1; i < 4; i++) {
          path([[x + bend * i / 4, 555 - h * i / 4], [x - 18, 535 - h * i / 4], [x - 10, 551 - h * i / 4]], '#889255', null);
          path([[x + bend * i / 4, 551 - h * i / 4], [x + 22, 523 - h * i / 4], [x + 12, 548 - h * i / 4]], '#a5a75e', null);
        }
        if (zone.id === 'corn') oval(x + bend, 550 - h, 3, 13, '#dcc16e', null);
      }
    }
    if (zone.id === 'forest') {
      for (let x = 90 - run.world * 0.4 % 480; x < 1350; x += 480) lamp(x, GROUND, 0.78);
    }
    for (let i = 0; i < 5; i++) {
      const x = ((i * 197 + 105 - run.world * 0.08) % 1280 + 1280) % 1280;
      const y = 243 + Math.sin(i * 2.4) * 34;
      path([[x - 8, y], [x, y + 4], [x + 8, y]], null, palette.near, 2, false);
    }
  } else kitchenBackground(run, palette);
  g.fillStyle = palette.ground; g.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
  g.fillStyle = palette.soil; g.fillRect(0, GROUND + 57, WIDTH, HEIGHT - GROUND - 57);
  line(0, GROUND, WIDTH, GROUND, INK, 5);
  line(0, GROUND + 5, WIDTH, GROUND + 5, palette.grass, 3);
  const groundDrift = run.world % 120;
  for (let x = -groundDrift; x < WIDTH + 140; x += 120) {
    if (zone.id === 'kitchen' || zone.id === 'town') {
      line(x, GROUND + 9, x - 39, GROUND + 57, `${palette.soil}99`, 2);
      line(x - 39, GROUND + 64, x - 79, HEIGHT, '#263d3d55', 2);
    } else {
      line(x + 12, GROUND + 20, x + 36, GROUND + 20, '#eac48d77', 2);
      oval(x + 68, GROUND + 35, 5, 2, palette.soil, null);
    }
  }
  for (let i = 0; i < 26; i++) {
    const x = ((i * 71 - run.world * 1.25) % 1440 + 1440) % 1440 - 80;
    const y = GROUND + 78 + noise(i, run.seed) * 68;
    line(x, y, x + 12, y - 2, '#d7b68132', 2);
  }
  if (nightBoost && run.weather.night) {
    g.fillStyle = `rgba(207,233,181,${nightBoost})`; g.fillRect(0, 113, WIDTH, GROUND - 113);
  }
  if (run.weather.storm) {
    g.fillStyle = '#14263a20'; g.fillRect(0, 113, WIDTH, GROUND - 113);
    cloud(350, 225, 2.3, '#35475890'); cloud(840, 182, 2.7, '#35475890');
  }
}

export function drawTurkey(x, y, time, options = {}, scale = 1) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  if (options.hurt > 0 && Math.floor(time * 15) % 2) g.globalAlpha = 0.58;
  if (options.slide) { g.scale(1.2, 0.53); g.translate(0, 0); }
  const air = options.air;
  const stride = Math.sin(time * 20);
  const tail = ['#b64f43', '#c9673e', '#df8b3f', '#e9ad4b', '#cf703c', '#a7463e'];
  for (let i = 0; i < 6; i++) {
    const angle = -1.1 + i * 0.36;
    const fx = -35 - Math.cos(angle) * 26;
    const fy = -47 + Math.sin(angle) * 26;
    oval(fx, fy - 20, 16, 46, tail[i], INK, 3, angle - 0.65);
    line(fx - 4, fy - 45, fx + 5, fy - 17, '#f5d08a80', 3);
  }
  for (let i = 0; i < 2; i++) {
    const foot = air ? (i ? -4 : 20) : stride * (i ? -15 : 15);
    line(-10 + i * 27, -27, -8 + i * 23 + foot, -8, '#dc8e3e', 7);
    line(-8 + i * 23 + foot, -8, 8 + i * 23 + foot, -4, INK, 6);
    line(-8 + i * 23 + foot, -8, 8 + i * 23 + foot, -4, '#e9a748', 3);
    line(3 + i * 23 + foot, -6, 10 + i * 23 + foot, -10, '#e9a748', 3);
  }
  oval(-1, -49, 43, 33, '#ba6440', INK, 4, -0.1);
  oval(8, -42, 27, 20, '#d58b4e', null, 0, -0.1);
  g.save(); g.translate(-10, -52); g.rotate(air ? -0.55 : options.slide ? 0.3 : stride * 0.12);
  oval(0, 5, 24, 14, '#864c3c', INK, 3, 0.3);
  for (let i = 0; i < 3; i++) line(-17 + i * 10, 5, -9 + i * 10, 14, '#ca854e', 2);
  g.restore();
  path([[17, -61], [26, -93], [43, -95], [42, -51]], '#c98551', INK, 4);
  oval(39, -97, 24, 23, '#e1a467', INK, 4, 0.13);
  oval(45, -102, 12, 14, PAPER, INK, 2);
  oval(50, -101, 4, 6, INK, null);
  oval(52, -104, 1.5, 2, '#ffffff', null);
  path([[57, -100], [79, -92], [58, -85]], '#f3b746', INK, 3);
  path([[24, -117], [24, -129], [33, -122], [39, -130], [45, -120], [50, -116]], '#c95745', INK, 3);
  oval(54, -76, 7, 15, '#c64f42', INK, 2, -0.1);
  box(23, -79, 25, 10, '#83c7b4', INK, 3, 2);
  path([[25, -77], [-3, -87], [0, -73], [-19, -75], [18, -63]], '#83c7b4', INK, 3);
  line(17, -74, -7, -79, '#b6e2c9', 2);
  if (options.shield) {
    g.save(); g.globalAlpha = 0.7;
    oval(0, -63, 83, 78, '#a9e3ce10', '#c3eddb', 3);
    for (let i = 0; i < 3; i++) feather(Math.cos(time * 2 + i * 2.1) * 83, -63 + Math.sin(time * 2 + i * 2.1) * 75, 0.45);
    g.restore();
  }
  if (options.boost) {
    line(-88, -39, -128, -39, GOLD, 4); line(-73, -21, -111, -21, PAPER, 3);
    line(-93, -64, -116, -64, GOLD, 3);
  }
  if (options.worried) {
    path([[70, -119], [75, -133], [80, -120]], '#a5d9d5', INK, 1.5);
    path([[86, -107], [97, -117], [98, -105]], '#a5d9d5', INK, 1.5);
  }
  g.restore();
}
function farmer(x, y, time, attacking = false, scale = 1) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  const step = Math.sin(time * 13) * 11;
  line(-33, -29, -42 + step, -5, '#31474e', 14); line(9, -29, 18 - step, -5, '#31474e', 14);
  box(-51 + step, -12, 27, 12, '#3c3933', INK, 3, 2); box(9 - step, -12, 28, 12, '#3c3933', INK, 3, 2);
  line(-49, -47, -68, -162, '#8e6b43', 5);
  for (let i = 0; i < 3; i++) line(-77 + i * 11, -160, -77 + i * 11, -185, '#a5b4a5', 3);
  line(-77, -159, -55, -159, '#a5b4a5', 3);
  path([[-41, -94], [-25, -106], [16, -94], [31, -44], [-41, -36]], '#c99a55', INK, 4);
  path([[-30, -95], [-23, -64], [8, -64], [13, -96], [23, -51], [18, -24], [-35, -24], [-44, -49]], '#547c80', INK, 3);
  box(-22, -62, 28, 21, '#749b96', INK, 3, 2);
  oval(-11, -116, 24, 28, '#dca47a', INK, 3);
  oval(13, -110, 15, 10, '#dca47a', INK, 3);
  path([[-26, -107], [-15, -89], [8, -91], [12, -103], [-2, -100]], '#e3d6b3', INK, 2);
  line(-1, -124, 9, -122, INK, 3); oval(6, -117, 2, 3, INK, null);
  box(-35, -148, 47, 27, '#a67a46', INK, 5, 3);
  oval(-8, -125, 50, 7, '#c9a165', INK, 3, -0.07);
  line(-28, -135, 7, -135, '#5b6e5c', 6);
  line(17, -103, 39, -96, '#c3ad66', 2);
  const reach = attacking ? 75 : 27 + Math.sin(time * 13) * 8;
  line(16, -86, 24 + reach, attacking ? -83 : -62, '#c99a55', 15);
  oval(28 + reach, attacking ? -83 : -62, 11, 9, '#dca47a', INK, 2);
  g.restore();
}
function dog(x, y, time, lunging = false, scale = 1) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  const stride = Math.sin(time * 20) * 15;
  for (let i = 0; i < 4; i++) line(-33 + i * 19, -27, -36 + i * 21 + (lunging ? (i < 2 ? -16 : 16) : stride * (i % 2 ? -1 : 1)), -5, '#996442', 9);
  path([[-43, -38], [-67, -57], [-73, -49], [-57, -29]], '#ab774d', INK, 3);
  oval(-6, -40, 50, 26, '#a76b44', INK, 4);
  oval(33, -62, 29, 26, '#b78052', INK, 3);
  oval(18, -70, 12, 23, '#704c38', INK, 3, -0.45);
  oval(54, -51, 25, 15, '#d0a977', INK, 3);
  oval(72, -55, 8, 6, INK, null);
  oval(45, -69, 8, 9, PAPER, INK, 1.5); oval(49, -68, 3, 4, INK, null);
  line(35, -80, 50, -81, INK, 3);
  path([[43, -37], [59, -35], [57, -20], [47, -19]], '#dc837a', INK, 2);
  line(53, -33, 52, -23, '#a94e4e', 1.5);
  path([[21, -45], [28, -33], [38, -36], [32, -50]], '#cf5e47', INK, 2);
  oval(30, -29, 7, 7, GOLD, INK, 2);
  g.restore();
}
function chef(x, y, time, attacking = false, scale = 1) {
  g.save(); g.translate(x, y); g.scale(scale, scale);
  const stride = Math.sin(time * 12) * 10;
  line(-16, -30, -21 + stride, -5, '#293d40', 15); line(16, -30, 22 - stride, -5, '#293d40', 15);
  box(-35 + stride, -10, 31, 12, '#24383c', INK, 3, 2); box(12 - stride, -10, 29, 12, '#24383c', INK, 3, 2);
  path([[-29, -109], [23, -109], [39, -37], [-35, -31]], '#efe2c0', INK, 4);
  line(0, -96, 7, -36, '#b5bda9', 2);
  for (let i = 0; i < 3; i++) { oval(-11, -82 + i * 17, 2.5, 2.5, INK, null); oval(16, -82 + i * 17, 2.5, 2.5, INK, null); }
  oval(0, -126, 25, 25, '#dab18b', INK, 3);
  oval(24, -123, 13, 9, '#dab18b', INK, 2);
  oval(16, -130, 3, 4, INK, null); line(5, -139, 21, -140, INK, 3);
  path([[-6, -117], [3, -122], [12, -117], [27, -118], [19, -108], [8, -111], [-2, -108]], '#2b3d3c', INK, 2);
  oval(-17, -165, 20, 20, PAPER, INK, 3); oval(7, -174, 23, 22, PAPER, INK, 3); oval(28, -162, 19, 18, PAPER, INK, 3);
  box(-24, -163, 51, 24, '#f8e9cb', INK, 4, 3);
  line(-10, -158, -10, -144, '#c3c9af', 2); line(10, -158, 10, -144, '#c3c9af', 2);
  path([[-22, -106], [0, -93], [23, -108], [6, -103], [17, -83], [-1, -90], [-12, -82], [-8, -100]], '#c45b47', INK, 2);
  line(25, -97, attacking ? 70 : 40, attacking ? -133 : -70, PAPER, 17);
  oval(attacking ? 72 : 43, attacking ? -135 : -72, 10, 8, '#dbb18a', INK, 2);
  if (attacking) knife(80, -149, 0.8, -0.5);
  g.restore();
}
function knife(x, y, scale = 1, rotation = 0) {
  g.save(); g.translate(x, y); g.rotate(rotation); g.scale(scale, scale);
  path([[-38, -7], [22, -7], [38, 0], [20, 10], [-38, 10]], '#c6dcd5', INK, 2.5);
  line(-29, -2, 22, -2, PAPER, 2);
  box(-62, -7, 27, 17, '#784e3c', INK, 4, 2);
  oval(-53, 1, 1.5, 1.5, '#dcc89f', null); oval(-43, 1, 1.5, 1.5, '#dcc89f', null);
  g.restore();
}

function obstacle(item, run) {
  if (item.attack) {
    if (item.attack === 'knife') {
      line(item.x + 110, item.y + 8, item.x + 151, item.y + 8, '#f5d29a', 3);
      line(item.x + 115, item.y + 16, item.x + 137, item.y + 16, '#f5d29a', 2);
      knife(item.x + 48, item.y + 8, 0.97, Math.PI);
    } else if (item.attack === 'dog') dog(item.x + 45, item.y + 53, run.time, true);
    else {
      line(item.x - 20, item.y + 12, item.x + 67, item.y + 12, '#d1a45f', 22);
      oval(item.x + 75, item.y + 13, 24, 16, '#e0b083', INK, 3);
      for (let i = 0; i < 3; i++) line(item.x + 86, item.y + 4 + i * 7, item.x + 102, item.y + 2 + i * 7, '#e0b083', 5);
    }
    return;
  }
  const d = item.def;
  const { w, h, color, detail } = d;
  shadow(item.x + w / 2, GROUND, w * 0.48, d.overhead ? 0.08 : 0.18);
  g.save(); g.translate(item.x, item.y);
  if (d.behavior === 'wobble') g.rotate(item.angle);
  const dark = '#5e5742';
  switch (d.art) {
    case 'fence': {
      for (let i = 0; i < (detail === 1 ? 6 : 3); i++) {
        const x = 9 + i * (w - 18) / (detail === 1 ? 5 : 2);
        path([[x - 5, 0], [x - 5, -h + 8], [x, -h], [x + 6, -h + 8], [x + 6, 0]], color, INK, 2.5);
      }
      const rails = detail === 3 ? 3 : 2;
      for (let i = 0; i < rails; i++) {
        const y = -h + 22 + i * 25;
        path([[-3, y], [w + 3, y - 5], [w + 2, y + 7], [-2, y + 11]], color, INK, 2.5);
        line(8, y + 3, w - 6, y, '#edd39a88', 2);
        for (const x of [12, w - 12]) oval(x, y + 2, 2, 2, INK, null);
      }
      if (detail === 4) {
        for (let i = 0; i < 7; i++) oval(12 + i * 13, -h + 23 + Math.sin(i) * 9, 10, 4, '#9dba7d', '#476c59', 1.5, i);
      }
      if (detail === 3) { corn(20, -35, 0.55); corn(73, -47, 0.55); }
      break;
    }
    case 'bale': {
      if (detail === 0) {
        oval(w / 2, -h / 2, w / 2, h / 2, color, INK, 3.5);
        for (let r = 10; r < 38; r += 9) oval(w / 2, -h / 2, r, r * 0.92, null, '#ae7e39', 2);
        line(9, -h + 21, w - 8, -h + 16, '#f4d27e', 3);
        line(11, -20, w - 5, -25, '#8a6f3f', 3);
      } else {
        box(0, -h, w, h, color, INK, 7, 3.5);
        for (let i = 0; i < 14; i++) line(5 + i * 7, -h + 8, 2 + i * 7, -7, i % 2 ? '#eed487' : '#ba8b3c', 2);
        for (const x of [25, w - 25]) line(x, -h, x, 0, '#866f41', 5);
      }
      break;
    }
    case 'pumpkin': {
      g.translate(w / 2, -h / 2); g.rotate(item.angle);
      oval(0, 0, w / 2, h / 2 - 2, color, INK, 3.5);
      for (const factor of [-0.48, 0, 0.48]) oval(w * factor * 0.45, 0, w * 0.19, h / 2 - 3, null, detail === 2 ? '#8d9e8a' : '#a45e2f', 2);
      path([[-6, -h / 2 + 2], [-3, -h / 2 - 11], [6, -h / 2 - 13], [5, -h / 2 + 4]], '#77825b', INK, 2);
      if (detail > 1) {
        path([[-19, -6], [-11, -13], [-7, -4]], detail === 2 ? '#5a776d' : '#ffd58c', INK, 1.5);
        path([[5, -4], [11, -13], [19, -6]], detail === 2 ? '#5a776d' : '#ffd58c', INK, 1.5);
        path([[-12, 10], [0, 16], [13, 8]], null, INK, 2.5, false);
      }
      if (detail === 1) for (let i = 0; i < 4; i++) line(-23 + i * 14, -18, -27 + i * 14, 18, '#6d7b4d', 3);
      if (detail === 4) { oval(-9, 12, 3, 3, '#e9c17d', null); oval(9, 11, 3, 3, '#e9c17d', null); }
      break;
    }
    case 'mud':
    case 'puddle': {
      oval(w / 2, -h / 2 + 2, w / 2, h / 2, color, INK, 2.5);
      oval(w * 0.36, -h / 2, w * 0.21, 3, null, d.art === 'puddle' ? '#b1c9c5' : '#c39c71', 1.5);
      line(w * 0.62, -h / 2 + 3, w * 0.83, -h / 2 + 3, '#c5d3c0', 1.5);
      if (detail === 1) { oval(w * 0.7, -h - 3 - Math.sin(run.time * 3) * 3, 5, 5, color, '#9aa884', 1.5); }
      if (detail === 0 && d.art === 'mud') { path([[25, -9], [22, -27], [35, -29], [38, -15], [53, -10]], '#b69b68', INK, 2); }
      if (detail === 2) { line(w - 28, -7, w - 5, -30, '#d6d8bd', 4); oval(w - 3, -32, 5, 8, '#b4c4b6', INK, 1.5); }
      break;
    }
    case 'scarecrow': {
      const sway = Math.sin(run.time * 4 + item.phase) * 8;
      line(w / 2, 0, w / 2 + sway, -h - 25, '#826241', 8);
      line(0, -h + 37, w, -h + 27, '#a3814c', 7);
      path([[w / 2 - 16, -h + 15], [w / 2 + 17, -h + 15], [w + 5, -h + 43], [w - 5, -h + 58], [w / 2 + 22, -h + 43], [w / 2 + 16, -46], [w / 2 - 20, -49], [w / 2 - 22, -h + 43], [1, -h + 58], [-8, -h + 43]], color, INK, 3);
      oval(w / 2, -h + 8, 21, 21, '#d8b36d', INK, 3);
      path([[w / 2 - 33, -h - 4], [w / 2 - 17, -h - 28], [w / 2 + 11, -h - 25], [w / 2 + 33, -h - 4]], detail ? '#3d4e47' : '#a2844d', INK, 3);
      for (const x of [w / 2 - 8, w / 2 + 8]) { line(x - 3, -h + 3, x + 3, -h + 9, INK, 2); line(x + 3, -h + 3, x - 3, -h + 9, INK, 2); }
      line(w / 2 - 7, -h + 18, w / 2 + 8, -h + 16, INK, 2);
      if (detail) { oval(w - 3, -h + 24, 13, 7, '#243a3c', INK, 2); path([[w + 7, -h + 24], [w + 19, -h + 20], [w + 10, -h + 15]], '#243a3c', null); }
      break;
    }
    case 'cart': {
      box(3, -h + 10, w - 6, h - 26, color, INK, 4, 3.5);
      for (let i = 0; i < 3; i++) line(8, -h + 25 + i * 17, w - 8, -h + 25 + i * 17, '#6f6650', 2);
      for (const x of [21, w - 21]) { oval(x, -10, 16, 16, '#5f5f4b', INK, 3); oval(x, -10, 7, 7, '#c9b58b', INK, 2); }
      line(w, -h / 2, w + 21, -h / 2 - 14, INK, 5);
      if (detail === 0) {
        for (let i = 0; i < 3; i++) { box(14 + i * 29, -h - 12, 22, 36, '#c3d3c5', INK, 5, 2); box(17 + i * 29, -h - 16, 16, 8, '#7e9c94', INK, 2, 2); }
      } else if (detail === 1) for (let i = 0; i < 5; i++) corn(18 + i * 20, -h + 2, 0.7, -0.7);
      else for (let i = 0; i < 3; i++) { oval(22 + i * 30, -h + 7, 13, 22, '#d4a46a', INK, 2, 0.4); for (let j = 0; j < 3; j++) line(14 + i * 30, -h - 3 + j * 8, 23 + i * 30, -h + j * 8, '#ecd199', 2); }
      break;
    }
    case 'crate': {
      box(0, -h, w, h, color, INK, 3, 3.5);
      for (let i = 1; i < 4; i++) line(4, -h + i * h / 4, w - 4, -h + i * h / 4, dark, 2);
      path([[4, -h + 6], [w - 9, -5], [w - 2, -14], [13, -h + 2]], '#d7b580', INK, 2);
      if (detail === 0) { box(w / 2 - 16, -h + 16, 33, 22, '#e2d0a0', INK, 1, 1.5); label('FEED', w / 2, -h + 31, INK, 'center'); }
      else if (detail === 1) { path([[16, -h + 22], [19, -h + 8], [30, -h + 14], [39, -h + 8], [46, -h + 27], [32, -h + 37]], '#c38d59', INK, 2); }
      else { oval(33, -h + 26, 22, 8, '#b7c8b7', INK, 2, -0.3); path([[49, -h + 18], [65, -h + 30], [64, -h + 9]], '#b7c8b7', INK, 2); oval(19, -h + 28, 2, 2, INK, null); }
      break;
    }
    case 'barrel': {
      path([[8, -h], [w - 8, -h], [w, -h / 2], [w - 7, 0], [7, 0], [0, -h / 2]], color, INK, 3.5);
      for (let i = 1; i < 5; i++) line(i * w / 5, -h + 3, i * w / 5, -3, '#754f37', 2);
      for (const y of [-h + 14, -18]) box(0, y, w, 9, '#81948b', INK, 2, 2);
      oval(w / 2, -h, w / 2 - 8, 7, '#ceaa6e', INK, 2);
      oval(w / 2, -h / 2, 12, 14, '#df9b57', INK, 2); line(w / 2, -h / 2 - 11, w / 2 + 4, -h / 2 - 19, '#759064', 2);
      break;
    }
    case 'line':
    case 'net': {
      line(-8, -h - 10, w + 8, -h - 4, '#b2ae84', 3);
      if (d.art === 'net') {
        box(0, -h + 3, w, h - 48, '#d2c58f22', color, 2, 2);
        for (let i = 0; i < w; i += 17) line(i, -h + 3, i, -45, color, 1.5);
        for (let y = -h + 5; y < -44; y += 15) line(0, y, w, y, color, 1.5);
      } else {
        for (let i = 0; i < 3; i++) {
          const x = 8 + i * 43;
          const y = -h + 3;
          path([[x + 8, y], [x + 22, y], [x + 37, y + 16], [x + 28, y + 25], [x + 25, y + 17], [x + 26, -43], [x + 4, -43], [x + 4, y + 17], [x - 2, y + 24], [x - 10, y + 16]], i === 1 ? '#bd765e' : color, INK, 2);
          box(x + 9, y - 8, 5, 11, '#cba36c', INK, 1, 1);
        }
      }
      break;
    }
    case 'sacks': {
      for (let i = 0; i < 2; i++) {
        const sx = w * (i ? 0.68 : 0.3);
        const sy = i ? -h * 0.44 : -h * 0.35;
        oval(sx, sy, w * 0.3, h * 0.4, color, INK, 3, i ? 0.17 : -0.12);
        box(sx - 13, sy - h * 0.35, 25, 10, '#a8916b', INK, 2, 2);
        if (detail === 0) corn(sx, sy, 0.55);
        else if (detail === 1) { box(sx - 16, sy - 9, 31, 18, '#e6dbc5', INK, 1, 1); line(sx - 15, sy - 9, sx, sy + 3, '#857b68', 1); line(sx + 15, sy - 9, sx, sy + 3, '#857b68', 1); }
        else { text('FLOUR', sx, sy + 5, 10, '#7b725b', 'center'); line(sx - 16, sy + 13, sx + 16, sy + 13, '#b9ae8e', 2); }
      }
      break;
    }
    case 'trap': {
      box(0, -13, w, 13, detail === 2 ? color : '#8a7c56', INK, 3, 3);
      if (detail === 0) {
        line(w * 0.4, -8, w * 0.8, -h - item.snap * 14, '#bc9a62', 6);
        for (let i = 0; i < 6; i++) line(6 + i * 9, -16, 5 + i * 9, -29 - item.snap * 10, color, 3);
      } else if (detail === 1) {
        oval(w / 2, -16, w * 0.36, 16 + item.snap * 10, null, color, 4);
        for (let i = 0; i < 6; i++) path([[10 + i * 10, -21], [15 + i * 10, -33 - item.snap * 10], [20 + i * 10, -20]], color, INK, 1);
      } else {
        path([[3, -15], [w - 4, -h - item.snap * 12], [w - 4, -h + 2 - item.snap * 12], [5, -8]], '#b78e5c', INK, 3);
        line(20, -18, w - 20, -h + 11, '#ead1a0', 2);
      }
      break;
    }
    case 'log': {
      box(17, -h + 2, w - 17, h - 4, color, INK, 12, 3);
      oval(18, -h / 2, 20, h / 2, '#d1ad7c', INK, 3);
      for (let r = 6; r < 20; r += 6) oval(18, -h / 2, r * 0.7, r * 1.3, null, '#9e8056', 1.5);
      for (let i = 0; i < 3; i++) line(45, -h + 15 + i * 17, w - 13, -h + 12 + i * 17, '#735e45', 3);
      path([[w * 0.7, -h + 4], [w * 0.65, -h - 15], [w * 0.78, -h - 21], [w * 0.85, -h + 7]], color, INK, 2);
      break;
    }
    case 'branch': {
      path([[-11, -h + 5], [w + 8, -h - 3], [w - 6, -h + 17], [0, -h + 24]], color, INK, 4);
      for (let i = 0; i < 4; i++) {
        const x = i * 32;
        line(x + 5, -h + 14, x + 18, -48, color, 9);
        path([[x + 5, -67], [x + 29, -75], [x + 20, -55]], '#708b64', INK, 2);
      }
      break;
    }
    case 'mushroom': {
      for (let i = 0; i < 3; i++) {
        const x = 19 + i * 29;
        const height = h * (i === 1 ? 1 : 0.76);
        box(x - 7, -height + 16, 14, height - 16, '#decdab', INK, 5, 2);
        g.beginPath(); g.ellipse(x, -height + 20, 24, 23, 0, Math.PI, Math.PI * 2); g.closePath();
        g.fillStyle = color; g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
        for (let j = 0; j < 3; j++) oval(x - 13 + j * 11, -height + 11 - (j === 1 ? 6 : 0), 3, 3, '#f3dab2', null);
      }
      break;
    }
    case 'hedge': {
      box(5, -h + 12, w - 10, h - 12, color, INK, 9, 3);
      for (let i = 0; i < 6; i++) oval(8 + i * 17, -h + 14, 18, 17 + i % 2 * 5, color, INK, 2);
      for (let i = 0; i < 8; i++) {
        const x = 8 + i * 12;
        path([[x, -h + 30], [x + 3, -h + 16], [x + 8, -h + 29]], '#b4bd86', INK, 1.5);
        oval(x + 4, -25 - i % 3 * 12, 7, 3, '#90a776', null, 0, i);
      }
      break;
    }
    case 'awning': {
      path([[-5, -h + 11], [13, -h - 8], [w - 13, -h - 8], [w + 5, -h + 11], [w + 5, -47], [-5, -47]], color, INK, 3);
      for (let i = 0; i < 6; i++) {
        const x = i * w / 6;
        path([[x, -h + 9], [x + 12, -h - 7], [x + 23, -h - 7], [x + 14, -h + 9], [x + 14, -47], [x, -47]], '#e4cda7', null);
      }
      line(-5, -h + 11, w + 5, -h + 11, INK, 2);
      break;
    }
    case 'bin': {
      path([[4, -h + 10], [w - 4, -h + 10], [w - 10, 0], [10, 0]], color, INK, 3);
      for (let i = 0; i < 4; i++) line(15 + i * 12, -h + 22, 18 + i * 10, -10, '#567d79', 3);
      box(-2, -h + 4, w + 4, 10, '#a4b7a5', INK, 3, 3);
      box(w / 2 - 11, -h - 3, 22, 7, '#8aa698', INK, 2, 2);
      for (const x of [-1, w + 1]) line(x, -h + 32, x, -h + 48, INK, 4);
      break;
    }
    case 'oven': {
      box(0, -h, w, h, '#49615a', INK, 5, 4);
      box(9, -h + 11, w - 18, h - 20, color, INK, 4, 3);
      box(15, -h + 18, w - 30, h - 35, '#f7bb63', null, 2);
      for (let i = 0; i < 4; i++) {
        const x = 25 + i * 21;
        path([[x - 7, -15], [x - 4, -30], [x + Math.sin(run.time * 6 + i) * 5, -h + 19], [x + 7, -27], [x + 8, -15]], '#ffe4a1', null);
      }
      path([[8, -4], [w - 8, -4], [w + 14, 7], [-10, 7]], '#7d8976', INK, 3);
      line(25, -h + 5, w - 25, -h + 5, '#d4c9a3', 4);
      break;
    }
    case 'knife': {
      if (d.overhead) {
        const swing = Math.sin(run.time * 4 + item.phase) * 0.17;
        line(w / 2, -h - 47, w / 2 + swing * 40, -h + 13, '#b5bba1', 3);
        knife(w / 2, -h + 35, 1.03, swing);
      } else {
        knife(w / 2, -h * 0.48, 0.9, -Math.PI / 2 + 0.16);
        for (let i = 0; i < 3; i++) line(19 + i * 15, -h - 34, 19 + i * 15, -h - 15, '#e9d1a0', 2);
        oval(w / 2, 0, 20, 4, '#ee9d5980', null);
      }
      break;
    }
    case 'plates': {
      for (let i = 0; i < 8; i++) {
        const x = w / 2 + Math.sin(i * 2 + item.angle) * 4;
        oval(x, -8 - i * 10, w / 2 - 2, 8, color, INK, 2);
        oval(x, -10 - i * 10, w / 2 - 8, 3, null, '#91aaa1', 1.5);
      }
      break;
    }
    case 'pots': {
      line(-5, -h - 6, w + 5, -h - 6, '#bdc2a5', 5);
      for (let i = 0; i < 3; i++) {
        const x = 21 + i * 46;
        line(x, -h - 6, x, -h + 19, '#b7b998', 3);
        oval(x, -68, 20, 25, color, INK, 3);
        oval(x, -68, 13, 18, null, '#e0b584', 2);
        box(x - 5, -h + 5, 10, 23, '#aab79e', INK, 3, 2);
      }
      break;
    }
  }
  g.restore();
  if (item.x > run.turkey.x + 160 && item.x < run.turkey.x + 460 && !item.hit) {
    const x = item.x + w / 2;
    const y = Math.min(item.y - h - 28, 400);
    box(x - 15, y - 17, 30, 27, d.overhead ? '#e8cda2' : '#d8dfb4', INK, 5, 2);
    text(d.overhead ? '↓' : '↑', x, y + 3, 21, INK, 'center');
  }
}

function storm(run) {
  if (!run.weather.storm) return;
  const wind = run.weather.wind;
  g.save(); g.beginPath(); g.rect(0, 114, WIDTH, HEIGHT - 114); g.clip();
  for (let i = 0; i < 115; i++) {
    const x = ((noise(i * 13, run.seed) * 1500 - run.tick * (5 + wind * 2)) % 1500 + 1500) % 1500 - 100;
    const y = ((noise(i * 17, run.seed) * 730 + run.tick * 13) % 730);
    line(x, y, x - 8 - wind * 9, y + 21, i % 3 ? '#c4dfda50' : '#d4e6d48a', i % 4 ? 1 : 2);
  }
  if (run.weather.lightning > 0) {
    g.globalAlpha = run.weather.lightning;
    path([[941, 116], [908, 218], [942, 211], [874, 336], [902, 239], [868, 244]], '#fff5cd', null);
    path([[909, 217], [986, 280], [960, 226], [1007, 245]], '#fff5cd', null);
    g.fillStyle = '#e5f5f01a'; g.fillRect(0, 114, WIDTH, HEIGHT - 114);
  }
  g.restore();
  const gust = run.weather.wind;
  if (Math.abs(gust) > 0.55) {
    for (let i = 0; i < 5; i++) {
      const x = (run.tick * 7 + i * 241) % 1500 - 100;
      const y = 350 + i * 41;
      path([[x, y], [x + 42, y - 4], [x + 81, y + 2], [x + 112, y]], null, '#d0dbc35c', 1.5, false);
    }
  }
}

function hud(run, ui) {
  box(24, 23, 1232, 88, '#142f38', null, 13);
  box(24, 18, 1232, 88, PAPER, INK, 13, 3);
  for (const x of [222, 412, 557, 706, 1003]) line(x, 35, x, 90, '#b5ab8e', 1.5);
  label('SCORE', 44, 42);
  text(Math.floor(run.score).toLocaleString('en-US').padStart(6, '0'), 44, 84, 34, INK);
  label('DISTANCE', 244, 42);
  text(`${Math.floor(run.distance).toLocaleString('en-US')}`, 244, 84, 34, INK);
  text('m', 389, 82, 19, '#667368', 'right');
  label('FREE-RANGE LIVES', 432, 42);
  for (let i = 0; i < 3; i++) heart(448 + i * 36, 76, run.lives > i, 0.82);
  label('CORN STASH', 578, 42);
  corn(592, 74, 0.78, 0.1); text(run.corn, 616, 84, 32, INK);
  label(`ZONE ${run.zoneIndex + 1} / 5 · LAP ${run.lap + 1}`, 726, 42);
  text(ZONES[run.zoneIndex].name.toUpperCase(), 726, 82, 27, INK);
  if (run.weather.storm) text('STORM', 980, 54, 12, '#456b75', 'right');
  else text(ZONES[run.zoneIndex].light.toUpperCase(), 980, 54, 12, '#8e754c', 'right');
  button('pause', 'Ⅱ  PAUSE', 1018, 35, 98, 48, false, true);
  button('mute', ui.muted ? 'M · MUTED' : 'M · SOUND', 1128, 35, 111, 48, false, true);
  text('TURKEY RUN', 38, 175, 57, PAPER, 'left', 900, true);
  text('THE GREAT THANKSGIVING ESCAPE', 42, 199, 14, '#ffe2ae', 'left', 800, true);
  let pillX = 36;
  const pill = (value, color = PAPER) => {
    g.font = `700 13px ${FONTS}`;
    const width = g.measureText(value).width + 25;
    box(pillX, 218, width, 29, '#203a3ee8', color, 7, 1.5);
    text(value, pillX + 12, 238, 13, color); pillX += width + 9;
  };
  if (run.turkey.shield) pill('◇ SHIELD ×1', '#c1ead4');
  if (run.gravy > 0) pill(`GRAVY ${run.gravy.toFixed(1)}s`, '#ffda8b');
  if (run.slideBurst > 0) pill(`SLIDE ${run.slideBurst.toFixed(1)}s`, '#ffda8b');
  else if (run.effects.slideBurst) pill(run.slideCooldown > 0 ? `SLIDE RECHARGE ${run.slideCooldown.toFixed(1)}s` : 'GRAVY SLIDE READY', '#e2d6af');
  if (run.fenceBreaks) pill('BEAK ×1');
  if (run.revives) pill('LUCK ×1');
  if (run.slow > 0) pill(`STUMBLE ${run.slow.toFixed(1)}s`, '#ffab8c');
  if (run.boss.cornered > 0) pill(`CORNERED ${run.boss.cornered.toFixed(1)}s`, '#ffab8c');
  box(24, 620, 411, 77, '#1c353de8', '#e1cca0', 11, 2);
  text(run.boss.name.toUpperCase(), 44, 644, 16, '#f4d3a1');
  const pressure = clamp(100 - run.gap, 0, 100);
  text(`CHASE PRESSURE ${Math.round(pressure)}%`, 416, 644, 11, '#e6d7b6', 'right');
  box(44, 657, 371, 13, '#122a32', '#81958b', 5, 1.5);
  if (pressure > 0.5) box(46, 659, Math.max(5, 367 * pressure / 100), 9, pressure > 60 ? '#df795e' : '#e7bb61', null, 3);
  label(run.boss.cornered > 0 ? 'TWO STUMBLES. THEY’RE CUTTING YOU OFF!' : 'CLEAN RUNNING OPENS THE GAP.', 44, 686, '#afc7b8');
  text('SPACE / ↑ JUMP     ↓ SLIDE     ← → STEER     P PAUSE', 460, 686, 13, '#ead2a9', 'left', 700, true);
  box(952, 620, 304, 77, '#1c353de8', '#e1cca0', 11, 2);
  label('ESCAPE ROUTE', 970, 643, '#e6d7b6');
  text(`${Math.floor(run.distance % ZONE_METRES)} / 400 m`, 1236, 643, 12, '#e6d7b6', 'right');
  line(984, 669, 1223, 669, '#799489', 3);
  for (let i = 0; i < 5; i++) {
    const x = 984 + i * 59.5;
    oval(x, 669, i === run.zoneIndex ? 11 : 7, i === run.zoneIndex ? 11 : 7, i <= run.zoneIndex ? GOLD : '#3a5557', '#d4c69d', 2);
    text(i + 1, x, 673, 10, i <= run.zoneIndex ? INK : '#a8b8a5', 'center');
  }
  if (run.banner.time > 0) {
    g.save(); g.globalAlpha = clamp(run.banner.time, 0, 1);
    text(run.banner.title, 1234, 161, 24, PAPER, 'right', 900, true);
    text(run.banner.subtitle, 1234, 184, 13, '#ffdc9e', 'right', 700, true);
    g.restore();
  }
  if (run.boss.phase === 'windup') {
    const width = run.boss.id === 'brutus' ? 426 : 384;
    box(640 - width / 2, 277, width, 40, '#f2cc87', INK, 7, 3);
    text(BOSSES[run.boss.id].warning, 640, 304, 17, INK, 'center');
  }
}

function playScene(run, ui, showHud = true) {
  g.save();
  if (run.shake) g.translate(Math.sin(run.tick * 2.7) * run.shake, Math.cos(run.tick * 3.1) * run.shake * 0.45);
  background(run);
  if (run.previousBoss) {
    shadow(run.previousBoss.x, GROUND, 48);
    const draw = { jed: farmer, brutus: dog, chef }[run.previousBoss.id];
    draw(run.previousBoss.x, GROUND, run.time - 0.15, false, 0.92);
  }
  const boss = run.boss;
  if (!(boss.id === 'brutus' && boss.phase === 'attack' && run.obstacles.some(item => item.attack === 'dog'))) {
    shadow(boss.x, GROUND, boss.id === 'brutus' ? 61 : 40);
    ({ jed: farmer, brutus: dog, chef })[boss.id](boss.x, GROUND, run.time, boss.phase !== 'chase');
  }
  for (const item of run.obstacles) obstacle(item, run);
  for (const item of run.collectibles) {
    const bob = Math.sin(run.time * 3 + item.phase);
    if (item.type !== 'corn') {
      const halo = g.createRadialGradient(item.x, item.y, 3, item.x, item.y, 44);
      halo.addColorStop(0, item.type === 'gravy' ? '#ffcf7e70' : '#c7f1d860'); halo.addColorStop(1, '#ffffff00');
      oval(item.x, item.y, 44, 44, halo, null);
    }
    if (item.type === 'corn') corn(item.x, item.y, 0.75, bob * 0.14);
    else if (item.type === 'feather') feather(item.x, item.y, 0.85);
    else gravyBoat(item.x, item.y, 0.9);
  }
  const p = run.turkey;
  shadow(p.x, GROUND, 58 - Math.min(23, (GROUND - p.y) * 0.11), 0.22 - Math.min(0.13, (GROUND - p.y) * 0.0006));
  drawTurkey(p.x, p.y, run.time, { ...p, air: p.y < GROUND - 5, boost: run.gravy > 0 || run.slideBurst > 0, worried: run.gap < 35 });
  for (const particle of run.particles) {
    g.save(); g.globalAlpha = 1 - particle.age / particle.life;
    g.translate(particle.x, particle.y); g.rotate(particle.age * 7);
    oval(0, 0, 3, 6, particle.color, null); g.restore();
  }
  storm(run);
  run.texts.forEach((message, index) => {
    g.save(); g.globalAlpha = clamp((message.life - message.age) * 2, 0, 1);
    text(message.text, clamp(message.x, 240, 1000), message.y - index * 26, 17, message.color, 'center', 900, true);
    g.restore();
  });
  if (run.flash > 0) { g.fillStyle = `rgba(255,183,126,${run.flash * 2})`; g.fillRect(0, 113, WIDTH, HEIGHT - 113); }
  g.restore();
  if (showHud) hud(run, ui);
}

function title(run, ui) {
  background(run);
  farmer(783, GROUND, 1, false, 0.93);
  shadow(1010, GROUND, 145, 0.2);
  drawTurkey(1010, GROUND - 5, 0.4, { worried: true }, 2.15);
  g.save(); g.translate(1040, 288); g.rotate(0.08);
  box(-148, -28, 296, 54, PAPER, INK, 8, 3);
  text('“NOT TODAY, GRAVY.”', 0, 7, 22, INK, 'center', 900); g.restore();
  box(61, 110, 653, 501, '#293d3c', null, 18);
  box(54, 102, 653, 501, PAPER, INK, 18, 4);
  label('A FREE-RANGE FUGITIVE. A VERY PERSONAL DINNER.', 92, 140, '#8b6141');
  text('TURKEY', 86, 272, 119, '#c65e3f', 'left', 1000);
  text('RUN', 82, 410, 155, '#d7893a', 'left', 1000);
  line(99, 290, 641, 290, '#c1ad7c', 2);
  text('the great Thanksgiving escape', 97, 449, 27, INK, 'left', 700);
  text('Be the guest that gets away.', 99, 477, 17, '#6f725d', 'left', 500);
  button('start', 'LET’S GOBBLE  →', 96, 506, 314, 59, true);
  button('shop', 'ESCAPE KIT  /  SHOP', 428, 506, 236, 59, false, true);
  text('PRESS SPACE / CLICK', 382, 590, 12, '#7c745b', 'center');
  box(751, 128, 454, 64, '#243d40de', '#f0d49b', 9, 2);
  label('PERSONAL BEST', 774, 150, '#e6d4af');
  text(`${ui.profile.best.toLocaleString('en-US')} m`, 1181, 174, 32, PAPER, 'right');
  text(`CORN BANK  ${ui.profile.bank}    •    KIT ${ui.profile.owned.length} / 12`, 774, 176, 14, '#d2c59f');
  box(57, 632, 1166, 53, '#213a3de8', '#e8c99a', 9, 2);
  text('5 ZONES   /   3 CHASE BOSSES   /   12 UPGRADES   /   45 OBSTACLES   /   ENDLESS CORN', 640, 665, 19, PAPER, 'center', 800);
  button('mute', ui.muted ? 'M · MUTED' : 'M · SOUND', 1070, 29, 135, 44, false, true);
  text('SPACE / ↑ JUMP     ↓ SLIDE     ← → STEER     P PAUSE', 942, 605, 12, PAPER, 'center', 700, true);
}

function dim() { g.fillStyle = '#102a34bb'; g.fillRect(0, 0, WIDTH, HEIGHT); }
function pause(run, ui) {
  buttons.length = 0;
  dim();
  box(308, 174, 664, 391, '#172e35', null, 16);
  box(300, 166, 664, 391, PAPER, INK, 16, 4);
  label('THE CHASE CAN WAIT. THE POTATOES CAN’T.', 632, 200, '#946d47', 'center');
  text('TAKE A BREATHER.', 632, 262, 46, INK, 'center', 900);
  text(`${Math.floor(run.distance)} m   ·   ${Math.floor(run.score).toLocaleString('en-US')} points   ·   ${run.corn} corn this run`, 632, 303, 18, '#65715f', 'center');
  text('Space / ↑ / W: jump     ↓ / S: slide     ← →: steer', 632, 348, 17, INK, 'center');
  text('Double jump needs the upgrade. Feathers block a hit.', 632, 376, 15, '#6b7865', 'center', 500);
  button('resume', 'BACK TO THE CHASE', 345, 412, 278, 55, true);
  button('shop', `VIEW ESCAPE KIT  ${ui.profile.owned.length}/12`, 641, 412, 278, 55, false, true);
  button('mute', ui.muted ? 'SOUND: OFF  /  M' : 'SOUND: ON  /  M', 461, 491, 340, 37, false, true);
}
function end(run, ui) {
  buttons.length = 0;
  dim();
  const escaped = run.mode === 'escaped';
  box(199, 144, 896, 482, '#172e35', null, 18);
  box(191, 136, 896, 482, PAPER, INK, 18, 4);
  label(escaped ? 'THIS BIRD HAS LEFT THE BUILDING.' : 'WELL. THIS IS AN AWKWARD DINNER PARTY.', 639, 173, '#91663e', 'center');
  text(escaped ? 'ESCAPED!' : 'CAUGHT!', 639, 265, 88, escaped ? '#448577' : '#c76246', 'center', 1000);
  text(escaped ? `Chef Marcel’s table for one is cancelled. Lap ${run.lap + 1} cleared.` : `${run.result?.who || run.boss.name} caught you. Hold the cranberry sauce.`, 639, 303, 20, INK, 'center');
  for (let i = 0; i < 3; i++) {
    const x = 242 + i * 269;
    box(x, 335, 252, 94, '#f1e1b9', '#b7ac86', 9, 1.5);
    const values = [`${Math.floor(run.distance).toLocaleString('en-US')} m`, Math.floor(run.score).toLocaleString('en-US'), `${run.corn}`];
    label(['DISTANCE', 'SCORE', 'CORN COLLECTED'][i], x + 126, 360, '#77765d', 'center');
    text(values[i], x + 126, 405, 35, INK, 'center');
  }
  text(`${run.stats.dodged} obstacles dodged   ·   ${run.stats.clears} zones cleared   ·   ${run.stats.hits} hits   ·   ${run.stats.feathers} feathers`, 639, 465, 17, '#627361', 'center');
  text(`CORN BANK: ${ui.profile.bank}   /   BEST: ${Math.max(ui.profile.best, Math.floor(run.distance))} m`, 639, 492, 15, '#897146', 'center');
  button('restart', 'R · RUN AGAIN', 242, 527, escaped ? 246 : 390, 57, true);
  button('shop', 'UPGRADE YOUR ESCAPE', escaped ? 506 : 651, 527, escaped ? 246 : 385, 57, false, true);
  if (escaped) button('continue', `LAP ${run.lap + 2} · FASTER →`, 770, 527, 266, 57, false, true);
  text('CLICK / R TO RESTART', 639, 606, 11, '#78745c', 'center');
  if (escaped) {
    feather(238, 231, 1.3); feather(1044, 227, 1.3);
    for (let i = 0; i < 28; i++) {
      const x = 210 + noise(i * 7, run.seed) * 852;
      const y = 155 + noise(i * 19, run.seed) * 140;
      g.save(); g.translate(x, y); g.rotate(i * 1.7); box(-3, -3, 6, 9, i % 2 ? GOLD : TEAL, null, 1); g.restore();
    }
  }
}
function shop(run, ui) {
  buttons.length = 0;
  dim();
  const locked = run.mode === 'pause' || run.mode === 'playing';
  box(58, 89, 1172, 563, '#172e35', null, 15);
  box(50, 81, 1172, 563, PAPER, INK, 15, 4);
  text('THE ESCAPE KIT', 79, 125, 32, INK, 'left', 900);
  text(`CORN BANK   ${ui.profile.bank}`, 1192, 124, 25, '#947139', 'right');
  text(locked ? 'Your upgrades are active. Buy new gear between runs.' : 'Permanent upgrades. One purchase, a lifetime of inconvenient dinner invitations.', 80, 151, 16, '#6d765f', 'left', 500);
  for (let i = 0; i < UPGRADES.length; i++) {
    const upgrade = UPGRADES[i];
    const x = 78 + i % 4 * 281;
    const y = 171 + Math.floor(i / 4) * 130;
    const owned = ui.profile.owned.includes(upgrade.id);
    const affordable = ui.profile.bank >= upgrade.cost;
    const hover = pointer && pointer.x >= x && pointer.x <= x + 266 && pointer.y >= y && pointer.y <= y + 117;
    box(x, y, 266, 117, owned ? '#d9e4c3' : hover ? '#f9dda2' : '#f0e1bd', owned ? '#688e76' : '#b3a582', 9, owned ? 2.5 : 1.5);
    box(x + 11, y + 12, 39, 39, owned ? '#8eb79b' : '#dab578', INK, 8, 2);
    text(upgrade.icon, x + 30, y + 39, 22, INK, 'center');
    text(upgrade.name, x + 61, y + 36, 18, INK);
    wrapped(upgrade.description, x + 13, y + 66, 238, 13, '#526755', 17);
    label(owned ? '✓ PACKED & PERMANENT' : locked ? `VIEW ONLY · ${upgrade.cost} CORN` : `${upgrade.cost} CORN   ·   ${affordable ? 'CLICK TO PACK +' : 'KEEP COLLECTING'}`, x + 13, y + 104, owned ? '#3f7d65' : affordable ? '#855e28' : '#897c5d');
    buttons.push({ action: `buy:${upgrade.id}`, x, y, w: 266, h: 117 });
  }
  text(ui.message || (locked ? 'Keep your current run. Your next escape can have a new kit.' : 'Corn is banked on CAUGHT or ESCAPED. Storage blocked? Your kit still lasts this session.'), 80, 579, 14, '#7c6444', 'left', 700);
  button('back', '← BACK', 80, 597, 204, 33, false, true);
  text(`${ui.profile.owned.length} / ${COUNTS.upgrades} UPGRADES PACKED`, 1192, 621, 13, '#64735d', 'right');
}

export function render(context, run, ui) {
  g = context; buttons = []; pointer = ui.pointer;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.save();
  if (run.mode === 'title') title(run, ui);
  else {
    playScene(run, ui);
    if (run.mode === 'pause') pause(run, ui);
    if (run.mode === 'caught' || run.mode === 'escaped') end(run, ui);
  }
  if (ui.shop) shop(run, ui);
  g.restore();
  return buttons;
}
