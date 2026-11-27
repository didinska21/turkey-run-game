export function createAudio(muted = false) {
  let context;
  let output;
  let storm;
  let noiseBuffer;
  let rainLevel = 0;
  const api = {
    muted,
    unlock() {
      if (!context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return;
        try {
          context = new Audio();
          output = context.createGain();
          output.gain.value = api.muted ? 0 : 0.45;
          output.connect(context.destination);
          noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          let n = 54321;
          for (let i = 0; i < data.length; i++) {
            n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
            data[i] = (n / 2147483648 - 1) * 0.7;
          }
        } catch { context = undefined; return; }
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
    },
    toggle() {
      api.muted = !api.muted;
      if (output) output.gain.setTargetAtTime(api.muted ? 0 : 0.45, context.currentTime, 0.03);
      return api.muted;
    },
    play(name) {
      if (!context || api.muted) return;
      const now = context.currentTime;
      if (name === 'gobble') {
        for (let i = 0; i < 3; i++) tone(340 - i * 38, 105 + i * 30, now + i * 0.045, 0.085, 'triangle', 0.16);
      } else if (name === 'pop') {
        tone(680, 1260, now, 0.085, 'sine', 0.17);
      } else if (name === 'thud') {
        tone(140, 32, now, 0.2, 'triangle', 0.6); hiss(now, 0.13, 0.28, 450);
      } else if (name === 'sting') {
        [164, 155, 103].forEach((f, i) => tone(f, f * 0.8, now + i * 0.08, 0.22, 'sawtooth', 0.1));
      } else if (name === 'fanfare') {
        [392, 494, 587, 784, 587, 784].forEach((f, i) => tone(f, f, now + i * 0.12, 0.22, 'triangle', 0.2));
      } else if (name === 'shield') {
        tone(920, 260, now, 0.35, 'sine', 0.22);
      } else if (name === 'thunder') {
        hiss(now, 1.1, 0.75, 160); tone(65, 25, now, 0.8, 'sine', 0.4);
      }
    },
    weather(active, wind = 0) {
      if (!context) return;
      if (active && !storm) {
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        source.buffer = noiseBuffer; source.loop = true;
        filter.type = 'lowpass'; filter.frequency.value = 1300;
        gain.gain.value = 0;
        source.connect(filter).connect(gain).connect(output); source.start();
        storm = { source, filter, gain };
      }
      rainLevel = active ? 0.11 + Math.abs(wind) * 0.05 : 0;
      if (storm) {
        storm.gain.gain.setTargetAtTime(rainLevel, context.currentTime, 0.5);
        storm.filter.frequency.setTargetAtTime(1050 + Math.abs(wind) * 900, context.currentTime, 0.25);
      }
    },
  };
  function tone(start, end, when, duration, type, volume) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(start, when);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), when + duration);
    gain.gain.setValueAtTime(0.001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    oscillator.connect(gain).connect(output);
    oscillator.start(when); oscillator.stop(when + duration + 0.02);
  }
  function hiss(when, duration, volume, frequency) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = 'lowpass'; filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    source.connect(filter).connect(gain).connect(output);
    source.start(when); source.stop(when + duration);
  }
  return api;
}
